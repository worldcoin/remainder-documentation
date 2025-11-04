# Hyrax Interactive Protocol

Hyrax is a transformation to the GKR protocol which makes it zero knowledge. The GKR protocol as explained in our [GKR Tutorial](./gkr_tutorial.md) is not zero knowledge on its own. Recall that in the section about what [GKR Proofs](./gkr_tutorial/proof.md) look like, we mention that GKR proofs contain the [sumcheck](./gkr_tutorial/sumcheck.md) messages from the sumcheck protocol performed for each layer of the arithmetic circuit. 

Each of these sumcheck messages are the evaluations of a very particular univariate polynomial, constructed based on the data contained within that layer. Therefore, each of these evaluations leak a little bit of information on the data contained within a circuit, and these can be used to construct a system of equations that reveal some information about private inputs to a circuit.

Therefore, in use cases which require a zero knowledge proof of the output of a circuit, we use the Hyrax interactive protocol to transform GKR circuits into a variant which produces a zero knowledge proof. The high-level overview of the protocol is that rather than $\mathcal{P}$ sending $\mathcal{V}$ evaluations of the univariates directly, $\mathcal{P}$ sends $\mathcal{V}$ [Pedersen commitments](./hyrax/pedersen_commitments.md) of these evaluations, and $\mathcal{V}$ is able to verify these commitments to sumcheck messages by taking advantage of the additive homomorphism of Pedersen commitments. 

For the remainder of this chapter we use additive group notation because this is the notation our code in Remainder is written in.

## Background

The Hyrax protocol is defined over any cyclic group $\mathbb{G}$ of prime order. We break down what this means below.

* **Group:** A group $\mathbb{G}$ is an algebraic structure which is closed under a chosen binary operation, usually called the **group operation**. This means that if $a \in \mathbb{G}$ and $b \in \mathbb{G}$, and the group operation of $\mathbb{G}$ is denoted by $\star$, $a \star b \in \mathbb{G}$. Additionally, $\mathbb{G}$ satisfies the following properties:
    * **Associativity:** $\forall a, b, c \in \mathbb{G}, a \star (b \star c) = (a \star b) \star c$.
    * **Identity** $\exists e \in \mathbb{G}$ such that $\forall a, a \star e = e \star a = a$.
    * **Inverses** $\forall a \in \mathbb{G}, \exists b$ such that $a \star b = b \star a = e$.
* **Order:** The number of elements in a group, denoted by $|\mathbb{G}|$.
* **Finite:** $\mathbb{G}$ is finite if it has finitely many elements.
* **Cyclic:** $\mathbb{G}$ is cyclic if it contains a **generator** $g$ such that $\forall a \in \mathbb{G}, \exists n$ such that $\underbrace{g \star g \star \dots \star g}_n = a$. In this case, we say that $\mathbb{G}$ is *generated* by $g$, meaning by composing $g$ with itself $k$ times, where $k \in [0, \ell - 1]$ and $\ell = |\mathbb{G}|$, we can enumerate every element of $\mathbb{G}.$
* **Prime Order:** A group has prime order if $|\mathbb{G}|$ is prime.

In Remainder, we instantiate Hyrax over an elliptic curve group, denoted below as $\mathbb{G}$, with prime order (defined by the trait `PrimeOrderCurve`). 

Elliptic curve consists of points in a finite field satisfying the equation $y^2 = x^3 + ax + b$. An elliptic curve group's binary operation is "point addition," which we denote with $+$. If we add $a \in \mathbb{G}$ to itself $k$ times, we call this operation "scalar multiplication," denoted by $ka$. While we won't go into full detail on elliptic curves in this tutorial, we define some operations that will make it easier to follow the rest of this section and the codebase. For more information on elliptic curves, you can read these [notes on an introduction to elliptic curves](https://ocw.mit.edu/courses/18-783-elliptic-curves-spring-2021/8e48c8ba9df0597df419f53a7a79f720_MIT18_783S21_Slides1.pdf).

* **Base Field:** If $g \in \mathbb{G}$, $g$ is defined by coordinates on a plane (either two or three, depending on the notation being used as explained below). Each of the coordinates of $x$ belong to the base field, which we denote as $\mathbb{F}_q.$ For example, if $g = (a, b)$, then $a, b \in \mathbb{F}_q$.

* **Scalar Field:** The scalar field is the field $\mathbb{F}_p$, where $p = |\mathbb{G}|$, whose equivalence classes are the integers $[0, p-1].$ In other words, because $\mathbb{G}$ is cyclic, it contains a generator $g.$ $\forall a \in \mathbb{G}$, $a = kg$ for some $k \in [0, p-1].$

* **Group Element:** A group element $g \in \mathbb{G}$ is a point on the coordinate plane, and can be represented in many ways. We present the three types of representations used in the Remainder codebase below:
    * **Affine Coordinates:** Affine coordinates are elliptic curve points represented in the traditional 2D plane, and are denoted as $(x, y)$.
    * **Projective Coordinates:** Projective coordinates are points on the projective plane, represented by $(x, y, z)$ where each point is the value in the appropriate dimension. To convert an affine coordinate $(x, y)$ to its projective coordinates, simply multiply each coordinate by some element $z \in \mathbb{F}_q$ to get $(zx, zy, z)$. For every affine coordinate, there is a class of projective coordinates that define the same point. To go from a projective coordinate $(x, y, z)$ to its equivalent affine coordinate, the value is simply $(xz^{-1}, yz^{-1})$. 
    * **Jacobian Coordinates:** A jacobian coordinate $(x, y, z) \in \mathbb{G}$ represents the affine coordinate $(xz^{-2}, yz^{-3})$.

* **Point at Infinity:** Note that it is not possible to define the appropriate affine coordinate corresponding to a projective coordinate if $z = 0.$ This is exactly the point at infinity, represented by the point $(0, 1, 0)$.

# Roadmap

For the rest of this chapter, we will first cover the [Hyrax primitives](./hyrax/hyrax_primitives.md), which allows us to prove properties of different blinded Pedersen commitments, such as proving that two commitments which look different (are different group elements) commit to the same message without having to open the commitment, or that the prover knows the message used to produce a commitment without having to open the commitment. We then move on to more complex proofs over Pedersen commitments such as [Proof of Sumcheck](./hyrax/proof_of_sumcheck.md) and [Proof of Claim Aggregation](./hyrax/proof_of_claim_agg.md) which prove that the prover has properly executed sumcheck or claim aggregation. Finally, we show how the primitives and more intermediate protocols can be [put together](./hyrax/hyrax_putting_together.md) to produce a valid GKR proof which only consists of blinded Pedersen commitments.