"""One-shot records authoring from HEAD; --apply renders the reviewed proposal.
No Git writes. Frozen source identity, historical snapshots and verdict files stay intact.
"""
import copy
import difflib
import json
from pathlib import Path
import subprocess
import sys
from bindings import *

TMP = Path('/tmp/fgos-work/w3-ledger-fix-brief')
TMP.mkdir(parents=True, exist_ok=True)
def baseline(file):
    return json.loads(subprocess.check_output(['git', 'show', 'HEAD:' + str(file)]))


docs = {f: baseline(f) for f in documents()}
before_docs = copy.deepcopy(docs)
gate = baseline(GATE)
old_gate = copy.deepcopy(gate)
links = supersessions(docs)
changed = [p for p in subprocess.check_output(['git', 'diff', '--name-only']).decode().splitlines()
           if p.startswith('docs/platform/')]
paths = {r['targetOwner'] for d in docs.values() for _, r in rows(d) if 'bindingSha256' in r}
paths.update(changed)
virtual = [{'path': 'HEAD:' + p, 'content': subprocess.check_output(['git', 'show', 'HEAD:' + p]).decode()}
           for p in changed]
cat = catalog(paths, virtual)['catalog']

# Provenance joins use the predecessor's shard/index/anchor/digest, never its hash.
refresh = baseline(P / 'reports/phase-09/resync-a/binding-refresh.json')
refresh_index = {(r['shard'], r['pointer']): r for r in refresh['refresh']}
gate_joins = []
for e in gate['changedBindings']:
    pointer = '/' + '/'.join(e['keys'])
    row = at(docs[e['file']], pointer)
    witness = row
    if identity(e['file'], pointer, e) != identity(e['file'], pointer, row):
        witness = refresh_index[(e['file'], pointer)]['before']
        assert identity(e['file'], pointer, e) == identity(e['file'], pointer, witness)
    ef, ep, er = effective(e['file'], pointer, row, docs, links)
    gate_joins.append({'file': e['file'], 'pointer': pointer, 'predecessorAnchor': e.get('targetAnchor'),
                       'predecessorDigest': e.get('targetUnitDigest'), 'resolvedFile': ef, 'resolvedPointer': ep})
    if (ef, ep) != (e['file'], pointer):
        for k in KEYS:
            row[k] = copy.deepcopy(er[k])
        # Composition was applied/replaced by the later current-content overlay.
        row.pop('targetComposition', None)
        if 'placement' in er:
            row['placement'] = copy.deepcopy(er['placement'])


def invalidate(row):
    row['reviewStatus'] = 'pending'
    for k in list(row):
        if k.startswith('reviewed') or k in ['reviewBindingSha256', 'reviewReceipt', 'reviewVerdict', 'reviewReport']:
            del row[k]


def placement(row, unit):
    us = cat[row['targetOwner']]['units']
    i = us.index(unit)
    fields = ['anchor', 'unitKind', 'title', 'textDigest', 'startLine', 'endLine', 'ancestry']
    w = lambda u: {k: u.get(k) for k in fields}
    return {'selected': w(unit), 'previous': w(us[i-1]) if i else None,
            'next': w(us[i+1]) if i+1 < len(us) else None, 'content': unit['text']}

# Rebind every assertion into changed units, including nested additionalBindings.
for file, doc in docs.items():
    for pointer, row in rows(doc):
        if row['targetOwner'] in changed and row.get('targetAnchor'):
            old_us = cat['HEAD:' + row['targetOwner']]['units']
            old = [u for u in old_us if u['anchor'] == row['targetAnchor'] and u['textDigest'] == row.get('targetUnitDigest')]
            if not old:
                # Explicit historical rows already superseded by an overlay remain preimages.
                assert identity(file, pointer, row) in links, (file, pointer, 'unresolved stale preimage')
                continue
            matches = [u for u in cat[row['targetOwner']]['units'] if u['anchor'] == row['targetAnchor']]
            assert len(matches) == 1
            u = matches[0]
            row['targetUnitDigest'], row['targetAncestry'] = u['textDigest'], u['ancestry']
            if 'placement' in row:
                row['placement'] = placement(row, u)
        if '/nativeIdentityGaps/' in pointer:
            matches = [(p, r) for p, r in rows(before_docs[file]) if not p.startswith('/nativeIdentityGaps/')
                       and r.get('targetOwner') == row['targetOwner'] and r.get('targetAnchor') == row['targetAnchor']
                       and all(r.get(k) == row.get(k) for k in ['sourcePath','sourceAnchor','sourceUnitDigest'])]
            assert len(matches) == 1, 'native gap must join its complete carriage binding, not an ordinal'
            predecessor_pointer, predecessor = matches[0]
            ef, ep, er = effective(file, predecessor_pointer, predecessor, docs, links)
            for k in KEYS:
                row[k] = copy.deepcopy(er[k])
            row['bindingInputSource'] = {'file': file, 'pointer': predecessor_pointer,
                                         'predecessorAnchor': predecessor['targetAnchor'],
                                         'predecessorDigest': predecessor['targetUnitDigest'],
                                         'resolvedFile': ef, 'resolvedPointer': ep}
        if row.get('claimId') == 'claim_4ff3a12817bb891341b26283460beea0' or (
                file.endswith('s8-observe-01.json') and pointer == '/claims/4'):
            row['targetAncestry'] = unit_for(row, cat)['ancestry']
        if row.get('successorGroup') and row.get('targetAnchor') is None:
            for k in KEYS:
                row.setdefault(k, None)
            row['successorGroupMemberDigests'] = sorted(m['unitDigest'] for m in row['successorGroup']['members'])
        if 'placement' in row and row.get('targetAnchor') and 'bindingSha256' in row:
            try:
                row['placement'] = placement(row, unit_for(row, cat))
            except AssertionError:
                assert identity(file, pointer, row) in links, (file, pointer, 'stale current placement')
        prior = at(before_docs[file], pointer)
        if 'bindingSha256' in row or any(prior.get(k) != row.get(k) for k in KEYS):
            row['bindingSha256'] = digest(row)
        if row != prior:
            invalidate(row)

