"""Read-only author verification. Requires caller-owned external scratch output."""
import argparse, json, os, pathlib, subprocess
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--output-dir',required=True)
a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[4]
out=pathlib.Path(a.output_dir)
if not out.is_absolute() or not out.resolve().is_relative_to('/tmp/fgos-work') or out.resolve().is_relative_to(root):
 p.error('explicit absolute external output directory under /tmp/fgos-work required')
if out.is_symlink(): p.error('output directory must not be a symlink')
out.mkdir(parents=True,exist_ok=True)
for f in out.iterdir():
 if f.is_symlink() or f.is_file() and f.stat().st_nlink!=1:p.error('unsafe scratch output entry')
r=root/'plans/260925-documentation-authority-unification/reports/phase-06'
manifest=json.loads((r/'step10-round5-reproduction.json').read_text())
for name,source in manifest['scripts'].items(): (out/name).write_text(source)
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work';env.setdefault('NODE_OPTIONS','--max-old-space-size=3072')
commands=[['node',str(r/'step10-independent-rationale-audit.mjs'),'--output',str(out/'independent.json')]]
commands += [['python3' if name.endswith('.py') else 'node',str(out/name),'--output-dir',str(out)] for name in ['checks.mjs','fast.mjs','ownership.mjs','audit-ownership.mjs','replay.py']]
results=[]
for command in commands:
 result=subprocess.run(command,cwd=root,env=env,text=True,capture_output=True)
 name=pathlib.Path(command[1]).stem
 (out/(name+'.log')).write_text(result.stdout+result.stderr)
 results.append({'command':command,'exitCode':result.returncode,'log':str(out/(name+'.log'))})
 print(name,result.returncode,flush=True)
(out/'reproduction-summary.json').write_text(json.dumps(results,indent=2)+'\n')
raise SystemExit(int(any(row['exitCode'] for row in results)))
