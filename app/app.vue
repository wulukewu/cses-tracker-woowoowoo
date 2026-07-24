<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />

    <div class="cf-container">
      <header class="cf-topbar">
        <NuxtLink to="/" class="cf-logo" aria-label="CSES Tracker">
          <svg class="cf-logo-bars" width="46" height="34" viewBox="0 0 46 34" aria-hidden="true">
            <rect x="0" y="18" width="9" height="16" rx="1" fill="#f7b500" />
            <rect x="12" y="10" width="9" height="24" rx="1" fill="#e6532d" />
            <rect x="24" y="2" width="9" height="32" rx="1" fill="#3b5998" />
          </svg>
          <span class="cf-wordmark"><span class="wm-a">CSES</span><span class="wm-b">Tracker</span></span>
        </NuxtLink>
        <div class="cf-topbar-right">
          <span class="cf-lang">En&nbsp;|&nbsp;Ru</span>
          <span class="cf-auth"><span class="cf-authlink">Enter</span> | <span class="cf-authlink">Register</span></span>
          <button type="button" class="cf-theme-toggle" @click="toggleTheme" :title="isDark ? '切換亮色模式' : '切換深色模式'">
            <span v-if="isDark">☀</span><span v-else>☾</span>
          </button>
        </div>
      </header>

      <nav class="cf-menu-box">
        <ul class="cf-menu-list">
          <li><NuxtLink to="/" exact-active-class="current">首頁</NuxtLink></li>
          <li><NuxtLink to="/round" active-class="current">賽況</NuxtLink></li>
          <li><NuxtLink to="/plan" active-class="current">規劃</NuxtLink></li>
          <li><a href="https://cses.fi/problemset/" target="_blank" rel="noopener">題庫</a></li>
        </ul>
        <div class="cf-menu-search">
          <input type="text" aria-label="search" disabled />
        </div>
      </nav>

      <div class="app-main">
        <div class="app-content">
          <NuxtPage />
        </div>
        <div class="cf-sidebar-col">
          <LayoutCfSidebar />
        </div>
      </div>

      <footer class="cf-footer">
        CSES Tracker &mdash; 三人週賽練功房 &nbsp;·&nbsp; lukewu &nbsp;·&nbsp; zyo &nbsp;·&nbsp; Weeeeeeeeeeeee00
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'cses-tracker-theme'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  try {
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  } catch {}
}

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : ''
}

onMounted(() => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = stored === 'dark' || (!stored && prefersDark)
  applyTheme(isDark.value)
})

useHead({
  script: [
    {
      innerHTML: `(function(){var t;try{t=localStorage.getItem('${STORAGE_KEY}')}catch(e){}var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.dataset.theme='dark'})()`,
      tagPosition: 'head',
    },
  ],
})
</script>

<style>
:root {
  --cf-bg: #ffffff;
  --cf-cell: #f8f8f8;
  --cf-border: #b9b9b9;
  --cf-sep: #e1e1e1;
  --cf-text: #000000;
  --cf-text-secondary: #555555;
  --cf-text-muted: #888888;
  --cf-accent: #008000;
  --cf-accent-bg: #e9f3e9;
  --cf-stuck-bg: #fff3e0;
  --cf-red: #b3261e;
  --cf-red-bg: #fef2f2;
  --cf-radius: 6px;
  --cf-blue: #3b5998;
  --cf-link: #3b5998;
  --cf-logo-a: #2a2a2a;
  --cf-logo-b: #5b7fb0;
}

[data-theme="dark"] {
  --cf-bg: #121212;
  --cf-cell: #1e1e1e;
  --cf-border: #333333;
  --cf-sep: #2a2a2a;
  --cf-text: #e0e0e0;
  --cf-text-secondary: #999999;
  --cf-text-muted: #666666;
  --cf-accent: #3fb950;
  --cf-accent-bg: #0d2818;
  --cf-stuck-bg: #3d2a0a;
  --cf-red: #f87171;
  --cf-red-bg: #3b1515;
  --cf-blue: #58a6ff;
  --cf-link: #58a6ff;
  --cf-logo-a: #e0e0e0;
  --cf-logo-b: #5890d0;
}

* {
  box-sizing: border-box;
}

html,
body {
  background: var(--cf-bg);
}

