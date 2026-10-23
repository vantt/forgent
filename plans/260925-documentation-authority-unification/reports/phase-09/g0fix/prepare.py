"""Build records and guarded, exact JSON replacements; no repository mutation here.
Run from the repository root with python3 -B. Output is restricted to this directory.
"""
import copy
import difflib
import hashlib
import json
from pathlib import Path
import subprocess

P = Path('plans/260925-documentation-authority-unification')
OUT = P / 'reports/phase-09/g0fix'
SCRATCH = Path('/tmp/fgos-work/w2-g0fix-brief')
SCRATCH.mkdir(parents=True, exist_ok=True)

def load(p):
    return json.loads(Path(p).read_text())

def dump(x):
    return json.dumps(x, ensure_ascii=False, indent=2) + '\n'

def save(name, x):
    (OUT / name).write_text(dump(x))

def sha(x):
    return hashlib.sha256(x.encode() if isinstance(x, str) else x).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args]).decode().rstrip('\n')

def at(d, keys):
    for k in keys:
        d = d[int(k)] if isinstance(d, list) else d[k]
    return d

def walk(x, keys=()):
    if isinstance(x, dict):
        if 'claimId' in x and 'disposition' in x:
            yield keys, x
        for k, v in x.items():
            if k not in ['priorReview']:
                yield from walk(v, keys + (k,))
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from walk(v, keys + (str(i),))

KEYS = ['targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry']

def payload(r):
    return {k: r.get(k) for k in KEYS}

