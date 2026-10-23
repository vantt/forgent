"""Read-only scoped replay, not an independent semantic approval or global G0 pass.
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0fix/verify.py
Only disposable files under /tmp/fgos-work/w2-g0fix-brief/ are written.
"""
import copy
import difflib
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

P = Path('plans/260925-documentation-authority-unification')
OUT = P / 'reports/phase-09/g0fix'
TMP = Path('/tmp/fgos-work/w2-g0fix-brief')
TMP.mkdir(parents=True, exist_ok=True)
KEYS = ['targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry']

def load(p):
    return json.loads(Path(p).read_text())

def sha(x):
    return hashlib.sha256(x.encode() if isinstance(x, str) else x).hexdigest()

def payload(r):
    return {k: r.get(k) for k in KEYS}

def bh(r):
    return sha(json.dumps(payload(r), ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n')

def at(d, keys):
    for k in keys:
        d = d[int(k)] if isinstance(d, list) else d[k]
    return d

def live(f, keys):
    return at(load(f), keys)

def git_json(pin, f):
    return json.loads(subprocess.check_output(['git', 'show', pin + ':' + str(f)]))

migration = load(OUT / 'recipe-migration.json')
pin = migration['sourceCommit']
gate_path = P / 'reports/phase-08/step-08-preflip-gates.json'
gate, old_gate = load(gate_path), git_json(pin, gate_path)
assert {k: v for k, v in gate.items() if k not in ['changedBindings', 'bindingHashEncoding']} == {k: v for k, v in old_gate.items() if k != 'changedBindings'}, 'frozen register fields changed'
assert gate['bindingHashEncoding'] == migration['bindingHashEncoding']
compact = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))
raw = gate_path.read_text()
encoding_fragment = '"bindingHashEncoding":' + compact(gate['bindingHashEncoding']) + ','
assert raw.count(encoding_fragment) == 1
restored = raw.replace(encoding_fragment, '', 1).replace('"changedBindings":' + compact(gate['changedBindings']), '"changedBindings":' + compact(old_gate['changedBindings']), 1)
assert restored.encode() == subprocess.check_output(['git', 'show', pin + ':' + str(gate_path)]), 'bytes outside the two allowed register fields changed'
assert len(old_gate['changedBindings']) == migration['originalRegisterRows'] == 191
key = lambda r: (r['file'], tuple(r['keys']))
index = {key(r): r for r in gate['changedBindings']}
assert len(index) == len(gate['changedBindings']) == migration['currentRegisterRows'] == 257
original = {key(r) for r in old_gate['changedBindings']}
assert original <= index.keys()
d1 = load(P / 'reports/phase-09/carries/binding-refresh.json')['rows']
assert {(r['shard'], (r['collection'], str(r['index']))) for r in d1} <= index.keys()
needs = load(OUT / 'needs-writes.json')
pilot = needs['needsWrites'][0]
assert Path(pilot).read_bytes() == subprocess.check_output(['git', 'show', pin + ':' + pilot]), 'out-of-scope pilot changed'
assert live(pilot, ['registryGaps', '4']) == needs['proposedRecord']['before']
assert needs['proposedRecord']['after']['targetOwner'] == 'docs/platform/work-state/contracts/cli-io-contract.md'

# Replay both composed patches and exact rollback without modifying candidate docs.
carry = next(r for r in load(P / 'reports/phase-09/composition/patch-specs.json')['patches'] if r['id'] == 'carry:credential-store-setup')
base = next(r for r in load(P / 'reports/phase-08/step-07-composed-patches.json')['patches'] if r['path'] == carry['path'])
content = Path(carry['path']).read_bytes()
with tempfile.TemporaryDirectory(prefix='replay-', dir=TMP) as scratch:
    dest = Path(scratch) / carry['path']; dest.parent.mkdir(parents=True)
    dest.write_bytes(content)
    for p in [base, carry]:
        before = dest.read_bytes(); assert sha(before) == p['beforeSha256']
        forward = subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], input=p['diff'].encode(), cwd=scratch, capture_output=True)
        assert forward.returncode == 0, forward.stdout + forward.stderr
        after = dest.read_bytes(); assert sha(after) == p['expectedAfterSha256']
        rollback = subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], input=p['rollbackDiff'].encode(), cwd=scratch, capture_output=True)
        assert rollback.returncode == 0 and dest.read_bytes() == before
        dest.write_bytes(after)
    content = dest.read_text()
virtual_key = carry['path'] + '@' + carry['id'] + '.md'
proofs = load(OUT / 'binding-proofs.json')['rows']
residuals = load(OUT / 'partial-carry-residuals.json')['rows']
repairs = load(OUT / 'binding-repairs.json')['repairs']
source_proofs = load(OUT / 'source-proof.json')['rows']
paths = set()
for e in proofs:
    if 'placement' in e:
        paths.add(e['placement']['path'])
    for m in e.get('groupMembers', []):
        paths.add(m['path'])
