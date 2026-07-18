<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { SubmissionSummary, WeekProblem } from '~~/shared/types'

const props = defineProps<{
  problem: WeekProblem
  userName: string
  summary: SubmissionSummary | null
  initialNoteContent: string
}>()

const emit = defineEmits<{
  close: []
  saveNote: [username: string, content: string]
}>()

const editedContent = ref('')
const syncStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const reversedSubmissions = computed(() => {
  return [...(props.summary?.submissions ?? [])].reverse()
})

// 用於追蹤 initial 載入，防止一打開 Modal 還沒打字就觸發 saving 狀態
let isInitialLoad = true

watch(() => props.initialNoteContent, (newVal) => {
  editedContent.value = newVal || ''
  // 每次從外部傳入 initial 值時，將狀態設為 idle
  syncStatus.value = 'idle'
  isInitialLoad = true
}, { immediate: true })

let saveTimeout: any = null

// 執行背景儲存 API 呼叫
async function performSave() {
  syncStatus.value = 'saving'
  try {
    const { error } = await useFetch(`/api/notes/${props.problem.id}`, {
      method: 'PUT',
      body: {
        username: props.userName,
        content: editedContent.value,
      },
    })
    if (error.value) {
      syncStatus.value = 'error'
    } else {
      syncStatus.value = 'saved'
      emit('saveNote', props.userName, editedContent.value)
    }
  } catch (err) {
    syncStatus.value = 'error'
  }
}

// 監聽輸入內容的異動
watch(editedContent, (newVal) => {
  if (isInitialLoad) {
    isInitialLoad = false
    return
  }

  // 內容確實有改變才進行同步
  if (newVal !== (props.initialNoteContent || '')) {
    syncStatus.value = 'saving'
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(performSave, 1000) // 停止打字 1 秒後自動儲存
  }
})

// 關閉時強制將未同步的內容儲存
async function tryClose() {
  if (saveTimeout) clearTimeout(saveTimeout)
  if (syncStatus.value === 'saving') {
    await performSave()
  }
  emit('close')
}

onUnmounted(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
})
</script>

<template>
  <div class="modal-overlay" @click.self="tryClose">
    <div class="modal-card" role="dialog" aria-modal="true">
      <header class="modal-header">
        <div class="header-title-area">
          <span class="problem-id">#{{ problem.id }}</span>
          <h2>{{ userName }} · {{ problem.name }}</h2>
        </div>
        
        <div class="header-actions">
          <!-- 自動儲存雲端同步狀態顯示器 (無 emoji) -->
          <div class="sync-indicator" :class="syncStatus">
            <svg viewBox="0 0 24 24" width="16" height="16" class="sync-cloud-icon" aria-hidden="true">
              <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
            </svg>
            <span class="sync-text">
              <template v-if="syncStatus === 'saving'">同步中...</template>
              <template v-else-if="syncStatus === 'saved'">已同步</template>
              <template v-else-if="syncStatus === 'error'">同步失敗</template>
              <template v-else>已就緒</template>
            </span>
          </div>

          <button
            type="button"
            class="modal-close"
            aria-label="關閉"
            @click="tryClose"
          >
            ✕
          </button>
        </div>
      </header>

      <div class="modal-body-split">
        <!-- 左欄：送出紀錄 -->
        <div class="split-col left-col">
          <h3 class="col-title">送出紀錄 ({{ summary?.submissions?.length || 0 }})</h3>
          <div class="col-content">
            <ul v-if="reversedSubmissions.length" class="submission-list">
              <li
                v-for="(s, idx) in reversedSubmissions"
                :key="idx"
                class="submission-row"
                :class="s.verdict === 'AC' ? 'ac' : 'fail'"
              >
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
            <p v-else class="empty-state">沒有抓到提交紀錄。</p>
          </div>
        </div>

        <!-- 右欄：解題筆記 (Auto-save) -->
        <div class="split-col right-col">
          <h3 class="col-title">解題筆記 (自動儲存)</h3>
          <div class="col-content">
            <div class="note-edit-container">
              <div class="editor-info">
                您正在編輯 {{ userName }} 的解題想法。系統會在您停止輸入時在背景自動同步。
              </div>
              <textarea
                v-model="editedContent"
                class="note-textarea"
                placeholder="例如：題目大意、實作想法、遇到的坑與 DP 轉移方程式..."
                :disabled="syncStatus === 'saving' && false"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <span class="user-hint-text">
          本欄展示 {{ userName }} 於此題之送出紀錄與解題思維，提供同伴間對照學習。
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 23, 26, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.modal-card {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 12px;
  max-width: 820px;
  width: 100%;
  height: 580px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--cs-border-subtle);
  background: var(--cs-bg);
}

.header-title-area {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.problem-id {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--cs-text-muted);
}

.modal-header h2 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  color: var(--cs-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cs-text-secondary);
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--cs-bg-subtle);
  color: var(--cs-text);
}

/* 雲端同步狀態樣式 */
.sync-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--cs-text-secondary);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border-subtle);
  transition: all 0.2s ease;
}

.sync-cloud-icon {
  flex-shrink: 0;
}

/* 同步中：呼吸動畫 */
.sync-indicator.saving {
  color: var(--cs-text-secondary);
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 已同步：綠色 */
.sync-indicator.saved {
  color: var(--cs-accent);
  background: var(--cs-accent-bg);
  border-color: rgba(10, 143, 92, 0.15);
}

/* 同步失敗：紅色 */
.sync-indicator.error {
  color: #de3b3b;
  background: #fdf2f2;
  border-color: #fbd5d5;
}

/* 左右分欄版面 */
.modal-body-split {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100% - 100px); /* 扣除 header 與 footer */
}

.split-col {
  width: 50%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.left-col {
  border-right: 1px solid var(--cs-border-subtle);
  background: var(--cs-bg-subtle);
}

.right-col {
  background: var(--cs-bg);
}

.col-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cs-text-secondary);
  margin: 0;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.col-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.note-edit-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  height: 100%;
}

.editor-info {
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
  line-height: 1.4;
}

.note-textarea {
  width: 100%;
  height: 100%;
  min-height: 290px;
  padding: 0.75rem;
  border: 1px solid var(--cs-border);
  border-radius: 6px;
  background: var(--cs-bg-subtle);
  color: var(--cs-text);
  font-family: monospace;
  font-size: 0.88rem;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.note-textarea:focus {
  border-color: var(--cs-accent);
  box-shadow: 0 0 0 2px var(--cs-accent-bg);
  background: var(--cs-bg);
}

.submission-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
}

.submission-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0;
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
  font-size: 0.95rem;
}

.submission-row.ac .submission-verdict {
  color: var(--cs-accent);
}

.submission-row.fail .submission-verdict {
  color: #c0392b;
}

.submission-meta {
  font-size: 0.72rem;
  color: var(--cs-text-secondary);
}

.submission-link {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: inherit;
  text-decoration: none;
}

.submission-link:hover .submission-time {
  text-decoration: underline;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--cs-text-muted);
  font-size: 0.85rem;
}

.modal-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--cs-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--cs-bg-subtle);
}

.user-hint-text {
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
  line-height: 1.4;
}
</style>
