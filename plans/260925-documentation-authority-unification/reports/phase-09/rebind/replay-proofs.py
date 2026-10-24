#!/usr/bin/env python3
"""Replay scoped proofs before/after rebind, relocating only scratch plumbing.

No A/B, audit-ownership or combined G2/G6 replay: final-pin Lead custody.
No assertion, source pin, historical input or delivered artifact is substituted.
The test's hardcoded scratch prefixes are relocated in a temporary copy; this
is explicitly not a claim that its literal unadapted command passed.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import collections
import copy
import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess

ROOT = Path(__file__).resolve().parents[5]
P = Path('plans/260925-documentation-authority-unification')
HERE = ROOT/P/'reports/phase-09/rebind'
S = Path('/tmp/fgos-work/w5-rebind-apply')


def verify_applied():
    sys.path.insert(0, str(ROOT/P/'reports/phase-09/ledgerfix'))
    from bindings import at, digest, documents, sha
    report = json.loads((HERE/'rebindings.json').read_text())
    assert report['status'] == 'applied' and not report['blockers']
    records = report['rebindings']
    current = documents()
    before = {f: json.loads(subprocess.check_output(['git', 'show', report['inputHead']+':'+f],
                                               cwd=ROOT, text=True)) for f in {r['file'] for r in records}}
    restored = copy.deepcopy(current)
    kinds = collections.Counter()
    statuses = collections.Counter()
    for record in records:
        file, pointer = record['file'], record['pointer']
        old, row = at(before[file], pointer), at(current[file], pointer)
        assert record['applied']
        assert record['beforeRowSha256'] == sha(json.dumps(old, sort_keys=True, ensure_ascii=False, separators=(',', ':'))+'\n')
        assert row['claimId'] == old['claimId'] == record['claimId']
        assert row['targetOwner'] == record['targetOwnerAfter']
        assert row['targetAnchor'] == record['after']['anchor']
        assert row['targetUnitDigest'] == record['after']['digest']
        assert row['targetAncestry'] == record['after']['ancestry']
        assert row['bindingSha256'] == digest(row) == record['bindingSha256']
        selected = record['afterWitness']['selected']
        assert row['targetUnitDigest'] == selected['textDigest']
        assert row['targetAncestry'] == selected['ancestry'] + ([selected['title']] if selected['unitKind'] == 'heading' else [])
        assert row.get('reviewStatus') == record['reviewStatusAfter']
        if record['kind'] == 'anchor-only':
            assert record['before']['digest'] == record['after']['digest']
            assert {k:v for k,v in row.items() if k.startswith('review')} == record['priorReview']
        else:
            assert record['before']['digest'] != record['after']['digest']
            assert row['reviewStatus'] == 'pending'
            assert set(k for k in row if k.startswith('review')) == {'reviewStatus', 'reviewNote'}
        kinds[record['kind']] += 1
        statuses[(record['kind'], old.get('reviewStatus'))] += 1
        parent, key = pointer.rsplit('/', 1)
        container = at(restored[file], parent)
        container[int(key) if isinstance(container, list) else key] = old
    for file in before:
        assert restored[file] == before[file], ('unreported decision change', file)
    rereview = json.loads((HERE/'rereview-claim-ids.json').read_text())
    ids = [r['claimId'] for r in records if r['kind'] == 'content']
    assert rereview == dict(status='applied-pending-review', count=len(ids), claimIds=ids)
    assert report['counts']['applied'] == report['counts']['driftingRows'] == len(records)
    assert report['counts']['proposedByKind'] == dict(kinds)
    assert all(not c['newActivePairs'] for c in report['ownershipComparison'])
    h1 = [at(current[r['file']], r['pointer']) for r in records
          if r['claimId'] == 'claim_f8e2b48d6234ca8a73e15cdaad7d9c07']
    assert len(h1) == 1 and h1[0]['disposition'] == 'move' and h1[0]['reviewStatus'] == 'pending'
    assert h1[0]['targetAnchor'] == '0002-mô-hình-việc-phẳng-1'
    misc = ROOT/P/'reports/phase-09/misc-fix/rebind.py'
    owner = runpy.run_path(str(misc))
    pin = json.loads((misc.parent/'binding-refresh.json').read_text())['sourceHead']
    assert owner['check'](pin, restored) == owner['check'](pin, current)
    print(json.dumps(dict(applied=len(records), files=len(before), byKind=dict(kinds),
        priorStatuses=[dict(kind=k, status=s, rows=n) for (k,s),n in sorted(statuses.items())],
        rereview=len(ids), unreportedDecisionChanges=0, newActivePairs=0,
        preimageChecksBeforeAndAfter=True, h1Disposition='move-pending'), ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--label', required=True, choices=['before', 'after'])
    parser.add_argument('--recipes', action='store_true')
    parser.add_argument('--applied-only', action='store_true')
    args = parser.parse_args()
    os.chdir(ROOT)
    if args.applied_only:
        verify_applied()
        return 0
    scratch = S/args.label
    scratch.mkdir(parents=True, exist_ok=True)
    checks = json.loads((HERE/'checks.json').read_text()) if args.label == 'after' else {
        'sourceHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
        'commands': [],
        'scope': 'Records only. Scratch/output plumbing relocated; assertions and pins unchanged.',
        'notRun': ['A/B and audit-ownership (Lead after merge)',
                   'combined G2/G6 verifier and final-pin recomposition (Lead)',
                   'npm/cargo suites, lifecycle, setup/doctor, pair accounting, preview']}
    env = dict(os.environ)
    env.pop('CLAUDE_CODE_SESSION_ID', None)

    def run(label, argv, **metadata):
        proc = subprocess.run(argv, cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
        (scratch/(label+'.stdout')).write_text(proc.stdout)
        (scratch/(label+'.stderr')).write_text(proc.stderr)
        checks['commands'].append(dict(stage=args.label, label=label, argv=argv,
            exit=proc.returncode, stdout=proc.stdout, stderr=proc.stderr, **metadata))
        print(args.label, label, proc.returncode, flush=True)

    def adapted(name, path, replacements):
        original = ROOT/path
        source = original.read_text()
        for before, after in replacements:
            assert before in source, (name, before)
            source = source.replace(before, after)
        dest = scratch/name
        payload = scratch/(name+'.source')
        payload.write_text(source)
        dest.write_text('import sys\nsys.dont_write_bytecode=True\nfrom pathlib import Path\n' +
            'exec(compile(Path('+repr(str(payload))+').read_text(),'+repr(str(original))+',"exec"),'+
            '{"__name__":"__main__","__file__":'+repr(str(original))+'})\n')
        return str(dest)

    g6 = P/'reports/phase-09/preserve-premise'
    physical = scratch/'physical-move.mjs'
    physical.write_text((ROOT/g6/'physical-move.mjs').read_text()
        .replace('../../../../../src/', str(ROOT/'src')+'/')
        .replace('/tmp/fgos-work/w5-misc-rework/', str(scratch/'misc')+'/'))
    proof = adapted('preserve-proof.py', g6/'proof.py', [
        ('/tmp/fgos-work/w5-misc-rework', str(scratch/'misc')),
        ("str(HERE/'physical-move.mjs')", repr(str(physical)))])
    misc = adapted('misc-verify.py', P/'reports/phase-09/misc-fix/verify.py', [
        ('/tmp/fgos-work/w5-misc-rework', str(scratch/'misc')),
        ("str(G6/'proof.py')", repr(proof))])
    run('drift-check', ['python3', '-B', str(P/'reports/phase-09/rebind/rebind.py'), '--check'])
    run('misc-preimage-check', ['python3', '-B', str(P/'reports/phase-09/misc-fix/rebind.py'), '--check'])
    run('misc-verifier', ['python3', '-B', misc],
        adaptation='Scratch destinations and physical-move import resolution only. Original __file__/ROOT, HEAD pin and proof.json comparison retained.')
    if args.label == 'after':
        run('applied-records', ['python3', '-B', str(HERE/'replay-proofs.py'), '--label', 'after', '--applied-only'])
    if args.recipes:
        activation = json.loads(Path('/home/vantt/projects/forgentX/.fgos/installation/activation.json').read_text())
        env['FGOS_HOST_BIN'] = activation['releasePath']+'/bin/fgos'
        test = ROOT/'test/scripts/doc-rationale-reproduction.test.mjs'
        relocated = scratch/test.name
        relocated.write_text(test.read_text().replace('/tmp/fgos-work/', str(scratch)+'/'))
        run('recipe-tests', ['node', '--test', str(relocated)],
            requestedCommand='env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN='+env['FGOS_HOST_BIN']+
                ' node --test test/scripts/doc-rationale-reproduction.test.mjs',
            adaptation='Temporary copy changes hardcoded scratch prefix only; all test cases/assertions unchanged.',
            originalSha256=hashlib.sha256(test.read_bytes()).hexdigest())
    run('diff-check', ['git', 'diff', '--check'])
    (HERE/'checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n')
    return int(any(c['exit'] for c in checks['commands'] if c['stage'] == args.label))


if __name__ == '__main__':
    raise SystemExit(main())
