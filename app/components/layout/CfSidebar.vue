<script setup lang="ts">
import { USERS } from '~~/shared/users'

// Ranked by the cosmetic rating so the "Top rated" box reads like Codeforces.
const ranked = computed(() =>
  [...USERS]
    .map((u) => ({ ...u, style: handleStyle(u.name) }))
    .sort((a, b) => b.style.rating - a.style.rating),
)

const recent = [
  { user: 'zyo', action: '邀請你參加 CSES Weekly Round' },
  { user: 'lukewu', action: '更新了 Dynamic Programming 的解題筆記' },
  { user: 'Weeeeeeeeeeeee00', action: '通過了 Grid Paths' },
  { user: 'zyo', action: '在 Range Queries 標記了卡題' },
]
</script>

<template>
  <aside class="cf-sidebar">
    <LayoutCfBox title="→ Pay attention">
      <div class="pay-attention">
        <p class="pa-line">Before round</p>
        <NuxtLink to="/round" class="pa-title">CSES Weekly Round</NuxtLink>
        <p class="pa-meta">三位固定夥伴 · 每週一組精選題</p>
        <NuxtLink to="/round" class="pa-enter">進入賽區 »</NuxtLink>
      </div>
    </LayoutCfBox>

    <LayoutCfBox title="→ Top rated" flush>
      <table class="cf-datatable">
        <thead>
          <tr><th class="c-rank">#</th><th class="c-user">User</th><th class="c-rating">Rating</th></tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in ranked" :key="u.csesId">
            <td class="c-rank">{{ i + 1 }}</td>
            <td class="c-user">
              <span class="cf-handle" :style="{ color: u.style.color }" :title="`${u.style.title} · ${u.style.rating}`">{{ u.name }}</span>
            </td>
            <td class="c-rating">{{ u.style.rating }}</td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <div class="tr-footer">
          <NuxtLink to="/round">Standings</NuxtLink>
          <NuxtLink to="/round">View all →</NuxtLink>
        </div>
      </template>
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
  font-size: 0.85rem;
}

/* Pay attention */
.pay-attention {
  text-align: center;
}
.pa-line {
  margin: 0 0 0.2rem;
  color: var(--cs-text-secondary);
  font-weight: 700;
  font-size: 0.86rem;
}
.pa-title {
  display: block;
  font-weight: 700;
  color: var(--cf-link);
  line-height: 1.35;
}
.pa-meta {
  margin: 0.3rem 0 0.5rem;
  color: var(--cs-text-secondary);
  font-size: 0.8rem;
}
.pa-enter {
  color: var(--cf-link);
  font-weight: 700;
}

/* Codeforces-style datatable */
.cf-datatable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.cf-datatable th {
  font-weight: 700;
  text-align: center;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  background: #fff;
}
.cf-datatable th.c-user {
  text-align: left;
}
.cf-datatable td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  background: var(--cf-cell);
}
.cf-datatable tr:last-child td {
  border-bottom: none;
}
.c-rank {
  width: 1.8rem;
  text-align: center;
  color: var(--cs-text-secondary);
}
.c-rating {
  text-align: center;
  font-weight: 700;
  white-space: nowrap;
}

.cf-handle {
  font-weight: 700;
}
.cf-handle:hover {
  text-decoration: underline;
}

.tr-footer {
  display: flex;
  justify-content: space-between;
}

/* Recent actions */
.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.82rem;
}
.recent-item {
  padding: 0.45rem 0.75rem;
  border-bottom: 1px solid var(--cf-sep);
  line-height: 1.45;
}
.recent-item:last-child {
  border-bottom: none;
}
.recent-action {
  color: var(--cs-text);
}

/* CSES links */
.cses-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
