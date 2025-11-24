import React, { useState } from 'react';
import { Land, PlayerStats, RigTier } from '../types';
import { Droplet, Search, Hammer, AlertTriangle, ArrowRight, Zap, Factory } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { RIGS } from '../constants';

interface LandsTabProps {
  stats: PlayerStats;
  lands: Land[];
  onBuyLand: (landId: string) => void;
  onInstallRig: (landId: string, rigId: RigTier) => void;
}

// Visual component for Rigs
const RigVisual: React.FC<{ rigId: RigTier }> = ({ rigId }) => {
  if (rigId === RigTier.BASIC) {
    return (
      <div className="relative w-12 h-12 flex flex-col items-center justify-end">
        {/* Simple Pump */}
        <div className="w-1 h-6 bg-slate-500 relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-400 animate-pump-slow origin-left"></div>
        </div>
        <div className="w-4 h-3 bg-slate-600 rounded-t-sm"></div>
      </div>
    );
  }
  
  if (rigId === RigTier.ADVANCED) {
    return (
      <div className="relative w-12 h-12 flex flex-col items-center justify-end">
        {/* Hydraulic Pump */}
        <div className="w-2 h-8 bg-blue-900 border border-blue-700 relative z-10"></div>
        <div className="absolute top-2 w-10 h-1 bg-blue-500 animate-pump-med"></div>
        <div className="w-6 h-4 bg-blue-800 rounded-t-sm z-10"></div>
      </div>
    );
  }

  if (rigId === RigTier.ELITE) {
    return (
      <div className="relative w-12 h-12 flex flex-col items-center justify-center">
        {/* Quantum Drill */}
        <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 border border-yellow-500/60 rounded-full animate-spin-slow border-t-transparent"></div>
        <Zap size={24} className="text-yellow-400 drop-shadow-lg relative z-10" />
      </div>
    );
  }

  return null;
};

