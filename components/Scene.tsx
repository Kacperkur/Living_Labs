"use client";

import { Canvas } from "@react-three/fiber";
import Model from "./Model";
import React, { Suspense } from "react";
import {
  Bounds,
  Center,
  OrthographicCamera,
  OrbitControls,
} from "@react-three/drei";

export function Scene({
  fullScreen = true,
  showModel = true,
}: {
  fullScreen?: boolean;
  showModel?: boolean;
}) {
  const containerStyle: React.CSSProperties = fullScreen
    ? { width: "100vw", height: "100vh", position: "relative" }
    : { width: "100%", height: "60vh", position: "relative" };

  return (
    <div style={containerStyle}>
      <Canvas style={{ width: "100%", height: "100%" }}>
        <directionalLight position={[10, 20, 10]} intensity={2} />
        <ambientLight intensity={10} />

        {/* Fixed angled orthographic camera - moved further back */}
        <OrthographicCamera
          makeDefault
          position={[1000, 100, 80]} // increased distance, same angled/top-down orientation
          rotation={[-Math.PI / 4, Math.PI / 4, 0]} // tilt downward
          zoom={3} // lower zoom to make the model appear smaller / further away
          near={0.1}
          far={10000}
        />

        {/* Pan + zoom only controls */}
        <OrbitControls
          makeDefault
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={false} // keeps pan flat
        />

        <Suspense fallback={null}>
          {showModel && (
        <Bounds fit={false}>
          <Center>
            <Model />
          </Center>
        </Bounds>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
