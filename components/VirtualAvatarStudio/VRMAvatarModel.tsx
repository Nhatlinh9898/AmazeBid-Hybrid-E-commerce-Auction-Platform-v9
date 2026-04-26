import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import { AvatarCustomization } from '../../types';

interface VRMAvatarModelProps {
  url: string;
  customization: AvatarCustomization;
  isTalking: boolean;
  animation?: string;
  moveCommand: { dir: string; ts: number };
  resetPosTrigger: number;
}

const VRMAvatarModel: React.FC<VRMAvatarModelProps> = ({ url, customization, isTalking, animation, moveCommand, resetPosTrigger }) => {
  const [vrm, setVrm] = React.useState<VRM | null>(null);
  const groupRef = React.useRef<THREE.Group>(null);
  const rotationRef = React.useRef(0);
  const posRef = React.useRef({ x: 0, z: 0 });

  React.useEffect(() => {
    if (resetPosTrigger > 0) {
      posRef.current = { x: 0, z: 0 };
    }
  }, [resetPosTrigger]);

  React.useEffect(() => {
    if (moveCommand.ts > 0) {
      if (moveCommand.dir === 'FORWARD') posRef.current.z += 12; // 1 step down
      if (moveCommand.dir === 'BACKWARD') posRef.current.z -= 12; // 1 step up
      if (moveCommand.dir === 'LEFT') posRef.current.x -= 5;
      if (moveCommand.dir === 'RIGHT') posRef.current.x += 5;

      posRef.current.z = Math.max(-5, Math.min(posRef.current.z, 190));
      posRef.current.x = Math.max(-20, Math.min(posRef.current.x, 20));
    }
  }, [moveCommand]);

  // Use animation prop to satisfy lint or implement logic
  React.useEffect(() => {
    if (vrm && animation) {
      console.log("VRM Animation requested:", animation);
      // Future: Implement VRM animation loading/playing
    }
  }, [vrm, animation]);

  React.useEffect(() => {
    if (!url) return;

    const validateAndLoad = async () => {
      try {
        // Pre-fetch a small chunk to check magic numbers
        const response = await fetch(url, { headers: { 'Range': 'bytes=0-10' } });
        
        // If Range request fails or is not supported, we'll just try to load normally but with better error handling
        if (response.ok || response.status === 206) {
          const buffer = await response.arrayBuffer();
          const header = new Uint8Array(buffer);
          
          // Check for JPEG (FF D8 FF)
          if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            throw new Error("Selected file is a JPEG image, not a VRM model.");
          }
          // Check for PNG (89 50 4E 47)
          if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
            throw new Error("Selected file is a PNG image, not a VRM model.");
          }
        }

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(url, (gltf) => {
          const vrmInstance = gltf.userData.vrm;

          if (vrmInstance) {
            // Rotate model to face camera (VRM models usually face backwards in Three.js)
            vrmInstance.scene.rotation.y = Math.PI;
            setVrm(vrmInstance);
          }
        }, undefined, (error) => {
          console.error("Error parsing VRM (likely invalid format):", error);
        });
      } catch (err) {
        console.error("VRM Validation/Loading failed:", err);
      }
    };

    validateAndLoad();

    // Mouse move handler for character-only rotation
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      rotationRef.current = x * Math.PI * 0.4; // Rotate character specifically
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [url]);

  React.useEffect(() => {
    if (vrm) {
      vrm.scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material) {
            child.material = child.material.clone();
            const name = child.name.toLowerCase();
            // Apply skin tone
            if (name.includes('skin') || name.includes('body') || name.includes('head') || name.includes('face')) {
              if (customization.skinToneHash !== '#ffffff') {
                child.material.color.set(customization.skinToneHash);
              }
            }
            // Apply eye color
            if (name.includes('eye') && !name.includes('brow') && !name.includes('lash')) {
              if (customization.eyeColor !== '#ffffff') {
                child.material.color.set(customization.eyeColor);
              }
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [vrm, customization.skinToneHash, customization.eyeColor]);

  useFrame((state, delta) => {
    if (vrm) {
      vrm.update(delta);

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

      // Basic lip sync / expression
      if (isTalking) {
        const s = Math.sin(state.clock.elapsedTime * 15);
        vrm.expressionManager?.setValue('aa', s > 0 ? s : 0);
        vrm.expressionManager?.setValue('blink', 0);
      } else {
        vrm.expressionManager?.setValue('aa', 0);
        // Random blinking
        if (Math.random() > 0.98) {
          vrm.expressionManager?.setValue('blink', 1);
        } else {
          vrm.expressionManager?.setValue('blink', 0);
        }
      }
    }
  });

  if (!vrm) return null;

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      scale={[customization.heightScale, customization.heightScale, customization.heightScale]}
    >
      <primitive object={vrm.scene} />
    </group>
  );
};

export default VRMAvatarModel;
