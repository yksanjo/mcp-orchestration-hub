'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Play, Clock, Webhook } from 'lucide-react';
import type { TriggerNodeData } from '@/types';

interface TriggerNodeProps extends NodeProps {
  data: TriggerNodeData;
}

function TriggerNode({ data, selected }: TriggerNodeProps) {
  const triggerIcons = {
    manual: Play,
    schedule: Clock,
    webhook: Webhook,
  };

  const TriggerIcon = triggerIcons[data.triggerType] || Play;

  const triggerLabels = {
    manual: 'Manual Trigger',
    schedule: 'Scheduled',
    webhook: 'Webhook',
  };

  return (
    <div
      className={`bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg min-w-[160px] shadow-lg transition-all ${
        selected ? 'ring-2 ring-green-300 ring-offset-2' : ''
      }`}
    >
      {/* Body */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <TriggerIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {data.label || triggerLabels[data.triggerType]}
          </p>
          <p className="text-xs text-green-100">
            {data.triggerType === 'schedule' && data.config?.cron
              ? `Cron: ${data.config.cron}`
              : data.triggerType}
          </p>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-white !w-3 !h-3 !border-2 !border-green-600"
      />
    </div>
  );
}

export default memo(TriggerNode);
