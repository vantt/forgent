#!/usr/bin/env python3
"""Pin-bound records proof, not product proof. Run with python3 -B.

Reuses the F chain's effectiveSpecIds/replaces convention and GNU patch. At this
pin the consolidated check_shard.py helper does not exist. Only relevant chain
files are replayed, in tempfile directories; no product tooling is imported.
"""
import argparse
from collections import Counter
import copy
import difflib
from functools import lru_cache
import gzip
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
PLAN = 'plans/260925-documentation-authority-unification/'
P8 = PLAN + 'reports/phase-08/'
P9 = PLAN + 'reports/phase-09/'
ADDITIONS = P9 + 'g9/f-composition-additions.json'
GATEWAY = 'docs/contracts/fgos-gateway-api-v1.yaml'
OUTPUTS = {P9 + 'g9/' + p for p in ('phase9-decisions.json', 'phase9-decisions.md',
           'check_phase9_decisions.py', 'f-composition-additions.json')}
RETAINED = {'docs/decisions/index.md', 'docs/enduser-docs-index.json',
            'docs/architecture-manifest.json'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(path):
    require(isinstance(path, str) and path and not path.startswith('/'), 'invalid cited path')
    require(all(p not in ('', '.', '..') for p in path.split('/')) and '\\' not in path,
            'unsafe cited path')
    require(not path.startswith(('.fgos/', '.git/')), 'private path forbidden')
    require(path != 'scripts/run-tests.mjs', 'forbidden product entry')
    return path


def git(*args):
    return subprocess.check_output(['git', '--no-optional-locks', *args], cwd=ROOT,
                                   stderr=subprocess.PIPE)


@lru_cache(maxsize=None)
def blob(pin, path):
    safe_path(path)
    require(git('cat-file', '-t', pin + ':' + path).strip() == b'blob', 'not a file: ' + path)
    return git('show', pin + ':' + path)


@lru_cache(maxsize=None)
def document(pin, path):
    raw = blob(pin, path)
    return json.loads(gzip.decompress(raw) if path.endswith('.gz') else raw)


def pointer(value, ref):
    require(isinstance(ref, str) and ref.startswith('/'), 'invalid JSON pointer')
    for part in ref[1:].split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def cite(pin, ref):
    raw = blob(pin, ref['path'])
    require(digest(raw) == ref['sha256'], 'citation drift: ' + ref['path'])
    if 'pointer' in ref:
        return pointer(document(pin, ref['path']), ref['pointer'])
    require(bool(ref.get('quote')), 'text citation needs an exact quote')
    require(ref['quote'] in raw.decode(), 'quote absent: ' + ref['path'])
    return ref['quote']


@lru_cache(maxsize=None)
def population(pin):
    paths = git('ls-tree', '-r', '--name-only', pin, '--', P8 + 'step-05-records/').decode().splitlines()
    expected, records = {}, set()
    for path in paths:
        if not path.endswith('.jsonl'):
            continue
        for line, raw in enumerate(blob(pin, path).splitlines(), 1):
            row = json.loads(raw)
            for i, parked in enumerate(row.get('parked', [])):
                if re.search(r'phase[\s-]*0?9\b', parked.get('dependency') or '', re.I):
                    key = (path + ':' + str(line), '/parked/' + str(i))
                    expected[key] = (row, parked, digest(raw))
                    records.add(key[0])
    require(len(expected) == 158 and len(records) == 29, 'Phase-9 source population changed')
    return expected


@lru_cache(maxsize=None)
def scan_gateway(pin):
    """rg supplies membership, including ignored tracked evidence; Git binds bytes.

    Search all tracked regular text files except private state, tool indexes,
    the explicitly forbidden product entry, and this packet's four self-citations.
    No glob silently excludes plans, histories, fixtures or generated readers.
    """
    tree = git('ls-tree', '-r', '-z', pin).split(b'\0')
    files = []
    for item in tree:
        if not item:
            continue
        meta, raw_path = item.split(b'\t', 1)
        path = raw_path.decode()
        if (meta.startswith(b'100') and path not in OUTPUTS and
                path != 'scripts/run-tests.mjs' and
                not path.startswith(('.fgos/', '.gitnexus/'))):
            files.append(path)
    drift = set(git('diff', '--name-only', pin, '--', *[p for p in files if not p.startswith('plans/')]).decode().splitlines())
    require(not drift, 'non-record scan inputs differ from sourcePin')
    hits = set()
    # Record files deleted after the pin cannot be scanned on disk; read their
    # pinned bytes directly so membership stays bound to the pin.
    gone = [p for p in files if not (ROOT / p).exists()]
    files = [p for p in files if (ROOT / p).exists()]
    for path in gone:
        require(path.startswith('plans/'), 'non-record scan input missing: ' + path)
        if GATEWAY.encode() in blob(pin, path):
            hits.add(path)
    for start in range(0, len(files), 150):
        args = ['rg', '--files-with-matches', '--null', '--fixed-strings', '--hidden',
                '--no-ignore', '--', GATEWAY, *files[start:start + 150]]
        run = subprocess.run(args, cwd=ROOT, capture_output=True)
        require(run.returncode in (0, 1), 'rg scan failed: ' + run.stderr.decode())
        hits.update(p.decode() for p in run.stdout.split(b'\0') if p)
    result = {}
    for path in sorted(hits):
        raw = blob(pin, path)
        require(not (ROOT / path).exists() or (ROOT / path).read_bytes() == raw, 'scan input drift: ' + path)
        lines = [i for i, s in enumerate(raw.decode().splitlines(), 1) if GATEWAY in s]
        require(lines, 'rg/pin membership differs: ' + path)
        result[path] = {'path': path, 'sha256': digest(raw), 'lines': lines}
    return result


def exclusion_reason(path):
    if path.startswith('plans/'):
        return 'Plan/evidence custody, not a maintained gateway contract reader; retain immutable source locators.'
    if path.startswith('docs/history/'):
        return 'Historical work record; its old path is provenance, not present reader routing (L12-10).'
    if path.startswith(('docs/specs/', 'docs/ui-spec/')):
        return 'Legacy counterpart removed at cutover; maintained candidate citations are patched separately.'
    if path == 'packages/yaml-doc/contracts/fixtures/parse.v1.json':
        return 'Parser golden fixture explanation of a scalar shape, not a pathname opened by the parser; preserve fixture bytes.'
    if path == 'packages/yaml-doc/upgrade-record.md':
        return 'Historical parser comparison observation in upgrade evidence, not a live contract read; preserve provenance.'
    if path.endswith('/gateway-subsystem-audit-260814-findings.md'):
        return 'Dated audit findings/source scope, not current gateway-contract navigation.'
    return None


def chain_sources(pin, path):
    """Same root selection as composition/verify-effective.py, also for S7-only files."""
    approved = document(pin, P8 + 'step-07-composed-patches.json')['patches']
    packet = document(pin, P9 + 'composition/patch-specs.json')
    by_id = {s['id']: (i, s) for i, s in enumerate(packet['patches'])}
    require(len(packet['effectiveSpecIds']) == len(set(packet['effectiveSpecIds'])), 'duplicate F chain id')
    specs = [(P9 + 'composition/patch-specs.json', '/patches/' + str(by_id[i][0]), by_id[i][1])
             for i in packet['effectiveSpecIds'] if by_id[i][1]['path'] == path]
    prior = next(((P8 + 'step-07-composed-patches.json', '/patches/' + str(i), s)
                  for i, s in enumerate(approved) if s['path'] == path), None)
    current = blob(pin, path)
    if prior and (not specs or (digest(current) != specs[0][2]['beforeSha256'] and
                              specs[0][2].get('replaces') != prior[2]['patchSpecId'])):
        specs.insert(0, prior)
    return specs


def replay(path, before, patch):
    safe_path(path)
    require(path == patch['path'], 'patch file identity')
    require(digest(before) == patch['beforeSha256'], 'patch source digest: ' + path)
    diff = patch.get('diff', patch.get('forwardDiff'))
    require(isinstance(diff, str) and diff, 'prepared patch missing diff')
    # Confine the patch tool to the named file; no extra headers/path traversal.
    headers = [s for s in diff.splitlines() if s.startswith(('--- ', '+++ '))]
    require(headers == ['--- a/' + path, '+++ b/' + path], 'patch touches unexpected file')
    root = Path('/tmp/fgos-work')
    created = not root.exists()
    root.mkdir(parents=True, exist_ok=True)
    try:
        with tempfile.TemporaryDirectory(prefix='g9-replay-', dir=root) as temporary:
            target = Path(temporary) / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(before)
            run = subprocess.run(['patch', '--batch', '--fuzz=0', '--forward', '-p1'],
                                 input=diff.encode(), cwd=temporary, capture_output=True)
            require(run.returncode == 0 and b'offset' not in run.stdout.lower(),
                    'patch replay failed/offset: ' + path)
            after = target.read_bytes() if target.exists() else b''
            require(digest(after) == patch['expectedAfterSha256'], 'patch result digest: ' + path)
            rollback = patch.get('rollbackDiff')
            require(bool(rollback), 'rollback diff required')
            run = subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], input=rollback.encode(),
                                 cwd=temporary, capture_output=True)
            require(run.returncode == 0 and b'offset' not in run.stdout.lower(), 'rollback replay failed')
            require(target.read_bytes() == before, 'rollback bytes differ')
            return after
    finally:
        if created:
            root.rmdir()


