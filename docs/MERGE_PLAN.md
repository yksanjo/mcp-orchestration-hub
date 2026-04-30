# Merge plan: mcp-discovery + mcp-orchestration-hub

## Diagnosis

These two repos are halves of one product:

- **`mcp-discovery`** — TypeScript / Node + Express + Supabase. The agent-facing API and the index of 14k MCP servers.
- **`mcp-orchestration-hub`** (this repo) — Next.js 16 + React 19 + ReactFlow + Stripe + Supabase. The visual workflow builder.

Both already use Supabase. Neither talks to the other today.

## Recommendation

**Don't merge codebases.** Different runtimes (Node API vs Next.js), different deploy surfaces, different audiences (agent libraries vs end-users). Forcing them into one repo creates a worse version of both.

Instead: **make this repo consume `mcp-discovery`'s API**, share Supabase, and market them as one product.

## Architecture

```
mcp.tools (one product)
├── api.mcp.tools    →  mcp-discovery (Node/Express, unchanged)
└── mcp.tools (UI)   →  mcp-orchestration-hub
                          consumes api.mcp.tools
                          shares Supabase project
```

## Concrete steps

1. **Share Supabase project** between both repos. Single source of truth for the server index. Add `mcp-discovery`'s anon key to this repo's env.
2. **Add `MCP_DISCOVERY_API_URL` env var** here. Replace any local server lists or hardcoded references with API calls.
3. **Build "Browse MCP Servers" page** that searches `mcp-discovery` API, renders results, and lets the user drag servers into the ReactFlow workflow.
4. **Unified domain.** Point `mcp.tools` at this repo, `api.mcp.tools` at `mcp-discovery`.
5. **Unified README narrative.** This repo's README markets the full product. `mcp-discovery`'s README becomes "API docs for mcp.tools".

## What NOT to do

- Don't rewrite `mcp-discovery` as Next.js API routes — it bloats this repo and slows scrapes.
- Don't share types via npm package yet — premature. Copy the `Server` type into this repo for now.
- Don't remove `mcp-discovery`'s standalone API — agent users (LangChain, AutoGPT) need it.

## Effort

2–3 days for v1 wired-together MVP. Most of the work is the "Browse MCP Servers" page and shared Supabase setup. Domain routing is one Vercel config change.

## Tracking

- [ ] Share Supabase project
- [ ] Add `MCP_DISCOVERY_API_URL` env + client wrapper
- [ ] Build `/browse` page consuming API
- [ ] Drag-from-browse into ReactFlow workflow
- [ ] Configure custom domain split
- [ ] Update both READMEs to reflect unified product
