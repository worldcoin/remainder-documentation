# Sumcheck

(Most of the content of this section is from Section 4.1 in [Proofs, Args, and ZK](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.pdf) by Justin Thaler, which has more detailed explanations of the below.)

This section will first cover the background behind the sumcheck protocol, and then provide an introduction as to why this may be useful in verifying the computation of layerwise arithmetic circuits.

The sumcheck protocol is an interactive protocol which verifies claims of the form:
$$H \overset{?}= \sum_{x_i \in \{0, 1\}}f(x_1, \dots, x_n).$$

In other words, the prover, $\mathcal{P},$ claims that the sum of the evaluations of a function $f: \mathbb{F}^n \to \mathbb{F}$ over the boolean hypercube of dimension $n$ is $H.$ Naively, the verifier $\mathcal{V}$ can verify this statement by evaluating this sum themselves in $O(2^n)$ time assuming oracle access to $f$ (being able to query evaluations of $f$ in $O(1)$ time), with perfect completeness (true claims are always identified by the verifier) and perfect soundness (false claims are always identified by the verifier).

Sumcheck relaxes the perfect soundness to provide a probabilistic protocol which verifies the claim in $O(n)$ time with a soundness error of $\leq \dfrac{n \cdot d}{|\mathbb{F}|}$ where $d$ is the maximum degree of any variable $x_1, \dots, x_n$.

## The Interactive Protocol

We start with a straw-man interactive protocol which still achieves perfect completeness and soundness in verifier time $O(2^n)$ and prover time $O(n).$ Then, we build on this version of the protocol and introduce randomness to achieve $O(n)$ prover and verifier time, with a soundness error of $\leq \dfrac{n \cdot d}{|\mathbb{F}|}.$

### A non-probabilistic protocol

Note that the sum we are trying to verify can be rewritten as such:
$$H \overset{?}= \sum_{x_1 \in \{0, 1\}}\sum_{x_2 \in \{0, 1\}}\sum_{x_3 \in \{0, 1\}}\dots\sum_{x_n \in \{0, 1\}}f(x_1, \dots, x_n).$$
Let's say $\mathcal{P}$ sends $\mathcal{V}$ the following univariate:
$$g_1(X) \overset{?}= \sum_{x_2 \in \{0, 1\}}\sum_{x_3 \in \{0, 1\}}\dots\sum_{x_n \in \{0, 1\}}f(X, x_2, \dots, x_n).$$
One way for $\mathcal{P}$ to communicate $g(X)$ to $\mathcal{V}$ the univariate $g(X)$ is to send $d + 1 = degree(g) + 1$ evaluations of $g(X)$. While $\mathcal{P}$ can alternatively send coefficients, we focus on this method of defining a univariate and assume $\mathcal{P}$ sends the evaluations $g(0), g(1), \dots, g(d)$ to $\mathcal{V}$.

$\mathcal{V}$ can verify whether $H$ is correct in relation to $g_1(X)$ by checking whether $H = g_1(0) + g_1(1).$ In other words, we have *reduced* the validity of claim that $H$ is the sum of the evaluations of $f$ over the $n$-dimensional boolean hypercube to the claim that $g_1(X)$ is the univariate polynomial over a smaller sum. 

Now the verifier has evaluations $g_1(0), g_1(1)$ to verify. We can similarly reduce this to claims over even smaller summations. Namely, now the prover sends over the following univariates:
$$g_{2, j}(X) \overset{?} = \sum_{x_3 \in \{0, 1\}}\sum_{x_4 \in \{0, 1\}}\dots\sum_{x_n \in \{0, 1\}}f(j, X, x_2, \dots, x_n), \quad \forall j \in [0, 1].$$

$\mathcal{P}$ and $\mathcal{V}$ keep engaging in such reductions until $\mathcal{V}$ is left to verify $2^n$ evaluations of $f$: this is exactly the evaluations of $f$ over the boolean hypercube, assuming that $\mathcal{V}$ has oracle access to $f$ (it can query evaluations of $f$ in $O(1)$ time).

We have transformed the naive solution, where $\mathcal{V}$ just evaluates the summation on their own, into an interactive protocol. In the next section we will go over how to slightly modify this by adding randomness to significantly reduce the costs incurred by $\mathcal{P}$ and $\mathcal{V}$.  

### Schwartz-Zippel Lemma

As a brief interlude, let us go over the Schwartz-Zippel Lemma, which we can use to modify the straw-man protocol. It states that if $f(x)$ is a nonzero polynomial with degree $d$, then the probability that $f(r) = 0$ for some random value $r$ sampled from a set $S$ is upper-bounded by $\dfrac{d}{|S|}$. 

This is can be seen because by the Fundamental Theorem of Alegbra, $f(x)$ has at most $d$ roots. We take the probability that we randomly sampled one of those roots out of a set of size $|S|$. 

In the case of sumcheck, we consider the polynomial to be over a field $\mathbb{F}$, and our randomly sampled element to be uniformly sampled from $\mathbb{F}$. 

### Introducing randomness

Our main blow-up with the straw-man interactive protocol came from the exponentially growing number of claims $\mathcal{V}$ had to verify, ending up with $2^n$ evaluations of $f$ at the end. Instead, if we found a way for the reduction from $g_i(X)$ to claims on $g_{i+1}(X)$ (or the reduction from the claim of $H$ to claims on $g_1(X)$) to be a one-to-one reduction in terms of number of claims, rather than one claim reduced to two claims, $\mathcal{V}$ would only have to verify $n$ claims, and $\mathcal{P}$ would only have to send over $n$ univariate polynomials.

