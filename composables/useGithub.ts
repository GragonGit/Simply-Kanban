import { Octokit } from "@octokit/rest"

export interface StatusColumn {
  key: string
  label: string
  labelName: string
  color: string
}

export const STATUS_COLUMNS: StatusColumn[] = [
  { key: 'todo', label: 'To Do', labelName: 'status:todo', color: '94a3b8' },
  { key: 'in-progress', label: 'In Progress', labelName: 'status:in-progress', color: 'f59e0b' },
  { key: 'review', label: 'Review', labelName: 'status:review', color: '8b5cf6' },
  { key: 'done', label: 'Done', labelName: 'status:done', color: '10b981' }
]

const STATUS_LABEL_NAMES = new Set(STATUS_COLUMNS.map((c) => c.labelName))

export interface IssueLabel {
  name: string
  color: string
}

export interface BoardIssue {
  id: number
  number: number
  title: string
  body: string
  htmlUrl: string
  labels: IssueLabel[]
  assignee: { login: string; avatarUrl: string } | null
  updatedAt: string
  status: string
}

function toLabelObjects(raw: any[]): IssueLabel[] {
  return (raw || []).map((l) =>
    typeof l === 'string' ? { name: l, color: '888888' } : { name: l.name || '', color: l.color || '888888' }
  )
}

function statusFromLabels(labels: IssueLabel[]): string {
  const match = STATUS_COLUMNS.find((col) => labels.some((l) => l.name === col.labelName))
  return match ? match.key : 'todo'
}

export class GithubApiError extends Error {}

export function useGithub() {
  const { settings } = useSettings()

  function client(): Octokit {
    if (!settings.value.token) {
      throw new GithubApiError($t('useGitHub.noPat'))
    }
    return new Octokit({ auth: settings.value.token })
  }

  async function wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err: any) {
      const status = err?.status
      if (status === 401) {
        throw new GithubApiError($t('useGitHub.pat401'))
      }
      if (status === 403) {
        throw new GithubApiError($t('useGitHub.pat403'))
      }
      if (status === 404) {
        throw new GithubApiError($t('useGitHub.pat404'))
      }
      throw new GithubApiError(err?.message || $t('useGitHub.unknownError'))
    }
  }

  async function ensureStatusLabelsExist(): Promise<void> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      const existing = await octokit.paginate(octokit.issues.listLabelsForRepo, {
        owner,
        repo,
        per_page: 100
      })
      const existingNames = new Set(existing.map((l) => l.name))
      for (const col of STATUS_COLUMNS) {
        if (!existingNames.has(col.labelName)) {
          await octokit.issues.createLabel({
            owner,
            repo,
            name: col.labelName,
            color: col.color,
            description: `Kanban-Status: ${col.label}`
          })
        }
      }
    })
  }

  async function fetchIssues(): Promise<BoardIssue[]> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      const raw = await octokit.paginate(octokit.issues.listForRepo, {
        owner,
        repo,
        state: 'open',
        per_page: 100
      })
      return raw
        .filter((issue) => !('pull_request' in issue && issue.pull_request))
        .map((issue) => {
          const labels = toLabelObjects(issue.labels as any[])
          return {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body || '',
            htmlUrl: issue.html_url,
            labels,
            assignee: issue.assignee
              ? { login: issue.assignee.login, avatarUrl: issue.assignee.avatar_url }
              : null,
            updatedAt: issue.updated_at,
            status: statusFromLabels(labels)
          } satisfies BoardIssue
        })
    })
  }

  async function updateIssueStatus(issue: BoardIssue, newStatusKey: string): Promise<void> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      const col = STATUS_COLUMNS.find((c) => c.key === newStatusKey)
      if (!col) throw new GithubApiError($t('unknownColumn') + ` ${newStatusKey}`)
      const keptLabels = issue.labels.map((l) => l.name).filter((name) => !STATUS_LABEL_NAMES.has(name))
      await octokit.issues.update({
        owner,
        repo,
        issue_number: issue.number,
        labels: [...keptLabels, col.labelName]
      })
    })
  }

  interface UpdateContentPayload {
    title?: string
    body?: string
    state?: 'open' | 'closed'
  }

  async function updateIssueContent(issueNumber: number, updates: UpdateContentPayload): Promise<void> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      await octokit.issues.update({ owner, repo, issue_number: issueNumber, ...updates })
    })
  }

  async function createIssue(title: string, body: string, statusKey: string): Promise<BoardIssue> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      const col = STATUS_COLUMNS.find((c) => c.key === statusKey)
      const { data } = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels: col ? [col.labelName] : []
      })
      const labels = toLabelObjects(data.labels as any[])
      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || '',
        htmlUrl: data.html_url,
        labels,
        assignee: data.assignee ? { login: data.assignee.login, avatarUrl: data.assignee.avatar_url } : null,
        updatedAt: data.updated_at,
        status: statusFromLabels(labels)
      }
    })
  }

  async function testConnection(): Promise<void> {
    return wrap(async () => {
      const octokit = client()
      const { owner, repo } = settings.value
      await octokit.repos.get({ owner, repo })
    })
  }

  return {
    ensureStatusLabelsExist,
    fetchIssues,
    updateIssueStatus,
    updateIssueContent,
    createIssue,
    testConnection
  }
}
