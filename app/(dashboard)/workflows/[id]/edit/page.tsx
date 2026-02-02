'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { WorkflowCanvas } from '@/components/workflow-builder';
import type { Workflow, WorkflowDefinition } from '@/types';

export default function WorkflowEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [executionState, setExecutionState] = useState<
    Record<string, 'pending' | 'running' | 'completed' | 'failed' | 'skipped'>
  >({});

  // Fetch workflow
  useEffect(() => {
    async function fetchWorkflow() {
      try {
        const response = await fetch(`/api/workflows/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load workflow');
        }

        setWorkflow(data.data);
        setDefinition(data.data.definition);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [id]);

  // Handle definition changes
  const handleDefinitionChange = useCallback((newDefinition: WorkflowDefinition) => {
    setDefinition(newDefinition);
    setHasChanges(true);
    setSaveStatus('idle');
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges || !definition) return;

    const timer = setTimeout(() => {
      saveWorkflow();
    }, 2000);

    return () => clearTimeout(timer);
  }, [definition, hasChanges]);

  // Save workflow
  const saveWorkflow = async () => {
    if (!definition || saving) return;

    setSaving(true);
    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save workflow');
      }

      setWorkflow(data.data);
      setHasChanges(false);
      setSaveStatus('saved');

      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Execute workflow (test run)
  const executeWorkflow = async () => {
    if (executing) return;

    // Save first if there are changes
    if (hasChanges) {
      await saveWorkflow();
    }

    setExecuting(true);
    setExecutionState({});

    try {
      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_data: {} }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute workflow');
      }

      // Handle SSE stream for real-time updates
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.node_id && data.status) {
                setExecutionState((prev) => ({
                  ...prev,
                  [data.node_id]: data.status,
                }));
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error('Execution error:', err);
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
      // Clear execution state after 3 seconds
      setTimeout(() => setExecutionState({}), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Failed to load workflow
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
        <Link
          href="/workflows"
          className="text-blue-600 hover:underline"
        >
          Back to Workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/workflows"
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-white">
              {workflow?.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>v{workflow?.version}</span>
              <span>•</span>
              <span className="capitalize">{workflow?.status}</span>
              {saveStatus === 'saving' && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Save failed
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkflow}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          <button
            onClick={executeWorkflow}
            disabled={executing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Test Run</span>
              </>
            )}
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        {definition && (
          <WorkflowCanvas
            initialDefinition={definition}
            onChange={handleDefinitionChange}
            executionState={executionState}
          />
        )}
      </div>
    </div>
  );
}
