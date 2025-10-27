# Hyrax Primitives

We go over various sigma protocols (interactive proofs with just 3 rounds of interaction) that allow the prover to prove various statements on its committed messages without having to open the commitment. For all of these protocols, let $g_i$ be the message commitment generators, and $h$ be the blinding generator. Assume the prover produces the blinding factor $r$ using a cryptographic PRNG.

## Proof of Opening
In a Proof of Opening, $\mathcal{P}$ shows that given a commitment $C_0 = xg + rh$, $\mathcal{P}$ knows the message $x$ and blinding factor $r$ used to generate this commitment. 

1. $\mathcal{P} \to \mathcal{V}:$ $\mathcal{P}$ samples $t_1, t_2$ uniformly from the scalar field of $\mathbb{G}$, $\mathbb{F}_p$. $\mathcal{P}$ computes and sends over $\alpha = t_1g + t_2h.$
2. $\mathcal{V} \to \mathcal{P}:$ A random challenge $c$ from $\mathbb{F}_p$.
3. $\mathcal{P} \to \mathcal{V}:$ $z_1 = x\cdot c + t_1$, and $z_2 = r \cdot c + t_2$. 
4. $\mathcal{V}$ checks: $z_1g + z_2h \overset{?}= cC_0 + \alpha.$

## Proof of Equality

In a Proof of Equality, $\mathcal{P}$ convinces $\mathcal{V}$ that two commitments $C_0 = v_0g + s_0h$ and $C_1 = v_1g + s_1h$ commit to the same value. In other words $\mathcal{P}$ knows that $v_0 = v_1$, but $\mathcal{V}$ only sees the commitments, which are different group elements.

1. $\mathcal{P} \to \mathcal{V}:$ $\mathcal{P}$ first uniformly samples a random value $r$ from $\mathbb{F}_p$. $\mathcal{P}$ sends $\mathcal{V}$ $\alpha = rh$.
2. $\mathcal{V} \to \mathcal{P}:$ A random challenge $c$ from $\mathbb{F}_p$.
3. $\mathcal{P} \to \mathcal{V}:$ $z = c \cdot (s_0 - s_1) + r$
4. $\mathcal{V}$ checks: $zh \overset{?}= cC_0 - cC_1 + \alpha.$

## Proof of Product

Proof of product shows that a commitment $Z = zg + r_Zh$ is a commitment to the product of the messages committed to in $X = xg + r_Xh$ and $Y = yg + r_Yh.$ In other words, $\mathcal{P}$ knows that $x \cdot y = z$ and wants to prove this to $\mathcal{V}$ without revealing the messages and just using the commitments.

1. $\mathcal{P} \to \mathcal{V}:$ $\mathcal{P}$ uniformly samples $b_1, \dots, b_5$ from $\mathbb{F}_p$ and computes and sends over $\alpha = b_1g + b_2h, \beta = b_3g + b_4h, \delta = b_3X + b_5h.$
2. $\mathcal{V} \to \mathcal{P}:$ A random challenge $c$ from $\mathbb{F}_p$.
3. $\mathcal{P} \to \mathcal{V}:$ $z_1 = b_1 + c \cdot x, \\ z_2 = b_2 + c \cdot r_X, \\ z_3 = b_3 + c \cdot y, \\ z_4 = b_4 + c \cdot r_Y, \\ z_5 = b_5 + c \cdot (r_Z - r_Xy).$
4. $\mathcal{V}$ checks: $\alpha + cX \overset{?}= z_1g + z_2h, \\ \beta + cY \overset{?}= z_3g + z_4h, \\ \delta + cZ \overset{?}= z_3X + z_5h.$

## Proof of Dot Product

Given $\mathcal{P}$'s commitment to a vector $\vec{x} \in \mathbb{F}_p^n$, $C_0 = x_1g_1 + x_2g_2 + \dots + x_ng_n + r_0h,$ and a public vector $\vec{a}$ (known to both $\mathcal{V}$ and $\mathcal{P}$), and $\mathcal{P}$'s commitment to the claimed dot product $\big<x, a\big> = y$, which is $C_1 = yg_1 + r_1h,$ $\mathcal{P}$ shows $\mathcal{V}$ that they know a vector $\vec{x}$ such that $\big<\vec{x}, \vec{a}\big>$ is equal to the message committed to in $C_1.$

1. $\mathcal{P} \to \mathcal{V}:$ $\mathcal{P}$ samples a random vector in $\mathbb{F}_p^n$, $\vec{d}$. $\mathcal{P}$ samples $r_\delta, r_\beta$ and computes and sends: $\delta = d_1g_1 + \dots + d_n g_n + r_\delta h$ and $\beta = yg_1 + r_\beta h.$
2. $\mathcal{V} \to \mathcal{P}:$ A random challenge $c$ from $\mathbb{F}_p$.
3. $\mathcal{P} \to \mathcal{V}:$ $\vec{z} = c \cdot \vec{x} + \vec{d}; z_\delta = c \cdot r_0 + r_\delta; z_\beta = c \cdot r_1 + r_\beta.$
4. $\mathcal{V}$ checks: $cC_0 + \delta \overset{?}= z_1g_1 + \dots + z_ng_n + z_\delta h; cC_1 + \beta \overset{?}= \big<z, a\big>g_1 + z_\beta h.$ 