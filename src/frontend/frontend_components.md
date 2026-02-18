# Frontend Components
The basic component of a GKR circuit is a *layer*. A layer is defined as an MLE plus polynomial relationship which explicitly states how each evaluation of that MLE (over the boolean hypercube) is related to evaluations of MLEs within previous layers.

## Remainder Components Overview
The layer types which are supported in GKR are as follows:
- ["Structured"](./structured.md) layers, which define the regular-wiring
layerwise relationships described in the
["structured GKR"](../gkr_theory/structured_gkr.md) section.
- ["Gate"](./gate.md) layers, which define the arbitrary-wiring layerwise
relationships described in the ["canonic GKR"](../gkr_theory/canonic_gkr.md)
section.
- ["Matmult"](./matmult.md) layers, which define the matrix multiplication-like
layerwise relationships described in the
["matmult"](../gkr_theory/matmult_layer.md) section.
- ["Lookup"](./lookup.md) layers, which define the lookup (LogUp) arguments described in the ["lookup"](../gkr_theory/lookup.md) section.

Additionally, we provide an example of how to compile into a Hyrax-provable circuit rather than a GKR-provable one in [this](./hyrax.md) section. 

## Remainder Circuit Definition
Circuits in Remainder are created via a "compilation" process. In essence:
- Circuit writers (that's you!) define the layer types and layer-wise
relationships by defining `Node`s of the variety as described above.
- Circuit writers (still you!) also define the input layers and "shred"s within each input layer for the circuit.
- Additionally, each type of `Node` requires as input references to other `Node`s which act as he "source data" for that node's outputs. The data type used in Remainder for storing those references is a [`NodeRef<F>`](https://worldcoin.github.io/Remainder_CE/frontend/layouter/builder/struct.NodeRef.html). The circuit builder returns such references every time a new node is added to the circuit.
- Once all of these relationships have been defined, Remainder will compile the set of nodes + source relationships into a layered circuit which can be run and proven/verified. Note that there are a couple of compilation options here, including compiling into the shallowest possible circuit by "combining" layers which are topologically oblivious (i.e. any layerwise ordering is valid). 