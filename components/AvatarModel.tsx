'use client';

import { useFrame } from '@react-three/fiber';
import React, { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Image } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

interface AvatarModelProps {
  avatarImageUrl: string | null;
  emoteState: 'idle' | 'dance' | 'wave' | 'flex';
}

export default function AvatarModel({ avatarImageUrl, emoteState }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { position, rotation, scale } = useSpring({
    position: emoteState === 'dance' ? [0, 1.5, 0] : [0, 1, 0],
    rotation: emoteState === 'wave' ? [0, Math.PI / 4, 0] : 
              emoteState === 'flex' ? [0, -Math.PI / 8, 0] : [0, 0, 0],
    scale: emoteState === 'flex' ? [1.2, 1.2, 1.2] : [1, 1, 1],
    config: { tension: 120, friction: 14 }
  });

  useFrame((state) => {
    if (groupRef.current) {
      if (emoteState === 'dance') {
        const time = state.clock.getElapsedTime();
        groupRef.current.position.y = 1 + Math.abs(Math.sin(time * 5)) * 0.5;
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.5;
      } else if (emoteState === 'wave') {
        const time = state.clock.getElapsedTime();
        groupRef.current.rotation.z = Math.sin(time * 8) * 0.2;
      }
    }
  });

  return (
    // @ts-ignore
    <animated.group ref={groupRef} position={position as any} rotation={rotation as any} scale={scale as any}>
      {avatarImageUrl ? (
        <group>
          {/* Hologram Card/Image */}
          <React.Suspense fallback={null}>
            <Image 
              url={avatarImageUrl} 
              transparent 
              scale={[3, 3]} 
              position={[0, 0, 0.05]} 
            />
          </React.Suspense>
          {/* Glow backdrop frame */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[3.2, 3.2]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} transparent opacity={0.3} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 0, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
    </animated.group>
  );
}
