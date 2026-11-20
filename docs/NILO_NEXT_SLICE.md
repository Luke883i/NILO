# NILO NEXT — action foundation (candidate, not accepted)

**Authority:** local NILO contract and existing DoD remain authoritative. This document is an engineering proposal and a source-level implementation report, not approval, CORA-ENGINE receipt, independent playtest or beta release.

## A0 / actors and effect boundary

- **Player:** desktop keyboard player may move, jump, press `J` for one mechanical impulse per physical key edge, stomp an enemy while descending and collect shards by contact. `E` remains contextual in the other levels.
- **Owners:** NILO product author decides narrative, UX, content and rights; `web/core.mjs` owns game transitions, `web/action.mjs` the pure candidate action rules, `web/main.mjs` the browser adapter, `web/art.mjs` the source-generated depiction, and `tests/` the test oracles. No CORA identity or approval is transplanted.
- **State:** LV-01-only volatile combat state: health 3, invulnerability timer, projectile cooldown, two patrols, three shards, killed-enemy and pickup identities. `KeyR` resets combat. The existing CP-01/02/03 records and the boss victory rule remain unchanged; no historical win is authenticated.
- **Exclusions:** not a 1080p remaster, no power-up persistence, no enemies in LV-02/03, no new boss encounter, no new levels, no audio/touch/screen-reader promise, no external telemetry or host deployment.

## Reverse-derived local DoD (non-compensatory)

- **SOURCE:** `OR-07` contract bound to the exact source/test paths through `contracts/development-map.json`, all original core/boss/level tests passing; a physically mutated projectile, invulnerability guard and attack input are detected by independent assertions.
- **TARGET_RUNTIME:** run native HTTP/Chrome on exact Git HEAD; press/release `J` against a visible patrol, observe a hit and disappearance, observe one shard collected, hit/stomp, life decrement and retry, and prove `P`, `R`, blur and tab visibility do not invent shots. Capture console/network/DOM/canvas/readback/screenshot and browser/OS/DPR.
- **EXTERNAL:** at least five novice playtests with author-approved thresholds for combat discovery, aesthetics, control, pacing and enjoyment; original HD art and rights review; beta-release owner. None of these leaves is closed by unit tests.

## Px ledger

| Problem | Scope after this slice | What is still missing |
| --- | --- | --- |
| P1 graphics | Source-generated, visually distinct enemy/shard/projectile glyphs and HUD | Actual HD characters, art atlas, six biomes, animation, human readability |
| P2 duration | No alteration to original geometry | Section design, alternate routes, measurable pacing and external playtest |
| P3 action | LV-01 candidate shot, stomp, patrol, health, pickups, cooldown | Native browser replay, power-ups, global enemy architecture and richer combat |
| P4 boss | Original Custode preserved | Interactive weakness, tutor sequence and human comprehension test |
| P5 engagement | LV-01 candidate shards and optional enemy engagement | Rewards/power-ups, secret loops and proof of player enjoyment |
| P6 shared engine | Pure specialized module with shared integration | Broader extensibility design only after validation |
| P7 semantic drift | README and build manifest now say three levels | Reconcile historical doc headers after review, never rewrite PR history |

**Stop/rollback:** if original mutational or target-native tests regress, revert the action-foundation commit without touching the baseline commit. `G_BETA_RELEASE`, `Q07`, `DL02`, `DL08`, author and rights gates remain `BLOCKED_EXTERNAL`.

**Next reversible slice:** first-party HD visual vertical slice of LV-01 accompanied by an approved art bible, actual browser screenshot and human visual comprehension test; only then enrich the Custode interaction and broaden level pacing. A one-level candidate cannot demonstrate the six-level root.
