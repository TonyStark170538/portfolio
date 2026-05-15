import numpy as np

def calculate_var(mc: dict) -> dict:
    """
    Value at Risk: the loss NOT exceeded at the given confidence levels.
    A positive number means a loss; a negative number means the portfolio
    is expected to gain even in the worst-case percentile.
    """
    losses = np.array([mc["start"] - x for x in mc["results"]])
    return {
        "var_95": round(float(np.percentile(losses, 95)), 2),
        "var_99": round(float(np.percentile(losses, 99)), 2),
    }
