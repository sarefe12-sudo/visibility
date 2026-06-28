"""
LinkedIn Outreach Enrichment Script
=====================================
1. Apollo CSV'sini okur (first_name, last_name, company, title, linkedin_url, email)
2. Her şirket için /analyze-lite çağırır → AI visibility skoru alır
3. Claude ile kişisel LinkedIn mesajı üretir
4. Lemlist'e yüklenecek enriched CSV yazar

Kullanım:
    pip install anthropic httpx pandas python-dotenv
    python enrich_leads.py --input apollo_export.csv --output lemlist_ready.csv
"""

import asyncio
import argparse
import json
import csv
import time
import os
from pathlib import Path

import httpx
import anthropic
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "https://zealous-perception-production-2d31.up.railway.app")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DELAY_BETWEEN_LEADS = 3  # seconds — don't hammer the backend


INDUSTRY_MAP = {
    "software": "software and SaaS",
    "saas": "software and SaaS",
    "internet": "software and SaaS",
    "e-commerce": "e-commerce and retail",
    "retail": "e-commerce and retail",
    "marketing": "marketing and advertising",
    "advertising": "marketing and advertising",
    "finance": "financial services and fintech",
    "fintech": "financial services and fintech",
    "healthcare": "healthcare and medtech",
    "education": "education technology",
    "media": "media and entertainment",
    "travel": "travel and hospitality",
    "real estate": "real estate and proptech",
}

def map_industry(raw: str) -> str:
    if not raw:
        return "software and SaaS"
    lower = raw.lower()
    for key, mapped in INDUSTRY_MAP.items():
        if key in lower:
            return mapped
    return raw.lower()


async def analyze_lite(brand: str, industry: str) -> dict:
    """Call /analyze-lite on our backend."""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{BACKEND_URL}/analyze-lite",
                json={"brand": brand, "industry": industry},
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        print(f"  [warn] analyze-lite failed for {brand}: {e}")
    return {
        "overall_score": 0,
        "model_scores": {},
        "visibility_label": "unknown",
        "summary": f"{brand}'s AI visibility is unknown.",
    }


def generate_message(first_name: str, company: str, title: str, score: float,
                     visibility_label: str, summary: str) -> str:
    """Use Claude to write a personalized LinkedIn message."""
    if not ANTHROPIC_API_KEY:
        return _fallback_message(first_name, company, score, visibility_label)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    score_int = int(score)
    urgency = {
        "invisible": "virtually invisible to AI — a serious blind spot",
        "low": "scoring very low — mostly missing from AI recommendations",
        "moderate": "partially visible but significant room to improve",
        "strong": "doing well, but competitors are catching up fast",
    }.get(visibility_label, "scoring low on AI visibility")

    prompt = f"""You are writing a cold LinkedIn connection message on behalf of VisibilityRadar (visibilityradar.ai).
VisibilityRadar measures how often AI models (ChatGPT, Claude, Gemini) mention a brand, then helps improve that.

Lead info:
- First name: {first_name}
- Company: {company}
- Title: {title}
- Their AI visibility score: {score_int}/100
- Status: {company} is {urgency}
- One-line summary: {summary}

Write a LinkedIn connection request message. Rules:
- Max 280 characters (LinkedIn connection request limit)
- Start with their first name
- Mention their company name and the actual score ({score_int}/100)
- Create curiosity — don't hard sell
- End with a soft CTA (e.g. "Happy to share the full breakdown if useful")
- Sound human, not like a bot or template
- No emojis

Return ONLY the message text, nothing else."""

    try:
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text.strip().strip('"')
    except Exception as e:
        print(f"  [warn] Claude message gen failed: {e}")
        return _fallback_message(first_name, company, score, visibility_label)


def _fallback_message(first_name: str, company: str, score: float, label: str) -> str:
    score_int = int(score)
    return (
        f"Hi {first_name}, I ran a quick AI visibility check on {company} — "
        f"you're scoring {score_int}/100 on ChatGPT and Claude. "
        f"Most brands in your space are {'ahead' if label == 'low' else 'catching up'}. "
        f"Happy to share the full breakdown if useful."
    )[:280]


