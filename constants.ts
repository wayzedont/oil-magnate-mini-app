import { RigConfig, RigTier } from './types';

// Economy Config
export const OIL_PRICE_PER_UNIT = 10;
export const TICK_RATE_MS = 1000;
export const AUTO_SAVE_MS = 5000;

// Skills
export const SKILL_COSTS = {
  CLICK_POWER: (level: number) => Math.floor(100 * Math.pow(1.8, level)),
  ANALYSIS: (level: number) => Math.floor(500 * Math.pow(2.5, level)),
  EXTRACTION_TECH: (level: number) => Math.floor(1000 * Math.pow(2.2, level)),
};

export const CLICK_POWER_VALUES = (level: number) => Math.floor(10 + (level * 5) + Math.pow(1.2, level));

// Rigs
export const RIGS: Record<RigTier, RigConfig> = {
  [RigTier.BASIC]: {
    id: RigTier.BASIC,
    name: "Rusty Pump",
    price: 500,
    extractionRate: 5,
    wasteRate: 0.5, // Wastes 50% extra oil
    efficiencyMult: 1.0,
    description: "Cheap, unreliable, wastes oil.",
    visualColor: "text-slate-400 border-slate-400"
  },
  [RigTier.ADVANCED]: {
    id: RigTier.ADVANCED,
    name: "Hydraulic Jack",
    price: 2500,
    extractionRate: 15,
    wasteRate: 0.2, // Wastes 20% extra oil
    efficiencyMult: 1.1,
    description: "Solid industry standard.",
    visualColor: "text-blue-400 border-blue-400"
  },
  [RigTier.ELITE]: {
    id: RigTier.ELITE,
    name: "Quantum Drill",
    price: 10000,
    extractionRate: 40,
    wasteRate: 0.0, // No waste
    efficiencyMult: 1.25,
    description: "Maximum efficiency, no waste.",
    visualColor: "text-industrial-accent border-industrial-accent"
  }
};

// Land Generation
export const LAND_BATCH_SIZE = 16; // 4x4
export const GENERATION_CONFIG = {
  CHEAP: {
    minPrice: 200,
    maxPrice: 800,
    oilMin: 100,
    oilMax: 5000, // Chance for jackpot on cheap land
    probHighOil: 0.1 // 10% chance it's good
  },
  EXPENSIVE: {
    minPrice: 2000,
    maxPrice: 5000,
    oilMin: 2000,
    oilMax: 10000,
    probHighOil: 0.7 // 70% chance it's good
  }
};
