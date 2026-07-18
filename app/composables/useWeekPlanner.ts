import type { ProblemCategory, Week, WeekProblem } from '~~/shared/types'

export async function useWeekPlanner() {
  const route = useRoute()
  const router = useRouter()

  const { data: categories } = await useFetch<ProblemCategory[]>('/api/problems')
  const { data: weeks, refresh: refreshWeeks } = await useFetch<Week[]>('/api/weeks')

  const editingWeekId = ref<string | null>(typeof route.query.edit === 'string' ? route.query.edit : null)
  const editingWeek = computed(() => weeks.value?.find((w) => w.id === editingWeekId.value) ?? null)

  const search = ref('')
  const selected = ref<Map<number, WeekProblem>>(new Map())
  const deadline = ref('')
  const saving = ref(false)
  const saveError = ref('')
  const saveSuccess = ref(false)
  const initializedFor = ref<string | null>(null)

  watchEffect(() => {
    const targetKey = editingWeek.value ? editingWeek.value.id : '__new__'
    if (initializedFor.value === targetKey) return
    initializedFor.value = targetKey

    if (editingWeek.value) {
      selected.value = new Map(editingWeek.value.problems.map((p) => [p.id, p]))
      deadline.value = editingWeek.value.deadline ? editingWeek.value.deadline.slice(0, 10) : ''
    } else {
      selected.value = new Map()
      deadline.value = ''
    }
  })

  // CSES's own display order for each problem, keyed by id — selecting
  // checkboxes populates `selected` in click order, but saved weeks should
  // list problems the same way CSES (and the main screen) does.
  const catalogOrder = computed(() => {
    const map = new Map<number, number>()
    let i = 0
    for (const c of categories.value ?? []) {
      for (const p of c.problems) map.set(p.id, i++)
    }
    return map
  })

  const usedIds = computed(() => {
    const set = new Set<number>()
    for (const w of weeks.value ?? []) {
      if (w.id === editingWeekId.value) continue
      for (const p of w.problems) set.add(p.id)
    }
    return set
  })

  const filteredCategories = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return categories.value ?? []
    return (categories.value ?? [])
      .map((c) => ({
        ...c,
        problems: c.problems.filter((p) => p.name.toLowerCase().includes(term)),
      }))
      .filter((c) => c.problems.length > 0)
  })

  function toggle(problem: WeekProblem) {
    if (usedIds.value.has(problem.id)) return
    if (selected.value.has(problem.id)) {
      selected.value.delete(problem.id)
    } else {
      selected.value.set(problem.id, problem)
    }
    selected.value = new Map(selected.value)
  }

  const selectedCount = computed(() => selected.value.size)

  function cancelEdit() {
    editingWeekId.value = null
    router.replace({ path: '/plan' })
  }

  const deleting = ref(false)
  const deleteArmed = ref(false)
  let deleteArmTimer: ReturnType<typeof setTimeout> | null = null

  function handleDeleteClick() {
    if (deleteArmed.value) {
      confirmDeleteWeek()
      return
    }
    deleteArmed.value = true
    if (deleteArmTimer) clearTimeout(deleteArmTimer)
    deleteArmTimer = setTimeout(() => {
      deleteArmed.value = false
    }, 4000)
  }

  async function confirmDeleteWeek() {
    if (!editingWeekId.value) return
    if (deleteArmTimer) clearTimeout(deleteArmTimer)
    deleting.value = true
    try {
      await $fetch(`/api/weeks/${encodeURIComponent(editingWeekId.value)}`, { method: 'DELETE' })
      deleteArmed.value = false
      cancelEdit()
      await refreshWeeks()
    } finally {
      deleting.value = false
    }
  }

  const showResetModal = ref(false)
  const resetConfirmText = ref('')
  const resetting = ref(false)
  const RESET_PHRASE = '刪除全部'

  function openResetModal() {
    resetConfirmText.value = ''
    showResetModal.value = true
  }

  function closeResetModal() {
    showResetModal.value = false
  }

  async function confirmResetAll() {
    if (resetConfirmText.value !== RESET_PHRASE) return
    resetting.value = true
    try {
      await $fetch('/api/weeks', { method: 'DELETE' })
      showResetModal.value = false
      cancelEdit()
      await refreshWeeks()
    } finally {
      resetting.value = false
    }
  }

  async function save() {
    if (selected.value.size === 0) return
    saving.value = true
    saveError.value = ''
    saveSuccess.value = false
    try {
      const body = {
        problems: Array.from(selected.value.values()).sort(
          (a, b) => (catalogOrder.value.get(a.id) ?? 0) - (catalogOrder.value.get(b.id) ?? 0),
        ),
        deadline: deadline.value || null,
      }

      if (editingWeekId.value) {
        await $fetch(`/api/weeks/${encodeURIComponent(editingWeekId.value)}`, {
          method: 'PATCH',
          body,
        })
      } else {
        await $fetch('/api/weeks', { method: 'POST', body })
        selected.value = new Map()
        deadline.value = ''
      }

      saveSuccess.value = true
      await refreshWeeks()
    } catch (err: any) {
      saveError.value = err?.data?.statusMessage || '儲存失敗'
    } finally {
      saving.value = false
    }
  }

  function exportWeeks() {
    window.open('/api/weeks/export', '_blank')
  }

  async function importWeeksData(weeksData: Week[], mode: 'merge' | 'overwrite') {
    saving.value = true
    saveError.value = ''
    saveSuccess.value = false
    try {
      await $fetch(`/api/weeks/import?mode=${mode}`, {
        method: 'POST',
        body: weeksData,
      })
      saveSuccess.value = true
      await refreshWeeks()
    } catch (err: any) {
      saveError.value = err?.data?.statusMessage || '匯入失敗'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    weeks,
    editingWeek,
    search,
    selected,
    deadline,
    saving,
    saveError,
    saveSuccess,
    usedIds,
    filteredCategories,
    selectedCount,
    toggle,
    cancelEdit,
    deleting,
    deleteArmed,
    handleDeleteClick,
    showResetModal,
    resetConfirmText,
    resetting,
    RESET_PHRASE,
    openResetModal,
    closeResetModal,
    confirmResetAll,
    save,
    exportWeeks,
    importWeeksData,
  }
}
