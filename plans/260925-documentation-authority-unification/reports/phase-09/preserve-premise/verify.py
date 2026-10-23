#!/usr/bin/env python3
"""One scoped replay: two isolated runs, byte equality, identity/count conservation.
No test runner, CLI, Git writes or live state. Final-pin acceptance stays with Lead.
"""
import sys
sys.dont_write_bytecode = True
import collections, hashlib, json, pathlib, subprocess, tempfile
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
CENSUS = HERE.parent/'census-join'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    pin = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    assert not subprocess.check_output(['git','diff','--name-only','HEAD','--','docs','src','scripts','test','packages','apps'],cwd=ROOT).strip(), 'source drift outside records'
    scratch = pathlib.Path('/tmp/fgos-work/w1-d4');scratch.mkdir(parents=True,exist_ok=True)
    commands, comparisons = [], []
    with tempfile.TemporaryDirectory(prefix='double-replay-',dir=scratch) as name:
        base = pathlib.Path(name)
        for label, script, extra, owning, outputs in [
            ('census','join.py',['--rescan'],CENSUS,['join.json','residue.json','post-pin-literals.json']),
            ('preserve','proof.py',[],HERE,['proof.json','retire-with-tree.json','judgments.json','history-wrapper-proposals.json']),
        ]:
            stdouts = []
            for round in (1,2):
                out = base/(label+'-'+str(round))
                argv = ['python3','-B',str((owning/script).relative_to(ROOT)),*extra,'--out',str(out)]
                run = subprocess.run(argv,cwd=ROOT,capture_output=True)
                commands.append(dict(label=label,round=round,argv=argv,exit=run.returncode,stdout=run.stdout.decode(),stderr=run.stderr.decode()))
                assert run.returncode == 0, run.stderr.decode()
                stdouts.append(run.stdout)
            assert stdouts[0] == stdouts[1], label+' stdout drift'
            for output in outputs:
                a,b = [(base/(label+'-'+str(round))/output).read_bytes() for round in (1,2)]
                actual = (owning/output).read_bytes()
                assert a == b == actual, label+'/'+output+' byte drift'
                comparisons.append(dict(path=str((owning/output).relative_to(ROOT)),sha256=sha(a),bytes=len(a),runsByteIdentical=True,checkedInWorkingArtifactEqual=True))
        join = json.loads((CENSUS/'join.json').read_text())
        proof = json.loads((HERE/'proof.json').read_text())
        assert join['sourceCommit'] == proof['sourceCommit'] == pin
        assert len(join['rows']) == len({r['id'] for r in join['rows']}) == 1126
        assert collections.Counter(r['stage'] for r in proof['rows']) == {'step-03':4804,'step-04':609}
        assert len({r['rowId'] for r in proof['rows']}) == 5413
        assert len(proof['negativeDecisionProbes']) == 3 and all(r['actual'].startswith('park-') for r in proof['negativeDecisionProbes'])
        assert len(proof['physical']['negativePremiseProbes']) == 3 and all(r['rejected'] for r in proof['physical']['negativePremiseProbes'])
        assert all(r.get('blocker') and r.get('owner') for r in proof['rows'] if r['proposedDisposition'] != 'preserve')
        assert len(proof['zeroEdgeBatches']) == 27
        batch = json.loads((HERE.parent/'review-batches.json').read_text())
        # Discover batch shape without relying on display labels in a prose count.
        paths = set()
        def walk(value):
            if isinstance(value,dict):
                if isinstance(value.get('path'),str) and '/history/retired-engine/' in value['path']: paths.add(value['path'])
                for v in value.values(): walk(v)
            elif isinstance(value,list):
                for v in value: walk(v)
        walk(batch['g7Batches'])
        wrapper_files = {r['file'] for r in proof['rows'] if r['result']=='judgment-preserve-with-dated-note'}
        wrapper_coverage = dict(reviewBatchPaths=len(paths),coveredByProposals=len(paths & wrapper_files),missing=sorted(paths-wrapper_files))
        assert not wrapper_coverage['missing'], wrapper_coverage
    command = ['git','diff','--check']
    check = subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    assert check.returncode == 0, check.stderr
    commands.append(dict(label='diff-check',argv=command,exit=check.returncode,stdout=check.stdout,stderr=check.stderr))
    scripts = [CENSUS/'join.py',CENSUS/'test-locators.mjs',HERE/'proof.py',HERE/'physical-move.mjs',HERE/'verify.py']
    result = dict(sourceCommit=pin,status='records-replay-passed-not-gate-acceptance',commands=commands,comparisons=comparisons,
                  scriptDigests={str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in scripts},
                  counts={'G2':join['counts'],'G6':proof['counts']},wrapperReviewBatchCoverage=wrapper_coverage,
                  negativeProbes=dict(effectiveDecisionPredicate=3,copiedL12_121HistoricalPredicate=3),
                  noReadinessClaim=True,independentApproval=False,
                  notRun=['npm test','scripts/run-tests.mjs','cargo test --workspace','owning product tests (fixture Git writes / no need for runtime assertions in this records-only task)','fgos CLI / impact capability query (forbidden by brief)','pair accounting (Lead A1 custody)','final-pin F census and independent G2/G6 review','markdown preview (Lead custody)'])
    (HERE/'verification.json').write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    print(json.dumps({'byteIdenticalArtifacts':len(comparisons),'G2':join['counts'],'G6':proof['counts'],'wrapperCoverage':wrapper_coverage},sort_keys=True))


if __name__ == '__main__': main()
