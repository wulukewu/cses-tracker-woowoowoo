<script setup lang="ts">
import type { Week, WeekTodo } from '~~/shared/types'
import { USERS } from '~~/shared/users'

const props = defineProps<{
  week: Week
}>()

const emit = defineEmits<{
  close: []
  updateTodos: [todos: WeekTodo[]]
}>()

const localTodos = ref<WeekTodo[]>([])
const newTodoText = ref('')
const newTodoAssignee = ref('')

const currentWeekId = ref(props.week.id)

watch(
  () => props.week.id,
  (newId) => {
    localTodos.value = props.week.todos ? JSON.parse(JSON.stringify(props.week.todos)) : []
    currentWeekId.value = newId
  },
  { immediate: true }
)

function toggleTodo(todoId: string) {
  localTodos.value = localTodos.value.map((t) => {
    if (t.id === todoId) {
      return { ...t, completed: !t.completed }
    }
    return t
  })
  emit('updateTodos', localTodos.value)
}

function handleAddTodo() {
  const text = newTodoText.value.trim()
  if (!text) return
  
  const newTodo: WeekTodo = {
    id: Math.random().toString(36).substring(2, 9),
    content: text,
    completed: false,
    assignee: newTodoAssignee.value || undefined,
  }
  
  localTodos.value = [...localTodos.value, newTodo]
  emit('updateTodos', localTodos.value)
  
  newTodoText.value = ''
  newTodoAssignee.value = ''
}

function handleRemoveTodo(todoId: string) {
  localTodos.value = localTodos.value.filter((t) => t.id !== todoId)
  emit('updateTodos', localTodos.value)
}

function getAssigneeDisplayName(username?: string) {
  if (!username) return '全體'
  const user = USERS.find((u) => u.name === username)
  return user ? user.name : username
}

function getAssigneeClass(username?: string) {
  if (!username) return 'assignee-all'
  if (username === 'lukewu') return 'assignee-luke'
  if (username === 'zyo') return 'assignee-zyo'
  return 'assignee-wee'
}

function getInitials(username?: string) {
  if (!username) return 'All'
  if (username === 'lukewu') return 'L'
  if (username === 'zyo') return 'Z'
  return 'W'
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>當週待辦作業</h3>
        <button type="button" class="close-btn" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="localTodos.length === 0" class="empty-todos">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--cs-text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <p>本週尚未規劃任何待辦作業</p>
          <span class="empty-tip">在下方新增一項指派吧！</span>
        </div>

        <TransitionGroup v-else name="todo-list" tag="ul" class="todo-list">
          <li v-for="t in localTodos" :key="t.id" class="todo-item" :class="{ completed: t.completed }">
            <label class="todo-label">
              <input
                type="checkbox"
                :checked="t.completed"
                class="todo-checkbox"
                @change="toggleTodo(t.id)"
              />
              <span class="todo-content">{{ t.content }}</span>
            </label>
            <div class="todo-meta">
              <span class="assignee-badge" :class="getAssigneeClass(t.assignee)" :title="`指派給：${getAssigneeDisplayName(t.assignee)}`">
                <span class="assignee-avatar">{{ getInitials(t.assignee) }}</span>
                <span class="assignee-name">{{ getAssigneeDisplayName(t.assignee) }}</span>
              </span>
              <button type="button" class="remove-todo-btn" title="刪除待辦" @click="handleRemoveTodo(t.id)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <div class="modal-footer-form">
        <div class="add-todo-form">
          <input
            v-model="newTodoText"
            type="text"
            class="todo-input"
            placeholder="新增待辦事項...（如：搞懂一維背包）"
            @keyup.enter="handleAddTodo"
          />
          <div class="form-row-actions">
            <select v-model="newTodoAssignee" class="todo-assignee-select">
              <option value="">指派給：全體</option>
              <option v-for="u in USERS" :key="u.csesId" :value="u.name">
                指派給：{{ u.name }}
              </option>
            </select>
            <button type="button" class="cf-btn add-todo-btn" @click="handleAddTodo">新增</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-card {
  background: var(--cs-bg);
  border: 1px solid var(--cf-border);
  border-radius: var(--cs-radius);
  width: 100%;
  max-width: 480px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
  animation: modal-enter 0.18s ease;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--cf-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--cf-blue);
}

.close-btn {
  background: none;
  border: none;
  padding: 0.2rem;
  color: var(--cs-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: var(--cs-border-subtle);
  color: var(--cs-text);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.empty-todos {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--cs-text-secondary);
}

.empty-icon {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  animation: bounce-subtle 3s infinite ease-in-out;
}

@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.empty-todos p {
  margin: 0 0 0.4rem 0;
  font-weight: 500;
  color: var(--cs-text);
}

.empty-tip {
  font-size: 0.82rem;
  color: var(--cs-text-muted);
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  border: 1px solid var(--cs-border-subtle);
  border-radius: var(--cs-radius);
  background: var(--cs-bg-subtle);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 1rem;
}

.todo-item:hover {
  border-color: var(--cs-border);
  background: var(--cs-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.todo-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.todo-checkbox {
  margin-top: 0.15rem;
  width: 17px;
  height: 17px;
  border-radius: 4px;
  border: 1.5px solid var(--cs-border);
  accent-color: var(--cs-accent);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.todo-checkbox:active {
  transform: scale(0.85);
}

.todo-checkbox:checked {
  transform: scale(1.05);
}

.todo-content {
  font-size: 0.92rem;
  line-height: 1.4;
  color: var(--cs-text);
  word-break: break-word;
  transition: color 0.2s ease, text-decoration 0.2s ease;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-content {
  text-decoration: line-through;
  color: var(--cs-text-muted);
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.remove-todo-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--cs-text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.remove-todo-btn:hover {
  color: #b3261e;
  background: #fdf1f0;
}

.remove-todo-btn svg {
  transition: transform 0.2s ease;
}

.remove-todo-btn:hover svg {
  transform: scale(1.08) rotate(5deg);
}

.assignee-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem 0.2rem 0.25rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.assignee-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.6);
}

/* lukewu */
.assignee-luke {
  background: #e8f6ee;
  color: #0a8f5c;
}

/* zyo */
.assignee-zyo {
  background: #e8f0fe;
  color: #1a73e8;
}

/* Weeeeeeeeeeeee00 */
.assignee-wee {
  background: #fef3d6;
  color: #b06000;
}

/* assignee-all */
.assignee-all {
  background: #f1f3f4;
  color: #5f6368;
}

.modal-footer-form {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--cs-border-subtle);
  background: var(--cs-bg-subtle);
}

.add-todo-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.todo-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 6px;
  color: var(--cs-text);
  font-size: 0.88rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: var(--cs-accent);
  box-shadow: 0 0 0 2px var(--cs-accent-bg);
}

.form-row-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.todo-assignee-select {
  flex: 1;
  padding: 0.45rem 0.5rem;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 6px;
  color: var(--cs-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.todo-assignee-select:focus {
  outline: none;
  border-color: var(--cs-accent);
  box-shadow: 0 0 0 2px var(--cs-accent-bg);
}

.add-todo-btn {
  padding: 0.35rem 1.1rem;
}

/* Transition Group Animations */
.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.todo-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.todo-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 480px) {
  .assignee-name {
    display: none;
  }
  .assignee-badge {
    padding: 0.2rem;
  }
}
</style>
