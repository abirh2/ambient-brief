import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, BackSide, Color, PlaneGeometry } from 'three';

const vertex = `varying vec3 vWorld; void main() {
  vec4 world = modelMatrix * vec4(position, 1.0); vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export function Atmosphere({ plain, moving }: { plain: boolean; moving: boolean }) {
  const ocean = useRef<ShaderMaterial>(null);
  const { invalidate } = useThree();
  const skyUniforms = useMemo(() => ({ top: { value: new Color('#96b9c3') }, horizon: { value: new Color('#d9dfcf') } }), []);
  const oceanUniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const waterGeometry = useMemo(() => {
    const geometry = new PlaneGeometry(4000, 4000, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  useEffect(() => () => waterGeometry.dispose(), [waterGeometry]);
  useFrame((_, delta) => { if (ocean.current && moving) ocean.current.uniforms.time.value += Math.min(delta, 0.1); });
  useEffect(() => { invalidate(); }, [plain, invalidate]);

  return <>
    <color attach="background" args={['#c7d5d0']} />
    <fog attach="fog" args={['#c7d5d0', 220, 900]} />
    <mesh name="sky" scale={1800}>
      <sphereGeometry args={[1, 32, 16]} />
      {plain ? <meshBasicMaterial color="#bed0cf" side={BackSide} /> : <shaderMaterial side={BackSide} depthWrite={false} uniforms={skyUniforms} vertexShader={vertex} fragmentShader={`
        varying vec3 vWorld; uniform vec3 top; uniform vec3 horizon;
        float noise(vec2 p) { return sin(p.x)*sin(p.y) + .5*sin(p.x*2.1+p.y*.4)*sin(p.y*1.8); }
        void main() {
          vec3 direction = normalize(vWorld - cameraPosition);
          float elevation = max(0., direction.y);
          vec3 col = mix(horizon, top, smoothstep(0., .25, elevation));
          float cloud = noise(direction.xz * 6. + direction.y * 4.);
          float band = smoothstep(.07,.13,elevation) * (1.-smoothstep(.24,.43,elevation));
          col = mix(col, vec3(.79,.83,.79), smoothstep(.15,1.1,cloud)*band*.45);
          gl_FragColor = vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />}
    </mesh>
    <mesh name="ocean" geometry={waterGeometry} position-y={-0.32}>
      {plain ? <meshStandardMaterial color="#386b78" roughness={0.8} /> : <shaderMaterial ref={ocean} uniforms={oceanUniforms} vertexShader={`
        varying vec3 vWorld; uniform float time;
        void main() {
          vec3 p = position;
          p.y += sin(p.x*.075 + time*.32)*cos(p.z*.06+time*.2)*.13;
          vec4 world = modelMatrix * vec4(p,1.); vWorld=world.xyz;
          gl_Position=projectionMatrix*viewMatrix*world;
        }`} fragmentShader={`
        varying vec3 vWorld; uniform float time;
        void main() {
          vec2 p = vWorld.xz;
          float swell = sin(p.x*.055+time*.22)*cos(p.y*.05+time*.17);
          vec3 col = mix(vec3(.055,.175,.22),vec3(.105,.26,.29),swell*.4+.5);
          float ridge = sin(p.y*.9 + sin(p.x*.12+time*.2)*2. + time*.36);
          float broken = sin(p.x*.42 + cos(p.y*.25))*sin(p.x*.17-p.y*.19);
          float strokes = smoothstep(.995,1.,ridge) * smoothstep(.3,.9,broken);
          float distance = length(vWorld.xz-cameraPosition.xz);
          col += vec3(.02,.025,.02)*strokes*(1.-smoothstep(130.,280.,distance));
          float angle = atan((p.y-4.)/57., p.x/78.);
          float coast = 1.+.075*sin(3.*angle+1.)+.045*sin(7.*angle-1.)+.018*sin(13.*angle);
          float cove = atan(sin(angle-2.1),cos(angle-2.1));
          coast -= .16*exp(-pow(cove/.4,2.));
          float radius = length(vec2((p.x-(p.y-4.)*.14)/78.,(p.y-4.)/57.));
          col = mix(vec3(.13,.32,.32),col,smoothstep(.01,.22,radius-coast));
          col = mix(col,vec3(.57,.66,.64),smoothstep(180.,1500.,distance)*.75);
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />}
    </mesh>
  </>;
}
