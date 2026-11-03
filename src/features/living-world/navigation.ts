export type Destination = 'overview' | 'observatory';
export type Triple = readonly [number, number, number];
export interface Pose { readonly position: Triple; readonly target: Triple }
export interface Navigation {
  readonly id: number;
  readonly target: Destination;
  readonly settled: Destination;
  readonly phase: 'rest' | 'moving' | 'stopped';
}
type Event = { type: 'visit'; target: Destination } | { type: 'settled'; id: number }
  | { type: 'stop' } | { type: 'instant' };

export const initialNavigation: Navigation = { id: 0, target: 'overview', settled: 'overview', phase: 'rest' };
export const poses: Record<Destination, Pose> = {
  overview: { position: [-108, 82, 240], target: [0, 14, -2] },
  observatory: { position: [-36, 46, 65], target: [0, 26, -8] },
};

export function navigate(state: Navigation, event: Event): Navigation {
  switch (event.type) {
    case 'visit': return { ...state, id: state.id + 1, target: event.target, phase: 'moving' };
    case 'stop': return state.phase === 'moving' ? { ...state, id: state.id + 1, phase: 'stopped' } : state;
    case 'instant': return { ...state, id: state.id + 1, settled: state.target, phase: 'rest' };
    case 'settled': return state.id === event.id && state.phase === 'moving'
      ? { ...state, settled: state.target, phase: 'rest' } : state;
  }
}

export function sampleTravel(from: Pose, to: Pose, progress: number): Pose {
  const t = Math.min(1, Math.max(0, progress));
  const eased = t * t * (3 - 2 * t);
  const interpolate = (a: Triple, b: Triple): Triple => [
    a[0] + (b[0] - a[0]) * eased,
    a[1] + (b[1] - a[1]) * eased,
    a[2] + (b[2] - a[2]) * eased,
  ];
  const position = interpolate(from.position, to.position);
  // Both endpoints are offshore; a modest vertical bow keeps interrupted routes clear.
  return {
    position: [position[0], position[1] + Math.sin(t * Math.PI) * 5, position[2]],
    target: interpolate(from.target, to.target),
  };
}

export function pixelRatio(width: number, height: number, device: number, low = false): number {
  return Math.min(device, low ? 1 : 1.5, Math.sqrt(5_000_000 / Math.max(1, width * height)));
}
