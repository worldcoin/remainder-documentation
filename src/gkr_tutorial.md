# GKR Tutorial (Theory)

## Notation Glossary

Note that each of these definitions will be described in further detail in the sections to come, but are aggregated here for convenience.

| Symbol | Description |
| --- | ----------- |
| $\mathbb{F}$ | A finite field. | 
| $C$ | Layered arithmetic circuit. |
| $d$ | Depth of the circuit $C$. |
| $\mathcal{L}_i$ | Layer $i$ of the circuit, such that any node on $\mathcal{L}_i$ is the result of a computation from nodes in layers $j$ and $k$, such that $j, k < i$. |
| $val_i(x)$ | The value of $C$ at node $x$, such that $x$ is a label for a node in $\mathcal{L}_i$. We say that $x$ has $s_i$ bits. |
| $\widetilde{f}$ | A function $\mathbb{F}^n \to \mathbb{F}$. This is the unique multilinear extension encoding the function $f: \{0, 1\}^n \to \mathbb{F}.$  |
| $add_i(z, x, y)$ | A function: $\{0, 1\}^{s_{i + 1} + 2s_i} \to \{0, 1\}$ which indicates whether $val_{i+1}(z) = val_i(x) + val_i(y).$  | 
| $mul_i(z, x, y)$ | A function: $\{0, 1\}^{s_{i + 1} + 2s_i} \to \{0, 1\}$ which indicates whether $val_{i+1}(z) = val_i(x) \cdot val_i(y).$  | 

## High-level Description

GKR is an interactive protocol which was first introduced by [Goldwasser, Kalai, and Rothblum [2008]](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/12/2008-DelegatingComputation.pdf). It proves the statement that $C(y) = 0$, where $C$ is a [layered arithmetic circuit](#statement-encoding), and $y$ is the input to the circuit. 

At a high-level, it works by reducing the validity of the output of the circuit (say layer $d$, $\mathcal{L}_d(x_d) = 0$, for a circuit with depth $d$), to the previous layer of computation in the circuit, $\mathcal{L}_{d-1}.$ Eventually, these statements reduce to a claim an evaluation of the input as a polynomial. If the input $y$ is encoded as the coefficeints of a polynomial $f$, we are left to prove that $f(x_0) = r_0$. 

The later sections unpack these reductions, showing how we can reduce the claim that $C(x) = 0$ to a polynomial evaluation at a random point.

## Statement Encoding

The GKR protocol specifically works with statements of the form $C(y) = 0$, where $C$ is a layered arithmetic circuit. Define a singular node containing $0$ to be the output layer, $\mathcal{L}_d$, and the nodes containing the input values $y_i$ to be the input layer, $\mathcal{L}_0$. 

For any layer, the following invariant holds: if a node belongs in $\mathcal{L}_i$, then it must be the result of a binary operation involving nodes in layers $j, k$ such that $j < i, k < i$. It is possible that $j = k$, but not necessary. 

These binary operations are usually referred to as "gates:" in the following tutorial we will be focusing on two gates: $add$ gates, which are represented by the following function:

$$
    add(z, x, y)= 
\begin{cases}
    1 ,& \text{if } val(x) + val(y) = val(z) \\
    0,              & \text{otherwise}
\end{cases}
$$
and $mul$ gates:
$$
    mul(z, x, y)= 
\begin{cases}
    1 ,& \text{if } val(x) \cdot val(y) = val(z) \\
    0,              & \text{otherwise}
\end{cases}
$$

In other words, if we think of a physical representation of $C$, the _binary gates_ represent the "wires" of the circuit. They show how the values from nodes belonging in previous layers of the circuit can be used to compute the value of the node in a certain layer. In fact, for every node with label $z$ in layer $i \neq 0: \exists \quad\!\!\!\! x, y$ such that $add(z, x, y) = 1$ or $mul(z, x, y) = 1$ for $x, y$ as labels for nodes in layers $j, k < i$.

### Example

Let's look at the following layered arithmetic circuit with depth $d$ = 3:

![Diagram representing an example of a layered arithmetic circuit](./figures/arithmetic_circuit.jpg)


## Interactive Protocol

### Multilinear Extensions (MLEs)

### Encoding $\mathcal{L}_i$ as an MLE

### Sumcheck

### Layerwise Relationships as an MLE

### Claim Aggregation

### "Canonical" GKR

### "Regular" GKR

