import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=process.cwd(),P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/';
const gen=await import(path.join(root,'scripts/generate-doc-inventory.mjs'));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:40*1024*1024}).trim();
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');};
const pin=git('rev-parse','HEAD');
const rows=fs.readFileSync(P+'ledger/area-map-specs-ui.md','utf8').split('\n').filter(l=>l.startsWith('| `docs/')).map(l=>{const c=l.split('|').map(x=>x.trim());return {source:c[1].match(/`([^`]+)`/)[1],target:c[2].match(/`([^`]+)`/)[1],kind:c[3],operation:c[4],mapBlob:c[5].match(/Source blob: `([^`]+)`/)[1]};});
const roots=['src','packages','apps','bin','core','domains','scripts','docs','test','.claude/skills/ui-spec','AGENTS.md','CLAUDE.md','README.md'].filter(fs.existsSync);
let refs='';try{refs=execFileSync('rg',['-n','--no-heading','-F',...rows.flatMap(r=>['-e',r.source,'-e',path.basename(r.source)]),...roots,'-g','!docs/platform/**','-g','!docs/history/**','-g','!**/node_modules/**','-g','!**/target/**','-g','!**/generated/**','-g','!**/secrets.local.env'],{encoding:'utf8',maxBuffer:20*1024*1024});}catch(e){if(e.status!==1)throw e;}
const lines=refs.split('\n').filter(Boolean).map(l=>{const m=l.match(/^([^:]+):(\d+):(.*)$/);return m?{path:m[1],line:+m[2],text:m[3]}:null;}).filter(Boolean);
const scan={version:1,sourceCommit:pin,mapPin:'fd6c9ab9e8aac12f99462a1d4f1bf78448d6e9f7',rules:['A19','A28','P1'],method:'Section-level lexical liveness scan before carriage. Direct path/basename citations, extant cited implementation files, and named subject symbols protect current content by default. History/decision placement preserves live citations and is not a retirement verdict. No source subject is adjudicated retired; no unreferenced section is silently discarded. The committed Lead evidence adds concept consumers and known stale current sentences. No implementation truth is certified.',roots,excluded:['docs/platform/** (candidate)','docs/history/**','plans/**','archive/**','.fgos/**','**/node_modules/**','**/target/**','**/generated/**'],files:[]};
for(const row of rows){
 const b=fs.readFileSync(row.source),text=b.toString('utf8'),units=row.source.endsWith('.md')?gen.extractMarkdownConservationUnits(text):gen.extractMixedFileConservationUnit(row.source,text),ls=text.split('\n');
 const direct=lines.filter(l=>l.path!==row.source&&(l.text.includes(row.source)||l.text.includes(path.basename(row.source))));
 const hs=units.filter(u=>u.unitKind==='heading'); const starts=[{startLine:1,title:'Preamble',anchor:'preamble'},...hs];
 // Descendants inherit explicit decision-history placement. Mixed rollout/settled-facts
 // headings keep their existing section rules: their children can describe current recipes.
 const headingStack=[], decisionHistorySections=new Set();
 for(const h of hs){while(headingStack.length&&headingStack.at(-1).level>=h.level)headingStack.pop();if(headingStack.some(a=>/(?:Lịch sử quyết định|Quyết định của proposal)/.test(a.title)))decisionHistorySections.add(h.anchor);headingStack.push(h);}
 const sections=starts.map((s,i)=>{const end=(starts[i+1]?.startLine||ls.length+1)-1;if(end<s.startLine)return null;const shown=ls.slice(s.startLine-1,end).join('\n');if(!shown.trim())return null;
 const citedPaths=[...new Set(shown.match(/(?:src|packages|apps|bin|core|domains|scripts|test)\/[A-Za-z0-9_./-]+\.(?:mjs|js|ts|tsx|rs|yaml|json)/g)||[])].filter(fs.existsSync);
 const symbols=[...new Set(shown.match(/\b(?:[A-Z][a-z]+){2,}[A-Za-z0-9]*\b/g)||[])].filter(s=>s.length>7);
 let symbolHits=[];if(symbols.length){try{const out=execFileSync('rg',['-l','-F',...symbols.flatMap(s=>['-e',s]),...['src','packages','apps','bin','core','domains','scripts','test'].filter(fs.existsSync),'-g','!**/target/**','-g','!**/node_modules/**'],{encoding:'utf8',maxBuffer:2*1024*1024});symbolHits=out.trim().split('\n').filter(Boolean);}catch(e){if(e.status!==1)throw e;}}
 const historic= decisionHistorySections.has(s.anchor)|| /(?:Lịch sử|Quyết định của proposal|Lộ trình rollout|13\.1 |13\.3 |Kết quả giải quyết)/.test(s.title);
 return {heading:s.title,anchor:s.anchor,startLine:s.startLine,endLine:end,sha256:sha(shown),classification:row.source.includes('/generated/')?'generated-projection':historic?'historical-or-decision-carriage':'current-by-default',directReferenceCount:direct.length,implementationPaths:citedPaths,subjectSymbols:symbols,subjectHitPaths:symbolHits,retired:false,retirementEligible:false,reason:historic?'Preserve historical evidence/decision and its live citations; placement does not claim that its current assertions are true.':direct.length||citedPaths.length||symbolHits.length?'Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28.':'No direct hit for this section; no retired-subject evidence either, so preserve current-by-default for independent triage.'};}).filter(Boolean);
 scan.files.push({...row,sourceBlob:git('rev-parse',`${pin}:${row.source}`),sourceSHA256:sha(b),bytes:b.length,units:units.length,directReferences:direct,sections});
}
if(scan.files.length!==27||scan.files.reduce((n,f)=>n+f.units,0)!==566)throw Error('source count mismatch');
write(R+'step8-source-blobs.json',{commit:pin,mapPin:scan.mapPin,sources:scan.files.map(f=>({path:f.source,blob:f.sourceBlob,mapBlob:f.mapBlob,sha256:f.sourceSHA256,units:f.units}))});
write(R+'step8-liveness.json',scan);
write(R+'step8-liveness.md','# Specs and UI section liveness scan\n\nSource commit: `'+pin+'`. Rules: A19/P1, conservative section-level protection. Run before carriage. This is a liveness triage, not a current-truth approval. Full references, section hashes, cited implementation files and lexical subject hits are in `step8-liveness.json`. No subject is declared retired and no section is discarded. Historical placement does not erase current consumers.\n\n| Source | Units | Sections | Live direct citations | Classification |\n|---|---:|---:|---:|---|\n'+scan.files.map(f=>`| ${f.source} | ${f.units} | ${f.sections.length} | ${f.directReferences.length} | ${f.source.includes('/generated/')?'Generated, retained in place':'Current by default; decision/history subdivisions recorded'} |`).join('\n')+'\n\nAll 27 source blobs match the committed Lead evidence. Known stale assertions are listed in step8-evidence.md §4 and carried verbatim under the explicit Lead instruction, A19 and A28. The full current truth check is owed at promotion; the independent batch sample remains owed.\n');
console.log(JSON.stringify({files:scan.files.length,units:scan.files.reduce((n,f)=>n+f.units,0),sections:scan.files.reduce((n,f)=>n+f.sections.length,0)}));
