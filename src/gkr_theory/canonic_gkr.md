c# Canonic GKR
See [XZZ+19](https://eprint.iacr.org/2019/317.pdf), [ZLW+20](https://eprint.iacr.org/2020/1247.pdf) for more details.

## "Gate"-style layerwise relationship
Unlike the [structured wiring pattern](./structured_gkr.md#structured-layerwise-relationship) described in the previous section, "gate"-style layerwise relationships allow for an arbitrary wiring pattern between a destination layer and its source layer(s). In general, these layerwise relationships are defined via indicator functions $\text{id}, \text{add}, \text{mul}$ (these function like the $\text{eq}$ function in structured layerwise relationships, but allow for input wires whose indices have no relationship to those of the output wire). Consider, for example, the canonic layerwise GKR equation, which defines the relationship between a previous layer's MLE ($\widetilde{V}_{i + 1}$ below) and the current layer's MLE ($\widetilde{V}_i$ below):
$$\widetilde{V}_i(z) = \sum_{x, y \in \{0, 1\}^{2s_{i + 1}}} \widetilde{\add}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_{i + 1}(x) + \widetilde{V}_{i + 1}(y) \bigg] + \widetilde{\mul}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_{i + 1}(x) \cdot \widetilde{V}_{i + 1}(y) \bigg]$$
We define three *types* of gate layers within Remainder, although they are all quite similar in spirit.

## Notation
- Let $s_i$ denote the number of variables the MLE representing layer $i$ has (in other words,  layer $i$ of the circuit has $2^{s_i}$ values).
- Let $\widetilde{V}_i(z) \in \mathbb{F}^{<2}[X_1, ..., X_{s_i}]$ be the MLE corresponding to values in the layer of the circuit which is the "destination" of the gate polynomial relationship.
- Let $\widetilde{V}_j(x) \in \mathbb{F}^{<2}[X_1, ..., X_{s_j}]$ be the MLE corresponding to values in (one) layer of the circuit which is the "source" of the gate polynomial relationship. Note that $j > i$ always.
- Similarly, let $\widetilde{V}_k(x) \in \mathbb{F}^{<2}[X_1, ..., X_{s_k}]$ be the MLE corresponding to values in (another) layer of the circuit which is a second "source" of the gate polynomial relationship. Note that $k > i$ always.

## Identity Gate
Identity gates are defined in the following way:
$$
\text{id}(z, x): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \mapsto \{0, 1\} \quad \text{where} \quad \text{id}(z, x) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x)$}\\ 0 & \text{otherwise}\end{cases}
$$
In other words, $\text{id}(z, x)$ is $1$ if and only if there is a gate from the $z$'th value in the $j$'th layer to the $x$'th value in the $i$'th layer. These can be thought of as "routing" gates or "copy constraints", as they directly pass a value from one layer to another. The MLE of the identity function above is defined as follows:
$$
\widetilde{\text{id}}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}] \mapsto \mathbb{F} \quad \text{where} \quad \widetilde{\text{id}}(g, u) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}} \widetilde{\eq}(g, z) \cdot \widetilde{\eq}(u, x) \cdot \text{id}(z, x)
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

## Costs
Over here, we go through some of the costs for the prover runtime, proof size, and verifier runtime when performing sumcheck over an identity gate layer. In order to provide some intuition, we analyze the costs of a particular example, which may not encapsulate the general example for identity gate layers.

