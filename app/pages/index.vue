<script setup lang="ts">
import type {
  ProblemCategory,
  ProblemStatsResponse,
  ProgressResponse,
  SubmissionsResponse,
  Week,
  WeekProblem,
} from '~~/shared/types'

const { data: weeks } = await useFetch<Week[]>('/api/weeks')
const { data: categories } = await useFetch<ProblemCategory[]>('/api/problems')

const categoryByProblemId = computed(() => {
  const map = new Map<number, string>()
  for (const c of categories.value ?? []) {
    for (const p of c.problems) map.set(p.id, c.name)
  }
  return map
})

// CSES's own display order for each problem, keyed by id — used to sort a
// week's problems within a category regardless of the order they were
// picked in while planning (see plan.vue's `selected` map).
const catalogOrder = computed(() => {
  const map = new Map<number, number>()
  let i = 0
  for (const c of categories.value ?? []) {
    for (const p of c.problems) map.set(p.id, i++)
  }
  return map
})

const selectedWeekId = ref<string | null>(null)

watchEffect(() => {
  if (!selectedWeekId.value && weeks.value && weeks.value.length > 0) {
    selectedWeekId.value = weeks.value[0].id
  }
})

const forceRefresh = ref(false)

const {
  data: progress,
  pending,
  refresh,
} = await useFetch<ProgressResponse>('/api/progress', {
  query: { week: selectedWeekId, force: forceRefresh },
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

const { data: submissions, refresh: refreshSubmissions } = await useFetch<SubmissionsResponse>('/api/submissions', {
  query: { week: selectedWeekId, force: forceRefresh },
  watch: [selectedWeekId],
})

const { data: problemStats, refresh: refreshProblemStats } = await useFetch<ProblemStatsResponse>(
  '/api/problem-stats',
  {
    query: { week: selectedWeekId, force: forceRefresh },
    watch: [selectedWeekId],
  },
)

const refreshing = ref(false)

async function refreshAll() {
  refreshing.value = true
  forceRefresh.value = true
  try {
    await Promise.all([refresh(), refreshSubmissions(), refreshProblemStats()])
  } finally {
    forceRefresh.value = false
    refreshing.value = false
  }
}

interface ProblemInsight {
  firstSolverName: string | null
  fastestName: string | null
}

// Only credited when at least two tracked users have a comparable value —
// "first" or "fastest" among a field of one isn't a meaningful callout.
const problemInsights = computed(() => {
  const map = new Map<number, ProblemInsight>()
  for (const p of week.value?.problems ?? []) {
    const key = String(p.id)
    let firstSolverName: string | null = null
    let firstAcTime: string | null = null
    let solvedCount = 0
    let fastestName: string | null = null
    let fastestTime = Infinity
    let timedCount = 0

    for (const u of users.value) {
      const summary = submissions.value?.[key]?.[u.name]
      if (!summary?.unlocked || !summary.firstAcTime) continue
      solvedCount++
      if (firstAcTime === null || summary.firstAcTime < firstAcTime) {
        firstAcTime = summary.firstAcTime
        firstSolverName = u.name
      }
      const acEntry = summary.submissions.find((s) => s.verdict === 'AC')
      const execSeconds = acEntry ? Number.parseFloat(acEntry.execTime) : NaN
      if (!Number.isNaN(execSeconds)) {
        timedCount++
        if (execSeconds < fastestTime) {
          fastestTime = execSeconds
          fastestName = u.name
        }
      }
    }

    map.set(p.id, {
      firstSolverName: solvedCount >= 2 ? firstSolverName : null,
      fastestName: timedCount >= 2 ? fastestName : null,
    })
  }
  return map
})

function problemMeta(problemId: number) {
  const stats = problemStats.value?.[String(problemId)]
  if (!stats) return ''
  return `全站 ${stats.solvedBy.toLocaleString()} / ${stats.attemptedBy.toLocaleString()} 解出（${stats.successRate}%）`
}

interface CellInfo {
  solved: boolean
  waCount: number
  locked: boolean
  clickable: boolean
  isFirstSolver: boolean
  isFastest: boolean
}

const emptyCell: CellInfo = {
  solved: false,
  waCount: 0,
  locked: false,
  clickable: false,
  isFirstSolver: false,
  isFastest: false,
}

function cellInfo(userIndex: number, problemId: number): CellInfo {
  const solved = isSolved(userIndex, problemId)
  const userName = users.value[userIndex]?.name
  const summary = submissions.value?.[String(problemId)]?.[userName]
  const insight = problemInsights.value.get(problemId)
  if (!summary) return { ...emptyCell, solved }
  return {
    solved,
    waCount: summary.waCount,
    locked: !summary.unlocked,
    clickable: solved && summary.unlocked,
    isFirstSolver: insight?.firstSolverName === userName,
    isFastest: insight?.fastestName === userName,
  }
}

function cellSymbol(info: CellInfo) {
  if (info.solved) return '✓'
  if (info.waCount > 0) return '✗'
  return '–'
}

const modalProblem = ref<WeekProblem | null>(null)
const modalUserName = ref<string | null>(null)

const profileUserIndex = ref<number | null>(null)
const expandedCategories = ref<Set<string>>(new Set())

const profileUser = computed(() => (profileUserIndex.value === null ? null : users.value[profileUserIndex.value] ?? null))
const profileSolvedSet = computed(() => (profileUserIndex.value === null ? null : solvedSets.value[profileUserIndex.value] ?? null))

const totalProblemCount = computed(() => (categories.value ?? []).reduce((sum, c) => sum + c.problems.length, 0))

const profileTotalSolved = computed(() => profileSolvedSet.value?.size ?? 0)

interface CategoryProgress {
  name: string
  problems: WeekProblem[]
  solvedCount: number
}

const profileCategories = computed<CategoryProgress[]>(() => {
  const set = profileSolvedSet.value
  if (!set) return []
  return (categories.value ?? []).map((c) => ({
    name: c.name,
    problems: c.problems,
    solvedCount: c.problems.filter((p) => set.has(p.id)).length,
  }))
})

function openProfile(index: number) {
  profileUserIndex.value = index
  expandedCategories.value = new Set()
}

function closeProfile() {
  profileUserIndex.value = null
}

// Without this, scrolling past the end of a modal's own list chains into
// the page behind it — the fixed overlay stays put but the body scrolls,
// which shows up as the page's own scrollbar (detached from the card)
// moving instead of the modal's.
const anyModalOpen = computed(() => Boolean((modalProblem.value && modalUserName.value) || profileUser.value))

watch(anyModalOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

function toggleCategory(name: string) {
  const next = new Set(expandedCategories.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  expandedCategories.value = next
}

const modalSummary = computed(() => {
  if (!modalProblem.value || !modalUserName.value) return null
  return submissions.value?.[String(modalProblem.value.id)]?.[modalUserName.value] ?? null
})

function openModal(problem: WeekProblem, userName: string) {
  modalProblem.value = problem
  modalUserName.value = userName
}

function closeModal() {
  modalProblem.value = null
  modalUserName.value = null
}

const groupedProblems = computed(() => {
  if (!week.value) return []
  const groups = new Map<string, typeof week.value.problems>()
  for (const p of week.value.problems) {
    const name = categoryByProblemId.value.get(p.id) ?? '其他'
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name)!.push(p)
  }
  for (const group of groups.values()) {
    group.sort((a, b) => (catalogOrder.value.get(a.id) ?? 0) - (catalogOrder.value.get(b.id) ?? 0))
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
          <button class="refresh-btn" :disabled="pending || refreshing" @click="refreshAll()">重新整理</button>
        </div>
      </div>

      <div v-if="staleSince" class="stale-banner">
        資料自 {{ formatDate(staleSince) }} 起未更新
      </div>

      <section v-if="week" class="progress-summary">
        <div v-for="(u, i) in users" :key="u.csesId" class="summary-item">
          <div class="summary-header">
            <button type="button" class="user-name user-name-btn" @click="openProfile(i)">{{ u.name }}</button>
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
              <th v-for="(u, i) in users" :key="u.csesId" class="col-user">
                <button type="button" class="user-name-btn" @click="openProfile(i)">{{ u.name }}</button>
              </th>
            </tr>
          </thead>
          <tbody v-for="group in groupedProblems" :key="group.name">
            <tr class="category-row">
              <td :colspan="1 + users.length">{{ group.name }}</td>
            </tr>
            <tr v-for="p in group.problems" :key="p.id">
              <td class="col-problem">
                <a class="problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
                <span v-if="problemMeta(p.id)" class="problem-meta">{{ problemMeta(p.id) }}</span>
              </td>
              <td v-for="(u, i) in users" :key="u.csesId" class="col-user">
                <button
                  v-if="cellInfo(i, p.id).clickable"
                  type="button"
                  class="mark solved clickable"
                  aria-label="已解，含送出紀錄，點擊查看"
                  @click="openModal(p, u.name)"
                >
                  <span class="mark-symbol">✓</span>
                  <span v-if="cellInfo(i, p.id).waCount" class="wa-badge">{{ cellInfo(i, p.id).waCount }}</span>
                  <span v-if="cellInfo(i, p.id).isFirstSolver || cellInfo(i, p.id).isFastest" class="corner-dots">
                    <span v-if="cellInfo(i, p.id).isFirstSolver" class="corner-dot first-dot" data-tooltip="最先解出這題"></span>
                    <span v-if="cellInfo(i, p.id).isFastest" class="corner-dot fastest-dot" data-tooltip="這題目前執行最快"></span>
                  </span>
                </button>
                <span
                  v-else
                  class="mark"
                  :class="{ solved: cellInfo(i, p.id).solved, attempted: cellInfo(i, p.id).waCount > 0 }"
                  :aria-label="cellInfo(i, p.id).solved ? '已解' : cellInfo(i, p.id).waCount ? '嘗試過但未解出' : '未解'"
                >
                  <span class="mark-symbol">{{ cellSymbol(cellInfo(i, p.id)) }}</span>
                  <span v-if="cellInfo(i, p.id).waCount" class="wa-badge">{{ cellInfo(i, p.id).waCount }}</span>
                  <svg
                    v-if="cellInfo(i, p.id).locked"
                    class="lock-hint"
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    aria-hidden="true"
                  >
                    <title>分身帳號還沒解過這題，需要手動解一下才能看到送出紀錄</title>
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2"
                    />
                    <rect x="3.5" y="7" width="9" height="7" rx="1.4" fill="currentColor" />
                  </svg>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <div v-if="modalProblem && modalUserName" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>{{ modalUserName }} · {{ modalProblem.name }}</h2>
          <button type="button" class="modal-close" aria-label="關閉" @click="closeModal">✕</button>
        </div>
        <ul v-if="modalSummary?.submissions.length" class="submission-list">
          <li v-for="(s, idx) in modalSummary.submissions" :key="idx" class="submission-row" :class="s.verdict === 'AC' ? 'ac' : 'fail'">
            <a v-if="s.detailUrl" :href="s.detailUrl" target="_blank" rel="noopener" class="submission-link">
              <span class="submission-main">
                <span class="submission-time">{{ s.time }}</span>
                <span class="submission-verdict">✓</span>
              </span>
              <span class="submission-meta">{{ s.lang }} · {{ s.execTime }} · {{ s.codeSize }}</span>
            </a>
            <template v-else>
              <span class="submission-main">
                <span class="submission-time">{{ s.time }}</span>
                <span class="submission-verdict">{{ s.verdict === 'AC' ? '✓' : '✗' }}</span>
              </span>
              <span class="submission-meta">{{ s.lang }} · {{ s.execTime }} · {{ s.codeSize }}</span>
            </template>
          </li>
        </ul>
        <p v-else class="empty-state">沒有抓到送出紀錄。</p>
      </div>
    </div>

    <div v-if="profileUser" class="modal-overlay" @click.self="closeProfile">
      <div class="modal-card profile-card" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>{{ profileUser.name }}</h2>
          <button type="button" class="modal-close" aria-label="關閉" @click="closeProfile">✕</button>
        </div>

        <div class="profile-summary">
          <div class="profile-total">
            <span class="profile-total-count">{{ profileTotalSolved }}</span>
            <span class="profile-total-label">/ {{ totalProblemCount }} 題已解出</span>
          </div>
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{ width: `${totalProblemCount ? (profileTotalSolved / totalProblemCount) * 100 : 0}%` }"
            />
          </div>
          <a
            class="profile-cses-link"
            :href="`https://cses.fi/problemset/user/${profileUser.csesId}/`"
            target="_blank"
            rel="noopener"
          >在 CSES 上查看 →</a>
        </div>

        <ul class="profile-category-list">
          <li v-for="c in profileCategories" :key="c.name" class="profile-category">
            <button type="button" class="profile-category-header" @click="toggleCategory(c.name)">
              <span class="profile-category-name">{{ c.name }}</span>
              <span class="profile-category-count">{{ c.solvedCount }} / {{ c.problems.length }}</span>
            </button>
            <div class="progress-bar-track category-track">
              <div
                class="progress-bar-fill"
                :style="{ width: `${c.problems.length ? (c.solvedCount / c.problems.length) * 100 : 0}%` }"
              />
            </div>
            <ul v-if="expandedCategories.has(c.name)" class="profile-problem-list">
              <li
                v-for="p in c.problems"
                :key="p.id"
                class="profile-problem-row"
                :class="{ solved: profileSolvedSet?.has(p.id) }"
              >
                <span class="profile-problem-mark">{{ profileSolvedSet?.has(p.id) ? '✓' : '–' }}</span>
                <a class="profile-problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
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

.user-name-btn {
  font: inherit;
  font-weight: 600;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.user-name-btn:hover {
  color: var(--cs-accent);
  text-decoration: underline;
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

.problem-name {
  display: block;
  text-decoration: none;
}

.problem-name:hover {
  text-decoration: underline;
}

.problem-meta {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  color: var(--cs-text-muted);
}

.col-user {
  width: 90px;
  text-align: center;
}

.mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--cs-text-muted);
  font: inherit;
  background: none;
  border: none;
  padding: 0;
}

.mark-symbol {
  font-weight: 600;
}

.mark.solved {
  color: var(--cs-accent);
}

.mark.attempted {
  color: #c0392b;
}

.mark.clickable {
  cursor: pointer;
}

.wa-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: #fbe9e7;
  color: #c0392b;
  font-weight: 700;
  font-size: 0.68rem;
  line-height: 1;
}

.lock-hint {
  margin-left: 0.1rem;
  color: var(--cs-text-muted);
  cursor: help;
  flex-shrink: 0;
}

.corner-dots {
  position: absolute;
  top: -5px;
  right: -6px;
  display: flex;
  gap: 3px;
}

.corner-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 1.5px solid var(--cs-bg);
  cursor: default;
}

.corner-dot::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  right: -4px;
  background: var(--cs-text);
  color: var(--cs-bg);
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
  z-index: 10;
}

.corner-dot:hover::after {
  opacity: 1;
}

.first-dot {
  background: #d4a017;
}

.fastest-dot {
  background: #2f6fed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 100;
}

.modal-card {
  background: var(--cs-bg);
  border-radius: var(--cs-radius);
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.modal-header h2 {
  font-size: 1rem;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cs-text-secondary);
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem;
}

.submission-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.88rem;
}

.submission-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.submission-row:last-child {
  border-bottom: none;
}

.submission-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.submission-verdict {
  font-weight: 700;
  font-size: 1rem;
}

.submission-row.ac .submission-verdict {
  color: var(--cs-accent);
}

.submission-row.fail .submission-verdict {
  color: #c0392b;
}

.submission-meta {
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
}

.submission-link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  color: inherit;
  text-decoration: none;
}

.submission-link:hover .submission-time {
  text-decoration: underline;
}

.profile-card {
  max-width: 480px;
  max-height: 85vh;
}

.profile-summary {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.profile-total {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
}

.profile-total-count {
  font-size: 1.3rem;
  font-weight: 700;
}

.profile-total-label {
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
}

.profile-cses-link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--cs-text-secondary);
  text-decoration: none;
}

.profile-cses-link:hover {
  color: var(--cs-accent);
  text-decoration: underline;
}

.profile-category-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.profile-category {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.profile-category:last-child {
  border-bottom: none;
}

.profile-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0.15rem 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.profile-category-name {
  font-weight: 600;
  font-size: 0.88rem;
}

.profile-category-count {
  font-size: 0.8rem;
  color: var(--cs-text-secondary);
  flex-shrink: 0;
}

.category-track {
  margin-top: 0.3rem;
  height: 4px;
}

.profile-problem-list {
  list-style: none;
  margin: 0.5rem 0 0.25rem;
  padding: 0;
}

.profile-problem-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.85rem;
  color: var(--cs-text-muted);
}

.profile-problem-row.solved {
  color: var(--cs-text);
}

.profile-problem-mark {
  width: 1rem;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--cs-text-muted);
  text-align: center;
}

.profile-problem-row.solved .profile-problem-mark {
  color: var(--cs-accent);
}

.profile-problem-name {
  color: inherit;
  text-decoration: none;
}

.profile-problem-name:hover {
  text-decoration: underline;
}
</style>
