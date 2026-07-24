<script setup lang="ts">
import type { SubmissionSummary, Week, UserNote } from '~~/shared/types'

const route = useRoute()
const router = useRouter()

const problemId = computed(() => Number(route.query.problemId) || 0)
const userName = computed(() => (route.query.userName as string) || '')
const weekId = computed(() => (route.query.weekId as string) || '')

if (!problemId.value || !userName.value) {
  navigateTo('/round')
}

const { data: weeks } = await useFetch<Week[]>('/api/weeks', { default: () => [] })

const problem = computed(() => {
  if (!weeks.value) return null
  for (const w of weeks.value) {
    for (const p of w.problems) {
      if (p.id === problemId.value) return { ...p, weekId: w.id }
    }
  }
  return null
})

const { data: submissionsData } = await useFetch('/api/submissions', {
  query: { week: weekId },
  default: () => ({}),
})

const summary = computed<SubmissionSummary | null>(() => {
  if (!submissionsData.value) return null
  return submissionsData.value[String(problemId.value)]?.[userName.value] ?? null
})

const reversedSubmissions = computed(() => {
  return [...(summary.value?.submissions ?? [])].reverse()
})

const locked = computed(() => !summary.value?.unlocked)

const { data: allNotes, refresh: refreshNotes } = await useFetch<Record<string, Record<string, UserNote>>>('/api/notes', {
  default: () => ({}),
})

const noteContent = ref('')
const lastSavedContent = ref('')
const noteStuck = ref(false)
const lastSavedStuck = ref(false)
const syncStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

watch(
  () => [problemId.value, userName.value],
  () => {
    const n = allNotes.value?.[String(problemId.value)]?.[userName.value]
    noteContent.value = n?.content || ''
    lastSavedContent.value = n?.content || ''
    noteStuck.value = n?.stuck || false
    lastSavedStuck.value = n?.stuck || false
    syncStatus.value = 'idle'
  },
  { immediate: true },
)

let saveTimeout: ReturnType<typeof setTimeout> | null = null

async function performSave() {
  if (noteContent.value === lastSavedContent.value && noteStuck.value === lastSavedStuck.value) {
    syncStatus.value = 'saved'
    return
  }
  syncStatus.value = 'saving'
  try {
    const { error } = await useFetch(`/api/notes/${problemId.value}`, {
      method: 'PUT',
      body: {
        username: userName.value,
        content: noteContent.value,
        stuck: noteStuck.value,
      },
    })
    if (error.value) {
      syncStatus.value = 'error'
    } else {
      syncStatus.value = 'saved'
      lastSavedContent.value = noteContent.value
      lastSavedStuck.value = noteStuck.value
      refreshNotes()
    }
  } catch {
    syncStatus.value = 'error'
  }
}

watch([noteContent, noteStuck], () => {
  if (noteContent.value !== lastSavedContent.value || noteStuck.value !== lastSavedStuck.value) {
    syncStatus.value = 'saving'
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(performSave, 1000)
  } else {
    syncStatus.value = 'saved'
  }
})

onUnmounted(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
})
</script>

