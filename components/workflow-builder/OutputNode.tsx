'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Download, Webhook, Database } from 'lucide-react';
import type { OutputNodeData } from '@/types';

interface OutputNodeProps extends NodeProps {
  data: OutputNodeData;
}

function OutputNode({ data, selected }: OutputNodeProps) {
  const outputIcons = {
    return: Download,
    webhook: Webhook,
    store: Database,
  };

  const OutputIcon = outputIcons[data.outputType] || Download;

  const outputLabels = {
    return: 'Return Output',
    webhook: 'Send to Webhook',
    store: 'Store Result',
  };

  return (
    <div
      className={`bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg min-w-[160px] shadow-lg transition-all ${
        selected ? 'ring-2 ring-purple-300 ring-offset-2' : ''
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white !w-3 !h-3 !border-2 !border-purple-600"
      />

      {/* Body */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <OutputIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {data.label || outputLabels[data.outputType]}
          </p>
          <p className="text-xs text-purple-100">{data.outputType}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(OutputNode);
