# Proof of Claim Aggregation

There are [two main methods of GKR claim aggregation](../gkr_tutorial/claims.md) used in Remainder, and we must provide proof that claims have been aggregated correctly for both methods, Random Linear Combination (RLC) and Interpolative Claim Aggregation, within the Hyrax framework as well.

## Random Linear Combination (RLC) Claim Aggregation
Recall that [RLC claim aggregation](../gkr_tutorial/claims.md/#rlc-random-linear-combination-claim-aggregation) does not require a specific claim aggregation step, but rather just modifies the sumcheck equation for the next round. Therefore, the Hyrax $\mathcal{P}$ does not need to provide a separate proof of claim aggregation, but instead in its [proof of sumcheck](./proof_of_sumcheck.md), $\mathcal{V}$ takes the random linear combination of the $\widetilde{\text{add}}, \widetilde{\text{mul}},$ or $\widetilde{eq}$ polynomials when computing the expected value of the "oracle query."


## Interpolative Claim Aggregation
For [interpolative claim aggregation](../gkr_tutorial/claims.md/#interpolative-claim-aggregation), however, $\mathcal{P}$ aggregates a set of $m$ claims given a challenge from $\mathcal{V}$, and $\mathcal{P}$ and $\mathcal{V}$ engage in sumcheck over this single claim. When working in the Hyrax proof system, $\mathcal{P}$ must prove, via Pedersen commitments, that it computed the correct aggregated claim. In interpolative claim aggregation, $\mathcal{P}$ computes and sends $\mathcal{V}$ a polynomial [$\widetilde{V}_i \circ \ell(X)$](../gkr_tutorial/claims.md/#interpolative-claim-aggregation). Instead of sending this polynomial, $\mathcal{P}$ sends $\mathcal{V}$ commitments to each of its coefficients. 

Say we are aggregating the claims:
$$
\widetilde{V}_i(g_1^{(1)}, g_2^{(1)}, \dots, g_n^{(1)}) \overset{?}= c_i^{(1)}, \\
\widetilde{V}_i(g_1^{(2)}, g_2^{(2)}, \dots, g_n^{(2)}) \overset{?}= c_i^{(2)}, \\
\vdots  \\
\widetilde{V}_i(g_1^{(m)}, g_2^{(m)}, \dots, g_n^{(m)}) \overset{?}= c_i^{(m)}.
$$

We are aggregating $m$ claims each of $n$ variables -- let the coefficients of $V_i \circ \ell (X)$ be $a_0, a_1, \dots, a_{(m-1)\cdot n}$, and let the commitments to them be $C_{a_0}, C_{a_1}, \dots, C_{a_{(m-1)\cdot n}}.$

$\mathcal{V}$ now has two things to verify: first, that the polynomial was computed by aggregating the given claims, and second, that the prover actually knows the values committed to within the commitments $C_{a_i}.$

By the definition of $V_i \circ \ell (X)$, this means that $V_i \circ \ell (0) = c_i^{(1)}, V_i \circ \ell (1) = c_i^{(2)}, \dots, V_i \circ \ell (m - 1) = c_i^{(m)}.$ It can do this by homomorphically evaluating $V_i \circ \ell (X)$ at these points using the commitments to the coefficients of this polynomial, and checking an additional [proof of equality](hyrax_primitives.md/#proof-of-equality) between that and the commitment to the claim $c_i^{(X + 1)}.$ 

Additionally, $\mathcal{P}$ must prove to $\mathcal{V}$ that it indeed knows the original coefficients $a_0, \dots, a_{(m-1) \cdot n}$ without revealing them. For this, $\mathcal{P}$ and $\mathcal{V}$ can engage in $(m-1) \cdot n + 1$ [proofs of opening](hyrax_primitives.md/#proof-of-opening) for each of the commitments to the coefficients. 

After this, $\mathcal{V}$ can sample the random challenge $r^{\star}$, and evaluates $V_i \circ \ell (r^\star)$ using the commitments to its coefficients (via $\sum{(r^{\star})^i \cdot C_{H_i}}$) to compute the aggregated claim. 