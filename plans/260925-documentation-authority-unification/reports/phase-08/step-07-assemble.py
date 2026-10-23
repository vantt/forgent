#!/usr/bin/env python3
"""One records-only final handoff door. No product writes, Git writes or CLI.

L12-124 supersedes the pilot-based assembly. Original Step 5 rNNNNN identities
are stable so L12-118..121 overlays remain exactly joinable. Final Step 3/4
identities are appended, not inferred to be inherited by Step 5.
"""
from __future__ import annotations
import argparse
import collections
import difflib
import functools
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PLAN = ROOT / 'plans/260925-documentation-authority-unification'
STAGES = {'step-03': 'step-03-records', 'step-04': 'step-04-records', 'step-05': 'step-05-records'}
CLASSES = ('applied-safe', 'prepared-for-cutover', 'preserved-history/fixture', 'individually parked', 'rejected-not-consumer')


def read_json(path):
    return json.loads(path.read_text())


def compact_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n'


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], stderr=subprocess.PIPE).decode().strip()


@functools.lru_cache(maxsize=None)
def source(pin, path):
    # Only tracked source blobs; never follow a checkout symlink or open live state.
    if path.startswith('.fgos/') or ('secrets' in pathlib.PurePosixPath(path).parts and not path.startswith('docs/')):
        raise ValueError('forbidden source input: ' + path)
    # docs/platform/secrets/spec.md is public documentation, not a secret store.
    result = subprocess.run(['git', '-C', str(ROOT), 'show', pin + ':' + path], capture_output=True)
    return result.stdout.decode() if result.returncode == 0 else None


def record_files(directory):
    if directory not in STAGES.values():
        raise ValueError('only FINAL record directories admitted; pilot/revision input refused: ' + directory)
    return sorted((HERE / directory).glob('*.jsonl'))


def load_records():
    records = []
    for stage, directory in STAGES.items():
        files = record_files(directory)
        if len(files) != {'step-03': 130, 'step-04': 33, 'step-05': 33}[stage]:
            raise ValueError('final batch conservation failed: ' + directory)
        for path in files:
            for n, line in enumerate(path.read_text().splitlines(), 1):
                if line:
                    records.append((stage, str(path.relative_to(ROOT)), n, json.loads(line)))
    return records


def item_id(item, stage):
    # One census edge can span many physical Step 4 slots. Bind the slotKey,
    # including supplemental null-edgeId slots, instead of collapsing them.
    if stage == 'step-04':
        return str(item.get('edgeId') or 'slot') + '@' + sha(item['slotKey'])[:20]
    return str(item.get('referenceId') or item.get('id') or item.get('edgeId'))


def classify(item):
    d = item.get('disposition')
    if d == 'preserve' and item.get('admission') == 'REJECT':
        return 'rejected-not-consumer'
    if d in ('patch', 'phase9-row-flip', 'render-join'):
        return 'prepared-for-cutover'
    if d == 'preserve' or item.get('retiresWithTree'):
        return 'preserved-history/fixture'
    if d == 'parked':
        return 'individually parked'
    raise ValueError('unknown disposition: ' + str(d))


def owner_for(file, item):
    if file == 'AGENTS.md':
        return 'AGENTS.md cutover packet'
    if item.get('owner'):
        return item['owner']
    category = str(item.get('blockedCategory') or '')
    if 'GAP-01' in category:
        return 'Work-state / participant-contract owner'
    if 'GAP-02' in category or 'platform-foundations' in file:
        return 'Platform-foundations / locked-law holder owner'
    if 'reading-map' in file:
        return 'Documentation-navigation owner'
    if 'registry' in category or 'registry' in file:
        return 'Knowledge-registry owner'
    if 'decision' in file or 'citation' in file:
        return 'Decision-index / area-holder mapping owner'
    return 'Documentation consumer-composition owner (' + file + ')'


