import { HydrologyMetrics, SimulationParams, FloodStatus } from '../types/simulation';

/**
 * Computes scientifically grounded hydrological metrics for Form 4 Science
 * ("Pembangunan dan Banjir") based on rainfall, urbanization/deforestation,
 * and active green engineering mitigation measures.
 */
export function computeHydrology(params: SimulationParams): HydrologyMetrics {
  const {
    rainfallMmHr,
    urbanizationPct,
    reforestation,
    permeablePavement,
    drainClearing,
    retentionBasin,
  } = params;

  const urbanFactor = urbanizationPct / 100; // 0..1
  const rainFactor = rainfallMmHr / 150; // 0..1

  // Base natural forest infiltration is ~62%; heavy concrete urbanization drops it to ~12%
  let infiltrationPct = 62 - urbanFactor * 50;
  if (reforestation) {
    infiltrationPct += 18 * (0.4 + 0.6 * urbanFactor);
  }
  if (permeablePavement) {
    infiltrationPct += 20 * (0.3 + 0.7 * urbanFactor);
  }
  infiltrationPct = Math.max(8, Math.min(78, Math.round(infiltrationPct)));

  // Remaining rainfall becomes surface runoff (minus slight natural canopy evaporation ~8%)
  const canopyLoss = reforestation ? 10 : Math.max(2, 9 - urbanFactor * 6);
  const runoffPct = Math.max(12, Math.min(90, Math.round(100 - infiltrationPct - canopyLoss)));

  // Silt & soil erosion load rises sharply with deforestation/construction
  let siltLoadPct = 10 + urbanFactor * 72 * (0.35 + 0.65 * rainFactor);
  if (reforestation) siltLoadPct *= 0.48;
  if (drainClearing) siltLoadPct *= 0.72;
  siltLoadPct = Math.max(5, Math.min(98, Math.round(siltLoadPct)));

  // Drainage capacity starts high in pristine state, degrades with urban waste/silt unless cleared
  let drainEfficiencyPct = 92 - urbanFactor * 44;
  if (drainClearing) {
    drainEfficiencyPct = Math.min(98, drainEfficiencyPct + 36);
  }
  drainEfficiencyPct = Math.max(28, Math.min(98, Math.round(drainEfficiencyPct)));

  // River water level calculation (river bed ~0m, normal flow ~1.4m, bank/road level = 3.5m)
  const runoffLoad = (runoffPct / 100) * rainFactor * 3.8;
  const siltShallowPenalty = (siltLoadPct / 100) * 0.78; // sediment makes riverbed shallower
  const drainBackupPenalty = ((100 - drainEfficiencyPct) / 100) * rainFactor * 1.15;
  const retentionRelief = retentionBasin ? (0.45 + rainFactor * 0.85) : 0;

  let waterLevelM =
    1.25 + runoffLoad + siltShallowPenalty + drainBackupPenalty - retentionRelief;
  waterLevelM = Number(Math.max(1.15, Math.min(5.15, waterLevelM)).toFixed(2));

  const floodDepthM = Number(Math.max(0, waterLevelM - 3.5).toFixed(2));

  let floodStatus: FloodStatus = 'normal';
  if (waterLevelM >= 3.5) {
    floodStatus = 'bahaya';
  } else if (waterLevelM >= 2.55) {
    floodStatus = 'waspada';
  }

  return {
    waterLevelM,
    floodDepthM,
    infiltrationPct,
    runoffPct,
    siltLoadPct,
    drainEfficiencyPct,
    floodStatus,
  };
}
