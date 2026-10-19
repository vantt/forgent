#!/usr/bin/env python3
"""Serial record checks/probes/light tests; outputs stay plan-local, scratch in /tmp."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,os,subprocess,time,datetime,hashlib,ast,argparse
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];ENV=dict(os.environ);ENV.pop('CLAUDE_CODE_SESSION_ID',None);ENV['TMPDIR']='/tmp/fgos-work';pathlib.Path(ENV['TMPDIR']).mkdir(exist_ok=True)
def run(command,name):
 start=time.monotonic()
 with (P/name).open('w') as out:r=subprocess.run(command,cwd=ROOT,env=ENV,stdout=out,stderr=subprocess.STDOUT)
 result={'command':['env','-u','CLAUDE_CODE_SESSION_ID',*command],'output':name,'exitCode':r.returncode,'elapsedSeconds':round(time.monotonic()-start,3)}
 print(json.dumps(result),flush=True);return result

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--only',nargs='*',default=[]);args=ap.parse_args();commands=[]
 prior=json.loads((P/'step-03-wave3-check-commands.json').read_text()) if (P/'step-03-wave3-check-commands.json').exists() else []
 history=json.loads((P/'step-03-wave3-check-attempts.json').read_text()) if (P/'step-03-wave3-check-attempts.json').exists() else prior.copy()
 for script,name in [('step-03-wave3-check.py','step-03-wave3-check-result.json'),('step-03-wave3-probes.py','step-03-wave3-probes-result.json'),('step-03-probes.py','step-03-wave3-inherited-probes-result.json'),('step-03-wave1-r2-probes.py','step-03-wave3-wave1-r2-probes-result.json'),('step-03-wave1-r3-probes.py','step-03-wave3-wave1-r3-probes-result.json'),('step-03-wave2-probes.py','step-03-wave3-wave2-probes-result.json')]:
  if args.only and script not in args.only:continue
  command=['python3','-B',str((P/script).relative_to(ROOT))]
  if script=='step-03-probes.py':command+=['--author-commit','ae141550c2e022310de7a0efea757580c0b2479f']
  commands.append(run(command,name))
 if not args.only:commands.append(run(['node','--test','test/scripts/doc-link-pass.test.mjs','test/scripts/check-doc-candidate-status.test.mjs','test/scripts/check-doc-constitution.test.mjs'],'step-03-wave3-light-tests.log'))
 history+=commands
 (P/'step-03-wave3-check-attempts.json').write_text(json.dumps(history,ensure_ascii=False,indent=2)+'\n')
 latest={r['output']:r for r in prior}
 for result in commands:latest[result['output']]=result
 commands=list(latest.values())
 (P/'step-03-wave3-check-commands.json').write_text(json.dumps(commands,ensure_ascii=False,indent=2)+'\n')
 return int(any(x['exitCode'] for x in commands))
if __name__=='__main__':raise SystemExit(main())
