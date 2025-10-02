<script setup>
defineProps({
  label: {
    type: String
  }
})
</script>

<template>
  <span class="chapter-label">{{ label }}</span>
</template>

<style scoped>
.chapter-label {
  display: inline-block;
  color: white;
  background-color: #7954FF;
  border: none;
  padding: 0 10px 2px 8px;
  border-radius: 12px;
  user-select: none;
  margin-bottom: 20px;
  font-size: 0.9em;
}
</style>
