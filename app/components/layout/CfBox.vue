<script setup lang="ts">
defineProps<{
  /** caption text; omit for a caption-less box */
  title?: string
  /** drop body padding (for tables / edge-to-edge lists) */
  flush?: boolean
}>()
</script>

<template>
  <div class="cf-box">
    <div v-if="title || $slots.title" class="cf-box-caption">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="cf-box-body" :class="{ flush }">
      <slot />
    </div>
    <div v-if="$slots.footer" class="cf-box-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.cf-box {
  background: #ffffff;
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
  margin-bottom: 1.1rem;
  overflow: hidden;
}

.cf-box-caption {
  padding: 0.55rem 0.5rem 0.5rem 0.75rem;
  border-bottom: 1px solid var(--cf-border);
  font-weight: 700;
  font-size: 1.03rem;
  color: var(--cf-blue);
}

.cf-box-body {
  padding: 0.7rem 0.75rem;
}

.cf-box-body.flush {
  padding: 0;
}

.cf-box-footer {
  padding: 0.45rem 0.75rem;
  background: var(--cf-cell);
  border-top: 1px solid var(--cf-sep);
  font-size: 0.85rem;
}
</style>
