#!/usr/bin/env python3
"""Author only the explicit overlap links required by L13-24; no judgments."""
import sys
sys.dont_write_bytecode = True
import subprocess
import json
import difflib
import importlib.util
import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
P9 = HERE.parent
BASE = str(P9.relative_to(HERE.parents[4])) + '/'
P8 = BASE.replace('phase-09/', 'phase-08/')


def read(path):
    return json.loads(path.read_text())


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    sources = [dict(path=P8 + 'step-07-composed-patches.json', reader='step7',
        read='patches[]; root selection delegated to check_shard.replay_chain'),
        dict(path=BASE + 'composition/patch-specs.json', reader='composition',
        read='effectiveSpecIds + finalPinFSpecIds in order; other entries non-executable'),
        dict(path=BASE + 'carries/pointer-patches.json', reader='pointer', read='patches[].forwardDiff'),
        dict(path=BASE + 'census-join/pointer-patches.json', reader='pointer', read='patches[].forwardDiff')]
    for n in (1, 2, 3):
        sources.append(dict(path=BASE + f'preserve-premise/park-judgments/shard-{n}.json', reader='premise',
            read='rows[].patch.patch, once per file; rowIds must match attached rows (check_shard owner)'))
    sources.insert(2, dict(path=BASE + 'fchain/rebased-patches.json', reader='pointer',
        read='patches[].diff; exact current-chain residuals; original carry ownership linked, not duplicated'))
    sources += [dict(path=BASE + 'preserve-premise/prepared-patches.json', reader='prepared',
        read='patches[].patch; G6 confirmed repoint judgments, including f07526/f07527/f07528'),
        dict(path=BASE + 'g9/f-composition-additions.json', reader='additions', read='patches[].diff; composedBy tombstones have no payload; linked residuals name an exact predecessor'),
        dict(path=BASE + 'g9/recomposed.json', reader='recomposed', read='specs[]; co-composed full-body witnesses linked to their selected owners; no duplicate application'),
        dict(path=BASE + 'g9/park-supplemental-specs.json', reader='historical', read='patches[]; witness for g9/recomposed predecessorChain, not additive'),
        dict(path=BASE + 'composition/gap05-placement-proposal.json', reader='historical', read='patches[] superseded explicitly by currentPatchSpecIds'),
        dict(path=BASE + 'composition/generator-all-output-deltas.json', reader='generator-evidence', read='deltas[] are generator evidence, never hand-apply'),
        dict(path=BASE + 'composition/skill-regeneration.json', reader='generator-evidence', read='patches[] are generator evidence, never hand-apply'),
        dict(path=BASE + 'composition/w2-skill-regeneration.json', reader='generator-evidence', read='allOutputChanges[]; historical generator witnesses, current bodies in g9/recomposed.json'),
        dict(path=BASE + 'composition/w2-gap05-verification.json', reader='historical', read='proposalPatches[]; old proposal superseded by w8 gap05 placement and effective composition IDs'),
        dict(path=BASE + 'g9/park-review-evidence.json', reader='historical', read='deltas[].diff compares old/new source evidence for judgments, not prepared application patches'),
        dict(path=BASE + 'carries/source-parity.json', reader='historical', read='accounting.forwardDiff adapts extracted units for conservation proof, not repository file patches; owning verify-carries.mjs replays them')]
    manifest = dict(contract='fchain-manifest.v1', authority='L13-24',
        order='Source array is apply order: Step 7 -> selected composition -> exact replacement carry roots -> carries -> census -> premise shards -> confirmed G6 patch -> G9 additions; witness-only readers do not apply twice.',
        sources=sources, resolutions={})
    # Keep indices stable for the packet's existing JSON pointers. Linked entries
    # are tombstones: diff/hash/rollback payloads are removed, not left executable.
    additions_path = P9 / 'g9/f-composition-additions.json'
    additions = read(additions_path)
    originals = json.loads(subprocess.check_output(['git', '--no-optional-locks', 'show',
        '72d516ba54692c7eacb38fde4b3fef9f6d1edc0b:' + BASE + 'g9/f-composition-additions.json'], cwd=HERE.parents[4]))
    shards = {n: read(P9 / f'preserve-premise/park-judgments/shard-{n}.json') for n in (1, 2, 3)}
    byrow = {row['rowId']: (n, i, row) for n, doc in shards.items() for i, row in enumerate(doc['rows'])}
    shard_links = {1: ['f00527'], 2: ['f03917'], 3: ['f04343'], 4: ['f04357'],
                   6: ['f06830', 'f06831', 'f06837'], 7: ['f07976'], 8: ['f07985']}
    carry_links = {9: 19, 10: 21, 11: 20, 12: 22, 17: 16, 18: 14, 19: 3}
    for i, patch in enumerate(additions['patches']):
        ident = BASE + 'g9/f-composition-additions.json#/patches/' + str(i)
        owners = [entry['id'] for entry in read(P9 / 'g9/phase9-decisions.json')['entries']
            if any(ref.get('artifact') == 'f-composition-additions.json' and ref['pointer'] == '/patches/' + str(i)
                   for ref in entry['patchRefs'])]
        manifest['resolutions'][ident] = dict(owners=owners)
        if i not in shard_links and i not in carry_links:
            continue
        links = []; evidence = []
        if i in shard_links:
            manifest['resolutions'][ident]['owners'] = shard_links[i]
            for rid in shard_links[i]:
                n, index, row = byrow[rid]
                target = BASE + f'preserve-premise/park-judgments/shard-{n}.json#/rows/{index}'
                if row.get('patch'):
                    # All attached rows share one proposal; canonical first attachment.
                    canonical = next(j for j, r in enumerate(shards[n]['rows']) if r.get('patch') == row['patch'])
                    target = BASE + f'preserve-premise/park-judgments/shard-{n}.json#/rows/{canonical}/patch'
                    evidence += [r['after'] for r in row['patch']['replacements'] if rid in r['ownerRowIds']]
                else:
                    source = row.get('source') or next(e for e in row['evidence'] if e.get('role') == 'source-unit')
                    # Preserve proof belongs to the row, not an executable patch.
                    evidence += [source['text'].rstrip('\n')]
                links.append(target)
        else:
            links = [BASE + 'carries/pointer-patches.json#/patches/' + str(carry_links[i])]
            diff = originals['patches'][i]['diff']
            evidence = [s[1:] for s in diff.splitlines() if s.startswith('+') and not s.startswith('+++')]
        patch.clear(); patch.update(id=originals['patches'][i]['id'], path=originals['patches'][i]['path'],
            status='composed-by-owner', composedBy=links, reason='L13-24: one owner; duplicate G9 proposal removed; preserve judgments unchanged')
        manifest['resolutions'][ident].update(composedBy=links, evidence=evidence, reason=patch['reason'])
    # Carries are independently owned by the claim-carries rows, not by a
    # free-form rationale. Only composedBy is added to that immutable packet.
    carries_path = P9 / 'carries/pointer-patches.json'
    carries = read(carries_path)
    claims = read(P9 / 'carries/claim-carries.json')['claims']
    for i, patch in enumerate(carries['patches']):
        ident = BASE + f'carries/pointer-patches.json#/patches/{i}'
        canonical_followers = {4: '.agents/skills/_shared/executor-dispatch-fallback.md',
            7: '.agents/skills/fgos-clarifying/SKILL.md', 10: '.agents/skills/fgos-coding-knowledge/SKILL.md'}
        owner_file = canonical_followers.get(i, patch['path'])
        owners = [c['id'] for c in claims if c['sourceFile'] == owner_file]
        manifest['resolutions'][ident] = dict(owners=owners, ownerFile=owner_file)
    spec = importlib.util.spec_from_file_location('prepare_shard', P9 / 'preserve-premise/park-judgments/check_shard.py')
    shard = importlib.util.module_from_spec(spec); spec.loader.exec_module(shard)
    engine = shard.load_replayer()
    states, findings, _ = shard.replay_chain(engine.PIN, engine)
    assert not findings
    normalized = []
    def emit(index, before, after, evidence, reason):
        original = carries['patches'][index]
        file = original['path']
        diff = lambda a, b: ''.join(difflib.unified_diff(a.splitlines(True), b.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
        sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
        patch = dict(id='fchain:carry:' + str(index), path=file, beforeSha256=sha(before), expectedAfterSha256=sha(after),
            diff=diff(before, after), rollbackDiff=diff(after, before),
            rowIds=manifest['resolutions'][BASE + f'carries/pointer-patches.json#/patches/{index}']['owners'],
            original=BASE + f'carries/pointer-patches.json#/patches/{index}', rationale=reason)
        assert engine.apply_diff(file, before, patch['diff']) == after
        normalized.append(patch)
        target = BASE + f'fchain/rebased-patches.json#/patches/{len(normalized)-1}'
        original['composedBy'] = [target]
        manifest['resolutions'][patch['original']].update(composedBy=[target], evidence=evidence, reason=reason)
    for index in (0, 3, 18, 23):
        original = carries['patches'][index]; file = original['path']
        before = states[file]['text'] if file in states else shard.blob(engine.PIN, file).decode()
        after = before
        if index == 0:
            after = after.replace('docs/specs/platform-foundations.md', 'docs/platform/platform-foundations.md')
            evidence = [line[1:] for line in original['forwardDiff'].splitlines() if line.startswith('+') and not line.startswith('+++')]
            reason = 'Same four carry operands on the exact F result; unrelated runner-priority context already changed by the chain.'
        elif index == 3:
            for old, new in [('docs/specs/platform-foundations.md', 'docs/platform/platform-foundations.md'),
                             ('docs/specs/work-state.md', 'docs/platform/work-state/decisions/retired-decision-history.md')]:
                after = after.replace(old, new)
            evidence = ["  'docs/platform/platform-foundations.md',", "  'docs/platform/work-state/decisions/retired-decision-history.md',"]
            reason = 'Two already-retargeted runner lines stay with Step 7; remaining carry replacements replay on that state.'
        elif index == 18:
            old = 'docs/platform/herdr-web-dashboard/spec.md#business-rules'
            new = 'docs/platform/herdr-web-dashboard/contracts/gateway-readiness.md#reachable-on-network'
            assert after.count(old) == 1
            after = after.replace(old, new); evidence = [new]
            reason = 'Specific conserved R5 clause supersedes the chain generic rule link; yaml contract chain retarget retained.'
        else:
            old = 'repo/docs/specs/work-state.md:647-675'; new = 'repo/docs/platform/work-state/contracts/non-transitioning-records.md'
            assert after.count(old) == 1
            after = after.replace(old, new); evidence = [new]
            done = next(line for line in after.splitlines() if '[p-8d04c7f1]' in line)
            assert done.endswith('— done') and 'docs/specs/distribution.md' not in done
            reason = 'The advisory row is already retired/done (G9 entry 43), not resurrected; only the still-live STR70a precedent is retargeted.'
        emit(index, before, after, evidence, reason)
    # The supplemental workspace body and carry 22 own the same directive.
    # Retain the richer already-reviewed body once, under the carry's ownership.
    bodies_path = P9 / 'g9/recomposed.json'
    bodies = read(bodies_path)
    workspace = next(s for s in bodies['specs'] if s['path'] == carries['patches'][22]['path'])
    file = workspace['path']; before = shard.blob(engine.PIN, file).decode()
    after = engine.apply_diff(file, before, workspace['diff'])
    assert hashlib.sha256(after.encode()).hexdigest() == workspace['expectedAfterSha256']
    emit(22, before, after, ['docs/platform/packaging-distribution/contracts/activation-binding.md', 'Git Common Directory Discovery'],
        'The G9 supplemental workspace body and carry 22 are one clause; retain the fuller reviewed G9 wording as its single composed owner.')
    for body in bodies['specs']:
        file = body['path']
        if file in states:
            assert shard.sha(states[file]['text']) == body['expectedAfterSha256']
            body['composedBy'] = [t['chainEntryId'] for t in states[file]['trace']]
        elif file == workspace['path']:
            body['composedBy'] = [BASE + 'fchain/rebased-patches.json#/patches/4']
    save(bodies_path, bodies)
    # G9 bin repeats carry 13 exactly. Keep the carry as the executable owner.
    patch = additions['patches'][0]
    target = BASE + 'carries/pointer-patches.json#/patches/13'
    diff = originals['patches'][0]['diff']
    patch.clear(); patch.update(id=originals['patches'][0]['id'], path='bin/fgos.mjs', status='composed-by-owner', composedBy=[target])
    manifest['resolutions'][BASE + 'g9/f-composition-additions.json#/patches/0'].update(
        composedBy=[target], evidence=[line[1:] for line in diff.splitlines() if line.startswith('+') and not line.startswith('+++')],
        reason='Same three clause retargets as carry 13; offsets do not create a second owner.')
    manifest['resolutions'][BASE + 'g9/f-composition-additions.json#/patches/12']['evidence'] = [
        'docs/platform/packaging-distribution/contracts/activation-binding.md', 'Git Common Directory Discovery']
    # /19 also contains genuinely new map/heading changes. Keep those only,
    # on the carry result; the removed carry changes remain linked explicitly.
    file = carries['patches'][3]['path']
    before = next(p for p in normalized if p['id'] == 'fchain:carry:3')
    carry_after = engine.apply_diff(file, states[file]['text'], before['diff'])
    full_after = engine.apply_diff(file, states[file]['text'], originals['patches'][19]['diff'])
    patch = additions['patches'][19]
    patch.clear(); patch.update(originals['patches'][19])
    patch['diff'] = ''.join(difflib.unified_diff(carry_after.splitlines(True), full_after.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
    patch['rollbackDiff'] = ''.join(difflib.unified_diff(full_after.splitlines(True), carry_after.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
    patch['beforeSha256'] = hashlib.sha256(carry_after.encode()).hexdigest()
    patch['expectedAfterSha256'] = hashlib.sha256(full_after.encode()).hexdigest()
    patch['composedBy'] = [BASE + 'carries/pointer-patches.json#/patches/3']
    patch['predecessor'] = dict(patchSpecId=patch['composedBy'][0], expectedAfterSha256=patch['beforeSha256'])
    manifest['resolutions'][BASE + 'g9/f-composition-additions.json#/patches/19'] = dict(
        owners=manifest['resolutions'][BASE + 'g9/f-composition-additions.json#/patches/19']['owners'],
        composedBy=patch['composedBy'], evidence=["  'docs/platform/platform-foundations.md',", "  'docs/platform/work-state/decisions/retired-decision-history.md',"],
        reason='Carry retargets removed and linked; this named-predecessor residual owns only map placement and its heading-depth adaptation.')
    # The config file also has a distinct Identity-holder correction in a
    # premise patch. Rebase /5's independent gateway delta on that exact state.
    file = 'docs/platform/config/spec.md'
    before = states[file]['text'] if file in states else shard.blob(engine.PIN, file).decode()
    basis = []
    for number, document in shards.items():
        proposals = {r['patch']['file']: r['patch'] for r in document['rows'] if 'patch' in r}
        if file in proposals:
            proposal = proposals[file]
            before = engine.apply_diff(file, before, proposal['patch'])
            index = next(i for i, r in enumerate(document['rows']) if r.get('patch') == proposal)
            basis.append(BASE + f'preserve-premise/park-judgments/shard-{number}.json#/rows/{index}/patch')
    patch = additions['patches'][5]
    after = engine.apply_diff(file, before, originals['patches'][5]['diff'])
    patch['beforeSha256'] = hashlib.sha256(before.encode()).hexdigest()
    patch['expectedAfterSha256'] = hashlib.sha256(after.encode()).hexdigest()
    patch['diff'] = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
    patch['rollbackDiff'] = ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True), fromfile='a/' + file, tofile='b/' + file))
    patch['fchainBasis'] = basis
    # Existing chain output is input evidence, not a second final patch for
    # these two lines. The manifest names its full exact trace; the checker
    # emits one composed after-image and one owning residual.
    for ident, file in [(BASE + 'fchain/rebased-patches.json#/patches/2', 'apps/fgos-gateway/web/src/lib/network.ts'),
            (BASE + 'preserve-premise/park-judgments/shard-2.json#/rows/176/patch', 'docs/platform/event-store/spec.md')]:
        manifest['resolutions'].setdefault(ident, {}).update(
            composesChain=[t['chainEntryId'] for t in states[file]['trace']],
            reason='Co-compose the existing exact chain and the section-specific pointer on one final line; no second apply owner.')
    save(HERE / 'rebased-patches.json', dict(patches=normalized, recordsOnly=True, appliedToWorkspace=False))
    additions['manifestRef'] = BASE + 'fchain/manifest.json'
    additions['chainOrder'] = [s['path'] for s in sources if s['reader'] not in {'historical', 'generator-evidence', 'recomposed'}]
    additions['selectionRule'] = 'Replay only through fchain/manifest.json. Link-only entries have no executable payload; a linked residual names its exact predecessor and carries only its independent delta. No historical approval transfer or standalone G9 replay.'
    save(carries_path, carries)
    save(additions_path, additions)
    save(HERE / 'manifest.json', manifest)


if __name__ == '__main__':
    main()
