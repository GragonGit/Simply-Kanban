// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-15',
  devtools: { enabled: true },

  ssr: false,

  app: {
    head: {
      title: 'Repo Kanban',
      meta: [
        { name: 'description', content: 'A Kanban-Board for individual GitHub-Repositories.' }
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

  typescript: {
    strict: true
  }
})
