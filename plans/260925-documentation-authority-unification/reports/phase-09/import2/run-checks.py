"""Focused owning checks only; no fgOS CLI, broad test launcher or repository Git writes.
Uses a private scratch machine-state root so native floor probes never touch live state.
"""
import datetime,json,os,subprocess
from pathlib import Path
P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import2'
state=Path('/tmp/fgos-work/w3-import2-brief/fgos');state.mkdir(mode=0o700,exist_ok=True)
release='/home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8/bin/fgos'
commands=[('binding-and-conservation',['python3','-B',str(O/'verify.py')],{}),('legacy-drift-check',['node',str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs'),'--check'],{}),('ratchet',['node','scripts/check-legacy-docs-ratchet.mjs'],{}),('ratchet-owning-test',['node','--test','test/scripts/check-legacy-docs-ratchet.test.mjs'],{'FGOS_HOST_BIN':release}),('evidence-relocation-before',['node','scripts/check-evidence-relocation.mjs','--manifest',str(P/'reports/phase-08/step-06-evidence-relocation-manifest.json'),'--before'],{'FGOS_STATE_ROOT':str(state)}),('undeclared-census',['node',str(O/'census.mjs')],{'FGOS_STATE_ROOT':str(state)})]
checks=[]
for label,command,extra in commands:
 env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None);env.update(extra)
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(command,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 checks.append({'name':label,'command':command,'environmentOverrides':extra,'unsetEnvironment':['CLAUDE_CODE_SESSION_ID'],'startedAt':start,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr});print(label,r.returncode,flush=True)
out={'sourceHEAD':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'checks':checks,'allPassed':all(c['exit']==0 for c in checks),'limitations':['Default live state root is read-only to this worker: initial native Inspect floor probe refused. Final unchanged evidence checker and census use a real private scratch FGOS_STATE_ROOT, not a disabled check or alternate parser.','No broad suites run under the brief. No YAML-focused node test attempted or bypassed. The record-only census uses the production script addon staging door exactly as the owning CLI.','Independent content review, protected Step 3/4/5 source-context refresh, final-pin recomposition and authority cutover are not claimed.']}
(O/'checks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if out['allPassed'] else 1)
