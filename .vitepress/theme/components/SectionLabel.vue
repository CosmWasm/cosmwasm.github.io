<script setup>
defineProps({
  chapter: {
    type: String,
    default: 'chapter',
  },
  section: {
    type: String,
    default: 'section',
  },
  bgChapter: {
    type: String,
    default: 'var(--bg-medium-blue)'
  },
  bgSection: {
    type: String,
    default: 'var(--bg-persian-pink)'
  }
})
</script>

<template>
  <span class="label" :style="{backgroundColor: bgChapter}">{{ chapter }}</span>
  <span class="label" :style="{backgroundColor: bgSection}">{{ section }}</span>
</template>

<style scoped>
.label {
  display: inline-block;
  color: white;
  border: none;
  padding: 2px 10px 2px 8px;
  border-radius: 12px;
  user-select: none;
  margin: 0 4px 20px 0;
  font-size: 0.9em;
}
</style>
