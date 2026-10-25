#!/usr/bin/env python3
"""Read-only premise checker: python3 -B check_shard.py --all | --shard N.

Reuses composition/compose.py's apply_diff/baseline and Step 7's exact hunk
locator. Stale predecessor reconstruction is DIAGNOSTIC, never hash approval.
Historical alternatives/generator evidence are inventoried, not executed (the
packet's selectionRule). Final-pin entries are simulated only in scratch.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import difflib
import fnmatch
from collections import Counter, defaultdict
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
PHASE = HERE.parents[1]
P8 = PHASE.parent / 'phase-08'
SCRATCH = Path('/tmp/fgos-work')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data.encode() if isinstance(data, str) else data).hexdigest()


def safe_path(value):
    require(isinstance(value, str) and value and '\\' not in value, 'invalid path')
    p = PurePosixPath(value)
    require(not p.is_absolute() and all(x not in ('', '.', '..') for x in value.split('/')),
            'unsafe path: ' + value)
    require(not value.startswith(('.fgos/', '.bee/')) and
            ('secrets' not in p.parts or value.startswith('docs/')), 'forbidden input')
    return value


@lru_cache(maxsize=None)
def blob(pin, file):
    safe_path(file)
    result = subprocess.run(['git', '--no-optional-locks', 'show', f'{pin}:{file}'],
                            cwd=ROOT, capture_output=True)
    return result.stdout if result.returncode == 0 else None


def load(path):
    return json.loads(path.read_text())


def check_span(pin, span):
    file = safe_path(span.get('file', span.get('path')))
    raw = blob(pin, file)
    if span.get('present') is False:
        require(raw is None and span['fileSha256'] is None, 'source not absent: ' + file)
        return
    require(raw is not None and sha(raw) == span['fileSha256'], 'file digest: ' + file)
    start = span.get('lineStart', span.get('startLine'))
    end = span.get('lineEnd', span.get('endLine'))
    lines = raw.decode().splitlines(keepends=True)
    require(type(start) is int and type(end) is int and 1 <= start <= end <= len(lines),
            'span bounds: ' + file)
    selected = ''.join(lines[start - 1:end])
    # Shard 2 hashes LF-inclusive spans; the other shards hash joined lines.
    text = selected if 'sha256' in span else '\n'.join(raw.decode().splitlines()[start - 1:end])
    require(text == span['text'], 'evidence text: ' + file + ':' + str(start))
    key = 'sha256' if 'sha256' in span else 'unitSha256'
    require(sha(text) == span[key], 'span digest: ' + file)


def replacement_result(before, replacements, number):
    lines = before.splitlines(keepends=True); seen = set()
    for replacement in replacements:
        n = replacement['line']; old = replacement['before']; new = replacement['after']
        require(type(n) is int and 1 <= n <= len(lines) and
                (number == 3 or n not in seen), 'replacement bounds')
        seen.add(n)
        require(old and old != new and lines[n - 1].count(old) == 1, 'replacement preimage')
        lines[n - 1] = lines[n - 1].replace(old, new)
    return ''.join(lines)


def patch_basis(patch, pin, states):
    file = safe_path(patch['file'])
    require(not any(k in patch for k in ['base', 'chainPin', 'rollbackDiff']), 'parallel patch contract')
    require(patch['basis'] in {'pin', 'chain'}, 'unknown patch basis')
    if patch['basis'] == 'pin':
        require('holder' not in patch and 'chainEntryIds' not in patch and
                'chainResultSha256' not in patch, 'ambiguous pin basis')
        raw = blob(pin, file)
        require(raw is not None, 'pin patch source absent')
        before = raw.decode()
    else:
        state = states.get(file)
        require(state is not None and state['strict'], 'non-strict chain basis: ' + file)
        require(patch['chainEntryIds'] == [t['chainEntryId'] for t in state['trace']],
                'chain entry basis: ' + file)
        before = state['text']
        require(patch['chainResultSha256'] == sha(before), 'chain result digest: ' + file)
    require(patch['status'] == 'prepared-not-applied' and sha(before) == patch['sourceSha256'],
            'patch preimage: ' + file)
    return before


def validate_shard(number, states):
    document = load(HERE / f'shard-{number}.json')
    require(document['patchContract'] == 'premise-patch.v1' and
            not any(k in document for k in ['chainRebases', 'successorPatches', 'postChainReplay']),
            'one patch contract required')
    pin = document['pin']
    require(re.fullmatch('[0-9a-f]{40}', pin), 'full shard pin required')
    ids_raw = (HERE / f'shard-{number}-ids.json').read_bytes()
    ids = json.loads(ids_raw)['rowIds']
    require(document['shard'] == number and document['idsSha256'] == sha(ids_raw), 'ids digest')
    rows = document['rows']
    require(len(set(ids)) == len(ids) and Counter(r['rowId'] for r in rows) == Counter(ids),
            'coverage must equal ids exactly')
    require(document['counts'] == dict(Counter(r['disposition'] for r in rows)), 'counts mismatch')
    proof_raw = blob(pin, (HERE.parent / 'proof.json').relative_to(ROOT).as_posix())
    require(sha(proof_raw) == document['proofSha256'], 'proof digest')
    proof = {r['rowId']: r for r in json.loads(proof_raw)['rows']}
    groups = document.get('groups')
    if isinstance(groups, list):
        require(Counter(rid for g in groups for rid in g['rowIds']) == Counter(ids), 'group coverage')
    patches = {}
    for row in rows:
        rid = row['rowId']; original = proof[rid]
        require(row['pin'] == pin and row['kind'] == original['result'], rid + ': pin/kind')
        require(row.get('reason') and row.get('group'), rid + ': missing judgment')
        if 'proofRowSha256' in row:
            require(row['proofRowSha256'] == sha(json.dumps(original, ensure_ascii=False,
                    sort_keys=True, separators=(',', ':'))), rid + ': proof row digest')
        source = row.get('source') or next(e for e in row['evidence'] if e.get('role') == 'source-unit')
        require(source.get('file', source.get('path')) == original['file'], rid + ': source identity')
        check_span(pin, source)
        if source.get('present') is not False:
            require(original['currentUnit'].rstrip('\r\n') in source['text'], rid + ': bound passage')
            start = source.get('lineStart', source.get('startLine'))
            end = source.get('lineEnd', source.get('endLine'))
            # Shard 2 explicitly rebinds exact units after intervening carries;
            # proof's older line ordinal is not its span locator.
            if number != 2:
                require(all(start <= n <= end for n in original['currentLines']), rid + ': bound lines')
            if number == 2:
                require(source['unitSha256'] == sha(original['currentUnit']), rid + ': source unit digest')
        require(row['evidence'], rid + ': evidence required')
        for span in row['evidence']:
            check_span(pin, span)
        allowed = {'preserve-confirmed', 'repoint', 'owned-park'} if row['kind'] == 'park-unconfirmed-preserve-premise' else {'retire-with-source', 'successor-bound', 'owned-park'}
        require(row['disposition'] in allowed, rid + ': disposition')
        if row['disposition'] in {'repoint', 'successor-bound'}:
            successor = row['successor']
            require(successor['section'].strip(), rid + ': successor section')
            check_span(pin, successor.get('unit', successor))
            if 'sectionEvidence' in successor:
                check_span(pin, successor['sectionEvidence'])
            for related in successor.get('relatedHolders', []):
                check_span(pin, related['unit'])
                check_span(pin, related['sectionEvidence'])
        if row['disposition'] == 'owned-park':
            require(row.get('owner') and row.get('nextAction'), rid + ': unowned park')
        if row.get('needsFlipDate'):
            require(row.get('flipDateReason'), rid + ': flip date reason')
        if row['disposition'] == 'repoint':
            require(row.get('patch') or row.get('alreadyComposed'), rid + ': missing patch/chain reference')
        if 'patch' in row:
            patch = row['patch']; file = safe_path(patch['file'])
            require(rid in patch['rowIds'], rid + ': patch identity')
            if 'holder' in patch:
                holder = patch['holder']; successor = row['successor']
                require(row['disposition'] == 'successor-bound' and patch['basis'] == 'chain' and
                        file == holder['file'] == successor.get('file', successor.get('path')) and
                        successor['section'] in holder['sections'], rid + ': successor holder identity/section')
                require(holder['evidence'], rid + ': holder evidence required')
                for span in holder['evidence']:
                    require(span.get('file', span.get('path')) == file, 'holder evidence file')
                    check_span(pin, span)
            else:
                require(file == original['file'], rid + ': patch identity')
            require(patches.setdefault(file, patch) == patch, 'same-file patches not composed')
    for file, patch in patches.items():
        require(Counter(patch['rowIds']) == Counter(r['rowId'] for r in rows
                if r.get('patch', {}).get('file') == file), 'patch group coverage')
        before = patch_basis(patch, pin, states)
        require(set(patch['rowIds']) == {rid for r in patch['replacements'] for rid in r['ownerRowIds']},
                'replacement owner coverage')
        for span in patch.get('contextEvidence', []):
            require(span.get('file', span.get('path')) == file, 'patch context evidence file')
            check_span(pin, span)
        # Bind the two ordinals through the actual pin -> base diff, not an
        # owner-supplied label. Unequal replacement blocks have no unique line
        # correspondence and require an explicit evidence rebind instead.
        source_lines = blob(pin, file).decode().splitlines()
        line_rebindings = {}
        for tag, a, z, b, y in difflib.SequenceMatcher(
                None, source_lines, before.splitlines(), autojunk=False).get_opcodes():
            if tag in {'equal', 'replace'} and z - a == y - b:
                line_rebindings.update((i + 1, b + i - a + 1) for i in range(a, z))
        for replacement in patch['replacements']:
            owners = replacement['ownerRowIds']; source_line = replacement['sourceLine']
            require(owners and len(set(owners)) == len(owners) and
                    set(owners) <= set(patch['rowIds']), 'replacement owners')
            for rid in owners:
                row = next(r for r in rows if r['rowId'] == rid)
                if 'holder' in patch:
                    spans = patch['holder']['evidence']
                else:
                    source = row.get('source') or next(e for e in row['evidence'] if e.get('role') == 'source-unit')
                    spans = [source] + patch.get('contextEvidence', [])
                    require(any(rid in r['ownerRowIds'] and
                            source.get('lineStart', source.get('startLine', 0)) <= r['sourceLine'] <=
                            source.get('lineEnd', source.get('endLine', -1)) for r in patch['replacements']),
                            rid + ': patch misses bound source')
                require(type(source_line) is int and any(
                        s.get('lineStart', s.get('startLine', 0)) <= source_line <=
                        s.get('lineEnd', s.get('endLine', -1)) for s in spans), rid + ': source ordinal binding')
                require(line_rebindings.get(source_line) == replacement['line'], rid + ': pin-to-base line binding')
        if 'holder' in patch:
            require(patch['holder']['sections'] and all(
                    section in before.splitlines() for section in patch['holder']['sections']), 'holder section absent')
        after = replacement_result(before, patch['replacements'], number)
        require(sha(after) == patch['proposedSha256'], 'patch postimage: ' + file)
        expected_diff = ''.join(difflib.unified_diff(before.splitlines(True),
                after.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
        require(patch['patch'] == expected_diff, 'patch differs from declared replacements: ' + file)
        headers = [s for s in patch['patch'].splitlines() if s.startswith(('--- ', '+++ '))]
        require(headers == [f'--- a/{file}', f'+++ b/{file}'], 'patch headers')
    for evidence in document.get('frozenPinEvidence', []):
        require(set(evidence) == {'file', 'rowIds', 'sourceSha256', 'proposedSha256', 'replacements'},
                'frozen evidence must not be an executable patch')
        require(evidence['file'] in patches and evidence['rowIds'] == patches[evidence['file']]['rowIds'],
                'orphan frozen evidence')
        raw = blob(pin, evidence['file'])
        require(sha(raw) == evidence['sourceSha256'] and sha(replacement_result(
                raw.decode(), evidence['replacements'], number)) == evidence['proposedSha256'],
                'frozen pin evidence digest')
    return document, proof, patches


def load_replayer():
    # Importing the composition module only defines its helpers/reads records;
    # its assembly/output door is guarded by __main__. It owns scratch cleanup.
    spec = importlib.util.spec_from_file_location('premise_composition', PHASE / 'composition/compose.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def finding(kind, file, **fields):
    return dict(kind=kind, file=file, resolved=False, **fields)


def replay_chain(pin, replayer, check_checkout=True):
    approved = load(P8 / 'step-07-composed-patches.json')['patches']
    packet = load(PHASE / 'composition/patch-specs.json')
    byid = {s['id']: s for s in packet['patches']}
    ids = packet['effectiveSpecIds'] + packet['finalPinFSpecIds']
    require(len(ids) == len(set(ids)), 'duplicate executable chain id')
    selected = defaultdict(list)
    for ident in ids:
        selected[safe_path(byid[ident]['path'])].append(byid[ident])
    predecessors = {safe_path(s['path']): s for s in approved}
    require(len(predecessors) == len(approved), 'ambiguous predecessor file')
    states, findings, inventory = {}, [], []
    for file in sorted(set(predecessors) | set(selected)):
        raw = blob(pin, file); text = (raw or b'').decode(); trace = []; strict = True
        current = ROOT / file
        require(not current.is_symlink(), 'symlink input: ' + file)
        if check_checkout:
            require((current.read_bytes() if current.is_file() else None) == raw, 'checkout drift: ' + file)
        prior = predecessors.get(file); specs = selected[file]
        # The chain's selection rule replaces an old predecessor when the first
        # effective spec is rooted directly in the current file (W9 replay).
        use_prior = prior is not None and (not specs or sha(text) != specs[0]['beforeSha256'])
        if prior:
            inventory.append(dict(chainEntryId=prior['patchSpecId'], file=file,
                                  selected=use_prior, replacedBy=specs[0]['id'] if specs and not use_prior else None))
        steps = ([prior] if use_prior else []) + specs
        for entry in steps:
            ident = entry.get('id', entry.get('patchSpecId')); before = text
            stale = sha(before) != entry['beforeSha256']
            if stale:
                strict = False
                issue = finding('staleChainEntry', file, chainEntryId=ident,
                                expectedBeforeSha256=entry['beforeSha256'], actualBeforeSha256=sha(before))
                findings.append(issue)
            try:
                if entry.get('predecessor'):
                    predecessor = entry['predecessor']
                    owner = byid.get(predecessor['patchSpecId']) or next(
                        (s for s in approved if s['patchSpecId'] == predecessor['patchSpecId']), None)
                    require(owner and owner['path'] == file and
                            entry['beforeSha256'] == predecessor['expectedAfterSha256'] == owner['expectedAfterSha256'],
                            'invalid named predecessor edge')
                if stale and entry is prior:
                    # Existing exact-current-passage rebase, only for diagnosis.
                    # baseline does not write any packet; never call output().
                    text = replayer.baseline(file)
                    issue['diagnosticRebase'] = True
                else:
                    require(not stale, 'no exact chain input; cannot certify replay')
                    text = replayer.apply_diff(file, before, entry['diff']) if entry['diff'] else before
                    require(sha(text) == entry['expectedAfterSha256'], 'chain postimage digest mismatch')
                    inverse = replayer.apply_diff(file, text, entry['rollbackDiff']) if entry['rollbackDiff'] else text
                    require(inverse == before, 'chain rollback mismatch')
                trace.append(dict(chainEntryId=ident, before=before, after=text, diagnostic=not strict))
            except (ValueError, AssertionError) as error:
                text = before
                strict = False
                if not stale:
                    findings.append(finding('conflictsWithChain', file, chainEntryId=ident, error=str(error)))
                else:
                    issue['replayError'] = str(error)
                # No invented bytes after a failed step. Later guards remain live.
        states[file] = dict(text=text, trace=trace, strict=strict)
    excluded = [s['id'] for s in packet['patches'] if s['id'] not in ids]
    file_proofs = [dict(file=file, strict=state['strict'], resultSha256=sha(state['text']),
                       steps=[dict(chainEntryId=t['chainEntryId'], beforeSha256=sha(t['before']),
                                   afterSha256=sha(t['after']), diagnostic=t['diagnostic'])
                              for t in state['trace']]) for file, state in states.items()]
    return states, findings, dict(predecessors=inventory, executableCompositionIds=ids,
                                 nonExecutableCompositionIds=excluded, selectionRule=packet['selectionRule'],
                                 files=file_proofs)


PATH_TOKEN = re.compile(r'(?:[\w.+*-]+/)+[\w./+*?{}<>-]*')


def contains_post(text, replacements):
    """Exact full post-line, or exact changed path after a chain line rewrap.

    Path witnesses require the old token absent and the new token present;
    unchanged prose/common path fragments alone cannot prove duplication.
    """
    for replacement in replacements:
        old, new = replacement['before'], replacement['after']
        if new in text and old not in text:
            continue
        old_paths = PATH_TOKEN.findall(old); new_paths = PATH_TOKEN.findall(new)
        if len(old_paths) != len(new_paths):
            return False
        changed = [(a, b) for a, b in zip(old_paths, new_paths) if a != b]
        if not changed or not all(b in text and a not in text for a, b in changed):
            return False
    return bool(replacements)


def patch_roundtrip(file, text, diff):
    # Row patches are new inputs, not a second implementation of chain replay.
    SCRATCH.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='premise-patch-', dir=SCRATCH) as directory:
        target = Path(directory) / file
        target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(text.encode())
        commands = []
        for direction in ['--forward', '--reverse']:
            cp = subprocess.run(['patch', '--batch', '--fuzz=0', '--no-backup-if-mismatch',
                                 '-p1', direction], input=diff.encode(), cwd=directory, capture_output=True)
            commands.append(dict(direction=direction, exit=cp.returncode,
                                 stdout=cp.stdout.decode(), stderr=cp.stderr.decode()))
            if cp.returncode:
                return dict(ok=False, commands=commands)
        return dict(ok=target.read_bytes() == text.encode(), commands=commands)


def cutover_removes(path, moving, tracked):
    """Expand directories/globs against the pin, not proof's exact-file flag."""
    if path in moving:
        return True
    if any(c in path for c in '*?['):
        members = [p for p in tracked if fnmatch.fnmatchcase(p, path)]
    else:
        members = [p for p in tracked if p.startswith(path.rstrip('/') + '/')]
    return bool(members) and all(p in moving for p in members)