Let us keep the first step the same, where $\mathcal{P}$ first sends the following univariate polynomial:
$$g_1(X) \overset{?}= \sum_{x_2 \in \{0, 1\}}\sum_{x_3 \in \{0, 1\}}\dots\sum_{x_n \in \{0, 1\}}f(X, x_2, \dots, x_n).$$

Now, $\mathcal{V}$ checks whether $H = g(0) + g(1).$ Instead of $\mathcal{P}$ sending both $g_{2,0}(X)$ and $g_{2, 1}(X)$, $\mathcal{V}$ uniformly samples a random challenge $r_1$ from $\mathbb{F}$ and sends this to $\mathcal{P}.$ 
$\mathcal{P}$ sends a single univariate: 
$$g_2(X) \overset{?}= \sum_{x_3 \in \{0, 1\}}\sum_{x_4 \in \{0, 1\}}\dots\sum_{x_n \in \{0, 1\}}f(r_1, X, x_3, \dots, x_n).$$
$\mathcal{V}$ checks whether $g_1(r) = g_2(0) + g_2(1).$ This process is repeated iteratively, until finally in the last round, where $\mathcal{P}$ sends $\mathcal{V}$ the following:

$$g_n(X) \overset{?}= f(r_1, \dots, r_{n-1}, X).$$

Assuming the verifier has oracle access to $f$, the verifier can check whether $g_n(r_n) = f(r_1, \dots, r_n)$. The difference between this protocol and the naive protocol above is that at each step, instead of individually verifying $g_i(0)$ and $g_i(1)$, $\mathcal{V}$ sends $\mathcal{P}$ a "challenge" $r$ in which $\mathcal{P}$ responds to by sending over the appropriate univariate polynomial. Therefore we have achieved a one-to-one claim reduction, and the verifier having to only verify one equation per round.

### Soundness Intuition

We provide brief intuition for the soundness bound from the above protocol. At any step $i$, the prover can cheat by sending a different univariate polynomial $h_i(X)$ instead of the expected $g_i(X)$ such that $h_i(r_i) = g_i(r_i)$, but $h_i(X) \neq g_i(X)$. Because $\mathcal{V}$ sends $r_i$ to $\mathcal{P}$, we can be confident that $\mathcal{P}$ does not adversarially choose $r_i$ to be one of the roots of $h_i(X) - g_i(X)$. Then, by the Schwartz-Zippel lemma, the probability that $r_i$ happened to be one of the "zeros" of $h_i(X) - g_i(X) = \dfrac{d_i}{|\mathbb{F}|}$ where $d_i$ is the degree of $h_i(X) - g_i(X).$ 

### Example

We do a short example of the sumcheck protocol in the integers. Let $f(x) = 3x_1x_2^2 + 4x_3x_2 + 5x_1^3x_3 + 2.$ $\mathcal{P}$ rightfully claims that $\sum_{x_1 \in \{0, 1\}}\sum_{x_2 \in \{0, 1\}}\sum_{x_1 \in \{0, 1\}}{f(x_1, x_2, x_3)} = H = 40.$ In order to verify this claim, $\mathcal{P}$ and $\mathcal{V}$ engage in a sumcheck protocol.

$\mathcal{P}$ sends $\mathcal{V}$ the univariate: $$g_1(X) = \sum_{x_{2} \in \{0, 1\}}\sum_{x_{3} \in \{0, 1\}}(3Xx_{2}^{2}+4x_{3}x_{2}+5X^{3}x_{3}\ +\ 2) = 10X^3 + 6X + 12.$$ $\mathcal{V}$ verifies that $(g_1(0) = 12) + (g_1(1) = 28) = 40 = H.$ Then, $\mathcal{V}$ samples the challenge $r_1 = 5$ and now $\mathcal{P}$ computes: $$g_2(X) = \sum_{x_{3} \in \{0, 1\}}(3(5)X^{2}+4Xx_{3}+5(5)^{3}x_{3} + 2) = 30X^2 + 4X + 629.$$

$\mathcal{V}$ checks that $(g_2(0) = 629) + (g_2(1) = 663) = 1292 = g_1(5).$ Next, $\mathcal{V}$ samples another challenge $r_2 = 7$ and sends it to $\mathcal{P}$ who then computes and sends $g_3(X) = 653X + 737.$ Finally, $\mathcal{V}$ samples another random challenge $r_3 = 3$ and checks whether $g_3(3) = f(5, 7, 3).$ Indeed, $g_3 = 2696 = f(5, 7, 3).$

## Why Sumcheck?
In the previous section, we introduced the notion of a multilinear extension of a polynomial $f$, which is defined as $$\widetilde{f}(x_1, \dots, x_n) = \sum_{z_i \in \{0, 1\}}{\widetilde{eq}(x; z) \cdot f(z_1, \dots, z_n)}.$$ Notice that naturally, a multilinear extension is defined by taking the sum over a boolean hypercube, which is what sumcheck proves claims over. 

In the next section, we will go over how we can encode layers of circuits as multilinear extensions, and prove statements about the output of these layers using sumcheck.