def analyze_portfolio(portfolio):
    assets = portfolio["assets"]
    total = sum(a["value"] for a in assets)

    allocation = []
    max_w = 0

    for a in assets:
        w = a["value"] / total
        max_w = max(max_w, w)
        allocation.append({
            "name": a["name"],
            "value": a["value"],
            "weight": round(w*100,2)
        })

    return {
        "total_value": total,
        "allocation": allocation,
        "risk_score": 100 - int(max_w*100)
    }