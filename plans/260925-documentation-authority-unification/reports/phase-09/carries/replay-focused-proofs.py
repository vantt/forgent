"""Reproduce the eight focused proofs in scratch, without changing this checkout.
python3 -B <this-file> --release-path <activated releasePath> --scratch /tmp/fgos-work/w1-d1-replay
Uses the existing shipped-package native-addon descriptor; no new runtime switch or skipped check.
"""
import argparse, hashlib, json, os, pathlib, re, shutil, subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--release-path',required=True)
parser.add_argument('--scratch',required=True)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[5]
release=pathlib.Path(args.release_path).resolve()
scratch=pathlib.Path(args.scratch).resolve()
assert scratch.is_relative_to(pathlib.Path('/tmp/fgos-work')), 'scratch must be confined to /tmp/fgos-work'
assert not scratch.exists(), 'choose a new scratch directory; never erase someone else\'s fixtures'
scratch.mkdir(parents=True)
stage=scratch/'checkout';stage.mkdir()
for folder in ['src','scripts','test','core','domains','bin']:
 shutil.copytree(root/folder,stage/folder,ignore=shutil.ignore_patterns('node_modules','.git','.fgos','target','__pycache__'))
for contracts in (root/'packages').glob('*/contracts'):
 if contracts.is_dir():shutil.copytree(contracts,stage/contracts.relative_to(root),dirs_exist_ok=True)
shutil.copyfile(root/'package.json',stage/'package.json')
manifest=json.loads((release/'manifest.json').read_text())
for file in [manifest['components']['nativeAddon']['path'],manifest['entries']['fgos']]:
 dest=stage/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(release/file,dest)
assert hashlib.sha256((stage/manifest['components']['nativeAddon']['path']).read_bytes()).hexdigest()==manifest['components']['nativeAddon']['digest']
(stage/'native-addon.json').write_text(json.dumps(manifest)+'\n')
packet=json.loads((pathlib.Path(__file__).parent/'pointer-patches.json').read_text())
def patch(text,diff):
 source=text.splitlines(True);output=[];cursor=0;lines=diff.splitlines(True);i=0
 while i<len(lines):
  match=re.match(r'^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@',lines[i])
  if not match:i+=1;continue
  start=max(0,int(match[1])-1);assert start>=cursor;output+=source[cursor:start];cursor=start;i+=1
  while i<len(lines) and not lines[i].startswith('@@ '):
   kind=lines[i][0];body=lines[i][1:];i+=1
   if kind=='\\':continue
   assert kind in ' +-'
   if kind!='+':assert source[cursor]==body;cursor+=1
   if kind!='-':output.append(body)
 output+=source[cursor:];return ''.join(output)
for p in packet['patches']:
 if p['path']=='AGENTS.md' or p['path'].startswith('test/docs/'):
  original=(root/p['path']).read_text();assert hashlib.sha256(original.encode()).hexdigest()==p['beforeSha256']
  after=patch(original,p['forwardDiff']);assert hashlib.sha256(after.encode()).hexdigest()==p['expectedAfterSha256']
  dest=stage/p['path'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(after)
for file in ['docs/platform/platform-foundations.md','docs/platform/work-state/decisions/retired-decision-history.md','docs/platform/runner/decisions/h-36d872fbb0e5.md','docs/architecture-map.md','docs/specs/system-overview.md']:
 dest=stage/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/file,dest)
shutil.copytree(root/'docs/decisions',stage/'docs/decisions')
env=os.environ.copy()
for key,value in {'TMPDIR':scratch/'tmp','TMP':scratch/'tmp','TEMP':scratch/'tmp','FGOS_STATE_ROOT':scratch/'state','HOME':scratch/'home'}.items():
 value.mkdir(mode=0o700,exist_ok=True);value.chmod(0o700);env[key]=str(value)
tests=['test/docs/rul11-anchor-phrase.test.mjs','test/docs/rul104-anchor-phrase.test.mjs','test/docs/decisions-corpus-retired.test.mjs','test/state/knowledge-registry.test.mjs','test/state/knowledge-bootstrap.test.mjs','test/runner/operation-prompt-templates.test.mjs','test/util/yaml.test.mjs','test/cli/knowledge-verbs.test.mjs']
results=[]
for i,file in enumerate(tests):
 command=['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+str(release/'bin/fgos'),'node','--test',file]
 cp=subprocess.run(command,cwd=stage,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180)
 (scratch/f'{i+1:02}.log').write_text(cp.stdout)
 result={'test':file,'command':command,'exit':cp.returncode,'stdoutSha256':hashlib.sha256(cp.stdout.encode()).hexdigest(),'summary':[line for line in cp.stdout.splitlines() if re.match(r'^(?:ℹ|#) (tests|pass|fail|skipped|cancelled) ',line)]}
 results.append(result);print(json.dumps(result,ensure_ascii=False),flush=True)
(scratch/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if all(r['exit']==0 for r in results) else 1)
