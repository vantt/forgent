"""Run the unchanged evidence checker in a disposable, byte-matched fixture.
The checkout's Inspect floor probe needs a Git common-directory write denied by
worker confinement. Only this scratch repository is initialized/staged/committed.
No scope-reduced consumer scan, production edit, flag bypass or legacy payload edit.
"""
import hashlib,json,os,shutil,stat,subprocess
from pathlib import Path
root=Path.cwd();P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import2'
scratch=Path('/tmp/fgos-work/w3-import2-brief/evidence-fixture')
assert not scratch.exists(),'use a fresh fixture, never reuse stale evidence'
scratch.mkdir(parents=True)
def git(*args,cwd=root):return subprocess.check_output(['git',*args],cwd=cwd,stderr=subprocess.PIPE)
def sha(b):return hashlib.sha256(b).hexdigest()
tracked=git('ls-files','-s','-z').decode().split('\0');chosen=[]
roots=('.agents/','.claude/','.githooks/','apps/','bin/','core/','domains/','packages/','plugins/','scripts/','src/','test/')
# Include every tracked consumer input without extension filtering, every docs payload
# (superset of the checker's evidence classification), and its two frozen input records.
inputs=[str(P/'reports/phase-08/step-06-evidence-relocation-manifest.json'),str(P/'reports/phase-08/step-06-evidence-consumer-table.json')]
for record in tracked:
 if not record:continue
 mode,blob,stage,p=__import__('re').match(r'(\d+) ([0-9a-f]+) (\d)\t([\s\S]+)',record).groups();assert stage=='0'
 if p.startswith(roots) or p.startswith(('docs/architect/','docs/platform/')) or p in inputs:
  src=root/p;dst=scratch/p;dst.parent.mkdir(parents=True,exist_ok=True)
  if src.is_symlink():dst.symlink_to(os.readlink(src));actual=os.readlink(src).encode()
  else:shutil.copy2(src,dst);actual=src.read_bytes();assert actual==dst.read_bytes()
  chosen.append({'path':p,'sourceIndexMode':mode,'sourceIndexBlob':blob,'workingSha256':sha(actual)})
for name in ['package.json','Cargo.toml']:
 shutil.copy2(root/name,scratch/name)
# Git writes below occur exclusively in this disposable test fixture.
git('init','--quiet',cwd=scratch)
git('-c','core.hooksPath=/dev/null','add','--all','--force',cwd=scratch)
git('-c','core.hooksPath=/dev/null','-c','user.name=Documentation proof','-c','user.email=proof@example.invalid','commit','--quiet','-m','fixture: byte-matched evidence consumer tree',cwd=scratch)
command=['node',str(root/'scripts/check-evidence-relocation.mjs'),'--manifest',inputs[0],'--before','--repo-root',str(scratch),'--json']
state=scratch.parent/'evidence-state';state.mkdir(mode=0o700,exist_ok=True)
env=dict(os.environ,FGOS_STATE_ROOT=str(state))
result=subprocess.run(command,cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
receipt={'environment':{'FGOS_STATE_ROOT':str(state)},'method':'All tracked consumer roots and all tracked docs/architect + docs/platform bytes copied without exclusions; only scratch Git writes. Unchanged owning checker uses --repo-root, real index, native Inspect and complete consumer table. Fixture success does not erase checkout floor-probe failure.','command':command,'exit':result.returncode,'stdout':result.stdout,'stderr':result.stderr,'copiedCount':len(chosen),'copiedInputs':chosen}
(O/'evidence-fixture.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k!='copiedInputs'},ensure_ascii=False,indent=2))
