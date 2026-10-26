#!/usr/bin/env python3
"""Falsify the owning record verifier with in-memory input mutations only.

No repository/scratch mutation except the scoped controls.json result. The
production check and git implementation are unchanged; this is a test adapter.
"""
import copy
import importlib.util
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('gate_reconcile_verify', HERE / 'verify.py')
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)
read_json = verifier.read_json
register_path = verifier.ROOT / verifier.BASE / 'preflip-gate-status.json'
receipt_path = HERE / 'receipt.json'
sources_path = HERE / 'sources.json'
proofs_path = HERE / 'current-proofs.json'


def exercise(name, path, mutate, expected):
    data = copy.deepcopy(read_json(path))
    mutate(data)
    verifier.read_json = lambda requested: copy.deepcopy(data) if requested == path else read_json(requested)
    try:
        verifier.check()
    except ValueError as error:
        if expected not in str(error):
            raise AssertionError(f'{name}: wrong failure: {error}') from error
        return {'name': name, 'result': 'rejected', 'error': str(error)}
    finally:
        verifier.read_json = read_json
    raise AssertionError(name + ': invalid record unexpectedly passed')


def remove_overlay_duty(document):
    duties = document['gates'][0]['atFinalPinUnderLease']
    duty = duties[-1]
    duties[-1] = 'Control: conditional approval requirements omitted.'
    projection = document['cutoverReadiness']['atFinalPinUnderLease']
    projection[projection.index('G0: ' + duty)] = 'G0: ' + duties[-1]


