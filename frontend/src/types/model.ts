export interface Model {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  tags: string[];
  createdAt: string;
  updatedAt: string;
} 