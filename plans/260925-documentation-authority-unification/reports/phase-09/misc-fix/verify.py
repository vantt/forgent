#!/usr/bin/env python3
"""Scoped W4 replay: current bindings, reused registry census, G6 double run.
The combined G2/G6 verifier remains the final-pin owner's proof; this does not
refresh census outputs, gate projections, or certify uncommitted docs at --pin.
"""
import sys
sys.dont_write_bytecode = True
import hashlib, json, pathlib, subprocess, tempfile, textwrap
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[4]
P=pathlib.Path('plans/260925-documentation-authority-unification')
G6=P/'reports/phase-09/preserve-premise'
SCRATCH=pathlib.Path('/tmp/fgos-work/w4-misc-fix-brief')
sha=lambda b:hashlib.sha256(b).hexdigest()


def main():
    commands=[]
    def run(argv,**kw):
        proc=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,**kw)
        commands.append(dict(argv=argv,exit=proc.returncode,stdout=proc.stdout,stderr=proc.stderr))
        assert proc.returncode==0,proc.stderr
        return proc.stdout
    pin=run(['git','rev-parse','HEAD']).strip()
    run(['python3','-B',str(P/'reports/phase-09/misc-fix/rebind.py'),'--check'])
    # Reuse the owning registry enumerator verbatim, not an alternate check count.
    owner=ROOT/P/'reports/phase-09/resync-a/verify-resync.mjs'
    code=owner.read_text().split('// Enumerate literal AND loop-registered ids')[1].split('\n',1)[1].split('\nconst retired=')[0]
    script="import fs from 'node:fs'; import assert from 'node:assert/strict'; const read=p=>fs.readFileSync(p,'utf8');\n"+code+"\nconsole.log(JSON.stringify(registrations));"
    census=SCRATCH/'registry.mjs';census.parent.mkdir(parents=True,exist_ok=True);census.write_text(script)
    registrations=json.loads(run(['node',str(census)]))
    spec=(ROOT/'docs/platform/packaging-distribution/spec.md').read_text()
    nav=(ROOT/'docs/reading-map.md').read_text()
    assert 'git rev-parse --path-format=absolute --git-common-dir' not in spec
    assert 'git rev-parse --git-common-dir' not in nav
    clause="from the route's reconcile-scan, each with its pane id"
    assert clause in spec and clause in (ROOT/'docs/specs/distribution.md').read_text()
    assert 'plans/reports/' not in nav
    for link in ['docs/platform/yaml-document/spec.md','docs/platform/config/spec.md']:
        assert (ROOT/link).is_file()
    baseline=run(['git','show',pin+':docs/reading-map.md'])
    assert nav.split('## 3. Transitional Note')[1].split('## 4. Related Files')[0]==baseline.split('## 3. Transitional Note')[1].split('## 4. Related Files')[0]
    assert nav.count('fgos-coding-knowledge')==baseline.count('fgos-coding-knowledge')
    comparisons=[]
    outputs=['proof.json','retire-with-tree.json','judgments.json','history-wrapper-proposals.json']
    with tempfile.TemporaryDirectory(prefix='double-',dir=SCRATCH) as tmp:
        base=pathlib.Path(tmp);stdouts=[]
        for n in [1,2]:
            stdouts.append(run(['python3','-B',str(G6/'proof.py'),'--pin',pin,'--out',str(base/str(n))]))
        assert stdouts[0]==stdouts[1]
        for name in outputs:
            a=(base/'1'/name).read_bytes();b=(base/'2'/name).read_bytes()
            assert a==b==(ROOT/G6/name).read_bytes(),name
            comparisons.append(dict(path=str(G6/name),sha256=sha(a),bytes=len(a),runsByteIdentical=True,deliveredBytesEqual=True))
    proof=json.loads((ROOT/G6/'proof.json').read_text())
    # Run the owning G6 assertions verbatim, without re-running G2 or changing
    # its outputs. No second copy of the historical-predicate cases.
    owner=(ROOT/G6/'verify.py').read_text()
    marker="        assert collections.Counter(r['stage'] for r in proof['rows'])"
    section=marker+owner.split(marker,1)[1].split("\n    command = ['git','diff','--check']",1)[0]
    header="import collections,json,pathlib,re,subprocess\n"
    header+="HERE=pathlib.Path("+repr(str(ROOT/G6))+")\npin="+repr(pin)+"\n"
    header+="proof=json.loads((HERE/'proof.json').read_text())\n"
    header+="def source(file): return subprocess.check_output(['git','show',pin+':'+file],text=True)\n"
    assertions=SCRATCH/'g6-owning-assertions.py'
    assertions.write_text(header+textwrap.dedent(section)+"\nprint('owning G6 assertions passed')\n")
    run(['python3','-B',str(assertions)])
    examples=['f00167','f08807','f07822','f08072','f08073']
    self_links=['f07697','f08033','f08047']
    run(['git','diff','--check'])
    result=dict(status='scoped-replay-passed-not-gate-acceptance',sourceCommit=pin,
                sourcePinScope='G6 tracked source blobs at input HEAD; changed working-tree docs are separately authenticated by binding-refresh.json, not included in the G6 pin.',
                commands=commands,comparisons=comparisons,counts=proof['counts'],registrations=registrations,
                changedExampleRows=examples,selfLinkProposalsRemoved=self_links,
                noReadinessClaim=True,independentReview='pending',
                notRun=['combined G2/G6 verify.py (requires fresh G2 artifacts and clean source bytes at final pin; outside this brief)',
                        'npm test / scripts/run-tests.mjs / cargo workspace suite (forbidden or outside scoped record work)',
                        'fgos CLI, impact query, setup/doctor, lifecycle verbs (forbidden)',
                        'gate-register rejoin and pair accounting (final-pin Lead custody)',
                        'markdown preview (Lead custody; no extra service/state writes)'])
    (HERE/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(status=result['status'],byteIdenticalArtifacts=len(comparisons),counts=proof['counts'],registrations=registrations),sort_keys=True))


if __name__=='__main__':main()
