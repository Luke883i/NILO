# NILO — Engineering system, phase gates and beta boundary

**Authority:** candidate technical development policy for PR2. [Product intent](../contracts/nilo-semantic-v1.json) owns the story and original requirements; [DoD](../contracts/dod-v1.json) owns the noncompensatory gates; [development map](../contracts/development-map.json) binds actual source/test paths to product IDs. Git + observed CI/browser/user evidence, never this prose, determine attainment.

## One system, three non-substitutable planes

| Plane | Objects / owner | Required evidence | Cannot assert |
| --- | --- | --- | --- |
| **Product** | World, levels, boss encounters, character silhouettes, rules, affordances, novice player outcome; product contract | Stable IDs `LV-*`, `CH-*`, `OR-*`, author review and observed play | Complete gameplay from six drafted levels |
| **Software** | `web/` HTML/CSS/ES modules, physics, rendering, persistence, future assets | Implementation mapped to every active requirement, unit/negative tests and browser execution | Correct visible semantics from a passing physics unit test |
| **Repository** | Git revisions, `contracts/`, `tests/`, `scripts/`, `docs/`, `provenance/`, `bom/`, `.github/` | Reproducible source SHA, CI witnesses, negative mutants, versioned dependencies, source/beta gate | Independent review or release authorization from a self-authored workflow |

**Enforced ongoing invariant:** every `OR-*` and `LV-*` must appear exactly once in the typed bridge; every live `web/` file, including future nested files, must have a current owning product oracle; every active oracle must point to existing software and appropriate test sources; `DESIGN_ONLY` levels must not claim implemented/tested source. No test count can promote `NOT_ATTESTED` browser or `BLOCKED_EXTERNAL` beta. Changes to a contract, file, requirement or active path must update the bridge **in the same PR**, not a follow-up issue.

The only new owner is the small relation file; do not replicate story, physics parameters, DoD or status estimates there. The original verifier imports the bridge verifier; `node scripts/verify.mjs` and PR CI fail on drift. Dynamic/reflection dependencies remain unknown unless separately checked; mapping is source-level, not a complete runtime dependency graph.

## Post-PR1 exact-main observed baseline

Git baseline `21fbd40a0732c19b47df1f42929d8559853f2e0c`. Four web source blob OIDs were checked against GitHub before visualization. This assistant's local Chromium **144.0.7559.96** could not navigate HTTP, file URLs or intercepted web URLs (host policy `ERR_BLOCKED_BY_ADMINISTRATOR`). A DevTools harness injected the exact checked HTML/CSS and an import-inlined equivalent of the checked JS into a browser document, replacing `localStorage` with an explicit in-memory substitute. This is **not** a passing HTTP-origin, CSP or actual-reload test.

Observed within that bounded harness: keyboard-driven six jumps; `COMPLETED`, checkpoint active, zero deaths; simulated storage accepts a correctly versioned record and rejects a forged version; 390px viewport has no horizontal overflow. **Visual-semantic falsifiers:** the mobile canvas shrinks 960px content to about 350px, shrinking in-game text to unreadable sizes; no touch controls; character roles/plot are not legible from the game; only a thin rectangle visually represents Nilo; no clear on-canvas next action after completion; `ORA 1 / 6` could imply the remaining five levels already exist. Human comprehension, assistive technology, persisted real-origin reload and real DOM/CSP browser integration remain untested.

Screenshot SHA-256 from the *uncommitted local audit* for reproducible identity, not GitHub-controlled attestation:
- desktop initial: `91f3fc9862869c229b6e35c61eaf8826247451147103f31bfed873fe13a194a9`;
- mobile initial: `6fa8910809823ce214be6c3ec9d29782e1af4fb5f049dcc4a497c84fb2265a7e`;
- keyboard completion: `c1953a4097d26c6ad4c7722f2452fa08784aa6336539a034deba4ffc77a2667d`.
The images are not in this repository. A future CI browser job must produce its **own** original-host screenshot and test receipts bound to its actual code SHA.

## Development sequence with stop gates

| Phase | Product outcome | DoD/gate and proof required | Present status |
| --- | --- | --- | --- |
| **P0 — Source seed** | Story candidate, six proposed acts, first mechanics | `G_SEED_SOURCE`; tests and source/negative provenance | **Source-scoped**, author review missing |
| **P1 — Real LV-01** | First level really playable with understandable progression | `G_VERTICAL_SLICE`; real-origin browser input/collision, checkpoint reload, actual screenshot/video, human novice task | **Open** |
| **P2 — Mechanics + first boss** | Levels 2–3 and Pendulum Keeper | Content/scope IDs, deterministic physics, physical source mutants, first boss fairness and browser replay | **Not implemented** |
| **P3 — Complex mechanics** | Levels 4–5 and Archivist boss | Negative tests for timing/accessibility, narrative semantics and no-regression replay of earlier levels | **Not implemented** |
| **P4 — Full beta content** | Level 6, Director boss, ending and three complete boss encounters | `G_FULL_GAME` plus asset rights, novice traversal of all six levels | **Not implemented** |
| **P5 — Beta qualification** | One exact candidate artifact, agreed target device/browser, observed full run | `Q01..Q05`; compatibility, usability/accessibility, frame/latency/error budgets, runtime/SBOM/asset receipts | **Blocked** |
| **P6 — Controlled beta decision** | Releasable six-level game beta | `G_BETA_RELEASE = G_FULL_GAME AND Q01 AND ... AND Q06`; independent review, required host controls, distribution plan and rollback | **Blocked** |

**Beta is the six-level game with three playable bosses**, not merely a beta-labeled demo of LV-01. The original `G_CONTRACT_DEMONSTRATED` remains stricter: it also requires the complete `G_SUPPLY_CHAIN` and `G_RELEASE` branches.

## Gate protocol for every PR

1. Declare the user-visible change and its exact `LV-*/CH-*/OR-*` owners. If it is only an architectural or repository change, state which product obligation it enables and do not claim player benefit observed.
2. Modify implementation, tests, and `development-map.json` together. Unchanged files keep their existing owner; no second agent orchestrator, policy registry or acceptance bus.
3. Execute `npm run quality`; run physical mutants on actual game sources; detect and retain survivors/inconclusive cases. Synthetic counts are **not** actual browser runs.
4. For any product behavior/UX claim, execute real browser tests on an **actual origin**, capture viewport/role/input/console/network/state, negative checks and screenshots. A static picture, local DevTools harness or simulated storage is insufficient.
5. Recompute source/tree/blob SHA and dependency/asset inventory on final HEAD. New commit means revalidation; postmerge main needs its own requalification.
6. External author approval, independently observed player success, rights/licenses, security/accessibility scope and host enforcement remain separate gates. No source-only run, including CORA, can grant merge or beta authority.

**DoD fail closed:** a blocked required child makes its AND parent blocked; missing browser/asset/host evidence is `NOT_RUN` or `BLOCKED_EXTERNAL`, never percentage-based green. If a fixed-seed mutation family produces no new failure types for a declared tail window, that establishes only *bounded model saturation*, not absence of defects.

**Minimal filesystem rule:** keep root as entrypoint (`README.md`, `package.json`, `.gitignore`), product runtime in `web/`, semantic owners in existing `contracts/`, tests and verifiers in existing `tests/` and `scripts/`, and historical/technical explanations in `docs/`. Do not add empty component directories for five not-yet-implemented levels. Build/screenshot/log artifacts stay outside tracked source or in CI artifacts; do not commit screenshot collections into root.
