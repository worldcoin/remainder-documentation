# Hyrax Polynomial Commitment Scheme
As mentioned with [Pedersen Commitments](./hyrax/pedersen_commitments.md), commitment schemes involve a commitment phase, and an evaluation phase. The commitment phase is where $\mathcal{P}$ "binds" itself to a particular input, and the evaluation phase is where $\mathcal{P}$ and $\mathcal{V}$ engage in a protocol to show that this polynomial evaluated at a particular point is a certain claimed value.

At the end of the Hyrax IP, we end with a claim on the input MLE $\widetilde{V}_d(r_0, \dots, r_n) \overset{?}= c.$ This is when $\mathcal{P}$ and $\mathcal{V}$ use $\mathcal{P}$'s original commitment to $\widetilde{V}_d$ to evaluate it at the point $r_0, \dots, r_n.$ First, we show how to cleverly commit to $\widetilde{V}_d$ to perform this evaluation phase. 

Note that for an MLE $\widetilde{V}_d(x_0, \dots, x_n)$ with coefficients in the Lagrange basis $a_0, \dots, a_{2^{n} - 1},$ the evaluation $\widetilde{V}_d(r_0, \dots, r_n)$ can be represented by the following dot product:

$$
\begin{bmatrix}
a_0 & a_1 & \dots \ & a_{2^{n} - 1}
\end{bmatrix} 

\cdot

\begin{bmatrix}
(1-r_0) \cdot (1-r_1) \cdot ... \cdot (1-r_n) \\
(1-r_0) \cdot (1-r_1) \cdot ... \cdot (r_n) \\
\vdots \\
r_0 \cdot r_1 \cdot ... \cdot r_n
\end{bmatrix}
$$

In the future, we note that the latter vector is simply a tensor product of the smaller vectors $
\begin{bmatrix}
1 - r_i & r_i
\end{bmatrix}
$, so we represent it as the tensor product $\otimes_{i = 0}^{n}(1 - r_i, r_i).$ 

## Commitment Phase

Note that at this point, for evaluation, $\mathcal{P}$ and $\mathcal{V}$ can engage in a simple [proof of dot product](./hyrax/hyrax_primitives.md/#proof-of-dot-product) for evaluation proofs. However, this commitment size is linear in the size of $\widetilde{V}_d$, and we can achieve a commitment size $\sqrt{2^n}$ instead if we formulate $\widetilde{V}_d$ as a $2^{n/2} \times 2^{n/2}$ matrix by enumerating the coefficients in column-major order.

$$
\begin{bmatrix}
a_0 & a_{2^{n/2}} & \dots & a_{2^{(2n - 1)/2}}\\
a_1 & a_{2^{n/2} + 1} & \dots &  a_{2^{(2n - 1)/2} + 1}\\
\vdots & \vdots & \dots & \vdots \\
a_{2^{n/2} - 1} & a_{2^{n/2 + 1} - 1} & \dots & a_{2^{n} - 1}
\end{bmatrix}
$$

## Evaluation Phase

Note that given the matrix formulation of $\widetilde{V}_d$ above, we can write the evaluation of $\widetilde{V}_d(r_0, \dots, r_n)$ as the following tensor product:

$$
\otimes_{i = 0}^{n/2 - 1}(1 - r_i, r_i) \times
\begin{bmatrix}
a_0 & a_{2^{n/2}} & \dots & a_{2^{(2n - 1)/2}}\\
a_1 & a_{2^{n/2} + 1} & \dots &  a_{2^{(2n - 1)/2} + 1}\\
\vdots & \vdots & \dots & \vdots \\
a_{2^{n/2} - 1} & a_{2^{n/2 + 1} - 1} & \dots & a_{2^{n} - 1}
\end{bmatrix} \times
\otimes_{i = n/2}^{n}(1 - r_i, r_i)
$$