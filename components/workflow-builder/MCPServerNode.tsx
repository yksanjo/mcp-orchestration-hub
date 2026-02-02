'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Server, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { MCPNodeData } from '@/types';

interface MCPServerNodeProps extends NodeProps {
  data: MCPNodeData;
}

function MCPServerNode({ data, selected }: MCPServerNodeProps) {
  const server = data.mcpServer;
  const statusClass = data.status
    ? {
        pending: '',
        running: 'node-executing',
        completed: 'node-completed',
        failed: 'node-failed',
        skipped: 'opacity-50',
      }[data.status]
    : '';

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border-2 min-w-[200px] shadow-sm transition-all ${
        selected
          ? 'border-blue-500 shadow-blue-500/20'
          : 'border-slate-200 dark:border-slate-700'
      } ${statusClass}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
          <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {data.label || 'MCP Server'}
        </span>
        {data.status && (
          <span className="ml-auto">
            {data.status === 'running' && (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            )}
            {data.status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {data.status === 'failed' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        {server ? (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {server.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                {server.category}
              </span>
              {server.cost_per_call_cents !== undefined &&
                server.cost_per_call_cents > 0 && (
                  <span className="text-xs text-slate-400">
                    ${(server.cost_per_call_cents / 100).toFixed(2)}/call
                  </span>
                )}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Click to configure server
          </p>
        )}
      </div>

      {/* Inputs/Outputs indicators */}
      {(data.inputs?.length > 0 || data.outputs?.length > 0) && (
        <div className="flex justify-between px-3 py-1 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
          <span>
            {data.inputs?.length || 0} input{data.inputs?.length !== 1 && 's'}
          </span>
          <span>
            {data.outputs?.length || 0} output
            {data.outputs?.length !== 1 && 's'}
          </span>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(MCPServerNode);
