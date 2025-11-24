import React from 'react';
import { Coins, Droplet } from 'lucide-react';
import { PlayerStats } from '../types';

interface HeaderProps {
  stats: PlayerStats;
  oilRate: number;
}

export const Header: React.FC<HeaderProps> = ({ stats, oilRate }) => {
  // Format numbers (e.g., 1.2k)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-industrial-900/95 backdrop-blur border-b border-industrial-700 p-3 z-40 shadow-lg">
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="bg-industrial-800 p-2 rounded-full border border-industrial-700">
            <Coins className="text-industrial-accent" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Balance</span>
            <span className="text-lg font-mono font-bold text-white">${formatNumber(stats.money)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Production</span>
            <span className="text-lg font-mono font-bold text-slate-200">
              {oilRate > 0 ? '+' : ''}{oilRate.toFixed(1)}/s
            </span>
          </div>
          <div className="bg-industrial-800 p-2 rounded-full border border-industrial-700">
            <Droplet className="text-black fill-black dark:text-slate-200 dark:fill-slate-200" size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};