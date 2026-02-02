import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  Workflow, 
  Play, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Plus,
  ArrowRight,
  Store,
  Activity
} from 'lucide-react';
import { RealtimeExecutions, StatsCards } from '@/components/monitoring';

async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  // Get workflow stats
  const { data: workflows } = await supabase
    .from('workflows')
    .select('status, total_runs, successful_runs')
    .eq('user_id', userId);

  // Get execution stats (last 30 days)
  const { data: executions } = await supabase
    .from('workflow_executions')
    .select('status, total_cost_cents, duration_ms')
    .eq('user_id', userId)
    .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Get recent executions
  const { data: recentExecutions } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows(name, slug)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(5);

  const workflowCount = workflows?.length || 0;
  const activeWorkflows = workflows?.filter((w) => w.status === 'active').length || 0;
  const totalRuns = workflows?.reduce((sum, w) => sum + (w.total_runs || 0), 0) || 0;
  const successfulRuns = workflows?.reduce((sum, w) => sum + (w.successful_runs || 0), 0) || 0;

  const executionCount = executions?.length || 0;
  const totalCost = executions?.reduce((sum, e) => sum + (e.total_cost_cents || 0), 0) || 0;
  const avgDuration = executionCount > 0
    ? executions?.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executionCount
    : 0;

  return {
    workflowCount,
    activeWorkflows,
    totalRuns,
    successRate: totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : '0',
    executionCount,
    totalCost,
    avgDuration,
    recentExecutions: recentExecutions || [],
    stats: {
      totalExecutions: executionCount,
      successfulRuns: executions?.filter((e) => e.status === 'completed').length || 0,
      failedRuns: executions?.filter((e) => e.status === 'failed').length || 0,
      totalCost,
      avgDuration,
    },
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const stats = await getDashboardStats(user.id);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your workflows
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Workflow className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workflows</p>
              <p className="text-2xl font-bold">{stats.workflowCount}</p>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            {stats.activeWorkflows} active
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Runs</p>
              <p className="text-2xl font-bold">{stats.totalRuns.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            {stats.successRate}% success rate
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Cost</p>
              <p className="text-2xl font-bold">${(stats.totalCost / 100).toFixed(2)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.executionCount} executions
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Activity className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold">
                {stats.avgDuration > 0 ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '-'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Per execution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Executions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link
              href="/monitoring"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <StatsCards stats={stats.stats} />
        </div>

        {/* Realtime Executions */}
        <div>
          <RealtimeExecutions initialExecutions={stats.recentExecutions} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/workflows"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Workflow className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Workflows</h3>
              <p className="text-sm text-gray-500">View and edit your workflows</p>
            </div>
          </div>
        </Link>

        <Link
          href="/marketplace"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Browse Templates</h3>
              <p className="text-sm text-gray-500">Discover pre-built workflows</p>
            </div>
          </div>
        </Link>

        <Link
          href="/monitoring"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Monitor Executions</h3>
              <p className="text-sm text-gray-500">Track workflow performance</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
