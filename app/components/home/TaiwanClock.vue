<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const now = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function update() {
  const d = new Date()
  now.value = d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

onMounted(() => {
  update()
  timer = setInterval(update, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="cf-clock">
    <div class="clock-label">Taipei 時間</div>
    <div class="clock-time">{{ now }}</div>
  </div>
</template>

<style scoped>
.cf-clock {
  padding: 0.35rem 0.5rem;
}

.clock-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cf-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clock-time {
  font-size: 1rem;
  font-weight: 700;
  color: var(--cf-blue);
  font-variant-numeric: tabular-nums;
  margin-top: 0.15rem;
}
</style>