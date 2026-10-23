// Reuse the owning scanner unchanged apart from scratch import/root/output plumbing.
// No fgOS CLI, native staging, repository Git writes or baseline writes.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
const R='plans/260925-documentation-authority-unification/reports/phase-09/resync-b';
const scanner='plans/260925-documentation-authority-unification/reports/phase-09/late-areas/scan-legacy-drift.mjs';
const original=fs.readFileSync(path.join(root,scanner),'utf8');
const replacements=[
 ["from '../../../../../scripts/generate-doc-inventory.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'scripts/generate-doc-inventory.mjs')).href)}`],
 ["const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');",`const root=${JSON.stringify(root)};`],
 ["const R=P+'/reports/phase-09/late-areas';","const R=P+'/reports/phase-09/resync-b';"]
];
let transformed=original;
for(const [a,b] of replacements){if(transformed.split(a).length!==2)throw Error('unexpected scanner plumbing');transformed=transformed.replace(a,b);}
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'w2-d7-drift-'));
try{
 fs.writeFileSync(path.join(scratch,'scan.mjs'),transformed);
 const out=execFileSync(process.execPath,[path.join(scratch,'scan.mjs'),...process.argv.slice(2)],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
 console.log(out.trim());
 if(!process.argv.includes('--check'))fs.writeFileSync(path.join(root,R,'scan-provenance.json'),JSON.stringify({scanner,scannerSha256:crypto.createHash('sha256').update(original).digest('hex'),replacements,qualification:'Import/root/output plumbing only; scanner matching and counts unchanged.'},null,2)+'\n');
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
