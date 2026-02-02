import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/templates/[id]/reviews - Get template reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { data: reviews, error, count } = await supabase
    .from('template_reviews')
    .select(`
      *,
      user:profiles(name, avatar_url)
    `, { count: 'exact' })
    .eq('template_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: reviews,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: (count || 0) > offset + limit,
  });
}

// POST /api/templates/[id]/reviews - Add a review
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
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user has installed this template
    const { data: install } = await supabase
      .from('template_installs')
      .select('id')
      .eq('template_id', id)
      .eq('user_id', user.id)
      .single();

    if (!install) {
      return NextResponse.json(
        { error: 'Must install template before reviewing' },
        { status: 400 }
      );
    }

    // Check if user already reviewed
    const { data: existingReview } = await supabase
      .from('template_reviews')
      .select('id')
      .eq('template_id', id)
      .eq('user_id', user.id)
      .single();

    let reviewData;

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('template_reviews')
        .update({ rating, review, updated_at: new Date().toISOString() })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (error) throw error;
      reviewData = data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('template_reviews')
        .insert({
          template_id: id,
          user_id: user.id,
          rating,
          review,
        })
        .select()
        .single();

      if (error) throw error;
      reviewData = data;
    }

    // Update template rating
    const { data: allRatings } = await supabase
      .from('template_reviews')
      .select('rating')
      .eq('template_id', id);

    if (allRatings) {
      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      await supabase
        .from('templates')
        .update({
          rating_avg: avgRating,
          rating_count: allRatings.length,
        })
        .eq('id', id);
    }

    return NextResponse.json({ data: reviewData });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
