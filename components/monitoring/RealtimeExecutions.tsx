'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import Link from 'next/link';
import { Activity, ArrowRight, RefreshCw } from 'lucide-react';
import type { WorkflowExecution } from '@/types';

interface RealtimeExecutionsProps {
  initialExecutions?: WorkflowExecution[];
  workflowId?: string;
}

export default function RealtimeExecutions({
  initialExecutions = [],
  workflowId,
}: RealtimeExecutionsProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Set up realtime subscription
    const channel = supabase
      .channel('workflow-executions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions',
          filter: workflowId ? `workflow_id=eq.${workflowId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setExecutions((prev) => [payload.new as WorkflowExecution, ...prev].slice(0, 50));
          } else if (payload.eventType === 'UPDATE') {
            setExecutions((prev) =>
              prev.map((e) =>
                e.id === payload.new.id ? { ...e, ...payload.new } : e
              )
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [workflowId]);

  const getExecutionDuration = (execution: WorkflowExecution) => {
    if (execution.duration_ms) {
      return `${(execution.duration_ms / 1000).toFixed(1)}s`;
    }
    if (execution.started_at && !execution.completed_at) {
      const elapsed = Date.now() - new Date(execution.started_at).getTime();
      return `${(elapsed / 1000).toFixed(1)}s`;
    }
    return '-';
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Recent Executions</h3>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-400">Connecting...</span>
          )}
        </div>
        <Link
          href="/monitoring"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y">
        {executions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No recent executions
          </div>
        ) : (
          executions.map((execution) => (
            <Link
              key={execution.id}
              href={`/monitoring?execution=${execution.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExecutionStatusBadge status={execution.status} size="sm" />
                <div>
                  <p className="text-sm font-medium">
                    Execution #{execution.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(execution.started_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {getExecutionDuration(execution)}
                </p>
                {execution.total_cost_cents > 0 && (
                  <p className="text-xs text-gray-500">
                    ${(execution.total_cost_cents / 100).toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
