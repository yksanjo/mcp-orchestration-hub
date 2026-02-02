import type {
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  NodeExecution,
  WorkflowNode,
  MCPNodeData,
  TriggerNodeData,
  ConditionNodeData,
  OutputNodeData,
} from '@/types';
import { createClient } from './supabase/server';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  inputData: Record<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  variables: Record<string, unknown>;
}

interface ExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  totalCostCents: number;
}

export class WorkflowExecutionEngine {
  private supabase = createClient();

  async createExecution(
    workflowId: string,
    userId: string,
    inputData: Record<string, unknown>
  ): Promise<WorkflowExecution> {
    const { data: execution, error } = await (await this.supabase)
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        user_id: userId,
        status: 'pending',
        input_data: inputData,
        output_data: null,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_ms: null,
        total_cost_cents: 0,
        current_node_id: null,
        completed_nodes: [],
        failed_nodes: [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create execution: ${error.message}`);
    }

    return execution;
  }

  async executeWorkflow(
    workflow: Workflow,
    userId: string,
    inputData: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Create execution record
    const execution = await this.createExecution(workflow.id, userId, inputData);
    
    const context: ExecutionContext = {
      executionId: execution.id,
      workflowId: workflow.id,
      userId,
      inputData,
      nodeOutputs: new Map(),
      variables: {},
    };

    try {
      // Update status to running
      await this.updateExecutionStatus(execution.id, 'running');

      // Execute the workflow
      const result = await this.runNodes(workflow.definition, context);

      // Update execution record with results
      await this.completeExecution(execution.id, result);

      // Increment workflow run count
      await this.incrementWorkflowRuns(workflow.id, result.success);

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        durationMs: Date.now() - startTime,
        totalCostCents: result.totalCostCents,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.failExecution(execution.id, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
        totalCostCents: 0,
      };
    }
  }

  private async runNodes(
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string; totalCostCents: number }> {
    const { nodes, edges } = definition;
    let totalCostCents = 0;

    // Find trigger nodes (starting points)
    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    
    if (triggerNodes.length === 0) {
      return { success: false, error: 'No trigger node found', totalCostCents };
    }

    // Build adjacency map
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const outgoingEdges = new Map<string, string[]>();
    
    for (const edge of edges) {
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source)!.push(edge.target);
    }

    // Execute starting from trigger nodes
    const executedNodes = new Set<string>();
    const nodeQueue = [...triggerNodes.map((n) => n.id)];
    let finalOutput: Record<string, unknown> | undefined;

    while (nodeQueue.length > 0) {
      const nodeId = nodeQueue.shift()!;
      
      if (executedNodes.has(nodeId)) {
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      // Update current node in execution
      await this.updateCurrentNode(context.executionId, nodeId);

      // Execute the node
      const nodeResult = await this.executeNode(node, context);
      
      // Record node execution
      await this.recordNodeExecution(context.executionId, node, nodeResult);

      if (!nodeResult.success) {
        // Handle node failure based on error strategy
        const errorStrategy = this.getNodeErrorStrategy(node);
        
        if (errorStrategy === 'fail') {
          return {
            success: false,
            error: `Node "${node.data.label}" failed: ${nodeResult.error}`,
            totalCostCents,
          };
        } else if (errorStrategy === 'retry' && nodeResult.retryCount < this.getMaxRetries(node)) {
          // Retry the node
          nodeQueue.unshift(nodeId);
          continue;
        }
        // 'skip' or 'continue' - just mark as failed and continue
      }

      executedNodes.add(nodeId);
      totalCostCents += nodeResult.costCents;

      // Store output for downstream nodes
      if (nodeResult.output !== undefined) {
        context.nodeOutputs.set(nodeId, nodeResult.output);
      }

      // Handle output nodes
      if (node.type === 'output' && nodeResult.success) {
        finalOutput = nodeResult.output as Record<string, unknown>;
      }

      // Add downstream nodes to queue
      const downstreamIds = outgoingEdges.get(nodeId) || [];
      
      for (const downstreamId of downstreamIds) {
        const downstreamNode = nodeMap.get(downstreamId);
        if (!downstreamNode) continue;

        // For condition nodes, evaluate condition to determine path
        if (downstreamNode.type === 'condition') {
          const conditionResult = await this.evaluateCondition(downstreamNode, context);
          const targetEdge = edges.find(e => e.source === nodeId && e.target === downstreamId);
          
          if (targetEdge?.sourceHandle) {
            // sourceHandle indicates which branch (true/false)
            const isTrueBranch = targetEdge.sourceHandle === 'true';
            if (conditionResult !== isTrueBranch) {
              continue; // Skip this branch
            }
          }
        }

        nodeQueue.push(downstreamId);
      }
    }

    return {
      success: true,
      output: finalOutput || Object.fromEntries(context.nodeOutputs),
      totalCostCents,
    };
  }

  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }> {
    const startTime = Date.now();
    
    try {
      switch (node.type) {
        case 'trigger':
          return await this.executeTriggerNode(node, context);
        case 'mcpServer':
          return await this.executeMCPNode(node, context);
        case 'condition':
          return await this.executeConditionNode(node, context);
        case 'output':
          return await this.executeOutputNode(node, context);
        default:
          return {
            success: false,
            error: `Unknown node type: ${node.type}`,
            costCents: 0,
            durationMs: Date.now() - startTime,
            retryCount: 0,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        costCents: 0,
        durationMs: Date.now() - startTime,
        retryCount: 0,
      };
    }
  }

  private async executeTriggerNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }> {
    const data = node.data as TriggerNodeData;
    const startTime = Date.now();

    // Trigger nodes just pass through the input data
    return {
      success: true,
      output: context.inputData,
      costCents: 0,
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  private async executeMCPNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }> {
    const data = node.data as MCPNodeData;
    const startTime = Date.now();

    if (!data.mcpServer) {
      return {
        success: false,
        error: 'No MCP server configured',
        costCents: 0,
        durationMs: Date.now() - startTime,
        retryCount: 0,
      };
    }

    // Prepare inputs by resolving references to previous node outputs
    const resolvedInputs = this.resolveNodeInputs(data.inputs, context);

    // Call the MCP server (this would integrate with actual MCP calling mechanism)
    try {
      const result = await this.callMCPServer(data.mcpServer.slug, resolvedInputs, data.config);
      
      const costCents = data.mcpServer.cost_per_call_cents || 0;

      return {
        success: true,
        output: result,
        costCents,
        durationMs: Date.now() - startTime,
        retryCount: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MCP call failed',
        costCents: 0,
        durationMs: Date.now() - startTime,
        retryCount: 0,
      };
    }
  }

  private async executeConditionNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }> {
    const data = node.data as ConditionNodeData;
    const startTime = Date.now();

    const conditionResult = await this.evaluateCondition(node, context);

    return {
      success: true,
      output: { conditionResult },
      costCents: 0,
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  private async executeOutputNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }> {
    const data = node.data as OutputNodeData;
    const startTime = Date.now();

    // Collect outputs from all upstream nodes
    const output: Record<string, unknown> = {};
    
    for (const [nodeId, nodeOutput] of context.nodeOutputs) {
      output[nodeId] = nodeOutput;
    }

    // Handle specific output types
    switch (data.outputType) {
      case 'webhook':
        await this.sendWebhookOutput(data.config, output);
        break;
      case 'store':
        await this.storeOutput(data.config, output);
        break;
      case 'return':
      default:
        // Just return the output
        break;
    }

    return {
      success: true,
      output,
      costCents: 0,
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  private resolveNodeInputs(
    inputs: { source?: string; default?: unknown }[],
    context: ExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const input of inputs) {
      if (input.source) {
        // Resolve reference like "$node1.output.data"
        const value = this.resolveReference(input.source, context);
        if (value !== undefined) {
          resolved[input.source] = value;
        } else if (input.default !== undefined) {
          resolved[input.source] = input.default;
        }
      }
    }

    return resolved;
  }

  private resolveReference(ref: string, context: ExecutionContext): unknown {
    // Parse references like "$node1.output.data" or "$input.field"
    const match = ref.match(/^\$(\w+)\.(.*)$/);
    if (!match) return ref;

    const [, source, path] = match;

    if (source === 'input') {
      return this.getPathValue(context.inputData, path);
    }

    if (source === 'var') {
      return this.getPathValue(context.variables, path);
    }

    // Node output reference
    const nodeOutput = context.nodeOutputs.get(source);
    if (nodeOutput) {
      return this.getPathValue(nodeOutput as Record<string, unknown>, path);
    }

    return undefined;
  }

  private getPathValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private async evaluateCondition(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<boolean> {
    const data = node.data as ConditionNodeData;
    
    // Simple expression evaluation - in production, use a safe expression evaluator
    // For now, we'll do a basic comparison
    try {
      // Resolve any variables in the condition
      const resolvedCondition = data.condition.replace(/\$\w+(\.\w+)*/g, (match) => {
        const value = this.resolveReference(match, context);
        return JSON.stringify(value);
      });

      // WARNING: In production, use a proper expression parser/evaluator
      // This is just for demonstration
      // eslint-disable-next-line no-eval
      return eval(resolvedCondition);
    } catch {
      return false;
    }
  }

  private async callMCPServer(
    slug: string,
    inputs: Record<string, unknown>,
    config: Record<string, unknown>
  ): Promise<unknown> {
    // This would integrate with the actual MCP calling mechanism
    // For now, simulate a successful call
    
    // In production, this would call the MCP Discovery API or a local MCP client
    const response = await fetch(`${process.env.MCP_GATEWAY_URL || 'https://mcp-gateway.example.com'}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: slug, inputs, config }),
    });

    if (!response.ok) {
      throw new Error(`MCP server call failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async sendWebhookOutput(config: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
    const url = config.url as string;
    if (!url) return;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  private async storeOutput(config: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
    // Store output to database, file, etc.
    // Implementation depends on storage configuration
    console.log('Storing output:', config, data);
  }

  private getNodeErrorStrategy(node: WorkflowNode): 'fail' | 'retry' | 'skip' | 'continue' {
    if (node.type === 'mcpServer') {
      return (node.data as MCPNodeData).onError || 'fail';
    }
    return 'fail';
  }

  private getMaxRetries(node: WorkflowNode): number {
    if (node.type === 'mcpServer') {
      return (node.data as MCPNodeData).maxRetries || 0;
    }
    return 0;
  }

  private async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
    await (await this.supabase)
      .from('workflow_executions')
      .update({ status })
      .eq('id', executionId);
  }

  private async updateCurrentNode(executionId: string, nodeId: string): Promise<void> {
    await (await this.supabase)
      .from('workflow_executions')
      .update({ current_node_id: nodeId })
      .eq('id', executionId);
  }

  private async recordNodeExecution(
    executionId: string,
    node: WorkflowNode,
    result: { success: boolean; output?: unknown; error?: string; costCents: number; durationMs: number; retryCount: number }
  ): Promise<void> {
    await (await this.supabase).from('node_executions').insert({
      execution_id: executionId,
      node_id: node.id,
      status: result.success ? 'completed' : 'failed',
      input_data: {}, // Could capture actual inputs
      output_data: result.output ? { data: result.output } : null,
      error_message: result.error || null,
      started_at: new Date(Date.now() - result.durationMs).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: result.durationMs,
      mcp_server_slug: node.type === 'mcpServer' ? (node.data as MCPNodeData).mcpServer?.slug : null,
      mcp_cost_cents: result.costCents,
      retry_count: result.retryCount,
    });
  }

  private async completeExecution(
    executionId: string,
    result: { success: boolean; output?: Record<string, unknown>; error?: string; totalCostCents: number }
  ): Promise<void> {
    await (await this.supabase)
      .from('workflow_executions')
      .update({
        status: result.success ? 'completed' : 'failed',
        output_data: result.output || null,
        error_message: result.error || null,
        completed_at: new Date().toISOString(),
        duration_ms: 0, // Will be calculated from started_at
        total_cost_cents: result.totalCostCents,
      })
      .eq('id', executionId);
  }

  private async failExecution(executionId: string, errorMessage: string): Promise<void> {
    await (await this.supabase)
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId);
  }

  private async incrementWorkflowRuns(workflowId: string, success: boolean): Promise<void> {
    const updates: { total_runs: number; successful_runs?: number } = {
      total_runs: 1, // This would use increment in real implementation
    };
    
    if (success) {
      updates.successful_runs = 1;
    }

    await (await this.supabase)
      .from('workflows')
      .update(updates)
      .eq('id', workflowId);
  }
}

export const workflowEngine = new WorkflowExecutionEngine();
