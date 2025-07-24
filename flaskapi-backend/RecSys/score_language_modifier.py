import math

def growth_formula(x, x0=0.01, r=0.01):
    if x == x0:
        k = 1
    else:
        k = calculate_k(x, x0, r) + 1
    return 1 - (1 - x0) * math.exp(-r * k)

def calculate_k(x, x0, r=0.01):
    if not (0 <= x < 1 and 0 <= x0 < 1 and r != 0):
        raise ValueError("Asigură-te că 0 ≤ x < 1, 0 ≤ x0 < 1 și r ≠ 0")
    return -(1 / r) * math.log((1 - x) / (1 - x0))

def decrease_formula(x, x0=0.01, r=0.01):
    if x == x0:
        return x0
    k = calculate_k(x, x0, r)
    if k <= 1:
        return x0
    return (1 - (1 - x0) * math.exp(-r * (k - 1)))