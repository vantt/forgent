"""Read-only replay of both committed ownership/checks recipes; scratch outputs only.
Failing rows are the drift rows the rebind check does not account for.
Run from repository root. Exit 1 means a real failing audit, not a reporter error.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile

base = Path('plans/260925-documentation-authority-unification/reports/phase-06')
scratch = Path('/tmp/fgos-work')
scratch.mkdir(parents=True, exist_ok=True)
run = Path(tempfile.mkdtemp(prefix='p8-audit-', dir=scratch))
env = dict(os.environ)
env.pop('CLAUDE_CODE_SESSION_ID', None)
report = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'scratch': str(run), 'manifests': []}
for stem, key, lib in [('step10-round5', 'scripts', 'step10-sync287-lib.mjs'),
                       ('step10-sync4d', 'readOnlyScripts', 'lib.mjs')]:
    manifest = base / (stem + '-reproduction.json')
    dest = run / stem
    dest.mkdir()
    scripts = json.loads(manifest.read_text())[key]
    for name, source in scripts.items():
        if Path(name).name != name:
            raise ValueError('Non-leaf embedded script name')
        (dest / name).write_text(source)
    item = {'manifest': str(manifest), 'commands': []}
    # Do not short-circuit: checks.mjs is independent of ownership/audit success.
    for name in ['ownership.mjs', 'audit-ownership.mjs', 'checks.mjs']:
        result = subprocess.run(['node', str(dest / name), '--output-dir', str(dest)],
                                env=env, text=True, capture_output=True, timeout=120)
        (dest / (name + '.stdout')).write_text(result.stdout)
        (dest / (name + '.stderr')).write_text(result.stderr)
        item['commands'].append({'script': name, 'exit': result.returncode})
    ownpath = dest / (stem + '-target-ownership.json')
    own = json.loads(ownpath.read_text()) if ownpath.exists() else {}
    # Reuse this manifest's exact unitsOf implementation for current anchor digests.
    helper = dest / 'report-current.mjs'
    helper.write_text("import fs from 'node:fs';\n"
                      + "import {unitsOf} from './" + lib + "';\n"
                      + "const rows=JSON.parse(fs.readFileSync(process.argv[2])).unaccountedTargetDigestDrift;\n"
                      + "console.log(JSON.stringify(rows.map(r=>({...r,currentDigests:unitsOf(r.targetOwner).filter(u=>u.anchor===r.targetAnchor).map(u=>u.textDigest)}))));\n")
    if ownpath.exists():
        current = subprocess.check_output(['node', str(helper), str(ownpath),
                                           '--output-dir', str(dest)], env=env, text=True)
        item['failingRows'] = [dict(row, manifest=str(manifest)) for row in json.loads(current)]
    else:
        item['failingRows'] = None
    item['ownership'] = {k: own.get(k) for k in ['noNewDoubleOwnership',
        'nativePlatformTargetIdentityDuplicates', 'newActiveSourcePairCollisions']}
    checkpath = dest / (stem + '-checks.json')
    item['checks'] = json.loads(checkpath.read_text()) if checkpath.exists() else None
    report['manifests'].append(item)
report['ok'] = all(all(c['exit'] == 0 for c in m['commands'])
                   and m['failingRows'] == [] and m['checks'] and m['checks']['ok']
                   for m in report['manifests'])
(run / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['ok'] else 1)
