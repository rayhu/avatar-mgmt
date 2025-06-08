export interface Model {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[];
  status: 'ready' | 'draft' | 'offline';
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
} 