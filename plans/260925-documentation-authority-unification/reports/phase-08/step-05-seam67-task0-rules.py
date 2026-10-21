"""R28 transitive governance ownership and actual R22 patch replay binding."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def read(f):return json.loads((P/f).read_text())
def governance(record=None):
 if record is None:record=next(json.loads(l) for l in (P/'step-05-records/tests-judgment-batch6.jsonl').open() if json.loads(l)['file']=='test/scripts/check-doc-candidate-status.test.mjs')
 source=subprocess.check_output(['git','show',record['authorInputCommit']+':'+record['file']],cwd=ROOT,text=True).splitlines();slots=record['authorAddedReferences']
 for n,text in [(94,'governanceBaselineFields(REPO_ROOT)'),(163,'checkCandidateMetadata')]:
  e=next(e for e in slots if e.get('referenceId')=='author-s67-governance-baseline-'+str(n));s=e['sourceSpans'][0]
  assert e['admission']=='ADMIT' and e['disposition']=='parked' and e['r26Unit']=='docs/doc-governance.md'
  assert s['line']==n and text in source[n-1] and source[n-1][s['columnStart']-1:s['columnEndExclusive']-1]==s['text']
  if n==163:
   for w in e['readerChain']:
    body=subprocess.check_output(['git','show',record['authorInputCommit']+':'+w['file']],cwd=ROOT,text=True).splitlines();assert w['operation'] in body[w['line']-1]
 assert next(e for e in record['dynamicTraces'] if e['id']=='dynamic-031746')['admission']=='REJECT'
 return True
def replay(spec=None):
 if spec is None:spec=next(s for s in read('step-05-seam5-batch2-cutover-specs.json')['patches'] if s['file']=='test/docs/decisions-corpus-retired.test.mjs')
 p=spec['r22Replay'];assert p['status']=='pass' and p['equalOutcomes'] and p['inputCommit']==spec['inputCommit'];assert p['sourceSha256']==sha(spec['oldText'])==spec['sourceSha256'];assert p['expectedAfterSha256']==sha(spec['newText'])==spec['expectedAfterSha256'];assert p['coCutPaths']==spec['coCutPaths']
 log=(ROOT/p['logPath']).read_bytes();assert sha(log)==p['logSha256'];result=json.loads(log.decode().splitlines()[-1]);assert result['equalOutcomes'] and result['inputCommit']==spec['inputCommit'] and result['results']==p['sides'];assert [r['side'] for r in result['results']]==['current','candidate']
 assert all(r['exit']==0 and r['outcomes'] for r in result['results']) and result['results'][0]['outcomes']==result['results'][1]['outcomes']
 return True
