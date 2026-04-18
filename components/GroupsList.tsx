'use client';

import { Group } from '@/store/useAppStore';

interface Props {
  groups: Group[];
}

export default function GroupsList({ groups }: Props) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <span className="text-4xl">🏆</span>
        <p className="text-sm">グループに参加していません</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
        参加グループ — {groups.length}件
      </p>
      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <div
            key={group.id}
            id={`group-${group.id}`}
            className="flex items-center gap-4 p-3 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-yellow-500/30 hover:bg-[#141d2d] transition"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 flex items-center justify-center text-xl flex-shrink-0 border border-yellow-600/20">
              🏆
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{group.name}</p>
              <p className="text-xs text-yellow-400/80 mt-0.5">{group.role}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">
                {group.memberCount?.toLocaleString()}人
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
