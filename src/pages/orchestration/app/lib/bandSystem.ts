
// Band/Level system for vertical node snapping
export interface Band {
  id: string;
  y: number;
  label: string;
}

export const DEFAULT_BANDS: Band[] = [
  { id: 'band-1', y: 100, label: 'Level 1' },
  { id: 'band-2', y: 300, label: 'Level 2' },
  { id: 'band-3', y: 500, label: 'Level 3' },
  { id: 'band-4', y: 700, label: 'Level 4' },
  { id: 'band-5', y: 900, label: 'Level 5' },
];

export const BAND_HEIGHT = 200;
export const SNAP_THRESHOLD = 50;

export function snapToNearestBand(nodeY: number, bands: Band[] = DEFAULT_BANDS): number {
  let closestBand = bands[0];
  let minDistance = Math.abs(nodeY - bands[0].y);

  for (const band of bands) {
    const distance = Math.abs(nodeY - band.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestBand = band;
    }
  }

  // Only snap if within threshold
  return minDistance <= SNAP_THRESHOLD ? closestBand.y : nodeY;
}

export function getBandForY(y: number, bands: Band[] = DEFAULT_BANDS): Band | null {
  return bands.find(band => Math.abs(y - band.y) <= SNAP_THRESHOLD) || null;
}
