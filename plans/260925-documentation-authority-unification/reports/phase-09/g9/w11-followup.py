#!/usr/bin/env python3
"""Records-only follow-up reproduction. Run python3 -B .../w11-followup.py.

Only G9/composition artifacts are published. Scratch stays under the brief's
single /tmp root. Reuses exact authored-hunk relocation, GNU patch, the published
composition recipes and the existing G9 judge; no product or ledger mutation.
"""
import collections
import copy
import difflib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
COMP = HERE.parent / 'composition'
TMP = Path('/tmp/fgos-work/w11-g9')
COMMANDS = []
BASELINE = 'd786e305eb20dfdda8d1634b227bd9f8a9328541'


def module(name, path):
    sp = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(value)
    return value


r = module('w11_recompose', HERE / 'recompose.py')
sweep = r.sweep
load = sweep.load


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def run(argv, output=None, env=None, expected=0):
    cp = subprocess.run(list(map(str, argv)), cwd=ROOT, env=env, capture_output=True)
    record = {'argv': list(map(str, argv)), 'exit': cp.returncode,
              'stdoutSha256': sweep.sha(cp.stdout), 'stdoutBytes': len(cp.stdout),
              'stderr': cp.stderr.decode()}
    COMMANDS.append(record)
    save(HERE / 'w11-commands.json', COMMANDS)
    if output:
        output.write_bytes(cp.stdout)
    if cp.returncode != expected:
        raise ValueError((record, cp.stdout.decode()[-4000:]))
    return cp.stdout


def diff(path, before, after):
    return ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                        fromfile='a/' + path, tofile='b/' + path))


