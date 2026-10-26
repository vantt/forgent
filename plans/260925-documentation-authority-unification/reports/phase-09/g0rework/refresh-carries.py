#!/usr/bin/env python3
"""Regenerate current carries accounting; historical inputs stay authenticated.

Run with python3 -B [--check]. Uses the existing dual extractors, exact historical
locator, supersession traversal and binding recipe. No docs or Git writes.
"""
import argparse
import copy
import difflib
import hashlib
import json
from pathlib import Path
import re
import runpy
import subprocess
import sys

sys.dont_write_bytecode = True
P = Path('plans/260925-documentation-authority-unification')
R = P / 'reports/phase-09'
PARITY = R / 'carries/source-parity.json'
SHARD = P / 'ledger/decisions/carries-current-rebindings.json'
sys.path.insert(0, str(R / 'ledgerfix'))
from bindings import documents, rows, supersessions, effective, payload, digest
rebind = runpy.run_path(str(R / 'rebind/rebind.py'))
placement = runpy.run_path(str(R / 'misc-fix/rebind.py'))['placement']


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    raw = subprocess.check_output(['git', 'show', 'c25e8cf6a:' + str(PARITY)])
    assert hashlib.sha256(raw).hexdigest() == '6eead10e5b3f0bba8a607a5c2e16782160eebb4d671fa4e22f4ebef515b933fc'
    parity = json.loads(raw)
    originals = copy.deepcopy(parity)
    docs = documents()
    docs.pop(str(SHARD), None)  # author from predecessors, never our own output
    links = supersessions(docs)
    origin = str(P / 'ledger/decisions/s11-preflip-carries.json')
    current = [effective(origin, p, r, docs, links) for p, r in rows(docs[origin])]
    paths = {p for r in parity for p in [r['sourcePath'], *[t['path'] for t in r['targets']]]}
    paths.update(r['targetOwner'] for f, p, r in current)
    heading_path = R / 'carries/source-heading-parity.json'
    heading_pin = 'f534aeaea'
    headings = json.loads(subprocess.check_output(['git', 'show', heading_pin + ':' + str(heading_path)]))
    paths.update(h['sourcePath'] for h in headings)
    paths.update(t['path'] for h in headings for t in h['targets'])
    # Replay the original accounting on its last verified bytes, then extend
    # it to live bytes below. Old placement/parity witnesses are not rewritten
    # by running a historical recipe against a later main import.
    witness_pin = '5a3f7580a'
    cat = rebind['extract'](dict(virtual=[dict(path=p, content=subprocess.check_output(
        ['git', 'show', witness_pin + ':' + p], text=True)) for p in sorted(paths)]))['catalog']
    normalize = lambda t: re.sub(r'\s+', ' ', re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', re.sub(r'^#{1,6} ', '', t))).strip()
    def adapt(row, source, owner, target, reason):
        row['status'] = 'accounted-current-source-adaptation'
        binding = rebind['binding'](owner, target)
        binding['bindingSha256'] = digest(binding)
        forward = ''.join(difflib.unified_diff((source['text']+'\n').splitlines(True), (target['text']+'\n').splitlines(True), fromfile='a/source-unit', tofile='b/target-unit'))
        rollback = ''.join(difflib.unified_diff((target['text']+'\n').splitlines(True), (source['text']+'\n').splitlines(True), fromfile='a/target-unit', tofile='b/source-unit'))
        row['accounting'].update(binding=binding, forwardDiff=forward, rollbackDiff=rollback,
            forwardSha256=hashlib.sha256(forward.encode()).hexdigest(), rollbackSha256=hashlib.sha256(rollback.encode()).hexdigest(),
            reviewStatus='pending', rationale=reason + ' Exact reversible diffs account for every changed line, not semantic approval.')

    for i, row in enumerate(parity):
        if i >= 324:
            a = row['accounting']
            a.update(historicalSourceAnchor=row['sourceAnchor'], historicalSourceUnitDigest=row['sourceUnitDigest'])
            row.update(sourceAnchor=a['currentSourceAnchor'], sourceUnitDigest=a['newLegacyDigest'])
        elif i in {301, 305, *range(312, 324)}:
            before = copy.deepcopy(row)
            us = cat[row['sourcePath']]['units']
            matches = [u for u in us if u['textDigest'] == row['sourceUnitDigest']]
            if not matches:
                anchor = {301: 'unheaded-block-5', 305: 'unheaded-block-9',
                          312: 'unheaded-block-16', 318: 'unheaded-block-23'}[i]
                matches = [u for u in us if u['anchor'] == anchor]
            assert len(matches) == 1
            source = matches[0]
            row.update(sourceAnchor=source['anchor'], sourceUnitDigest=source['textDigest'])
            a = row['accounting'] = dict(oldLegacyAnchor=before['sourceAnchor'], oldLegacyDigest=before['sourceUnitDigest'],
                historicalSourcePin='3e2d05af89313dbfbf0d26cd0de34f6b660d194b', previousParityRow=before,
                currentSourceAnchor=source['anchor'], newLegacyDigest=source['textDigest'],
                rationale='Refresh the current source unit and target locators; the original row is historical evidence, not current parity. No review approval carried.')
            owners = list(dict.fromkeys(t['path'] for t in before['targets']))
            hits = [(p, t) for p in owners for t in cat[p]['units'] if normalize(source['text']) in normalize(t['text'])]
            if not hits and i == 312:
                p = 'docs/platform/packaging-distribution/spec.md'
                hits = [(p, next(t for t in cat[p]['units'] if t['anchor'] == anchor))
                        for anchor in ['unheaded-block-49', 'unheaded-block-50']]
                assert normalize('\n'.join(t['text'] for p, t in hits)) == normalize(source['text'])
                row['status'] = 'current-complete-unit-split-present'
                a['rationale'] = 'The current source unit contains both RUL107 and RUL108, retained in two adjacent candidate units. Complete concatenation is checked after the existing normalization; the historical single-RUL107 row is retained.'
            elif not hits:
                assert i in {301, 323}, i
                p = 'docs/platform/packaging-distribution/spec.md'
                anchor = {301: 'unheaded-block-90', 323: 'unheaded-block-109'}[i]
                target = next(t for t in cat[p]['units'] if t['anchor'] == anchor)
                hits = [(p, target)]
                reason = ('Terminal storage wording is adapted; the candidate table enumerates the current 141 checks/32 fixes rather than the stale legacy registry list. Owning registry proof: misc-fix/verify.py.' if i == 301 else
                          'The shell helper resolves .git/gitdir/commondir on disk, not through a Git child. This is the existing supersede re-decision claim_b5695d38, main 10416a6b0; not equal text.')
                adapt(row, source, p, target, reason)
            row['targets'] = [dict(path=p, anchor=t['anchor'], targetUnitDigest=t['textDigest']) for p, t in hits]

    # Later paragraph insertions also moved target ordinals in older rows whose
    # source stayed fresh. Preserve the full old row; only repair locators with
    # authenticated complete-source content, never a numerical offset.
    target_only = []
    for i, row in enumerate(parity[:324]):
        if row['status'] != 'current-complete-unit-present':
            continue
        source = next(u for u in cat[row['sourcePath']]['units'] if u['anchor'] == row['sourceAnchor'] and u['textDigest'] == row['sourceUnitDigest'])
        if any(any(t['anchor'] == u['anchor'] and normalize(source['text']) in normalize(u['text']) for u in cat[t['path']]['units']) for t in row['targets']):
            continue
        assert i not in {301, 305, *range(312, 324)}
        before = originals[i]
        row['accounting'] = dict(previousParityRow=before, oldLegacyAnchor=before['sourceAnchor'], oldLegacyDigest=before['sourceUnitDigest'],
            rationale='Source identity unchanged. Current complete source text authenticates this target-ordinal refresh; historical targets remain in previousParityRow.')
        owners = list(dict.fromkeys(t['path'] for t in row['targets']))
        hits = [(p, u) for p in owners for u in cat[p]['units'] if normalize(source['text']) in normalize(u['text'])]
        if not hits:
            assert i == 249
            p = owners[0]
            target = next(u for u in cat[p]['units'] if u['text'].startswith('`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline.'))
            hits = [(p, target)]
            adapt(row, source, p, target, 'The historical colon-only common-pipeline introduction is now a complete sentence, with the existing static-preflight and activation-contract qualification. No pipeline algorithm or implementation is changed here.')
        assert len(hits) == 1, i
        row['targets'] = [dict(path=p, anchor=u['anchor'], targetUnitDigest=u['textDigest']) for p, u in hits]
        target_only.append(i)

    # The full carries checker exposed 25 stale candidate-only bindings beyond
    # the parity loop. Reuse its current supersession door, not in-place edits
    # of historical placement witnesses or invented native claim identities.
    stale = [(f, p, r) for f, p, r in current if not rebind['matches'](r, cat[r['targetOwner']]['units'])]
    assert len(stale) == 25
    histories = {p: rebind['history'](p, [r for f, q, r in stale if r['targetOwner'] == p])
                 for p in sorted({r['targetOwner'] for f, q, r in stale})}
    selfcat = rebind['self_inclusive'](copy.deepcopy(dict(catalog=cat)))['catalog']
    overlays, changes = [], []
    for f, pointer, row in stale:
        owner = row['targetOwner']
        version = next(v for v in histories[owner] if rebind['matches'](row, v['units']))
        old = rebind['matches'](row, version['units'])[0]
        new, method = rebind['locate'](version['units'], old, cat[owner]['units'], row.get('sourceUnitDigest'))
        updated = rebind['binding'](owner, new)
        out = copy.deepcopy(row)
        out.update(updated, bindingSha256=digest(updated), reviewStatus='pending',
            supersedesBinding=dict(shard=f, pointer=pointer, **payload(row)),
            rebindReason='Current-byte carry repair through the existing supersession mechanism; complete preimage/current witnesses in carries/current-binding-refresh.json. No approval carried.')
        su = next(u for u in selfcat[owner]['units'] if u['anchor'] == new['anchor'])
        out['placement'] = placement(selfcat[owner]['units'], su)
        for k in list(out):
            if k.startswith('review') and k != 'reviewStatus':
                del out[k]
        overlays.append(out)
        changes.append(dict(shard=f, pointer=pointer, before=row, after=out, beforeCommit=version['commit'],
            method=method, beforeWitness=rebind['witness'](version['units'], old), afterWitness=rebind['witness'](cat[owner]['units'], new)))
    # Refresh the live heading census from immutable full-row preimages. Body
    # insertions move ordinals even when the heading digest itself is unchanged.
    for h in headings:
        before = copy.deepcopy(h)
        us = cat[h['sourcePath']]['units']
        source = next(u for u in us if u['unitKind'] == 'heading' and u['anchor'] == h['sourceAnchor'])
        members = []
        for u in us[us.index(source) + 1:]:
            if u['unitKind'] == 'heading':
                break
            members.append(u['anchor'])
        h.update(sourceUnitDigest=source['textDigest'], sourceLevel=source['level'],
                 sourceDirectPayloadDigest=source['sectionPayloadDigest'], directSourceBlocks=members)
        for t in h['targets']:
            candidates = [u for u in cat[t['path']]['units'] if u['unitKind'] == 'heading' and u['title'] == h['title']]
            exact = [u for u in candidates if u['anchor'] == t['anchor']]
            selected = exact or candidates
            assert len(selected) == 1, (h['sourcePath'], h['sourceAnchor'], t)
            target = selected[0]
            t.update(anchor=target['anchor'], targetUnitDigest=target['textDigest'],
                     level=target['level'], directPayloadDigest=target['sectionPayloadDigest'])
        # Distinct historical headings can resolve to the same live target.
        # Keep its first occurrence, but retain all preimages in accounting.
        unique = {}
        for t in h['targets']:
            key = (t['path'], t['anchor'])
            assert key not in unique or unique[key] == t, ('conflicting heading target', key)
            unique.setdefault(key, t)
        h['targets'] = list(unique.values())
        if h != before:
            h['accounting'] = dict(previousParityRow=before, historicalSourcePin=heading_pin,
                oldLegacyAnchor=before['sourceAnchor'], oldLegacyDigest=before['sourceUnitDigest'],
                rationale='Refresh live source/target heading digests and ordered direct-block locators from current bytes. The complete authoring row remains historical; no review approval carried.',
                reviewStatus='pending')

    # This later source addition has no rewrite claim: conserve the exact
    # complete current paragraph, not a fabricated historical re-decision.
    source_path = 'docs/specs/distribution.md'
    source = next(u for u in cat[source_path]['units'] if u['anchor'] == 'unheaded-block-17')
    assert source['textDigest'] == '45ccc7989661f3fd7109d1e585b79ebbdf1223d00279819149037540bdc2ab2a'
    owner = 'docs/platform/packaging-distribution/spec.md'
    hits = [u for u in cat[owner]['units'] if u['textDigest'] == source['textDigest']]
    assert len(hits) == 1
    parity.append(dict(sourcePath=source_path, sourceAnchor=source['anchor'], sourceUnitDigest=source['textDigest'],
        status='current-complete-unit-present',
        targets=[dict(path=owner, anchor=hits[0]['anchor'], targetUnitDigest=hits[0]['textDigest'])],
        comparisonRecipe='Exact current legacy/target whole-unit digest parity; complete paragraph retained.',
        accounting=dict(sourceAdditionCommit='f06b30fa3f9cad5f3f437acf6101f28605f634ce',
            rationale='Terminal setup loses a row and a fix: later source addition previously absent from the parity census. No source rewrite or approval claimed.', reviewStatus='pending')))
    outputs = {PARITY: parity, heading_path: headings,
        SHARD: dict(version=1, authority='Records-only current carry rebind; independent review pending, no gate accepted', bindingRefresh=overlays),
        R / 'carries/current-binding-refresh.json': dict(historicalParityCommit='c25e8cf6a', parityRowsRefreshed=35, targetOnlyParityRows=target_only, candidateBindingsRefreshed=25, changes=changes)}
    # F refresh: same extractors, correspondence and four-field binding door.
    # Keep complete previous rows in the existing history fields. Adaptations
    # are reversible text accounting, never equality or independent approval.
    live = rebind['extract'](dict(paths=sorted(paths)))['catalog']
    f_changes = []

    def live_unit(owner, anchor, unit_digest):
        old = next(u for u in cat[owner]['units']
                   if u['anchor'] == anchor and u['textDigest'] == unit_digest)
        exact = [u for u in live[owner]['units']
                 if u['anchor'] == anchor and u['textDigest'] == unit_digest]
        if len(exact) == 1:
            return exact[0]
        # The Event Store registry paragraph is rewritten in e8809d2af, not
        # removed. Authenticate its named subject and unchanged neighbours;
        # the generic similarity threshold rightly does not choose it.
        if (owner == 'docs/platform/packaging-distribution/contracts/setup-doctor-registry.md' and
                anchor == 'unheaded-block-6'):
            assert old['text'].startswith('`event-store` registers the `eventStore`')
            candidates = [u for u in live[owner]['units']
                          if u['text'].startswith("The `eventStore` section's standard values")
                          and u['ancestry'] == old['ancestry']]
            assert len(candidates) == 1, 'ambiguous Event Store registry successor'
            new = candidates[0]
            for neighbour in ('unheaded-block-4', 'unheaded-block-8'):
                assert next(u['textDigest'] for u in cat[owner]['units'] if u['anchor'] == neighbour) == next(
                    u['textDigest'] for u in live[owner]['units'] if u['anchor'] == neighbour)
            return new
        return rebind['locate'](cat[owner]['units'], old, live[owner]['units'], None)[0]

    for i, row in enumerate(parity):
        before = copy.deepcopy(row)
        source = live_unit(row['sourcePath'], row['sourceAnchor'], row['sourceUnitDigest'])
        row.update(sourceAnchor=source['anchor'], sourceUnitDigest=source['textDigest'])
        if row['status'] == 'accounted-selected-design-not-implementation':
            assert row == before, 'selected-design source needs a delta decision'
            continue  # Its binding is deliberately an immutable design witness.
        if row == before:
            if row['status'] == 'current-complete-unit-present' and any(
                    u['anchor'] == t['anchor'] and normalize(source['text']) in normalize(u['text'])
                    for t in row['targets'] for u in live[t['path']]['units']):
                continue
            if row['status'] != 'current-complete-unit-present' and all(any(
                    u['anchor'] == t['anchor'] and u['textDigest'] == t['targetUnitDigest']
                    for u in live[t['path']]['units']) for t in row['targets']):
                continue
        hits = [(p, u) for p in dict.fromkeys(t['path'] for t in row['targets'])
                for u in live[p]['units'] if normalize(source['text']) in normalize(u['text'])]
        if hits:
            row['status'] = 'current-complete-unit-present'
            targets = hits
        else:
            targets = []
            old_source = next(u for u in cat[row['sourcePath']]['units']
                              if u['anchor'] == before['sourceAnchor'] and
                              u['textDigest'] == before['sourceUnitDigest'])
            for t in row['targets']:
                old = next(u for u in cat[t['path']]['units'] if u['anchor'] == t['anchor'])
                # Old complete-unit rows promised inclusion, not target digest
                # equality; the owning checker has always read them that way.
                if row['status'] == 'current-complete-unit-present':
                    if normalize(old_source['text']) not in normalize(old['text']):
                        continue
                else:
                    assert old['textDigest'] == t['targetUnitDigest'], (i, t)
                targets.append((t['path'], live_unit(t['path'], old['anchor'], old['textDigest'])))
            if (len(targets) > 1 and
                    normalize('\n'.join(u['text'] for _, u in targets)) == normalize(source['text'])):
                row['status'] = 'current-complete-unit-split-present'
            else:
                assert len(targets) == 1, ('ambiguous source adaptation', i)
                row.setdefault('accounting', {})
                owner, target = targets[0]
                adapt(row, source, owner, target,
                      'F refresh: the current source and its named successor differ; the complete historical row is retained. No implementation or authority judgment is made.')
        row['targets'] = [dict(path=p, anchor=u['anchor'], targetUnitDigest=u['textDigest'])
                          for p, u in targets]
        if row != before:
            row.setdefault('accounting', {}).update(previousParityRow=before,
                historicalSourcePin=witness_pin, currentSourceAnchor=source['anchor'],
                newLegacyDigest=source['textDigest'], reviewStatus='pending')
            f_changes.append(dict(kind='source-parity', index=i, before=before, after=copy.deepcopy(row)))

    for i, h in enumerate(headings):
        before = copy.deepcopy(h)
        source = live_unit(h['sourcePath'], h['sourceAnchor'], h['sourceUnitDigest'])
        us = live[h['sourcePath']]['units']
        members = []
        for u in us[us.index(source) + 1:]:
            if u['unitKind'] == 'heading':
                break
            members.append(u['anchor'])
        h.update(sourceAnchor=source['anchor'], sourceUnitDigest=source['textDigest'],
                 sourceLevel=source['level'], sourceDirectPayloadDigest=source['sectionPayloadDigest'],
                 directSourceBlocks=members)
        for t in h['targets']:
            target = live_unit(t['path'], t['anchor'], t['targetUnitDigest'])
            t.update(anchor=target['anchor'], targetUnitDigest=target['textDigest'],
                     level=target['level'], directPayloadDigest=target['sectionPayloadDigest'])
        if h != before:
            h['accounting'] = dict(previousParityRow=before, historicalSourcePin=witness_pin,
                oldLegacyAnchor=before['sourceAnchor'], oldLegacyDigest=before['sourceUnitDigest'],
                rationale='F refresh of live heading and complete direct-block census; no approval carried.',
                reviewStatus='pending')
            f_changes.append(dict(kind='source-heading', index=i, before=before, after=copy.deepcopy(h)))

    live_selfcat = rebind['self_inclusive'](copy.deepcopy(dict(catalog=live)))['catalog']
    base_docs = dict(docs, **{str(SHARD): outputs[SHARD]})
    base_links = supersessions(base_docs)
    f_current = [effective(f, p, r, base_docs, base_links) for f, p, r in current]
    for f, pointer, row in f_current:
        if rebind['matches'](row, live[row['targetOwner']]['units']):
            continue
        new = live_unit(row['targetOwner'], row['targetAnchor'], row['targetUnitDigest'])
        updated = copy.deepcopy(row)
        updated.update(rebind['binding'](row['targetOwner'], new), reviewStatus='pending',
            supersedesBinding=dict(shard=f, pointer=pointer, **payload(row)),
            rebindReason='F current-byte carry refresh; complete predecessor retained in carries/f-binding-refresh.json. Independent review pending; no approval carried.')
        updated['bindingSha256'] = digest(updated)
        su = next(u for u in live_selfcat[row['targetOwner']]['units'] if u['anchor'] == new['anchor'])
        updated['placement'] = placement(live_selfcat[row['targetOwner']]['units'], su)
        for k in list(updated):
            if k.startswith('review') and k != 'reviewStatus':
                del updated[k]
        index = len(overlays)
        overlays.append(updated)
        f_changes.append(dict(kind='candidate-binding', shard=f, pointer=pointer,
            successorPointer='/bindingRefresh/' + str(index), before=row, after=updated))
    changed_paths = set()
    for c in f_changes:
        row = c['after']
        if c['kind'] == 'candidate-binding':
            changed_paths.add(row['targetOwner'])
        else:
            changed_paths.add(row['sourcePath'])
            changed_paths.update(t['path'] for t in row['targets'])
    outputs[R / 'carries/f-binding-refresh.json'] = dict(
        witnessPin=witness_pin, importCommit='eb161da46ee95c7082e6f7a80959c758da21c2f3',
        mainPathChanges={p: subprocess.check_output(['git', 'log', '--no-merges', '--format=%H %s',
            'eb161da46^1..eb161da46^2', '--', p], text=True).splitlines() for p in sorted(changed_paths)},
        status='authored-pending-independent-review', changes=f_changes)
    for path, value in outputs.items():
        text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            assert path.read_text() == text, str(path)
        elif not path.exists() or path.read_text() != text:
            path.write_text(text)
    print(json.dumps(dict(status='pass', mode='check' if args.check else 'author', parityRows=len(parity), liveHeadingRows=len(headings), historicalRefreshedParityRows=35, historicalTargetOnlyParityRows=len(target_only), historicalRefreshedCandidateBindings=25, fRefreshChanges=len(f_changes), fRefreshedCandidateBindings=sum(c['kind'] == 'candidate-binding' for c in f_changes))))


if __name__ == '__main__':
    main()
