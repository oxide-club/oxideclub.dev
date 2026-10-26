import { resolve, isAbsolute, join } from 'node:path';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';

export const roadmapIdentifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const reservedRoadmapDirectories = new Set(['templates','docs','scripts','tests','licenses','node_modules']);
export function roadmapsDirectory() {
  const source=process.env.ROADMAPS_SOURCE;
  if(source!==undefined && ((process.env.CI && process.env.CI!=='false') || process.env.SITE_RELEASE==='production')) throw new Error('ROADMAPS_SOURCE is forbidden in CI and production');
  if(source!==undefined && !isAbsolute(source)) throw new Error('ROADMAPS_SOURCE must be an absolute path');
  return resolve(source ?? '.content/roadmaps');
}
export function roadmapId({entry,data}) {
  const [id,file,extra]=entry.split('/');
  if(!roadmapIdentifier.test(id) || reservedRoadmapDirectories.has(id) || file!=='index.md' || extra || data.slug!==undefined) throw new Error(`Invalid roadmap identifier: ${entry}`);
  return id;
}
let cachedSchema, cachedValidator;
export function normalizeRoadmapDates(value) {
  if(!value||typeof value!=='object')return value;
  const data={...value};
  for(const field of ['publishedAt','updatedAt'])if(data[field] instanceof Date){
    const iso=data[field].toISOString();
    if(!iso.endsWith('T00:00:00.000Z'))throw new Error(`Invalid roadmap calendar date: ${field}`);
    data[field]=iso.slice(0,10);
  }
  return data;
}
export function validateRoadmapMetadata(data, directory=roadmapsDirectory()) {
  data=normalizeRoadmapDates(data);
  const source=readFileSync(join(directory,'roadmap.schema.json'),'utf8');
  if(source!==cachedSchema){cachedValidator=new Ajv({allErrors:true}).compile(JSON.parse(source));cachedSchema=source;}
  if(!cachedValidator(data)) throw new Error(`Invalid roadmap metadata: ${JSON.stringify(cachedValidator.errors)}`);
  for(const field of ['publishedAt','updatedAt']) if(data[field] && (Number.isNaN(Date.parse(data[field])) || new Date(data[field]).toISOString().slice(0,10)!==data[field])) throw new Error(`Invalid roadmap date: ${field}`);
  return true;
}