def prepare(pin):
    packet = load(COMP / 'patch-specs.json')
    original_packet = json.loads(run(['git', 'show', BASELINE + ':' + str(
        (COMP / 'patch-specs.json').relative_to(ROOT))]))
    original_specs = {s['id']: s for s in original_packet['patches']}
    witnesses = load(COMP / 'w8-citation-glosses.json')
    original_witnesses = json.loads(run(['git', 'show', BASELINE + ':' + str(
        (COMP / 'w8-citation-glosses.json').relative_to(ROOT))]))
    fixes = []
    for index in [0, 37, 38, 61, 62, 64]:
        witness = witnesses['witnesses'][index]
        old = original_witnesses['witnesses'][index]['after']
        # Restore the original ordered local labels without reintroducing
        # ambiguous global decision-citation tokens. Preserve their old numbers.
        if index in [61, 62, 64]:
            new = re.sub(r'\bD([1-8]): (.)',
                         lambda m: 'Mục ' + m[1] + ': ' + m[2].upper(), witness['before'])
            assert re.sub(r'\bD[1-8]: ', '', witness['before']) == old
        else:
            # The full audit strips emphasis too: descriptive replacements for
            # removed labels must still begin with a capital after a full stop.
            new = old.replace('**what ', '**What ').replace('**the ', '**The ')
            assert new != old
        witness['after'] = new
        fixes.append({'index': index, 'path': witness['file'], 'line': witness['line'],
                      'before': old, 'after': new,
                      'labelMap': {label: 'Mục ' + label[1:-1] + ':' for label in
                                   (re.findall(r'\bD[1-8]:', witness['before']) if index in [61, 62, 64] else [])}})
    # Import 3 changed the probe-count prose in one navigation entry. Reuse
    # the existing explicit reading-map resolution mechanism: retain current
    # facts and apply only the originally authored path substitutions.
    resolution = load(HERE / 'reading-map-resolution.json')
    old_hash = '79c90f2575e75e9497b321875baedebc2b9a6b0e84ee97249ebf0ae0acd278c5'
    if not any(row['authoredOldSha256'] == old_hash for row in resolution['rows']):
        source = sweep.blob(pin, 'docs/reading-map.md').decode()
        chain = sweep.spec_chains()['docs/reading-map.md']
        hunks = [h for spec in chain for h in r.step7.hunk_edits(spec['diff'])]
        old, new, *_ = next(h for h in hunks if sweep.sha(h[0]) == old_hash)
        edits = []
        for index, (oldline, newline) in enumerate(zip(old.splitlines(True), new.splitlines(True))):
            if index == 0:
                before, after = oldline, newline
            else:
                key = '- `docs/specs/confinement-authority.md` + '
                matches = [line for line in source.splitlines(True) if line.startswith(key)]
                assert len(matches) == 1
                before = matches[0]
                assert oldline.replace('docs/specs/confinement-authority.md',
                                       'docs/platform/agent-confinement/spec.md', 1) == newline
                after = before.replace('docs/specs/confinement-authority.md',
                                       'docs/platform/agent-confinement/spec.md', 1)
            assert source.count(before) == 1
            edits.append({'currentLine': source[:source.index(before)].count('\n') + 1,
                          'before': before, 'after': after,
                          'beforeSha256': sweep.sha(before), 'afterSha256': sweep.sha(after)})
        resolution['rows'].append({'authoredOldSha256': sweep.sha(old),
                                   'authoredNewSha256': sweep.sha(new), 'edits': edits,
                                   'sourceCommit': pin,
                                   'reason': 'Retain import-3 probe 9 / blind probe 10 / machine-private-hidden facts. Original navigation operand changes only; no restored obsolete prose.'})
        save(HERE / 'reading-map-resolution.json', resolution)
    byid = {s['id']: s for s in packet['patches']}
    external = {s['patchSpecId']: s for s in load(sweep.P8 / 'step-07-composed-patches.json')['patches']}
    current, changes, commands = {}, [], []
    for ident in packet['effectiveSpecIds'] + packet['finalPinFSpecIds']:
        spec = byid[ident]
        path = spec['path']
        if path not in current:
            data = sweep.blob(pin, path)
            assert data is not None or spec.get('requiresAbsent'), path
            current[path] = (data or b'').decode()
            pred = spec.get('predecessor')
            if pred and pred['patchSpecId'] not in byid:
                ext = external[pred['patchSpecId']]
                assert sweep.sha(current[path]) == ext['beforeSha256'], path
                current[path], _ = r.relocate(current[path], ext, commands)
        before = current[path]
        after, _ = r.relocate(before, spec, commands)
        if ident.startswith('w8:gloss:'):
            for fix in [x for x in fixes if x['path'] == path]:
                if fix['after'] not in after:
                    assert after.count(fix['before']) == 1
                    after = after.replace(fix['before'], fix['after'])
        old_spec = original_specs[ident]
        spec.update(beforeSha256=sweep.sha(before), expectedAfterSha256=sweep.sha(after),
                    diff=diff(path, before, after), rollbackDiff=diff(path, after, before))
        if spec.get('predecessor'):
            pred = spec['predecessor']
            parent = byid.get(pred['patchSpecId']) or external[pred['patchSpecId']]
            assert parent['expectedAfterSha256'] == spec['beforeSha256'], ident
            pred['expectedAfterSha256'] = parent['expectedAfterSha256']
        if spec != old_spec:
            changes.append({'specId': ident, 'path': path,
                            'oldBeforeSha256': old_spec['beforeSha256'],
                            'beforeSha256': spec['beforeSha256'],
                            'oldAfterSha256': old_spec['expectedAfterSha256'],
                            'afterSha256': spec['expectedAfterSha256']})
        current[path] = after
    save(COMP / 'patch-specs.json', packet)
    save(COMP / 'w8-citation-glosses.json', witnesses)
    save(COMP / 'w11-preparation.json', {'pin': pin, 'changes': changes, 'glossFixes': fixes,
                                       'commands': commands, 'independentAcceptance': False})
    # Mechanical audit of every witness, retaining each match and its resolution.
    audit = []
    for index, witness in enumerate(witnesses['witnesses']):
        text = witness['after']
        # Code and link destinations are not prose sentence starts or words.
        prose = re.sub(r'`[^`]*`', 'CODE', text)
        prose = re.sub(r'\]\([^)]*\)', ']', prose)
        prose = re.sub(r'\*{1,3}', '', prose)
        lowercase = [{'offset': m.start(), 'text': m[0]} for m in
                     re.finditer(r'\.\s+([^\W\d_])', prose) if m[1].islower()]
        doubled = [{'offset': m.start(), 'text': m[0]} for m in
                   re.finditer(r'\b([^\W\d_]+)\s+\1\b', prose, re.IGNORECASE)]
        labels = re.findall(r'\bD([1-8]):', witness['before'])
        # A single decision prefix is not an ordered list. Lists must retain all
        # numbers, including gaps in the original local numbering.
        missing = [label for label in labels if len(labels) > 1 and 'Mục ' + label + ':' not in text]
        reviews = []
        if index == 66 and doubled:
            assert [m['text'] for m in doubled] == ['CODE CODE']
            assert '`fgos-identity` `text::iso_utc_now`' in text
            reviews.append('False positive from replacing two distinct adjacent inline code spans with CODE; original text has no doubled word.')
        if index == 97 and doubled:
            assert [m['text'] for m in doubled] == ['song song']
            assert 'song song' in witness['before']
            reviews.append('Vietnamese song song means concurrently; valid reduplication already present in the before-line, not a removal-induced doubled word.')
        audit.append({'index': index, 'file': witness['file'], 'line': witness['line'],
                      'before': witness['before'], 'after': text,
                      'lowercaseAfterFullStop': lowercase, 'doubledWords': doubled,
                      'originalLocalLabels': labels, 'lostListLabels': missing,
                      'labelReview': 'ordered local list restored as Mục n' if len(labels) > 1 else
                                     'single citation prefix is not an ordered list' if labels else 'no local list',
                      'matchReviews': reviews,
                      'status': 'review-required' if lowercase or missing or (doubled and not reviews) else
                                'pass-reviewed-match' if reviews else 'pass'})
    save(COMP / 'w10-gloss-audit.json', {
        'pin': pin, 'witnessesRead': list(range(len(audit))), 'witnesses': audit,
        'rules': {'sentenceStarts': 'Unicode lowercase letter after full stop + whitespace; strip emphasis and exclude inline code/link destinations',
                  'doubledWords': 'case-insensitive adjacent Unicode words',
                  'listLabels': 'multi-label D1:…D8: lists retain each original number as Mục n:'},
        'fixes': fixes, 'reviewRequired': [row['index'] for row in audit if row['status'] == 'review-required'],
        'claimLimit': 'Mechanical prose audit; real replay separately authenticates all 104 witness lines.'})


