/**
 * Analytical terrain heightfield for the EkoBanjir watershed valley.
 * Coordinates in meters:
 * - River flows roughly along X = riverCenterX(z) from North (-Z) to South (+Z)
 * - Western highlands (X < -10): forested / deforested hill slopes rising up to ~15m
 * - Eastern urban plateau (X > 4): flat town terrace at ~3.5m transitioning into distant hills
 * - South-West wetland / retention basin (X in [-19, -5], Z in [11, 27]): depressed basin at ~1.4m
 */

export function riverCenterX(z: number): number {
  return Math.sin(z * 0.055) * 3.8 - 1.0;
}

export function groundHeightAt(x: number, z: number): number {
  const rcx = riverCenterX(z);
  const distRiver = Math.abs(x - rcx);

  // Base river channel carve (width ~4.5m half-width, bed at y=0.2m)
  let h = 3.5;

  // River bank slope
  if (distRiver < 6.5) {
    const t = Math.max(0, Math.min(1, (distRiver - 2.2) / 4.3));
    const smooth = t * t * (3 - 2 * t);
    h = 0.25 + smooth * 3.25;
  }

  // Western mountain ridge & hillside slope (Z < 10 or far west)
  if (x < rcx - 5.5) {
    const westDist = rcx - 5.5 - x;
    const hillRise = Math.min(14.5, Math.pow(westDist * 0.14, 1.35) * 3.8);
    // Gentle organic undulations
    const undulation =
      Math.sin(x * 0.09 + z * 0.07) * 0.65 + Math.cos(z * 0.13) * 0.45;
    h += hillRise + undulation * Math.min(1, westDist / 8);
  }

  // South-West Retention Basin / Wetland depression
  const bx = -12.5;
  const bz = 19.0;
  const dx = (x - bx) / 8.5;
  const dz = (z - bz) / 9.0;
  const basinDistSq = dx * dx + dz * dz;
  if (basinDistSq < 1.35) {
    const factor = Math.max(0, 1 - basinDistSq / 1.35);
    const smoothFactor = factor * factor * (3 - 2 * factor);
    h = h * (1 - smoothFactor) + 1.15 * smoothFactor;
  }

  // Eastern urban plateau (flattened for clean town roads & buildings between x=4.5..26, z=-22..24)
  if (x > rcx + 5.5 && x < 30 && Math.abs(z) < 26) {
    const flatBlend = Math.min(1, (x - (rcx + 5.5)) / 3.0);
    const targetTownY = 3.55;
    h = h * (1 - flatBlend) + targetTownY * flatBlend;
  }

  // Distant outer mountain rim (beyond playable valley) for natural horizon framing
  const radialDist = Math.sqrt(x * x + z * z);
  if (radialDist > 42) {
    const rim = Math.min(18, Math.pow((radialDist - 42) * 0.08, 1.4) * 5.2);
    const noise = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 1.4;
    h += rim + noise;
  }

  return h;
}
