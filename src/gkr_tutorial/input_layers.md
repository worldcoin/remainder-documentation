# GKR Input Layer
We have now seen that a GKR interactive proof begins with the prover making a [claim](./claims.md) $\widetilde{V}_0(r^{(0)}_1, ..., r^{(0)}_n) = c_0$ on the layered circuit's output layer $\widetilde{V}_0$ and [reducing](./encoding_layers.md#using-the-equivalence-between-layer-encodings) this claim via [sumcheck](./sumcheck.md) and [claim aggregation](./claims.md#claim-aggregation) to claims on layers closer to the circuit's input layer, e.g. $\widetilde{V}_1(r^{(1)}_1, ..., r^{(1)}_n) = c_1$. 

At the end of this process, we should be left with only claims on input layer(s), e.g.

$$
\widetilde{V}_d(r^{(d, 1)}_1, ..., r^{(d, 1)}_n) = c^{(1)}_d \\
\widetilde{V}_d(r^{(d, 2)}_1, ..., r^{(d, 2)}_n) = c^{(2)}_d \\
\vdots \\
\widetilde{V}_d(r^{(d, m)}_1, ..., r^{(d, m)}_n) = c^{(m)}_d
$$

These claims are optionally aggregated via [interpolative claim aggregation](./claims.md#interpolative-claim-aggregation) (note that RLC claim aggregation does not work for input layer claims) into a single claim

$$
\widetilde{V}_d(r^\star_1, ..., r^\star_n) = c^\star_d
$$

which the verifier must check on its own, optionally with help from the prover. There are several types of input layers, and we describe the methodology for each.

## Public Inputs
Public input layers are circuit inputs where the prover sends the values to the verifier in the clear. In particular, this means that the verifier knows the full set of evaluations of $\widetilde{V}_d$ over $\{0, 1\}^n$ and can evaluate the MLE on its own. Thus:
- Before the prover generates the output layer claim challenges ($r^{(0)}_1, ..., r^{(0)}_n$ above), they send these evaluations to the verifier by absorbing them into the transcript. 
- When the verifier is ready to check the claim $\widetilde{V}_d(r^\star_1, ..., r^\star_n) = c^\star_d$, they use the aforementioned evaluations to directly evaluate $\widetilde{V}_d$ at $r^\star_1, ..., r^\star_n$ and check that the evaluation is indeed the claimed $c^\star_d$. 

## Committed Inputs
Committed input layers are circuit inputs where the prover sends a commitment to the values (generally as a polynomial commitment). Committed inputs are not directly revealed to the verifier (although they may leak information unless a _zero-knowledge_ polynomial commitment scheme, like Hyrax, is used), and thus the prover must additionally help the verifier when they wish to check the input claim $\widetilde{V}_d(r^\star_1, ..., r^\star_n) = c^\star_d$ by providing an _evaluation proof_, which roughly shows that the polynomial which the prover committed to earlier actually evaluates to $c^\star_d$ at the evaluation point $r^\star_1, ..., r^\star_n$.

(See [KZG10](https://link.springer.com/chapter/10.1007/978-3-642-17373-8_11#preview), page 6, and [Tha24](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.pdf), page 188 for more details). Let $\lambda \in \mathbb{N}$ be the security parameter. Let $\widetilde{V}_d \in \mathbb{F}^{<2}[X_1, ..., X_n]$ be the MLE which the prover wishes to commit to. Let $r^\star_1, ..., r^\star_n \in \mathbb{F}^n$ be the evaluation point, and let $c^\star_d$ be the claimed value. Roughly speaking, a polynomial commitment scheme (PCS) consists of the following four functions:
- $\text{KeyGen}: \lambda \mapsto \{\text{ck}, \text{vk}\}$. $\text{ck}$ here is the commitment key which the prover has access to while committing and generating evaluation proofs, and $\text{vk}$ here is the verification key which the verifier has access to while checking an evaluation proof. This function takes in a single security parameter $\lambda$ such that the resulting commitment scheme has roughly $\lambda$ bits of soundness.
- $\text{Commit}: \text{ck}, \widetilde{V}_d \mapsto \com$. The $\text{Commit}$ function takes in an MLE (for our purposes; in general this can be a univariate or multivariate polynomial of higher degree) and generates a commitment to be sent to the verifier.
- $\text{Eval}: \text{ck}, \com, r^\star_1, ..., r^\star_n, c^\star_d \mapsto \pi$. The $\text{Eval}$ function takes in an evaluation point $r^\star_1, ..., r^\star_n \in \mathbb{F}^n$ and produces an evaluation proof $\pi$ that the original polynomial which was committed to in $\com$ actually evaluates to $c^\star_d$. Note that the verifier uses $\text{vk}$ to check the evaluation proof $\pi$.
- $\text{Open}: \com, f \in \mathbb{F}^{<2}[X_1, ..., X_n] \mapsto \{0, 1\}$. The $\text{Open}$ function takes in a commitment and an MLE $f$ and outputs whether that MLE is the one committed to by $\com$, i.e. whether $f = \widetilde{V}_d$.

In addition to the above, a commitment scheme must satisfy _hiding_ and _evaluation binding_.
- Hiding implies that given a commitment $\com$ and fewer than $2^n$ evaluation pairs, an adversary cannot determine the evaluation $\widetilde{V}_d(h_1, ..., h_n)$ for a point $h_1, ..., h_d$ not in the set of evaluation pairs.
- Evaluation binding implies that given an evaluation point $r^\star_1, ..., r^\star_n$ and a claimed value $c^\star_d \neq \widetilde{V}_d(r^\star_1, ..., r^\star_n)$, a prover should be able to produce an accepting evaluation proof $\pi$ for generated $\com$ with negligible probability.

In general, we run $\text{KeyGen}$ once and distribute the resulting $\text{ck}, \text{vk}$ to the prover and verifier, and focus on the $\text{Commit}$ and $\text{Eval}$ functions. During the interactive GKR protocol, the prover and verifier do the following:
- The prover invokes the $\text{Commit}$ functionality on $\widetilde{V}_d$ and sends the resulting $\com$ to the verifier. They send this value to the verifier before any claims on output layers (including challenges) are generated. Note that this takes the place of the prover sending the evaluations of $\widetilde{V}_d$ in the [public inputs](#public-inputs) section above.
- After the prover has sent all circuit inputs to the verifier in either committed or direct evaluation form, the verifier generates the output claim challenges and the prover and verifier engage in the GKR claim reduction protocols until we're left with a single claim $\widetilde{V}_d(r^\star_1, ..., r^\star_n) = c^\star_d$. 
- The prover then invokes the $\text{Eval}$ functionality on $\com$ and the aforementioned $r^\star_1, ..., r^\star_n, c^\star_d$ values to produce evaluation proof $\pi$, which the verifier receives and checks.

Remainder's GKR prover uses a _non-ZK_ version of the PCS implicit in [AHIV17](https://eprint.iacr.org/2022/1608.pdf) (also explicitly described in the [GLS+21](https://eprint.iacr.org/2021/1043.pdf) paper as `Shockwave`), which we briefly detail in our documentation's [Ligero PCS](./ligero_input.md) page. Remainder's Hyrax prover uses the _ZK_ PCS explicitly described within [WTS+17](https://eprint.iacr.org/2017/1132.pdf), which we briefly detail in our documentation's [Hyrax PCS](../hyrax_pcs.md) page.

## "Fiat-Shamir" Inputs
A third type of circuit "input" is that of a "Fiat-Shamir" challenge value. These inputs are different from the others in the sense that the prover does not supply them at all, but rather the (interactive) verifier sends them after the prover has committed to all other input values. These values are used when the circuit itself is computing a function which requires a random challenge (see [LogUp](../frontend/lookup.md), e.g., for one usage of such challenges). In general, claims on these layers are checked via the following:
- First, as mentioned, the (interactive) prover sends all _other_ inputs (both public and committed) to the verifier.
- Next, the verifier sends random values (we can view these as the evaluations of $\widetilde{V}_d$ over $\{0, 1\}^n$) to the prover as challenge values.
- When the verifier needs to check a claim $\widetilde{V}_d(r^\star_1, ..., r^\star_n) = c^\star_d$ on the Fiat-Shamir input layer, it can do so by simply referencing the evaluations it generated earlier to evaluate $\widetilde{V}_d$ at $r^\star_1, ..., r^\star_n$ and ensure that the evaluation is actually $c^\star_d$, exactly as is the case for public inputs.