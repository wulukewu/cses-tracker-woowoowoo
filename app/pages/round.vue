<script setup lang="ts">
import type { WeekTodo } from '~~/shared/types'

const {
  weeks,
  categories,
  selectedWeekId,
  week,
  users,
  staleSince,
  solvedSets,
  pending,
  refreshing,
  refreshAll,
  solvedCountFor,
  problemMeta,
  cellInfo,
  totalProblemCount,
  groupedProblems,
  notes,
  progress,
} = await useHomeProgress()

const {
  profileUser,
  profileSolvedSet,
  profileTotalSolved,
  profileCategories,
  expandedCategories,
  openProfile,
  closeProfile,
  toggleCategory,
} = useUserProfile(users, solvedSets, categories)

const showTodos = ref(false)

function openModal(problem: WeekProblem, userName: string) {
  navigateTo(`/submissions?problemId=${problem.id}&userName=${encodeURIComponent(userName)}&weekId=${encodeURIComponent(selectedWeekId.value || '')}`)
}

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

const anyModalOpen = computed(() => Boolean(profileUser.value || showTodos.value))

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
        <HomeProgressSummary :week="week" :users="users" :solved-count-for="solvedCountFor" @open-profile="openProfile" />
      </LayoutCfBox>

      <HomeProblemTable
        v-if="week"
        :users="users"
        :grouped-problems="groupedProblems"
        :cell-info="cellInfo"
        :problem-meta="problemMeta"
        :notes="notes || {}"
        @open-profile="openProfile"
        @open-modal="openModal"
      />
    </template>

    <HomeUserProfileModal
      v-if="profileUser"
      :user="profileUser"
      :total-solved="profileTotalSolved"
      :total-problem-count="totalProblemCount"
      :categories="profileCategories"
      :expanded-categories="expandedCategories"
      :solved-set="profileSolvedSet"
      @close="closeProfile"
      @toggle-category="toggleCategory"
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

.cf-page-title h1 {
  font-size: 1.7rem;
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
  background: #fff;
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
}

.stale-banner {
  background: var(--cf-cell);
  color: var(--cf-text-secondary);
  border: 1px solid var(--cf-sep);
  padding: 0.55rem 0.85rem;
  border-radius: var(--cf-radius);
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}
</style>
