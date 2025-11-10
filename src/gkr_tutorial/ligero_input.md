# Ligero Polynomial Commitment Scheme
References: [GLS+21](https://eprint.iacr.org/2021/1043.pdf), page 46, [AER24](https://eprint.iacr.org/2024/1399.pdf).

### Prerequisites
- [Committed input layers](./gkr_tutorial/input_layers.md#committed-inputs)

As described within the [committed input layers](./gkr_tutorial/input_layers.md#committed-inputs) section, the Ligero polynomial commitment scheme (PCS) consists of a $\text{Commit}$ and an $\text{Eval}$ phase such that
- During $\text{Commit}$, the prover sends a commitment $com$ for the input layer MLE $\widetilde{V}_d$.
- After running the rest of the GKR claim reduction process, we are left with a claim $\widetilde{V}_d(r_1, ..., r_n) \overset{?}{=} c_d$.
- During $\text{Eval}$, the prover sends an evaluation proof $\pi$ showing that $\widetilde{V}_d(r_1, ..., r_n) = c_d$. 

## Short Introduction to Reed-Solomon Codes
We provide a brief introduction to Reed-Solomon codes, as these are prominently featured within the Ligero construction. First, we describe a few properties of general linear codes which will be useful:
- An $[n, k, l]_p$-linear code $\mathcal{C}$ is a subspace $\mathcal{C} \subseteq \mathbb{F}^n$ of dimension $k$ (i.e. $\mathcal{C}$ is spanned by $k$ linearly independent basis vectors of length $n$ each) where $u \in \mathcal{C}$ implies that $\lvert u \rvert_0 \geq l$ for all nonzero codewords $u$.
- We define the Hamming weight $\lvert u \rvert_0$ is the number of nonzero entries in $u$.
- For all distinct $u \neq v \in \mathcal{C}$ we have that $\lvert u - v \rvert_0 \geq l$, since the difference of two codewords is itself a codeword.
- The encoding step of a linear code can be described by a matrix-vector multiplication $Gx$, where $x \in \mathbb{F}^k$ is the unencoded message and $G \in \mathbb{F}^{n \times k}$ is the code's generator matrix. For simplicity we will just use $\text{Enc}$ as the encode function notation.
- We call $\rho = \frac{k}{n}$ the _rate_ of the code, as it describes (the inverse of) how much redundancy the code has. $\rho^{-1} = \frac{n}{k}$ is then the "expansion factor", or how much larger the codeword is than the original message.

Next, consider the set of (univariate) polynomials $\mathbb{F}^{<d}[X]$ of degree $<d$ and a domain $\mathcal{L} \subseteq \mathbb{F}$. Let $f \in \mathbb{F}^d$.
- Let $\bar{f}$ be the restriction of $f$ to $\mathcal{L} \mapsto \mathbb{F}$. Note that $\bar{f}$ can be treated as just a vector of length $\lvert \mathcal{L} \rvert$ by taking its evaluations $\{f(x_1), f(x_2), ..., f(x_n) \mid x_i \in \mathcal{L}\}$.
- We define a Reed-Solomon code $\text{RS}[\mathbb{F}, \mathcal{L}, d] = \{\bar{f}: \mathcal{L} \mapsto \mathbb{F} \mid f \in \mathbb{F}^{<d}[X]\}$, i.e. all the restrictions of $f$ to evaluations over $\mathcal{L}$ for degree $<d$ functions $f$.
- If we let $d < \lvert \mathcal{L} \rvert$ and call the evaluation domain size $n$, then an RS code is just an $[n, d, l = (n - d + 1)]_p$ linear code (codewords are the evaluations of $f$ over $\mathcal{L}$, and the un-encoded messages are just polynomials of degree $<d$, which can be specified with $d$ coefficients).
- Note that two polynomials of degree $\leq d - 1$ agree on at most $d - 1$ points, and thus the Hamming distance between codewords is $n - (d - 1) = n - d + 1$.

The last property of Reed-Solomon codes is extremely useful for the purposes of code-based PCSs such as Ligero and FRI -- if we have that $n = 2d$, for example, then for two polynomials $f, g \in \mathbb{F}^{<d}[X]$ where $f \neq g$ we have that $\lvert \text{Enc}(f) - \text{Enc}(g) \rvert_0 \geq d + 1$, which is over half of the evaluation domain. This intuitively makes it very easy for a verifier to catch a prover who commits to one polynomial's codeword and attempts to evaluate using another's, since sampling even a single random point within $\mathcal{L}$ will reveal the difference with probability $> \frac{1}{2}$. 

## Vector-Matrix-Vector Product Observation
(Reader's note: the construction described here is identical to that in the [Hyrax PCS](../hyrax_pcs.md#vector-matrix-vector-product-observation) section.) Let our input layer MLE $\widetilde{V}_d(X_1, ..., X_n)$ have evaluations $a_1, ..., a_{2^n}$ over $X_1, ..., X_n \in \{0, 1\}^n$ (for example, $a_1 = \widetilde{V}_d(0, ..., 0)$). 

As described in the introduction above, the prover is trying to show that $\widetilde{V}_d(r_1, ..., r_n) = c_d$. As described in the Hyrax PCS section, one way to compute the evaluation is as follows:

$$
\begin{bmatrix}
a_1 & a_2 & \dots \ & a_{2^n}
\end{bmatrix}

\cdot

\begin{bmatrix}
(1-r_1) \cdot (1-r_2) \cdot ... \cdot (1-r_n) \\
(1-r_1) \cdot (1-r_2) \cdot ... \cdot r_n \\
\vdots \\
r_1 \cdot r_2 \cdot ... \cdot r_n
\end{bmatrix}
$$

The column vector on the right can be viewed as the tensor product $\otimes_{i = 1}^n (1 - r_i, r_i)$ and we will use this shorthand going forward. Just this observation, however, is not enough to motivate our description of Ligero PCS. Instead, we consider an alternative formulation for the evaluation $\widetilde{V}_d(r_1, ..., r_n)$.

Rather than simply linearly arranging the coefficients of $\widetilde{V}_d$ as above, we can instead arrange them in a square matrix (for now, assume that $n$ is even) of size $2^{n/2} \times 2^{n/2}$ by enumerating the coefficients in row-major order:

$$
M = \begin{bmatrix}
a_1 & a_2 & \dots & a_{2^{n / 2}}\\
a_{2^{n / 2} + 1} & a_{2^{n/2} + 2} & \dots &  a_{2^{n / 2 + 1}}\\
\vdots & \vdots & \ddots & \vdots \\
a_{2^n - 2^{n / 2}} & a_{2^n - 2^{n / 2} + 1} & \dots & a_{2^n}
\end{bmatrix}
$$

Given the matrix formulation of $\widetilde{V}_d$ above, we can write the evaluation of $\widetilde{V}_d(r_1, \dots, r_n)$ as the following vector-matrix-vector product:

$$
\bigg[\otimes_{i = n / 2 + 1}^n(1 - r_i, r_i) \bigg] \cdot
\begin{bmatrix}
a_1 & a_2 & \dots & a_{2^{n / 2}}\\
a_{2^{n / 2} + 1} & a_{2^{n/2} + 2} & \dots &  a_{2^{n / 2 + 1}}\\
\vdots & \vdots & \ddots & \vdots \\
a_{2^n - 2^{n / 2} + 1} & a_{2^n - 2^{n / 2} + 2} & \dots & a_{2^n}
\end{bmatrix} \cdot
\bigg[ \otimes_{i = 1}^{n / 2}(1 - r_i, r_i) \bigg]^\top
$$

We denote the left vector as $L \in \mathbb{F}^{2^{n / 2}}$ and the right vector as $R \in \mathbb{F}^{2^{n / 2}}$. This allows us to create the following PCS:

## Commitment Phase
The commitment phase of Ligero works as follows:

Let $M_i$ be the $i$'th row of $M$, $1 \leq i \leq 2^{n / 2}$. Recall that $M_i \in \mathbb{F}^{2^{n / 2}}$ since $M$ is a square matrix.
- First, the prover treats the values within $M_i$ as the (monomial basis, i.e. usual) coefficients of a degree-$2^{n / 2} - 1$ univariate polynomial. They compute $\tilde{M}_i = \text{Enc}(M_i)$ using a Reed-Solomon encoding function. Let $\rho$ be the code rate; we then have that $\tilde{M} \in \mathbb{F}^{2^{n / 2} \times \rho^{-1} 2^{n / 2}}$. 
- The encoded matrix now looks like the following:
$$
\tilde{M} = 
\begin{bmatrix}
\text{ ------ } \text{Enc}(M_1) \text{ ------ } \\
\text{ ------ } \text{Enc}(M_2) \text{ ------ } \\
\vdots \\
\text{ ----- } \text{Enc}(M_{2^{n / 2}}) \text{ ----- } \\
\end{bmatrix}
$$

The prover commits to $\tilde{M}$ as follows:
- Using a cryptographic hash function $H: \mathbb{F}^* \mapsto \mathbb{F}$, the prover first computes a hash over each column:

$$
\com_j = H(\tilde{M}_{1, j}, ..., \tilde{M}_{\rho^{-1} 2^{n / 2}, j})
$$

- Next, the prover takes the vector of column-wise commitments and computes a Merkle tree using those commitments as the leaves. In other words, the bottom layer of the tree is $[\com_1, ..., \com_{2^{n / 2}}]$, with pairs of leaves being hashed, and the root of the tree $\text{root}_{\tilde{M}} = \text{Merkleize}([\com_1, ..., \com_{2^{n / 2}}])$ is the commitment.
- The (interactive) prover sends $\text{root}$ to the verifier. Note that with this commitment setup, the verifier is able to "open" any _column_ of $\tilde{M}$ and ensure that it is consistent with the commitment $\text{root}_{\tilde{M}}$. 

## Evaluation Phase
The prover wishes to show that $L \cdot M \cdot R = c_d$. It does so by first computing $L \cdot M \in \mathbb{F}^{2^{n / 2}}$ and sends this to the (interactive) verifier (note that the prover is sending product of $L$ against the _unencoded_ $M$). Since the verifier doesn't (yet) trust this value, we'll denote its view of this prover message as $U \overset{?}{=} L \cdot M$. 

The verifier asserts that $U \cdot R = c_d$. If the prover is honest and $U = L \cdot M$ then this proves that the evaluation was correct.

The verifier then computes $\tilde{U} = \text{Enc}(U)$, with $\tilde{U} \in \mathbb{F}^{\rho^{-1} 2^{n / 2}}$. To ensure that the prover computed $U$ correctly, it will check random values in $\tilde{U}$ against $L \cdot \tilde{M}$. 
- Note that because $\text{Enc}$ is a linear operation, we have that $\text{Enc}(L \cdot M) = L \cdot \text{Enc}(M)$, where $\text{Enc}(M)$ is the row-wise encoding as described earlier (check this for yourself -- use the intuition that Reed-Solomon encoding is just polynomial evaluation over a domain)

The verifier picks a set of indices $j \in \mathcal{J}$ and "opens" those columns of $\tilde{M}$. For each $j$, the prover sends over $\tilde{M}_{\cdot, j}$, as well as a Merkle path for $\com_j$ against $\text{root}_{\tilde{M}}$. 

The verifier checks that $H(\tilde{M}_{\cdot, j}) = \com_j$, and verifies the Merkle path from $\com_j$ to the $\text{root}_{\tilde{M}}$ it received during the commit phase.

The verifier is now convinced that the columns which the prover sent over are columns of the $\tilde{M}$ which was committed to during the commitment phase. 

Finally, the verifier checks that $L \cdot \tilde{M}_{\cdot, j} = \tilde{U}_j$. This last check ensures that the prover sent $\tilde{U}$ honestly -- if they attempted to cheat by sending $L \cdot M'$ for some $M' \neq M$, we have that each row of $\text{Enc}(M)$ would differ from each row of $\text{Enc}(M')$ in at least $d(\rho^{-1} - 1)$ coordinates (as mentioned earlier, we generally have $\rho^{-1} \geq 2$), and therefore WHP (using a result from [AER24](https://eprint.iacr.org/2024/1399.pdf)), that $\tilde{U}$ (the honest $L \cdot \text{Enc}(M)$) differs from $\tilde{U'}$ (the dishonest $L \cdot \text{Enc}(M')$) in at least $d(\rho^{-1} - 1)$ coordinates as well.

With $q$ queries, the verifier catches a cheating prover at least

$$
1 - (1 - d(\rho^{-1} - 1))^q
$$

proportion of the time.