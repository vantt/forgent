#!/usr/bin/env python3
"""One records-only F replay. No checkout application or product imports.

The existing premise chain builder selects Step-7/composition roots; compose's
apply_diff is the only patch engine. --pin selects source bytes, never record
versions: records are the prepared working-tree proposal under review.
"""
import sys
sys.dont_write_bytecode = True
import argparse
from collections import Counter
import difflib
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
PHASE = HERE.parent
ROOT = HERE.parents[4]
P8 = PHASE.parent / 'phase-08'


def load(path):
    return json.loads(path.read_text())


def sha(value):
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def pointer(value, path):
    for key in path.lstrip('/').split('/'):
        key = key.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def patch_id(source, selector):
    return source + '#' + selector


def fingerprint(diff, replayer):
    # Context, line offsets and source spelling are not change identity.
    return tuple((old, new) for old, new, *_ in replayer.step7.hunk_edits(diff))


def apply_one(entry, state, replayer, signatures):
    """Owns conflict/duplicate/line-provenance checks at the replay boundary."""
    findings = []
    file, ident = entry['file'], entry['id']
    def issue(kind, **extra):
        findings.append(dict(kind=kind, file=file, patch=ident, **extra))
    if not entry.get('owners'):
        issue('ownerless')
    diff = entry['diff']
    headers = [line for line in diff.splitlines() if line.startswith(('--- ', '+++ '))]
    if headers != ['--- a/' + file, '+++ b/' + file]:
        issue('conflict', reason='diff must touch exactly the named safe file')
        return findings
    signature = (file, fingerprint(diff, replayer))
    if signature in signatures:
        issue('duplicateWithoutLink', previous=signatures[signature])
    signatures[signature] = ident
    before = state['text']
    try:
        if entry.get('exactBase') and sha(before) != entry['beforeSha256']:
            raise ValueError('exact composed preimage hash differs')
        command_start = len(replayer.COMMANDS)
        after = replayer.apply_diff(file, before, diff)
        if any('Reversed (or previously applied)' in command['stdout'] for command in replayer.COMMANDS[command_start:]):
            raise ValueError('prepared forward patch was auto-reversed; requires an explicit composedBy owner')
        if sha(before) == entry.get('beforeSha256') and sha(after) != entry['expectedAfterSha256']:
            raise ValueError('declared postimage hash differs')
        rollback = entry.get('rollbackDiff')
        if rollback and replayer.apply_diff(file, after, rollback) != before:
            raise ValueError('rollback does not restore composed input')
    except (ValueError, AssertionError) as exc:
        issue('conflict', reason=str(exc))
        return findings
    old = before.splitlines(True); new = after.splitlines(True)
    labels = state['labels']; result = []; overlaps = set()
    for tag, a, z, b, y in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if tag == 'equal':
            result.extend(labels[a:z]); continue
        prior = set().union(*labels[a:z]) if a < z else set()
        # Insertions at a previously changed line boundary have a stable gap key.
        if a == z:
            prior.update(state['gaps'].get(a, set()))
            state['gaps'][a] = {ident}
        overlaps.update(prior - {ident})
        result.extend([{ident} for _ in range(b, y)])
    # An explicit manifest edge co-composes a guarded base-chain output into
    # this single owning patch. Without that edge, even disjoint substitutions
    # on the same line are competing owners and fail.
    composed = entry.get('composesChain', [])
    if composed and (sha(before) != entry.get('beforeSha256') or
                     composed != [t['chainEntryId'] for t in state['trace'] if 'chainEntryId' in t]):
        issue('conflict', reason='co-composition must name the complete exact base chain')
    if overlaps and not (composed and overlaps == {'chain:' + file}):
        issue('sameLinesTwice', previous=sorted(overlaps))
    state['text'] = after; state['labels'] = result
    state['trace'].append(dict(id=ident, beforeSha256=sha(before), afterSha256=sha(after), owners=entry.get('owners', [])))
    return findings