def composition(pin):
    recipes = load(COMP / 'w10-replay-recipes.json')['scripts']
    adapted = {}
    for name, source in recipes.items():
        source = source.replace('/tmp/fgos-work/w10-g9-rework', str(TMP))
        if name == 'verify.py':
            for filename in ['citation-before-f.json', 'chain-verification.json', 'citation-verification.json',
                             'gap05-verification.json', 'unresolved-bindings.json', 'action-verification.json']:
                source = source.replace("/'w10-" + filename, "/'w11-" + filename)
            source = source.replace('correctedWitnessIndices=[16],correctedSpecs=1',
                                    'correctedWitnessIndices=[0,37,38,61,62,64],correctedSpecs=3')
        (TMP / name).write_text(source)
        adapted[name] = source
    save(COMP / 'w11-replay-recipes.json', {'pin': pin, 'scripts': adapted,
         'reuse': 'W10 exact full-chain/independent replay, skill generation, citation scan, ledger resolver and immutable extractors; only scratch/output names and corrected witness metadata adapted.'})
    prior = load(COMP / 'w10-gap05-verification.json')
    keys = ['sourceBindingAssertions', 'effectiveBindingRefreshAssertions', 'effectiveUnitCarryAssertions',
            'distinctTerminalBindings', 'bindingRefreshTerminalBindings', 'unitCarryTerminalBindings',
            'duplicateOriginAssertions', 'operativeOverlays', 'headingCurrentRows', 'headingExcludedLookupRows',
            'currentRowsAdded', 'ambiguousSupersessions', 'overlayHashesVerified', 'sourceRowsVerified']
    save(TMP / 'overlay-summary.json', {k: prior[k] for k in keys})
    save(TMP / 'commands.json', [])
    run(['python3', '-B', TMP / 'verify.py'], COMP / 'w11-verify-summary.json')
    save(COMP / 'w11-commands.json', load(TMP / 'commands.json'))
    run(['python3', '-B', TMP / 'independent-replay.py'], COMP / 'w11-independent-verification.json')


