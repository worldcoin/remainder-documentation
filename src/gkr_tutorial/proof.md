# Proof/Transcript
Please read the [Fiat-Shamir](./fiat_shamir.md) documentation page before this one!

## Transcript
A Remainder Transcript (TODO: link to documentation page here) consists of all of the explicit sponge function operations which take place during the generation of a non-interactive (GKR) proof. As mentioned in the Fiat-Shamir documentation page, the prover can interact with the sponge function $\mathcal{H}$ in two primary ways, exactly corresponding with the interactive version of the protocol: 

- When the prover would send a message $m$ to the verifier in the interactive version of the protocol, they instead invoke $\mathcal{H}.\text{absorb}(m)$.
- When the verifier would send a challenge $r_i$ to the prover in the interactive version of the protocol, the prover instead invokes $r_i \leftarrow \mathcal{H}.\text{squeeze}()$. 

Remainder's Transcript captures exactly these operations, with some built-in 