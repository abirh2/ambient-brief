import type { WebGLRenderer } from 'three';

interface FrameMeasurement {
  at: number; cpuMs: number; calls: number; triangles: number;
  width: number; height: number; geometries: number; textures: number;
}
interface WorldProfile {
  renderer: string; frames: FrameMeasurement[];
  camera?: { id: number | null; phase: string; reduced: boolean; visible: boolean; progress: number };
}
declare global { interface Window { __ambientWorldProfile?: WorldProfile } }

// Explicit local diagnostics only; bounded and never published through React/store state.
export function startProfile(gl: WebGLRenderer): ((start: number) => void) | null {
  if (new URLSearchParams(window.location.search).get('profile') !== '1') return null;
  const context = gl.getContext();
  const extension = context.getExtension('WEBGL_debug_renderer_info');
  const renderer: unknown = extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
  const profile: WorldProfile = { renderer: typeof renderer === 'string' ? renderer : 'Unavailable', frames: [] };
  window.__ambientWorldProfile = profile;
  return (start) => {
    if (profile.frames.length >= 12_000) return;
    profile.frames.push({ at: performance.now(), cpuMs: performance.now() - start,
      calls: gl.info.render.calls, triangles: gl.info.render.triangles,
      width: gl.domElement.width, height: gl.domElement.height,
      geometries: gl.info.memory.geometries, textures: gl.info.memory.textures });
  };
}