def delta(pin, baseline):
    changed_paths = run(['git', '--no-optional-locks', 'diff', '--name-only', 'd14d89865', pin]).decode().splitlines()
    old_judgments = {x['id']: x for x in baseline['judgments']['rows']}
    new_judgments = {x['id']: x for x in load(HERE / 'judgments.json')['rows']}
    affected = []
    differences = []
    for ident, new in new_judgments.items():
        old = old_judgments[ident]
        paths = sorted({path for p in old['evidence'] for path in [p['path'], p['currentPath']]} & set(changed_paths))
        if paths:
            affected.append({'id': ident, 'changedEvidencePaths': paths,
                             'evidenceDigestChanged': old['evidenceSha256'] != new['evidenceSha256'],
                             'disposition': new['disposition']})
        if old['evidenceSha256'] != new['evidenceSha256'] or old['classification'] != new['classification'] or old['disposition'] != new['disposition']:
            differences.append({'id': ident, 'oldClassification': old['classification'], 'classification': new['classification'],
                                'oldDisposition': old['disposition'], 'disposition': new['disposition'],
                                'changedEvidencePaths': paths})
    old_specs = {s['path']: s for s in baseline['recomposed']['specs']}
    spec_changes = []
    for spec in load(HERE / 'recomposed.json')['specs']:
        old = old_specs[spec['path']]
        if any(spec[k] != old[k] for k in ['beforeSha256', 'expectedAfterSha256', 'diff', 'rollbackDiff']):
            spec_changes.append({'path': spec['path'], 'preimageDrifted': old['beforeSha256'] != spec['beforeSha256'],
                                 'beforeSha256': spec['beforeSha256'], 'afterSha256': spec['expectedAfterSha256']})
    changed_source_paths = [path for path in changed_paths if path.startswith(('docs/', 'scripts/'))]
    current_specs = {s['path']: s for s in load(HERE / 'recomposed.json')['specs']}
    source_accounting = [{'path': path,
                          'recordEvidenceRows': [x['id'] for x in affected if path in x['changedEvidencePaths']],
                          'selectedForRecomposition': path in current_specs,
                          'recompositionPreimageDrifted': next((x['preimageDrifted'] for x in spec_changes if x['path'] == path), False),
                          'note': 'Rejudged/recomposed where selected; no new record/body invented for a path outside the G9 cohorts/chains.'}
                         for path in changed_source_paths]
    save(HERE / 'w11-delta.json', {'pin': pin, 'comparisonPin': 'd14d89865',
                                 'changedSourcePathAccounting': source_accounting,
                                 'changedPaths': changed_paths, 'evidencePathJoin': affected,
                                 'recordChanges': differences, 'bodyChanges': spec_changes,
                                 'dispositionChanges': [x for x in differences if x['oldDisposition'] != x['disposition']]})


def negative_control(pin):
    control = TMP / 'control'
    # Copy only G9; symlink its read-only surroundings, never .fgos or secrets.
    relative = HERE.relative_to(ROOT)
    source, target = ROOT, control
    for part in relative.parts:
        target.mkdir(parents=True, exist_ok=True)
        for sibling in source.iterdir():
            if sibling.name not in [part, '.git', '.fgos', '.env', 'secrets', 'node_modules']:
                (target / sibling.name).symlink_to(sibling, target_is_directory=sibling.is_dir())
        source, target = source / part, target / part
    shutil.copytree(HERE, target)
    packet = load(target / 'recomposed.json')
    path = 'docs/platform/event-store/spec.md'
    current = next(s for s in packet['specs'] if s['path'] == path)
    old = json.loads(run(['git', 'show', 'd14d89865:' + str(relative / 'recomposed.json')]))
    old = next(s for s in old['specs'] if s['path'] == path)
    assert old['beforeSha256'] == current['beforeSha256']
    assert old['expectedAfterSha256'] != current['expectedAfterSha256']
    preimage = sweep.blob(pin, path).decode()
    control_commands = []
    postimage, _ = r.relocate(preimage, old, control_commands)
    self_proof = r.replay(path, preimage, postimage, old['diff'], old['rollbackDiff'], control_commands)
    for key in ['diff', 'rollbackDiff', 'expectedAfterSha256']:
        current[key] = old[key]
    save(target / 'recomposed.json', packet)
    env = dict(os.environ, GIT_DIR=run(['git', 'rev-parse', '--absolute-git-dir']).decode().strip(),
               GIT_WORK_TREE=str(ROOT))
    result = json.loads(run(['python3', '-B', target / 'sweep.py', '--check', '--pin', pin], env=env, expected=1))
    assert not result['judgmentErrors']
    assert not result['specSweep']['predecessorChainMismatches']
    assert not result['specSweep']['drifted']
    mismatches = result['specSweep']['bodyReplayMismatches']
    assert [m['path'] for m in mismatches] == [path], mismatches
    save(HERE / 'w11-stale-body-control.json', {'pin': pin, 'exit': 1,
         'scratchCopy': str(control), 'mutation': 'Old event-store body with CURRENT predecessorChain metadata',
         'judgmentErrors': result['judgmentErrors'], 'chainMetadataMismatches': [], 'sourceDrift': [],
         'bodyReplayMismatches': mismatches,
         'currentChainMetadataPreserved': True, 'selfRoundtripWasValid': self_proof,
         'selfRoundtripCommands': control_commands})


