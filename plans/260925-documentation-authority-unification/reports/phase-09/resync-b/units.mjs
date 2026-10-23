import fs from 'node:fs';
import crypto from 'node:crypto';
import {extractMarkdownConservationUnits as extract} from '../../../../../scripts/generate-doc-inventory.mjs';
export const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const read=p=>fs.readFileSync(p,'utf8');
export const json=p=>JSON.parse(read(p));
export const normalize=s=>s.replace(/^#{1,6} /gm,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\s+/g,' ').trim();
export function units(file,text=read(file)){
 const lines=text.split('\n'),stack=[];
 return extract(text).map(u=>{
  if(u.unitKind==='heading'){while(stack.length&&stack.at(-1).level>=u.level)stack.pop();stack.push(u);}
  return {...u,path:file,ancestry:stack.map(h=>h.title),content:lines.slice(u.startLine-1,u.endLine).join('\n').trim()};
 });
}
export function binding(u){
 const fields={targetAncestry:u.ancestry,targetAnchor:u.anchor,targetOwner:u.path,targetUnitDigest:u.textDigest};
 return {...fields,bindingSha256:sha(JSON.stringify(fields)+'\n')};
}
export const recipe='SHA256 of UTF-8 sorted-key compact JSON + exactly one LF; keys targetAncestry,targetAnchor,targetOwner,targetUnitDigest; ancestry includes the heading itself; no other keys';
export function walk(value,fn,pointer=''){
 if(!value||typeof value!=='object')return;
 fn(value,pointer);
 for(const [k,v] of Object.entries(value))if(!['placement','sourceOccurrence','before','after','supersedesBinding'].includes(k))walk(v,fn,pointer+'/'+k.replaceAll('~','~0').replaceAll('/','~1'));
}
