# Interactive Protocol

In the following sections, we start with some necessary background, such as [Multilinear Extensions](./multilinear_extensions.md) and the [Sumcheck Interactive Protocol](./sumcheck.md). We then move on to use these two primitives in order to build out the GKR protocol, which involves [encoding layer-wise relationships](./encoding_layers.md) within the circuit $C$ as sumcheck statements.

Finally, we move on to some protocols used within the Remainder codebase, such as [claim aggregation](./claims.md), and detail the differences between what we call ["canonical" GKR](./canonical_gkr.md) and ["regular" GKR](./regular_gkr.md), both of which are implemented in Remainder.