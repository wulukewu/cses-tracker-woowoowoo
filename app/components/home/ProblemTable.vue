<script setup lang="ts">
import type { UserProgress, WeekProblem, UserNote } from '~~/shared/types'
import type { CellInfo } from '~/composables/useHomeProgress'
import { cellSymbol } from '~/composables/useHomeProgress'

const props = defineProps<{
  users: UserProgress[]
  groupedProblems: { name: string; problems: WeekProblem[] }[]
  cellInfo: (userIndex: number, problemId: number) => CellInfo
  problemMeta: (problemId: number) => string
  notes: Record<string, Record<string, UserNote>>
}>()

const emit = defineEmits<{
  openProfile: [index: number]
  openModal: [problem: WeekProblem, userName: string]
}>()

function hasNote(problemId: number, userName: string) {
  return Boolean(props.notes?.[String(problemId)]?.[userName]?.content?.trim())
}

function hasStuck(problemId: number, userName: string) {
  return Boolean(props.notes?.[String(problemId)]?.[userName]?.stuck)
}
</script>

<template>
  <section class="problem-table-wrap">
    <table class="problem-table">
      <thead>
        <tr>
          <th class="col-problem">題目</th>
          <th v-for="(u, i) in users" :key="u.csesId" class="col-user">
            <button type="button" class="user-name-btn" :title="u.name" @click="emit('openProfile', i)">{{ u.name }}</button>
          </th>
        </tr>
      </thead>
      <tbody v-for="group in groupedProblems" :key="group.name">
        <tr class="category-row">
          <td :colspan="1 + users.length">
            <div class="category-title-wrap">
              <span class="category-indicator"></span>
              <span class="category-name">{{ group.name }}</span>
            </div>
          </td>
        </tr>
        <tr v-for="p in group.problems" :key="p.id">
          <td class="col-problem">
            <div class="problem-title-row">
              <span class="problem-id-tag">#{{ p.id }}</span>
              <a class="problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
            </div>
            <span v-if="problemMeta(p.id)" class="problem-meta">{{ problemMeta(p.id) }}</span>
          </td>
          <td v-for="(u, i) in users" :key="u.csesId" class="col-user">
            <!-- 狀態卡片按鈕 -->
            <button
              type="button"
              class="mark-cell-card"
              :class="{
                solved: cellInfo(i, p.id).solved,
                attempted: cellInfo(i, p.id).waCount > 0,
                'has-note': hasNote(p.id, u.name),
                stuck: hasStuck(p.id, u.name)
              }"
              :aria-label="cellInfo(i, p.id).solved ? '已解，點擊查看紀錄與筆記' : cellInfo(i, p.id).waCount ? '嘗試過但未過，點擊查看與編輯筆記' : '未嘗試，點擊查看與編輯筆記'"
              @click="emit('openModal', p, u.name)"
            >
              <div class="cell-main-content">
                <span class="mark-symbol">{{ cellSymbol(cellInfo(i, p.id)) }}</span>
                <span v-if="cellInfo(i, p.id).waCount" class="wa-badge">{{ cellInfo(i, p.id).waCount }}</span>
              </div>
              
              <!-- 筆記高亮底線 (取代雜亂的 icon) -->
              <span v-if="hasNote(p.id, u.name)" class="note-indicator-bar" title="有個人解題筆記"></span>

              <!-- 卡題警示角標 (左上角) -->
              <span v-if="hasStuck(p.id, u.name)" class="stuck-warning-badge" :title="`${u.name} 卡題標記`">
                <svg viewBox="0 0 24 24" width="8" height="8" class="stuck-warning-svg" aria-hidden="true">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </span>

              <!-- 最快/最先角標 -->
              <span v-if="cellInfo(i, p.id).isFirstSolver || cellInfo(i, p.id).isFastest" class="corner-dots">
                <span v-if="cellInfo(i, p.id).isFirstSolver" class="corner-dot first-dot" data-tooltip="最先解出這題"></span>
                <span v-if="cellInfo(i, p.id).isFastest" class="corner-dot fastest-dot" data-tooltip="這題目前執行最快"></span>
              </span>

              <!-- 鎖標記 -->
              <svg
                v-if="cellInfo(i, p.id).locked"
                class="lock-hint"
                viewBox="0 0 16 16"
                width="10"
                height="10"
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
            </button>
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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
}

