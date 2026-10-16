// Extra D run against the committed reports/identity-registry.json prior (the phase-file prior name), which the
// producer's verify-global does not use (it uses step10-global-prior-checkpoint-registry.json + phase-02).
// usage (worktree root, read only): node --max-old-space-size=4096 d-reports-registry.mjs --output-dir <OUT>
import fs from 'node:fs';import v8 from 'node:v8';
const S=process.argv[process.argv.indexOf('--output-dir')+1]+'/';if(!S.startsWith('/tmp/fgos-work/'))throw Error('--output-dir');
const root=process.cwd(),P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/',read=p=>JSON.parse(fs.readFileSync(p)),pin='38672e7f157788cbe1b2bf59511bd61046dce660';
const g=await import(root+'/scripts/check-doc-inventory-gates.mjs');
let b=Buffer.allocUnsafe(fs.statSync(S+'step10-native-inventory.bin').size);const fd=fs.openSync(S+'step10-native-inventory.bin','r');for(let o=0;o<b.length;)o+=fs.readSync(fd,b,o,Math.min(16<<20,b.length-o),o);fs.closeSync(fd);const inv=v8.deserialize(b);b=null;
const bytes=fs.readFileSync(R+'working-identity-registry.json'),scope=read(R+'step10-global-source-scope.json').paths;
const common={repoRoot:root,inventory:inv,vocabulary:read(P+'claim-and-disposition-vocabulary.json'),identityRegistry:JSON.parse(bytes),droppedClaimsRegister:read(P+'dropped-claims-register.json'),ratchetResult:g.loadRatchetResult(root),headCommit:pin,registryBytes:bytes,missingInputs:[],decisions:[...g.loadDecisionShards(P+'pilot/decisions'),...g.loadDecisionShards(P+'ledger/decisions')],scope};
const out={};for(const [label,files] of [['reports-identity-registry',[P+'reports/identity-registry.json']],['reports-identity-plus-phase02',[P+'reports/identity-registry.json',P+'reports/phase-02-identity-registry.json']]]){const t=Date.now();const r=g.checkInventory({...common,previousRegistries:files.map(f=>({registry:read(f),label:f})),strict:false});out[label]={seconds:(Date.now()-t)/1000,fatal:r.fatalFindings.length,fatalTypes:[...new Set(r.fatalFindings.map(f=>f.type))],open:r.conservationOpen.map(o=>[o.type,o.count])};console.log(label,JSON.stringify(out[label]));}
fs.writeFileSync(S+'d-reports-registry.json',JSON.stringify(out,null,1)+'\n');
