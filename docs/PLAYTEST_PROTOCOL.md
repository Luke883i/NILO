# NILO — Protocollo di playtest indipendente, LV-01

**Stato:** protocollo proposto, nessun tester indipendente osservato. [Contratto di prodotto](../contracts/nilo-semantic-v1.json), [mappa di sviluppo](../contracts/development-map.json), [DoD beta](../contracts/dod-v1.json).

## Obiettivo verificabile

Un nuovo giocatore che non conosce NILO comprende chi è Nilo, riconosce Tica come guida, distingue le piattaforme dagli edifici, usa i comandi, raggiunge il checkpoint, ricarica il gioco senza perdere i progressi e completa il prologo senza intervento del facilitatore. La qualità estetica è valutata **separatamente** dalla possibilità tecnica di completare il livello.

**Dispositivo minimo della prova:** browser reale via origine HTTP autorizzata, build e Git HEAD esatti, tastiera desktop, viewport e devicePixelRatio acquisiti, console/network/error log, consenso e conservazione dei dati di test secondo politica applicabile. Solo la sessione effettivamente osservata può ricevere un esito.

## Compiti e controesempi

| Prova | Osservazione necessaria | Falsificatore |
| --- | --- | --- |
| Identità | Il giocatore identifica Nilo, Tica e scopo narrativo | Li confonde con ostacoli o decorazioni |
| Controllo | Muoversi, saltare, fermarsi e riprendere | Tasti non scoperti o feedback fuorviante |
| Percezione | Riconoscere spazio sicuro, burroni, checkpoint e uscita | Il fondale viene interpretato come superficie solida |
| Persistenza | Raggiungere checkpoint, ricaricare la stessa origine, riprendere | Salvataggio non persistente o stato contraffatto accettato |
| Conclusione | Terminare LV-01 e sapere che LV-02 non è disponibile | Il messaggio finale fa credere che sei livelli siano già giocabili |
| Leggibilità | Leggere HUD sul dispositivo effettivamente supportato | Testo piccolo, contrasto inadeguato o informazione solo cromatica |
| Accessibilità | Valutare focus, tastiera, riduzione movimento e percorso alternativo | Canvas non comprensibile con tecnologie assistive |

La versione mobile **non è candidata**: niente promessa di compatibilità touch sulla base del solo responsive layout. Il test assistivo resta `BLOCKED_EXTERNAL` finché non esiste un'alternativa fruibile e valutata.

## Rubrica di gradevolezza (non riducibile a una media)

Per ogni tester: controllo e correttezza percepita, leggibilità del livello, riconoscibilità dei personaggi, coerenza visiva, comprensione dell'obiettivo e piacere di riprovare (scala ancorata da 1 a 5). Annotare singolarmente tempi, errori, richieste d'aiuto, completamento e osservazioni non guidate. Una media positiva **non compensa** un difetto bloccante di sicurezza, accessibilità o progressione.

**Soglie provvisorie da approvare dall'autore prima dello studio:** almeno cinque giocatori esterni non coinvolti nello sviluppo, almeno 4/5 per leggibilità e controllo, almeno quattro completamenti su cinque senza indicazioni aggiuntive, nessun bug bloccante del checkpoint e nessuna falsa promessa sul livello successivo. Sono criteri di progetto proposti, non risultati misurati, non statisticamente rappresentativi del mercato.

## Catena della prova

Registrare: tester pseudonimizzato e consenso, tester indipendente dal codice, target browser/OS, esatta revisione Git, contratto e criteri approvati, scenario, input, screenshot o registrazione autorizzata, esiti positivi e negativi, data, versioni e review. I digest SHA-256 identificano file, non autenticità dell'osservatore. Ripetere su nuovo SHA.

**Gate:** OR-05 e Q03 restano `BLOCKED_EXTERNAL` fino ad accettazione indipendente documentata. Il playtest di LV-01 non dimostra `G_BETA_RELEASE` finché mancano cinque livelli, tre boss e gli altri prerequisiti AND.

Per la beta completa, il protocollo deve produrre evidenze indipendenti anche per `Q07`, compresi audio oppure accettazione esplicita di un rilascio silenzioso. Il giudizio di un solo autore non sostituisce il tester esterno né un percorso completo di sei livelli.

## PR8 — protocollo mirato alla comprensione visivo-narrativa

La PR8 propone **quattro cue narrativi** e cinque famiglie di segnali grafici, ma non attribuisce loro qualità estetica dimostrata. L'osservazione indipendente deve conservare esattamente il browser, la viewport, la revisione Git, lo screenshot originale, il consenso e il contesto in cui il giocatore vede la scena.

**Prova senza suggerimenti:** mostrare avvio LV-01 e chiedere separatamente chi sia il personaggio controllabile, chi lo accompagni, quale superficie regga il peso e cosa accada oltre il vuoto. Chiedere *prima* di leggere il testo dell'HUD, poi confrontare con la comprensione *dopo* i cue narrativi. Non suggerire le risposte.

**Prova di stato:** al checkpoint chiedere di identificare Perno e il segnatempo attivato, distinguendolo dagli edifici di sfondo; all'uscita chiedere quante ore siano state restituite e quali fra i livelli successivi siano già giocabili. Una risposta errata diventa un controesempio per la semantica della scena.

**Prova visiva:** acquisire screenshot e DPR al vero 960×540; a 390px verificare esplicitamente la presenza dell'avvertenza mobile non supportato, senza fingere una prova di giocabilità touch. Registrare errori di contrasto, ostruzione delle piattaforme, sovrapposizioni tra etichette e Nilo, leggibilità di personaggi e obiettivi durante l'azione e nei momenti di movimento ridotto.

**Regola di accettazione:** il renderer e i cue possono essere qualificati come *implementati e controllabili* da test automatici. Identità dei personaggi percepita, piacevolezza, comprensione senza istruzioni, accessibilità assistiva, originalità/diritti e valutazione autoriale restano gate esterni. Nessun screenshot o score sintetico può promuovere Q07 a PASS.

## PR10 — Playtest esterno del Custode (non ancora osservato)

Il tester indipendente deve entrare in LV-02, riconoscere un preavviso *prima* del colpo, distinguere le finestre sicure, scoprire la riparazione `E`, osservare la seconda ora soltanto dopo due riparazioni e ripartire dopo sconfitta. Raccogliere separatamente comprensione senza suggerimenti, fairness percepita, leggibilità durante l'azione e capacità di completamento. Registrare errori e outcome per esatta revisione Git, browser, viewport, profilo accessibilità e consenso. **La CI browser non è osservazione indipendente del divertimento**; Q07 resta `BLOCKED_EXTERNAL`.
