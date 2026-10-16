"""Replay unchanged rationale checking from the saved package execution scripts."""
import json,os,pathlib,subprocess,sys,tempfile
R=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-06')
assert sys.argv[1:]==['consistency'], 'Usage: python3 <this-file> consistency'
payload=json.loads((R/'step10-sync287-reproduction.json').read_text())
run=pathlib.Path(tempfile.mkdtemp(prefix='package287-reproduce-',dir='/tmp/fgos-work'))
for name in ['lib.mjs','consistency.py','supplement.mjs']:
 (run/name).write_text(payload['scripts'][name])
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work'
subprocess.run(['python3',str(run/'consistency.py')],env=env,check=True)
subprocess.run(['node',str(run/'supplement.mjs')],env=env,check=True)
