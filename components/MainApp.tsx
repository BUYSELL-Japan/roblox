'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import ThreeScene from './ThreeScene';
import OutfitGrid from './OutfitGrid';
import SavedOutfitsGrid from './SavedOutfitsGrid';
import FriendsGrid from './FriendsGrid';
import GroupsList from './GroupsList';
import GamesGrid from './GamesGrid';
import CatalogSearch from './CatalogSearch';
import { Search, ChevronLeft, Info, Cpu } from 'lucide-react';

const TABS = [
  { id: 'outfit',   label: '装備中' },
  { id: 'outfits',  label: 'コーデ' },
  { id: 'friends',  label: 'フレンド' },
  { id: 'groups',   label: 'グループ' },
  { id: 'games',    label: 'ゲーム' },
  { id: 'catalog',  label: 'カタログ' },
] as const;

export default function MainApp() {
  const { profile, isLoading, error, activeTab, setActiveTab, loadProfile, loadFriendProfile, goBack, profileHistory, reset } = useAppStore();
  const [inputId, setInputId] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 初回ロード - 二重実行を防ぐために一工夫
  useEffect(() => {
    if (!profile && !isLoading) {
      loadProfile('4460761705');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) {
      loadProfile(inputId.trim());
      setShowSearch(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050508] text-white font-sans overflow-hidden flex flex-col select-none antialiased">
      
      {/* --- ヘッダー（名前表示に特化） --- */}
      <header className="h-14 w-full flex-shrink-0 flex items-center justify-between px-4 bg-[#0a0a12] border-b border-white/5 z-[110] relative">
        <div className="flex items-center gap-3 overflow-hidden">
          {profileHistory.length > 0 && (
            <button onClick={goBack} className="p-1 -ml-1 active:scale-90 transition">
              <ChevronLeft size={24} />
            </button>
          )}
          
          <div className="flex flex-col min-w-0 justify-center">
            {profile ? (
              <>
                <h1 className="text-sm font-black truncate text-white uppercase leading-none tracking-tight">
                  {profile.displayName}
                </h1>
                <div className="flex items-center gap-1 mt-1.5 opacity-70">
                   <Cpu size={10} className={isLoading ? 'animate-spin text-yellow-500' : 'text-cyan-500'} />
                   <p className="text-[8px] font-bold tracking-[0.1em] uppercase">
                     {isLoading ? 'Scanning Assets' : 'System Secure'}
                   </p>
                </div>
              </>
            ) : (
              <h1 onClick={reset} className="text-lg font-black tracking-tighter text-cyan-400">
                ROBLOX<span className="text-white">SCAN</span>
              </h1>
            )}
          </div>
        </div>
        <button onClick={() => setShowSearch(true)} className="p-2 text-gray-400 active:text-cyan-400 transition-colors">
          <Search size={20} />
        </button>
      </header>

      {/* --- 検索窓（オーバーレイ） --- */}
      {showSearch && (
        <div className="fixed inset-0 bg-[#0a0a12]/98 z-[200] p-6 pt-20 backdrop-blur-xl animate-in fade-in duration-200">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <input
              autoFocus
              type="text"
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              placeholder="ユーザーIDを入力…"
              className="w-full px-5 py-5 rounded-2xl bg-white/5 border border-white/10 text-xl focus:outline-none focus:border-cyan-500 shadow-2xl"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-4 rounded-2xl bg-cyan-500 text-black font-black text-sm uppercase tracking-widest">Execute Scan</button>
              <button type="button" onClick={() => setShowSearch(false)} className="px-6 py-4 rounded-2xl bg-white/10 font-bold text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* --- メインコンテンツ --- */}
      <main className="flex-1 w-full min-h-0 relative flex flex-col">
        
        {!profile && isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#050508]">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-cyan-400 font-bold tracking-widest text-[8px] uppercase animate-pulse">Initializing Data Stream</p>
          </div>
        ) : profile ? (
          <>
            {/* 上部: 3Dアバター (45%固定) */}
            <section className="h-[45%] w-full relative bg-[#050508] border-b border-white/5 overflow-hidden flex-shrink-0">
              {/* keyをuserIdのみに固定することで、データ更新時のチラつきを防ぐ */}
              <ThreeScene key={`scene-${profile.userId}`} userId={String(profile.userId)} />
            </section>

            {/* 中央: ナビゲーションタブ */}
            <nav className="h-12 w-full flex-shrink-0 bg-[#0a0a12] border-b border-white/5 flex overflow-x-auto no-scrollbar z-[60]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[75px] text-[10px] font-black uppercase tracking-widest transition-all relative ${
                    activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />
                  )}
                </button>
              ))}
            </nav>

            {/* 下部: コンテンツスクロールエリア */}
            <section className="flex-1 w-full overflow-y-auto bg-[#050508] relative">
              <div className="p-2 pb-16">
                
                {/* 
                  【重要】ここに重複していたあらゆるカードを徹底排除しました。
                  タブを切り替えた瞬間、装備リストやフレンドリストが最上部から表示されます。
                */}

                {activeTab === 'outfit'  && (
                   <OutfitGrid key={`outfit-${profile.userId}`} items={profile.outfitItems} />
                )}
                
                {activeTab === 'outfits' && <SavedOutfitsGrid outfits={profile.savedOutfits} />}
                {activeTab === 'friends' && <FriendsGrid friends={profile.friends} onClickFriend={loadFriendProfile} />}
                {activeTab === 'groups'  && <GroupsList groups={profile.groups} />}
                {activeTab === 'games'   && <GamesGrid games={profile.games} />}
                {activeTab === 'catalog' && <CatalogSearch />}

                {/* 詳細情報（登録日など）は「装備」タブの最後の方にのみ、控えめに表示 */}
                {activeTab === 'outfit' && (
                  <div className="mt-12 pt-10 border-t border-white/5 space-y-6 px-4 opacity-20">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Info size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Metadata Analyst</span>
                    </div>
                    {profile.description && (
                      <p className="text-[10px] text-gray-500 leading-relaxed italic">
                        "{profile.description}"
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <p className="text-[6px] text-gray-600 font-bold uppercase mb-1">Join Date</p>
                         <p className="text-[10px] text-gray-400 font-mono">{new Date(profile.joinDate).toLocaleDateString('ja-JP')}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[6px] text-gray-600 font-bold uppercase mb-1">Subject ID</p>
                         <p className="text-[10px] text-gray-400 font-mono">{profile.userId}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>

      {/* エラー時のみ表示される浮遊通知 */}
      {error && (
        <div className="fixed bottom-6 left-6 right-6 p-4 rounded-2xl bg-red-600/90 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-widest text-center z-[300] shadow-2xl border border-white/10">
          ⚠️ System Error: {error}
        </div>
      )}
    </div>
  );
}
