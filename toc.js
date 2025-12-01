// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="quickstart.html"><strong aria-hidden="true">1.</strong> Quickstart</a></li><li class="chapter-item expanded "><a href="gkr_background/gkr_background.html"><strong aria-hidden="true">2.</strong> GKR Background</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="gkr_background/gkr_interactive_protocol.html"><strong aria-hidden="true">2.1.</strong> Interactive Protocol</a></li><li class="chapter-item expanded "><a href="gkr_background/statement_encoding.html"><strong aria-hidden="true">2.2.</strong> Statement Encoding</a></li><li class="chapter-item expanded "><a href="gkr_background/multilinear_extensions.html"><strong aria-hidden="true">2.3.</strong> Multilinear Extension</a></li><li class="chapter-item expanded "><a href="gkr_background/sumcheck.html"><strong aria-hidden="true">2.4.</strong> Sumcheck</a></li><li class="chapter-item expanded "><a href="gkr_background/encoding_layers.html"><strong aria-hidden="true">2.5.</strong> Encoding Layers</a></li></ol></li><li class="chapter-item expanded "><a href="gkr_theory/theory_overview.html"><strong aria-hidden="true">3.</strong> GKR Theory</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="gkr_theory/structured_gkr.html"><strong aria-hidden="true">3.1.</strong> Structured GKR</a></li><li class="chapter-item expanded "><a href="gkr_theory/canonic_gkr.html"><strong aria-hidden="true">3.2.</strong> Canonic (&quot;Gate&quot;) GKR</a></li><li class="chapter-item expanded "><a href="gkr_theory/claims.html"><strong aria-hidden="true">3.3.</strong> Claims</a></li><li class="chapter-item expanded "><a href="gkr_theory/matmult_layer.html"><strong aria-hidden="true">3.4.</strong> Matmult Layer</a></li><li class="chapter-item expanded "><a href="gkr_theory/input_layers.html"><strong aria-hidden="true">3.5.</strong> Input Layer</a></li><li class="chapter-item expanded "><a href="gkr_theory/fiat_shamir.html"><strong aria-hidden="true">3.6.</strong> Fiat Shamir</a></li><li class="chapter-item expanded "><a href="gkr_theory/proof.html"><strong aria-hidden="true">3.7.</strong> Proof/Transcript</a></li></ol></li><li class="chapter-item expanded "><a href="hyrax/hyrax.html"><strong aria-hidden="true">4.</strong> Hyrax Interactive Protocol</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="hyrax/pedersen_commitments.html"><strong aria-hidden="true">4.1.</strong> Pedersen Commitments</a></li><li class="chapter-item expanded "><a href="hyrax/hyrax_primitives.html"><strong aria-hidden="true">4.2.</strong> Hyrax Primitives</a></li><li class="chapter-item expanded "><a href="hyrax/proof_of_sumcheck.html"><strong aria-hidden="true">4.3.</strong> Proof of Sumcheck</a></li><li class="chapter-item expanded "><a href="hyrax/proof_of_claim_agg.html"><strong aria-hidden="true">4.4.</strong> Proof of Claim Aggregation</a></li><li class="chapter-item expanded "><a href="hyrax/hyrax_pcs.html"><strong aria-hidden="true">4.5.</strong> Hyrax Polynomial Commitment Scheme</a></li><li class="chapter-item expanded "><a href="hyrax/hyrax_putting_together.html"><strong aria-hidden="true">4.6.</strong> Putting it all Together</a></li></ol></li><li class="chapter-item expanded "><a href="frontend/frontend_components.html"><strong aria-hidden="true">5.</strong> Frontend Components</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="frontend/matmult.html"><strong aria-hidden="true">5.1.</strong> Matmult Layer</a></li><li class="chapter-item expanded "><a href="frontend/gate.html"><strong aria-hidden="true">5.2.</strong> Gate Layer</a></li><li class="chapter-item expanded "><a href="frontend/lookup.html"><strong aria-hidden="true">5.3.</strong> Lookups</a></li></ol></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
