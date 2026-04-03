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

// R3F's resize handler resets the orthographic frustum to symmetric pixel-based
// values on every canvas resize, which overwrites the custom top/bottom and cuts
// off the scene. This component re-applies the correct frustum after each resize.
const CAM_TOP = 350;
const CAM_BOTTOM = -120;
function CameraResizer() {
    const { camera, size } = useThree();
    useEffect(() => {
        if (!(camera instanceof THREE.OrthographicCamera)) return;
        camera.top = CAM_TOP;
        camera.bottom = CAM_BOTTOM;
        camera.left = -size.width / 2;
        camera.right = size.width / 2;
        camera.updateProjectionMatrix();
    }, [camera, size]);
    return null;
}

const ZOOM_START = 0.75;
const ZOOM_TARGET = 1.5;
const ZOOM_EASE = 0.03; // lower = slower ease

function ZoomIntro() {
    const { camera } = useThree();
    const done = useRef(false);

    useEffect(() => {
        camera.zoom = ZOOM_START;
        camera.updateProjectionMatrix();
    }, [camera]);

    useFrame(() => {
        if (done.current) return;
        const diff = ZOOM_TARGET - camera.zoom;
        if (Math.abs(diff) < 0.001) {
            camera.zoom = ZOOM_TARGET;
            camera.updateProjectionMatrix();
            done.current = true;
            return;
        }
        camera.zoom += diff * ZOOM_EASE;
        camera.updateProjectionMatrix();
    });

    return null;
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
    const resolved = useRef<string | null>(null);

    useFrame(() => {
        // Retry lookup every frame until the object appears in the scene.
        // This handles the case where targetBuilding is set before the model loads.
        if (targetBuilding && resolved.current !== targetBuilding) {
            const obj = scene.getObjectByName(targetBuilding);
            if (obj) {
                const worldPos = new THREE.Vector3();
                obj.getWorldPosition(worldPos);
                worldPos.y = 0;
                destination.current = worldPos;
                resolved.current = targetBuilding;
            }
        }

        if (!destination.current || !controlsRef.current) return;
        const controls = controlsRef.current;
        const dist = controls.target.distanceTo(destination.current);
        if (dist < 1) { destination.current = null; return; }
        const step = destination.current.clone().sub(controls.target).multiplyScalar(0.08);
        controls.target.add(step);
        controls.object.position.add(step);
        controls.update();
    });

    // Reset resolved ref when target changes so the lookup runs again.
    useEffect(() => {
        if (resolved.current !== targetBuilding) {
            destination.current = null;
        }
    }, [targetBuilding]);

    return null;
}

interface SceneProps {
    onBuildingClick?: (name: string) => void;
    cameraTargetBuilding?: string | null;
    labBuildings?: Set<string>;
}

export function Scene({ onBuildingClick, cameraTargetBuilding, labBuildings }: SceneProps = {}) {
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

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                border: '2px ridge rgba(0, 0, 0, 0.2)',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 8px 12px -8px rgba(0, 0, 0, 0.3)'
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
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
                    zoom={1.5}
                    top={350}
                    bottom={-120}
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
                    shadow-camera-far={3000}
                    shadow-camera-left={-1200}
                    shadow-camera-right={1200}
                    shadow-camera-top={1200}
                    shadow-camera-bottom={-1200}
                    shadow-bias={-0.0005}
                />
                <ambientLight intensity={0.6} />

                {/* Ground plane to receive building shadows */}
                <mesh rotation={[-Math.PI / 2, 0,0]} position={[0, -40, -500]} receiveShadow>
                    <planeGeometry args={[20000, 20000]} />
                    <meshStandardMaterial color="#57b75f" transparent opacity={0.5} />
                </mesh>

                <Suspense fallback={<Loader />}>
                    <Bounds fit={false} margin={2}>
                        <Center>
                            <MyURIModel onBuildingClick={handleBuildingClick} labBuildings={labBuildings} />
                        </Center>
                    </Bounds>
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    enableRotate={false}
                    enablePan={false}
                    enableZoom={true}
                    minZoom={0.75}
                    maxZoom={2}
                    screenSpacePanning={false}
                />

                <CameraResizer />
                <ZoomIntro />
                <CameraAnimator
                    targetBuilding={cameraTargetBuilding ?? null}
                    controlsRef={controlsRef}
                />
            </Canvas>
        </div>
    );
}
