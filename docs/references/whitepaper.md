---
hide_feature_button: true
---

<h1>Whitepapers, Derivations and Useful Resources</h1>

# **Whitepapers**

<div class="grid cards" markdown>

-   **Curve DAO**

    ---

    Whitepaper on the general structure and workingsof the Curve DAO.

    [:octicons-arrow-right-24: PDF](../assets/pdf/whitepaper_curvedao.pdf)

-   **Stableswap**

    ---

    Whitepaper on the Stableswap invariant.

    [:octicons-arrow-right-24: PDF](../assets/pdf/whitepaper_stableswap.pdf)

-   **Cryptoswap**

    ---

    Whitepaper on the Cryptoswap invariant.

    [:octicons-arrow-right-24: PDF](../assets/pdf/whitepaper_cryptoswap.pdf)

-   **Curve Stablecoin & LLAMMA**

    ---

    Whitepaper on the workings of the Curve Stablecoin and Linear-Liquidation Automated Market Maker Algorithm (LLAMMA).

    [:octicons-arrow-right-24: PDF](../assets/pdf/whitepaper_curve_stablecoin.pdf)

</div>


---

# **StableSwap Derivations**

The StableSwap invariant is defined as:

$$
A n^n \sum x_i + D = A D n^n + \frac{D^{n+1}}{n^n \prod x_i}
$$

Where:
- $A$ is the amplification coefficient  
- $n$ is the number of coins  
- $x_i$ is the amount of the $i$-th coin  
- $D$ is the invariant (i.e. the total virtual balance when all coins are equal)

---

## Newton’s Method for Solving $D$

We derive Newton's iteration for solving $D$ given $\{x_i\}_{i=1}^n$ and $A$.

Start with:

$$
f(D) = A n^n \sum x_i + D(1 - A n^n) - \frac{D^{n+1}}{n^n \prod x_i} = 0
$$

Or equivalently:

$$
f(D) = \frac{D^{n+1}}{n^n \prod x_i} - D(1 - A n^n) - A n^n \sum x_i
$$

Taking the derivative:

$$
f'(D) = \frac{(n + 1) D^n}{n^n \prod x_i} + A n^n - 1
$$

### Newton Iteration

Using Newton’s formula:

