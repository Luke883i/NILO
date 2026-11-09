# NILO — La Fabbrica delle Ore

NILO è un **platform narrativo 2D originale in sviluppo**: un viaggio per restituire sei ore rubate, con identità pixel art propria, sei livelli e tre boss previsti. Oggi il prodotto dispone di **due livelli candidati sperimentali (LV-01 e LV-02)**; gli altri quattro livelli e tutti i boss sono proposte narrative, non software giocabile.

| Piano | Che cos'è | Dove verificarlo |
| --- | --- | --- |
| **Prodotto** | Storia, personaggi, livelli, esperienza del giocatore | [Contratto creativo](contracts/nilo-semantic-v1.json) · [Descrizione](docs/PRODUCT_CONTRACT.md) |
| **Software** | Gioco Canvas2D, fisica, checkpoint, HUD, sorgenti e test | [web/](web/) · [tests/](tests/) |
| **Repository** | Git, DoD, tracciabilità, CI, SBOM, provenienza e decisioni | [Reticolo DoD](contracts/dod-v1.json) · [Bridge](contracts/development-map.json) · [Metodo](docs/ENGINEERING.md) |

**Regola di sviluppo:** nessun comportamento dichiarato senza un collegamento obbligatorio tra requisito di prodotto, sorgente software e test/evidenza nel repository. `node scripts/verify.mjs` rifiuta le associazioni mancanti e le promozioni indebite.

## Avvio e verifica

```sh
# Dalla root del checkout: Node.js 20+, nessuna dipendenza npm runtime.
npm run quality
python3 -m http.server 8000 --directory web
```

Apri `http://127.0.0.1:8000` in un browser autorizzato; usa **←/→ o A/D**, **Spazio/W** per saltare, **P** per la pausa, **R** per il restart. Il prologo è destinato in questa fase al **desktop con tastiera**: non sono implementati controlli touch né un'alternativa equivalente allo screen reader.

**Stato:** il prologo LV-01 ha un nuovo renderer pixel-art procedurale e verifiche di sorgente/contrasto; è un candidato artistico, non un livello approvato da utenti. Mutanti PR1 disponibili; screenshot e controlli in un harness Chromium locale sono diagnostica circoscritta, non un test browser HTTP certificato. Nessuna approvazione dell'autore, revisione umana indipendente o rilascio beta è attestata.

Per falsificare il catalogo di **10 milioni di scenari semantici ipotetici** (non 10 milioni di test del gioco): `npm run assurance:semantic`. Il [contratto della campagna](contracts/semantic-campaign-v1.json) esplicita assi e oracoli.

Il **DoD beta** è `G_BETA_RELEASE`: sei livelli e tre boss realmente giocabili, test browser e UX indipendenti, build/SBOM e licenze verificabili, controlli qualità e autorizzazione esterna. Le fasi e le regole di avanzamento sono nella [guida ingegneristica](docs/ENGINEERING.md). CORA fornisce il metodo di assurance, **non** un certificato di qualità né un agente che scrive autonomamente il prodotto.
\n\n**PR9 / LV-02:** dopo il completamento di LV-01, premi **N** per accedere ai Canali dei Minuti. La piattaforma mobile e le correnti sono in sviluppo; CP-02 è indipendente dal checkpoint di LV-01. Usa `npm run test:lv02` per prove di sorgente e `npm run test:browser:lv02` su un host Chrome autorizzato. **Custode e seconda ora rimangono non implementati; nessuna beta o approvazione estetica è attestata.**\n