#!/usr/bin/env python3
"""Scoped misc replay: current bindings, reused registry census, G6 double run.
The combined G2/G6 verifier remains the final-pin owner's proof; this does not
refresh census outputs, gate projections, or certify uncommitted docs at --pin.
"""
import sys
sys.dont_write_bytecode = True
import hashlib, json, pathlib, re, subprocess, tempfile, textwrap
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[4]
P=pathlib.Path('plans/260925-documentation-authority-unification')
G6=P/'reports/phase-09/preserve-premise'
SCRATCH=pathlib.Path('/tmp/fgos-work/w5-misc-rework')
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
    code=(ROOT/'src/setup/registrations.mjs').read_text()
    literal_ids=re.findall(r'''registerCheck\(\{\s*id:\s*['"]([^'"]+)''',code)
    loops=re.findall(r'for \(const id of \[([^\]]+)\]\) \{\s*registerCheck\(\{ id,',code)
    loop_ids=[id for loop in loops for id in re.findall(r'''['"]([^'"]+)['"]''',loop)]
    assert len(re.findall(r'^\s*registerCheck\(\{',code,re.M))==len(literal_ids)+len(loops)
    assert len(literal_ids)==len(set(literal_ids))==136
    assert len(loops)==1 and len(loop_ids)==len(set(loop_ids))==5
    assert all(id.startswith('git-') for id in loop_ids)
    assert not set(literal_ids)&set(loop_ids)
    assert len(literal_ids)+len(loop_ids)==registrations['Check']==141
    split=dict(literal=len(literal_ids),loopRegistered=len(loop_ids),loopIds=loop_ids)
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
    # The G6 artifacts are pinned to the commit they record; replay them there, not at HEAD.
    g6pin=json.loads((ROOT/G6/'proof.json').read_text())['sourceCommit']
    with tempfile.TemporaryDirectory(prefix='double-',dir=SCRATCH) as tmp:
        base=pathlib.Path(tmp);stdouts=[]
        for n in [1,2]:
            stdouts.append(run(['python3','-B',str(G6/'proof.py'),'--pin',g6pin,'--out',str(base/str(n))]))
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
                sourcePinScope='G6 tracked source blobs at input HEAD; record inputs remain working-tree inputs. Binding refresh replays its original W4 preimage pin.',
                combinedVerifierResult=str(G6/'verification.json'),
                commands=commands,comparisons=comparisons,counts=proof['counts'],registrations=registrations,doctorCheckSplit=split,
                changedExampleRows=examples,selfLinkProposalsRemoved=self_links,
                noReadinessClaim=True,independentReview='pending',
                notRun=['npm test / scripts/run-tests.mjs / cargo workspace suite (forbidden or outside scoped record work)',
                        'fgos CLI, impact query, setup/doctor, lifecycle verbs (forbidden)',
                        'gate-register rejoin and pair accounting (final-pin Lead custody)',
                        'markdown preview (Lead custody; no extra service/state writes)'])
    (HERE/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(status=result['status'],byteIdenticalArtifacts=len(comparisons),counts=proof['counts'],registrations=registrations,doctorCheckSplit=split),sort_keys=True))


if __name__=='__main__':main()
