import { NextResponse } from 'next/server';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import path from 'path';
import fs from 'fs';

// Since we're on the server, we can use fs to read the file
const modelPath = path.resolve('./public/myURImodel2.glb');

// This function will be executed when the API route is called
export async function GET() {
  try {
    const buffer = fs.readFileSync(modelPath);

    const loader = new GLTFLoader();
    // Draco loader is optional, but often used with glb files
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        '',
        resolve,
        reject
      );
    });

    const scene = (gltf as any).scene;
    const meshes: any[] = [];

    scene.traverse((child: any) => {
      if (child.isMesh) {
        const { geometry, material, name, position, rotation, scale, userData } = child;
        meshes.push({
          name,
          position: position.toArray(),
          rotation: [rotation.x, rotation.y, rotation.z],
          scale: scale.toArray(),
          userData,
          geometry: {
            attributes: {
              position: geometry.attributes.position.array,
              normal: geometry.attributes.normal.array,
              uv: geometry.attributes.uv ? geometry.attributes.uv.array : undefined,
            },
            index: geometry.index ? geometry.index.array : undefined,
          },
          material: {
            type: material.type,
            color: material.color ? material.color.getHex() : undefined,
            map: material.map ? material.map.name : undefined,
            // Add other material properties you need
          },
        });
      }
    });

    const animations = (gltf as any).animations;

    return NextResponse.json({ meshes, animations });
  } catch (error: any) {
    console.error('Error processing model:', error);
    return new NextResponse(`Error processing model: ${error.message}`, { status: 500 });
  }
}
