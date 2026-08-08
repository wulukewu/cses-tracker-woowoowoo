<script setup lang="ts">
import type { ProblemCategory, ProgressResponse, UserProgress } from '~~/shared/types'
import problems from '~~/server/data/problems.json'

const props = defineProps<{
  userName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { data: prog } = useFetch<ProgressResponse | null>('/api/progress', {
  server: false,
  default: () => null,
})

const categories = ref(problems as ProblemCategory[])

const totalProblemCount = computed(() =>
  (categories.value ?? []).reduce((sum, c) => sum + c.problems.length, 0),
)

const user = computed<UserProgress | null>(() => {
  if (!prog.value?.users) return null
  return prog.value.users.find((u) => u.name === props.userName) ?? null
})

const solvedIds = computed(() => new Set(user.value?.solvedIds ?? []))
const totalSolved = computed(() => solvedIds.value.size)

const categoryProgress = computed(() =>
  (categories.value ?? []).map((c) => ({
    name: c.name,
    problems: c.problems,
    solvedCount: c.problems.filter((p) => solvedIds.value.has(p.id)).length,
  })),
)

const expandedCategories = ref<Set<string>>(new Set())
function toggleCategory(name: string) {
  const next = new Set(expandedCategories.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  expandedCategories.value = next
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div v-if="user" class="modal-card profile-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>{{ user.name }}</h2>
        <button type="button" class="modal-close" aria-label="關閉" @click="emit('close')">✕</button>
      </div>

      <div class="profile-summary">
        <div class="profile-total">
          <span class="profile-total-count">{{ totalSolved }}</span>
          <span class="profile-total-label">/ {{ totalProblemCount }} 題已解出</span>
        </div>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: `${totalProblemCount ? (totalSolved / totalProblemCount) * 100 : 0}%` }"
          />
        </div>
        <a
          class="profile-cses-link"
          :href="`https://cses.fi/problemset/user/${user.csesId}/`"
          target="_blank"
          rel="noopener"
        >在 CSES 上查看 →</a>
      </div>

      <ul class="profile-category-list">
        <li v-for="c in categoryProgress" :key="c.name" class="profile-category">
          <button type="button" class="profile-category-header" @click="toggleCategory(c.name)">
            <span class="profile-category-name">{{ c.name }}</span>
            <span class="profile-category-count">{{ c.solvedCount }} / {{ c.problems.length }}</span>
          </button>
          <div class="progress-bar-track category-track">
            <div
              class="progress-bar-fill"
              :style="{ width: `${c.problems.length ? (c.solvedCount / c.problems.length) * 100 : 0}%` }"
            />
          </div>
          <ul v-if="expandedCategories.has(c.name)" class="profile-problem-list">
            <li
              v-for="p in c.problems"
              :key="p.id"
              class="profile-problem-row"
              :class="{ solved: solvedIds.has(p.id) }"
            >
              <span class="profile-problem-mark">{{ solvedIds.has(p.id) ? '✓' : '–' }}</span>
              <a class="profile-problem-name" :href="`https://cses.fi/problemset/task/${p.id}/`" target="_blank" rel="noopener">{{ p.name }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.modal-card {
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.modal-header h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cf-blue);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cf-text-secondary);
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem;
}

.progress-bar-track {
  height: 6px;
  border-radius: 0;
  background: var(--cf-sep);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--cf-accent);
  /* CF-style: no animation */
}

.profile-card {
  max-width: 480px;
  max-height: 85vh;
}

.profile-summary {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--cf-sep);
}

.profile-total {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
}

.profile-total-count {
  font-size: 1.3rem;
  font-weight: 700;
}

.profile-total-label {
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
}

.profile-cses-link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--cf-text-secondary);
  text-decoration: none;
}

.profile-cses-link:hover {
  color: var(--cf-link);
  text-decoration: underline;
}

.profile-category-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.profile-category {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--cf-sep);
}

.profile-category:last-child {
  border-bottom: none;
}

.profile-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0.15rem 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.profile-category-name {
  font-weight: 600;
  font-size: 0.88rem;
}

.profile-category-count {
  font-size: 0.8rem;
  color: var(--cf-text-secondary);
  flex-shrink: 0;
}

.category-track {
  margin-top: 0.3rem;
  height: 4px;
}

.profile-problem-list {
  list-style: none;
  margin: 0.5rem 0 0.25rem;
  padding: 0;
}

.profile-problem-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.85rem;
  color: var(--cf-text-muted);
}

.profile-problem-row.solved {
  color: var(--cf-text);
}

.profile-problem-mark {
  width: 1rem;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--cf-text-muted);
  text-align: center;
}

.profile-problem-row.solved .profile-problem-mark {
  color: var(--cf-accent);
}

.profile-problem-name {
  color: inherit;
  text-decoration: none;
}

.profile-problem-name:hover {
  text-decoration: underline;
}

/* ---------- Responsive: mobile ---------- */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-card {
    padding: 1rem 0.85rem;
  }
}
</style>
