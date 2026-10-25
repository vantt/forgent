// Owning checker controls: mutate live reads, never historical git blobs or checkout bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../../../..');
const scratchRoot='/tmp/fgos-work';
fs.mkdirSync(scratchRoot,{recursive:true});
const scratch=fs.mkdtempSync(path.join(scratchRoot,'carries-controls-'));
const checks=[];
try {
 const preload=path.join(scratch,'overlay.cjs');
 fs.writeFileSync(preload,`const fs=require('node:fs');
const original=fs.readFileSync;
const mutation=JSON.parse(process.env.CARRIES_CONTROL);
fs.readFileSync=function(file,...args){
 const raw=original.call(this,file,...args);
 if(typeof file!=='string'||!file.endsWith(mutation.suffix))return raw;
 const value=JSON.parse(raw.toString());
 if(mutation.kind==='drop-duty')value.pointerPatchDrift.pop();
 if(mutation.kind==='stale-duty')value.pointerPatchDrift.push({path:'AGENTS.md',reason:'Negative control: this path does not drift.'});
 if(mutation.kind==='missing-patch')value.pointerPatchDrift.push({path:'absent-negative-control.mjs',reason:'Negative control: no patch.'});
 if(mutation.kind==='blank-reason')value.pointerPatchDrift[0].reason=' ';
 if(mutation.kind==='drop-heading')value.splice(value.findIndex(r=>r.sourcePath==='docs/specs/distribution.md'&&r.sourceAnchor==='setup'),1);
 const text=JSON.stringify(value);return typeof raw==='string'?text:Buffer.from(text);
};
`);
 const cases=[
  ['drop-duty','final-pin-duties.json','unlisted live pointer-patch drift'],
  ['stale-duty','final-pin-duties.json','stale final-pin duty'],
  ['missing-patch','final-pin-duties.json','duty must name one unapplied patch'],
  ['blank-reason','final-pin-duties.json','d.reason?.trim()'],
  ['drop-heading','source-heading-parity.json','live heading census'],
 ];
 for(const [kind,suffix,expected] of cases){
  const child=spawnSync(process.execPath,[path.join(here,'verify-carries.mjs')],{
   cwd:root,encoding:'utf8',maxBuffer:50*1024*1024,
   env:{...process.env,NODE_OPTIONS:`${process.env.NODE_OPTIONS??''} --no-addons --require ${preload}`,
        CARRIES_CONTROL:JSON.stringify({kind,suffix})},
  });
  assert.equal(child.status,1,`${kind}: checker must reject, not crash or pass: ${child.stderr}`);
  assert.ok(child.stderr.includes(expected),`${kind}: wrong failure: ${child.stderr}`);
  checks.push({name:kind,result:'rejected',exit:child.status,expected});
 }
 const result={status:'passed',negativeControls:checks,count:checks.length,
  method:'The real owning checker reads in-memory overlays through a scratch preload; historical witness-pin reads and checkout files are untouched. All child processes inherit the native-addon block.'};
 fs.writeFileSync(path.join(here,'controls.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
} finally {fs.rmSync(scratch,{recursive:true,force:true});}
