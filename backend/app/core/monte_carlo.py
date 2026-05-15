import numpy as np

def run_monte_carlo(portfolio, sims: int = 500, steps: int = 50):
    """
    Simulate portfolio value over `steps` days using Geometric Brownian Motion.
    Returns start value and the distribution of end values.
    """
    start = float(sum(a["value"] for a in portfolio["assets"]))

    # daily drift ~0.1% annualised, vol ~1%
    daily_returns = np.random.normal(loc=0.001, scale=0.01, size=(sims, steps))
    # Geometric compounding
    end_values = start * np.prod(1 + daily_returns, axis=1)

    return {
        "start":   start,
        "results": [round(float(v), 2) for v in end_values],
        "mean":    round(float(end_values.mean()), 2),
        "std":     round(float(end_values.std()), 2),
    }
