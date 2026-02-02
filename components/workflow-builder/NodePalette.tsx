'use client';

import { useState } from 'react';
import {
  Server,
  Play,
  GitBranch,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface NodePaletteProps {
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    nodeData: Record<string, unknown>
  ) => void;
}

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    triggers: true,
    servers: true,
    logic: true,
    outputs: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const nodeTypes = {
    triggers: [
      {
        type: 'trigger',
        label: 'Manual Trigger',
        icon: Play,
        data: { triggerType: 'manual', label: 'Manual Trigger', config: {} },
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      },
    ],
    servers: [
      {
        type: 'mcpServer',
        label: 'MCP Server',
        icon: Server,
        data: {
          label: 'MCP Server',
          inputs: [],
          outputs: [],
          config: {},
          onError: 'fail',
          maxRetries: 3,
          timeout: 30000,
        },
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      },
    ],
    logic: [
      {
        type: 'condition',
        label: 'Condition',
        icon: GitBranch,
        data: { label: 'Condition', condition: '', trueLabel: 'True', falseLabel: 'False' },
        color:
          'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      },
    ],
    outputs: [
      {
        type: 'output',
        label: 'Output',
        icon: Download,
        data: { outputType: 'return', label: 'Output', config: {} },
        color:
          'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      },
    ],
  };

  const sectionLabels: Record<string, string> = {
    triggers: 'Triggers',
    servers: 'MCP Servers',
    logic: 'Logic',
    outputs: 'Outputs',
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full overflow-y-auto">
      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Node Types */}
      <div className="p-2">
        {Object.entries(nodeTypes).map(([section, nodes]) => (
          <div key={section} className="mb-2">
            <button
              onClick={() => toggleSection(section)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
            >
              {expandedSections[section] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {sectionLabels[section]}
            </button>

            {expandedSections[section] && (
              <div className="mt-1 space-y-1">
                {nodes.map((node) => (
                  <div
                    key={node.type + node.label}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.data)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${node.color} hover:opacity-80`}
                  >
                    <node.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{node.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <p className="text-xs text-slate-400">
          Drag nodes onto the canvas to build your workflow. Connect nodes by
          dragging from output to input handles.
        </p>
      </div>
    </div>
  );
}
