#!/usr/bin/env python3
"""Select explicit sets and replay the unchanged accepted Step 3 checker.
No checker rule, category, probe, inventory or baseline is modified here.
"""
import sys
sys.dont_write_bytecode = True
import argparse, importlib.util, json, pathlib
P = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('accepted_step03_check', P / 'step-03-check.py')
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)
PIN = 'ae141550c2e022310de7a0efea757580c0b2479f'
WAVE = tuple(f'{i:03}' for i in range(3, 34))
PILOT = ('001', '002', '040', '041')

def wave_manifest(records):
    check.SETS = WAVE
    frozen = check.manifest_view(records, PIN)
    for group in frozen['sets']:
        group['allFiles'] = group.pop('pilotFullReviewFiles')
        for witness in group['mandatoryWitnesses']:
            record = next(r for r in records if r['file'] == witness['file'])
            witness['inventoryEdges'] = len(record['inventoryEdgeIds'])
            witness['inventoryEdgeThreshold'] = len(record['inventoryEdgeIds']) >= 40
            witness['note'] = 'Supplemental edges can add review files; no inventory-threshold file is waived.'
    frozen['recordFiles'] = [
        {'path': str(check.REL / 'step-03-records' / f'batch-{b}.jsonl'),
         'sha256': check.sha((P / 'step-03-records' / f'batch-{b}.jsonl').read_bytes())}
        for b in WAVE
    ]
    return frozen

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--select', action='store_true')
    args = parser.parse_args()
    check.SETS = WAVE
    wave = check.records()
    frozen = wave_manifest(wave)
    if args.select:
        print(json.dumps(frozen, ensure_ascii=False, indent=2))
        return 0
    check.SETS = tuple(sorted(PILOT + WAVE))
    records = check.records()
    result = check.Checker(PIN).all(records)
    check.SETS = PILOT
    pilot = check.records()
    pilot_manifest = json.loads((P / 'step-03-pilot-manifest.json').read_text())
    for field in check.verify_manifest(pilot, PIN, pilot_manifest):
        result['failures'].append({'check': 'pilot-manifest-freeze', 'field': field})
    recorded = json.loads((P / 'step-03-wave1-sample.json').read_text())
    if recorded != frozen:
        result['failures'].append({'check': 'wave1-manifest-and-selector-freeze'})
    result['failureCount'] = len(result['failures'])
    result['checker'] = 'step-03-check.py unchanged; only explicit set population selected'
    result['waveFiles'] = len(wave)
    result['waveEdges'] = sum(len(r['edges']) for r in wave)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return bool(result['failureCount'])

if __name__ == '__main__':
    raise SystemExit(main())
