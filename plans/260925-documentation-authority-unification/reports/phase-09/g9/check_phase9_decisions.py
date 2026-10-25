#!/usr/bin/env python3
"""Read-only coverage/citation checker; run with python3 -B. No product proof.

The candidate decisions are read from disk; all their evidence is read from the
immutable Git pin. JSON pointers are RFC 6901; record hashes exclude line endings.
The old move proposal is conservative: L12-96 retention overrides are checked
separately, never inferred from an absent proposal. No imports of fgOS tooling.
"""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[5]
PLAN = 'plans/260925-documentation-authority-unification/'
P8 = PLAN + 'reports/phase-08/'
P9 = PLAN + 'reports/phase-09/'
RECORDS = {
    'tests-judgment-batch4': 2,
    'tests-judgment-batch6': 1,
    'cli-help-messages': 3,
    'gateway-contract': 2,
    'runtime-judgment-part-22': 13,
    'setup-doctor-roots': 21,
    'generators-skills-and-support': 66,
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def pointer(value, ref):
    require(isinstance(ref, str) and ref.startswith('/'), 'invalid JSON pointer')
    for part in ref[1:].split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def check(data, requested_pin=None):
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=ROOT, stderr=subprocess.PIPE)

    pin = git('rev-parse', '--verify', (requested_pin or data['sourcePin']) + '^{commit}').decode().strip()
    require(pin == data['sourcePin'], 'pin differs: re-author/review citations, do not relabel the packet')
    cache = {}

    def blob(path):
        require(isinstance(path, str) and path and not path.startswith('/'), 'invalid cited path')
        require('..' not in PurePosixPath(path).parts and not path.startswith('.fgos/'), 'unsafe cited path')
        if path not in cache:
            require(git('cat-file', '-t', pin + ':' + path).strip() == b'blob', 'not a file: ' + path)
            cache[path] = git('show', pin + ':' + path)
        return cache[path]

    def document(path):
        raw = blob(path)
        return json.loads(gzip.decompress(raw) if path.endswith('.gz') else raw)

    def cite(ref):
        raw = blob(ref['path'])
        require(digest(raw) == ref['sha256'], 'citation drift: ' + ref['path'])
        if 'pointer' in ref:
            return pointer(document(ref['path']), ref['pointer'])
        require(bool(ref.get('quote')), 'text citation needs an exact quote')
        require(ref['quote'] in raw.decode(), 'quote absent: ' + ref['path'])
        return None

    expected = {}
    external_count = 0
    for name, line in RECORDS.items():
        path = P8 + 'step-05-records/' + name + '.jsonl'
        raw = blob(path).splitlines()[line - 1]
        row = json.loads(raw)
        for i, parked in enumerate(row['parked']):
            key = (path + ':' + str(line), '/parked/' + str(i))
            # This includes the session-rule dependency's "Phase 9 must", not
            # just the three literal "Phase 9 carry" dependencies.
            if re.search(r'Phase\s+9\b', parked.get('dependency') or '', re.I):
                expected[key] = (row, parked, digest(raw))
            else:
                external_count += 1
    require(len(expected) == 33, 'source population no longer equals the brief\'s 33 entries')
    require(external_count == 75, 'non-selected dependencies changed')
    require(data['untouchedDependenciesInSelectedRecords'] == external_count, 'external count mismatch')

    move_set = document(P8 + 'step-05-cutover-move-set.json')
    moves = {r['oldPath']: {m['to'].split('#')[0] for m in r['moves'] if m.get('to')}
             for r in move_set['paths']}
    entries = data['entries']
    keys = [(e['record'], e['pointer']) for e in entries]
    require(len(keys) == len(set(keys)), 'duplicate record/pointer')
    require(set(keys) == set(expected), 'missing or extra Phase 9 dependencies')
    require(len({e['id'] for e in entries}) == 33, 'duplicate entry ids')
    for ref in data['contextSources']:
        cite(ref)

    retained = {'docs/decisions/index.md', 'docs/enduser-docs-index.json',
                'docs/architecture-manifest.json'}
    for entry in entries:
        row, parked, row_hash = expected[(entry['record'], entry['pointer'])]
        require(entry['id'] == parked['id'], 'wrong id at record pointer')
        require(entry['dependency'] == parked['dependency'], 'dependency changed')
        require(entry['recordSha256'] == row_hash, 'physical source record changed')
        require(entry['consumerFile'] == row['file'], 'wrong consumer')
        blob(entry['consumerFile'])
        blob(entry['file'])
        path_dependency = re.fullmatch(r'Phase 9 retention-or-move decision for (.+)', parked['dependency'])
        if path_dependency:
            require(entry['file'] == path_dependency.group(1), 'wrong file for original dependency')
        else:
            carries = document(P9 + 'carries/claim-carries.json')['claims']
            carry = next(c for c in carries if c['id'] == entry['id'])
            require(entry['file'] == carry['sourceOccurrence']['matchedExpression'], 'wrong retired source')
            require(entry['successor']['path'] == carry['bindings'][0]['targetOwner'], 'wrong clause successor')
            require(entry['successor']['anchor'] == carry['bindings'][0]['targetAnchor'], 'wrong successor clause')
        require(entry['decision'] in {'retained-in-place', 'moved', 'retired'}, 'invalid decision')
        require(isinstance(entry['leadDecisionProposed'], bool), 'proposal marker required')
        require(bool(entry['reason']), 'reason required')
        require(bool(entry['source']), 'source required')
        for ref in entry['source']:
            cite(ref)
        require(isinstance(entry['readers'], list) and entry['readers'], 'readers required')
        for reader in entry['readers']:
            blob(reader['path'])
            require(bool(reader['role']), 'reader role required')
            for proof in reader.get('proofs', []):
                blob(proof)
        patches = [cite(ref) for ref in entry['patchRefs']]
        if entry['decision'] == 'retained-in-place':
            require(entry['file'] in retained, 'retention needs separate authored evidence')
            require(not entry.get('destination'), 'retained path cannot have a destination')
        elif entry['decision'] == 'moved':
            destination = entry['destination']
            blob(destination)
            require(destination in moves.get(entry['file'], set()), 'destination outside the move set')
            require(blob(entry['file']) == blob(destination), 'gateway source/target bytes differ')
            require(patches, 'moved readers need prepared patches or an explicit F list')
            for reader in entry['readers']:
                require(any(p.get('path') == reader['path']
                            and entry['file'] in p.get('diff', p.get('forwardDiff', ''))
                            and destination in p.get('diff', p.get('forwardDiff', ''))
                            for p in patches), 'uncovered moved reader: ' + reader['path'])
        else:
            require(bool(entry['retirementScope']), 'retirement scope must distinguish claim from file')
            if entry.get('successor'):
                blob(entry['successor']['path'])
                cite(entry['successor'])

    # The R26 unit owns the exhaustive runtime reader set and co-change set.
    units = document(P8 + 'step-05-proposed-move-read-units.json')['units']
    gateway = next(u for u in units if u['path'] == 'docs/contracts/fgos-gateway-api-v1.yaml')
    gateway_files = {r['file'] for r in gateway['readers'] + gateway['coChanges']}
    for entry in entries:
        if entry['decision'] == 'moved':
            require({r['path'] for r in entry['readers']} == gateway_files,
                    'moved reader/co-change set differs from owning R26 unit')

    # Archive partition is only about plan evidence, never product-path policy.
    partition = document(P9 + 'archive/audit/partition.json.gz')
    partition_paths = {r['path'] for r in partition['records'] + partition['retained']}
    require(all(key[0].rsplit(':', 1)[0] in partition_paths for key in expected),
            'record missing from archive/retention partition')
    counts = dict(sorted(Counter(e['decision'] for e in entries).items()))
    require(counts == data['counts'], 'decision counts mismatch')
    return {'status': 'pass', 'pin': pin, 'entries': len(entries), 'counts': counts,
            'leadDecisionProposed': sum(e['leadDecisionProposed'] for e in entries),
            'untouchedDependenciesInSelectedRecords': external_count,
            'citedFilesChecked': len(cache), 'movedReaderFiles': len(gateway_files),
            'limits': 'Records/citations only; no parity, independent approval, F or carriedBlocker closure.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pin', help='must resolve to the packet sourcePin')
    parser.add_argument('--decisions', type=Path, default=Path(__file__).with_name('phase9-decisions.json'))
    args = parser.parse_args()
    try:
        result = check(json.loads(args.decisions.read_text()), args.pin)
    except (ValueError, KeyError, IndexError, TypeError, StopIteration, OSError, subprocess.CalledProcessError) as exc:
        print(json.dumps({'status': 'fail', 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
