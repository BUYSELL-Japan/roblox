'use client';

import { Friend } from '@/store/useAppStore';

interface Props {
  friends: Friend[];
  onClickFriend: (userId: string) => void;
}

export default function FriendsGrid({ friends, onClickFriend }: Props) {
  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <span className="text-4xl">👫</span>
        <p className="text-sm">フレンドがいません（非公開設定の可能性があります）</p>
      </div>
    );
  }

  const online = friends.filter(f => f.isOnline);
  const offline = friends.filter(f => !f.isOnline);
  const sorted = [...online, ...offline];

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          全フレンド {friends.length}人
        </p>
        {online.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            {online.length}人オンライン
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sorted.map((friend) => {
          const name = (friend.displayName && friend.displayName.trim()) || friend.username || '(不明)';
          const showUsername = friend.username && friend.username !== friend.displayName;
          return (
            <div
              key={friend.userId}
              id={`friend-${friend.userId}`}
              onClick={() => onClickFriend(String(friend.userId))}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-cyan-500/50 hover:bg-[#141d2d] transition cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#1e2a3a] group-hover:border-cyan-500 transition"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1e2a3a] flex items-center justify-center text-2xl">
                    🎮
                  </div>
                )}
                {friend.isOnline && (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111827]" />
                )}
              </div>
              <div className="w-full text-center min-w-0">
                {/* Always show displayName or fallback — guaranteed visible */}
                <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition break-words leading-snug">
                  {name}
                </p>
                {showUsername && (
                  <p className="text-[11px] text-gray-500 break-words leading-snug mt-0.5">
                    @{friend.username}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
