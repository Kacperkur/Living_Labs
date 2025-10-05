import { Scene } from "@/components/Scene";
import dynamic from 'next/dynamic';

const DynamicScene = dynamic(() => import('@/components/Scene').then(mod => mod.Scene),);


export default function Home() {
  return (
   <main className='h-full'>
     <DynamicScene />
   </main>
  );
}