#!/usr/bin/env python3
"""Read-only G9 source/context and effective-spec sweep. Run with python3 -B.

Inputs are historical record bodies plus the three explicit gate cohorts. A
record is one physical JSONL row (revisions remain distinct); membership counts
are not unique-record counts. Source bytes always come from git at --pin, not
from the checkout. Output is JSON on stdout; this module never writes files.
"""
import argparse
import collections
import difflib
import functools
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
REPORTS = HERE.parent.parent
P8 = REPORTS / 'phase-08'
REL = lambda p: str(p.relative_to(ROOT))
COMMANDS = []


def sha(data):
    return hashlib.sha256(data.encode() if isinstance(data, str) else data).hexdigest()


def load(path):
    return json.loads(path.read_text())


def git(*args):
    cp = subprocess.run(['git', '--no-optional-locks', *args], cwd=ROOT, capture_output=True)
    COMMANDS.append({'argv': ['git', '--no-optional-locks', *args], 'exit': cp.returncode,
                     'stdoutSha256': sha(cp.stdout), 'stdoutBytes': len(cp.stdout)})
    if cp.returncode:
        raise ValueError(cp.stderr.decode(errors='replace'))
    return cp.stdout


@functools.lru_cache(None)
def blob(pin, path):
    # No state, external sources, absolute paths, or symlink traversal.
    if path.startswith(('.fgos/', '/')) or '..' in Path(path).parts:
        raise ValueError('source outside repository policy: ' + path)
    cp = subprocess.run(['git', '--no-optional-locks', 'show', pin + ':' + path],
                        cwd=ROOT, capture_output=True)
    COMMANDS.append({'argv': ['git', '--no-optional-locks', 'show', pin + ':' + path],
                     'exit': cp.returncode, 'stdoutSha256': sha(cp.stdout), 'stdoutBytes': len(cp.stdout)})
    return cp.stdout if cp.returncode == 0 else None


@functools.lru_cache(None)
def record_lines(path):
    return (ROOT / path).read_text().splitlines()


def scope():
    rows = {}
    counts = collections.Counter()

    def add(path, line, cohort, meta):
        key = path + ':' + str(line)
        if key not in rows:
            raw = record_lines(path)[line - 1]
            rows[key] = {'id': key, 'recordFile': path, 'recordLine': line,
                         'recordSha256': sha(raw), 'record': json.loads(raw),
                         'memberships': [], 'dependencies': []}
        rows[key]['memberships'].append(cohort)
        counts[cohort] += 1
        for dep in meta.get('changedDependencies', []):
            if dep['path'] not in rows[key]['dependencies']:
                rows[key]['dependencies'].append(dep['path'])

    ctx = load(P8 / 'step-08-preflip-gates.json')['sourceContextAndPostPinRecomposition']
    for r in ctx['changedRecords']:
        add(REL(P8 / r['record']), r['recordLine'], 'changed518/' + r['stage'], r)
    for filename, name in [(P8 / 'step-08-l12-130-deferred-rebinds.json', 'overlaps144'),
                           (HERE.parent / 'w0-deferred-rebinds.json', 'w0deferred22')]:
        for stage, members in load(filename)['records'].items():
            for r in members:
                add(r['recordFile'], r['recordLine'], name + '/' + stage, r)
    return rows, dict(counts)


