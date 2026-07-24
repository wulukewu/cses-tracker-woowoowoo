<script setup lang="ts">
import { USERS } from '~~/shared/users'
import type { ProgressResponse, UserNote } from '~~/shared/types'

// Real data, client-only + guarded so the sidebar never breaks SSR or a
// missing backend. No `await` — these are lazy/client-only, so setup stays
// synchronous (this component lives in app.vue, outside the page's Suspense).
// Falls back to a static roster when there's nothing yet.
const { data: prog } = useFetch<ProgressResponse | null>('/api/progress', {
  server: false,
  lazy: true,
  default: () => null,
  key: 'sidebar-progress',
})
const { data: notesData } = useFetch<Record<string, Record<string, UserNote>>>('/api/notes', {
  server: false,
  lazy: true,
  default: () => ({}),
  key: 'sidebar-notes',
})

// Leaderboard by real total solved count; fall back to the roster (— count).
const standings = computed(() => {
  const usrs = prog.value?.users
  if (!usrs || usrs.length === 0) {
    return USERS.map((u) => ({ name: u.name, solved: null as number | null }))
  }
  return [...usrs]
    .map((u) => ({ name: u.name, solved: u.solvedIds.length }))
    .sort((a, b) => (b.solved ?? 0) - (a.solved ?? 0))
})

// Recent actions derived from real data: stuck markers / notes / week solves.
const recent = computed(() => {
  const w = prog.value?.week
  const usrs = prog.value?.users
  const entries: { user: string; action: string }[] = []
  if (w && usrs) {
    const nameById = new Map(w.problems.map((p) => [p.id, p.name]))
    for (const [pidStr, perUser] of Object.entries(notesData.value || {})) {
      const pname = nameById.get(Number(pidStr))
      if (!pname) continue
      for (const [user, note] of Object.entries(perUser)) {
        if (note.stuck) entries.push({ user, action: `在 ${pname} 標記了卡題` })
        else if (note.content?.trim()) entries.push({ user, action: `更新了 ${pname} 的解題筆記` })
      }
    }
    for (const u of usrs) {
      const solved = w.problems.filter((p) => u.solvedIds.includes(p.id))
      if (solved.length) {
        const last = solved[solved.length - 1]!
        entries.push({ user: u.name, action: `通過了 ${last.name}` })
      }
    }
  }
  return entries.slice(0, 6)
})
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

    <LayoutCfBox title="→ 排行榜" flush>
      <table class="cf-datatable">
        <thead>
          <tr><th class="c-rank">#</th><th class="c-user">使用者</th><th class="c-rating">解題數</th></tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in standings" :key="u.name">
            <td class="c-rank">{{ i + 1 }}</td>
            <td class="c-user"><LayoutCfHandle :name="u.name" /></td>
            <td class="c-rating">{{ u.solved ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <div class="tr-footer">
          <NuxtLink to="/round">看完整賽況 →</NuxtLink>
        </div>
      </template>
    </LayoutCfBox>

    <LayoutCfBox title="→ Recent actions" flush>
      <ul v-if="recent.length" class="recent-list">
        <li v-for="(r, i) in recent" :key="i" class="recent-item">
          <LayoutCfHandle :name="r.user" />{{ ' ' }}<span class="recent-action">{{ r.action }}</span>
        </li>
      </ul>
      <p v-else class="recent-empty">目前尚無最新動態</p>
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
  color: var(--cf-text-secondary);
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
  color: var(--cf-text-secondary);
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
  border-bottom: 1px solid var(--cf-border);
  background: var(--cf-bg);
}
.cf-datatable th.c-user {
  text-align: left;
}
.cf-datatable td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  background: var(--cf-bg);
}
/* Codeforces zebra striping: odd rows shaded, even rows white */
.cf-datatable tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}
.cf-datatable tbody tr:last-child td {
  border-bottom: none;
}
.c-rank {
  width: 1.8rem;
  text-align: center;
  color: var(--cf-text-secondary);
}
.c-rating {
  text-align: center;
  font-weight: 700;
  white-space: nowrap;
}

.tr-footer {
  text-align: right;
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
  line-height: 1.5;
}
.recent-item:last-child {
  border-bottom: none;
}
.recent-action {
  color: var(--cf-text);
}
.recent-empty {
  margin: 0;
  padding: 0.6rem 0.75rem;
  color: var(--cf-text-muted);
  font-size: 0.82rem;
}

/* CSES links */
.cses-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
