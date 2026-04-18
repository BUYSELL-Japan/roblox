'use client';

import React from 'react';
import { OutfitItem } from '@/store/useAppStore';

interface Props {
  items: OutfitItem[];
}

export default function OutfitGrid({ items }: Props) {
  // Simple check
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-sm font-bold">装備アイテムが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-4 px-2">
        <p className="text-[10px] text-cyan-400/60 font-black uppercase tracking-widest">
          EQUIPPED ASSETS ({items.length})
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => (
          <div
            key={`${item.assetId}-${index}`}
            className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5"
          >
            <div className="w-full aspect-square rounded-xl bg-black/40 overflow-hidden border border-white/5 relative">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl grayscale opacity-50">📦</div>
              )}
            </div>
            <span className="text-[8px] text-gray-600 font-mono">
              #{item.assetId.slice(-6)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
