import os
import re
import json
import asyncio
import time
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import litellm
import httpx
from dotenv import load_dotenv
from pytrends.request import TrendReq

load_dotenv()

# Suppress litellm verbose logging
litellm.set_verbose = False

app = FastAPI(title="AI Brand Visibility Tracker v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Model registry ----------
# Each model is included only if its API key exists in .env

def get_active_models() -> dict[str, str]:
    """Returns {model_label: litellm_model_id} for available API keys."""
    candidates = {
        "claude":     ("ANTHROPIC_API_KEY", "anthropic/claude-opus-4-8"),
        "gpt4o":      ("OPENAI_API_KEY",    "openai/gpt-4o"),
        "gemini":     ("GEMINI_API_KEY",    "gemini/gemini-2.5-flash"),
        "perplexity": ("PERPLEXITY_API_KEY","perplexity/sonar"),
        "grok":       ("XAI_API_KEY",       "xai/grok-3"),
        "deepseek":   ("DEEPSEEK_API_KEY",  "deepseek/deepseek-chat"),
    }
    active = {}
    for label, (env_var, model_id) in candidates.items():
        if os.getenv(env_var):
            active[label] = model_id
    return active


# ---------- Pydantic models ----------

class Competitor(BaseModel):
    name: str
    website: Optional[str] = None


class GeneratePromptsRequest(BaseModel):
    brand: str
    website: Optional[str] = None
    market: Optional[str] = "global"
    existing_prompts: Optional[list[str]] = None


class SuggestCompetitorsRequest(BaseModel):
    brand: str
    market: Optional[str] = "global"


class ModelResponse(BaseModel):
    response: str
    mentions: dict[str, int]
    sentiment: str = "neutral"  # "positive" | "neutral" | "negative"


class MultiModelPromptResult(BaseModel):
    prompt: str
    model_responses: dict[str, ModelResponse]


class CompetitorScore(BaseModel):
    overall: float
    per_model: dict[str, float]


FREE_MODEL_ORDER = ["claude", "gpt4o", "perplexity", "grok", "deepseek"]  # gemini excluded from free tier
FREE_MODEL_LIMIT = 2

class AnalyzeRequest(BaseModel):
    brand: str
    website: Optional[str] = None
    competitors: list[Competitor] = []
    prompts: list[str]
    tier: Optional[str] = "free"  # "free" | "pro" | "agency"
    user_id: Optional[str] = None  # Supabase user UUID for token tracking


class AnalyzeResponse(BaseModel):
    brand: str
    overall_score: float
    model_scores: dict[str, float]
    competitor_scores: dict[str, CompetitorScore]
    insights: list[str]
    active_models: list[str]
    raw_results: list[MultiModelPromptResult]
    sentiment_summary: dict[str, int] = {}  # {positive: N, neutral: N, negative: N}


# ---------- Helpers ----------

async def fetch_website_text(url: str) -> str:
    if not url:
        return ""
    if not url.startswith("http"):
        url = "https://" + url
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            text = re.sub(r"<[^>]+>", " ", resp.text)
            return re.sub(r"\s+", " ", text).strip()[:3000]
    except Exception:
        return ""


def count_mentions(text: str, name: str) -> int:
    return len(re.findall(re.escape(name.lower()), text.lower()))


POSITIVE_WORDS = {
    "best", "excellent", "great", "outstanding", "top", "leading", "recommend",
    "recommended", "popular", "trusted", "reliable", "high-quality", "quality",
    "innovative", "strong", "powerful", "effective", "superior", "preferred",
    "well-known", "reputable", "award", "winner", "favorite", "favourite",
    "impressive", "solid", "robust", "exceptional", "perfect", "ideal",
}

NEGATIVE_WORDS = {
    "avoid", "bad", "poor", "worst", "terrible", "overpriced", "expensive",
    "unreliable", "issues", "problems", "complaints", "disappointing",
    "criticized", "controversial", "lawsuit", "scandal", "failure",
    "mediocre", "inferior", "outdated", "slow", "difficult", "lacks",
}


def detect_sentiment(text: str, brand: str) -> str:
    """Detect sentiment around brand mentions in text."""
    if not text or brand.lower() not in text.lower():
        return "neutral"

    text_lower = text.lower()
    brand_lower = brand.lower()

    # Find contexts around each brand mention (±150 chars)
    contexts = []
    idx = 0
    while True:
        pos = text_lower.find(brand_lower, idx)
        if pos == -1:
            break
        start = max(0, pos - 150)
        end = min(len(text_lower), pos + len(brand_lower) + 150)
        contexts.append(text_lower[start:end])
        idx = pos + 1

    if not contexts:
        return "neutral"

    combined = " ".join(contexts)
    words = set(re.findall(r"\b\w+\b", combined))

    pos_hits = len(words & POSITIVE_WORDS)
    neg_hits = len(words & NEGATIVE_WORDS)

    if pos_hits > neg_hits:
        return "positive"
    elif neg_hits > pos_hits:
        return "negative"
    return "neutral"


async def call_model(model_id: str, prompt: str) -> tuple[str, int, int]:
    """Call a single model via LiteLLM, return (response_text, prompt_tokens, completion_tokens)."""
    is_gemini = model_id.startswith("gemini/")
    retries = 3 if is_gemini else 1
    for attempt in range(retries):
        try:
            response = await litellm.acompletion(
                model=model_id,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                timeout=45,
            )
            text = response.choices[0].message.content or ""
            usage = response.usage
            return text, getattr(usage, "prompt_tokens", 0), getattr(usage, "completion_tokens", 0)
        except litellm.RateLimitError:
            if attempt < retries - 1:
                await asyncio.sleep(6 * (attempt + 1))  # 6s, 12s backoff
                continue
            return "[error: Gemini rate limit — try again in a moment]", 0, 0
        except Exception as e:
            if is_gemini and attempt < retries - 1:
                await asyncio.sleep(4)
                continue
            return f"[error: {str(e)[:300]}]", 0, 0
    return "[error: max retries exceeded]", 0, 0


# Cost per 1M tokens (input, output) USD
MODEL_COSTS: dict[str, tuple[float, float]] = {
    "anthropic/claude-opus-4-8": (5.0, 25.0),
    "openai/gpt-4o":             (2.5, 10.0),
    "gemini/gemini-2.5-flash":   (0.15, 0.60),
    "perplexity/sonar":          (1.0, 1.0),
    "xai/grok-3":                (3.0, 15.0),
    "deepseek/deepseek-chat":    (0.14, 0.28),
}


async def log_token_usage(user_id: str, model_label: str, model_id: str, prompt_tokens: int, completion_tokens: int):
    """Fire-and-forget: log token usage to Supabase."""
    svc_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    if not svc_key or not supabase_url or not user_id:
        return
    inp_per_m, out_per_m = MODEL_COSTS.get(model_id, (5.0, 15.0))
    cost_usd = (prompt_tokens / 1_000_000 * inp_per_m) + (completion_tokens / 1_000_000 * out_per_m)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{supabase_url}/rest/v1/token_usage",
                headers={
                    "apikey": svc_key,
                    "Authorization": f"Bearer {svc_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "user_id": user_id,
                    "model": model_label,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "cost_usd": round(cost_usd, 6),
                },
            )
    except Exception:
        pass  # never block the main response


