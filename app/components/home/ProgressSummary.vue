<script setup lang="ts">
import type { UserProgress, Week } from '~~/shared/types'

defineProps<{
  week: Week
  users: UserProgress[]
  solvedCountFor: (index: number) => number
}>()

const emit = defineEmits<{ openProfile: [index: number] }>()
</script>

<template>
  <section class="progress-summary">
    <div v-for="(u, i) in users" :key="u.csesId" class="summary-item">
      <div class="summary-header">
        <button
          type="button"
          class="user-name-btn"
          @click="emit('openProfile', i)"
        ><LayoutCfHandle :name="u.name" /></button>
        <span class="user-count">{{ solvedCountFor(i) }} / {{ week.problems.length }}</span>
      </div>
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :style="{ width: `${week.problems.length ? (solvedCountFor(i) / week.problems.length) * 100 : 0}%` }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.user-name {
  font-weight: 600;
}

.user-name-btn {
  font: inherit;
  font-weight: 600;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.user-name-btn:hover {
  color: var(--cs-accent);
  text-decoration: underline;
}

.user-count {
  color: var(--cs-text-secondary);
}

.progress-bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--cs-border-subtle);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--cs-accent);
  transition: width 0.2s ease;
}
</style>
