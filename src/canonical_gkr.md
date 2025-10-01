# Canonic GKR
See [XZZ+19](https://eprint.iacr.org/2019/317.pdf), [ZLW+20](https://eprint.iacr.org/2020/1247.pdf) for more details.

## Gate MLEs
Gate MLEs define an arbitrary wiring pattern between previous layers ($\widetilde{V}_{i + 1}$ below) and the current layer's MLE ($\widetilde{V}_i$ below):
$$\widetilde{V}_i(z) = \sum_{x, y \in \{0, 1\}^{2s_{i + 1}}} \widetilde{\text{add}}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_{i + 1}(x) + \widetilde{V}_{i + 1}(y) \bigg] + \widetilde{\text{mul}}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_{i + 1}(x) \cdot \widetilde{V}_{i + 1}(y) \bigg]$$
We define three *types* of gate layers within Remainder, although they are all quite similar in spirit.

## Notation
- Let $s_i$ denote the number of variables the MLE representing layer $i$ has (in other words,  layer $i$ of the circuit has $2^{s_i}$ values).
- Let $\widetilde{V}_i(z) \in \mathbb{F}^{<2}[X_1, ..., X_{s_i}]$ be the MLE corresponding to values in the layer of the circuit which is the "destination" of the gate polynomial relationship.
- Let $\widetilde{V}_j(x) \in \mathbb{F}^{<2}[X_1, ..., X_{s_j}]$ be the MLE corresponding to values in (one) layer of the circuit which is the "source" of the gate polynomial relationship. Note that $j > i$ always.
- Similarly, let $\widetilde{V}_k(x) \in \mathbb{F}^{<2}[X_1, ..., X_{s_k}]$ be the MLE corresponding to values in (another) layer of the circuit which is a second "source" of the gate polynomial relationship. Note that $k > i$ always.

## Identity Gate
Identity gates (which are secretly unlimited fan-in addition gates...) are defined in the following way:
$$
\text{id}(z, x): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \mapsto \{0, 1\} \quad \text{where} \quad \text{id}(z, x) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x)$}\\ 0 & \text{otherwise}\end{cases}
$$
In other words, $\text{id}(z, x)$ is $1$ if and only if there is a gate from the $z$'th value in the $j$'th layer to the $x$'th value in the $i$'th layer. The MLE of the identity function above is defined as follows:
$$
\widetilde{\text{id}}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}] \mapsto \mathbb{F} \quad \text{where} \quad \widetilde{\text{id}}(g, u) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{eq}}(u, x) \cdot \text{id}(z, x)
$$
The polynomial relationship between the "destination" layer $i$'s MLE and the "source" layer $j$'s MLE is as follows:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}} \widetilde{\text{id}}(g, x) \cdot \widetilde{V}_j(x)
$$
Assuming that $x$ gets bound to $u \in \mathbb{F}^{s_j}$ during sumcheck, this layer produces two claims -- one on $\widetilde{\text{id}}(g, u)$ and one on $\widetilde{V}_j(u)$. The former can be checked by the verifier directly (since it knows the circuit wiring and uses the definition of $\widetilde{\text{id}}$ above), and the latter is proven by sumcheck over layer $j$.
### Example
We start with a "source" MLE $\widetilde{V}_j(x_0, x_1)$ over two variables with four evaluations, and wish to obtain a circular-shifted version of the evaluations of this MLE in layer $i$, i.e. $\widetilde{V}_i(z_0, z_1)$. 

For example, let's say that the evaluations of $\widetilde{V}_j$ are $[0, 1, 2, 3]$. We wish for those of $\widetilde{V}_i$ to be e.g. $[1, 2, 3, 0]$. To do this, we can list the "nonzero" identity gate indices, i.e. $(z_0, z_1; x_0, x_1)$, such that $\widetilde{V}_i(z_0, z_1) = \widetilde{V}_j(x_0, x_1)$:
- $(0, 0; 0, 1)$: the zeroth evaluation of layer $i$ is equivalent to the first evaluation of layer $j$.
- $(0, 1; 1, 0)$: the first evaluation of layer $i$ is equivalent to the second evaluation of layer $j$.
- $(1, 0; 1, 1)$: similar reasoning as above.
- $(1, 1; 0, 0)$: similar reasoning as above.

For all other tuples over binary values we have that $\text{id}(z, x) = 0$. 

<!-- TODO(ryancao): Code example of the above -->

## Add Gate
The concepts for addition and multiplication gates are very similar to that of identity gate above. For add gate, we have the binary wiring indicator predicate:
$$
\text{add}(z, x, y): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \times \{0, 1\}^{s_k} \mapsto \{0, 1\} \quad \text{where} \quad \text{add}(z, x, y) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x) + \widetilde{V}_k(y)$}\\ 0 & \text{otherwise}\end{cases}
$$
Here, we have that $\text{add}(z, x, y) = 1$ if and only if the $x$'th value in the $j$'th layer and the $y$'th value in the $k$'th layer sum to the $z$'th value in the $i$'th layer. The MLE of $\text{add}(z, x, y)$ is similar to that of $\text{id}$:
$$
\widetilde{\text{add}}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}, Y_1, ..., Y_{s_k}] \mapsto \mathbb{F} \\ \quad \\ \text{where} \\ \quad \\ \widetilde{\text{add}}(g, u, v) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{eq}}(u, x) \cdot \widetilde{\text{eq}}(v, y) \cdot \text{add}(z, x, y)
$$
and the polynomial relationship is defined very similarly to that of identity gate:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\text{add}}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) + \widetilde{V}_k(y)\bigg]
$$
Assuming that $x$ gets bound to $u \in \mathbb{F}^{s_j}$ and $y$ gets bound to $v \in \mathbb{F}^{s_k}$ during sumcheck, a claim on this layer results in three total claims: one on $\widetilde{\text{add}}(g, u, v)$ (which the verifier can check on its own), one on $\widetilde{V}_j(u)$, and one on $\widetilde{V}_k(v)$. 