def score_from_results(
    entity: str,
    comp_names: list[str],
    results_per_model: dict[str, list[dict]],
    total_prompts: int,
) -> dict[str, float]:
    """Compute per-model score for an entity. Returns {model: score}.

    Scoring per prompt:
      +10 if the entity is mentioned at all
      +5  if entity mentions >= all competitor mentions (only when competitors exist)
    Max possible = total_prompts * (10 + (5 if competitors else 0))
    """
    has_competitors = len(comp_names) > 0
    points_per_prompt = 15 if has_competitors else 10
    max_possible = total_prompts * points_per_prompt

    scores = {}
    for model_label, results in results_per_model.items():
        raw = 0
        for r in results:
            mentions = r["mentions"].get(entity, 0)
            if mentions > 0:
                raw += 10
                if has_competitors:
                    max_comp = max((r["mentions"].get(c, 0) for c in comp_names), default=0)
                    if mentions >= max_comp:
                        raw += 5
        scores[model_label] = round(min(100, (raw / max_possible) * 100) if max_possible > 0 else 0, 1)
    return scores


def generate_insights(
    brand: str,
    overall_score: float,
    model_scores: dict[str, float],
    competitor_scores: dict[str, CompetitorScore],
    raw_results: list[MultiModelPromptResult],
) -> list[str]:
    insights = []
    total = len(raw_results)

    # Coverage
    brand_appearances = sum(
        1 for r in raw_results
        if any(mr.mentions.get(brand, 0) > 0 for mr in r.model_responses.values())
    )
    insights.append(
        f"{brand} appeared in {brand_appearances}/{total} prompts across all models "
        f"({round(brand_appearances/total*100)}% coverage)."
    )

    # Best/worst model
    if model_scores:
        best_m = max(model_scores, key=lambda m: model_scores[m])
        worst_m = min(model_scores, key=lambda m: model_scores[m])
        insights.append(
            f"Highest visibility in {best_m.upper()} ({model_scores[best_m]}), "
            f"lowest in {worst_m.upper()} ({model_scores[worst_m]})."
        )

    # Competitor comparison
    if competitor_scores:
        top_comp = max(competitor_scores, key=lambda c: competitor_scores[c].overall)
        top_score = competitor_scores[top_comp].overall
        if overall_score > top_score:
            insights.append(f"{brand} leads {top_comp} overall ({overall_score} vs {top_score}).")
        elif overall_score < top_score:
            insights.append(f"{top_comp} leads {brand} overall ({top_score} vs {overall_score}).")

    # General assessment
    if overall_score >= 60:
        insights.append(f"Strong overall AI visibility for {brand}.")
    elif overall_score >= 30:
        insights.append(f"Moderate AI visibility. {brand} has room to grow.")
    else:
        insights.append(f"Low AI visibility. {brand} is underrepresented in AI responses.")

    return insights


