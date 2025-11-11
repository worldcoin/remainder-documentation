# MatMult Layer Usage Tutorial

Let's see how we can use a `MatMult` layer  to prove the computation of the following matrix
product:

$$
\underbrace{
\left[
    \begin{array}{ccc}
        0 & 1 & 2\\
        1 & 2 & 3\\
        2 & 3 & 4\\
    \end{array}
\right]
}_{A_{\mathrm{in}} \in \mathbb{F}^{3 \times 3}}
\cdot
\underbrace{
\left[
    \begin{array}{cc}
        3 & 4\\
        4 & 5\\
        5 & 6\\
    \end{array}
\right]
}_{B_{\mathrm{in}} \in \mathbb{F}^{3 \times 2}}
=
\underbrace{
\left[
    \begin{array}{cc}
        14 & 17\\
        26 & 32\\
        38 & 47\\
    \end{array}
\right]
}_{C_{\mathrm{in}} \in \mathbb{F}^{3 \times 2}}
$$

Recall (TODO: Add ref) that a `MatMult` layer requires all dimensions of all the matrices involved in the product to be **exact powers of two**.
We can always guarantee this property by padding the original matrices with zero columns and/or rows
as follows:

$$
\underbrace{
\left[
    \begin{array}{cccc}
        0 & 1 & 2 & 0\\
        1 & 2 & 3 & 0\\
        2 & 3 & 4 & 0\\
        0 & 0 & 0 & 0\\
    \end{array}
\right]
}_{A \in \mathbb{F}^{4 \times 4}}
\cdot
\underbrace{
\left[
    \begin{array}{cc}
        3 & 4\\
        4 & 5\\
        5 & 6\\
        0 & 0\\
    \end{array}
\right]
}_{B \in \mathbb{F}^{4 \times 2}}
=
\underbrace{
\left[
    \begin{array}{cc}
        14 & 17\\
        26 & 32\\
        38 & 47\\
        0 & 0\\
    \end{array}
\right]
}_{C \in \mathbb{F}^{4 \times 2}}
$$

How do we represent matrices as MLEs? In Remainder's implementation of the `MatMult` layer, we
follow the convention of representing an $2^m \times 2^n$ matrix as an MLE whose evaluations on the
hypercube are given by a vector in $\mathbb{F}^{2^{m + n}}$
which represents a **row-major flattened** view of the matrix.

For example, here's how we'd represent matrices $A, B, C$ defined above as MLEs:

$$
\begin{align*}
    \widetilde{A}:& [
        \underbrace{0, 1, 2, 0}_{\text{row 1}},
        \underbrace{1, 2, 3, 0}_{\text{row 2}},
        \underbrace{2, 3, 4, 0}_{\text{row 3}},
        \underbrace{0, 0, 0, 0}_{\text{row 4}}]\\
    \widetilde{B}:& [3, 4, 4, 5, 5, 6, 0, 0]\\
    \widetilde{C}:& [14, 17, 26, 32, 38, 47, 0, 0]\\
\end{align*}
$$

A `MatMult` layer is a specialized layer which, given the MLEs $\widetilde{A}, \widetilde{B}$
representing matrices $A: \mathbb{F}^{2^m \times 2^n}, B: \mathbb{F}^{2^n \times 2^k}$, it
computes the output MLE $\widetilde{C}$ representing matric $C: \mathbb{F}^{2^m \times 2^k}$ such
that $C = A \cdot B$.

To prove the computation of matrix product in Remainder, we can simply subtract the expected
$\widetilde{C}$ from the result of the `MatMult` layer and constraine the result to be the all-zero
vector.

The only remaining complication to address is that typically it's not reasonable to expect the input
to be given in an already padded form. In such a case, we'd have to perform the padding in
circuit. In the example above, this would mean transforming MLE representations of
matrices $A_{\mathrm{in}}, B_{\mathrm{in}}, C_{\mathrm{in}}$, to the MLEs $\widetilde{A},
\widetilde{B}, \widetilde{C}$.

This is easy to do with an Identity Gate layer (TODO: add ref), as we'll see in the following
example.

## Example: Input given in un-padded row-major order

A natural way to represent the original, unpadded matrices $A_{\mathrm{in}}, B_{\mathrm{in}},
C_{\mathrm{in}}$ given previously, would be by just flattening the matrices in row-major order,
as the following MLEs:

$$
\begin{align*}
    \widetilde{A_{\mathrm{in}}}: \mathbb{F}^{4} \mapsto \mathbb{F}:&
        [0, 1, 2, 1, 2, 3, 2, 3, 4, \underbrace{0, \ldots, 0}_{\text{implicit padding}}]\\
    \widetilde{B_{\mathrm{in}}}: \mathbb{F}^{3} \mapsto \mathbb{F}:&
        [3, 4, 4, 5, 5, 6, \underbrace{0, 0}_{\text{implicit padding}}]\\
    \widetilde{C_{\mathrm{in}}}: \mathbb{F}^{3} \mapsto \mathbb{F}:&
        [14, 17, 26, 32, 38, 47, \underbrace{0, 0}_{\text{implicit padding}}]\\
