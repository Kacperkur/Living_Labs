"use client";

import React, { useEffect, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Group, Box3, Vector3, Mesh } from 'three';

// preload the model from the public root (Next.js serves files in /public at the site root)
useGLTF.preload('/Test.glb');

type ModelProps = {
    scale?: number;
};

export default function Model({ scale = 1 }: ModelProps) {
    const group = useRef<Group>(null); // Inside the component, a useRef hook creates a reference to a Three.js Group object, which acts as a container for the 3D model and its animations.

    
    // do not include '/public' in the URL — Next serves public files at '/<filename>'
    const gltf = useGLTF('/Test.glb') as any;
    const { scene: pcObject, animations } = gltf;

        // hook that maps animations to three.js AnimationActions bound to the `group`
        const { actions, names } = useAnimations(animations, group);

        // Log animations and actions so you can inspect them in the browser console.
        useEffect(() => {
            console.log('GLTF animations:', animations);
            console.log('Animation names:', names);
            console.log('Actions object:', actions);

            // Compute bounding box and log size
            try {
                const box = new Box3().setFromObject(pcObject);
                const size = new Vector3();
                box.getSize(size);
                console.log('pcObject bounding box size:', size);
                console.log('pcObject bounding box min/max:', box.min, box.max);
            } catch (e) {
                console.warn('Failed to compute bounding box for pcObject', e);
            }

            // Traverse and disable frustum culling on meshes (debug only)
            try {
                pcObject.traverse((child: any) => {
                    if ((child as Mesh).isMesh) {
                        (child as Mesh).frustumCulled = false;
                        // log a little info about the mesh
                        console.log('Mesh:', child.name, 'visible:', child.visible, 'frustumCulled set to false');
                    }
                });
            } catch (e) {
                console.warn('Traversal failed', e);
            }

            // If the model includes at least one animation, autoplay the first one.
            if (names && names.length && actions) {
                const first = names[0];
                actions[first]?.play();
                console.info(`Playing animation: ${first}`);
            }
        }, [animations, actions, names]);

        // Log detailed clip info
        useEffect(() => {
            if (animations && animations.length) {
                animations.forEach((clip: any, idx: number) => {
                    console.log(`Clip[${idx}]: name=${clip.name}, duration=${clip.duration}, tracks=${clip.tracks?.length}`);
                    if (clip.tracks && clip.tracks.length) {
                        clip.tracks.forEach((t: any) => console.log('  track:', t.name, 'times length:', t.times?.length));
                    }
                });
            }
        }, [animations]);

    // actions are already created and logged above via useAnimations(animations, group)
    return (
        <group ref={group}>
            <primitive object={pcObject} dispose={null} scale={scale} />
        </group>
    );
}
