import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/templates - List workflow templates
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    // Allow unauthenticated access for browsing templates
    console.log('Unauthenticated template access');
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const pricing = searchParams.get('pricing'); // 'free', 'paid', 'all'
  const sort = searchParams.get('sort') || 'popular'; // 'popular', 'newest', 'rating', 'price'
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('templates')
    .select(`
      *,
      workflow:workflows(name, definition),
      author:profiles(name, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'approved')
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (pricing && pricing !== 'all') {
    query = query.eq('pricing_type', pricing);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_avg', { ascending: false });
      break;
    case 'price':
      query = query.order('price_cents', { ascending: true });
      break;
    case 'popular':
    default:
      query = query.order('install_count', { ascending: false });
      break;
  }

  const { data: templates, error, count } = await query;

  if (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: templates,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: (count || 0) > offset + limit,
  });
}

// POST /api/templates - Submit a workflow as a template
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      workflowId,
      name,
      slug,
      description,
      category,
      tags,
      pricingType,
      priceCents,
    } = body;

    // Verify the workflow belongs to the user
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if slug is unique
    const { data: existing } = await supabase
      .from('templates')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Template slug already exists' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        workflow_id: workflowId,
        author_id: user.id,
        name,
        slug,
        description,
        category,
        tags: tags || [],
        pricing_type: pricingType,
        price_cents: priceCents || 0,
        revenue_share_percent: 70, // Author gets 70%
        install_count: 0,
        rating_count: 0,
        status: 'pending', // Requires approval
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    // Mark workflow as template
    await supabase
      .from('workflows')
      .update({ is_template: true })
      .eq('id', workflowId);

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
