# Pedersen Commitments

We continue to work in the elliptic curve group of prime order $\mathbb{G}$ in this section with the group operation of point addition (denoted by $+$). Pedersen commitments are based on the [discrete logarithm hardness assumption](https://en.wikipedia.org/wiki/Discrete_logarithm). Let $g$ be the generator of $\mathbb{G}$. This hardness assumption states that given a group element $a \in \mathbb{G}$, and knowing $g$, it is computationally hard to find the "discrete logarithm" of $a$, namely, the scalar field element $k$ such that $kg = a$.

## Commitment Schemes

Before explaining what Pedersen commitments are, we briefly provide background on commitment schemes. Commitment schemes allow a party to commit to a message $m$ in the form of a commitment $c$. Note that the setup and definition for a [_polynomial commitment scheme_](../gkr_tutorial/input_layers.md#committed-inputs) is similar but with some subtle differences, as polynomial commitment schemes deal with committing to a message which is a bounded-degree polynomial such that a proof for evaluation at a later-determined point can be provided, while a commitment scheme in the sense of a Pedersen commitment more generally commits to a message (and can also be used as a PCS via [proof-of-dot-product](./hyrax_primitives.md#proof-of-dot-product)).

### Properties
Commitment schemes are best described by the properties they satisfy. We informally define them below:
* **Hiding:** This gives privacy to the party computing the commitment. I.e., given a commitment $c$, it is computationally difficult to extract the message $m$ it was computed from. A stronger notion, the "statistical hiding" property, says that the distribution of commitments that could be computed from a message $m_0$ is computationally indistinguishable from the distribution of commitments that could be computed from a message $m_1$.
* **Binding:** This property gives security to the party receiving the commitment. It states that once given a commitment $c$, the party who receives the commitment can be confident with up to negligible probability that the sender is tied to the message $c$ was computed from. In other words, the probability that $c$ is the commitment of two different messages $m_0 \neq m_1$ is very low.

### Protocol
Commitment schemes entail two phases:
* **Commitment Phase:** In the commitment phase, $\mathcal{P}$ computes the commitment $c$ to its desired message $m$ and sends it to $\mathcal{V}$.
* **Evaluation Phase:** In the evaluation phase, $\mathcal{V}$ receives the commitment $c$ and verifies (the actual method of verifying depends on which commitment scheme is being used) whether $c$ is indeed the commitment to the correct message $m$.

## Pedersen Commitment Construction
A Pedersen Commitment is one way of committing to a message, a construction used throughout the Hyrax interactive protocol. Pedersen commitments require a transparent set-up where both $\mathcal{P}$ and $\mathcal{V}$ agree on a generator $g \in \mathbb{G}$.

### Single Message Commitment
We commit to a message $m \in \mathbb{F}_p$ by simply computing $c = mg$. By the discrete log hardness assumption, it is hard to extract $m$ from $c$, and because $g$ is a generator, $c$ can only be generated from $m$.

### Vector Pedersen Commitment
We commit to a list of messages $m_1, \dots, m_n \in \mathbb{F}_p$ by first agreeing on $n$ generators $g_1, \dots, g_n$ and then computing $c = m_1g_1 + m_2g_2 + ... + m_ng_n$. This is what is normally referred to as a multi-scalar multiplication in elliptic-curve cryptography.

### Blinded Pedersen Commitment
In Remainder, we use blinded Pedersen commitments in order to guarantee statistical zero-knowledge (produce statistically hiding commitments as [explained above](#properties)). This involves the prover holding a random tape (usually instantiated by a cryptographic pseudo-random number generator), and the prover and verifier agreeing beforehand on a "blinding generator" $h$. The prover simply adds $rh$, which $r$ sampled from the random tape to its original, either Pedersen scalar commitment or vector commitment, to produce a blinded commitment. More succinctly, the blinded Pedersen commitment to a message $m$ is $mg + rh$.

We go over how $\mathcal{V}$ can verify that $c$ is indeed the commitment to a set of messages $m$ in future sections. Note that the size of both of these commitments is a single elliptic curve point, but the cost of computing these varies on the number of messages.