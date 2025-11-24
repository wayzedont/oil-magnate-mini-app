import React from 'react';
import { PlayerStats } from '../types';
import { Button } from './ui/Button';
import { SKILL_COSTS, CLICK_POWER_VALUES } from '../constants';
import { Zap, Search, Cog } from 'lucide-react';

interface UpgradesTabProps {
  stats: PlayerStats;
  onUpgrade: (type: 'CLICK' | 'ANALYSIS' | 'TECH') => void;
}

export const UpgradesTab: React.FC<UpgradesTabProps> = ({ stats, onUpgrade }) => {
  
  const upgrades = [
    {
      id: 'CLICK',
      name: 'Hydraulic Press',
      icon: Zap,
      currentLevel: stats.clickPowerLevel,
      nextCost: SKILL_COSTS.CLICK_POWER(stats.clickPowerLevel),
      description: `Increase manual work efficiency. Current: $${CLICK_POWER_VALUES(stats.clickPowerLevel)}/click`,
      maxLevel: 50
    },
    {
      id: 'ANALYSIS',
      name: 'Geo-Scanner',
      icon: Search,
      currentLevel: stats.analysisLevel,
      nextCost: SKILL_COSTS.ANALYSIS(stats.analysisLevel),
      description: stats.analysisLevel === 0 ? "Unlock basic oil indicators." : stats.analysisLevel === 1 ? "Unlock precise quantity estimates." : "Maximum scan detail achieved.",
      maxLevel: 2
    },
    {
      id: 'TECH',
      name: 'Refining Efficiency',
      icon: Cog,
      currentLevel: stats.extractionTechLevel,
      nextCost: SKILL_COSTS.EXTRACTION_TECH(stats.extractionTechLevel),
      description: "Increases global oil value multiplier by +5%.",
      maxLevel: 10
    }
  ];

  return (
    <div className="px-4 py-6 pb-24">
      <h2 className="text-2xl font-black uppercase text-white mb-6 tracking-widest border-l-4 border-industrial-accent pl-3">
        R&D Department
      </h2>

      <div className="space-y-4">
        {upgrades.map((upgrade) => {
          const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
          const canAfford = stats.money >= upgrade.nextCost;

          return (
            <div key={upgrade.id} className="bg-industrial-800 border border-industrial-700 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-4 mb-3">
                <div className="bg-industrial-900 p-3 rounded-full border border-industrial-700">
                  <upgrade.icon className="text-industrial-accent" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-white text-lg">{upgrade.name}</h3>
                    <span className="text-industrial-accent font-mono text-sm">Lvl {upgrade.currentLevel}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1 leading-tight">{upgrade.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-industrial-700/50">
                <div className="text-sm">
                  {isMaxed ? (
                    <span className="text-industrial-accent font-bold">MAXED OUT</span>
                  ) : (
                    <span className={`font-mono font-bold ${canAfford ? 'text-green-400' : 'text-slate-500'}`}>
                      Cost: ${upgrade.nextCost}
                    </span>
                  )}
                </div>
                {!isMaxed && (
                  <Button 
                    variant={canAfford ? 'primary' : 'secondary'}
                    className="py-2 px-6 text-sm"
                    disabled={!canAfford}
                    onClick={() => onUpgrade(upgrade.id as any)}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};