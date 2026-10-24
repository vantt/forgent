#!/usr/bin/env python3
"""Negative controls for pinned authoring and recorded live-overlay custody.

The shard equality is the owning authoring proof; these controls show that
pinning cannot hide corruption, nor can a current binding excuse a missing
recorded preimage. All mutated inputs are disposable scratch copies.
"""
import sys
sys.dont_write_bytecode = True
import json, pathlib, subprocess, tempfile

P = pathlib.Path('plans/260925-documentation-authority-unification')
O = P/'reports/phase-09/misc-fix'
SCRATCH = pathlib.Path('/tmp/fgos-work/w11-misc-pin')


def main():
    SCRATCH.mkdir(parents=True, exist_ok=True)
    common = """import json, pathlib, runpy
from unittest.mock import patch
m = runpy.run_path('plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/rebind.py')
g = m['check'].__globals__
commit = m['author_commit']()
pin = json.loads(m['source'](commit, m['O']/'binding-refresh.json'))['sourceHead']
"""
    controls = []
    with tempfile.TemporaryDirectory(prefix='controls-', dir=SCRATCH) as tmp:
        base = pathlib.Path(tmp)
        author = subprocess.check_output(['git', 'log', '-1', '--format=%H', '--',
                                         str(O/'binding-refresh.json')], text=True).strip()
        shard = P/'ledger/decisions/s17-misc-review-fixes.json'
        original = json.loads(subprocess.check_output(['git', 'show', author+':'+str(shard)], text=True))
        original['bindingRefresh'][0]['targetUnitDigest'] = '0'*64
        corrupted = base/'author-shard.json'
        corrupted.write_text(json.dumps(original))
        author_code = common + """real = m['source']
def source(commit_arg, path):
    return pathlib.Path(COPY).read_text() if commit_arg == commit and path == m['SHARD'] else real(commit_arg, path)
with patch.dict(g, source=source):
    m['check'](pin)
""".replace('COPY', repr(str(corrupted)))
        record_path = P/'reports/phase-09/import3/binding-refresh.json'
        record = json.loads(record_path.read_text())
        removed = [r for r in record['changes'] if r['shard'] == str(shard) and r['pointer'] == '/bindingRefresh/14']
        assert len(removed) == 1
        record['changes'].remove(removed[0])
        dropped = base/'later-record.json'
        dropped.write_text(json.dumps(record))
        live_code = common + """real = pathlib.Path.read_text
def read(path, *args, **kwargs):
    return real(pathlib.Path(COPY), *args, **kwargs) if path == pathlib.Path(RECORD) else real(path, *args, **kwargs)
with patch.object(pathlib.Path, 'read_text', read):
    m['check_live'](json.loads(m['source'](commit, m['SHARD'])), commit)
""".replace('COPY', repr(str(dropped))).replace('RECORD', repr(str(record_path)))
        for name, code, failure in [
                ('corrupt-author-overlay', author_code, 'assert json.loads(source(commit, SHARD))==shard'),
                ('drop-later-rebind-preimage', live_code, 'unaccounted misc-fix overlays')]:
            command = ['python3', '-B', '-c', code]
            proc = subprocess.run(command, capture_output=True, text=True)
            assert proc.returncode == 1 and failure in proc.stderr, (name, proc.returncode, proc.stderr)
            if name == 'drop-later-rebind-preimage':
                assert '/bindingRefresh/14' in proc.stderr
            controls.append(dict(name=name, argv=command, exit=proc.returncode,
                                 stdout=proc.stdout, stderr=proc.stderr, expectedFailureObserved=True))
    result = dict(authoringCommit=author, controls=controls, scratchCopiesRemoved=True)
    (O/'pin-controls.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(dict(controls=[dict(name=c['name'], exit=c['exit']) for c in controls],
                          expectedFailuresObserved=True)))


if __name__ == '__main__':
    main()
