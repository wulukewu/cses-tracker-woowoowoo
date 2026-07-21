<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { SubmissionSummary, WeekProblem } from '~~/shared/types'

const props = defineProps<{
  problem: WeekProblem
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

const editedContent = ref('')
const lastSavedContent = ref('')
const editedStuck = ref(false)
const lastSavedStuck = ref(false)
const syncStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const reversedSubmissions = computed(() => {
  return [...(props.summary?.submissions ?? [])].reverse()
})

// 初始化：只有在 Modal 開啟、切換題目或切換使用者時，才載入初始值
watch([() => props.problem.id, () => props.userName], () => {
  editedContent.value = props.initialNoteContent || ''
  lastSavedContent.value = props.initialNoteContent || ''
  editedStuck.value = props.initialStuck || false
  lastSavedStuck.value = props.initialStuck || false
  syncStatus.value = 'idle'
}, { immediate: true })

let saveTimeout: any = null

// 執行背景儲存 API 呼叫
async function performSave() {
  if (editedContent.value === lastSavedContent.value && editedStuck.value === lastSavedStuck.value) {
    syncStatus.value = 'saved'
    return
  }

  const contentToSave = editedContent.value
  const stuckToSave = editedStuck.value
  syncStatus.value = 'saving'
  try {
    const { error } = await useFetch(`/api/notes/${props.problem.id}`, {
      method: 'PUT',
      body: {
        username: props.userName,
        content: contentToSave,
        stuck: stuckToSave,
      },
    })
    if (error.value) {
      syncStatus.value = 'error'
    } else {
      syncStatus.value = 'saved'
      lastSavedContent.value = contentToSave
      lastSavedStuck.value = stuckToSave
      emit('saveNote', props.userName, contentToSave, stuckToSave)
    }
  } catch (err) {
    syncStatus.value = 'error'
  }
}

// 監聽輸入內容或卡題狀態的異動
watch([editedContent, editedStuck], ([newContent, newStuck]) => {
  if (newContent !== lastSavedContent.value || newStuck !== lastSavedStuck.value) {
    syncStatus.value = 'saving'
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(performSave, 1000) // 異動 1 秒後自動儲存
  } else {
    syncStatus.value = 'saved'
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

const tooltipText = computed(() => {
  switch (syncStatus.value) {
    case 'saving': return '同步中...'
    case 'saved': return '已同步'
    case 'error': return '同步失敗，請檢查網路'
    default: return '已同步'
  }
})

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
          <div class="sync-indicator" :class="syncStatus" :title="tooltipText">
            <div class="sync-wrapper">
              <svg viewBox="0 0 24 24" width="16" height="16" class="sync-cloud-icon" aria-hidden="true">
                <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
              </svg>
              
              <!-- 狀態角標 -->
              <div v-if="syncStatus !== 'idle'" class="status-badge-wrap">
                <!-- saving: loading 旋轉圈 -->
                <svg v-if="syncStatus === 'saving'" class="spinner-svg" viewBox="0 0 50 50" width="8" height="8">
                  <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="10"></circle>
                </svg>
                <!-- saved: 綠色打勾 -->
                <svg v-else-if="syncStatus === 'saved'" viewBox="0 0 24 24" width="8" height="8" class="checkmark-svg">
                  <path fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/>
                </svg>
                <!-- error: 紅色驚嘆號 -->
                <svg v-else-if="syncStatus === 'error'" viewBox="0 0 24 24" width="8" height="8" class="error-svg">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
            </div>
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
          <h3 class="col-title">送出紀錄 ({{ locked ? 0 : (summary?.submissions?.length || 0) }})</h3>
          <div class="col-content">
            <!-- 鎖定狀態提示 -->
            <div v-if="locked" class="locked-state-col">
              <svg class="locked-icon-large" viewBox="0 0 16 16" width="36" height="36">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2"
                />
                <rect x="3.5" y="7" width="9" height="7" rx="1.4" fill="currentColor" />
              </svg>
              <h4 class="locked-title">尚未解鎖紀錄</h4>
              <p class="locked-desc">
                追蹤用的分身帳號尚未在 CSES 通過此題，因此無法載入提交紀錄。請使用分身帳號通過本題後，再行重新整理。
              </p>
            </div>
            
            <template v-else>
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
            </template>
          </div>
        </div>

        <!-- 右欄：解題筆記 -->
        <div class="split-col right-col">
          <h3 class="col-title">解題筆記</h3>
          <div class="col-content">
            <div class="note-edit-container">
              <div class="note-edit-header-row">
                <div class="editor-info">
                  您正在編輯 {{ userName }} 的解題想法。
                </div>
                <label class="stuck-toggle-label">
                  <span class="stuck-toggle-text">卡題標記</span>
                  <input
                    type="checkbox"
                    v-model="editedStuck"
                    class="stuck-toggle-input"
                  />
                  <span class="stuck-toggle-switch"></span>
                </label>
              </div>
              <textarea
                v-model="editedContent"
                class="note-textarea"
                placeholder="例如：題目大意、實作想法、遇到的坑與 DP 轉移方程式..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.modal-card {
  background: var(--cs-bg);
  border: 1px solid var(--cf-border);
  border-radius: var(--cs-radius);
  max-width: 820px;
  width: 100%;
  height: 580px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  animation: modalEnter 0.16s ease;
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
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--cf-border);
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
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--cf-blue);
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
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--cs-text-muted); /* 預設灰色 */
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border-subtle);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: help;
}

