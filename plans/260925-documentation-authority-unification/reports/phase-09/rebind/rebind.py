#!/usr/bin/env python3
"""Rebind from current bytes and historical content, never from a current ordinal.

--check writes no repository file. Author mode is transactional: ambiguous
passages, new native ownership pairs, or invalidated existing proofs stop ALL
row writes. A blocked run records proposals, not completed rebindings.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import collections
import copy
import difflib
import json
from pathlib import Path
import re
import runpy
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = Path('plans/260925-documentation-authority-unification')
SCRATCH = Path('/tmp/fgos-work')
sys.path.insert(0, str(ROOT / P / 'reports/phase-09/ledgerfix'))
from bindings import documents, supersessions, effective, at, payload, digest, sha


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True)


def extract(request):
    # Reuse the existing adapter and both embedded extractors byte-for-byte.
    # Only the adapter's scratch destination changes; no extractor is edited.
    source = (ROOT / P / 'reports/phase-09/g0fix/extract-units.mjs').read_text()
    SCRATCH.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='rebind-extract-', dir=SCRATCH) as name:
        scratch = Path(name)
        source = source.replace('/tmp/fgos-work/w3-ledger-fix-brief/extractors',
                                str(scratch / 'extractors'))
        script = scratch / 'extract.mjs'
        script.write_text(source)
        return json.loads(subprocess.check_output(['node', str(script)], cwd=ROOT,
                          input=json.dumps(request).encode()))


def direct_rows(docs):
    return [(file, '/' + key + '/' + str(i), row)
            for file, doc in docs.items() for key in ('claims', 'registryGaps')
            for i, row in enumerate(doc.get(key, []))]


def matches(row, units):
    group = row.get('successorGroup')
    if row.get('targetAnchor') is None and group:
        # A contextual identical-unit group authenticates ALL members, never
        # an arbitrary one. Its restored digest is their common complete text
        # digest, not a hash of the list or a newly chosen individual anchor.
        members = group.get('members', [])
        if not members or len(members) != group.get('memberCount'):
            return []
        found = []
        for member in members:
            selected = [u for u in units if
                        member.get('path') == row.get('targetOwner') and
                        u['anchor'] == member.get('anchor') and
                        u['textDigest'] == member.get('unitDigest') == row.get('targetUnitDigest') and
                        u['ancestry'] == member.get('ancestry')]
            if len(selected) != 1:
                return []
            found.extend(selected)
        if len({u['anchor'] for u in found}) != len(members):
            return []
        return found
    return [u for u in units if u['anchor'] == row.get('targetAnchor') and
            u['textDigest'].startswith(row.get('targetUnitDigest') or '!')]


def history(file, wanted):
    commits = git('log', '--first-parent', '--format=%H', '--', file).splitlines()
    versions = []
    # No fixed pin or history-depth limit. Stop after all exact preimages exist.
    for start in range(0, len(commits), 16):
        batch = []
        for commit in commits[start:start + 16]:
            proc = subprocess.run(['git', 'show', commit + ':' + file], cwd=ROOT,
                                  text=True, capture_output=True)
            if proc.returncode:
                continue  # An absent path is not an invented empty preimage.
            key = str(len(versions) + len(batch)) + Path(file).suffix
            batch.append(dict(commit=commit, key=key, content=proc.stdout))
        data = extract(dict(virtual=[dict(path=v['key'], content=v['content'])
                                     for v in batch]))['catalog']
        versions.extend(dict(commit=v['commit'], **data[v['key']]) for v in batch)
        if all(any(matches(r, v['units']) for v in versions) for r in wanted):
            return versions
    raise ValueError('Historical preimage not found: ' + file)


def witness(units, unit):
    i = units.index(unit)
    def neighbour(value):
        return {k: value.get(k) for k in ('anchor', 'unitKind', 'title', 'textDigest',
                'ancestry', 'startLine', 'endLine', 'sample')} if value else None
    return dict(selected=unit, previous=neighbour(units[i - 1]) if i else None,
                next=neighbour(units[i + 1]) if i + 1 < len(units) else None)


def locate(old_units, old, new_units, source_digest):
    """Full-content matches, then replacement brackets bounded by equal units.

    Heading rewrites use their unchanged following body / explicit ADR identity.
    Character similarity only ranks content INSIDE the authenticated bracket;
    an ambiguous ranking is a stop, never nearest-index placement.
    """
    oi = old_units.index(old)
    exact = [u for u in new_units if u['textDigest'] == old['textDigest']]
    if len(exact) == 1:
        return exact[0], 'unique complete digest; neighbouring units retained in witnesses'
    if exact:
        def score(unit):
            j = new_units.index(unit)
            return int(oi > 0 and j > 0 and old_units[oi-1]['textDigest'] == new_units[j-1]['textDigest']) + int(oi+1 < len(old_units) and j+1 < len(new_units) and old_units[oi+1]['textDigest'] == new_units[j+1]['textDigest'])
        best = max(map(score, exact))
        selected = [u for u in exact if score(u) == best] if best else []
        if len(selected) == 1:
            return selected[0], 'repeated complete digest disambiguated by immediate neighbours'
    sequence = difflib.SequenceMatcher(None, [u['textDigest'] for u in old_units],
                                       [u['textDigest'] for u in new_units], autojunk=False)
    tag, a, z, c, d = next(op for op in sequence.get_opcodes() if op[1] <= oi < op[2])
    span = new_units[c:d]
    candidates = []
    method = 'replacement bounded by unchanged complete units'
    if old['unitKind'] == 'heading':
        headings = [u for u in span if u['unitKind'] == 'heading']
        candidates = [u for u in headings if u['title'] == old['title']]
        # Resync restored a previously collapsed duplicate ADR heading. Native
        # source digest identifies its own H1, not the other occurrence's H3.
        native = [u for u in headings if u['textDigest'] == source_digest]
        if len(native) == 1:
            return native[0], method + '; exact native-source heading digest'
        if len(candidates) != 1 and oi+1 < len(old_units) and old_units[oi+1]['unitKind'] != 'heading':
            candidates = [new_units[i-1] for i, u in enumerate(new_units)
                          if i and u['textDigest'] == old_units[oi+1]['textDigest'] and new_units[i-1] in headings]
        if len(candidates) != 1:
            adr = re.search(r'\bADR (\d{4})\b', old['title'])
            candidates = [u for u in headings if adr and u['title'].startswith(adr[1]) and u['level'] > 1]
        if len(candidates) != 1 and len(headings) == 1:
            candidates = headings
    elif len(span) == 1 and span[0]['unitKind'] == old['unitKind']:
        candidates = span
    if len(candidates) != 1 and old['unitKind'] != 'heading':
        scores = sorted([(difflib.SequenceMatcher(None, old['text'], u['text'], autojunk=False).ratio(), i, u)
                         for i, u in enumerate(span) if u['unitKind'] == old['unitKind']], reverse=True)
        if scores and scores[0][0] > .45 and (len(scores) == 1 or scores[0][0] - scores[1][0] > .15):
            candidates = [scores[0][2]]
            method += '; unique full-content correspondence inside bracket'
    if len(candidates) != 1:
        raise ValueError('Ambiguous or removed passage: ' + old['anchor'])
    return candidates[0], method


def binding(owner, unit):
    return dict(targetOwner=owner, targetAnchor=unit['anchor'],
                targetUnitDigest=unit['textDigest'],
                targetAncestry=unit['ancestry'] + ([unit['title']] if unit['unitKind'] == 'heading' else []))


def native_pairs(rows, active):
    groups = collections.defaultdict(set)
    for _, _, r in rows:
        if r.get('targetAnchor') and r['claimId'] in active:
            groups[(r['targetOwner'], r['targetAnchor'])].add(r['claimId'])
    return {(owner, tuple(sorted((a, b)))) for owner, ids in groups.items()
            for a in ids for b in ids if a < b}


def main():
    import os
    os.chdir(ROOT)
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    docs = documents()
    rows = direct_rows(docs)
    paths = sorted({r['targetOwner'] for _, _, r in rows if r.get('targetUnitDigest')})
    data = extract(dict(paths=paths))
    cat = data['catalog']
    drift = [(f, p, r) for f, p, r in rows if r.get('targetUnitDigest') and
             not matches(r, cat[r['targetOwner']]['units'])]
    links = supersessions(docs)
    if args.check:
        unresolved = []
        superseded = []
        for file, pointer, row in drift:
            ef, ep, current = effective(file, pointer, row, docs, links)
            units = cat.get(current['targetOwner'], {}).get('units', [])
            if (ef, ep) != (file, pointer) and matches(current, units):
                superseded.append(dict(file=file, pointer=pointer, claimId=row['claimId'],
                                       originBinding=payload(row),
                                       effectiveFile=ef, effectivePointer=ep,
                                       binding=payload(current)))
            else:
                unresolved.append((file, pointer, row))
        groups = [dict(file=f, pointer=p, claimId=r['claimId'], binding=payload(r))
                  for f, p, r in rows if r.get('targetAnchor') is None and
                  r.get('successorGroup') and
                  matches(r, cat.get(r['targetOwner'], {}).get('units', []))]
        print(json.dumps(dict(drift=len(unresolved), rows=[dict(file=f, pointer=p,
              claimId=r['claimId'], before=payload(r), effectiveFile=effective(f,p,r,docs,links)[0])
              for f,p,r in unresolved], authenticatedSupersededOrigins=superseded,
              authenticatedIdenticalUnitGroups=groups),
              ensure_ascii=False, indent=2))
        return int(bool(unresolved))
    histories = {file: history(file, [r for _, _, r in drift if r['targetOwner'] == file])
                 for file in sorted({r['targetOwner'] for _, _, r in drift})}
    proposed = copy.deepcopy(docs)
    records = []
    blockers = []
    for file, pointer, row in drift:
        owner = row['targetOwner']
        versions = histories[owner]
        vi, version = next((i,v) for i,v in enumerate(versions) if matches(row,v['units']))
        old = matches(row, version['units'])[0]
        ef, ep, current = effective(file, pointer, row, docs, links)
        new_units = cat.get(current['targetOwner'], {}).get('units', [])
        candidates = matches(current, new_units) if (ef,ep) != (file,pointer) else []
        if len(candidates) == 1:
            new = candidates[0]
            after_owner = current['targetOwner']
            method = 'existing explicit supersession chain, authenticated against current dual extractors'
        else:
            new_units = cat[owner]['units']
            new, method = locate(version['units'], old, new_units, row.get('sourceUnitDigest'))
            after_owner = owner
        updated = binding(after_owner, new)
        kind = 'anchor-only' if old['textDigest'] == new['textDigest'] else 'content'
        target = at(proposed[file], pointer)
        target.update(updated, bindingSha256=digest(updated))
        if (old['unitKind'] == new['unitKind'] == 'heading' and
                row.get('disposition') == 'merge' and
                row.get('sourceUnitDigest') == new['textDigest']):
            target['disposition'] = 'move'
        target['rationale'] = (row.get('rationale', '') + '\nL12-137 binding correction: ' +
            owner + '#' + old['anchor'] + ' -> ' + after_owner + '#' + new['anchor'] +
            '; ' + method + '; ' + ('complete digest preserved.' if kind == 'anchor-only' else
            'content changed; prior approval does not carry.'))
        if kind == 'content':
            target['reviewStatus'] = 'pending'
            for key in list(target):
                if key.startswith('review') and key != 'reviewStatus':
                    del target[key]
            target['reviewNote'] = 'Independent re-review required for changed content; no approval carried.'
        records.append(dict(file=file, pointer=pointer, claimId=row['claimId'],
            before=dict(anchor=row['targetAnchor'], digest=row['targetUnitDigest'], ancestry=row.get('targetAncestry')),
            after=dict(anchor=updated['targetAnchor'], digest=updated['targetUnitDigest'], ancestry=updated['targetAncestry']),
            targetOwnerBefore=owner, targetOwnerAfter=after_owner, kind=kind,
            causeCommit=versions[vi-1]['commit'] if vi else None,
            causeDefinition='First first-parent document change after the latest exact bound-anchor/digest preimage; later changes are listed, not silently attributed to this one commit.',
            laterDocumentChanges=[v['commit'] for v in reversed(versions[:max(0,vi-1)])],
            beforeCommit=version['commit'], method=method,
            beforeRowSha256=sha(json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(',', ':'))+'\n'),
            priorReview={k:v for k,v in row.items() if k.startswith('review')},
            beforeFileSha256=version['fileSha256'], afterFileSha256=cat[after_owner]['fileSha256'],
            proposedDisposition=target.get('disposition'),
            beforeWitness=witness(version['units'], old), afterWitness=witness(new_units, new),
            bindingSha256=digest(updated), reviewStatusBefore=row.get('reviewStatus'),
            reviewStatusAfter=row.get('reviewStatus'), proposedReviewStatus=target.get('reviewStatus'),
            effectiveBinding=dict(file=ef,pointer=ep,binding=payload(current)), applied=False))
    # Replay the owning overlay generator against its own historical preimages,
    # not the direct rows being rebound. Its current overlay bytes must survive.
    misc = ROOT/P/'reports/phase-09/misc-fix/rebind.py'
    module = runpy.run_path(str(misc))
    module['generate'].__globals__['extract'] = lambda request: self_inclusive(extract(request))
    pin = json.loads((misc.parent/'binding-refresh.json').read_text())['sourceHead']
    try:
        module['check'](pin, proposed)
    except (AssertionError, ValueError) as error:
        blockers.append(dict(kind='required-proof-preimage-conflict', proof=str(misc.relative_to(ROOT)),
                             error=str(error), noRepositoryRowsChanged=True))
    reg = json.loads((ROOT/P/'reports/phase-06/working-identity-registry.json').read_text())
    active = {u['claimId'] for u in reg['units']}
    after_pairs = native_pairs(direct_rows(proposed), active)
    ownership_comparison = []
    for name in ('step10-sync287-target-ownership.json','step10-round5-target-ownership.json'):
        baseline = json.loads((ROOT/P/'reports/phase-06'/name).read_text())
        was = set()
        for group in baseline['collisions']:
            ids = sorted({m['claimId'] for m in group['members'] if m.get('nativeKind') == 'units'})
            was.update((tuple(group['target']), (a,b)) for i,a in enumerate(ids) for b in ids[i+1:])
        added = after_pairs - was
        ownership_comparison.append(dict(baseline=name, newActivePairs=sorted(added),
                                         removedActivePairs=sorted(was-after_pairs)))
        if added:
            blockers.append(dict(kind='new-native-ownership-pairs', baseline=name,
                                 pairs=sorted(added)))
    if not blockers:
        for file, value in proposed.items():
            if value != docs[file]:
                (ROOT/file).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
        for record in records:
            record['applied'] = True
            record['reviewStatusAfter'] = record['proposedReviewStatus']
    report = dict(inputHead=git('rev-parse','HEAD').strip(), status='blocked' if blockers else 'applied',
                  extractors=data['extractors'], counts=dict(driftingRows=len(drift),
                  proposedByKind=dict(collections.Counter(r['kind'] for r in records)),
                  applied=sum(r['applied'] for r in records)), blockers=blockers,
                  ownershipComparison=ownership_comparison, rebindings=records)
    (HERE/'rebindings.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    rereview = [r['claimId'] for r in records if r['kind'] == 'content']
    (HERE/'rereview-claim-ids.json').write_text(json.dumps(dict(
        status='applied-pending-review' if not blockers else 'proposed-not-applied',
        count=len(rereview), claimIds=rereview), ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ('status','counts','blockers')}, ensure_ascii=False, indent=2))
    return 2 if blockers else 0


def self_inclusive(data):
    for item in data['catalog'].values():
        for unit in item['units']:
            if unit['unitKind'] == 'heading':
                unit['ancestry'].append(unit['title'])
    return data


if __name__ == '__main__':
    raise SystemExit(main())
