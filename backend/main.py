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
        "gemini":     ("GEMINI_API_KEY",    "gemini/gemini-1.5-pro"),
        "perplexity": ("PERPLEXITY_API_KEY","perplexity/sonar-pro"),
        "grok":       ("XAI_API_KEY",       "xai/grok-2-latest"),
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
    market: Optional[str] = "global"  # "global" | "TR" | "US" | "GB" | "DE"


class ModelResponse(BaseModel):
    response: str
    mentions: dict[str, int]


class MultiModelPromptResult(BaseModel):
    prompt: str
    model_responses: dict[str, ModelResponse]


class CompetitorScore(BaseModel):
    overall: float
    per_model: dict[str, float]


class AnalyzeRequest(BaseModel):
    brand: str
    website: Optional[str] = None
    competitors: list[Competitor] = []
    prompts: list[str]


class AnalyzeResponse(BaseModel):
    brand: str
    overall_score: float
    model_scores: dict[str, float]
    competitor_scores: dict[str, CompetitorScore]
    insights: list[str]
    active_models: list[str]
    raw_results: list[MultiModelPromptResult]


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


async def call_model(model_id: str, prompt: str) -> str:
    """Call a single model via LiteLLM, return response text."""
    try:
        response = await litellm.acompletion(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            timeout=30,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        return f"[error: {str(e)[:100]}]"


def score_from_results(
    entity: str,
    comp_names: list[str],
    results_per_model: dict[str, list[dict]],
    total_prompts: int,
) -> dict[str, float]:
    """Compute per-model score for an entity. Returns {model: score}."""
    scores = {}
    max_possible = total_prompts * 15
    for model_label, results in results_per_model.items():
        raw = 0
        for r in results:
            mentions = r["mentions"].get(entity, 0)
            if mentions > 0:
                raw += 10
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
        system="You are an expert in brand visibility and AI search behavior.",
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

    all_entities = [req.brand] + [c.name for c in req.competitors]
    comp_names = [c.name for c in req.competitors]

    # For each prompt, call all active models in parallel
    raw_results: list[MultiModelPromptResult] = []
    # results_per_model[model_label] = list of {mentions: {entity: count}}
    results_per_model: dict[str, list[dict]] = {m: [] for m in active_models}

    for prompt in req.prompts:
        # Fire all models concurrently for this prompt
        tasks = {
            label: call_model(model_id, prompt)
            for label, model_id in active_models.items()
        }
        responses = await asyncio.gather(*tasks.values())
        model_responses: dict[str, ModelResponse] = {}

        for label, response_text in zip(tasks.keys(), responses):
            mentions = {e: count_mentions(response_text, e) for e in all_entities}
            model_responses[label] = ModelResponse(response=response_text, mentions=mentions)
            results_per_model[label].append({"mentions": mentions})

        raw_results.append(MultiModelPromptResult(prompt=prompt, model_responses=model_responses))

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

    return AnalyzeResponse(
        brand=req.brand,
        overall_score=overall_score,
        model_scores=brand_model_scores,
        competitor_scores=competitor_scores,
        insights=insights,
        active_models=list(active_models.keys()),
        raw_results=raw_results,
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
    priority: str  # "high" | "medium" | "low"
    category: str  # "content" | "platform" | "seo" | "pr"
    description: str
    actions: list[str]


class RecommendationsResponse(BaseModel):
    recommendations: list[Recommendation]


@app.post("/recommendations", response_model=RecommendationsResponse)
async def recommendations(req: RecommendationsRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    # Build a compact summary of results for the prompt
    zero_prompts = []
    weak_prompts = []
    for r in req.raw_results:
        total_mentions = sum(
            r.model_responses[m].mentions.get(req.brand, 0)
            for m in req.active_models
            if m in r.model_responses
        )
        if total_mentions == 0:
            zero_prompts.append(r.prompt)
        elif total_mentions <= len(req.active_models):
            weak_prompts.append(r.prompt)

    worst_model = min(req.model_scores, key=lambda m: req.model_scores[m]) if req.model_scores else None
    best_model = max(req.model_scores, key=lambda m: req.model_scores[m]) if req.model_scores else None

    competitor_summary = ", ".join(
        f"{name} (overall: {s.overall})" for name, s in req.competitor_scores.items()
    ) if req.competitor_scores else "no competitors analyzed"

    analysis_summary = f"""
Brand: {req.brand}
Overall AI Visibility Score: {req.overall_score}/100
Model scores: {json.dumps(req.model_scores)}
Competitors: {competitor_summary}
Best performing model: {best_model} ({req.model_scores.get(best_model, 0) if best_model else 0})
Worst performing model: {worst_model} ({req.model_scores.get(worst_model, 0) if worst_model else 0})
Prompts with ZERO mentions ({len(zero_prompts)}): {zero_prompts[:5]}
Prompts with WEAK mentions ({len(weak_prompts)}): {weak_prompts[:5]}
"""

    language_map = {
        "TR": "Turkish", "DE": "German", "FR": "French", "ES": "Spanish",
        "IT": "Italian", "NL": "Dutch", "PL": "Polish", "SE": "Swedish",
        "NO": "Norwegian", "DK": "Danish", "FI": "Finnish", "PT": "Portuguese",
        "AT": "German", "CH": "German", "BE": "French", "RU": "Russian",
        "UA": "Ukrainian", "JP": "Japanese", "KR": "Korean", "CN": "Chinese",
        "MX": "Spanish", "BR": "Portuguese", "AR": "Spanish",
        "SA": "Arabic", "AE": "Arabic",
    }
    response_language = language_map.get(req.market or "global", "English")
    language_instruction = f"IMPORTANT: Write ALL text in your response (titles, descriptions, actions) in {response_language}. Do not use any other language."

    user_msg = f"""You are an AI brand visibility expert. Based on this analysis, provide actionable recommendations to improve the brand's visibility in AI-generated responses.

{analysis_summary}

{language_instruction}

Return ONLY a valid JSON array of recommendation objects. Each object must have exactly these fields:
- "title": short title (max 8 words)
- "priority": one of "high", "medium", "low"
- "category": one of "content", "platform", "seo", "pr"
- "description": 1-2 sentence explanation of why this matters
- "actions": array of 3-5 specific, concrete action items

Focus on:
1. Why the brand is missing from specific prompts and what content to create
2. Which platforms/sources AI models pull from (Reddit, Wikipedia, review sites, news)
3. Specific content formats that boost AI visibility (structured data, FAQs, comparison pages)
4. PR and backlink strategies that influence AI training data

Return 5-7 recommendations. No markdown, no explanation outside JSON.
[{{"title": "...", "priority": "high", "category": "content", "description": "...", "actions": ["..."]}}]"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2000,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"^```[a-z]*\n?", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    # Extract the JSON array — grab from first [ to last ]
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise HTTPException(status_code=500, detail="No JSON array found in recommendations response")

    json_str = raw[start:end + 1]

    try:
        recs_raw = json.loads(json_str)
        recs = [Recommendation(**r) for r in recs_raw]
    except json.JSONDecodeError as e:
        # Try to salvage: truncate at last complete object
        last_close = json_str.rfind("},")
        if last_close != -1:
            salvaged = json_str[:last_close + 1] + "]"
            try:
                recs_raw = json.loads(salvaged)
                recs = [Recommendation(**r) for r in recs_raw]
            except Exception:
                raise HTTPException(status_code=500, detail=f"Failed to parse recommendations: {e}")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to parse recommendations: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recommendations: {e}")

    return RecommendationsResponse(recommendations=recs)


@app.get("/health")
def health():
    return {"status": "ok", "active_models": list(get_active_models().keys())}
