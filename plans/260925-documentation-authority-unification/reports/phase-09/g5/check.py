#!/usr/bin/env python3
"""Retention check (gate G5): every recorded retentionReceipts span must still be a whole line of its file.

Usage: python3 -B check.py [--pin <commit>]   (default: working tree)
Exit 0 when every span is found; prints one JSON object.
"""
import argparse, hashlib, json, pathlib, subprocess, sys

ROOT = pathlib.Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
GATES = ROOT / 'plans/260925-documentation-authority-unification/reports/phase-08/step-08-preflip-gates.json'


def receipts(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'retentionReceipts':
                yield from v
            else:
                yield from receipts(v)
    elif isinstance(o, list):
        for x in o:
            yield from receipts(x)


def read(path, pin):
    if pin:
        return subprocess.check_output(['git', 'show', f'{pin}:{path}'], text=True, cwd=ROOT)
    return (ROOT / path).read_text()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pin')
    a = ap.parse_args()
    rows, ok = [], True
    for r in receipts(json.loads(GATES.read_text())):
        lines = read(r['file'], a.pin).split('\n')
        index = {}
        for n, line in enumerate(lines, 1):
            index.setdefault(hashlib.sha256(line.encode()).hexdigest(), n)
        for s in r['spans']:
            # The recorded digest is of the span text; check the recipe before trusting the file lookup.
            assert hashlib.sha256(s['text'].encode()).hexdigest() == s['sha256'], (r['file'], s['line'])
            found = index.get(s['sha256'])
            ok &= found is not None
            rows.append({'file': r['file'], 'recordedLine': s['line'], 'foundLine': found, 'sha256': s['sha256']})
    pin = a.pin or 'working-tree@' + subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True, cwd=ROOT).strip()
    print(json.dumps({'pin': pin, 'ok': ok, 'spans': len(rows), 'missing': [x for x in rows if x['foundLine'] is None], 'rows': rows}, indent=2))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
