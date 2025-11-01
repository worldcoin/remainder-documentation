# Multilinear Extensions (MLEs)

Let $f(x_1, x_2, \dots, x_n)$ be a function $\{0, 1\}^n \to \mathbb{F}$ with coefficients $a_i \in \mathbb{F}$. Its multilinear extension $\widetilde{f}(x_1, \dots, x_n)$ is defined such that $\widetilde{f}$ is linear in each $x_j$ and $x_j \in \mathbb{F}$, such that $\widetilde{f}(x) = f(x) \quad\!\!\!\forall\quad\!\!\!\!\! x \in \{0, 1\}^n$.

In order to explicitly formulate $\widetilde{f}$ in terms of $f$, let us define the following indicator function: 

$$
    \eq(x; z) = 
\begin{cases}
    1 ,& \text{if } x = z \\
    0,              & \text{otherwise}.
\end{cases}
$$

Then, we can see that if $\eq(x, z)$ were linear in the $x$ variables, i.e., we could define a multilinear extension for $\eq$, called $\widetilde{\eq}$, we can define $$\widetilde{f}(x_1, \dots, x_n) = \sum_{z_i \in \{0, 1\}}{\widetilde{eq}(x; z) \cdot f(z_1, \dots, z_n)}$$ where $z_i$ are the bits of $z$. 

Fortunately, $\eq(x; z): \{0, 1\}^{2n} \to \{0, 1\}$ has an explicit formula which is linear in each of $x_i$, or the bits of $x$. Intuitively, if $x = z$, then each of its bits must be equal. In boolean logic, this is the same thing as saying $(x_i = z_i = 0)$ OR $(x_i = z_i = 1)$ for all of the bits $i$ (which is an AND over all of the bits $i$). 

When our inputs $x_i, z_i \in \{0, 1\}$ this statement can be expressed as the following product: $$\prod_{i = 1}^n{(1 - x_i)(1 - z_i) + x_iz_i}.$$ Taking the multilinear extension of $\eq$ simply means allowing for inputs $x_i, z_i \in \mathbb{F}$, because the polynomial is already linear in each variable. Because when $x_i, z_i \in \{0, 1\}$, $\eq(x; z) = \widetilde{\eq}(x; z)$, we have the multilinear extension $\widetilde{\eq}(x; z).$

Another property of multilinear extensions is that they are uniquely defined. I.e., $\sum_{z_i \in \{0, 1\}}{\widetilde{\eq}(x; z) \cdot f(z_1, \dots, z_n)}$ is the *only* formulation of $\widetilde{f},$ and any other formulation would be equivalent to this one.

## Example
Let $f(x_1, x_2, x_3) =2x_1^2x_3 + 4x_2x_3^3 + 3x_1x_2^2x_3 + 5x_1 + 6x_2 + 3.$ Let us first build a table of evaluations of $f$ for $x_i \in \{0, 1\}:$

| $(x_1, x_2, x_3)$ | $f(x_1, x_2, x_3)$ |
| ---- | -- |
|$(0, 0, 0)$ | $3$ |
|$(0, 0, 1)$ | $3$ |
|$(0, 1, 0)$ | $9$ |
|$(0, 1, 1)$ | $13$ |
|$(1, 0, 0)$ | $8$ |
|$(1, 0, 1)$ | $10$ |
|$(1, 1, 0)$ | $14$ |
|$(1, 1, 1)$ | $23$ |.

We also build a table for $\widetilde{\eq}(x; z)$ for $x_i \in \{0, 1\}$ in terms of $z$:

| $(z_1, z_2, z_3)$ | $\widetilde{\eq}(x; z)$ |
| -- | -------- |
|$(0, 0, 0)$ | $(1-x_1)(1-x_2)(1-x_3)$ |
|$(0, 0, 1)$ | $(1-x_1)(1-x_2)(x_3)$ |
|$(0, 1, 0)$ | $(1-x_1)(x_2)(1-x_3)$ |
|$(0, 1, 1)$ | $(1-x_1)(x_2)(x_3)$ |
|$(1, 0, 0)$ | $(x_1)(1-x_2)(1-x_3)$ |
|$(1, 0, 1)$ | $(x_1)(1-x_2)(x_3)$ |
|$(1, 1, 0)$ | $(x_1)(x_2)(1-x_3)$ |
|$(1, 1, 1)$ | $(x_1)(x_2)(x_3)$ |.

Then, using the formula for $\widetilde{f}(x_1, \dots, x_n) = \sum_{z_i \in \{0, 1\}}{\widetilde{\eq}(x; z) \cdot f(z_1, \dots, z_n)}$, we get the explicit formula: $\widetilde{f}(x_1, \dots, x_n) = 3(1-x_1)(1-x_2)(1-x_3) + 3(1-x_1)(1-x_2)(x_3) + 9(1-x_1)(x_2)(1-x_3) + 13(1-x_1)(x_2)(x_3) + 8(x_1)(1-x_2)(1-x_3) + 10(x_1)(1-x_2)(x_3) + 14(x_1)(x_2)(1-x_3) + 23(x_1)(x_2)(x_3)$. From here you can verify that $\widetilde{f}(x) = f(x)$ when $x \in \{0, 1\}^n$, and that $\widetilde{f}(x)$ is linear in each of the $x$ variables. 