for e in repairs:
    paths.add(e['priorPlacementAtInput']['path'])
additional = [b for e in d1 for b in live(e['shard'], [e['collection'], str(e['index'])]).get('additionalBindings', [])]
paths.update(b['targetOwner'] for b in additional)
virtual = [{'path': virtual_key, 'content': content}]
paths.discard(virtual_key)
history_keys = {}
for e in source_proofs:
    h = (e['commit'], e['path'])
    if h not in history_keys:
        vk = 'historical-' + str(len(history_keys)) + '.md'; history_keys[h] = vk
        virtual.append({'path': vk, 'content': subprocess.check_output(['git', 'show', h[0] + ':' + h[1]]).decode()})
req = {'paths': sorted(paths), 'virtual': virtual, 'bindingRows': [m['input'] for m in migration['rows']] + additional}
extracted = json.loads(subprocess.check_output(['node', str(OUT / 'extract-units.mjs')], input=json.dumps(req).encode()))
catalog = extracted['catalog']
assert extracted['extractors'] == load(OUT / 'extractor-proof.json')['extractors']
assert extracted['bindingDigests'] == [m['newBindingSha256'] for m in migration['rows']] + [b['bindingSha256'] for b in additional], 'independent Node/Python hash recipes disagree'
for b in additional:
    assert bh(b) == b['bindingSha256']
    us = catalog[b['targetOwner']]['units']
    assert any(u['anchor'] == b['targetAnchor'] and u['textDigest'] == b['targetUnitDigest'] for u in us)

def check_placement(w):
    c = catalog[w['path']]
    assert c['fileSha256'] == w['fileSha256']
    u = w['selected']; us = c['units']
    matches = [v for v in us if v['anchor'] == u['anchor'] and v['textDigest'] == u['textDigest'] and v['ancestry'] == u['ancestry']]
    assert len(matches) == 1 and matches[0] == u, 'full unit witness differs'
    i = us.index(matches[0])
    assert w['previous'] == (us[i-1] if i else None), 'previous neighbour differs'
    assert w['next'] == (us[i+1] if i+1 < len(us) else None), 'next neighbour differs'
    return u

# Independently authenticate historical file/unit/placement data.
for e in source_proofs:
    c = catalog[history_keys[(e['commit'], e['path'])]]
    assert c['fileSha256'] == e['fileSha256']
    w = {'path': history_keys[(e['commit'], e['path'])], **{k: e[k] for k in ['fileSha256', 'selected', 'previous', 'next']}}
    check_placement(w)
source_by_id = {e['id']: e for e in source_proofs}

pilot_hash_gaps = []
for m in migration['rows']:
    k = key(m); r = live(*k); e = index[k]
    assert r['claimId'] == e['id'] == m['id']
    assert payload(r) == m['input'] == {k: e[k] for k in KEYS}
    assert bh(r) == e['bindingSha256'] == m['newBindingSha256']
    assert e['reviewStatus'] == 'pending'
    if k[0] != pilot:
        assert r['bindingSha256'] == bh(r)
    else:
        assert r.get('bindingSha256') is None
        pilot_hash_gaps.append(m['id'])
assert len(pilot_hash_gaps) == 2
assert {key(r) for r in migration['rows'] if r['wasInOriginal191']} == original
for e in proofs:
    r = live(e['file'], e['keys'])
    if 'placement' in e:
        u = check_placement(e['placement'])
        assert u['anchor'] == r['targetAnchor'] and u['textDigest'] == r['targetUnitDigest']
        assert u['ancestry'] == r['targetAncestry'] or u['unitKind'] == 'heading' and u['ancestry'] + [u['title']] == r['targetAncestry']
        if e['state'] == 'composed-after-state':
            assert r['targetComposition']['specId'] == carry['id'] and r['targetComposition']['expectedAfterSha256'] == sha(content)
            assert index[key(e)]['targetComposition'] == r['targetComposition']
            assert e['placement']['path'] == virtual_key
    else:
        assert len(e['groupMembers']) == r['successorGroup']['memberCount'] == 8
        for w, member in zip(e['groupMembers'], r['successorGroup']['members']):
            u = check_placement(w)
            assert u['anchor'] == member['anchor'] and u['textDigest'] == member['unitDigest'] and u['text'] == member['text']
for e in repairs:
    check_placement(e['placement']); check_placement(e['priorPlacementAtInput'])

# Exact source/target line accounting: a stale digest or omitted line rejects.
def check_residual(e, current, witness=None):
    assert e['primaryTarget'] == payload(current), 'stale residual target'
    s = source_by_id[e['id']]['selected']
    assert s['textDigest'] == current['sourceUnitDigest'] == e['sourceUnitDigest']
    assert s['text'] == e['sourceWitness']['text']
    u = check_placement(e['placement'])
    sl, tl = s['text'].splitlines(), u['text'].splitlines()
    changed = []
    for tag, a, b, c, d in difflib.SequenceMatcher(None, sl, tl, autojunk=False).get_opcodes():
        if tag in ['delete', 'replace']:
            changed += [{'sourceLineInUnit': i+1, 'text': sl[i]} for i in range(a, b) if sl[i].strip()]
    assert changed == e['changedSourceLines'], 'changed source line coverage incomplete'
    assert '\n'.join(x['text'] for x in changed) == e['residualText']
    assert sha(e['residualText']) == e['residualSha256']
    assert e['A34Accepted'] is False and e['reviewStatus'] == 'pending'
    return len(changed)

