#!/usr/bin/env python3
"""Serial replay; only scratch/cache locations change, no checker predicate is patched."""
import sys
sys.dont_write_bytecode=True
import argparse, importlib.util, importlib.machinery, json, pathlib, tempfile, types
P=pathlib.Path(__file__).resolve().parent
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
SCRATCH=pathlib.Path('/tmp/fgos-work/l12-52');SCRATCH.mkdir(parents=True,exist_ok=True)
original_exec=importlib.machinery.SourceFileLoader.exec_module
original_path=pathlib.Path
original_tmp=tempfile.TemporaryDirectory

def scoped_exec(loader,module):
    original_exec(loader,module)
    if loader.path.endswith('/step-03-resolve.py'):
        module.pathlib=types.SimpleNamespace(Path=lambda x:original_path(SCRATCH/'anchor-cache' if str(x)=='/tmp/fgos-work/step03-anchor-cache' else x))
importlib.machinery.SourceFileLoader.exec_module=scoped_exec

def scoped_tmp(*args,**kwargs):
    if str(kwargs.get('dir'))=='/tmp/fgos-work':kwargs['dir']=str(SCRATCH)
    return original_tmp(*args,**kwargs)
tempfile.TemporaryDirectory=scoped_tmp

def load(name):
    spec=importlib.util.spec_from_file_location(name.replace('-','_'),P/name)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def save(name,value):(P/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['probes','full']);args=ap.parse_args()
    if args.mode=='probes':
        results=[]
        for path in sorted(P.glob('step-03*probes.py')):
            sys.argv=[str(path)]+(['--author-commit',PIN] if path.name=='step-03-probes.py' else [])
            out=load(path.name).main();assert out['allRejected'],path.name
            results.append({'suite':path.name,'result':out})
            print(path.name,out['negativeProbes'],'rejected',flush=True)
        # L12-51's existing focused form receipt had no executable suite.
        m=load('step-03-check.py');file='docs/platform/agent-coordination/spec.md'
        for old,expected in [('[docs/specs/runner.md](../../specs/runner.md)','[docs/platform/runner/spec.md](../runner/spec.md)'),('[docs/specs/work-state.md](../../specs/runner.md)','[docs/specs/work-state.md](../runner/spec.md)')]:
            assert m.form(old,file,'docs/platform/runner/spec.md',None)==expected
        out={'pin':PIN,'allRejected':True,'negativeProbes':sum(x['result']['negativeProbes'] for x in results),
             'inheritedNegativeProbes':sum(x['result']['negativeProbes'] for x in results if x['suite']!='step-03-l12-52-probes.py'),
             'newPositiveProbes':2,'newNegativeProbes':5,'formControlsReplayed':2,'suites':results}
        save('step-03-l12-52-probe-results.json',out)
        print(json.dumps({k:v for k,v in out.items() if k!='suites'}))
    else:
        m=load('step-03-check.py')
        m.SETS=tuple(p.stem.removeprefix('batch-') for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')))
        out=m.Checker(PIN).all(m.records())
        out.update(pin=PIN,checkedBatches=list(m.SETS),batchCount=len(m.SETS),
                   absentConcurrentBatches=[f'{i:03}' for i in range(114,123) if f'{i:03}' not in m.SETS],
                   checkerSourceSha256=m.sha((P/'step-03-check.py').read_bytes()),
                   resolverSourceSha256=m.sha((P/'step-03-resolve.py').read_bytes()),scratch=str(SCRATCH))
        save('step-03-l12-52-check-result.json',out)
        print(json.dumps({k:out[k] for k in ['batchCount','files','edges','failureCount','failures','notClosableSets','absentConcurrentBatches']},ensure_ascii=False))
        return bool(out['failureCount'])
    return 0
if __name__=='__main__':raise SystemExit(main())