# ---------- Endpoints ----------

@app.get("/models")
def list_models():
    """Returns which models are active based on available API keys."""
    return {"active_models": list(get_active_models().keys())}


def extract_keywords(prompt: str) -> str:
    """Extract short searchable keywords from a long prompt sentence."""
    # Remove question words and common filler words
    stop = {"en", "iyi", "hangi", "neler", "nedir", "için", "ile", "ve", "bir", "bu",
            "the", "best", "which", "what", "are", "is", "how", "do", "can", "a", "an",
            "to", "of", "in", "on", "at", "for", "with", "by", "from", "that", "this"}
    words = re.sub(r"[?.,!]", "", prompt.lower()).split()
    filtered = [w for w in words if w not in stop and len(w) > 2]
    # Take first 3 meaningful words — pytrends works best with short queries
    return " ".join(filtered[:3]) if filtered else prompt[:30]


async def fetch_search_volume_dataforseo(keywords: list[str], geo: str = "") -> dict[str, int]:
    """Fetch monthly search volume from DataForSEO Keywords Data API."""
    login = os.getenv("DATAFORSEO_LOGIN")
    password = os.getenv("DATAFORSEO_PASSWORD")
    if not login or not password:
        return {}

    # Map geo code to DataForSEO location code
    # Full list: https://api.dataforseo.com/v3/keywords_data/google_ads/locations
    location_map = {
        "TR": 2792, "US": 2840, "GB": 2826, "DE": 2276, "FR": 2250,
        "ES": 2724, "IT": 2380, "NL": 2528, "PL": 2616, "SE": 2752,
        "NO": 2578, "DK": 2208, "FI": 2246, "PT": 2620, "AT": 2040,
        "CH": 2756, "BE": 2056, "RU": 2643, "UA": 2804, "JP": 2392,
        "KR": 2410, "CN": 2156, "IN": 2356, "SG": 2702, "AU": 2036,
        "NZ": 2554, "CA": 2124, "MX": 2484, "BR": 2076, "AR": 2032,
        "SA": 2682, "AE": 2784, "ZA": 2710, "NG": 2566,
    }
    location_code = location_map.get(geo, 2840)  # default US

    try:
        import base64
        credentials = base64.b64encode(f"{login}:{password}".encode()).decode()
        payload = [{
            "keywords": keywords,
            "location_code": location_code,
            "language_code": "en",
            "search_partners": False,
            "date_from": None,
            "date_to": None,
        }]
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
                json=payload,
                headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/json"},
            )
            data = resp.json()
            if data.get("status_code") != 20000:
                print(f"[DataForSEO] API error: {data.get('status_message')}")
                return {}

            results = {}
            for task in data.get("tasks", []):
                for item in (task.get("result") or []):
                    kw = item.get("keyword", "")
                    vol = item.get("search_volume") or 0
                    results[kw] = int(vol)
            return results
    except Exception as e:
        print(f"[DataForSEO] fetch failed: {e}")
        return {}