def build_matrix(records):
    rows = []
    for stage, path, n, record in records:
        fields = ('references', 'dynamicTraces', 'authorAddedReferences') if stage == 'step-05' else ('edges',)
        for field in fields:
            for item in record.get(field, []):
                file = item.get('consumerFile') or record['file']
                custody = next(((k, item[k]) for k in ('nonDocumentUse', 'sourceOwner', 'inheritedOwner', 'reason') if item.get(k) is not None), None)
                row = dict(stage=stage, record=path, recordLine=n, file=file,
                           referenceId=item_id(item, stage), admission=item.get('admission'),
                           recordDisposition=item.get('disposition'), dispositionClass=classify(item),
                           target=item.get('target') or item.get('writeDestination'),
                           writer=bool(item.get('aliasWriteCheck', {}).get('isWriter') or item.get('writeDestination')),
                           owner=owner_for(file, item), blocker=item.get('blockedReason') or item.get('dependency'),
                           custody=custody, item=item, recordObject=record, parkFamilyId=None)
                if row['dispositionClass'] == 'rejected-not-consumer' and custody is None:
                    raise ValueError('rejected row has no custody')
                rows.append(row)
    # Exact old sorting for Step 5; never renumber its overlay identities.
    key = lambda r: (r['file'], r['stage'], r['record'], r['recordLine'], r['referenceId'])
    old = sorted((r for r in rows if r['stage'] == 'step-05'), key=key)
    if len(old) != 46404:
        raise ValueError('Step 5 population changed; rejoin overlays explicitly')
    for i, row in enumerate(old, 1):
        row['rowId'] = f'r{i:05d}'
    added = sorted((r for r in rows if r['stage'] != 'step-05'), key=key)
    for i, row in enumerate(added, 1):
        row['rowId'] = f'f{i:05d}'
    return old + added


def apply_prior_resolutions(pin, rows):
    resolution = read_json(HERE / 'step-07-park-resolution-applied.json')
    integration = read_json(HERE / 'step-07-integration-inputs.json')
    proof = HERE / integration['proof']
    if sha(proof.read_text()) != integration['proofSha256']:
        raise ValueError('integration premise proof changed')
    for rec in resolution['recordCatalog']:
        if sha((HERE / rec['path']).read_text()) != rec['sha256']:
            raise ValueError('historical resolution record changed: ' + rec['path'])
    subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', integration['sourceCommit'], pin], check=True)
    by_id = {r['rowId']: r for r in rows}
    updates = {r['rowId']: r for r in resolution['reevaluations']}
    updates.update({r['rowId']: r for r in integration['reevaluations']})
    owners = {r['rowId']: r for r in integration['parkOwners']}
    for old in resolution['rows']:
        row = by_id[old[0]]
        if (row['referenceId'], row['recordLine'], row['file'], row['recordDisposition']) != (old[4], old[2], resolution['fileCatalog'][old[3]], 'parked'):
            raise ValueError('historical member join changed: ' + old[0])
        update = updates.get(old[0])
        d = update['newDisposition'] if update else old[7]
        blocker = update['remainingBlocker'] if update else resolution['blockerCatalog'][old[10]]['blocker'] if old[10] is not None else None
        row.update(dispositionClass=classify({'disposition': d}), effectiveDisposition=d,
                   parkFamilyId=old[5], blocker=blocker)
    for change in integration['reevaluations']:
        row = by_id[change['rowId']]
        row.update(dispositionClass=classify({'disposition': change['newDisposition']}),
                   effectiveDisposition=change['newDisposition'], blocker=change['remainingBlocker'],
                   parkFamilyId=change.get('parkFamilyId') or row['parkFamilyId'])
    for rid, park in owners.items():
        row = by_id[rid]
        if row['dispositionClass'] != 'individually parked':
            raise ValueError('prior park resolution lost')
        row.update(owner=park['owner'], blocker=park['remainingBlocker'], parkFamilyId=park['familyId'])
    if sum(r['dispositionClass'] == 'individually parked' for r in rows if r['stage'] == 'step-05') != 214:
        raise ValueError('L12-118..121 effective park conservation failed')
    # New records never alter the conserved 2,311-member historical denominator.
    return resolution


def append_rescan(rows, pin):
    path = HERE / 'step-08-post-census-records.jsonl'
    for n, line in enumerate(path.read_text().splitlines(), 1):
        rec = json.loads(line)
        if rec['authorInputCommit'] != pin or sha(source(pin, rec['file'])) != rec['sourceSha256']:
            raise ValueError('post-census record not bound to final pin: ' + rec['file'])
        for item in rec['references']:
            rows.append(dict(rowId=item['referenceId'], stage='step-05-post-census',
                             record=str(path.relative_to(ROOT)), recordLine=n, file=rec['file'],
                             referenceId=item['referenceId'], admission=item['admission'],
                             recordDisposition=item['disposition'], dispositionClass=classify(item),
                             owner=item['owner'], blocker=item.get('blockedReason'),
                             target=item.get('writeDestination'), writer=item['aliasWriteCheck']['isWriter'],
                             custody=('nonDocumentUse', item['nonDocumentUse']) if item.get('nonDocumentUse') else None,
                             parkFamilyId=None, item=item, recordObject=rec))


