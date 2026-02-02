# MCP Orchestration Hub

A powerful visual workflow builder for chaining MCP (Model Context Protocol) servers into automated workflows.

## Features

### 🧩 Visual Workflow Builder
- Drag-and-drop interface powered by ReactFlow
- Multiple node types: MCP Servers, Triggers, Conditions, Outputs
- Connect nodes with data mapping between outputs and inputs
- Configure error handling strategies (fail, retry, skip, continue)

### 🔌 MCP Server Integration
- Browse and search MCP servers from the discovery registry
- Auto-configure node inputs/outputs based on server capabilities
- Cost tracking per MCP call
- Real-time availability status

### ⚡ Workflow Execution Engine
- Execute workflows with real-time monitoring
- Parallel and sequential execution modes
- Automatic retry with exponential backoff
- Cost limits and timeout protection

### 📊 Real-time Monitoring Dashboard
- Live execution status updates
- Detailed execution timeline with node-level visibility
- Input/output data inspection
- Error tracking and debugging
- Performance metrics and cost analysis

### 🏪 Template Marketplace
- Browse community-contributed workflow templates
- Free and paid templates with revenue sharing
- Install templates with one click
- Rate and review templates
- Submit your own templates

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Workflow Engine**: Custom execution engine with ReactFlow
- **Payment**: Stripe (for template marketplace)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account (for marketplace features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-orchestration-hub.git
cd mcp-orchestration-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
MCP_DISCOVERY_API=https://mcp-discovery-two.vercel.app
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  definition JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  is_template BOOLEAN DEFAULT FALSE,
  template_price_cents INTEGER,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_cost_cents INTEGER DEFAULT 0,
  current_node_id TEXT,
  completed_nodes TEXT[],
  failed_nodes TEXT[]
);

-- Node executions table
CREATE TABLE node_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  mcp_server_slug TEXT,
  mcp_cost_cents INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  tags TEXT[],
  pricing_type TEXT DEFAULT 'free',
  price_cents INTEGER DEFAULT 0,
  revenue_share_percent INTEGER DEFAULT 70,
  install_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(2,1),
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template installs table
CREATE TABLE template_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  price_paid_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Template reviews table
CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  monthly_workflow_runs INTEGER DEFAULT 100,
  used_workflow_runs INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  stripe_connect_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own executions"
  ON workflow_executions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own node executions"
  ON node_executions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = node_executions.execution_id
    AND we.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view approved templates"
  ON templates FOR SELECT USING (status = 'approved');

CREATE POLICY "Authors can manage own templates"
  ON templates FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Users can view own installs"
  ON template_installs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own installs"
  ON template_installs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reviews"
  ON template_reviews FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;
```

## Project Structure

```
mcp-orchestration-hub/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Dashboard routes
│   │   ├── page.tsx           # Dashboard home
│   │   ├── layout.tsx         # Dashboard layout
│   │   ├── workflows/         # Workflow management
│   │   ├── monitoring/        # Execution monitoring
│   │   └── marketplace/       # Template marketplace
│   └── api/                   # API routes
│       ├── workflows/         # Workflow CRUD
│       ├── executions/        # Execution management
│       ├── templates/         # Template marketplace
│       └── mcp/               # MCP discovery
├── components/                # React components
│   ├── workflow-builder/      # ReactFlow components
│   ├── monitoring/            # Monitoring components
│   └── marketplace/           # Marketplace components
├── lib/                       # Utility functions
│   ├── supabase/              # Supabase clients
│   ├── mcp-discovery.ts       # MCP Discovery client
│   ├── workflow-execution.ts  # Execution engine
│   └── utils.ts               # Helper functions
├── types/                     # TypeScript types
└── public/                    # Static assets
```

## Usage

### Creating a Workflow

1. Click "New Workflow" or go to `/workflows/new`
2. Drag nodes from the palette onto the canvas
3. Connect nodes by dragging from output handles to input handles
4. Configure each node by clicking on it
5. Save and activate your workflow

### Running a Workflow

1. Go to your workflow's detail page
2. Click "Run" to execute manually
3. Or configure a trigger (schedule/webhook) for automatic execution
4. Monitor execution in real-time on the Monitoring page

### Using Templates

1. Browse the Template Marketplace at `/marketplace`
2. Filter by category, price, or search
3. Click on a template to view details
4. Click "Install" to add it to your workflows
5. Customize and activate

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email support@mcporchestration.hub or join our Discord community.
