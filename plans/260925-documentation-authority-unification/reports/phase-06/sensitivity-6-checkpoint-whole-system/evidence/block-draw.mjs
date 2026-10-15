import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=process.cwd();const g=await import(path.join(root,'scripts/check-doc-inventory-gates.mjs'));
const seed=process.argv[2];const pin=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const u=g.buildConservationUnitLookup(root,pin);
const R='plans/260925-documentation-authority-unification/reports/phase-06/';
const pop=JSON.parse(fs.readFileSync(R+'checkpoint-6-reviewed-source-population.json','utf8'));
const all=[...pop.reviewedBindings,...pop.pendingExcluded];
const cu=JSON.parse(fs.readFileSync(R+'candidate-unverified-whole-system-architecture.json','utf8'));
const cuRows=(cu.units||cu.rows||cu.entries||cu.candidateUnverified||[]);
const cuKeys=new Set(cuRows.map(r=>`${r.path}#${r.anchor}`));
const owners=[...new Set(all.map(b=>b.targetOwner))].sort();
const named=new Map(all.map(b=>[`${b.targetOwner}#${b.targetAnchor}`,b]));
const norm=t=>t.split('\n').map(l=>l.replace(/\]\([^)]*\)/g,']()').replace(/^#{1,6}\s+/,'# ').trim()).filter(Boolean);
const srcLines=new Set([...new Set(all.map(b=>b.sourcePath))].flatMap(p=>norm(execFileSync('git',['show',`${pin}:${p}`],{encoding:'utf8',maxBuffer:1<<28}))));
const units=[];
for(const o of owners)for(const x of u(o)){if(x.unitKind==='heading'||x.text.trim().length<40)continue;const k=`${o}#${x.anchor}`;const b=named.get(k);
 let rewritten=false;if(b){const s=u(b.sourcePath).find(y=>y.anchor===b.sourceAnchor);rewritten=s.text!==x.text}
 const lines=norm(x.text);const unsourced=lines.filter(l=>!srcLines.has(l));
 units.push({key:k,named:!!b,claimId:b?.claimId,rewritten,candidateUnverified:cuKeys.has(k),text:x.text,unsourcedLines:unsourced})}
const rank=x=>crypto.createHash('sha256').update(seed+':'+x.key).digest('hex');const sorted=[...units].sort((a,b)=>rank(a).localeCompare(rank(b)));
const used=new Set();const take=(arr,n)=>arr.filter(x=>!used.has(x.key)).slice(0,n).map(x=>(used.add(x.key),x));
const strata={unnamed:sorted.filter(x=>!x.named),rewritten:sorted.filter(x=>x.named&&x.rewritten)};
const draw={unnamed:take(strata.unnamed,20),rewritten:take(strata.rewritten,20),random:take(sorted,10)};
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname),'block-draw.json'),JSON.stringify({pin,seed,cuCount:cuRows.length,owners,population:{units:units.length,unnamed:strata.unnamed.length,rewritten:strata.rewritten.length},draw},null,1));
console.log({cuCount:cuRows.length,owners:owners.length,units:units.length,unnamed:strata.unnamed.length,rewritten:strata.rewritten.length,drawn:Object.fromEntries(Object.entries(draw).map(([k,v])=>[k,v.length]))});
for(const [k,v] of Object.entries(draw))for(const x of v){console.log(`\n### [${k}] ${x.key} named=${x.named} cu=${x.candidateUnverified} unsourced=${x.unsourcedLines.length}`);if(x.unsourcedLines.length)console.log(x.unsourcedLines.map(l=>'  ? '+l.slice(0,300)).join('\n'));else console.log('  '+x.text.slice(0,160).replace(/\n/g,' / '))}
