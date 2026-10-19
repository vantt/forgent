#!/usr/bin/env python3
"""Replay L12-35 records across pilot and wave 1 and verify both current freezes.
"""
import sys
sys.dont_write_bytecode = True
import argparse, importlib.util, json, pathlib, math
P = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('accepted_step03_check', P / 'step-03-check.py')
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)
PIN = 'ae141550c2e022310de7a0efea757580c0b2479f'
WAVE = tuple(f'{i:03}' for i in range(3, 34))
PILOT = ('001', '002', '040', '041')

def unpatched_stratum(records, batch, selected):
    population=sorted(r['file'] for r in records if r['reviewSet']=='batch-'+batch and not r.get('retiresWithTree') and not r['diff'] and r['edges'] and r['file'] not in selected)
    seed='A51-step03-file-v1-unpatched\0'+PIN+'\0batch-'+batch
    ranks=sorted([{'file':file,'rankHash':check.sha(seed+'\0'+file)} for file in population],key=lambda x:(x['rankHash'],x['file']))
    return {'seed':seed,'population':population,'populationCount':len(population),'ranks':ranks,'selected':[r['file'] for r in ranks[:math.ceil(.15*len(population))]],'reworkNumerator':'pending','acceptance':'Lead only; no pooled denominator'}

def pilot_manifest(records):
    check.SETS=PILOT
    frozen=check.manifest_view(records,PIN)
    frozen['recordFiles']=[{'path':str(check.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':check.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in PILOT]
    frozen['unpatchedStrata']={b:unpatched_stratum(records,b,next(g['selected'] for g in frozen['sets'] if g['set']=='batch-'+b)) for b in PILOT}
    return frozen

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
    frozen['unpatchedStrata']={b:unpatched_stratum(records,b,next(g['selected'] for g in frozen['sets'] if g['set']=='batch-'+b)) for b in WAVE}
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
    recorded_pilot = json.loads((P / 'step-03-pilot-r6-manifest.json').read_text())
    if recorded_pilot != pilot_manifest(pilot):
        result['failures'].append({'check':'pilot-r6-manifest-and-selector-freeze'})
    recorded = json.loads((P / 'step-03-wave1-r3-manifest.json').read_text())
    if recorded != frozen:
        result['failures'].append({'check': 'wave1-manifest-and-selector-freeze'})
    result['failureCount'] = len(result['failures'])
    result['checker'] = 'step-03-check.py: L12-35 computed units, carriage facts, dual-coordinate directory/link scan and self-successor checks; pilot + wave 1'
    result['waveFiles'] = len(wave)
    result['retiredFiles']=sum(bool(r.get('retiresWithTree')) for r in records)
    result['retiredEdges']=sum(check.edge_count(r) for r in records if r.get('retiresWithTree'))
    result['activeFiles']=sum(not r.get('retiresWithTree') for r in records)
    result['activeEdges']=sum(len(r['edges']) for r in records)
    result['waveEdges'] = sum(check.edge_count(r) for r in wave)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return bool(result['failureCount'])

if __name__ == '__main__':
    raise SystemExit(main())
