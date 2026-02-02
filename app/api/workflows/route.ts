import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Workflow, WorkflowDefinition } from '@/types';

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('workflows')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: workflows, error, count } = await query;

  if (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: workflows,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: (count || 0) > offset + limit,
  });
}

// POST /api/workflows - Create workflow
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, definition } = body as {
      name: string;
      definition?: WorkflowDefinition;
    };

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check for existing slug and increment if needed
    const { data: existing } = await supabase
      .from('workflows')
      .select('slug')
      .eq('user_id', user.id)
      .like('slug', `${baseSlug}%`);

    let slug = baseSlug;
    if (existing && existing.length > 0) {
      const slugs = existing.map((w) => w.slug);
      let counter = 1;
      while (slugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const defaultDefinition: WorkflowDefinition = {
      nodes: [],
      edges: [],
      settings: {
        maxCostCents: 100,
        timeout: 30000,
        parallelExecution: true,
        logLevel: 'info',
      },
    };

    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name,
        slug,
        definition: definition || defaultDefinition,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create workflow:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: workflow }, { status: 201 });
  } catch (error) {
    console.error('Invalid request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
