'use client';

import { useState, useEffect } from 'react';
import { TemplateCard, TemplateFilters } from '@/components/marketplace';
import { Loader2, Store, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Template } from '@/types';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    pricing: 'all',
    sort: 'popular',
  });

  const pageSize = 12;

  useEffect(() => {
    fetchTemplates();
  }, [page, filters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', pageSize.toString());
      params.set('offset', ((page - 1) * pageSize).toString());
      params.set('sort', filters.sort);
      if (filters.category) params.set('category', filters.category);
      if (filters.pricing !== 'all') params.set('pricing', filters.pricing);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/templates?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6" />
            Template Marketplace
          </h1>
          <p className="text-gray-500">
            Discover and install pre-built workflow templates
          </p>
        </div>
        <Link
          href="/marketplace/submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit Template
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <TemplateFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Templates Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
