export enum Tab {
  WORK = 'WORK',
  LANDS = 'LANDS',
  UPGRADES = 'UPGRADES'
}

export enum RigTier {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE'
}

export interface RigConfig {
  id: RigTier;
  name: string;
  price: number;
  extractionRate: number; // Oil per tick
  wasteRate: number; // Extra oil depleted per tick (inefficiency)
  efficiencyMult: number; // Revenue multiplier per unit of oil
  description: string;
  visualColor: string;
}

export interface Land {
  id: string;
  basePrice: number; // How much it costs to buy
  totalOil: number; // Total reserves
  currentOil: number; // Remaining reserves
  status: 'FOR_SALE' | 'OWNED' | 'EXTRACTING' | 'DEPLETED';
  rigId: RigTier | null;
  qualityHint: 'LOW' | 'MED' | 'HIGH' | 'UNKNOWN'; // For analysis skill
}

export interface PlayerStats {
  money: number;
  clickPowerLevel: number;
  analysisLevel: number;
  extractionTechLevel: number; // Improves global efficiency
}

export interface GameState {
  stats: PlayerStats;
  lands: Land[];
  lastTick: number;
}
