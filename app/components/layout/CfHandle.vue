<script setup lang="ts">
const props = defineProps<{ name: string }>()

const style = computed(() => handleStyle(props.name))
// Legendary Grandmaster renders the first character black, the rest in colour.
const firstChar = computed(() => (style.value.legendary ? props.name.slice(0, 1) : ''))
const restChars = computed(() => (style.value.legendary ? props.name.slice(1) : props.name))
</script>

<template>
  <span class="cf-handle" :title="`${style.title} · ${style.rating}`">
    <span v-if="firstChar" class="cf-handle-first">{{ firstChar }}</span><span :style="{ color: style.color }">{{ restChars }}</span>
  </span>
</template>

<style scoped>
.cf-handle {
  font-weight: 700;
  white-space: nowrap;
}
.cf-handle-first {
  color: #000000;
}
.cf-handle:hover {
  text-decoration: underline;
}
</style>