def fetch_trend_scores_pytrends(prompts: list[str], geo: str = "") -> dict[str, int]:
    """Fallback: Google Trends via pytrends (0-100 relative score)."""
    scores = {p: 0 for p in prompts}
    try:
        kw_map = {p: extract_keywords(p) for p in prompts}
        unique_kws = list(set(kw_map.values()))
        pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25))
        kw_scores: dict[str, int] = {}
        for i in range(0, len(unique_kws), 5):
            batch = unique_kws[i:i+5]
            try:
                pytrends.build_payload(batch, timeframe="today 12-m", geo=geo)
                df = pytrends.interest_over_time()
                if not df.empty:
                    for kw in batch:
                        if kw in df.columns:
                            kw_scores[kw] = int(df[kw].mean())
            except Exception as batch_err:
                print(f"[pytrends] batch failed: {batch_err}")
            if i + 5 < len(unique_kws):
                time.sleep(2)
        for p in prompts:
            scores[p] = kw_scores.get(kw_map[p], 0)
    except Exception as e:
        print(f"[pytrends] fetch failed: {e}")
    return scores


async def fetch_trend_scores(prompts: list[str], geo: str = "") -> dict[str, int]:
    """Primary: DataForSEO search volume. Fallback: pytrends."""
    kw_map = {p: extract_keywords(p) for p in prompts}
    unique_kws = list(set(kw_map.values()))

    # Try DataForSEO first
    if os.getenv("DATAFORSEO_LOGIN"):
        vol_data = await fetch_search_volume_dataforseo(unique_kws, geo)
        if vol_data:
            # Normalize to 0-100 scale for UI consistency
            max_vol = max(vol_data.values()) if vol_data.values() else 1
            scores = {}
            for p in prompts:
                raw = vol_data.get(kw_map[p], 0)
                scores[p] = min(100, int((raw / max(max_vol, 1)) * 100)) if max_vol > 0 else 0
            print(f"[DataForSEO] volumes: {vol_data}")
            return scores

    # Fallback to pytrends
    print("[Trends] DataForSEO not configured, falling back to pytrends")
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fetch_trend_scores_pytrends, prompts, geo)


@app.post("/suggest-competitors")
async def suggest_competitors(req: SuggestCompetitorsRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system="You are a market research expert. The current year is 2026. Return only JSON, no explanation.",
        messages=[{"role": "user", "content": (
            f"List 5 direct competitors of '{req.brand}' in its primary market/industry. "
            f"Market context: {req.market or 'global'}. "
            "Return ONLY a JSON array of brand name strings, e.g. [\"Brand A\", \"Brand B\", ...]"
        )}],
    )

    raw = message.content[0].text.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return {"competitors": []}
    try:
        competitors = json.loads(match.group())
        return {"competitors": [str(c).strip() for c in competitors if str(c).strip()][:5]}
    except Exception:
        return {"competitors": []}


