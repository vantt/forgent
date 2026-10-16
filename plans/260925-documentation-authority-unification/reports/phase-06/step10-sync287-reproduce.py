"""Read-only all-shard author rationale audit; requires explicit external scratch output."""
import argparse, os, pathlib, subprocess
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('command', choices=['consistency'])
parser.add_argument('--output', required=True, help='explicit absolute external scratch JSON path under /tmp/fgos-work')
a=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[4]
output=pathlib.Path(a.output)
if not output.is_absolute() or output.resolve().is_relative_to(root) or not output.resolve().is_relative_to('/tmp/fgos-work'):
 parser.error('output must be an absolute external scratch path under /tmp/fgos-work, outside repository')
if output.is_symlink() or output.exists() and output.stat().st_nlink != 1:
 parser.error('unsafe output: external scratch file must not be a symlink or hardlink')
output.parent.mkdir(parents=True, exist_ok=True)
env=os.environ.copy(); env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work'
script=root/'plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-rebuild.mjs'
subprocess.run(['node',str(script),'--check','--output',str(output)],cwd=root,env=env,check=True)
