import problems from '~~/server/data/problems.json'
import type {
  ProblemCategory,
  ProblemStatsResponse,
  ProgressResponse,
  SubmissionsResponse,
  Week,
  UserNote,
} from '~~/shared/types'

export interface CellInfo {
  solved: boolean
  waCount: number
  locked: boolean
  clickable: boolean
  isFirstSolver: boolean
  isFastest: boolean
}

const emptyCell: CellInfo = {
  solved: false,
  waCount: 0,
  locked: false,
  clickable: false,
  isFirstSolver: false,
  isFastest: false,
}

export function cellSymbol(info: CellInfo) {
  if (info.solved) return '✓'
  if (info.waCount > 0) return '✗'
  return '–'
}

export async function useHomeProgress() {
  const { data: weeks } = await useFetch<Week[]>('/api/weeks')
  const categories = ref(problems as ProblemCategory[])

  const categoryByProblemId = computed(() => {
    const map = new Map<number, string>()
    for (const c of categories.value ?? []) {
      for (const p of c.problems) map.set(p.id, c.name)
    }
    return map
  })

  // CSES's own display order for each problem, keyed by id — used to sort a
  // week's problems within a category regardless of the order they were
  // picked in while planning (see plan.vue's `selected` map).
  const catalogOrder = computed(() => {
    const map = new Map<number, number>()
    let i = 0
    for (const c of categories.value ?? []) {
      for (const p of c.problems) map.set(p.id, i++)
    }
    return map
  })

  const selectedWeekId = ref<string | null>(null)

  watchEffect(() => {
    if (!selectedWeekId.value && weeks.value && weeks.value.length > 0) {
      selectedWeekId.value = weeks.value[0].id
    }
  })

  const forceRefresh = ref(false)

  const { data: progress, pending, refresh } = await useFetch<ProgressResponse>('/api/progress', {
    query: { week: selectedWeekId, force: forceRefresh },
    watch: [selectedWeekId],
  })

  const { data: notes, refresh: refreshNotes } = await useFetch<Record<string, Record<string, UserNote>>>('/api/notes')

  const week = computed(() => progress.value?.week ?? null)
  const users = computed(() => progress.value?.users ?? [])
  const staleSince = computed(() => progress.value?.staleSince ?? null)

  const solvedSets = computed(() => users.value.map((u) => new Set(u.solvedIds)))

  function solvedCountFor(index: number) {
    if (!week.value) return 0
    const set = solvedSets.value[index]
    return week.value.problems.filter((p) => set.has(p.id)).length
  }

  function isSolved(index: number, problemId: number) {
    return solvedSets.value[index]?.has(problemId) ?? false
  }

  const { data: submissions, refresh: refreshSubmissions } = await useFetch<SubmissionsResponse>('/api/submissions', {
    query: { week: selectedWeekId, force: forceRefresh },
    watch: [selectedWeekId],
  })

  const { data: problemStats, refresh: refreshProblemStats } = await useFetch<ProblemStatsResponse>(
    '/api/problem-stats',
    {
      query: { week: selectedWeekId, force: forceRefresh },
      watch: [selectedWeekId],
    },
  )

  const refreshing = ref(false)

  async function refreshAll() {
    refreshing.value = true
    forceRefresh.value = true
    try {
      await Promise.all([refresh(), refreshSubmissions(), refreshProblemStats(), refreshNotes()])
    } finally {
      forceRefresh.value = false
      refreshing.value = false
    }
  }

  interface ProblemInsight {
    firstSolverName: string | null
    fastestName: string | null
  }

  // Only credited when at least two tracked users have a comparable value —
  // "first" or "fastest" among a field of one isn't a meaningful callout.
  const problemInsights = computed(() => {
    const map = new Map<number, ProblemInsight>()
    for (const p of week.value?.problems ?? []) {
      const key = String(p.id)
      let firstSolverName: string | null = null
      let firstAcTime: string | null = null
      let solvedCount = 0
      let fastestName: string | null = null
      let fastestTime = Infinity
      let timedCount = 0

      for (const u of users.value) {
        const summary = submissions.value?.[key]?.[u.name]
        if (!summary?.unlocked || !summary.firstAcTime) continue
        solvedCount++
        if (firstAcTime === null || summary.firstAcTime < firstAcTime) {
          firstAcTime = summary.firstAcTime
          firstSolverName = u.name
        }
        const acEntry = summary.submissions.find((s) => s.verdict === 'AC')
        const execSeconds = acEntry ? Number.parseFloat(acEntry.execTime) : NaN
        if (!Number.isNaN(execSeconds)) {
          timedCount++
          if (execSeconds < fastestTime) {
            fastestTime = execSeconds
            fastestName = u.name
          }
        }
      }

      map.set(p.id, {
        firstSolverName: solvedCount >= 2 ? firstSolverName : null,
        fastestName: timedCount >= 2 ? fastestName : null,
      })
    }
    return map
  })

  function problemMeta(problemId: number) {
    const stats = problemStats.value?.[String(problemId)]
    if (!stats) return ''
    return `全站 ${stats.solvedBy.toLocaleString()} / ${stats.attemptedBy.toLocaleString()} 解出（${stats.successRate}%）`
  }

  function cellInfo(userIndex: number, problemId: number): CellInfo {
    const solved = isSolved(userIndex, problemId)
    const userName = users.value[userIndex]?.name
    const summary = submissions.value?.[String(problemId)]?.[userName]
    const insight = problemInsights.value.get(problemId)
    if (!summary) return { ...emptyCell, solved }
    return {
      solved,
      waCount: summary.waCount,
      locked: !summary.unlocked,
      clickable: solved && summary.unlocked,
      isFirstSolver: insight?.firstSolverName === userName,
      isFastest: insight?.fastestName === userName,
    }
  }

  const totalProblemCount = computed(() => (categories.value ?? []).reduce((sum, c) => sum + c.problems.length, 0))

  const groupedProblems = computed(() => {
    if (!week.value) return []
    const groups = new Map<string, typeof week.value.problems>()
    for (const p of week.value.problems) {
      const name = categoryByProblemId.value.get(p.id) ?? '其他'
      if (!groups.has(name)) groups.set(name, [])
      groups.get(name)!.push(p)
    }
    for (const group of groups.values()) {
      group.sort((a, b) => (catalogOrder.value.get(a.id) ?? 0) - (catalogOrder.value.get(b.id) ?? 0))
    }
    const order = (categories.value ?? []).map((c) => c.name)
    const ordered = order.filter((name) => groups.has(name)).map((name) => ({ name, problems: groups.get(name)! }))
    if (groups.has('其他')) ordered.push({ name: '其他', problems: groups.get('其他')! })
    return ordered
  })

  return {
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
    notes,
    refreshNotes,
    progress,
  }
}
