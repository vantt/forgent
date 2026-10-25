#!/usr/bin/env python3
"""Pinned documentation occurrences for the two moved root documents."""
import sys
sys.dont_write_bytecode = True
import hashlib
import json
import difflib
from pathlib import Path
import posixpath
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P9 = HERE.parent
OLD = ('docs/doc-governance.md', 'docs/architecture-map.md')


def git(*args):
    return subprocess.check_output(['git', '--no-optional-locks', *args], cwd=ROOT)


def census(pin):
    """Full-path operands plus relative Markdown destinations, not basename guesses."""
    paths = git('ls-tree', '-r', '--name-only', pin, '--', 'docs/').decode().splitlines()
    hits = []
    for file in paths:
        if not file.endswith('.md'):
            continue
        raw = git('show', pin + ':' + file)
        for number, line in enumerate(raw.decode().splitlines(), 1):
            # Match path-token boundaries so platform/architecture-map isn't an
            # accidental old-path match; explicit docs/... strings remain exact.
            found = {old for old in OLD if re.search(r'(?<![\w/.-])' + re.escape(old) + r'(?![\w/.-])', line)}
            for destination in re.findall(r'\]\(([^\s)]+)\)', line):
                destination = destination.split('#', 1)[0]
                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(file), destination))
                if resolved in OLD:
                    found.add(resolved)
            for old in sorted(found):
                hits.append(dict(oldPath=old, path=file, line=number, text=line,
                                 fileSha256=hashlib.sha256(raw).hexdigest()))
    return hits


