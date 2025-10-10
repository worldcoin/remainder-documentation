# Pedersen Commitments

We continue to work in the elliptic curve group of prime order $\mathbb{G}$ in this section with the group operation of point addition (denoted by $+$). Pedersen commitments are based on the [discrete logarithm hardness assumption](https://en.wikipedia.org/wiki/Discrete_logarithm). Let $g$ be the generator of $\mathbb{G}$. This hardness assumption states that given a group element $a \in \mathbb{G}$, and knowing $g$, it is computationally hard to find the "discrete logarithm" of $a$, namely, the scalar field element $k$ such that $kg = a$.

## Commitment Schemes

Before explaining what Pedersen commitments are, we briefly provide background on commitment schemes. Commitment schemes allow a party to commit to a message $m$ in the form of a commitment $c$. 

### Properties
Commitment schemes are best described by the properties they satisfy. We informally define them below:
* **Hiding:** This gives privacy to the party computing the commitment. I.e., given a commitment $c$, it is computationally difficult to extract the message $m$ it was computed from. In other words, the distribution of commitments that could be computed from a message $m_0$ is computationally indistinguishable from the distribution of commitments that could be computed from a message $m_1$.
* **Binding:** This property gives security to the party receiving the commitment. It states that once given a commitment $c$, the party who receives the commitment can be confident with up to negligible probability that the sender is tied to the message $c$ was computed from. In other words, the probability that $c$ is the commitment of two different messages $m_0 \neq m_1$ is very low.

### Protocol
Commitment schemes entail two phases:
* **Commitment Phase:** In the commitment phase, $\mathcal{P}$ computes the commitment $c$ to its desired message $m$ and sends it to $\mathcal{V}$.
* **Evaluation Phase:** In the evaluation phase, $\mathcal{V}$ receives the commitment $c$ and verifies (the actual method of verifying depends on which commitment scheme is being used) whether $c$ is indeed the commitment to the correct message $m$.

## Pedersen Commitment Construction