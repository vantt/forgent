#!/usr/bin/env python3
"""Read-only A50 replay. Run from any cwd; stdout is the only output."""
import collections
import hashlib
import json
import math
from pathlib import Path
import sys

REPORTS = Path(__file__).resolve().parent
ROOT = REPORTS.parents[3]
errors = []
counts = collections.Counter()
cache = {}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(name):
    return json.loads((REPORTS / name).read_text())


def require(ok, message):
    if not ok:
        errors.append(message)


def consumer(path):
    if path not in cache:
        require(not path.startswith('.fgos/'), 'Forbidden state path: ' + path)
        data = (ROOT / path).read_bytes()
        cache[path] = (sha(data), data.decode().splitlines())
    return cache[path]


def fingerprint(row):
    return sha(json.dumps(row, sort_keys=True, ensure_ascii=False).encode())


def mapping_key(row):
    return (row['normalizedReference'], row.get('desiredOwner'), row.get('desiredAnchor'))


def check_span(row):
    label = row.get('edgeId', row.get('id', '?'))
    digest, lines = consumer(row['consumerPath'])
    require(digest == row['fileDigest'], label + ': consumer digest')
    line = lines[row['line'] - 1]
    if row.get('physicalSpans'):
        joined = []
        for span in row['physicalSpans']:
            text = lines[span['line'] - 1][span['columnStart'] - 1:span['columnEndExclusive'] - 1]
            require(text == span['text'], label + ': wrapped physical span')
            joined.append(text)
        require(''.join(joined) == row['matchedExpression'], label + ': continuation join')
    else:
        require(line[row['columnStart'] - 1:row['columnEndExclusive'] - 1] == row['matchedExpression'], label + ': literal span')
    if 'callSiteFullLine' in row:
        require(sha(line.encode()) == row['callSiteFullLine']['sha256'], label + ': full line digest')
        start = row['callSiteExcerptStartColumn'] - 1
        require(line[start:start + len(row['callSite'])] == row['callSite'], label + ': bounded call site')
    else:
        require(line == row['callSite'], label + ': call site')
    for context in row.get('context', []):
        actual = lines[context['line'] - 1]
        if 'fullLineSha256' in context:
            require(sha(actual.encode()) == context['fullLineSha256'], label + ': context full line digest')
            start = context['excerptStartColumn'] - 1
            require(actual[start:start + len(context['text'])] == context['text'], label + ': context excerpt')
        else:
            require(actual == context['text'], label + ': context')


