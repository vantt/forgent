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
            rows = data if isinstance(data, list) else data.get('verdicts', data.get('rows', data.get('items', [])))
            require(entry['verdictCounts'] == dict(collections.Counter(r.get('verdict', 'unspecified') for r in rows)) and
                    entry['nonApproveRows'] == [{k: r[k] for k in ('id', 'rowId', 'file', 'pointer', 'verdict', 'reason') if k in r}
                                               for r in rows if r.get('verdict') == 'REWORK'],
                    'current review scope/verdict drift')
    proofs = read_json(OUT / 'current-proofs.json')
    require(proofs['sourceCommit'] == current_pin and len(proofs['commands']) == 3,
            'current proof pin/coverage drift')
    g0, chain, duplicate = proofs['commands']
    require(g0['exit'] == 0 and g0['counts']['approved'] == g0['counts']['effectiveRows'] == 1929 and
            all(g0['counts'][key] == 0 for key in ['missing', 'mismatched', 'stale', 'openRework', 'invalidBindings', 'unresolved']),
            'current G0 proof not green')
    require(chain['exit'] == 0 and chain['counts'] == {} and
            chain['linkGuard']['findings'] == 0 and chain['linkGuard']['platformMarkdownFiles'] == 628 and
            chain['linkGuard']['population'] == 'All composed docs/platform/**/*.md, Related headers included',
            'current F composition proof not green')
    require(duplicate['exit'] == duplicate['expectedExit'] == 1 and duplicate['result'] == 'rejected' and
            duplicate['error'] == 'link retarget row ids are not unique' and
            duplicate['leadFix'] == 'edf816838' and duplicate['row'] == 'L13-28:related:118' and
            duplicate['duplicate'] == 'L13-28:related:86', 'duplicate-id mechanical-fix proof drift')
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
    require(len(register['followUps']) == 6 and all(str(BASE / row['sourceReview']) in current_inputs
            and row.get('owner') == 'lead:DOC' and row.get('destination') ==
            'separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope)'
            for row in register['followUps']) and
            [(row['sourceReview'], row['path']) for row in register['followUps'][-2:]] == [
                ('reviews/w33-ownership-audit-review.md', str(BASE.parent / 'phase-08/audit-report.py')),
                ('reviews/w33-ownership-audit-review.md', str(BASE / 'rebind/g0-rework-rebindings.json'))],
            'outside-plan follow-up provenance drift')
    corrections_now = register['cutoverReadiness']['localCorrectionReview']
    required_coverage = {
        'reviews/w33-link-retargets-review.json': ['a319902ab'],
        'reviews/w35-link-guard-review.json': ['8ea185bfd'],
        'reviews/w37-link-guard-rereview.json': ['b467e09fe'],
        'reviews/w33-ownership-audit-review.json': ['73e89962e', '98d71bef2', 'ca3179b3c', 'c3882df26'],
        'reviews/w32-register-review.json': ['c50b78db9'],
        'reviews/w38-register-update-review.json': ['e7e6c129c'],
        'reviews/w39-register-refresh-review.json': ['45da92781'],
    }
    require(isinstance(corrections_now, list) and len(corrections_now) == len(required_coverage) and
            {r['review']: r['commits'] for r in corrections_now} == required_coverage,
            'local correction review coverage drift')
    for correction in corrections_now:
        raw_review = json.loads(git('show', f"{current_pin}:{BASE}/{correction['review']}"))
        rows = raw_review if isinstance(raw_review, list) else raw_review['items']
        reworks = {r['id'] for r in rows if r['verdict'] == 'REWORK'}
        resolved = correction['reworkResolutions']
        require(correction['verdictCounts'] == dict(collections.Counter(r['verdict'] for r in rows)) and
                set(resolved) | set(correction['openRework']) == reworks and
                not set(resolved) & set(correction['openRework']) and all(resolved.values()),
                'local correction verdict/resolution drift')
        require(not correction['openRework'] or all(
                (register['cutoverReadiness']['fWindowSize']['fComposition']['status'] == 'partial'
                 if g == 'cutoverReadiness' else
                 register['gates'][int(g[1:])]['status'] == 'partial' and
                 correction['review'] in ' '.join(register['gates'][int(g[1:])]['blockers']))
                for g in correction['affectedGates']), 'open review REWORK hidden as met-local')
    require(corrections_now[1]['affectedGates'] == corrections_now[2]['affectedGates'] == ['G6', 'G9'] and
            corrections_now[4]['affectedGates'] == ['G6', 'cutoverReadiness'], 'affected gate coverage drift')
    require('edf816838' in corrections_now[2]['reworkResolutions']['w37-6'] and
            'mechanical' in corrections_now[2]['reworkResolutions']['w37-6'] and
            'independent' in corrections_now[4]['note'].lower(), 'mechanical fix or register review boundary drift')
    require(corrections_now[-1]['verdictCounts'] == {'APPROVE': 11} and
            corrections_now[-1]['affectedGates'] == ['cutoverReadiness'] and
            all(term in corrections_now[-1]['note'] for term in ['0 REWORK', 'w39-10', 'w39-11', 'resolved', 'L13-31']),
            'register order review resolution drift')
    rebind_path = ROOT / BASE / 'rebind/g0-rework-rebindings.json'
    old_rebind = git('show', f'{current_pin}:{BASE}/rebind/g0-rework-rebindings.json')
    new_rebind = rebind_path.read_bytes()
    old_status = json.loads(old_rebind)['status']
    require(json.loads(new_rebind)['status'] ==
            'reviewed; records 0–148 (594fe4194): reviews/w26-g0-rework-verdicts.md; records 149–154: reviews/w33-ownership-audit-review.json (5 APPROVE / 0 REWORK)' and
            new_rebind.replace(json.dumps(json.loads(new_rebind)['status'], ensure_ascii=False).encode(),
                               json.dumps(old_status, ensure_ascii=False).encode(), 1) == old_rebind and
            all(term in register['gates'][0]['note'] for term in [
                '0–148', '594fe4194', 'reviews/w26-g0-rework-verdicts.md',
                '149–154', 'reviews/w33-ownership-audit-review.json']),
            'rebind reviewed status or edge-byte conservation drift')
    audit = register['ownershipAudit']
    require(audit['status'] == 'reported-ok' and
            audit['commit'] == git('rev-parse', '23e3c34b7').decode().strip() and
            audit['source'] == 'owner-answers.md' and audit['ruling'] == 'L13-29.1' and
            audit['packet'] == 'cutover-approval-packet.md' and
            audit['unaccountedPairs'] == 0 and audit['B'] == 'ok' and
            audit['reproduction'] == {'passed': 8, 'total': 8} and audit['allowedPathExceptionsDropped'] == 58,
            'ownership audit provenance drift')
    require({entry['path'] for entry in audit['inputs']} == {str(BASE.parent / rel) for rel in [
        'phase-08/audit-report.py', 'phase-06/step10-round5-reproduction.json',
        'phase-06/step10-sync4d-reproduction.json']} and len(audit['inputs']) == 3,
        'ownership audit input coverage drift')
    for entry in audit['inputs']:
        raw = git('show', f"{audit['commit']}:{entry['path']}")
        require(raw == git('show', f"{current_pin}:{entry['path']}") == git('show', f"HEAD:{entry['path']}") ==
                (ROOT / entry['path']).read_bytes() and hashlib.sha256(raw).hexdigest() == entry['sha256'] and
                current_inputs[entry['path']]['sha256'] == entry['sha256'], 'ownership audit input drift')
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
                                    current_pin if gate['g'] == 'G0' else commit_pins.get(gate['commit'], pin)], cwd=ROOT,
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
    require(register['gates'][0]['commit'] == current_pin, 'G0 current join commit drift')
    guard_duties = ' '.join(register['gates'][6]['atFinalPinUnderLease'])
    require(all(term in guard_duties for term in ['L13-28.4', 'fchain/links.py', 'both must report 0',
            'Related headers', '398', '394', 'multi-line', '44', 'relatedPaths()',
            'scripts/check-doc-candidate-status.mjs', 'f06461/f06591/f07205', 'f06504', 'f06823']),
            'guard-3 agreement or shard-2 delta duty drift')
    require('the owner has approved the cutover packet (L13-6)' in readiness['atFinalPinUnderLease'][-1] and
            'already sent' not in readiness['atFinalPinUnderLease'][-1], 'owner approval precondition drift')
    require('L13-28' in register['gates'][6]['note'] and
            'linkGuard' in register['gates'][6]['note'] and
            'rebased-current:rebased:w8:gloss:docs/platform/work-state/spec.md' in register['gates'][7]['note'] and
            'pending' in register['gates'][7]['note'] and 'identical change set' in register['gates'][7]['note'] and
            'reviews/w33-link-retargets-review.json item work-state-rebase' in register['gates'][7]['note'] and
            all(term in register['gates'][9]['note'] for term in ['138', '136', '2 history-only', '60', '288']),
            'current gate note disclosure drift')
    require([row['step'] for row in readiness['order']] == [
        'Owner cutover approval within the stated scope and budget',
        'lead:LAND confirms and posts the DOC freeze notice and HARDEN request on the board',
        'HARDEN/Git owner answers: G4 review of the 25 declarations and git spec §7 consent',
        'Final main import with accounting; record F',
        'SEAT/LAND stages release R from the F code commit; staged only, not activated',
        'G11: Lead proves installed-host docs-lease acquire/status/release/abandon in a disposable clone',
        'G10: holder Land rehearsal on the G8 shrunk clone with release R',
        'Acquire the real documentation write lease',
        'Execute F duties and delta reviews; stop if any fails',
        'Write and independently review the final status ledger',
        'Land within the separately approved frame'] and
            [row['status'] for row in readiness['order']] == ['done'] * 2 + ['pending'] * 9,
            'cutover order drift')
    board = readiness['order'][1]
    board_bytes = git('show', '--format=', '--unified=0', board['boardCommit'], '--', board['boardPath'])
    require(board['boardCommit'] == git('rev-parse', 'e99966b37').decode().strip() and
            board['boardPath'] == 'plans/261017-1313-fgos-platform-program-board/log.md' and
            board['boardDiffSha256'] == hashlib.sha256(board_bytes).hexdigest() and
            all(term in board_bytes.decode() for term in ['lead:LAND', 'DOC', 'HARDEN', '25 declaration', '§7']) and
            board['date'] == '2026-10-26' and board['ruling'] == 'L13-31' and
            board['evidence'] == ['owner-answers.md', 'w40-register-order-brief.md'] and
            all('Freeze docs/ from F until Land; convention only until the real lease.' in row['note']
                for row in [board, readiness['order'][3]]),
            'board notice or convention-only freeze provenance drift')
    decision = readiness['ownerDecision']
    require(decision['source'] == 'owner-answers.md' and decision['ruling'] == 'L13-30' and
            decision['date'] == '2026-10-26' and decision['time'] == '09:57' and
            decision['option'] == 'A' and decision['status'] == 'approved' and
            decision['packet'] == 'cutover-approval-packet.md' and
            decision['packetCommit'] == git('rev-parse', '6586bbc46').decode().strip() and
            decision['ownerText'] == 'đồng ý A, khi nào lead LAND báo ổn thì em làm.' and
            decision['ownerText'] in git('show', f'{current_pin}:{BASE}/owner-answers.md').decode() and
            decision['condition'] == dict(owner='lead:LAND', requiredBefore=readiness['order'][1]['step'], status='done',
                action='lead:LAND confirms before any option-A step, starting with the board notice',
                date='2026-10-26', evidence=['owner-answers.md', 'w40-register-order-brief.md']) and
            decision['allowed'] == ['Documentation lease', 'One main import as F with accounting',
                'F duties on plan branch and clones', 'Archive ref publication', 'Write and independently review final ledger'] and
            decision['notAllowed'] == ['Land on main without separate approval after final ledger review',
                'Delete files on main', 'Push .fgos/events*', 'Widen the frame when F exceeds counts; stop and ask again'] and
            all(row['evidence'] == ['cutover-approval-packet.md', 'owner-answers.md'] and
                row['packetCommit'] == decision['packetCommit'] and row['ruling'] == 'L13-30'
                for row in readiness['order'][:1]) and
            git('show', f"{decision['packetCommit']}:{BASE}/cutover-approval-packet.md") ==
            git('show', f'{current_pin}:{BASE}/cutover-approval-packet.md'),
            'conditional owner approval drift')
    require(not register['gates'][8]['ownerItems'] and
            'L13-30' in register['gates'][8]['note'] and
            any('Publish the archive ref' in duty and 'L13-30' in duty for duty in register['gates'][8]['atFinalPinUnderLease']) and
            register['gates'][5]['ownerItems'] and register['gates'][9]['ownerItems'] and
            'still needs independent records review' not in readiness['summary'] and
            'before sending the owner packet' not in corrections_now[4]['note'], 'owner/review summary drift')
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
    check_record = json.loads(git('show', f'{current_pin}:{BASE}/fchain/check.json'))
    require(check_record['exit'] == 0 and check_record['counts'] == chain['counts'] and
            composition['linkGuard'] == check_record['counts'].get('linkGuard', 0) == chain['linkGuard']['findings'] and
            composition['linkGuardSource'] == 'fchain/check.json#/counts/linkGuard (absent finding means 0)' and
            'composed replay' in composition['source'] and composition['linkGuard'] == 0 and
            composition['status'] == 'met-local' and
            composition['manifestSources'] == len(manifest['sources']) and
            composition['baseChainFiles'] == len(chain['baseChain']['files']) and
            composition['basePatchSteps'] == sum(len(row['steps']) for row in chain['baseChain']['files']) and
            composition['rebasedEntries'] == len(rebased['patches']) and
            composition['linkRetargetPatches'] == len(retargets['patches']) and
            composition['linkRetargetRows'] == len(retargets['rows']) and
            composition['additionalExecutedPatches'] == chain['executed'] and composition['composedFiles'] == chain['files'] and
            set(s['path'] for s in manifest['sources']) == set(s['path'] for s in chain['sources']) and
            window['deltaReviewsPerGate']['G0']['effectiveBindingsAtSourcePin'] == g0['counts']['effectiveRows'] and
            window['deltaReviewsPerGate']['G9']['localDependencies'] == len(dependencies['entries']) == 158 and
            window['g6Composition']['parkJudgmentRepoints'] == sum(r['disposition'] == 'repoint' for r in judgments),
            'F-window source counts drift')
    duties = json.loads(git('show', f'{current_pin}:{BASE}/g0rework/final-pin-duties.json'))['conditionalOverlayApprovals']
    duty_text = ' '.join(register['gates'][0]['atFinalPinUnderLease'])
    require(duties['relocation']['selectedId'] in duty_text and duties['relocation']['expectedAfterSha256'] in duty_text and
            duties['pairedHistoryId'] in duty_text and str(duties['total']) in duty_text and
            'rebased:w8:repin:w2:predecessor:docs/platform/component-boundary.md' in duty_text,
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
                       'L13-31 board/HARDEN/F/staged-R/G11/G10/lease order, owner/external/F projections and source-derived F-window counts',
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
