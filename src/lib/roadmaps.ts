import { getCollection } from 'astro:content';
import { resolveRoadmap } from './roadmap-structure.mjs';
export async function publishedRoadmaps() {
  const [roadmaps,challenges,labs,notes]=await Promise.all([getCollection('roadmaps'),getCollection('challenges'),getCollection('labs'),getCollection('notes')]);
  return roadmaps.filter(e=>!e.data.draft).map(entry=>{
    try{return {...entry,data:resolveRoadmap(entry.data,{roadmaps,challenges,labs,notes})}}
    catch(error){throw new Error(`${entry.id}: ${(error as Error).message}`)}
  }).sort((a,b)=>a.data.order-b.data.order||a.id.localeCompare(b.id));
}
