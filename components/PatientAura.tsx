"use client";

import { useEffect, useRef, type ElementRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";

interface PatientAuraProps {
  audioPlaying: boolean;
  loading: boolean;
  traineeSpeaking?: boolean;
}

function AuraSphere({ audioPlaying, loading, traineeSpeaking = false }: PatientAuraProps) {
  const materialRef = useRef<ElementRef<typeof MeshDistortMaterial> | null>(null);
  const shellMaterialRef = useRef<ElementRef<typeof MeshDistortMaterial> | null>(null);
  const parallaxGroupRef = useRef<THREE.Group | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const shellMeshRef = useRef<THREE.Mesh | null>(null);
  const colorRef = useRef(new THREE.Color("#ffc700"));
  const shellColorRef = useRef(new THREE.Color("#ffd95a"));
  const phaseRef = useRef(1.618);
  const pointerRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.set(x, y);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const targetDistort = traineeSpeaking ? 0.28 : audioPlaying ? 0.4 : loading ? 0.15 : 0.05;
  const targetSpeed = traineeSpeaking ? 2 : audioPlaying ? 3 : loading ? 0.8 : 0.4;
  const targetOpacity = traineeSpeaking ? 0.42 : audioPlaying ? 0.5 : loading ? 0.25 : 0.15;

  useFrame((state, delta) => {
    const material = materialRef.current as
      | (ElementRef<typeof MeshDistortMaterial> & { speed: number })
      | null;
    const shellMaterial = shellMaterialRef.current as
      | (ElementRef<typeof MeshDistortMaterial> & { speed: number })
      | null;
    if (!material || !shellMaterial) return;

    const elapsed = state.clock.getElapsedTime() + phaseRef.current;
    const parallaxGroup = parallaxGroupRef.current;

    const baseHue = traineeSpeaking ? 0.44 : 0.13;
    const baseSat = traineeSpeaking ? 0.68 : 0.95;
    const baseLight = traineeSpeaking ? 0.62 : 0.52;

    // Slight, low-frequency hue/sat/light variance for a more organic look.
    const hueJitter = Math.sin(elapsed * 0.31) * 0.008 + Math.sin(elapsed * 0.17) * 0.006;
    const satJitter = Math.sin(elapsed * 0.23) * 0.03;
    const lightJitter = Math.sin(elapsed * 0.19) * 0.025;

    colorRef.current.setHSL(baseHue + hueJitter, baseSat + satJitter, baseLight + lightJitter);
    shellColorRef.current.setHSL(baseHue + hueJitter + 0.012, baseSat + satJitter - 0.08, baseLight + lightJitter + 0.07);

    // Slower easing for calmer transitions.
    const t = 1 - Math.exp(-2.5 * delta);
    material.distort += (targetDistort - material.distort) * t;
    material.speed += (targetSpeed - material.speed) * t;
    material.opacity += (targetOpacity - material.opacity) * t;
    material.color.lerp(colorRef.current, t);

    shellMaterial.distort += (targetDistort * 0.65 - shellMaterial.distort) * t;
    shellMaterial.speed += (targetSpeed * 0.6 - shellMaterial.speed) * t;
    shellMaterial.opacity += (targetOpacity * 0.45 - shellMaterial.opacity) * t;
    shellMaterial.color.lerp(shellColorRef.current, t);

    if (parallaxGroup) {
      const maxTilt = 0.09;
      const maxShift = 0.08;
      const targetRotX = -pointerRef.current.y * maxTilt;
      const targetRotY = pointerRef.current.x * maxTilt;
      const targetPosX = pointerRef.current.x * maxShift;
      const targetPosY = -pointerRef.current.y * maxShift;

      // Interpolate to target transforms for smoother parallax.
      parallaxGroup.rotation.x = THREE.MathUtils.lerp(parallaxGroup.rotation.x, targetRotX, t);
      parallaxGroup.rotation.y = THREE.MathUtils.lerp(parallaxGroup.rotation.y, targetRotY, t);
      parallaxGroup.position.x = THREE.MathUtils.lerp(parallaxGroup.position.x, targetPosX, t);
      parallaxGroup.position.y = THREE.MathUtils.lerp(parallaxGroup.position.y, targetPosY, t);
    }

    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * 0.12;
      coreMeshRef.current.rotation.x += delta * 0.04;
    }
    if (shellMeshRef.current) {
      shellMeshRef.current.rotation.y -= delta * 0.08;
      shellMeshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.15}>
      <group ref={parallaxGroupRef}>
        <mesh ref={coreMeshRef}>
          <sphereGeometry args={[1, 96, 96]} />
          <MeshDistortMaterial
            ref={materialRef}
            color="#ffc700"
            roughness={0.95}
            metalness={0}
            distort={0.10}
            speed={0.5}
            transparent
            opacity={0.15}
          />
        </mesh>

        <mesh ref={shellMeshRef} scale={1.16}>
          <sphereGeometry args={[1, 80, 80]} />
          <MeshDistortMaterial
            ref={shellMaterialRef}
            color="#ffd95a"
            roughness={1}
            metalness={0}
            distort={0.05}
            speed={0.3}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </Float>
  );
}

export function PatientAura({ audioPlaying, loading, traineeSpeaking = false }: PatientAuraProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3] }}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight
        args={["#fff6db", "#173a2f", 0.45]}
      />

      <Sparkles
        count={28}
        scale={[4, 4, 2]}
        size={1.8}
        speed={0.14}
        opacity={0.18}
        color={traineeSpeaking ? "#9ce8cb" : "#ffe08a"}
      />

      <AuraSphere
        audioPlaying={audioPlaying}
        loading={loading}
        traineeSpeaking={traineeSpeaking}
      />
    </Canvas>
  );
}