@app.post("/generate-prompts")
async def generate_prompts(req: GeneratePromptsRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    website_context = ""
    if req.website:
        text = await fetch_website_text(req.website)
        if text:
            website_context = f"\n\nWebsite content snippet:\n{text}"

    market = req.market or "global"
    geo = "" if market == "global" else market

    MARKET_LANG = {
        "TR": ("TURKISH", "Turkey"),
        "DE": ("GERMAN", "Germany"),
        "FR": ("FRENCH", "France"),
        "ES": ("SPANISH", "Spain"),
        "IT": ("ITALIAN", "Italy"),
        "NL": ("DUTCH", "Netherlands"),
        "PL": ("POLISH", "Poland"),
        "SE": ("SWEDISH", "Sweden"),
        "NO": ("NORWEGIAN", "Norway"),
        "DK": ("DANISH", "Denmark"),
        "FI": ("FINNISH", "Finland"),
        "PT": ("PORTUGUESE", "Portugal"),
        "AT": ("GERMAN", "Austria"),
        "CH": ("GERMAN", "Switzerland"),
        "BE": ("FRENCH", "Belgium"),
        "RU": ("RUSSIAN", "Russia"),
        "UA": ("UKRAINIAN", "Ukraine"),
        "JP": ("JAPANESE", "Japan"),
        "KR": ("KOREAN", "South Korea"),
        "CN": ("CHINESE", "China"),
        "IN": ("ENGLISH", "India"),
        "SG": ("ENGLISH", "Singapore"),
        "AU": ("ENGLISH", "Australia"),
        "NZ": ("ENGLISH", "New Zealand"),
        "CA": ("ENGLISH", "Canada"),
        "MX": ("SPANISH", "Mexico"),
        "BR": ("PORTUGUESE", "Brazil"),
        "AR": ("SPANISH", "Argentina"),
        "SA": ("ARABIC", "Saudi Arabia"),
        "AE": ("ARABIC", "UAE"),
        "ZA": ("ENGLISH", "South Africa"),
        "NG": ("ENGLISH", "Nigeria"),
    }

    if market in MARKET_LANG:
        lang, country = MARKET_LANG[market]
        lang_instruction = (
            f"Generate the queries IN {lang}. Focus on the {country} market context. "
            f"Use natural {lang.capitalize()} phrasing that local users would actually type."
        )
    else:
        lang_instruction = "Generate the queries IN ENGLISH. Make them globally applicable."

    user_msg = (
        f"Brand name: {req.brand}{website_context}\n\n"
        f"Generate exactly 5 realistic search queries that users would ask an AI assistant "
        f"when researching this brand's category or industry. "
        f"These should be natural language questions, not brand-specific — queries where this brand "
        f"MIGHT appear alongside competitors.\n\n"
        f"{lang_instruction}\n\n"
        "Return ONLY a JSON array of 5 strings, no explanation, no markdown.\n"
        '["query 1", "query 2", ...]'
    )

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1000,
        system="You are an expert in brand visibility and AI search behavior. The current year is 2026.",
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Failed to parse prompt suggestions")

    try:
        prompts = json.loads(match.group())
        prompts = [str(p).strip() for p in prompts if str(p).strip()][:5]
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=500, detail="Failed to parse prompt list")

    trend_scores = await fetch_trend_scores(prompts, geo)

    prompt_data = [
        {"prompt": p, "trend_score": trend_scores.get(p, 0)}
        for p in prompts
    ]

    return {"prompts": prompt_data}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not req.prompts:
        raise HTTPException(status_code=400, detail="No prompts provided")

    active_models = get_active_models()
    if not active_models:
        raise HTTPException(status_code=500, detail="No API keys configured")

    # Limit models for free tier
    if req.tier == "free":
        ordered = [m for m in FREE_MODEL_ORDER if m in active_models]
        limited_keys = ordered[:FREE_MODEL_LIMIT]
        active_models = {k: v for k, v in active_models.items() if k in limited_keys}

    all_entities = [req.brand] + [c.name for c in req.competitors]
    comp_names = [c.name for c in req.competitors]

    # For each prompt, call all active models in parallel
    raw_results: list[MultiModelPromptResult] = []
    # results_per_model[model_label] = list of {mentions: {entity: count}}
    results_per_model: dict[str, list[dict]] = {m: [] for m in active_models}

    # Accumulate token usage per model label
    token_totals: dict[str, tuple[int, int]] = {m: (0, 0) for m in active_models}

    for prompt_idx, prompt in enumerate(req.prompts):
        # Add small delay between prompts to avoid Gemini rate limits
        if prompt_idx > 0 and "gemini" in active_models:
            await asyncio.sleep(2)

        # Fire all models concurrently for this prompt
        tasks = {
            label: call_model(model_id, prompt)
            for label, model_id in active_models.items()
        }
        results = await asyncio.gather(*tasks.values())
        model_responses: dict[str, ModelResponse] = {}

        for label, (response_text, p_tok, c_tok) in zip(tasks.keys(), results):
            mentions = {e: count_mentions(response_text, e) for e in all_entities}
            sentiment = detect_sentiment(response_text, req.brand) if req.tier != "free" else "neutral"
            model_responses[label] = ModelResponse(response=response_text, mentions=mentions, sentiment=sentiment)
            results_per_model[label].append({"mentions": mentions})
            prev_p, prev_c = token_totals[label]
            token_totals[label] = (prev_p + p_tok, prev_c + c_tok)

        raw_results.append(MultiModelPromptResult(prompt=prompt, model_responses=model_responses))

    # Log token usage per model (fire-and-forget)
    if req.user_id:
        for label, model_id in active_models.items():
            p_tok, c_tok = token_totals[label]
            if p_tok + c_tok > 0:
                asyncio.create_task(log_token_usage(req.user_id, label, model_id, p_tok, c_tok))

    # Score brand per model
    brand_model_scores = score_from_results(
        req.brand, comp_names, results_per_model, len(req.prompts)
    )
    overall_score = round(sum(brand_model_scores.values()) / len(brand_model_scores), 1)

    # Score each competitor per model
    competitor_scores: dict[str, CompetitorScore] = {}
    for comp in req.competitors:
        per_model = score_from_results(
            comp.name, [c.name for c in req.competitors if c.name != comp.name],
            results_per_model, len(req.prompts)
        )
        competitor_scores[comp.name] = CompetitorScore(
            overall=round(sum(per_model.values()) / len(per_model), 1),
            per_model=per_model,
        )

    insights = generate_insights(
        req.brand, overall_score, brand_model_scores, competitor_scores, raw_results
    )

    # Compute sentiment summary across all brand-mentioning responses
    sentiment_summary = {"positive": 0, "neutral": 0, "negative": 0}
    for r in raw_results:
        for mr in r.model_responses.values():
            if mr.mentions.get(req.brand, 0) > 0:
                sentiment_summary[mr.sentiment] = sentiment_summary.get(mr.sentiment, 0) + 1

    return AnalyzeResponse(
        brand=req.brand,
        overall_score=overall_score,
        model_scores=brand_model_scores,
        competitor_scores=competitor_scores,
        insights=insights,
        active_models=list(active_models.keys()),
        raw_results=raw_results,
        sentiment_summary=sentiment_summary,
    )