def sources(manifest):
    """Inventory all executable inputs, deduplicating only shared shard proposals."""
    entries = []; inventory = []
    for source in manifest['sources']:
        path = ROOT / source['path']; data = load(path)
        inventory.append(dict(path=source['path'], reader=source['reader'], sha256=sha(path.read_bytes())))
        reader = source['reader']
        if reader in {'step7', 'composition', 'historical', 'generator-evidence', 'recomposed'}:
            continue
        if reader == 'premise':
            seen = set()
            for i, row in enumerate(data['rows']):
                patch = row.get('patch')
                if not patch or patch['file'] in seen:
                    continue
                seen.add(patch['file'])
                entries.append(dict(id=patch_id(source['path'], '/rows/' + str(i) + '/patch'),
                    file=patch['file'], diff=patch['patch'], owners=patch['rowIds'],
                    beforeSha256=patch['sourceSha256'], expectedAfterSha256=patch['proposedSha256'],
                    source=source['path'], selector='/rows/' + str(i) + '/patch', original=patch))
        else:
            for i, patch in enumerate(data['patches']):
                selector = '/patches/' + str(i)
                entries.append(dict(id=patch_id(source['path'], selector), file=patch.get('path', patch.get('file')),
                    diff=patch.get('diff', patch.get('forwardDiff', patch.get('patch', ''))), rollbackDiff=patch.get('rollbackDiff'),
                    beforeSha256=patch.get('beforeSha256', patch.get('sourceSha256')), expectedAfterSha256=patch.get('expectedAfterSha256', patch.get('proposedSha256')),
                    owners=patch.get('rowIds', [patch['citationId']] if patch.get('citationId') else []),
                    source=source['path'], selector=selector, original=patch))
    return entries, inventory


