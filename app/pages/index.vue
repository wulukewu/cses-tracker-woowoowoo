<script setup lang="ts">
import type { WeekProblem } from '~~/shared/types'

const {
  weeks,
  categories,
  selectedWeekId,
  week,
  users,
  staleSince,
  solvedSets,
  submissions,
  pending,
  refreshing,
  refreshAll,
  solvedCountFor,
  problemMeta,
  cellInfo,
  totalProblemCount,
  groupedProblems,
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

const modalProblem = ref<WeekProblem | null>(null)
const modalUserName = ref<string | null>(null)

const modalSummary = computed(() => {
  if (!modalProblem.value || !modalUserName.value) return null
  return submissions.value?.[String(modalProblem.value.id)]?.[modalUserName.value] ?? null
})

function openModal(problem: WeekProblem, userName: string) {
  modalProblem.value = problem
  modalUserName.value = userName
}

function closeModal() {
  modalProblem.value = null
  modalUserName.value = null
}

// Without this, scrolling past the end of a modal's own list chains into
// the page behind it — the fixed overlay stays put but the body scrolls,
// which shows up as the page's own scrollbar (detached from the card)
// moving instead of the modal's.
const anyModalOpen = computed(() => Boolean((modalProblem.value && modalUserName.value) || profileUser.value))

watch(anyModalOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div v-if="!weeks || weeks.length === 0" class="empty-state">
      還沒有任何資料，先到「規劃下次」建立第一組題目吧。
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
      />

      <div v-if="staleSince" class="stale-banner">
        資料自 {{ formatDate(staleSince) }} 起未更新
      </div>

      <HomeProgressSummary v-if="week" :week="week" :users="users" :solved-count-for="solvedCountFor" @open-profile="openProfile" />

      <HomeProblemTable
        v-if="week"
        :users="users"
        :grouped-problems="groupedProblems"
        :cell-info="cellInfo"
        :problem-meta="problemMeta"
        @open-profile="openProfile"
        @open-modal="openModal"
      />
    </template>

    <HomeSubmissionModal
      v-if="modalProblem && modalUserName"
      :problem="modalProblem"
      :user-name="modalUserName"
      :summary="modalSummary"
      @close="closeModal"
    />

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
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--cs-text-muted);
}

.stale-banner {
  background: #fdf6e3;
  color: #8a6d1a;
  border: 1px solid #f0e2ae;
  padding: 0.6rem 0.9rem;
  border-radius: var(--cs-radius);
  margin-bottom: 1.25rem;
  font-size: 0.88rem;
}
</style>
