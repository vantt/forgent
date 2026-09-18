// Read-only native validator probes and synthetic OS-boundary experiment.
// No agent/provider dispatch, production configuration, or live session writes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(process.argv[2] || '.');
const watched = ['src/verbs/coordination/schema.mjs', 'src/verbs/coordination/run.mjs', 'src/runner/coordination/session-engine.mjs', 'src/runner/coordination/store.mjs', 'src/runner/dispatch/assignment-runner.mjs'];
const before = Object.fromEntries(watched.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
const { validateCoordinationRequest } = await import(pathToFileURL(path.join(root,watched[0])));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-envelope-canary-'));
const checkout = path.join(fixture,'checkout');
const evidence = path.join(fixture,'evidence');
fs.mkdirSync(checkout); fs.mkdirSync(evidence);
const sentinel = path.join(fixture,'sibling-report.txt');
fs.writeFileSync(sentinel,'SYNTHETIC_PRIVATE_FIRST_PASS');
const declared = {kind:'declared-protocol', objective:'Synthetic capability probe', writerId:'synthetic-driver', protocolRef:{id:'core.coordination-protocol.standalone-master-coordination-loop'}, steps:[{type:'operation',as:'first',operationId:'implement',objective:'Synthetic task',expectedOutputs:['report']}]};
const agent = {kind:'agent-led', objective:'Synthetic capability probe',writerId:'synthetic-driver',primaryRole:'researcher',task:{expectedOutputs:['report'],evidenceRequired:'reported'}};
const cases = [['declared-control',declared],['agent-led-control',agent]];
for (const type of ['specialist','retry','cancel','replace']) cases.push([`public-${type}`,{...declared,steps:[{type,as:'probe'}]}]);
cases.push(['agent-led-new-actor',{...agent,actors:[{id:'compatibility-specialist',tier:'analytical'}]}]);
cases.push(['agent-led-mutating',{...agent,task:{...agent.task,mutation:'mutating'}}]);
cases.push(['agent-led-open-role',{...agent,primaryRole:'compatibility-investigator'}]);
cases.push(['declared-mutation-schema',{...declared,steps:[{...declared.steps[0],mutation:'mutating'}]}]);
const validation = cases.map(([name,request]) => {try {validateCoordinationRequest(request);return {name,accepted:true};} catch(e) {return {name,accepted:false,error:e.message};}});
// The child reads only our synthetic sentinel; the broad mount is deliberately
// the documented baseline, not an isolation recommendation or an LLM sandbox.
const code = 'import pathlib,json,sys\np=pathlib.Path(sys.argv[1])\nr={"siblingRead":p.read_text()}\ntry:\n p.write_text("MUTATED")\n r["write"]="succeeded"\nexcept OSError as e:\n r["write"]="denied";r["errno"]=e.errno\nprint(json.dumps(r))';
const args = ['--ro-bind','/','/','--dev','/dev','--proc','/proc','--bind',evidence,evidence,'--chdir',checkout,'--','/usr/bin/python3','-c',code,sentinel];
const mount = spawnSync('/usr/bin/bwrap',args,{encoding:'utf8',timeout:10000,env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}});
const after = Object.fromEntries(watched.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
const sourceStable = JSON.stringify(before)===JSON.stringify(after);
const result = {timestamp:new Date().toISOString(),kind:'no-provider-capability-probe',root,node:process.version,fixture,sourceHashes:before,sourceStable,validation,mount:{command:'/usr/bin/bwrap',args,status:mount.status,stdout:mount.stdout,stderr:mount.stderr,error:mount.error?.message,sentinelUnchanged:fs.readFileSync(sentinel,'utf8')==='SYNTHETIC_PRIVATE_FIRST_PASS'},limits:{providerCalls:0,agentDispatches:0,timeoutMs:10000,scope:'validator calls and synthetic canary only'}};
console.log(JSON.stringify(result,null,2));
if (!sourceStable || !validation.find(r=>r.name==='declared-control').accepted || !validation.find(r=>r.name==='agent-led-control').accepted) process.exitCode=1;
