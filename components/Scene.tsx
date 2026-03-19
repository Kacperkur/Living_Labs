"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Model as MyURIModel } from '../public/MyURImodel3';
import React, { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Bounds, Center, Html, useProgress, OrbitControls, OrthographicCamera } from '@react-three/drei';

function Loader() {
    const { progress } = useProgress();
    return <Html center>{progress.toFixed(1)}%</Html>;
}

// Smoothly animates the OrbitControls target (and camera) toward a building's
// actual world position, looked up directly from the scene graph.
function CameraAnimator({
    targetBuilding,
    controlsRef,
}: {
    targetBuilding: string | null;
    controlsRef: React.MutableRefObject<any>;
}) {
    const { scene } = useThree();
    const destination = useRef<THREE.Vector3 | null>(null);

    useEffect(() => {
        if (!targetBuilding) { destination.current = null; return; }
        const obj = scene.getObjectByName(targetBuilding);
        if (obj) {
            const worldPos = new THREE.Vector3();
            obj.getWorldPosition(worldPos);
            worldPos.y = 0;
            destination.current = worldPos;
        }
    }, [targetBuilding, scene]);

    useFrame(() => {
        if (!destination.current || !controlsRef.current) return;
        const controls = controlsRef.current;
        const dist = controls.target.distanceTo(destination.current);
        if (dist < 1) { destination.current = null; return; }
        const step = destination.current.clone().sub(controls.target).multiplyScalar(0.08);
        controls.target.add(step);
        controls.object.position.add(step);
        controls.update();
    });

    return null;
}

interface SceneProps {
    onBuildingClick?: (name: string) => void;
    cameraTargetBuilding?: string | null;
}

export function Scene({ onBuildingClick, cameraTargetBuilding }: SceneProps = {}) {
    const controlsRef = useRef<any>(null);
    const panState = useRef({ dragging: false, lastX: 0, lastY: 0, startX: 0, startY: 0, moved: false });

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

        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, cam.up).normalize();

        const zoom = (cam as any).zoom || 1;
        const factor = 0.5 * (1 / zoom);

        const movement = new THREE.Vector3();
        movement.addScaledVector(right, -dx2 * factor * 0.3);
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
                shadows
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%' }}
            >
                <OrthographicCamera
                    makeDefault
                    position={[300, 200, -200]}
                    rotation={[-Math.PI / 4, Math.PI / 4, 0]}
                    zoom={1.5}                                                                                                                                                    top={600}
                    bottom={-100}                                                                                                                                                        
                    near={0.4}  
                    far={10000}
                />
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
                            <MyURIModel onBuildingClick={handleBuildingClick} />
                        </Center>
                    </Bounds>
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    enableRotate={false}
                    enablePan={false}
                    enableZoom={true}
                    minZoom={0.5}
                    maxZoom={3}
                    screenSpacePanning={false}
                />

                <CameraAnimator
                    targetBuilding={cameraTargetBuilding ?? null}
                    controlsRef={controlsRef}
                />
            </Canvas>
        </div>
    );
}
