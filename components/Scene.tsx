"use client"; //redner client side

import {Canvas} from '@react-three/fiber';
import Model from './Model'; //import this specific model from our models folder
import React, { Suspense } from 'react'; //allows us to suspend until 
import { Bounds, Center, Html, useProgress, OrbitControls } from '@react-three/drei';

function Loader() {
    const { progress, active } = useProgress();

    return <Html center>{progress.toFixed(1)}%</Html>;
}

export function Scene(){
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <Canvas
                className="w-screen h-screen"
                style={{ width: '100%', height: '100%' }}
                camera={{ position: [100, 100, 100], near: 0.1, far: 10000 }}
            >
                <directionalLight position={[10, 10, 10]} intensity={4} />
                <ambientLight intensity={0.5} />
                
                <Suspense fallback={<Loader />}>
    
                    <Bounds fit margin={2}>
                        <Center>
                            <Model />
                        </Center>
                    </Bounds>
                    
                </Suspense>

                <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
}


    