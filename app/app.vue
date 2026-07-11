<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="top-nav">
      <NuxtLink to="/" class="brand">
        <img src="/favicon.svg" alt="" width="22" height="22" class="brand-logo" />
        <span>CSES Tracker</span>
      </NuxtLink>
      <nav>
        <NuxtLink to="/" exact-active-class="active">進度總覽</NuxtLink>
        <NuxtLink to="/plan" exact-active-class="active">規劃下週</NuxtLink>
      </nav>
    </header>
    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  --cs-bg: #ffffff;
  --cs-bg-subtle: #fafafa;
  --cs-border: #e5e5e7;
  --cs-border-subtle: #f0f0f1;
  --cs-text: #16171a;
  --cs-text-secondary: #666666;
  --cs-text-muted: #a3a3a3;
  --cs-accent: #0a8f5c;
  --cs-accent-bg: #e8f6ee;
  --cs-radius: 8px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--cs-bg);
  color: var(--cs-text);
}

a {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--cs-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--cs-text);
  text-decoration: none;
}

.brand-logo {
  border-radius: 6px;
  display: block;
}

.top-nav nav {
  display: flex;
  gap: 1.5rem;
}

.top-nav nav a {
  text-decoration: none;
  color: var(--cs-text-secondary);
  font-size: 0.9rem;
}

.top-nav nav a.active {
  color: var(--cs-text);
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
}
</style>
