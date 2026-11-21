# NILO NEXT — G2-V0 shard-ward vertical slice + entire S00–S25 roadmap audit

**CORA-METHOD / source proposal, not CORA-ENGINE.** Target `Luke883i/NILO`, BASE `main@5ec13d69d71816232cc72b8c4893b5542ba7391b` after merged PR #20. This is an implementation candidate only; do not merge, deploy or fabricate author consent.

## Audit of main, not false acceptance
- PR #14–#20 merged; main includes source implementation of original LV01/02/03, one boss Custode, 2 patrol enemies, 3 Frammenti in LV01, original native visual G1-V0 and character motion G1-V1; LV04–06 and two later bosses are **DESIGN_ONLY**.
- Source reticle before this slice: **104 nodes / 19 AND**. Existing Q07 independent player verdict and creative DA01–DA09 remain blocked. Green CI of merged PR #20 is not publisher acceptance, independent observed delight or rights clearance.
- G1-V2 (art bible/HD biome identity) depends on actual creative author selection; an AI-generated document may be a candidate but never an approval. Continue G2-V0 as a bounded gameplay-technical demonstration without inventing narrative DA02.

## Entire original roadmap re-derived and falsified

`contracts/nilo-roadmap-v3.json` fixes each of the original 26 S00–S25 slices and its backward dependencies; the compressed graph contains 19 **stage/gate nodes** (the 10 original product packages are broken into reversible engineering sub-slices). All 26 legacy slices have exactly one *final accountability owner*; partial implementations G1V0/G1V1/G2V0 do not count as completion of S04–S09. Every cross-stage prerequisite must be reachable in the DAG.

| Stage | Ownership/result | Source-level status |
| --- | --- | --- |
| F0 | S00–S03 foundation; PR #14–#18 | MERGED_TECH_ONLY |
| G1V0/G1V1 | Visual candidate, native frame and motion, #19/#20 | MERGED_TECH_ONLY |
| HA | Explicit DA01/DA02/DA07 decision, rights signoff | BLOCKED_EXTERNAL |
| G1V2 | Complete original HD art bible and six biomes (S04–S06) | PLANNED, needs HA |
| **G2V0** | **Real shield reward from Frammenti in LV01** | PR_CANDIDATE |
| G2V1/G2V2 | Distinct enemy archetype, reward balance, game feel (S07–S09) | PLANNED |
| H0 | Early independent novices before copying the mechanics | BLOCKED_EXTERNAL |
| G3 | Four-part LV01 with paced teach/test/twist/master (S10) | PLANNED |
| G4/G5 | Custode and LV02, extended light/shadow LV03 (S11–S13) | PLANNED |
| G6/G7/G8 | Fonderia+Archivista, Bosco, Cuore+Direttore+ending (S14–S19) | PLANNED |
| G9 | Progressive accessibility, audio, performance and save migration (S20–S21) | PLANNED, run alongside earlier slices |
| G10 | Rights, build, SBOM, exact browser full-game E2E (S22–S23) | PLANNED |
| H1 | Independent full-game player acceptance (S24) | BLOCKED_EXTERNAL |
| H2 | Human publication/hosting/rollback decision (S25) | BLOCKED_EXTERNAL |

**Roadmap technical oracle** `scripts/verify-roadmap.mjs` checks all 26 old edges, coverage/ownership, cycles, dangling links, release closure, exact package conditions, early playtest, art and rights vetoes. `tests/roadmap.test.mjs` writes **18 physically altered copies** of the roadmap source JSON to temporary files, then independently falsifies missing or changed S17/S23/old dependency, duplicate owner, owner transposition, approval/playtest bypass, release/quality gate removal, orphan nodes, cyclic dependencies, fake status/rights, absent browser oracle and SHA drift. These are **finite graph-source masks, not target runtime tests**.

## G2-V0 A0 contract: real playable reward

**Actors:** Nilo with current original health, two original sentries, three Frammenti; actual keyboard player, author, independent novices. **Behavior:** physical first shard pickup earns a one-hit `SCUDO 1/1`. A *later* real automaton contact absorbs the blow, consumes the shield, briefly shows `PARATA!`, and keeps the preexisting invulnerability grace without losing HP. A second original shard can recharge once; the same shard never recharges repeatedly. Health without shield, stomping, attack J, enemy HP, checkpoints, level transitions and reload semantics remain.

**State/data:** pure standalone action reducer, bounded integer ward (0/1), spent counter and short frame pulse. No backend, new storage, new fields in historic `readback.action`, fabricated reward on reload, new action button, randomness or animation timer. The reward has a separate read-only `readback.reward`. **UX:** always-visible source-owned HUD text and a visible native aura during the opening visual scene; outside that portion the HUD still reports state. **Exclusions:** no LV02/LV03 shield, no LV04–06, no power balance acceptance, no financial commerce, no violence narrative approval. **Effects:** no off-device data.

## Backward AND-DoD

| DoD leaf | Required witness | Negative falsifier | Initial state |
| --- | --- | --- | --- |
| W_00 | OR-12 target source/consumer/browser binding | Deleted owner/test, fake browser PASS | NOT_VERIFIED |
| W_01 | Real core pickup, ward consumption, recharge, same-tick no-retro-protection, no-ward HP, pause/reset | Ghost shield, unlimited ward, damage despite block | NOT_VERIFIED |
| W_02 | 10 actual modified JavaScript source files imported and tested | Free ward, no shard credit, double count, unbounded charges, lost grace, lost pulse, false HP | NOT_VERIFIED |
| W_03 | Chrome physical keyboard shard pickup and enemy contact with 2 separate HTTP source mutants | No visual/functional shield, phantom grant or bypass | NOT_VERIFIED |
| W_04 | Entire prior native source and real browser/dist regressions | Broken J, first boss, checkpoint, old visual | NOT_VERIFIED |
| W_05 | 26 slices mapped to real 19-stage DAG and 18 distinct source JSON masks | Missing slice, cycle, fabricated human gate, orphan | NOT_VERIFIED |
| W_06 | Product author DA02, rights and independent novice test | Source or CI claiming human signoff | BLOCKED_EXTERNAL |

`G_SHARD_WARD_G2V0` adds a necessary AND to existing `G_FULL_GAME`, and also requires prior S03b and G1V1. Proposed reticle: **112 nodes, 20 AND**. DoD states are conservative: CI may show PASS_SCOPED_TARGET_NATIVE for its executed tests but may never promote W_06, Q07 or H0–H2.

## Permission, runner and rollback

Files in scope: `web/action.mjs`, `web/main.mjs`, `web/golden-minute.mjs`, target-owned tests, contracts and CI. The GitHub Actions runner is permitted to run original target tests on exact PR HEAD. No local CORA-ENGINE execution, no merge, no publication. **Stop** on invalid source mutant selector, drift, failure of a target test, missing actual screenshot/digest, broken legacy action readback, unearned shield, absent human authorization or reviewer objection.

**Rollback:** revert one PR slice (the entire 0/1 shield change). The original PR #20 baseline remains available by Git commit. Next candidate G2V1 is a distinct enemy archetype with independent boss/novice comprehension checks, while author-approved G1V2 proceeds separately through HA.
