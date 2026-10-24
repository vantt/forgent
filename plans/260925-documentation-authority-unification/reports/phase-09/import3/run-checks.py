"""W11 focused replay. No fgOS CLI, broad suite or Git write.
Evidence relocation is not attempted. audit-report's checks.mjs may reuse the
existing cached addon through its normal door; no explicit preload or staging.
Original blocked outputs remain in checks.json / checks-replay.json.
Only temporary-directory plumbing is redirected for the unchanged record tools.
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
S=Path('/tmp/fgos-work/w11-import3');S.mkdir(parents=True,exist_ok=True)
release=Path('/home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8')
assert (release/'bin/fgos').is_file()
rebind="import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[1]); m['main'].__globals__['SCRATCH']=Path('/tmp/fgos-work/w11-import3/rebind'); sys.argv=sys.argv[1:]; raise SystemExit(m['main']())"
audit="import runpy,tempfile,sys; original=tempfile.mkdtemp; tempfile.mkdtemp=lambda *a,**k: original(*a,**dict(k,dir='/tmp/fgos-work/w11-import3')); runpy.run_path(sys.argv[1],run_name='__main__')"
commands=[
 ('accounting',['python3','-B',str(O/'account.py')]),
 ('binding-and-conservation',['python3','-B',str(O/'resync.py'),'--check']),
 ('scanner-boundary-probes',['python3','-B',str(O/'prove-scanner.py')]),
 ('legacy-drift-at-head',['node',str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs')]),
 ('legacy-drift-replay',['node',str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs'),'--check']),
 ('rebind-check',['python3','-B','-c',rebind,str(P/'reports/phase-09/rebind/rebind.py'),'--check']),
 ('ownership-audit',['python3','-B','-c',audit,str(P/'reports/phase-08/audit-report.py')]),
 ('ratchet',['node','scripts/check-legacy-docs-ratchet.mjs']),
 ('ratchet-owning-test',['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+str(release/'bin/fgos'),'node','--test','test/scripts/check-legacy-docs-ratchet.test.mjs']),
 ('diff-whitespace',['git','diff','--check'])]
checks=[]
for name,command in commands:
    env=dict(os.environ,TMPDIR=str(S));env.pop('CLAUDE_CODE_SESSION_ID',None)
    start=datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        result=subprocess.run(command,env=env,text=True,capture_output=True,timeout=300)
        code,out,err=result.returncode,result.stdout,result.stderr
    except subprocess.TimeoutExpired as e:
        code,out,err=124,e.stdout or b'',e.stderr or b''
        if isinstance(out,bytes):out=out.decode(errors='replace')
        if isinstance(err,bytes):err=err.decode(errors='replace')
    entry=dict(name=name,command=command,environmentOverrides=dict(TMPDIR=str(S)),unsetEnvironment=['CLAUDE_CODE_SESSION_ID'],startedAt=start,exit=code,stdout=out,stderr=err)
    if name=='ownership-audit' and out:
        data=json.loads(out)
        entry['ownershipSummary']=[dict(manifest=m['manifest'],commands=m['commands'],failingRowCount=len(m['failingRows']) if m['failingRows'] is not None else None,ownership=m['ownership']) for m in data['manifests']]
        entry['requiredOwnershipPassed']=all(all(c['exit']==0 for c in m['commands'] if c['script'] in ('ownership.mjs','audit-ownership.mjs')) and m['failingRows']==[] for m in data['manifests'])
        entry['subcommandOutputs']=[dict(manifest=m['manifest'],script=c['script'],exit=c['exit'],
            stdout=(Path(data['scratch'])/Path(m['manifest']).stem.replace('-reproduction','')/(c['script']+'.stdout')).read_text(),
            stderr=(Path(data['scratch'])/Path(m['manifest']).stem.replace('-reproduction','')/(c['script']+'.stderr')).read_text())
            for m in data['manifests'] for c in m['commands']]
    if len(out)>100000:
        artifact=O/(name+'-w11.stdout.json.gz');artifact.write_bytes(gzip.compress(out.encode(),mtime=0))
        entry.pop('stdout');entry.update(stdoutArtifact=str(artifact),stdoutSha256=hashlib.sha256(out.encode()).hexdigest(),stdoutEncoding='gzip UTF-8; decompress to recover exact stdout')
    checks.append(entry)
    print(name,code,flush=True)
    required=all(c.get('requiredOwnershipPassed',False) if c['name']=='ownership-audit' else c['exit']==0 for c in checks)
    (O/'checks-w11.json').write_text(json.dumps(dict(inputHEAD=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),checks=checks,requiredChecksPassed=required,allExitCodesZero=all(c['exit']==0 for c in checks),evidenceRelocation=dict(status='not-run',exit=None,reason='The --before checker calls inspectRepo -> ensureScriptAddon. That can load or stage a native addon; W11 explicitly forbids loading one. No attempt made.'),qualification='Author evidence only. Both ownership readers are required and checked separately from checks.mjs. This run checks.mjs could not produce a verdict: the native Inspect floor probe refused on the read-only live state root. Cached addon loading was observed; no Cargo/build output. No pair accounting performed.'),ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if required else 1)
