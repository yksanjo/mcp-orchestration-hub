'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import type { Node } from 'reactflow';
import type { MCPServer, MCPNodeData } from '@/types';

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<MCPNodeData>) => void;
}

export default function NodeConfigPanel({
  node,
  onClose,
  onUpdate,
}: NodeConfigPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [onError, setOnError] = useState<'fail' | 'retry' | 'skip' | 'continue'>(
    'fail'
  );
  const [maxRetries, setMaxRetries] = useState(3);
  const [timeout, setTimeout] = useState(30000);

  useEffect(() => {
    if (node) {
      const data = node.data as MCPNodeData;
      setLabel(data.label || '');
      setOnError(data.onError || 'fail');
      setMaxRetries(data.maxRetries || 3);
      setTimeout(data.timeout || 30000);
    }
  }, [node]);

  const searchServers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setServers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/mcp/discover?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to search servers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      searchServers(searchQuery);
    }, 300);
    return () => globalThis.clearTimeout(timer);
  }, [searchQuery, searchServers]);

  const selectServer = (server: MCPServer) => {
    if (!node) return;
    onUpdate(node.id, {
      mcpServer: server,
      label: server.name,
      inputs: [
        {
          id: 'input',
          name: 'Input',
          type: 'object',
          required: true,
        },
      ],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          type: 'object',
        },
      ],
    });
    setLabel(server.name);
    setSearchQuery('');
    setServers([]);
  };

  const handleSave = () => {
    if (!node) return;
    onUpdate(node.id, {
      label,
      onError,
      maxRetries,
      timeout,
    });
  };

  if (!node) return null;

  const nodeData = node.data as MCPNodeData;

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Configure Node
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Node name"
          />
        </div>

        {/* MCP Server Search (only for mcpServer nodes) */}
        {node.type === 'mcpServer' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              MCP Server
            </label>
            {nodeData.mcpServer ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {nodeData.mcpServer.name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {nodeData.mcpServer.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-200">
                    {nodeData.mcpServer.category}
                  </span>
                  <button
                    onClick={() =>
                      onUpdate(node.id, { mcpServer: undefined, label: 'MCP Server' })
                    }
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search MCP servers..."
                />

                {/* Search Results */}
                {(servers.length > 0 || loading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      </div>
                    ) : (
                      servers.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => selectServer(server)}
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                        >
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {server.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {server.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                              {server.category}
                            </span>
                            {server.cost_per_call_cents !== undefined &&
                              server.cost_per_call_cents > 0 && (
                                <span className="text-xs text-slate-400">
                                  ${(server.cost_per_call_cents / 100).toFixed(2)}/call
                                </span>
                              )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Handling */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            On Error
          </label>
          <select
            value={onError}
            onChange={(e) => {
              setOnError(e.target.value as typeof onError);
              onUpdate(node.id, { onError: e.target.value as typeof onError });
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fail">Fail workflow</option>
            <option value="retry">Retry node</option>
            <option value="skip">Skip node</option>
            <option value="continue">Continue anyway</option>
          </select>
        </div>

        {/* Max Retries (only show if retry selected) */}
        {onError === 'retry' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxRetries}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setMaxRetries(value);
                onUpdate(node.id, { maxRetries: value });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Timeout (ms)
          </label>
          <input
            type="number"
            min={1000}
            max={300000}
            step={1000}
            value={timeout}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setTimeout(value);
              onUpdate(node.id, { timeout: value });
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(timeout / 1000).toFixed(0)} seconds
          </p>
        </div>

        {/* Node Info */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            Node ID: <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">{node.id}</code>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Type: <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">{node.type}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
