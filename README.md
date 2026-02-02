# 🔗 MCP Orchestration Hub

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.93.3-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> 🚀 **Visual workflow builder for chaining MCP (Model Context Protocol) servers into automated, intelligent workflows**

<p align="center">
  <img src="https://raw.githubusercontent.com/yksanjo/mcp-orchestration-hub/main/public/screenshot.png" alt="MCP Orchestration Hub Screenshot" width="800">
</p>

---

## ✨ Features

### 🧩 Visual Workflow Builder
- **Drag-and-Drop Interface** powered by ReactFlow
- **Multiple Node Types**: MCP Servers, Triggers, Conditions, Outputs
- **Data Mapping**: Connect nodes with visual data flow between outputs and inputs
- **Error Handling**: Configure strategies (fail, retry, skip, continue) per node
- **Real-time Validation**: Visual feedback on connections and configurations

### 🔌 MCP Server Integration
- **Discovery Registry**: Browse and search MCP servers from the central registry
- **Auto-Configuration**: Node inputs/outputs automatically mapped from server capabilities
- **Cost Tracking**: Monitor per-call costs and total workflow spend
- **Health Monitoring**: Real-time server availability status

### ⚡ Workflow Execution Engine
- **Async Execution**: High-performance workflow runner with queue support
- **Parallel & Sequential**: Choose execution modes per workflow
- **Retry Logic**: Automatic exponential backoff for failed nodes
- **Cost Protection**: Set max cost limits and timeouts
- **State Management**: Track execution progress in real-time

### 📊 Real-time Monitoring Dashboard
- **Live Execution View**: Watch workflows run in real-time
- **Node-Level Detail**: Inspect inputs, outputs, and errors per node
- **Timeline Visualization**: See execution flow and timing
- **Performance Metrics**: Duration, cost, and success rate analytics
- **Error Debugging**: Full stack traces and error context

### 🏪 Template Marketplace
- **Community Templates**: Browse pre-built workflow templates
- **Revenue Sharing**: 70/30 split for template creators
- **One-Click Install**: Import and customize templates instantly
- **Rating System**: Community-driven quality ratings
- **Categories**: AI, Automation, Analytics, Communication, and more

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 4.1 |
| **UI Components** | React 19, Lucide Icons |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Realtime** | Supabase Realtime |
| **Workflow Engine** | Custom TypeScript Engine |
| **Visual Editor** | ReactFlow |
| **Payments** | Stripe |
| **Deployment** | Vercel Ready |

---

## 📁 Project Structure

```
mcp-orchestration-hub/
├── 📂 app/                        # Next.js App Router
│   ├── 📂 (dashboard)/           # Dashboard routes (grouped)
│   │   ├── 📄 page.tsx           # Dashboard home
│   │   ├── 📄 layout.tsx         # Dashboard layout with nav
│   │   ├── 📂 workflows/         # Workflow CRUD pages
│   │   │   ├── 📄 page.tsx       # Workflow list
│   │   │   ├── 📄 new/page.tsx   # Create workflow
│   │   │   └── 📂 [id]/          # Single workflow
│   │   │       ├── 📄 page.tsx   # Redirect to edit
│   │   │       └── 📂 edit/      # Workflow editor
│   │   ├── 📂 monitoring/        # Execution monitoring
│   │   │   ├── 📄 page.tsx       # Monitoring dashboard
│   │   │   └── 📄 ExecutionList.tsx
│   │   └── 📂 marketplace/       # Template marketplace
│   │       └── 📄 page.tsx       # Browse templates
│   └── 📂 api/                   # API routes
│       ├── 📂 workflows/         # Workflow CRUD endpoints
│       ├── 📂 executions/        # Execution management
│       ├── 📂 templates/         # Template marketplace API
│       └── 📂 mcp/               # MCP discovery endpoints
├── 📂 components/                # React components
│   ├── 📂 workflow-builder/      # ReactFlow node components
│   │   ├── 📄 WorkflowCanvas.tsx # Main canvas
│   │   ├── 📄 MCPServerNode.tsx  # MCP server node
│   │   ├── 📄 TriggerNode.tsx    # Trigger node
│   │   ├── 📄 ConditionNode.tsx  # Condition node
│   │   ├── 📄 OutputNode.tsx     # Output node
│   │   ├── 📄 NodePalette.tsx    # Draggable palette
│   │   └── 📄 NodeConfigPanel.tsx# Configuration sidebar
│   ├── 📂 monitoring/            # Monitoring components
│   │   ├── 📄 RealtimeExecutions.tsx
│   │   ├── 📄 ExecutionTimeline.tsx
│   │   ├── 📄 ExecutionStatusBadge.tsx
│   │   └── 📄 StatsCards.tsx
│   └── 📂 marketplace/           # Marketplace components
│       ├── 📄 TemplateCard.tsx
│       └── 📄 TemplateFilters.tsx
├── 📂 lib/                       # Utility functions
│   ├── 📂 supabase/              # Supabase clients
│   │   ├── 📄 client.ts          # Browser client
│   │   ├── 📄 server.ts          # Server client
│   │   └── 📄 middleware.ts      # Auth middleware
│   ├── 📄 mcp-discovery.ts       # MCP Discovery API client
│   ├── 📄 workflow-execution.ts  # Execution engine
│   └── 📄 utils.ts               # Helper functions
├── 📂 types/                     # TypeScript types
│   └── 📄 index.ts               # Global type definitions
└── 📄 package.json               # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account (free tier works)
- Stripe account (for marketplace features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yksanjo/mcp-orchestration-hub.git
cd mcp-orchestration-hub

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Configure your .env.local:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
MCP_DISCOVERY_API=https://mcp-discovery-two.vercel.app

# 5. Run the development server
npm run dev

# 6. Open http://localhost:3000
```