def bound_passages(entry):
    """Keep complete authored passages, source/render joins and protected co-cuts.

    For older Step 3/4 rows with only operand spans, bind the entire containing
    source line, not just the operand. Never interpret a reason's path mention
    as a dependency. Whole-file dependency witnesses cover explicit overlaps.
    """
    rec = entry['record']
    pin = rec.get('authorInputCommit') or rec.get('inventoryInputCommit')
    primary = rec['file']
    result = []
    seen = set()

    def add(path, start=None, end=None, text=None, ident=None, operand=None, policy=None):
        old = blob(pin, path)
        oldtext = old.decode('utf-8', errors='replace') if old is not None else ''
        if text is None:
            if start:
                text = ''.join(oldtext.splitlines(True)[start - 1:(end or start)])
            else:
                text = oldtext
                start, end = 1, len(oldtext.splitlines())
        if not text:
            return
        if start is None:
            pos = oldtext.find(text)
            start = oldtext[:pos].count('\n') + 1 if pos >= 0 else None
        end = end or ((start + len(text.splitlines()) - 1) if start else None)
        key = (path, start, text)
        if key in seen:
            return
        seen.add(key)
        result.append({'path': path, 'oldStartLine': start, 'oldEndLine': end,
                       'wholeFileContext': text == oldtext,
                       'text': text, 'passageId': ident, 'operand': operand,
                       'recordedDisposition': policy, 'authorPin': pin})

    for field in ['edges', 'references', 'dynamicTraces', 'authorAddedReferences']:
        for item in rec.get(field, []):
            ident = item.get('referenceId') or item.get('edgeId') or item.get('id')
            path = item.get('consumerFile') or primary
            policy = item.get('disposition') or ('retires-with-tree' if item.get('retiresWithTree') else None)
            operation = item.get('operationWitness') or item.get('priorR19Rejection', {}).get('operationWitness') or {}
            operand = item.get('matchedExpression') or item.get('logicalReference') or operation.get('text')
            span = item.get('passageSpan') or item.get('currentPassage') or {}
            if item.get('passage') or span.get('text'):
                add(path, span.get('startLine'), span.get('endLine'), item.get('passage') or span['text'], ident, operand, policy)
            else:
                spans = item.get('sourceSpans') or item.get('slotSourceSpans') or []
                if not spans and operation.get('line'):
                    spans = [{'line': operation['line'], 'text': operation.get('text')}]
                if not spans and item.get('callSite'):
                    spans = [{'line': item['callSite'][0], 'text': item['callSite'][4]}]
                for s in spans:
                    add(path, s.get('line'), s.get('endLine', s.get('line')), ident=ident,
                        operand=operand or s.get('text'), policy=policy)
            for inp in item.get('inputs', []):
                if isinstance(inp, dict) and inp.get('callerPassage'):
                    cp = inp['callerPassage']
                    add(inp.get('sourceFile', path), cp.get('startLine'), cp.get('endLine'),
                        cp.get('text'), str(ident) + '/caller', policy=policy)
    provenance = rec.get('sourceRenderProvenance', [])
    if isinstance(provenance, dict):
        provenance = [provenance]
    for source in provenance:
        sp = source.get('sourcePath') or source.get('sourceFile') or primary
        for render in source.get('renderFiles', []):
            rp = render['path']
            for header in render.get('headerWitnesses', []):
                add(rp, header.get('line'), text=header.get('text'), ident='render-header', policy='render-join')
            for edge in render.get('existingEdgeJoins', []):
                s = edge.get('sourceSpan') or {}
                # sourceSpan is the recorded render-side line correspondence.
                add(rp, s.get('line'), ident=edge.get('edgeId'), operand=s.get('text'), policy='render-join')
        if sp != primary:
            add(sp, ident='canonical-source-dependency')
    for path in entry['dependencies']:
        add(path, ident='explicit-overlap-dependency')
    # protectedPins are path strings in Step 5. They are literal frozen
    # operands unless a repository path actually exists at the author pin.
    for value in rec.get('protectedPins', []):
        path = value if isinstance(value, str) else value.get('path')
        if path and not path.startswith(('.fgos/', '/')) and blob(pin, path) is not None:
            add(path, ident='protected-co-cut')
    if not any(p['path'] == primary for p in result):
        add(primary, ident='whole-file-zero-edge-context')
    return result


@functools.lru_cache(None)
def renamed_paths(oldpin, newpin):
    data = git('diff', '--name-status', '-z', '--find-renames', '--diff-filter=R',
               oldpin, newpin, '--', 'docs', 'src', 'packages', 'apps', 'test',
               'scripts', 'core', 'domains', 'plugins', '.agents', '.claude')
    tokens = data.decode().split('\0')
    return {tokens[i + 1]: tokens[i + 2] for i in range(0, len(tokens) - 1, 3)}


