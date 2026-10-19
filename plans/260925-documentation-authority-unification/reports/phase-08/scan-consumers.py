"""Replay inventory JSON patterns across all tracked regular UTF-8 files.
Emits lexical hits only; does not replace semantic classification or edit inventory.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess

plan = 'plans/260925-documentation-authority-unification/'
seed = json.loads(Path(plan + 'reports/phase-08/consumer-inventory.json').read_text())
patterns = {key: re.compile(value) for key, value in seed['patterns'].items()}
rows = []
scanned = 0
for name in subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0'):
    if not name or '.fgos' in Path(name).parts or name.startswith(plan):
        continue
    p = Path(name)
    if p.is_symlink() or not p.is_file():
        continue
    try:
        data = p.read_bytes()
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        continue
    if '\0' in text:
        continue
    scanned += 1
    hits = [{'line': i, 'pattern': key, 'references': [m.group() for m in regex.finditer(line)]}
            for i, line in enumerate(text.splitlines(), 1)
            for key, regex in patterns.items() if regex.search(line)]
    if hits:
        rows.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'hits': hits})
print(json.dumps({'patterns': seed['patterns'], 'scannedFiles': scanned, 'files': rows}, indent=2))