class RecommendationsRequest(BaseModel):
    brand: str
    overall_score: float
    model_scores: dict[str, float]
    competitor_scores: dict[str, CompetitorScore]
    active_models: list[str]
    raw_results: list[MultiModelPromptResult]
    market: Optional[str] = "global"


class Recommendation(BaseModel):
    title: str
    priority: str
    category: str
    description: str
    actions: list[str]


class ModelPlaybook(BaseModel):
    model: str
    score: float
    status: str          # "critical" | "weak" | "good" | "strong"
    headline: str        # e.g. "Not visible on Claude"
    why: str             # 1-2 sentences: why this model behaves this way
    actions: list[str]   # 3-4 concrete actions specific to this model


class RecommendationsResponse(BaseModel):
    per_model: list[ModelPlaybook]
    priority_actions: list[Recommendation]


# Model-specific knowledge for the prompt
MODEL_CONTEXT = {
    "claude": "Claude relies on high-quality training data: Wikipedia, structured long-form articles, authoritative reference content, and well-organized FAQ pages. It favors brands with clear factual presence.",
    "gpt4o":  "GPT-4o uses a broad web corpus + Bing search integration. It favors brands covered in news articles, press releases, industry blogs, and sites with high domain authority.",
    "gemini": "Gemini is deeply integrated with Google's ecosystem. It draws from Google Search index, Google My Business, structured data (schema.org), YouTube, and Google News.",
    "perplexity": "Perplexity performs real-time web searches. It heavily weights recent content, Reddit discussions, review sites (G2, Trustpilot, Capterra), and pages with strong backlink profiles.",
    "grok":   "Grok indexes X/Twitter in real time and broader web. It favors brands with active Twitter/X presence, trending mentions, influencer endorsements, and community discussions.",
    "deepseek": "DeepSeek is trained on a global + Chinese-language corpus. It favors brands with technical documentation, GitHub presence, developer community content, and academic/research citations.",
}


