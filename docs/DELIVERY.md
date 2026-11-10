# NILO delivery — PR11 (Codespaces P0, Render P1)

**Current contract:** two levels and one boss are playable candidates. This page does not authorize a beta or assert a remote deployment. Source, browser and remote observations have separate evidence owners in [DoD](../contracts/dod-v1.json).

## P0: play inside GitHub Codespaces

1. Open a new Codespace from `main` after merging PR11, or rebuild an existing Codespace so it picks up `.devcontainer/devcontainer.json` (Node 22, one forwarded private HTTP port 8000).
2. In its terminal, run **`npm start`**. Expect `NILO_READY http://localhost:8000/`; leave the process running.
3. Open **PORTS** (VS Code or browser), find **8000 — NILO · gioco** and select **Open in Browser**. GitHub provides the forwarded URL `https://<actual-codespace>-8000.app.github.dev/` and handles authentication for a private port. **Never copy the example localhost address into your own browser when using browser-based Codespaces.**
4. Verify `curl -I http://127.0.0.1:8000/` returns 200 in the Codespace; `/main.mjs` and `/levels/custode.mjs` return 200, an unknown module returns 404. Play LV-01 → LV-02 and the Custode with real key events.
5. If no port appears, use **PORTS → Add Port → 8000**, rebuild the Codespace if it predates the devcontainer change, confirm the server is running, and use the actual URL shown in PORTS. Port visibility remains **private**; no public sharing is required.

**P0 tests in GitHub Actions:** real Node HTTP GET/HEAD, MIME types, 404/405, local browser game path, port config. **Still external:** a human must actually open the forwarded Codespace URL and verify keyboard/game visibility in that environment. This is leaf `DL02` in the DoD and must not become PASS from a CI runner.

## P1: Render static delivery (no app server, no deployment secrets)

1. Connect `Luke883i/NILO` to your Render account and create a **Blueprint** from [`render.yaml`](../render.yaml). This creates a *static* web site, with `buildCommand: npm run build:static`, publish directory `./dist`, and `autoDeployTrigger: checksPass`. Set linked branch to **main**. Check names and permissions in Render Dashboard before approving costs or public accessibility.
2. Render builds the exact source files from `web/` into `dist/`, plus `dist/nilo-deploy.json` with the build's `RENDER_GIT_COMMIT`/Git HEAD, ordered SHA-256 file manifest and tree digest. The manifest explicitly says **`beta_authorized: false`** and **`external_render_observed: false`**: the build cannot attest its own publication.
3. After the first successful deploy, copy its actual **`https://YOUR-SERVICE.onrender.com`** URL from Render Dashboard. In GitHub Settings → Secrets and variables → Actions → Variables, set non-secret repository variable `NILO_RENDER_URL` to this HTTPS origin (without trailing path). Do **not** commit a deploy hook or token; this static site needs neither.
4. The `NILO Render live post-deploy verification` GitHub workflow can run after successful **main** CI or via workflow_dispatch. It waits for the remote `nilo-deploy.json` to report the **exact main SHA**, then checks all assets against their digests, rejects nonexistent modules, launches Chrome against the **actual deployed URL**, runs LV-01→LV-02→Custode→LV-03 and captures signed-by-SHA evidence and screenshots. An old deployed SHA, missing service, HTTP errors, wrong content, broken browser or a timeout produces **FAIL**, not a synthetic PASS.
5. Inspect Render's deployment record (source commit and deploy state) alongside the GitHub remote-observer run. Render account connection, paid-plan or provider-side settings, actual CDN availability, domain, independent review and release approval are **external gates** and cannot be created by this PR alone.

**P1 tests without Render account:** CI builds exact `dist`, tests byte-for-byte parity, then serves that same directory over HTTP in Chrome and plays the full third-level route including CP-03. This is *deployable-artifact E2E*, not *observed provider deployment* (`DL08=BLOCKED_EXTERNAL` until actually verified).

## Reticolo DoD, metriche e checklist non compensativi

| Gate | Property | Oracle/measure | Stop condition |
| --- | --- | --- | --- |
| DL01 | Codespace configuration | `forwardPorts=[8000]`, private+HTTP+openBrowser, `npm start` | Drift in config/command |
| DL02 | Actual forwarded Codespace | Human-observed PORTS URL, native keys and visible canvas | **BLOCKED_EXTERNAL** until observed |
| DL03 | Runtime HTTP | Server starts within 6 s in CI, GET `/` + imported modules HTTP 200 | Nonzero startup, missing game |
| DL04 | No repo file leak | Source-only sandbox, negative 404 & method 405, MIME/CSP | Wrong root, path escape or script MIME |
| DL05 | Render service contract | `type: web`, `runtime: static`, `checksPass`, `./dist` | Dynamic service or ungated deploy |
| DL06 | Build provenance | 100% published files SHA256-matched, tree digest and exact commit | Missing file, wrong SHA or untracked secret |
| DL07 | Deployable E2E | Real HTTP Chrome, loaded modules and complete LV-01→LV-02→boss, screenshot digests | Runtime exception, invalid checkpoint, broken game |
| DL08 | Actual Render E2E | HTTPS `onrender.com`, 100% asset match, same SHA and full route | Unconfigured URL, stale deploy, 404, timeout, unreachable CDN |

**AND logic:** `G_CODESPACES_P0 = DL01∧DL02∧DL03∧DL04`; `G_RENDER_P1 = DL05∧DL06∧DL07∧DL08`; `G_DELIVERY_PR11 = G_CODESPACES_P0 ∧ G_RENDER_P1`. The latter is an obligatory child of `G_RELEASE`; any external blocker remains blocking even if source CI is green. Falsification uses actual source files and negative behavior, not synthetic self-reported release approval.

**Checklist:** [ ] Exact PR HEAD source CI green; [ ] Render static publish ZIP/browser CI green with file hashes; [ ] real Codespace port 8000 opened; [ ] real Render Blueprint synchronized and URL identified; [ ] remote main SHA matches deployed manifest; [ ] remote user can play the full three-level first-boss route; [ ] independent UX/accessibility/rights/release gates documented as open unless separately attested.

## Updated PR sequence

PR12 LV-03 / Archivio delle Ombre; PR13 LV-04 / Fonderia dei Secondi; PR14 boss Archivista; PR15 LV-05 / Bosco delle Campane; PR16 LV-06 / Cuore della Fabbrica; PR17 boss Direttore; PR18 Finale/crediti; PR19 audio, localizzazione and accessibility residuals; PR20 complete six-level/three-boss regression; PR21 reproduced build/SBOM/licenses/rollback; PR22 independent beta authorization. Possible later compression **only** when independent falsifiers and artifact/source linkage survive, especially PR17+18 or PR20+21. A GitHub or Render PASS cannot authorize beta, and 18 semantic iterations do not equal 18 fixed PRs.

## PR12 — Extension of source and remote delivery oracles

The static build includes `web/levels/lv-03.mjs`. Local original-source and deployable-`dist/` Chrome replay must reach LV-03 **from real Custode victory**, switch physical light/shadow gates, save and reload CP-03, distinguish the optional ledger from hour-three completion and verify screenshot bytes plus the exact source SHA. Remote Render workflow requires the same route whenever an actual provider URL is configured. A passing local artifact does **not** mean DL02 (forwarded Codespace access) or DL08 (live Render site) is satisfied. The PR11 postmerge workflow run 42672229809 failed before its job list was retrievable; diagnose the external CI issue separately from game regressions.
