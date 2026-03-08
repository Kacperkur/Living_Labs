"use client";

import {Canvas} from '@react-three/fiber';
// import Model from './Model'; // original Model import (commented out per request)
// Use the user's transformed GLTF React component from public
import { Model as MyURIModel } from '../public/MyURImodel3';
import React, { Suspense, useRef } from 'react'; 
import * as THREE from 'three';
import { Bounds, Center, Html, useProgress, OrbitControls, OrthographicCamera } from '@react-three/drei';


function Loader() {
    const { progress, active } = useProgress();

    return <Html center>{progress.toFixed(1)}%</Html>;
}

interface SceneProps {
    onBuildingClick?: (name: string) => void;
}

export function Scene({ onBuildingClick }: SceneProps = {}){
    // ref to OrbitControls so we can access the camera and control object
    const controlsRef = useRef<any>(null);

    // simple pan state to track dragging
    const panState = useRef({ dragging: false, lastX: 0, lastY: 0, startX: 0, startY: 0, moved: false });

    // Only fire building click if the pointer didn't move (i.e. wasn't a pan)
    function handleBuildingClick(name: string) {
        if (!panState.current.moved) {
            onBuildingClick?.(name);
        }
    }

    function onPointerDown(e: React.PointerEvent) {
        panState.current.dragging = true;
        panState.current.moved = false;
        panState.current.lastX = e.clientX;
        panState.current.lastY = e.clientY;
        panState.current.startX = e.clientX;
        panState.current.startY = e.clientY;
        try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
    }
    function onPointerUp(e: React.PointerEvent) {
        panState.current.dragging = false;
        try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    }
    function onPointerMove(e: React.PointerEvent) {
        if (!panState.current.dragging) return;
        const dx = e.clientX - panState.current.startX;
        const dy = e.clientY - panState.current.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 5) panState.current.moved = true;
        const dx2 = e.clientX - panState.current.lastX;
        const dy2 = e.clientY - panState.current.lastY;
        panState.current.lastX = e.clientX;
        panState.current.lastY = e.clientY;

        const controls = controlsRef.current;
        if (!controls) return;
        const cam = controls.object as THREE.Camera;

        // compute forward (camera look) projected onto XZ plane
        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        // right vector = forward x up
        const right = new THREE.Vector3();
        right.crossVectors(forward, cam.up).normalize();

        // sensitivity factor: tune as needed; scale with orthographic zoom if present
        const zoom = (cam as any).zoom || 1;
        const factor = 0.5 * (1 / zoom);

        const movement = new THREE.Vector3();
        movement.addScaledVector(right, -dx2 * factor * 0.3); // Reduced horizontal panning by 70%
        movement.addScaledVector(forward, dy2 * factor);

        cam.position.add(movement);
        controls.target.add(movement);
        controls.update();
    }

    function onWheel(e: React.WheelEvent) {
        e.preventDefault();
        const delta = e.deltaY;
        const controls = controlsRef.current;
        if (!controls) return;
        const cam = controls.object as THREE.Camera;

        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const zoom = (cam as any).zoom || 1;
        const factor = 0.02 * (1 / zoom);
        const movement = forward.multiplyScalar(delta * factor);
        cam.position.add(movement);
        controls.target.add(movement);
        controls.update();
    }

    return (
    <div
        style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            border: '2px ridge rgba(0, 0, 0, 0.2)',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 8px 12px -8px rgba(0, 0, 0, 0.3)'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
    >
            <Canvas
                shadows // enable shadowMap on the renderer
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%' }}
            >
                {}
                <OrthographicCamera
                    makeDefault
                    position={[10,300,-400]}
                    rotation={[-Math.PI / 6, Math.PI / 4, 0]}
                    zoom={1}
                    near={0.1}
                    far={10000}
                />
                {/* Directional light configured to cast shadows */}
                <directionalLight
                    position={[100, 200, 100]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={0.5}
                    shadow-camera-far={1000}
                    shadow-camera-left={-300}
                    shadow-camera-right={300}
                    shadow-camera-top={300}
                    shadow-camera-bottom={-300}
                    shadow-bias={-0.0005}
                />
                <ambientLight intensity={0.6} />
                
                <Suspense fallback={<Loader />}>
    
                    <Bounds fit={false} margin={2}>
                        <Center>
                            {/* Previously: <Model /> (from ./Model) */}
                            <MyURIModel onBuildingClick={handleBuildingClick} />
                        </Center>
                    </Bounds>
                    
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    enableRotate={false}
                    enablePan={false} // we intercept panning
                    enableZoom={true}
                    minZoom={0.5}
                    maxZoom={3}
                    screenSpacePanning={false}
                />
            </Canvas>
        </div>
    );
}