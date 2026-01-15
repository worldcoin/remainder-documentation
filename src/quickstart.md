# Quickstart
Hi there! Welcome to the official Remainder documentation/tutorial. For the code reference, see [this site (published soon!)](). Note that Remainder is specifically a GKR/Hyrax prover and that this tutorial assumes familiarity with basic concepts in zero-knowledge and interactive proofs. For a softer introduction to the basics behind verifiable computation, interactive proofs, and zero-knowledge, see Chapter 1 of [Justin Thaler's wonderful manuscript](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.pdf).

The documentation is split into four primary parts:
- [The first](./gkr_background/gkr_background.md) is an intuitive introduction to the "GKR" interactive proof scheme for layered circuits. The name "GKR" refers to Goldwasser, Kalai, and Rothblum, the co-authors of the [paper](https://dl.acm.org/doi/10.1145/2699436) which first introduced the notion of proving the correctness of layered circuits' outputs with respect to their inputs via sumcheck. If you are not familiar with GKR concepts, we strongly recommend you read this section before engaging with either of the next two sections or even the quickstart below.
- [The second](./gkr_theory/theory_overview.md) follows from the first and dives a tad deeper into the specific methodology of layerwise relationships, prover claims, etc. and explains the various concepts behind GKR in a loosely mathematical fashion. 
- [The third](./frontend/frontend_components.md) is a guide to Remainder's front end where we explain how the theoretical concepts described in earlier sections can be used in practice. It contains a lot of examples with runnable Rust code, and it can be studied independently or in conjunction with the second section.
- [The final](./hyrax/hyrax.md) is an introduction to the Hyrax [interactive proof protocol](https://eprint.iacr.org/2017/1132.pdf), a "wrapper" around the GKR protocol which offers statistical zero-knowledge in exchange for the use of elliptic curves. 

In addition, we provide a concise "how-to" quickstart here. This quickstart covers the basics of using Remainder as a GKR proof system library, including the following:
- Circuit description generation
- Appending inputs to a circuit description
- Proving and verifying

## Creating a Layered (GKR) Circuit
See [`frontend/examples/tutorial.rs`](https://github.com/worldcoin/Remainder_CE/blob/main/frontend/examples/tutorial.rs) for code reference. To run the test yourself, navigate to the `Remainder_CE` root directory and run the following command: 

```bash
cargo run --package frontend --example tutorial
```

To define a layered circuit, we must describe the circuit's inputs, intermediate layers and relationships between them, and output layers. We'll first take a look at the `build_circuit()` function. The first line is
```rust
let mut builder = CircuitBuilder::<Fr>::new();
```
This creates a new `CircuitBuilder` instance with native field `Fr` (BN254's scalar field). The `CircuitBuilder` is where all circuit components (nodes) will be aggregated and compiled into a full layered circuit. 

The next line is
```rust
let lhs_rhs_input_layer =
    builder.add_input_layer("LHS RHS input layer", LayerVisibility::Committed);
let expected_output_input_layer =
    builder.add_input_layer("Expected output", LayerVisibility::Public);
```

This adds two input _layers_ to the circuit (see the [Input Layer](./gkr_theory/input_layers.md) page for more details). Note that an input _layer_ is one which gets all claims on it bundled together and is treated as a single polynomial (multilinear extension) when the prover decides how to divide the circuit inputs to commit to each one.

In this example we separate the input data into _two_ separate input layers because we want some of them to be _committed_ instead of publicly known. This means that the verifier should only be able to see _polynomial commitments_ to the MLEs on such input layers (see [Committed Inputs](./gkr_theory/input_layers.md#committed-inputs)). Depending on the proving backend used (plain GKR vs. Hyrax), committed layers can act as _private layers_ in the sense that the verfier learns nothing about their contents when verifying a proof (more on that later on).

We then have the following:
```rust
let lhs = builder.add_input_shred("LHS", 2, &lhs_rhs_input_layer);
let rhs = builder.add_input_shred("RHS", 2, &lhs_rhs_input_layer);
let expected_output = builder.add_input_shred("Expected output", 2, &lhs_rhs_input_layer);
```

We add three input "shred"s to the circuit, the first two being subsets of the data in the `"LHS RHS input layer"`, and the last one being (the entire) `"Expected output"` layer. Each "shred" has 2 variables (i.e. has $2^2 = 4$ evaluations, and is identified with a unique string, e.g. `"RHS"`). The difference between an input layer and an input "shred" is that the latter refers to a specific subset of the input layer's data which should be treated as a contiguous chunk to be used as input to a later layer within the circuit. 

We begin adding layers to the circuit:
```rust
let multiplication_sector = builder.add_sector(lhs * rhs);
```
Notice that even though `lhs` and `rhs` are input "shred"s from the same input _layer_, because we added them as separate "shred"s earlier, we can now use them as separate inputs to be element-wise multiplied against one another. In general, input _layers_ are treated as a single entity by the verifier, while input _shreds_ are treated as subsets of input layers which the prover can use as inputs to other layers within the circuit.

This first layer is a "sector", which is the Remainder way of referring to [structured layerwise relationships](./gkr_theory/structured_gkr.md#structured-layerwise-relationship). This simply means that with evaluations $[a, b, c, d]$ in `lhs` and $[e, f, g, h]$ in `rhs`, the resulting layer should hold the element-wise product of the evaluations in `lhs` and those in `rhs`, i.e. $[ae, bf, cg, dh]$. 

We add another layer to the circuit:
```rust
let subtraction_sector = builder.add_sector(multiplication_sector - expected_output);

builder.set_output(&subtraction_sector);
```
This layer is another element-wise operator, but where we element-wise subtract all of the values rather than multiply them. Here, we are semantically subtracting the `expected_output` from the earlier layer we created which was the element-wise product of the values in `lhs` and `rhs` (see [this section](./gkr_background/encoding_layers.md#note-transforming-a-circuit-to-have-zero-output) for more details). The resulting layer should be zero if the two are element-wise equal, and we thus call `builder.set_output()` on the resulting layer, which tells the circuit builder that this layer's values should be publicly revealed to the verifier (and that no future layer depends on the values). 

Finally, we create the layered circuit from its components:
```rust
builder.build().expect("Failed to build circuit")
```
This creates a `Circuit<Fr>` struct which contains the layered circuit description (see [`GKRCircuitDescription`](./gkr_background/encoding_layers.md#circuit-description)), the mapping between nodes and layers (see `CircuitMap`), and the state for circuit inputs which have been partially populated already. 

## Populating Circuit Inputs
First, we instantiate the circuit description which we created above (see the function `tutorial_test()`):
```rust
let base_circuit = build_circuit();
let mut prover_circuit = base_circuit.clone();
let verifier_circuit = base_circuit.clone();
```
Note that we additionally create prover and verifier "versions" of the circuit. The reason for this is that the prover will want to attach input data to the circuit, whereas the verifier will want to receive those inputs from the proof itself and will not independently attach inputs to the circuit this time around. We additionally note that in general, rather than generating the circuit description once and then cloning for the prover and verifier, we will usually generate the circuit description and serialize it, then distribute the description to both the proving and verifying party. The above emulates this but in code.

The next step to proving the correctness of the output of a GKR circuit is to provide the circuit with _all_ of its inputs (including hints for "verification" rather than "computation" circuits, e.g. the binary decomposition of a value; note that Remainder currently does not have features which assist with computing such "hint" values and these will have to be manually computed outside of the main `prove()` function). In the case of our example circuit, we have the following:
```rust
let lhs_data = vec![1, 2, 3, 4].into();
let rhs_data = vec![5, 6, 7, 8].into();
let expected_output_data = vec![5, 12, 21, 32].into();
```
The `vec!`s above define the integer values belonging to the input "_shreds_" which we declared earlier in our circuit description definition (recall that "shreds" are already assigned to input _layers_). Additionally, since we declared earlier that e.g. `let lhs = builder.add_input_shred("LHS", 2, &input_layer);`, where the `2` represents the number of variables as the argument of the multilinear extension representing that input "shred", we have $2^2$ values within each input "shred", i.e. 4 evaluations for each of the above. 

We ask the circuit to set the above data using our string tags for the input "shred"s (note that we need an exact string match here). 
```rust
prover_circuit.set_input("LHS", lhs_data);
prover_circuit.set_input("RHS", rhs_data);
prover_circuit.set_input("Expected output", expected_output_data);
```

## Generating a GKR proof

We next "finalize" the circuit for proving, i.e. check that all declared input "shred"s have data associated to them, combine their data with respect to their declared input layer sources, and set up parameters for polynomial commitments to input layers, e.g. Ligero PCS.
```rust
let provable_circuit = prover_circuit
    .gen_provable_circuit()
    .expect("Failed to generate provable circuit");
```

Finally, we run the prover using the "runtime-optimized" configuration:
```rust
let (proof_config, proof_as_transcript) =
    prove_circuit_with_runtime_optimized_config::<Fr, PoseidonSponge<Fr>>(&provable_circuit);
```

This function returns a `ProofConfig` and a `TranscriptReader<Fr, PoseidonSponge<Fr>>`. The former tells the verifier which configuration it should run in to verify the proof, and the latter _is_ a transcript representing the full GKR proof (see [Proof/Transcript](./gkr_theory/proof.md) section for more details). 

## Verifying the GKR proof
To verify the proof, we first take the circuit description and prepare it for verification:
```rust
let verifiable_circuit = verifier_circuit
    .gen_verifiable_circuit()
    .expect("Failed to generate verifiable circuit");
```

Finally, we verify:
```rust
verify_circuit_with_proof_config::<Fr, PoseidonSponge<Fr>>(
    &verifiable_circuit,
    &proof_config,
    proof_as_transcript,
);
```

This function uses the provided `proof_config` and executes the GKR verifier against the `verifiable_circuit`, i.e. the verifier-ready circuit description. The function crashes if the proof does not verify for any reason, although in this case it should pass. 

Congratulations -- you have just
- Created your first layered circuit description
- Attached data to the circuit input layers
- Proven the correctness of the circuit outputs against the inputs
- Verified the resulting GKR proof
