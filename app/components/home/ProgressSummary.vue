<script setup lang="ts">
import type { UserProgress, Week } from '~~/shared/types'

const props = defineProps<{
  week: Week
  users: UserProgress[]
  solvedCountFor: (index: number) => number
}>()

const sorted = computed(() => {
  return props.users
    .map((u, i) => ({ user: u, solved: props.solvedCountFor(i), index: i }))
    .sort((a, b) => b.solved - a.solved)
})
</script>

<template>
  <table class="standings-table">
    <thead>
      <tr>
        <th class="col-rank">#</th>
        <th class="col-user">使用者</th>
        <th class="col-solved">解題數</th>
        <th class="col-bar"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(entry, rank) in sorted" :key="entry.user.csesId">
        <td class="col-rank">{{ rank + 1 }}</td>
        <td class="col-user">
            <LayoutCfHandle :name="entry.user.name" />
        </td>
        <td class="col-solved">{{ entry.solved }} / {{ week.problems.length }}</td>
        <td class="col-bar">
          <span class="bar-track">
            <span class="bar-fill" :style="{ width: `${week.problems.length ? (entry.solved / week.problems.length) * 100 : 0}%` }" />
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.standings-table th {
  font-weight: 700;
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--cf-border);
  background: var(--cf-bg);
  font-size: 0.8rem;
  color: var(--cf-text-secondary);
}

.standings-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  vertical-align: middle;
  background: var(--cf-bg);
}

.standings-table tbody tr:nth-child(odd) td {
  background: var(--cf-cell);
}

.standings-table tbody tr:last-child td {
  border-bottom: none;
}

.col-rank {
  width: 1.8rem;
  text-align: center;
  color: var(--cf-text-secondary);
}

.col-user {
  width: 10rem;
}

.col-solved {
  width: 5rem;
  font-weight: 700;
  color: var(--cf-text-secondary);
}

.user-btn {
  font: inherit;
  font-weight: 600;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.user-btn:hover {
  color: var(--cf-link);
  text-decoration: underline;
}

.bar-track {
  display: block;
  height: 6px;
  border-radius: 0;
  background: var(--cf-sep);
  overflow: hidden;
  max-width: 180px;
}

.bar-fill {
  display: block;
  height: 100%;
  background: var(--cf-accent);
}

/* ---------- Responsive: mobile ---------- */
@media (max-width: 640px) {
  .standings-table {
    font-size: 0.78rem;
  }

  .standings-table th {
    padding: 0.25rem 0.35rem;
    font-size: 0.72rem;
  }

  .standings-table td {
    padding: 0.3rem 0.35rem;
  }

  .col-user {
    width: 6rem;
  }

  .col-solved {
    width: 3.5rem;
    font-size: 0.75rem;
  }

  .bar-track {
    max-width: 100px;
  }
}
</style>
