#!/usr/bin/env python3
"""Replay existing record proofs with scratch-only output plumbing; no addons.

Run from the repo root with python3 -B. Prints JSON, writes no repository file.
Authoring assertions replay at the receipt's authoring commit. Live target drift
must have an exact old/new recorded rebind; the shared rebind check owns current
ledger correctness. Frozen ownership recipes/extractors are unchanged. The misc
verifier's sole repository report sink is redirected before the write, since its path is not in
this assignment's writable list. The original checks.json is never rewritten.
Only the embedded ownership recipes run, never phase-08/audit-report.py.
checks.mjs reaches native Git and stages the addon: it is explicitly not run.
Exit 0 certifies the scoped record proofs; audit status remains partial, ok false.
"""
import sys
sys.dont_write_bytecode = True
import collections
import difflib
import hashlib
import json
import os
import runpy
from pathlib import Path
import subprocess
import tempfile

P = Path('plans/260925-documentation-authority-unification')
HERE = P / 'reports/phase-09/g0rework'
SHARD = P / 'ledger/decisions/g0-content-redecisions.json'
sys.path.insert(0, str(P / 'reports/phase-09/ledgerfix'))
from bindings import documents, rows, supersessions, effective, at, digest


def recorded_rebindings(authored):
    """Adapt the two existing record shapes, without inventing new bindings."""
    result = []
    folder = P / 'reports/phase-09/rebind'
    for name, key in [('g0-direct-rebindings.json', 'rebindings'),
                      ('g0-rework-rebindings.json', 'records')]:
        path = folder / name
        for i, row in enumerate(json.loads(path.read_text())[key]):
            if key == 'rebindings':
                before = dict(targetOwner=row['targetOwnerBefore'],
                              targetAnchor=row['before']['anchor'],
                              targetUnitDigest=row['before']['digest'])
                after = dict(targetOwner=row['targetOwnerAfter'],
                             targetAnchor=row['after']['anchor'],
                             targetUnitDigest=row['after']['digest'])
            else:
                if not row.get('beforeWitness') or not row.get('afterWitness'):
                    continue  # Rationale-only changes cannot authorize drift.
                owner = at(authored[row['file']], row['pointer'])['targetOwner']
                before, after = [dict(targetOwner=owner, targetAnchor=row[k]['anchor'],
                                     targetUnitDigest=row[k]['textDigest'])
                                 for k in ('beforeWitness', 'afterWitness')]
            result.append(dict(before=before, after=after, record=str(path) + '#/' + key + '/' + str(i)))
    return result


def account_target(row, catalog, records, matches):
    """Accept only a real live match or an exact recorded old -> live binding.

    The shared matcher authenticates identical-unit groups too. For actual
    drift, paths, anchors and FULL old/new digests must match a recorded edge;
    a path allowlist or digest prefix is never a drift waiver.
    """
    if matches(row, catalog.get(row['targetOwner'], {}).get('units', [])):
        return None
    before = {k: row.get(k) for k in ('targetOwner', 'targetAnchor', 'targetUnitDigest')}
    for record in records:
        after = record['after']
        units = catalog.get(after['targetOwner'], {}).get('units', [])
        if record['before'] == before and sum(
                u['anchor'] == after['targetAnchor'] and
                u['textDigest'] == after['targetUnitDigest'] for u in units) == 1:
            return record
    raise AssertionError(('unaccounted live target drift', before))


