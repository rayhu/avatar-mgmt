export interface Model {
  id: string;
  name: string;
  description: string;
  url: string;
  previewUrl?: string;
  status: 'draft' | 'pending' | 'processing' | 'ready' | 'error';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createTime?: string; // 兼容旧代码
} 
