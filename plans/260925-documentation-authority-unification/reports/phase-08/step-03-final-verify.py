#!/usr/bin/env python3
"""Serial final replay. No record mutation; all scratch paths stay under final/."""
import sys
sys.dont_write_bytecode=True
import importlib.util, importlib.machinery, pathlib, tempfile, types, json, argparse, hashlib
P=pathlib.Path(__file__).resolve().parent
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
SCRATCH=pathlib.Path('/tmp/fgos-work/final');SCRATCH.mkdir(parents=True,exist_ok=True)
original_exec=importlib.machinery.SourceFileLoader.exec_module
original_path=pathlib.Path;original_tmp=tempfile.TemporaryDirectory

def scoped_exec(loader,module):
    original_exec(loader,module)
    if loader.path.endswith('/step-03-resolve.py'):
        module.pathlib=types.SimpleNamespace(Path=lambda x:original_path(SCRATCH/'anchor-cache' if str(x)=='/tmp/fgos-work/step03-anchor-cache' else x))
importlib.machinery.SourceFileLoader.exec_module=scoped_exec

def scoped_tmp(*args,**kwargs):
    if str(kwargs.get('dir','')).startswith('/tmp/fgos-work'):kwargs['dir']=str(SCRATCH)
    return original_tmp(*args,**kwargs)
tempfile.TemporaryDirectory=scoped_tmp

def load(name):
    spec=importlib.util.spec_from_file_location(name.replace('-','_'),P/name)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def save(name,value):(P/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['probes','full']);args=ap.parse_args()
    if args.mode=='probes':
        results=[]
        for path in sorted(P.glob('step-03*probes.py')):
            sys.argv=[str(path)]+(['--author-commit',PIN] if path.name=='step-03-probes.py' else [])
            out=load(path.name).main();assert out['allRejected'],path.name
            results.append({'suite':path.name,'sha256':digest(path),'result':out})
            print(path.name,out['negativeProbes'],'rejected',flush=True)
        m=load('step-03-check.py');file='docs/platform/agent-coordination/spec.md'
        for old,expected in [('[docs/specs/runner.md](../../specs/runner.md)','[docs/platform/runner/spec.md](../runner/spec.md)'),('[docs/specs/work-state.md](../../specs/runner.md)','[docs/specs/work-state.md](../runner/spec.md)')]:assert m.form(old,file,'docs/platform/runner/spec.md',None)==expected
        out={'pin':PIN,'allRejected':True,'negativeProbes':sum(x['result']['negativeProbes'] for x in results),'formControlsReplayed':2,'checkerSha256':digest(P/'step-03-check.py'),'suites':results}
        save('step-03-final-probe-results.json',out);print('Total rejected:',out['negativeProbes'])
    else:
        m=load('step-03-check.py');m.SETS=tuple(f'{i:03}' for i in range(1,131));rs=m.records();out=m.Checker(PIN).all(rs)
        out.update(batchCount=len(m.SETS),checkedBatches=list(m.SETS),openLeadRulingEdgesPerSet={'batch-'+b:[e['edgeId'] for r in rs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in m.SETS},checkerSha256=digest(P/'step-03-check.py'),resolverSha256=digest(P/'step-03-resolve.py'),recordFiles=[{'path':str(p.relative_to(m.ROOT)),'sha256':digest(p)} for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl'))])
        save('step-03-final-check-result.json',out)
        print(json.dumps({k:out[k] for k in ['batchCount','files','edges','failureCount','failures','notClosableSets']},ensure_ascii=False));return bool(out['failureCount'])
    return 0
if __name__=='__main__':raise SystemExit(main())
