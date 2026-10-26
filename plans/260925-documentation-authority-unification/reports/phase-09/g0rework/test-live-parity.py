#!/usr/bin/env python3
"""Owning carries-checker falsification probes; no checkout bytes are changed.

The historical proofs did not observe live headings, newly uncovered section
blocks or unlisted patch drift. Exercise those refusals through the real checker
with read-only fixture overlays, not a second implementation of its assertions.
Run from the repository root with python3 -B; all scratch is exit-cleaned.
"""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile


def main():
    root = Path.cwd()
    carries = Path('plans/260925-documentation-authority-unification/reports/phase-09/carries')
    headings = json.loads((carries / 'source-heading-parity.json').read_text())
    parity = json.loads((carries / 'source-parity.json').read_text())
    packet = json.loads((carries / 'pointer-patches.json').read_text())
    duties = json.loads((carries / 'final-pin-duties.json').read_text())
    cases = []
    stale = copy.deepcopy(headings)
    row = next(h for h in stale if h['sourcePath'] == 'docs/specs/distribution.md' and h['sourceAnchor'] == 'data-dictionary')
    row['sourceUnitDigest'] = row['accounting']['oldLegacyDigest']
    cases.append(('stale live heading is refused', carries / 'source-heading-parity.json', json.dumps(stale), 'live source heading: docs/specs/distribution.md#data-dictionary'))
    missing = [p for p in parity if not (p['sourcePath'] == 'docs/specs/distribution.md' and p['sourceAnchor'] == 'unheaded-block-17')]
    assert len(missing) == len(parity) - 1
    cases.append(('uncovered current section block is refused', carries / 'source-parity.json', json.dumps(missing), 'live direct section block unaccounted: docs/specs/distribution.md#unheaded-block-17'))
    source = Path('docs/specs/distribution.md')
    cases.append(('new live heading outside the census is refused', source, source.read_text() + '\n## New fixture section\n', 'live heading census: docs/specs/distribution.md'))
    unlisted = next(p['path'] for p in packet['patches'] if p['applied'] is False and p['path'] not in {d['path'] for d in duties['pointerPatchDrift']})
    cases.append(('unlisted patch drift is refused and all drift paths are named', Path(unlisted), Path(unlisted).read_text() + '\nfixture drift\n', 'unlisted live pointer-patch drift'))
    empty = dict(duties, pointerPatchDrift=[])
    cases.append(('known drift without explicit duties is refused', carries / 'final-pin-duties.json', json.dumps(empty), 'unlisted live pointer-patch drift'))

    scratch = Path('/tmp/fgos-work')
    scratch.mkdir(parents=True, exist_ok=True)
    results = []
    with tempfile.TemporaryDirectory(prefix='live-parity-probes-', dir=scratch) as name:
        hook = Path(name) / 'overlay.cjs'
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
        env['NODE_OPTIONS'] = (env.get('NODE_OPTIONS', '') + ' --no-addons').strip()
        for label, target, content, diagnostic in cases:
            # Only the Node checker's live read is overlaid. git show still
            # supplies genuine immutable authoring witnesses; no Git writes.
            hook.write_text("const fs=require('node:fs'),path=require('node:path');\n"
                + "const read=fs.readFileSync;process.dlopen=()=>{throw Error('native addons forbidden');};\n"
                + "fs.readFileSync=function(file,options){\n"
                + " if(typeof file==='string'&&path.resolve(file)===" + json.dumps(str((root / target).resolve())) + "){\n"
                + "  const data=" + json.dumps(content) + ";return (typeof options==='string'||options?.encoding)?data:Buffer.from(data);\n"
                + " }return read.apply(this,arguments);};\n")
            cp = subprocess.run(['node', '--require', str(hook), str(carries / 'verify-carries.mjs')],
                                env=env, capture_output=True, text=True)
            assert cp.returncode != 0 and diagnostic in cp.stderr, (label, cp.returncode, cp.stdout, cp.stderr)
            if diagnostic == 'unlisted live pointer-patch drift':
                drift = json.loads(cp.stderr.splitlines()[0])['livePointerPatchDrift']
                paths = {d['path'] for d in drift}
                assert {'bin/fgos.mjs', 'docs/backlog.md'} <= paths
                if target == Path(unlisted):
                    assert paths == {d['path'] for d in duties['pointerPatchDrift']} | {unlisted}
            results.append(dict(behavior=label, command=cp.args, exit=cp.returncode,
                                expected='nonzero', diagnostic=diagnostic))
    print(json.dumps(dict(status='pass', probes=results), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
