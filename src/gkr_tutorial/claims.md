# GKR Claims

## Claim definition
"Claims" in GKR are statements which the prover has yet to show correctness for. As described [earlier](./encoding_layers.md#using-the-equivalence-between-layer-encodings), the first step in proving the correctness of a GKR circuit (after sending over all circuit inputs, both public and committed) is to take the circuit's (public) output layer $\widetilde{V}_0$ and send over all of its evaluations to the verifier. 

For example, let's say that we have a circuit whose output layer contains 4 elements, i.e. whose representative MLE can be described by $\widetilde{V}_0(x_1, x_2): \mathbb{F}^2 \mapsto \mathbb{F}$. Additionally, let's say that these evaluations are $[a_1, a_2, a_3, a_4]$, such that

$$
\widetilde{V}_0(0, 0) = a_1 \\
\widetilde{V}_0(0, 1) = a_2 \\
\widetilde{V}_0(1, 0) = a_3 \\
\widetilde{V}_0(1, 1) = a_4 \\
$$

These four equalities above are actually the first _claims_ whose validity the prover wishes to demonstrate to the verifier. The verifier doesn't know what the true values of $\widetilde{V}_0$ are, of course, but would be able to check each of these relationships with the prover's help via [sumcheck](./sumcheck.md). This would be rather expensive, however, as the number of claims is exactly equal to the number of circuit outputs/evaluations within the circuit's output layer. Instead, the verifier can sample some randomness and have the prover prove the following:

$$
\text{Sample } r_1, r_2 \overset{\$}{\leftarrow} \mathbb{F} \\ \quad \\
\text{Let } a^\star = (1 - r_1)(1 - r_2)(a_1) + (1 - r_1)(r_2)(a_2) + (r_1)(1 - r_2)(a_3) + (r_1)(r_2)(a_4) \\ \quad \\
\text{Prove } \widetilde{V}_0(r_1, r_2) = a^\star
$$

Note that the above follows precisely from the definition of a [multilinear extension (MLE)](./multilinear_extensions.md), and it can indeed be viewed exactly as the evaluation of $\widetilde{V}_0$ at the random points $r_1, r_2$. The protocol takes a slight soundness hit here, as a cheating prover might get away with an incorrect circuit output (say, $\widetilde{V}_0^* \neq \widetilde{V}_0$, but $\widetilde{V}_0^*(r_1, r_2) = \widetilde{V}_0(r_1, r_2)$), but the probability of such an occurrence is $\frac{1}{\lvert \mathbb{F} \rvert}$, as non-identical MLEs only intersect at exactly one point via the [Schwartz-Zippel lemma](./sumcheck.md#schwartz-zippel-lemma).

In general, claims take the following form:

$$
\widetilde{V}_i(g_1, ..., g_{s_i}) = c_i
$$

In other words, the prover wishes to convince the verifier that the evaluation of the MLE representing the $i$'th layer at the challenge $g_1, ..., g_{s_i} \in \mathbb{F}^{s_i}$ is $c_i \in \mathbb{F}$. 

## Claim Propagation

For another example of claim propagation/reduction, see [this section](./encoding_layers.md#using-the-equivalence-between-layer-encodings). Note that the below example uses a [structured GKR](./regular_gkr.md) relationship while the other example uses a [canonic GKR](./canonical_gkr.md) relationship.

Recall the general sumcheck relationship for a function $f: \mathbb{F}^n \mapsto \mathbb{F}$; the prover claims that the following relationship is true for $H \in \mathbb{F}$:

$$
H = \sum_{b_1, ..., b_n \in \{0, 1\}^n} f(b_0, ..., b_n)
$$

Assuming that $b_1, ..., b_n$ are bound to $r_1, ..., r_n \in \mathbb{F}$ during the sumcheck process, the final verifier check within sumcheck is the following, where the RHS must be an "oracle query", i.e. the verifier _must_ know that the evaluation of $f$ on $r_1, ..., r_n$ is correct:

$$
f_n(r_n) \overset{?}{=} f(r_1, ..., r_n)
$$

How does this oracle query actually get evaluated in GKR? The answer is _claims_ and sumcheck over claims for a previous layer. Specifically, let's consider the following relationship (see [structured GKR](./regular_gkr.md) section for more information about the $\widetilde{q}$ polynomial and this kind of layerwise relationship):

$$
\widetilde{V}_{i + 1}(X_1, ..., X_n) = \sum_{b_1, ..., b_n} \widetilde{q}(X_1, ..., X_n; b_1, ..., b_n) \cdot \widetilde{V}_i(b_1, ..., b_n)^2
$$

This is the polynomial relationship between layer $i$ and layer $i + 1$ of a circuit where the $i + 1$'th layer's values are exactly those of the $i$'th layer's values squared. For example, if the evaluations of $\widetilde{V}_i$ are $[a_1, a_2, a_3, a_4]$ then we expect the evaluations of $\widetilde{V}_{i + 1}$ to be $[a_1^2, a_2^2, a_3^2, a_4^2]$. 

The prover starts with a claim

$$
\widetilde{V}_i(g_1, ..., g_n) = c_i
$$

for $g_1, ..., g_n, c_i \in \mathbb{F}$, and wishes to prove it to the verifier. It does so by running sumcheck on the RHS of the above equation, i.e.

$$
c_i \overset{?}{=} \sum_{b_1, ..., b_n} \widetilde{q}(g_1, ..., g_n; b_1, ..., b_n) \cdot \widetilde{V}_{i + 1}(b_1, ..., b_n)^2
$$

Let $b_1, ..., b_n$ be bound to $r_1, ..., r_n \in \mathbb{F}$ during the rounds of sumcheck. Additionally, let $f_n(X_n)$ be the univariate polynomial the prover sends in the $n$'th round of sumcheck. The oracle query check is then

$$
f_n(r_n) \overset{?}{=} \widetilde{q}(g_1, ..., g_n; r_1, ..., r_n) \cdot \widetilde{V}_{i + 1}(r_1, ..., r_n)^2
$$

The verifier is able to compute $\widetilde{q}(g_1, ..., g_n; r_1, ..., r_n)$ on its own in $O(n)$ time, but unless $\widetilde{V}_{i + 1}$ is an MLE within an input layer of the GKR circuit, they will not be able to determine the value of $\widetilde{V}_{i + 1}(r_1, ..., r_n)$. Instead, the prover sends over a new _claimed value_ $c_{i + 1} \overset{?}{=} \widetilde{V}_{i + 1}(r_1, ..., r_n)$, and the verifier checks that

$$
f_n(r_n) \overset{?}{=} \widetilde{q}(g_1, ..., g_n; r_1, ..., r_n) \cdot c_{i + 1}^2
$$

The only thing left to check is whether $\widetilde{V}_{i + 1}(r_1, ..., r_n) \overset{?}{=} c_{i + 1}$. Notice, however, that this now a new claim on an MLE residing in layer $i + 1$, and that we started with a claim on layer $i$. In other words, we've _reduced_ the validity of a claim on layer $i + 1$ to that of a claim on layer $i$, which is the core idea behind GKR: start with claims on circuit output layers, and reduce those using sumcheck to claims on earlier layers of the circuit. Eventually all remaining claims will be those on circuit input layers, which can be directly checked via either a direct verifier MLE evaluation for public input layers, or a PCS evaluation proof for committed input layers. 

## Claim Aggregation
In the above example, we reduced a _single_ claim on layer $i$ to claim(s) on MLEs residing in previous layers. What happens when there are multiple claims on the same layer, e.g.

$$
\widetilde{V}_i(g_1^{(1)}, ..., g_n^{(1)}) \overset{?}{=} c_i^{(1)} \\
\widetilde{V}_i(g_1^{(2)}, ..., g_n^{(2)}) \overset{?}{=} c_i^{(2)} \\
\vdots \\
\widetilde{V}_i(g_1^{(m)}, ..., g_n^{(m)}) \overset{?}{=} c_i^{(m)} \\
$$

One method would be to simply run sumcheck $m$ times, once for each of the above claims, and reduce to $\geq 2m$ separate claims on MLEs residing in previous layers. This strategy, however, leads to an exponential number of claims in the depth of the circuit, which is undesirable. 

Instead, Remainder implements two primary modes of _claim aggregation_, i.e. methods for using a single sumcheck to prove the validity of many claims on the same MLE.

### RLC (Random Linear Combination) Claim Aggregation
Additional reading: See [XZZ+19](https://eprint.iacr.org/2019/317.pdf), page 10 ("Combining two claims: random linear combination"). 

The idea behind RLC claim aggregation is precisely what it sounds like: the prover shows that a random linear combination of the claimed values indeed equals the corresponding random linear combination of the summations on the RHS of e.g. (TODO @ryancao -- cite the equations please). The implementation of RLC claim aggregation within Remainder works for [structured layers](./regular_gkr.md) and [gate layers](./canonical_gkr.md), but not for [matrix multiplication layers](./matmult.md) or [input layers](./input_layers.md) (as explained below).

 We defer to the corresponding pages for more detailed explanations of the layerwise relationships, but review their form factors here and show how RLC claim aggregation can be done for each here.

**Structured Layers**

We start with structured layers, and use the same example relationship from above:

$$
\widetilde{V}_i(X_1, ..., X_n) = \sum_{b_1, ..., b_n} \widetilde{q}(X_1, ..., X_n; b_1, ..., b_n) \cdot \widetilde{V}_{i + 1}(b_1, ..., b_n)^2
$$

For simplicity, we aggregate two claims rather than $m$ claims, but the methodology generalizes in a straightforward fashion. Our aggregated claim is constructed as follows:

$$
\text{Sample } \alpha \overset{\$}{\leftarrow} \mathbb{F} \\
\text{Let } c_i^\star = c_i^{(1)} + \alpha \cdot c_i^{(2)}
$$

Similarly, we take an RLC of the summations and create a new summation to sumcheck over (we let $b = b_1, ..., b_n$ and $g^{(j)} = g_1^{(j)}, ..., g_n^{(j)}$ for concision):

$$
c^\star_i \overset{?}{=} \sum_{b_1, ..., b_n} \widetilde{q}(g^{(1)}; b) \cdot \widetilde{V}_i(b) + \alpha \cdot \sum_{b_1, ..., b_n} \widetilde{q}(g^{(2)}; b) \cdot \widetilde{V}_{i + 1}(b)^2 \\

= \sum_{b_1, ..., b_n} \big[ \widetilde{q}(g^{(1)}; b) + \alpha \cdot \widetilde{q}(g^{(2)}; b) \big] \cdot \widetilde{V}_{i + 1}(b)^2
$$

For structured layers, in other words, the prover and verifier simply take a random linear combination of the claims and perform sumcheck over a polynomial which is identical to the original layerwise relationship polynomial but with the $\widetilde{q}$ term replaced with an RLC of $\widetilde{q}$ terms in the same manner as the RLC of the original claims. 

**Gate Layers**

A similar idea applies to gate layers. We use [mul gate](./gate.md#mul-gate) as the example layerwise relationship here:

$$
\widetilde{V}_i(Z_1, ..., Z_{s_i}) = \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\mul}(Z, x, y) \cdot \bigg[\widetilde{V}_j(x) * \widetilde{V}_k(y)\bigg]
$$

Again, we aggregate just two claims for simplicity, although the idea generalizes very naturally to $m$ claims:

$$
\text{Sample } \alpha \overset{\$}{\leftarrow} \mathbb{F} \\
\text{Let } c_i^\star = c_i^{(1)} + \alpha \cdot c_i^{(2)}
$$

The polynomial relationship to run sumcheck over is constructed using a similar idea as that of structured layers:

$$
c^\star_i \overset{?}{=} \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\mul}_{i, j, k}(g^{(1)}, x, y) \cdot \widetilde{V}_j(x) \cdot \widetilde{V}_k(y) + \\

\alpha \cdot \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\mul}_{i, j, k}(g^{(2)}, x, y) \cdot \widetilde{V}_j(x) \cdot \widetilde{V}_k(y) \\

= \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \big[ \widetilde{\mul}_{i, j, k}(g^{(1)}, x, y) + \alpha \cdot \widetilde{\mul}_{i, j, k}(g^{(2)}, x, y) \big] \cdot \big[ \widetilde{V}_i(x) \cdot \widetilde{V}_i(y) \big]
$$

Rather than taking a linear combination of the $\widetilde{q}$ polynomials, we instead take a linear combination of the $\widetilde{\mul}_{i, j, k}$ polynomials.

**Costs**

The prover costs for RLC claim aggregation are as follows -- assume that we are working with a structured layer (the analysis is similar for gate layers) and that the degree of every sumcheck variable is $d$ (in the above example for a structured layer, $d = 3$). Additionally, assume that we have $m$ claims over a layer with $n$ variables. 
- As shown above, RLC claim aggregation for structured layers simply involves "factoring out" the $\widetilde{q}$ term between each of the $g^{(i)}$'s and the $b$'s. Rather than multiplying the structured polynomial relationship by a single $\widetilde{q}$, we multiply by an RLC of $m$ $\widetilde{q}$ terms. 
- For each additional $\widetilde{q}$ term, the prover incurs an additional $d + 1$ evaluations worth of work (across a single sumcheck round). Evaluating $\widetilde{q}$ can be done in $O(2^j)$ time by the prover for $j$ variables, and thus the total cost (for $m$ claims) is
$$
m \cdot (d + 1) \cdot \sum_{j = 1}^n 2^j
$$
- across all rounds of sumcheck. The total prover runtime is thus $O(m \cdot d \cdot 2^{n + 1})$. 

The proof size is identical to that of the single-claim sumcheck case, since the degree of the sumcheck messages do not change.

Finally, the verifier cost is slightly increased. Specifically, during intermediate rounds of sumcheck the verifier does not do any additional work (compared to the single-claim sumcheck case), but during the oracle query the verifier must evaluate $m$ separate instances of $\widetilde{q}$ at fixed points. This takes the verifier $O(mn)$ additional time. 

**Matrix Multiplication Layers**

Prerequisite: [matrix multiplication](TODO @ryancao) layers page.

For matrix multiplication layers: consider $AB \overset{?}{=} C$, and consider the sumcheck relationship $\widetilde{C}(X, Z) \overset{?}{=} \sum_{y \in \{0, 1\}^j} \widetilde{A}(X, y) \cdot \widetilde{B}(y, Z)$. 

In matrix multiplication layers, the claim is always of the form $\widetilde{C}(g_X, g_Z) \overset{?}{=} c$, and the prover proceeds by first binding $\widetilde{A}(g_X, Y)$ and $\widetilde{B}(Y, g_Z)$ before showing that $c = \sum_{y \in \{0, 1\}^j} \widetilde{A}(g_X, y) \cdot \widetilde{B}(y, g_Z)$. In the RLC claim aggregation case, we have claims 
$$
\widetilde{C}(g_X, g_Z) \overset{?}{=} c \\
\widetilde{C}(g_X', g_Z') \overset{?}{=} c'
$$
Where $g_X \neq g_X'$ and $g_Z \neq g_Z'$ (otherwise they would be claims from the same "source" layer and would therefore be identical). The verifier samples random challenge $\alpha \overset{\$}{\leftarrow} \mathbb{F}$. In this case, our sumcheck relationship is the following:
$$
c + \alpha c' \overset{?}{=} \sum_{y \in \{0, 1\}^j} \widetilde{A}(g_X, y) \cdot \widetilde{B}(y, g_Z) + \alpha \big[ \widetilde{A}(g_X', y) \cdot \widetilde{B}(y, g_Z') \big]
$$
Because $g_X \neq g_X'$ and $g_Z \neq g_Z'$, there is no way to factor the above expression's RHS to combine terms in any way, and thus RLC claim aggregation is equivalent to not aggregating claims at all and simply running two separate sumchecks on
$$
c \overset{?}{=} \sum_{y \in \{0, 1\}^j} \widetilde{A}(g_X, y) \cdot \widetilde{B}(y, g_Z) \\
c' \overset{?}{=} \sum_{y \in \{0, 1\}^j} \widetilde{A}(g_X', y) \cdot \widetilde{B}(y, g_Z') \\
$$

**Input Layers**

For input layers: RLC claim aggregation combines claims
$$
\widetilde{V}_d(g_1, ..., g_n) \overset{?}{=} c_d \\
\widetilde{V}_d(g_1', ..., g_n') \overset{?}{=} c_d'
$$
into a single claimed statement
$$
\widetilde{V}_d(g_1, ..., g_n) + \alpha \widetilde{V}_d(g_1', ..., g_n') \overset{?}{=} c_d + \alpha \cdot c_d'
$$
For [public inputs](./input_layers.md#public-inputs), the verifier must evaluate each of $\widetilde{V}_d(g_1, ..., g_n)$ and $\widetilde{V}_d(g_1', ..., g_n')$ on their own, and thus nothing is gained by the combination. 

For [committed inputs](./input_layers.md#committed-inputs), a polynomial commitment scheme may allow for cheaper evaluation proofs in the above form (vs. two separate evaluation proofs; one for each claim), but this is generally not the case. 

### Interpolative Claim Aggregation
Additional reading: See [Tha13](https://eprint.iacr.org/2013/351.pdf), page 15 ("reducing to verification of a single point"), for another description of the protocol, and [Mod24](https://github.com/Modulus-Labs/Papers/blob/master/remainder-paper.pdf), page 15 (Section 3.4, "Claim aggregation"), for a thorough description + optimization. 

Interpolative claim aggreation works by having the prover and verifier both compute an interpolating polynomial $\ell: \mathbb{F} \mapsto \mathbb{F}^n$, such that for the claims described earlier, i.e.

$$
\widetilde{V}_i(g_1^{(1)}, ..., g_n^{(1)}) \overset{?}{=} c_i^{(1)} \\
\widetilde{V}_i(g_1^{(2)}, ..., g_n^{(2)}) \overset{?}{=} c_i^{(2)} \\
\vdots \\
\widetilde{V}_i(g_1^{(m)}, ..., g_n^{(m)}) \overset{?}{=} c_i^{(m)}
$$

we have that

$$
\ell(1) = g_1^{(1)}, ..., g_n^{(1)} \\
\ell(2) = g_1^{(2)}, ..., g_n^{(2)} \\
\vdots \\
\ell(m) = g_1^{(m)}, ..., g_n^{(m)}
$$

Note that the degree of $\ell$ is $m - 1$, as there are $m$ points for each of the $n$ coordinates which must be interpolated. 

The prover then sends over the polynomial $\widetilde{V}_i \circ \ell: \mathbb{F} \mapsto \mathbb{F}$, i.e. the restriction of $\widetilde{V}_i$ to points in $\mathbb{F}^n$ generated by $\ell$. Note that the degree of $\widetilde{V}_i \circ \ell$ is $(m - 1) \cdot n$, as $\widetilde{V}_i$ is multilinear in each of its variables, and each of those variables is degree at most $m - 1$ in the input variable $X$ for $(\widetilde{V}_i \circ \ell) (X)$. 

The verifier samples $r^\star \overset{\$}{\leftarrow} \mathbb{F}$ and sends it to the prover. The prover and verifier both compute $\ell(r^\star) = r^\star_1, ..., r^\star_n$, and the prover proves the single claim

$$
\widetilde{V}_i(r^\star_1, ..., r^\star_n) \overset{?}{=} (\widetilde{V}_i \circ \ell)(r^\star)
$$

where $\widetilde{V}_i \circ \ell$ was sent by the prover and the verifier evaluates it at $r^\star$ on its own. 

**Costs**

The prover cost for interpolative claim aggregation is as follows:
- Given $m$ claims with $n$ variables each, $\ell$ is a $m - 1$-degree function in each of its components, and since $\widetilde{V}_i$ is multilinear in each of its $n$ variables, $\widetilde{V}_i \circ \ell$ is a univariate polynomial with degree $n(m - 1)$. The prover must send $n(m - 1) + 1$ evaluations to the verifier, although the first $m$ have already been sent implicitly in the form of the $m$ claims. 
- The prover thus must evaluate $\widetilde{V}_i \circ \ell$ at $n(m - 1) + 1 - m = (n - 1)(m - 1)$ points. Each evaluation requires the prover to evaluate $\ell$ in $O(mn)$ time, and then $\widetilde{V}_i$ in $O(2^n)$ time. The prover's total runtime is thus $O((n - 1)(m - 1) \cdot (mn + 2^n)) = O(mn2^n)$. 

The proof size for interpolative claim aggregation is as follows:
- As reasoned earlier in the prover cost section, the prover sends over $(n - 1)(m - 1)$ evaluations of $\widetilde{V}_i \circ \ell$. The proof size is thus $O(mn)$ field elements.

The verifier runtime for interpolative claim aggregation is as follows:
- The verifier receives evaluations of $\widetilde{V}_i \circ \ell$ from the prover and evaluates it at a random point $r^\star$. This takes $O(mn)$ time. Additionally, the verifier evaluates $\ell(r^\star)$, which takes $O(mn)$ time as well. The verifier's total runtime is thus $O(mn)$. 

**Optimizations**

Remainder has a few built-in optimizations for interpolative claim aggregation which substantially lower the prover costs for claims with "structure" within their evaluation points. For more details, see [Mod24](https://github.com/Modulus-Labs/Papers/blob/master/remainder-paper.pdf), page 15 (_Claim Aggregation_ section). 