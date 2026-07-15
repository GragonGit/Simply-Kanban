# Repo Kanban

A lightweight Kanban board for **a single GitHub repository**. It reads and
writes the issues of that repo directly – no separate data model, no
synchronization, no backend. A card's status is a GitHub label
(`status:todo`, `status:in-progress`, `status:review`, `status:done`).

## How it works

- **Columns = labels.** Each column corresponds to a `status:*` label. Moving
  a card changes the issue's label via the API. Issues without a status label
  automatically land in "To Do".
- **No backend.** The app runs entirely in the browser (Nuxt in SPA mode) and
  talks directly to the GitHub REST API via [Octokit](https://github.com/octokit/rest.js).
- **Auth via Personal Access Token.** No OAuth server needed. The token is
  stored only locally in the browser (`localStorage`).
- **Order within a column is not saved** – GitHub issues have no native
  sorting field. Only the column (the status) is persisted.

## Creating a Personal Access Token

1. Open [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta)
2. "Generate new token" → **Fine-grained token**
3. Repository access → **Only select repositories** → choose your repo
4. Under "Repository permissions": **Issues → Read and write**
5. Generate the token and enter it in the app

The token doesn't need any further permissions.

## Deployment to GitHub Pages

The project includes a ready-made workflow (`.github/workflows/deploy.yml`):

1. Repo settings → **Pages** → set Source to **GitHub Actions**
2. Push the code to the `main` branch
3. The workflow builds the app (`nuxt generate`) and publishes it automatically

The `baseURL` is automatically set in the workflow to `/<repo-name>/`, matching
a GitHub project page (`https://<user>.github.io/<repo-name>/`). If you're
using a user/org page instead (`https://<user>.github.io`), change the line

```yaml
NUXT_APP_BASE_URL: /${{ github.event.repository.name }}/
```

in `.github/workflows/deploy.yml` to

```yaml
NUXT_APP_BASE_URL: /
```

## Embedding in the README

The app itself cannot be embedded in a rendered README (GitHub doesn't render
JavaScript there). A link/badge is the practical option:

```markdown
[📋 Open Kanban Board](https://<user>.github.io/<repo-name>/)
```

## Project structure

```
├── app.vue                    Root component
├── pages/index.vue            Shows settings or board
├── components/
│   ├── SettingsPanel.vue      Owner/repo/token input
│   ├── KanbanBoard.vue        Loads issues, orchestrates columns & modal
│   ├── KanbanColumn.vue       A single column incl. drag & drop
│   ├── IssueCard.vue          Individual card
│   └── IssueModal.vue         View/edit/create issue
├── composables/
│   ├── useSettings.ts         Credentials management (localStorage)
│   └── useGithub.ts           All GitHub API calls
└── assets/scss/               Design tokens (colors, typography, spacing)
```

## Customizing

- **More columns:** extend `STATUS_COLUMNS` in `composables/useGithub.ts`.
- **Different label names:** adjust `labelName` in `STATUS_COLUMNS`.
- **Open issues only:** default behavior. To also show closed issues,
  adjust `state: 'open'` in `fetchIssues()` (`useGithub.ts`).