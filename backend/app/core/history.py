"""
Fetches 1 year of daily closing prices per asset from Yahoo Finance,
plus 50-day Monte Carlo simulation paths (best 10%, median, worst 10%).
"""

import asyncio
from typing import Optional
import httpx
import numpy as np

_YF_URL = (
    "https://query1.finance.yahoo.com/v8/finance/chart/"
    "{ticker}?range=1y&interval=1d"
)
_HEADERS = {"User-Agent": "Mozilla/5.0"}


async def _fetch_history(ticker: str) -> Optional[dict]:
    """Return {dates: [...], closes: [...]} or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(_YF_URL.format(ticker=ticker), headers=_HEADERS)
            r.raise_for_status()
            data = r.json()
            result = data["chart"]["result"][0]
            timestamps = result["timestamp"]
            closes = result["indicators"]["quote"][0]["close"]

            # Zip and filter out None values
            pairs = [
                (ts, c) for ts, c in zip(timestamps, closes) if c is not None
            ]
            if len(pairs) < 10:
                return None

            dates = [p[0] * 1000 for p in pairs]   # ms for JS Date
            raw_closes = [p[1] for p in pairs]

            return {"dates": dates, "closes": raw_closes}
    except Exception:
        return None


def _simulation_fan(last_price: float, sims: int = 300, steps: int = 50) -> dict:
    """
    Run Monte Carlo from last_price, return percentile paths.
    Returns best (p90), median (p50), worst (p10) as lists of length steps+1.
    """
    daily_returns = np.random.normal(loc=0.001, scale=0.01, size=(sims, steps))
    # Shape: (sims, steps+1) — prepend starting price
    paths = np.cumprod(np.hstack([
        np.ones((sims, 1)),
        1 + daily_returns
    ]), axis=1) * last_price

    best   = np.percentile(paths, 90, axis=0).tolist()
    median = np.percentile(paths, 50, axis=0).tolist()
    worst  = np.percentile(paths, 10, axis=0).tolist()

    return {"best": best, "median": median, "worst": worst, "steps": steps}


async def get_history(portfolio: dict) -> list:
    """
    For each asset with a ticker, fetch 1y history + simulation fan.
    Assets without a ticker are skipped (no price history available).
    """
    assets = portfolio["assets"]

    async def process(asset: dict) -> Optional[dict]:
        ticker = asset.get("ticker", "").strip().upper()
        if not ticker:
            return None

        hist = await _fetch_history(ticker)
        if not hist:
            return None

        last_price = hist["closes"][-1]
        fan = _simulation_fan(last_price)

        # Normalise closes to % change from first close for comparability
        first = hist["closes"][0]
        norm_closes = [round((c / first - 1) * 100, 2) for c in hist["closes"]]

        # Normalise fan to % change from last historical close
        def norm_fan(prices):
            return [round((p / last_price - 1) * 100, 2) for p in prices]

        return {
            "name":        asset["name"],
            "ticker":      ticker,
            "dates":       hist["dates"],
            "closes":      norm_closes,         # % change from 1y ago
            "raw_closes":  hist["closes"],       # absolute prices
            "last_price":  last_price,
            "fan": {
                "best":   norm_fan(fan["best"]),
                "median": norm_fan(fan["median"]),
                "worst":  norm_fan(fan["worst"]),
                "steps":  fan["steps"],
            },
        }

    results = await asyncio.gather(*[process(a) for a in assets])
    return [r for r in results if r is not None]
