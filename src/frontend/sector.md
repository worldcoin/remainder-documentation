# Sector Layer Frontend Tutorial

To express structured layer-wise relationships in Remainder, we can use a Structured GKR Layer,
a.k.a "Sector" layer.  A Sector layer is defined through an `AbstractExpression<F>` type, also
simply called "Expression" in this tutorial.  Expressions can be built by combining MLEs.  To refer
to an MLE we use the `NodeRef<F>` values returned by the circuit builder when the respective MLE was
added.  MLEs can be combined through overloaded binary operators (currently available are `+, -, *`
for addition, subtraction and multiplication respectively), or using a `Selector`.

Let's walk through a few examples of the usage of Sector layers using Remainder circuit building
interface.

## Example 1: Multiplying two MLEs

We start with a simple circuit that multiplies two MLEs element-wise: an MLE $V_1(z_0, z_1)$ with
evaluations (over the boolean hypercube) $[a, b, c, d]$ with an MLE $V_2(z_0, z_1)$ with evaluations
$[e, f, g, h]$, to produce the MLE $V_3(z_0, z_1) = V_1(z_0, z_1) \cdot V_2(z_0, z_1)$ with
evaluations $[a\cdot e, b\cdot f, c\cdot g, d \cdot h]$.

To express this in Remainder, we can simply write:

```rust
/* ... define the input layer `input_layer` ... */

// Define the input shreds for `V_1` and `V_2`.
let v1 = builder.add_input_shred("MLE 1", 2, &input_layer);
let v2 = builder.add_input_shred("MLE 2", 2, &input_layer);

// Define the Sector layer that performs the multiplication operation.
let v3 = builder.add_sector(v1 * v2); 
```

In this example the input MLEs to the Sector were input shreds, but in general they can be _any
node_ appearing in the circuit. We can, for example, follow the above code segment with:

```rust
let v4 = builder.add_sector(&v3 * &v3);
```

which squares the entries of the MLE $V_3$.

**Implmentation Note**: *The reason we're borrowing `v3` is an unfortunate quirk of the way
the `NodeRef<F>` type is implemented. It is a wrapper around a weak pointer, and thus not
`Copy`-able.  This means that the multiplication operator will try to take ownership of its two
operands, and after the first occurance of `v3` has moved, the second one will fail with a compile
error. To avoid unneseccary cloning, we provide an implementation of the `Mul` trait for borrowed
operands as well (e.g.  `&NodeRef<F>`) to allow developers to use the succinct borrowed syntax
we presented above when there is a need to reuse `NodeRef<F>`s.
TODO: Add links to Remainder docs.* 

Expressions may be combined into a single Sector layer. For example, previously we expressed the
relation $V_4(z_0, z_1) = (V_1(z_0, z_1) * V_2(z_0, z_1))^2$ using two layers, but we could
have equivalently written:

```rust
let v4 = builder.add_sector( (&v1 * &v2) * (&v1 * &v2) );
```

See `run_example_1a()` in `frontend/examples/sector.rs` for the full code of the preceeding
examples.

**Efficiency Note**: *It's important to note that the two alternative ways of defining `v4`
presented above result in _different_ circuits, even though they're _semantically equivalent_. The
circuit's structure (number of layers, expression structure etc.) can affect the prover/verifier
runtime. Refer to [Section 3: GKR Theory](/gkr_theory/theory_overview.md) for more information.*

What would happen if we tried to multiple two MLEs of different sizes?  You might expect that
element-wise operations are not well defined if the two MLEs are not of the same size, but there is
a mathematically natural interpretation for such a formula, which we adopt in Remainder.

Let $V_1(z_0, z_1)$ be an MLE on two variables, and $V_2(z_0)$ be an MLE on only one variable.
One natural interpretation for the expression $V_1 \cdot V_2$ is an
MLE $V_3(z_0, z_1)$ on two variables defined by $V_3(z_0, z_1) = V_1(z_0, z_1) \cdot V_2(z_0)$,
i.e. equating the common MLE variables starting from the left.

Viewing the MLEs as evaluation vectors, if $V_1 = [a, b, c, d]$ and $V_2 = [e, f]$,
then $V_3 = [ a\cdot e, b\cdot e, c\cdot f, d \cdot f]$.

See `run_example_1b()` in `frontend/examples/sector.rs` for a working example.

## Example 2: Spliting MLEs

Recall the first example of a Structured layer we saw in [Section
3.1](/gkr_theory/structured_gkr.md) which performed the operation $V_2(z_0, z_1) =
V_1(0, z_0, z_1) \cdot V_1(1, z_0, z_1)$ on the 3-variable MLE $V_1$
with evaluations $[a, b, c, d, e, f, g, h]$ to produce $[a\cdot e, b\cdot f, c\cdot g, d\cdot h]$.

With what we've seen so far, it's not clear how to express this relation in Remainder. If we have a
`NodeRef<F>` instance for the $V_1$ MLE, it refers by default to the entire MLE.  But
here, we'd like to refer to a _subset_ of that MLE, in particular one for which a prefix of its
variables has been fixed to a certain binary string.