def hunk_edits(diff):
    """Read exact authored hunk changes, without applying historical context at a new pin."""
    lines = diff.splitlines(True)
    i = 0
    while i < len(lines):
        if not lines[i].startswith('@@ '):
            i += 1
            continue
        header = lines[i].rstrip('\n')
        i += 1
        old, new = [], []
        while i < len(lines) and not lines[i].startswith(('@@ ', '--- ')):
            line = lines[i]
            if line.startswith(' '):
                old.append(line[1:]); new.append(line[1:])
            elif line.startswith('-'):
                old.append(line[1:])
            elif line.startswith('+'):
                new.append(line[1:])
            elif line.startswith('\\ No newline'):
                raise ValueError('no-newline hunk requires manual composition')
            else:
                raise ValueError('malformed hunk')
            i += 1
        if not old and not new:
            raise ValueError('empty hunk')
        for tag, a, b, c, d in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
            if tag != 'equal':
                yield ''.join(old[a:b]), ''.join(new[c:d]), ''.join(old[:a]), ''.join(old[b:]), header


def locate_edit(before, old, new, prefix, suffix):
    if old and before.count(old) == 1:
        return before.index(old), before.index(old) + len(old), new
    # Context is a content witness, never a stale ordinal. Require one exact join.
    candidates = []
    needle = prefix + old + suffix
    if needle:
        start = 0
        while (at := before.find(needle, start)) >= 0:
            candidates.append((at + len(prefix), at + len(prefix) + len(old), new))
            start = at + 1
    if len(candidates) != 1:
        raise ValueError('absent-or-ambiguous-current-hunk:' + sha(old + prefix + suffix)[:16])
    return candidates[0]


def patch_roundtrip(path, before, after, diff, rollback):
    scratch = pathlib.Path('/tmp/fgos-work')
    scratch.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='handoff-patch-', dir=scratch) as name:
        root = pathlib.Path(name)
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(before)
        for payload, expected in ((diff, after), (rollback, before)):
            result = subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], input=payload, text=True, cwd=root, capture_output=True)
            if result.returncode or target.read_text() != expected:
                raise ValueError('patch-fuzz0-roundtrip-failed:' + result.stdout + result.stderr)
    return {'command': 'patch --batch --fuzz=0 -p1 (forward then rollback)', 'forwardExit': 0, 'rollbackExit': 0, 'exactBytes': True}


