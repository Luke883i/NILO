<!-- programme-header:v2 -->
> **ROA Research Programme · A-OSP ecosystem** — [Author & programme hub](https://github.com/Luke883i/academics) · [ROA theory](https://github.com/Luke883i/ROA) · [CORA assurance](https://github.com/Luke883i/cora). Every repository is independently readable. Membership does not imply formal derivation, shared runtime, scientific validation, certification, or production readiness. Repository-local code, evidence, and governance remain authoritative.

## Independent entrypoint

**Purpose:** an original 2D platform game and a case study of *integrated sequential multi-abstraction engineering*: narrative intent and UX, mechanics and state, executable game source, reproducible browser behavior, mutation-based falsification, deployment and release obligations remain linked without treating any single level as proof of the others. Two candidate levels are documented; the remaining beta scope and independent playtesting remain open. **Provisional CORA-Score:** Dev_CORA **4/5** · Bonifica_CORA **2/5**; [rubric](https://github.com/Luke883i/cora/blob/main/docs/CORA_SCORE.md).

---

# NILO — La Fabbrica delle Ore

NILO è un **platform narrativo 2D originale in sviluppo**: un viaggio per restituire sei ore rubate, con identità pixel art propria, sei livelli e tre boss previsti. Oggi il prodotto dispone di **due livelli candidati sperimentali (LV-01 e LV-02)**; gli altri quattro livelli e due boss sono proposte narrative, non software giocabile.

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

**Comandi:** ←/→ o A/D muovi; Spazio/W salta; P pausa; R riparti; N entra in LV-02 dopo LV-01; E ripara il pendolo durante la finestra sicura. Touch e screen reader equivalenti non sono supportati.

**Evidenza:** i test su HTTP/Chrome sono in `tests/browser-e2e.py`, `tests/browser-lv-02.py` e `tests/browser-custode.py`. Le CI raccolgono input, checkpoint, screenshot e SHA per ciascun commit; nessun esito tecnico sostituisce il playtest o autorizza una beta.

Per falsificare il catalogo di **10 milioni di scenari semantici ipotetici** (non 10 milioni di test del gioco): `npm run assurance:semantic`. Il [contratto della campagna](contracts/semantic-campaign-v1.json) esplicita assi e oracoli.

Il **DoD beta** è `G_BETA_RELEASE`: sei livelli e tre boss realmente giocabili, test browser e UX indipendenti, build/SBOM e licenze verificabili, controlli qualità e autorizzazione esterna. Le fasi e le regole di avanzamento sono nella [guida ingegneristica](docs/ENGINEERING.md). CORA fornisce il metodo di assurance, **non** un certificato di qualità né un agente che scrive autonomamente il prodotto.


**Gioco corrente (PR10):** completa LV-01 e premi **N** per LV-02. Attraversa ponte mobile e correnti, attiva CP-02, affronta il Custode. Evita i colpi segnalati e premi **E** vicino al pendolo durante la ripresa: due riparazioni in finestre distinte restituiscono la seconda ora; due colpi causano sconfitta, **R** riparte da CP-02. Il salvataggio locale è ripristino, non prova di vittoria pregressa. Quattro livelli e due boss sono ancora progettuali. Nessuna qualificazione UX indipendente, touch o beta.