Remainder provides a special kind of node to be used during circuit creation to take any node
refering to an MLE $V(z_0, z_1, \ldots, z_{n-1})$ and generate $2^k$ `NodeRef<F>` instances refering
to the MLEs $V(\underbrace{0, \ldots, 0, 0}_k, z_0, \ldots, z_{n-k-1}), V(\underbrace{0, \ldots, 0,
1}_k, z_0, \ldots, z_{n-k-1}), \ldots, V(\underbrace{1, \ldots, 1, 1}_k, z_0, \ldots, z_{n-k-1})$
for any integer $1 \le k \le n$. Conceptually, a Split node is _splitting_ the MLE's evaluation
table into $2^k$ parts which can be referenced separately.

Having this tool handy, we can now implement the example from Section 3.1 as follows:

```rust
// The Input MLE [a, b, c, d, e, f, g, h].
let mle = builder.add_input_shred("Input MLE", 3, &input_layer);

// Split the MLE into two halves (k = 1): left = [a, b, c, d] and right = [e, f, g, h].
let [left, right]: [_; 2] = builder.add_split_node(&mle, /* k = */ 1).try_into().unwrap();

// Multiply the two halves together using a sector node and the expression `left * right`,
// producing the output MLE [a*e, b*f, c*g, d*h].
let sector = builder.add_sector(left * right);
```

You can see a full working example in `run_example_2()` in `frontend/examples/sector.rs`.

*Efficiency Note*: A Split node does _not_ get compiled into a GKR layer. It's a
construct used only during circuit building to do all the necessary bookkeeping.

## Example 3: Using constants in Expressions.

We've seen how to write expressions involving MLEs, but sometimes it's also useful to include
constants from the field $\mathbb{F}$ we're operating on. For example, the expression $V_3(z_0, z_1)
= V_1(z_0, z_1) + 42\cdot V_2(z_0, z_1)$ is a valid Structured layer relationship.

We can express the multiplication by a constant above simply by multiplying `v2: NodeRef<F>` with a
value `F::from(42)` of type `F`:

```rust
/* ... create nodes for `v1` and `v2` ... */

let v3 = builder.add_sector(v1 + v2 * F::from(42));
```

It's important to note here that the multiplication needs to happen with the constant _on the
right_. The compiler would reject the expression `F::from(42) * v2` in the above context.  This is
due to subtle quirk of how Rust's operator overloading interracts with Rust's rule of forbidding the
implementation of external traits for externals types: in this case `F` may be a field type defined
outside the Remainder crate and `std::ops::Mul`, an external trait, cannot be implemented for it
inside the Remainder crate.

See `run_example_3()` in `frontend/examples/sector.rs` for a full working example.

*Note*: It is also possible to express this relation by adding a constant MLE $V_{\text{const}, 42}$
(on zero variables) with evaluation table equal to $[42]$, and thus expressing
$V_3$ as: $V_3(z_0, z_1) = V_1(z_0, z_1) + V_{\text{const}, 42}(\ ) \cdot V_2(z_0, z_1)$.
Essentially treating the constant as an input parameter. However this can be inefficient since it
complicates the expression to be proven (potentially affecting the prover's/verifier's runtime), as
well as increases the size of the generated proof because all the constant values would need to be
included in the transcript.

## Exmaple 4: Using Selectors in Expressions.

"Selectors", introduced in [Section 3.1](/gkr_theory/structured_gkr.md), are a a structured way to
express certain "if-then-else" expressions inside a circuit.

Recall the following linear expression we used as an example in Section 3.1:

$$ V_2(z_0, z_1) =
    (1 - z_0) \cdot V_1(0, z_1) \cdot V_1(0, z_1) + z_1\cdot 2\cdot V_1(1, z_1) $$

We argued it represents the transformation $[a, b, c, d] \to [a^2, b^2, 2c, 2d]$, where each entry
of the output MLE is either the square or the double the respective entry of the input MLE, and
the choice of operation depends on the index of the value in the evaluation table of the output MLE.

The general construct $(1 - z_0)\cdot E_1 + z_0 \cdot E_2$, where $E_1, E_2$ are arbitrary
expressions, can be expressed in Remainder using the macro
`sel_expr!(E_1, E_2)` for `E_1, E_2: AbstractExpression<F>`.
The macro produces an expression, which can directly be fed into a Sector node.

All that remains is to use a Split node to get node references to
`V_1(0, z_1)` and `V_1(1, z_1)`, and we can implement $V_2$ as:

```rust 
/* ... create a node for `v1` ... */

// Split V1 into V1_l(z_1) = V1(0, z_1) and V1_r(z_1) = V1(1, z_1).
let [v1_l, v1_r]: [_; 2] = builder.add_split_node(&v1, 1).try_into().unwrap();

// Selector layer.
let v2 = builder.add_sector(sel_expr!(&v1_l * &v1_l, &v1_r * F::from(2)));
```

See `run_exampl_4` in `frontend/examples/sector.rs` for a full working example.