def build_patch_order(pin, rows, records):
    by_file = collections.defaultdict(list)
    for row in rows:
        if row['dispositionClass'] == 'prepared-for-cutover':
            by_file[row['file']].append(row)
    supplemental = read_json(HERE / 'step-07-final-prepared-specs.json')
    for spec in supplemental['specs']:
        by_file.setdefault(spec['path'], [])
    diffs = collections.defaultdict(list)
    for stage, recpath, n, rec in records:
        if rec.get('diff'):
            diffs[rec['file']].append((recpath, n, rec, rec['diff']))
    for spec in supplemental['specs']:
        diffs[spec['path']].append(('step-07-final-prepared-specs.json#' + spec['id'], None,
                                    {'sourceSha256': spec['beforeSha256'], 'authorInputCommit': spec['sourceCommit']}, spec['diff']))
    patches, bodies, changed = [], [], []
    for path, members in sorted(by_file.items()):
        before = source(pin, path)
        spec_id = 'file:' + path
        refs, edits, failures = [], set(), []
        retiring = any(r['recordObject'].get('retiresWithTree') or r['item'].get('retiresWithTree') for r in members)
        # Retiring tree records cannot smuggle a pilot patch back into the handoff.
        if retiring:
            for row in members:
                row.update(dispositionClass='preserved-history/fixture', effectiveDisposition='retire-with-tree', patchSpecId=None)
            continue
        for recpath, n, rec, diff in diffs[path]:
            expected = rec.get('sourceSha256') or rec.get('digest')
            current = sha(before) if before is not None else None
            refs.append(dict(record=recpath, recordLine=n, recordSourceSha256=expected, sourceSha256AtPin=current, diffSha256=sha(diff)))
            if expected != current:
                changed.append(dict(path=path, record=recpath, recordLine=n, beforeSha256=expected, sourceSha256AtPin=current))
            try:
                if before is None:
                    raise ValueError('path-absent-at-pin')
                headers = re.findall(r'^--- a/(.+)$', diff, re.M)
                if headers != [path]:
                    raise ValueError('diff-target-is-not-owning-file')
                for old, new, prefix, suffix, _ in hunk_edits(diff):
                    edits.add(locate_edit(before, old, new, prefix, suffix))
            except ValueError as error:
                failures.append(recpath + ':' + str(n) + ':' + str(error))
        if not diffs[path]:
            failures.append('exact-generator-render-or-row-action-not-composed')
        ordered = sorted(edits)
        for left, right in zip(ordered, ordered[1:]):
            if right[0] < left[1] or right[0] == left[0]:
                failures.append('overlapping-final-Step3/4/5-hunks-require-semantic-composition')
        if not failures and not edits:
            failures.append('prepared-row-has-no-effective-text-hunk')
        after = before
        if not failures:
            for a, b, new in reversed(ordered):
                after = after[:a] + new + after[b:]
            forward = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/' + path, tofile='b/' + path))
            inverse = ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True), fromfile='a/' + path, tofile='b/' + path))
            try:
                proof = patch_roundtrip(path, before, after, forward, inverse)
            except ValueError as error:
                failures.append(str(error))
        owner = owner_for(path, {})
        status = 'parked' if failures else 'composed-at-pin'
        blockers = sorted(set(failures)) if failures else ['independent-composed-file-review-and-owning-parity-replay']
        spec = dict(patchSpecId=spec_id, path=path, sourceCommit=pin,
                    beforeSha256=sha(before) if before is not None else None,
                    rowIds=[r['rowId'] for r in members], recordRefs=refs,
                    status=status, owner=owner, blockers=blockers,
                    expectedAfterSha256=sha(after) if not failures else None,
                    composedOnce=not failures, forwardDiffRef=None, rollbackDiffRef=None)
        if not failures:
            body = dict(patchSpecId=spec_id, path=path, beforeSha256=sha(before), expectedAfterSha256=sha(after), diff=forward, rollbackDiff=inverse, roundtrip=proof)
            bodies.append(body)
            spec.update(forwardDiffRef='step-07-composed-patches.json#' + spec_id,
                        rollbackDiffRef='step-07-composed-patches.json#' + spec_id,
                        forwardSha256=sha(forward), rollbackSha256=sha(inverse))
        for row in members:
            row['patchSpecId'] = spec_id
            if failures:
                row.update(dispositionClass='individually parked', compositionPark=True,
                           blocker='Final file composition blocked; see step-07-patch-order.json#' + spec_id,
                           owner=owner)
        patches.append(spec)
    return (dict(version=3, sourceCommit=pin, patches=patches,
                 rollbackOrder=[s['patchSpecId'] for s in reversed(patches) if s['composedOnce']],
                 parkedSpecIds=[s['patchSpecId'] for s in patches if not s['composedOnce']],
                 sourceRecompositionChecks=changed),
            dict(sourceCommit=pin, recordsOnly=True, appliedToWorkspace=False, patches=bodies))