### Database Setup

Run this SQL in your Supabase SQL Editor:

<details>
<summary>📜 Click to expand SQL schema</summary>

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

-- Workflow executions
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

-- Node executions
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

-- Templates
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

-- Template installs
CREATE TABLE template_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  price_paid_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Template reviews
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

-- Profiles
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

-- Enable RLS and policies
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

CREATE POLICY "Anyone can view approved templates"
  ON templates FOR SELECT USING (status = 'approved');

ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;
```
</details>

---

## 💡 Usage

### Creating a Workflow

1. Click **"New Workflow"** or go to `/workflows/new`
2. Drag nodes from the palette onto the canvas:
   - 🎬 **Trigger**: Manual, Scheduled, or Webhook
   - 🔌 **MCP Server**: Connect to any MCP server
   - 🔀 **Condition**: Branch logic based on data
   - 📤 **Output**: Return, Webhook, or Store results
3. Connect nodes by dragging from output to input handles
4. Configure each node (click to open config panel)
5. Save and activate your workflow

### Running a Workflow

```typescript
// Execute via API
const response = await fetch('/api/workflows/{id}/execute', {
  method: 'POST',
  body: JSON.stringify({ input: { message: 'Hello' } })
});

const result = await response.json();
```

Or use the **Run** button in the UI for manual execution.

### Installing Templates

1. Visit `/marketplace`
2. Filter by category, price, or search
3. Click on a template to view details
4. Click **"Install"** to add to your workflows
5. Customize and activate

---

## 🔌 MCP Server Integration

The platform integrates with the [MCP Discovery Registry](https://mcp-discovery-two.vercel.app) to find and use MCP servers:

```typescript
// Example: Using an MCP server in a workflow node
{
  type: 'mcpServer',
  data: {
    mcpServer: {
      slug: 'openai-chat',
      name: 'OpenAI Chat',
      cost_per_call_cents: 1
    },
    inputs: [
      { name: 'prompt', source: '$input.message' }
    ],
    onError: 'retry',
    maxRetries: 3
  }
}
```

---

## 📸 Screenshots

| Workflow Builder | Monitoring Dashboard | Marketplace |
|------------------|---------------------|-------------|
| ![Builder](docs/screenshots/builder.png) | ![Monitoring](docs/screenshots/monitoring.png) | ![Marketplace](docs/screenshots/marketplace.png) |

---

## 🛣️ Roadmap

- [x] Visual workflow builder
- [x] MCP server integration
- [x] Workflow execution engine
- [x] Real-time monitoring
- [x] Template marketplace
- [ ] Webhook triggers
- [ ] Scheduled workflows (cron)
- [ ] Multi-environment deployments
- [ ] Workflow versioning
- [ ] Team collaboration
- [ ] Advanced analytics

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [ReactFlow](https://reactflow.dev/) - Visual workflow editor
- [Supabase](https://supabase.com/) - Backend infrastructure
- [MCP](https://modelcontextprotocol.io/) - Model Context Protocol
- [Next.js](https://nextjs.org/) - React framework

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/yksanjo">@yksanjo</a>
</p>
