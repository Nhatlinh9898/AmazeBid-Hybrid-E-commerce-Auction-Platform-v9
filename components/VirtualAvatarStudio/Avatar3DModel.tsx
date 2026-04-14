import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarCustomization } from '../../types';

interface Avatar3DModelProps {
  url: string;
  customization: AvatarCustomization;
  isTalking: boolean;
  animation?: string;
  moveCommand: { dir: string; ts: number };
  resetPosTrigger: number;
}

const Avatar3DModel: React.FC<Avatar3DModelProps> = ({ url, customization, isTalking, animation, moveCommand, resetPosTrigger }) => {
  const { scene, animations } = useGLTF(url);
  
  const clone = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const rotationRef = useRef(0);
  const posRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    if (resetPosTrigger > 0) {
        posRef.current = { x: 0, z: 0 };
    }
  }, [resetPosTrigger]);

  useEffect(() => {
      if (moveCommand.ts > 0) {
          if (moveCommand.dir === 'FORWARD') posRef.current.z += 12; // 1 step down
          if (moveCommand.dir === 'BACKWARD') posRef.current.z -= 12; // 1 step up
          if (moveCommand.dir === 'LEFT') posRef.current.x -= 5;
          if (moveCommand.dir === 'RIGHT') posRef.current.x += 5;
          
          posRef.current.z = Math.max(-5, Math.min(posRef.current.z, 190));
          posRef.current.x = Math.max(-20, Math.min(posRef.current.x, 20));
      }
  }, [moveCommand]);

  useEffect(() => {
      if (animations && animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(clone);
          
          // Priority: isTalking (Dance) > explicit animation > Idle
          let actionName = 'Idle';
          if (isTalking) {
              actionName = 'Dance';
          } else if (animation) {
              actionName = animation;
          }
          
          const clip = THREE.AnimationClip.findByName(animations, actionName) || animations[0];
          
          if (clip) {
              mixerRef.current.stopAllAction();
              const action = mixerRef.current.clipAction(clip);
              action.play();
          }
      }
      
      return () => {
          if (mixerRef.current) {
              mixerRef.current.stopAllAction();
          }
      }
  }, [clone, animations, isTalking, animation]);

  useEffect(() => {
    // Mouse move handler for character-only rotation
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      rotationRef.current = x * Math.PI * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useFrame((state, delta) => {
      if (mixerRef.current) {
          mixerRef.current.update(delta);
      }
      
      if (groupRef.current) {
        const dx = posRef.current.x - groupRef.current.position.x;
        const dz = posRef.current.z - groupRef.current.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        let targetRot = rotationRef.current; // Default to mouse rotation
        if (distance > 0.1) {
            targetRot = Math.atan2(dx, dz); // Face movement direction
        }

        // Apply rotation
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, 10 * delta);
        
        // Constant speed movement
        const speed = 4.0; // units per second
        if (distance > 0) {
            const moveDist = Math.min(distance, speed * delta);
            groupRef.current.position.x += (dx / distance) * moveDist;
            groupRef.current.position.z += (dz / distance) * moveDist;
        }

        // Calculate Y based on actual Z
        let floorY = 0;
        if (groupRef.current.position.z > 15) {
            const stepIndex = Math.floor((groupRef.current.position.z - 15) / 12);
            floorY = -stepIndex * 0.7;
        }
        
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, floorY, 0.3);
      }
  });

  useEffect(() => {
    clone.traverse((child: any) => {
        if (child.isMesh) {
            // For the Robot, we'll try to tint its main material
            if (child.material) {
                child.material = child.material.clone();
                // Heuristic: tint skin/body with skinToneHash, others with outfitColor
                const name = child.name.toLowerCase();
                if (name.includes('skin') || name.includes('body') || name.includes('head')) {
                    if (customization.skinToneHash !== '#ffffff') {
                        child.material.color.set(customization.skinToneHash);
                    }
                } else if (customization.outfitColor && customization.outfitColor !== '#ffffff') {
                    child.material.color.set(customization.outfitColor);
                }
            }
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
  }, [clone, customization.skinToneHash, customization.outfitColor]);

  return (
      <group 
        ref={groupRef} 
        position={[0, 0, 0]}
        scale={[customization.heightScale, customization.heightScale, customization.heightScale]}
      >
          <primitive object={clone} />
      </group>
  );
};

export default Avatar3DModel;
