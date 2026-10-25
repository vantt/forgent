#!/usr/bin/env python3
"""Replay the bounded follow-up authoring using the existing rebind door.

No git writes or pair accounting. Writes only changed ledger rows and the two
explicitly authorized residuals, plus the rebind receipt beside this script.
"""
import copy
import difflib
import json
from pathlib import Path
import runpy
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = Path('plans/260925-documentation-authority-unification')
R = runpy.run_path(str(HERE / 'rebind.py'))
sys.path.insert(0, str(HERE.parent / 'ledgerfix'))
from bindings import at, documents, rows, supersessions, effective, payload, digest


def main():
    # One-shot authoring witness, not a reusable migration mechanism. Refuse a
    # replay over already-authored rows rather than nesting/overwriting history.
    assert R['git']('rev-parse', 'HEAD').strip() == '0d200a3cd799c21688b8574646a6baae71300d27', 'replay only at the recorded input pin'
    docs = documents()
    for file, doc in docs.items():
        assert json.loads(R['git']('show', 'HEAD:' + file)) == doc, ('dirty ledger', file)
    residual_input = P / 'reports/phase-09/import2/partial-carry-residuals.json'
    assert (ROOT / residual_input).read_bytes() == subprocess.check_output(
        ['git', 'show', 'HEAD:' + str(residual_input)], cwd=ROOT), 'dirty residual input'
    before = copy.deepcopy(docs)
    ledger = str(P / 'ledger/decisions')
    owner = 'docs/platform/runner/architecture/h-7af1f0242611.md'
    source_pin = '2f0d4a5502f0259da212d840abd49ec6a95f725d'
    source = subprocess.check_output(['git', 'show', source_pin + ':' + owner], cwd=ROOT).decode()
    catalog = R['extract']({'paths': [owner], 'virtual': [{'path': 'source.md', 'content': source}]})['catalog']
    for i in (0, 1):
        row = docs[ledger + '/s7-step09-n1-runner-predecessors.json']['registryGaps'][i]
        old = next(u for u in catalog['source.md']['units'] if u['textDigest'] == row['sourceUnitDigest'])
        new = next(u for u in catalog[owner]['units'] if u['textDigest'] == row['targetUnitDigest'])
        a, b = old['text'].splitlines(), new['text'].splitlines()
        row['changedClauses'] = [dict(oldWording='\n'.join(a[x:y]), newWording='\n'.join(b[z:w]),
            changeSources=['docs/specs/runner.md@0d200a3cd799c21688b8574646a6baae71300d27',
                           'docs/specs/seat-binding.md'])
            for op, x, y, z, w in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op != 'equal']
        row['legacyWordingWitness'] = dict(commit=source_pin, path=owner, unit=old)
        provenance = row['priorReview']['g0ReworkBefore']['rationale']
        row['rationale'] = (provenance + ' Follow-up: changedClauses now start at the bound source '
            + row['sourceUnitDigest'] + ', not the intermediate N1 text. They account for every citation '
            're-cite and the direct-tier Seat Binding replacement of rigorToTier. Current target '
            + owner + '#' + new['anchor'] + ' SHA256 ' + new['textDigest'] + '; independent review pending.')
        row['reviewStatus'] = 'pending'
    drop = docs[ledger + '/s14-resync-b.json']['bindingRefresh'][8]
    original = drop['supersedesBinding']
    cat = R['extract']({'paths': [original['targetOwner']]})['catalog']
    unit = next(u for u in cat[original['targetOwner']]['units'] if u['anchor'] == original['targetAnchor']
                and u['textDigest'] == original['targetUnitDigest'])
    drop.update(R['binding'](original['targetOwner'], unit))
    drop['bindingSha256'] = digest(drop)
    drop['disposition'] = 'drop'
    drop['reason'] = ('Explicit drop of the erroneous reference-004047 foundation binding 0: its reader '
        'reads runner and work-state, not platform-foundations. The target fields retain only the '
        'authenticated dropped-locus witness; no content is carried here and no Work 0032 alias is '
        'asserted. Work 0032 Team Harness remains owned once by s11-preflip-carries.json '
        '/conservedClaims/7/bindings/2, and Runner 0032 Iron Law by bindings/3. No test/path migration '
        'or assertion deletion is authorized. Independent review of this drop is pending.')
    drop['reviewStatus'] = 'pending'
    for current, previous in ((125, 20), (126, 21)):
        row = docs[ledger + '/g0-content-redecisions.json']['bindingRefresh'][current]
        tail = row['rationale'].split('Current rationale at ', 1)[1]
        row['rationale'] = (f'Supersede overlay {ledger}/g0-content-redecisions.json#/bindingRefresh/{previous}; '
            f'the current decision is this row, {ledger}/g0-content-redecisions.json#/bindingRefresh/{current}. '
            'Earlier s14/s15 predecessors remain in this continuous chain. Current rationale at ' + tail)
        row['reviewStatus'] = 'pending'
    # Rebind only effective endpoints whose literal bytes changed. Historical
    # origins and supersedesBinding preimages stay byte-immutable.
    owners = ['docs/platform/workflow/spec.md', 'docs/platform/component-boundary.md']
    cat = R['extract']({'paths': owners})['catalog']
    links = supersessions(docs)
    rebindings = []
    for file, doc in docs.items():
        for pointer, row in rows(doc):
            if row.get('targetOwner') not in owners:
                continue
            ef, ep, current = effective(file, pointer, row, docs, links)
            if (ef, ep) != (file, pointer) or R['matches'](row, cat[row['targetOwner']]['units']):
                continue
            owner = row['targetOwner']
            versions = R['history'](owner, [row])
            version = next(v for v in versions if R['matches'](row, v['units']))
            old = R['matches'](row, version['units'])[0]
            new, method = R['locate'](version['units'], old, cat[owner]['units'], row.get('sourceUnitDigest'))
            binding = R['binding'](owner, new)
            rebindings.append(dict(file=file, pointer=pointer, before=payload(row), after=binding,
                beforeCommit=version['commit'], beforeWitness=R['witness'](version['units'], old),
                afterWitness=R['witness'](cat[owner]['units'], new), method=method))
            row.update(binding, bindingSha256=digest(binding), reviewStatus='pending')
            key = 'rationale' if 'rationale' in row else 'reason'
            row[key] = row.get(key, '') + (' L13-25.1: restore the fenced-code literal to source bytes '
                '(not a navigable link); rebind through rebind.py extract/history/locate/binding. '
                'Only this code-literal restoration changes content; independent re-review pending.')
    residual_path = ROOT / P / 'reports/phase-09/import2/partial-carry-residuals.json'
    residuals = json.loads(residual_path.read_text())
    residual_before = copy.deepcopy(residuals)
    for residual in residuals['rows'][:2]:
        pointer = '/' + '/'.join(residual['keys'])
        row = at(docs[residual['file']], pointer)
        row['reviewStatus'] = 'pending'
        cat = R['extract']({'paths': [row['targetOwner']]})['catalog'][row['targetOwner']]
        unit, = R['matches'](row, cat['units'])
        residual['primaryTarget'] = {k: row[k] for k in ('targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry')}
        residual['placement'] = dict(path=row['targetOwner'], fileSha256=cat['fileSha256'],
                                   **R['witness'](cat['units'], unit))
        residual['reviewStatus'] = 'pending'
    changes = []
    for file, doc in docs.items():
        if doc == before[file]:
            continue
        assert file.startswith(ledger + '/'), file
        for pointer, row in rows(doc):
            old = at(before[file], pointer)
            if row != old:
                row.setdefault('priorReview', {})['g0FollowupBefore'] = copy.deepcopy(old)
                changes.append(dict(file=file, pointer=pointer, before=payload(old), after=payload(row),
                    disposition=row.get('disposition'), reviewStatus=row['reviewStatus']))
        (ROOT / file).write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    residual_path.write_text(json.dumps(residuals, ensure_ascii=False, indent=2) + '\n')
    report = dict(inputHead=R['git']('rev-parse', 'HEAD').strip(), rebindings=rebindings,
        changedRows=changes, residualRows=[dict(index=i, before=r['primaryTarget'],
            after=residuals['rows'][i]['primaryTarget'], residualTextUnchanged=
            r['residualText'] == residuals['rows'][i]['residualText']) for i,r in enumerate(residual_before['rows'][:2])])
    (HERE / 'followup-rebindings.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(changedRows=len(changes), rebindings=len(rebindings), residuals=2)))


if __name__ == '__main__':
    main()
