// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Needed so useFetch() inside useHomeProgress()/useWeekPlanner() keeps
  // Nuxt's app context across `await` boundaries (composables that chain
  // multiple sequential useFetch calls, rather than a single one at the
  // top of a page's setup).
  experimental: {
    asyncContext: true,
  },
  nitro: {
    preset: 'netlify',
  },
  runtimeConfig: {
    csesSessionCookie: process.env.CSES_SESSION_COOKIE || '',
  },
  app: {
    head: {
      title: 'CSES Tracker — 進度追蹤',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
