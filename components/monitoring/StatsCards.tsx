'use client';

import { Activity, CheckCircle2, XCircle, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalExecutions: number;
    successfulRuns: number;
    failedRuns: number;
    totalCost: number;
    avgDuration: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Executions',
      value: stats.totalExecutions.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Success Rate',
      value: stats.totalExecutions > 0
        ? `${((stats.successfulRuns / stats.totalExecutions) * 100).toFixed(1)}%`
        : '0%',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Failed Runs',
      value: stats.failedRuns.toLocaleString(),
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      title: 'Total Cost',
      value: `$${(stats.totalCost / 100).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg border p-4 flex items-center gap-4"
        >
          <div className={`${card.bg} ${card.color} p-3 rounded-lg`}>
            <card.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
