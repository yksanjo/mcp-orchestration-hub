import type { Node, Edge } from 'reactflow';

// MCP Server types (from MCP Discovery)
export interface MCPServer {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  author: string;
  version: string;
  cost_per_call_cents?: number;
  avg_latency_ms?: number;
  rating?: number;
  total_calls?: number;
}

// Workflow types
export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
}

export interface WorkflowNode extends Node {
  type: 'mcpServer' | 'trigger' | 'condition' | 'output';
  data: MCPNodeData | TriggerNodeData | ConditionNodeData | OutputNodeData;
}

export interface WorkflowEdge extends Edge {
  data?: {
    mapping?: Record<string, string>; // Maps source output to target input
  };
}

export interface MCPNodeData {
  label: string;
  mcpServer?: MCPServer;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  config: Record<string, unknown>;
  onError: 'fail' | 'retry' | 'skip' | 'continue';
  maxRetries: number;
  timeout: number; // ms
}

export interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'schedule' | 'webhook';
  config: Record<string, unknown>;
}

export interface ConditionNodeData {
  label: string;
  condition: string; // Expression to evaluate
  trueLabel?: string;
  falseLabel?: string;
}

export interface OutputNodeData {
  label: string;
  outputType: 'return' | 'webhook' | 'store';
  config: Record<string, unknown>;
}

export interface NodeInput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: unknown;
  source?: string; // e.g., "$node1.output.data"
}

export interface NodeOutput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface WorkflowSettings {
  maxCostCents: number;
  timeout: number; // ms
  parallelExecution: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Database types
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  version: number;
  definition: WorkflowDefinition;
  status: 'draft' | 'active' | 'archived';
  is_template: boolean;
  template_price_cents: number | null;
  total_runs: number;
  successful_runs: number;
  total_cost_cents: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  total_cost_cents: number;
  current_node_id: string | null;
  completed_nodes: string[];
  failed_nodes: string[];
}

export interface NodeExecution {
  id: string;
  execution_id: string;
  node_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  mcp_server_slug: string | null;
  mcp_cost_cents: number;
  retry_count: number;
}

export interface Template {
  id: string;
  workflow_id: string;
  author_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  pricing_type: 'free' | 'paid' | 'subscription';
  price_cents: number;
  revenue_share_percent: number;
  install_count: number;
  rating_avg: number | null;
  rating_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  monthly_workflow_runs: number;
  used_workflow_runs: number;
  total_earnings_cents: number;
  stripe_connect_account_id: string | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
