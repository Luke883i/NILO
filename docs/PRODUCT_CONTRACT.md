# NILO — Product contract (candidate v0.1)

**Status:** creative and engineering draft. The original brief in [CORA](https://github.com/Luke883i/cora/blob/8fddf346a4bd6ed28fdf22db39e69504d6b15adf/docs/CONTINUOUS_DEVELOPMENT.md) specifies a six-level 2D game, three bosses, an initial vertical slice and evidence discipline. It does **not** specify the six level names, characters' backstories or art. Those are **new proposals**, requiring author approval; machine tests cannot approve a story.

## Vision, world and playable promise

**NILO — La Fabbrica delle Ore** is an original side-scrolling game about returning six stolen hours to a city. In Ramecittà, Nilo the apprentice, Tica the clockwork bird and Perno the maintenance automaton confront the Director of Hours. The core theme is that the measure of time must remain accountable to its users. The tone is warm, curious and mechanical rather than violent or borrowed from an existing franchise. Proposed audience: broad family-friendly audience, age rating **unassessed**.

**Character language:** Nilo's small cap, watch and scarf create an unmistakable silhouette; Tica gives cues without replacing player choice; Perno embodies repairing rather than dominating; the bosses telegraph actions before punishing the player. Shapes and colors are proposed visual rules, **not licensed art or completed assets**.

**Acts:** 1 Cortile delle Lancette (controls/checkpoint); 2 Canali dei Minuti (Custode del Pendolo); 3 Archivio delle Ombre (light and disclosure); 4 Fonderia dei Secondi (Archivista dei Rintocchi); 5 Bosco delle Campane (optional paths and equivalent visual/sound cues); 6 Cuore della Fabbrica (Direttore delle Ore and shared-time ending). These are six **narrative commitments**, not six implemented levels.

## First vertical slice

A new player can navigate the first yard, move/jump across solid geometry, see the camera follow, activate a persistent checkpoint, view a readable HUD, pause/restart and reach the exit. The checkpoint must survive a new browser reload on the same origin; forged records and obsolete versions must be ignored. The browser must be tested beyond source-only physics. The first slice should require **no third-party images, fonts, analytics or network services**.

**Control proposal:** arrows or A/D move, Space/W/Up jumps, P pauses, R restarts. Keyboard is mandatory; touch controls, screen-reader alternative presentation, adaptable controls, reduced motion and color contrast need explicit qualification rather than implied support. A browser screenshot can show layout, not prove accessible interaction.

## Iteration/approval logic

The root contract DoD is **demonstrated only** when the user can play the six levels, defeat three bosses, follow the narrative, replay a checkpoint, inspect accepted asset rights and inspect attributable build/browser/host evidence with an independent reviewer. PR1 establishes the initial semantics and tooling; passing PR1 checks does **not** close this root. A later source commit invalidates earlier exact-HEAD CI. When the semantic model changes, its obligations need human reapproval and targeted reruns.

**Review questions before PR2:** approve names, tone and age target; choose final art style, platforms, audio policy, monetization/privacy policy, game locale and performance budget. For this seed the defaults are local/offline browser, no telemetry, Italian narrative and graphical placeholders; decisions outside that bounded scope remain open.

**Sources of truth:** `contracts/nilo-semantic-v1.json` for design candidate; `contracts/dod-v1.json` for noncompensatory obligations; `provenance/semantic-chain.json` for cross-plane lineage; `standards/references.json` for normative references. Historical intent stays in CORA, not copied as an execution receipt.

## Product-obiettivo commerciale — criteri derivati, non stato raggiunto

**NILO come gioco finito:** un platform narrativo 2D in pixel art originale in cui sei ore rubate tornano progressivamente alla città. Nilo non vince semplicemente una corsa: ogni ora recuperata cambia visibilmente il mondo e una relazione con Tica, Perno o gli antagonisti. Sei livelli differenziati e tre boss con segnali d'attacco comprensibili portano a un finale coerente e titoli di coda.

La direzione artistica candidata usa pixel integer 480×270 scalati a 960×540 senza smoothing, palette industriale blu/ottone/corallo, silhouette leggibili, skyline a parallasse, oggetti narrativi riconoscibili e segnali distinti per checkpoint/uscita. La PR3 sviluppa **soltanto LV-01**. Fonderia, canali, archivio, bosco, gli altri livelli e i tre boss non diventano contenuti disponibili perché hanno una palette nel contratto.

**Benchmark qualitativi, non asset da copiare:** [Celeste](https://www.celestegame.com/) suggerisce precisione dell'input e ritorno immediato dopo l'errore; [Shovel Knight](https://www.yachtclubgames.com/press/shovel-knight-shovel-of-hope/) leggibilità di personaggi/animazioni e parallasse; [Hollow Knight](https://www.hollowknight.com/) luoghi e personaggi riconoscibili tramite narrazione ambientale. La derivazione è dall'esito per il giocatore ai mezzi software, non dal numero di elementi grafici o dal numero di iterazioni.

**Problemi aperti nel prologo:** assenza di controlli touch, alternativa screen reader, riproduzione HTTP/browser su host osservato, audio, interazioni con gli NPC, pixel-font potenzialmente troppo piccolo a risoluzione ridotta, mancanza di valutazione con giocatori esterni. La resa grafica più ricca non dimostra gradevolezza o accessibilità.

**Beta:** DoD non compensativo `G_BETA_RELEASE`; la qualità artistica e il divertimento richiedono osservazioni con giocatori e revisione dell'autore, non possono essere approvati automaticamente da un oracle CSS o da screenshot.
