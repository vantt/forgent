// Authoring proposal only: never applies guessed placements. Review mappings.json before binding.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha,normalize,units} from './units.mjs';
const P='plans/260925-documentation-authority-unification',R=P+'/reports/phase-09/resync-b';
const baseline=json(R+'/legacy-drift.json');
const excluded=new Set(['docs/specs/work-state.md','docs/specs/runner.md','docs/specs/distribution.md','docs/architect/packaging-distribution/runtime-identity-and-activation.md','docs/decisions/index.md']);
const words=s=>new Set(normalize(s).split(/\s+/));
const overlap=(a,b)=>{let n=0;for(const w of a)if(b.has(w))n++;return 2*n/(a.size+b.size);};
const cache=new Map();const get=p=>{if(!cache.has(p))cache.set(p,units(p));return cache.get(p);};
const rows=[];
for(const r of baseline.records.filter(r=>!excluded.has(r.sourcePath))){
 const direct=r.sourcePath.replace('docs/architect/agent-coordination/','docs/platform/agent-coordination/');
 const paths=[...new Set([...r.candidateSuccessors.map(t=>t.path),...(direct!==r.sourcePath&&fs.existsSync(direct)?[direct]:[])])];
 const candidates=paths.flatMap(get);
 const history=r.candidateSuccessors.filter(t=>t.path.includes('/history/retired-engine/')).map(t=>{
  const text=read(t.path),start=text.indexOf('\n~~~~text\n'),end=text.lastIndexOf('\n~~~~');
  if(start<0||end<=start)throw Error('missing literal snapshot '+t.path);
  return {path:t.path,text:text.slice(start+10,end),unit:get(t.path).find(u=>u.content.startsWith('~~~~text\n'))};
 });
 const sourceUnits=units(r.sourcePath);
 for(const missing of r.missingCarriage){
  const s=sourceUnits.find(u=>u.anchor===missing.sourceAnchor&&u.textDigest===missing.sourceUnitDigest);
  if(!s)throw Error('baseline drifted '+r.sourcePath);
  const ns=normalize(s.content),ws=words(s.content);
  const current=candidates.filter(u=>!u.path.includes('/history/retired-engine/'));
  const ranked=current.filter(u=>u.unitKind===s.unitKind).map(t=>({t,score:normalize(t.content)===ns?2:overlap(ws,words(t.content)),context:t.ancestry.filter(a=>s.ancestry.includes(a)).length})).sort((a,b)=>b.score-a.score||b.context-a.context);
  let chosen=ranked[0],kind,reason;
  if(chosen?.score===2){kind='equivalent-current-content';reason='Full source text is already present; only heading depth, link destinations or whitespace differ. Heading payload units are accounted separately.';}
  else{
   const contained=current.find(t=>s.unitKind!=='heading'&&normalize(t.content).includes(ns));
   const snap=history.find(h=>normalize(h.text).includes(ns));
   if(contained){chosen={t:contained,score:1};kind='source-content-in-candidate-envelope';reason='Complete source content is present inside the named candidate envelope, including fenced provenance metadata where applicable.';}
   else if(snap){chosen={t:snap.unit,score:1};kind='existing-literal-history';reason='Full normalized source passage already occurs in the unchanged literal snapshot. Binding names the whole fenced snapshot because the owning extractor does not enumerate headings inside a text fence; it is history, never live authority.';}
   else if(!current.length){
    const h=history[0];chosen={t:get(h.path).find(u=>u.content.startsWith('The coordination engine was retired')),score:0};kind='post-retirement-edit-not-carried';reason='Post-retirement edit, not carried: this source only routes to the retired engine. Current-source metadata, renamed historical recipes and engine-only state/schema changes do not update the literal snapshot or create a live contract. The linked retirement statement is a disposition witness, not a carriage claim.';
   }
   else if(s.content.startsWith('> Migration status:')||s.content.startsWith('Document type:')||s.unitKind==='unheaded-preamble'){
    chosen={t:current.find(u=>u.content.startsWith('```txt\nDocument type:'))||chosen.t,score:0};kind='candidate-metadata-adaptation';reason='Legacy status/authority metadata is replaced by the explicit candidate header and provenance. Migration banners are navigation, not permission to promote a candidate or to declare the retired engine current.';
   }
   else{kind='review-required';reason='Must adjudicate complete source/target delta; lexical similarity is not acceptance.';}
  }
  if(!chosen)throw Error('no target '+r.sourcePath+'#'+s.anchor);
  rows.push({sourcePath:r.sourcePath,sourceAnchor:s.anchor,sourceUnitDigest:s.textDigest,sourceAncestry:s.ancestry,sourceContent:s.content,unitKind:s.unitKind,targetOwner:chosen.t.path,targetAnchor:chosen.t.anchor,targetUnitDigest:chosen.t.textDigest,targetAncestry:chosen.t.ancestry,targetContent:chosen.t.content.length<12000?chosen.t.content:null,targetContentSha256:sha(chosen.t.content),score:chosen.score,disposition:{kind,reason},reviewStatus:'pending'});
 }
}
fs.mkdirSync('/tmp/fgos-work/w2-d7',{recursive:true});
fs.writeFileSync('/tmp/fgos-work/w2-d7/mapping-proposal.json',JSON.stringify({sourcePin:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineInput:{path:R+'/legacy-drift.json',sha256:sha(read(R+'/legacy-drift.json')),counts:baseline.counts},rows},null,2)+'\n');
console.log(JSON.stringify({total:rows.length,kinds:rows.reduce((m,r)=>(m[r.disposition.kind]=(m[r.disposition.kind]||0)+1,m),{}),reviewRequired:rows.filter(r=>r.disposition.kind==='review-required').map(r=>[r.sourcePath,r.sourceAnchor,r.targetOwner,r.targetAnchor,r.score])},null,2));