@app.post("/recommendations", response_model=RecommendationsResponse)
async def recommendations(req: RecommendationsRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    language_map = {
        "TR": "Turkish", "DE": "German", "FR": "French", "ES": "Spanish",
        "IT": "Italian", "NL": "Dutch", "PL": "Polish", "SE": "Swedish",
        "NO": "Norwegian", "DK": "Danish", "FI": "Finnish", "PT": "Portuguese",
        "AT": "German", "CH": "German", "BE": "French", "RU": "Russian",
        "UA": "Ukrainian", "JP": "Japanese", "KR": "Korean", "CN": "Chinese",
        "MX": "Spanish", "BR": "Portuguese", "AR": "Spanish",
        "SA": "Arabic", "AE": "Arabic",
    }
    lang = language_map.get(req.market or "global", "English")
    lang_note = f"IMPORTANT: Write ALL text in {lang}. Do not use any other language."

    competitor_summary = ", ".join(
        f"{n} ({s.overall:.0f}/100)" for n, s in req.competitor_scores.items()
    ) if req.competitor_scores else "none"

    # Per-model: which prompts had zero vs weak mentions
    model_prompt_gaps: dict[str, list[str]] = {}
    for model in req.active_models:
        gaps = []
        for r in req.raw_results:
            if model in r.model_responses:
                mentions = r.model_responses[model].mentions.get(req.brand, 0)
                if mentions == 0:
                    gaps.append(r.prompt)
        model_prompt_gaps[model] = gaps[:4]

    model_detail = ""
    for m in req.active_models:
        score = req.model_scores.get(m, 0)
        gaps = model_prompt_gaps.get(m, [])
        ctx = MODEL_CONTEXT.get(m, "")
        model_detail += f"\n- {m.upper()}: score={score:.0f}/100, zero-mention prompts={gaps}, context: {ctx}"

    user_msg = f"""You are an AI brand visibility expert. Generate a per-model strategy playbook for the brand "{req.brand}".

BRAND DATA:
- Overall score: {req.overall_score:.0f}/100
- Market: {req.market}
- Competitors: {competitor_summary}
- Active models and their data:{model_detail}

{lang_note}

Return ONLY valid JSON with this exact structure:
{{
  "per_model": [
    {{
      "model": "<model_name — one of: {', '.join(req.active_models)}>",
      "score": <number>,
      "status": "<critical|weak|good|strong>",
      "headline": "<8 words max — e.g. 'Not mentioned in any Claude response'>",
      "why": "<1-2 sentences: why this specific AI model behaves this way for this brand, referencing the model's data sources>",
      "actions": ["<3-4 concrete, specific actions tailored to HOW THIS MODEL works — not generic advice>"]
    }}
  ],
  "priority_actions": [
    {{
      "title": "<8 words max>",
      "priority": "<high|medium|low>",
      "category": "<content|platform|seo|pr>",
      "description": "<1-2 sentences — cross-model impact>",
      "actions": ["<3-5 concrete steps>"]
    }}
  ]
}}

Rules:
- status: critical=0-20, weak=21-50, good=51-75, strong=76-100
- per_model: include ALL {len(req.active_models)} active models
- priority_actions: 5 items covering the highest-impact cross-model improvements
- actions in per_model must be specific to that model's ecosystem (e.g. for Gemini: Google My Business, schema.org; for Grok: X/Twitter strategy)
- No markdown, no text outside JSON"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=5000,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise HTTPException(status_code=500, detail="No JSON object found in response")

    try:
        data = json.loads(raw[start:end + 1])
        per_model = [ModelPlaybook(**m) for m in data.get("per_model", [])]
        priority_actions = [Recommendation(**r) for r in data.get("priority_actions", [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recommendations: {e}")

    return RecommendationsResponse(per_model=per_model, priority_actions=priority_actions)


@app.get("/health")
def health():
    return {"status": "ok", "active_models": list(get_active_models().keys())}
