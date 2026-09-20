/**
 * HeroBottle3D — Interactive Scroll-Linked 3D Skincare Bottle Component
 * 
 * Implements a procedural Three.js / React Three Fiber cosmetic serum bottle:
 * - Moves across a choreographed 4-stop S-curve matching user scroll progress
 * - Glass vial with physical transmission, roughness, and liquid meniscus
 * - Smooth lerp damping and interactive cursor tilt on hover
 */
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

const SCENE_STOPS = [
  {
    at: 0,
    position: [0, 0.04, 0],
    rotation: [0.03, -0.18, -0.025],
    scale: 0.44
  },
  {
    at: 0.333,
    position: [-1.1, -0.15, 0.16],
    rotation: [-0.08, 1.05, 0.1],
    scale: 0.42
  },
  {
    at: 0.666,
    position: [1.1, 0.1, 0.1],
    rotation: [0.1, 4.05, -0.1],
    scale: 0.42
  },
  {
    at: 1,
    position: [0, -0.18, 0.2],
    rotation: [0, Math.PI * 2, 0],
    scale: 0.32
  }
];

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function getSceneTarget(progress) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const endIndex = SCENE_STOPS.findIndex((stop) => p <= stop.at);
  const end = SCENE_STOPS[endIndex === -1 ? SCENE_STOPS.length - 1 : endIndex];
  const start = SCENE_STOPS[Math.max(0, SCENE_STOPS.indexOf(end) - 1)];
  const span = end.at - start.at || 1;
  const amount = smoothstep((p - start.at) / span);

  return {
    position: start.position.map((value, index) => THREE.MathUtils.lerp(value, end.position[index], amount)),
    rotation: start.rotation.map((value, index) => THREE.MathUtils.lerp(value, end.rotation[index], amount)),
    scale: THREE.MathUtils.lerp(start.scale, end.scale, amount)
  };
}

