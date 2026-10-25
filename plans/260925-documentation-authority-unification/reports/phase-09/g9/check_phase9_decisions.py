#!/usr/bin/env python3
"""Pin-bound records proof, not product proof. Run with python3 -B.

All prepared replay goes through fchain/check.py. Source citations and plans/
scan membership remain frozen at sourcePin, independently of current proposals.
No product tooling is imported.
"""
import argparse
from collections import Counter
import copy
import difflib
from functools import lru_cache
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
PLAN = 'plans/260925-documentation-authority-unification/'
P8 = PLAN + 'reports/phase-08/'
P9 = PLAN + 'reports/phase-09/'
ADDITIONS = P9 + 'g9/f-composition-additions.json'
GATEWAY = 'docs/contracts/fgos-gateway-api-v1.yaml'
OUTPUTS = {P9 + 'g9/' + p for p in ('phase9-decisions.json', 'phase9-decisions.md',
           'check_phase9_decisions.py', 'f-composition-additions.json')}


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
    for path in drift:
        # An unrelated document repair is not gateway-reader drift. Prove both
        # byte domains contain no operand; actual readers still need exact bytes.
        require((ROOT / path).is_file() and GATEWAY.encode() not in blob(pin, path) and
                GATEWAY.encode() not in (ROOT / path).read_bytes(),
                'gateway scan input differs from sourcePin: ' + path)
    hits = set()
    # Every record is evidence from the pin, whether later edited or deleted.
    # Non-record readers still require exact checkout agreement.
    records = [p for p in files if p.startswith('plans/')]
    files = [p for p in files if not p.startswith('plans/')]
    for path in records:
        if GATEWAY.encode() in blob(pin, path):
            hits.add(path)
    require(all((ROOT / path).is_file() for path in files), 'non-record scan input missing')
    for start in range(0, len(files), 150):
        args = ['rg', '--files-with-matches', '--null', '--fixed-strings', '--hidden',
                '--no-ignore', '--', GATEWAY, *files[start:start + 150]]
        run = subprocess.run(args, cwd=ROOT, capture_output=True)
        require(run.returncode in (0, 1), 'rg scan failed: ' + run.stderr.decode())
        hits.update(p.decode() for p in run.stdout.split(b'\0') if p)
    result = {}
    for path in sorted(hits):
        raw = blob(pin, path)
        require(path.startswith('plans/') or (ROOT / path).read_bytes() == raw, 'scan input drift: ' + path)
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


