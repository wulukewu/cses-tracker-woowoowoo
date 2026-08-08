<script setup lang="ts">
import { ref } from 'vue'
import type { Week } from '~~/shared/types'

const props = defineProps<{
  weeksData: Week[]
  saving: boolean
  saveError: string
  saveSuccess: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [mode: 'merge' | 'overwrite']
}>()

const mode = ref<'merge' | 'overwrite'>('merge')
const overwriteConfirmText = ref('')
const OVERWRITE_PHRASE = '確認覆寫'

function handleConfirm() {
  if (mode.value === 'overwrite' && overwriteConfirmText.value !== OVERWRITE_PHRASE) {
    return
  }
  emit('confirm', mode.value)
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <h2>匯入次別資料</h2>

      <!-- 匯入成功狀態 -->
      <div v-if="saveSuccess" class="status-container success">
        <div class="status-icon">✓</div>
        <h3>匯入成功</h3>
        <p>已成功匯入 {{ weeksData.length }} 個次別的資料。</p>
        <div class="modal-actions">
          <button class="cf-btn" @click="emit('close')">關閉</button>
        </div>
      </div>

      <!-- 匯入失敗狀態 -->
      <div v-else-if="saveError" class="status-container error">
        <div class="status-icon">✗</div>
        <h3>匯入失敗</h3>
        <p class="error-msg">{{ saveError }}</p>
        <div class="modal-actions">
          <button class="cf-btn" @click="emit('close')">關閉</button>
        </div>
      </div>

      <!-- 進行中或準備匯入狀態 -->
      <div v-else>
        <p class="info-summary">
          已讀取檔案，內含 <strong>{{ weeksData.length }}</strong> 個次別。請選擇匯入模式：
        </p>

        <div class="mode-options">
          <label class="mode-option" :class="{ active: mode === 'merge' }">
            <input type="radio" v-model="mode" value="merge" :disabled="saving" />
            <div class="option-details">
              <strong>合併更新模式（建議）</strong>
              <span>保留現有次別，僅新增或覆蓋同 ID 的次別。不會遺失其他資料。</span>
            </div>
          </label>

          <label class="mode-option danger-option" :class="{ active: mode === 'overwrite' }">
            <input type="radio" v-model="mode" value="overwrite" :disabled="saving" />
            <div class="option-details">
              <strong>完全覆寫模式</strong>
              <span class="warning-text">清除目前所有次別，並以本檔案完全取代，無法復原！</span>
            </div>
          </label>
        </div>

        <!-- 覆寫防呆輸入框 -->
        <div v-if="mode === 'overwrite'" class="overwrite-confirm-box">
          <p>請輸入「<strong>{{ OVERWRITE_PHRASE }}</strong>」以確認執行危險操作：</p>
          <input
            v-model="overwriteConfirmText"
            type="text"
            class="confirm-input"
            autocomplete="off"
            :disabled="saving"
            placeholder="請在此輸入..."
          />
        </div>

        <div class="modal-actions">
          <button class="cf-btn" :disabled="saving" @click="emit('close')">取消</button>
          <button
            :class="mode === 'overwrite' ? 'cf-btn cf-btn--danger' : 'cf-btn'"
            :disabled="saving || (mode === 'overwrite' && overwriteConfirmText !== OVERWRITE_PHRASE)"
            @click="handleConfirm"
          >
            {{ saving ? '處理中...' : '確認匯入' }}
          </button>
        </div>
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
  max-width: 460px;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.modal-card h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cf-blue);
  margin: 0 0 1rem;
}

.info-summary {
  font-size: 0.88rem;
  color: var(--cf-text);
  margin-bottom: 1.2rem;
  line-height: 1.5;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.8rem;
  border: 1px solid var(--cf-border);
  cursor: pointer;
  /* CF-style: no animation */
}

.mode-option:hover {
  background: var(--cf-cell);
  border-color: var(--cf-text-muted);
}

.mode-option.active {
  border-color: var(--cf-text);
  background: var(--cf-cell);
}

.mode-option input[type="radio"] {
  margin-top: 0.2rem;
}

.option-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.option-details strong {
  font-size: 0.88rem;
}

.option-details span {
  font-size: 0.78rem;
  color: var(--cf-text-secondary);
  line-height: 1.4;
}

.danger-option.active {
  border-color: var(--cf-red);
  background: var(--cf-red-bg);
}

.warning-text {
  color: var(--cf-red) !important;
}

.overwrite-confirm-box {
  background: var(--cf-red-bg);
  border: 1px solid var(--cf-red);
  padding: 0.8rem;
  margin-bottom: 1.2rem;
}

.overwrite-confirm-box p {
  font-size: 0.8rem;
  color: var(--cf-red);
  margin: 0 0 0.5rem;
}

.confirm-input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  background: var(--cf-bg);
  border: 1px solid var(--cf-red);
  border-radius: var(--cf-radius);
  color: var(--cf-text);
  font-size: 0.85rem;
}

.confirm-input:focus {
  outline: none;
  border-color: var(--cf-red);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
}

/* 狀態顯示樣式 */
.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.8rem;
}

.status-container.success .status-icon {
  background: var(--cf-accent-bg);
  color: var(--cf-accent);
}

.status-container.error .status-icon {
  background: var(--cf-red-bg);
  color: var(--cf-red);
}

.status-container h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.status-container p {
  font-size: 0.85rem;
  color: var(--cf-text-secondary);
  margin: 0 0 1rem;
}

.error-msg {
  color: var(--cf-red) !important;
  word-break: break-all;
}

/* ---------- Responsive: mobile ---------- */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-card {
    padding: 1rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .modal-actions .cf-btn {
    width: 100%;
  }
}
</style>
