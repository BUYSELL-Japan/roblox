'use client';

import { Game } from '@/store/useAppStore';

interface Props {
  games: Game[];
}

export default function GamesGrid({ games }: Props) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <span className="text-4xl">🎮</span>
        <p className="text-sm">公開ゲームがありません</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
        作成したゲーム — {games.length}件
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            id={`game-${game.id}`}
            className="flex flex-col gap-2 p-3 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-green-500/50 hover:bg-[#141d2d] transition"
          >
            {game.thumbnailUrl ? (
              <img
                src={game.thumbnailUrl}
                alt={game.name}
                className="w-full aspect-video rounded-lg object-cover"
              />
            ) : (
              <div className="w-full aspect-video rounded-lg bg-[#1e2a3a] flex items-center justify-center text-3xl">
                🎮
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white line-clamp-2">{game.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                👀 {game.placeVisits?.toLocaleString() ?? 0} プレイ
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
