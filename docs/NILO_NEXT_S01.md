# S01 — Qualification of the LV-01 action vertical slice

**TARGET:** Luke883i/NILO. **BASE:** main after PR #14; exact SHA must be verified on the PR. **Scope:** LV-01 attack, pickup, native browser, evidence and requirements only. No changes to gameplay physics, victory, checkpoint schema, art licenses or S02 creative decisions.

**A0:** A desktop keyboard player can approach the first patrol using physical movement/jump, collect one actual shard, press J to remove one patrol, pause and resume without a ghost shot, restart the action state, and reload without obtaining an unearned previous victory. A second HTTP-origin browser test physically alters main.mjs to prove that missing J edges and ghost attacks are detected.

**SOURCE:** `OR-07` must map `web/action.mjs`, `web/core.mjs`, `web/main.mjs` to `tests/action.test.mjs`, `tests/action-mutation.test.mjs`, and `tests/browser-action.py`. Native CI must run against exact HEAD. The NILO original `G_CONTRACT_DEMONSTRATED` and `G_FULL_GAME` remain the only authoritative root graph; `G_LV01_ACTION_S01` is a new AND child under `G_FULL_GAME`, not a separate approval service.

**TARGET_RUNTIME:** Python Playwright on a real HTTP origin, Chrome with actual keyboard events, read-only diagnostic state and corroborating HUD/screenshots. Two physical source mutants must produce independently observable failures. A `PASS_SCOPED_S01_BROWSER` receipt is technical only and never becomes a self-issued `PASS` in the DoD baseline.

**EXTERNAL:** independent novice discovery and comprehension of J/feedback (`A7_04`), author approval, art/rights and Q07 remain `BLOCKED_EXTERNAL`; this PR neither merges nor releases itself.

**Negative oracles:** automatic firing without J, no shot when J pressed, duplicate pickup, projectile wall bypass (Node mutant), attack while paused, KeyN skip, restart/reload falsely keeping combat progress, removal of OR-07 browser test, and promotion of `A7_04` to PASS.

**Stop:** missing/failed exact-SHA Chrome execution, mutation survivor, stale receipt, broken legacy browser regression or omitted human leaf. **Rollback:** revert this single S01 commit; no gameplay behavior is intentionally changed. The other 25 redesign slices are not implemented by this contract.