$$
D_{\text{new}} = D - \frac{f(D)}{f'(D)} = \frac{D f'(D) - f(D)}{f'(D)}
$$

Substituting $f(D)$ and $f'(D)$:

\[
\begin{aligned}
D_{\text{new}} &= \frac{D \left(\frac{(n+1) D^n}{n^n \prod x_i} + A n^n - 1\right) - \left(\frac{D^{n+1}}{n^n \prod x_i} - D(1 - A n^n) - A n^n \sum x_i \right)}{\frac{(n+1) D^n}{n^n \prod x_i} + A n^n - 1} \\
&= \frac{\frac{(n+1) D^{n+1}}{n^n \prod x_i} + A n^n D - D - \frac{D^{n+1}}{n^n \prod x_i} + D - A n^n D + A n^n \sum x_i}{\frac{(n+1) D^n}{n^n \prod x_i} + A n^n - 1} \\
&= \frac{\frac{n D^{n+1}}{n^n \prod x_i} + A n^n \sum x_i}{\frac{(n+1) D^n}{n^n \prod x_i} + A n^n - 1}
\end{aligned}
\]

This corresponds to the `newton_D` function in `math.vy`.

---

## Newton’s Method for Solving $x_j$

Now derive Newton’s iteration for solving $x_j$, given $\{x_i\}_{i \neq j}$, $A$, and $D$.

Start with the invariant:

$$
A n^n \sum x_i + D = A D n^n + \frac{D^{n+1}}{n^n \prod x_i}
$$

Isolate $x_j$:

\[
A n^n \left(x_j + \sum_{i \neq j} x_i\right) + D = A D n^n + \frac{D^{n+1}}{n^n (x_j \prod_{i \neq j} x_i)}
\]

Multiply both sides by $x_j$:

\[
A n^n \left(x_j^2 + x_j \sum_{i \neq j} x_i \right) + D x_j = A D n^n x_j + \frac{D^{n+1}}{n^n \prod_{i \neq j} x_i}
\]

Divide by $A n^n$:

\[
x_j^2 + x_j \sum_{i \neq j} x_i + \frac{D}{A n^n} x_j = D x_j + \frac{D^{n+1}}{A n^{2n} \prod_{i \neq j} x_i}
\]

Bring terms to one side:

\[
x_j^2 + x_j \left(\sum_{i \neq j} x_i + \frac{D}{A n^n} - D\right) - \frac{D^{n+1}}{A n^{2n} \prod_{i \neq j} x_i} = 0
\]

Define:

\[
f(x_j) = x_j^2 + x_j \left(\sum_{i \neq j} x_i + \frac{D}{A n^n} - D\right) - \frac{D^{n+1}}{A n^{2n} \prod_{i \neq j} x_i}
\]

Taking the derivative:

\[
f'(x_j) = 2 x_j + \sum_{i \neq j} x_i + \frac{D}{A n^n} - D
\]

### Newton Iteration

\[
x_j^{\text{new}} = x_j - \frac{f(x_j)}{f'(x_j)} = \frac{x_j f'(x_j) - f(x_j)}{f'(x_j)}
\]

Substitute in the expressions:

\[
\begin{aligned}
x_j^{\text{new}} &= \frac{x_j \left(2 x_j + \sum_{i \neq j} x_i + \frac{D}{A n^n} - D\right) - \left(x_j^2 + x_j \left(\sum_{i \neq j} x_i + \frac{D}{A n^n} - D\right) - \frac{D^{n+1}}{A n^{2n} \prod_{i \neq j} x_i} \right)}{2 x_j + \sum_{i \neq j} x_i + \frac{D}{A n^n} - D} \\
&= \frac{x_j^2 + \frac{D^{n+1}}{A n^{2n} \prod_{i \neq j} x_i}}{2 x_j + \sum_{i \neq j} x_i + \frac{D}{A n^n} - D}
\end{aligned}
\]

This corresponds to the `newton_x` function in `math.vy`.
[](../stableswap-exchange/stableswap-ng/utility_contracts/math.md#get_d)

---


Here’s a cleaned-up and well-structured version of your **Cryptoswap Derivations** document. The content remains mathematically equivalent, but the presentation is clearer, more readable, and easier to follow:

---

# **Cryptoswap Derivations**

## Newton Step for `newton_D()` in Tricrypto and Twocrypto

This derivation explains the mathematical logic behind the `newton_D()` function used in Curve’s tricrypto and twocrypto pools.

---

## Invariant Function Definitions

We start with the core function:

\[
F = K D^{n-1} S + P - K D^n - \left(\frac{D}{n}\right)^n
\]

Where:
- \( D \): the invariant
- \( S = \sum x_i \)
- \( P = \prod x_i \)
- \( n \): number of tokens (typically 2 or 3)
- \( \gamma \): price scale parameter
- \( A \): amplification coefficient

---

### Intermediate Definitions

\[
K = \frac{A K_0 \gamma^2}{(\gamma + 1 - K_0)^2}, \quad K_0 = \frac{P n^n}{D^n}
\]

\[
g = \gamma + 1 - K_0, \quad \hat{A} = n^n A
\]

\[
m_1 = \frac{D g^2}{\hat{A} \gamma^2}, \quad m_2 = \frac{2n K_0}{g}
\]

\[
\text{neg_fprime} = S + S m_2 + \frac{m_1 n}{K_0} - m_2 D
\]

---

## Derivative of \( K \)

\[
K' = \left( \frac{A K_0 \gamma^2}{(\gamma + 1 - K_0)^2} \right)'
\]

\[
= \left( \frac{A \gamma^2}{(\gamma + 1 - K_0)^2} + \frac{2 A K_0 \gamma^2}{(\gamma + 1 - K_0)^3} \right) \cdot \left( -n \frac{P n^n}{D^{n+1}} \right)
\]

\[
= -n \left( \frac{A \gamma^2}{g^2} + \frac{2 A K_0 \gamma^2}{g^3} \right) \cdot \frac{K_0}{D}
\]

---

## Derivative of \( F \)

\[
F = K D^{n-1} S + P - K D^n - \left( \frac{D}{n} \right)^n
\]

Taking the derivative:

\[
F' = (n-1) K D^{n-2} S - n K D^{n-1} - \frac{D^{n-1}}{n^{n-1}} + K' D^{n-1} (S - D)
\]

Substitute \( K \) and \( K' \):

\[
F' = - \frac{A K_0 \gamma^2}{g^2} D^{n-2} S - \frac{2 n A K_0^2 \gamma^2}{g^3} D^{n-2} (S - D) - \frac{D^{n-1}}{n^{n-1}}
\]

---

## Derivation of \( \frac{F}{F'} \)

\[
\frac{F}{F'} = 
\frac  
    {
        \frac{A K_0 \gamma^2}{g^2} D^{n-1} S + P - \frac{A K_0 \gamma^2}{g^2} D^n - \left( \frac{D}{n} \right)^n
    }
    {
        - \frac{A K_0 \gamma^2}{g^2} D^{n-2} S
        + \frac{2 n A K_0^2 \gamma^2}{g^3} D^{n-2}(D - S)
        - \left( \frac{D}{n} \right)^{n-1}
    }
\]

Divide numerator and denominator by \( D^n / n^n \):

\[
= \frac  
    {
        \frac{\hat{A} K_0 \gamma^2}{g^2} D^{-1} S + K_0 - \frac{\hat{A} K_0 \gamma^2}{g^2} - 1
    }
    {
        - \frac{\hat{A} K_0 \gamma^2}{g^2} D^{-2} S + \frac{2n \hat{A} K_0^2 \gamma^2}{g^3} D^{-2} (D - S) - \frac{n}{D}
    }
\]

Divide numerator and denominator by \( \frac{\hat{A} \gamma^2}{g^2 D} \):

\[
= \frac  
    {
        K_0 S + m_1 (K_0 - 1) - K_0 D
    }
    {
        - \frac{K_0 S}{D} + \frac{m_2 K_0}{D} (D - S) - \frac{n m_1}{D}
    }
\]

Multiply numerator and denominator by \( D \):

\[
= \frac  
    {
        K_0 S D + m_1 (K_0 - 1) D - K_0 D^2
    }
    {
        - K_0 S + m_2 K_0 (D - S) - n m_1
    }
\]

Divide numerator and denominator by \( K_0 \):

\[
= \frac  
    {
        S D + m_1 \left(1 - \frac{1}{K_0}\right) D - D^2
    }
    {
        - S + m_2 (D - S) - \frac{n m_1}{K_0}
    }
\]

Distribute:

\[
= \frac  
    {
        S D + m_1 \left(1 - \frac{1}{K_0} \right) D - D^2
    }
    {
        - S - m_2 S + m_2 D - \frac{n m_1}{K_0}
    }
\]

Substitute the denominator with \(-\text{neg_fprime}\):

\[
= \frac{S D + m_1 \left(1 - \frac{1}{K_0} \right) D - D^2}{-\text{neg_fprime}}
\]

---

## Newton Iteration Step

\[
D_{k+1} = D_k - \frac{F}{F'} = D_k + \frac{S D_k + m_1 \left(1 - \frac{1}{K_0} \right) D_k - D_k^2}{\text{neg_fprime}}
\]

\[
= \frac{\text{neg_fprime} D_k + S D_k + m_1 \left(1 - \frac{1}{K_0} \right) D_k - D_k^2}{\text{neg_fprime}}
\]

---

## Final Form: Positive and Negative Contributions

Separate into two parts:

**Positive Term \( D_+ \):**

\[
D_+ = \frac{(\text{neg_fprime} + S) D_k}{\text{neg_fprime}}
\]

**Negative Term \( D_- \):**

\[
D_- = \frac{D_k^2 - m_1 \left( \frac{K_0 - 1}{K_0} \right) D_k}{\text{neg_fprime}}
\]

**Final Newton Step:**

\[
D_{k+1} = D_+ - D_-
\]


---

# Useful Resources

## **Stableswap**
- https://atulagarwal.dev/posts/curveamm/stableswap/
- https://xord.com/research/curve-stableswap-a-comprehensive-mathematical-guide/
- https://miguelmota.com/blog/understanding-stableswap-curve/
- https://hackmd.io/@alltold/curve-magic
- https://medium.com/defireturns/impermanent-loss-and-apy-for-curves-lps-f75aa2e8c9d6

## **Cryptoswap**
- https://nagaking.substack.com/p/deep-dive-curve-v2-parameters
- https://0xreviews.xyz/posts/2022-02-28-curve-newton-method
- https://twitter.com/0xstan_/status/1644931391111725057?s=46&t=HudpwDodTBLJargV6p63IA
- https://medium.com/defireturns/impermanent-loss-and-apy-for-curves-lps-f75aa2e8c9d6


## **Curve Stablecoin (crvUSD)**
- https://crvusd-rate.0xreviews.xyz/
- https://twitter.com/definikola/status/1674430800107044871
- https://mirror.xyz/0x290101596c9f85eB7194f6090a8c94fF5AAa32ca/esqF1zwoaZ4ZSIjt-faZZiuKwLLw34nD0SGlqD2fZ6Q 
- https://mirror.xyz/albertlin.eth/H0m3nyq65anotTWhTdWDIWEfMPOofNPy-0qyARYXNF4
- https://www.curve.wiki/post/from-uniswap-v3-to-crvusd-llamma-%E8%8B%B1%E6%96%87%E7%89%88
- https://www.youtube.com/watch?v=p5G9injrXk8&t=2602s
- https://x.com/0xnocta/status/1659111335542571009
- https://curve.substack.com/p/august-15-2023-all-or-nothing?utm_campaign=post&utm_medium=web&triedRedirect=true
- https://curve.substack.com/p/crvusd-faq
- https://community.chaoslabs.xyz/crv-usd/risk/overview


## **Lending**
- https://mixbytes.io/blog/modern-defi-lending-protocols-how-its-made-curve-llamalend


## **Curve Integration**
- https://blog.pessimistic.io/curvev1-integration-tips-a49af7b4b46a
- https://curve.substack.com/p/october-18-2022-how-meta?utm_campaign=10-18-22
- https://blog.curvemonitor.com/posts/exchange-received/