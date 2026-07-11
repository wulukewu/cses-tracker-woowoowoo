<script setup lang="ts">
import type { ProgressResponse, Week } from '~~/shared/types'

const { data: weeks } = await useFetch<Week[]>('/api/weeks')

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

function solvedCountFor(solvedIds: number[]) {
  if (!week.value) return 0
  const solvedSet = new Set(solvedIds)
  return week.value.problems.filter((p) => solvedSet.has(p.id)).length
}

function solvedCountForProblem(problemId: number) {
  return users.value.filter((u) => u.solvedIds.includes(problemId)).length
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div>
    <div v-if="!weeks || weeks.length === 0" class="empty-state">
      還沒有任何週次資料，先到「規劃下週」建立第一組題目吧。
    </div>

    <template v-else>
      <div class="week-switcher">
        <label for="week-select">週次</label>
        <select id="week-select" v-model="selectedWeekId">
          <option v-for="w in weeks" :key="w.id" :value="w.id">
            {{ formatDate(w.createdAt) }} 建立{{ w.deadline ? ` · 截止 ${formatDate(w.deadline)}` : '' }}
            <template v-if="weeks && w.id === weeks[0].id"> (最新)</template>
          </option>
        </select>
        <button class="refresh-btn" :disabled="pending" @click="refresh()">重新整理</button>
      </div>

      <div v-if="staleSince" class="stale-banner">
        資料自 {{ formatDate(staleSince) }} 起未更新
      </div>

      <section v-if="week" class="progress-overview">
        <h2>進度總覽</h2>
        <ul class="user-progress-list">
          <li v-for="u in users" :key="u.csesId" class="user-progress-item">
            <div class="user-progress-header">
              <span class="user-name">{{ u.name }}</span>
              <span class="user-count">{{ solvedCountFor(u.solvedIds) }} / {{ week.problems.length }}</span>
            </div>
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                :style="{ width: `${week.problems.length ? (solvedCountFor(u.solvedIds) / week.problems.length) * 100 : 0}%` }"
              />
            </div>
          </li>
        </ul>
      </section>

      <section v-if="week" class="problem-list">
        <h2>逐題狀態</h2>
        <ul>
          <li v-for="p in week.problems" :key="p.id" class="problem-item">
            <a :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">
              {{ p.name }}
            </a>
            <span class="problem-count">{{ solvedCountForProblem(p.id) }} / {{ users.length }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #9aa0aa;
}

.week-switcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.week-switcher select {
  flex: 1;
  padding: 0.5rem;
  background: #1a1d23;
  color: inherit;
  border: 1px solid #2c2f38;
  border-radius: 6px;
}

.refresh-btn {
  padding: 0.5rem 0.9rem;
  background: #2c2f38;
  color: inherit;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.stale-banner {
  background: #3a2f1a;
  color: #e8c988;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.05rem;
  color: #c7cbd1;
  margin: 1.5rem 0 0.75rem;
}

.user-progress-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.user-progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.user-name {
  font-weight: 600;
}

.user-count {
  color: #9aa0aa;
}

.progress-bar-track {
  height: 10px;
  border-radius: 999px;
  background: #23262d;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #4f8cff;
  transition: width 0.2s ease;
}

.problem-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.problem-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: #1a1d23;
  border-radius: 6px;
}

.problem-item a {
  text-decoration: none;
}

.problem-item a:hover {
  text-decoration: underline;
}

.problem-count {
  color: #9aa0aa;
  white-space: nowrap;
  margin-left: 1rem;
}
</style>
