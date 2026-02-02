'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import type { ConditionNodeData } from '@/types';

interface ConditionNodeProps extends NodeProps {
  data: ConditionNodeData;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg min-w-[160px] shadow-lg transition-all ${
        selected ? 'ring-2 ring-amber-300 ring-offset-2' : ''
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white !w-3 !h-3 !border-2 !border-amber-600"
      />

      {/* Body */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {data.label || 'Condition'}
          </p>
          <p className="text-xs text-amber-100 truncate max-w-[120px]">
            {data.condition || 'Not configured'}
          </p>
        </div>
      </div>

      {/* Branch labels */}
      <div className="flex justify-between px-4 pb-2 text-xs text-white/80">
        <span>{data.trueLabel || 'True'}</span>
        <span>{data.falseLabel || 'False'}</span>
      </div>

      {/* Output Handles - True (left) and False (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-400 !w-3 !h-3 !border-2 !border-white !left-[25%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-400 !w-3 !h-3 !border-2 !border-white !left-[75%]"
      />
    </div>
  );
}

export default memo(ConditionNode);