def newline_proof(pin):
    # Compare the actual committed old classifier with the new one at the SAME
    # pin, isolating newline semantics from source drift and judgment refresh.
    source = run(['git', 'show', BASELINE + ':' + str((HERE / 'sweep.py').relative_to(ROOT))]).decode()
    prior = {'__file__': str(HERE / 'sweep.py'), '__name__': 'w11_prior_classifier'}
    exec(compile(source, str(HERE / 'sweep.py'), 'exec'), prior)
    old_rows, _ = prior['records_at'](pin)
    new_rows, _ = sweep.records_at(pin)
    passages, records = [], []
    for old, new in zip(old_rows, new_rows):
        assert old['id'] == new['id']
        if old['classification'] != new['classification']:
            records.append({'id': new['id'], 'before': old['classification'], 'after': new['classification']})
        for before, after in zip(old['passages'], new['passages']):
            if before['classification'] != after['classification']:
                assert before['classification'] == 'changed' and after['classification'] == 'moved'
                assert before['currentText'] == before['boundText'] + '\n'
                assert before['currentSha256'] == after['currentSha256']
                passages.append({'record': new['id'], 'path': after['currentPath'],
                                 'passageId': after['passageId'], 'startLine': after['startLine'],
                                 'endLine': after['endLine'], 'boundSha256': after['boundSha256'],
                                 'currentSha256': after['currentSha256'], 'difference': 'one final LF only'})
    assert len(passages) == 274 and len(records) == 1
    for a, b, expected in [('text', 'text\n', True), ('text\n', 'text', True),
                           ('text\n', 'text\n\n', True), ('text', 'text\n\n', False),
                           ('text ', 'text', False), ('text\r\n', 'text', False)]:
        assert sweep.same_passage(a, b) == expected
    save(HERE / 'w11-newline-proof.json', {'pin': pin, 'exit': 0, 'passagesChanged': len(passages),
         'affectedRecords': len({p['record'] for p in passages}), 'recordClassificationChanges': records,
         'passages': passages, 'dispositionChanges': load(HERE / 'w11-delta.json')['dispositionChanges'],
         'semantics': 'Only one added/removed final LF; not arbitrary whitespace or CRLF normalization.'})


def main():
    TMP.mkdir(parents=True, exist_ok=True)
    pin = run(['git', 'rev-parse', 'HEAD']).decode().strip()
    baseline = {name: json.loads(run(['git', 'show', BASELINE + ':' + str(
        (HERE / (name + '.json')).relative_to(ROOT))])) for name in ['judgments', 'recomposed']}
    prepare(pin)
    # Import 3 regenerated the late-area report and advanced its head field.
    # Retain the historical twin proof and record the actual committed refresh.
    mapping = load(HERE / 'sha-map.json')
    for twin in mapping['mappings']:
        for site in twin['occurrences']:
            if site['path'].endswith('/late-areas/legacy-drift.json') and site['key'] == 'head':
                data = sweep.blob(pin, site['path'])
                expected = json.loads(data)['head']
                assert (ROOT / site['path']).read_bytes() == data
                site['currentCommit'] = expected
                site['refreshEvidence'] = {'changedByCommit': 'd786e305eb20dfdda8d1634b227bd9f8a9328541',
                                           'currentFileSha256': sweep.sha(data),
                                           'reason': 'Import-3 regenerated report advances head; historical patch-id equivalence remains unchanged.'}
    save(HERE / 'sha-map.json', mapping)
    for name in ['final-tree', 'verified-tree', 'control']:
        if (TMP / name).exists():
            shutil.rmtree(TMP / name)
    composition(pin)
    run(['python3', '-B', HERE / 'recompose.py', '--pin', 'HEAD'], HERE / 'w11-recompose-summary.json')
    run(['python3', '-B', HERE / 'judge.py', '--pin', 'HEAD'], HERE / 'w11-judge-summary.json')
    run(['python3', '-B', HERE / 'sweep.py', '--check', '--pin', 'HEAD'], HERE / 'sweep-check.json')
    run(['python3', '-B', HERE / 'verify.py', '--pin', 'HEAD'], HERE / 'w11-verify-summary.json')
    delta(pin, baseline)
    newline_proof(pin)
    negative_control(pin)
    save(HERE / 'w11-commands.json', COMMANDS)
    print(json.dumps({'pin': pin, 'status': 'pass', 'scratch': str(TMP)}, indent=2))


if __name__ == '__main__':
    main()
