'use client';

import { SavedOutfit } from '@/store/useAppStore';

interface Props {
  outfits: SavedOutfit[];
}

export default function SavedOutfitsGrid({ outfits }: Props) {
  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <span className="text-4xl">🎽</span>
        <p className="text-sm">保存済みコーデがありません</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
        保存コーデ — {outfits.length}件
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {outfits.map((outfit) => (
          <div
            key={String(outfit.id)}
            id={`outfit-saved-${outfit.id}`}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-purple-500/50 hover:bg-[#141d2d] transition"
          >
            {outfit.thumbnailUrl ? (
              <img
                src={outfit.thumbnailUrl}
                alt={outfit.name}
                className="w-full aspect-square rounded-lg object-cover"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-[#1e2a3a] flex items-center justify-center text-3xl">
                🎽
              </div>
            )}
            <p className="text-xs text-white font-medium text-center leading-tight line-clamp-2 break-words w-full">
              {outfit.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
