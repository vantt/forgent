"""Independent sorted-JSON + LF check; run with python3 -B. No writes."""
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'ledgerfix'))
from bindings import digest, head

base = Path('plans/260925-documentation-authority-unification')
receipt = json.loads((base / 'reports/phase-09/resync-a/binding-refresh.json').read_text())
source = json.loads((base / 'ledger/decisions/s13-resync-a.json').read_text())
checked = 0
evaluated_head = head()


def check(row):
    global checked
    actual = digest(row)
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
assert head() == evaluated_head, 'HEAD moved during replay'
print(json.dumps({'status': 'pass', 'evaluatedHead': evaluated_head, 'bindingsVerified': checked,
                  'recipeSource': str(base / 'reports/phase-08/step-08-preflip-gates.json') + '#bindingHashEncoding'}, indent=2))