export const LandsTab: React.FC<LandsTabProps> = ({ stats, lands, onBuyLand, onInstallRig }) => {
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [showRigModal, setShowRigModal] = useState(false);

  const handleLandClick = (land: Land) => {
    setSelectedLand(land);
    if (land.status === 'OWNED') {
      setShowRigModal(true);
    } else if (land.status === 'FOR_SALE') {
      setShowRigModal(false); 
    }
  };

  const getLandStatusStyles = (land: Land) => {
    if (land.status === 'DEPLETED') return 'bg-red-900/10 border-red-900/30 opacity-70 grayscale';
    
    if (land.status === 'EXTRACTING' || land.status === 'OWNED') {
      // Quality based coloring for owned lands
      if (land.qualityHint === 'HIGH') return 'bg-gradient-to-br from-industrial-800 to-green-900/30 border-green-700/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      if (land.qualityHint === 'LOW') return 'bg-gradient-to-br from-industrial-800 to-red-900/30 border-red-700/50';
      return 'bg-industrial-800 border-slate-600';
    }

    return 'bg-industrial-800/40 border-industrial-700 border-dashed hover:border-solid hover:border-industrial-500'; // For sale
  };

  const getOilHint = (land: Land) => {
    if (land.status !== 'FOR_SALE') return `${Math.floor(land.currentOil)}/${land.totalOil}`;
    
    // Analysis Logic
    if (stats.analysisLevel === 0) return '???';
    if (stats.analysisLevel === 1) return land.qualityHint;
    
    const variance = 0.2; 
    const min = Math.floor(land.totalOil * (1 - variance));
    const max = Math.floor(land.totalOil * (1 + variance));
    return `~${min}-${max}`;
  };

  return (
    <div className="px-4 py-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase text-white tracking-widest border-l-4 border-industrial-accent pl-3">
          Empire Map
        </h2>
        <div className="bg-industrial-800 px-3 py-1 rounded-full border border-industrial-700 flex items-center gap-2">
            <Factory size={16} className="text-slate-400"/>
            <span className="text-xs font-bold text-slate-300">{lands.filter(l => l.status === 'EXTRACTING').length} Active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {lands.map((land) => (
          <div
            key={land.id}
            onClick={() => handleLandClick(land)}
            className={`aspect-square relative rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 overflow-hidden ${getLandStatusStyles(land)}`}
          >
            {/* Background Decor based on quality for owned */}
            {(land.status === 'OWNED' || land.status === 'EXTRACTING') && (
               <div className={`absolute inset-0 opacity-10 pointer-events-none ${
                 land.qualityHint === 'HIGH' ? 'bg-green-500' : land.qualityHint === 'LOW' ? 'bg-red-500' : 'bg-slate-500'
               }`} />
            )}

            {land.status === 'FOR_SALE' && (
              <>
                <div className="absolute top-1 right-1">
                   {stats.analysisLevel > 0 && land.qualityHint === 'HIGH' && stats.analysisLevel < 2 && (
                     <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
                   )}
                </div>
                <Search size={16} className="text-industrial-700 mb-1" />
                <span className="text-[10px] font-mono text-industrial-accent font-bold bg-black/40 px-1 rounded">
                  ${land.basePrice >= 1000 ? (land.basePrice/1000).toFixed(1) + 'k' : land.basePrice}
                </span>
              </>
            )}

            {land.status === 'OWNED' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                 <div className="w-8 h-8 rounded-full bg-industrial-900/50 flex items-center justify-center border border-dashed border-slate-500 mb-1">
                    <Hammer size={14} className="text-slate-400" />
                 </div>
                 <span className="text-[9px] uppercase font-bold text-slate-400">Empty</span>
              </div>
            )}

            {land.status === 'EXTRACTING' && land.rigId && (
              <>
                <div className="scale-75 mb-3 rig-shadow">
                  <RigVisual rigId={land.rigId} />
                </div>
                <div className="w-full h-1.5 bg-industrial-900 absolute bottom-0 left-0">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        land.qualityHint === 'HIGH' ? 'bg-green-500' : 
                        land.qualityHint === 'LOW' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(land.currentOil / land.totalOil) * 100}%` }}
                    />
                </div>
              </>
            )}

            {land.status === 'DEPLETED' && (
              <AlertTriangle size={20} className="text-red-900/50" />
            )}
          </div>
        ))}
      </div>

      {/* Details/Buy Modal */}
      {selectedLand && !showRigModal && (
        <Modal
          isOpen={!!selectedLand}
          onClose={() => setSelectedLand(null)}
          title={selectedLand.status === 'FOR_SALE' ? 'Land Survey' : 'Sector Analysis'}
        >
          <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg border border-industrial-700 relative overflow-hidden">
              {/* Quality Banner for Owned */}
              {selectedLand.status !== 'FOR_SALE' && (
                <div className={`absolute top-0 right-0 p-1 px-3 rounded-bl text-[10px] font-bold uppercase tracking-wider ${
                    selectedLand.qualityHint === 'HIGH' ? 'bg-green-900 text-green-200' :
                    selectedLand.qualityHint === 'LOW' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                }`}>
                    {selectedLand.qualityHint === 'HIGH' ? 'Rich Vein' : selectedLand.qualityHint === 'LOW' ? 'Poor Reserves' : 'Average Yield'}
                </div>
              )}

              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-slate-400 text-sm font-bold uppercase">Oil Reserves</span>
                <span className="text-industrial-accent font-mono font-bold text-lg flex items-center gap-2">
                   <Droplet size={18} className="fill-current" /> {getOilHint(selectedLand)}
                </span>
              </div>
              
              {selectedLand.status === 'FOR_SALE' && (
                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <span className="text-slate-400 text-sm font-bold uppercase">Land Cost</span>
                  <span className={`font-mono font-bold text-xl ${stats.money >= selectedLand.basePrice ? 'text-green-400' : 'text-red-400'}`}>
                    ${selectedLand.basePrice}
                  </span>
                </div>
              )}
            </div>
            
            {selectedLand.status === 'FOR_SALE' && (
              <Button 
                fullWidth 
                variant={stats.money >= selectedLand.basePrice ? 'success' : 'secondary'}
                disabled={stats.money < selectedLand.basePrice}
                onClick={() => {
                  onBuyLand(selectedLand.id);
                  setSelectedLand(null); // Close to see the new status
                }}
              >
                {stats.money < selectedLand.basePrice ? 'Insufficient Funds' : 'Purchase Land Rights'}
              </Button>
            )}
            
            {selectedLand.status === 'DEPLETED' && (
               <div className="text-center text-sm text-red-500 font-mono border border-red-900 bg-red-900/10 p-3 rounded uppercase font-bold tracking-widest">
                 Reserves Depleted
               </div>
            )}
          </div>
        </Modal>
      )}

      {/* Rig Selection Modal */}
      <Modal
        isOpen={showRigModal}
        onClose={() => setShowRigModal(false)}
        title="Select Equipment"
      >
        <div className="space-y-3">
          {Object.values(RIGS).map((rig) => {
            const canAfford = stats.money >= rig.price;
            return (
              <div 
                key={rig.id} 
                className={`p-3 rounded-lg border transition-all ${
                    canAfford ? 'bg-industrial-800 border-industrial-600' : 'bg-industrial-900/50 border-industrial-800 opacity-70'
                } flex flex-col gap-2 relative overflow-hidden group`}
              >
                {/* Visual Flair Background */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2 ${
                    rig.id === RigTier.ELITE ? 'bg-yellow-500' : rig.id === RigTier.ADVANCED ? 'bg-blue-500' : 'bg-slate-500'
                }`} />

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="scale-75 origin-left">
                       <RigVisual rigId={rig.id} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-none">{rig.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">{rig.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-lg ${canAfford ? 'text-green-400' : 'text-red-400'}`}>${rig.price}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[10px] uppercase font-bold text-slate-500 mt-2 relative z-10">
                  <div className="bg-black/40 p-1.5 rounded text-center border border-white/5">
                    Speed <div className="text-white text-xs mt-0.5">{rig.extractionRate}/s</div>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded text-center border border-white/5">
                    Waste <div className="text-red-400 text-xs mt-0.5">{(rig.wasteRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded text-center border border-white/5">
                    Efficiency <div className="text-green-400 text-xs mt-0.5">x{rig.efficiencyMult}</div>
                  </div>
                </div>

                <Button 
                  variant={canAfford ? 'primary' : 'secondary'}
                  disabled={!canAfford}
                  onClick={() => {
                    if (selectedLand) {
                      onInstallRig(selectedLand.id, rig.id);
                      setShowRigModal(false);
                      setSelectedLand(null);
                    }
                  }}
                  className="mt-2 py-2 text-xs w-full flex justify-center items-center gap-2 group-active:scale-[0.99]"
                >
                  <span>Install Unit</span>
                  {canAfford && <ArrowRight size={14} />}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};