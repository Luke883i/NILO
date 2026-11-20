# NILO NEXT — S03a: catalogo data-driven dei tre livelli implementati

**Authority:** NILO own `contracts/nilo-semantic-v1.json`, `contracts/development-map.json`, `contracts/dod-v1.json`, existing owner/test design. **Mode:** reversible source implementation candidate. **Not:** creative approval, CORA-ENGINE execution, completed S03, six-level game, merge or beta.

## A0 contract, bounded outcome

A desktop player must traverse the same existing LV-01, LV-02/Custode and LV-03 with identical world size, collision surfaces, current forces, checkpoint positions, attack controls, contextual E, boss victory, reload and third-hour gates, despite the engine resolving level geometry through one source-owned catalog.

The **actors** are unchanged (player Nilo, Tica, Perno, Custode and original product author). **Behavior** must not change. **State/data** are preserved, including original checkpoint encodings and phase names; no new save shape or invented historical win. **UX** is unchanged. **Effects:** no telemetry, network, third-party dependencies, asset additions or deployment. The proposed creative decisions DA01–DA09 remain pending; the S02 author signature is absent.

## Source boundaries

- `web/levels/catalog.mjs` is the single **implemented world-profile resolver** with exact `LV-01`, `LV-02`, `LV-03`; `LV-04` through `LV-06` are explicitly rejected.
- LV-01 core supplies `CFG` and `PLATFORMS` (not duplicated). Only its initial and CP-01 spawn coordinates move to the descriptor.
- LV-02 descriptor uses `LV02` and **fresh dynamic `lv02Surfaces(ticks)`**. It must not freeze the bridge at tick 0 or change current force/carry or Custode.
- LV-03 descriptor uses original `LV03` surfaces and CP-03 spawn; two doors and light/shadow remain owned by the original level module.
- `web/core.mjs` consumes the profile for current world width, platforms and initial spawns but **continues** to own movement, win conditions, boss transitions and checkpoint handlers. This is S03a, **not** full entity/state generalization or an engine replacement.
- Existing test fixtures copying `web/core.mjs` must also copy the new catalog; a missing dependency error is not a mutation kill.

## Local and global DoD

`G_WORLD_CATALOG_S03` is a mandatory **AND** child of the existing `G_FULL_GAME`. Six leaves, no self-certification:

| Leaf | Positive oracle | Negative falsifier | Declared state |
| --- | --- | --- | --- |
| T3_00 | source owner OR-08, exact three levels, reversible data boundary | orphaned catalog source or falsely implemented LV-04 | NOT_VERIFIED |
| T3_01 | target Node native geometry and spawn tests; original core/boss/door tests | wrong LV01 width, LV03 checkpoint or frozen bridge | NOT_VERIFIED |
| T3_02 | real HTTP Chrome LV-01 → LV-02/Custode → LV-03; same `dist/` output | regression of keyboard, reload or boss/door gate | NOT_VERIFIED |
| T3_03 | six independent **physical catalog source mutants** observed as failing assertions | a survivor in child Node execution | NOT_VERIFIED |
| T3_04 | existing mutation fixtures still execute with full import topology | missing import falsely counted as killed mutant | NOT_VERIFIED |
| T3_05 | product author and engineer approve ownership and underlying S02 creative decision | unsigned author approval or missing novice evidence | BLOCKED_EXTERNAL |

CORA acceptance cannot average unresolved AND leaves. CI `success` on exact SHA can support **PASS_SCOPED_TARGET_NATIVE** for technical leaves, but it does not amend baseline leaf states or approve `T3_05`.

## Commands and evidence

Target-approved GitHub workflow must run `node --test tests/catalog.test.mjs tests/catalog-mutation.test.mjs`, original `node scripts/verify.mjs`, `node scripts/verify-development.mjs`, all original physical mutants, real-origin Chrome E2Es and `dist/` replay. Capture exact HEAD, commit tree, job conclusions, test and mutant counts, browser environment and asset digests. PR evidence should remain attributable to the exact SHA.

**Stop gates:** main/branch drift; missing or changed catalog imports; failed original oracle; escaped mutant; no native HTTP runner; attempt to claim unapproved DA01–DA09. **Rollback:** revert the S03a commit; it does not rewrite S02 or change checkpoint records. **Next slice after owner authorization:** S03b entity/action/state composition or S04 HD art bible, separately tested and reviewed.