@lru_cache(maxsize=8)
def fchain_result(serialized_additions):
    spec = importlib.util.spec_from_file_location('g9_shared_fchain', HERE.parent / 'fchain/check.py')
    shared = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(shared)
    current = git('rev-parse', 'HEAD').decode().strip()
    return shared.compose(current, additions=json.loads(serialized_additions))


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
    require(not rebases, 'rebase proposals must go through the shared F manifest')
    composition, states = fchain_result(json.dumps(additions, sort_keys=True))
    require(composition['exit'] == 0, 'shared F composition failed: ' + str(composition['counts']))
    after_chain = {path: state['text'].encode() for path, state in states.items()}
    after_additions = after_chain
    chains = {path: [t.get('chainEntryId', t.get('id')) for t in state['trace']]
              for path, state in states.items()}
    used_rebases = set()

    def chain(path):
        return after_chain.get(path, blob(pin, path))

    for patch in patches:
        if patch.get('composedBy') and not patch.get('predecessor'):
            require(not any(k in patch for k in ('diff', 'forwardDiff', 'rollbackDiff')),
                    'linked G9 copy must not retain an executable patch')
        else:
            require(patch['sourceCommit'] == pin and patch['status'] == 'prepared-not-applied', 'patch pin/status')

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
            owner_quotes = [r.get('quote', '') for r in entry['source'] if r['path'] == P8 + 'owner-answers.md']
            retained = any(re.search(r'\b(?:Keep|Retain)\s+`' + re.escape(dep[1]) + '`', q) for q in owner_quotes)
            moved = any(re.search(r'\bMove\s+(?:`[^`]+`\s*(?:and|,)\s*)*`' + re.escape(dep[1]) + '`', q) for q in owner_quotes)
            require(retained != moved, 'ruling quote not tied unambiguously to own file')
            wanted = 'retained-in-place' if retained else 'moved'
            require(entry['decision'] == wanted, 'decision type contradicts path ruling')
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
            successor = entry['successor']
            require(successor['path'] == 'docs/platform/governance.md' and
                    successor['anchor'] == 'decision-scope-to-holder-table', 'AGENTS successor path/anchor differs')
            target = chain(successor['path']).decode()
            require('## Decision scope to holder table' in target.splitlines(), 'AGENTS successor anchor absent')
            require(successor['path'] + '#' + successor['anchor'] in chain('AGENTS.md').decode(),
                    'AGENTS does not route to successor anchor')
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
                    known = set(chains[path])
                    for prior in composition['baseChain']['predecessors']:
                        if prior['file'] == path and prior.get('replacedBy') in known:
                            known.add(prior['chainEntryId'])
                    require(set(reader['alreadyComposed']) <= known, 'unknown alreadyComposed id')
                    require(not own, 'alreadyComposed must not duplicate a patch')
                    require(entry.get('destination', entry.get('successor', {}).get('path', '')) in after_chain[path].decode(), 'chain lacks successor')
                else:
                    require(any(p['path'] == path for p in own), 'uncovered reader patch: ' + path)
                    require(path in after_additions, 'reader patch not replayed on F chain')
                if entry['decision'] == 'moved':
                    effective = after_additions.get(path, after_chain[path]).decode()
                    # Preserved historical/correction occurrences may coexist
                    # with live retargets in the same file. Their G6 row owns
                    # that choice; never require whole-file token eradication.
                    preserved = bool(reader.get('g6Rows'))
                    require((entry['destination'] in effective or preserved) and
                            (entry['file'] not in effective or preserved),
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
    shard_rows = {r['rowId']: (n, i, r) for n in (1, 2, 3)
                  for i, r in enumerate(document(pin, P9 + f'preserve-premise/park-judgments/shard-{n}.json')['rows'])}
    expected_g6 = {}
    proof_rows = {r['rowId']: r for r in document(pin, P9 + 'preserve-premise/proof.json')['rows']}
    for rid, (_, _, row) in shard_rows.items():
        original = proof_rows[rid]
        if any(o['path'] == GATEWAY for o in original['normalizedOperands']):
            expected_g6.setdefault(original['file'], set()).add(rid)
    for reader in data['gatewayReaders']:
        if reader['path'].startswith('docs/'):
            require(set(reader.get('g6Rows', [])) == expected_g6.get(reader['path'], set()),
                    'gateway shard ownership omitted or relabeled: ' + reader['path'])
            require(reader.get('g6Rows') or reader.get('compositionAddition'), 'doc reader needs G6 or F owner')
            if reader.get('g6Rows'):
                owning_rows = [cite(pin, ref) for ref in reader['g6Refs']]
                require({r['rowId'] for r in owning_rows} == set(reader['g6Rows']) and
                        all(r['file'] == reader['path'] for r in owning_rows), 'G6 owner/file differs')
                require(reader.get('composedBy'), 'gateway G6 reader must link its actual judgment/patch owner')
                for ref in reader['composedBy']:
                    number, index = ref['shard'], ref['row']
                    actual = document(pin, P9 + f'preserve-premise/park-judgments/shard-{number}.json')['rows'][index]
                    require(actual['rowId'] == ref['rowId'] and ref['rowId'] in reader['g6Rows'], 'wrong shard owner link')
            else:
                require(any(p['id'] == reader['compositionAddition'] and p['path'] == reader['path']
                            for p in patches), 'missing F document composition entry')
    reader_spec = importlib.util.spec_from_file_location('g9_root_readers', HERE.parent / 'fchain/readers.py')
    reader_module = importlib.util.module_from_spec(reader_spec); reader_spec.loader.exec_module(reader_module)
    root_scan = reader_module.census(pin)
    census = data['rootDocReaderCensus']
    require(census['sourcePin'] == pin and len(census['occurrences']) == len(root_scan), 'root document reader population differs')
    for actual, observed in zip(census['occurrences'], root_scan):
        require(all(actual[k] == v for k, v in observed.items()), 'root document reader evidence differs')
        for ref in actual['shardOwners']:
            n, index, owner = shard_rows[ref['rowId']]
            require((n, index) == (ref['shard'], ref['row']), 'root reader shard selector differs')
            source = owner.get('source') or next(e for e in owner['evidence'] if e.get('role') == 'source-unit')
            require(source.get('file', source.get('path')) == actual['path'] and
                    source.get('lineStart', source.get('startLine')) <= actual['line'] <= source.get('lineEnd', source.get('endLine')),
                    'root reader shard occurrence unbound')
        if actual['readerKind'] == 'surviving':
            require(actual['shardOwners'] or actual['chainOwners'] or actual.get('owningPatch'), 'ownerless live document reader')
            if actual.get('owningPatch'):
                patch = patch_ref(actual['owningPatch'])
                require(patch['path'] == actual['path'] and 'docs/platform/' + actual['oldPath'][5:] in chain(actual['path']).decode(),
                        'root reader owning patch does not retarget')
        elif actual['readerKind'] == 'confirmed-history':
            require(actual['proofOwners'] and all(proof_rows[r['rowId']]['result'] == 'preserve-source-confirmed-history'
                    and proof_rows[r['rowId']]['file'] == actual['path'] for r in actual['proofOwners']), 'unproved historical reader exclusion')
        elif actual['readerKind'] == 'completed-work-history':
            require(actual['path'] == 'docs/backlog.md' and actual['text'].endswith('— done'), 'not completed-work evidence')
        elif actual['readerKind'] == 'retained-decision-projection':
            require(actual['path'] in {'docs/decisions/index.md', 'docs/knowledge/decisions-index/decision-record.md'} and
                    re.search(r'\d{4}-\d\d-\d\dT', actual['text']), 'not a dated decision projection')
        else:
            require(actual['readerKind'] in {'removed-with-source', 'historical'}, 'unknown reader classification')
    for entry in entries:
        if entry['file'] in reader_module.OLD and entry['decision'] == 'moved':
            require(entry['documentReaderOccurrences'] == [i for i, h in enumerate(root_scan) if h['oldPath'] == entry['file']],
                    'move omits document reader occurrences')
    counts = dict(sorted(Counter(e['decision'] for e in entries).items()))
    require(counts == data['counts'], 'decision counts mismatch')
    return {'status': 'pass', 'pin': pin, 'entries': len(entries), 'records': 29,
            'counts': counts, 'leadDecisionProposed': sum(e['leadDecisionProposed'] for e in entries),
            'gatewayScanFiles': len(scan), 'gatewayActiveReaders': len(active),
            'preparedAdditions': len(patches), 'linkedAdditions': sum(bool(p.get('composedBy')) for p in patches),
            'rootDocumentOccurrences': len(root_scan), 'sharedCompositionFiles': len(composition['files']),
            'chainRebasesReplayed': len(used_rebases),
            'chainFiles': len(after_chain),
            'limits': 'Complete shared prepared-byte F-chain replay and pinned record bindings only; not product parity, approval, F or gate closure.'}


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
    add('patch cannot apply on F chain', lambda d, a: a['patches'][5].update(diff='malformed prepared diff'))
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
    def strip_g6(d, a):
        for reader in d['gatewayReaders']:
            if reader.get('g6Rows'):
                reader.pop('g6Rows'); reader.pop('g6Refs'); reader.pop('composedBy')
                reader['compositionAddition'] = next(p['id'] for p in a['patches'] if p['path'] == reader['path'])
        for entry in d['entries']:
            if entry['file'] == GATEWAY:
                entry['readers'] = copy.deepcopy(d['gatewayReaders'])
    add('gateway shard owners relabeled as additions', strip_g6)
    agents = next(i for i, e in enumerate(data['entries']) if e['consumerFile'] == 'AGENTS.md')
    add('AGENTS successor anchor forged', lambda d, a: d['entries'][agents]['successor'].update(anchor='bogus-anchor'))
    add('AGENTS successor path swapped', lambda d, a: d['entries'][agents]['successor'].update(path='docs/reading-map.md'))
    add('root document reader census truncated', lambda d, a: d['rootDocReaderCensus']['occurrences'].pop())
    add('move document reader coverage omitted', lambda d, a: d['entries'][root_move].update(documentReaderOccurrences=[]))
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
