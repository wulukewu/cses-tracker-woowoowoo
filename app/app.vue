<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />

    <header class="cf-header">
      <div class="cf-topbar">
        <NuxtLink to="/" class="cf-logo" aria-label="Codeforces">
          <svg class="cf-logo-bars" width="30" height="26" viewBox="0 0 30 30" aria-hidden="true">
            <rect x="1" y="15" width="7" height="13" rx="1.5" fill="#e63329" />
            <rect x="11.5" y="8" width="7" height="20" rx="1.5" fill="#f5b301" />
            <rect x="22" y="2" width="7" height="26" rx="1.5" fill="#2a71d0" />
          </svg>
          <span class="cf-wordmark">CODEFORCES</span>
        </NuxtLink>
        <div class="cf-topbar-right">
          <span class="cf-sponsor">unofficial skin · CSES 練功房</span>
          <span class="cf-auth">
            <span class="cf-lang">🌐 En</span>
            <span class="cf-sep">|</span>
            <span class="cf-enter">Enter</span>
            <span class="cf-sep">|</span>
            <span class="cf-register">Register</span>
          </span>
        </div>
      </div>

      <nav class="cf-menu">
        <div class="cf-menu-inner">
          <NuxtLink to="/" exact-active-class="active">Home</NuxtLink>
          <NuxtLink to="/round" active-class="active">賽況</NuxtLink>
          <NuxtLink to="/plan" active-class="active">規劃</NuxtLink>
          <a href="https://cses.fi/problemset/" target="_blank" rel="noopener" class="cf-menu-ext">Problemset ↗</a>
        </div>
      </nav>
    </header>

    <div class="app-main">
      <div class="app-content">
        <NuxtPage />
      </div>
      <div class="cf-sidebar-col">
        <LayoutCfSidebar />
      </div>
    </div>

    <footer class="cf-footer">
      <span>Codeforces (unofficial CSES skin)</span>
      <span class="cf-footer-sep">·</span>
      <span>Made for 三人練功房 by lukewu · zyo · Weeeeeeeeeeeee00</span>
    </footer>
  </div>
</template>

<style>
:root {
  /* surfaces */
  --cs-bg: #ffffff;
  --cs-bg-subtle: #f6f8fb;
  --cs-border: #d4d9e0;
  --cs-border-subtle: #e8ebf0;
  --cs-text: #1b1b1b;
  --cs-text-secondary: #555b64;
  --cs-text-muted: #9aa0a8;
  --cs-accent: #009000;          /* Codeforces "accepted" green */
  --cs-accent-bg: #e6f3e6;
  --cs-radius: 5px;

  /* Codeforces-specific */
  --cf-body-bg: #e1e8ee;
  --cf-box-border: #d1d7de;
  --cf-caption-bg: #eaf1f9;
  --cf-link: #0e63b4;
  --cf-row-alt: #f7f7f7;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--cf-body-bg);
}

body {
  margin: 0;
  font-family: 'Segoe UI', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  background: var(--cf-body-bg);
  color: var(--cs-text);
  font-size: 15px;
}

a {
  color: var(--cf-link);
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- Header: top bar ---------- */
.cf-header {
  background: var(--cs-bg);
  border-bottom: 3px solid #3b5998;
}

.cf-topbar {
  max-width: 1150px;
  margin: 0 auto;
  padding: 0.9rem 1.25rem 0.7rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.cf-logo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
}

.cf-logo-bars {
  display: block;
}

.cf-wordmark {
  font-family: Georgia, 'Times New Roman', 'Noto Serif', serif;
  font-weight: 700;
  font-size: 1.85rem;
  letter-spacing: 0.02em;
  color: #1a1a1a;
  line-height: 1;
}

.cf-topbar-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.cf-sponsor {
  font-size: 0.72rem;
  color: var(--cs-text-muted);
}

.cf-auth {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
}

.cf-enter,
.cf-register {
  color: var(--cf-link);
  cursor: default;
}

.cf-sep {
  color: var(--cs-border);
}

/* ---------- Header: blue menu bar ---------- */
.cf-menu {
  background: linear-gradient(#4a70b0, #3b5998);
}

.cf-menu-inner {
  max-width: 1150px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  gap: 0.15rem;
  flex-wrap: wrap;
}

.cf-menu-inner a {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.55rem 0.9rem;
  line-height: 1.2;
  border-bottom: 3px solid transparent;
  margin-bottom: -0px;
}

.cf-menu-inner a:hover {
  background: rgba(255, 255, 255, 0.14);
}

.cf-menu-inner a.active {
  background: rgba(255, 255, 255, 0.92);
  color: #24428a;
  border-bottom-color: #ffcc33;
}

.cf-menu-ext {
  margin-left: auto;
  opacity: 0.9;
  font-weight: 500 !important;
}

/* ---------- Main two-column layout ---------- */
.app-main {
  flex: 1;
  width: 100%;
  max-width: 1150px;
  margin: 0 auto;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 1.25rem;
  align-items: start;
}

.app-content {
  min-width: 0;
}

.cf-sidebar-col {
  min-width: 0;
}

/* ---------- Footer ---------- */
.cf-footer {
  border-top: 1px solid var(--cf-box-border);
  background: var(--cs-bg);
  padding: 1rem 1.25rem;
  text-align: center;
  font-size: 0.78rem;
  color: var(--cs-text-muted);
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cf-footer-sep {
  color: var(--cs-border);
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