def preservation_line(row, file, ordinal, replay_pin):
    """Bind preservation to an explicit upstream correction, never proposal bytes.

    Frozen evidence and judgments stay intact. A rebind names the single Git
    commit owning the correction, authenticates its span, and proves one-to-one
    source-line correspondence; without it the original obligation is unchanged.
    """
    original = blob(row['pin'], file).decode().splitlines()[ordinal - 1]
    rebind = row.get('preservationRebind')
    if not rebind:
        return original
    require(row['disposition'] == 'preserve-confirmed' and not row.get('patch') and
            not row.get('alreadyComposed'), 'preservation rebind cannot own a patch')
    correction = rebind['pin']; span = rebind['source']
    require(re.fullmatch('[0-9a-f]{40}', correction) and
            rebind['composedBy'] == correction and rebind.get('reason'),
            'preservation rebind needs an exact upstream owner and reason')
    require(span['file'] == file and rebind['sourceLine'] == ordinal and
            span['startLine'] == span['endLine'], 'preservation rebind source identity')
    for earlier, later in [(row['pin'], correction), (correction, replay_pin)]:
        require(subprocess.run(['git', '--no-optional-locks', 'merge-base',
                '--is-ancestor', earlier, later], cwd=ROOT, capture_output=True).returncode == 0,
                'preservation rebind is outside replay ancestry')
    check_span(correction, span)
    parent = blob(correction + '^', file)
    require(parent is not None and span['text'] not in parent.decode().splitlines(),
            'preservation rebind owner did not introduce the corrected line')
    old = blob(row['pin'], file).decode().splitlines()
    new = blob(correction, file).decode().splitlines()
    mapping = {}
    for tag, a, z, b, y in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if tag in {'equal', 'replace'} and z - a == y - b:
            mapping.update((i + 1, b + i - a + 1) for i in range(a, z))
    require(mapping.get(ordinal) == span['startLine'] and original != span['text'],
            'preservation rebind lacks an exact corrected source line')
    return span['text']


