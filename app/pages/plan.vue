<script setup lang="ts">
import type { ProblemCategory, Week, WeekProblem } from '~~/shared/types'

const route = useRoute()
const router = useRouter()

const { data: categories } = await useFetch<ProblemCategory[]>('/api/problems')
const { data: weeks, refresh: refreshWeeks } = await useFetch<Week[]>('/api/weeks')

const editingWeekId = ref<string | null>(
  typeof route.query.edit === 'string' ? route.query.edit : null,
)
const editingWeek = computed(() => weeks.value?.find((w) => w.id === editingWeekId.value) ?? null)

const search = ref('')
const selected = ref<Map<number, WeekProblem>>(new Map())
const deadline = ref('')
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
const initializedFor = ref<string | null>(null)

watchEffect(() => {
  const targetKey = editingWeek.value ? editingWeek.value.id : '__new__'
  if (initializedFor.value === targetKey) return
  initializedFor.value = targetKey

  if (editingWeek.value) {
    selected.value = new Map(editingWeek.value.problems.map((p) => [p.id, p]))
    deadline.value = editingWeek.value.deadline ? editingWeek.value.deadline.slice(0, 10) : ''
  } else {
    selected.value = new Map()
    deadline.value = ''
  }
})

const usedIds = computed(() => {
  const set = new Set<number>()
  for (const w of weeks.value ?? []) {
    if (w.id === editingWeekId.value) continue
    for (const p of w.problems) set.add(p.id)
  }
  return set
})

const filteredCategories = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return categories.value ?? []
  return (categories.value ?? [])
    .map((c) => ({
      ...c,
      problems: c.problems.filter((p) => p.name.toLowerCase().includes(term)),
    }))
    .filter((c) => c.problems.length > 0)
})

function toggle(problem: WeekProblem) {
  if (usedIds.value.has(problem.id)) return
  if (selected.value.has(problem.id)) {
    selected.value.delete(problem.id)
  } else {
    selected.value.set(problem.id, problem)
  }
  selected.value = new Map(selected.value)
}

const selectedCount = computed(() => selected.value.size)

function cancelEdit() {
  editingWeekId.value = null
  router.replace({ path: '/plan' })
}

async function save() {
  if (selected.value.size === 0) return
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const body = {
      problems: Array.from(selected.value.values()),
      deadline: deadline.value || null,
    }

    if (editingWeekId.value) {
      await $fetch(`/api/weeks/${encodeURIComponent(editingWeekId.value)}`, {
        method: 'PATCH',
        body,
      })
    } else {
      await $fetch('/api/weeks', { method: 'POST', body })
      selected.value = new Map()
      deadline.value = ''
    }

    saveSuccess.value = true
    await refreshWeeks()
  } catch (err: any) {
    saveError.value = err?.data?.statusMessage || '儲存失敗'
  } finally {
    saving.value = false
  }
}

function exportWeeks() {
  window.open('/api/weeks/export', '_blank')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="plan-page">
    <div class="plan-header">
      <div>
        <h2 v-if="editingWeek">
          編輯{{ editingWeek.deadline ? `截止 ${formatDate(editingWeek.deadline)} 的` : '這一' }}週次
        </h2>
        <h2 v-else>規劃下週題目</h2>
        <button v-if="editingWeek" class="cancel-edit-btn" @click="cancelEdit">取消編輯，改為新增下一週</button>
      </div>
      <button class="export-btn" @click="exportWeeks">匯出所有週次資料</button>
    </div>

    <input v-model="search" class="search-input" type="text" placeholder="搜尋題目名稱..." />

    <div class="categories">
      <details v-for="c in filteredCategories" :key="c.name" open>
        <summary>{{ c.name }} ({{ c.problems.length }})</summary>
        <ul>
          <li v-for="p in c.problems" :key="p.id">
            <label :class="{ used: usedIds.has(p.id) }">
              <input
                type="checkbox"
                :disabled="usedIds.has(p.id)"
                :checked="selected.has(p.id)"
                @change="toggle(p)"
              />
              {{ p.name }}
              <span v-if="usedIds.has(p.id)" class="used-tag">已用過</span>
            </label>
          </li>
        </ul>
      </details>
    </div>

    <div class="plan-footer">
      <div class="footer-row">
        <span>已選 {{ selectedCount }} 題</span>
        <label class="deadline-label">
          截止日期
          <input v-model="deadline" type="date" />
        </label>
      </div>
      <button class="save-btn" :disabled="saving || selectedCount === 0" @click="save">
        {{ saving ? '儲存中...' : editingWeek ? '更新這一週' : '存檔' }}
      </button>
      <p v-if="saveSuccess" class="save-success">{{ editingWeek ? '已更新這一週！' : '已儲存新的一週！' }}</p>
      <p v-if="saveError" class="save-error">{{ saveError }}</p>
    </div>
  </div>
</template>

<style scoped>
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.plan-header h2 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.3rem;
}

.cancel-edit-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--cs-text-secondary);
  font-size: 0.82rem;
  text-decoration: underline;
  cursor: pointer;
}

.export-btn {
  padding: 0.45rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.export-btn:hover {
  border-color: #ccc;
}

.search-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  color: var(--cs-text);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.categories details {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.8rem;
}

.categories summary {
  cursor: pointer;
  font-weight: 500;
  padding: 0.3rem 0;
  color: var(--cs-text);
}

.categories ul {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.2rem 1rem;
}

.categories label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.88rem;
  color: var(--cs-text);
}

.categories label.used {
  color: var(--cs-text-muted);
}

.used-tag {
  font-size: 0.72rem;
  color: var(--cs-text-muted);
}

.plan-footer {
  position: sticky;
  bottom: 0;
  background: var(--cs-bg);
  border-top: 1px solid var(--cs-border);
  padding: 1rem 0 0.5rem;
  margin-top: 1.5rem;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.deadline-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
}

.deadline-label input {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  color: var(--cs-text);
  border-radius: var(--cs-radius);
  padding: 0.3rem 0.5rem;
}

.save-btn {
  padding: 0.55rem 1.1rem;
  background: var(--cs-text);
  color: var(--cs-bg);
  border: none;
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.save-success {
  color: var(--cs-accent);
  font-size: 0.85rem;
}

.save-error {
  color: #b3261e;
  font-size: 0.85rem;
}
</style>