body {
  margin: 0;
  font-family: Verdana, Arial, 'Helvetica Neue', sans-serif;
  color: var(--cf-text);
  font-size: 13px;
  line-height: 1.5;
}

a {
  color: var(--cf-link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.cf-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ---------- Top bar (logo + auth) ---------- */
.cf-topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0.25rem 0.85rem;
  flex-wrap: wrap;
}

.cf-logo {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.cf-logo:hover {
  text-decoration: none;
}

.cf-logo-bars {
  display: block;
}

.cf-wordmark {
  font-family: 'Trebuchet MS', Verdana, sans-serif;
  font-weight: 700;
  font-size: 2rem;
  letter-spacing: -0.01em;
  line-height: 1;
}
.wm-a {
  color: var(--cf-logo-a);
}
.wm-b {
  color: var(--cf-logo-b);
  margin-left: 0.12em;
}

.cf-topbar-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  font-size: 0.82rem;
}
.cf-lang {
  color: var(--cf-text-secondary);
}
.cf-auth {
  color: var(--cf-text-muted);
}
.cf-authlink {
  color: var(--cf-link);
  cursor: default;
}

.cf-theme-toggle {
  font-size: 1rem;
  line-height: 1;
  background: none;
  border: 1px solid var(--cf-border);
  border-radius: 3px;
  padding: 0.15rem 0.35rem;
  cursor: pointer;
  color: var(--cf-text);
}

/* ---------- Menu box ---------- */
.cf-menu-box {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  padding: 0 0.5rem;
  margin-bottom: 0.85rem;
}

.cf-menu-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 0 0 0.5rem;
  flex-wrap: wrap;
}

.cf-menu-list li {
  display: flex;
}

.cf-menu-list a {
  display: flex;
  align-items: center;
  color: var(--cf-text);
  text-transform: uppercase;
  font-size: 0.9rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  padding: 0.6rem 0.85rem;
  border-bottom: 3px solid transparent;
}

.cf-menu-list a:hover {
  text-decoration: none;
  color: var(--cf-blue);
}

.cf-menu-list a.current {
  border-bottom-color: var(--cf-blue);
  color: var(--cf-text);
}

.cf-menu-search {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.4rem;
}
.cf-menu-search input {
  width: 130px;
  height: 22px;
  border: 1px solid var(--cf-border);
  border-radius: 4px;
  background: var(--cf-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") no-repeat right 6px center;
  color: var(--cf-text);
}

/* ---------- Main two-column layout ---------- */
.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 1.25rem;
  align-items: start;
  padding: 0.5rem 0.25rem 1.5rem;
}

.app-content {
  min-width: 0;
}
.cf-sidebar-col {
  min-width: 0;
}

/* ---------- Footer ---------- */
.cf-footer {
  border-top: 1px solid var(--cf-sep);
  padding: 1rem 0.25rem 1.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--cf-text-muted);
}

/* ---------- Codeforces-style button ---------- */
.cf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-family: Verdana, Arial, sans-serif;
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--cf-text);
  background: linear-gradient(var(--cf-btn-top, #fafafa), var(--cf-btn-bot, #e4e4e4));
  border: 1px solid var(--cf-btn-border, #b0b0b0);
  border-radius: 2px;
  padding: 0.25rem 0.8rem;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.cf-btn:hover {
  background: linear-gradient(var(--cf-btn-hover-top, #f0f0f0), var(--cf-btn-hover-bot, #dadada));
  border-color: var(--cf-btn-hover-border, #9e9e9e);
  text-decoration: none;
  color: var(--cf-text);
}

.cf-btn:active:not(:disabled) {
  background: var(--cf-btn-active, #d6d6d6);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.cf-btn:disabled,
.cf-btn[disabled] {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.cf-btn--danger {
  color: var(--cf-red);
}
.cf-btn--danger:hover {
  color: var(--cf-red);
  opacity: 0.85;
}

[data-theme="dark"] {
  --cf-btn-top: #2c2c2c;
  --cf-btn-bot: #222222;
  --cf-btn-border: #444444;
  --cf-btn-hover-top: #333333;
  --cf-btn-hover-bot: #2a2a2a;
  --cf-btn-hover-border: #555555;
  --cf-btn-active: #2a2a2a;
}

@media (max-width: 900px) {
  .app-main {
    grid-template-columns: 1fr;
  }
  .cf-sidebar-col {
    order: 2;
  }
}
</style>