.problem-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  table-layout: fixed;
}

.problem-table thead tr {
  background: var(--cs-bg-subtle);
  border-bottom: 1px solid var(--cs-border);
}

.problem-table th {
  text-align: left;
  font-weight: 600;
  color: var(--cs-text-secondary);
  padding: 0.75rem 1rem;
}

.problem-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--cs-border-subtle);
  vertical-align: middle;
}

.problem-table tbody:last-child tr:last-child td {
  border-bottom: none;
}

/* 分類列優化 */
.category-row td {
  background: #fbfbfb;
  padding: 0.5rem 1rem;
}

.category-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-indicator {
  width: 3px;
  height: 12px;
  background: var(--cs-accent);
  border-radius: 99px;
}

.category-name {
  color: var(--cs-text);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}

.col-problem {
  width: auto;
}

.problem-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.problem-id-tag {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--cs-text-secondary);
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.problem-name {
  display: block;
  text-decoration: none;
  font-weight: 500;
  color: var(--cs-text);
}

.problem-name:hover {
  color: var(--cs-accent);
  text-decoration: underline;
}

.problem-meta {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: var(--cs-text-secondary);
  opacity: 0.85;
}

.col-user {
  width: 120px;
  text-align: center !important; /* 強制置中以覆蓋 th text-align: left */
  padding: 0.5rem !important; /* 縮減 padding 讓格子卡片有更大發揮空間 */
}

.user-name-btn {
  font: inherit;
  font-weight: 600;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  max-width: 100%;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.user-name-btn:hover {
  color: var(--cs-accent);
  text-decoration: underline;
}

/* 狀態格子卡片式設計 */
.mark-cell-card {
  position: relative;
  width: 100%;
  min-height: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  border: 1px solid var(--cs-border-subtle);
  background: var(--cs-bg-subtle);
  color: var(--cs-text-muted);
  border-radius: 6px;
  cursor: pointer;
  padding: 0.4rem;
  font-family: inherit;
  transition: all 0.15s ease;
}

/* 未嘗試 hover 狀態 */
.mark-cell-card:hover {
  border-color: var(--cs-border);
  background: #f5f5f5;
  color: var(--cs-text-secondary);
}

/* 已解出 AC 狀態 */
.mark-cell-card.solved {
  background: rgba(10, 143, 92, 0.05);
  border-color: rgba(10, 143, 92, 0.12);
  color: var(--cs-accent);
}

.mark-cell-card.solved:hover {
  background: rgba(10, 143, 92, 0.08);
  border-color: rgba(10, 143, 92, 0.2);
}

/* 嘗試過但未過 WA 狀態 */
.mark-cell-card.attempted {
  background: rgba(192, 57, 43, 0.04);
  border-color: rgba(192, 57, 43, 0.1);
  color: #c0392b;
}

.mark-cell-card.attempted:hover {
  background: rgba(192, 57, 43, 0.07);
  border-color: rgba(192, 57, 43, 0.18);
}

/* 筆記指示底線 (極簡高級) */
.note-indicator-bar {
  position: absolute;
  bottom: 0;
  left: 15%;
  width: 70%;
  height: 2px;
  background: var(--cs-accent);
  border-radius: 99px;
  opacity: 0.85;
}

.cell-main-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.mark-symbol {
  font-weight: 700;
  font-size: 0.9rem;
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
  font-size: 0.65rem;
  line-height: 1;
}

.lock-hint {
  position: absolute;
  bottom: 4px;
  right: 4px;
  color: var(--cs-text-muted);
  cursor: help;
  flex-shrink: 0;
  opacity: 0.7;
}

.corner-dots {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  gap: 2px;
}

.corner-dot {
  position: relative;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 1px solid var(--cs-bg);
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

.stuck-warning-badge {
  position: absolute;
  top: -4px;
  left: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  color: #e65100;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  z-index: 2;
  animation: badgePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.stuck-warning-svg {
  flex-shrink: 0;
}

@keyframes badgePop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
