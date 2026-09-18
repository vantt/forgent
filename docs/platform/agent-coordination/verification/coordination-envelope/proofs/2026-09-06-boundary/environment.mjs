// Synthetic environment canary: no provider, dispatch adapter, or host secret read.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const source=fs.readFileSync('src/runner/dispatch/transport.mjs');
const code='import os,json\nprint(json.dumps({"syntheticParentVisible":os.environ.get("FGOS_PROBE_SYNTHETIC_PARENT")=="SYNTHETIC_ONLY"}))';
const results=[];
for(const clear of [false,true]) {
 const args=['--unshare-all','--die-with-parent','--tmpfs','/','--ro-bind','/usr','/usr','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64','--proc','/proc','--dev','/dev',...(clear?['--clearenv','--setenv','PATH','/usr/bin']:[]),'--','/usr/bin/python3','-c',code];
 const r=spawnSync('/usr/bin/bwrap',args,{encoding:'utf8',timeout:10000,env:{PATH:'/usr/bin',FGOS_PROBE_SYNTHETIC_PARENT:'SYNTHETIC_ONLY'}});
 results.push({clearEnvironment:clear,status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message,args});
}
console.log(JSON.stringify({timestamp:new Date().toISOString(),classification:'OS-only synthetic environment proof; native adapter inheritance is static evidence',source:'src/runner/dispatch/transport.mjs',sha256:crypto.createHash('sha256').update(source).digest('hex'),results,providerCalls:0,agentDispatches:0},null,2));
