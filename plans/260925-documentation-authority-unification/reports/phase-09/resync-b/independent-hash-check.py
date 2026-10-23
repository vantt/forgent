"""Read-only independent binding encoding check: python3 -B <this-file>."""
import hashlib
import json
import pathlib

root = pathlib.Path(__file__).resolve().parents[5]
shard = json.loads((root / 'plans/260925-documentation-authority-unification/ledger/decisions/s14-resync-b.json').read_text())
bindings = shard['unitCarries'] + shard['bindingRefresh']
for binding in bindings:
    core = {key: binding[key] for key in sorted(['targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry'])}
    encoded = (json.dumps(core, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    assert hashlib.sha256(encoded).hexdigest() == binding['bindingSha256']
excluded = {'work-state.md', 'runner.md', 'distribution.md', 'runtime-identity-and-activation.md'}
assert not {binding['sourcePath'].rsplit('/', 1)[-1] for binding in shard['unitCarries']} & excluded
print(json.dumps({'status': 'pass', 'algorithm': 'Python hashlib.sha256 over sorted four-key compact UTF-8 JSON plus LF; ensure_ascii=False', 'bindingsChecked': len(bindings), 'excludedSourcesHaveNoNewCarries': True}, indent=2))
