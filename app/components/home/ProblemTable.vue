<script setup lang="ts">
import type { UserProgress, WeekProblem, UserNote } from '~~/shared/types'
import type { CellInfo } from '~/composables/useHomeProgress'

const props = defineProps<{
  users: UserProgress[]
  groupedProblems: { name: string; problems: WeekProblem[] }[]
  cellInfo: (userIndex: number, problemId: number) => CellInfo
  problemMeta: (problemId: number) => string
  notes: Record<string, Record<string, UserNote>>
}>()

const emit = defineEmits<{
  openModal: [problem: WeekProblem, userName: string]
}>()

// Cache all cellInfo objects in a single computed map, eliminating raw function calls inside template loops.
const cellInfoMap = computed(() => {
  const map: Record<string, Record<string, CellInfo>> = {}
  for (const group of props.groupedProblems) {
    for (const p of group.problems) {
      const pid = String(p.id)
      map[pid] = {}
      for (let i = 0; i < props.users.length; i++) {
        const u = props.users[i]
        map[pid][u.name] = props.cellInfo(i, p.id)
      }
    }
  }
  return map
})
</script>

<template>
  <section class="problem-table-wrap">
    <table class="problem-table">
      <thead>
        <tr>
          <th class="col-problem">題目</th>
          <th v-for="u in users" :key="u.csesId" class="col-user">
            <LayoutCfHandle :name="u.name" truncate />
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
              <a class="problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" :title="p.name" target="_blank" rel="noopener">{{ p.name }}</a>
            </div>
            <div v-if="problemMeta(p.id)" class="problem-meta">{{ problemMeta(p.id) }}</div>
          </td>
          <td v-for="(u, i) in users" :key="u.csesId" class="col-user">
            <span class="user-cell-label">{{ u.name }}</span>
            <HomeProblemCell
              :user="u"
              :problem="p"
              :info="cellInfoMap[String(p.id)]?.[u.name]"
              :has-note="Boolean(notes?.[String(p.id)]?.[u.name]?.content?.trim())"
              :has-stuck="Boolean(notes?.[String(p.id)]?.[u.name]?.stuck)"
              @click="emit('openModal', p, u.name)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.problem-table-wrap {
  border: 1px solid var(--cf-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.problem-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  table-layout: fixed;
}

.problem-table thead tr {
  background: var(--cf-cell);
  border-bottom: 1px solid var(--cf-border);
}

.problem-table th {
  text-align: left;
  font-weight: 700;
  color: var(--cf-text);
  padding: 0.6rem 1rem;
}

.problem-table td {
  padding: 0.55rem 1rem;
  border-bottom: 1px solid var(--cf-sep);
  vertical-align: middle;
}

.problem-table tbody:last-child tr:last-child td {
  border-bottom: none;
}

/* Codeforces-style section header row */
.category-row td {
  background: var(--cf-cell);
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--cf-sep);
}

.category-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-indicator {
  width: 3px;
  height: 12px;
  background: var(--cf-blue);
  border-radius: 0;
}

.category-name {
  color: var(--cf-blue);
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}

.col-problem {
  width: 40%;
}

.problem-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow: hidden;
}

.problem-id-tag {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--cf-text-secondary);
  background: var(--cf-cell);
  border: 1px solid var(--cf-border);
  padding: 0.08rem 0.3rem;
  border-radius: 1px;
  flex-shrink: 0;
}

.problem-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  text-decoration: none;
  font-weight: 500;
  color: var(--cf-text);
}

.problem-name:hover {
  color: var(--cf-link);
  text-decoration: underline;
}

.problem-meta {
  display: none;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  color: var(--cf-text-secondary);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1100px) {
  .problem-meta {
    display: block;
  }
}

.col-user {
  width: 15%;
  text-align: center !important;
  padding: 0.5rem !important;
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
  color: var(--cf-link);
  text-decoration: underline;
}

/* 行動裝置專用的人員標籤（手機卡牌式時才顯示） */
.user-cell-label {
  display: none;
}

/* ---------- Responsive: mobile ---------- */
@media (max-width: 640px) {
  /* 卡牌式：把多欄表格改成「卡片」，每個問題一張卡，包含整行題名與一列
     四人狀態格；徹底擺脫固定欄寬（240px + 4×75px）造成的橫向捲動。 */
  .problem-table,
  .problem-table tbody,
  .problem-table tbody tr {
    display: block;
    width: 100%;
  }

  .problem-table {
    table-layout: auto;
    font-size: 0.75rem;
  }

  .problem-table thead {
    display: none;
  }

  .problem-table td {
    padding: 0;
    border-bottom: none;
    width: auto;
    background: var(--cf-bg);
  }

  .category-row td {
    display: block;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--cf-sep);
    background: var(--cf-cell);
  }

  .problem-table tbody tr:not(.category-row) {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    padding: 0.6rem 0.5rem;
    border-bottom: 1px solid var(--cf-sep);
  }

  .problem-table tr:not(.category-row) td.col-problem {
    grid-column: 1 / -1;
    border-bottom: 1px solid var(--cf-sep);
    padding: 0 0 0.4rem;
    min-width: 0;
  }

  .problem-table tr:not(.category-row) td.col-user {
    width: auto !important;
    padding: 0 !important;
    min-width: 0;
  }

  .problem-title-row {
    overflow: visible;
    flex-wrap: wrap;
  }

  .problem-name {
    white-space: normal;
    overflow-wrap: anywhere;
    font-size: 0.78rem;
  }

  .user-cell-label {
    display: block;
    font-size: 0.6rem;
    color: var(--cf-text-secondary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 0.15rem;
  }

  .problem-id-tag {
    font-size: 0.62rem;
    padding: 0.05rem 0.2rem;
  }

  .category-name {
    font-size: 0.72rem;
  }

  /* 最後一組的最後一張卡不要殘留分隔線 */
  .problem-table tbody:last-child tr:last-child {
    border-bottom: none;
  }
}
</style>
