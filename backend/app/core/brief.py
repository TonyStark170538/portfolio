"""
Fetches an AI market brief from the Google Gemini API.
Reads GEMINI_API_KEY from environment or a .env file in the backend folder.
"""

import os
import json
import httpx
from pathlib import Path

GEMINI_API = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


def _load_env():
    """Load .env file from the backend directory if it exists."""
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


async def get_market_brief(assets: list) -> dict:
    _load_env()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. "
            "Create a file called .env in the backend folder with:\n"
            "GEMINI_API_KEY=AIza-your-key-here"
        )

    asset_list = "\n".join(
        f"- {a['name']}"
        + (f" ({a.get('ticker', '')})" if a.get("ticker") else "")
        + f" — ${a['value']:,.0f}"
        for a in assets
    )

    prompt = f"""You are a financial analyst assistant. Search the web for the latest market news today.

The user holds this portfolio:
{asset_list}

Based on current market conditions, respond with ONLY a raw JSON object — no markdown, no code fences, no explanation:
{{
  "summary": "2-3 sentences on what is happening in markets right now",
  "outlook": "1-2 sentences on the short-term outlook for this specific portfolio",
  "advice": ["specific action 1", "specific action 2", "specific action 3"],
  "sentiment": "bullish"
}}

Replace the sentiment value with exactly one of: bullish, bearish, or neutral.
Use plain language. No finance jargon."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1000},
    }

    # API key goes in header, not URL
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(GEMINI_API, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        text = ""

    clean = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {
            "summary": clean[:400] if clean else "Could not parse AI response.",
            "outlook": "",
            "advice": ["Check your positions manually."],
            "sentiment": "neutral",
        }
