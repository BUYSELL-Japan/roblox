'use client';

import React, { useState, useEffect } from 'react';
import MainApp from './MainApp';

export default function AppWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('AppWrapper mounted');
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold tracking-widest uppercase text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <MainApp />;
}