def effective_overlay(pin):
    data = document(pin, P8 + 'step-07-park-resolution-applied.json')
    result = {r[4]: ('/rows/' + str(i), dict(zip(data['rowSchema'], r)))
              for i, r in enumerate(data['rows'])}
    for name in ('reevaluations', 'integrationReevaluations'):
        for i, row in enumerate(data[name]):
            result[row['memberId']] = ('/' + name + '/' + str(i), row)
    return result


def check(data, requested_pin=None, additions=None):
    pin = git('rev-parse', '--verify', (requested_pin or data['sourcePin']) + '^{commit}').decode().strip()
    require(pin == data['sourcePin'], 'pin differs: re-author/review citations, do not relabel')
    additions = additions if additions is not None else json.loads((ROOT / ADDITIONS).read_text())
    require(additions['sourcePin'] == pin, 'additions pin differs')
    expected = population(pin)
    entries = data['entries']
    keys = [(e['record'], e['pointer']) for e in entries]
    require(len(keys) == len(set(keys)) and set(keys) == set(expected), 'missing/extra/duplicate dependency')
    require(len({e['id'] for e in entries}) == 158, 'duplicate entry id')
    for ref in data['contextSources']:
        cite(pin, ref)
    overlay = effective_overlay(pin)
    claims = document(pin, P9 + 'carries/claim-carries.json')['claims']
    claim_by_id = {c['id']: (i, c) for i, c in enumerate(claims)}
    moves = {r['oldPath']: {m['to'].split('#')[0] for m in r['moves'] if m.get('to')}
             for r in document(pin, P8 + 'step-05-cutover-move-set.json')['paths']}
    patches = additions['patches']
    require(len({p['id'] for p in patches}) == len(patches), 'duplicate addition patch')
    rebases = {(r['original']['path'], r['original']['pointer']): r for r in additions['chainRebases']}
    require(len(rebases) == len(additions['chainRebases']), 'duplicate chain rebase')
    after_chain, after_additions, chains = {}, {}, {}
    used_rebases = set()

    def chain(path):
        if path not in after_chain:
            current = blob(pin, path)
            trace = []
            for source, selector, original in chain_sources(pin, path):
                ref_key = (source, selector)
                if ref_key in rebases:
                    record = rebases[ref_key]
                    require(cite(pin, record['original']) == original, 'rebase original differs')
                    require(record['patch']['beforeSha256'] != original['beforeSha256'], 'unnecessary rebase')
                    current = replay(path, current, record['patch'])
                    trace.append(record['patch']['id'])
                    used_rebases.add(ref_key)
                else:
                    current = replay(path, current, original)
                    trace.append(original.get('id', original.get('patchSpecId')))
            after_chain[path] = current
            chains[path] = trace
        return after_chain[path]

    for patch in patches:
        path = patch['path']
        require(path not in after_additions, 'duplicate same-file addition; consolidate')
        before = chain(path)
        require(patch['sourceCommit'] == pin and patch['status'] == 'prepared-not-applied', 'patch pin/status')
        after_additions[path] = replay(path, before, patch)

    def patch_ref(ref):
        if ref.get('artifact') == 'f-composition-additions.json':
            return pointer(additions, ref['pointer'])
        return cite(pin, ref)

    for entry in entries:
        row, parked, row_hash = expected[(entry['record'], entry['pointer'])]
        require(entry['id'] == parked['id'] and entry['dependency'] == parked['dependency'], 'source identity differs')
        require(entry['recordSha256'] == row_hash and entry['consumerFile'] == row['file'], 'physical record binding differs')
        blob(pin, entry['consumerFile'])
        require(isinstance(entry['leadDecisionProposed'], bool) and entry['reason'], 'proposal/rationale required')
        require(entry['decision'] in ('retained-in-place', 'moved', 'retired'), 'invalid decision')
        require(entry['source'], 'source required')
        for ref in entry['source']:
            cite(pin, ref)
        ov_selector, ov = overlay[entry['id']]
        require(entry['phase8Resolution']['pointer'] == ov_selector and
                entry['phase8Disposition'] == ov['newDisposition'], 'Step 7 effective resolution differs')
        require(cite(pin, entry['phase8Resolution']) == pointer(document(pin, P8 + 'step-07-park-resolution-applied.json'), ov_selector), 'Step 7 reference differs')
        dep = re.fullmatch(r'Phase 9 retention-or-move decision for (.+)', parked['dependency'])
        if dep:
            require(entry['file'] == dep[1], 'wrong file for original dependency')
            wanted = 'retained-in-place' if dep[1] in RETAINED else 'moved'
            require(entry['decision'] == wanted, 'decision type contradicts path ruling')
            owner_quotes = [r.get('quote', '') for r in entry['source'] if r['path'] == P8 + 'owner-answers.md']
            verb = 'Keep' if dep[1] == 'docs/decisions/index.md' else 'Retain' if wanted == 'retained-in-place' else 'Move'
            require(any(verb in q and '`' + dep[1] + '`' in q for q in owner_quotes), 'ruling quote not tied to own file')
        elif 'native Land' in parked['dependency']:
            require(entry['decision'] == 'retained-in-place' and entry['file'] == row['file'], 'native Land retained')
            require(any('dormant in this repo' in r.get('quote', '') for r in entry['source']), 'native Land ruling required')
        elif parked['dependency'] == 'decision-f-phase9-ratchet-retirement':
            require(entry['decision'] == 'retired' and entry['file'] == row['file'], 'ratchet retirement ruling')
            require(entry.get('applicationCondition') and entry['patchRefs'], 'atomic replacement guard condition required')
        elif entry['id'] in claim_by_id:
            _, claim = claim_by_id[entry['id']]
            require(entry['decision'] == 'retired', 'clause source retirement, not whole-file move')
            require(entry['sourceOperand'] == claim['sourceOccurrence']['matchedExpression'], 'wrong retired operand')
            binding = claim['bindings'][0]
            require(entry['successor']['path'] == binding['targetOwner'] and
                    entry['successor']['anchor'] == binding['targetAnchor'], 'wrong clause successor')
        elif row['file'] == 'AGENTS.md':
            require(entry['decision'] == 'retired' and entry.get('successor'), 'old root routing retired')
        else:
            require(row['file'] == 'scripts/generate-shipped-path-inventory.mjs' and
                    entry['decision'] == 'retained-in-place' and entry['leadDecisionProposed'], 'unsettled scan policy needs explicit proposal')
        require(entry['readers'], 'readers required')
        resolved = [patch_ref(r) for r in entry['patchRefs']]
        if entry['decision'] == 'moved':
            reader_refs = {json.dumps(r, sort_keys=True) for reader in entry['readers']
                           for r in reader.get('patchRefs', [])}
            require(reader_refs == {json.dumps(r, sort_keys=True) for r in entry['patchRefs']},
                    'moved patchRefs differ from reader patch coverage')
        for reader in entry['readers']:
            path = reader['path']
            blob(pin, path)
            require(reader['role'], 'reader role required')
            if entry['decision'] == 'moved' or resolved or reader.get('alreadyComposed'):
                refs = reader.get('patchRefs', entry['patchRefs'])
                own = [patch_ref(r) for r in refs]
                if reader.get('alreadyComposed'):
                    chain(path)
                    require(set(reader['alreadyComposed']) <= set(chains[path]), 'unknown alreadyComposed id')
                    require(not own, 'alreadyComposed must not duplicate a patch')
                    require(entry.get('destination', entry.get('successor', {}).get('path', '')) in after_chain[path].decode(), 'chain lacks successor')
                else:
                    require(any(p['path'] == path for p in own), 'uncovered reader patch: ' + path)
                    require(path in after_additions, 'reader patch not replayed on F chain')
                if entry['decision'] == 'moved':
                    effective = after_additions.get(path, after_chain[path]).decode()
                    require(entry['destination'] in effective and entry['file'] not in effective,
                            'reader did not retarget moved operand')
        if entry['id'] in claim_by_id and entry['id'] != 'author-s4-08912b8301b10321':
            require(resolved or any(r.get('alreadyComposed') for r in entry['readers']),
                    'retired clause needs a prepared or already composed pointer patch')
        if entry['decision'] == 'moved':
            destination = entry['destination']
            blob(pin, destination)
            require(destination in moves.get(entry['file'], set()), 'destination outside move set')
            if entry['file'] == GATEWAY:
                require(blob(pin, GATEWAY) == blob(pin, destination), 'gateway copies differ')
                require(entry['readers'] == data['gatewayReaders'], 'gateway reader set differs')
            else:
                require(entry.get('contentCheck'), 'conditional move requires content check')
                content_check = entry['contentCheck']
                for ref in content_check['sources']:
                    cite(pin, ref)
                source_text = blob(pin, entry['file']).decode()
                target_text = blob(pin, destination).decode()
                if entry['file'] == 'docs/doc-governance.md':
                    source_text = source_text[source_text.index('This document is the governance contract'):]
                    target_text = target_text[target_text.index('This document is the governance contract'):
                                              target_text.index('## Source Metadata (Added in candidate)')]
                    baseline = r'Required baseline:\n\n```txt\n([\s\S]*?)\n```'
                    require(re.search(baseline, source_text)[1] == re.search(baseline, target_text)[1],
                            'governance required fields changed')
                else:
                    target_text = target_text[target_text.index('### Bản đồ kiến trúc fgOS'):]
                def normalized(text):
                    text = re.sub(r'^#+ ', '', text, flags=re.M)
                    return re.sub(r'\[([^\]]+)\]\([^\n)]+\)', r'\1', text).strip()
                comparison = '\n'.join(difflib.unified_diff(normalized(source_text).splitlines(),
                                                          normalized(target_text).splitlines(), n=1))
                require(comparison == content_check['normalizedDiff'], 'content comparison drift')
        if entry['decision'] == 'retired':
            require(entry.get('retirementScope'), 'retirement scope required')
            if entry.get('successor'):
                cite(pin, entry['successor'])
        if entry['id'] in ('reference-000232', 'reference-000235', 'reference-000236'):
            stale = entry['stalePatch']
            historical = cite(pin, stale['source'])
            require(stale['status'] == 'stale-against-pin-rebase-at-F' and
                    historical['beforeSha256'] != digest(blob(pin, 'bin/fgos.mjs')), 'stale bin patch not disclosed')
    require(used_rebases == set(rebases), 'unused/unreplayed chain rebase')
    scan = scan_gateway(pin)
    require(data['gatewayScan']['matches'] == list(scan.values()), 'rg reader census differs')
    excluded = data['gatewayExclusions']
    require(len({r['path'] for r in excluded}) == len(excluded), 'duplicate exclusion')
    for row in excluded:
        require(row['reason'] == exclusion_reason(row['path']) and row['reason'], 'unsupported reader exclusion')
    active = set(scan) - {r['path'] for r in excluded}
    require(active == {r['path'] for r in data['gatewayReaders']}, 'rg active readers missing/extra')
    for reader in data['gatewayReaders']:
        if reader['path'].startswith('docs/'):
            require(reader.get('g6Rows') or reader.get('compositionAddition'), 'doc reader needs G6 or F owner')
            if reader.get('g6Rows'):
                owning_rows = [cite(pin, ref) for ref in reader['g6Refs']]
                require({r['rowId'] for r in owning_rows} == set(reader['g6Rows']) and
                        all(r['file'] == reader['path'] for r in owning_rows), 'G6 owner/file differs')
            else:
                require(any(p['id'] == reader['compositionAddition'] and p['path'] == reader['path']
                            for p in patches), 'missing F document composition entry')
    counts = dict(sorted(Counter(e['decision'] for e in entries).items()))
    require(counts == data['counts'], 'decision counts mismatch')
    return {'status': 'pass', 'pin': pin, 'entries': len(entries), 'records': 29,
            'counts': counts, 'leadDecisionProposed': sum(e['leadDecisionProposed'] for e in entries),
            'gatewayScanFiles': len(scan), 'gatewayActiveReaders': len(active),
            'patchesReplayed': len(patches), 'chainRebasesReplayed': len(used_rebases),
            'chainFiles': len(after_chain),
            'limits': 'Relevant-file F-chain replay and record bindings only; not product parity, approval, F or gate closure.'}


