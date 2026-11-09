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

## PR3 — target commerciale e derivazione retrograda

| Benchmark / proprietà visibile | Esito necessario in NILO | Prova e falsificatore | Stato |
| --- | --- | --- | --- |
| *Celeste*: controllo preciso e ripartenza rapida | Salti riproducibili, errori comprensibili, morte non punitiva, eventuali assist approvati | playtest diversi skill levels, latenza/frame, mutanti collision/respawn | Core testato, user experience non misurata |
| *Shovel Knight*: pixel art coerente e identità leggibile | Hero/companion/ally distinti, animazione, foreground/parallasse e HUD | source palette, mutante fisico contrasto, screenshot reale e verifica umana | Codice procedurale LV-01 candidato |
| *Hollow Knight*: luoghi e relazioni memorabili | Ogni livello possiede bioma, tema, meccanica e arco di personaggio | completamento narrativo con giocatori e asset legalmente autorizzati | Solo bozza sei capitoli |
| Qualità beta indipendente | Sei livelli, tre boss, compatibilità, accessibilità, produzione, arte/licenze, revisione e distribuzione | `G_BETA_RELEASE` e `G_SUPPLY_CHAIN` e `G_RELEASE`, tutti i prerequisiti richiesti | BLOCKED_EXTERNAL |

**Iterazione controllata PR3:** nessuna cartella top-level nuova. La resa viene isolata in `web/art.mjs` (proprietà prodotto OR-05) lasciando `web/core.mjs` motore e fonte fisica invariata. `tests/art.test.mjs` controlla soltanto proprietà sorgente di palette e struttura; `tests/art-mutation.test.mjs` modifica fisicamente i byte dell'arte in un checkout temporaneo per verificare il controllo contrasto; questi test NON conferiscono `HUMAN_AND_BROWSER_REQUIRED` a OR-05.

**10 milioni pre-seeded:** `contracts/semantic-campaign-v1.json` dichiara sette assi semantici × dieci valori ciascuno (scene, input, viewport, checkpoint, arte, storia, provenienza). `scripts/semantic-campaign.mjs` percorre esattamente 10.000.000 tuple deterministiche con seed 20261109 e oracolo a due implementazioni, cercando sette classi di promozione indebita. Il conteggio è di **vettori ipotetici combinatori**, non sessioni di giocatori, patch o rendering. Solo 128 firme di errore normalizzate sono possibili per i sette bit; nessuna novità nella finestra finale è *saturazione del modello*, non completezza semantica del gioco. Alcune combinazioni sono esperimenti di progettazione, non singole sessioni giocabili.

**Osservazione browser circoscritta:** in un Chromium 144 instrumentato, import dei quattro nuovi file web ricostruito senza origine HTTP perché la policy locale blocca gli URL; screenshot desktop e mobile, completamento da tastiera con 6 salti e checkpoint, nessun errore JS. I Git blob dei file `web/art.mjs`, `web/main.mjs`, `web/style.css`, `web/index.html` sono stati verificati contro la branch di implementazione PR3 prima del reporting. Il pixel rendering è un candidato, non una valutazione umana di bellezza. I nuovi screenshot non sono un browser test CI su origine HTTP né prova di persistenza reale.

**Prossima unità minima ad alta leva:** completare test browser effettivo su origine HTTP e persistenza reale; ottenere playtest di leggibilità; definire e approvare il sistema di direzione artistica e progressione di un intero livello prima di replicare il modello negli altri cinque. Poi elaborare jump buffering/coyote, audio originale e boss fairness con mutanti e osservazioni indipendenti.
