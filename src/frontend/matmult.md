# Matrix Multiplication Layer
A GKR "matrix multiplication" layer is one which takes as input two MLEs $\widetilde{A}, \widetilde{B}$ and outputs a single MLE $\widetilde{C}$ whose evaluations are the flattened matrix multiplication of the evaluations of $\widetilde{A}$ and $\widetilde{B}$. 

Canonic matrix multiplication is defined as the following, given
matrices $A \in \mathbb{F}^{M \times L}, B \in \mathbb{F}^{L \times N}$ resulting in $C \in \mathbb{F}^{M \times N}$:

$$
C_{i, k} = \sum_{j = 0}^{L - 1} A_{i, j} \cdot B_{j, k}
$$

where the above holds for $0 \leq i < M$, $0 \leq k < N$. We instead consider the multilinear extensions of the above matrices, such that 

* $\widetilde{A}: \mathbb{F}^{<2}[X_0, ..., X_{m - 1}, Y_0, ..., Y_{\ell - 1}]$
* $\widetilde{B}: \mathbb{F}^{<2}[Y_0, ..., Y_{\ell - 1}, Z_0, ..., Z_{n - 1}]$
* $\widetilde{C}: \mathbb{F}^{<2}[X_0, ..., X_{m - 1}, Z_0, ..., Z_{n - 1}]$

where $m = \log_2(M), \ell = \log_2(L), n = \log_2(N)$. Then for all $X \in \{0, 1\}^m$ and $Z \in \{0, 1\}^n$ we have

$$
\widetilde{C}(X, Z) = \sum_{Y \in \{0, 1\}^\ell} \widetilde{A}(X, Y) \cdot \widetilde{B}(Y, Z)
$$

(Note that the above is *not* necessarily true for general $X \in \mathbb{F}^m, Z \in \mathbb{F}^n$.) We wish to prove this relationship to the verifier using sumcheck. We can do this using Schwarz-Zippel against $\widetilde{C}$ as follows: rather than checking the above relationship for all $X \in \{0, 1\}^m, Z \in \{0, 1\}^n$, the verifier can sample challenges $r_X \overset{\$}{\leftarrow} \mathbb{F}^m, r_Z \overset{\$}{\leftarrow} \mathbb{F}^n$ and instead check the following relationship:

$$
\widetilde{C}(r_X, r_Z) = \sum_{Y \in \{0, 1\}^\ell} \widetilde{A}(r_X, Y) \cdot \widetilde{B}(Y, r_Z)
$$

This is a sumcheck over just $\ell$ variables, and yields two claims (assume that $Y$ is bound to $r_Y \overset{\$}{\leftarrow} \mathbb{F}^\ell$ during sumcheck) –

* $\widetilde{A}(r_X, r_Y) \overset{?}{=} c_A$
* $\widetilde{B}(r_Y, r_Z) \overset{?}{=} c_B$