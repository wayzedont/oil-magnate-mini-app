import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Land, PlayerStats, RigTier, Tab } from './types';
import { 
  GENERATION_CONFIG, 
  LAND_BATCH_SIZE, 
  OIL_PRICE_PER_UNIT, 
  RIGS, 
  SKILL_COSTS, 
  CLICK_POWER_VALUES,
  TICK_RATE_MS,
  AUTO_SAVE_MS
} from './constants';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { ClickerTab } from './components/ClickerTab';
import { LandsTab } from './components/LandsTab';
import { UpgradesTab } from './components/UpgradesTab';

// Helper to generate a single land
const generateLand = (id: string): Land => {
  const isExpensive = Math.random() > 0.5;
  const config = isExpensive ? GENERATION_CONFIG.EXPENSIVE : GENERATION_CONFIG.CHEAP;
  
  const price = Math.floor(config.minPrice + Math.random() * (config.maxPrice - config.minPrice));
  
  // Oil generation logic
  const isHighOil = Math.random() < config.probHighOil;
  
  let oil;
  let quality: 'LOW' | 'MED' | 'HIGH';
  
  if (isHighOil) {
      // Good roll
      const oilRange = config.oilMax - (config.oilMin + config.oilMax) / 2;
      oil = Math.floor((config.oilMin + config.oilMax) / 2 + Math.random() * oilRange);
      quality = 'HIGH';
  } else {
      // Bad roll
      oil = Math.floor(config.oilMin + Math.random() * ((config.oilMin + config.oilMax) / 4));
      quality = 'LOW';
  }

  // Adjust for "Medium" overlap visually, simplified logic
  if (oil > 1000 && oil < 3000) quality = 'MED';

  return {
    id,
    basePrice: price,
    totalOil: oil,
    currentOil: oil,
    status: 'FOR_SALE',
    rigId: null,
    qualityHint: quality
  };
};

// Initial State
const INITIAL_STATE: GameState = {
  stats: {
    money: 0,
    clickPowerLevel: 0,
    analysisLevel: 0,
    extractionTechLevel: 0
  },
  lands: Array.from({ length: LAND_BATCH_SIZE }, (_, i) => generateLand(`land-${i}`)),
  lastTick: Date.now()
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('oil_tycoon_save_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load save", e);
    }
    return INITIAL_STATE;
  });

  const [currentTab, setCurrentTab] = useState<Tab>(Tab.WORK);
  const [currentOilRate, setCurrentOilRate] = useState(0);
  const gameStateRef = useRef(gameState);

  // Keep ref synced for intervals
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save Loop
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('oil_tycoon_save_v1', JSON.stringify(gameStateRef.current));
    }, AUTO_SAVE_MS);
    return () => clearInterval(saveInterval);
  }, []);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        let moneyGained = 0;
        let totalExtraction = 0;

        const newLands = prev.lands.map(land => {
          if (land.status === 'EXTRACTING' && land.rigId) {
            const rig = RIGS[land.rigId];
            
            // Calculate potential extraction
            let extractAmount = rig.extractionRate;
            // Loss/Waste calculation
            const wasteAmount = extractAmount * rig.wasteRate;
            const totalDepletion = extractAmount + wasteAmount;

            // Cap at remaining
            if (land.currentOil <= totalDepletion) {
              // Last tick for this well
              extractAmount = Math.max(0, land.currentOil - wasteAmount); 
              if (extractAmount < 0) extractAmount = 0;
              
              moneyGained += extractAmount * OIL_PRICE_PER_UNIT * rig.efficiencyMult * (1 + prev.stats.extractionTechLevel * 0.05);
              totalExtraction += extractAmount;
              
              return {
                ...land,
                currentOil: 0,
                status: 'DEPLETED' as const
              };
            }

            // Normal tick
            moneyGained += extractAmount * OIL_PRICE_PER_UNIT * rig.efficiencyMult * (1 + prev.stats.extractionTechLevel * 0.05);
            totalExtraction += extractAmount;

            return {
              ...land,
              currentOil: land.currentOil - totalDepletion
            };
          }
          return land;
        });

        setCurrentOilRate(totalExtraction);

        return {
          ...prev,
          stats: {
            ...prev.stats,
            money: prev.stats.money + moneyGained
          },
          lands: newLands,
          lastTick: Date.now()
        };
      });
    }, TICK_RATE_MS);

    return () => clearInterval(interval);
  }, []);

  // Actions
  const handleWork = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        money: prev.stats.money + CLICK_POWER_VALUES(prev.stats.clickPowerLevel)
      }
    }));
  }, []);

  const handleBuyLand = (landId: string) => {
    setGameState(prev => {
      const landIndex = prev.lands.findIndex(l => l.id === landId);
      if (landIndex === -1) return prev;
      
      const land = prev.lands[landIndex];
      if (prev.stats.money < land.basePrice) return prev;

      const newLands = [...prev.lands];
      newLands[landIndex] = { ...land, status: 'OWNED' };

      return {
        ...prev,
        stats: { ...prev.stats, money: prev.stats.money - land.basePrice },
        lands: newLands
      };
    });
  };

  const handleInstallRig = (landId: string, rigId: RigTier) => {
    setGameState(prev => {
      const landIndex = prev.lands.findIndex(l => l.id === landId);
      if (landIndex === -1) return prev;
      
      const rig = RIGS[rigId];
      if (prev.stats.money < rig.price) return prev;

      const newLands = [...prev.lands];
      newLands[landIndex] = { ...newLands[landIndex], status: 'EXTRACTING', rigId };

      return {
        ...prev,
        stats: { ...prev.stats, money: prev.stats.money - rig.price },
        lands: newLands
      };
    });
  };

  const handleUpgrade = (type: 'CLICK' | 'ANALYSIS' | 'TECH') => {
    setGameState(prev => {
      const costFunc = type === 'CLICK' ? SKILL_COSTS.CLICK_POWER : 
                       type === 'ANALYSIS' ? SKILL_COSTS.ANALYSIS : 
                       SKILL_COSTS.EXTRACTION_TECH;
      
      const currentLevel = type === 'CLICK' ? prev.stats.clickPowerLevel :
                           type === 'ANALYSIS' ? prev.stats.analysisLevel :
                           prev.stats.extractionTechLevel;
      
      const cost = costFunc(currentLevel);
      if (prev.stats.money < cost) return prev;

      const newStats = { ...prev.stats, money: prev.stats.money - cost };
      
      if (type === 'CLICK') newStats.clickPowerLevel++;
      if (type === 'ANALYSIS') newStats.analysisLevel++;
      if (type === 'TECH') newStats.extractionTechLevel++;

      return { ...prev, stats: newStats };
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-industrial-900 to-black text-slate-100 overflow-hidden">
      <Header stats={gameState.stats} oilRate={currentOilRate} />
      
      <main className="flex-1 overflow-y-auto pt-20">
        {currentTab === Tab.WORK && (
          <ClickerTab stats={gameState.stats} onWork={handleWork} />
        )}
        {currentTab === Tab.LANDS && (
          <LandsTab 
            stats={gameState.stats} 
            lands={gameState.lands} 
            onBuyLand={handleBuyLand}
            onInstallRig={handleInstallRig}
          />
        )}
        {currentTab === Tab.UPGRADES && (
          <UpgradesTab stats={gameState.stats} onUpgrade={handleUpgrade} />
        )}
      </main>

      <Navigation currentTab={currentTab} setTab={setCurrentTab} />
    </div>
  );
}