# Hyrax Frontend Tutorial

This tutorial closely resembles the one for Remainder's GKR prover/verifier,
i.e. the one written in the [quickstart](../quickstart.md) section. The code
for the Hyrax frontend tutorial is [here](https://github.com/worldcoin/Remainder_CE/blob/44a2526d0b54774eec44b7ea8739c5fa3dd66a9b/frontend/examples/hyrax_tutorial.rs), and can be run from the `Remainder_CE`
root directory via the following command:

```bash
cargo run --package frontend --example hyrax_tutorial
```

Note that although this tutorial is a code-only, standalone tutorial, we would
very strongly encourage you to read through at least the [Hyrax introduction](../hyrax/hyrax.md)
section to get a better understanding of what the various code pieces represent
and why Hyrax is one of several options for converting GKR into a fully zero-knowledge
protocol.

## Setting up the circuit
This uses the exact same code/circuit as the one from the [quickstart](../quickstart.md),
and we encourage you to check out that section to understand the structure of
the circuit described here. Indeed, the `Circuit<F>` generation function within
`frontend/examples/hyrax_tutorial.rs` is a copy/paste of the one in `frontend/examples/tutorial.rs`.

As a quick reminder, the circuit we defined (see `build_circuit()`) has two
input layers, one private/committed and one public. The private/committed input
layer contains two sub-inputs, `"LHS"` and `"RHS"`, and the public input layer contains
a single sub-input, `"Expected output"`. In the GKR case/tutorial, we used the (non-ZK)
[Ligero PCS](../gkr_theory/ligero_input.md) to commit to and open the committed
input layer at a challenge point, and in the Hyrax case, the prover will be
using the zero-knowledge [Hyrax PCS](../hyrax/hyrax_pcs.md) to do the same.

```rust
let lhs_rhs_input_layer =
    builder.add_input_layer("LHS RHS input layer", LayerVisibility::Committed);
let expected_output_input_layer =
    builder.add_input_layer("Expected output", LayerVisibility::Public);
```

Recall that we create two copies of the `Circuit<F>`: one for the prover (to
attach private and public input data to), and one for the verifier (no data
attached):

```rust
// Create the base layered circuit description.
let base_circuit = build_circuit();
let mut prover_circuit = base_circuit.clone();
let verifier_circuit = base_circuit.clone();
```

Similarly to the GKR tutorial, we generate input data for the circuit and attach
them to the prover circuit:

```rust
// Generate circuit inputs.
let lhs_data = vec![1, 2, 3, 4].into();
let rhs_data = vec![5, 6, 7, 8].into();
let expected_output_data = vec![5, 12, 21, 32].into();

// Append circuit inputs to their respective input "shreds" in the prover's
// view of the circuit.
prover_circuit.set_input("LHS", lhs_data); // This is committed!
prover_circuit.set_input("RHS", rhs_data); // This is committed!
prover_circuit.set_input("Expected output", expected_output_data); // This is public!
```

## Setting up the proving environment
Next, we create a pair of proving/verification configs. We won't elaborate on
the specific configuration options here, but the idea is that they are effectively
a group of global context variables which affect certain proving/verification
options (e.g. trading off runtime vs. memory usage, whether to use certain
optimizations, etc.). Note that in the quickstart, we hid the config + macro
API with another wrapper for simplicity, but are exposing the options here. 
For now, we will stick with the "Hyrax compatible runtime-optimized default" option:

```rust
// Create GKR circuit prover + verifier configs which work with Hyrax
let hyrax_circuit_prover_config =
    GKRCircuitProverConfig::hyrax_compatible_runtime_optimized_default();
let hyrax_circuit_verifier_config =
    GKRCircuitVerifierConfig::new_from_prover_config(&hyrax_circuit_prover_config, false);
```

Similarly to how we needed to create a `ProvableCircuit<F>` in the GKR tutorial,
we invoke a similar function here, `gen_hyrax_provable_circuit()`, to gather our
previously attached circuit inputs and prepare the circuit for proving:

```rust
// Create a version of the circuit description which the prover can use.
// Note that in this case, we create a "Hyrax-provable" circuit rather than
// a "GKR-provable" one.
let mut hyrax_provable_circuit: HyraxProvableCircuit<Bn256Point> = prover_circuit
    .gen_hyrax_provable_circuit()
    .expect("Failed to generate provable circuit");
```

Next, we prepare a couple of structs which are specific to Hyrax proving. First,
we create a Pedersen committer, which creates and keeps track of the group generators
to be used in proving (see our [Hyrax overview](../hyrax/hyrax.md) and
[Pedersen commitments](../hyrax/pedersen_commitments.md) sections for more
details here).

Importantly, the public string used to instantiate the committer _must_ be agreed
upon between the prover and verifier. This ensures a "nothing-up-my-sleeve number"
verification setting where a malicious prover cannot cheat by picking a set
of generators for which they e.g. know a discrete log relationship between,
which would allow them to break the soundness of the protocol:

```rust
// The Pedersen committer creates and keeps track of the shared generators
// between the prover and verifier. Note that the generators are created
// deterministically from the public string.
let prover_pedersen_committer =
    PedersenCommitter::new(512, "Hyrax tutorial Pedersen committer", None);
```

Next, we set up the RNG required for generating blinding factors within the
protocol -- note that the example used here is _insecure_ for simplicity. In
practice, please instantiate the blinding factor RNG with a
[CSPRNG](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator).

```rust
// WARNING: This is for tutorial purposes ONLY. NEVER use anything but a CSPRNG for generating blinding factors!
let mut blinding_rng = thread_rng();
```

Finally, we set up an inverse [Vandermonde matrix](https://en.wikipedia.org/wiki/Vandermonde_matrix),
which helps us convert univariate polynomials from evaluation to coefficient
form. This is helpful for the Hyrax verifier in the
[interpolative claim aggregation](../gkr_theory/claims.md#interpolative-claim-aggregation)
case, since $V_i(\ell(r^\star))$ can only be easily evaluated by the verifier
when the polynomial $V_i(\ell(x))$ is sent in Pedersen commitments to coefficients
rather than evaluations:

```rust
// The Vandermonde inverse matrix allows us to convert from evaluations
// to coefficients for interpolative claim aggregation. Note that the
// coefficient form allows the verifier to directly check relationships
// via the homomorphic properties of the curve.
let mut vandermonde_converter = VandermondeInverse::new();
```

## Proving

We instantiate a prover [transcript](../gkr_theory/fiat_shamir.md) over
the protocol's elliptic curve's _base field_ for Fiat-Shamir:

```rust
// Finally, we instantiate a transcript over the base field. Note that
// prover messages are elliptic curve points which can be encoded as base
// field tuples, while verifier messages are scalar field elements of that
// curve. Thanks to Hasse's theorem, this results in a negligible completeness
// loss in the non-interactive case as we always attempt to coerce a base
// field challenge into a scalar field element and panic if the base field
// element sampled was larger than the scalar field modulus.
let mut prover_transcript: ECTranscript<Bn256Point, PoseidonSponge<Fq>> =
    ECTranscript::new("Hyrax tutorial prover transcript");
```

We are finally ready to generate the Hyrax proof! Note that the
`perform_function_under_prover_config!()` macro ensures (even within a
multi-threaded environment) that the function passed in will _only_ be called
and be run in its entirety under the state set by `hyrax_circuit_prover_config`.

```rust
// Use the `perform_function_under_prover_config!` macro to run the
// Hyrax prover's `prove` function with the above arguments, under the
// prover config passed in.
let (proof, proof_config) = perform_function_under_prover_config!(
    // This is a hack to get around the macro's syntax for struct methods
    // rather than function calls.
    |w, x, y, z| hyrax_provable_circuit.prove(w, x, y, z),
    &hyrax_circuit_prover_config,
    &prover_pedersen_committer,
    &mut blinding_rng,
    &mut vandermonde_converter,
    &mut prover_transcript
);
```

## Verification

Similarly to the verification process in the GKR tutorial, we first collect
verifier-known inputs (in this case, there are none) and create a (Hyrax) verifier-ready
version of the circuit:

```rust
// We generate a "Hyrax-verifiable" circuit from the `Circuit` struct,
// but do not attach any circuit inputs to it (these must come from
// the proof itself).
let hyrax_verifiable_circuit = verifier_circuit
    .gen_hyrax_verifiable_circuit()
    .expect("Failed to generate Hyrax verifiable circuit");
```

The verifier creates its own Pedersen committer and derives the agreed-upon
generators from scratch:

```rust
// The verifier can (and should) derive the elliptic curve generators on
// its own from the public string and check the proof against these.
let verifier_pedersen_committer =
    PedersenCommitter::new(512, "Hyrax tutorial Pedersen committer", None);
```

Finally, the verifier instantiates its own Fiat-Shamir transcript:

```rust
// The verifier instantiates its own transcript.
let mut verifier_transcript: ECTranscript<Bn256Point, PoseidonSponge<Fq>> =
    ECTranscript::new("Hyrax tutorial verifier transcript");
```

And we commence verification using the `perform_function_under_verifier_config!()`
macro, which is identical in behavior to the above `perform_function_under_prover_config!()`
macro call, but with consistency against the `hyrax_circuit_verifier_config`
rather than the prover one.

```rust
// Finally, we verify the proof using the above committer + transcript, as
// well as the Hyrax verifier config generated from the prover one earlier.
perform_function_under_verifier_config!(
    verify_hyrax_proof,
    &hyrax_circuit_verifier_config,
    &proof,
    &hyrax_verifiable_circuit,
    &verifier_pedersen_committer,
    &mut verifier_transcript,
    &proof_config
);
```

And that's it! You've now created your first Hyrax-provable/verifiable circuit
and generated and verified a Hyrax zero-knowledge proof. Note that aside from
the couple of additional structs we needed to supply to the prover/verifier
(e.g. the Pedersen committer, the blinding factor RNG, the Vandermonde inverse
matrix, and defining the curve whose scalar field is the one used in the circuit),
the entire circuit definition + input data attachment process was identical to
that of the GKR tutorial from earlier -- this is all by design, and in large part
due to the fact that so many of the GKR prover/verifier operations can be so 
neatly wrapped (if done carefully and modular-ly) by Pedersen commitments!