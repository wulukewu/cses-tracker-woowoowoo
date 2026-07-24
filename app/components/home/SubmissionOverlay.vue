<script setup lang="ts">
import type { SubmissionSummary, UserNote } from '~~/shared/types'
import { csesTimeToTaiwan } from '~/utils/formatDate'

const props = defineProps<{
  problemId: number
  problemName: string
  userName: string
  summary: SubmissionSummary | null
  initialNoteContent: string
  initialStuck: boolean
  locked: boolean
}>()

const emit = defineEmits<{
  close: []
  saveNote: [username: string, content: string, stuck: boolean]
}>()

const noteContent = ref(props.initialNoteContent || '')
const lastSavedContent = ref(props.initialNoteContent || '')
const noteStuck = ref(props.initialStuck || false)
const lastSavedStuck = ref(props.initialStuck || false)
const syncStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const reversedSubmissions = computed(() => {
  return [...(props.summary?.submissions ?? [])].reverse()
})

watch(
  () => [props.problemId, props.userName],
  () => {
    noteContent.value = props.initialNoteContent || ''
    lastSavedContent.value = props.initialNoteContent || ''
    noteStuck.value = props.initialStuck || false
    lastSavedStuck.value = props.initialStuck || false
    syncStatus.value = 'idle'
  },
)

let saveTimeout: ReturnType<typeof setTimeout> | null = null

async function performSave() {
  if (noteContent.value === lastSavedContent.value && noteStuck.value === lastSavedStuck.value) {
    syncStatus.value = 'saved'
    return
  }
  syncStatus.value = 'saving'
  try {
    const { error } = await useFetch(`/api/notes/${props.problemId}`, {
      method: 'PUT',
      body: {
        username: props.userName,
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
      emit('saveNote', props.userName, noteContent.value, noteStuck.value)
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
  <div class="overlay" @click.self="emit('close')">
    <div class="overlay-card">
      <div class="card-header">
        <div class="card-title">
          <span class="problem-id">#{{ problemId }}</span>
          <h2>{{ userName }} · {{ problemName }}</h2>
        </div>
        <div class="card-header-right">
          <span v-if="syncStatus === 'saving'" class="sync-hint saving">同步中</span>
          <span v-else-if="syncStatus === 'error'" class="sync-hint error">同步失敗</span>
          <span v-else class="sync-hint saved">已同步</span>
          <button type="button" class="close-btn" aria-label="關閉" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="locked" class="locked-notice">
          追蹤帳號尚未在 CSES 通過此題，無法載入提交紀錄。請先通過後再重新整理。
        </div>

        <div class="split-layout">
          <div class="split-col">
            <h3 class="section-title">送出紀錄</h3>
            <table v-if="!locked && reversedSubmissions.length" class="sub-table">
              <thead>
                <tr>
                  <th class="c-time">時間 (台灣)</th>
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
                  <td class="c-time">{{ csesTimeToTaiwan(s.time) }}</td>
                  <td class="c-verdict">
                    <a v-if="s.detailUrl" :href="s.detailUrl" target="_blank" rel="noopener" class="detail-link">{{ s.verdict }}</a>
                    <span v-else>{{ s.verdict }}</span>
                  </td>
                  <td class="c-lang">{{ s.lang }}</td>
                  <td class="c-exec">{{ s.execTime }}</td>
                  <td class="c-size">{{ s.codeSize }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else-if="!locked" class="empty-sub">沒有提交紀錄。</p>
          </div>

          <div class="split-col note-col">
            <h3 class="section-title">解題筆記</h3>
            <div class="note-area">
              <label class="stuck-label">
                <input type="checkbox" v-model="noteStuck" class="stuck-input" />
                卡題標記
              </label>
              <textarea
                v-model="noteContent"
                class="note-textarea"
                placeholder="題目大意、實作想法、遇到的坑..."
                rows="10"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.overlay-card {
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  max-width: 820px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--cf-border);
}

.card-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.problem-id {
  font-size: 0.85rem;
  color: var(--cf-text-muted);
}

.card-title h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--cf-blue);
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sync-hint {
  font-size: 0.75rem;
}

.sync-hint.saving { color: var(--cf-saving-color); }
.sync-hint.error  { color: var(--cf-red); }
.sync-hint.saved  { color: var(--cf-text-muted); }

.close-btn {
  background: none;
  border: 1px solid var(--cf-sep);
  cursor: pointer;
  color: var(--cf-text-secondary);
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.2rem 0.4rem;
}

.close-btn:hover {
  border-color: var(--cf-border);
  color: var(--cf-text);
}

.card-body {
  padding: 0.85rem;
  overflow-y: auto;
  flex: 1;
}

.locked-notice {
  background: var(--cf-cell);
  border: 1px solid var(--cf-sep);
  padding: 0.55rem 0.8rem;
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
  margin-bottom: 0.85rem;
}

.split-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0.85rem;
  align-items: start;
}

.split-col {
  min-width: 0;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--cf-blue);
  margin: 0 0 0.6rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--cf-sep);
}

.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  border: 1px solid var(--cf-border);
}

.sub-table th {
  font-weight: 700;
  text-align: left;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--cf-border);
  background: var(--cf-bg);
  white-space: nowrap;
}

.sub-table td {
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  background: var(--cf-bg);
  white-space: nowrap;
}

.sub-table tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}

.sub-table tbody tr:last-child td {
  border-bottom: none;
}

.ac-row td {
  color: var(--cf-text);
}

.fail-row td {
  color: var(--cf-text-secondary);
}

.detail-link {
  color: var(--cf-blue);
  text-decoration: none;
}
.detail-link:hover {
  text-decoration: underline;
  color: var(--cf-red);
}

.c-time { width: 7rem; }
.c-verdict { width: 3.5rem; font-weight: 700; }
.c-lang { width: 5rem; }
.c-exec { width: 4rem; text-align: right; }
.c-size { width: 4rem; text-align: right; }

.empty-sub {
  padding: 1.5rem 1rem;
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

.stuck-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
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
  padding: 0.5rem;
  border: 1px solid var(--cf-border);
  background: var(--cf-bg);
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
</style>