# Explicit adjudication corrections, propagated to their source-bound records.
adj_path = P / 'reports/phase-09/resync-a/adjudications.json'
adj = baseline(adj_path)
adj['docs/specs/distribution.md']['unheaded-block-5']['reason'] = 'Doctor ID enumerations in legacy have drifted. Candidate rows 7/7b reconcile all 143 checks (135 literal IDs plus 8 loop-registered Git IDs) and 32 fixes, preserving explanatory prose and removing model-policy-tier-coverage. The loop registration is part of the same registry, not an exception.'
adj['docs/specs/runner.md']['unheaded-block-9']['reason'] = 'The fenced Historical source section 552ef3d6 retains the complete legacy direct Data Dictionary section byte-for-byte at HEAD, including its obsolete rigorToTier/maxTier wording. It is historical conservation only, not a second current contract. Current Seat Binding, pool and recovery/log corrections live only in runner/subcomponents/h-02842f76ffd2/spec.md.'
for row in docs[str(P / 'ledger/decisions/s13-resync-a.json')]['sourceBindings']:
    if (row['sourcePath'], row['sourceAnchor']) in [('docs/specs/distribution.md', 'unheaded-block-5'), ('docs/specs/runner.md', 'unheaded-block-9')]:
        row['disposition'].update(adj[row['sourcePath']][row['sourceAnchor']])
        invalidate(row)

# Refresh all residual placements/line accounting at current bytes. Never accept A34.
res_path = P / 'reports/phase-09/g0fix/partial-carry-residuals.json'
res = baseline(res_path)
for e in res['rows']:
    row = at(docs[e['file']], '/' + '/'.join(e['keys']))
    u = unit_for(row, cat)
    us = cat[row['targetOwner']]['units']; i = us.index(u)
    e['primaryTarget'] = {k: row.get(k) for k in KEYS}
    e['placement'] = {'path': row['targetOwner'], 'fileSha256': cat[row['targetOwner']]['fileSha256'],
                      'selected': u, 'previous': us[i-1] if i else None, 'next': us[i+1] if i+1 < len(us) else None}
    sl, tl = e['sourceWitness']['text'].splitlines(), u['text'].splitlines()
    e['opcodes'] = [list(x) for x in difflib.SequenceMatcher(None, sl, tl, autojunk=False).get_opcodes()]
    e['changedSourceLines'] = [{'sourceLineInUnit': j+1, 'text': sl[j]}
                             for tag,a,b,c,d in e['opcodes'] if tag in ['delete','replace']
                             for j in range(a,b) if sl[j].strip()]
    e['residualText'] = '\n'.join(x['text'] for x in e['changedSourceLines'])
    e['residualSha256'] = sha(e['residualText'])
    e['outOfScopeProposalOnly'] = False
    assert e['A34Accepted'] is False and e['reviewStatus'] == 'pending'
res['evaluatedHead'] = head()
render = lambda d: json.dumps(d, ensure_ascii=False, indent=2) + '\n'
res_bytes = render(res); res_sha = sha(res_bytes)
for doc in docs.values():
    for _, row in rows(doc):
        ref = row.get('residualRef')
        if ref and ref.get('path', ref.get('file')) == str(res_path):
            old_sha = ref['fileSha256']; old_digest = ref['targetUnitDigest']
            e = res['rows'][ref['row']]
            ref.update(fileSha256=res_sha, residualSha256=e['residualSha256'], targetUnitDigest=row['targetUnitDigest'])
            row['remainder'] = row['remainder'].replace(old_sha, res_sha).replace(old_digest, row['targetUnitDigest'])

