"""Safe focused diagnostic replay, excluding the unsafe native checker attempt.
Historical outputs/commands remain in checks.json; replay writes checks-replay.json.
The original evidence preload did not stop ensureScriptAddon's second-load staging;
see receipt.md. Do not repeat that attempt in this confined checkout.
Only scratch-output plumbing is redirected for the unchanged record checkers.
"""
import datetime
import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
P=Path('plans/260925-documentation-authority-unification')
O=P/'reports/phase-09/import3'
S=Path('/tmp/fgos-work/w10-import3'); S.mkdir(parents=True,exist_ok=True)
state=S/'state';state.mkdir(mode=0o700,exist_ok=True)
release=Path('/home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8')
# Same script bodies, same extractors, only output-directory placement changes.
rebind="import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[1]); m['main'].__globals__['SCRATCH']=Path('/tmp/fgos-work/w10-import3/rebind'); sys.argv=sys.argv[1:]; raise SystemExit(m['main']())"
audit="import runpy,tempfile,sys; original=tempfile.mkdtemp; tempfile.mkdtemp=lambda *a,**k: original(*a,**dict(k,dir='/tmp/fgos-work/w10-import3')); runpy.run_path(sys.argv[1],run_name='__main__')"
# Native evidence relocation is deliberately NOT replayed here: the earlier
# attempt staged outside scope. A sanctioned isolated fixture is needed first.
commands=[
 ('accounting',['python3','-B',str(O/'account.py')]),
 ('legacy-drift-at-head',['node',str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs')]),
 ('rebind-check',['python3','-B','-c',rebind,str(P/'reports/phase-09/rebind/rebind.py'),'--check']),
 ('ownership-audit',['python3','-B','-c',audit,str(P/'reports/phase-08/audit-report.py')]),
 ('ratchet',['node','scripts/check-legacy-docs-ratchet.mjs']),
 ('ratchet-owning-test',['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+str(release/'bin/fgos'),'node','--test','test/scripts/check-legacy-docs-ratchet.test.mjs'])]
checks=[]
for name,command in commands:
    env=dict(os.environ,FGOS_STATE_ROOT=str(state),TMPDIR=str(S));env.pop('CLAUDE_CODE_SESSION_ID',None)
    start=datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        result=subprocess.run(command,env=env,text=True,capture_output=True,timeout=300)
        code,out,err=result.returncode,result.stdout,result.stderr
    except subprocess.TimeoutExpired as e:
        code,out,err=124,e.stdout or b'',e.stderr or b''
        if isinstance(out,bytes):out=out.decode(errors='replace')
        if isinstance(err,bytes):err=err.decode(errors='replace')
    entry=dict(name=name,command=command,environmentOverrides=dict(FGOS_STATE_ROOT=str(state),TMPDIR=str(S)),unsetEnvironment=['CLAUDE_CODE_SESSION_ID'],startedAt=start,exit=code,stdout=out,stderr=err)
    if len(out)>100000:
        artifact=O/(name+'-replay.stdout.json.gz')
        artifact.write_bytes(gzip.compress(out.encode(),mtime=0))
        entry.pop('stdout')
        entry.update(stdoutArtifact=str(artifact),stdoutSha256=hashlib.sha256(out.encode()).hexdigest(),stdoutEncoding='gzip UTF-8; decompress to recover exact stdout')
    checks.append(entry)
    print(name,code,flush=True)
    (O/'checks-replay.json').write_text(json.dumps(dict(inputHEAD=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),checks=checks,allPassed=all(c['exit']==0 for c in checks),qualification='Diagnostic blocked run, not completed resync or gate acceptance.'),ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if all(c['exit']==0 for c in checks) else 1)
