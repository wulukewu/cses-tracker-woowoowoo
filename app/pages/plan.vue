<script setup lang="ts">
import type { ProblemCategory, Week, WeekProblem } from '~~/shared/types'

const { data: categories } = await useFetch<ProblemCategory[]>('/api/problems')
const { data: weeks, refresh: refreshWeeks } = await useFetch<Week[]>('/api/weeks')

const usedIds = computed(() => {
  const set = new Set<number>()
  for (const w of weeks.value ?? []) {
    for (const p of w.problems) set.add(p.id)
  }
  return set
})

const search = ref('')
const selected = ref<Map<number, WeekProblem>>(new Map())
const deadline = ref('')
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

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
  // trigger reactivity for Map
  selected.value = new Map(selected.value)
}

const selectedCount = computed(() => selected.value.size)

async function save() {
  if (selected.value.size === 0) return
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/weeks', {
      method: 'POST',
      body: {
        problems: Array.from(selected.value.values()),
        deadline: deadline.value || null,
      },
    })
    selected.value = new Map()
    deadline.value = ''
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
</script>

<template>
  <div class="plan-page">
    <div class="plan-header">
      <h2>規劃下週題目</h2>
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
          截止日期（僅顯示用）
          <input v-model="deadline" type="date" />
        </label>
      </div>
      <button class="save-btn" :disabled="saving || selectedCount === 0" @click="save">
        {{ saving ? '儲存中...' : '存檔' }}
      </button>
      <p v-if="saveSuccess" class="save-success">已儲存新的一週！</p>
      <p v-if="saveError" class="save-error">{{ saveError }}</p>
    </div>
  </div>
</template>

<style scoped>
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.export-btn {
  padding: 0.5rem 0.9rem;
  background: #2c2f38;
  color: inherit;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: #1a1d23;
  border: 1px solid #2c2f38;
  border-radius: 6px;
  color: inherit;
  margin-bottom: 1rem;
}

.categories details {
  background: #16181d;
  border: 1px solid #23262d;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.8rem;
}

.categories summary {
  cursor: pointer;
  font-weight: 600;
  padding: 0.3rem 0;
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
  font-size: 0.92rem;
}

.categories label.used {
  color: #6a6f78;
}

.used-tag {
  font-size: 0.75rem;
  color: #6a6f78;
}

.plan-footer {
  position: sticky;
  bottom: 0;
  background: #0f1115;
  border-top: 1px solid #23262d;
  padding: 1rem 0 0.5rem;
  margin-top: 1.5rem;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.deadline-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #9aa0aa;
}

.deadline-label input {
  background: #1a1d23;
  border: 1px solid #2c2f38;
  color: inherit;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
}

.save-btn {
  padding: 0.6rem 1.2rem;
  background: #4f8cff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.save-success {
  color: #7ddc8f;
}

.save-error {
  color: #ff8080;
}
</style>
