import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type RootState, type ThreeEvent } from '@react-three/fiber';
import { ACESFilmicToneMapping, Group, LoadingManager, Material, Mesh, PCFSoftShadowMap, PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Atmosphere } from './Atmosphere';
import { startProfile } from './profile';
import { ISLAND_MODEL } from '../assets';
import { pixelRatio, poses, sampleTravel, type Navigation, type Pose } from '../navigation';

export interface WorldProps {
  navigation: Navigation;
  reduced: boolean;
  visible: boolean;
  low: boolean;
  onReady: () => void;
  onFailure: () => void;
  onSettled: (id: number) => void;
  onSelect: () => void;
}

function disposeModel(group: Group) {
  const geometries = new Set<Mesh['geometry']>(), materials = new Set<Material>();
  group.traverse((object) => {
    if (object instanceof Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function Island({ onReady, onFailure, onSelect }: Pick<WorldProps, 'onReady' | 'onFailure' | 'onSelect'>) {
  const [model, setModel] = useState<Group | null>(null);
  const { invalidate, gl } = useThree();
  useEffect(() => {
    let active = true, owned: Group | null = null;
    const manager = new LoadingManager();
    new GLTFLoader(manager).load(`${import.meta.env.BASE_URL}${ISLAND_MODEL}`, (gltf) => {
      if (!active) { disposeModel(gltf.scene); return; }
      owned = gltf.scene;
      owned.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = !/terrain_|coast_|dune_grass/.test(object.name);
          object.receiveShadow = true;
        }
      });
      setModel(owned);
      gl.shadowMap.needsUpdate = true;
      invalidate();
    }, undefined, () => { if (active) onFailure(); });
    return () => { active = false; manager.abort(); if (owned) disposeModel(owned); };
  }, [onFailure, invalidate, gl]);
  const ready = useRef(false);
  useFrame(() => {
    // Ready is reported after a frame containing the complete model has rendered.
    if (model && !ready.current) { ready.current = true; queueMicrotask(onReady); }
  });
  function select(event: ThreeEvent<MouseEvent>) {
    if (/observatory_/.test(event.object.name)) { event.stopPropagation(); onSelect(); }
  }
  return model ? <primitive object={model} dispose={null} onClick={select} /> : null;
}

function CameraDriver({ navigation, reduced, visible, onSettled }: Pick<WorldProps, 'navigation' | 'reduced' | 'visible' | 'onSettled'>) {
  const { camera, size, invalidate, gl } = useThree();
  const target = useRef(new Vector3(...poses[navigation.settled].target));
  const trip = useRef<{ id: number; from: Pose; to: Pose; startedAt: number } | null>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = 40;
    // The minimal prototype reserves its left reading rail; the final ledger/sheet is later work.
    const rail = size.width >= 1280 ? Math.min(400, size.width * 0.25) : 0;
    camera.setViewOffset(size.width, size.height, -rail * 0.5, 0, size.width, size.height);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, gl, size, navigation.target, invalidate]);
  useLayoutEffect(() => {
    const destination = poses[navigation.target];
    if (first.current || reduced || navigation.phase === 'rest') {
      const pose = first.current ? poses[navigation.settled] : destination;
      camera.position.set(...pose.position); target.current.set(...pose.target);
      camera.lookAt(target.current); first.current = false; trip.current = null;
      if (navigation.phase === 'moving') onSettled(navigation.id);
    } else if (navigation.phase === 'moving' && visible) {
      trip.current = { id: navigation.id, startedAt: performance.now(),
        from: { position: camera.position.toArray(), target: target.current.toArray() }, to: destination };
    } else trip.current = null;
    if (window.__ambientWorldProfile) window.__ambientWorldProfile.camera = {
      id: trip.current?.id ?? null, phase: navigation.phase, reduced, visible, progress: 0,
    };
    invalidate();
  }, [camera, navigation, onSettled, reduced, visible, invalidate]);
  useFrame(() => {
    const current = trip.current;
    // Layout effects gate travel immediately; frames read only the current intent.
    if (!current) return;
    const progress = Math.min(1, (performance.now() - current.startedAt) / 1600);
    if (window.__ambientWorldProfile?.camera) window.__ambientWorldProfile.camera.progress = progress;
    const pose = sampleTravel(current.from, current.to, progress);
    camera.position.set(...pose.position); target.current.set(...pose.target); camera.lookAt(target.current);
    if (progress === 1) { trip.current = null; onSettled(current.id); }
    else invalidate();
  });
  return null;
}

function Runtime({ navigation, reduced, visible, low, onFailure, onReady, onSelect, onSettled }: WorldProps) {
  const { gl, invalidate, scene, size, setDpr } = useThree();
  const [plain, setPlain] = useState(false);
  useLayoutEffect(() => {
    setDpr(pixelRatio(size.width, size.height, window.devicePixelRatio, low));
  }, [setDpr, size.width, size.height, low]);
  useEffect(() => {
    if (reduced || !visible || navigation.phase === 'moving') return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [invalidate, reduced, visible, navigation.phase]);
  useEffect(() => {
    const canvas = gl.domElement;
    const fail = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost', fail);
    const render = gl.render.bind(gl);
    const measure = startProfile(gl);
    gl.render = (world, camera) => {
      gl.info.reset();
      const start = measure ? performance.now() : 0;
      try { render(world, camera); measure?.(start); } catch { onFailure(); }
    };
    let shaderFallback = false;
    gl.debug.onShaderError = () => {
      if (!shaderFallback) { shaderFallback = true; setPlain(true); invalidate(); }
      else onFailure();
    };
    return () => {
      canvas.removeEventListener('webglcontextlost', fail);
      gl.render = render;
      gl.debug.onShaderError = null;
    };
  }, [gl, invalidate, onFailure]);
  useEffect(() => {
    // A fixed light and static geometry need only one shadow update per attempt.
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [gl, scene.children.length, invalidate]);
  return <>
    <Atmosphere plain={plain} moving={!reduced && visible} />
    <hemisphereLight args={['#d4e3dd', '#69786c', 1.8]} />
    <directionalLight position={[-85, 100, 45]} color="#fff0cb" intensity={3.5} castShadow={!low}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-105} shadow-camera-right={105}
      shadow-camera-top={95} shadow-camera-bottom={-80} shadow-camera-near={1} shadow-camera-far={320}
      shadow-normalBias={0.25} shadow-bias={-0.0004} />
    <Island onReady={onReady} onFailure={onFailure} onSelect={onSelect} />
    <CameraDriver navigation={navigation} reduced={reduced} visible={visible} onSettled={onSettled} />
  </>;
}

export default function WorldEntry(props: WorldProps) {
  const initialPose = useRef(poses[props.navigation.settled]);
  const camera = useMemo(() => ({ position: [...initialPose.current.position] as [number, number, number], fov: 40, near: 1, far: 3500 }), []);
  const created = useCallback(({ gl }: RootState) => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.shadowMap.type = PCFSoftShadowMap;
    gl.info.autoReset = false;
    gl.setClearAlpha(1);
  }, []);
  return <Canvas aria-hidden="true" tabIndex={-1} camera={camera} shadows={!props.low}
    dpr={pixelRatio(window.innerWidth, window.innerHeight, window.devicePixelRatio, props.low)}
    gl={{ antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false }}
    frameloop={props.visible ? 'demand' : 'never'} onCreated={created}>
    <Runtime {...props} />
  </Canvas>;
}
