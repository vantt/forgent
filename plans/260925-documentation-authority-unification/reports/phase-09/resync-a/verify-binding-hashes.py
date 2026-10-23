"""Independent sorted-JSON + LF check; run with python3 -B. No writes."""
import hashlib
import json
from pathlib import Path

base = Path('plans/260925-documentation-authority-unification')
receipt = json.loads((base / 'reports/phase-09/resync-a/binding-refresh.json').read_text())
source = json.loads((base / 'ledger/decisions/s13-resync-a.json').read_text())
keys = ['targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry']
checked = 0


def check(row):
    global checked
    payload = json.dumps({k: row[k] for k in keys}, sort_keys=True,
                         ensure_ascii=False, separators=(',', ':')) + '\n'
    actual = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    assert actual == row['bindingSha256'], (row['targetOwner'], row['targetAnchor'])
    checked += 1


for refresh in receipt['refresh']:
    current = json.loads(Path(refresh['shard']).read_text())
    for key in refresh['pointer'].lstrip('/').split('/'):
        current = current[int(key)] if isinstance(current, list) else current[key]
    assert current == refresh['after']
    check(current)
for binding in source['sourceBindings']:
    check(binding)
print(json.dumps({'status': 'pass', 'bindingsVerified': checked,
                  'recipe': 'Python json.dumps sort_keys=True, ensure_ascii=False, compact separators, UTF-8, one LF'}, indent=2))
