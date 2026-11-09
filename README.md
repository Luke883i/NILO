# NILO — La Fabbrica delle Ore

An original 2D platform-game **candidate** and a traceability experiment: from narrative intent to gameplay, Git objects, tests, software dependencies, browser/runtime and applicable standards. The project is developed with the **CORA evidence-first method**, not by an autonomous CORA game generator.

**PR1** seeds a proposed story (6 levels, 3 bosses), a falsifiable initial vertical-slice contract, a typed semantic composition graph, a design-phase CycloneDX BOM and an AND-dependency Definition of Done. Story names and characterizations are *creative drafts awaiting author approval*. A green seed test does not prove a finished or accessible game.

## Run and verify

From the repository root with Node.js 20+ (no npm installation):

```sh
node scripts/verify.mjs
node --test tests/*.test.mjs
node scripts/evidence.mjs
```

If the `web/` slice exists, start a local origin and open `http://127.0.0.1:8000`:

```sh
python3 -m http.server 8000 --directory web
```

**Read by goal:** [Product / story and acceptance](docs/PRODUCT_CONTRACT.md) · [semantic-to-hardware evidence](docs/PROVENANCE.md) · [source contract](contracts/nilo-semantic-v1.json) · [backward DoD](contracts/dod-v1.json) · [normative applicability](standards/references.json).

**Source truth:** Git commit and observed test/CI receipts; draft prose, synthetic scenarios and standards links are not proof of real browser behavior, rights clearance, legal conformity, human approval or release authority.
