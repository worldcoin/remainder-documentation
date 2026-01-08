# Fiat-Shamir: Creating Non-interactive GKR proofs
As described [earlier](../gkr_background/encoding_layers.md), both sumcheck and GKR are _interactive_ proofs with many rounds of messages exchanged between a prover and a verifier. However, Remainder is built as a non-interactive proof system, where the transformation we apply is the [Fiat-Shamir](https://mit6875.github.io/PAPERS/Fiat-Shamir.pdf) heuristic, with every prover message being "absorbed" into the state of a hash function with a sponge mode (Poseidon instantiated over the BN-254 scalar field, in our case) and every verifier message being "squeezed" from that same hash sponge.

We note that both sumcheck and GKR have been [proven](https://eprint.iacr.org/2018/1004.pdf) _round-by-round sound_, i.e. despite being a non-constant-round interactive protocol, can still achieve soundness in the random oracle model when instantiated with a hash function believed to be indistinguishable from a random oracle. 

## Sponge Functions as Random Oracles
The sponge construction transforms a fixed-length input, fixed-length output permutation function $f$ into a variable-length input, variable-length output function $F$ which can be shown to behave indistinguishably from a random oracle given that the fixed-length permutation function itself is indistinguishable from an ideal random permutation. As mentioned earlier, Remainder uses the Poseidon sponge (i.e. a standard sponge construction instantiated over the Poseidon fixed-length permutation), and since we assume that the Poseidon permutation is indeed indistinguishable from an ideal random permutation, we only require security in the random oracle model. 

## Fiat-Shamir for Sumcheck
We describe the Fiat-Shamir transformation for the [sumcheck](../gkr_background/sumcheck.md) sub-protocol as an example. As before, let
$$
H \overset{?}= \sum_{x_i \in \{0, 1\}}f(x_1, \dots, x_n)
$$
be the statement over which we are running sumcheck, i.e. the prover claims that $H$ is the sum for a multi-variate polynomial $f$, and the verifier wishes to check this. Recall that in the interactive version of sumcheck, the prover first computes the univariate function

$$
f_1(X) = \sum_{x_2, ..., x_n \in \{0, 1\}^{n - 1}} f(X, x_2, ..., x_n)
$$

and sends its coefficients to the verifier. The verifier then samples a random challenge $r_1 \overset{\$}{\leftarrow} \mathbb{F}$ and sends this back to the prover. Let $\mathcal{H}$ be the sponge function instantiation for the random oracle. The prover instead invokes the following:

$$
\mathcal{H}.\text{absorb}(f_1(X)) \\ \quad \\
r_1 \leftarrow \mathcal{H}.\text{squeeze}()
$$

where $\text{absorb}$ and $\text{squeeze}$ invoke the corresponding sponge functionality over $\mathcal{H}$. The rest of the sumcheck rounds proceed in a similar fashion. In the $i$'th round, the prover computes

$$
f_i(X) = \sum_{x_{i + 1}, ..., x_n \in \{0, 1\}^{n - i - 1}} f(r_1, ..., r_{i - 1}, X, x_{i + 1}, ..., x_n)
$$

and invokes the sponge function via

$$
\mathcal{H}.\text{absorb}(f_i(X)) \\ \quad \\
r_i \leftarrow \mathcal{H}.\text{squeeze}()
$$

after receiving $r_n$, in the interactive version of the protocol the prover would then send the claim $c \overset{?}{=} f(r_1, ..., r_n)$ to the verifier. Instead, we again call $\text{absorb}$ on this value:

$$
\mathcal{H}.\text{absorb}(c)
$$

In other words, whenever the prover sends a message to the verifier in the interactive version of the protocol, they instead $\text{absorb}$ that message into the sponge function, and whenever the verifier sends a challenge to the prover in the interactive protocol, the prover instead calls $\text{squeeze}$ on the sponge function to sample the challenge instead. 