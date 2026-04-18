'use client';

import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AvatarModel from './AvatarModel';
import BadgeOrbit from './BadgeOrbit';
import { useVersusStore } from '@/store/useVersusStore';

interface Props {
  userId: string;
}

export default function ThreeScene({ userId }: Props) {
  const { player1, setPlayer1, emoteState } = useVersusStore();

  // Load 3D data independently inside the scene component
  useEffect(() => {
    if (userId) {
      console.log(`[ThreeScene] Initializing data for: ${userId}`);
      setPlayer1(userId);
    }
  }, [userId]); // Only when userId prop changes

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050508]">
      <Canvas camera={{ position: [0, 2.5, 7], fov: 40 }} shadows>
        <ambientLight intensity={1.5} />
        <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={1} color="#00f0ff" />
        
        {player1 && (
          <group position={[0, -1.2, 0]}>
            <AvatarModel 
              avatarImageUrl={player1.avatarImageUrl} 
              emoteState={emoteState} 
            />
            <BadgeOrbit badges={player1.badges} />
          </group>
        )}

        <OrbitControls 
          enablePan={false} 
          enableZoom={true}
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.8} 
          makeDefault
        />
      </Canvas>

      {/* Internal Emote Overlay to keep buttons simple and stable */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1 overflow-x-auto no-scrollbar pointer-events-auto">
        {(['idle', 'dance', 'wave', 'flex'] as const).map((e) => (
          <button
            key={e}
            onClick={() => useVersusStore.getState().setEmote(e)}
            className={`px-4 py-2 rounded-xl border transition-all text-[8px] font-black uppercase tracking-widest ${
              emoteState === e 
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                : 'bg-black/60 text-white border-white/10 backdrop-blur-md'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
