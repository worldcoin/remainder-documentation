# Quickstart
Hi there! Welcome to the official Remainder documentation/tutorial. For the code reference, see [this(TODO) site](). Note that Remainder is specifically a GKR/Hyrax prover and that this tutorial assumes familiarity with basic concepts in zero-knowledge and interactive proofs. For a softer introduction to the basics behind verifiable computation, interactive proofs, and zero-knowledge, see Chapter 1 of [Justin Thaler's wonderful manuscript](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.pdf).

The documentation is split into three primary parts:
- [The first](./encoding_layers.md) is an intuitive introduction to the "GKR" interactive proof scheme for layered circuits. The name "GKR" refers to Goldwasser, Kalai, and Rothblum, the co-authors of the [paper](https://dl.acm.org/doi/10.1145/2699436) which first introduced the notion of proving the correctness of layered circuits' outputs with respect to their inputs via sumcheck. If you are not familiar with GKR concepts, we strongly recommend you read this section before engaging with either of the next two sections or even the quickstart below.
- [The second](./canonical_gkr.md) follows from the first and dives a tad deeper into the specific methodology of layerwise relationships, prover claims, etc. and explains the various concepts behind GKR in a loosely mathematical fashion. 
- [The third](./frontend_basic_tutorial.md) also follows from the first and describes the same concepts as the second, but in less detail and complete with code examples. 

In addition, we provide a concise "how-to" quickstart here. 

## Creating a Layered (GKR) Circuit
See `remainder_frontend/tests/tutorial.rs` (TODO -- put link here) for code reference. To define a layered circuit, we must describe the circuit's inputs, intermediate layers and relationships between them, and output layers. We'll first take a look at the `build_circuit()` function. The first line is
```rust
let mut builder = CircuitBuilder::<Fr>::new();
```
This creates a new `CircuitBuilder` instance with native field `Fr` (BN254's scalar field). The `CircuitBuilder` is where all circuit components (nodes) will be aggregated and compiled into a full layered circuit. 

The next line is
```rust
let input_layer = builder.add_input_layer("Input Layer", LayerVisibility::Private);
```
This adds an input _layer_ to the circuit. Note that an input _layer_ is one which gets all claims on it bundled together and is treated as a single polynomial (multilinear extension) when the prover decides how to divide the circuit inputs to commit to each one. We then have the following:
```rust
let lhs = builder.add_input_shred("LHS", 2, &input_layer);
let rhs = builder.add_input_shred("RHS", 2, &input_layer);
let expected_output = builder.add_input_shred("Output", 2, &input_layer);
```
We add three input "shred"s to the circuit, all of which are subsets of the data within the input layer which we added earlier. Each "shred" has 2 variables (i.e. has $2^2 = 4$ evaluations, and is identified with a unique string, e.g. `"RHS"`). The difference between an input layer and an input "shred" is that the latter refers to a specific subset of the input layer's data which should be treated as a contiguous chunk to be used as input to a later layer within the circuit. 

We begin adding layers to the circuit:
```rust
let multiplication_sector = builder.add_sector(lhs * rhs);
```
This first layer is a "sector", which is the Remainder way of referring to [structured layerwise relationships](./regular_gkr.md). This simply means that with evaluations $[a, b, c, d]$ in `lhs` and $[e, f, g, h]$ in `rhs`, the resulting layer should hold the element-wise product of the evaluations in `lhs` and those in `rhs`, i.e. $[ae, bf, cg, dh]$. 

We add another layer to the circuit:
```rust
let subtraction_sector = builder.add_sector(multiplication_sector - expected_output);

builder.set_output(&subtraction_sector);
```
This layer is another element-wise operator, but where we element-wise subtract all of the values rather than multiply them. Here, we are semantically subtracting the `expected_output` from the earlier layer we created which was the element-wise product of the values in `lhs` and `rhs`. The resulting layer should be zero if the two are element-wise equal, and we thus call `builder.set_output()` on the resulting layer, which tells the circuit builder that this layer's values should be publicly revealed to the verifier (and that no future layer depends on the values). 

Finally, we create the layered circuit from its components:
```rust
builder.build().unwrap()
```
This creates a `Circuit<Fr>` struct which contains the layered circuit description (see `GKRCircuitDescription`), the mapping between nodes and layers (see `CircuitMap`), and the state for circuit inputs which have been partially populated already. 

## Populating Circuit Inputs
The next step to proving the correctness of the output of a GKR circuit is to provide the circuit with _all_ of its inputs (including hints for "verification" rather than "computation" circuits, e.g. the binary decomposition of a value; note that Remainder currently does not have features which assist with computing such "hint" values and these will have to be computed from scratch). In the case of our example circuit (see the function `tutorial_test()`), we have the following:
```rust
let lhs_data = vec![1, 2, 3, 4].into();
let rhs_data = vec![5, 6, 7, 8].into();
let expected_output_data = vec![5, 12, 21, 32].into();
```
The `vec!`s above define the integer values belonging to the input "_shreds_" which we declared earlier in our circuit description definition (recall that "shreds" are already assigned to input _layers_). Additionally, since we declared earlier that e.g. `let lhs = builder.add_input_shred("LHS", 2, &input_layer);`, where the `2` represents the number of variables as the argument of the multilinear extension representing that input "shred", we have $2^2$ values within each input "shred", i.e. 4 evaluations for each of the above. 

We ask the circuit to set the above data using our string tags for the input "shred"s (note that we need an exact string match here). 
```rust
circuit.set_input("LHS", lhs_data);
circuit.set_input("RHS", rhs_data);
circuit.set_input("Output", expected_output_data);
```

We next "finalize" the circuit for proving, i.e. check that all declared input "shred"s have data associated to them, combine their data with respect to their declared input layer sources, and set up parameters for polynomial commitments to input layers, e.g. Ligero PCS.
```rust
let provable_circuit = circuit.finalize().unwrap();
```

Finally, we run the prover 