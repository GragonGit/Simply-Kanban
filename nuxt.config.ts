// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Reines SPA: die App läuft komplett im Browser und spricht direkt
  // mit der GitHub API. Kein eigenes Backend nötig -> GitHub Pages tauglich.
  ssr: false,

  app: {
    // Für ein GitHub-Pages-Projekt liegt die Seite unter
    // https://<user>.github.io/<repo>/ – deshalb muss die baseURL den
    // Repo-Namen enthalten. Wird im Deploy-Workflow automatisch gesetzt
    // (NUXT_APP_BASE_URL), lokal reicht "/".
    // baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Repo Kanban',
      meta: [
        { name: 'description', content: 'Ein Kanban-Board für ein einzelnes GitHub-Repository, direkt auf Issues gemappt.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/scss/main.scss'],

  // vite: {
  //   css: {
  //     preprocessorOptions: {
  //       scss: {
  //         api: 'modern-compiler'
  //       }
  //     }
  //   }
  // },

  typescript: {
    strict: true
  }
})
