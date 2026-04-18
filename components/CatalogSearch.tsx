'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

const CATEGORIES = [
  'All', 'Clothing', 'Accessories', 'AvatarAnimations',
  'BodyParts', 'Gear', 'Hats', 'Faces', 'Shirts', 'Pants',
];

export default function CatalogSearch() {
  const { catalogItems, catalogLoading, catalogNextCursor, searchCatalog, loadMoreCatalog } = useAppStore();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const loaderRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (catalogItems.length === 0) searchCatalog('', 'All');
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && catalogNextCursor && !catalogLoading) {
          loadMoreCatalog();
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [catalogNextCursor, catalogLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCatalog(keyword, category);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-[#1e2a3a] bg-[#0a0a12] flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
          <input
            id="catalog-keyword-input"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search catalog…"
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-[#111827] border border-[#1e2a3a] text-sm focus:outline-none focus:border-cyan-500 transition"
          />
          <select
            id="catalog-category-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#111827] border border-[#1e2a3a] text-sm focus:outline-none focus:border-cyan-500 transition"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            id="catalog-search-btn"
            type="submit"
            disabled={catalogLoading}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition disabled:opacity-50"
          >
            {catalogLoading ? '…' : 'Search'}
          </button>
        </form>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {catalogItems.length === 0 && !catalogLoading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
            <span className="text-4xl">🛒</span>
            <p className="text-sm">Search the Roblox catalog above</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {catalogItems.map((item) => (
            <a
              key={item.id}
              href={`https://www.roblox.com/catalog/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              id={`catalog-item-${item.id}`}
              className="group flex flex-col gap-1.5 p-2 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-cyan-500/50 hover:bg-[#141d2d] transition"
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="w-full aspect-square rounded-lg object-cover"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-[#1e2a3a] flex items-center justify-center text-3xl">
                  📦
                </div>
              )}
              <p className="text-xs text-white font-medium truncate leading-tight group-hover:text-cyan-400 transition">
                {item.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{item.creatorName}</p>
              {(item.price != null || item.lowestPrice != null) && (
                <p className="text-xs font-bold text-green-400">
                  R$ {item.lowestPrice ?? item.price}
                </p>
              )}
            </a>
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="h-16 flex items-center justify-center">
          {catalogLoading && (
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
