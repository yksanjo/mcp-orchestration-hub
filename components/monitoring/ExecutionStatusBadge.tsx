'use client';

import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ExecutionStatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    label: 'Pending',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'Running',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Failed',
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    label: 'Cancelled',
  },
};

export default function ExecutionStatusBadge({
  status,
  size = 'md',
}: ExecutionStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${config.bg} ${config.color} ${config.border}
        ${sizeClasses[size]}
      `}
    >
      <Icon
        size={iconSizes[size]}
        className={status === 'running' ? 'animate-spin' : ''}
      />
      {config.label}
    </span>
  );
}
