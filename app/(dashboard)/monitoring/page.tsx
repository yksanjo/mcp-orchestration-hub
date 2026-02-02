import { createClient } from '@/lib/supabase/server';
import { StatsCards, RealtimeExecutions } from '@/components/monitoring';
import ExecutionList from './ExecutionList';

export const metadata = {
  title: 'Monitoring | MCP Orchestration Hub',
};

async function getStats(userId: string) {
  const supabase = await createClient();

  const { data: executions } = await supabase
    .from('workflow_executions')
    .select('status, total_cost_cents, duration_ms')
    .eq('user_id', userId)
    .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!executions) {
    return {
      totalExecutions: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalCost: 0,
      avgDuration: 0,
    };
  }

  const total = executions.length;
  const successful = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;
  const totalCost = executions.reduce((sum, e) => sum + (e.total_cost_cents || 0), 0);
  const avgDuration = total > 0
    ? executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / total
    : 0;

  return {
    totalExecutions: total,
    successfulRuns: successful,
    failedRuns: failed,
    totalCost,
    avgDuration,
  };
}

async function getRecentExecutions(userId: string) {
  const supabase = await createClient();

  const { data: executions } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows(name, slug)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(10);

  return executions || [];
}

export default async function MonitoringPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [stats, recentExecutions] = await Promise.all([
    getStats(user.id),
    getRecentExecutions(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-gray-500">
            Monitor your workflow executions in real-time
          </p>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExecutionList />
        </div>
        <div>
          <RealtimeExecutions initialExecutions={recentExecutions} />
        </div>
      </div>
    </div>
  );
}
