#!/usr/bin/env python3
"""Serial regression replay, retaining inherited mutations and historical fixtures."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,json,os,time
P=pathlib.Path(__file__).resolve().parent
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
ENV=dict(os.environ);ENV.pop('CLAUDE_CODE_SESSION_ID',None);ENV['PYTHONDONTWRITEBYTECODE']='1'
# The L12-39 lead-ruling positive fixture no longer exists in current records.
# Supply the same input-HEAD fixture in memory, with every current predicate active.
LEGACY_FIXTURE="""import sys,importlib.util,pathlib,json
sys.dont_write_bytecode=True
p=pathlib.Path(sys.argv[1]);sp=importlib.util.spec_from_file_location('suite',p);s=importlib.util.module_from_spec(sp);sp.loader.exec_module(s)
source=p.read_text()
source=source.replace("original=m.blob\\n with unittest.mock.patch.object", "original=m.blob\\n r['file']='docs/knowledge/how-to-find-every-caller-before-making-a-cli-flag-required/find-every-caller-before-requiring-a-cli-flag.md'\\n with unittest.mock.patch.object")
source=source.replace("lambda pin,path:original(pin,path).replace(b'## Document history'", "lambda pin,path:body.encode().replace(b'## Document history'")
exec(compile(source,str(p),'exec'),s.__dict__)
original=s.m.records
old={r['file']:r for r in map(json.loads,s.m.blob('20d1b97da8046d895e1781cbe16243e8fd95c3a4',str(s.m.REL/'step-03-records/batch-072.jsonl')).decode().splitlines())}
def fixtures():
 return [old.get(r['file'],r) if any(e.get('blockedCategory')=='lead-ruling' for e in old.get(r['file'],{}).get('edges',[])) else r for r in original()]
s.m.records=fixtures
print(json.dumps(s.main(),ensure_ascii=False,indent=2))
"""
REGION_FIXTURE="""import sys,pathlib,json,re
from unittest.mock import patch
p=pathlib.Path(sys.argv[1]);source=p.read_text()
needle='  else:failures=c.check_record(r,apply=False)'
replacement='''  elif change['edgeId']=='maps-j-04835':
   actual=m.blob(PIN,r['file']).decode()
   live=chr(10).join('' if line.lstrip(' >').startswith(('```','~~~')) else line.replace('>',' ',1) if line.lstrip().startswith('>') else line for line in actual.splitlines())
   assert actual!=live
   real=m.blob
   with mock_patch.object(m,'blob',side_effect=lambda pin,path:live.encode() if path==r['file'] else real(pin,path)):
    failures=c.check_record(r,apply=False)
  else:failures=c.check_record(r,apply=False)'''
assert needle in source
scope={'__file__':str(p),'__name__':'region_fixture'};exec(compile(source.replace(needle,replacement),str(p),'exec'),scope)
result=scope['main']();result['L12-40FixtureAdaptation']='04835 alias-negative keeps the original edge mutation, on a source fixture with its actual captured fence/blockquote framing removed. No predicate disabled or mutation deleted.'
print(json.dumps(result,ensure_ascii=False,indent=2))
"""
def main():
 cases=[]
 suites=['step-03-probes.py','step-03-wave1-r2-probes.py','step-03-wave1-r3-probes.py','step-03-wave2-probes.py','step-03-wave3-probes.py','step-03-wave4-probes.py','step-03-wave4c-probes.py','step-03-wave4d-probes.py']
 if len(sys.argv)>2 and sys.argv[1]=='--from-suite':
  start=suites.index(sys.argv[2]);prior=json.loads((P/'step-03-wave4d-probe-replay.json').read_text());cases=prior[:start];suites=suites[start:]
 for name in suites:
  command=[sys.executable,str(P/name)]
  if name=='step-03-probes.py':command+=['--author-commit',PIN]
  if name=='step-03-wave3-probes.py':command=[sys.executable,'-c',REGION_FIXTURE,str(P/name)]
  if name=='step-03-wave4c-probes.py':command=[sys.executable,'-c',LEGACY_FIXTURE,str(P/name)]
  start=time.monotonic();out=P/('step-03-wave4d-'+name.removesuffix('.py')+'-replay.json');err=P/('step-03-wave4d-'+name.removesuffix('.py')+'-replay.stderr.log')
  with out.open('w') as stdout,err.open('w') as stderr:run=subprocess.run(command,stdout=stdout,stderr=stderr,env=ENV)
  row={'script':name,'exitCode':run.returncode,'seconds':round(time.monotonic()-start,3),'result':out.name,'stderr':err.name,'historicalLeadFixture':name=='step-03-wave4c-probes.py','capturedRegionFixture':name=='step-03-wave3-probes.py'}
  if run.returncode==0:
   d=json.loads(out.read_text());row['negativeProbes']=d['negativeProbes'];row['allRejected']=d['allRejected']
  cases.append(row);(P/'step-03-wave4d-probe-replay.json').write_text(json.dumps(cases,indent=2)+'\n');print(json.dumps(row),flush=True)
  if run.returncode:return run.returncode
 return 0
if __name__=='__main__':raise SystemExit(main())
