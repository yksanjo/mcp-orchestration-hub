import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/templates/[id] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: template, error } = await supabase
    .from('templates')
    .select(`
      *,
      workflow:workflows(name, definition),
      author:profiles(name, avatar_url)
    `)
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !template) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: template });
}

// POST /api/templates/[id]/install - Install a template
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
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select(`
        *,
        workflow:workflows(definition, user_id)
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Don't allow installing your own template
    if (template.author_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot install your own template' },
        { status: 400 }
      );
    }

    // Check if already installed
    const { data: existingInstall } = await supabase
      .from('template_installs')
      .select('id')
      .eq('template_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingInstall) {
      return NextResponse.json(
        { error: 'Template already installed' },
        { status: 400 }
      );
    }

    // Handle paid templates
    if (template.pricing_type === 'paid' && template.price_cents > 0) {
      // In production, handle Stripe payment here
      // For now, we'll skip actual payment processing
      console.log(`Processing payment for template: ${template.name}`);
    }

    // Create a copy of the workflow for the user
    const { data: newWorkflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name: `${template.name} (Copy)`,
        slug: `${template.slug}-${Date.now()}`,
        version: 1,
        definition: template.workflow.definition,
        status: 'draft',
        is_template: false,
        template_price_cents: null,
        total_runs: 0,
        successful_runs: 0,
        total_cost_cents: 0,
      })
      .select()
      .single();

    if (workflowError) {
      return NextResponse.json(
        { error: 'Failed to create workflow from template' },
        { status: 500 }
      );
    }

    // Record the install
    await supabase.from('template_installs').insert({
      template_id: id,
      user_id: user.id,
      workflow_id: newWorkflow.id,
      price_paid_cents: template.pricing_type === 'paid' ? template.price_cents : 0,
    });

    // Increment install count
    await supabase
      .from('templates')
      .update({ install_count: template.install_count + 1 })
      .eq('id', id);

    return NextResponse.json({
      data: {
        workflow: newWorkflow,
        message: 'Template installed successfully',
      },
    });
  } catch (error) {
    console.error('Install template error:', error);
    return NextResponse.json(
      { error: 'Failed to install template' },
      { status: 500 }
    );
  }
}