Let us recall the identity gate sumcheck equation:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}} \widetilde{\text{id}}(g, x) \cdot \widetilde{V}_j(x).
$$
We can rewrite this as:
$$
\widetilde{V}_i(g) = \sum_{z \in \{0, 1\}^{s_i}}\sum_{x \in \{0, 1\}^{s_j}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{id}}(z, x) \cdot \widetilde{V}_j(x).
$$
As observed in [XZZ+19](https://eprint.iacr.org/2019/317.pdf), we only need to sum over the wirings which are non-zero (i.e., there exists a re-routing from label $x$ in layer $j$ to label $z$ in layer $i$). Call the set of non-zero wirings as $\mathcal{N}$. We can rewrite the summation as:
$$
\widetilde{V}_i(g) = \sum_{(z, x) \in \mathcal{N}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{id}}(z, x) \cdot \widetilde{V}_j(x).
$$

The prover cost for sumcheck over an identity gate layer is as follows:
- The prover must first compute the evaluations of $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{id}}(z, x)$. By summing over the non-zero wirings in $\mathcal{N}$, [XZZ+19](https://eprint.iacr.org/2019/317.pdf) shows us how to compute an MLE with evaluations of this product in time $O(2^{s_i}).$ This involves first pre-computing the table of evaluations of $\widetilde{\text{eq}}(g, z)$ using the dynamic-programming algorithm in [Tha13](https://eprint.iacr.org/2013/351.pdf), and then appropriately summing over $\mathcal{N}$ to fold in the evaluations of $\widetilde{\text{id}}(z, x).$
- Next, the prover must compute sumcheck messages for the above relationship. The degree of each sumcheck message is $d = 2$, and thus the prover sends $d + 1 = 3$ evaluations per round of sumcheck. Since we are sumchecking over $x \in \{0, 1\}^{s_j}$, there are $s_j$ rounds of sumcheck and thus the prover cost is $d(d + 1) 2^k$ for the $k$'th round of sumcheck. The total prover sumcheck cost is thus
$$
d(d + 1) \sum_{k = 1}^{s_j} 2^k = d(d + 1)2^{s_j + 1}.
$$
- Letting $d^2 = 4$ be a constant, the total prover runtime (pre-processing + sumcheck) is $O(2^{s_i} + 2^{s_j}).$

The proof size for sumcheck over identity gate is as follows: 
- There are $s_j$ total sumcheck rounds, each with the prover sending over $3$ evaluations for a quadratic polynomial. The proof size is thus $3 s_j$ field elements, plus $1$ extra for the final claim on $\widetilde{V}_j(x)$.

The verifier cost for sumcheck over identity gate is as follows:
- The verifier receives $s_j$ sumcheck messages with $3$ evaluations each, and each round it must evaluate those quadratic polynomials at a random point. Its runtime is thus $O(s_j)$ with very small constants.

## Add Gate
The concepts for addition and multiplication gates are very similar to that of identity gate above. For add gate, we have the binary wiring indicator predicate:
$$
\add(z, x, y): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \times \{0, 1\}^{s_k} \mapsto \{0, 1\} \quad \text{where} \quad \add(z, x, y) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x) + \widetilde{V}_k(y)$}\\ 0 & \text{otherwise}\end{cases}
$$
Here, we have that $\add(z, x, y) = 1$ if and only if the $x$'th value in the $j$'th layer and the $y$'th value in the $k$'th layer sum to the $z$'th value in the $i$'th layer. The MLE of $\add(z, x, y)$ is similar to that of $\text{id}$:
$$
\widetilde{\add}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}, Y_1, ..., Y_{s_k}] \mapsto \mathbb{F} \\ \quad \\ \text{where} \\ \quad \\ \widetilde{\add}(g, u, v) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\eq}(g, z) \cdot \widetilde{\eq}(u, x) \cdot \widetilde{\eq}(v, y) \cdot \add(z, x, y)
$$
and the polynomial relationship is defined very similarly to that of identity gate:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\add}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) + \widetilde{V}_k(y)\bigg]
$$
Assuming that $x$ gets bound to $u \in \mathbb{F}^{s_j}$ and $y$ gets bound to $v \in \mathbb{F}^{s_k}$ during sumcheck, a claim on this layer results in three total claims: one on $\widetilde{\add}(g, u, v)$ (which the verifier can compute from the circuit description and therefore check on its own), one on $\widetilde{V}_j(u)$, and one on $\widetilde{V}_k(v)$. 

### Example
We start with two "source" MLEs, $\widetilde{V}_j(x_0, x_1), \widetilde{V}_k(y_0, y_1)$ over two variables with four evaluations each, and wish to add each value in the first with its $4 - \text{idx}$ "complementary value" in the second. The result should be the MLE representing layer $i$, i.e. $\widetilde{V}_i(z_0, z_1)$. 

