<script setup lang="ts">
const {
  weeks,
  editingWeek,
  search,
  selected,
  deadline,
  saving,
  saveError,
  saveSuccess,
  usedIds,
  filteredCategories,
  selectedCount,
  toggle,
  cancelEdit,
  deleting,
  deleteArmed,
  handleDeleteClick,
  showResetModal,
  resetConfirmText,
  resetting,
  RESET_PHRASE,
  openResetModal,
  closeResetModal,
  confirmResetAll,
  save,
  exportWeeks,
} = await useWeekPlanner()
</script>

<template>
  <div class="plan-page">
    <div class="plan-header">
      <div>
        <h2 v-if="editingWeek">
          編輯這次{{ editingWeek.deadline ? `（${formatDate(editingWeek.deadline)}）` : '' }}
        </h2>
        <h2 v-else>規劃下次題目</h2>
        <div class="header-links">
          <button v-if="editingWeek" class="cancel-edit-btn" @click="cancelEdit">取消編輯，改為新增下一次</button>
          <button v-if="editingWeek" class="delete-week-btn" :disabled="deleting" @click="handleDeleteClick">
            {{ deleting ? '刪除中...' : deleteArmed ? '確定要刪除？再按一次' : '刪除這次' }}
          </button>
        </div>
      </div>
      <div class="header-actions">
        <button class="export-btn" @click="exportWeeks">匯出所有資料</button>
        <button class="reset-btn" @click="openResetModal">重置所有次別</button>
      </div>
    </div>

    <input v-model="search" class="search-input" type="text" placeholder="搜尋題目名稱..." />

    <PlanProblemPicker :categories="filteredCategories" :used-ids="usedIds" :selected="selected" @toggle="toggle" />

    <div class="plan-footer">
      <div class="footer-row">
        <span>已選 {{ selectedCount }} 題</span>
        <label class="deadline-label">
          截止日期
          <input v-model="deadline" type="date" />
        </label>
      </div>
      <button class="save-btn" :disabled="saving || selectedCount === 0" @click="save">
        {{ saving ? '儲存中...' : editingWeek ? '更新這次' : '存檔' }}
      </button>
      <p v-if="saveSuccess" class="save-success">{{ editingWeek ? '已更新這次！' : '已儲存新的一次！' }}</p>
      <p v-if="saveError" class="save-error">{{ saveError }}</p>
    </div>

    <PlanResetAllModal
      v-if="showResetModal"
      :weeks-count="weeks?.length ?? 0"
      :reset-phrase="RESET_PHRASE"
      :reset-confirm-text="resetConfirmText"
      :resetting="resetting"
      @close="closeResetModal"
      @confirm="confirmResetAll"
      @update:reset-confirm-text="resetConfirmText = $event"
    />
  </div>
</template>

<style scoped>
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.plan-header h2 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.3rem;
}

.header-links {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.cancel-edit-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--cs-text-secondary);
  font-size: 0.82rem;
  cursor: pointer;
}

.delete-week-btn {
  background: none;
  border: none;
  padding: 0;
  color: #b3261e;
  font-size: 0.82rem;
  cursor: pointer;
}

.delete-week-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.export-btn {
  padding: 0.45rem 0.8rem;
  background: var(--cs-bg);
  color: var(--cs-text);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.export-btn:hover {
  border-color: #ccc;
}

.reset-btn {
  padding: 0.45rem 0.8rem;
  background: var(--cs-bg);
  color: #b3261e;
  border: 1px solid #f0c4bf;
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.reset-btn:hover {
  background: #fdf1f0;
}

.search-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius);
  color: var(--cs-text);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.plan-footer {
  position: sticky;
  bottom: 0;
  background: var(--cs-bg);
  border-top: 1px solid var(--cs-border);
  padding: 1rem 0 0.5rem;
  margin-top: 1.5rem;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.deadline-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--cs-text-secondary);
}

.deadline-label input {
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  color: var(--cs-text);
  border-radius: var(--cs-radius);
  padding: 0.3rem 0.5rem;
}

.save-btn {
  padding: 0.55rem 1.1rem;
  background: var(--cs-text);
  color: var(--cs-bg);
  border: none;
  border-radius: var(--cs-radius);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.save-success {
  color: var(--cs-accent);
  font-size: 0.85rem;
}

.save-error {
  color: #b3261e;
  font-size: 0.85rem;
}
</style>
