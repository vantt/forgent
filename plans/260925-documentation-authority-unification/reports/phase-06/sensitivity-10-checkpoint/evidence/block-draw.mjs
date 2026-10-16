// Stratified candidate-block draw (20 unnamed / 20 rewritten / 10 random) over every non-heading unit of at
// least 40 characters in every candidate owner named by a checkpoint-10 population binding.
// Run from the worktree root (read only): node block-draw.mjs <seed> --output-dir <OUT>
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const seed=process.argv[2];const OUT=process.argv[process.argv.indexOf('--output-dir')+1];
if(!seed||!OUT?.startsWith('/tmp/fgos-work/'))throw new Error('usage');
const root=process.cwd();const g=await import(root+'/scripts/check-doc-inventory-gates.mjs');
const R='plans/260925-documentation-authority-unification/reports/phase-06/';
const pop=JSON.parse(fs.readFileSync(R+'checkpoint-10-source-population.json','utf8'));const pin=pop.pin;const u=g.buildConservationUnitLookup(root,pin);
const all=[...pop.reviewed,...pop.pending];
const cuKeys=new Map();for(const f of fs.readdirSync(R).filter(f=>/^candidate-unverified-.*\.json$/.test(f)))for(const r of JSON.parse(fs.readFileSync(R+f,'utf8')).rows||[])cuKeys.set(`${r.path}#${r.anchor}`,f);
const owners=[...new Set(all.map(b=>b.targetOwner).filter(Boolean))].sort();
const named=new Map();for(const b of all)if(b.targetOwner){const k=`${b.targetOwner}#${b.targetAnchor}`;if(!named.has(k))named.set(k,b)}
const norm=t=>t.split('\n').map(l=>l.replace(/\]\([^)]*\)/g,']()').replace(/^#{1,6}\s+/,'# ').trim()).filter(Boolean);
const srcLines=new Set([...new Set(all.map(b=>b.sourcePath))].flatMap(p=>{try{return norm(execFileSync('git',['show',`${pin}:${p}`],{encoding:'utf8',maxBuffer:1<<28}))}catch{return []}}));
const units=[];
for(const o of owners)for(const x of u(o)||[]){if(x.unitKind==='heading'||x.text.trim().length<40)continue;const k=`${o}#${x.anchor}`;const b=named.get(k);
 let rewritten=false;if(b){const s=(u(b.sourcePath)||[]).find(y=>y.anchor===b.sourceAnchor);rewritten=!s||s.text!==x.text}
 const lines=norm(x.text);const unsourced=lines.filter(l=>!srcLines.has(l));
 units.push({key:k,named:!!b,claimId:b?.claimId,disposition:b?.disposition,rewritten,candidateUnverified:cuKeys.get(k)||null,ancestry:x.ancestry,text:x.text,unsourcedLines:unsourced})}
const rank=x=>crypto.createHash('sha256').update(seed+':'+x.key).digest('hex');const sorted=[...units].sort((a,b)=>rank(a).localeCompare(rank(b)));
const used=new Set();const take=(arr,n)=>arr.filter(x=>!used.has(x.key)).slice(0,n).map(x=>(used.add(x.key),x));
const strata={unnamed:sorted.filter(x=>!x.named),rewritten:sorted.filter(x=>x.named&&x.rewritten)};
const draw={unnamed:take(strata.unnamed,20),rewritten:take(strata.rewritten,20),random:take(sorted,10)};
fs.writeFileSync(OUT+'/block-draw.json',JSON.stringify({pin,seed,cuCount:cuKeys.size,owners:owners.length,population:{units:units.length,unnamed:strata.unnamed.length,rewritten:strata.rewritten.length},draw},null,1));
const lines=[JSON.stringify({cuCount:cuKeys.size,owners:owners.length,units:units.length,unnamed:strata.unnamed.length,rewritten:strata.rewritten.length,drawn:Object.fromEntries(Object.entries(draw).map(([k,v])=>[k,v.length]))})];
for(const [k,v] of Object.entries(draw))for(const x of v){lines.push(`\n### [${k}] ${x.key} named=${x.named} ${x.claimId||''} ${x.disposition||''} cu=${x.candidateUnverified} unsourced=${x.unsourcedLines.length} ancestry=${JSON.stringify(x.ancestry)}`);lines.push('  TEXT: '+x.text.slice(0,1500).replace(/\n/g,'\n        '));if(x.unsourcedLines.length)lines.push(x.unsourcedLines.map(l=>'  ? '+l.slice(0,400)).join('\n'))}
fs.writeFileSync(OUT+'/block-draw.txt',lines.join('\n')+'\n');console.log(lines[0]);
