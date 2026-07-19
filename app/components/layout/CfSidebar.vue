<script setup lang="ts">
import { USERS } from '~~/shared/users'

// Ranked by the cosmetic rating so the "standings" box reads like Codeforces.
const ranked = computed(() =>
  [...USERS]
    .map((u) => ({ ...u, style: handleStyle(u.name) }))
    .sort((a, b) => b.style.rating - a.style.rating),
)

const recent = [
  { user: 'zyo', action: '邀請你參加 CSES Weekly Round', tag: 'blog' },
  { user: 'lukewu', action: '更新了 Dynamic Programming 的解題筆記', tag: 'note' },
  { user: 'Weeeeeeeeeeeee00', action: '通過了 Grid Paths', tag: 'ac' },
  { user: 'zyo', action: '在 Range Queries 標記了卡題', tag: 'stuck' },
]
</script>

<template>
  <aside class="cf-sidebar">
    <LayoutCfBox title="→ Pay attention">
      <div class="pay-attention">
        <p class="pa-line">Before round</p>
        <NuxtLink to="/round" class="pa-title">CSES Weekly Round（進行中）</NuxtLink>
        <p class="pa-meta">三位固定夥伴 · 每週一組精選題</p>
        <NuxtLink to="/round" class="pa-enter">→ 進入賽區</NuxtLink>
      </div>
    </LayoutCfBox>

    <LayoutCfBox title="→ Standings" flush>
      <table class="mini-standings">
        <tbody>
          <tr v-for="(u, i) in ranked" :key="u.csesId">
            <td class="ms-rank">#{{ i + 1 }}</td>
            <td class="ms-user">
              <span class="cf-handle" :style="{ color: u.style.color }" :title="`${u.style.title} · ${u.style.rating}`">{{ u.name }}</span>
            </td>
            <td class="ms-rating" :style="{ color: u.style.color }">{{ u.style.rating }}</td>
          </tr>
        </tbody>
      </table>
    </LayoutCfBox>

    <LayoutCfBox title="→ Recent actions" flush>
      <ul class="recent-list">
        <li v-for="(r, i) in recent" :key="i" class="recent-item">
          <span class="cf-handle" :style="{ color: handleStyle(r.user).color }">{{ r.user }}</span>
          <span class="recent-action">{{ r.action }}</span>
        </li>
      </ul>
    </LayoutCfBox>

    <LayoutCfBox title="→ CSES">
      <div class="cses-links">
        <a href="https://cses.fi/problemset/" target="_blank" rel="noopener">Problem Set →</a>
        <a href="https://cses.fi/book/book.pdf" target="_blank" rel="noopener">Competitive Handbook →</a>
      </div>
    </LayoutCfBox>
  </aside>
</template>

<style scoped>
.cf-sidebar {
  width: 100%;
}

/* Pay attention */
.pay-attention {
  font-size: 0.85rem;
}
.pa-line {
  margin: 0 0 0.25rem;
  color: var(--cs-text-muted);
  font-size: 0.78rem;
}
.pa-title {
  display: block;
  font-weight: 700;
  color: var(--cf-link);
  text-decoration: none;
  line-height: 1.35;
}
.pa-title:hover { text-decoration: underline; }
.pa-meta {
  margin: 0.35rem 0 0.6rem;
  color: var(--cs-text-secondary);
  font-size: 0.8rem;
}
.pa-enter {
  color: var(--cf-link);
  text-decoration: none;
  font-weight: 600;
}
.pa-enter:hover { text-decoration: underline; }

/* Standings */
.mini-standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.mini-standings td {
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--cs-border-subtle);
}
.mini-standings tr:last-child td { border-bottom: none; }
.mini-standings tr:nth-child(even) { background: var(--cf-row-alt); }
.ms-rank { color: var(--cs-text-muted); width: 2.2rem; }
.ms-user { width: auto; }
.ms-rating { text-align: right; font-weight: 700; white-space: nowrap; }

.cf-handle {
  font-weight: 700;
}
.cf-handle:hover { text-decoration: underline; }

/* Recent actions */
.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.82rem;
}
.recent-item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--cs-border-subtle);
  line-height: 1.45;
}
.recent-item:last-child { border-bottom: none; }
.recent-action { color: var(--cs-text-secondary); }

/* CSES links */
.cses-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
}
.cses-links a {
  color: var(--cf-link);
  text-decoration: none;
}
.cses-links a:hover { text-decoration: underline; }
</style>
