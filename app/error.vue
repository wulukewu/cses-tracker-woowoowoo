<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 500)
const message = computed(() => {
  if (props.error?.message) return props.error.message
  if (statusCode.value === 404) return '查無此頁'
  return '伺服器錯誤'
})
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">{{ statusCode }}</div>
      <h1 class="error-title">{{ message }}</h1>
      <p class="error-desc">
        <template v-if="statusCode === 404">
          你可能輸入錯誤的網址，或是這個頁面已經被移除了。
        </template>
        <template v-else>
          請稍後再試，或回報此問題。
        </template>
      </p>
      <div class="error-actions">
        <NuxtLink to="/" class="cf-btn">回到首頁</NuxtLink>
      </div>
    </div>
    <footer class="cf-footer-text">
      CSES Tracker
    </footer>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.error-card {
  text-align: center;
  border: 1px solid var(--cf-border);
  background: #fff;
  padding: 2.5rem 3rem;
  max-width: 420px;
  width: 100%;
}

.error-code {
  font-size: 4rem;
  font-weight: 700;
  color: var(--cf-blue);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.error-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--cf-text);
}

.error-desc {
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
  margin: 0 0 1.5rem;
  line-height: 1.55;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}

.cf-footer-text {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: var(--cf-text-muted);
}
</style>
