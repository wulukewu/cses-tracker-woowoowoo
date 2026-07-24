<script setup lang="ts">
import type { UserProgress, Week } from '~~/shared/types'

const props = defineProps<{
  week: Week
  users: UserProgress[]
  solvedCountFor: (index: number) => number
}>()

const emit = defineEmits<{ openProfile: [index: number] }>()

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
          <button type="button" class="user-btn" @click="emit('openProfile', entry.index)">
            <LayoutCfHandle :name="entry.user.name" />
          </button>
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
  background: #fff;
  font-size: 0.8rem;
  color: var(--cf-text-secondary);
}

.standings-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--cf-sep);
  vertical-align: middle;
  background: #fff;
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
  color: var(--cf-accent);
  text-decoration: underline;
}

.bar-track {
  display: block;
  height: 6px;
  border-radius: 3px;
  background: var(--cf-sep);
  overflow: hidden;
  max-width: 180px;
}

.bar-fill {
  display: block;
  height: 100%;
  background: var(--cf-accent);
  transition: width 0.2s ease;
}
</style>
