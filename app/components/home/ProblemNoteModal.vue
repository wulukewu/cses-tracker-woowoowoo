<script setup lang="ts">
import type { WeekProblem } from '~~/shared/types'
import { USERS } from '~~/shared/users'

const props = defineProps<{
  problem: WeekProblem
  notes: Record<string, string>
}>()

const emit = defineEmits<{
  close: []
  save: [username: string, content: string]
}>()

const activeUser = ref('lukewu')
const isEditing = ref(false)
const editedContent = ref('')
const isSaving = ref(false)

// 瀏覽器初始化讀取 localStorage
onMounted(() => {
  if (import.meta.client) {
    const savedUser = localStorage.getItem('cses-tracker-username')
    if (savedUser && USERS.some((u) => u.name === savedUser)) {
      activeUser.value = savedUser
    }
  }
})

// 取得當前選定使用者的筆記內容
const currentNoteContent = computed(() => {
  return props.notes?.[activeUser.value] || ''
})

// 當切換 Tab 時，若在編輯狀態下也順便更新編輯內容，若在唯讀狀態則只做資料同步
watch([activeUser, currentNoteContent], () => {
  if (!isEditing.value) {
    editedContent.value = currentNoteContent.value
  }
}, { immediate: true })

function selectUser(username: string) {
  if (isEditing.value) {
    // 編輯中若切換 Tab，詢問是否放棄修改
    if (editedContent.value !== currentNoteContent.value) {
      if (!confirm('您的修改尚未儲存，確定要切換使用者並放棄修改嗎？')) {
        return
      }
    }
    isEditing.value = false
  }
  activeUser.value = username
  if (import.meta.client) {
    localStorage.setItem('cses-tracker-username', username)
  }
}

function startEdit() {
  editedContent.value = currentNoteContent.value
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function handleSave() {
  isSaving.value = true
  try {
    const { error } = await useFetch(`/api/notes/${props.problem.id}`, {
      method: 'PUT',
      body: { 
        username: activeUser.value,
        content: editedContent.value 
      },
    })
    if (error.value) {
      alert('儲存失敗，請重試')
    } else {
      emit('save', activeUser.value, editedContent.value)
      isEditing.value = false
    }
  } catch (err) {
    alert('儲存失敗，請重試')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <header class="modal-header">
        <div class="header-left">
          <span class="problem-id">#{{ problem.id }}</span>
          <h2 class="modal-title">{{ problem.name }}</h2>
        </div>
        <div class="header-actions">
          <button
            v-if="!isEditing"
            type="button"
            class="action-btn edit-btn"
            @click="startEdit"
          >
            編輯此頁
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
            v-else
            type="button"
            class="close-icon-btn"
            @click="emit('close')"
            aria-label="關閉"
          >
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path
                fill="currentColor"
                d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
              />
            </svg>
          </button>
        </div>
      </header>

      <!-- Tab 控制項 -->
      <div class="modal-tabs">
        <button
          v-for="u in USERS"
          :key="u.csesId"
          type="button"
          class="tab-btn"
          :class="{ active: activeUser === u.name }"
          @click="selectUser(u.name)"
        >
          {{ u.name }} 的筆記
        </button>
      </div>

      <div class="modal-body">
        <div v-if="!isEditing" class="note-view-container">
          <div v-if="currentNoteContent.trim()" class="note-display">
            {{ currentNoteContent }}
          </div>
          <div v-else class="note-empty">
            目前 {{ activeUser }} 這題沒有筆記。點擊右上角「編輯此頁」來新增想法吧。
          </div>
        </div>
        <div v-else class="note-edit-container">
          <div class="editor-help-text">
            您正在編輯 {{ activeUser }} 的個人筆記。此處支援純文字與 Markdown 格式。
          </div>
          <textarea
            v-model="editedContent"
            class="note-textarea"
            placeholder="請輸入你的筆記或想法..."
            :disabled="isSaving"
          ></textarea>
        </div>
      </div>

      <footer class="modal-footer">
        <span class="user-hint-text">
          這是一個共享筆記空間，點選上方 Tab 可以編輯或閱讀不同同伴的思路。
        </span>
        <button
          v-if="!isEditing"
          type="button"
          class="footer-close-btn"
          @click="emit('close')"
        >
          關閉
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(22, 23, 26, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-card {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 12px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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

.header-left {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.problem-id {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--cs-text-muted);
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--cs-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
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

.close-icon-btn {
  background: none;
  border: none;
  color: var(--cs-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon-btn:hover {
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
  padding: 0.6rem 0.5rem;
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

.note-view-container {
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
  font-size: 0.9rem;
  text-align: center;
}

.note-edit-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.editor-help-text {
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

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--cs-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.user-hint-text {
  font-size: 0.75rem;
  color: var(--cs-text-muted);
  line-height: 1.4;
  flex: 1;
}

.footer-close-btn {
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border);
  color: var(--cs-text-secondary);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-shrink: 0;
}

.footer-close-btn:hover {
  background: var(--cs-border-subtle);
  color: var(--cs-text);
}
</style>
