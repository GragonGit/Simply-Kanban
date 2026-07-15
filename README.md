# Repo Kanban

Ein schlankes Kanban-Board für **ein einzelnes GitHub-Repository**. Es liest und
schreibt direkt die Issues dieses Repos – kein separates Datenmodell, keine
Synchronisation, kein Backend. Der Status einer Karte ist ein GitHub-Label
(`status:todo`, `status:in-progress`, `status:review`, `status:done`).

## Wie es funktioniert

- **Spalten = Labels.** Jede Spalte entspricht einem `status:*`-Label. Eine Karte
  verschieben ändert per API das Label des Issues. Issues ohne Status-Label
  landen automatisch in „To Do“.
- **Kein Backend.** Die App läuft komplett im Browser (Nuxt im SPA-Modus) und
  spricht direkt mit der GitHub REST API über [Octokit](https://github.com/octokit/rest.js).
- **Auth per Personal Access Token.** Kein OAuth-Server nötig. Der Token wird
  nur lokal im Browser (`localStorage`) gespeichert.
- **Reihenfolge innerhalb einer Spalte wird nicht gespeichert** – GitHub-Issues
  haben kein natives Sortierfeld. Nur die Spalte (der Status) ist persistent.

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:3000`. Beim ersten Start fragt sie
nach Owner, Repository-Name und einem Personal Access Token.

## Personal Access Token erstellen

1. [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) öffnen
2. „Generate new token“ → **Fine-grained token**
3. Repository access → **Only select repositories** → dein Repo wählen
4. Unter „Repository permissions“: **Issues → Read and write**
5. Token erzeugen und in der App eintragen

Der Token braucht keine weiteren Rechte.

## Deployment auf GitHub Pages

Das Projekt enthält einen fertigen Workflow (`.github/workflows/deploy.yml`):

1. Repo-Einstellungen → **Pages** → Source auf **GitHub Actions** stellen
2. Code auf den `main`-Branch pushen
3. Der Workflow baut die App (`nuxt generate`) und veröffentlicht sie automatisch

Die `baseURL` wird im Workflow automatisch auf `/<repo-name>/` gesetzt, passend
zu einer GitHub-Projekt-Page (`https://<user>.github.io/<repo-name>/`). Falls
du stattdessen eine User-/Org-Page (`https://<user>.github.io`) nutzt, in
`.github/workflows/deploy.yml` die Zeile

```yaml
NUXT_APP_BASE_URL: /${{ github.event.repository.name }}/
```

zu

```yaml
NUXT_APP_BASE_URL: /
```

ändern.

## In die README einbetten

Die App selbst kann nicht in ein gerendertes README eingebettet werden (GitHub
rendert dort kein JavaScript). Praktikabel ist ein Link/Badge:

```markdown
[📋 Kanban-Board öffnen](https://<user>.github.io/<repo-name>/)
```

## Projektstruktur

```
├── app.vue                    Root-Komponente
├── pages/index.vue            Zeigt Settings oder Board
├── components/
│   ├── SettingsPanel.vue      Owner/Repo/Token-Eingabe
│   ├── KanbanBoard.vue        Lädt Issues, orchestriert Spalten & Modal
│   ├── KanbanColumn.vue       Eine Spalte inkl. Drag & Drop
│   ├── IssueCard.vue          Einzelne Karte
│   └── IssueModal.vue         Issue anzeigen/bearbeiten/erstellen
├── composables/
│   ├── useSettings.ts         Zugangsdaten-Verwaltung (localStorage)
│   └── useGithub.ts           Alle GitHub-API-Aufrufe
└── assets/scss/               Design-Tokens (Farben, Typografie, Spacing)
```

## Anpassen

- **Weitere Spalten:** `STATUS_COLUMNS` in `composables/useGithub.ts` erweitern.
- **Andere Label-Namen:** `labelName` in `STATUS_COLUMNS` anpassen.
- **Nur offene Issues:** Standardverhalten. Um geschlossene ebenfalls
  anzuzeigen, `state: 'open'` in `fetchIssues()` (`useGithub.ts`) anpassen.