def classify_passage(passage, pin):
    path, text = passage['path'], passage['text']
    current_path = path
    current = blob(pin, path)
    if current is None:
        current_path = renamed_paths(passage['authorPin'], pin).get(path, path)
        if current_path != path:
            current = blob(pin, current_path)
    out = {k: v for k, v in passage.items() if k != 'text'}
    out['currentPath'] = current_path
    out['boundSha256'] = sha(text)
    out['boundText'] = text if len(text) <= 8000 else None
    out['boundReadCommand'] = ['git', 'show', passage['authorPin'] + ':' + path]
    out['currentFileSha256'] = sha(current) if current is not None else None
    if current is None:
        out.update(classification='absent', startLine=None, endLine=None,
                   currentSha256=None, currentText=None, locator='file absent from pinned tree')
        return out
    now = current.decode('utf-8', errors='replace')
    lines = now.splitlines(True)
    start, end = passage['oldStartLine'], passage['oldEndLine']
    at_old = ''.join(lines[start - 1:end]) if start and end else None
    if passage.get('wholeFileContext'):
        kind, value, newstart = ('unchanged' if same_passage(now, text) else 'changed'), now, 1
    elif at_old == text or (at_old is not None and at_old.rstrip('\r\n') == text):
        kind, value, newstart = 'unchanged', text, start
    elif now.count(text) == 1:
        pos = now.index(text)
        kind, value, newstart = 'moved', text, now[:pos].count('\n') + 1
    else:
        # Map the bound interval through actual line edits. An unchanged operand
        # can locate a changed passage, but cannot certify its meaning.
        candidates = []
        if start and end:
            for tag, a, b, c, d in line_opcodes(passage['authorPin'], pin, path, current_path):
                if b > start - 1 and a < end:
                    if tag == 'equal':
                        lo, hi = c + max(start - 1 - a, 0), c + min(end - a, b - a)
                    else:
                        lo, hi = c, d
                    if hi > lo:
                        candidates.append((lo, hi))
        operand = passage.get('operand')
        if not candidates and operand and now.count(operand) == 1:
            n = now[:now.index(operand)].count('\n')
            candidates = [(max(0, n - 3), min(len(lines), n + 4))]
        if candidates:
            lo = min(a for a, b in candidates)
            hi = max(b for a, b in candidates)
            value, newstart = ''.join(lines[lo:hi]), lo + 1
            # Repeated equal text has no unique global locator, but the edit
            # mapping can still identify its exact moved interval.
            kind = 'moved' if same_passage(value, text) else 'changed'
        else:
            # Keep a current neighbouring passage as absence evidence, never
            # pretend that it is the vanished passage.
            n = min(max((start or 1) - 1, 0), max(0, len(lines) - 1))
            kind, value, newstart = 'absent', ''.join(lines[max(0, n - 2):n + 3]), max(0, n - 2) + 1
    if current_path != path and kind == 'unchanged':
        kind = 'moved'
    out.update(classification=kind, startLine=newstart,
               endLine=newstart + len(value.splitlines()) - 1,
               currentSha256=sha(value), currentText=value if len(value) <= 8000 else None,
               currentReadCommand=['git', 'show', pin + ':' + current_path],
               locator='neighbour-only; bound passage absent' if kind == 'absent' else 'current passage')
    return out


def same_passage(current, bound):
    """Ignore only one added/removed final LF, never other whitespace."""
    return current == bound or current == bound + '\n' or bound == current + '\n'


@functools.lru_cache(None)
def line_opcodes(oldpin, newpin, path, current_path):
    a = blob(oldpin, path) or b''
    b = blob(newpin, current_path) or b''
    return difflib.SequenceMatcher(None, a.splitlines(True), b.splitlines(True), autojunk=False).get_opcodes()


