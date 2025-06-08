<template>
  <button :class="{ liked }" @click="toggleLike">
    {{ liked ? '已点赞' : '点赞' }} ({{ count }})
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const liked = ref(false);
const count = ref(42);
function toggleLike() {
  liked.value = !liked.value;
  count.value += liked.value ? 1 : -1;
}
</script>

<style scoped>
button {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  background: #eee;
  color: #222;
  cursor: pointer;
  margin-left: 8px;
}
button.liked {
  background: #42b883;
  color: #fff;
}
</style> 