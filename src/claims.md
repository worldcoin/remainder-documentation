# GKR Claims

## Claim definition
"Claims" in GKR are statements which the prover has yet to show correctness for. As described earlier (TODO @ryancao please post link), the first step in proving the correctness of a GKR circuit (after sending over all circuit inputs, both public and committed) is to take the circuit's (public) output layer $\widetilde{V}_0$ and send over all of its evaluations to the verifier. 

For example, let's say that we have a circuit whose output layer contains 8 elements, i.e. whose representative MLE can be described by $\widetilde{V}_0(x_1, x_2): \mathbb{F}^3 \mapsto \mathbb{F}$. Additionally, let's say that these evaluations are $[a_1, a_2, a_3, a_4]$, such that

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

Note that the above follows precisely from the definition of a [multilinear extension (MLE)](./multilinear_extensions.md), and it can indeed be viewed exactly as the evaluation of $\widetilde{V}_0$ at the random points $r_1, r_2$. The protocol takes a slight soundness hit here, as a cheating prover might get away with an incorrect circuit output (say, $\widetilde{V}_0^* \neq \widetilde{V}_0$, but $\widetilde{V}_0^*(r_1, r_2) = \widetilde{V}_0(r_1, r_2)$), but the probability of such an occurrence is $\frac{1}{\lvert \mathbb{F} \rvert}$, as non-identical MLEs only intersect at exactly one point via the [Schwartz-Zippel lemma](https://en.wikipedia.org/wiki/Schwartz%E2%80%93Zippel_lemma). 

In general, claims take the following form:

$$
\widetilde{V}_i(g_1, ..., g_{s_i}) = c
$$

In other words, the prover wishes to convince the verifier that the evaluation of the MLE representing the $i$'th layer at the challenge $g_1, ..., g_{s_i} \in \mathbb{F}^{s_i}$ is $c \in \mathbb{F}$. 

## Claim Propagation

Recall the general sumcheck relationship for a function $f: \mathbb{F}^n \mapsto \mathbb{F}$; the prover claims that the following relationship is true for $H \in \mathbb{F}$:

$$
H = \sum_{b_1, ..., b_n \in \{0, 1\}^n} f(b_0, ..., b_n)
$$

Assuming that $b_1, ..., b_n$ are bound to $r_1, ..., r_n \in \mathbb{F}$ during the sumcheck process, the final verifier check within sumcheck is the following, where the RHS must be an "oracle query", i.e. the verifier _must_ know that the evaluation of $f$ on $r_1, ..., r_n$ is correct:

$$
f_n(r_n) \overset{?}{=} f(r_1, ..., r_n)
$$

How does this oracle query actually get evaluated in GKR? The answer is _claims_ and sumcheck over claims for a previous layer. Specifically, let's consider the following relationship (see [structured GKR](./regular_gkr.md) section for more information about the $\widetilde{\text{eq}}$ polynomial and this kind of layerwise relationship):

$$
\widetilde{V}_{i + 1}(X_1, ..., X_n) = \sum_{b_1, ..., b_n} \widetilde{\text{eq}}(X_1, ..., X_n; b_1, ..., b_n) \cdot \widetilde{V}_i(b_1, ..., b_n)^2
$$

This is the polynomial relationship between layer $i$ and layer $i + 1$ of a circuit where the $i + 1$'th layer's values are exactly those of the $i$'th layer's values squared. For example, if the evaluations of $\widetilde{V}_i$ are $[a_1, a_2, a_3, a_4]$ then we expect the evaluations of $\widetilde{V}_{i + 1}$ to be $[a_1^2, a_2^a, a_3^2, a_4^2]$. 

The prover starts with a claim

$$
\widetilde{V}_{i + 1}(g_1, ..., g_n) = c_{i + 1}
$$

for $g_1, ..., g_n, c \in \mathbb{F}$, and wishes to prove it to the verifier. It does so by running sumcheck on the RHS of the above equation, i.e.

$$
c \overset{?}{=} \sum_{b_1, ..., b_n} \widetilde{\text{eq}}(g_1, ..., g_n; b_1, ..., b_n) \cdot \widetilde{V}_i(b_1, ..., b_n)^2
$$

Let $b_1, ..., b_n$ be bound to $r_1, ..., r_n \in \mathbb{F}$ during the rounds of sumcheck. Additionally, let $f_n(X_n)$ be the univariate polynomial the prover sends in the $n$'th round of sumcheck. The oracle query check is then

$$
f_n(r_n) \overset{?}{=} \widetilde{\text{eq}}(g_1, ..., g_n; r_1, ..., r_n) \cdot \widetilde{V}_i(r_1, ..., r_n)^2
$$

The verifier is able to compute $\widetilde{\text{eq}}(g_1, ..., g_n; r_1, ..., r_n)$ on its own in $O(n)$ time, but unless $\widetilde{V}_i$ is an MLE within the input layer of the GKR circuit, they will not be able to determine the value of $\widetilde{V}_i(r_1, ..., r_n)$. Instead, the prover sends over a new _claimed value_ $c_i \overset{?}{=} \widetilde{V}_i(r_1, ..., r_n)$, and the verifier checks that

$$
f_n(r_n) \overset{?}{=} \widetilde{\text{eq}}(g_1, ..., g_n; r_1, ..., r_n) \cdot c_i^2
$$

The only thing left to check is whether $\widetilde{V}_i(r_1, ..., r_n) \overset{?}{=} c_i$. Notice, however, that this now a new claim on an MLE residing in layer $i$, and that we started with a claim on layer $i + 1$. In other words, we've _reduced_ the validity of a claim on layer $i + 1$ to that of a claim on layer $i$, which is the core idea behind GKR: start with claims on circuit output layers, and reduce those using sumcheck to claims on earlier layers of the circuit. Eventually all remaining claims will be those on circuit input layers, which can be directly checked via either a direct verifier MLE evaluation for public input layers, or a PCS evaluation proof for committed input layers. 

## Claim Aggregation
In the above example, 