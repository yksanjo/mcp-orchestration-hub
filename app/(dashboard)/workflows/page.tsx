import Link from 'next/link';
import {
  Plus,
  Workflow as WorkflowIcon,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Workflow } from '@/types';

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workflows } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    archived:
      'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Workflows
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and manage your MCP workflows
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow</span>
        </Link>
      </div>

      {/* Workflows Grid */}
      {!workflows || workflows.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <WorkflowIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No workflows yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first workflow to start chaining MCP servers together.
          </p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(workflows as Workflow[]).map((workflow) => {
            const nodeCount =
              (workflow.definition as { nodes?: unknown[] })?.nodes?.length || 0;
            const successRate =
              workflow.total_runs > 0
                ? Math.round(
                    (workflow.successful_runs / workflow.total_runs) * 100
                  )
                : null;

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}/edit`}
                className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 transition group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <WorkflowIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {workflow.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColors[workflow.status as keyof typeof statusColors]}`}
                      >
                        {workflow.status}
                      </span>
                    </div>
                  </div>
                  <button className="p-1 opacity-0 group-hover:opacity-100 transition">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {nodeCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nodes
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {workflow.total_runs}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Runs
                    </p>
                  </div>
                  <div>
                    {successRate !== null ? (
                      <>
                        <p
                          className={`text-lg font-semibold ${
                            successRate >= 80
                              ? 'text-green-600'
                              : successRate >= 50
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {successRate}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Success
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-slate-400">
                          —
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Success
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </span>
                  <span>v{workflow.version}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
