<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="top-nav">
      <span class="brand">CSES Tracker</span>
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
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f1115;
  color: #e6e8eb;
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
  border-bottom: 1px solid #23262d;
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
}

.top-nav nav {
  display: flex;
  gap: 1.5rem;
}

.top-nav nav a {
  text-decoration: none;
  color: #9aa0aa;
  font-size: 0.95rem;
}

.top-nav nav a.active {
  color: #ffffff;
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}
</style>