def preserved_line_survives(line, text):
    """Accept an exact line or insertion-only gloss, never a lost path operand."""
    if line in text.splitlines():
        return True
    paths = Counter(PATH_TOKEN.findall(line))
    for candidate in text.splitlines():
        if paths and any(Counter(PATH_TOKEN.findall(candidate))[p] != count for p, count in paths.items()):
            continue
        edits = difflib.SequenceMatcher(None, line, candidate, autojunk=False).get_opcodes()
        if all(tag in {'equal', 'insert'} for tag, *_ in edits):
            return True
    return False


def unwrap_comment_path(text):
    # Join only a slash-ended path continuation, not arbitrary prose or tokens.
    return re.sub(r'(?<=/)\n[ \t]*(?://[ \t]*)?', '', text)


def inspect_rows(number, document, proof, patches, states, replayer, moving, tracked):
    findings = []; patch_results = {}; checks = []
    for file, patch in patches.items():
        state = states.get(file, dict(text=blob(document['pin'], file).decode(), trace=[], strict=True))
        patch_results[file] = patch_roundtrip(file, state['text'], patch['patch'])
    for row in document['rows']:
        rid = row['rowId']; original = proof[rid]; file = original['file']
        state = states.get(file); marker = row.get('alreadyComposed'); duplicate_ids = []
        occurrence_lines = original['currentLines']
        if number == 2:
            # The evidence span can contain several independent references. Bind
            # this row's literal operand lines, not every line of the paragraph.
            source = row['source']; lines = blob(document['pin'], file).decode().splitlines()
            bound = [n for n in range(source['startLine'], source['endLine'] + 1)
                     if any(o['path'] in lines[n - 1] for o in original['normalizedOperands'])]
            occurrence_lines = bound or occurrence_lines
        patch = row.get('patch')
        if patch:
            target = patch['file']; patch_state = states.get(target)
            text = patch_state['text'] if patch_state else blob(document['pin'], target).decode()
            replacements = [r for r in patch['replacements'] if rid in r['ownerRowIds']]
            require(replacements, rid + ': patch misses bound occurrence')
            if patch_state and contains_post(text, replacements):
                duplicate_ids = [t['chainEntryId'] for t in patch_state['trace']
                                 if contains_post(t['after'], replacements) and not contains_post(t['before'], replacements)]
            if duplicate_ids:
                findings.append(finding('duplicateOfChain', file, rowId=rid, shard=number,
                                        chainEntryId=duplicate_ids[-1], diagnostic=not state['strict'],
                                        replacements=replacements))
            elif not patch_results[target]['ok']:
                findings.append(finding('conflictsWithChain', target, rowId=rid, shard=number,
                                        diagnostic=bool(patch_state and not patch_state['strict']), replay=patch_results[target]))
        elif row['disposition'] == 'preserve-confirmed' and state:
            # A preserved occurrence already rewritten by the chain is not a
            # context-only conflict: inspect its actual occurrence lines only.
            for n in occurrence_lines:
                line = preservation_line(row, file, n, replayer.PIN)
                if line and not preserved_line_survives(line, state['text']):
                    owners = [t['chainEntryId'] for t in state['trace'] if line in t['before'] and line not in t['after']]
                    if owners:
                        findings.append(finding('conflictsWithChain', file, rowId=rid, shard=number,
                                                chainEntryId=owners[-1], reason='preserved occurrence changed by chain', line=n))
                        break
        source_presence = ('already-absent' if blob(document['pin'], file) is None else
                           'removed-by-cutover' if cutover_removes(file, moving, tracked) else 'surviving')
        if row['disposition'] == 'successor-bound':
            # An already-absent source is distinct from a cutover removal. Both
            # can bind a surviving claim; only a surviving source is an error.
            if source_presence == 'surviving':
                findings.append(finding('successorOfSurvivingSource', file, rowId=rid, shard=number,
                                        reason='source file survives the cutover; a successor binding is not needed'))
        elif row['disposition'] == 'repoint' or marker:
            operands = original['normalizedOperands']
            require(operands, rid + ': missing operand facts')
            unaffected = [o for o in operands if not cutover_removes(o['path'], moving, tracked)]
            if unaffected:
                findings.append(finding('repointOfSurvivingPath', file, rowId=rid, shard=number,
                                        operands=unaffected, reason='operand survives or was already absent; no cutover move/removal'))
        if marker:
            # A name alone is not a waiver. Prove this row's post-image in that
            # entry, require no parallel patch, and never waive stale bytes.
            valid = isinstance(marker, str) and not patch and state is not None
            matches = [t for t in (state or {}).get('trace', []) if t['chainEntryId'] == marker]
            operands = [o['path'] for o in original['normalizedOperands']]
            valid = valid and len(matches) == 1 and state['strict']
            if valid:
                edits = list(replayer.step7.hunk_edits(''.join(difflib.unified_diff(
                    matches[0]['before'].splitlines(True), matches[0]['after'].splitlines(True)))))
                source_lines = blob(document['pin'], file).decode().splitlines()
                bound = [source_lines[n - 1] for n in occurrence_lines]
                successor = row.get('successor', {})
                destination = successor.get('file', successor.get('path'))
                valid = any(destination and destination in new and
                            any(line and line in old for line in bound) and
                            any(p in unwrap_comment_path(old) and p not in unwrap_comment_path(new)
                                for p in operands) and
                            new.strip() in state['text']
                            for old, new, _, _, _ in edits)
            if not valid:
                findings.append(finding('invalidAlreadyComposed', file, rowId=rid, shard=number,
                                        chainEntryId=marker, reason='reference must prove an exact effective retarget and carry no patch'))
            else:
                findings.append(dict(kind='duplicateOfChain', file=file, rowId=rid, shard=number,
                                     chainEntryId=marker, resolved=True, resolvedBy=marker,
                                     reason='exact bound retarget verified; no parallel row patch'))
        checks.append(dict(rowId=rid, file=file, disposition=row['disposition'],
                           sourcePresence=source_presence, alreadyComposed=marker))
    return dict(shard=number, pin=document['pin'], rows=len(document['rows']),
                preparedPatches=len(patches), patchBases=dict(Counter(p['basis'] for p in patches.values())),
                successorHolderPatches=sum('holder' in p for p in patches.values()),
                sourcePresenceCounts=dict(Counter(r['sourcePresence'] for r in checks)),
                patchReplays=patch_results, checks=checks), findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument('--all', action='store_true')
    selection.add_argument('--shard', type=int, choices=[1, 2, 3])
    args = parser.parse_args()
    pin = subprocess.check_output(['git', '--no-optional-locks', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    numbers = [1, 2, 3] if args.all else [args.shard]
    findings = []; summaries = []
    replayer = load_replayer()
    states, chain_findings, inventory = replay_chain(pin, replayer)
    validated = {}
    for number in numbers:
        try:
            validated[number] = validate_shard(number, states)
        except (ValueError, KeyError, TypeError, StopIteration) as error:
            findings.append(dict(kind='invalidShard', shard=number, resolved=False, error=str(error)))
    findings.extend(chain_findings)
    physical_proof = load(HERE.parent / 'proof.json')
    move_bytes = (P8 / 'step-05-cutover-move-set.json').read_bytes()
    require(sha(move_bytes) == physical_proof['inputs']['step-05-cutover-move-set.json'],
            'physical proof move-set drift; rerun proof before judging reachability')
    physical = physical_proof['physical']
    moving = {r['from'] for r in physical['physicalMoves']} | set(physical['additionalStep6Removals'])
    tracked = subprocess.check_output(['git', '--no-optional-locks', 'ls-tree', '-r', '--name-only', pin],
                                      cwd=ROOT, text=True).splitlines()
    for number, (document, proof, patches) in validated.items():
        summary, row_findings = inspect_rows(number, document, proof, patches, states, replayer, moving, tracked)
        summaries.append(summary); findings.extend(row_findings)
    for summary in summaries:
        files = {r['file'] for r in summary['checks']}
        own = [f for f in findings if f.get('shard') == summary['shard'] or
               ('shard' not in f and f.get('file') in files)]
        summary['counts'] = dict(sorted(Counter(f['kind'] for f in own).items()))
        summary['unresolved'] = sum(not f['resolved'] for f in own)
    # Record-level checks above retain their owning cases. One wiring check
    # subjects the result to every other prepared source through the F door.
    spec = importlib.util.spec_from_file_location('premise_shared_fchain', PHASE / 'fchain/check.py')
    shared = importlib.util.module_from_spec(spec); spec.loader.exec_module(shared)
    composed, _ = shared.compose(pin)
    if composed['exit']:
        findings.append(dict(kind='sharedFchainConflict', resolved=False, counts=composed['counts']))
    unresolved = sum(not f['resolved'] for f in findings)
    report = dict(sharedFchain=dict(exit=composed['exit'], files=len(composed['files']), counts=composed['counts']), sourceCommit=pin, command='python3 -B ' + str(Path(__file__).relative_to(ROOT)) +
                  (' --all' if args.all else f' --shard {args.shard}'), exit=1 if unresolved else 0,
                  scope='Mechanical chain/coverage proof only; no semantic approval or cutover readiness.',
                  reuse='composition/compose.py apply_diff + baseline; phase-08 step-07-assemble.py hunk_edits + locate_edit',
                  impactAnalysis='degraded: task forbids fgOS CLI; no impact-analysis tools exposed',
                  inputs={str(path.relative_to(ROOT)): sha(path.read_bytes()) for path in
                          [Path(__file__), P8 / 'step-07-composed-patches.json', PHASE / 'composition/patch-specs.json',
                           PHASE / 'composition/compose.py', P8 / 'step-07-assemble.py',
                           HERE.parent / 'proof.json', P8 / 'step-05-cutover-move-set.json'] +
                          [HERE / f'shard-{n}{suffix}.json' for n in numbers for suffix in ['', '-ids']]},
                  chain=inventory, movingPaths=len(moving), shards=summaries,
                  counts=dict(sorted(Counter(f['kind'] for f in findings).items())),
                  unresolved=unresolved, findings=findings)
    output = HERE / f'chain-check-{pin[:9]}.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(sourceCommit=pin, exit=report['exit'], counts=report['counts'],
                          unresolved=unresolved, report=str(output.relative_to(ROOT))), sort_keys=True))
    return report['exit']


if __name__ == '__main__':
    sys.exit(main())