for e in gate['changedBindings']:
    row = at(docs[e['file']], '/' + '/'.join(e['keys']))
    for k in KEYS + ['bindingSha256']:
        e[k] = copy.deepcopy(row.get(k))
    if 'successorGroupMemberDigests' in row:
        e['successorGroupMemberDigests'] = row['successorGroupMemberDigests']
    if 'targetComposition' not in row:
        e.pop('targetComposition', None)
    e['reviewStatus'] = 'pending'
encoding = copy.deepcopy(gate['bindingHashEncoding'])
encoding.update(keys=sorted(KEYS), serialization='JSON object with exactly the four named keys for individual bindings; group bindings additionally include successorGroupMemberDigests. Keys sorted lexicographically; compact comma/colon separators; ensure_ascii=false; absent base values null; arrays retain order except the lexicographically sorted group digest list (duplicates retained); UTF-8, exactly one LF, no BOM',
                headingAncestry='Self-inclusive: targetAncestry contains every ancestor heading and, for a heading unit, its own title as the last element. Parents-only is invalid.',
                groupNote='A null-anchor successorGroup adds successorGroupMemberDigests: the sorted list of every member unitDigest, retaining duplicate digests. Each member path/anchor/digest/ancestry is independently checked against current content.',
                groupKeys=sorted(KEYS + ['successorGroupMemberDigests']))
encoding.pop('python', None)
encoding['excluded'] = ['placement', 'reviewStatus', 'targetComposition', 'successorGroup metadata other than member digests']
gate['bindingHashEncoding'] = encoding

# Update the effective D1b receipt projection without rewriting its historical before inputs.
for e in refresh['refresh']:
    e['after'] = copy.deepcopy(at(docs[e['shard']], e['pointer']))
for o in refresh['outputs']:
    o['afterSha256'] = sha(render(docs[o['path']]))
refresh['currentRecipeSource'] = str(GATE) + '#bindingHashEncoding'
refresh['evaluatedHead'] = head()

migration_rows = []
for file, doc in docs.items():
    for pointer, row in rows(doc):
        old = at(before_docs[file], pointer)
        old_input = {k: old.get(k) for k in KEYS}
        old_computed = sha(json.dumps(old_input, sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\n')
        migration_rows.append({'file': file, 'pointer': pointer, 'id': row.get('claimId'),
                               'oldHashStored': 'bindingSha256' in old, 'hashStored': 'bindingSha256' in row,
                               'oldBindingSha256': old.get('bindingSha256', old_computed),
                               'newBindingSha256': digest(row), 'oldInput': old_input,
                               'input': payload(row), 'rowChanged': row != old})
outputs = {str(res_path): res_bytes, str(adj_path): render(adj),
           str(P / 'reports/phase-09/resync-a/binding-refresh.json'): render(refresh)}
for file, doc in docs.items():
    if doc != before_docs[file]:
        outputs[file] = render(doc)
# Preserve every byte of the gate register outside its two authorized fields.
raw = subprocess.check_output(['git', 'show', 'HEAD:' + str(GATE)]).decode()
for field, value in [('changedBindings', gate['changedBindings']), ('bindingHashEncoding', encoding)]:
    compact = lambda d: json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    old = '"' + field + '":' + compact(old_gate[field])
    assert raw.count(old) == 1
    raw = raw.replace(old, '"' + field + '":' + compact(value), 1)
outputs[str(GATE)] = raw
migration = {'version': 1, 'sourceHead': head(), 'bindingHashEncoding': encoding,
             'rows': migration_rows, 'gateJoins': gate_joins,
             'historicalSnapshotKeysExcluded': sorted(SNAPSHOTS),
             'qualification': 'All stored live binding hashes recomputed; supersedesBinding/priorReview/before/after are immutable historical inputs, not current hashes. No verdict is inherited or gate accepted.'}
outputs[str(R / 'recipe-migration.json')] = render(migration)
proposal = {'sourceHead': head(), 'outputs': outputs}
if '--apply' in sys.argv:
    previous = load(TMP / 'proposal.json')
    assert proposal == previous, 'proposal drift since inspection'
    for file, text in outputs.items():
        Path(file).write_text(text)
else:
    (TMP / 'proposal.json').write_text(render(proposal))
print(json.dumps({'mode': 'apply' if '--apply' in sys.argv else 'proposal', 'files': len(outputs),
                  'recomputedRows': len(migration_rows), 'storedHashes': sum(r['hashStored'] for r in migration_rows), 'changedRows': sum(r['rowChanged'] for r in migration_rows),
                  'gateRows': len(gate_joins), 'changedDocuments': changed}, indent=2))