def records_at(pin):
    entries, counts = scope()
    rows = []
    rank = {'unchanged': 0, 'moved': 1, 'changed': 2, 'absent': 3}
    for entry in entries.values():
        passages = [classify_passage(p, pin) for p in bound_passages(entry)]
        primary = blob(pin, entry['record']['file'])
        rows.append({k: v for k, v in entry.items() if k not in ('record', 'dependencies')} | {
            'path': entry['record']['file'], 'authorPin': entry['record'].get('authorInputCommit'),
            'currentFileSha256': sha(primary) if primary is not None else None,
            'classification': max((p['classification'] for p in passages), key=rank.get) if passages else 'absent',
            'passages': passages})
    return rows, counts


def spec_chains():
    """Select one historical base and ordered composition successors per path.

    Superseded historical bodies stay in input files. Conditional final-pin
    bodies and generator evidence are explicitly included, never silently lost.
    The effective G9 body consolidates the chain onto file@pin for hash guards.
    """
    base = load(P8 / 'step-07-composed-patches.json')['patches']
    packet = load(HERE.parent / 'composition/patch-specs.json')
    byid = {s['id']: s for s in packet['patches']}
    chains = {s['path']: [dict(s, origin=REL(P8 / 'step-07-composed-patches.json'))] for s in base}
    effective = packet['effectiveSpecIds'] + packet.get('finalPinFSpecIds', [])
    for ident in effective:
        s = dict(byid[ident], origin=REL(HERE.parent / 'composition/patch-specs.json'))
        path = s['path']
        pred = s.get('predecessor')
        if not pred:
            chains[path] = [s]
        else:
            existing = chains.get(path, [])
            if existing and existing[-1]['expectedAfterSha256'] != s['beforeSha256']:
                raise ValueError('broken declared predecessor for ' + ident)
            if not existing:
                ancestor = byid.get(pred['patchSpecId'])
                if ancestor is None:
                    ancestor = next(x for x in base if x['patchSpecId'] == pred['patchSpecId'])
                existing = [dict(ancestor, origin=REL(HERE.parent / 'composition/patch-specs.json'))]
            chains[path] = existing + [s]
    # Active action records also name intentional no-byte-change bodies, which
    # effectiveSpecIds omits. They still require a current source hash guard.
    for action in load(HERE.parent / 'composition/actions.json')['actions']:
        ref = action.get('patchRef', '')
        ident = ref.split('#', 1)[1] if ref.startswith('patch-specs.json#') else None
        if ident in byid and byid[ident]['path'] not in chains:
            spec = byid[ident]
            if spec['beforeSha256'] == spec['expectedAfterSha256'] and not spec.get('predecessor'):
                chains[spec['path']] = [dict(spec, origin=REL(HERE.parent / 'composition/patch-specs.json'))]
    # Generated artifacts are evidence, not an alternative application door.
    # Cover every parked render and every changed output, not just hand patches.
    comp = HERE.parent / 'composition'
    for filename, key in [('skill-regeneration.json', 'patches'),
                          ('generator-all-output-deltas.json', 'deltas')]:
        for spec in load(comp / filename)[key]:
            chains[spec['path']] = [dict(spec, origin=REL(comp / filename), evidenceOnly=True)]
    for ident in packet.get('generatorEvidenceSpecIds', []):
        s = dict(byid[ident], origin=REL(comp / 'patch-specs.json'), evidenceOnly=True)
        if s.get('predecessor'):
            chains[s['path']].append(s)
        else:
            chains[s['path']] = [s]
    return chains


def chain_identity(chain):
    """Content identity shared by the sweep and independent replay check."""
    return [{'specId': s.get('id', s.get('patchSpecId')),
             'beforeSha256': s['beforeSha256'],
             'expectedAfterSha256': s['expectedAfterSha256'],
             'diffSha256': sha(s['diff'])} for s in chain]


