# Sector Layer Frontend Tutorial

To express structured layer-wise relationships in Remainder, we can use a Structured GKR Layer,
a.k.a "Sector" layer.
A Sector layer is defined through an `AbstractExpression<F>` type. 
Expressions can be built by combining MLEs referenced by the primitive type `NodeRef<F>` through
overloaded binary operators (currently available are `+, -, *, ^` for addition, subtraction,
multiplication and boolean XOR), or using `Selector`s.

## Example 1: Multiplying two MLEs

Let's start with a simple circuit which multiplies two MLEs element-wise.
For example, the MLE $V_1(z_0, z_1)$ with evaluations $[a, b, c, d]$ with the MLE $V_2(z_0, z_1)$
with evaluations $[e, f, g, h]$, to produce the MLE $V_3(z_0, z_1) = V_1(z_0, z_1) \cdot V_2(z_0,
z_1)$ with evaluations $[a\cdot e, b\cdot f, c\cdot g, d \cdot h]$.

To express this in Remainder, we can simply write:

```rust
let v1 = builder.add_input_shred("MLE 1", 2, &input_layer);
let v2 = builder.add_input_shred("MLE 2", 2, &input_layer);

let v3 = builder.add_sector(v1 * v2); 
```

In this example the input MLEs to the Sector were input shreds, but in general they can be any
layer of the circuit. We can, for example follow the above code segment with:

```rust
let v4 = builder.add_sector(&v3 * &v3);
```

which squares the entries of the MLE $V_3$.

**Implmentation Note**: *The use of references here is an unfortunate quirk of the way `NodeRef<F>`'s
are implemented. They are essentially wrappers around weak smart pointers, and thus not `Copy`-able.
This means that the multiplication function needs to take ownership of its operands, and the
expression `v3 * v3` would produce a compile error since `v3` has already been dropped when it
appears the second time. Our workaround is to provide overloaded operators for both
owned and referenced types, and let the user decide which one is more appropriate for each use.
TODO: Add links to Remainder docs.* 

Expressions can be combined into a single Sector layer. For example, above we expressed the
relationship $V_4(z_0, z_1) = (V_1(z_0, z_1) * V_2(z_0, z_1))^2$, using two layers, but we could
have equivalently written:

```rust
let v4 = builder.add_sector( (&v1 * &v2) * (v1 * v2) );
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
MLE $V_3(z_0, z_1)$ on two varibles defined by $V_3(z_0, z_1) = V_1(z_0, z_1) \cdot V_2(z_0)$,
i.e. equating the common MLE variables starting from the left.

Viewing the MLEs as evaluation vectors, if $V_1 = [a, b, c, d]$ and $V_2 = [e, f]$,
then $V_3 = [ a\cdot e, b\cdot e, c\cdot f, d \cdot f]$.

See `run_example_1b()` in `frontend/examples/sector.rs` for the full code of this example.

# Example 2: Spliting MLEs

# Example 3: Using constants in Expressions.

# Exmaple 4: Using Selectors in Expressions.

# Example 5: Using the XOR boolean operator.
