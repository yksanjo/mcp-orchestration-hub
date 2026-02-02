import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/executions - List workflow executions
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('workflowId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: executions, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: executions,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: (count || 0) > offset + limit,
  });
}