def run():
    maps = load('step-02c-census-maps-portals-prose.json')
    wrapped = load('step-02d-wrapped-citation-rescan.json')
    corrections = load('step-02d-slice2-corrections.json')
    mappings = load('step-02c-distinct-mappings.json')
    index = load('step-02c-mapping-review-index.json')
    sample = load('step-02c-edge-sample.json')
    exceptions = load('step-02c-review-exceptions.json')['sets']
    originals = {e['edgeId']: e for e in maps['entries']}
    require(len(originals) == len(maps['entries']) == 5427, 'Original population must be exactly 5,427 unique edges')
    require(len(maps['files']) == 1036, 'Original population must be exactly 1,036 files')
    for item in maps['files']:
        require(consumer(item['path'])[0] == item['sha256'], item['path'] + ': original file digest')
        require(sorted(item['edgeIds']) == sorted(e['edgeId'] for e in maps['entries'] if e['consumerPath'] == item['path']), item['path'] + ': file/edge join')
    for edge in maps['entries']:
        check_span(edge)
        counts['originalEdges'] += 1
    for name, rows in [('correction', corrections['entries']), ('literal-new', corrections['newEdges']), ('wrapped-new', wrapped['newEdges']), ('rebind', wrapped['rebindings'])]:
        for row in rows:
            check_span(row)
            if row.get('supersedes'):
                old = row['supersedes']
                source = json.loads((ROOT / old['file']).read_text())
                prior = next(e for e in source['entries'] if e.get('edgeId', e.get('id')) == old['rowId'])
                require(fingerprint(prior) == old['originalRowSha256'], row['edgeId'] + ': superseded row identity')
            if row.get('status') == 'blocked':
                require('new' not in (row.get('cutoverPatch') or {}), row['edgeId'] + ': blocked patch has executable new')
            counts[name] += 1
    for item in wrapped['coverage']:
        require(consumer(item['path'])[0] == item['sha256'], item['path'] + ': rescan digest')
    overlays = {e['edgeId']: e for e in wrapped['rebindings']}
    effective = [overlays.get(e['edgeId'], e) for e in maps['entries']]
    grouped = collections.defaultdict(list)
    for edge in effective:
        grouped[mapping_key(edge)].append(edge['edgeId'])
    seen = []
    require(len(grouped) == len(mappings['entries']) == 1018, 'Distinct mapping count')
    anchor_rows = {e['id']: e for e in load('step-02c-maps-anchor-check.json')['entries']}
    for item in mappings['entries']:
        key = (item['legacyReference'], item['owner'], item['anchor'])
        expected = grouped.get(key, [])
        require(sorted(item['edgeIds']) == sorted(expected), item['mappingId'] + ': effective mapping join')
        require(item['edgeCount'] == len(expected), item['mappingId'] + ': edge count')
        expected_failures = [id for id in expected if id in anchor_rows and anchor_rows[id]['failures']]
        require(item['anchorCheck']['failedEdgeIds'] == expected_failures, item['mappingId'] + ': mechanical failure join')
        seen.extend(item['edgeIds'])
    require(collections.Counter(seen) == collections.Counter(originals.keys()), 'Every original edge must join exactly one mapping')
    counts['mappingJoins'] = len(seen)
    for name in ['step-02c-anchor-check.json', 'step-02c-maps-anchor-check.json']:
        receipt = load(name)
        for pin in receipt['apiPins']:
            require(sha((ROOT / pin['path']).read_bytes()) == pin['sha256'], name + ': anchor API pin')
        for row in receipt['entries']:
            if row.get('targetFileDigest'):
                require(sha((ROOT / row['checkedOwner']).read_bytes()) == row['targetFileDigest'], row['id'] + ': anchor target digest')
            if row.get('passage'):
                lines = (ROOT / row['checkedOwner']).read_text().split('\n')
                passage = row['passage']
                require(sha('\n'.join(lines[passage['startLine'] - 1:passage['endLine']]).encode()) == passage['sha256'], row['id'] + ': anchor passage digest')
    ranked = sorted((sha((sample['seed'] + '\0' + e['edgeId']).encode()), e['edgeId']) for e in effective)
    selected = ranked[:math.ceil(.15 * len(effective))]
    require([(e['sha256Rank'], e['edgeId']) for e in sample['entries']] == selected, 'Seeded sample reproducibility')
    require(sample['count'] == len(selected) == 815, 'Seeded sample size')
    for action in ['preserve-pending-target', 'preserve-pending-behavioral-proof']:
        require(sorted(exceptions[action]['rowIds']) == sorted(e['edgeId'] for e in effective if e['cutoverAction'] == action), action + ': exception coverage')
    require(sorted(exceptions['mechanical-target-failures']['rowIds']) == sorted(e['id'] for e in anchor_rows.values() if e['failures']), '104 mechanical failures: exact set')
    failures = [e['id'] for e in load('step-02c-anchor-check.json')['entries'] if e['failures'] and e.get('effective')]
    require(sorted(exceptions['anchor-check-failures']['rowIds']) == sorted(failures) and len(failures) == 21, '21 effective anchor failures: exact set')
    for name, digest in index['sourcePins'].items():
        require(sha((REPORTS / name).read_bytes()) == digest, name + ': review source pin')
    reports = []
    resolved_sources = {}
    populations = collections.defaultdict(list)
    for part in index['parts']:
        require(part['entryCount'] == len(part['entryIds']) <= 60, 'Part %s: entry limit' % part['part'])
        require(len(json.dumps(part, ensure_ascii=False).encode()) <= 400000, 'Part %s: byte limit' % part['part'])
        require(part['mandatoryDeepReads']['allListedEntries'], 'Part %s: mandatory reads' % part['part'])
        source_name = Path(part['sourceTable']).name
        if source_name not in resolved_sources:
            data = load(source_name)
            resolved_sources[source_name] = data.get('entries', []) + data.get('newEdges', []) + data.get('rebindings', [])
        population = part['population']
        id_field = 'mappingId' if population == 'distinct-mappings' else 'id' if population in ['mechanical-target-failures', 'anchor-check-failures'] else 'entryId' if population == 'correction-controls' else 'edgeId'
        rows_by_id = {row[id_field]: row for row in resolved_sources[source_name] if id_field in row and (population != 'anchor-check-failures' or row.get('effective'))}
        resolved = [rows_by_id[id] for id in part['entryIds']]
        require(len(json.dumps(resolved, ensure_ascii=False).encode()) == part['resolvedPayloadBytes'], 'Part %s: resolved byte count' % part['part'])
        require(len(json.dumps({'part': part, 'resolvedRows': resolved}, ensure_ascii=False).encode()) <= 400000, 'Part %s: resolved payload byte limit' % part['part'])
        populations[part['population']].extend(part['entryIds'])
        reports.append(part['report'])
    require(len(reports) == len(set(reports)) == index['counts']['parts'], 'Unique independent report names')
    require(sorted(populations['distinct-mappings']) == sorted(e['mappingId'] for e in mappings['entries']), 'All mappings partitioned')
    for name, exception in exceptions.items():
        require(sorted(populations[name]) == sorted(exception['rowIds']), name + ': part coverage')
    require(sorted(populations['seeded-semantic-edge-sample']) == sorted(id for _, id in selected), 'Sample part coverage')
    counts.update(files=len(maps['files']), mappings=len(mappings['entries']), rescanFiles=len(wrapped['coverage']), sampleEdges=len(selected), reviewParts=len(reports))


try:
    run()
except (OSError, ValueError, KeyError, IndexError, StopIteration) as error:
    errors.append(type(error).__name__ + ': ' + str(error))
print(json.dumps({'status': 'FAIL' if errors else 'PASS', 'counts': dict(counts), 'failureCount': len(errors), 'failures': errors[:30], 'limits': 'Mechanical replay only. 104 target failures and 21 effective earlier anchor failures remain review exceptions, not semantic passes; no runtime parity, post-cutover links or independent acceptance claimed.'}, ensure_ascii=False, indent=2))
sys.exit(1 if errors else 0)
