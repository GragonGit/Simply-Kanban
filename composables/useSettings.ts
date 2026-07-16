export interface GithubSettings {
  token: string
  owner: string
  repo: string
}

const STORAGE_KEY = 'repo-kanban:github-settings'

const emptySettings = (): GithubSettings => ({ token: '', owner: '', repo: '' })

export function useSettings() {
  const settings = useState<GithubSettings>('github-settings', emptySettings)
  const hydrated = useState<boolean>('github-settings-hydrated', () => false)

  const isConfigured = computed(
    () => !!(settings.value.token && settings.value.owner && settings.value.repo)
  )

  function hydrate() {
    if (!import.meta.client || hydrated.value) return
    hydrated.value = true
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as GithubSettings
      settings.value = { ...emptySettings(), ...parsed }
    } catch (err) {
      console.error($t('saveSettingsError'), err)
    }
  }

  function save(next: GithubSettings) {
    settings.value = next
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
  }

  function clear() {
    settings.value = emptySettings()
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { settings, isConfigured, hydrate, save, clear }
}
