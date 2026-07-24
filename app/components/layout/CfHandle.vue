<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{ name: string }>()

const style = computed(() => handleStyle(props.name))
const firstChar = computed(() => (style.value.legendary ? props.name.slice(0, 1) : ''))
const restChars = computed(() => (style.value.legendary ? props.name.slice(1) : props.name))

const viewProfile = inject<(name: string) => void>('viewProfile', null)

function handleClick() {
  viewProfile?.(props.name)
}
</script>

<template>
  <button
    type="button"
    class="cf-handle"
    :title="`${style.title} · ${style.rating}`"
    @click="handleClick"
  >
    <span v-if="firstChar" class="cf-handle-first">{{ firstChar }}</span><span :style="{ color: style.color }">{{ restChars }}</span>
  </button>
</template>

<style scoped>
.cf-handle {
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}
.cf-handle:hover {
  text-decoration: underline;
}
.cf-handle-first {
  color: var(--cf-text);
}
</style>
