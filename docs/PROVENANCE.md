# From story to silicon — provenance, composition and evidence

Do **not** call the story-to-hardware graph a certified SBOM. There are three distinct inventories:

1. **Semantic composition (S-BOM, NILO-specific):** intent → world → characters/acts → interactions and mechanics → asset/rights → source → tests → artifact → execution and reviewer. See `provenance/semantic-chain.json`; an edge records a *required verification relation*, not a causal proof.
2. **Software Bill of Materials:** standardized software dependency inventory. `bom/nilo.cdx.json` is a **CycloneDX 1.7 design-phase, explicitly incomplete snapshot**, initially listing no third-party installed gameplay libraries. It is not a deployed/resolved build SBOM. Resolve real packages, versions and digests later and validate against an official schema.
3. **Operational environment / hardware composition:** browser engine and build, DOM/Canvas version, OS/platform, graphics driver, CPU/GPU/firmware IDs and behavior. Their existence is a runtime observation; physical circuits do **not** have an intrinsic SHA-256. Hash only available byte artifacts (binary/firmware image, source tree, lockfile, generated bundle). Leave unknown fields **null**, not zero or fake hashes.

## Evidence ledger at each abstraction level

| Level | Evidence to capture | Not interchangeable with |
| --- | --- | --- |
| Intent and story | human-approved brief version, character/act IDs, source hash of authored text | gameplay or author approval inferred from prose |
| Rules and assets | logical acceptance oracle; actual asset bytes, origin/rights/licensing provenance | proposed palette or AI image as licensed material |
| Code and tests | Git SHA + tree/blob IDs, file SHA-256, command/tool/result, real mutant | successful test inferred from the source of a test |
| Dependencies | locked package IDs, version, supplier/license, hashes, transitive completeness | zero npm packages meaning zero browser/OS dependencies |
| Build | exact source SHA, isolated build environment, inputs, artifact SHA-256, SBOM and provenance subject | local file hashes or a CI YAML alone |
| Browser and OS | browser/OS/version/graphics stack as **observed** on one run | universal device compatibility |
| Hardware | CPU/GPU/model/driver/firmware IDs from inspected machine, measured performance | "SHA of the iron", attested identity without trusted sensor |
| Legal/standards | authority URI/edition, effective scope and dated interpretation, evidence and assessor | link as proof of compliance or fabricated legal-text digest |

`node scripts/verify.mjs` checks contracts; `node scripts/evidence.mjs` computes source file SHA-256 **at the time of execution**, captures actual Git HEAD if available and records host facts as *process-reported* observations. Output stays outside tracked source. It is not an in-toto/SLSA signed provenance attestation.

The standards register deliberately classifies SPDX 3.0.1 as a comparison reference, CycloneDX 1.7 as a design BOM format, SLSA 1.2 as provenance guidance and WCAG 2.2 as a design goal. Directive (EU) 2019/882 and GDPR applicability require a concrete jurisdiction/product/service/distribution analysis. No legal opinion or certificate follows. Exact norm bytes have **no digest unless actually obtained**, and rights restrictions must be respected.

**Progression:** PR1 source candidate → real browser replay → first vertical slice acceptance → six levels/three bosses with asset rights → resolved build/dependencies and host evidence → independent author, human user and release qualification. This is a noncompensatory AND-chain, never a percentage complete.