<template>
  <div>
    <div class="cf-page-title">
      <h1>{{ problem?.name || 'Loading...' }}</h1>
      <span class="cf-page-sub">{{ userName }}</span>
    </div>

    <div class="submission-nav">
      <NuxtLink to="/round" class="cf-link">← 回賽況</NuxtLink>
      <span v-if="weekId && problem" class="problem-week">
        #{{ problemId }} · {{ problem.weekId }}
      </span>
    </div>

    <div v-if="locked" class="locked-notice">
      追蹤帳號尚未在 CSES 通過此題，無法載入提交紀錄。請先通過後再重新整理。
    </div>

    <div class="split-layout">
      <div class="split-main">
        <h3 class="section-title">
          送出紀錄
          <span v-if="!locked" class="section-count">({{ summary?.submissions?.length || 0 }})</span>
        </h3>

        <table v-if="!locked && reversedSubmissions.length" class="cf-datatable submissions-table">
          <thead>
            <tr>
              <th class="c-time">時間</th>
              <th class="c-verdict">結果</th>
              <th class="c-lang">語言</th>
              <th class="c-exec">執行</th>
              <th class="c-size">大小</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, idx) in reversedSubmissions"
              :key="idx"
              :class="s.verdict === 'AC' ? 'ac-row' : 'fail-row'"
            >
              <td class="c-time">{{ s.time }}</td>
              <td class="c-verdict">{{ s.verdict }}</td>
              <td class="c-lang">{{ s.lang }}</td>
              <td class="c-exec">{{ s.execTime }}</td>
              <td class="c-size">{{ s.codeSize }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else-if="!locked" class="empty-submissions">沒有提交紀錄。</p>
      </div>

      <div class="split-side">
        <h3 class="section-title">解題筆記</h3>
        <div class="note-area">
          <div class="note-header-row">
            <span class="editor-info">編輯 {{ userName }} 的筆記</span>
            <label class="stuck-label">
              <input type="checkbox" v-model="noteStuck" class="stuck-input" />
              卡題
            </label>
          </div>
          <textarea
            v-model="noteContent"
            class="note-textarea"
            placeholder="題目大意、實作想法、遇到的坑..."
            rows="12"
          ></textarea>
          <div class="note-sync">
            <span v-if="syncStatus === 'saving'" class="sync-hint saving">同步中...</span>
            <span v-else-if="syncStatus === 'error'" class="sync-hint error">同步失敗</span>
            <span v-else class="sync-hint saved">已同步</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cf-page-title {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin: 0 0 0.5rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--cf-sep);
}

.cf-page-title h1 {
  font-size: 1.7rem;
  font-weight: 400;
  margin: 0;
  color: var(--cf-blue);
}

.cf-page-sub {
  font-size: 0.82rem;
  color: var(--cf-text-muted);
}

.cf-link {
  color: var(--cf-link);
}

.submission-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.problem-week {
  color: var(--cf-text-muted);
  font-size: 0.8rem;
}

.locked-notice {
  background: var(--cf-cell);
  border: 1px solid var(--cf-sep);
  padding: 0.6rem 0.85rem;
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
  margin-bottom: 1rem;
}

.split-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  align-items: start;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--cf-blue);
  margin: 0 0 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--cf-sep);
}

.section-count {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--cf-text-muted);
}

.cf-datatable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  border: 1px solid var(--cf-border);
}

.cf-datatable th {
  font-weight: 700;
  text-align: left;
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--cf-border);
  background: #fff;
  white-space: nowrap;
}

.cf-datatable td {
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--cf-sep);
  background: #fff;
  white-space: nowrap;
}

.cf-datatable tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}

.cf-datatable tbody tr:last-child td {
  border-bottom: none;
}

.ac-row td {
  color: #000;
}

.fail-row td {
  color: var(--cf-text-secondary);
}

.c-time {
  width: 8rem;
}

.c-verdict {
  width: 4rem;
  font-weight: 700;
}

.c-lang {
  width: 6rem;
}

.c-exec {
  width: 5rem;
  text-align: right;
}

.c-size {
  width: 5rem;
  text-align: right;
}

.empty-submissions {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--cf-text-muted);
  border: 1px solid var(--cf-border);
}

.note-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.editor-info {
  font-size: 0.78rem;
  color: var(--cf-text-secondary);
}

.stuck-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--cf-text-secondary);
  cursor: pointer;
  user-select: none;
}

.stuck-input {
  margin: 0;
}

.note-textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--cf-border);
  background: #fff;
  color: var(--cf-text);
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.note-textarea:focus {
  border-color: var(--cf-blue);
}

.note-sync {
  font-size: 0.75rem;
}

.sync-hint.saving {
  color: #b45309;
}

.sync-hint.error {
  color: #b3261e;
}

.sync-hint.saved {
  color: var(--cf-text-muted);
}
</style>
