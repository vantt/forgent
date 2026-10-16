// Read-only package accounting. Pass the actual previous request commit, never
// a hand-selected claim list. Outputs every registry change, including metadata.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {registryChangeAccounting} from '../../../../scripts/doc-binding-repair.mjs';
const value=flag=>process.argv[process.argv.indexOf(flag)+1];
const previous=value('--previous-request'),output=value('--output');
if(!process.argv.includes('--previous-request')||!previous||!process.argv.includes('--output')||!path.isAbsolute(output)||!path.resolve(output).startsWith('/tmp/fgos-work/'))throw Error('Explicit --previous-request and external --output required');
let parent=path.dirname(path.resolve(output));while(!fs.existsSync(parent))parent=path.dirname(parent);
const stat=fs.lstatSync(output,{throwIfNoEntry:false});
if(!fs.realpathSync(parent).startsWith('/tmp/fgos-work')||stat&&(stat.isSymbolicLink()||stat.nlink!==1))throw Error('Unsafe output');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:100e6}),registry='plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json';
const before=JSON.parse(git('show',previous+':'+registry)),after=JSON.parse(fs.readFileSync(registry,'utf8'));
const changes=registryChangeAccounting(before,after);
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({previousRequestCommit:git('rev-parse',previous).trim(),currentCommit:git('rev-parse','HEAD').trim(),registry,method:'All top-level keys and all identity/document collections, including removals and marker-only changes. No selected-ID filter.',changes,counts:Object.fromEntries([...new Set(changes.map(r=>r.collection))].map(k=>[k,changes.filter(r=>r.collection===k).length]))},null,2)+'\n');
console.log(JSON.stringify({changes:changes.length,output}));
