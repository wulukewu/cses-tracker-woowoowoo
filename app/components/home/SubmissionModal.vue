<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const isEditing = ref(false)
const editedContent = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

// 自訂確認彈窗
const showConfirmDialog = ref(false)

const reversedSubmissions = computed(() => {
  return [...(props.summary?.submissions ?? [])].reverse()
})

watch(() => props.initialNoteContent, (newVal) => {
  if (!isEditing.value) {
    editedContent.value = newVal || ''
  }
}, { immediate: true })

const hasUnsavedChanges = computed(() => {
  return isEditing.value && editedContent.value !== (props.initialNoteContent || '')
})

function tryClose() {
  if (hasUnsavedChanges.value) {
    showConfirmDialog.value = true
  } else {
    emit('close')
  }
}

function confirmDiscard() {
  showConfirmDialog.value = false
  isEditing.value = false
  errorMessage.value = ''
  emit('close')
}

function startEdit() {
  editedContent.value = props.initialNoteContent || ''
  isEditing.value = true
  errorMessage.value = ''
}

function cancelEdit() {
  if (hasUnsavedChanges.value) {
    showConfirmDialog.value = true
  } else {
    isEditing.value = false
    errorMessage.value = ''
  }
}

async function handleSave() {
  isSaving.value = true
  errorMessage.value = ''
  try {
    const { error } = await useFetch(`/api/notes/${props.problem.id}`, {
      method: 'PUT',
      body: {
        username: props.userName,
        content: editedContent.value,
      },
    })
    if (error.value) {
      errorMessage.value = '儲存失敗，請重試'
    } else {
      emit('saveNote', props.userName, editedContent.value)
      isEditing.value = false
    }
  } catch (err) {
    errorMessage.value = '儲存失敗，請重試'
  } finally {
    isSaving.value = false
  }
}
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
          <button
            v-if="!isEditing"
            type="button"
            class="action-btn edit-btn"
            @click="startEdit"
          >
            編輯筆記
          </button>
          <button
            v-else
            type="button"
            class="action-btn save-btn"
            :disabled="isSaving"
            @click="handleSave"
          >
            {{ isSaving ? '儲存中...' : '儲存' }}
          </button>
          <button
            v-if="isEditing"
            type="button"
            class="action-btn cancel-btn"
            :disabled="isSaving"
            @click="cancelEdit"
          >
            取消
          </button>
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

        <!-- 右欄：解題筆記 -->
        <div class="split-col right-col">
          <h3 class="col-title">解題筆記</h3>
          <div class="col-content">
            <!-- 儲存失敗的 Banner 提示 -->
            <div v-if="errorMessage" class="error-banner">
              <span class="error-message-text">{{ errorMessage }}</span>
              <button type="button" class="error-close-btn" @click="errorMessage = ''">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path
                    fill="currentColor"
                    d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
                  />
                </svg>
              </button>
            </div>

            <div v-if="!isEditing" class="note-view-container">
              <div v-if="initialNoteContent.trim()" class="note-display">
                {{ initialNoteContent }}
              </div>
              <div v-else class="note-empty">
                目前無筆記。點選右上角「編輯筆記」來記錄思維與解法吧。
              </div>
            </div>
            <div v-else class="note-edit-container">
              <div class="editor-info">
                您正在編輯 {{ userName }} 的解題想法。支援純文字與 Markdown。
              </div>
              <textarea
                v-model="editedContent"
                class="note-textarea"
                placeholder="例如：題目大意、實作想法、遇到的坑與 DP 轉移方程式..."
                :disabled="isSaving"
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

    <!-- 自訂確認 Dialog Overlay (僅在 Modal 內部疊加) -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click.self="showConfirmDialog = false">
      <div class="confirm-card">
        <h3 class="confirm-title">確定要放棄修改嗎？</h3>
        <p class="confirm-text">
          您對 {{ userName }} 的筆記進行了修改，但尚未儲存。放棄將會遺失目前編輯的所有內容。
        </p>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn discard-btn" @click="confirmDiscard">
            放棄修改
          </button>
          <button type="button" class="confirm-btn keep-btn" @click="showConfirmDialog = false">
            繼續編輯
          </button>
        </div>
      </div>
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
  gap: 0.5rem;
}

.action-btn {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.edit-btn {
  background: var(--cs-bg-subtle);
  border-color: var(--cs-border);
  color: var(--cs-text-secondary);
}

.edit-btn:hover {
  background: var(--cs-border-subtle);
  color: var(--cs-text);
}

.save-btn {
  background: var(--cs-accent);
  color: white;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.cancel-btn {
  background: var(--cs-bg-subtle);
  border-color: var(--cs-border);
  color: var(--cs-text-secondary);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--cs-border-subtle);
  color: var(--cs-text);
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

.error-banner {
  background: #fdf2f2;
  border: 1px solid #fbd5d5;
  color: #de3b3b;
  padding: 0.65rem 0.9rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: bannerEnter 0.2s ease;
}

@keyframes bannerEnter {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-message-text {
  font-weight: 500;
}

.error-close-btn {
  background: none;
  border: none;
  color: #de3b3b;
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-close-btn:hover {
  background: rgba(222, 59, 59, 0.08);
}

.note-view-container {
  height: 100%;
}

.note-display {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--cs-text);
}

.note-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--cs-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.note-edit-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.editor-info {
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
}

.note-textarea {
  width: 100%;
  height: 100%;
  min-height: 260px;
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

/* 確認 Dialog 樣式 */
.confirm-dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(22, 23, 26, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.confirm-card {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 8px;
  width: 100%;
  max-width: 350px;
  padding: 1.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: confirmEnter 0.15s ease;
}

@keyframes confirmEnter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.confirm-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cs-text);
}

.confirm-text {
  margin: 0 0 1.25rem 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--cs-text-secondary);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.confirm-btn {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.discard-btn {
  background: #de3b3b;
  color: white;
}

.discard-btn:hover {
  background: #cb3131;
}

.keep-btn {
  background: var(--cs-bg-subtle);
  border-color: var(--cs-border);
  color: var(--cs-text-secondary);
}

.keep-btn:hover {
  background: var(--cs-border-subtle);
  color: var(--cs-text);
}
</style>
