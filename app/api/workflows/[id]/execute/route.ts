import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { workflowEngine } from '@/lib/workflow-execution';

// POST /api/workflows/[id]/execute - Execute a workflow
export async function POST(
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

  try {
    const body = await request.json();
    const inputData = body.input || {};

    // Get the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Check user's run limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, monthly_workflow_runs, used_workflow_runs')
      .eq('id', user.id)
      .single();

    if (profile && profile.tier === 'free') {
      if (profile.used_workflow_runs >= profile.monthly_workflow_runs) {
        return NextResponse.json(
          { error: 'Monthly workflow run limit exceeded' },
          { status: 429 }
        );
      }
    }

    // Execute the workflow
    const result = await workflowEngine.executeWorkflow(
      workflow,
      user.id,
      inputData
    );

    // Increment used runs for free tier
    if (profile?.tier === 'free') {
      await supabase
        .from('profiles')
        .update({ used_workflow_runs: profile.used_workflow_runs + 1 })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
      totalCostCents: result.totalCostCents,
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
