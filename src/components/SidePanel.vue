<script setup>
defineProps({
  info: Object
})
</script>

<template>
  <aside class="side">
    <template v-if="info">
      <h3>Изображение</h3>
      <div class="stat"><span>Формат</span><b>{{ info.format }}</b></div>
      <div class="stat"><span>Ширина</span><b>{{ info.width }} px</b></div>
      <div class="stat"><span>Высота</span><b>{{ info.height }} px</b></div>
      <div class="stat"><span>Пикселей</span><b>{{ (info.width * info.height).toLocaleString() }}</b></div>
      <div class="stat"><span>Байт RGBA</span><b>{{ (info.width * info.height * 4).toLocaleString() }}</b></div>
      <div class="stat"><span>Глубина</span><b>{{ info.colorDepth }} бит</b></div>
      <div class="stat"><span>Маска</span><b>{{ info.hasMask ? 'да' : 'нет' }}</b></div>
    </template>
    <p v-else class="hint">Нет изображения</p>
  </aside>
</template>

<style scoped>
.side {
  width: 220px;
  background: #252525;
  border-right: 1px solid #333;
  padding: 16px;
  color: #ccc;
  font: 12px/1.6 ui-monospace, monospace;
  overflow-y: auto;
}
h3 {
  font: 600 11px system-ui, sans-serif;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}
.stat { display: flex; justify-content: space-between; padding: 2px 0; }
.stat span { color: #777; }
.hint { color: #555; font-style: italic; }
</style>