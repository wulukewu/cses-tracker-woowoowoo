<script setup lang="ts">
import type { UserProgress, WeekProblem } from '~~/shared/types'
import type { CellInfo } from '~/composables/useHomeProgress'
import { cellSymbol } from '~/composables/useHomeProgress'

defineProps<{
  users: UserProgress[]
  groupedProblems: { name: string; problems: WeekProblem[] }[]
  cellInfo: (userIndex: number, problemId: number) => CellInfo
  problemMeta: (problemId: number) => string
}>()

const emit = defineEmits<{
  openProfile: [index: number]
  openModal: [problem: WeekProblem, userName: string]
  openNote: [problem: WeekProblem]
}>()
</script>

<template>
  <section class="problem-table-wrap">
    <table class="problem-table">
      <thead>
        <tr>
          <th class="col-problem">題目</th>
          <th v-for="(u, i) in users" :key="u.csesId" class="col-user">
            <button type="button" class="user-name-btn" @click="emit('openProfile', i)">{{ u.name }}</button>
          </th>
        </tr>
      </thead>
      <tbody v-for="group in groupedProblems" :key="group.name">
        <tr class="category-row">
          <td :colspan="1 + users.length">{{ group.name }}</td>
        </tr>
        <tr v-for="p in group.problems" :key="p.id">
          <td class="col-problem">
            <div class="problem-title-row">
              <a class="problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
              <button
                type="button"
                class="note-trigger-btn"
                title="查看/編輯筆記"
                @click="emit('openNote', p)"
              >
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" class="note-icon-svg">
                  <path fill="currentColor" d="M3 2v12h10V4.5L10.5 2H3zm7.5 1L12 4.5H10.5V3zM4 4h5v1H4V4zm0 3h8v1H4V7zm0 3h8v1H4v-1z"/>
                </svg>
              </button>
            </div>
            <span v-if="problemMeta(p.id)" class="problem-meta">{{ problemMeta(p.id) }}</span>
          </td>
          <td v-for="(u, i) in users" :key="u.csesId" class="col-user">
            <button
              v-if="cellInfo(i, p.id).clickable"
              type="button"
              class="mark solved clickable"
              aria-label="已解，含送出紀錄，點擊查看"
              @click="emit('openModal', p, u.name)"
            >
              <span class="mark-symbol">✓</span>
              <span v-if="cellInfo(i, p.id).waCount" class="wa-badge">{{ cellInfo(i, p.id).waCount }}</span>
              <span v-if="cellInfo(i, p.id).isFirstSolver || cellInfo(i, p.id).isFastest" class="corner-dots">
                <span v-if="cellInfo(i, p.id).isFirstSolver" class="corner-dot first-dot" data-tooltip="最先解出這題"></span>
                <span v-if="cellInfo(i, p.id).isFastest" class="corner-dot fastest-dot" data-tooltip="這題目前執行最快"></span>
              </span>
            </button>
            <span
              v-else
              class="mark"
              :class="{ solved: cellInfo(i, p.id).solved, attempted: cellInfo(i, p.id).waCount > 0 }"
              :aria-label="cellInfo(i, p.id).solved ? '已解' : cellInfo(i, p.id).waCount ? '嘗試過但未解出' : '未解'"
            >
              <span class="mark-symbol">{{ cellSymbol(cellInfo(i, p.id)) }}</span>
              <span v-if="cellInfo(i, p.id).waCount" class="wa-badge">{{ cellInfo(i, p.id).waCount }}</span>
              <svg
                v-if="cellInfo(i, p.id).locked"
                class="lock-hint"
                viewBox="0 0 16 16"
                width="12"
                height="12"
                aria-hidden="true"
              >
                <title>分身帳號還沒解過這題，需要手動解一下才能看到送出紀錄</title>
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2"
                />
                <rect x="3.5" y="7" width="9" height="7" rx="1.4" fill="currentColor" />
              </svg>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.problem-table-wrap {
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  overflow: hidden;
}

.problem-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.problem-table thead tr {
  background: var(--cs-bg-subtle);
  border-bottom: 1px solid var(--cs-border);
}

.problem-table th {
  text-align: left;
  font-weight: 500;
  color: var(--cs-text-secondary);
  padding: 0.6rem 0.9rem;
}

.problem-table td {
  padding: 0.55rem 0.9rem;
  border-bottom: 1px solid var(--cs-border-subtle);
}

.problem-table tbody:last-child tr:last-child td {
  border-bottom: none;
}

.category-row td {
  background: var(--cs-bg-subtle);
  color: var(--cs-text-secondary);
  font-weight: 600;
  font-size: 0.8rem;
}

.col-problem {
  width: auto;
}

.problem-name {
  display: block;
  text-decoration: none;
}

.problem-name:hover {
  text-decoration: underline;
}

.problem-meta {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  color: var(--cs-text-muted);
}

.col-user {
  width: 90px;
  text-align: center;
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

.mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--cs-text-muted);
  font: inherit;
  background: none;
  border: none;
  padding: 0;
}

.mark-symbol {
  font-weight: 600;
}

.mark.solved {
  color: var(--cs-accent);
}

.mark.attempted {
  color: #c0392b;
}

.mark.clickable {
  cursor: pointer;
}

.wa-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: #fbe9e7;
  color: #c0392b;
  font-weight: 700;
  font-size: 0.68rem;
  line-height: 1;
}

.lock-hint {
  margin-left: 0.1rem;
  color: var(--cs-text-muted);
  cursor: help;
  flex-shrink: 0;
}

.corner-dots {
  position: absolute;
  top: -5px;
  right: -6px;
  display: flex;
  gap: 3px;
}

.corner-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 1.5px solid var(--cs-bg);
  cursor: default;
}

.corner-dot::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  right: -4px;
  background: var(--cs-text);
  color: var(--cs-bg);
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
  z-index: 10;
}

.corner-dot:hover::after {
  opacity: 1;
}

.first-dot {
  background: #d4a017;
}

.fastest-dot {
  background: #2f6fed;
}

.problem-title-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.note-trigger-btn {
  background: none;
  border: none;
  padding: 0.2rem;
  border-radius: 4px;
  color: var(--cs-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.note-trigger-btn:hover {
  background: var(--cs-border-subtle);
  color: var(--cs-accent);
}

.note-icon-svg {
  display: block;
}
</style>
