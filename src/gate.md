# Gate MLEs
Gate MLEs define arbitrary wiring, as such:
$$\widetilde{V}_i(z) = \sum_{x, y \in \{0, 1\}^{2s_{i + 1}}} \widetilde{\text{add}}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_i(x) + \widetilde{V}_i(y) \bigg] + \widetilde{\text{mul}}_{i + 1}(z, x, y) \bigg[ \widetilde{V}_i(x) \cdot \widetilde{V}_i(y) \bigg]$$