def negative_controls(data, additions):
    """The original 14 controls plus each newly owned invariant; same check()."""
    cases = []
    def add(name, mutate):
        cases.append((name, mutate))
    add('missing entry', lambda d, a: d['entries'].pop())
    add('duplicate entry', lambda d, a: d['entries'].append(copy.deepcopy(d['entries'][0])))
    add('wrong pointer', lambda d, a: d['entries'][0].update(pointer='/parked/999999'))
    add('nonexistent path', lambda d, a: d['contextSources'][0].update(path='docs/no-such-g9-file.md'))
    add('bad digest', lambda d, a: d['contextSources'][0].update(sha256='0' * 64))
    add('absent quote', lambda d, a: d['contextSources'][0].update(quote='g9-impossible-quote'))
    add('bad JSON pointer', lambda d, a: next(r for r in d['contextSources'] if 'pointer' in r).update(pointer='/absent'))
    moved = next(i for i, e in enumerate(data['entries']) if e['file'] == GATEWAY)
    retained = next(i for i, e in enumerate(data['entries']) if e['file'] == 'docs/decisions/index.md')
    carry = next(i for i, e in enumerate(data['entries']) if e['id'] == 'reference-000235')
    add('outside move set', lambda d, a: d['entries'][moved].update(destination='docs/reading-map.md'))
    add('missing reader', lambda d, a: d['entries'][moved]['readers'].pop())
    add('missing patch', lambda d, a: d['entries'][moved].update(patchRefs=[]))
    add('wrong retained file', lambda d, a: d['entries'][retained].update(file='docs/backlog.md'))
    add('wrong successor', lambda d, a: d['entries'][carry]['successor'].update(anchor='wrong-clause'))
    add('wrong physical hash', lambda d, a: d['entries'][0].update(recordSha256='0' * 64))
    add('wrong pin', lambda d, a: d.update(sourcePin='0' * 40))
    other_quote = next(e['source'][0] for e in data['entries'] if e['file'] == 'docs/enduser-docs-index.json')
    add('retention quote belongs to other file', lambda d, a: d['entries'][retained].update(source=[copy.deepcopy(other_quote)]))
    def flip(d, a):
        d['entries'][retained]['decision'] = 'retired'
        d['entries'][retained]['retirementScope'] = 'fabricated'
        d['counts'] = dict(Counter(e['decision'] for e in d['entries']))
    add('retention flipped with adjusted counts', flip)
    add('patch cannot apply on F chain', lambda d, a: a['patches'][0].update(
        beforeSha256=digest(blob(d['sourcePin'], 'bin/fgos.mjs'))))
    def omit_reader_and_census(d, a):
        path = 'docs/platform/config/spec.md'
        d['gatewayReaders'] = [r for r in d['gatewayReaders'] if r['path'] != path]
        d['gatewayScan']['matches'] = [r for r in d['gatewayScan']['matches'] if r['path'] != path]
        for entry in d['entries']:
            if entry['file'] == GATEWAY:
                entry['readers'] = copy.deepcopy(d['gatewayReaders'])
                entry['patchRefs'] = list({json.dumps(r, sort_keys=True): r
                                          for reader in entry['readers']
                                          for r in reader.get('patchRefs', [])}.values())
    add('rg doc reader and census both omitted', omit_reader_and_census)
    add('fixture exclusion without reason', lambda d, a: next(
        r for r in d['gatewayExclusions'] if r['path'] == 'packages/yaml-doc/contracts/fixtures/parse.v1.json'
        ).update(reason=''))
    add('effective overlay relabeled', lambda d, a: d['entries'][0].update(phase8Disposition='invented'))
    add('ratchet token omitted', lambda d, a: d['entries'].__setitem__(slice(None), [e for e in d['entries'] if e['dependency'] != 'decision-f-phase9-ratchet-retirement']))
    root_move = next(i for i, e in enumerate(data['entries']) if e['file'] == 'docs/doc-governance.md')
    add('content comparison relabeled', lambda d, a: d['entries'][root_move]['contentCheck'].update(normalizedDiff=''))
    def wrong_g6(d, a):
        reader = next(r for r in d['gatewayReaders'] if r.get('g6Rows'))
        reader['g6Rows'] = ['f00000']
        for entry in d['entries']:
            if entry['file'] == GATEWAY:
                entry['readers'] = copy.deepcopy(d['gatewayReaders'])
    add('G6 row not bound to doc reader', wrong_g6)
    stale_entry = next(i for i, e in enumerate(data['entries']) if e['id'] == 'reference-000232')
    add('stale bin patch mislabeled', lambda d, a: d['entries'][stale_entry]['stalePatch'].update(status='existing'))
    def omit_clause_patch(d, a):
        entry = next(e for e in d['entries'] if e['consumerFile'] == 'src/runner/dispatch/operation-prompt-templates.mjs')
        entry['patchRefs'] = []
        for reader in entry['readers']:
            reader['patchRefs'] = []
    add('retired clause pointer patch omitted', omit_clause_patch)
    outcomes = []
    for name, mutate in cases:
        candidate, patches = copy.deepcopy(data), copy.deepcopy(additions)
        mutate(candidate, patches)
        try:
            check(candidate, additions=patches)
        except (ValueError, KeyError, IndexError, TypeError, StopIteration, OSError, subprocess.CalledProcessError):
            outcomes.append(name)
        else:
            raise ValueError('negative control unexpectedly passed: ' + name)
    return outcomes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pin', help='must resolve to the packet sourcePin')
    parser.add_argument('--decisions', type=Path, default=HERE / 'phase9-decisions.json')
    parser.add_argument('--additions', type=Path, default=ROOT / ADDITIONS)
    parser.add_argument('--self-test', action='store_true', help='also run the original 14 and new negative controls')
    args = parser.parse_args()
    try:
        data = json.loads(args.decisions.read_text())
        additions = json.loads(args.additions.read_text())
        result = check(data, args.pin, additions)
        if args.self_test:
            result['negativeControls'] = negative_controls(data, additions)
    except (ValueError, KeyError, IndexError, TypeError, StopIteration, OSError, subprocess.CalledProcessError) as exc:
        print(json.dumps({'status': 'fail', 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
