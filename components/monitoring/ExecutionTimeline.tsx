'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, formatDuration } from '@/lib/utils';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import type { NodeExecution } from '@/types';

interface ExecutionTimelineProps {
  nodeExecutions: NodeExecution[];
  currentNodeId: string | null;
}

export default function ExecutionTimeline({
  nodeExecutions,
  currentNodeId,
}: ExecutionTimelineProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getDuration = (node: NodeExecution) => {
    if (node.duration_ms) {
      return formatDuration(node.duration_ms);
    }
    if (node.started_at && !node.completed_at) {
      return 'Running...';
    }
    return '-';
  };

  return (
    <div className="space-y-3">
      {nodeExecutions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No node executions yet
        </div>
      ) : (
        nodeExecutions.map((node, index) => (
          <div
            key={node.id}
            className={`
              relative pl-6 pb-4 last:pb-0
              ${index < nodeExecutions.length - 1 ? 'border-l-2 border-gray-200 ml-3' : ''}
            `}
          >
            {/* Timeline dot */}
            <div
              className={`
                absolute left-0 top-0 w-6 h-6 rounded-full border-2
                flex items-center justify-center bg-white
                ${node.status === 'completed'
                  ? 'border-green-500'
                  : node.status === 'failed'
                  ? 'border-red-500'
                  : node.status === 'running'
                  ? 'border-blue-500'
                  : 'border-gray-300'}
              `}
            >
              <div
                className={`
                  w-2 h-2 rounded-full
                  ${node.status === 'completed'
                    ? 'bg-green-500'
                    : node.status === 'failed'
                    ? 'bg-red-500'
                    : node.status === 'running'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-300'}
                `}
              />
            </div>

            {/* Node content */}
            <div
              className={`
                bg-white rounded-lg border p-3 cursor-pointer
                hover:border-gray-300 transition-colors
                ${currentNodeId === node.node_id ? 'ring-2 ring-blue-500 border-blue-500' : ''}
              `}
              onClick={() => toggleNode(node.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExecutionStatusBadge status={node.status} size="sm" />
                  <span className="font-medium text-sm">{node.node_id}</span>
                  {node.mcp_server_slug && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {node.mcp_server_slug}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{getDuration(node)}</span>
                  {node.mcp_cost_cents > 0 && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      ${(node.mcp_cost_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedNodes.has(node.id) && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {node.input_data && Object.keys(node.input_data).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Inputs
                      </h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(node.input_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {node.output_data && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Outputs
                      </h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(node.output_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {node.error_message && (
                    <div>
                      <h4 className="text-xs font-medium text-red-500 uppercase mb-1">
                        Error
                      </h4>
                      <pre className="text-xs bg-red-50 text-red-700 p-2 rounded overflow-auto max-h-32">
                        {node.error_message}
                      </pre>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Started: {formatDistanceToNow(node.started_at)}
                    {node.retry_count > 0 && (
                      <span className="ml-3">Retries: {node.retry_count}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
