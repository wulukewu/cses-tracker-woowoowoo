<script setup lang="ts">
import type { WeekProblem, WeekTodo } from '~~/shared/types'

const {
  weeks,
  selectedWeekId,
  week,
  users,
  staleSince,
  submissions,
  pending,
  refreshing,
  refreshAll,
  solvedCountFor,
  problemMeta,
  cellInfo,
  groupedProblems,
  notes,
  progress,
} = await useHomeProgress()

const overlayProblem = ref<WeekProblem | null>(null)
const overlayUserName = ref<string | null>(null)
const showTodos = ref(false)

const overlaySummary = computed(() => {
  if (!overlayProblem.value || !overlayUserName.value) return null
  return submissions.value?.[String(overlayProblem.value.id)]?.[overlayUserName.value] ?? null
})

const overlayLocked = computed(() => {
  if (!overlayProblem.value || !overlayUserName.value) return false
  const uIdx = users.value.findIndex(u => u.name === overlayUserName.value)
  if (uIdx === -1) return false
  return cellInfo(uIdx, overlayProblem.value.id).locked
})

function handleSaveNote(username: string, content: string, stuck: boolean) {
  if (notes.value && overlayProblem.value) {
    const pid = String(overlayProblem.value.id)
    const newNotes = { ...notes.value }
    if (!newNotes[pid]) newNotes[pid] = {}
    newNotes[pid] = { ...newNotes[pid], [username]: { content, stuck } }
    notes.value = newNotes
  }
}

function openModal(problem: WeekProblem, userName: string) {
  overlayProblem.value = problem
  overlayUserName.value = userName
}

function closeOverlay() {
  overlayProblem.value = null
  overlayUserName.value = null
}

const anyModalOpen = computed(() => Boolean(overlayProblem.value || showTodos.value))

async function handleUpdateTodos(newTodos: WeekTodo[]) {
  if (!week.value) return
  const targetWeekId = week.value.id

  // 樂觀更新 weeks
  if (weeks.value) {
    const w = weeks.value.find((x) => x.id === targetWeekId)
    if (w) w.todos = newTodos
  }
  // 樂觀更新 progress (對整個 progress.value 重新賦值以確保 shallowRef 觸發響應)
  if (progress.value && progress.value.week && progress.value.week.id === targetWeekId) {
    progress.value = {
      ...progress.value,
      week: {
        ...progress.value.week,
        todos: newTodos
      }
    }
  }

  try {
    const updatedWeek = await $fetch<any>(`/api/weeks/${encodeURIComponent(targetWeekId)}`, {
      method: 'PATCH',
      body: { todos: newTodos },
    })

    // 用後端返回的真實資料再次確認更新，防止背景 refresh 等 Race Condition 蓋過去
    if (updatedWeek) {
      if (progress.value && progress.value.week && progress.value.week.id === targetWeekId) {
        progress.value = {
          ...progress.value,
          week: {
            ...progress.value.week,
            todos: updatedWeek.todos || []
          }
        }
      }
      if (weeks.value) {
        const w = weeks.value.find((x) => x.id === targetWeekId)
        if (w) w.todos = updatedWeek.todos || []
      }
    }
  } catch (err) {
    console.error('更新待辦作業失敗:', err)
  }
}

watch(anyModalOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div class="cf-page-title">
      <h1>CSES Weekly Round</h1>
      <span class="cf-page-sub">逐題賽況 · 三人同場</span>
      <span class="cf-page-clock"><HomeTaiwanClock /></span>
    </div>

    <div v-if="!weeks || weeks.length === 0" class="empty-state">
      還沒有任何資料，先到「規劃」建立第一組題目吧。
    </div>

    <template v-else>
      <HomeWeekSwitcher
        :weeks="weeks"
        :selected-week-id="selectedWeekId"
        :week="week"
        :pending="pending"
        :refreshing="refreshing"
        @update:selected-week-id="selectedWeekId = $event"
        @refresh="refreshAll"
        @open-todos="showTodos = true"
      />

      <div v-if="staleSince" class="stale-banner">
        資料自 {{ formatDate(staleSince) }} 起未更新
      </div>

      <LayoutCfBox v-if="week" title="→ Standings（本週進度）">
        <HomeProgressSummary :week="week" :users="users" :solved-count-for="solvedCountFor" />
      </LayoutCfBox>

      <HomeProblemTable
        v-if="week"
        :users="users"
        :grouped-problems="groupedProblems"
        :cell-info="cellInfo"
        :problem-meta="problemMeta"
        :notes="notes || {}"
        @open-modal="openModal"
      />
    </template>

    <HomeSubmissionOverlay
      v-if="overlayProblem && overlayUserName"
      :problem-id="overlayProblem.id"
      :problem-name="overlayProblem.name"
      :user-name="overlayUserName"
      :summary="overlaySummary"
      :initial-note-content="notes?.[String(overlayProblem.id)]?.[overlayUserName]?.content || ''"
      :initial-stuck="notes?.[String(overlayProblem.id)]?.[overlayUserName]?.stuck || false"
      :locked="overlayLocked"
      @close="closeOverlay"
      @save-note="handleSaveNote"
    />

    <HomeWeekTodosModal
      v-if="showTodos && week"
      :week="week"
      @close="showTodos = false"
      @update-todos="handleUpdateTodos"
    />
  </div>
</template>

<style scoped>
.cf-page-title {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin: 0 0 1rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--cf-sep);
}

.cf-page-clock {
  margin-left: auto;
}

.cf-page-title h1 {
  font-size: 1.3rem;
  font-weight: 400;
  margin: 0;
  color: var(--cf-blue);
}

.cf-page-sub {
  font-size: 0.82rem;
  color: var(--cf-text-muted);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--cf-text-muted);
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
}

.stale-banner {
  background: var(--cf-cell);
  color: var(--cf-text-secondary);
  border: 1px solid var(--cf-sep);
  padding: 0.55rem 0.85rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}
</style>
