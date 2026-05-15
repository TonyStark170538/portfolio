from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.core.quant import analyze_portfolio
    from app.core.scenarios import apply_scenario
    from app.core.monte_carlo import run_monte_carlo
    from app.core.var import calculate_var
    from app.core.heatmap import generate_heatmap
    from app.core.brief import get_market_brief
    from app.core.history import get_history
except ImportError:
    from core.quant import analyze_portfolio
    from core.scenarios import apply_scenario
    from core.monte_carlo import run_monte_carlo
    from core.var import calculate_var
    from core.heatmap import generate_heatmap
    from core.brief import get_market_brief
    from core.history import get_history

app = FastAPI(title="Portfolio AI Terminal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_assets(data: dict) -> dict:
    portfolio = data.get("portfolio", {})
    if not portfolio.get("assets"):
        raise HTTPException(status_code=400, detail="Portfolio must have at least one asset")
    return portfolio


@app.post("/analyze")
def analyze(data: dict):
    return analyze_portfolio(_require_assets(data))


@app.post("/scenario")
def scenario(data: dict):
    portfolio = _require_assets(data)
    return apply_scenario(portfolio, data.get("scenario", "crash"))


@app.post("/risk")
async def risk(data: dict):
    portfolio = _require_assets(data)
    mc = run_monte_carlo(portfolio)
    var = calculate_var(mc)
    heatmap = await generate_heatmap(portfolio)
    return {"monte_carlo": mc, "var": var, "heatmap": heatmap}


@app.post("/history")
async def history(data: dict):
    portfolio = _require_assets(data)
    result = await get_history(portfolio)
    return {"assets": result}


@app.post("/brief")
async def brief(data: dict):
    portfolio = _require_assets(data)
    try:
        result = await get_market_brief(portfolio["assets"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
