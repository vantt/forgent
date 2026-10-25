#!/usr/bin/env python3
"""Own the gate-reconciliation record integrity proof, not product gate acceptance.

Only read-only git and Python stdlib. No native addons or old authoring checks.
The only write is verification.json beside this script.
"""
import collections
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[5]
BASE = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09')
OUT = ROOT / BASE / 'gate-reconcile'


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
    pin = register['asOf']['commit']
    require(pin == receipt['asOf'] == sources['asOf'], 'snapshot pins differ')
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
    review_commits = {commit for gate in register['gates'] for entry in gate['cleared']
                      if any(str(BASE / p) in review_inputs for p in entry['reviews'])
                      for commit in entry['clearedBy']}
    for commit in sorted({*commits, pin}):
        # No user-controlled shell interpolation: git receives an argv array.
        require(len(git('rev-parse', '--verify', commit + '^{commit}').decode().strip()) == 40, 'bad commit ' + commit)
        for target in [review_pin if commit in review_commits else pin, head]:
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
                quote_pin = review_pin if str(BASE / path) in review_inputs else pin
                raw = git('show', f'{quote_pin}:{BASE}/{path}').decode()
                if path.endswith('.json'):
                    data = json.loads(raw)
                    for row in data.get('verdicts', data.get('findings', data.get('rows', []))):
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
            require(subprocess.run(['git', 'merge-base', '--is-ancestor', gate['commit'], pin], cwd=ROOT,
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
            require(str(BASE / entry) in inputs or str(BASE / entry) in review_inputs, 'cited evidence not fingerprinted: ' + entry)
    return {'status': 'passed', 'exit': 0, 'asOf': pin, 'checkedAtHead': head,
            'originalOccurrences': len(decisions), 'gates': len(register['gates']),
            'reviewFiles': len(review_paths), 'snapshotInputs': len(inputs),
            'followUpPin': followup_pin, 'followUpInputs': len(followup['inputs']),
            'reviewFollowUpPin': review_pin, 'reviewFollowUpInputs': len(review_inputs),
            'evidenceAndReviewPaths': len(paths), 'clearedEntries': cleared_count,
            'exactVerdictQuotes': quotes, 'clearedByCommits': sorted(commits),
            'checks': ['original occurrence coverage and text', 'path existence',
                       'clearedBy ancestry at snapshot and HEAD', 'committed exact review quotes',
                       'before/after counts', 'met-local has no local before-F blockers',
                       'immutable input fingerprints and all-review coverage',
                       'separate immutable follow-up input fingerprints', 'separate committed W19 review fingerprints and quotes'],
            'limits': 'Record integrity only. No independent semantic approval, F gate execution or full product-suite claim.'}


if __name__ == '__main__':
    try:
        result = check()
    except (ValueError, KeyError, OSError, subprocess.SubprocessError) as error:
        print(json.dumps({'status': 'failed', 'error': str(error)}), file=sys.stderr)
        raise SystemExit(1)
    (OUT / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
