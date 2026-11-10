# NILO — La Fabbrica delle Ore

NILO è un **platform narrativo 2D originale in sviluppo**: un viaggio per restituire sei ore rubate, con identità pixel art propria, sei livelli e tre boss previsti. Oggi il prodotto dispone di **tre livelli candidati sperimentali (LV-01, LV-02, LV-03)** e un boss candidato (Custode). LV-04–LV-06 e due boss rimangono design, non gioco funzionante.

| Piano | Che cos'è | Dove verificarlo |
| --- | --- | --- |
| **Prodotto** | Storia, personaggi, livelli, esperienza del giocatore | [Contratto creativo](contracts/nilo-semantic-v1.json) · [Descrizione](docs/PRODUCT_CONTRACT.md) |
| **Software** | Gioco Canvas2D, fisica, checkpoint, HUD, sorgenti e test | [web/](web/) · [tests/](tests/) |
| **Repository** | Git, DoD, tracciabilità, CI, SBOM, provenienza e decisioni | [Reticolo DoD](contracts/dod-v1.json) · [Bridge](contracts/development-map.json) · [Metodo](docs/ENGINEERING.md) |

**Regola di sviluppo:** nessun comportamento dichiarato senza un collegamento obbligatorio tra requisito di prodotto, sorgente software e test/evidenza nel repository. `node scripts/verify.mjs` rifiuta le associazioni mancanti e le promozioni indebite.

## Gioca subito (desktop con tastiera)

**Codespaces:** apri il repository in un nuovo Codespace (ricostruisci il container se era gia aperto), poi esegui dal terminale:

```sh
npm start
```

Apri **PORTS → 8000 (NILO · gioco) → Open in Browser**: Codespaces inoltra una porta **privata** all'URL HTTPS assegnato dalla piattaforma. Il link `localhost:8000` stampato nel terminale funziona **dentro** il Codespace, non necessariamente nel browser del tuo computer. Se la porta non appare, usa **PORTS → Add Port → 8000**; verifica `curl -I http://127.0.0.1:8000/` dal terminale, che il server sia ancora attivo e che il Codespace abbia caricato la configurazione aggiornata. <https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace>

**Checkout locale:** esegui `npm start` e apri `http://localhost:8000/` sullo stesso computer. Non serve alcun `npm install` per giocare.

**Verifica:** `npm run quality` controlla il sorgente; `npm run build:static` genera in `dist/` esattamente gli asset pubblicabili. `npm run test:delivery` falsifica server, port forwarding dichiarato e manifesto della build.

**Render (hosting pubblico, non beta):** crea un Blueprint Render collegato al repository usando [render.yaml](render.yaml); è un **Static Site**, non un web service Node. Si attiva sui check Git superati; la reale URL `onrender.com` è quella attribuita da Render dopo il deploy. Vedi [guida di distribuzione](docs/DELIVERY.md). La configurazione o una CI locale verde non dimostrano che un sito Render esista o sia pubblicato.

**Comandi:** ←/→ o A/D muovi; Spazio/W salta; P pausa; R riparti; N passa al livello successivo dopo LV-01 o vittoria Custode; E ripara il pendolo o alterna luce/ombra vicino alle lampade dell'Archivio. Touch e screen reader equivalenti non sono supportati.

**Evidenza:** i test HTTP/Chrome sono in `tests/browser-e2e.py`, `tests/browser-lv-02.py`, `tests/browser-custode.py` e `tests/browser-lv-03.py`. Le CI raccolgono input, checkpoint, screenshot e SHA per ciascun commit; nessun esito tecnico sostituisce il playtest o autorizza una beta.

Per falsificare il catalogo di **10 milioni di scenari semantici ipotetici** (non 10 milioni di test del gioco): `npm run assurance:semantic`. Il [contratto della campagna](contracts/semantic-campaign-v1.json) esplicita assi e oracoli.

Il **DoD beta** è `G_BETA_RELEASE`: sei livelli e tre boss realmente giocabili, test browser e UX indipendenti, build/SBOM e licenze verificabili, controlli qualità e autorizzazione esterna. Le fasi e le regole di avanzamento sono nella [guida ingegneristica](docs/ENGINEERING.md). CORA fornisce il metodo di assurance, **non** un certificato di qualità né un agente che scrive autonomamente il prodotto.


**Gioco corrente (PR12):** completa LV-01 e premi **N** per LV-02. Attraversa ponte mobile e correnti, attiva CP-02, affronta il Custode. Evita i colpi segnalati e premi **E** vicino al pendolo durante la ripresa: due riparazioni in finestre distinte restituiscono la seconda ora; due colpi causano sconfitta, **R** riparte da CP-02. Il salvataggio locale è ripristino, non prova di vittoria pregressa. Dopo la vittoria sul Custode premi **N** per LV-03: usa **E** presso le lampade per aprire due porte di tipo opposto. Il registro è facoltativo; CP-03 ripristina una posizione locale e non prova una vittoria storica. Solo attraversando entrambe le porte e raggiungendo l'uscita si restituisce la terza ora. Tre livelli e due boss rimangono progettuali. Nessuna qualificazione UX indipendente, touch o beta.
