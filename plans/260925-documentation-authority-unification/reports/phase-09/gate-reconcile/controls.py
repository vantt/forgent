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
]
result = {'status': 'passed', 'asOf': positive['asOf'], 'positive': positive['status'],
          'negativeControls': results, 'count': len(results),
          'method': 'In-memory copies at the read_json test seam; real owning check(), path inspection and read-only git; no source file or assertion weakened.'}
(HERE / 'controls.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
