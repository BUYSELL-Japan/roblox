'use client';

import { useState } from 'react';
import { useVersusStore } from '@/store/useVersusStore';
import { Shield, Zap, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VsInterface() {
  const { player1, player2, isVsMode, isLoading, setPlayer1, setPlayer2, startVsMode, setEmote } = useVersusStore();
  const [p1Input, setP1Input] = useState('4460761705');
  const [p2Input, setP2Input] = useState('');

  const handleStart = async () => {
    if (!p1Input) return;
    await setPlayer1(p1Input);
    if (p2Input) {
      await setPlayer2(p2Input);
      startVsMode();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-cyber">
      {/* Header Info */}
      <div className="flex justify-between items-start w-full">
        {player1 ? (
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-glass p-6 rounded-xl border-glow pointer-events-auto w-80">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 uppercase tracking-wider">{player1.displayName}</h2>
            <p className="text-gray-400">@{player1.username} • ID: {player1.userId}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Users size={16} className="text-cyan-400" /> {player1.friendCount} Friends</div>
              <div className="flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400" /> Joined {player1.joinDate ? new Date(player1.joinDate).getFullYear() : 'Unknown'}</div>
              <div className="flex items-center gap-2"><Shield size={16} className="text-cyan-400" /> {player1.badges.length} Rare Badges</div>
            </div>
          </motion.div>
        ) : <div />}

        {player2 && isVsMode && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-glass p-6 rounded-xl border-glow pointer-events-auto w-80 text-right" style={{ borderColor: 'rgba(255, 0, 60, 0.8)', boxShadow: '0 0 10px rgba(255, 0, 60, 0.5)' }}>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-red-500 to-pink-600 uppercase tracking-wider">{player2.displayName}</h2>
            <p className="text-gray-400">@{player2.username} • ID: {player2.userId}</p>
            <div className="mt-4 space-y-2 text-sm flex flex-col items-end">
              <div className="flex items-center gap-2">{player2.friendCount} Friends <Users size={16} className="text-red-500" /></div>
              <div className="flex items-center gap-2">Joined {player2.joinDate ? new Date(player2.joinDate).getFullYear() : 'Unknown'} <TrendingUp size={16} className="text-red-500" /></div>
              <div className="flex items-center gap-2">{player2.badges.length} Rare Badges <Shield size={16} className="text-red-500" /></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Start UI Overlay */}
      <AnimatePresence>
        {!player1 && (
          <motion.div exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-cyber-dark/80 backdrop-blur-md">
            <div className="bg-glass p-10 rounded-2xl border-glow max-w-md w-full text-center">
              <Zap className="mx-auto text-cyan-400 mb-4" size={48} />
              <h1 className="text-4xl font-black mb-2 text-glow">ULTIMATE FLEX</h1>
              <p className="text-gray-400 mb-8">Enter Roblox User IDs to begin</p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Your User ID (e.g. 1)" 
                  className="w-full bg-black/50 border border-cyan-500/30 rounded p-4 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  value={p1Input}
                  onChange={(e) => setP1Input(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Opponent User ID (optional)" 
                  className="w-full bg-black/50 border border-red-500/30 rounded p-4 text-white focus:outline-none focus:border-red-400 transition-colors"
                  value={p2Input}
                  onChange={(e) => setP2Input(e.target.value)}
                />
                <button 
                  onClick={handleStart}
                  disabled={isLoading || !p1Input}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded uppercase tracking-widest mt-6 box-glow disabled:opacity-50"
                >
                  {isLoading ? 'INITIATING...' : 'BOOST ENGAGE'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emote Controls */}
      {player1 && (
        <div className="w-full flex justify-center pointer-events-auto pb-4">
          <div className="bg-glass p-2 rounded-full flex gap-4 border-glow">
            {['idle', 'dance', 'wave', 'flex'].map((emote) => (
              <button
                key={emote}
                onClick={() => setEmote(emote as any)}
                className="px-6 py-3 rounded-full uppercase tracking-wider font-bold text-sm bg-black/50 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
              >
                {emote}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
