<script setup lang="ts">
import type { ProblemCategory, ProgressResponse, Week } from '~~/shared/types'

const { data: weeks } = await useFetch<Week[]>('/api/weeks')
const { data: categories } = await useFetch<ProblemCategory[]>('/api/problems')

const categoryByProblemId = computed(() => {
  const map = new Map<number, string>()
  for (const c of categories.value ?? []) {
    for (const p of c.problems) map.set(p.id, c.name)
  }
  return map
})

const selectedWeekId = ref<string | null>(null)

watchEffect(() => {
  if (!selectedWeekId.value && weeks.value && weeks.value.length > 0) {
    selectedWeekId.value = weeks.value[0].id
  }
})

const {
  data: progress,
  pending,
  refresh,
} = await useFetch<ProgressResponse>('/api/progress', {
  query: { week: selectedWeekId },
  watch: [selectedWeekId],
})

const week = computed(() => progress.value?.week ?? null)
const users = computed(() => progress.value?.users ?? [])
const staleSince = computed(() => progress.value?.staleSince ?? null)

const solvedSets = computed(() => users.value.map((u) => new Set(u.solvedIds)))

function solvedCountFor(index: number) {
  if (!week.value) return 0
  const set = solvedSets.value[index]
  return week.value.problems.filter((p) => set.has(p.id)).length
}

function isSolved(index: number, problemId: number) {
  return solvedSets.value[index]?.has(problemId) ?? false
}

const groupedProblems = computed(() => {
  if (!week.value) return []
  const groups = new Map<string, typeof week.value.problems>()
  for (const p of week.value.problems) {
    const name = categoryByProblemId.value.get(p.id) ?? '其他'
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name)!.push(p)
  }
  const order = (categories.value ?? []).map((c) => c.name)
  const ordered = order.filter((name) => groups.has(name)).map((name) => ({ name, problems: groups.get(name)! }))
  if (groups.has('其他')) ordered.push({ name: '其他', problems: groups.get('其他')! })
  return ordered
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div>
    <div v-if="!weeks || weeks.length === 0" class="empty-state">
      還沒有任何資料，先到「規劃下次」建立第一組題目吧。
    </div>

    <template v-else>
      <div class="week-switcher">
        <div class="week-tabs" role="tablist" aria-label="次別">
          <button
            v-for="w in weeks"
            :key="w.id"
            role="tab"
            :aria-selected="w.id === selectedWeekId"
            class="week-tab"
            :class="{ active: w.id === selectedWeekId }"
            @click="selectedWeekId = w.id"
          >
            {{ w.deadline ? formatDate(w.deadline) : '未設定日期' }}
          </button>
        </div>
        <div class="week-actions">
          <NuxtLink v-if="week" :to="`/plan?edit=${encodeURIComponent(week.id)}`" class="edit-link">編輯這次</NuxtLink>
          <button class="refresh-btn" :disabled="pending" @click="refresh()">重新整理</button>
        </div>
      </div>

      <div v-if="staleSince" class="stale-banner">
        資料自 {{ formatDate(staleSince) }} 起未更新
      </div>

      <section v-if="week" class="progress-summary">
        <div v-for="(u, i) in users" :key="u.csesId" class="summary-item">
          <div class="summary-header">
            <span class="user-name">{{ u.name }}</span>
            <span class="user-count">{{ solvedCountFor(i) }} / {{ week.problems.length }}</span>
          </div>
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{ width: `${week.problems.length ? (solvedCountFor(i) / week.problems.length) * 100 : 0}%` }"
            />
          </div>
        </div>
      </section>

      <section v-if="week" class="problem-table-wrap">
        <table class="problem-table">
          <thead>
            <tr>
              <th class="col-problem">題目</th>
              <th v-for="u in users" :key="u.csesId" class="col-user">{{ u.name }}</th>
            </tr>
          </thead>
          <tbody v-for="group in groupedProblems" :key="group.name">
            <tr class="category-row">
              <td :colspan="1 + users.length">{{ group.name }}</td>
            </tr>
            <tr v-for="p in group.problems" :key="p.id">
              <td class="col-problem">
                <a :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
              </td>
              <td v-for="(u, i) in users" :key="u.csesId" class="col-user">
                <span v-if="isSolved(i, p.id)" class="mark solved" aria-label="已解">✓</span>
                <span v-else class="mark" aria-label="未解">–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--cs-text-muted);
}

.week-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.week-tabs {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
}

.week-tab {
  flex-shrink: 0;
  padding: 0.4rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text-secondary);
  border: 1px solid var(--cs-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.week-tab:hover {
  border-color: #ccc;
}

.week-tab.active {
  background: var(--cs-text);
  color: var(--cs-bg);
  border-color: var(--cs-text);
  font-weight: 600;
}

.week-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.edit-link {
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
  text-decoration: none;
  white-space: nowrap;
}

.edit-link:hover {
  color: var(--cs-text);
  text-decoration: underline;
}

.refresh-btn {
  padding: 0.45rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-size: 0.85rem;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #ccc;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.stale-banner {
  background: #fdf6e3;
  color: #8a6d1a;
  border: 1px solid #f0e2ae;
  padding: 0.6rem 0.9rem;
  border-radius: var(--cs-radius);
  margin-bottom: 1.25rem;
  font-size: 0.88rem;
}

.progress-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.user-name {
  font-weight: 600;
}

.user-count {
  color: var(--cs-text-secondary);
}

.progress-bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--cs-border-subtle);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--cs-text);
  transition: width 0.2s ease;
}

.problem-table-wrap {
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  overflow: hidden;
}

.problem-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.problem-table thead tr {
  background: var(--cs-bg-subtle);
  border-bottom: 1px solid var(--cs-border);
}

.problem-table th {
  text-align: left;
  font-weight: 500;
  color: var(--cs-text-secondary);
  padding: 0.6rem 0.9rem;
}

.problem-table td {
  padding: 0.55rem 0.9rem;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.problem-table tbody:last-child tr:last-child td {
  border-bottom: none;
}

.category-row td {
  background: var(--cs-bg-subtle);
  color: var(--cs-text-secondary);
  font-weight: 600;
  font-size: 0.8rem;
}

.col-problem {
  width: auto;
}

.col-problem a {
  text-decoration: none;
}

.col-problem a:hover {
  text-decoration: underline;
}

.col-user {
  width: 90px;
  text-align: center;
}

.mark {
  color: var(--cs-text-muted);
}

.mark.solved {
  color: var(--cs-accent);
  font-weight: 600;
}
</style>
