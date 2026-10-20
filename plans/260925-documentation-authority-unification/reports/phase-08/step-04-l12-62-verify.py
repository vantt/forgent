#!/usr/bin/env python3
"""Serial, report-only final verification; full source suites are outside this record change."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,time,json,os,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work';env['PYTHONDONTWRITEBYTECODE']='1'
commands=[('checker',['python3','-B',str(P/'step-04-check.py')]),('probes',['python3','-B',str(P/'step-04-l12-62-probes.py')]),('packet',['python3','-B',str(P/'step-04-wave3-packet.py')]),('ratchet',['node','scripts/check-legacy-docs-ratchet.mjs']),('citation-drift',['node','scripts/check-decision-citation-drift.mjs']),('light-tests',['node','--test','test/scripts/doc-link-pass.test.mjs','test/scripts/check-doc-candidate-status.test.mjs','test/scripts/check-doc-constitution.test.mjs','test/scripts/generate-shipped-path-inventory.test.mjs','test/setup/instruction-registry.test.mjs','test/setup/instruction-composition.test.mjs','test/setup/instruction-projections.test.mjs']),('whitespace',['git','diff','--check'])]
previous=json.loads((P/'step-04-l12-62-verification.json').read_text()) if '--records-only' in sys.argv else None
if previous:commands=[x for x in commands if x[0] in ('checker','probes','packet','whitespace')]
receipts=[x for x in previous['commands'] if x['label'] not in ('checker','probes','packet','whitespace')] if previous else []
for label,cmd in commands:
 start=time.monotonic();log=P/('step-04-l12-62-'+label+'.log')
 with log.open('w') as out:r=subprocess.run(cmd,cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT)
 receipts.append({'label':label,'command':cmd,'exit':r.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'log':log.name,'sha256':hashlib.sha256(log.read_bytes()).hexdigest()})
 (P/'step-04-l12-62-verification.json').write_text(json.dumps({'commands':receipts,'allPassed':all(x['exit']==0 for x in receipts),'limit':'Author records-only evidence. No consumer application, full npm/cargo suite, installed parity, reviewer acceptance or actual-commit reproduction claim.'},ensure_ascii=False,indent=2)+'\n');print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