def assemble(pin_arg, output_dir, final=False):
    if not final:
        raise ValueError('L12-124 requires --final; pilot/dry-run assembly is retired')
    if output_dir.resolve() != HERE:
        raise ValueError('outputs must stay in the authorized records directory')
    pin = git('rev-parse', pin_arg + '^{commit}')
    records = load_records()
    rows = build_matrix(records)
    resolution = apply_prior_resolutions(pin, rows)
    append_rescan(rows, pin)
    order, bodies = build_patch_order(pin, rows, records)
    aliases = {r['oldPath'] for r in read_json(HERE / 'step-05-cutover-move-set.json')['paths']} - {'docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'}
    violations = [r['rowId'] for r in rows if r['writer'] and r['target'] in aliases]
    if violations:
        raise ValueError('alias writer destination: ' + str(violations))
    counts = collections.Counter(r['dispositionClass'] for r in rows)
    by_stage = {stage: dict(collections.Counter(r['dispositionClass'] for r in rows if r['stage'] == stage)) for stage in sorted({r['stage'] for r in rows})}
    catalog_paths = sorted({r['record'] for r in rows})
    record_ids = {p: f'rec{i:03d}' for i, p in enumerate(catalog_paths, 1)}
    record_catalog = [{'id': record_ids[p], 'path': str(pathlib.Path(p).relative_to(HERE.relative_to(ROOT))), 'sha256': sha((ROOT / p).read_text())} for p in catalog_paths]
    writer_counts = collections.Counter(r['dispositionClass'] for r in rows if r['writer'])
    alias_check = dict(basis='effective dispositions after L12-118..121 and final file composition; post-census writer traces included', aliasPathCount=len(aliases), writerRows=sum(writer_counts.values()), writerRowsByClass=dict(writer_counts), violations=0,
                       scope='Step 3/4 have no writer edges; original 51 Step 5 writers plus explicitly traced post-census writer sites. REJECT includes stderr/validator false positives; no inferred write destination from a role hint.')
    schema = ['rowId', 'record', 'recordLine', 'referenceId', 'dispositionClass', 'patchSpecId', 'parkFamilyId', 'blocker', 'appliedEditEvidence']
    matrix_rows, rejected, custody = [], [], {}
    for row in rows:
        common = [row['rowId'], record_ids[row['record']], row['recordLine'], row['referenceId']]
        if row['dispositionClass'] == 'rejected-not-consumer':
            if row['custody'] is None:
                raise ValueError('rejected row lacks non-document trace: ' + row['rowId'])
            key = compact_json(row['custody'])
            custody.setdefault(key, 'cust' + str(len(custody) + 1))
            rejected.append(common + [custody[key]])
        else:
            matrix_rows.append(common + [row['dispositionClass'], row.get('patchSpecId'), row['parkFamilyId'], 'park:' + row['rowId'] if row['dispositionClass'] == 'individually parked' else None, None])
    parks = []
    blocker_catalog = {}
    for row in rows:
        if row['dispositionClass'] != 'individually parked':
            continue
        blocker = row['blocker'] or 'Source record park requires explicit holder/parity disposition'
        if row['stage'] in ('step-03', 'step-04') and not row.get('compositionPark'):
            # The full original blocker often repeats the complete source paragraph.
            # Reference those exact frozen bytes instead of copying that paragraph.
            binding = dict(kind='original-record-blocker', record=record_ids[row['record']],
                           recordLine=row['recordLine'], memberId=row['referenceId'],
                           field='edges[].blockedReason or edges[].dependency',
                           category=row['item'].get('blockedCategory'),
                           slotKeySha256=sha(row['item']['slotKey']) if row['item'].get('slotKey') else None,
                           sha256=sha(blocker))
            blocker = compact_json(binding).rstrip('\n')
        blocker_catalog.setdefault(blocker, 'b' + str(len(blocker_catalog) + 1))
        parks.append(dict(rowId=row['rowId'], file=row['file'], memberId=row['referenceId'],
                          familyId=row['parkFamilyId'], owner=row['owner'],
                          remainingBlockerRef=blocker_catalog[blocker],
                          record=record_ids[row['record']], recordLine=row['recordLine']))
    gates = read_json(HERE / 'step-08-preflip-gates.json')
    if gates['sourceCommit'] != pin:
        raise ValueError('pre-flip gates are not pinned')
    obligations = read_json(HERE / 'step-07-final-obligations.json')['obligations']
    obligations = [dict(r, status='pre-flip gate' if r.get('blocker') else r['status']) for r in obligations]
    for r in obligations:
        if r['status'] == 'pre-flip gate':
            r.update(assignmentAuthority='L12-124', executionStage='Phase 9 PRE-FLIP; any Step 7 actor in retained blocker text is historical')
        if r['id'] == 'common-light-Git-fixture-tests':
            r.update(status='close gate', executionStage='Lead proof before closure; no suite waiver')
        if r['id'] == 'final-pin':
            r.update(status='pinned-source-only', evidence='step-07-final-determinism.json', sourceCommit=pin)
        if r['id'] == 'current-census-semantic-join':
            r.update(blocker='Behavioral sites are individually traced in step-08-post-census-records.jsonl. Non-behavioral census joins remain the owned pre-flip gate; no runtime coverage inferred from a lexical count.', evidence='step-08-preflip-gates.json#non-behavioral-census-join')
    moves = dict(source='step-05-cutover-move-set.json', retainPhysicalPaths=['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'], suppressMovesFrom=['docs/decisions/index.md', 'docs/architecture-manifest.json'], dropProposedDestination='docs/knowledge/decisions-index/decision-record.md', authority='L12-96; L12-118..121; L12-124')
    matrix = dict(version=3, sourceCommit=pin, recordsOnly=True, generatedBy='step-07-assemble.py', counts=dict(rows=len(rows), consumerRows=len(matrix_rows), rejectedRows=len(rejected), byDispositionClass={k: counts[k] for k in CLASSES}, byStage=by_stage), recordCatalog=record_catalog, consumerRowSchema=schema, consumerRows=matrix_rows, rejectedNotConsumerRowSchema=['rowId', 'record', 'recordLine', 'referenceId', 'nonDocumentUseOrCustody'], rejectedNotConsumerDispositionClass='rejected-not-consumer', rejectedNotConsumerRows=rejected, custodyCatalog=[dict(id=value, kind=json.loads(key)[0], value=json.loads(key)[1]) for key, value in custody.items()], unmatchedRows=[], aliasViolations=[], aliasWriterCheck=alias_check, effectiveMoveSet=moves,
                  historicalOverlay='step-07-park-resolution-applied.json; step-07-integration-inputs.json', blockerRefs='step-07-readiness.json#parkOwners')
    candidate_union = []
    for prior in read_json(HERE / 'step-07-final-binding-check.json')['files']:
        text = source(pin, prior['path'])
        candidate_union.append(dict(path=prior['path'], sha256=sha(text) if text is not None else None,
                                    historicalSha256=prior['sha256'], sourceCommit=pin,
                                    status='current-source-pinned; current-digest independent review pending' if text is not None else 'retired; explicit successor receipt required',
                                    historicalBindingReceipt='step-07-final-binding-check.json#' + prior['path'],
                                    sourceChangedSinceReceipt=(sha(text) if text is not None else None) != prior['sha256']))
    readiness = dict(version=3, sourceCommit=pin, recordsOnly=True, readyForCutover=False, noReadinessClaim=True, rowCounts=matrix['counts'], parkOwners=parks,
                     blockerCatalog=[dict(id=v, **(json.loads(k) if k.startswith('{"category":') else {'blocker': k})) for k, v in blocker_catalog.items()],
                     aliasWriterCheck=alias_check,
                     specialObligations=obligations, preFlipGates=gates['gates'], gateDetails='step-08-preflip-gates.json', lowNotes=gates['lowNotes'],
                     unrunRequiredChecks=read_json(HERE / 'step-07-final-verification.json')['unrunRequiredChecks'],
                     closeGates=[dict(id='lead-full-suite-and-baseline', owner='Lead', status='pending', blocker='Full suite and exact main-vs-branch attribution before closure; no test execution in this records turn.'),
                                 dict(id='actual-runner-pair-accounting', owner='Lead / separate L12-11 accounting Unit', status='pending', blocker='Account actual future runner commit/path pairs, then both clean committed reproduction recipes and owning tests before closure.'),
                                 dict(id='fresh-independent-closure-review', owner='Lead / independent A38 reviewer', status='pending', blocker='No independent acceptance of this rebuilt handoff is claimed.')],
                     parkProjection=resolution['effectiveFamilies'], parkProjectionMemberCount=2311,
                     changedCandidateUnion=candidate_union,
                     rowReadinessCounts=dict(rows=len(rows), blockedRows=counts['prepared-for-cutover'] + counts['individually parked'], nonPreparedNonParkedRows=len(rows)-counts['prepared-for-cutover']-counts['individually parked'], basis='Disposition counts only, NOT readiness: source-context-and-post-pin-recomposition and every other PRE-FLIP gate still apply. No readyRows eligibility claim.'),
                     historicalParkConservation=dict(originalMembers=2311, flips=2131, originalFamilyParks=180, additionalIntegrationParks=34),
                     matrixViolations=dict(writerDestinationAliases=0, unmatchedRows=0),
                     externalParks=resolution['externalLocatorReevaluations'])
    order['effectiveMoveSet'] = moves
    report = ['# Rebuilt final consumer handoff', '', f'Source pin: `{pin}`. Authority: L12-124. Records only; no cutover or independent acceptance.', '',
              '## Final populations', '', f'- Rows: {len(rows)}; consumer rows: {len(matrix_rows)}; rejected rows: {len(rejected)}.',
              '- Classes: ' + '; '.join(f'{k}: {counts[k]}' for k in CLASSES) + '.',
              '- Final inputs: 130 Step 3 batches / 1,037 records; 33 Step 4 batches / 275 records; 33 Step 5 batches / 1,481 memberships. No pilot directory is read; the loader rejects one.',
              '- Every final Step 3/4 edge is represented independently; these are NOT deduplicated into the Step 5 population. Retiring-tree zero-edge records remain retirement receipts, never patches.',
              '- L12-118..121 original 2,311 members, 2,131 flips, 180 family parks and 34 additional parks remain historical decisions. A later composition park is additive and never cancels their ruling.', '', '## Composition', '',
              f"- One spec per file: {len(order['patches'])}; composed: {len(bodies['patches'])}; named composition parks: {len(order['parkedSpecIds'])}.",
              '- Every executable spec has one forward diff, rollback diff, before/after SHA-256 and actual patch --fuzz=0 roundtrip in /tmp/fgos-work. All final Step 3/4/5 diff refs and supplemental hunks are co-composed; ambiguous/overlapping/missing hunks park the complete file, not silently omit an edit.',
              '- Render-only/row/generator actions without exact final composition remain owned parks; no hand editing of generated skills or projections is proposed.',
              '- Source drift and its disposition are enumerated in patch-order.sourceRecompositionChecks and step-08-source-recomposition.json. Historical source digests are not overwritten.', '', '## Parks and gates', '',
              f'- All {len(parks)} effective parks are individually owned in step-07-readiness.json#parkOwners, with original record locators and blockers.',
              '- step-08-preflip-gates.json enumerates current-digest changed-binding reviews, L12-96 composition duties, non-behavioral census joins, all 17 dropped claims, Git one-door sites, retention, L12-129 archive/reader/checkout, current-source recomposition, final-code holder Land and staged docs-lease release gates. Every gate is explicitly PRE-FLIP, not met. Disposition-only counts are not readiness. Verify beforeSha256 equality before every patch application; fuzz-zero alone is insufficient. Lead suite and independent closure remain required before close.',
              '- Step 1 current-disposition table: step-08-current-judgments.json (47/47).',
              '- Post-census admission/disposition and parity obligations: step-08-post-census-records.jsonl; no live state, secrets, product code or runtime was read/executed.',
              '- SC2 checks effective classes. The former 7/17/27 versus 8/16/27 split was original versus effective overlay classification, not differing writer populations. New writer expressions include false-positive stderr/validation and non-document destinations, explicitly traced rather than guessed aliases.',
              '- L12-121 post-move premise proof covers 9,650 Step 5 inputs, not the Step 3 preserve population. Step 3/4 preserve premises have a separate pre-flip review gate; no expanded post-move proof is fabricated.', '', '## Reproduce', '', f'`python3 -B {HERE.relative_to(ROOT)}/step-07-assemble.py --final --pin {pin}`', '',
              'Two actual byte-identical runs and all output sizes/hashes are in step-07-final-determinism.json. Total handoff outputs must remain below 8,000,000 bytes. Pair accounting is last and cannot pre-account the future runner commit.', '']
    rendered = {'step-07-consumer-cutover-matrix.json': compact_json(matrix), 'step-07-patch-order.json': compact_json(order), 'step-07-readiness.json': compact_json(readiness), 'step-07-composed-patches.json': compact_json(bodies), 'step-07-final-assembly-report.md': '\n'.join(report)}
    total = sum(len(v.encode()) for v in rendered.values())
    if total >= 8_000_000:
        raise ValueError('handoff exceeds 8 MB: ' + str(total) + ' ' + str({k: len(v.encode()) for k, v in rendered.items()}))
    for name, text in rendered.items():
        (output_dir / name).write_text(text)
    return dict(sourceCommit=pin, rows=len(rows), classes=dict(counts), patches=len(order['patches']), composed=len(bodies['patches']), parks=len(parks), outputBytes=total)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pin', required=True)
    parser.add_argument('--final', action='store_true')
    parser.add_argument('--output-dir', default=HERE, type=pathlib.Path)
    args = parser.parse_args()
    print(compact_json(assemble(args.pin, args.output_dir, args.final)), end='')


if __name__ == '__main__':
    main()
