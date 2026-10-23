// One-shot publication of the reviewed proposal, never a rewriter of old shards.
import fs from 'node:fs';
import {json,read,sha} from './units.mjs';
const P='plans/260925-documentation-authority-unification',R=P+'/reports/phase-09/resync-b';
const out=P+'/ledger/decisions/s14-resync-b.json';
if(fs.existsSync(out))throw Error('new shard already exists; review deltas, do not overwrite');
const p=json('/tmp/fgos-work/w2-d7/bindings-proposal.json');
for(const d of p.changedDocuments)if(sha(read(d.path))!==d.afterSha256)throw Error('candidate changed after proposal: '+d.path);
const shard={version:1,shard:'s14-resync-b',sourcePin:p.sourcePin,authority:'W2 D7 and run-specific narrow scope; candidate conservation/disposition only, independent review pending; no gate acceptance, source retirement or authority cutover',bindingHashEncoding:p.bindingHashEncoding,claims:[],registryGaps:[],unitCarries:p.unitCarries,bindingRefresh:p.bindingRefresh,alreadySupersededHistoricalBindings:p.alreadyStaleHistoricalBindings,targetUnitWitnesses:p.targetUnits,changedDocuments:p.changedDocuments,rebindingSemantics:'Additive overlays supersede only the named predecessor locator+anchor+digest. Old shards and their reviews stay historical. A binding for a retired/not-carried clause is a disposition witness, not a literal or live carriage assertion.'};
fs.writeFileSync(out,JSON.stringify(shard,null,2)+'\n');
console.log(JSON.stringify({shard:out,sourceBindings:p.unitCarries.length,refresh:p.bindingRefresh.length,pendingIndependentReview:true}));
