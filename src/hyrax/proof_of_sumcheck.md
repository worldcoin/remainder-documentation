# Proof of Sumcheck

A key observation that the Hyrax protocol makes is that the verifier's [sumcheck](../gkr_tutorial/sumcheck.md) "checks," i.e. that $g_i(0) + g_i(1) = g_{i-1}(r_{i-1})$, and the final oracle query, can be modeled as linear equations. 

At each round, $\mathcal{P}$ "sends" $\mathcal{V}$ the univariate $g_i(X)$ by committing to its coefficients using Pedersen scalar commitments. Let $a_{i, 0}, \dots, a_{i, n}$ (to get commitments $C_{a_{i, 0}}, \dots, C_{a_{i, n}}$) be the coefficients for a degree $n$ univariate, where $a_{i, j}$ is the coefficient of the $j$-th degree term. 

Notice that $g_i(0)$ is simply $a_{i, 0}$ and $g_i(1)$ is $\sum_{j}a_{i, j}$. Then $g_i(0) + g_i(1)$ is $2a_{i,0} + a_{i,1} + \dots + a_{i,n}$. We can compute the commitment to this using just the commitments to the coefficients as $2C_{a_{i, 0}} + C_{a_{i, 1}} + \dots + C_{a_{i, n}}$. Similarly, the evaluation $g_{i-1}(r_{i-1})$ can be computed using commitments to the coefficients of $g_{i-1}$ as $\sum_{j}r^jC_{a_{i-1, j}}$. For each intermediate round of sumcheck, we simply have to compute a [proof of equality](./hyrax_primitives.md/#proof-of-equality) between the two commitments $2C_{a_{i, 0}} + \sum_{j}C_{a_{i, j}}$ and $\sum_{k}r^kC_{a_{i-1, k}}$. 

We can formulate the verifier's checks as a matrix vector product where the matrix $M$ contains the linear combination coefficients over the prover's messages, and the vector $\vec{\pi}$ contains the prover's sumcheck messages as coefficients of the univariate polynomial in each round. Let round $i$'s univariate have $d_i$ coefficients. Then, we can write the verifier's checks as such:

$$
\newcommand{\block}[1]{
  \underbrace{\begin{matrix}2 & 1 & \cdots & 1\end{matrix}}_{#1}
}
\newcommand{\rblock}[1]{
  \begin{matrix}-1 & -r_{#1} & \cdots & -r_{#1}^{d_{#1} - 1}\end{matrix}
}
 M = 

  \begin{bmatrix}
  \smash[b]{\block{d_0}} \\ \\ \\
  \smash[b]{\rblock{0}} & \smash[b]{\block{d_1}} \\ \\ \\
  & \smash[b]{\rblock{1}} & \smash[b]{\block{d_2}} \\ \\
  &&& \ddots & \\ \\ 
  &&&& \rblock{n-1} & \block{d_n} \\ \\
  &&&&& \rblock{n}
  \end{bmatrix}

\\

\vec{\pi} =

\begin{bmatrix}
C_{a_{0, 1}} \\ 
C_{a_{0, 2}} \\
\vdots \\
C_{a_{0, d_0}} \\
\vdots \\
C_{a_{n, 1}} \\ 
C_{a_{n, 2}} \\
\vdots \\
C_{a_{n, d_n}} 
\end{bmatrix} 
$$

And therefore,

$$
M \cdot \vec{\pi} = 

\begin{bmatrix}
H \\ 
0 \\
\vdots \\
0  \\ 
?
\end{bmatrix}
$$

Every non-specified entry in the matrix $M$ is $0$, and it has dimension $(n+1) \times \sum_i{d_i}$. $\vec{\pi}$ has dimension $\sum_i{d_i} \times 1$. Its product has dimension $(n + 1) \times 1$. The sum $H$ represents $\mathcal{P}$'s original claim for the sumcheck expression -- the sum of the first univariate $g_0(0) + g_0(1)$ should be equal to the sum, which is what the first row of the matrix multiplied by $\vec{\pi}$ encodes. Note that we can do a [proof of dot product](./hyrax_primitives.md/#proof-of-dot-product) for each of the row of the matrix with $\vec{\pi}$ as the private vector, and each entry in the resultant vector as the claimed dot product.

However, there is a small subtlety: every $d_i$ coefficients in $\vec{\pi}$ must be committed to before the challenge $r_i$ is sampled for sumcheck. Otherwise, $\mathcal{P}$ can modify the commitments to make false claims using its knowledge of $r_i.$ Therefore, $\vec{\pi}$ is committed to incrementally, and after each commitment $r_i$ is sampled. Finally, $\mathcal{V}$ and $\mathcal{P}$ engage in a proof of dot product for every row of the matrix $M$.

## The final "oracle query"

Over here we have encoded all of $\mathcal{V}$'s checks except for the final oracle query. Recall that at the end of sumcheck, $\mathcal{P}$ has [claims on underlying MLEs](../gkr_tutorial/encoding_layers.md/#using-the-equivalence-between-layer-encodings). In the Hyrax universe, $\mathcal{P}$ commits to the claims it has on each of these MLEs, say via the commitments $v_0, \dots, v_k.$ Then $\mathcal{V}$ can combine these commitments linearly to compute the expected value of the original function evaluated at $r_1, \dots, r_n.$ Then, we expand the matrix $M$ to have $k$ additional columns and add the coefficients $\mathcal{V}$ needs to compute the linear combination of $v_0, \dots, v_k$ to the last ($n$th) row of $M$, and $\vec{\pi}$ has $k$ additional entries with the commitments $v_0, \dots, v_n$. Then $\mathcal{V}$ can expect the result of the final dot product to be $0$.

## Example

We provide a minimal example to show how $M$ and $\pi$ are constructed. Assume $\mathcal{P}$ and $\mathcal{V}$ are engaging in sumcheck over the claim that $V_i(g_1, g_2) = H$, and via layerwise encoding, $V_i(z) = \sum_{x_i, y_i, z_i \in \{0, 1\}}\text{add}(z_1, z_2; x_1, x_2; y_1)(V_{i+1}(x_1, x_2) + V_{i+1}(y_1)).$ There are $3$ rounds of sumcheck (for each of the $x$ and $y$) variables, and at the end of sumcheck, $\mathcal{P}$ commits to $V_{i+1}(r_1, r_2)$ and $V_{i+1}(r_3)$ as $v_0$ and $v_1.$ $M, \vec{\pi}$ look like this: 
$$
M = 
\begin{bmatrix}
2 & 1 & 1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0\\
-1 & -r_1 & -r_1^2 & 2 & 1 & 1 & 0 & 0 & 0 & 0 & 0\\
0 & 0 & 0 & -1 & -r_2 & -r_2^2 & 2 & 1 & 1 & 0 & 0\\
0 & 0 & 0 & 0 & 0 & 0 & -1 & -r_3 & -r_3^2 & \widetilde{\text{add}}(g_1, g_2; r_1, r_2; r_3) & \widetilde{\text{add}}(g_1, g_2; r_1, r_2; r_3)
\end{bmatrix}
$$

$$
\vec{\pi} =
\begin{bmatrix}
C_{a_{0, 1}} \\
C_{a_{0, 2}} \\
C_{a_{0, 3}} \\
C_{a_{1, 1}} \\ 
C_{a_{1, 2}} \\
C_{a_{1, 3}} \\
C_{a_{2, 1}} \\ 
C_{a_{2, 2}} \\
C_{a_{2, 3}} \\
v_0 \\ 
v_1
\end{bmatrix}
$$

And their result that $\mathcal{V}$ expects, which it can compute on its own is:

$$
M \cdot \vec{\pi} = 
\begin{bmatrix}
H \\
0 \\
\vdots \\
0
\end{bmatrix}
$$

## Optimizations

There is an optimization specified in the original [Hyrax paper](https://eprint.iacr.org/2017/1132.pdf) which allows us to take the random linear combination of the rows of $M$ and do $n$ proofs of dot product of just size $d_i$ where $d_i$ is the number of coefficients in the univariate of round $i$, rather than $n$ proofs of dot product of size $n \cdot d_i$. We don't go into how to formulate this optimization, but suggest reading the original paper and specifically the "squashing $\mathcal{V}$'s checks" section. We have implemented this optimization in Remainder.