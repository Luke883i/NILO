# NILO — La Fabbrica delle Ore

NILO è un **platform narrativo 2D originale in sviluppo**: un viaggio per restituire sei ore rubate, con identità pixel art propria, sei livelli e tre boss previsti. Oggi il prodotto dispone di **due livelli candidati sperimentali (LV-01 e LV-02)**; gli altri quattro livelli e due boss sono proposte narrative, non software giocabile.

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

Apri `http://127.0.0.1:8000` in un browser autorizzato; usa **←/→ o A/D**, **Spazio/W** per saltare, **P** per la pausa, **R** per il restart, **N** per accedere a LV-02 dopo LV-01 e **E** per riparare durante l'incontro con il Custode. Il prologo è destinato in questa fase al **desktop con tastiera**: non sono implementati controlli touch né un'alternativa equivalente allo screen reader.

**Evidenza:** i test su HTTP/Chrome sono in `tests/browser-e2e.py`, `tests/browser-lv-02.py` e `tests/browser-custode.py`. Le CI raccolgono input, checkpoint, screenshot e SHA per ciascun commit; nessun esito tecnico sostituisce il playtest o autorizza una beta.

Per falsificare il catalogo di **10 milioni di scenari semantici ipotetici** (non 10 milioni di test del gioco): `npm run assurance:semantic`. Il [contratto della campagna](contracts/semantic-campaign-v1.json) esplicita assi e oracoli.

Il **DoD beta** è `G_BETA_RELEASE`: sei livelli e tre boss realmente giocabili, test browser e UX indipendenti, build/SBOM e licenze verificabili, controlli qualità e autorizzazione esterna. Le fasi e le regole di avanzamento sono nella [guida ingegneristica](docs/ENGINEERING.md). CORA fornisce il metodo di assurance, **non** un certificato di qualità né un agente che scrive autonomamente il prodotto.


**Gioco corrente (PR10):** completa LV-01 e premi **N** per LV-02. Attraversa ponte mobile e correnti, attiva CP-02, affronta il Custode. Evita i colpi segnalati e premi **E** vicino al pendolo durante la ripresa: due riparazioni in finestre distinte restituiscono la seconda ora; due colpi causano sconfitta, **R** riparte da CP-02. Il salvataggio locale è ripristino, non prova di vittoria pregressa. Quattro livelli e due boss sono ancora progettuali. Nessuna qualificazione UX indipendente, touch o beta.
