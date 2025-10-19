"use client";

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

// Simple component that triggers a GLTF preload on mount.
export default function Preload() {
  useEffect(() => {
    // useGLTF.preload exists and is used elsewhere; calling it here ensures the browser
    // starts fetching the model as soon as this component mounts.
    try {
      (useGLTF as any).preload('/URI.glb');
    } catch (e) {
      // If useGLTF.preload is not callable for some reason, silently ignore — not fatal.
      // The window's Canvas will still fetch the model when needed.
      console.warn('Preload: useGLTF.preload failed', e);
    }
  }, []);

  return null;
}
