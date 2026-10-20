#!/usr/bin/env python3
"""Serial author receipts; never committed-byte or independent semantic acceptance."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,time,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work';env['PYTHONDONTWRITEBYTECODE']='1'
commands=[
 ('checker',['python3','-B',str(P/'step-04-check.py')]),
 ('probes',['python3','-B',str(P/'step-04-l12-60-probes.py')]),
 ('packet',['python3','-B',str(P/'step-04-wave2-packet.py')]),
 ('ratchet',['node','scripts/check-legacy-docs-ratchet.mjs']),
 ('citation-drift',['node','scripts/check-decision-citation-drift.mjs']),
 ('binding-tests',['node','--test','test/scripts/check-legacy-docs-ratchet.test.mjs','test/scripts/generate-doc-inventory.test.mjs','test/scripts/doc-binding-repair.test.mjs','test/scripts/doc-corpus-decisions.test.mjs','test/scripts/doc-decision-review.test.mjs','test/scripts/doc-decision-exact.test.mjs','test/scripts/doc-decision-conservation.test.mjs','test/scripts/doc-decision-mirrors.test.mjs']),
 ('light-tests',['node','--test','test/scripts/doc-link-pass.test.mjs','test/scripts/check-doc-candidate-status.test.mjs','test/scripts/check-doc-constitution.test.mjs','test/scripts/generate-shipped-path-inventory.test.mjs','test/setup/instruction-registry.test.mjs','test/setup/instruction-composition.test.mjs','test/setup/instruction-projections.test.mjs']),
 ('whitespace',['git','diff','--check'])]
previous=json.loads((P/'step-04-l12-60-verification.json').read_text()) if '--records-only' in sys.argv else None
receipts=[x for x in previous['commands'] if x['label'] not in ['checker','probes','packet','whitespace']] if previous else []
if previous:commands=[x for x in commands if x[0] in ['checker','probes','packet','whitespace']]
for label,cmd in commands:
 start=time.monotonic();log=P/('step-04-l12-60-'+label+'.stdout.log')
 with log.open('w') as out:r=subprocess.run(cmd,cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT)
 receipts.append({'label':label,'command':cmd,'exit':r.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'log':str(log.relative_to(ROOT)),'logSha256':hashlib.sha256(log.read_bytes()).hexdigest()})
 result={'authorPin':'dc24ce64527fbffd23e1643f35a7ddf808fd7b45','commands':receipts,'allPassed':all(x['exit']==0 for x in receipts),'acceptance':'Serial working-tree author proof only; no independent semantics, real-commit reproduction, source application or installed parity acceptance.'}
 (P/'step-04-l12-60-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
