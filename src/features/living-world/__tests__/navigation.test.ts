import { describe, expect, it } from 'vitest';
import { initialNavigation, navigate, pixelRatio, poses, sampleTravel } from '../navigation';

describe('isolated observatory navigation', () => {
  it('rejects obsolete settlement after replacement and preserves a stopped destination', () => {
    const trip = navigate(initialNavigation, { type: 'visit', target: 'observatory' });
    const stop = navigate(trip, { type: 'stop' });
    expect(stop.phase).toBe('stopped');
    expect(navigate(stop, { type: 'settled', id: trip.id })).toEqual(stop);
    const back = navigate(stop, { type: 'visit', target: 'overview' });
    expect(navigate(back, { type: 'settled', id: trip.id })).toEqual(back);
    expect(navigate(back, { type: 'settled', id: back.id }).settled).toBe('overview');
  });

  it('settles immediately for reduction and retains destination through renderer failure', () => {
    const trip = navigate(initialNavigation, { type: 'visit', target: 'observatory' });
    const instant = navigate(trip, { type: 'instant' });
    expect(instant).toMatchObject({ phase: 'rest', target: 'observatory', settled: 'observatory' });
  });

  it('samples continuous eased endpoints and a clear southern corridor', () => {
    const start = poses.overview;
    const end = poses.observatory;
    expect(sampleTravel(start, end, 0)).toEqual(start);
    expect(sampleTravel(start, end, 1)).toEqual(end);
    for (let step = 0; step <= 20; step++) {
      const pose = sampleTravel(start, end, step / 20);
      expect(pose.position[1]).toBeGreaterThanOrEqual(46);
      expect(pose.position[2]).toBeGreaterThanOrEqual(65);
    }
  });

  it('caps actual raster area on ultrawide and never upscales device DPR', () => {
    expect(pixelRatio(3440, 1440, 2)).toBeLessThanOrEqual(Math.sqrt(5_000_000 / (3440 * 1440)));
    expect(pixelRatio(1366, 768, 2)).toBe(1.5);
    expect(pixelRatio(1366, 768, 0.8)).toBe(0.8);
  });
});