For example, let's say that the evaluations of $\widetilde{V}_j(x_0, x_1)$ are $[a, b, c, d]$ and those of $\widetilde{V}_k(y_0, y_1)$ are $[e, f, g, h]$. We wish to add $a$ to $h$, $b$ to $g$, and so on. Then our "nonzero gate tuples" are as follows:
- $(0, 0; 0, 0; 1, 1)$: the zeroth value in the $i$'th layer is equivalent to the sum of the zeroth value in the $j$'th layer and the third value in the $k$'th layer.
- $(0, 1; 0, 1; 1, 0)$: the first value in the $i$'th layer is equivalent to the sum of the first value in the $j$'th layer and the second value in the $k$'th layer.
- $(1, 0; 1, 0; 0, 1)$: similar reasoning to the above.
- $(1, 1; 1, 1; 0, 0)$: similar reasoning to the above.

For all other binary tuples we have that $\widetilde{\add}(z, x, y) = 0$, and our resulting MLE's evaluations should be as follows: $[a + h, b + g, c + f, d + e]$. 

## Costs
Over here, we go through some of the costs for the prover runtime, proof size, and verifier runtime when performing sumcheck over an add gate layer. In order to provide some intuition, we analyze the costs of a particular example, which may not encapsulate the general example for add gate layers.

Let us recall the add gate sumcheck equation:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}}\sum_{y \in \{0, 1\}^{s_k}} \widetilde{\text{add}}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) + \widetilde{V}_k(y)\bigg]
$$
We can rewrite this as:
$$
\widetilde{V}_i(g) = \sum_{z \in \{0, 1\}^{s_i}}\sum_{x \in \{0, 1\}^{s_j}}\sum_{y \in \{0, 1\}^{s_k}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{add}}(z, x, y) \cdot \bigg[\widetilde{V}_j(x) + \widetilde{V}_k(y)\bigg]
$$
As observed in [XZZ+19](https://eprint.iacr.org/2019/317.pdf), we only need to sum over the wirings which are non-zero (i.e., there exists a an addition from label $x$ in layer $j$ and label $y$ in layer $k$ to label $z$ in layer $i$). Call the set of non-zero wirings as $\mathcal{N}$. We can rewrite the summation as:
$$
\widetilde{V}_i(g) = \sum_{(z, x, y) \in \mathcal{N}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{add}}(z, x, y) \cdot \bigg[\widetilde{V}_j(x) + \widetilde{V}_k(y)\bigg].
$$

The prover cost for sumcheck over an add gate layer is as follows:
- The prover must first compute the evaluations of $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{add}}(z, x, y)$. [XZZ+19](https://eprint.iacr.org/2019/317.pdf) splits this pre-processing into two phases. First, we compute sumcheck over $\widetilde{V}_j(x)$ and therefore we can "fold" $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{add}}(z, x, y)$ by summing over the $y$ variables. Similarly, in the second phase, when we compute sumcheck messages over $\widetilde{V}_k(y)$, we can "fold" $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{add}}(z, x, y)$ by summing over the $x$ variables. 
- Next, the prover must compute sumcheck messages for the above relationship. Similarly, sumcheck is done in two phases. First, binding the $x$ variables, then binding the $y$ variables. The degree of each sumcheck message is $d = 2$, and thus the prover sends $d + 1 = 3$ evaluations per round of sumcheck. Since we are sumchecking over $x \in \{0, 1\}^{s_j}$ and $y \in \{0, 1\}^{s_k}$, there are $s_j + s_k$ rounds of sumcheck and thus the prover cost is $d(d + 1) 2^k$ for the $k$'th round of sumcheck. The total prover sumcheck cost is thus
$$
d(d + 1) \Big(\sum_{t = 1}^{s_j}{2^t} + \sum_{t = 1}^{s_k} 2^t \Big)  = d(d + 1)(2^{s_j + 1} + 2^{s_k + 1}).
$$
- Letting $d^2 = 4$ be a constant, the total prover runtime (pre-processing + sumcheck) is $O(2^{s_i} + 2^{s_j} + 2^{s_k}).$

The proof size for sumcheck over add gate layer is as follows: 
- There are $s_j$ + $s_k$ total sumcheck rounds, each with the prover sending over $3$ evaluations for a quadratic polynomial. The proof size is thus $3(s_j + s_k)$ field elements, plus $2$ extra for the final claims on $\widetilde{V}_j(x)$ and $\widetilde{V}_k(y)$.

The verifier cost for sumcheck over add gate layer is as follows:
- The verifier receives $s_j + s_k$ sumcheck messages with $3$ evaluations each, and each round it must evaluate those quadratic polynomials at a random point. Its runtime is thus $O(s_j + s_k)$ with very small constants.

## Mul Gate
Multiplication gate is nearly identical to addition gate. For mul gate, we have the binary wiring indicator predicate:
$$
\mul(z, x, y): \{0, 1\}^{s_i} \times \{0, 1\}^{s_j} \times \{0, 1\}^{s_k} \mapsto \{0, 1\} \quad \text{where} \quad \mul(z, x, y) = \begin{cases} 1 & \text{if $\widetilde{V}_i(z) = \widetilde{V}_j(x) \cdot \widetilde{V}_k(y)$}\\ 0 & \text{otherwise}\end{cases}
$$
Here, we have that $\mul(z, x, y) = 1$ if and only if the the $z$'th value in the $i$'th layer equals the product of the $x$'th value in the $j$'th layer with the $y$'th value in the $k$'th layer. The MLE of $\mul(z, x, y)$ is identical to that of $\add$:
$$
\widetilde{\mul}: \mathbb{F}^{<2}[Z_1, ..., Z_{s_i}, X_1, ..., X_{s_j}, Y_1, ..., Y_{s_k}] \mapsto \mathbb{F} \\ \quad \\ \text{where} \\ \quad \\ \widetilde{\mul}(g, u, v) = \sum_{z \in \{0, 1\}^{s_i}, x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\eq}(g, z) \cdot \widetilde{\eq}(u, x) \cdot \widetilde{\eq}(v, y) \cdot \mul(z, x, y)
$$
and the polynomial relationship is defined nearly identically to that of $\add$ gate:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}, y \in \{0, 1\}^{s_k}} \widetilde{\mul}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) \cdot \widetilde{V}_k(y)\bigg]
$$
Assuming that $x$ gets bound to $u \in \mathbb{F}^{s_j}$ and $y$ gets bound to $v \in \mathbb{F}^{s_k}$ during sumcheck, a claim on this layer results in three total claims: one on $\widetilde{\mul}(g, u, v)$ (which the verifier can check on its own), one on $\widetilde{V}_j(u)$, and one on $\widetilde{V}_k(v)$. 

