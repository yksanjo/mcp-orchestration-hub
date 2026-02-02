import Link from 'next/link';
import {
  Workflow,
  Activity,
  Store,
  Zap,
  Settings,
  User,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                MCP Hub
              </span>
            </Link>

            {/* Main Nav */}
            <div className="flex items-center gap-1">
              <Link
                href="/workflows"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Workflow className="h-5 w-5" />
                <span className="font-medium">Workflows</span>
              </Link>
              <Link
                href="/monitoring"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Activity className="h-5 w-5" />
                <span className="font-medium">Monitoring</span>
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Store className="h-5 w-5" />
                <span className="font-medium">Marketplace</span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link
                href="/workflows/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <Plus className="h-4 w-4" />
                <span>New Workflow</span>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Link
                href="/settings"
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                {user && (
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {user.email?.split('@')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto">{children}</main>
    </div>
  );
}
