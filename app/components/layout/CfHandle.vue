<script setup lang="ts">
import { useProfileModal } from '~/composables/useProfileModal'

const props = defineProps<{
  name: string
  truncate?: boolean
}>()

const style = computed(() => handleStyle(props.name))
const firstChar = computed(() => (style.value.legendary ? props.name.slice(0, 1) : ''))
const restChars = computed(() => (style.value.legendary ? props.name.slice(1) : props.name))

const { openProfile } = useProfileModal()

function handleClick() {
  openProfile(props.name)
}
</script>

<template>
  <button
    type="button"
    class="cf-handle"
    :class="{ truncated: truncate }"
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
.cf-handle.truncated {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.cf-handle-first {
  color: var(--cf-text);
}
</style>