line_counts = {}
residual_sha = sha((OUT / 'partial-carry-residuals.json').read_bytes())
for i, e in enumerate(residuals):
    r = live(e['file'], e['keys']) if not e['outOfScopeProposalOnly'] else needs['proposedRecord']['after']
    line_counts[e['id']] = check_residual(e, r)
    assert r['residualRef']['row'] == i and r['residualRef']['fileSha256'] == residual_sha
    assert r['residualRef']['residualSha256'] == e['residualSha256']
    assert r['residualRef']['targetUnitDigest'] == r['targetUnitDigest']
    assert r['targetUnitDigest'] in r['remainder'] and residual_sha in r['remainder']
assert len(residuals) == 15 and sum(e['outOfScopeProposalOnly'] for e in residuals) == 1
sweep = load(OUT / 'partial-carry-sweep.json')['rows']
assert len(sweep) == 27
for e in sweep:
    baseline = at(git_json(e['step0Commit'], e['file']), e['keys'])
    assert payload(baseline) == e['step0Binding']
    r = live(e['file'], e['keys'])
    if 'existingRemainder' in e:
        assert payload(r) == e['step0Binding'] and e['reboundSinceStep0'] is False
        assert r['remainder'] == e['existingRemainder']
# Only these decision subobjects may differ. No source/native ID or historical review rewrite.
edits = load(OUT / 'record-edits.json')['rows']
changed_files = {e['file'] for e in edits}
for f in changed_files:
    old = git_json(pin, f); expected = copy.deepcopy(old)
    for e in [e for e in edits if e['file'] == f]:
        assert at(old, e['keys']) == e['before']
        parent = at(expected, e['keys'][:-1]); last = e['keys'][-1]
        parent[int(last) if isinstance(parent, list) else last] = e['after']
        assert e['before']['claimId'] == e['after']['claimId'] and e['before'].get('sourceUnitDigest') == e['after'].get('sourceUnitDigest')
        assert e['after']['reviewStatus'] == 'pending'
        assert not any(e['after'].get(k) for k in ['reviewedBy', 'reviewedAt', 'reviewReport', 'reviewBindingSha256'])
    assert expected == load(f), 'unrecorded shard mutation'

# Negative probes exercise rejecting checks, not test-only production bypasses.
negative = []
def rejects(label, action):
    try:
        action()
    except AssertionError:
        negative.append(label)
    else:
        raise AssertionError('negative probe did not reject: ' + label)

sample = next(e for e in residuals if e['id'].startswith('claim_20a58044'))
r = live(sample['file'], sample['keys'])
bad = copy.deepcopy(sample); bad['primaryTarget']['targetUnitDigest'] = '0' * 64
rejects('stale residual target digest', lambda: check_residual(bad, r))
bad = copy.deepcopy(sample); bad['changedSourceLines'].pop()
rejects('omitted provider-capacity historical source line', lambda: check_residual(bad, r))
bad = copy.deepcopy(proofs[0]['placement']); bad['next'] = None
rejects('wrong immediate neighbour', lambda: check_placement(bad))
bad = copy.deepcopy(proofs[0]['placement']); bad['selected']['textDigest'] = '0' * 64
rejects('wrong unit digest', lambda: check_placement(bad))
first = migration['rows'][0]
def wrong_recipe():
    assert sha(json.dumps(first['input'], sort_keys=True, ensure_ascii=False)) == first['newBindingSha256']
rejects('legacy spaced JSON without LF recipe', wrong_recipe)
print(json.dumps({'status': 'scoped-replay-pass; global task blocked by declared pilot needsWrites', 'sourceCommit': pin, 'originalRegisterRows': 191, 'currentRegisterRows': len(index), 'd1RebindRowsIndexed': len(d1), 'changedLedgerRecords': len(edits), 'changedLedgerFiles': len(changed_files), 'dualExtractorAgreement': True, 'independentNodePythonHashAgreement': True, 'd1AdditionalBindingsVerified': len(additional), 'composedPatchForwardRollback': 2, 'authenticatedHistoricalSources': len(source_proofs), 'partialCarriesSweptInLedger': 26, 'partialCarriesRefreshedInLedger': 14, 'unchangedSinceStep0': 12, 'pilotResidualProposalOnly': 1, 'pilotLedgerHashGaps': pilot_hash_gaps, 'changedSourceLinesById': line_counts, 'negativeProbesRejected': negative, 'needsWrites': needs['needsWrites'], 'independentReview': 'pending; no approval or gate closure'}, ensure_ascii=False, indent=2))