\end{align*}
$$

Notice how in this case the MLEs for matrices $B, C$ are already in the expected format. And in fact
this will be the case every time _the number of columns is an exact power of two_.  The number of
rows doesn't really affect the matrix padding because Remainder is already **implicitly padding**
every MLE with zeros when the number of evaluations given is not an exact power of two.

Notice however that this implicit padding is **not** the same as the matrix padding we described
earlier. Compare for example the MLE $\widetilde{A}$ given earlier, with that of
$\widetilde{A_{\mathrm{in}}}$.  To pad matrix $A$ in the way `MatMult` expects, we can use custom
wirings on an _Identity Gate Layer_ to re-wire the values of MLE $\widetilde{A_{\mathrm{in}}}$ into
the right places and get MLE $\widetilde{A}$. In this case the wiring look like:

$$
    [ (0, 0), (1, 1), (2, 2), (4, 3), (5, 4), (6, 5), (8, 6), (9, 7), (10, 8) ]
$$

TODO: Add diagram.

Here's the complete code for this example:

```rust
fn main() {
    const PADDED_MATRIX_A_LOG_NUM_ROWS: usize = 2;
    const PADDED_MATRIX_A_LOG_NUM_COLS: usize = 2;
    const PADDED_MATRIX_B_LOG_NUM_ROWS: usize = 2;
    const PADDED_MATRIX_B_LOG_NUM_COLS: usize = 1;

    const MATRIX_A_NUM_VARS: usize = 4;
    const MATRIX_B_NUM_VARS: usize = 3;
    const MATRIX_C_NUM_VARS: usize = 3;

    let matrix_a_data: MultilinearExtension<Fr> = vec![0, 1, 2, 1, 2, 3, 2, 3, 4].into();
    let matrix_b_data: MultilinearExtension<Fr> = vec![3, 4, 4, 5, 5, 6].into();
    let matrix_c_data: MultilinearExtension<Fr> = vec![14, 17, 26, 32, 38, 47].into();

    let matrix_a_padding_wiring = vec![
        (0, 0),
        (1, 1),
        (2, 2),
        (4, 3),
        (5, 4),
        (6, 5),
        (8, 6),
        (9, 7),
        (10, 8),
    ];

    let mut builder = CircuitBuilder::<Fr>::new();

    let inputs = builder.add_input_layer("Matrices", LayerVisibility::Public);

    let matrix_a = builder.add_input_shred("Matrix A", MATRIX_A_NUM_VARS, &inputs);
    let matrix_b = builder.add_input_shred("Matrix B", MATRIX_B_NUM_VARS, &inputs);
    let expected_matrix_c =
        builder.add_input_shred("Expected Matrix C", MATRIX_C_NUM_VARS, &inputs);

    let padded_matrix_a =
        builder.add_identity_gate_node(&matrix_a, matrix_a_padding_wiring, MATRIX_A_NUM_VARS, None);

    let matrix_c = builder.add_matmult_node(
        &padded_matrix_a,
        (PADDED_MATRIX_A_LOG_NUM_ROWS, PADDED_MATRIX_A_LOG_NUM_COLS),
        &matrix_b,
        (PADDED_MATRIX_B_LOG_NUM_ROWS, PADDED_MATRIX_B_LOG_NUM_COLS),
    );

    let output = builder.add_sector(matrix_c - expected_matrix_c);
    builder.set_output(&output);

    let circuit = builder.build().unwrap();

    // Create circuit description.
    let mut prover_circuit = circuit.clone();
    let mut verifier_circuit = circuit.clone();

    prover_circuit.set_input("Matrix A", matrix_a_data.clone());
    prover_circuit.set_input("Matrix B", matrix_b_data.clone());
    prover_circuit.set_input("Expected Matrix C", matrix_c_data.clone());

    let provable_circuit = prover_circuit.finalize().unwrap();

    // Prove the circuit.
    let (proof_config, proof_as_transcript) =
        prove_circuit_with_runtime_optimized_config::<Fr, PoseidonSponge<Fr>>(&provable_circuit);

    // Create verifier circuit description and attach inputs.
    verifier_circuit.set_input("Matrix A", matrix_a_data);
    verifier_circuit.set_input("Matrix B", matrix_b_data);
    verifier_circuit.set_input("Expected Matrix C", matrix_c_data);

    let (verifiable_circuit, predetermined_public_inputs) =
        verifier_circuit.gen_verifiable_circuit().unwrap();
    verify_circuit_with_proof_config(
        &verifiable_circuit,
        predetermined_public_inputs,
        &proof_config,
        proof_as_transcript,
    );
}
```

**Note**: In the previous example we hard-coded the wirings corresponding to the case of padding a $3 \times 3$ matrix
MLE. For the general case, one can easily generate the correct wirings for padding for any matrix
dimensions. (TODO: Consider adding an example code that generates the wirings. I had something in
the GhostFaceNet branch).

TODO: Discuss performance implications of the Identity Gate Layer, and suggest that it might be
better to maintain padded forms of the inputs throughout the circuit if possible.