def generate_email_subject(company: str, score: float) -> str:
    score_int = int(score)
    if score_int < 20:
        return f"{company} is nearly invisible to AI — here's the data"
    elif score_int < 50:
        return f"AI visibility check: {company} scores {score_int}/100"
    else:
        return f"{company}'s AI visibility: {score_int}/100 — room to grow"


def generate_email_body(first_name: str, company: str, score: float,
                        model_scores: dict, summary: str) -> str:
    score_int = int(score)
    scores_text = " | ".join(f"{k.upper()}: {int(v)}" for k, v in model_scores.items())

    return f"""Hi {first_name},

I ran a quick AI visibility check on {company} using our tool VisibilityRadar.

Here's what we found:
Overall AI Visibility Score: {score_int}/100
{scores_text}

{summary}

As AI models like ChatGPT, Gemini, and Claude become the first stop for product research, brands that don't appear in their answers are losing customers silently.

I'd love to share the full breakdown — takes 2 minutes to review.

Would that be helpful?

Best,
[YOUR NAME]
VisibilityRadar · visibilityradar.ai"""


async def process_leads(input_path: str, output_path: str):
    leads = []
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            leads.append(row)

    print(f"Loaded {len(leads)} leads from {input_path}")

    enriched = []
    seen_companies: dict[str, dict] = {}  # cache: don't re-analyze same company

    for i, lead in enumerate(leads):
        # Normalize column names (Apollo uses various formats)
        first_name = lead.get("First Name") or lead.get("first_name") or ""
        last_name  = lead.get("Last Name")  or lead.get("last_name")  or ""
        company    = lead.get("Company Name") or lead.get("Company") or lead.get("company") or ""
        title      = lead.get("Title")      or lead.get("title")      or ""
        linkedin   = lead.get("Person Linkedin Url") or lead.get("LinkedIn Url") or lead.get("linkedin_url") or ""
        email      = lead.get("Email")      or lead.get("email")      or ""
        industry   = lead.get("Industry")   or lead.get("industry")   or ""

        if not company:
            print(f"  [{i+1}/{len(leads)}] Skipping — no company name")
            continue

        print(f"  [{i+1}/{len(leads)}] Processing {first_name} @ {company}...")

        # Use cached analysis for same company
        if company not in seen_companies:
            mapped_industry = map_industry(industry)
            analysis = await analyze_lite(company, mapped_industry)
            seen_companies[company] = analysis
            time.sleep(DELAY_BETWEEN_LEADS)
        else:
            analysis = seen_companies[company]
            print(f"    (using cached analysis for {company})")

        score       = analysis.get("overall_score", 0)
        model_scores = analysis.get("model_scores", {})
        vis_label   = analysis.get("visibility_label", "low")
        summary     = analysis.get("summary", "")

        # Generate personalized content
        linkedin_msg = generate_message(first_name, company, title, score, vis_label, summary)
        email_subject = generate_email_subject(company, score)
        email_body    = generate_email_body(first_name, company, score, model_scores, summary)

        enriched.append({
            "first_name":        first_name,
            "last_name":         last_name,
            "company":           company,
            "title":             title,
            "email":             email,
            "linkedin_url":      linkedin,
            "ai_score":          int(score),
            "visibility_label":  vis_label,
            "ai_summary":        summary,
            "linkedin_message":  linkedin_msg,
            "email_subject":     email_subject,
            "email_body":        email_body,
            "visibilityradar_url": f"https://visibilityradar.ai/?brand={company.replace(' ', '+')}",
        })

    # Write output CSV
    if not enriched:
        print("No leads enriched.")
        return

    fieldnames = list(enriched[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched)

    print(f"\nDone! {len(enriched)} leads written to {output_path}")
    print("Upload this CSV to Lemlist as a campaign audience.")
    print("Map these columns in Lemlist:")
    print("  {{first_name}}, {{company}}, {{ai_score}}, {{linkedin_message}}, {{email_subject}}, {{email_body}}")


def main():
    parser = argparse.ArgumentParser(description="Enrich Apollo leads with AI visibility data")
    parser.add_argument("--input",  required=True, help="Apollo CSV export path")
    parser.add_argument("--output", default="lemlist_ready.csv", help="Output CSV path")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: {args.input} not found")
        return

    asyncio.run(process_leads(args.input, args.output))


if __name__ == "__main__":
    main()
