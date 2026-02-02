'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExecutionStatusBadge, ExecutionTimeline } from '@/components/monitoring';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { WorkflowExecution, NodeExecution } from '@/types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ExecutionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecution[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  });

  const pageSize = 20;

  useEffect(() => {
    fetchExecutions();
  }, [page, filters]);

  useEffect(() => {
    const executionId = searchParams.get('execution');
    if (executionId) {
      fetchExecutionDetails(executionId);
    }
  }, [searchParams]);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', pageSize.toString());
      params.set('offset', ((page - 1) * pageSize).toString());
      if (filters.status) params.set('status', filters.status);

      const response = await fetch(`/api/executions?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setExecutions(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionDetails = async (executionId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/executions/${executionId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedExecution(data.execution);
        setNodeExecutions(data.nodeExecutions);
      }
    } catch (error) {
      console.error('Failed to fetch execution details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExecutionClick = (execution: WorkflowExecution) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('execution', execution.id);
    router.push(`/monitoring?${params.toString()}`);
  };

  const closeDetails = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('execution');
    router.push(`/monitoring?${params.toString()}`);
    setSelectedExecution(null);
    setNodeExecutions([]);
  };

  const getDuration = (execution: WorkflowExecution) => {
    if (execution.duration_ms) {
      return `${(execution.duration_ms / 1000).toFixed(1)}s`;
    }
    if (execution.started_at && !execution.completed_at) {
      const elapsed = Date.now() - new Date(execution.started_at).getTime();
      return `${(elapsed / 1000).toFixed(1)}s`;
    }
    return '-';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
        <h3 className="font-semibold">Execution History</h3>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Execution List */}
      <div className="divide-y">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No executions found
          </div>
        ) : (
          executions.map((execution) => (
            <div
              key={execution.id}
              onClick={() => handleExecutionClick(execution)}
              className={`
                flex items-center justify-between p-4 cursor-pointer
                hover:bg-gray-50 transition-colors
                ${selectedExecution?.id === execution.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <ExecutionStatusBadge status={execution.status} size="sm" />
                <div>
                  <p className="font-medium text-sm">
                    Execution #{execution.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(execution.workflow as { name: string })?.name || 'Unknown Workflow'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{getDuration(execution)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(execution.started_at).toLocaleString()}
                </p>
                {execution.total_cost_cents > 0 && (
                  <p className="text-xs text-gray-400">
                    ${(execution.total_cost_cents / 100).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} executions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  Execution Details
                </h3>
                <p className="text-sm text-gray-500">
                  #{selectedExecution.id}
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <ExecutionStatusBadge status={selectedExecution.status} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Duration</p>
                      <p className="font-medium">{getDuration(selectedExecution)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Cost</p>
                      <p className="font-medium">
                        ${(selectedExecution.total_cost_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Started</p>
                      <p className="font-medium text-sm">
                        {new Date(selectedExecution.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Input Data */}
                  {selectedExecution.input_data && Object.keys(selectedExecution.input_data).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Input Data</h4>
                      <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-auto max-h-48">
                        {JSON.stringify(selectedExecution.input_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Output Data */}
                  {selectedExecution.output_data && (
                    <div>
                      <h4 className="font-medium mb-2">Output Data</h4>
                      <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-auto max-h-48">
                        {JSON.stringify(selectedExecution.output_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Message */}
                  {selectedExecution.error_message && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Error</h4>
                      <pre className="bg-red-50 text-red-700 p-3 rounded-lg text-sm overflow-auto">
                        {selectedExecution.error_message}
                      </pre>
                    </div>
                  )}

                  {/* Execution Timeline */}
                  <div>
                    <h4 className="font-medium mb-3">Execution Timeline</h4>
                    <ExecutionTimeline
                      nodeExecutions={nodeExecutions}
                      currentNodeId={selectedExecution.current_node_id}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
