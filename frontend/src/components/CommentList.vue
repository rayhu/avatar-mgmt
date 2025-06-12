<template>
  <div class="comment-list">
    <h3>评论区</h3>
    <!-- TODO: 展示评论列表，支持提交新评论 -->
    <ul>
      <li v-for="comment in comments" :key="comment.id">
        <strong>{{ comment.user }}</strong
        >: {{ comment.content }}
      </li>
    </ul>
    <form @submit.prevent="onSubmit">
      <input v-model="newComment" placeholder="写下你的评论..." />
      <button type="submit">提交</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const comments = ref([
  { id: 1, user: 'Alice', content: '很棒的模型！' },
  { id: 2, user: 'Bob', content: '动画很流畅。' },
]);
const newComment = ref('');
function onSubmit() {
  if (newComment.value.trim()) {
    comments.value.push({ id: Date.now(), user: 'You', content: newComment.value });
    newComment.value = '';
  }
}
</script>

<style scoped>
.comment-list {
  margin-top: 24px;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 8px;
}
form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
input {
  flex: 1;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
button {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  background: #42b883;
  color: #fff;
  cursor: pointer;
}
</style>
