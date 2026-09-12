<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  open: Boolean,
  title: String,
  maxWidth: { type: String, default: '480px' }
})
const emit = defineEmits(['close'])

const dialogRef = ref(null)

watch(() => props.open, async (val) => {
  await nextTick()
  const dlg = dialogRef.value
  if (!dlg) return
  if (val && !dlg.open) dlg.showModal()
  else if (!val && dlg.open) dlg.close()
})

function onClose() {
  emit('close')
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="base-dialog"
    :style="{ maxWidth }"
    @close="onClose"
    @cancel.prevent="onClose"
  >
    <div class="dialog-content">
      <header>
        <h2>{{ title }}</h2>
        <button class="close-btn" @click="onClose">×</button>
      </header>

      <div class="dialog-body">
        <slot />
      </div>

      <footer>
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.base-dialog {
  border: none;
  border-radius: 8px;
  background: #252525;
  color: #ddd;
  padding: 0;
  width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.base-dialog::backdrop {
  background: rgba(0,0,0,0.6);
}

.dialog-content {
  padding: 16px 20px 20px;
  font: 13px system-ui, sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover { color: #fff; }

.dialog-body {
  max-height: 70vh;
  overflow-y: auto;
}

footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #333;
}
footer :deep(button) {
  background: #2d2d2d;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 13px;
}
footer :deep(button:hover:not(:disabled)) {
  background: #3a3a3a;
}
footer :deep(button:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}
footer :deep(button.primary) {
  background: #4fc3f7;
  color: #000;
  border-color: #4fc3f7;
}
footer :deep(button.primary:hover:not(:disabled)) {
  background: #63cdfa;
}
footer :deep(.spacer) {
  flex: 1;
}
</style>