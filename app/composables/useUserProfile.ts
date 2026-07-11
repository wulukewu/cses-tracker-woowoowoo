import type { ComputedRef, Ref } from 'vue'
import type { ProblemCategory, UserProgress, WeekProblem } from '~~/shared/types'

export interface CategoryProgress {
  name: string
  problems: WeekProblem[]
  solvedCount: number
}

export function useUserProfile(
  users: ComputedRef<UserProgress[]>,
  solvedSets: ComputedRef<Set<number>[]>,
  categories: Ref<ProblemCategory[] | null>,
) {
  const profileUserIndex = ref<number | null>(null)
  const expandedCategories = ref<Set<string>>(new Set())

  const profileUser = computed(() => (profileUserIndex.value === null ? null : users.value[profileUserIndex.value] ?? null))
  const profileSolvedSet = computed(() =>
    profileUserIndex.value === null ? null : solvedSets.value[profileUserIndex.value] ?? null,
  )

  const profileTotalSolved = computed(() => profileSolvedSet.value?.size ?? 0)

  const profileCategories = computed<CategoryProgress[]>(() => {
    const set = profileSolvedSet.value
    if (!set) return []
    return (categories.value ?? []).map((c) => ({
      name: c.name,
      problems: c.problems,
      solvedCount: c.problems.filter((p) => set.has(p.id)).length,
    }))
  })

  function openProfile(index: number) {
    profileUserIndex.value = index
    expandedCategories.value = new Set()
  }

  function closeProfile() {
    profileUserIndex.value = null
  }

  function toggleCategory(name: string) {
    const next = new Set(expandedCategories.value)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    expandedCategories.value = next
  }

  return {
    profileUser,
    profileSolvedSet,
    profileTotalSolved,
    profileCategories,
    expandedCategories,
    openProfile,
    closeProfile,
    toggleCategory,
  }
}
