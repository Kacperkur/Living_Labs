"use client";

import React, { useEffect, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Group, Box3, Vector3, Mesh, Object3D, AnimationClip, KeyframeTrack } from 'three';

// Minimal local GLTF-like type to avoid depending on three's example typings in this project.
type MinimalGLTF = {
    scene: Object3D;
    animations?: AnimationClip[];
};

// preload the model from the public root /public 
useGLTF.preload('myURImodel2.glb');

type ModelProps = {
    scale?: number;
};

export default function Model({ scale = 1 }: ModelProps) {
    const group = useRef<Group>(null); // Inside the component, I use a useRef hook which creates a reference to a Three.js Group object, which acts as a container for the 3D model and its animations.

    
    // do not include '/public' in the URL  Next serves public files at '/<filename>'
    const gltf = useGLTF('/myURImodel2.glb') as any;
    const { scene: pcObject, animations } = gltf;

        // hook that maps animations to three.js AnimationActions bound to the `group`
    const { actions, names } = useAnimations(animations as AnimationClip[], group);

        // Log animations and actions so you can inspect them in the browser console.
        useEffect(() => {
            if (!pcObject) return;
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
                pcObject.traverse((child: Object3D) => {
                    if ((child as Mesh).isMesh) {
                        const m = child as Mesh;
                        m.frustumCulled = false;
                        // enable shadows: cast and receive
                        try {
                            m.castShadow = true;
                            m.receiveShadow = true;
                        } catch (e) {
                            console.warn('Failed to set shadows on mesh', m.name, e);
                        }
                        // mark this mesh selectable for hover interactions
                        if (!m.userData) m.userData = {};
                        m.userData.selectable = true;
                        // log a little info about the mesh
                        console.log('Mesh:', m.name, 'visible:', m.visible, 'frustumCulled set to false');
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
    }, [animations, actions, names, pcObject]);

        // Log detailed clip info
        useEffect(() => {
            if (animations && animations.length) {
                    animations.forEach((clip: AnimationClip, idx: number) => {
                        console.log(`Clip[${idx}]: name=${clip.name}, duration=${clip.duration}, tracks=${clip.tracks?.length}`);
                        if (clip.tracks && clip.tracks.length) {
                            clip.tracks.forEach((t: KeyframeTrack) => console.log('  track:', t.name, 'times length:', t.times?.length));
                        }
                    });
                }
        }, [animations]);

    // actions are already created and logged above via useAnimations(animations, group)
    return (
        // rotate the entire model +90 degrees around Y (Math.PI/2)
        <group ref={group} rotation={[0, Math.PI / 2, 0]}>
            <primitive object={pcObject} dispose={null} scale={scale} />
        </group>
    );
}
