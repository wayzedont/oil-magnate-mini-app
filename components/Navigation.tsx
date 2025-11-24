import React from 'react';
import { Pickaxe, Map, Bolt } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab }) => {
  const navItems = [
    { id: Tab.WORK, icon: Pickaxe, label: 'Work' },
    { id: Tab.LANDS, icon: Map, label: 'Empire' },
    { id: Tab.UPGRADES, icon: Bolt, label: 'Upgrades' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-industrial-900 border-t border-industrial-700 pb-safe pt-2 px-6 h-[80px] z-40">
      <div className="flex justify-between items-center h-full pb-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
              currentTab === item.id 
                ? 'text-industrial-accent' 
                : 'text-industrial-700 hover:text-industrial-500'
            }`}
          >
            <item.icon size={28} strokeWidth={currentTab === item.id ? 2.5 : 2} />
            <span className="text-xs font-bold mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};