def binding_hash(r):
    return sha(json.dumps(payload(r), sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\n')

pin = git('rev-parse', 'HEAD')
gatefile = P / 'reports/phase-08/step-08-preflip-gates.json'
gate = load(gatefile)
if 'bindingHashEncoding' in gate:
    raise SystemExit('Preparation requires the unmodified author input pin; use verify.py to replay the migrated tree. No evidence was overwritten.')
files = {str(f): load(f) for f in sorted((P / 'ledger/decisions').glob('*.json'))}
pilot = str(P / 'pilot/decisions/b-io-contract.json')
files[pilot] = load(pilot)  # Read-only: an explicit out-of-scope proposal, never applied.
before_files = copy.deepcopy(files)
rows = [(f, keys, r) for f, d in files.items() for keys, r in walk(d)]
by_id = {r['claimId']: (f, keys, r) for f, keys, r in rows}
find = lambda prefix: next(v for k, v in by_id.items() if k.startswith(prefix))
d1 = load(P / 'reports/phase-09/carries/binding-refresh.json')['rows']
# Reuse the reviewed composition chain, but materialize only in scratch/in memory.
composed = load(P / 'reports/phase-08/step-07-composed-patches.json')['patches']
carry = next(s for s in load(P / 'reports/phase-09/composition/patch-specs.json')['patches'] if s['id'] == 'carry:credential-store-setup')
base = next(s for s in composed if s['path'] == carry['path'])

def patch(text, diff):
    source = text.splitlines(keepends=True)
    lines = diff.splitlines(keepends=True)
    result, cursor, i = [], 0, 0
    import re
    while i < len(lines):
        m = re.match(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', lines[i])
        if not m:
            i += 1
            continue
        start = int(m[1]) - 1 if int(m[1]) else 0
        assert start >= cursor
        result.extend(source[cursor:start]); cursor = start; i += 1
        while i < len(lines) and not lines[i].startswith('@@ '):
            kind, body = lines[i][0], lines[i][1:]; i += 1
            if kind == '\\':
                continue
            assert kind in ' +-'
            if kind != '+':
                assert source[cursor] == body, 'zero-fuzz preimage mismatch'
                cursor += 1
            if kind != '-':
                result.append(body)
    result.extend(source[cursor:])
    return ''.join(result)

content = Path(carry['path']).read_text()
chain = []
for s in [base, carry]:
    assert sha(content) == s['beforeSha256']
    after = patch(content, s['diff'])
    assert sha(after) == s['expectedAfterSha256']
    assert patch(after, s['rollbackDiff']) == content
    chain.append({k: s[k] for k in ['path', 'beforeSha256', 'expectedAfterSha256'] } | {'specId': s.get('id', s.get('patchSpecId')), 'forwardAndRollbackExact': True})
    content = after
virtual_key = carry['path'] + '@' + carry['id'] + '.md'
# Hash and place all register/D1 targets, all partial carries, and both sibling destinations.
paths = {r.get('targetOwner') for _, _, r in rows if r.get('disposition') == 'partial-carry'}
for e in gate['changedBindings']:
    r = at(files[e['file']], e['keys'])
    paths.add(r['targetOwner'])
    for m in r.get('successorGroup', {}).get('members', []):
        paths.add(m['path'])
for e in d1:
    paths.add(at(files[e['shard']], [e['collection'], str(e['index'])])['targetOwner'])
paths.update(['docs/platform/observe/spec.md', 'docs/platform/work-state/contracts/cli-io-contract.md', 'docs/specs/runner.md'])
request = {'paths': sorted(paths - {None}), 'virtual': [{'path': virtual_key, 'content': content}]}
result = json.loads(subprocess.check_output(['node', str(OUT / 'extract-units.mjs')], input=json.dumps(request).encode()))
catalog = result['catalog']
save('extractor-proof.json', {'sourceCommit': pin, 'extractors': result['extractors'], 'agree': True, 'files': [{'path': p, 'sha256': c['fileSha256'], 'units': len(c['units'])} for p, c in catalog.items()], 'compositionChain': chain})

def locate(path, predicate):
    matches = [u for u in catalog[path]['units'] if predicate(u)]
    assert len(matches) == 1, (path, 'non-unique passage', len(matches))
    return matches[0]

def placement(path, u):
    us = catalog[path]['units']; i = us.index(u)
    return {'path': path, 'fileSha256': catalog[path]['fileSha256'], 'selected': u, 'previous': us[i-1] if i else None, 'next': us[i+1] if i+1 < len(us) else None}

repairs = []

def rebind(prefix, owner, unit, reason, virtual=None):
    f, ks, r = find(prefix)
    old = copy.deepcopy(r)
    r.update(targetOwner=owner, targetAnchor=unit['anchor'], targetUnitDigest=unit['textDigest'], targetAncestry=unit['ancestry'])
    r['rationale'] += ' W2 G0 correction: ' + reason + ' Full content and immediate neighbours: reports/phase-09/g0fix/binding-repairs.json. Historical prose above is not the current binding. Independent review pending; no approval carry.'
    if virtual:
        r['targetComposition'] = {'specId': carry['id'], 'specRef': str(P / 'reports/phase-09/composition/patch-specs.json'), 'predecessorSpecId': base['patchSpecId'], 'beforeSha256': carry['beforeSha256'], 'expectedAfterSha256': carry['expectedAfterSha256'], 'state': 'composed-after-state; not applied to workspace'}
    repairs.append({'file': f, 'keys': list(ks), 'id': r['claimId'], 'beforeBinding': payload(old), 'afterBinding': payload(r), 'reason': reason, 'placement': placement(virtual or owner, unit), 'alreadyReboundAtInput': payload(old) == payload(r)})

rules = locate('docs/specs/runner.md', lambda u: u['text'].startswith('- **RUL77 ') and 'RUL97' in u['text'])
for prefix in ['claim_4d5b7f73', 'claim_d5ba1eda']:
    rebind(prefix, 'docs/specs/runner.md', rules, 'The complete RUL77 onward Business Rules passage is selected by its RUL77 opening and RUL78..RUL97 identities, not RUL76 or the old ordinal. Both neighbours and real Business Rules ancestry agree.')
comp = locate('docs/platform/component-boundary.md', lambda u: u['text'].startswith('| Component |') and 'Config' in u['text'])
rebind('claim_af89c4e6', 'docs/platform/component-boundary.md', comp, 'W0 already rebound the complete Current High-Level Components table to 17b94e60 after main 6bee0a74f; independently reconfirm the full unique header/rows, Config cell and both neighbours. Do not undo that valid repair or claim it as a new byte delta.')
credential = locate(virtual_key, lambda u: u['text'].startswith('1. `credentialStore:'))
rebind('claim_15308eb4', carry['path'], credential, 'Bind the carried numbered credentialStore/login/trust recipe under section 13.1 in the after-state of carry:credential-store-setup, after its approved predecessor. This is a conditional composed target, not a presently applied live unit.', virtual_key)
observe = locate('docs/platform/observe/spec.md', lambda u: u['text'].startswith('- Quản lý nhật ký và vòng đời case đo lường'))
rebind('claim_a7278e15', 'docs/platform/observe/spec.md', observe, 'Use the candidate Owns block used by the native current-source sibling, retaining every historical changed source line in the refreshed residual.')
io = locate('docs/platform/work-state/contracts/cli-io-contract.md', lambda u: u['anchor'] == 'unheaded-block-10' and '`writer.source`' in u['text'])
# The pilot proposal is deliberately NOT applied to files or the live gate projection.
pilot_before = copy.deepcopy(find('claim_f5365b8e')[2])
rebind('claim_f5365b8e', 'docs/platform/work-state/contracts/cli-io-contract.md', io, 'Use the exact candidate writer-source trust-level block used by sibling claim_57f11d837272b3f9781b376ef1665c81. Pilot shard is outside writable scope; proposal only.')
pilot_proposed = copy.deepcopy(find('claim_f5365b8e')[2])

# Historical source witnesses are reused, never minted or rewritten.
sources = {}
for e in load(P / 'reports/phase-06/step9-a42-predecessor-dispositions.json')['rows']:
    if e.get('witness'):
        u = e['witness']['unit']
        sources[e['predecessor']['claimId']] = {'text': u['text'], 'commit': e['witness']['commit'], 'path': e['predecessor']['sourcePath'], 'unit': u, 'record': str(P / 'reports/phase-06/step9-a42-predecessor-dispositions.json')}
for name in ['step10-sync2300-predecessor-residuals.json', 'step10-sync19-predecessor-residuals.json']:
    for e in load(P / 'reports/phase-06' / name)['entries']:
        sources[e['claimId']] = {'text': e['sourceText'], 'commit': e['sourceCommit'], 'path': e['sourcePath'], 'anchor': e['sourceAnchor'], 'record': str(P / 'reports/phase-06' / name)}
l9 = load(P / 'reports/phase-06/step9-l9-9-partial-carry-residual.json')
for e in l9['rows']:
    f, ks, r = by_id[e['claimId']]
    text = git('show', e['witness']['commit'] + ':' + r['sourcePath']) + '\n'
    key = e['claimId'] + '.md'
    req = {'virtual': [{'path': key, 'content': text}]}
    c = json.loads(subprocess.check_output(['node', str(OUT / 'extract-units.mjs')], input=json.dumps(req).encode()))['catalog'][key]
    u = next(u for u in c['units'] if u['anchor'] == e['witness']['anchor'] and u['textDigest'] == r['sourceUnitDigest'])
    sources[e['claimId']] = {'text': u['text'], 'commit': e['witness']['commit'], 'path': r['sourcePath'], 'unit': u, 'record': str(P / 'reports/phase-06/step9-l9-9-partial-carry-residual.json')}

# Authenticate every reused source against the historical Git object, through
# both frozen extractors. Also expose the named whole-block supersede deltas.
for prefix, commit in [('claim_af89c4e6', '2098246100d88c7e218066e23838c921e8748cb4'), ('claim_15308eb4', 'c3272bc6fc70015e995921e1c458658b084b0b11')]:
    f, ks, r = find(prefix)
    sources[r['claimId']] = {'commit': commit, 'path': r['sourcePath'], 'record': f + '#/' + '/'.join(ks)}
source_ids = {r['claimId'] for _, _, r in rows if r.get('disposition') == 'partial-carry' and r['claimId'] in sources} | {e['id'] for e in repairs if e['id'] in sources}
history = {}
for ident in sorted(source_ids):
    s = sources[ident]
    key = s['commit'] + ':' + s['path']
    if key not in history:
        history[key] = {'path': 'history-' + str(len(history)) + '.md', 'content': subprocess.check_output(['git', 'show', key]).decode()}
hist_catalog = json.loads(subprocess.check_output(['node', str(OUT / 'extract-units.mjs')], input=json.dumps({'virtual': list(history.values())}).encode()))['catalog']
source_proofs = []
for ident in sorted(source_ids):
    s = sources[ident]; r = by_id[ident][2]
    key = s['commit'] + ':' + s['path']; vk = history[key]['path']
    us = hist_catalog[vk]['units']
    matches = [u for u in us if u['textDigest'] == r['sourceUnitDigest']]
    assert len(matches) == 1, (ident, 'unique historical source digest', len(matches))
    u = matches[0]; i = us.index(u)
    if 'text' in s:
        assert s['text'] == u['text']
    s['text'] = u['text']; s['unit'] = u
    source_proofs.append({'id': ident, 'commit': s['commit'], 'path': s['path'], 'fileSha256': hist_catalog[vk]['fileSha256'], 'selected': u, 'previous': us[i-1] if i else None, 'next': us[i+1] if i+1 < len(us) else None})
for e in repairs:
    old = e['beforeBinding']
    prior = locate(old['targetOwner'], lambda u: u['anchor'] == old['targetAnchor'] and u['textDigest'] == old['targetUnitDigest'])
    e['priorPlacementAtInput'] = placement(old['targetOwner'], prior)
    if e['id'] in sources:
        s = sources[e['id']]
        e['sourceWitness'] = s
        target_lines = e['placement']['selected']['text'].splitlines()
        e['changedHistoricalSourceLines'] = [line for line in s['text'].splitlines() if line.strip() and line not in target_lines]
        if e['id'].startswith('claim_4d5b7f73'):
            e['wholeBlockSupersedeAccounting'] = 'Five historical lines differ: RUL79 item 1 account-lock generation is replaced by the holder-lock account mutex; RUL80 expands store/account validation; RUL86 names the live-worker/worktree-lock commit-resume gate; RUL91 replaces ambiguous account parsing with parseAccountPin (RUL106); RUL96 keeps 1m..4h but changes lock lifetime to kernel-held rather than TTL. Every old line is reproduced here for independent whole-block supersede judgment; the old all-26-lines-verbatim assertion in retained rationale is superseded by this explicit delta, not adopted.'
            by_id[e['id']][2]['rationale'] += ' Current whole-block accounting: five source lines differ (RUL79 account-lock generation, RUL80 store validation, RUL86 resume/worktree-lock gate, RUL91 parseAccountPin/RUL106, RUL96 kernel-held lifetime); exact historical/current lines are in binding-repairs.json. The historical all-lines-verbatim assertion no longer applies.'
save('source-proof.json', {'sourceCommit': pin, 'allAuthenticatedAgainstGitObjectsByBothExtractors': True, 'rows': source_proofs})

step0 = 'f7686163843ca8ce6b58b1fffe0472e57ce774e7'
step0_files = {}
residuals, sweep = [], []
for f, ks, r in rows:
    if r.get('disposition') != 'partial-carry':
        continue
    # The twelve direct-section carries have not rebound since Step 0. Keep their
    # existing reviewed section/carrier accounting instead of reopening history.
    if f not in step0_files:
        step0_files[f] = json.loads(subprocess.check_output(['git', 'show', step0 + ':' + f]))
    baseline = at(step0_files[f], ks)
    rebound_since_step0 = payload(baseline) != payload(r)
    if r['claimId'] not in sources:
        assert not rebound_since_step0, (r['claimId'], 'rebound partial needs source witness')
        u = locate(r['targetOwner'], lambda u: u['anchor'] == r['targetAnchor'] and u['textDigest'] == r['targetUnitDigest'])
        sweep.append({'file': f, 'keys': list(ks), 'id': r['claimId'], 'status': 'unchanged-since-step0; existing section-carrier accounting retained', 'targetBinding': payload(r), 'placement': placement(r['targetOwner'], u), 'existingRemainder': r.get('remainder'), 'existingReviewStatus': r['reviewStatus'], 'step0Commit': step0, 'step0Binding': payload(baseline), 'reboundSinceStep0': rebound_since_step0})
        continue
    s = sources[r['claimId']]
    assert sha(s['text']) == r['sourceUnitDigest'], (r['claimId'], 'source witness digest')
    target = locate(r['targetOwner'], lambda u: u['anchor'] == r['targetAnchor'] and u['textDigest'] == r['targetUnitDigest'])
    sl = s['text'].splitlines(); tl = target['text'].splitlines()
    missing = []
    opcodes = difflib.SequenceMatcher(None, sl, tl, autojunk=False).get_opcodes()
    for tag, a, b, c, d in opcodes:
        if tag in ['delete', 'replace']:
            missing.extend({'sourceLineInUnit': i+1, 'text': sl[i]} for i in range(a, b) if sl[i].strip())
    residual = '\n'.join(x['text'] for x in missing)
    record = {'file': f, 'keys': list(ks), 'id': r['claimId'], 'sourceUnitDigest': r['sourceUnitDigest'], 'sourceWitness': s, 'primaryTarget': payload(r), 'placement': placement(r['targetOwner'], target), 'sourceLineCount': len(sl), 'changedSourceLines': missing, 'residualText': residual, 'residualSha256': sha(residual), 'opcodes': opcodes, 'A34Accepted': False, 'reviewStatus': 'pending', 'scope': 'historical wording conservation only; not current truth or cutover approval', 'outOfScopeProposalOnly': f == pilot}
    residuals.append(record)
    sweep.append({'file': f, 'keys': list(ks), 'id': r['claimId'], 'status': 'refreshed-current-target-and-all-changed-source-lines' if f != pilot else 'needsWrites; proposed refresh only', 'residualIndex': len(residuals)-1, 'changedSourceLines': len(missing), 'previousRemainder': r.get('remainder'), 'step0Commit': step0, 'step0Binding': payload(baseline), 'reboundSinceStep0': rebound_since_step0})
save('partial-carry-residuals.json', {'sourceCommit': pin, 'recipe': 'Exact ordered source-to-current-target line diff with autojunk disabled; retain every nonblank deleted/replaced source line verbatim, including changed link spellings; pure target insertions create no historical source residual.', 'A34Accepted': False, 'rows': residuals})
residual_file_sha = sha((OUT / 'partial-carry-residuals.json').read_bytes())
for i, e in enumerate(residuals):
    r = by_id[e['id']][2]
    r['remainder'] = f"Verbatim historical changed-source lines in {OUT}/partial-carry-residuals.json#/rows/{i}; file SHA256 {residual_file_sha}; residual SHA256 {e['residualSha256']}; source {r['sourceUnitDigest']}; primary target {r['targetOwner']}#{r['targetAnchor']} SHA256 {r['targetUnitDigest']}. Every deleted/replaced nonblank source line is included; pure insertions excluded. A34Accepted=false; independent review pending; cutover blocked. Earlier residuals remain historical, not current coverage evidence."
    r['residualRef'] = {'path': str(OUT / 'partial-carry-residuals.json'), 'row': i, 'fileSha256': residual_file_sha, 'residualSha256': e['residualSha256'], 'targetUnitDigest': r['targetUnitDigest'], 'A34Accepted': False}
    if e['file'] != pilot:
        r['rationale'] += ' W2 partial-carry sweep refreshes the current-target-bound residual; complete verbatim line coverage and its historical source witness are in g0fix/partial-carry-residuals.json. Prior acceptance does not cover the changed target/residual.'

# Snapshot the pilot delta separately, then put the live read-only object back.
pilot_proposed = copy.deepcopy(find('claim_f5365b8e')[2])
find('claim_f5365b8e')[2].clear(); find('claim_f5365b8e')[2].update(pilot_before)
# The by_id object reference remains valid (find searches by the original dictionary key).

index = {(e['file'], tuple(e['keys'])): copy.deepcopy(e) for e in gate['changedBindings']}
for e in d1:
    key = (e['shard'], (e['collection'], str(e['index'])))
    if key not in index:
        r = at(files[key[0]], key[1])
        index[key] = {'file': key[0], 'keys': list(key[1]), 'id': r['claimId'], 'owner': 'Lead / independent current-digest binding reviewer', 'reviewStatus': 'pending', 'blocker': 'Later D1 rebind; independent verdict required for this exact current binding.'}
for e in repairs:
    if e['file'] == pilot:
        continue
    key = (e['file'], tuple(e['keys']))
    if key not in index:
        index[key] = {'file': key[0], 'keys': list(key[1]), 'id': e['id'], 'owner': 'Lead / independent current-digest binding reviewer', 'reviewStatus': 'pending', 'blocker': 'Later G0 rebind; independent verdict required for this exact current binding.'}
# Residual changes also reopen their owning records in the register.
for e in residuals:
    if e['file'] == pilot:
        continue
    key = (e['file'], tuple(e['keys']))
    if key not in index:
        index[key] = {'file': key[0], 'keys': list(key[1]), 'id': e['id'], 'owner': 'Lead / independent current-digest binding reviewer', 'reviewStatus': 'pending', 'blocker': 'Refreshed partial-carry residual; independent current-target and residual acceptance pending.'}

migrations, binding_proofs = [], []
for (f, ks), e in index.items():
    r = at(files[f], ks)
    old = copy.deepcopy(e)
    bh = binding_hash(r)
    for k in KEYS:
        e[k] = r.get(k)
    e['bindingSha256'] = bh
    if r.get('targetComposition'):
        e['targetComposition'] = r['targetComposition']
        e['blocker'] = 'Composed-after-state only: carry:credential-store-setup must be applied/revalidated at final pin; independent exact-binding review pending.'
    e['reviewStatus'] = 'pending'
    e.pop('bindingHashInput', None); e.pop('bindingHashEncoding', None)
    old_row = at(before_files[f], ks)
    migrations.append({'file': f, 'keys': list(ks), 'id': r['claimId'], 'wasInOriginal191': (f, ks) in {(e['file'], tuple(e['keys'])) for e in gate['changedBindings']}, 'oldRegisterBindingSha256': old.get('bindingSha256'), 'oldLedgerBindingSha256': old_row.get('bindingSha256'), 'oldRegisterTarget': {k: old.get(k) for k in KEYS}, 'newBindingSha256': bh, 'input': payload(r), 'ledgerHashWritten': f != pilot, 'reviewStatus': 'pending'})
    if f != pilot:
        r['bindingSha256'] = bh
    if r.get('targetAnchor'):
        vkey = virtual_key if r.get('targetComposition') else r['targetOwner']
        try:
            u = locate(vkey, lambda u: u['anchor'] == r['targetAnchor'] and u['textDigest'] == r['targetUnitDigest'] and (u['ancestry'] == r['targetAncestry'] or u['unitKind'] == 'heading' and u['ancestry'] + [u['title']] == r['targetAncestry']))
        except AssertionError:
            print('FAILED BINDING', f, ks, r['claimId'], payload(r))
            raise
        proof = {'file': f, 'keys': list(ks), 'id': r['claimId'], 'bindingSha256': bh, 'placement': placement(vkey, u), 'state': 'composed-after-state' if r.get('targetComposition') else 'current-workspace', 'ancestryConvention': 'parents-only' if u['ancestry'] == r['targetAncestry'] else 'D1 includes selected heading; parent ancestry and selected title independently checked'}
    else:
        members = []
        for m in r['successorGroup']['members']:
            u = locate(m['path'], lambda u: u['anchor'] == m['anchor'] and u['textDigest'] == m['unitDigest'] and u['ancestry'] == m['ancestry'])
            assert u['text'] == m['text']
            members.append(placement(m['path'], u))
        proof = {'file': f, 'keys': list(ks), 'id': r['claimId'], 'bindingSha256': bh, 'groupId': r['successorGroup']['id'], 'groupMembers': members, 'state': 'contextual-identical-unit-group; four-key absent fields are explicit null'}
    binding_proofs.append(proof)

# Pending metadata applies to every authored change; do not inherit a review.
for f, keys, r in rows:
    old = at(before_files[f], keys)
    if f == pilot or old == r:
        continue
    r['reviewStatus'] = 'pending'
    for k in ['reviewedBy', 'reviewedAt', 'reviewReport', 'reviewMode', 'reviewReportCommit', 'reviewPackCommit', 'reviewPackId', 'seedScoreId', 'reviewBindingSha256']:
        r.pop(k, None)
    if 'residualRef' in r:
        for k in ['evidenceDigest', 'reviewEntryId', 'acceptanceScope']:
            r.pop(k, None)
    r['reviewNote'] = 'W2 G0 current binding/hash or residual authored; independent review pending; no approval carry. Complete before/after record retained in g0fix/record-edits.json.'

gate_after = copy.deepcopy(gate)
gate_after['changedBindings'] = list(index.values())
gate_after['bindingHashEncoding'] = {'algorithm': 'sha256', 'textEncoding': 'UTF-8', 'keys': sorted(KEYS), 'serialization': 'JSON object with exactly the four named keys, sorted lexicographically; compact separators comma/colon, ensure_ascii=false; absent values encoded as null; arrays retain order; append exactly one LF (0x0a); no BOM', 'python': "hashlib.sha256((json.dumps({k: row.get(k) for k in ['targetOwner','targetAnchor','targetUnitDigest','targetAncestry']}, sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\\n').encode('utf-8')).hexdigest()", 'excluded': ['successorGroup', 'placement', 'reviewStatus', 'targetComposition'], 'groupNote': 'Rows bound to a contextual identical-unit group have null targetAnchor/targetUnitDigest/targetAncestry; the group members are independently witnessed, not included in this four-key hash.'}
assert all(gate_after[k] == gate[k] for k in gate if k != 'changedBindings')
save('binding-repairs.json', {'sourceCommit': pin, 'authoredNotAccepted': True, 'repairs': repairs})
save('partial-carry-sweep.json', {'sourceCommit': pin, 'ledgerRows': 26, 'pilotAdditionalRows': 1, 'rows': sweep, 'needsWrites': [pilot], 'noGateAccepted': True})
save('binding-proofs.json', {'sourceCommit': pin, 'rows': binding_proofs, 'allExactAtDeclaredState': True})
save('recipe-migration.json', {'sourceCommit': pin, 'bindingHashEncoding': gate_after['bindingHashEncoding'], 'originalRegisterRows': len(gate['changedBindings']), 'currentRegisterRows': len(index), 'rows': migrations, 'independentReview': 'pending; no verdict is authored here', 'needsWrites': [pilot]})
pilot_proposed['bindingSha256'] = binding_hash(pilot_proposed)
pilot_proposed['reviewStatus'] = 'pending'
pilot_proposed['reviewNote'] = 'Proposed only: pilot file outside writable scope; independent current-target/residual review pending.'
save('needs-writes.json', {'needsWrites': [pilot], 'reason': 'claim_f5365b8e is in pilot/decisions, not ledger/decisions. The two pilot register rows also cannot receive their new ledger-side bindingSha256 in this scope. No pilot bytes were changed; live register hashes use actual current pilot bindings, never the unapplied proposal.', 'proposedRecord': {'file': pilot, 'keys': ['registryGaps', '4'], 'before': pilot_before, 'after': pilot_proposed}, 'additionalHashOnlyProposal': {'file': pilot, 'keys': ['claims', '35'], 'bindingSha256': binding_hash(files[pilot]['claims'][35])}})

edits = []
for f, keys, r in rows:
    old = at(before_files[f], keys)
    if old != r and f != pilot:
        edits.append({'file': f, 'keys': list(keys), 'id': r['claimId'], 'before': old, 'after': r})
save('record-edits.json', {'sourceCommit': pin, 'rows': edits})
# Exact replacements are saved outside the repository for application by the tool.
# Whole JSON subvalues only; original indentation/order remains untouched elsewhere.
def subvalue(x, depth):
    return '\n'.join(('  ' * depth + line) for line in json.dumps(x, ensure_ascii=False, indent=2).splitlines())
replacements = []
for f in sorted({e['file'] for e in edits}):
    es = [e for e in edits if e['file'] == f]
    text = Path(f).read_text()
    ops = []
    for e in es:
        old, new = subvalue(e['before'], len(e['keys'])), subvalue(e['after'], len(e['keys']))
        assert text.count(old) == 1, (f, e['keys'], 'non-exact source serialization')
        ops.append({'oldText': old, 'newText': new})
    replacements.append({'path': f, 'sha256': sha(text), 'edits': ops})
compact = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))
old = '"changedBindings":' + compact(gate['changedBindings'])
new = '"bindingHashEncoding":' + compact(gate_after['bindingHashEncoding']) + ',"changedBindings":' + compact(gate_after['changedBindings'])
text = gatefile.read_text()
assert text.count(old) == 1 and 'bindingHashEncoding' not in gate
replacements.append({'path': str(gatefile), 'sha256': sha(text), 'edits': [{'oldText': old, 'newText': new}]})
(SCRATCH / 'exact-edits.json').write_text(dump(replacements))
print(dump({'prepared': True, 'recordChanges': len(edits), 'registerRows': len(index), 'original191': len(gate['changedBindings']), 'residuals': len(residuals), 'partialSweep': len(sweep), 'needsWrites': [pilot], 'scratchEdits': str(SCRATCH / 'exact-edits.json')}))
