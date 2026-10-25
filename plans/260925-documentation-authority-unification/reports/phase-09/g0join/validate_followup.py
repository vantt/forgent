#!/usr/bin/env python3
"""Owning data replay for this follow-up's authored decisions, not approval.

Uses the existing rebind extractor/hash/traversal. No Git writes, addons, pair
accounting, fixture writes or product tests. Run from repository root with -B.
"""
import json
from pathlib import Path
import runpy
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
P = Path('plans/260925-documentation-authority-unification')
sys.path.insert(0, str(HERE.parent / 'ledgerfix'))
from bindings import at, documents, rows, supersessions, effective, payload, digest, sha
R = runpy.run_path(str(HERE.parent / 'rebind/rebind.py'))


def main():
    docs = documents()
    report = json.loads((HERE.parent / 'rebind/followup-rebindings.json').read_text())
    links = supersessions(docs)
    owners = sorted({r['after']['targetOwner'] for r in report['changedRows']})
    cat = R['extract']({'paths': owners})['catalog']
    changed = set()
    for item in report['changedRows']:
        file, pointer = item['file'], item['pointer']
        row = at(docs[file], pointer)
        assert row['reviewStatus'] == 'pending', (file, pointer)
        assert payload(row) == item['after'], (file, pointer, 'report')
        assert payload(row['priorReview']['g0FollowupBefore']) == item['before']
        assert row['bindingSha256'] == digest(row)
        unit, = R['matches'](row, cat[row['targetOwner']]['units'])
        assert row['targetAncestry'] == unit['ancestry'] + ([unit['title']] if unit['unitKind'] == 'heading' else [])
        changed.add((file, pointer))
    assert len(changed) == 12
    ledger = str(P / 'ledger/decisions')
    for i, successor in ((0, 'claim_79fd3ee646dfed5ef624678125f9f306'),
                         (1, 'claim_f4dd6219e0abb10fd285ed7fb7b617b6')):
        row = docs[ledger + '/s7-step09-n1-runner-predecessors.json']['registryGaps'][i]
        witness = row['legacyWordingWitness']
        source = subprocess.check_output(['git','show',witness['commit'] + ':' + witness['path']]).decode()
        original = R['extract']({'virtual':[{'path':'source.md','content':source}]})['catalog']['source.md']
        unit, = [u for u in original['units'] if u['textDigest'] == row['sourceUnitDigest']]
        text = unit['text']
        for clause in row['changedClauses']:
            assert text.count(clause['oldWording']) == 1
            text = text.replace(clause['oldWording'], clause['newWording'], 1)
        target = R['extract']({'paths':[row['targetOwner']]})['catalog'][row['targetOwner']]
        unit, = R['matches'](row, target['units'])
        assert text == unit['text'], (i, 'unaccounted clause')
        assert 'b919e2b9b' in row['rationale'] and successor in row['rationale']
    drop = docs[ledger + '/s14-resync-b.json']['bindingRefresh'][8]
    assert drop['disposition'] == 'drop' and 'no content is carried' in drop['reason']
    assert drop['targetOwner'] == 'docs/platform/platform-foundations.md'
    assert effective(ledger + '/s11-preflip-carries.json', '/conservedClaims/7/bindings/0',
        at(docs[ledger + '/s11-preflip-carries.json'], '/conservedClaims/7/bindings/0'), docs, links)[:2] == (
            ledger + '/s14-resync-b.json', '/bindingRefresh/8')
    for current, previous in ((125, 20), (126, 21)):
        row = docs[ledger + '/g0-content-redecisions.json']['bindingRefresh'][current]
        assert row['supersedesBinding']['pointer'] == '/bindingRefresh/' + str(previous)
        assert 'the current decision is this row' in row['rationale']
        assert '/bindingRefresh/' + str(current) + '.' in row['rationale']
    path = P / 'reports/phase-09/import2/partial-carry-residuals.json'
    residuals = json.loads(path.read_text())
    before = json.loads(subprocess.check_output(['git','show',report['inputHead'] + ':' + str(path)]))
    for i, row in enumerate(residuals['rows'][:2]):
        binding = at(docs[row['file']], '/' + '/'.join(row['keys']))
        assert row['primaryTarget'] == payload(binding)
        assert row['reviewStatus'] == binding['reviewStatus'] == 'pending'
        live = R['extract']({'paths':[binding['targetOwner']]})['catalog'][binding['targetOwner']]
        unit, = R['matches'](binding, live['units'])
        assert row['placement'] == dict(path=binding['targetOwner'], fileSha256=live['fileSha256'],
                                       **R['witness'](live['units'], unit))
        assert row['residualText'] == before['rows'][i]['residualText']
        assert row['residualSha256'] == sha(row['residualText'])
    scan = json.loads((HERE.parent / 'rebind/g0-code-span-scan.json').read_text())
    assert scan['unresolved'] == 0 and scan['corruptFencesRestored'] == 2
    assert len(scan['restores']) == 2
    for item in scan['scanFiles']:
        assert item['sha256'] == sha(Path(item['path']).read_bytes()), item['path']
    print(json.dumps(dict(status='pass', changedLedgerRows=len(changed),
        contentRebindings=len(report['rebindings']), sourceClauseRows=2,
        explicitDrops=1, correctedEndpointRationales=2, refreshedResiduals=2,
        inlineSpans=scan['literalCounts']['codespan'], codeBlocks=scan['literalCounts']['code'],
        literalCandidates=len(scan['candidates']), unresolved=scan['unresolved'])))


if __name__ == '__main__':
    main()
