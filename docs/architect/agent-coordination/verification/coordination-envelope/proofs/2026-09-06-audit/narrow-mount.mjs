// OS-only candidate mechanism; NOT a native fgOS/provider proof.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const fixture = fs.mkdtempSync(path.join(os.tmpdir(),'fgos-envelope-narrow-'));
const checkout=path.join(fixture,'checkout'), output=path.join(fixture,'output');
fs.mkdirSync(checkout); fs.mkdirSync(output);
fs.writeFileSync(path.join(checkout,'allowed.txt'),'SYNTHETIC_GRANTED_CONTEXT');
const privatePath=path.join(fixture,'private.txt');
fs.writeFileSync(privatePath,'SYNTHETIC_PRIVATE_CONTEXT');
fs.symlinkSync(privatePath,path.join(checkout,'escape-link'));
const code=`import pathlib,json,sys
r={"allowedRead":pathlib.Path('/workspace/allowed.txt').read_text()}
for name,p in [('absolutePrivate',sys.argv[1]),('symlinkPrivate','/workspace/escape-link')]:
 try:
  pathlib.Path(p).read_text();r[name]='readable'
 except OSError as e:
  r[name]='denied';r[name+'Errno']=e.errno
try:
 pathlib.Path('/workspace/allowed.txt').write_text('MUTATED');r['sourceWrite']='succeeded'
except OSError as e:
 r['sourceWrite']='denied';r['sourceWriteErrno']=e.errno
pathlib.Path('/output/report.txt').write_text('SYNTHETIC_REPORT')
r['reportWrite']='succeeded'
print(json.dumps(r))`;
const args=['--unshare-all','--die-with-parent','--tmpfs','/','--ro-bind','/usr','/usr','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64','--proc','/proc','--dev','/dev','--ro-bind',checkout,'/workspace','--bind',output,'/output','--chdir','/workspace','--','/usr/bin/python3','-c',code,privatePath];
const run=spawnSync('/usr/bin/bwrap',args,{encoding:'utf8',timeout:10000,env:{PATH:'/usr/bin',LANG:'C.UTF-8'}});
console.log(JSON.stringify({timestamp:new Date().toISOString(),classification:'OS-only candidate mechanism, not native/provider proof',fixture,command:'/usr/bin/bwrap',args,status:run.status,stdout:run.stdout,stderr:run.stderr,error:run.error?.message,privateUnchanged:fs.readFileSync(privatePath,'utf8')==='SYNTHETIC_PRIVATE_CONTEXT',sourceUnchanged:fs.readFileSync(path.join(checkout,'allowed.txt'),'utf8')==='SYNTHETIC_GRANTED_CONTEXT',reportExists:fs.existsSync(path.join(output,'report.txt')),providerCalls:0,agentDispatches:0},null,2));
