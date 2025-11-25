# Hyrax Polynomial Commitment Scheme
References: [WTS+18](https://eprint.iacr.org/2017/1132.pdf), page 8.

### Prerequisites
- [Committed input layers](./gkr_tutorial/input_layers.md#committed-inputs)
- [Pedersen commitments](./hyrax/pedersen_commitments.md)

As described within the [committed input layers](./gkr_tutorial/input_layers.md#committed-inputs) section, the Hyrax polynomial commitment scheme (PCS) consists of a $\text{Commit}$ and an $\text{Eval}$ phase such that
- During $\text{Commit}$, the prover sends a commitment $\com$ for the input layer MLE $\widetilde{V}_d$.
- After running the rest of the Hyrax IP, we are left with a claim $\widetilde{V}_d(r_1, ..., r_n) \overset{?}{=} c_d$.
- During $\text{Eval}$, the prover sends an evaluation proof $\pi$ showing that $\widetilde{V}_d(r_1, ..., r_n) = c_d$. 

## A Simple Protocol
Note that for an MLE $\widetilde{V}_d(X_0, \dots, X_n)$ with coefficients in the Lagrange basis $a_0, \dots, a_{2^{n} - 1},$ the evaluation $\widetilde{V}_d(r_1, ..., r_n)$ can be represented by the following inner product:

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

In the future, we note that the latter vector is simply a tensor product of the smaller vectors $
\begin{bmatrix}
1 - r_i & r_i
\end{bmatrix}
$, so we represent it as the tensor product $\otimes_{i = 0}^{n}(1 - r_i, r_i).$ 

Indeed, this above observation allows us to create a very simple PCS with the help of [proof-of-dot-product](./hyrax/hyrax_primitives.md#proof-of-dot-product). In particular, 
- During the $\text{KeyGen}$ phase, we produce generators $g_1, ..., g_{2^n}, h$. 
- During the $\text{Commit}$ phase, the prover generates a blinding factor $s_0$ and computes the commitment
$$
\com = s_0 \cdot h + \sum_{j = 1}^{2^n} a_j \cdot g_j
$$
- During the $\text{Eval}$ phase, the prover and verifier engage in a proof-of-dot-product, where
    - The public vector is $\otimes_{i = 0}^{n}(1 - r_i, r_i)$ 
    - The committed vector is $\com$
    - The committed inner product value is $c_d \cdot g_1 + s_1 \cdot h$

We note that the size of the commitment is $O(1)$ since the commitment is a single group element. However, both the verifier runtime and communication cost are $O(2^n)$ (as proof-of-dot-product incurs costs which are linear in the size of the vectors), which is less than ideal. Can we do better?

## Vector-Matrix-Vector Product Observation
(Reader's note: the construction described here is identical to that in the [Ligero PCS](./gkr_tutorial/ligero_input.md#vector-matrix-vector-product-observation) section.) Rather than simply linearly arranging the coefficients of $\widetilde{V}_d$ as above, we can instead arrange them in a square matrix (for now, assume that $n$ is even) of size $2^{n/2} \times 2^{n/2}$ by enumerating the coefficients in row-major order:

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
We assume that $\text{KeyGen}$ has given the prover and verifier a set of common generators $g_1, ..., g_{2^{n / 2}}, h_1, ..., h_{2^{n / 2}}$. The prover generates random blinding factors $s_1, ..., s_{2^{n / 2}}$ and computes the following during the commit phase:
$$
\com =
\begin{bmatrix}
\com_1\\
\com_2\\
\vdots \\
\com_{2^{n / 2}}
\end{bmatrix}
$$
where $\com_k = s_k \cdot h_k + \sum_{j = 1}^{2^{n / 2}} a_{ 2^{n / 2} \cdot (k - 1) + j} \cdot g_{2^{n / 2} \cdot (k - 1) + j}$ is a Pedersen commitment to the $k$'th row of $M$. 
where $\text{com}_k = s_k \cdot h_k + \sum_{j = 1}^{2^{n / 2}} a_{ 2^{n / 2} \cdot (k - 1) + j} \cdot g_{2^{n / 2} \cdot (k - 1) + j}$ is a Pedersen commitment to the $k$'th row of $M$. The prover sends $\text{com}$ to the verifier.

## Evaluation Phase
The prover sends $\com$ to the verifier, who computes a "squashed" commitment
The verifier computes a "squashed" commitment
$$
\text{squashed\_com} = \sum_{k = 1}^{2^{n / 2}} L_k \cdot \com_k
$$
Note that the above is now a blinded Pedersen vector commitment to the vector-matrix product $L \cdot M$. The verifier can do the above in $O(2^{n / 2})$ group operations. Finally, the prover and verifier execute a proof-of-dot-product with the following:
- The public vector is $R$
- The committed vector is $\text{squashed\_comm}$
- The committed inner product value is $c_d \cdot g_1 + s_1 \cdot h$

Note that unlike the simple protocol, this proof-of-dot-product is invoked over two vectors of length $2^{n / 2}$ rather than $2^n$. The final evaluation proof size is thus $O(2^{n / 2})$ and the final verifier cost is also $O(2^{n / 2})$, although the commitment size is now increased to $O(2^{n / 2})$ from $O(1)$ earlier. 

## Costs
Assume that the prover is committing to a multilinear polynomial in $n$ variables. Assume that $n$ is even, and that $g_1, ..., g_{2^{n / 2}}, h \in \mathbb{G}$ are our generators (we implicitly arrange down the polynomial's coefficients into a square matrix, although other matrix shapes are equally valid and result in different costs/proof sizes). For simplicity, assume that computing a multi-scalar multiplication over $k$ generators costs $O(k \log_2 \lvert \mathbb{F} \rvert)$ (this can be improved with e.g. Pippenger's, of course).
### Prover Cost
- During the commitment phase, the prover computes Pedersen vector commitments to each row of $M$. Each Pedersen vector commitment is an MSM of length $2^{n / 2}$, and thus the total runtime is $O(2^{n / 2} \cdot 2^{n / 2} \log_2 \lvert \mathbb{F} \rvert)$ group operations.
- During the evaluation phase, the prover computes a proof-of-dot-product over $\text{squashed\_com}$ and $R$. This requires roughly $O(2^{n / 2})$ group operations. 
- The prover's total cost is thus $O(2^n \log_2 \lvert \mathbb{F} \rvert + 2^{n / 2})$ group operations.
### Proof Size
- The commitment size is one Pedersen vector commitment per row of the matrix, i.e. $O(2^{n / 2})$ group elements. 
- The evaluation proof is a proof-of-dot-product where the vector is length $O(2^{n / 2})$, resulting in $O(2^{n / 2})$ group elements being communicated.
### Verifier Cost
- During the commitment phase, the verifier receives row commitments $\text{com}_1, ..., \text{com}_{2^{n / 2}}$.
- During the evaluation phase, the verifier first computes $\text{squashed\_com}$ by itself, which requires computing a single MSM of length $2^{n / 2}$. This costs $O(2^{n / 2} \log_2 \lvert \mathbb{F} \rvert)$ group operations.
- Next, the verifier engages in verifying a proof-of-dot-product with the prover between $\text{squashed\_com}$ and $R$. This costs roughly $O(2^{n / 2})$ group operations.
- The verifier's total cost is thus $O(2^{n / 2} \cdot (\log_2 \lvert \mathbb{F} \rvert + 1))$. 