positive = verifier.check()
# A real, existing main commit is used here, not a nonexistent hash. Its
# non-ancestry was also recorded by W16; check() proves it again through git.
results = [
    exercise('Missing evidence path is rejected', register_path,
             lambda d: d['gates'][0]['evidence'].append('gate-reconcile/absent-negative-control.json'),
             'missing evidence path'),
    exercise('Existing commit outside the snapshot ancestry is rejected', register_path,
             lambda d: d['gates'][0]['cleared'][0]['clearedBy'].append('42c5a0a55'),
             'not ancestor'),
    exercise('Invented verdict quotation is rejected', register_path,
             lambda d: d['gates'][0]['cleared'][0].update(verdict='APPROVE: invented control verdict'),
             'not an exact review verdict quote'),
    exercise('Met-local with local before-F work is rejected', register_path,
             lambda d: d['gates'][3]['blockers'].append('unowned local control task'),
             'has before-F local work'),
    exercise('Omitted original occurrence is rejected', receipt_path,
             lambda d: d['decisions'].pop(), 'missing/extra/altered original occurrence'),
    exercise('False before/after counts are rejected', receipt_path,
             lambda d: d['countsPerGate'][0]['after'].update(blockers=99), 'before/after counts drift'),
    exercise('False snapshot fingerprint is rejected', sources_path,
             lambda d: d['inputs'][0].update(sha256='0' * 64), 'snapshot hash drift'),
    exercise('False follow-up fingerprint is rejected', receipt_path,
             lambda d: d['followUp']['inputs'][0].update(sha256='0' * 64), 'follow-up fingerprint drift'),
    exercise('False W19 review fingerprint is rejected', receipt_path,
             lambda d: d['reviewFollowUp']['inputs'][0].update(sha256='0' * 64), 'review follow-up fingerprint drift'),
    exercise('False catch-up review or ruling fingerprint is rejected', receipt_path,
             lambda d: d['catchUp']['inputs'][0].update(sha256='0' * 64), 'catch-up fingerprint drift'),
    exercise('False correction snapshot fingerprint is rejected', receipt_path,
             lambda d: d['corrections']['inputs'][0].update(sha256='0' * 64), 'correction fingerprint drift'),
    exercise('False generated artifact fingerprint is rejected', receipt_path,
             lambda d: d['corrections']['generatedEvidence'][0].update(sha256='0' * 64), 'generated evidence fingerprint drift'),
    exercise('False current input fingerprint is rejected', receipt_path,
             lambda d: d['currentCatchUp']['inputs'][0].update(sha256='0' * 64), 'current fingerprint drift'),
    exercise('Omitted current review is rejected', receipt_path,
             lambda d: d['currentCatchUp']['reviewInventory'].pop(), 'current review inventory coverage'),
    exercise('Current G0 gap is rejected', proofs_path,
             lambda d: d['commands'][0]['counts'].update(stale=1), 'current G0 proof not green'),
    # linkGuard owns the measured link behaviour; the obsolete constant-field
    # control is retired rather than duplicated under its historical name.
    exercise('Whole-population link guard findings are rejected', proofs_path,
             lambda d: d['commands'][1]['linkGuard'].update(findings=1), 'current F composition proof not green'),
    exercise('Missing mechanical duplicate-id rejection is rejected', proofs_path,
             lambda d: d['commands'][2].update(exit=0), 'duplicate-id mechanical-fix proof drift'),
    exercise('Omitted local correction review is rejected', register_path,
             lambda d: d['cutoverReadiness']['localCorrectionReview'].pop(), 'local correction review coverage drift'),
    exercise('Historical REWORK cannot be erased by a clean review count', register_path,
             lambda d: d['cutoverReadiness']['localCorrectionReview'][1]['verdictCounts'].update(REWORK=0),
             'local correction verdict/resolution drift'),
    exercise('An open review REWORK cannot hide behind met-local', register_path,
             lambda d: d['cutoverReadiness']['localCorrectionReview'][2]['openRework'].append('w37-6') or
                       d['cutoverReadiness']['localCorrectionReview'][2]['reworkResolutions'].pop('w37-6'),
             'open review REWORK hidden as met-local'),
    exercise('Missing guard-3 agreement duty is rejected', register_path,
             lambda d: d['gates'][6]['atFinalPinUnderLease'].__setitem__(2, 'omitted'),
             'guard-3 agreement or shard-2 delta duty drift'),
    exercise('Owner packet wording must be an approval precondition', register_path,
             lambda d: d['cutoverReadiness']['atFinalPinUnderLease'].__setitem__(-1, 'the packet was already sent'),
             'owner approval precondition drift'),
    exercise('Unreviewed premise count is rejected', register_path,
             lambda d: d['cutoverReadiness']['fWindowSize']['g6BeforeF'].update(reviewPending=1), 'F-window source counts drift'),
    exercise('Unsourced retarget patch count is rejected', register_path,
             lambda d: d['cutoverReadiness']['fWindowSize']['fComposition'].update(linkRetargetPatches=0), 'F-window source counts drift'),
    exercise('Missing conditional overlay duty is rejected', register_path,
             remove_overlay_duty, 'conditional G0 F duty drift'),
    exercise('Unproven audit execution is rejected', register_path,
             lambda d: d['ownershipAudit'].update(status='passed'), 'ownership audit provenance drift'),
    exercise('Stale ownership audit fingerprint is rejected', register_path,
             lambda d: d['ownershipAudit']['inputs'][0].update(sha256='0' * 64), 'ownership audit input drift'),
    exercise('Reported accounting outcome cannot be altered', register_path,
             lambda d: d['ownershipAudit'].update(allowedPathExceptionsDropped=0), 'ownership audit provenance drift'),
    exercise('Conditional approval cannot omit LAND confirmation', register_path,
             lambda d: d['cutoverReadiness']['ownerDecision']['condition'].update(status='done'),
             'conditional owner approval drift'),
    exercise('Approved permission cannot imply an executed lease', register_path,
             lambda d: d['cutoverReadiness']['order'][3].update(status='done'), 'cutover order drift'),
    exercise('Review gate coverage cannot omit G9', register_path,
             lambda d: d['cutoverReadiness']['localCorrectionReview'][1]['affectedGates'].remove('G9'),
             'affected gate coverage drift'),
    exercise('Uncarried ownership follow-up is rejected', register_path,
             lambda d: d['followUps'].pop(), 'outside-plan follow-up provenance drift'),
    exercise('Register link guard must cite the measured finding', register_path,
             lambda d: d['cutoverReadiness']['fWindowSize']['fComposition'].update(linkGuardSource='unsourced'),
             'F-window source counts drift'),
    exercise('Unsourced follow-up is rejected', register_path,
             lambda d: d['followUps'][0].update(sourceReview='reviews/absent.json'), 'outside-plan follow-up provenance drift'),
    exercise('Packet moved after the lease is rejected', register_path,
             lambda d: d['cutoverReadiness']['order'].reverse(), 'cutover order drift'),
    exercise('Unsourced F-window size is rejected', register_path,
             lambda d: d['cutoverReadiness']['fWindowSize']['g6UnboundRows'].update(count=0), 'F-window source counts drift'),
]
result = {'status': 'passed', 'asOf': positive['asOf'], 'positive': positive['status'],
          'negativeControls': results, 'count': len(results),
          'method': 'In-memory copies at the read_json test seam; real owning check(), path inspection and read-only git; no source file or assertion weakened.'}
(HERE / 'controls.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
