<script setup lang="ts">
import type { Week } from '~~/shared/types'

const props = defineProps<{
  weeks: Week[]
  selectedWeekId: string | null
  week: Week | null
  pending: boolean
  refreshing: boolean
}>()

const emit = defineEmits<{
  'update:selectedWeekId': [id: string]
  refresh: []
  openTodos: []
}>()

const todoSummary = computed(() => {
  if (!props.week?.todos || props.week.todos.length === 0) return null
  const total = props.week.todos.length
  const completed = props.week.todos.filter((t) => t.completed).length
  return {
    total,
    completed,
    allDone: completed === total,
  }
})
</script>

<template>
  <div class="week-switcher">
    <div class="week-tabs" role="tablist" aria-label="次別">
      <button
        v-for="w in weeks"
        :key="w.id"
        role="tab"
        :aria-selected="w.id === selectedWeekId"
        class="week-tab"
        :class="{ active: w.id === selectedWeekId }"
        @click="emit('update:selectedWeekId', w.id)"
      >
        {{ w.deadline ? formatDate(w.deadline) : '未設定日期' }}
      </button>
    </div>
    <div class="week-actions">
      <button v-if="week" class="cf-btn" @click="emit('openTodos')">
        當週作業<span v-if="todoSummary" class="todo-badge" :class="{ 'all-done': todoSummary.allDone }">
          {{ todoSummary.allDone ? '✓' : `${todoSummary.completed}/${todoSummary.total}` }}
        </span>
      </button>
      <NuxtLink v-if="week" :to="`/plan?edit=${encodeURIComponent(week.id)}`" class="cf-btn">編輯這次</NuxtLink>
      <button class="cf-btn" :disabled="pending || refreshing" @click="emit('refresh')">重新整理</button>
    </div>
  </div>
</template>

<style scoped>
.week-switcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.week-tabs {
  display: flex;
  gap: 0.4rem;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: thin;
}

.week-tab {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  background: var(--cf-bg);
  color: var(--cf-link);
  border: 1px solid var(--cf-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  font-family: inherit;
}

.week-tab:hover {
  background: var(--cf-cell);
}

.week-tab.active {
  background: var(--cf-blue);
  color: #fff;
  border-color: var(--cf-blue);
  font-weight: 700;
}

.week-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.todo-badge {
  background: var(--cf-sep);
  color: var(--cf-text-secondary);
  font-size: 0.72rem;
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  font-weight: 600;
  margin-left: 0.2rem;
}

.todo-badge.all-done {
  background: var(--cf-accent-bg);
  color: var(--cf-accent);
}
</style>
