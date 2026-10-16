import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {extractMarkdownConservationUnits} from '../../../../scripts/generate-doc-inventory.mjs';
import {auditRationaleFacts} from '../../../../scripts/doc-rationale-facts.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const outputArg=process.argv.indexOf('--output');
if(outputArg<0||!process.argv[outputArg+1])throw Error('Explicit --output external scratch JSON path required');
const requested=process.argv[outputArg+1],output=path.resolve(requested);
if(!path.isAbsolute(requested)||!output.startsWith('/tmp/fgos-work/')||output.startsWith(root+'/'))throw Error('Output must be under /tmp/fgos-work, outside repository');
let ancestor=path.dirname(output);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
const resolved=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,output)),stat=fs.lstatSync(output,{throwIfNoEntry:false});
if(!resolved.startsWith('/tmp/fgos-work/')||resolved.startsWith(root+'/')||stat&&(stat.isSymbolicLink()||stat.nlink!==1))throw Error('Unsafe external scratch output');
fs.mkdirSync(path.dirname(output),{recursive:true});
const P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=t=>crypto.createHash('sha256').update(t).digest('hex');
const cache=new Map(),accountCache=new Map();
const git=(pin,p)=>{try{return execFileSync('git',['show',pin+':'+p],{cwd:root,encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{return null;}};
function units(p,pin=null){
 const key=JSON.stringify([p,pin]);if(cache.has(key))return cache.get(key);
 let text;try{text=pin?git(pin,p):fs.readFileSync(path.join(root,p),'utf8');}catch{text=null;}
 if(text==null){cache.set(key,[]);return [];}
 const lines=text.split('\n'),raw=p.endsWith('.md')?extractMarkdownConservationUnits(text):[{anchor:'file-block',startLine:1,endLine:lines.length,textDigest:sha(text)}];
 const result=raw.map((u,i)=>{const next=raw.slice(i+1).find(x=>x.unitKind==='heading');return {...u,path:p,commit:pin,text:lines.slice(u.startLine-1,u.endLine).join('\n').trim(),sectionText:lines.slice(u.startLine-1,next?next.startLine-1:lines.length).join('\n').trim()};});
 cache.set(key,result);return result;
}
const reg=read(R+'working-identity-registry.json'),native=new Map(['units','retiredUnits','identityGaps'].flatMap(k=>reg[k].map(r=>[r.claimId,r])));
const registryText=fs.readFileSync(path.join(root,R+'owner-answers.md'),'utf8'),registeredLabels=[...new Set(registryText.match(/\b(?:A\d+|L\d+-\d+[a-z]?)\b/g)||[])];
const accountOf=(pin,file)=>{const key=pin+':'+file;if(!accountCache.has(key))accountCache.set(key,git(pin,file));const json=accountCache.get(key);try{const j=JSON.parse(json);return Object.values(j).filter(Array.isArray).flat().filter(r=>r?.claimId===activeClaim).map(r=>r.rationale||'').join('\n');}catch{return null;}};
let activeClaim;
const files=[...['pilot/decisions','ledger/decisions'].flatMap(d=>fs.readdirSync(path.join(root,P+d)).filter(n=>n.endsWith('.json')).map(n=>P+d+'/'+n)),P+'ledger/retired-unit-decisions.json'];
const findings=[],limits=[],rows=[];let structured=0,sections=0,links=0;
for(const file of files){const j=read(file);for(const [collection,values] of Object.entries(j))if(Array.isArray(values))for(const row of values){if(!row?.claimId||!row.sourceUnitDigest||!row.rationale)continue;
 activeClaim=row.claimId;const n=native.get(row.claimId),p=row.sourcePath||n?.sourcePath;
 const cite=/^Source: (.+?):(\d+)-(\d+)#([^\s]+) \((current lines|historical witness at ([0-9a-f]+))\); unit SHA256 ([0-9a-f]+)\./m.exec(row.rationale);
 const targetCite=/^Target: (.+?):(\d+)-(\d+)#([^\s]+) \((current lines|historical witness at ([0-9a-f]+)[^)]*)\); unit SHA256 ([0-9a-f]+)\./m.exec(row.rationale);
 const pins=[null,...new Set([row.sourceCommit,n?.sourceCommit,n?.lineage?.fromCommit,cite?.[6],reg.commit,reg.carriedFromCommit,'9b0526380','ab4d6274a','19ca8de23','2300d6557','120af6b3d',...((row.rationale+' '+(row.reviewNote||'')).match(/\b[0-9a-f]{8,40}\b/g)||[])].filter(Boolean))];
 let source;
 for(const pin of pins){if(!p)break;const matches=units(p,pin).filter(u=>u.textDigest.startsWith(row.sourceUnitDigest));source=matches.find(u=>u.anchor===(row.sourceAnchor||n?.sourceAnchor))||(matches.length===1?matches[0]:null);if(source)break;}
 // Explicit occurrence citations must still authenticate against the row digest.
 if(cite&&p===cite[1]){const actual=units(p,cite[6]||null).find(u=>u.anchor===cite[4]&&u.textDigest.startsWith(row.sourceUnitDigest));if(actual)source=actual;else findings.push({file,collection,claimId:row.claimId,type:'source-citation-not-bound'});}
 let target;if(row.successorGroup){for(const m of row.successorGroup.members){const c=m.candidateSuccessor;const u=units(c.targetOwner).find(u=>u.anchor===c.targetAnchor&&u.textDigest.startsWith(c.targetUnitDigest));if(!u)findings.push({file,collection,claimId:row.claimId,type:'group-member-binding-not-found',member:m.claimId});}}else if(row.targetOwner){const matches=units(row.targetOwner);target=matches.find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest||''));
 if(!target)for(const pin of [...new Set([targetCite?.[6],row.reviewReportCommit,'9b0526380','ce575996f','ed782e245','120af6b3d',...pins].filter(Boolean))]){target=units(row.targetOwner,pin).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest||''));if(target)break;}
 if(!target&&file.endsWith('/retired-unit-decisions.json')){const history=execFileSync('git',['log','--format=%H','--',row.targetOwner],{cwd:root,encoding:'utf8'}).trim().split('\n');for(const pin of history){target=units(row.targetOwner,pin).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest||''));if(target)break;}}
 if(!target)findings.push({file,collection,claimId:row.claimId,type:'target-binding-not-found'});
 }
 for(const [label,c,u] of [['source',cite,source],['target',targetCite,target]])if(c&&u&&(c[1]!==u.path||+c[2]!==u.startLine||+c[3]!==u.endLine||c[4]!==u.anchor||c[7]!==u.textDigest))findings.push({file,collection,claimId:row.claimId,type:label+'-citation-facts'});
 if(!source)limits.push({file,collection,claimId:row.claimId,path:p,sourceUnitDigest:row.sourceUnitDigest});
 if(cite)structured++;
 if(row.rationale.includes('Whole direct section '))sections++;
 if(row.rationale.includes('Links: source '))links++;
 const carrierOf=(p,a)=>a==='file-block'?(()=>{const text=fs.readFileSync(path.join(root,p),'utf8');return {path:p,anchor:a,text,textDigest:sha(text)};})():units(p).find(u=>u.anchor===a);
 const result=auditRationaleFacts(row.rationale,{source,target,registeredLabels,accountOf,carrierOf});
 findings.push(...result.map(f=>({file,collection,claimId:row.claimId,...f})));
 rows.push({file,collection,claimId:row.claimId,sourceResolved:!!source,targetResolved:!!target,structured:!!cite});
}}
const report={method:'Independent file-derived audit; frozen extractor only. No renderer, classifier, saved generated facts or regeneration equality used. Label accounts resolved by claim id at their immutable git commit.',rowsScanned:rows.length,shardsScanned:new Set(rows.map(r=>r.file)).size,structuredRows:structured,sectionClaims:sections,linkClaims:links,sourceWitnessLimits:limits,findings,ok:!findings.length};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,sourceWitnessLimits:limits.length,findings:findings.length}));process.exitCode=report.ok?0:1;
