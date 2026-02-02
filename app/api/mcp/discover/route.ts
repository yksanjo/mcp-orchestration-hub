import { NextRequest, NextResponse } from 'next/server';
import { mcpDiscovery } from '@/lib/mcp-discovery';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const result = await mcpDiscovery.search({
      query,
      category,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('MCP Discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to search MCP servers' },
      { status: 500 }
    );
  }
}
