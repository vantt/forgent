#!/usr/bin/env python3
"""Replay existing proofs with output plumbing confined to this brief's scratch.
Run from the repo root. Results: /tmp/fgos-work/w5-rebind/checks.json.
No assertion, source pin, checker input, baseline or decision is substituted.
Literal original commands cannot obey their hardcoded scratch paths AND this
brief's narrower scratch boundary; these scoped reruns are labelled explicitly.
"""
import sys
sys.dont_write_bytecode = True
import json, os, pathlib, subprocess
ROOT=pathlib.Path.cwd()
P=pathlib.Path('plans/260925-documentation-authority-unification')
S=pathlib.Path('/tmp/fgos-work/w5-rebind')
S.mkdir(parents=True,exist_ok=True)
results=[]

def run(label,argv,env=None):
    proc=subprocess.run(argv,text=True,capture_output=True,env=env,timeout=300)
    stderr='\n'.join(line for line in proc.stderr.splitlines() if 'exec(compile(' not in line)+'\n' if proc.stderr else ''
    (S/(label+'.stdout')).write_text(proc.stdout)
    (S/(label+'.stderr')).write_text(stderr)
    results.append(dict(label=label,argv=argv,exit=proc.returncode,
        stdout=proc.stdout if len(proc.stdout)<30000 else 'Large stdout summarized separately; no successful audit claim.',stderr=stderr))
    print(label,proc.returncode,flush=True)
    return proc


def adapted(name,relative,replacements):
    original=ROOT/P/relative
    source=original.read_text()
    for before,after in replacements:
        assert before in source,(name,before)
        source=source.replace(before,after)
    dest=S/name
    dest.write_text('import sys\nsys.dont_write_bytecode=True\n'+
        'exec(compile('+repr(source)+','+repr(str(original))+',"exec"),'+
        '{"__name__":"__main__","__file__":'+repr(str(original))+'})\n')
    return str(dest)


rebind=adapted('misc-rebind.py','reports/phase-09/misc-fix/rebind.py',[
    ('/tmp/fgos-work/w4-misc-fix-brief',str(S/'misc'))])
physical=S/'physical-move.mjs'
physical.write_text((ROOT/P/'reports/phase-09/preserve-premise/physical-move.mjs').read_text()
    .replace('../../../../../src/',str(ROOT/'src')+'/')
    .replace('/tmp/fgos-work/w4-misc-fix-brief/',str(S/'misc')+'/'))
proof=adapted('preserve-proof.py','reports/phase-09/preserve-premise/proof.py',[
    ('/tmp/fgos-work/w4-misc-fix-brief',str(S/'misc')),
    ('/tmp/fgos-work/w2-d4b',str(S/'preserve')),
    ("str(HERE/'physical-move.mjs')",repr(str(physical)))])
join=adapted('join.py','reports/phase-09/census-join/join.py',[
    ('/tmp/fgos-work/w2-d4b',str(S/'preserve'))])
misc=adapted('misc-verify.py','reports/phase-09/misc-fix/verify.py',[
    ('/tmp/fgos-work/w4-misc-fix-brief',str(S/'misc')),
    ("str(P/'reports/phase-09/misc-fix/rebind.py')",repr(rebind)),
    ("str(G6/'proof.py')",repr(proof)),
    ("(HERE/'checks.json').write_text","(pathlib.Path("+repr(str(S/'misc-checks.json'))+")).write_text")])
preserve=adapted('preserve-verify.py','reports/phase-09/preserve-premise/verify.py',[
    ('/tmp/fgos-work/w2-d4b',str(S/'preserve')),
    ('str((owning/script).relative_to(ROOT))','('+repr(join)+" if label=='census' else "+repr(proof)+')'),
    ("(HERE/'verification.json').write_text","(pathlib.Path("+repr(str(S/'preserve-verification.json'))+")).write_text")])
auditor=adapted('audit-report.py','reports/phase-08/audit-report.py',[
    ("Path('/tmp/fgos-work')","Path("+repr(str(S))+")")])
env=dict(os.environ)
env.pop('CLAUDE_CODE_SESSION_ID',None)
run('misc-preimage-check',['python3','-B',rebind,'--check'],env)
run('misc-verifier',['python3','-B',misc],env)
run('preserve-verifier',['python3','-B',preserve],env)
audit=run('audit-report',['python3','-B',auditor],env)
if audit.stdout:
    value=json.loads(audit.stdout)
    results[-1]['auditSummary']=[dict(manifest=m['manifest'],commands=m['commands'],
        failingRows=len(m['failingRows']),ownership=m['ownership'],checks=m['checks'],
        checkStderr=(pathlib.Path(value['scratch'])/pathlib.Path(m['manifest']).name.replace('-reproduction.json','')/'checks.mjs.stderr').read_text())
        for m in value['manifests']]
activation=json.loads(pathlib.Path('/home/vantt/projects/forgentX/.fgos/installation/activation.json').read_text())
env['FGOS_HOST_BIN']=activation['releasePath']+'/bin/fgos'
test=ROOT/'test/scripts/doc-rationale-reproduction.test.mjs'
copy=S/'doc-rationale-reproduction.test.mjs'
copy.write_text(test.read_text().replace('/tmp/fgos-work/',str(S)+'/'))
run('recipe-tests',['node','--test',str(copy)],env)
run('check',['python3','-B',str(P/'reports/phase-09/rebind/rebind.py'),'--check'],env)
run('diff-check',['git','diff','--check'],env)
result=dict(sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
    outputPlumbingOnly='Original __file__, ROOT, inputs and assertions retained. Only scratch prefixes, scratch-relative module import resolution, and final report destinations relocated. Scoped reruns, not literal-command pass claims.',
    recipesTestHost=env['FGOS_HOST_BIN'],commands=results)
(S/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
raise SystemExit(0 if all(c['exit']==0 for c in results) else 1)
