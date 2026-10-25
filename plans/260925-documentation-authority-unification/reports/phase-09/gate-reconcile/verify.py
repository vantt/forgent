#!/usr/bin/env python3
"""Own the gate-reconciliation record integrity proof, not product gate acceptance.

Only read-only git and Python stdlib. No native addons or old authoring checks.
The only write is verification.json beside this script.
"""
import collections
import hashlib
import functools
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[5]
BASE = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09')
OUT = ROOT / BASE / 'gate-reconcile'


@functools.lru_cache(maxsize=None)
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, stderr=subprocess.PIPE)


def read_json(path):
    return json.loads(path.read_text())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def pointer(document, value):
    for part in value.strip('/').split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        document = document[int(part)] if isinstance(document, list) else document[part]
    return document


def fields(value, key):
    if isinstance(value, dict):
        for name, child in value.items():
            if name == key:
                yield child
            yield from fields(child, key)
    elif isinstance(value, list):
        for child in value:
            yield from fields(child, key)


def check():
    register = read_json(ROOT / BASE / 'preflip-gate-status.json')
    receipt = read_json(OUT / 'receipt.json')
    sources = read_json(OUT / 'sources.json')
    pin = register['asOf']['originalSnapshotCommit']
    require(pin == receipt['originalSnapshotCommit'] == sources['asOf'], 'snapshot pins differ')
    require(len(pin) == 40, 'asOf must name the full immutable turn-start HEAD')
    require(register['asOf']['finalPinF'] is None, 'this reconciliation cannot invent F')
    require(register['asOf']['evidencePathBase'] == receipt['evidencePathBase'] == str(BASE), 'path convention drift')
    review_followup = receipt['reviewFollowUp']
    review_pin = review_followup['sourceCommit']
    head = git('rev-parse', 'HEAD').decode().strip()
    require(register['asOf']['reviewFollowUpCommit'] == review_pin, 'review follow-up pin mismatch')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', review_pin, head], cwd=ROOT,
                           capture_output=True).returncode == 0, 'review follow-up pin not ancestor of HEAD')
    review_inputs = {entry['path']: entry for entry in review_followup['inputs']}
    required_review_paths = {str(BASE / ('reviews/w19-live-parity-and-rebinds-review.' + suffix)) for suffix in ['md', 'json']}
    required_review_paths.add(str(BASE / 'w19-cleanup-brief.md'))
    require(set(review_inputs) == required_review_paths and len(review_inputs) == len(review_followup['inputs']), 'review follow-up input coverage')
    for path, entry in review_inputs.items():
        raw = git('show', f'{review_pin}:{path}')
        require(hashlib.sha256(raw).hexdigest() == entry['sha256'], 'review follow-up fingerprint drift: ' + path)
    catchup = receipt['catchUp']
    catchup_pin = catchup['sourceCommit']
    require(register['asOf']['catchUpCommit'] == catchup_pin, 'catch-up pin mismatch')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', catchup_pin, head], cwd=ROOT,
                           capture_output=True).returncode == 0, 'catch-up pin not ancestor of HEAD')
    catchup_inputs = {entry['path']: entry for entry in catchup['inputs']}
    required_catchup_paths = {str(BASE / rel) for rel in [
        'owner-answers.md', 'w21-register-catchup-brief.md', 'g5/check.py', 'g5/check-b57e79625.json',
        *['reviews/' + name + '.' + suffix
          for name in ['w20-census-settlement-review', 'w21-census-rework-and-g5-review']
          for suffix in ['md', 'json']],
    ]}
    require(set(catchup_inputs) == required_catchup_paths and len(catchup_inputs) == len(catchup['inputs']),
            'catch-up input coverage')
    for path, entry in catchup_inputs.items():
        require(hashlib.sha256(git('show', f'{catchup_pin}:{path}')).hexdigest() == entry['sha256'],
                'catch-up fingerprint drift: ' + path)
    corrections = receipt['corrections']
    correction_pin = corrections['sourceCommit']
    require(register['asOf']['correctionCommit'] == correction_pin, 'correction pin mismatch')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', correction_pin, head], cwd=ROOT,
                           capture_output=True).returncode == 0, 'correction pin not ancestor of HEAD')
    correction_inputs = {entry['path']: entry for entry in corrections['inputs']}
    required_corrections = {str(BASE / rel) for rel in [
        'owner-answers.md', 'w23-register-corrections-brief.md',
        'reviews/w22-register-met-local-review.md', 'reviews/w22-register-met-local-review.json',
        'preserve-premise/proof.json', 'g9/phase9-decisions.json',
        *[f'preserve-premise/park-judgments/shard-{i}.json' for i in range(1, 4)],
        'composition/w9-unresolved-bindings.json', 'composition/w8-citation-glosses.json', 'review-batches.json',
    ]}
    require(set(correction_inputs) == required_corrections and len(correction_inputs) == len(corrections['inputs']),
            'correction input coverage')
    for path, entry in correction_inputs.items():
        require(hashlib.sha256(git('show', f'{correction_pin}:{path}')).hexdigest() == entry['sha256'],
                'correction fingerprint drift: ' + path)
    generated_inputs = {entry['path']: entry for entry in corrections['generatedEvidence']}
    required_generated = {str(BASE / rel) for rel in [
        'g0join/join.py', 'g0join/join-608a4ada5.json', 'g0join/receipt.md',
        'census-join/locator-proof.json', 'census-join/pointer-patches.json', 'archive/design.md',
    ]}
    require(set(generated_inputs) == required_generated and len(generated_inputs) == len(corrections['generatedEvidence']),
            'generated evidence coverage')
    current = receipt['currentCatchUp']
    current_pin = current['sourceCommit']
    require(register['asOf']['currentCommit'] == register['asOf']['commit'] == receipt['asOf'] == current_pin and len(current_pin) == 40,
            'current catch-up pin mismatch')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', current_pin, head], cwd=ROOT,
                           capture_output=True).returncode == 0, 'current catch-up pin not ancestor')
    for path, entry in generated_inputs.items():
        require(hashlib.sha256(git('show', f"{current['generatedHistoricalPin']}:{path}")).hexdigest() == entry['sha256'],
                'generated evidence fingerprint drift: ' + path)
    current_inputs = {entry['path']: entry for entry in current['inputs']}
    require(len(current_inputs) == len(current['inputs']), 'duplicate current inputs')
    for path, entry in current_inputs.items():
        require(hashlib.sha256(git('show', f'{current_pin}:{path}')).hexdigest() == entry['sha256'],
                'current fingerprint drift: ' + path)
    new_review_paths = set(git('diff', '--name-only', current['generatedHistoricalPin'], current_pin,
                              '--', str(BASE / 'reviews')).decode().splitlines())
    require({r['path'] for r in current['reviewInventory']} == new_review_paths <= set(current_inputs),
            'current review inventory coverage')
    for entry in current['reviewInventory']:
        require(entry['sha256'] == current_inputs[entry['path']]['sha256'], 'current review fingerprint drift')
        if entry['path'].endswith('.json'):
            data = json.loads(git('show', f"{current_pin}:{entry['path']}"))
            rows = data.get('verdicts', data.get('rows', data.get('items', [])))
            require(entry['verdictCounts'] == dict(collections.Counter(r.get('verdict', 'unspecified') for r in rows)) and
                    entry['nonApproveRows'] == [{k: r[k] for k in ('id', 'rowId', 'file', 'pointer', 'verdict', 'reason') if k in r}
                                               for r in rows if r.get('verdict') == 'REWORK'],
                    'current review scope/verdict drift')
    proofs = read_json(OUT / 'current-proofs.json')
    require(proofs['sourceCommit'] == current_pin and len(proofs['commands']) == 2,
            'current proof pin/coverage drift')
    g0, chain = proofs['commands']
    require(g0['exit'] == 0 and g0['counts']['approved'] == g0['counts']['effectiveRows'] == 1929 and
            all(g0['counts'][key] == 0 for key in ['missing', 'mismatched', 'stale', 'openRework', 'invalidBindings', 'unresolved']),
            'current G0 proof not green')
    require(chain['exit'] == 0 and chain['counts'] == {} and chain['linkIntoMoveSet'] == 0,
            'current F composition proof not green')
    for source in chain['sources']:
        require(source['path'] in current_inputs and source['sha256'] == current_inputs[source['path']]['sha256'],
                'current chain source fingerprint drift')
    current_before = json.loads(git('show', f'{current_pin}:{BASE}/preflip-gate-status.json'))
    require(current['countsPerGate'] == [dict(g=new['g'], before=old['status'], after=new['status'])
        for old, new in zip(current_before['gates'], register['gates'])], 'current status table drift')
    require([gate['status'] for gate in register['gates']] == [
        'met-local', 'met-local', 'met-local', 'met-local', 'external', 'met-local',
        'met-local', 'met-local', 'met-local', 'met-local', 'external', 'external'],
            'current gate statuses drift')
    require(len(register['followUps']) == 4 and all(str(BASE / row['sourceReview']) in current_inputs
            for row in register['followUps']), 'outside-plan follow-up provenance drift')
    require(register['ownershipAudit']['status'] == 'reported-ok' and
            register['ownershipAudit']['commit'] == git('rev-parse', '4a4fefbe8').decode().strip(),
            'ownership audit provenance drift')
    for entry in register['ownershipAudit']['inputs']:
        require(hashlib.sha256(git('show', f"{register['ownershipAudit']['commit']}:{entry['path']}")).hexdigest() == entry['sha256'],
                'ownership audit input drift')
    evidence_pins = {path: review_pin for path in review_inputs}
    evidence_pins.update({path: catchup_pin for path in catchup_inputs})
    evidence_pins.update({path: correction_pin for path in correction_inputs})
    for path in current_inputs:
        evidence_pins.setdefault(path, current_pin)
    original = json.loads(git('show', f'{pin}:{BASE}/preflip-gate-status.json'))
    expected = {}
    for index, gate in enumerate(original['gates']):
        expected[f'/gates/{index}/remaining'] = gate['remaining']
        expected.update({f'/gates/{index}/blockers/{j}': text for j, text in enumerate(gate['blockers'])})
    for field in ['beforeFinalPin', 'atFinalPinUnderLease', 'external']:
        expected.update({f'/cutoverReadiness/{field}/{j}': text
                         for j, text in enumerate(original['cutoverReadiness'][field])})
    decisions = receipt['decisions']
    actual = {row['sourcePointer']: row['item'] for row in decisions}
    require(len(actual) == len(decisions), 'duplicate original occurrence')
    require(actual == expected, 'missing/extra/altered original occurrence')
    for row in decisions:
        require(row['decision'] in {'cleared', 'still open', 'moved to F'}, 'invalid decision')
        require(row['resolution'] and row['evidence'], 'decision lacks resolution/evidence')
        require(pointer(original, row['sourcePointer']) == row['item'], 'pointer mismatch')
    require(receipt['decisionCounts'] == dict(collections.Counter(row['decision'] for row in decisions)), 'decision counts drift')

    paths = set()
    commits = set()
    cleared_count = 0
    quotes = 0
    for document in [register, receipt]:
        for key in ['evidence', 'reviews']:
            for entries in fields(document, key):
                require(isinstance(entries, list), f'{key} must be a path list')
                for entry in entries:
                    require(isinstance(entry, str) and entry.strip(), f'empty {key} path')
                    relative = pathlib.PurePosixPath(entry)
                    require(not relative.is_absolute() and '..' not in relative.parts, f'unsafe {key}: {entry}')
                    path = ROOT / BASE / entry
                    require(path.is_file(), f'missing {key} path: {entry}')
                    paths.add(entry)
        for entries in fields(document, 'clearedBy'):
            require(isinstance(entries, list) and entries, 'clearedBy must name commits')
            commits.update(entries)
    commit_pins = {}
    for gate in register['gates']:
        for entry in gate['cleared']:
            targets = {evidence_pins.get(str(BASE / p), pin) for p in entry['reviews']}
            target = catchup_pin if catchup_pin in targets else review_pin if review_pin in targets else pin
            for commit in entry['clearedBy']:
                commit_pins[commit] = target
    for commit in sorted({*commits, pin}):
        # No user-controlled shell interpolation: git receives an argv array.
        require(len(git('rev-parse', '--verify', commit + '^{commit}').decode().strip()) == 40, 'bad commit ' + commit)
        for target in [commit_pins.get(commit, pin), head]:
            result = subprocess.run(['git', 'merge-base', '--is-ancestor', commit, target], cwd=ROOT, capture_output=True)
            require(result.returncode == 0, f'clearedBy/asOf {commit} not ancestor of {target}')

    # Exact verdict quotes are anchored in committed independent reviews, not
    # the uncommitted review files of another concurrent author.
    for gate in register['gates']:
        for entry in gate['cleared']:
            cleared_count += 1
            require(set(entry) == {'item', 'clearedBy', 'reviews', 'verdict'}, 'cleared shape')
            require(entry['reviews'] and entry['verdict'], 'cleared lacks independent review')
            quoted = False
            for path in entry['reviews']:
                quote_pin = evidence_pins.get(str(BASE / path), pin)
                raw = git('show', f'{quote_pin}:{BASE}/{path}').decode()
                if path.endswith('.json'):
                    data = json.loads(raw)
                    for row in data.get('verdicts', data.get('findings', data.get('rows', data.get('items', [])))):
                        text = row.get('reason', row.get('summary', ''))
                        if row.get('verdict', '') + ': ' + text == entry['verdict']:
                            quoted = True
                elif entry['verdict'] in raw:
                    quoted = True
            require(quoted, 'not an exact review verdict quote: ' + entry['item'])
            quotes += 1
        require(gate['status'] != 'met', 'no gate can be final-met before F')
        if gate['status'] == 'met-local':
            require(not gate['blockers'] and not gate['remaining'], gate['g'] + ' has before-F local work')
        require(gate['evidence'], gate['g'] + ' lacks provenance')
        if gate['commit'] is not None:
            require(subprocess.run(['git', 'merge-base', '--is-ancestor', gate['commit'],
                                    commit_pins.get(gate['commit'], pin)], cwd=ROOT,
                                   capture_output=True).returncode == 0, 'gate commit outside snapshot')
    require([gate['g'] for gate in register['gates']] == [f'G{i}' for i in range(12)], 'gate coverage')
    require([gate['gateId'] for gate in register['gates']] == [gate['gateId'] for gate in original['gates']], 'gate ids changed')
    for index, row in enumerate(receipt['countsPerGate']):
        old, new = original['gates'][index], register['gates'][index]
        require(row['g'] == new['g'], 'count gate mismatch')
        expected_before = {'status': old['status'], 'blockers': len(old['blockers']),
                           'remainingEntries': int(bool(old['remaining'])), 'cleared': len(old.get('cleared', []))}
        expected_after = {'status': new['status'], 'blockers': len(new['blockers']),
                          'remainingEntries': int(bool(new['remaining'])), 'cleared': len(new['cleared']),
                          'atFinalPinUnderLease': len(new['atFinalPinUnderLease']), 'external': len(new['external'])}
        require(row['before'] == expected_before and row['after'] == expected_after, 'before/after counts drift')
    require(len(receipt['countsPerGate']) == 12, 'missing gate count')
    require(register['cutoverReadiness']['beforeFinalPin'] == [
        f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['blockers']], 'before-F projection drift')
    readiness = register['cutoverReadiness']
    require(readiness['order'] == [
        'Complete and independently review local work to met-local',
        'Send owner cutover packet at met-local (L13-6)',
        'Owner cutover approval within the stated scope and budget',
        'Acquire documentation write lease; freeze starts',
        'Final main import with accounting; record F',
        'Execute F duties and delta reviews; stop if any fails',
        'Write and independently review the final status ledger',
        'Land within the separately approved frame'], 'cutover order drift')
    for field in ['atFinalPinUnderLease', 'external', 'ownerItems']:
        for gate in register['gates']:
            require(all(f"{gate['g']}: {item}" in readiness[field] for item in gate[field]),
                    field + ' gate projection drift')
    window = readiness['fWindowSize']
    premise = json.loads(git('show', f'{current_pin}:{BASE}/preserve-premise/proof.json'))
    residual = json.loads(git('show', f'{correction_pin}:{BASE}/composition/w9-unresolved-bindings.json'))['assertions']
    glosses = json.loads(git('show', f'{correction_pin}:{BASE}/composition/w8-citation-glosses.json'))['witnesses']
    shards = [json.loads(git('show', f'{current_pin}:{BASE}/preserve-premise/park-judgments/shard-{i}.json')) for i in range(1, 4)]
    judgments = [r for shard in shards for r in shard['rows']]
    require(window['sourcePin'] == current_pin and
            window['g6UnboundRows']['count'] == sum(r['result'] == 'park-current-passage-unbound' for r in premise['rows']) and
            window['g6BeforeF']['authoredJudgments'] == len(judgments) and
            window['g6BeforeF']['reviewPending'] == 0 and
            window['g6BeforeF']['dispositions'] == dict(collections.Counter(r['disposition'] for r in judgments)) and
            window['g6BeforeF']['ownedPlacementDecisions'] == sum(r['disposition'] == 'owned-park' for r in judgments) and
            window['g6BeforeF']['insideFWindow'] is False and
            window['postApplyBindings']['distinct'] == len({(r['effectiveRecord'], r['effectivePointer']) for r in residual}) and
            window['postApplyBindings']['assertions'] == len(residual) and
            window['glosses']['mainOwnedSites'] == sum(len(r['ids']) for r in glosses if r['ownership'] == 'main-at-F'),
            'F-window source counts drift')
    require(register['gates'][6]['status'] == 'met-local' and not register['gates'][6]['blockers'] and
            not register['gates'][6]['ownerItems'], 'G6 current review/placement projection drift')
    manifest = json.loads(git('show', f'{current_pin}:{BASE}/fchain/manifest.json'))
    retargets = json.loads(git('show', f'{current_pin}:{BASE}/fchain/link-retargets.json'))
    rebased = json.loads(git('show', f'{current_pin}:{BASE}/fchain/rebased-patches.json'))
    dependencies = json.loads(git('show', f'{current_pin}:{BASE}/g9/phase9-decisions.json'))
    composition = window['fComposition']
    require(composition['manifestSources'] == len(manifest['sources']) and
            composition['baseChainFiles'] == len(chain['baseChain']['files']) and
            composition['basePatchSteps'] == sum(len(row['steps']) for row in chain['baseChain']['files']) and
            composition['rebasedEntries'] == len(rebased['patches']) and
            composition['linkRetargetPatches'] == len(retargets['patches']) and
            composition['linkRetargetRows'] == len(retargets['rows']) and
            composition['additionalExecutedPatches'] == chain['executed'] and composition['composedFiles'] == chain['files'] and
            composition['linkIntoMoveSet'] == 0 and
            set(s['path'] for s in manifest['sources']) == set(s['path'] for s in chain['sources']) and
            window['deltaReviewsPerGate']['G0']['effectiveBindingsAtSourcePin'] == g0['counts']['effectiveRows'] and
            window['deltaReviewsPerGate']['G9']['localDependencies'] == len(dependencies['entries']) == 158 and
            window['g6Composition']['parkJudgmentRepoints'] == sum(r['disposition'] == 'repoint' for r in judgments),
            'F-window source counts drift')
    duties = json.loads(git('show', f'{current_pin}:{BASE}/g0rework/final-pin-duties.json'))['conditionalOverlayApprovals']
    duty_text = ' '.join(register['gates'][0]['atFinalPinUnderLease'])
    require(duties['relocation']['selectedId'] in duty_text and duties['relocation']['expectedAfterSha256'] in duty_text and
            duties['pairedHistoryId'] in duty_text and str(duties['total']) in duty_text,
            'conditional G0 F duty drift')
    require(set(window['deltaReviewsPerGate']) == {'G0', 'G2', 'G6', 'G7', 'G9'}, 'F-window delta review gate coverage')
    for field in ['beforeFinalPin', 'atFinalPinUnderLease', 'external']:
        require(receipt['readinessCounts'][field] == {'before': len(original['cutoverReadiness'][field]),
                                                      'after': len(register['cutoverReadiness'][field])}, 'readiness counts drift')
    inputs = {entry['path']: entry for entry in sources['inputs']}
    require(len(inputs) == len(sources['inputs']), 'duplicate input inventory')
    for path, entry in inputs.items():
        require((ROOT / path).is_file(), 'input/review path missing: ' + path)
        data = git('show', f'{pin}:{path}')
        require(hashlib.sha256(data).hexdigest() == entry['sha256'], 'snapshot hash drift: ' + path)
    # Preserve the original snapshot/fingerprints; later rulings are a separate
    # immutable input layer, not a rewrite of what the first reconciliation read.
    followup = receipt['followUp']
    followup_pin = followup['sourceCommit']
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', followup_pin, head], cwd=ROOT,
                           capture_output=True).returncode == 0, 'follow-up pin not ancestor of HEAD')
    require(followup['independentSettlementApproval'] is False, 'follow-up is not independent approval')
    for entry in followup['inputs']:
        data = git('show', f"{followup_pin}:{entry['path']}")
        require(hashlib.sha256(data).hexdigest() == entry['sha256'], 'follow-up fingerprint drift: ' + entry['path'])
    review_paths = set(git('ls-tree', '-r', '--name-only', pin, str(BASE / 'reviews')).decode().splitlines())
    require({row['path'] for row in sources['reviews']} == review_paths, 'not every review file inventoried')
    require(sources['reviewFiles'] == len(sources['reviews']) == len(review_paths), 'review count drift')
    require(review_paths <= set(inputs), 'review input missing')
    for directory in ['g0rework', 'import3', 'misc-fix', 'preserve-premise', 'composition', 'carries']:
        for suffix in ['md', 'json']:
            require(str(BASE / directory / ('receipt.' + suffix)) in inputs, 'required receipt missing')
    require(str(BASE / 'g9/receipt.md') in inputs, 'required G9 receipt missing')
    log = receipt['planBranchLog']
    expected_log = git('log', '--oneline', '8a9385eca^..' + pin).decode()
    require((ROOT / BASE / log['path']).read_text() == expected_log, 'plan-branch log differs')
    require(log['lines'] == len(expected_log.splitlines()), 'plan-branch log count differs')
    for entry in paths:
        if not entry.startswith('gate-reconcile/'):
            require(str(BASE / entry) in inputs or str(BASE / entry) in evidence_pins or str(BASE / entry) in generated_inputs, 'cited evidence not fingerprinted: ' + entry)
    return {'status': 'passed', 'exit': 0, 'asOf': current_pin, 'originalSnapshotCommit': pin, 'checkedAtHead': head,
            'originalOccurrences': len(decisions), 'gates': len(register['gates']),
            'reviewFiles': len(review_paths), 'snapshotInputs': len(inputs),
            'followUpPin': followup_pin, 'followUpInputs': len(followup['inputs']),
            'reviewFollowUpPin': review_pin, 'reviewFollowUpInputs': len(review_inputs),
            'catchUpPin': catchup_pin, 'catchUpInputs': len(catchup_inputs),
            'correctionPin': correction_pin, 'correctionInputs': len(correction_inputs),
            'generatedEvidence': len(generated_inputs),
            'currentPin': current_pin, 'currentInputs': len(current_inputs), 'currentReviews': len(new_review_paths),
            'evidenceAndReviewPaths': len(paths), 'clearedEntries': cleared_count,
            'exactVerdictQuotes': quotes, 'clearedByCommits': sorted(commits),
            'checks': ['original occurrence coverage and text', 'path existence',
                       'clearedBy ancestry at snapshot and HEAD', 'committed exact review quotes',
                       'before/after counts', 'met-local has no local before-F blockers',
                       'immutable input fingerprints and all-review coverage',
                       'separate immutable follow-up input fingerprints', 'separate committed W19 review fingerprints and quotes',
                       'separate W20/W21/ruling fingerprints, quotes and ancestry',
                       'W22/L13-20 correction fingerprints and explicit generated evidence',
                       'packet-before-lease order, owner/external/F projections and source-derived F-window counts',
                       'current committed catch-up inputs, exhaustive review inventory, owning proofs, conditional overlays and outside-plan follow-ups'],
            'limits': 'Record integrity only. No independent semantic approval, F gate execution or full product-suite claim.'}


if __name__ == '__main__':
    try:
        result = check()
    except (ValueError, KeyError, OSError, subprocess.SubprocessError) as error:
        print(json.dumps({'status': 'failed', 'error': str(error)}), file=sys.stderr)
        raise SystemExit(1)
    (OUT / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
