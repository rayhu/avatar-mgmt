export interface Avatar {
  id: string;
  name: string;
  description: string;
  url: string;
  preview?: string;
  previewUrl?: string;
  status: 'draft' | 'pending' | 'processing' | 'ready' | 'error' | 'deleted';
  tags: string[];
  version?: string; // 模型版本号
  createdAt: string;
  updatedAt: string;
  createTime?: string; // 兼容旧代码
}