### Example
We start with two "source" MLEs, $\widetilde{V}_j(x_0, x_1), \widetilde{V}_k(y_0, y_1)$ over two variables with four evaluations each, and wish to accumulate (add up) the product of the 0th and 2nd evaluations with that of the 1st and 3rd evaluations, and place this into the 0th evaluation in the resulting MLE. The result should be the MLE representing layer $i$, i.e. $\widetilde{V}_i(z_0, z_1)$, whose evaluations are all zero except for its 0th evaluation.

For example, let's say that the evaluations of $\widetilde{V}_j(x_0, x_1)$ are $[a, b, c, d]$ and those of $\widetilde{V}_k(y_0, y_1)$ are $[e, f, g, h]$. We wish to multiply $a$ and $f$, and $b$ and $e$ and have those be the zeroth evaluation of the resulting MLE, i.e. $\widetilde{V}_i(0, 0)$. We then wish to multiply $c$ and $h$, and $d$ and $g$ and have those be the first evaluation of the resulting MLE, i.e. $\widetilde{V}_i(0, 1)$.

Then our "nonzero gate tuples" are as follows:
- $(0, 0; 0, 0; 0, 1)$: The zeroth value in the $j$'th layer multiplied by the first value in the $k$'th layer contributes to the zeroth value in the $i$'th layer.
- $(0, 0; 0, 1; 0, 0)$: The first value in the $j$'th layer multiplied by the zeroth value in the $k$'th layer contributes to the zeroth value in the $i$'th layer.
- $(0, 1; 1, 0; 1, 1)$: similar reasoning to the above.
- $(0, 1; 1, 1; 1, 0)$: similar reasoning to the above.

For all other binary tuples we have that $\widetilde{\add}(z, x, y) = 0$, and our resulting MLE's evaluations should be as follows: $[a * f + b * e, c * h + d * g, 0, 0]$. Note here for $\widetilde{\mul}$ that we are able to add multiple products to each output value in the $i$'th layer, and that the same is true for both $\widetilde{\add}$ and $\widetilde{\text{id}}$. In other words, we actually have unlimited addition fan-in and degree-2 multiplication fan-in.

