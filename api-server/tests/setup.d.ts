/**
 * Jest 测试类型声明文件
 */

declare global {
  var testUtils: {
    createMockRequest: (overrides?: any) => any;
    createMockResponse: () => any;
    waitFor: (ms: number) => Promise<void>;
    createMockError: (message: string, statusCode?: number) => any;
  };
}

export {};
