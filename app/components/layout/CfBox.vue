<script setup lang="ts">
defineProps<{
  /** caption text; omit for a caption-less box */
  title?: string
  /** drop body padding (for tables / edge-to-edge lists) */
  flush?: boolean
  /** center the caption with Codeforces-style em-dashes */
  dashed?: boolean
}>()
</script>

<template>
  <div class="cf-box">
    <div v-if="title || $slots.title" class="cf-box-caption" :class="{ dashed }">
      <span class="cf-box-caption-inner"><slot name="title">{{ title }}</slot></span>
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
  background: var(--cs-bg);
  border: 1px solid var(--cf-box-border);
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.cf-box-caption {
  padding: 0.5rem 1rem;
  background: var(--cf-caption-bg);
  border-bottom: 1px solid var(--cf-box-border);
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--cs-text);
}

.cf-box-caption.dashed {
  text-align: center;
  position: relative;
}

.cf-box-caption.dashed .cf-box-caption-inner {
  position: relative;
  padding: 0 0.6rem;
}

.cf-box-caption.dashed::before,
.cf-box-caption.dashed::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 22%;
  border-top: 1px dashed var(--cf-box-border);
}

.cf-box-caption.dashed::before { left: 1rem; }
.cf-box-caption.dashed::after { right: 1rem; }

.cf-box-body {
  padding: 0.85rem 1rem;
}

.cf-box-body.flush {
  padding: 0;
}

.cf-box-footer {
  padding: 0.5rem 1rem;
  background: var(--cf-caption-bg);
  border-top: 1px solid var(--cf-box-border);
  font-size: 0.82rem;
}
</style>
