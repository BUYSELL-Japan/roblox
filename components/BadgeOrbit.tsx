'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export default function BadgeOrbit({ badges = [] }: { badges: any[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  const displayBadges = badges.slice(0, 5); // display up to 5 badges

  if (displayBadges.length === 0) {
    // Mock badges for the flex
    displayBadges.push({ name: 'God Tier' }, { name: 'Alpha' }, { name: 'VIP' });
  }

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {displayBadges.map((badge, index) => {
        const angle = (index / displayBadges.length) * Math.PI * 2;
        const radius = 2.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <group key={index} position={[x, 0, z]}>
            <mesh>
              <octahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#ff003c" emissive="#ff003c" emissiveIntensity={2} />
            </mesh>
            <Text
              position={[0, 0.4, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {badge.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
