import Link from 'next/link';
import { ArrowRight, Workflow, Activity, Store, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">MCP Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/workflows"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Orchestrate MCP Servers
            <br />
            <span className="text-blue-500">Into Powerful Workflows</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Chain 14,000+ MCP servers together with a visual builder.
            Monitor execution in real-time. Share and monetize your templates.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/workflows/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition flex items-center gap-2"
            >
              Build Your First Workflow
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/templates"
              className="border border-slate-600 hover:border-slate-500 text-white px-6 py-3 rounded-lg font-medium text-lg transition"
            >
              Browse Templates
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Workflow className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Visual Workflow Builder
            </h3>
            <p className="text-slate-400">
              Drag and drop MCP servers onto a canvas. Connect them to create
              complex data pipelines and automation flows.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="bg-green-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Real-time Monitoring
            </h3>
            <p className="text-slate-400">
              Watch your workflows execute in real-time. Track costs,
              debug failures, and optimize performance.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="bg-purple-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Template Marketplace
            </h3>
            <p className="text-slate-400">
              Share your workflows with the community. Monetize your
              templates and earn from every use.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">14K+</div>
            <div className="text-slate-400 mt-1">MCP Servers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">&lt;200ms</div>
            <div className="text-slate-400 mt-1">Save Latency</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">99.9%</div>
            <div className="text-slate-400 mt-1">Reliability</div>
          </div>
        </div>
      </main>
    </div>
  );
}
