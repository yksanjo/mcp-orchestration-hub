import type { MCPServer } from '@/types';

const MCP_DISCOVERY_API =
  process.env.MCP_DISCOVERY_API || 'https://mcp-discovery-two.vercel.app';

export interface SearchOptions {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface MCPDiscoveryResponse {
  servers: MCPServer[];
  total: number;
  page: number;
  pageSize: number;
}

class MCPDiscoveryClient {
  private baseUrl: string;
  private cache: Map<string, { data: MCPServer[]; timestamp: number }> =
    new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = MCP_DISCOVERY_API) {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(options: SearchOptions): string {
    return JSON.stringify(options);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  async search(options: SearchOptions = {}): Promise<MCPDiscoveryResponse> {
    const cacheKey = this.getCacheKey(options);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return {
        servers: cached.data,
        total: cached.data.length,
        page: 1,
        pageSize: cached.data.length,
      };
    }

    const params = new URLSearchParams();
    if (options.query) params.set('q', options.query);
    if (options.category) params.set('category', options.category);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    try {
      const response = await fetch(
        `${this.baseUrl}/api/servers?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );

      if (!response.ok) {
        throw new Error(`MCP Discovery API error: ${response.status}`);
      }

      const data = await response.json();
      const servers: MCPServer[] = data.servers || data.data || [];

      this.cache.set(cacheKey, {
        data: servers,
        timestamp: Date.now(),
      });

      return {
        servers,
        total: data.total || servers.length,
        page: data.page || 1,
        pageSize: data.pageSize || servers.length,
      };
    } catch (error) {
      console.error('MCP Discovery search error:', error);
      // Return mock data for development if API is unavailable
      return this.getMockData(options);
    }
  }

  async getServerBySlug(slug: string): Promise<MCPServer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/servers/${slug}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`MCP Discovery API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('MCP Discovery getServerBySlug error:', error);
      return null;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/categories`, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`MCP Discovery API error: ${response.status}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('MCP Discovery getCategories error:', error);
      return this.getMockCategories();
    }
  }

  // Mock data for development/fallback
  private getMockData(options: SearchOptions): MCPDiscoveryResponse {
    const mockServers: MCPServer[] = [
      {
        id: '1',
        slug: 'openai-chat',
        name: 'OpenAI Chat',
        description: 'Chat completion API for GPT models',
        category: 'AI',
        capabilities: ['chat', 'completion', 'streaming'],
        author: 'OpenAI',
        version: '1.0.0',
        cost_per_call_cents: 1,
        avg_latency_ms: 500,
        rating: 4.8,
        total_calls: 1000000,
      },
      {
        id: '2',
        slug: 'github-api',
        name: 'GitHub API',
        description: 'GitHub repository and issue management',
        category: 'Developer Tools',
        capabilities: ['repos', 'issues', 'prs', 'actions'],
        author: 'GitHub',
        version: '2.0.0',
        cost_per_call_cents: 0,
        avg_latency_ms: 200,
        rating: 4.9,
        total_calls: 5000000,
      },
      {
        id: '3',
        slug: 'stripe-payments',
        name: 'Stripe Payments',
        description: 'Payment processing and subscription management',
        category: 'Finance',
        capabilities: ['payments', 'subscriptions', 'invoices'],
        author: 'Stripe',
        version: '3.0.0',
        cost_per_call_cents: 2,
        avg_latency_ms: 300,
        rating: 4.7,
        total_calls: 2000000,
      },
      {
        id: '4',
        slug: 'slack-messenger',
        name: 'Slack Messenger',
        description: 'Send messages and manage Slack workspaces',
        category: 'Communication',
        capabilities: ['messages', 'channels', 'users'],
        author: 'Slack',
        version: '1.5.0',
        cost_per_call_cents: 0,
        avg_latency_ms: 150,
        rating: 4.6,
        total_calls: 800000,
      },
      {
        id: '5',
        slug: 'postgres-db',
        name: 'PostgreSQL Database',
        description: 'SQL database queries and management',
        category: 'Database',
        capabilities: ['query', 'insert', 'update', 'delete'],
        author: 'Community',
        version: '1.2.0',
        cost_per_call_cents: 0,
        avg_latency_ms: 50,
        rating: 4.5,
        total_calls: 3000000,
      },
    ];

    let filtered = mockServers;

    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.capabilities.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === options.category?.toLowerCase()
      );
    }

    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      servers: paginated,
      total: filtered.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private getMockCategories(): string[] {
    return [
      'AI',
      'Developer Tools',
      'Finance',
      'Communication',
      'Database',
      'Analytics',
      'Security',
      'Storage',
      'Automation',
      'Productivity',
    ];
  }
}

export const mcpDiscovery = new MCPDiscoveryClient();
