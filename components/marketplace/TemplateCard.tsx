'use client';

import Link from 'next/link';
import { Star, Download, DollarSign, User } from 'lucide-react';
import type { Template } from '@/types';

interface TemplateCardProps {
  template: Template & {
    author?: { name: string | null; avatar_url: string | null };
  };
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const formatPrice = () => {
    if (template.pricing_type === 'free') {
      return 'Free';
    }
    if (template.price_cents === 0) {
      return 'Free';
    }
    return `$${(template.price_cents / 100).toFixed(2)}`;
  };

  return (
    <Link
      href={`/marketplace/${template.id}`}
      className="group block bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Header / Preview */}
      <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl font-bold opacity-50">
            {template.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {template.description}
            </p>
          </div>
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap
              ${template.pricing_type === 'free'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'}
            `}
          >
            {formatPrice()}
          </span>
        </div>

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {template.category}
          </span>
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{template.tags.length - 2}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.install_count.toLocaleString()}
            </span>
            {template.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {template.rating_avg?.toFixed(1)} ({template.rating_count})
              </span>
            )}
          </div>
          {template.author && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span className="truncate max-w-[80px]">
                {template.author.name || 'Unknown'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