def spec_sweep(pin):
    effective = {}
    packet = HERE / 'recomposed.json'
    if packet.exists():
        effective = {s['path']: s for s in load(packet)['specs']}
    drift = []
    chain_mismatches = []
    rows = []
    chains = spec_chains()
    # Reuse the owning exact authored-hunk locator and fuzz=0 patch replay.
    # Import lazily: recompose loads this module for its shared input contract.
    sp = importlib.util.spec_from_file_location('g9_body_replay', HERE / 'recompose.py')
    replay = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(replay)
    body_mismatches, replay_commands = [], []
    for path, chain in sorted(chains.items()):
        data = blob(pin, path)
        requires_absent = chain[0].get('requiresAbsent', False)
        actual = sha(data) if data is not None else (sha(b'') if requires_absent else None)
        chosen = effective.get(path)
        expected_chain = chain_identity(chain)
        recorded_chain = [{k: edge.get(k) for k in expected_chain[0]}
                          for edge in chosen.get('predecessorChain', [])] if chosen else []
        chain_matches = recorded_chain == expected_chain
        if not chain_matches:
            chain_mismatches.append({'path': path, 'recordedChain': recorded_chain,
                                     'currentCompositionChain': expected_chain,
                                     'error': 'recomposed body missing or stale; recompose before G9 can pass'})
        body_matches = False
        try:
            if not chosen:
                raise ValueError('missing recomposed body')
            if data is None and not requires_absent:
                raise ValueError('missing source preimage')
            preimage = (data or b'').decode()
            current = preimage
            for spec in chain:
                current, _ = replay.relocate(current, spec, replay_commands)
            # A self-roundtripping old body with refreshed metadata is not proof.
            body, _ = replay.relocate(preimage, chosen, replay_commands)
            if body.encode() != current.encode() or sha(body) != chosen['expectedAfterSha256']:
                raise ValueError('recomposed body bytes differ from current chain replay')
            body_matches = True
        except ValueError as error:
            body_mismatches.append({'path': path, 'error': str(error)})
        before = chosen['beforeSha256'] if chosen else chain[0]['beforeSha256']
        row = {'path': path, 'currentFileSha256': sha(data) if data is not None else None,
               'guardedPreimageSha256': actual, 'beforeSha256': before,
               'specId': chosen['id'] if chosen else chain[0].get('id', chain[0].get('patchSpecId')),
               'historicalSpecIds': [s.get('id', s.get('patchSpecId')) for s in chain],
               'predecessorChainMatchesCurrentComposition': chain_matches,
               'bodyBytesMatchCurrentChainReplay': body_matches,
               'requiresAbsent': requires_absent,
               'absenceGuardHolds': data is None if requires_absent else None,
               'evidenceOnly': any(s.get('evidenceOnly') for s in chain),
               'drifted': before != actual or actual is None or (requires_absent and data is not None)}
        rows.append(row)
        if row['drifted']:
            drift.append(row)
    extras = sorted(set(effective) - set(chains))
    ordered = load(P8 / 'step-07-patch-order.json')['patches']
    parks = [{'specId': s['patchSpecId'], 'path': s['path'], 'status': s['status'],
              'reason': 'No executable body at this path; see composition/actions.json for the retired-path/successor action.'}
             for s in ordered if s['path'] not in chains]
    errors = load(packet).get('unresolved', []) if packet.exists() else []
    historical = []
    for origin, key in [(P8 / 'step-07-composed-patches.json', 'patches'),
                        (HERE.parent / 'composition/patch-specs.json', 'patches')]:
        for spec in load(origin)[key]:
            data = blob(pin, spec['path'])
            actual = sha(data) if data is not None else (sha(b'') if spec.get('requiresAbsent') else None)
            historical.append({'specId': spec.get('id', spec.get('patchSpecId')),
                               'origin': REL(origin), 'path': spec['path'],
                               'beforeSha256': spec['beforeSha256'],
                               'currentFileSha256': sha(data) if data is not None else None,
                               'guardedPreimageSha256': actual,
                               'rawBeforeDiffers': actual != spec['beforeSha256'],
                               'predecessor': spec.get('predecessor'), 'replaces': spec.get('replaces'),
                               'effectiveSuccessorId': effective.get(spec['path'], {}).get('id'),
                               'policy': 'Historical/staged preimages are retained, never independently executable. The effective current-byte successor is the check guard.'})
    return {'files': rows, 'drifted': drift, 'predecessorChainMismatches': chain_mismatches,
            'bodyReplayMismatches': body_mismatches, 'bodyReplayCommands': replay_commands,
            'unrecognizedEffectivePaths': extras,
            'uncomposedHistoricalParks': parks, 'recompositionErrors': errors,
            'historicalComposedInputSweep': historical}