.sync-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sync-cloud-icon {
  flex-shrink: 0;
  transition: color 0.25s ease;
}

/* 狀態角標 wrapper */
.status-badge-wrap {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  animation: badgePop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes badgePop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* saving (同步中)：黃色，雲朵與 spinner */
.sync-indicator.saving {
  color: #b45309; /* 深黃色 */
  background: #fef3c7; /* 淡黃色背景 */
  border-color: #fde68a;
}

.sync-indicator.saving .status-badge-wrap {
  border-color: #fde68a;
}

.spinner-svg {
  animation: rotate 1s linear infinite;
}

.spinner-path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

/* saved (已同步)：綠色，雲朵與打勾 */
.sync-indicator.saved {
  color: var(--cs-accent);
  background: var(--cs-accent-bg);
  border-color: rgba(10, 143, 92, 0.15);
}

.sync-indicator.saved .status-badge-wrap {
  border-color: rgba(10, 143, 92, 0.15);
}

/* error (同步失敗)：紅色，雲朵與驚嘆號 */
.sync-indicator.error {
  color: #de3b3b;
  background: #fdf2f2;
  border-color: #fbd5d5;
  animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.sync-indicator.error .status-badge-wrap {
  border-color: #fbd5d5;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(1px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-1px, 0, 0); }
  40%, 60% { transform: translate3d(1px, 0, 0); }
}

/* 左右分欄版面 */
.modal-body-split {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100% - 56px); /* 僅扣除 header */
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

.locked-state-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  min-height: 250px;
  padding: 2rem 1rem;
  color: var(--cs-text-secondary);
}

.locked-icon-large {
  color: var(--cs-text-muted);
  margin-bottom: 0.75rem;
  opacity: 0.85;
}

.locked-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cs-text);
  margin: 0 0 0.4rem 0;
}

.locked-desc {
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--cs-text-muted);
  margin: 0;
  max-width: 240px;
}

.note-edit-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border-subtle);
  border-radius: 6px;
}

.stuck-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--cs-text-secondary);
}

.stuck-toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.stuck-toggle-switch {
  position: relative;
  width: 32px;
  height: 18px;
  background-color: var(--cs-border);
  border-radius: 99px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.stuck-toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background-color: var(--cs-bg);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stuck-toggle-input:checked + .stuck-toggle-switch {
  background-color: #ff9800;
}

.stuck-toggle-input:checked + .stuck-toggle-switch::after {
  transform: translateX(14px);
}

.stuck-toggle-label:hover .stuck-toggle-switch {
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.15);
}
</style>