def main():
    root = Path.cwd()
    scratch = Path('/tmp/fgos-work')
    scratch.mkdir(parents=True, exist_ok=True)
    # The receipt was written with the last successful authoring replay. Its
    # commit stays stable when this verifier or receipt.md is updated later.
    authoring_pin = subprocess.check_output(['git', 'log', '-1', '--format=%H', '--',
                                            str(HERE / 'receipt.json')], text=True).strip()
    misc_rebind = runpy.run_path(str(P / 'reports/phase-09/misc-fix/rebind.py'))
    pinned_source = misc_rebind['source']
    authored = misc_rebind['preimages'](authoring_pin)
    rebind = runpy.run_path(str(P / 'reports/phase-09/rebind/rebind.py'))
    records = recorded_rebindings(authored)
    commands = []
    report = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
              'authoringPin': authoring_pin,
              'commands': commands, 'assertions': {}, 'noNativeAddonLoaded': True}
    with tempfile.TemporaryDirectory(prefix='g0rework-verify-', dir=scratch) as name:
        tmp = Path(name)
        guard = tmp / 'no-addons.cjs'
        guard.write_text("process.dlopen = () => { throw new Error('g0rework: native addon loading forbidden'); };\n")
        env = dict(os.environ)
        env['NODE_OPTIONS'] = (env.get('NODE_OPTIONS', '') + ' --no-addons --require=' + str(guard)).strip()
        env['PYTHONDONTWRITEBYTECODE'] = '1'

        def run(label, argv):
            proc = subprocess.run(argv, cwd=root, env=env, capture_output=True, text=True)
            item = dict(label=label, argv=argv, exit=proc.returncode,
                        stdout=proc.stdout, stderr=proc.stderr)
            commands.append(item)
            return proc

        # Invoke the real door: it must own and remove its extractor workspace.
        scratch_before = sorted(str(p.relative_to(scratch)) for p in scratch.rglob('*'))
        run('rebind/rebind.py --check', ['python3', '-B', str(P / 'reports/phase-09/rebind/rebind.py'), '--check'])
        assert scratch_before == sorted(str(p.relative_to(scratch)) for p in scratch.rglob('*'))
        report['assertions']['rebindLeavesNoScratch'] = True
        run('carries accounting deterministic replay', ['python3', '-B', str(HERE / 'refresh-carries.py'), '--check'])
        run('carries/verify-carries.mjs', ['node', str(P / 'reports/phase-09/carries/verify-carries.mjs')])

        checks = root / P / 'reports/phase-09/misc-fix/checks.json'
        checks_before = checks.read_bytes()
        wrapper = tmp / 'misc-verify.py'
        owner = root / P / 'reports/phase-09/misc-fix/verify.py'
        wrapper.write_text("import pathlib,runpy,sys\n"
            + "sys.path.insert(0," + repr(str(owner.parent)) + ")\n"
            + "original=pathlib.Path.write_text\n"
            + "def write(self,*a,**kw):\n"
            + " if self.resolve()==pathlib.Path(" + repr(str(checks)) + "):\n"
            + "  return original(pathlib.Path(" + repr(str(tmp / 'misc-checks.json')) + "),*a,**kw)\n"
            + " return original(self,*a,**kw)\n"
            + "pathlib.Path.write_text=write\n"
            + "runpy.run_path(" + repr(str(owner)) + ",run_name='__main__')\n")
        run('misc-fix/verify.py (only checks.json output sink redirected)', ['python3', '-B', str(wrapper)])
        assert checks.read_bytes() == checks_before, 'out-of-scope misc checks report changed'
        report['assertions']['miscChecksUnchangedSha256'] = hashlib.sha256(checks_before).hexdigest()
        if (tmp / 'misc-checks.json').exists():
            misc = json.loads((tmp / 'misc-checks.json').read_text())
            report['miscReplay'] = misc

        run('live rebind accounting negative controls', ['python3', '-B', str(HERE / 'test-accounting.py')])

        # Pin only input reads, never the frozen recipe, imports or output sink.
        # git show supplies immutable bytes without a checkout or Git write.
        pinned = tmp / 'authoring-inputs.cjs'
        pinned.write_text("const fs=require('node:fs'),path=require('node:path'),{execFileSync:exec}=require('node:child_process');\n"
            + "const root=process.cwd(),pin=" + json.dumps(authoring_pin) + ",prefix=" + json.dumps(str(P) + '/') + ";\n"
            + "const read=fs.readFileSync,list=fs.readdirSync;\n"
            + "fs.readFileSync=function(file,options){\n"
            + " const rel=typeof file==='string'?path.relative(root,path.resolve(file)):'';\n"
            + " if((rel.startsWith('docs/')&&rel.endsWith('.md'))||(rel.startsWith(prefix)&&rel.endsWith('.json'))){\n"
            + "  const data=exec('git',['show',pin+':'+rel],{maxBuffer:128*1024*1024});\n"
            + "  const encoding=typeof options==='string'?options:options?.encoding;return encoding?data.toString(encoding):data;\n"
            + " }return read.apply(this,arguments);};\n"
            + "fs.readdirSync=function(dir,options){\n"
            + " const rel=typeof dir==='string'?path.relative(root,path.resolve(dir)):'';\n"
            + " if([prefix+'ledger/decisions',prefix+'pilot/decisions'].includes(rel))return exec('git',['ls-tree','--name-only',pin+':'+rel],{encoding:'utf8'}).trim().split('\\n');\n"
            + " return list.apply(this,arguments);};\n")
        live_docs = documents()
        live_rows = [r for _, _, r in rebind['direct_rows'](live_docs)]
        live_rows.extend(r for _, r in rows(live_docs[str(SHARD)]))
        live_paths = {r['targetOwner'] for r in live_rows
                      if r.get('targetOwner') and r.get('targetUnitDigest')}
        live_catalog = rebind['extract'](dict(paths=sorted(live_paths)))['catalog']

        # Reuse the frozen ownership recipes verbatim, without invoking the
        # prohibited audit driver or even materializing native-dependent checks.
        report['ownershipAudits'] = []
        for stem, key in [('step10-round5', 'scripts'), ('step10-sync4d', 'readOnlyScripts')]:
            manifest = P / 'reports/phase-06' / (stem + '-reproduction.json')
            dest = tmp / stem
            dest.mkdir()
            scripts = json.loads(manifest.read_text())[key]
            for name, source in scripts.items():
                assert Path(name).name == name
                if name != 'checks.mjs':
                    (dest / name).write_text(source)
            outcomes = []
            for name in ['ownership.mjs', 'audit-ownership.mjs']:
                proc = run(stem + '/' + name + ' (authoring pin)',
                           ['node', '--require', str(pinned), str(dest / name), '--output-dir', str(dest)])
                outcomes.append(dict(script=name, exit=proc.returncode))
            own = json.loads((dest / (stem + '-target-ownership.json')).read_text())
            assert own['targetDigestDrift'] == [], ('authoring target drift', stem)
            # Live ownership census is not an authoring replay. Preserve every
            # raw diagnostic, including legacy false positives for unit groups.
            run(stem + '/ownership.mjs (live targets)',
                ['node', str(dest / 'ownership.mjs'), '--output-dir', str(dest)])
            live = json.loads((dest / (stem + '-target-ownership.json')).read_text())
            accounted = [dict(row=row, rebind=account_target(row, live_catalog, records, rebind['matches']))
                         for row in live['targetDigestDrift']]
            report.setdefault('liveOwnershipTargets', []).append(dict(manifest=str(manifest),
                rawDrift=live['targetDigestDrift'], accounted=accounted, unaccounted=[]))
            report['ownershipAudits'].append(dict(manifest=str(manifest), commands=outcomes,
                failingRows=own['targetDigestDrift'], ownership={k: own.get(k) for k in [
                    'noNewDoubleOwnership', 'nativePlatformTargetIdentityDuplicates', 'newActiveSourcePairCollisions']},
                checksOk=None, checksStatus='not-run',
                checksReason='checks.mjs calls trackedPlatformDocs -> native Git addon; staging/loading forbidden by assignment.'))
        report['assertions']['ownershipPassed'] = all(c['exit'] == 0
            for m in report['ownershipAudits'] for c in m['commands'])
        report['fullAuditPassed'] = False

        run('legacy docs ratchet', ['node', 'scripts/check-legacy-docs-ratchet.mjs'])
        run('whitespace', ['git', 'diff', '--check'])

        # The following one-shot authoring assertions belong to their pin,
        # not to later rows legitimately rebound or re-decided in place.
        docs = authored
        links = supersessions(docs)
        overlay = docs[str(SHARD)]['bindingRefresh']
        assert len(overlay) == 127
        dictionary = next(r for r in overlay if r['claimId'].startswith('claim_5ba6768e'))
        assert [c['changeSources'] for c in dictionary['changedClauses']] == [
            ['docs/platform/identity/spec.md#4a-minting-ids-for-every-owner-settled-2026-10-22',
             '63b777873c44e8977d16857e80246b043240ed0b', '11733af3782423e8b2ce70f11417dba67353ee05'],
            ['docs/platform/seat-binding/spec.md#52-rigor-tách-khỏi-tier', 'e0e52312a', 'bd8d64fdd']]
        add = next(r for r in overlay if r['claimId'].startswith('claim_320ba622'))
        assert '(9 file)' in add['rationale'] and 'trong nhiều file (ví dụ …)' in add['rationale']
        report['assertions'].update(clauseSpecificSourceLists=2, addVerbFileCountRationale=True)
        review = json.loads(pinned_source(authoring_pin, P / 'reports/phase-09/reviews/w14-g0-content-rereview.json'))['rows']
        touched = list(rows(docs[str(SHARD)]))
        assert len(touched) == 127
        for pointer, row in touched:
            assert row['bindingSha256'] == digest(row), pointer
            assert row['reviewStatus'] == 'pending'
            old = row['supersedesBinding']
            predecessor = at(docs[old['shard']], old['pointer'])
            if 'sourceUnitDigest' in predecessor:
                assert predecessor['sourceUnitDigest'] == row['sourceUnitDigest']
            assert effective(old['shard'], old['pointer'], predecessor, docs, links)[:2] == (str(SHARD), pointer)
        for i, rr in enumerate(review):
            original = at(docs[rr['file']], rr['pointer'])
            ef, ep, current = effective(rr['file'], rr['pointer'], original, docs, links)
            assert (ef, ep) == (str(SHARD), '/bindingRefresh/' + str(i))
            assert current['claimId'] == rr['claimId']
            assert current['bindingSha256'] == rr['bindingSha256']
            assert current['sourceUnitDigest'] == original['sourceUnitDigest']
            if rr['verdict'] == 'REWORK':
                assert current['disposition'] == 'supersede'
                assert current['changedClauses']
        for i, (file, pointer) in enumerate([
            ('s12-late-areas.json', '/unitCarries/364'),
            ('s14-resync-b.json', '/bindingRefresh/574'),
            ('s14-resync-b.json', '/bindingRefresh/577')]):
            file = str(P / 'ledger/decisions' / file)
            assert effective(file, pointer, at(docs[file], pointer), docs, links)[:2] == (
                str(SHARD), '/bindingRefresh/' + str(124 + i))
        report['assertions'].update(touchedBindingHashes=127, refreshedRationales=124,
                                     supersedeRedecisions=3, retiredStaleOverlayPointers=3)

        # Reuse both frozen extractors; compare ALL touched row targets, not only
        # the direct claims visited by the historical ownership auditor.
        extract = rebind['extract']
        authoring_targets = {r['targetOwner'] for _, r in touched}
        paths = set(authoring_targets)
        parity = json.loads((P / 'reports/phase-09/carries/source-parity.json').read_text())
        # Stable authenticated pre-append pin, unaffected by later parity edits.
        parity_path = str(P / 'reports/phase-09/carries/source-parity.json')
        parity_base = json.loads((HERE / 'receipt.json').read_text())['sourceHead']
        parity_old = json.loads(subprocess.check_output(['git', 'show', parity_base + ':' + parity_path], text=True))
        assert len(parity_old) == 324
        refreshed = {301, 305, *range(312, 324)}
        target_only = set(json.loads((P / 'reports/phase-09/carries/current-binding-refresh.json').read_text())['targetOnlyParityRows'])
        assert not (target_only & refreshed)
        for i, before in enumerate(parity_old):
            if i not in refreshed | target_only:
                assert parity[i] == before, ('unexpected prior parity edit', i)
            else:
                current = parity[i]
                assert current['accounting']['previousParityRow'] == before
                assert current['accounting']['oldLegacyAnchor'] == before['sourceAnchor']
                assert current['accounting']['oldLegacyDigest'] == before['sourceUnitDigest']
                assert current['sourcePath'] == before['sourcePath']
                if i in refreshed:
                    assert current['sourcePath'] == 'docs/specs/distribution.md'
                else:
                    for k in ['sourceAnchor', 'sourceUnitDigest', 'comparisonRecipe']:
                        assert current[k] == before[k], (i, k)
                    assert current['status'] == ('accounted-current-source-adaptation' if i == 249 else before['status'])
        report['assertions']['parityBase'] = parity_base
        # The original 21 rewrite-accounted additions retain their exact
        # historical proof; the later terminal paragraph is a distinct append.
        assert len(parity) == 346
        appended = parity[len(parity_old):345]
        live_additions = parity[345:]
        assert len(live_additions) == 1
        assert (live_additions[0]['sourcePath'], live_additions[0]['sourceAnchor']) == (
            'docs/specs/distribution.md', 'unheaded-block-17')
        report['assertions']['laterSourceParityRowsAdded'] = len(live_additions)
        assert len(appended) == 21
        assert collections.Counter(r['sourcePath'] for r in appended) == {
            'docs/specs/confinement-authority.md': 19, 'docs/specs/work-state.md': 2}
        paths.update(r['sourcePath'] for r in appended)
        virtual = {}
        def version(commit, path):
            key = commit + ':' + path
            if key not in virtual:
                virtual[key] = subprocess.check_output(['git', 'show', key], text=True)
            return key
        for p in appended:
            version(p['accounting']['rewriteCommit'] + '^1', p['sourcePath'])
            version(p['accounting']['rewriteCommit'], p['sourcePath'])
        for row in overlay[:124]:
            if 'legacyWordingWitness' in row:
                w = row['legacyWordingWitness']
                version(w['commit'], w['path'])
        # Virtual keys need a Markdown suffix so the unchanged extractor uses
        # its Markdown, rather than file-block, profile.
        names = {key: str(i) + '.md' for i, key in enumerate(virtual)}
        # Legacy rewrite conservation still observes live source bytes. Only
        # the one-shot target/changed-line assertions use authoring candidates.
        data = extract(dict(paths=sorted(paths - authoring_targets),
            virtual=[dict(path=path, content=pinned_source(authoring_pin, path)) for path in sorted(authoring_targets)]
                    + [dict(path=names[k], content=v) for k, v in virtual.items()]))
        cat = data['catalog']
        for pointer, row in touched:
            unit = [u for u in cat[row['targetOwner']]['units'] if u['anchor'] == row['targetAnchor']]
            assert len(unit) == 1 and unit[0]['textDigest'] == row['targetUnitDigest'], pointer
            unit = unit[0]
            assert unit['ancestry'] + ([unit['title']] if unit['unitKind'] == 'heading' else []) == row['targetAncestry']
        live_evidence = []
        for pointer, row in touched:
            current = at(live_docs[str(SHARD)], pointer)
            assert current['bindingSha256'] == digest(current), pointer
            assert current['reviewStatus'] == 'pending', pointer
            assert current['sourceUnitDigest'] == row['sourceUnitDigest'], pointer
            edge = account_target(row, live_catalog, records, rebind['matches'])
            expected = edge['after'] if edge else row
            for key in ('targetOwner', 'targetAnchor', 'targetUnitDigest'):
                assert current[key] == expected[key], (pointer, key)
            units = rebind['matches'](current, live_catalog[current['targetOwner']]['units'])
            assert len(units) == 1, pointer
            unit = units[0]
            assert unit['ancestry'] + ([unit['title']] if unit['unitKind'] == 'heading' else []) == current['targetAncestry'], pointer
            live_evidence.append(dict(pointer=pointer, rebind=edge))
        report['liveOverlayTargets'] = live_evidence
        report['assertions']['liveTargetsAndAncestries'] = len(live_evidence)
        for p in appended:
            a = p['accounting']; oldkey = a['rewriteCommit'] + '^1:' + p['sourcePath']; newkey = a['rewriteCommit'] + ':' + p['sourcePath']
            old = [u for u in cat[names[oldkey]]['units'] if u['anchor'] == a['oldLegacyAnchor']]
            new = [u for u in cat[names[newkey]]['units'] if u['anchor'] == a.get('rewrittenSourceAnchor', a['currentSourceAnchor'])]
            assert len(old) == len(new) == 1
            assert old[0]['textDigest'] == a['oldLegacyDigest']
            assert new[0]['textDigest'] == a['newLegacyDigest'], (a['claimId'], new[0]['textDigest'], a['newLegacyDigest'])
            current = next(u for u in cat[p['sourcePath']]['units'] if u['anchor'] == a['currentSourceAnchor'])
            target = p['targets'][0]
            assert current['textDigest'] == a['newLegacyDigest'] == target['targetUnitDigest']
            assert p['sourceAnchor'] == a['currentSourceAnchor']
            assert p['sourceUnitDigest'] == a['newLegacyDigest']
            assert overlay[next(i for i, r in enumerate(overlay) if r['claimId'] == a['claimId'])]['sourceUnitDigest'] == a['historicalSourceUnitDigest']
        for row in overlay[:124]:
            if 'legacyWordingWitness' not in row:
                continue
            w = row['legacyWordingWitness']
            old = next(u for u in cat[names[w['commit'] + ':' + w['path']]]['units'] if u['textDigest'] == w['sourceUnitDigest'])
            new = next(u for u in cat[row['targetOwner']]['units'] if u['anchor'] == row['targetAnchor'])
            oldlines, newlines = old['text'].splitlines(), new['text'].splitlines()
            changes = [('\n'.join(oldlines[a:b]), '\n'.join(newlines[c:d])) for tag, a, b, c, d in difflib.SequenceMatcher(None, oldlines, newlines, autojunk=False).get_opcodes() if tag != 'equal']
            assert changes == [(c['oldWording'], c['newWording']) for c in row['changedClauses']]
        residual = next(r for r in overlay if r['claimId'].startswith('claim_d5ba1eda'))
        assert residual['residualRef']['targetUnitDigest'] == residual['targetUnitDigest']
        assert residual['targetUnitDigest'] in residual['remainder'] and 'fb0b0100' not in residual['remainder']
        ref = residual['residualRef']
        assert hashlib.sha256(Path(ref['path']).read_bytes()).hexdigest() == ref['fileSha256']
        report['assertions'].update(authoringTargetsAndAncestries=127, exactChangedLineDiffs=3,
            legacyRewriteDigests=21, parityPriorEntriesUnchanged=len(parity_old)-len(refreshed)-len(target_only),
            parityPriorSourceEntriesRefreshed=len(refreshed), parityPriorTargetOnlyRefreshed=len(target_only),
            residualFileHashUnchanged=True)
        report['nativeDependentChecksNotRun'] = [dict(manifest=m['manifest'],
            script='checks.mjs', reason=m['checksReason']) for m in report['ownershipAudits']]
        report['recordProofsPassed'] = (all(c['exit'] == 0 for c in commands)
            and report['assertions']['ownershipPassed'])
        report['status'] = 'partial' if report['recordProofsPassed'] else 'failed'
        report['ok'] = False  # The full audit did not run; exit 0 is scoped only.
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['recordProofsPassed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
