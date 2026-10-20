"""Replay the unchanged RUL104 owning tests over exact pinned inputs in scratch."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,tempfile,hashlib,shutil
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
r=json.loads((P/'step-05-seam5-batch3-judgment-receipt.json').read_text());scratch=pathlib.Path(tempfile.mkdtemp(prefix='rul104-replay-',dir='/tmp/fgos-work'));env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.update(TMPDIR='/tmp/fgos-work',TMP='/tmp/fgos-work',TEMP='/tmp/fgos-work')
try:
 for i in r['currentInputs']:
  raw=subprocess.check_output(['git','show',r['inputCommit']+':'+i['path']],cwd=ROOT);assert len(raw)==i['bytes'] and hashlib.sha256(raw).hexdigest()==i['sha256'];p=scratch/i['path'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw);p.chmod(int(i['mode'][-3:],8))
 pr=subprocess.run(['node','--test','test/docs/rul104-anchor-phrase.test.mjs'],cwd=scratch,env=env);sys.exit(pr.returncode)
finally:shutil.rmtree(scratch)
