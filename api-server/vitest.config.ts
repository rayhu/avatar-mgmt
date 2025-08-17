import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 全局变量
    globals: true,
    
    // 测试文件匹配模式 - 所有已迁移到Vitest的测试
    include: [
      'tests/handlers/auth.test.ts',
      'tests/handlers/avatar-management.test.ts',
      'tests/handlers/avatars.test.ts',
      'tests/handlers/assets.test.ts',
      'tests/handlers/version.test.ts',
      'tests/handlers/azure-tts.test.ts',
      'tests/handlers/generate-ssml.test.ts',
      'tests/handlers/openai-ssml.test.ts',
      'tests/utils/ssml-validator.test.ts',
      'tests/utils/response-builder.test.ts',
      'tests/utils/voice-styles-manager.test.ts',
      'tests/utils/openai-ssml-generator.test.ts'
    ],
    
    // 排除文件
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      // 所有测试都已迁移到Vitest！
    ],
    
    // 覆盖率配置
    coverage: {
      enabled: false, // 暂时禁用覆盖率以避免配置问题
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'handlers/**/*.ts',
        'utils/**/*.ts',
        'middleware/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'node_modules/**',
        '**/*.d.ts',
        'coverage/**'
      ]
    },
    
    // 测试超时
    testTimeout: 10000,
    
    // 并发配置
    threads: true,
    maxThreads: 4,
    
    // 监视模式配置
    watch: false,
    
    // 详细输出
    reporter: ['verbose'],
    
    // 模拟配置
    clearMocks: true,
    restoreMocks: true,
    
    // 设置文件
    setupFiles: ['./tests/setup.ts']
  }
});
