<template>
  <div class="env-test">
    <h1>🌍 环境测试页面</h1>
    
    <div class="env-info">
      <h2>环境信息</h2>
      <pre>{{ envInfo }}</pre>
    </div>
    
    <div class="api-test">
      <h2>API 测试</h2>
      <button @click="testApi">测试 API 连接</button>
      <button @click="testDirectus">测试 Directus 连接</button>
      
      <div v-if="apiResult" class="result">
        <h3>API 结果:</h3>
        <pre>{{ apiResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { debugEnv, getEnvConfig } from '@/config/env';
import { buildApiUrl, buildDirectusUrl } from '@/config/api';

const envInfo = ref('');
const apiResult = ref('');

onMounted(() => {
  // 显示环境信息
  const env = getEnvConfig();
  envInfo.value = JSON.stringify({
    mode: env.mode,
    apiBaseUrl: env.apiBaseUrl,
    directusBaseUrl: env.directusBaseUrl,
    frontendBaseUrl: env.frontendBaseUrl,
    viteEnv: {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      BASE_URL: import.meta.env.BASE_URL,
    }
  }, null, 2);
  
  // 调用调试函数
  debugEnv();
});

async function testApi() {
  try {
    const url = buildApiUrl('/health');
    const response = await fetch(url);
    const data = await response.text();
    
    apiResult.value = `API 测试结果:
URL: ${url}
Status: ${response.status}
Response: ${data}`;
  } catch (error) {
    apiResult.value = `API 测试失败:
Error: ${error}`;
  }
}

async function testDirectus() {
  try {
    const url = buildDirectusUrl('/');
    const response = await fetch(url);
    const data = await response.text();
    
    apiResult.value = `Directus 测试结果:
URL: ${url}
Status: ${response.status}
Response: ${data.substring(0, 200)}...`;
  } catch (error) {
    apiResult.value = `Directus 测试失败:
Error: ${error}`;
  }
}
</script>

<style scoped>
.env-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.env-info, .api-test {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

button {
  margin: 5px;
  padding: 8px 16px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #369870;
}

.result {
  margin-top: 15px;
  padding: 10px;
  background: #f0f8ff;
  border-radius: 4px;
}
</style> 
