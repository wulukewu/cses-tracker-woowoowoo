<script setup lang="ts">
import type { ProblemCategory, WeekProblem } from '~~/shared/types'

defineProps<{
  categories: ProblemCategory[]
  usedIds: Set<number>
  selected: Map<number, WeekProblem>
}>()

const emit = defineEmits<{ toggle: [problem: WeekProblem] }>()
</script>

<template>
  <div class="categories">
    <details v-for="c in categories" :key="c.name" open>
      <summary>{{ c.name }} ({{ c.problems.length }})</summary>
      <ul>
        <li v-for="p in c.problems" :key="p.id">
          <label :class="{ used: usedIds.has(p.id) }">
            <input
              type="checkbox"
              :disabled="usedIds.has(p.id)"
              :checked="selected.has(p.id)"
              @change="emit('toggle', p)"
            />
            <span class="problem-label-text">
              {{ p.name }}
              <span v-if="usedIds.has(p.id)" class="used-tag">已用過</span>
            </span>
          </label>
        </li>
      </ul>
    </details>
  </div>
</template>

<style scoped>
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
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.88rem;
  color: var(--cs-text);
}

.categories label input {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.problem-label-text {
  min-width: 0;
}

.categories label.used {
  color: var(--cs-text-muted);
}

.used-tag {
  display: inline-block;
  white-space: nowrap;
  margin-left: 0.3rem;
  font-size: 0.72rem;
  color: var(--cs-text-muted);
}
</style>
