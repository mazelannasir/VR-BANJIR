export type FloodStatus = 'normal' | 'waspada' | 'bahaya';

export type CameraPresetId =
  | 'overview'
  | 'hillside'
  | 'urban'
  | 'drainage'
  | 'retention';

export type StationId =
  | 'deforestation'
  | 'impervious'
  | 'siltation'
  | 'wetland'
  | 'mitigation';

export type ExplorationMode = 'orbit' | 'walk' | 'stereo';

export interface SimulationParams {
  rainfallMmHr: number; // 0 to 150 mm/jam
  urbanizationPct: number; // 0 to 100 %
  reforestation: boolean;
  permeablePavement: boolean;
  drainClearing: boolean;
  retentionBasin: boolean;
}

export interface HydrologyMetrics {
  waterLevelM: number; // River surface level in meters (1.2m to 5.2m)
  floodDepthM: number; // Depth above town road elevation (3.5m)
  infiltrationPct: number; // % of rain absorbed by soil
  runoffPct: number; // % of rain becoming surface runoff
  siltLoadPct: number; // % turbidity / kelodak load
  drainEfficiencyPct: number; // % drainage capacity
  floodStatus: FloodStatus;
}

export interface StationConcept {
  id: StationId;
  number: string;
  title: string;
  subtitle: string;
  conceptTag: string;
  explanation: string;
  scientificFact: string;
  worldPosition: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedStation: StationId;
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}
