<script setup lang="ts">
import { computed } from 'vue'
import type { SubmissionSummary, WeekProblem } from '~~/shared/types'

const props = defineProps<{
  problem: WeekProblem
  userName: string
  summary: SubmissionSummary | null
}>()

const emit = defineEmits<{ close: [] }>()

const reversedSubmissions = computed(() => {
  return [...(props.summary?.submissions ?? [])].reverse()
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>{{ userName }} · {{ problem.name }}</h2>
        <button type="button" class="modal-close" aria-label="關閉" @click="emit('close')">✕</button>
      </div>
      <ul v-if="reversedSubmissions.length" class="submission-list">
        <li v-for="(s, idx) in reversedSubmissions" :key="idx" class="submission-row" :class="s.verdict === 'AC' ? 'ac' : 'fail'">
          <a v-if="s.detailUrl" :href="s.detailUrl" target="_blank" rel="noopener" class="submission-link">
            <span class="submission-main">
              <span class="submission-time">{{ s.time }}</span>
              <span class="submission-verdict">✓</span>
            </span>
            <span class="submission-meta">{{ s.lang }} · {{ s.execTime }} · {{ s.codeSize }}</span>
          </a>
          <template v-else>
            <span class="submission-main">
              <span class="submission-time">{{ s.time }}</span>
              <span class="submission-verdict">{{ s.verdict === 'AC' ? '✓' : '✗' }}</span>
            </span>
            <span class="submission-meta">{{ s.lang }} · {{ s.execTime }} · {{ s.codeSize }}</span>
          </template>
        </li>
      </ul>
      <p v-else class="empty-state">沒有抓到送出紀錄。</p>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--cs-text-muted);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 100;
}

.modal-card {
  background: var(--cs-bg);
  border-radius: var(--cs-radius);
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.modal-header h2 {
  font-size: 1rem;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cs-text-secondary);
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem;
}

.submission-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.88rem;
}

.submission-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.submission-row:last-child {
  border-bottom: none;
}

.submission-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.submission-verdict {
  font-weight: 700;
  font-size: 1rem;
}

.submission-row.ac .submission-verdict {
  color: var(--cs-accent);
}

.submission-row.fail .submission-verdict {
  color: #c0392b;
}

.submission-meta {
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
}

.submission-link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  color: inherit;
  text-decoration: none;
}

.submission-link:hover .submission-time {
  text-decoration: underline;
}
</style>
