import React, { useState, useRef, useEffect } from 'react';
import { Settings, Zap } from 'lucide-react';
import { PlayerStats } from '../types';
import { CLICK_POWER_VALUES } from '../constants';

interface ClickerTabProps {
  stats: PlayerStats;
  onWork: () => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export const ClickerTab: React.FC<ClickerTabProps> = ({ stats, onWork }) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const counterRef = useRef(0);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent double tap zoom
    
    // Calculate click coordinates relative to button center for effect variation or strict touch point
    // Using clientX/Y from event
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const clickValue = CLICK_POWER_VALUES(stats.clickPowerLevel);
    
    const newText: FloatingText = {
      id: counterRef.current++,
      x: clientX,
      y: clientY,
      value: clickValue
    };

    setFloatingTexts(prev => [...prev, newText]);
    onWork();

    // Cleanup text after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-yellow-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-10 w-40 h-40 bg-slate-500 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center mb-8 z-10">
        <h2 className="text-2xl font-black uppercase text-slate-400 mb-2 tracking-widest">Shift Status</h2>
        <div className="inline-flex items-center space-x-2 bg-industrial-800 px-4 py-1 rounded-full border border-industrial-700">
           <Zap size={16} className="text-yellow-500" />
           <span className="font-mono text-yellow-500">Power Lvl {stats.clickPowerLevel}</span>
        </div>
      </div>

      <button
        ref={buttonRef}
        onTouchStart={handleClick}
        onClick={(e) => {
           // Fallback for non-touch devices, prevent double firing if touch is supported
           if (!('ontouchstart' in window)) handleClick(e);
        }}
        className="relative group w-64 h-64 rounded-full bg-gradient-to-br from-industrial-800 to-industrial-900 border-8 border-industrial-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-95 transition-transform duration-100 flex items-center justify-center z-20 outline-none select-none -webkit-tap-highlight-color-transparent"
      >
        <div className="absolute inset-0 rounded-full border-4 border-industrial-accent opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="absolute inset-4 rounded-full border border-dashed border-slate-500 animate-[spin_10s_linear_infinite]"></div>
        
        <div className="flex flex-col items-center pointer-events-none">
          <Settings size={64} className="text-industrial-accent mb-2 animate-[spin_4s_linear_infinite_reverse]" />
          <span className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-lg">WORK</span>
        </div>
      </button>

      <div className="mt-12 text-center text-slate-500 text-sm max-w-xs z-10">
        Tap to manually operate machinery and earn starting capital.
      </div>

      {/* Floating Texts Layer */}
      {floatingTexts.map(text => (
        <div
          key={text.id}
          className="fixed pointer-events-none text-3xl font-bold text-green-400 animate-float-up z-50 drop-shadow-md font-mono"
          style={{ left: text.x, top: text.y }}
        >
          +${text.value}
        </div>
      ))}
    </div>
  );
};