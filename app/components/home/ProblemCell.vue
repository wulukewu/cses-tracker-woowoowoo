<script setup lang="ts">
import type { UserProgress, WeekProblem } from '~~/shared/types'
import type { CellInfo } from '~/composables/useHomeProgress'
import { cellSymbol } from '~/composables/useHomeProgress'

defineProps<{
  user: UserProgress
  problem: WeekProblem
  info: CellInfo
  hasNote: boolean
  hasStuck: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="mark-cell-card"
    :class="{
      solved: info.solved,
      attempted: info.waCount > 0,
      'has-note': hasNote,
      stuck: hasStuck
    }"
    :aria-label="info.solved ? '已解，點擊查看紀錄與筆記' : info.waCount ? '嘗試過但未過，點擊查看與編輯筆記' : '未嘗試，點擊查看與編輯筆記'"
    @click="emit('click')"
  >
    <div class="cell-main-content">
      <span class="mark-symbol">{{ cellSymbol(info) }}</span>
      <span v-if="info.waCount" class="wa-badge">{{ info.waCount }}</span>
    </div>
    
    <!-- 筆記高亮底線 (取代雜亂的 icon) -->
    <span v-if="hasNote" class="note-indicator-bar" title="有個人解題筆記"></span>

    <!-- 卡題警示角標 (左上角) -->
    <span v-if="hasStuck" class="stuck-warning-badge" :title="`${user.name} 卡題標記`">
      <svg viewBox="0 0 24 24" width="8" height="8" class="stuck-warning-svg" aria-hidden="true">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </span>

    <!-- 最快/最先角標 -->
    <span v-if="info.isFirstSolver || info.isFastest" class="corner-dots">
      <span v-if="info.isFirstSolver" class="corner-dot first-dot" data-tooltip="最先解出這題"></span>
      <span v-if="info.isFastest" class="corner-dot fastest-dot" data-tooltip="這題目前執行最快"></span>
    </span>

    <!-- 鎖標記 -->
    <svg
      v-if="info.locked"
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
</template>

<style scoped>
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
  border: 1px solid var(--cf-sep);
  background: var(--cf-cell);
  color: var(--cf-text-muted);
  border-radius: 3px;
  cursor: pointer;
  padding: 0.4rem;
  font-family: inherit;
  /* CF-style: no animation */
}

/* 未嘗試 hover 狀態 */
.mark-cell-card:hover {
  border-color: var(--cf-border);
  background: #f5f5f5;
  color: var(--cf-text-secondary);
}

/* 已解出 AC 狀態 */
.mark-cell-card.solved {
  background: rgba(10, 143, 92, 0.05);
  border-color: rgba(10, 143, 92, 0.12);
  color: var(--cf-accent);
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
  background: var(--cf-accent);
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
  color: var(--cf-text-muted);
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
  border: 1px solid var(--cf-bg);
  cursor: default;
}

.corner-dot::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  right: -4px;
  background: var(--cf-text);
  color: var(--cf-bg);
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
  background: var(--cf-stuck-bg);
  border: 1px solid #ffb74d;
  color: #e65100;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.stuck-warning-svg {
  flex-shrink: 0;
}

</style>
