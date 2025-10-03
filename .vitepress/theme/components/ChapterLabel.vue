<script setup>
defineProps({
  label: {
    type: String,
    default: 'chapter',
  },
  bgColor: {
    type: String,
    default: 'var(--bg-medium-blue)'
  }
})
</script>

<template>
  <span class="label" :style="{backgroundColor: bgColor}">{{ label }}</span>
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
