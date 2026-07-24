<script setup lang="ts">
defineProps<{
  weeksCount: number
  resetPhrase: string
  resetConfirmText: string
  resetting: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  'update:resetConfirmText': [value: string]
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <h2>重置所有次別</h2>
      <p>
        這會刪除全部 {{ weeksCount }} 個次別的題目與截止日期，無法復原。建議先按「匯出所有資料」備份。
      </p>
      <p>
        請輸入「<strong>{{ resetPhrase }}</strong>」以確認：
      </p>
      <input
        :value="resetConfirmText"
        type="text"
        class="reset-confirm-input"
        autocomplete="off"
        @input="emit('update:resetConfirmText', ($event.target as HTMLInputElement).value)"
      />
      <div class="modal-actions">
        <button class="cf-btn" @click="emit('close')">取消</button>
        <button
          class="cf-btn cf-btn--danger"
          :disabled="resetConfirmText !== resetPhrase || resetting"
          @click="emit('confirm')"
        >
          {{ resetting ? '刪除中...' : '確認刪除全部' }}
        </button>
      </div>
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
  padding: 1.25rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.modal-card h2 {
  font-size: 1.05rem;
  color: var(--cf-blue);
  margin: 0 0 0.75rem;
}

.modal-card p {
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.reset-confirm-input {
  width: 100%;
  padding: 0.5rem 0.7rem;
  background: var(--cf-bg);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius);
  color: var(--cf-text);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

</style>
