import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/executions/[id] - Get execution details with node executions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get execution
  const { data: execution, error: executionError } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows(name, slug)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (executionError || !execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  // Get node executions
  const { data: nodeExecutions, error: nodesError } = await supabase
    .from('node_executions')
    .select('*')
    .eq('execution_id', id)
    .order('started_at', { ascending: true });

  if (nodesError) {
    return NextResponse.json(
      { error: 'Failed to fetch node executions' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    execution,
    nodeExecutions: nodeExecutions || [],
  });
}

// DELETE /api/executions/[id] - Cancel a running execution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get execution to verify ownership and status
  const { data: execution, error: executionError } = await supabase
    .from('workflow_executions')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (executionError || !execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  if (execution.status !== 'pending' && execution.status !== 'running') {
    return NextResponse.json(
      { error: 'Execution cannot be cancelled' },
      { status: 400 }
    );
  }

  // Cancel the execution
  const { error: updateError } = await supabase
    .from('workflow_executions')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
