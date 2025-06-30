export interface Avatar {
  id: string;
  name: string;
  description: string;
  url: string;
  preview?: string;
  previewUrl?: string;
  status: 'draft' | 'pending' | 'processing' | 'ready' | 'error';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createTime?: string; // 兼容旧代码
}
