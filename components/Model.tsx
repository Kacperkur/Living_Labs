"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAnimations } from '@react-three/drei';
import { Group, Mesh, BufferGeometry, BufferAttribute, MeshStandardMaterial } from 'three';
import * as THREE from 'three';

type ModelProps = {
    scale?: number;
};

export default function Model({ scale = 1 }: ModelProps) {
    const group = useRef<Group>(null);
    const [modelData, setModelData] = useState<any>(null);

    useEffect(() => {
        const fetchModelData = async () => {
            try {
                const response = await fetch('/api/process-model');
                if (!response.ok) {
                    throw new Error(`Failed to fetch model data: ${response.statusText}`);
                }
                const data = await response.json();
                setModelData(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchModelData();
    }, []);

    const { actions, names } = useAnimations(modelData?.animations || [], group);

    useEffect(() => {
        if (names && names.length > 0 && actions) {
            const first = names[0];
            actions[first]?.play();
            console.info(`Playing animation: ${first}`);
        }
    }, [actions, names]);

    return (
        <group ref={group} rotation={[0, Math.PI / 2, 0]}>
            {modelData && modelData.meshes.map((meshData: any, index: number) => {
                const geometry = new BufferGeometry();
                geometry.setAttribute('position', new BufferAttribute(new Float32Array(meshData.geometry.attributes.position), 3));
                if (meshData.geometry.attributes.normal) {
                    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(meshData.geometry.attributes.normal), 3));
                }
                if (meshData.geometry.attributes.uv) {
                    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(meshData.geometry.attributes.uv), 2));
                }
                if (meshData.geometry.index) {
                    geometry.setIndex(new BufferAttribute(new Uint32Array(meshData.geometry.index), 1));
                }

                const material = new MeshStandardMaterial();
                if (meshData.material.color) {
                    material.color = new THREE.Color(meshData.material.color);
                }
                // Note: Texture loading would require more handling here

                return (
                    <mesh
                        key={index}
                        name={meshData.name}
                        position={meshData.position}
                        rotation={meshData.rotation}
                        scale={meshData.scale}
                        userData={meshData.userData}
                        geometry={geometry}
                        material={material}
                        castShadow
                        receiveShadow
                    />
                );
            })}
        </group>
    );
}
