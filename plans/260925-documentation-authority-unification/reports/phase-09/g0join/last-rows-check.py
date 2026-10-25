#!/usr/bin/env python3
"""Read-only scoped replay for heading/reference/placement corrections.

Uses existing ledger hash/traversal, rebind dual extraction and placement proof.
This is working-tree evidence, NOT the committed-only join or an approval.
"""
import json
from pathlib import Path
import re
import runpy
import subprocess
import sys

sys.dont_write_bytecode = True
P = Path('plans/260925-documentation-authority-unification')
B = P / 'reports/phase-09'
sys.path.insert(0, str(B / 'ledgerfix'))
from bindings import at, digest, documents, effective, payload, rows, sha, SNAPSHOTS, supersessions
from verify import check_current

R = runpy.run_path(str(B / 'rebind/rebind.py'))
J = runpy.run_path(str(B / 'g0join/join.py'))


def git(*args):
    return subprocess.check_output(['git', *args], text=True)


def main():
    docs = documents()
    links = supersessions(docs)
    pin = git('rev-parse', 'HEAD').strip()
    changed = []
    for file in git('diff', '--name-only').splitlines():
        if '/ledger/decisions/' not in file:
            continue
        before = json.loads(git('show', pin + ':' + file))
        old_rows = dict(rows(before))
        new_rows = dict(rows(docs[file]))
        assert old_rows.keys() <= new_rows.keys(), file
        for ptr, row in new_rows.items():
            old = old_rows.get(ptr)
            if old == row:
                continue
            assert row['reviewStatus'] == 'pending', (file, ptr)
            assert row['bindingSha256'] == digest(row), (file, ptr)
            assert effective(file, ptr, row, docs, links)[:2] == (file, ptr)
            if old:
                for field in SNAPSHOTS | {'claimId', 'sourcePath', 'sourceAnchor',
                                         'sourceUnitDigest', 'sourceAncestry', 'sourceContent'}:
                    assert old.get(field) == row.get(field), (file, ptr, field)
            else:
                assert ptr in ['/bindingRefresh/127', '/bindingRefresh/128']
                origin = row['supersedesBinding']
                original = at(docs[origin['shard']], origin['pointer'])
                assert original['claimId'] == row['claimId']
                assert original['sourceUnitDigest'] == row['sourceUnitDigest']
                assert original['targetUnitDigest'] == origin['targetUnitDigest']
            changed.append(dict(file=file, pointer=ptr,
                fields=sorted(k for k in (old or {}).keys() | row.keys()
                              if (old or {}).get(k) != row.get(k)),
                binding=payload(row), rowFingerprint=J['row_fingerprint'](docs[file], ptr)))
    assert len(changed) == 24, len(changed)
    owners = {x['binding']['targetOwner'] for x in changed}
    cat = R['self_inclusive'](R['extract']({'paths': sorted(owners)}))['catalog']
    for item in changed:
        check_current(at(docs[item['file']], item['pointer']), cat)

    # All current (non-snapshot) placements, not just the reported two.
    # Heading textDigest authenticates its direct section; placement.content is
    # only the heading line, so sha(content) != textDigest is expected there.
    counts = dict(placements=0, bodyHashes=0, compositeHeadings=0,
                  legacyShapes=0, legacyBodyHashes=0, legacyCompositeHeadings=0)
    mismatches = []
    for file, doc in docs.items():
        for ptr, row in rows(doc):
            placement = row.get('placement')
            if not placement:
                continue
            counts['placements'] += 1
            if 'selected' not in placement:
                counts['legacyShapes'] += 1
                assert 'content' in placement and 'startLine' in placement and 'endLine' in placement
                if re.match(r'^#{1,6}\s+', placement['content']):
                    counts['legacyCompositeHeadings'] += 1
                else:
                    assert sha(placement['content']) == row['targetUnitDigest'], (file, ptr)
                    counts['legacyBodyHashes'] += 1
                continue
            selected = placement['selected']
            if selected['unitKind'] == 'heading':
                counts['compositeHeadings'] += 1
                title = re.sub(r'^#{1,6}\s+', '', placement['content']).strip()
                assert title == selected['title'], (file, ptr, 'heading content')
            else:
                counts['bodyHashes'] += 1
                if sha(placement['content']) != selected['textDigest']:
                    mismatches.append(dict(file=file, pointer=ptr))
    assert not mismatches, mismatches

    # Every original g0 row, with historical digest-authenticated heading
    # preimages. Eight translations exist; only four lacked their names.
    audit = json.loads((B / 'g0join/last-rows-heading-audit.json').read_text())
    assert audit['rowsScanned'] == len(audit['rows']) == 127
    gfile = str(P / 'ledger/decisions/g0-content-redecisions.json')
    translations = []
    for item in audit['rows']:
        if not item.get('titleChanged'):
            continue
        row = at(docs[gfile], item['pointer'])
        assert item['sourceTitle'] in row['rationale'] and item['targetTitle'] in row['rationale']
        translations.append(item['pointer'])
    assert len(translations) == 8
    assert len(docs[gfile]['bindingRefresh']) == 129
    overlay_heading = at(docs[gfile], '/bindingRefresh/127')
    assert 'Mô hình domain (base-workflow + domain-extension)' in overlay_heading['rationale']
    assert '6. Domain Model' in overlay_heading['rationale']
    assert not re.search('Khai việc|Nộp vấn đề tự do', Path('docs/platform/work-state/spec.md').read_text())

    historical = []
    for name, ptr in [('s2-agent-coordination-truth-judgment', '/claims/404'),
                      ('s8-observe-01', '/claims/4'), ('s8-observe-01', '/registryGaps/2'),
                      ('s9-runner-01', '/claims/9'), ('s9-runner-01', '/registryGaps/33')]:
        row = at(docs[str(P / ('ledger/decisions/' + name + '.json'))], ptr)
        source = row['rationale'].splitlines()[0]
        m = re.fullmatch(r'Source: (.*):(\d+)-(\d+)#(.*) \(historical lines at ([a-f0-9]{40})\); unit SHA256 (.*)\.', source)
        assert m, source
        path, start, end, anchor, commit, unit_digest = m.groups()
        data = R['extract']({'virtual': [dict(path=path, content=git('show', commit + ':' + path))]})
        unit, = [u for u in data['catalog'][path]['units'] if u['anchor'] == anchor and u['textDigest'] == unit_digest]
        assert (unit['startLine'], unit['endLine']) == (int(start), int(end))
        historical.append(dict(file=name, pointer=ptr, source=source))

    rebindings = json.loads((B / 'rebind/last-rows-rebindings.json').read_text())
    for item in rebindings['rebindings']:
        row = at(docs[item['file']], item['pointer'])
        assert row == item['after'], (item['file'], item['pointer'], 'rebind receipt')
    residual_path = P / 'reports/phase-09/import2/partial-carry-residuals.json'
    assert residual_path.read_text() == git('show', pin + ':' + str(residual_path))
    residuals = json.loads(residual_path.read_text())['rows']
    for index, residual in enumerate(residuals[:2]):
        row = at(docs[residual['file']], '/' + '/'.join(residual['keys']))
        assert residual['primaryTarget'] == payload(row)
        assert sha(residual['residualText']) == residual['residualSha256']
        assert row['residualRef'] == str(residual_path) + '#/rows/' + str(index)
        assert row['residualRef'] in row['remainder']

    # Do not pretend the unchanged committed pin contains worker edits.
    joined = json.loads((B / 'g0join/last-rows-join-head.json').read_text())
    assert joined['pin'] == pin
    changed_keys = {(x['file'], x['pointer']) for x in changed}
    open_rows = [(r['file'], r['pointer']) for r in joined['rows'] if r['errors']]
    assert len(open_rows) == 3 and set(open_rows) <= changed_keys
    unaffected = 0
    awaiting = []
    for old in joined['rows']:
        row = at(docs[old['file']], old['pointer'])
        file, ptr, row = effective(old['file'], old['pointer'], row, docs, links)
        if (file, ptr) not in changed_keys:
            assert not old['errors'], old
            assert J['row_fingerprint'](docs[file], ptr) == old['rowFingerprint']
            unaffected += 1
        else:
            fingerprint = J['row_fingerprint'](docs[file], ptr)
            assert fingerprint != old['rowFingerprint'], (file, ptr)
            awaiting.append(dict(file=file, pointer=ptr, rowFingerprint=fingerprint))
    for item in changed:
        if item['pointer'] in ['/bindingRefresh/127', '/bindingRefresh/128'] and item['file'] == gfile:
            awaiting.append(dict(file=gfile, pointer=item['pointer'], rowFingerprint=item['rowFingerprint'],
                                 reason='New effective overlay; no independent verdict yet.'))
    assert not git('diff', '--cached', '--name-only').strip()
    assert git('rev-parse', 'HEAD').strip() == pin
    print(json.dumps(dict(status='pass', inputHead=pin, changedRows=changed,
        currentChangedTargetsAndPlacementsVerified=len(changed), placementScan=counts,
        bodyContentHashMismatches=mismatches, translatedHeadingRows=translations,
        additionalOverlayRowsAudited=['/bindingRefresh/127', '/bindingRefresh/128'],
        missingTitleRationalesCorrected=['/bindingRefresh/45', '/bindingRefresh/47',
                                       '/bindingRefresh/115', '/bindingRefresh/117'],
        historicalCoordinatesVerified=historical, unchangedResidualsVerified=2,
        committedJoinOpenRows=[dict(file=f, pointer=p) for f, p in open_rows],
        unchangedApprovedEffectiveRows=unaffected, changedJoinRowsAwaitingReview=awaiting,
        unrelatedOpenCommittedRows=0,
        unrelatedPreexistingPlacementDriftNotChanged=rebindings['unrelatedPreexistingPlacementDriftNotChanged'],
        proofBoundary='Committed join reads only HEAD, not the working tree. Rerun after runner commit; independent review is still required. No author approval or synthetic Git history.'),
        ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
