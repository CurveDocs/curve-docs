N_COINS = 3
fee = 10000000
fee_m = 200 * 10**18
PRECISION = 10 ** 18
FEE_DENOMINATOR = 10 ** 18

def get_float_input(prompt: str) -> float:
    try:
        return float(input(prompt))
    except ValueError:
        print("Please enter a valid number.")
        return get_float_input(prompt)

# Get user input for rate and balances
rate_i = get_float_input("Enter rate for i (e.g., 0.95): ") * 10**18
balance_i = get_float_input("Enter balance for i (e.g., 500000): ") * 10**18
xpi = (rate_i * balance_i) / PRECISION
print("xpi:", xpi)

rate_j = get_float_input("Enter rate for j (e.g., 1.05): ") * 10**18
balance_j = get_float_input("Enter balance for j (e.g., 1300000): ") * 10**18
xpj = (rate_j * balance_j) / PRECISION
print("xpj:", xpj)

# calc dynamic fee
def calc_dynamic_fee():
    if fee_m <= FEE_DENOMINATOR:
        return fee

    else:
        xps2 = (xpi * xpj) ** 2
        return (fee_m * fee) / (fee_m - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR

print("Dynamic Fee:", calc_dynamic_fee() / 10**18)