## Costs
Over here, we go through some of the costs for the prover runtime, proof size, and verifier runtime when performing sumcheck over a mul gate layer. In order to provide some intuition, we analyze the costs of a particular example, which may not encapsulate the general example for add gate layers.

Let us recall the mul gate sumcheck equation:
$$
\widetilde{V}_i(g) = \sum_{x \in \{0, 1\}^{s_j}}\sum_{y \in \{0, 1\}^{s_k}} \widetilde{\text{mul}}(g, x, y) \cdot \bigg[\widetilde{V}_j(x) \cdot \widetilde{V}_k(y)\bigg]
$$
We can rewrite this as:
$$
\widetilde{V}_i(g) = \sum_{z \in \{0, 1\}^{s_i}}\sum_{x \in \{0, 1\}^{s_j}}\sum_{y \in \{0, 1\}^{s_k}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{mul}}(z, x, y) \cdot \bigg[\widetilde{V}_j(x) \cdot \widetilde{V}_k(y)\bigg]
$$
As observed in [XZZ+19](https://eprint.iacr.org/2019/317.pdf), we only need to sum over the wirings which are non-zero (i.e., there exists a an addition from label $x$ in layer $j$ and label $y$ in layer $k$ to label $z$ in layer $i$). Call the set of non-zero wirings as $\mathcal{N}$. We can rewrite the summation as:
$$
\widetilde{V}_i(g) = \sum_{(z, x, y) \in \mathcal{N}} \widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{mul}}(z, x, y) \cdot \bigg[\widetilde{V}_j(x) \cdot \widetilde{V}_k(y)\bigg].
$$

The prover cost for sumcheck over a mul gate layer is as follows:

- The prover must first compute the evaluations of $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{mul}}(z, x, y)$. [XZZ+19](https://eprint.iacr.org/2019/317.pdf) splits this pre-processing into two phases, much like the $\text{add}$ gate layer. First, we compute sumcheck over $\widetilde{V}_j(x)$ and therefore we can "fold" $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{mul}}(z, x, y) \cdot $\widetilde{V}_k(y)$ by summing over the $y$ variables. Similarly, in the second phase, when we compute sumcheck messages over $\widetilde{V}_k(y)$, we can "fold" $\widetilde{\text{eq}}(g, z) \cdot \widetilde{\text{mul}}(z, x, y) \cdot \widetilde{V}_j(x)$ by summing over the $x$ variables. 
- Next, the prover must compute sumcheck messages for the above relationship. Similarly, sumcheck is done in two phases. First, binding the $x$ variables, then binding the $y$ variables. The degree of each sumcheck message is $d = 3$, and thus the prover sends $d + 1 = 4$ evaluations per round of sumcheck. Since we are sumchecking over $x \in \{0, 1\}^{s_j}$ and $y \in \{0, 1\}^{s_k}$, there are $s_j + s_k$ rounds of sumcheck and thus the prover cost is $d(d + 1) 2^k$ for the $k$'th round of sumcheck. The total prover sumcheck cost is thus
$$
d(d + 1) \Big(\sum_{t = 1}^{s_j}{2^t} + \sum_{t = 1}^{s_k} 2^t \Big)  = d(d + 1)(2^{s_j + 1} + 2^{s_k + 1}).
$$
- Letting $d^2 = 9$ be a constant, the total prover runtime (pre-processing + sumcheck) is $O(2^{s_i} + 2^{s_j} + 2^{s_k}).$

The proof size for sumcheck over mul gate layer is as follows: 
- There are $s_j$ + $s_k$ total sumcheck rounds, each with the prover sending over $4$ evaluations for a quadratic polynomial. The proof size is thus $4(s_j + s_k)$ field elements, plus $2$ extra for the final claims on $\widetilde{V}_j(x)$ and $\widetilde{V}_k(y)$.

The verifier cost for sumcheck over mul gate layer is as follows:
- The verifier receives $s_j + s_k$ sumcheck messages with $4$ evaluations each, and each round it must evaluate those quadratic polynomials at a random point. Its runtime is thus $O(s_j + s_k)$ with very small constants.