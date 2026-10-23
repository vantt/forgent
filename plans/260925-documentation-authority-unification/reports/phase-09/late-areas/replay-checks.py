"""Single-file checks in a disposable copy, reusing D1's shipped native-addon descriptor recipe.
No production source/test edits, bypasses, or git writes in the real checkout.
python3 -B <this-file> --release-path <activation.releasePath> --scratch /tmp/fgos-work/w2-d6-fresh
"""
import argparse, hashlib, json, os, pathlib, re, shutil, subprocess
p=argparse.ArgumentParser()
p.add_argument('--release-path',required=True)
p.add_argument('--scratch',required=True)
a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[5]
release=pathlib.Path(a.release_path).resolve()
scratch=pathlib.Path(a.scratch).resolve()
assert scratch.is_relative_to(pathlib.Path('/tmp/fgos-work'))
assert not scratch.exists(), 'new scratch directory required; never delete another fixture'
scratch.mkdir(parents=True)
stage=scratch/'checkout';stage.mkdir()
for folder in ['src','scripts','test','core','domains','bin']:
 shutil.copytree(root/folder,stage/folder,ignore=shutil.ignore_patterns('node_modules','.git','.fgos','target','__pycache__'))
for contracts in (root/'packages').glob('*/contracts'):
 if contracts.is_dir():shutil.copytree(contracts,stage/contracts.relative_to(root),dirs_exist_ok=True)
shutil.copy2(root/'package.json',stage/'package.json')
shutil.copytree(root/'docs/platform',stage/'docs/platform')
for rel in ['docs/doc-governance.md','docs/reading-map.md']:
 dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/rel,dest)
P=pathlib.Path('plans/260925-documentation-authority-unification')
for name in ['transitional-switchboard.json','minimum-constitution.json','claim-and-disposition-vocabulary.json','claim-ledger.schema.json']:
 dest=stage/P/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/P/name,dest)
manifest=json.loads((release/'manifest.json').read_text())
for file in [manifest['components']['nativeAddon']['path'],manifest['entries']['fgos']]:
 dest=stage/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(release/file,dest)
assert hashlib.sha256((stage/manifest['components']['nativeAddon']['path']).read_bytes()).hexdigest()==manifest['components']['nativeAddon']['digest']
(stage/'native-addon.json').write_text(json.dumps(manifest)+'\n')
env=os.environ.copy()
for key in ['FGOS_ACTIVE_MANIFEST_PATH','FGOS_ACTIVE_RELEASE_PATH']:
 env.pop(key,None)
for key,dirname in {'TMPDIR':'tmp','TMP':'tmp','TEMP':'tmp','HOME':'home','FGOS_STATE_ROOT':'state'}.items():
 value=scratch/dirname;value.mkdir(mode=0o700,exist_ok=True);value.chmod(0o700);env[key]=str(value)
results=[]
for i,file in enumerate(['test/scripts/check-doc-candidate-status.test.mjs','test/scripts/list-doc-anchors.test.mjs']):
 command=['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+str(release/'bin/fgos'),'node','--test',file]
 cp=subprocess.run(command,cwd=stage,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180)
 log=scratch/f'{i+1:02}.log';log.write_text(cp.stdout)
 result={'test':file,'command':command,'cwd':str(stage),'exit':cp.returncode,'stdoutSha256':hashlib.sha256(cp.stdout.encode()).hexdigest(),'summary':[line for line in cp.stdout.splitlines() if re.match(r'^(?:ℹ|#) (tests|pass|fail|skipped|cancelled) ',line)],'scratchLog':str(log),'qualification':'Unchanged current Node source/tests against digest-verified activated addon via the existing shipped-package descriptor. Temporary test repositories may use git init/add; no git write in this checkout. Not Rust working-tree freshness.'}
 results.append(result);print(json.dumps(result,ensure_ascii=False),flush=True)
(scratch/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if all(r['exit']==0 for r in results) else 1)
