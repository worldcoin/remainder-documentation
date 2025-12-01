# GKR Background

This section describes the basics of GKR, including necessary notation, mathematical concepts, and arithmetization, as well as a high-level description of how proving and verification works in theory.

## Notation Glossary

Note that each of these definitions will be described in further detail in the sections to come, but are aggregated here for convenience.

| Symbol                    | Description                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| $\mathbb{F}$              | A finite field.                                                                                                                                        |
| $C$                       | Layered arithmetic circuit.                                                                                                                            |
| $d$                       | Depth of the circuit $C$.                                                                                                                              |
| $\mathcal{L}_i$           | Layer $i$ of the circuit, such that any node on $\mathcal{L}_i$ is the result of a computation from nodes in layers $j$ and $k$, such that $j, k < i$. |
| $\val_i(x)$               | The value of $C$ at node $x$, such that $x$ is a label for a node in $\mathcal{L}_i$. We say that $x$ has $s_i$ bits.                                  |
| $\widetilde{f}$           | A function $\mathbb{F}^n \to \mathbb{F}$. This is the unique multilinear extension encoding the function $f: \{0, 1\}^n \to \mathbb{F}.$               |
| $\add_{i, j ,k}(z, x, y)$ | A function: $\{0, 1\}^{s_{i} + s_j + s_k} \to \{0, 1\}$ which indicates whether $val_{i+1}(z) = \val_j(x) + \val_k(y).$                                |
| $\mul_{i, j, k}(z, x, y)$ | A function: $\{0, 1\}^{s_{i} + s_j + s_k} \to \{0, 1\}$ which indicates whether $val_{i+1}(z) = \val_j(x) \cdot \val_k(y).$                            |

## High-level Description

GKR is an interactive protocol which was first introduced by [Goldwasser, Kalai, and Rothblum [2008]](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/12/2008-DelegatingComputation.pdf). It proves the statement that $C(y) = 0$, where $C$ is a [layered arithmetic circuit](./statement_encoding.md), and $y$ is the input to the circuit. 

At a high-level, it works by reducing the validity of the output of the circuit (say layer $d$, $\mathcal{L}_d(x_d) = 0$, for a circuit with depth $d$), to the previous layer of computation in the circuit, $\mathcal{L}_{d-1}.$ Eventually, these statements reduce to a claim an evaluation of the input as a polynomial. If the input $y$ is encoded as the coefficeints of a polynomial $f$, we are left to prove that $f(x_0) = r_0$. 

The later sections unpack these reductions, showing how we can reduce the claim that $C(x) = 0$ to a polynomial evaluation at a random point.

## Why GKR?
GKR has several key advantages when compared with other proof systems:
- Not having to cryptographic commit to the entire "circuit trace":
  - In general, proof systems which use e.g. PlonK-ish or R1CS/GR1CS arithmetization require a polynomial commitment to *all* circuit values. 
  - The size of this commitment often determines the memory/runtime/proof size/verification time of such systems, as the PCS (rather than the IOP) tends to be the bottleneck re: the aforementioned metrics. 
  - GKR, on the other hand, does not require a commitment to any "intermediate" values within the circuit, i.e. those which can be computed using addition/multiplication from other values present within the circuit. 
  - For certain layered circuits (e.g. neural network circuits, where the intermediate activation values "flow" through the model and can be fully computed from the weights and model input), this substantially reduces the number of circuit values which require cryptographic operations (e.g. circuit-friendly hash function, MSM, FFT), reducing the bottleneck which the PCS step normally imposes.
- Natively multilinear IOP which depends almost wholly on sumcheck and other linear, embarrassingly parallel operations -- sumcheck is an extremely fast, field-only primitive which is extremely parallelizable and lends itself to various small field + extension field [optimizations](https://people.cs.georgetown.edu/jthaler/small-sumcheck.pdf), resulting in an extremely fast prover.
- Easy lookup integration with both [LogUp](./frontend/lookup.md) and [Lasso](https://eprint.iacr.org/2023/1216). The former, in particular, is expressible via a very lovely [structured circuit](https://eprint.iacr.org/2023/1284.pdf), and is time-optimal within GKR with respect to the number of lookups (linear # of field operations in number of witnesses to be looked up + lookup table size).