def author():
    path = P9 / 'g9/phase9-decisions.json'
    data = json.loads(path.read_text()); pin = data['sourcePin']
    proof_path = 'plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/proof.json'
    proof_raw = git('show', pin + ':' + proof_path)
    proof = json.loads(proof_raw)['rows']; proof_byid = {r['rowId']: (i, r) for i, r in enumerate(proof)}
    shards = {n: json.loads((P9 / f'preserve-premise/park-judgments/shard-{n}.json').read_text()) for n in (1, 2, 3)}
    rows = {r['rowId']: (n, i, r) for n, doc in shards.items() for i, r in enumerate(doc['rows'])}
    gateway = 'docs/contracts/fgos-gateway-api-v1.yaml'
    for reader in data['gatewayReaders']:
        if not reader['path'].startswith('docs/'):
            for field in ('g6Rows', 'g6Refs', 'composedBy'):
                reader.pop(field, None)
            continue
        owners = [rid for rid in rows if proof_byid[rid][1]['file'] == reader['path'] and
                  any(o['path'] == gateway for o in proof_byid[rid][1]['normalizedOperands'])]
        if owners:
            reader['g6Rows'] = owners
            reader['g6Refs'] = [dict(path=proof_path, sha256=hashlib.sha256(proof_raw).hexdigest(),
                                    pointer='/rows/' + str(proof_byid[rid][0])) for rid in owners]
            reader['composedBy'] = [dict(shard=rows[rid][0], row=rows[rid][1], rowId=rid) for rid in owners]
            reader.pop('compositionAddition', None)
    for entry in data['entries']:
        if entry['file'] == gateway:
            entry['readers'] = data['gatewayReaders']
    # All occurrences are retained in the census, even source/lineage and removed
    # readers. Classifications are descriptive, not exemptions from ownership.
    physical = json.loads((P9 / 'preserve-premise/proof.json').read_text())['physical']
    removed = {m['from'] for m in physical['physicalMoves']} | set(physical['additionalStep6Removals'])
    hits = census(pin)
    order = json.loads((P9.parent / 'phase-08/step-07-patch-order.json').read_text())['patches']
    for hit in hits:
        owners = []
        for rid, (n, index, row) in rows.items():
            original = proof_byid[rid][1]
            source = row.get('source') or next(e for e in row['evidence'] if e.get('role') == 'source-unit')
            start = source.get('lineStart', source.get('startLine', 0))
            end = source.get('lineEnd', source.get('endLine', -1))
            if original['file'] == hit['path'] and start <= hit['line'] <= end:
                owners.append(dict(shard=n, row=index, rowId=rid))
        hit['proofOwners'] = [dict(rowId=r['rowId'], pointer='/rows/' + str(i), result=r['result'])
            for i, r in enumerate(proof) if r['file'] == hit['path'] and hit['line'] in (r['currentLines'] or []) and
            any(o['path'] == hit['oldPath'] for o in r['normalizedOperands'])]
        hit['shardOwners'] = owners
        hit['chainOwners'] = [r['patchSpecId'] for r in order if r['path'] == hit['path']]
        hit['readerKind'] = ('removed-with-source' if hit['path'] in removed else
                             'historical' if '/history/' in hit['path'] else 'surviving')
        if hit['readerKind'] == 'surviving' and not owners and not hit['chainOwners']:
            if hit['proofOwners'] and all(r['result'] == 'preserve-source-confirmed-history' for r in hit['proofOwners']):
                hit['readerKind'] = 'confirmed-history'
                hit['reason'] = 'Existing G6 proof retains this exact source-confirmed lineage, not current routing; judgment unchanged.'
            elif hit['path'] == 'docs/backlog.md' and hit['text'].endswith('— done'):
                hit['readerKind'] = 'completed-work-history'
                hit['reason'] = 'Completed STR57 records the original migration input, not a current map reader.'
            elif hit['path'] in {'docs/decisions/index.md', 'docs/knowledge/decisions-index/decision-record.md'}:
                hit['readerKind'] = 'retained-decision-projection'
                hit['reason'] = 'Dated immutable decision/outcome payload, retained under L12-96; neither hand-edit projection nor change historical decision text.'
    # A late-added mailbox paragraph was absent from the old census. Its one
    # live pointer gets a new owned patch, not an invented G6 row.
    additions_path = P9 / 'g9/f-composition-additions.json'
    additions = json.loads(additions_path.read_text())
    file = 'docs/platform/agent-mailbox/spec.md'
    ident = 'g9:dependencies:mailbox-map-reader'
    existing = next((i for i, p in enumerate(additions['patches']) if p['id'] == ident), None)
    if existing is None:
        # Read the selected exact base through the existing chain builder, not
        # a second replay implementation. Only this additional patch is authored.
        import importlib.util
        spec = importlib.util.spec_from_file_location('reader_shard', P9 / 'preserve-premise/park-judgments/check_shard.py')
        shard = importlib.util.module_from_spec(spec); spec.loader.exec_module(shard)
        engine = shard.load_replayer(); states, fs, _ = shard.replay_chain(engine.PIN, engine)
        assert not fs
        before = states[file]['text']; old = 'per `docs/architecture-map.md`'; new = 'per `docs/platform/architecture-map.md`'
        assert before.count(old) == 1
        after = before.replace(old, new)
        diff = lambda a,b: ''.join(difflib.unified_diff(a.splitlines(True), b.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
        additions['patches'].append(dict(id=ident, path=file, sourceCommit=pin, status='prepared-not-applied',
            beforeSha256=hashlib.sha256(before.encode()).hexdigest(), expectedAfterSha256=hashlib.sha256(after.encode()).hexdigest(),
            diff=diff(before, after), rollbackDiff=diff(after, before), rationale='Live old-map reader in the late-added mailbox contract; exact path-only co-cut.'))
        existing = len(additions['patches']) - 1
    for hit in hits:
        if hit['path'] == file:
            hit['owningPatch'] = dict(artifact='f-composition-additions.json', pointer='/patches/' + str(existing))
    for entry in data['entries']:
        if entry['file'] == 'docs/architecture-map.md':
            if not any(r['path'] == file for r in entry['readers']):
                entry['readers'].append(dict(path=file, role='late-area live map citation', patchRefs=[dict(artifact='f-composition-additions.json', pointer='/patches/' + str(existing))]))
                entry['patchRefs'].append(dict(artifact='f-composition-additions.json', pointer='/patches/' + str(existing)))
        if entry['file'] in OLD and entry['decision'] == 'moved':
            entry['documentReaderOccurrences'] = [i for i, h in enumerate(hits) if h['oldPath'] == entry['file']]
    additions_path.write_text(json.dumps(additions, ensure_ascii=False, indent=2) + '\n')
    # New additions own the corresponding original move rows, just like /5.
    manifest_path = HERE / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['resolutions'][str(additions_path.relative_to(ROOT)) + '#/patches/' + str(existing)] = dict(
        owners=[e['id'] for e in data['entries'] if e['file'] == 'docs/architecture-map.md'])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    data['rootDocReaderCensus'] = dict(sourcePin=pin, method='Exact full-path tokens and resolved relative Markdown destinations in every pinned docs/**/*.md; all occurrences retained.', occurrences=hits)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(gatewayReaders=len(data['gatewayReaders']), rootOccurrences=len(hits),
        surviving=sum(h['readerKind'] == 'surviving' for h in hits),
        unowned=[h for h in hits if h['readerKind'] == 'surviving' and not h['shardOwners'] and not h['chainOwners'] and not h.get('owningPatch')]), ensure_ascii=False))


if __name__ == '__main__':
    author()
