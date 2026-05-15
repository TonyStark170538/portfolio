SCENARIO_IMPACTS = {
    "crash":  -0.35,
    "rally":   0.25,
    "default": -0.20,
}

def apply_scenario(portfolio, scenario: str):
    assets = portfolio["assets"]
    impact = SCENARIO_IMPACTS.get(scenario, SCENARIO_IMPACTS["default"])

    result = [
        {
            "name": a["name"],
            "old":  a["value"],
            "new":  round(a["value"] * (1 + impact), 2),
        }
        for a in assets
    ]

    total_old = sum(a["value"] for a in assets)
    total_new = sum(r["new"] for r in result)

    return {
        "scenario":   scenario,
        "impact_pct": round(impact * 100, 1),
        "total_old":  total_old,
        "total_new":  round(total_new, 2),
        "assets":     result,
    }
