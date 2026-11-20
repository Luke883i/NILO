# NILO NEXT · S02 — Contratto creativo A0 (proposta per decisione dell'autore)

> **Stato: DRAFT / non approvato.** Fonte macchina canonica: [contracts/nilo-semantic-v1.json](../contracts/nilo-semantic-v1.json), oggetto \`next_a0\`. Questa pagina è un prospetto per il giudizio, non una seconda fonte di autorità, né una ricevuta CORA-ENGINE. Questo cambiamento NON produce arte approvata, un gioco completo, una release o un valore positivo per Q07.

## A0 — risultato osservabile, attori, perimetro

**Outcome:** una persona nuova al gioco, su una piattaforma espressamente supportata, completa sei livelli originali, affronta tre boss comprensibili, trova ricompense e percorsi non obbligatori, recupera le sei ore e comprende il finale. La progressione è causata dall'azione fisica del giocatore, non dal solo checkpoint o da flag locali falsificabili.

**Attori:** il giocatore, Nilo (azione), Tica (suggerimenti), Perno (riparazioni), Custode, Archivista e Direttore; autore proprietario delle decisioni creative; reviewer tecnico; giocatori indipendenti per comprensione e gradevolezza.

**Behaviour:** spostamento, salto, impulso \`J\`, interazione contestuale \`E\`, pausa e ripresa, attacco/schivata, ricompensa, confronto con il boss. Ciclo prospettico \`explore → fight/avoid → collect → learn → choose → restore\`. Ogni livello usa \`TEACH → TEST → TWIST → MASTER\` come progressione semantica, non come ripetizione meccanica di quattro corridoi.

**Stato/dati:** ogni nemico, frammento e potenziamento conserva identità per evitare doppie ricompense; checkpoint come ripresa locale, **non prova autenticata di vittoria**; contenuti, asset e ricevute di test si riferiscono a uno SHA Git specifico.

**UX:** personaggi e pericoli riconoscibili in movimento, input fisici leggibili, segnali di attacco e vulnerabilità prima del danno, feedback non solo cromatico, leggibilità su viewport approvate e accessibilità qualificata con evidenza appropriata. Non si rivendica compatibilità touch o screen reader sulla sola base del layout.

**Esclusioni ed effetti:** nessuna importazione di asset, musiche o personaggi Nintendo; nessun asset privo di origine e licenza; nessuna telemetria, backend o monetizzazione senza decisione specifica e revisione. Nessun diritto, rating per età, qualità estetica, deploy o release può essere concesso dalla PR.

## Requisiti P1–P5 e sei mondi

I cinque requisiti sono non compensativi: identità HD originale; profondità ludica dei livelli; combattimento fisico; boss apprendibili con stati leggibili; ricompense utili. L'indicazione **HD** è una promessa di dettaglio effettivo in asset e animazione, non un upscale dell'attuale Canvas 480×270.

I sei mondi *candidati* mantengono l'identità del corpus, senza inventare livelli implementati:
- **LV-01 Cortile delle Lancette** — insegna movimento, attacco, ricompensa e rischio;
- **LV-02 Canali dei Minuti** — ponte mobile, correnti, Custode;
- **LV-03 Archivio delle Ombre** — interazioni luce/ombra con progressione;
- **LV-04 Fonderia dei Secondi** — ritmo, piattaforme a tempo, Archivista;
- **LV-05 Bosco delle Campane** — biforcazioni e scoperta;
- **LV-06 Cuore della Fabbrica** — combinazione di competenze e Direttore.

Restano implementazioni candidate solo LV-01, LV-02, LV-03 e Custode; questo documento **non** trasforma una mappa in un livello eseguibile.

## Decisioni da far adottare all'autore (DA01–DA09)

| ID | Domanda deliberativa | Opzione consigliata, non scelta |
| --- | --- | --- |
| DA01 | Pixel art ricca o illustrazione 2D? | High-detail original pixel art |
| DA02 | Come rendere coerente il combattimento con il tema della riparazione? | Disabilitare automi riparabili, senza gore |
| DA03 | Pubblico e rating desiderati? | Family-friendly, **rating non valutato** |
| DA04 | Primo target supportato? | Desktop/browser con tastiera |
| DA05 | Audio e equivalenti percettivi? | Musica/SFX originali, segnali visivi equivalenti |
| DA06 | Lingue supportate? | Italiano, piano di localizzazione |
| DA07 | Tono visivo? | Ottone caldo, città meccanica, identità propria |
| DA08 | Quanto lunghi i livelli, senza filler? | LV-01 4–6 min; altri 6–12 min **come target da misurare** |
| DA09 | Tracciamento e monetizzazione? | Nessuna telemetria o monetizzazione nello scope corrente |

**Contraddizione aperta DA02:** il testo del prodotto descrive una storia non violenta, mentre la fonte runtime S01 usa \`kills\` per la rimozione degli automi. Una decisione sull'esperienza *visibile* e sul significato narrativo deve precedere la produzione estensiva. Non si cancellano né l'implementazione né il conflitto per far passare CI.

Ogni DA è attualmente \`PENDING_AUTHOR_DECISION\`, con \`selected:null\`. La raccomandazione non equivale a selezione. L'autore può selezionare un'alternativa o richiedere di riaprire il contratto, con nuova revisione Git e rerun dei test pertinenti.

## Accettazione: AND-DoD e oracoli

\`G_CREATIVE_A0_S02\` diviene un figlio necessario di \`G_FULL_GAME\` nel DoD già esistente. Non introduce un altro bus di approvazione.

- **C2_00** — sorgente A0 coerente e falsificabile. Test di struttura, cross-map dei sei mondi e 14 mutazioni fisiche di contratto; baseline \`NOT_VERIFIED\`.
- **C2_01** — decisione autore sull'arte originale e sui personaggi; \`BLOCKED_EXTERNAL\`.
- **C2_02** — decisione autore sul confine etico/narrativo del combattimento; \`BLOCKED_EXTERNAL\`.
- **C2_03** — target, piattaforma, lingua e pacing approvati; \`BLOCKED_EXTERNAL\`.
- **C2_04** — audio, privacy e diritti con scope approvato; \`BLOCKED_EXTERNAL\`.
- **C2_05** — protocollo novizi, accessibilità e soglie preregistrate; \`BLOCKED_EXTERNAL\`.
- **C2_06** — verbale/decisione dell'autore con identità, SHA, data, opzioni scelte e conflitti risolti; \`BLOCKED_EXTERNAL\`.

Per accettazione vera occorrono: approvazione esplicita dell'autore, verifica di origine/diritti degli asset effettivi, e osservazione di utenti indipendenti sulle metriche preregistrate. Un test di contratto verde dà soltanto \`PASS_SCOPED_SOURCE\`; il DoD generale resta \`BLOCKED_EXTERNAL\`.

## Falsificatori e rollback

Il test \`tests/creative-a0-mutation.test.mjs\` scrive copie mutate dei contratti in file temporanei e le rilegge prima di invocare l'oracolo: inventare \`human_approved\`, selezionare DA02 senza approvazione, aggiungere telemetria, togliere vincoli anti-copia, eliminare LV-06, alterare il boss di LV-04, rimuovere P4 o criteri Q07, rimuovere C2_02 dal gate oppure inventare un witness **deve fallire**.

**Stop** su regressione dei contratti attuali, mutante sopravvissuto, evidenza attribuita allo SHA sbagliato, decisione creative inventata o revisione del reviewer mancante. **Rollback:** revert del commit S02 senza toccare il gameplay o \`main\`. **Next:** solo dopo decisioni autoriali verificabili, S03/S04 possono partire come implementation candidates e verificare i rispettivi esiti.
