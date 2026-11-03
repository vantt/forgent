#!/usr/bin/env node
// L10-6 report comparator, not a gate or an acceptance override. Inputs must be
// native strict-E output, its scoped applied rows, and explicit closure lists.
import fs from 'node:fs';
import {isMainModule} from './lib/is-main-module.mjs';

const TYPES=['claims-unknown-blocking','claims-not-reviewed','identical-units-multiple-owners','candidate-blocks-unreferenced','claims-partial-carry'];
const tuple=r=>r.sourcePath!==undefined
  ? [r.claimId,r.sourcePath,r.sourceAnchor,r.sourceUnitDigest]
  : [r.claimId,r.path,r.anchor,r.unitDigest];
const key=r=>JSON.stringify(tuple(r));
const groupKey=g=>JSON.stringify([g.digest,[...new Set(g.owners)].sort()]);

/** Exact set comparison. A successful comparison still permits pre-cutover opens. */
export function compareGlobalClosure({gate,actual,expected}={}) {
  const errors=[],counts={};
  const array=(v,label)=>{if(!Array.isArray(v)){errors.push('missing array: '+label);return [];}return v;};
  const claims=array(actual?.claims,'actual.claims'),gaps=array(actual?.identityGaps,'actual.identityGaps');
  const holds=array(expected?.holds,'expected.holds'),partials=array(expected?.partialCarries,'expected.partialCarries'),identical=array(expected?.identicalUnits,'expected.identicalUnits');
  const lists=array(expected?.candidateLists,'expected.candidateLists');
  const candidates=array(gate?.explicitOpenFindings?.unreferencedCandidateRows,'gate.explicitOpenFindings.unreferencedCandidateRows');
  const nativeOpen=array(gate?.conservationOpen,'gate.conservationOpen'),fatals=array(gate?.fatalFindings,'gate.fatalFindings');
  const validTuple=r=>tuple(r).every(v=>typeof v==='string'&&v.length>0);
  const candidateUnion=[];for(const list of lists)candidateUnion.push(...array(list,'candidate list'));
  for(const r of [...candidates,...candidateUnion,...partials])if(!validTuple(r))errors.push('incomplete identity tuple');
  const compare=(label,a,b)=>{const left=new Set(a),right=new Set(b);for(const k of left)if(!right.has(k))errors.push(label+' unexpected: '+k);for(const k of right)if(!left.has(k))errors.push(label+' missing: '+k);};
  const pending=claims.filter(r=>r.reviewStatus!=='reviewed'),unknown=claims.filter(r=>r.disposition==='unknown-blocking'),partial=[...claims,...gaps].filter(r=>r.disposition==='partial-carry');
  if(new Set(candidates.map(key)).size!==candidates.length)errors.push('duplicate native candidate tuple');
  compare('pending holds',pending.map(r=>r.claimId),holds);
  for(const r of unknown)if(!holds.includes(r.claimId))errors.push('unknown-blocking outside holds: '+r.claimId);
  compare('partial carries',partial.map(key),partials.map(key));
  compare('candidate union',candidates.map(key),candidateUnion.map(key));
  const owners=new Map();for(const r of claims)if(r.sourceUnitDigest&&r.targetOwner){const s=owners.get(r.sourceUnitDigest)||new Set();s.add(r.targetOwner);owners.set(r.sourceUnitDigest,s);}
  const groups=[...owners].filter(([,o])=>o.size>1).map(([digest,o])=>({digest,owners:[...o]}));
  for(const g of identical)if(!g?.digest||!Array.isArray(g.owners)||g.owners.length<2)errors.push('malformed identical-unit exception');
  compare('identical groups',groups.map(groupKey),identical.filter(g=>g?.digest&&Array.isArray(g.owners)).map(groupKey));
  Object.assign(counts,{'claims-unknown-blocking':unknown.length,'claims-not-reviewed':pending.length,'identical-units-multiple-owners':groups.length,'candidate-blocks-unreferenced':candidates.length,'claims-partial-carry':partial.length});
  const seen=new Set();for(const o of nativeOpen){if(!TYPES.includes(o.type))errors.push('unexpected open category: '+o.type);if(seen.has(o.type))errors.push('duplicate open category: '+o.type);seen.add(o.type);if(o.count!==counts[o.type])errors.push('native count mismatch: '+o.type);}
  for(const type of TYPES)if(counts[type]&&!seen.has(type))errors.push('missing native category: '+type);
  for(const f of fatals)if(!TYPES.includes(f.type)||!counts[f.type]||!seen.has(f.type))errors.push('unexpected fatal: '+f.type);
  return {ok:errors.length===0,strictGreen:errors.length===0&&fatals.length===0&&nativeOpen.length===0,counts,errors};
}

if(isMainModule(import.meta.url)) {
  try {
    const args=process.argv.slice(2),allowed=['--gate','--actual','--expected'];
    if(args.length!==6||args.filter((_,i)=>i%2===0).some(k=>!allowed.includes(k))||new Set(args.filter((_,i)=>i%2===0)).size!==3)throw new Error('Usage: node scripts/compare-doc-global-closure.mjs --gate strict.json --actual applied-rows.json --expected closure-lists.json');
    const read=k=>JSON.parse(fs.readFileSync(args[args.indexOf(k)+1],'utf8'));
    const result=compareGlobalClosure({gate:read('--gate'),actual:read('--actual'),expected:read('--expected')});console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
  }catch(error){console.error(error.message);process.exitCode=1;}
}
