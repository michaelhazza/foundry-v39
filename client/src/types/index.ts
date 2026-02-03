export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  organizationId: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: number;
  name: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  organizationId: number;
  ownerId: number;
  name: string;
  description: string | null;
  targetSchema: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: number;
  organizationId: number;
  projectId: number;
  name: string;
  type: 'file_upload' | 'teamwork_desk_api';
  filePath: string | null;
  connectionConfig: Record<string, any> | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingJob {
  id: number;
  organizationId: number;
  dataSourceId: number;
  type: 'import' | 'pii_detection' | 'transformation' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: Record<string, any> | null;
  processedRecords: number;
  failedRecords: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaMapping {
  id: number;
  organizationId: number;
  projectId: number;
  sourceSchema: string;
  targetSchema: string;
  fieldMappings: Record<string, any>;
  transformationRules: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeidentificationRule {
  id: number;
  organizationId: number;
  projectId: number;
  ruleName: string;
  piiType: string;
  detectionMethod: string;
  maskingStrategy: string;
  ruleConfig: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: number;
  organizationId: number;
  projectId: number;
  processingJobId: number;
  name: string;
  format: 'jsonl' | 'json' | 'csv' | 'qa_pairs';
  filePath: string;
  recordCount: number;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    timestamp: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}
