# Structured GKR

Source: [Tha13](https://eprint.iacr.org/2013/351.pdf), section 5 ("Time-Optimal Protocols for Circuit Evaluation").

## Equality MLE
We begin by defining the $\widetilde{\text{eq}}$ MLE. We first consider the binary string equality function $\text{eq}: \{0, 1\}^{2n} \mapsto \{0, 1\}$, where

$$
\text{eq}(X_1, ..., X_n; Y_1, ..., Y_n) = \begin{cases} 1 & \text{if $\forall i: X_i = Y_i$} \\ 0 & \text{otherwise} \end{cases}
$$

This function is $1$ if and only if $X$ and $Y$ are equal as binary strings, and $0$ otherwise. We can extend this to a multilinear extension via the following -- consider $\widetilde{\text{eq}}: \mathbb{F}^{2n} \mapsto \mathbb{F}$, where

$$
\widetilde{\text{eq}}(X_1, ..., X_n; Y_1, ..., Y_n) = \prod_{i = 1}^n (1 - X_i)(1 - Y_i) + X_i Y_i
$$

The logic is as follows: when $X_i = Y_i$, either both are zero (in which case $(1 - X_i)(1 - Y_i) = 1$, or both are one (in which case $X_i Y_i = 1$). We see that $\widetilde{\text{eq}}$ is thus equivalent to $\text{eq}$ when $X_i, Y_i \in \{0, 1\}$, and since multilinear extensions are unique (with respect to their evaluations on the hypercube) we have that the above expression is the unique multilinear extension of the boolean equality predicate.

## Structured Layerwise Relationship
See [Tha13](https://eprint.iacr.org/2013/351.pdf), page 25 ("Theorem 1") for a more rigorous treatment. Note that Remainder does _not_ implement Theorem 1 in its entirety, and that many circuits which do fulfill the criteria of Theorem 1 are currently not expressible within Remainder's circuit frontend.

Structured layerwise relationships can loosely be thought of as data relationships where the bits of the index of the "destination" value in the $i$'th layer are a (optionally subset) permutation of the bits of the index of the "source" value in the $j$'th layer for $j > i$. As a concrete example, we consider a layerwise relationship where the destination layer is half the size, and its values are the products of each adjacent pair of its source layer's values: Let $\widetilde{V}_i(Z_1, Z_2)$ represent the MLE of the destination layer, and let $\widetilde{V}_j(Z_1, Z_2, Z_3)$ represent the MLE of the source layer. 

Let the evaluations of $\widetilde{V}_i$ over the hypercube be $[a, b, c, d, e, f, g, h]$. Then we wish to create a layerwise relationship such that the evaluations of $\widetilde{V}_j$ over the hypercube are $[ab, cd, ef, gh]$. We can actually write this as a simple rule in terms of the (integer) indices of $V_i$ as follows: 

$$
V_i(z) = V_j(2z) \cdot V_j(2z + 1)
$$

If we allow for our arguments to be the binary decomposition of $z$ rather than $z$ itself, we might have the following relationship:

$$
V_i(z_1, z_2) = V_j(z_1, z_2, 0) \cdot V_j(z_1, z_2, 1)
$$

where $z_1 z_2 0$ is the binary representation of $2 \cdot z_1 z_2$ and $z_1 z_2 1$ is the binary representation of $2 \cdot z_1 z_2 + 1$. This is in fact very close to the exact form-factor of the polynomial layerwise relationship which we should create between the layers -- we now consider the somewhat un-intuitive relationship

$$
V_i(Z_1, Z_2) = \sum_{b_1, b_2 \in \{0, 1\}^2} \text{eq}(Z_1, Z_2; b_1, b_2) \cdot V_j(b_1, b_2, 0) \cdot V_j(b_1, b_2, 1)
$$

One way to read the above relationship is the following: for any (binary decomposition) $Z_1, Z_2$, the value of the $i$'th layer at the index represented by $Z_1, Z_2$ _should_ be $V_j(Z_1, Z_2, 0) \cdot V_j(Z_1, Z_2, 1)$. We are summing over all possible values of the hypercube above, $b_1, b_2 \in \{0, 1\}^2$, and for each value we check whether the current iterated hypercube value $b_1, b_2$ "equals" the argument $Z_1, Z_2$ value. If so, we contribute $V_j(b_1, b_2, 0) \cdot V_j(b_1, b_2, 1)$ to the sum and if not, we contribute zero to the sum. 

In this way we see for $Z_1, Z_2 \in \{0, 1\}$ that all of the summed values will be zero except for when $b_1, b_2$ are exactly identical to $Z_1, Z_2$, and thus only the correct value $V_j(b_1, b_2, 0) \cdot V_j(b_1, b_2, 1)$ will contribute to the sum (and thus the value of $V_i(Z_1, Z_2)$). 

As described, the above relationship looks extremely inefficient in some sense -- why bother summing over all the hypercube values when we already know that all of them will be zero because $\text{eq}$ will evaluate to zero at all values except one? 

The answer is that it's not enough to only consider $V_i(Z_1, Z_2)$ for binary $Z_1, Z_2$, as our claims will be of the form $\widetilde{V}_i(g_1, g_2) = c$, where $g_1, g_2, c \in \mathbb{F}$, and $\widetilde{V}_i$ is the multilinear extension of $V_i$ (see [claims](./claims.md) section for more information on prover claims). Another way to see this is that the above relationship is able to be shown for each $Z_1, Z_2 \in \{0, 1\}$, but we want to make sure that the relationship holds for _all_ $Z_1, Z_2 \in \{0, 1\}$. Rather than checking each index individually, it's much more efficient to check a "random combination" of all values simultaneously by evaluating $\widetilde{V}_i$ at a _random_ point $g_1, g_2$. We thus have, instead, that

$$
\widetilde{V}_i(Z_1, Z_2) = \sum_{b_1, b_2 \in \{0, 1\}^2} \widetilde{\text{eq}}(Z_1, Z_2; b_1, b_2) \cdot \widetilde{V}_j(b_1, b_2, 0) \cdot \widetilde{V}_j(b_1, b_2, 1)
$$

Since $\widetilde{V}_i$ is identical to $V_i$ (and similarly for $\widetilde{\text{eq}}$ and $\widetilde{V}_j$) everywhere on the hypercube, the above relationship should still hold for all binary $Z_1, Z_2$. Moreover, the above relationship is now one which we can directly apply [sumcheck](./sumcheck.md) to, since we have a summation over the hypercube!

But wait, you might say. This _still_ seems wasteful -- why are we bothering with this summation and $\widetilde{\text{eq}}$ polynomial? Why can't we just have something like

$$
\widetilde{V}_i(Z_1, Z_2) = \widetilde{V}_j(Z_1, Z_2, 0) \cdot \widetilde{V}_j(Z_1, Z_2, 1)
$$

Unfortunately the above relationship cannot work, as $Z_1, Z_2$ are linear on the LHS and quadratic on the RHS. The purpose of the summation and $\widetilde{\text{eq}}$ polynomial is to "linearize" the RHS and quite literally turn any high degree polynomial (such as $\widetilde{V}_j(Z_1, Z_2, 0) \cdot \widetilde{V}_j(Z_1, Z_2, 1)$) into its unique multilinear extension (recall the definition of [multilinear extension](./multilinear_extensions.md)).

We see that the general pattern of creating a "structured" layerwise relationship is as follows:
- First, write the relationship in terms of the binary indices of values between each layer. In our case, $V_i(z_1, z_2) = V_j(z_1, z_2, 0) \cdot V_j(z_1, z_2, 1)$. 
- Next, replace $z_i$ on the LHS of the equation with formal variable $Z_i \in \mathbb{F}$, and allow the LHS to be a multilinear extension. We now have $\widetilde{V}_i(Z_1, Z_2)$ on the LHS.
- Next, replace $z_i$ on the RHS of the equation with boolean $b_i$ values and add an $\widetilde{\text{eq}}$ predicate between $Z_i, b_i$, and add a summation over all $b_i$ values. Additionally, extend all $V_j$ to their multilinear extensions $\widetilde{V}_j$ (this is importantly only for sumcheck):

$$
\widetilde{V}_i(Z_1, Z_2) = \sum_{b_1, b_2 \in \{0, 1\}^2} \widetilde{\text{eq}}(Z_1, Z_2; b_1, b_2) \cdot \widetilde{V}_j(b_1, b_2, 0) \cdot \widetilde{V}_j(b_1, b_2, 1)
$$

## Structured "Selector" Variables
Some relationships between layers are best expressed piece-wise. For example, let's say that we have a destination layer, $\widetilde{V}_i(Z_1, Z_2)$, and a source layer of the same size, $\widetilde{V}_j(Z_1, Z_2)$, where we'd like to square the first two evaluations but double the last two. 

In other words, if $\widetilde{V}_j(Z_1, Z_2)$ has evaluations $[a, b, c, d]$ over the boolean hypercube, then $\widetilde{V}_i(Z_1, Z_2)$ should have evaluations $[a^2, b^2, 2c, 2d]$. If we follow our usual protocol for writing the layerwise relationship here, we would have something like the following for the "integer index" version of the relationship:

$$
V_i(z) = \begin{cases} V_j(z)^2 & \text{if z < 2} \\ 2 \cdot V_j(z) & \text{otherwise} \end{cases}
$$

We notice that in binary form, $z < 2$ whenever $z_1 = 0$ (and $z \geq 2$ when $z_1 = 1$). We can thus re-write the above as

$$
V_i(z_1, z_2) = (1 - z_1) \cdot V_j(0, z_2)^2 + z_1 \cdot 2 \cdot V_j(1, z_2)
$$

In other words, when $z_1 = 0$ the second summand on the RHS is zero, and the first summand is just $V_j(0, z_2) = V_j(z_1, z_2)$ since we already know that $z_1 = 0$, and vice versa for when $z_1 = 1$. Applying the third transformation rule from above and extending everything into its multilinear form, we get

$$
\widetilde{V}_i(Z_1, Z_2) = \sum_{b_1, b_2 \in \{0, 1\}^2} \widetilde{\text{eq}}(Z_1, Z_2; b_1, b_2) \cdot \big[(1 - b_1) \cdot V_j(0, b_2)^2 + b_1 \cdot 2 \cdot V_j(1, b_2)\big]
$$

However, _now_ the observation that $\widetilde{\text{eq}}$ should _only_ apply to variables which are nonlinear on the RHS is helpful here -- notice that although $b_2$ as a variable would be quadratic on the RHS, $b_1$ is linear and can thus be removed from the summation altogether and replaced directly with $Z_1$:

$$
\widetilde{V}_i(Z_1, Z_2) = \sum_{b_2 \in \{0, 1\}} \widetilde{\text{eq}}(Z_2; b_2) \cdot \big[(1 - Z_1) \cdot V_j(0, b_2)^2 + Z_1 \cdot 2 \cdot V_j(1, b_2)\big]
$$

This layerwise relationship form-factor is called a "selector" in Remainder terminology and in general refers to an in-circuit version of an "if/else" statement where MLEs representing the values of layers can be broken into power-of-two-sized pieces. 