def evidence_digest(passages):
    # A new commit with identical source bytes does not reopen every record.
    # Current locators, kinds and content hashes do; the retrieval commit alone
    # is provenance, not content. This is the final-pin delta-review contract.
    stable = [{k: v for k, v in p.items() if k != 'currentReadCommand'} for p in passages]
    return sha(json.dumps(stable, sort_keys=True, ensure_ascii=False))


def judgment_errors(rows):
    path = HERE / 'judgments.json'
    judgments = {r['id']: r for r in load(path)['rows']} if path.exists() else {}
    errors = []
    for row in rows:
        j = judgments.get(row['id'])
        if not j:
            errors.append({'id': row['id'], 'error': 'missing judgment'})
            continue
        if (j.get('recordSha256') != row['recordSha256'] or
                j.get('evidenceSha256') != evidence_digest(row['passages'])):
            errors.append({'id': row['id'], 'error': 'judgment evidence changed'})
        if j.get('disposition') not in ('still-valid-as-recorded', 'needs-recomposition', 'owned-park'):
            errors.append({'id': row['id'], 'error': 'invalid disposition'})
        if j.get('disposition') == 'owned-park' and not (j.get('owner') and j.get('nextAction')):
            errors.append({'id': row['id'], 'error': 'park lacks owner/action'})
        if not j.get('reason'):
            errors.append({'id': row['id'], 'error': 'missing reason'})
        expected = [(p['path'], p['currentPath'], p['startLine'], p['endLine'], p['currentSha256'], p['boundSha256'])
                    for p in row['passages']]
        witnessed = [(p.get('path'), p.get('currentPath'), p.get('startLine'), p.get('endLine'), p.get('currentSha256'), p.get('boundSha256'))
                     for p in j.get('evidence', [])]
        if not expected or witnessed != expected:
            errors.append({'id': row['id'], 'error': 'missing or altered current locator/digest evidence'})
        if j.get('disposition') == 'needs-recomposition':
            packet = load(HERE / 'recomposed.json')
            spec = next((s for s in packet['specs'] if s['id'] == j.get('patchSpecId')), None)
            if not spec or spec['path'] != row['path'] or spec['beforeSha256'] != row['currentFileSha256']:
                errors.append({'id': row['id'], 'error': 'recomposition not bound to current file'})
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin', default='HEAD')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--details', action='store_true', help='Include all current and bound passages')
    args = ap.parse_args()
    pin = git('rev-parse', args.pin + '^{commit}').decode().strip()
    rows, cohorts = records_at(pin)
    specs = spec_sweep(pin)
    errors = judgment_errors(rows)
    result = {'pin': pin, 'memberships': cohorts, 'uniqueRecords': len(rows),
              'classificationCounts': dict(collections.Counter(r['classification'] for r in rows)),
              'passageCounts': dict(collections.Counter(p['classification'] for r in rows for p in r['passages'])),
              'specSweep': specs, 'judgmentErrors': errors, 'commands': COMMANDS,
              'scope': 'Interim only; not final pin F, semantic acceptance, parity, or gate approval.'}
    if args.details:
        result['records'] = rows
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.check and (errors or specs['drifted'] or specs['predecessorChainMismatches'] or
                       specs['bodyReplayMismatches'] or
                       specs['unrecognizedEffectivePaths'] or specs['recompositionErrors']):
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
