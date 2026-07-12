<script setup lang="ts">
import type { Week } from '~~/shared/types'

defineProps<{
  weeks: Week[]
  selectedWeekId: string | null
  week: Week | null
  pending: boolean
  refreshing: boolean
}>()

const emit = defineEmits<{
  'update:selectedWeekId': [id: string]
  refresh: []
}>()
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
      <NuxtLink v-if="week" :to="`/plan?edit=${encodeURIComponent(week.id)}`" class="edit-link">編輯這次</NuxtLink>
      <button class="refresh-btn" :disabled="pending || refreshing" @click="emit('refresh')">重新整理</button>
    </div>
  </div>
</template>

<style scoped>
.week-switcher {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.week-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.week-tab {
  flex-shrink: 0;
  padding: 0.4rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text-secondary);
  border: 1px solid var(--cs-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.week-tab:hover {
  border-color: #ccc;
}

.week-tab.active {
  background: var(--cs-text);
  color: var(--cs-bg);
  border-color: var(--cs-text);
  font-weight: 600;
}

.week-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.edit-link {
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
  text-decoration: none;
  white-space: nowrap;
}

.edit-link:hover {
  color: var(--cs-text);
  text-decoration: underline;
}

.refresh-btn {
  padding: 0.45rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-size: 0.85rem;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #ccc;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
