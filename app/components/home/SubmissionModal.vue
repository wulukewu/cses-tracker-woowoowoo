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

const activeTab = ref<'notes' | 'submissions'>('notes')
const isEditing = ref(false)
const editedContent = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

// 自訂確認彈窗
const showConfirmDialog = ref(false)
const pendingAction = ref<'close' | 'tab'>('close')

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
    pendingAction.value = 'close'
    showConfirmDialog.value = true
  } else {
    emit('close')
  }
}

function trySwitchTab(tab: 'notes' | 'submissions') {
  if (tab === activeTab.value) return
  if (hasUnsavedChanges.value) {
    pendingAction.value = 'tab'
    showConfirmDialog.value = true
  } else {
    activeTab.value = tab
    errorMessage.value = ''
  }
}

function confirmDiscard() {
  showConfirmDialog.value = false
  isEditing.value = false
  errorMessage.value = ''
  if (pendingAction.value === 'close') {
    emit('close')
  } else {
    activeTab.value = activeTab.value === 'notes' ? 'submissions' : 'notes'
  }
}

function startEdit() {
  editedContent.value = props.initialNoteContent || ''
  isEditing.value = true
  errorMessage.value = ''
}

function cancelEdit() {
  isEditing.value = false
  errorMessage.value = ''
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
          <template v-if="activeTab === 'notes'">
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
          </template>
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

      <!-- Tabs 切換 -->
      <div class="modal-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="trySwitchTab('notes')"
        >
          解題筆記
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'submissions' }"
          @click="trySwitchTab('submissions')"
        >
          送出紀錄 ({{ summary?.submissions?.length || 0 }})
        </button>
      </div>

      <div class="modal-body">
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

        <!-- 筆記 Tab 內容 -->
        <div v-if="activeTab === 'notes'" class="tab-content note-tab-content">
          <div v-if="!isEditing" class="note-view">
            <div v-if="initialNoteContent.trim()" class="note-display">
              {{ initialNoteContent }}
            </div>
            <div v-else class="note-empty">
              目前尚未寫下筆記。點選右上角「編輯筆記」來記錄思維與解法吧。
            </div>
          </div>
          <div v-else class="note-edit">
            <div class="editor-info">
              您正在編輯 {{ userName }} 的解題想法。支援 Markdown 與純文字。
            </div>
            <textarea
              v-model="editedContent"
              class="note-textarea"
              placeholder="例如：題目大意、實作想法、遇到的坑與 DP 轉移方程式..."
              :disabled="isSaving"
            ></textarea>
          </div>
        </div>

        <!-- 送出紀錄 Tab 內容 -->
        <div v-else class="tab-content submissions-tab-content">
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
  max-width: 600px;
  width: 100%;
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
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--cs-border-subtle);
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
  font-size: 1.1rem;
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
  font-size: 0.82rem;
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

.modal-tabs {
  display: flex;
  background: var(--cs-bg-subtle);
  padding: 0.25rem;
  border-bottom: 1px solid var(--cs-border-subtle);
  gap: 0.25rem;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 0.55rem 0.5rem;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--cs-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--cs-text);
}

.tab-btn.active {
  background: var(--cs-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: var(--cs-accent);
  font-weight: 600;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  min-height: 250px;
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

.tab-content {
  height: 100%;
}

.note-display {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--cs-text);
}

.note-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--cs-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.note-edit {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  height: 100%;
}

.editor-info {
  font-size: 0.78rem;
  color: var(--cs-text-secondary);
}

.note-textarea {
  width: 100%;
  height: 320px;
  padding: 0.75rem;
  border: 1px solid var(--cs-border);
  border-radius: 6px;
  background: var(--cs-bg-subtle);
  color: var(--cs-text);
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
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
  font-size: 0.88rem;
}

.submission-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.55rem 0;
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

.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--cs-text-muted);
  font-size: 0.88rem;
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
  max-width: 380px;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: confirmEnter 0.15s ease;
}

@keyframes confirmEnter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.confirm-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cs-text);
}

.confirm-text {
  margin: 0 0 1.25rem 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--cs-text-secondary);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.confirm-btn {
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
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