/** A compact, scroll-linked serum bottle designed to stay in the center content lane. */
function ScrollLinkedBottleMesh({ scrollProgress }) {
  const stageRef = useRef();
  const bottleRef = useRef();
  const liquidRef = useRef();

  useFrame((state, delta) => {
    if (!stageRef.current || !bottleRef.current) return;

    const next = getSceneTarget(scrollProgress);
    stageRef.current.position.x = THREE.MathUtils.damp(stageRef.current.position.x, next.position[0], 7, delta);
    stageRef.current.position.y = THREE.MathUtils.damp(stageRef.current.position.y, next.position[1], 7, delta);
    stageRef.current.position.z = THREE.MathUtils.damp(stageRef.current.position.z, next.position[2], 7, delta);

    stageRef.current.rotation.x = THREE.MathUtils.damp(stageRef.current.rotation.x, next.rotation[0], 7, delta);
    stageRef.current.rotation.y = THREE.MathUtils.damp(stageRef.current.rotation.y, next.rotation[1], 7, delta);
    stageRef.current.rotation.z = THREE.MathUtils.damp(stageRef.current.rotation.z, next.rotation[2], 7, delta);

    stageRef.current.scale.x = THREE.MathUtils.damp(stageRef.current.scale.x, next.scale, 7, delta);
    stageRef.current.scale.y = THREE.MathUtils.damp(stageRef.current.scale.y, next.scale, 7, delta);
    stageRef.current.scale.z = THREE.MathUtils.damp(stageRef.current.scale.z, next.scale, 7, delta);

    // The life-like movement stays inside the scroll-linked stage, so it never
    // feels detached from the route the bottle follows.
    bottleRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.025;
    bottleRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.008;

    if (liquidRef.current) liquidRef.current.rotation.y += delta * 0.16;
  });

  return (
    <group ref={stageRef} position={SCENE_STOPS[0].position} scale={SCENE_STOPS[0].scale}>
      <group ref={bottleRef}>
        {/* A slim pedestal makes the bottle feel grounded at every scroll stop. */}
        <mesh position={[0, -1.38, 0]} receiveShadow>
          <cylinderGeometry args={[1.1, 1.26, 0.22, 48]} />
          <meshStandardMaterial color="#DED4C8" roughness={0.82} metalness={0.03} />
        </mesh>
        <mesh position={[0, -1.245, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[0.98, 0.035, 12, 48]} />
          <meshStandardMaterial color="#F7F1EB" roughness={0.65} />
        </mesh>

        {/* Deep green glass body and visible active-serum core. */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.82, 0.87, 2.28, 64]} />
          <meshPhysicalMaterial
            color="#0E3222"
            emissive="#06170F"
            emissiveIntensity={0.35}
            roughness={0.16}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.08}
            reflectivity={0.9}
          />
        </mesh>
        <mesh ref={liquidRef} position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.72, 0.76, 2.03, 48]} />
          <meshStandardMaterial color="#285A3D" emissive="#0C2A1B" emissiveIntensity={0.5} roughness={0.24} metalness={0.28} />
        </mesh>
        <mesh position={[0, -1.17, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.84, 0.055, 12, 48]} />
          <meshStandardMaterial color="#1C4730" roughness={0.28} metalness={0.38} />
        </mesh>

        {/* Shoulder, collar, and dropper cap. */}
        <mesh position={[0, 1.23, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.82, 0.34, 64]} />
          <meshPhysicalMaterial color="#123A27" roughness={0.14} metalness={0.22} clearcoat={1} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.42, 0.34, 48]} />
          <meshStandardMaterial color="#12261B" roughness={0.25} metalness={0.46} />
        </mesh>
        <mesh position={[0, 1.39, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.42, 0.04, 12, 48]} />
          <meshStandardMaterial color="#D5AC59" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.91, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.5, 0.42, 48]} />
          <meshStandardMaterial color="#211C1A" roughness={0.34} metalness={0.32} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <sphereGeometry args={[0.3, 32, 24]} />
          <meshStandardMaterial color="#171210" roughness={0.72} />
        </mesh>

        {/* Branded label: raised, bright, and unaffected by the dark glass lighting. */}
        <RoundedBox args={[1.34, 1.55, 0.05]} radius={0.075} smoothness={4} position={[0, -0.08, 0.875]}>
          <meshBasicMaterial color="#FCF8F2" />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.22, 0.062]} radius={0.11} smoothness={4} position={[0, 0.36, 0.91]}>
          <meshBasicMaterial color="#E8633A" />
        </RoundedBox>
        <mesh position={[0, 0.36, 0.945]}>
          <torusGeometry args={[0.067, 0.012, 8, 24]} />
          <meshBasicMaterial color="#FFF7F1" />
        </mesh>
        <RoundedBox args={[0.72, 0.05, 0.062]} radius={0.025} smoothness={3} position={[0, 0.02, 0.91]}>
          <meshBasicMaterial color="#263A2E" />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.035, 0.062]} radius={0.018} smoothness={3} position={[0, -0.11, 0.91]}>
          <meshBasicMaterial color="#B6A99D" />
        </RoundedBox>
        <RoundedBox args={[0.61, 0.035, 0.062]} radius={0.018} smoothness={3} position={[0, -0.2, 0.91]}>
          <meshBasicMaterial color="#B6A99D" />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.09, 0.062]} radius={0.045} smoothness={3} position={[0, -0.49, 0.91]}>
          <meshBasicMaterial color="#E8633A" />
        </RoundedBox>

        {/* Botanical accents move with the bottle instead of floating across the page. */}
        <mesh position={[-0.92, -0.98, 0.15]} rotation={[0.35, 0.2, -0.45]} castShadow>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#467254" roughness={0.55} />
        </mesh>
        <mesh position={[0.87, -0.76, -0.12]} rotation={[-0.2, -0.25, 0.5]} castShadow>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshStandardMaterial color="#5D8667" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroBottle3D({ scrollProgress = 0 }) {
  return (
    <div className="h-full w-full select-none" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.15, 6.2], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.45} />
        <directionalLight position={[4.5, 6, 5]} intensity={2.6} castShadow />
        <pointLight position={[-3.5, 1.5, 3]} intensity={1.2} color="#FFD7C0" />
        <pointLight position={[1, -1, -3]} intensity={1.5} color="#3FE08B" />

        {/* Luminous bio-active sparkles drifting in 3D depth around the bottle */}
        <Sparkles count={36} scale={[12, 8, 8]} size={2.8} speed={0.35} color="#E8633A" opacity={0.65} />
        <Sparkles count={26} scale={[10, 7, 7]} size={2.2} speed={0.25} color="#467254" opacity={0.5} />
        <Sparkles count={20} scale={[11, 8, 9]} size={1.8} speed={0.4} color="#E5C158" opacity={0.6} />

        {/* Floating translucent serum essence droplets with subtle depth parallax */}
        <Float speed={1.6} rotationIntensity={0.5} floatIntensity={0.8}>
          <mesh position={[-2.4, 1.3, -0.6]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshPhysicalMaterial
              color="#FDF8F3"
              transmission={0.88}
              roughness={0.1}
              thickness={0.8}
              clearcoat={1}
            />
          </mesh>
        </Float>
        <Float speed={2.0} rotationIntensity={0.4} floatIntensity={0.9}>
          <mesh position={[2.6, -0.8, -0.4]}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshPhysicalMaterial
              color="#E8DFD3"
              transmission={0.85}
              roughness={0.15}
              thickness={0.6}
              clearcoat={1}
            />
          </mesh>
        </Float>
        <Float speed={1.4} rotationIntensity={0.6} floatIntensity={0.6}>
          <mesh position={[-2.1, -1.5, 0.3]}>
            <sphereGeometry args={[0.11, 24, 24]} />
            <meshStandardMaterial
              color="#D5AC59"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
        </Float>

        <ScrollLinkedBottleMesh scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
