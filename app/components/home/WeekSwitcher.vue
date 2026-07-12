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
}>()

const scrollEl = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateFade() {
  const el = scrollEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

// Re-check whenever the tab list itself changes size (new/deleted week),
// not just on scroll — a resize can flip from "everything fits" to
// "overflowing" without the user ever scrolling.
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateFade()
  if (scrollEl.value) {
    resizeObserver = new ResizeObserver(updateFade)
    resizeObserver.observe(scrollEl.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.weeks.length,
  () => nextTick(updateFade),
)
</script>

<template>
  <div class="week-switcher">
    <div class="week-tabs-wrap" :class="{ 'fade-left': canScrollLeft, 'fade-right': canScrollRight }">
      <div ref="scrollEl" class="week-tabs" role="tablist" aria-label="次別" @scroll="updateFade">
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
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.week-tabs-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.week-tabs-wrap::before,
.week-tabs-wrap::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 28px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 1;
}

.week-tabs-wrap::before {
  left: 0;
  background: linear-gradient(to right, var(--cs-bg), transparent);
}

.week-tabs-wrap::after {
  right: 0;
  background: linear-gradient(to left, var(--cs-bg), transparent);
}

.week-tabs-wrap.fade-left::before,
.week-tabs-wrap.fade-right::after {
  opacity: 1;
}

.week-tabs {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.week-tabs::-webkit-scrollbar {
  display: none;
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
  flex-shrink: 0;
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
