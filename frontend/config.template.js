// 配置模板文件
// 这个文件会在容器启动时被启动脚本替换为实际的配置

window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
  DIRECTUS_BASE_URL: 'http://localhost:8055',
  APP_ENV: 'staging',
  APP_TITLE: 'Avatar Management System',
  APP_DESCRIPTION: 'Avatar Management and Animation System',
  FEATURE_ANIMATION: true,
  FEATURE_UPLOAD: true,
  FEATURE_SHARING: true,
  DEBUG: false,
  BUILD_TIME: '2025-08-01T00:00:00Z',
};
