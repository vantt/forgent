// Author regeneration of witness membership only. No native sync or review pack.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {extractMarkdownConservationUnits} from '../../../../scripts/generate-doc-inventory.mjs';
import {removedCarrierWitnesses} from '../../../../scripts/doc-binding-repair.mjs';
const output=process.argv[process.argv.indexOf('--output')+1];
if(!process.argv.includes('--output')||!path.isAbsolute(output)||!path.resolve(output).startsWith('/tmp/fgos-work/'))throw Error('Explicit external --output required');
let parent=path.dirname(path.resolve(output));while(!fs.existsSync(parent))parent=path.dirname(parent);
const stat=fs.lstatSync(output,{throwIfNoEntry:false});
if(!fs.realpathSync(parent).startsWith('/tmp/fgos-work')||stat&&(stat.isSymbolicLink()||stat.nlink!==1))throw Error('Unsafe output');
const P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/',cache=new Map(),apply=process.argv.includes('--apply');
const units=(file,commit=null)=>{
 const key=JSON.stringify([file,commit]);if(cache.has(key))return cache.get(key);
 const text=commit?execFileSync('git',['show',commit+':'+file],{encoding:'utf8',maxBuffer:50e6}):fs.readFileSync(file,'utf8'),ls=text.split('\n');
 const raw=extractMarkdownConservationUnits(text),us=raw.map((u,i)=>({...u,path:file,commit,text:ls.slice(u.startLine-1,u.endLine).join('\n').trim(),sectionText:ls.slice(u.startLine-1,raw.slice(i+1).find(v=>v.unitKind==='heading')?.startLine-1||ls.length).join('\n').trim()}));
 us.push({path:file,anchor:'file-block',commit,text});cache.set(key,us);return us;
};
const changes=[],checked=[],unresolved=[];
for(const file of [...['pilot/decisions','ledger/decisions'].flatMap(d=>fs.readdirSync(P+d).filter(n=>n.endsWith('.json')).map(n=>P+d+'/'+n)),P+'ledger/retired-unit-decisions.json']){
 const j=JSON.parse(fs.readFileSync(file,'utf8'));let dirty=false;
 for(const [collection,rs] of Object.entries(j))if(Array.isArray(rs))for(const row of rs){
  if(!row?.rationale)continue;
  const sentence=/Removed direct-section lines have distinct live carrier witnesses (.+?)\. (?=Added| Exact|Exact|$)/.exec(row.rationale);
  if(!sentence)continue;
  try{
   const cite=/^Source: (.+?):(\d+)-(\d+)#([^\s]+) \((?:current lines|historical witness at ([0-9a-f]+))\); unit SHA256 ([0-9a-f]+)\./m.exec(row.rationale);
   if(!cite)throw Error('Structured source citation required');
   const source=units(cite[1],cite[5]||null).find(u=>u.anchor===cite[4]&&u.textDigest===cite[6]);if(!source)throw Error('Source citation mismatch');
   const target=units(row.targetOwner).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest));if(!target)throw Error('Target binding mismatch');
   const corrections=[...row.rationale.matchAll(/^[^\n]+: ("(?:[^"\\]|\\.)*") → ("(?:[^"\\]|\\.)*")(?:;|\.)/gm)].map(m=>({before:JSON.parse(m[1]),after:JSON.parse(m[2])}));
   const candidates=[...sentence[1].matchAll(/(docs\/platform\/[^\s,#]+\.md)#([^\s,.]+)/g)].map(m=>units(m[1]).find(u=>u.anchor===m[2]));if(candidates.some(u=>!u))throw Error('Listed carrier absent');
   const selected=removedCarrierWitnesses(source,target,corrections,candidates),names=selected.map(w=>w.path+'#'+w.anchor),beforeNames=candidates.map(w=>w.path+'#'+w.anchor);
   checked.push({file,collection,claimId:row.claimId,beforeWitnesses:beforeNames,afterWitnesses:names});
   if(JSON.stringify(names)===JSON.stringify(beforeNames))continue;
   if(!names.length)throw Error('No substantive live carrier remains');
   const before=structuredClone(row);
   row.rationale=row.rationale.replace(sentence[1],names.join(', '));
   row.reviewStatus='pending';row.authoredBy='codex-session:unit-run-1792130182385-eef9a749@2026-10-16';
   for(const k of ['reviewedBy','reviewedAt','reviewReport','reviewReportCommit','reviewMode','reviewPackCommit','reviewPackId','seedScoreId','reviewNote'])delete row[k];
   changes.push({file,collection,claimId:row.claimId,before,after:structuredClone(row),removedWitnesses:beforeNames.filter(n=>!names.includes(n))});dirty=true;
  }catch(e){unresolved.push({file,collection,claimId:row.claimId,error:e.message});}
 }
 if(apply&&dirty)fs.writeFileSync(file,JSON.stringify(j,null,2)+'\n');
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({method:'L10-36: regenerate only carrier-list membership from authenticated raw source removals; retain all other rationale text verbatim; changed rows pending.',apply,checked,changes,unresolved,ok:!unresolved.length},null,2)+'\n');
console.log(JSON.stringify({checked:checked.length,changed:changes.length,reopened:changes.filter(c=>c.before.reviewStatus==='reviewed').length,unresolved}));process.exitCode=unresolved.length?1:0;