### Example
We start with two "source" MLEs, $\widetilde{V}_j(x_0, x_1), \widetilde{V}_k(y_0, y_1)$ over two variables with four evaluations each, and wish to add each value in the first with its $4 - \text{idx}$ "complementary value" in the second. The result should be the MLE representing layer $i$, i.e. $\widetilde{V}_i(z_0, z_1)$. 

For example, let's say that the evaluations of $\widetilde{V}_j(x_0, x_1)$ are $[a, b, c, d]$ and those of $\widetilde{V}_k(y_0, y_1)$ are $[e, f, g, h]$. We wish to add $a$ to $h$, $b$ to $g$, and so on. Then our "nonzero gate tuples" are as follows:
- $(0, 0; 0, 0; 1, 1)$: the zeroth value in the $i$'th layer is equivalent to the sum of the zeroth value in the $j$'th layer and the third value in the $k$'th layer.
- $(0, 1; 0, 1; 1, 0)$: the first value in the $i$'th layer is equivalent to the sum of the first value in the $j$'th layer and the second value in the $k$'th layer.
- $(1, 0; 1, 0; 0, 1)$: similar reasoning to the above.
- $(1, 1; 1, 1; 0, 0)$: similar reasoning to the above.

For all other binary tuples we have that $\widetilde{\text{add}}(z, x, y) = 0$, and our resulting MLE's evaluations should be as follows: $[a + h, b + g, c + f, d + e]$. 

<!-- TODO(ryancao): Code example of the above -->

## Mul Gate
Multiplication gate is nearly identical to addition gate. For mul gate, we have the binary wiring indicator predicate:
$$
\text{mul}(z, x, y): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \times \{0, 1\}^{s_k} \mapsto \{0, 1\} \quad \text{where} \quad \text{mul}(z, x, y) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x) \cdot \widetilde{V}_k(y)$}\\ 0 & \text{otherwise}\end{cases}
$$
Here, we have that $\text{mul}(z, x, y) = 1$ if and only if the the $z$'th value in the $i$'th layer equals the product of the $x$'th value in the $j$'th layer with the $y$'th value in the $k$'th layer. The MLE of $\text{mul}(z, x, y)$ is identical to that of $\text{add}$:
$$
\widetilde{\text{mul}}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}, Y_1, ..., Y_{s_k}] \mapsto \mathbb{F} \\ \quad \\ \text{where} \\ \quad \\ \widetilde{\text{mul}}(g, u, v) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{eq}}(u, x) \cdot \widetilde{\text{eq}}(v, y) \cdot \text{mul}(z, x, y)
$$
and the polynomial relationship is defined nearly identically to that of $\text{add}$ gate:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\text{mul}}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) \cdot \widetilde{V}_k(y)\bigg]
$$
Assuming that $x$ gets bound to $u \in \mathbb{F}^{s_j}$ and $y$ gets bound to $v \in \mathbb{F}^{s_k}$ during sumcheck, a claim on this layer results in three total claims: one on $\widetilde{\text{mul}}(g, u, v)$ (which the verifier can check on its own), one on $\widetilde{V}_j(u)$, and one on $\widetilde{V}_k(v)$. 

### Example
We start with two "source" MLEs, $\widetilde{V}_j(x_0, x_1), \widetilde{V}_k(y_0, y_1)$ over two variables with four evaluations each, and wish to accumulate (add up) the product of the 0th and 2nd evaluations with that of the 1st and 3rd evaluations, and place this into the 0th evaluation in the resulting MLE. The result should be the MLE representing layer $i$, i.e. $\widetilde{V}_i(z_0, z_1)$, whose evaluations are all zero except for its 0th evaluation.

For example, let's say that the evaluations of $\widetilde{V}_j(x_0, x_1)$ are $[a, b, c, d]$ and those of $\widetilde{V}_k(y_0, y_1)$ are $[e, f, g, h]$. We wish to multiply $a$ and $f$, and $b$ and $e$ and have those be the zeroth evaluation of the resulting MLE, i.e. $\widetilde{V}_i(0, 0)$. We then wish to multiply $c$ and $h$, and $d$ and $g$ and have those be the first evaluation of the resulting MLE, i.e. $\widetilde{V}_i(0, 1)$.

Then our "nonzero gate tuples" are as follows:
- $(0, 0; 0, 0; 0, 1)$: The zeroth value in the $j$'th layer multiplied by the first value in the $k$'th layer contributes to the zeroth value in the $i$'th layer.
- $(0, 0; 0, 1; 0, 0)$: The first value in the $j$'th layer multiplied by the zeroth value in the $k$'th layer contributes to the zeroth value in the $i$'th layer.
- $(0, 1; 1, 0; 1, 1)$: similar reasoning to the above.
- $(0, 1; 1, 1; 1, 0)$: similar reasoning to the above.

For all other binary tuples we have that $\widetilde{\text{add}}(z, x, y) = 0$, and our resulting MLE's evaluations should be as follows: $[a * f + b * e, c * h + d * g, 0, 0]$. Note here for $\widetilde{\text{mul}}$ that we are able to add multiple products to each output value in the $i$'th layer, and that the same is true for both $\widetilde{\text{add}}$ and $\widetilde{\text{id}}$. In other words, we actually have unlimited addition fan-in and degree-2 multiplication fan-in.