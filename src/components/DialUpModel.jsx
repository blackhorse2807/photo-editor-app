import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export default function DialUpModel({ rotation = 0 }) {
  const modelRef = useRef();
  const modelPath = process.env.PUBLIC_URL + '/images/track-ball-3d.glb';
  const gltf = useGLTF(modelPath);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      dispose={null}
      scale={[1, 1, 1]}
    />
  );
}

// Preload the model with the correct path
const modelPath = process.env.PUBLIC_URL + '/images/track-ball-3d.glb';
useGLTF.preload(modelPath); 