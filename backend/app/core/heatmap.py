"""
Heatmap with real volatility from Yahoo Finance.

Each asset entry is expected to have:
  name  : str   – display name
  value : float – USD value
  ticker: str   – optional Yahoo Finance ticker (e.g. "AAPL", "BTC-USD")

Assets without a ticker (or whose ticker fetch fails) fall back to
concentration-only risk scoring.

Composite risk score (0–100):
  score = 0.5 * vol_score + 0.5 * concentration_score
  where:
    vol_score           = min(annualised_vol / 0.80, 1.0) * 100   (80% vol → 100)
    concentration_score = weight_pct                               (100% weight → 100)
"""

import asyncio
from typing import Optional

import httpx
import numpy as np

_YF_URL = (
    "https://query1.finance.yahoo.com/v8/finance/chart/"
    "{ticker}?range=90d&interval=1d"
)
_HEADERS = {"User-Agent": "Mozilla/5.0"}


async def _fetch_annualised_vol(ticker: str) -> Optional[float]:
    """Return annualised volatility (e.g. 0.25 = 25 %) or None on any failure."""
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(_YF_URL.format(ticker=ticker), headers=_HEADERS)
            r.raise_for_status()
            closes = (
                r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
            )
            closes = [c for c in closes if c is not None]
            if len(closes) < 5:
                return None
            log_returns = np.diff(np.log(closes))
            return float(np.std(log_returns) * np.sqrt(252))
    except Exception:
        return None


async def _maybe_fetch(ticker: str) -> Optional[float]:
    """Fetch vol for a non-empty ticker, else return None immediately."""
    if ticker:
        return await _fetch_annualised_vol(ticker)
    return None


async def generate_heatmap(portfolio: dict) -> list:
    """
    Returns assets sorted by composite risk score (descending).
    Each entry includes weight, volatility (when available), and a 0–100 risk score.
    """
    assets = portfolio["assets"]
    total = sum(a["value"] for a in assets)
    if total == 0:
        return []

    tickers = [a.get("ticker", "").strip().upper() for a in assets]
    vols: list[Optional[float]] = await asyncio.gather(
        *[_maybe_fetch(t) for t in tickers]
    )

    result = []
    for a, vol in zip(assets, vols):
        weight = (a["value"] / total) * 100

        vol_score = min(vol / 0.80, 1.0) * 100 if vol is not None else None
        conc_score = weight  # 100 % concentration → score of 100

        composite = round(
            (0.5 * vol_score + 0.5 * conc_score) if vol_score is not None else conc_score,
            1,
        )

        result.append(
            {
                "name":           a["name"],
                "ticker":         a.get("ticker", ""),
                "value":          a["value"],
                "weight":         round(weight, 2),
                "volatility_pct": round(vol * 100, 1) if vol is not None else None,
                "risk_score":     composite,
                "vol_available":  vol is not None,
            }
        )

    return sorted(result, key=lambda x: x["risk_score"], reverse=True)