def compose(pin, manifest=None, additions=None):
    manifest = manifest or load(HERE / 'manifest.json')
    kinds = Counter(source['reader'] for source in manifest['sources'])
    if (manifest.get('contract') != 'fchain-manifest.v1' or
            any(kinds[kind] != 1 for kind in ('step7', 'composition', 'prepared', 'recomposed', 'additions', 'link-retargets')) or
            kinds['premise'] != 3 or kinds['pointer'] < 3):
        raise ValueError('manifest omits or duplicates a required prepared-patch reader')
    for reader, path in [('step7', P8 / 'step-07-composed-patches.json'), ('composition', PHASE / 'composition/patch-specs.json')]:
        if next(s['path'] for s in manifest['sources'] if s['reader'] == reader) != str(path.relative_to(ROOT)):
            raise ValueError('delegated reader does not name the owning engine input: ' + reader)
    shard = module('fchain_premise', PHASE / 'preserve-premise/park-judgments/check_shard.py')
    link_reader = module('fchain_links', HERE / 'links.py')
    replayer = shard.load_replayer()
    states, base_findings, base_inventory = shard.replay_chain(pin, replayer, check_checkout=False)
    findings = [dict(kind='conflict', file=f['file'], patch=f.get('chainEntryId'), reason=f) for f in base_findings]
    # A selected per-file predecessor chain is one composed patch, not competing
    # owners. Its named steps and supersessions are retained in full in inventory.
    for file, state in states.items():
        before = (shard.blob(pin, file) or b'').decode()
        labels = [set() for _ in state['text'].splitlines(True)]
        for tag, a, z, b, y in difflib.SequenceMatcher(None, before.splitlines(True), state['text'].splitlines(True), autojunk=False).get_opcodes():
            if tag != 'equal':
                labels[b:y] = [{'chain:' + file} for _ in range(b, y)]
        state['labels'] = labels; state['gaps'] = {}
    entries, inventory = sources(manifest)
    for number in (1, 2, 3):
        try:
            shard.validate_shard(number, states)
        except (ValueError, KeyError, TypeError, StopIteration) as exc:
            findings.append(dict(kind='conflict', file=f'shard-{number}', patch='shard-contract', reason=str(exc)))
    if additions is not None:
        # Same reader as the CLI, with injected proposal bytes for owning controls.
        for entry in entries:
            if entry['source'].endswith('/g9/f-composition-additions.json'):
                patch = pointer(additions, entry['selector'])
                entry.update(original=patch, diff=patch.get('diff', ''), beforeSha256=patch.get('beforeSha256'), expectedAfterSha256=patch.get('expectedAfterSha256'))
    # Existing Step-7/composition records own base roots. Keep their concrete
    # selectors, rather than inventing an owner from a filename.
    order = load(P8 / 'step-07-patch-order.json')['patches']
    packet = load(PHASE / 'composition/patch-specs.json')
    base_owners = {}
    for file, state in states.items():
        owners = [dict(source=str((P8 / 'step-07-patch-order.json').relative_to(ROOT)), pointer='/patches/' + str(i), rowIds=r['rowIds'])
                  for i, r in enumerate(order) if r['path'] == file and r.get('rowIds')]
        if not owners:
            owners = [dict(source=str((PHASE / 'composition/patch-specs.json').relative_to(ROOT)), pointer='/patches/' + str(i), id=r['id'])
                      for i, r in enumerate(packet['patches']) if r['path'] == file and r['id'] in [t['chainEntryId'] for t in state['trace']]]
        if not owners:
            owners = [dict(source=str((P8 / 'step-07-composed-patches.json').relative_to(ROOT)), pointer='/patches/' + str(i), id=r['patchSpecId'])
                      for i, r in enumerate(load(P8 / 'step-07-composed-patches.json')['patches'])
                      if r['path'] == file and r['patchSpecId'] in [t['chainEntryId'] for t in state['trace']]]
        if not owners:
            findings.append(dict(kind='ownerless', file=file, patch='chain:' + file))
        base_owners[file] = owners
    body_witnesses = []
    for body in load(PHASE / 'g9/recomposed.json')['specs']:
        file = shard.safe_path(body['path'])
        before = (shard.blob(pin, file) or b'').decode()
        try:
            if sha(before) != body['beforeSha256']:
                raise ValueError('whole-body witness preimage drift')
            after = replayer.apply_diff(file, before, body['diff']) if body['diff'] else before
            if sha(after) != body['expectedAfterSha256']:
                raise ValueError('whole-body witness postimage drift')
            if body.get('evidenceOnly'):
                mode = 'generator-preview-not-an-apply-door'
            elif after == before:
                mode = 'no-byte-change'
            elif file in states and sha(states[file]['text']) == sha(after) and body.get('composedBy') == [t['chainEntryId'] for t in states[file]['trace']]:
                mode = 'composedBy-selected-chain'
            elif body.get('composedBy'):
                mode = 'composedBy-residual'
            else:
                raise ValueError('unlinked additional whole-body patch')
            body_witnesses.append(dict(id=body['id'], file=file, mode=mode, composedBy=body.get('composedBy'), afterSha256=sha(after)))
        except (ValueError, AssertionError) as exc:
            findings.append(dict(kind='conflict', file=file, patch=body['id'], reason=str(exc)))
    resolutions = manifest.get('resolutions', {})
    byid = {entry['id']: entry for entry in entries}
    owner_files = {}
    for judgment in load(PHASE / 'preserve-premise/judgments.json')['rows']:
        owner_files.setdefault(judgment['rowId'], set()).add(judgment['file'])
    for claim in load(PHASE / 'carries/claim-carries.json')['claims']:
        owner_files.setdefault(claim['id'], set()).add(claim['sourceFile'])
    for citation in load(PHASE / 'census-join/citation-bindings.json')['rows']:
        owner_files.setdefault(citation['id'], set()).add(citation['file'])
    for row in load(PHASE / 'g9/phase9-decisions.json')['entries']:
        owner_files.setdefault(row['id'], set()).update(r['path'] for r in row['readers'])
        for ref in row['patchRefs']:
            if ref.get('artifact') == 'f-composition-additions.json':
                owner_files[row['id']].add(pointer(load(PHASE / 'g9/f-composition-additions.json'), ref['pointer'])['path'])
    for source in manifest['sources']:
        if source['reader'] == 'link-retargets':
            rows = load(ROOT / source['path'])['rows']
            if len({row['id'] for row in rows}) != len(rows):
                raise ValueError('link retarget row ids are not unique')
            for row in rows:
                if row['ruling'] not in {'L13-26', 'L13-28'}:
                    raise ValueError('link retarget lacks owning ruling')
                owner_files.setdefault(row['id'], set()).add(shard.safe_path(row['file']))
    for number in (1, 2, 3):
        for row in load(PHASE / f'preserve-premise/park-judgments/shard-{number}.json')['rows']:
            bound = row.get('source') or next((e for e in row.get('evidence', []) if e.get('role') == 'source-unit'), {})
            if bound:
                owner_files.setdefault(row['rowId'], set()).add(bound.get('file', bound.get('path')))
            if row.get('patch'):
                owner_files.setdefault(row['rowId'], set()).add(row['patch']['file'])
    signatures = {}; links = []; executed = []
    for entry in entries:
        file = shard.safe_path(entry['file']); ident = entry['id']
        state = states.setdefault(file, dict(text=(shard.blob(pin, file) or b'').decode(), trace=[], strict=True,
            labels=[set() for _ in (shard.blob(pin, file) or b'').decode().splitlines(True)], gaps={}))
        resolution = resolutions.get(ident, {})
        entry['owners'] = resolution.get('owners', entry['owners'])
        entry['composesChain'] = resolution.get('composesChain', [])
        owner_file = resolution.get('ownerFile', file)
        if owner_file != file:
            header = (shard.blob(pin, owner_file) or b'').decode()
            if 'from ' + file not in header:
                findings.append(dict(kind='ownerless', file=file, patch=ident, reason='canonical owner lacks generated-source binding'))
        if not entry['owners'] or any(owner_file not in owner_files.get(owner, set()) for owner in entry['owners']):
            findings.append(dict(kind='ownerless', file=file, patch=ident, reason='no matching owning record row'))
        if ('composedBy' in entry['original'] and 'composedBy' in resolution and
                entry['original']['composedBy'] != resolution['composedBy']):
            findings.append(dict(kind='conflict', file=file, patch=ident,
                reason='record and manifest composedBy disagree'))
            continue
        link = entry['original'].get('composedBy') or resolution.get('composedBy')
        if link:
            targets = link if isinstance(link, list) else [link]
            def known(target):
                if target in byid:
                    return byid[target]['file'] == file and (target in executed or any(link['id'] == target for link in links))
                if '#/rows/' in target and '/park-judgments/shard-' in target:
                    source, selector = target.split('#', 1)
                    row = pointer(load(ROOT / source), selector)
                    bound = row.get('source') or next((e for e in row.get('evidence', []) if e.get('role') == 'source-unit'), {})
                    return (row.get('disposition') == 'preserve-confirmed' and
                            bound.get('file', bound.get('path')) == file and row['rowId'] in entry['owners'])
                return any(t.get('chainEntryId') == target for t in state['trace'])
            bad = [target for target in targets if not known(target)]
            if bad:
                findings.append(dict(kind='conflict', file=file, patch=ident, reason='unknown composedBy', targets=bad))
            elif not resolution.get('evidence'):
                findings.append(dict(kind='conflict', file=file, patch=ident, reason='composedBy requires exact evidence'))
            else:
                for evidence in resolution['evidence']:
                    if evidence not in state['text']:
                        findings.append(dict(kind='conflict', file=file, patch=ident, reason='composedBy postimage absent', evidence=evidence))
            links.append(dict(id=ident, composedBy=targets, reason=resolution.get('reason')))
            predecessor = entry['original'].get('predecessor')
            if not predecessor:
                continue
            if (predecessor['patchSpecId'] not in targets or
                    predecessor['expectedAfterSha256'] != entry['beforeSha256'] or
                    sha(state['text']) != entry['beforeSha256']):
                findings.append(dict(kind='conflict', file=file, patch=ident, reason='residual lacks exact named composedBy predecessor'))
        if not entry['diff']:
            findings.append(dict(kind='conflict', file=file, patch=ident, reason='unlinked empty proposal'))
            continue
        if entry['source'].endswith(('/carries/pointer-patches.json', '/census-join/pointer-patches.json')):
            # Their hashes bind authoring bytes, while their delta replays on
            # the complete current state. Authenticate both domains.
            packet = load(ROOT / entry['source'])
            origin = shard.blob(packet['sourcePin'], file)
            try:
                if origin is None or sha(origin) != entry['beforeSha256']:
                    raise ValueError('pointer authoring preimage hash differs')
                authored = replayer.apply_diff(file, origin.decode(), entry['diff'])
                if sha(authored) != entry['expectedAfterSha256']:
                    raise ValueError('pointer authoring postimage hash differs')
            except (ValueError, AssertionError) as exc:
                findings.append(dict(kind='conflict', file=file, patch=ident, reason=str(exc)))
        entry['exactBase'] = entry['source'].endswith(('/g9/f-composition-additions.json', '/fchain/rebased-patches.json', '/fchain/link-retargets.json'))
        findings.extend(apply_one(entry, state, replayer, signatures)); executed.append(ident)
    for witness in body_witnesses:
        if witness['mode'] == 'composedBy-residual':
            for target in witness['composedBy']:
                owner = byid.get(target)
                if not owner or owner['file'] != witness['file'] or owner['expectedAfterSha256'] != witness['afterSha256']:
                    findings.append(dict(kind='conflict', file=witness['file'], patch=witness['id'], reason='whole-body composedBy has no exact owning postimage'))
    # Preserve rows are obligations over the complete result, not merely base F.
    frozen_proofs = {}
    for n in (1, 2, 3):
        document = load(PHASE / f'preserve-premise/park-judgments/shard-{n}.json')
        if document['pin'] not in frozen_proofs:
            frozen_proofs[document['pin']] = {r['rowId']: r for r in json.loads(shard.blob(document['pin'],
                str((PHASE / 'preserve-premise/proof.json').relative_to(ROOT))))['rows']}
        for row in document['rows']:
            if row['disposition'] != 'preserve-confirmed':
                continue
            source = row.get('source') or next(s for s in row['evidence'] if s.get('role') == 'source-unit')
            file = source.get('file', source.get('path'))
            if file not in states:
                continue
            raw = shard.blob(document['pin'], file)
            if raw is None:
                continue
            # Only bound operand lines, as in the owning shard proof.
            original = frozen_proofs[document['pin']][row['rowId']]
            ordinals = original['currentLines']
            if n == 2:
                lines = raw.decode().splitlines()
                bound = [i for i in range(source['startLine'], source['endLine'] + 1)
                         if any(o['path'] in lines[i - 1] for o in original['normalizedOperands'])]
                ordinals = bound or ordinals
            for ordinal in ordinals:
                line = shard.preservation_line(row, file, ordinal, pin)
                # L13-21.4 explicitly keeps lineage operands but removes their
                # clickability. Only this row's declared exact replacements may
                # alter markup; unrelated changes still fail preservation.
                expected_line = line
                for proposal in entries:
                    if proposal['file'] != file or '/park-judgments/' not in proposal['source']:
                        continue
                    for replacement in proposal['original']['replacements']:
                        if replacement['sourceLine'] == ordinal:
                            expected_line = expected_line.replace(replacement['before'].rstrip('\n'), replacement['after'].rstrip('\n'))
                if not shard.preserved_line_survives(expected_line, states[file]['text']):
                    findings.append(dict(kind='sameLinesTwice', file=file, patch='preserve:' + row['rowId'], reason='preserved occurrence changed'))
                    break
    findings.extend(link_reader.scan(pin, states, shard, ROOT, load(HERE / 'link-retargets.json')))
    files = [dict(file=file, afterSha256=sha(state['text']), steps=[
        {k: v for k, v in trace.items() if k not in {'before', 'after'}} for trace in state['trace']]) for file, state in sorted(states.items())]
    report = dict(contract='fchain-check.v1', sourceCommit=pin, exit=int(bool(findings)),
        counts=dict(sorted(Counter(f['kind'] for f in findings).items())), findings=findings,
        sources=inventory, baseChain=base_inventory, baseOwners=base_owners, bodyWitnesses=body_witnesses,
        executed=executed, links=links, files=files,
        limits='Prepared-byte mechanical proof only; no semantic approval, application, lease or gate closure.')
    return report, states


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pin', required=True)
    parser.add_argument('--out', type=Path, default=HERE / 'check.json')
    args = parser.parse_args()
    pin = subprocess.check_output(['git', '--no-optional-locks', 'rev-parse', '--verify', args.pin + '^{commit}'], cwd=ROOT, text=True).strip()
    try:
        report, _ = compose(pin)
    except (ValueError, KeyError, TypeError) as exc:
        report = dict(sourceCommit=pin, exit=1, counts={'conflict': 1}, findings=[dict(kind='conflict', reason=str(exc))], files=[], executed=[], links=[])
    if args.out.resolve().parent != HERE:
        parser.error('--out must be inside fchain/')
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(exit=report['exit'], counts=report['counts'], files=len(report['files']), executed=len(report['executed']), links=len(report['links']))))
    return report['exit']


if __name__ == '__main__':
    sys.exit(main())
