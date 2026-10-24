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
    cat = rebind['extract'](dict(paths=sorted(paths)))['catalog']
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
    outputs = {PARITY: parity,
        SHARD: dict(version=1, authority='Records-only current carry rebind; independent review pending, no gate accepted', bindingRefresh=overlays),
        R / 'carries/current-binding-refresh.json': dict(historicalParityCommit='c25e8cf6a', parityRowsRefreshed=35, targetOnlyParityRows=target_only, candidateBindingsRefreshed=25, changes=changes)}
    for path, value in outputs.items():
        text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            assert path.read_text() == text, str(path)
        else:
            path.write_text(text)
    print(json.dumps(dict(status='pass', mode='check' if args.check else 'author', parityRows=345, refreshedParityRows=35, targetOnlyParityRows=len(target_only), refreshedCandidateBindings=25)))


if __name__ == '__main__':
    main()
