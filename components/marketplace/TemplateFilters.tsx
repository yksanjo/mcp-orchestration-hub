'use client';

import { Search, Filter, SlidersHorizontal } from 'lucide-react';

interface TemplateFiltersProps {
  filters: {
    search: string;
    category: string;
    pricing: string;
    sort: string;
  };
  onChange: (filters: TemplateFiltersProps['filters']) => void;
}

const categories = [
  'All Categories',
  'AI',
  'Automation',
  'Analytics',
  'Communication',
  'Database',
  'Developer Tools',
  'Finance',
  'Productivity',
  'Security',
  'Storage',
];

const pricingOptions = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price: Low to High' },
];

export default function TemplateFilters({ filters, onChange }: TemplateFiltersProps) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <SlidersHorizontal className="w-5 h-5" />
        <h3 className="font-semibold">Filters</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat === 'All Categories' ? '' : cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Pricing
        </label>
        <div className="flex gap-2">
          {pricingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ ...filters, pricing: option.value })}
              className={`
                flex-1 px-3 py-2 text-sm rounded-lg border transition-colors
                ${filters.pricing === option.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'hover:bg-gray-50'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Sort By
        </label>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
