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

watch(
  () => props.week.id,
  (newId) => {
    localTodos.value = props.week.todos ? JSON.parse(JSON.stringify(props.week.todos)) : []
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
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>當週待辦作業</h3>
        <button type="button" class="modal-close" aria-label="關閉" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <p v-if="localTodos.length === 0" class="empty-todos">本週尚未規劃任何待辦作業</p>

        <table v-else class="todo-table">
          <thead>
            <tr>
              <th class="tc-status"></th>
              <th class="tc-item">事項</th>
              <th class="tc-user">負責人</th>
              <th class="tc-del"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in localTodos" :key="t.id" :class="{ completed: t.completed }">
              <td class="tc-status">
                <input
                  type="checkbox"
                  :checked="t.completed"
                  @change="toggleTodo(t.id)"
                />
              </td>
              <td class="tc-item" :class="{ done: t.completed }">{{ t.content }}</td>
              <td class="tc-user">
                <span v-if="t.assignee" class="assignee-text"><LayoutCfHandle :name="t.assignee" /></span>
                <span v-else class="assignee-all">全體</span>
              </td>
              <td class="tc-del">
                <button type="button" class="del-btn" title="刪除" @click="handleRemoveTodo(t.id)">&times;</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <div class="add-row">
          <input
            v-model="newTodoText"
            type="text"
            class="add-input"
            placeholder="新增待辦事項..."
            @keyup.enter="handleAddTodo"
          />
          <select v-model="newTodoAssignee" class="add-select">
            <option value="">全體</option>
            <option v-for="u in USERS" :key="u.csesId" :value="u.name">{{ u.name }}</option>
          </select>
          <button type="button" class="cf-btn" @click="handleAddTodo">新增</button>
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
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  width: 100%;
  max-width: 520px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--cf-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--cf-blue);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cf-text-secondary);
  font-size: 1.2rem;
  line-height: 1;
  padding: 0.25rem;
}

.modal-close:hover {
  color: var(--cf-text);
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.empty-todos {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--cf-text-muted);
  font-size: 0.88rem;
}

.todo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.todo-table th {
  font-weight: 700;
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--cf-border);
  background: var(--cf-cell);
  font-size: 0.8rem;
  color: var(--cf-text-secondary);
}

.todo-table td {
  padding: 0.45rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  vertical-align: middle;
}

.todo-table tbody tr:last-child td {
  border-bottom: none;
}

.todo-table tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}

.todo-table tbody tr.completed td {
  opacity: 0.55;
}

.tc-status {
  width: 2rem;
  text-align: center;
}

.tc-status input {
  cursor: pointer;
}

.tc-item {
  font-weight: 500;
}

.tc-item.done {
  text-decoration: line-through;
  color: var(--cf-text-muted);
}

.tc-user {
  width: 6rem;
  font-size: 0.82rem;
}

.assignee-all {
  color: var(--cf-text-muted);
  font-size: 0.8rem;
}

.tc-del {
  width: 1.5rem;
  text-align: center;
}

.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cf-text-muted);
  font-size: 1rem;
  padding: 0.15rem;
}

.del-btn:hover {
  color: var(--cf-red);
}

.modal-footer {
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--cf-border);
}

.add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.add-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
  color: var(--cf-text);
  font-size: 0.85rem;
}

.add-input:focus {
  outline: none;
  border-color: var(--cf-blue);
}

.add-select {
  padding: 0.4rem 0.5rem;
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
  color: var(--cf-text);
  font-size: 0.82rem;
  cursor: pointer;
}

/* ---------- Responsive: mobile ---------- */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-body {
    padding: 0.75rem 0.85rem;
  }

  .modal-footer {
    padding: 0.65rem 0.85rem;
  }

  .add-row {
    flex-wrap: wrap;
  }

  .add-input {
    flex: 1 1 100%;
  }

  .add-select {
    flex: 1;
    min-width: 0;
  }
}
</style>
