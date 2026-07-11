// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: 'netlify',
  },
  runtimeConfig: {
    csesSessionCookie: process.env.CSES_SESSION_COOKIE || '',
  },
})
