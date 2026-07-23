<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProblemCategory, WeekProblem } from '~~/shared/types'

const props = defineProps<{
  categories: ProblemCategory[]
  usedIds: Set<number>
  selected: Map<number, WeekProblem>
}>()

const emit = defineEmits<{ toggle: [problem: WeekProblem] }>()

const expandedCategories = ref<Set<string>>(new Set(props.categories.map((c) => c.name)))

watch(
  () => props.categories,
  (cats) => {
    if (expandedCategories.value.size === 0) {
      expandedCategories.value = new Set(cats.map((c) => c.name))
    }
  },
)

function toggleCategory(name: string) {
  const next = new Set(expandedCategories.value)
  if (next.has(name)) {
    next.delete(name)
  } else {
    next.add(name)
  }
  expandedCategories.value = next
}
</script>

<template>
  <div class="categories">
    <div v-for="c in categories" :key="c.name" class="category-section">
      <button type="button" class="category-header" @click="toggleCategory(c.name)">
        <span class="category-indicator"></span>
        <span class="category-name">{{ c.name }}</span>
        <span class="category-count">({{ c.problems.length }})</span>
        <span class="collapse-arrow" :class="{ expanded: expandedCategories.has(c.name) }">&#9660;</span>
      </button>
      <table v-if="expandedCategories.has(c.name)" class="problem-table">
        <tbody>
          <tr v-for="p in c.problems" :key="p.id">
            <td class="col-checkbox">
              <input
                type="checkbox"
                :disabled="usedIds.has(p.id)"
                :checked="selected.has(p.id)"
                @change="emit('toggle', p)"
              />
            </td>
            <td class="col-id">{{ p.id }}</td>
            <td class="col-name" :class="{ used: usedIds.has(p.id) }">
              {{ p.name }}
              <span v-if="usedIds.has(p.id)" class="used-tag">已用過</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.category-section {
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--cf-cell);
  border: none;
  border-bottom: 1px solid var(--cf-border);
  font: inherit;
  cursor: pointer;
  text-align: left;
  color: var(--cf-blue);
  font-weight: 700;
  font-size: 0.88rem;
}

.category-header:hover {
  background: #f0f0f0;
}

.category-indicator {
  width: 3px;
  height: 12px;
  background: var(--cf-blue);
  flex-shrink: 0;
}

.category-count {
  font-weight: 400;
  color: var(--cf-text-secondary);
  font-size: 0.82rem;
}

.collapse-arrow {
  margin-left: auto;
  font-size: 0.65rem;
  transition: transform 0.15s ease;
}

.collapse-arrow.expanded {
  transform: rotate(180deg);
}

.problem-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.problem-table tbody tr {
  border-bottom: 1px solid var(--cf-sep);
}

.problem-table tbody tr:last-child {
  border-bottom: none;
}

.problem-table tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}

.problem-table td {
  padding: 0.4rem 0.55rem;
  vertical-align: middle;
  background: var(--cf-bg);
}

.col-checkbox {
  width: 2rem;
  text-align: center;
}

.col-checkbox input {
  cursor: pointer;
}

.col-checkbox input:disabled {
  cursor: default;
}

.col-id {
  width: 4rem;
  font-family: monospace;
  font-size: 0.78rem;
  color: var(--cf-text-muted);
}

.col-name {
  color: var(--cf-text);
  font-weight: 500;
}

.col-name.used {
  color: var(--cf-text-muted);
}

.used-tag {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.72rem;
  color: var(--cf-text-muted);
  background: var(--cf-cell);
  border: 1px solid var(--cf-sep);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
}
</style>
