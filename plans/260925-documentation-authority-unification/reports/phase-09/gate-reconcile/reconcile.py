#!/usr/bin/env python3
"""Rebuild this records-only reconciliation from its immutable turn-start snapshot.

No product checker, native addon, fgOS CLI, git mutation or concurrent working-tree
input is used. Original and follow-up committed input layers are fingerprinted
separately. Outputs stay inside the register and gate-reconcile grant.
"""
import collections
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[5]
BASE = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09')
OUT = ROOT / BASE / 'gate-reconcile'
PIN = '53de2207e1ea8a9417ac131f785704d6ab72ba2c'
FOLLOWUP = 'a808bc676c74b1dfafa4dffda4f6d7a31b6d86d6'
READ = {}
REVIEW_PIN = '98d9201f1905e433a40b94d8d8b0fb9fefda1452'
REVIEW_INPUTS = {}
CATCHUP_PIN = 'cf13e2bd22ce390344837560b35b41adf7da1238'
CATCHUP_INPUTS = {}
CORRECTION_PIN = '608a4ada5f195b0d0b9d3568a71b8dde4954aacb'
CORRECTION_INPUTS = {}
GENERATED_INPUTS = {}
CORRECTION_PATHS = {str(BASE / rel) for rel in [
    'owner-answers.md', 'w23-register-corrections-brief.md',
    'reviews/w22-register-met-local-review.md', 'reviews/w22-register-met-local-review.json',
    'preserve-premise/proof.json', 'g9/phase9-decisions.json',
    *[f'preserve-premise/park-judgments/shard-{i}.json' for i in range(1, 4)],
    'composition/w9-unresolved-bindings.json', 'composition/w8-citation-glosses.json',
    'review-batches.json',
]}
GENERATED_PATHS = {str(BASE / rel) for rel in [
    'g0join/join.py', 'g0join/join-608a4ada5.json', 'g0join/receipt.md',
    'census-join/locator-proof.json', 'census-join/pointer-patches.json', 'archive/design.md',
]}
CATCHUP_PATHS = {str(BASE / rel) for rel in [
    'owner-answers.md', 'w21-register-catchup-brief.md', 'g5/check.py',
    'g5/check-b57e79625.json',
    *['reviews/' + name + '.' + suffix
      for name in ['w20-census-settlement-review', 'w21-census-rework-and-g5-review']
      for suffix in ['md', 'json']],
]}
REVIEW_PATHS = {str(BASE / ('reviews/w19-live-parity-and-rebinds-review.' + suffix)) for suffix in ['md', 'json']}
REVIEW_PATHS.add(str(BASE / 'w19-cleanup-brief.md'))
FOLLOWUP_READ = []
for rel in ['owner-answers.md', 'w18-g2-judgments-brief.md',
            'reviews/w18-gate-reconcile-review.md', 'reviews/w18-gate-reconcile-review.json']:
    path = str(BASE / rel)
    raw = subprocess.check_output(['git', 'show', f'{FOLLOWUP}:{path}'], cwd=ROOT)
    FOLLOWUP_READ.append({'path': path, 'sha256': hashlib.sha256(raw).hexdigest()})


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def source(path):
    path = str(path)
    if path in GENERATED_PATHS:
        data = (ROOT / path).read_bytes()
        GENERATED_INPUTS[path] = {'path': path, 'sha256': hashlib.sha256(data).hexdigest()}
        return data.decode()
    layer = CORRECTION_INPUTS if path in CORRECTION_PATHS else CATCHUP_INPUTS if path in CATCHUP_PATHS else REVIEW_INPUTS if path in REVIEW_PATHS else READ
    pin = CORRECTION_PIN if path in CORRECTION_PATHS else CATCHUP_PIN if path in CATCHUP_PATHS else REVIEW_PIN if path in REVIEW_PATHS else PIN
    data = git('show', f'{pin}:{path}')
    # owner-answers belongs to both immutable follow-up layers. Preserve each.
    if path in CORRECTION_PATHS and path in CATCHUP_PATHS:
        old = git('show', f'{CATCHUP_PIN}:{path}')
        CATCHUP_INPUTS[path] = {'path': path, 'sha256': hashlib.sha256(old).hexdigest()}
    layer[path] = {'path': path, 'sha256': hashlib.sha256(data).hexdigest()}
    # These two inputs existed in the original inventory too. Preserve those
    # historical fingerprints rather than replacing them with the catch-up layer.
    if path in {str(BASE / 'owner-answers.md'), str(BASE / 'g5/check.py')}:
        original_data = git('show', f'{PIN}:{path}')
        READ[path] = {'path': path, 'sha256': hashlib.sha256(original_data).hexdigest()}
    return data.decode()


def load(rel):
    return json.loads(source(BASE / rel))


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


original = load('preflip-gate-status.json')
# Retain every historical snapshot fingerprint even when that path now also
# has a correction-layer or generated-evidence version.
for entry in json.loads(git('show', f'{CORRECTION_PIN}:{BASE}/gate-reconcile/sources.json'))['inputs']:
    READ.setdefault(entry['path'], entry)
register = json.loads(json.dumps(original))
reviews = {}
review_inventory = []
for path in git('ls-tree', '-r', '--name-only', PIN, str(BASE / 'reviews')).decode().splitlines():
    text = source(path)
    record = {'path': path, 'sha256': READ[path]['sha256']}
    if path.endswith('.json'):
        data = json.loads(text)
        reviews[path.removeprefix(str(BASE) + '/')] = data
        if isinstance(data, dict):
            rows = data.get('verdicts', data.get('rows', data.get('findings', [])))
            record['verdict'] = data.get('verdict')
            record['verdictCounts'] = dict(collections.Counter(r.get('verdict', 'unspecified') for r in rows))
            record['nonApproveIds'] = [r.get('id', r.get('claimId')) for r in rows
                                       if r.get('verdict') != 'APPROVE']
        else:
            record['dataRows'] = len(data)
    elif path.endswith('.md'):
        lines = text.splitlines()
        record['verdictExcerpts'] = [l for l in lines if re.search(
            r'verdict|result:|APPROVE|REWORK|Status:', l, re.I)][:8]
    else:
        record['kind'] = 'historical reviewer probe, read but not executed'
    review_inventory.append(record)

for rel in ['owner-answers.md', 'preflip-execution-plan.md',
            'w17-parity-live-brief.md', 'w17-gate-register-reconcile-brief.md',
            'g9/receipt.md', 'census-join/receipt.md', 'archive/receipt.md',
            'archive/design.md', 'archive/receipt.json', 'g5/check.py',
            'g5/check-b726d44ed.json']:
    source(BASE / rel)
for directory in ['g0rework', 'import3', 'misc-fix', 'preserve-premise', 'composition', 'carries']:
    source(BASE / directory / 'receipt.md')
    load(directory + '/receipt.json')

# Keep W20/W21 and the Lead rulings separate from the original and W19 layers.
for path in sorted(CATCHUP_PATHS):
    text = source(path)
    if path.endswith('.json') and '/reviews/' in path:
        reviews[path.removeprefix(str(BASE) + '/')] = json.loads(text)

# Reuse the register's phase-09-relative path convention, now made explicit.
register['asOf'] = {
    'commit': PIN, 'date': '2026-10-25', 'finalPinF': None,
    'followUpCommit': FOLLOWUP, 'followUpRuling': 'L13-17 (W18 corrections)',
    'basis': 'Immutable original snapshot (git show ' + PIN + ':path), including every original reviews/ file and owning receipt; W18/L13-17, W19 and W20/W21/L13-18–19 are separate committed follow-up layers. Concurrent carries/** and g0rework/** edits are excluded. Scope-specific APPROVE/FIXED/pass does not turn an overall REWORK into approval of a whole gate. met-local means no unowned local work remains before F; owner/external/F duties remain explicit, not accepted or completed.',
    'evidencePathBase': str(BASE),
    'reconciliation': 'gate-reconcile/receipt.json',
}
for gate in register['gates']:
    gate['cleared'] = []
    gate['blockers'] = []  # local work required before F only
    gate['remaining'] = ''
    gate['atFinalPinUnderLease'] = []
    gate['external'] = []


def g(number):
    return register['gates'][number]


def evidence(number, *paths):
    g(number)['evidence'] = list(dict.fromkeys([*g(number)['evidence'], *paths]))


def quote(review, row_id):
    data = reviews['reviews/' + review + '.json']
    rows = data.get('verdicts', data.get('findings', data.get('rows', data.get('items', []))))
    row = next(r for r in rows if r.get('id', r.get('claimId')) == row_id)
    return row['verdict'] + ': ' + row.get('reason', row.get('summary', ''))


def clear(number, item, commits, review, row_id, extra_reviews=()):
    record = {'item': item, 'clearedBy': commits,
              'reviews': ['reviews/' + review + '.json', *extra_reviews],
              'verdict': quote(review, row_id)}
    g(number)['cleared'].append(record)
    evidence(number, *record['reviews'])
    return record


# G0: retire the obsolete demand to repeat W14; do not inherit its digest approvals.
c0 = clear(0, 'The 124 content rows and three overlapping Lead-corrected rows lacked a content re-review. W14 reviewed 124 distinct rows (not 127): 121 APPROVE / 3 REWORK; the pin-scoped re-decisions pass W16 and parity fixes pass W17. claim_2e2bc926 must still be re-decided at F.',
           ['6f5b9419d', 'c25e8cf6a', 'a8ea05c50'], 'w16-g0-rework-and-park-rule-review', 'A-pass',
           ['reviews/w14-g0-content-rereview.json', 'reviews/w17-parity-rework-review.json'])
g(0).update(status='partial', commit='a8ea05c50',
    note='W14 exhaustively reviewed 124 distinct content rows, including all three 6f5b9419d rows: 121 APPROVE / 3 REWORK. c25e8cf6a records three supersede decisions; W16 A-pass verifies the pin-scoped decisions, with F2 deferred by L13-15.2. W17 fixes F1/F3/F4/F6/F8; its aggregate PASS on 25 new pending candidate rebinds is not per-row semantic approval (8 change target digest). The frozen changedBindings register and final current-digest verdict join remain F duties, not refreshed by this status reconciliation.')
g(0)['blockers'] = ['Independently review the 25 pending carries-current-rebindings rows (8 target-digest changes), binding each verdict to the current claim/row and digests; W17-3 is scope/mechanical PASS, not per-row content approval.']
g(0)['remaining'] = g(0)['blockers'][0]
g(0)['atFinalPinUnderLease'] = [
    'Record F and join every frozen changedBindings row plus every later rebind/re-decision to its effective ledger row and an independent APPROVE at matching bindingSha256/targetUnitDigest; zero missing, mismatched or open REWORK (execution plan §2 G0, §3 W3). Duplicate rows /bindingRefresh/124..126 must follow any later rebind of /6, /20 and /21 respectively (W16 F5). The 73/257 mismatch count is historical at 77db6ed2b, not a current count.',
    'After applying the full composed chain, resolve/rebind all affected ownership rows, not only GAP-05. W10 measured 407 distinct unresolved bindings (361 chain-caused + 46 pre-existing), 556 assertions; W9’s 661 is an earlier full-chain assertion count, not an additive population (w10-composition-rework F7). Re-enumerate at F.',
    'After final main import, re-decide claim_2e2bc926 against Work Event Store cutover 42c5a0a55; the withStateTx/appendEventCore successor is plan-pin scoped only (L13-15.2, W16 F2; W17-4 clause-source refinement travels with it).',
]
evidence(0, 'g0rework/receipt.md', 'g0rework/receipt.json', 'carries/current-binding-refresh.json',
         'reviews/w17-parity-rework-review.md', 'owner-answers.md', 'preflip-execution-plan.md')

# G1: member/review/composition debt is not the new live-parity debt.
c1 = clear(1, 'No independent composition review / no per-member join over all 115 members.',
           ['5fe778624', 'd22072da2', '63c3db9c6'], 'w8-composition-review', 'member-join-115',
           ['reviews/w9-composition-fix-review.json', 'reviews/w2-g1-carries-review.json'])
c2 = clear(1, 'GAP-05 placement awaited Lead approval and moved-body bindings were unresolved.',
           ['63c3db9c6', '928f5cc14'], 'w10-composition-rework-review', 'F2',
           ['reviews/w9-composition-fix-review.json'])
c3 = clear(1, 'Citation-drift prepared-chain parity gap (old 124 finding count). The prepared chain is reviewed; applying and rescanning it still belongs to F under L13-11.3.',
           ['63c3db9c6', '928f5cc14', 'bc2a6a014', '4c9e1f31e', '0fe6c4381', 'daa87810b'],
           'w14-check-hardening-review', 'B-L3',
           ['reviews/w10-composition-rework-review.json', 'reviews/w13-misc-pin-and-gloss-review.json'])
c4 = clear(1, 'Independent per-unit review of import-3 24 source bindings, including its 8 adapted rows (8 is a subset, not 24+8).',
           ['d786e305e'], 'w14-import3-binding-review', reviews['reviews/w14-import3-binding-review.json']['rows'][0]['id'])
# The quoted row is one of the 98, while the entire review is the owning exhaustive verdict.
c4['verdict'] = 'APPROVE, 98 of 98 rows.'  # exact substring of the Markdown verdict
c4['reviews'].append('reviews/w14-import3-binding-review.md')
evidence(1, 'reviews/w14-import3-binding-review.md')
g(1).update(status='partial', commit='a8ea05c50',
    note='The W8/W9 member and composition review chain covers all 115 joined members; L13-11 approves GAP-05 and W10 verifies all moved-body joins. Prepared citation glosses replay to zero findings, with subsequent prose/check fixes reviewed through W14. W14-import3 independently APPROVEs all 98 changed/additional rows, including the 24 source rows and 8 adapted subset. W17 nevertheless finds a live-proof regression: four stale heading rows and one uncovered block. The parallel L13-16 fix is not part of this snapshot.')
g(1)['blockers'] = [
    'Fix and independently re-review W17-1: refresh the 4 live distribution.md heading rows, add parity for unheaded-block-17 and restore live heading/direct-block coverage alongside authoring replay (L13-16). No parallel uncommitted fix is counted.',
    'Obtain current-digest independent review for the 25 pending candidate rebinds introduced by a8ea05c50 (8 target-digest changes), shared with G0; mechanical W17-3 PASS is not semantic approval.',
]
g(1)['remaining'] = 'Complete the L13-16 live-proof correction and independent current-row reviews; retain F guard/patch duties separately.'
g(1)['atFinalPinUnderLease'] = [
    'Apply the reviewed prepared composition/GAP-05/citation chain under lease, then rerun owning dead-vocabulary and citation guards on the post-apply tree, baseline unchanged (L13-11.2–3).',
    'Recompose the 2 drifted carries pointer patches, bin/fgos.mjs and docs/backlog.md, and recheck all 24 at F (W17-2 ACCEPT-DISCLOSED; L13-16).',
]
evidence(1, 'reviews/w8-composition-review.json', 'reviews/w9-composition-fix-review.json',
         'reviews/w10-composition-rework-review.json', 'reviews/w17-parity-rework-review.json',
         'import3/receipt.md', 'carries/receipt.md', 'owner-answers.md')

# G2/G3: final-pin custody tasks remain open, not counted as historical approvals.
g(2)['atFinalPinUnderLease'] = [
    'Re-run census-join/join.py --pin F --rescan; refresh the 33 moved Rust locators, settle/review the 8 open post-pin literal judgments plus any new F delta, and obtain current-pin delta review (execution plan §2 G2 / §3 W3; L13-9.4). The original 187 judgments belong before F under L13-17.1.',
    'Refresh G2/G6 to a shared F pin and make preserve-premise/verify.py exit 0 without weakening its pin equality (L13-9.4).',
]
evidence(2, 'census-join/receipt.md', 'owner-answers.md', 'preflip-execution-plan.md')
g(3).update(status='met-local', commit='f534aeaea',
    note='All 17 dropped ids have independent per-id APPROVE at cffe725b9, with dropped-010 superseded and no tie. Subsequent target edits do not inherit those approvals; final current-anchor/digest and register-status reconciliation is still required at F, as the original register already required (execution plan §2 G3; W3 does not name G3).')
g(3)['atFinalPinUnderLease'] = [
    'Re-check all 17 restored/superseded targets at F anchors/digests; delta-review changed targets and replace restored-pending-review / superseded-pending-review with final dispositions (pre-existing register G3 remaining/F duty; execution plan §2 G3, not W3).',
]
evidence(3, 'preflip-execution-plan.md')

# G4: the Lead wording fix did receive an independent review; owner review did not.
c5 = clear(4, '53499dc9d (w6 spec-sentence REWORK fix) not independently re-reviewed.',
           ['53499dc9d'], 'w8-lead-fixes-review', 'git-spec-escape-sentence')
g(4).update(status='met-local', commit='53499dc9d',
    note='Local declaration/wrapper/escape repairs are independently reviewed, including the Lead’s scoped spec sentence in W8. Scanner residual alias-export inheritance remains explicitly owned by Git/HARDEN, not claimed fixed. The 25 declarations require that owner’s review. L13-12 replaces L13-9’s impossible selective-SHA push with full plan-HEAD review branch A\'; WORK reported cutover xong on fg-server2, design-lap has since imported main (W22), so the older host no-pull restriction is obsolete.')
g(4)['external'] = [
    'Git owner / HARDEN reviews the 25 declarations and the explicitly open aliased-export declared-wrapper inheritance gap. Review branch review/doc-git-one-door must use full plan ancestry under L13-12 A\', not L13-9’s superseded selective-commit shape.',
]
evidence(4, 'owner-answers.md', 'reviews/w8-lead-fixes-review.json')

# G5: W21 B approves both clauses, not owner acceptance of their restatements.
c5b = clear(5, 'Complete surviving-map clause check and independent review.',
            ['b57e79625', '83916a31f'], 'w21-census-rework-and-g5-review', 'B-met-local')
g(5).update(status='met-local', commit='83916a31f',
    note='W21 B approves check-b57e79625.json: exit 0, 10/10 legacy spans, 1 verbatim / 8 restated / 1 not applicable, 31 rejecting controls. Holder-lock is proved at its own surviving file; the map clause covers the banner and both compounding→knowledge lines. L13-19.2 closes local work, not owner acceptance: gateApproved=false. The 8 exact restatements await the cutover packet (L13-10); rerun at F.')
g(5)['external'] = ['Owner acceptance of exactly 8 restatements (legacy map lines 3–9 and 34, with exact old/new text in g5/check-b57e79625.json /ownerAcceptance) is required in the cutover approval packet under L13-10; includes the banner and the full Truth-correction line, not just its suffix.']
g(5)['atFinalPinUnderLease'] = ['Re-run g5/check.py --pin F for both retention and accepted surviving-map spans; record output and exits (W21 B; execution plan §2 G5 / §3 W3).']
evidence(5, 'g5/check-b57e79625.json', 'reviews/w21-census-rework-and-g5-review.md', 'owner-answers.md', 'preflip-execution-plan.md')

# G6: exhaustive coverage and delta review are both present.
c7 = clear(6, "c5586146c verifier-pin fix only: W8 independently checked it. The separate misc-fix receipt-count correction in 25e8842d3 remains open under L13-17.4.",
           ['c5586146c'], 'w8-lead-fixes-review', 'misc-verify-g6-pin')
c8 = clear(6, 'No exhaustive APPROVE over all 1,423 judgment/note rows and every overturn.',
           ['db023f065'], 'w9-g6-fix-review', 'item-7-receipts-and-scope',
           ['reviews/w8-g6-parks-review.json', 'reviews/w8-g6-judgments-review.json'])
g(6).update(status='partial', commit='db023f065',
    note="W8 parks covers all 1,260 rows (1,220 APPROVE / 40 REWORK); W8 judgments covers 163 notes plus the overturn (163 APPROVE / 1 REWORK). W9 approved db023f065's reclassification of 319 parks and 20 operand rows by rule, with a 56-row spot check and positive/negative controls, not row by row; this is accepted under L13-17.3. Current pin-scoped totals: 5,413 = 4,320 bounded confirmations + 924 owned parks + 163 dated notes + 6 repoint proposals; 1,093 action rows are not resolved by this reconciliation, but have reviewed custody/prepared work. Scoped proof replays are byte-identical. c5586146c’s verifier pin was independently approved in W8; its misc-fix receipt counts were corrected in 25e8842d3 but still need independent re-review (L13-17.4). That before-F remaining item makes G6 partial under the existing met-local integrity rule; the combined verifier is still an F obligation.")
g(6)['blockers'] = ["Independently re-review 25e8842d3, the misc-fix receipt counts (W18 F4; L13-17.4); W8 cleared only c5586146c's verifier-pin fix."]
g(6)['remaining'] = g(6)['blockers'][0]
g(6)['atFinalPinUnderLease'] = [
    'Refresh all preserve-premise evidence at F (the earlier 186 G6 rows / 86 wrapper digests are historical lower bounds, not current totals), replay twice byte-identically and obtain delta review (execution plan §2 G6 / §3 W3, L13-9.4).',
    'Co-compose the reviewed 163 dated wrapper notes, owned-park actions and 6 repoint proposals (including the prepared four-line dispatch patch), use actual flip date/placement, and validate them with the full F chain before cutover. Owned parks remain owned, not automatic preserves or blanket retirements (L13-17.2; preserve-premise receipt; w9-g6-fix review). W22 corrects this premise: 787 authored premise judgments require exhaustive before-F review, while 137 current-passage-unbound rows and composition remain at F.',
    'Pass the combined G2/G6 verifier at the shared F pin (L13-9.4).',
]
evidence(6, 'reviews/w8-g6-parks-review.json', 'reviews/w8-g6-judgments-review.json',
         'reviews/w9-g6-fix-review.json', 'preserve-premise/receipt.json', 'owner-answers.md')

# G7: earlier whole-spec REWORKs and park actions have a review chain.
c9 = clear(7, 'Recomposed g7-c5 test/cli/fgos-merge.test.mjs REWORK spec not re-reviewed.',
           ['5fe778624', 'd22072da2'], 'w8-composition-review', 'rework:test/cli/fgos-merge.test.mjs')
c9b = clear(7, 'Recomposed g7-c7 docs/how-to/fix-bare-citation-findings.md REWORK spec not re-reviewed.',
            ['5fe778624', 'd22072da2'], 'w8-composition-review', 'rework:docs/how-to/fix-bare-citation-findings.md')
c10 = clear(7, '101 park actions lacked review / four holder-blocked actions.',
            ['63c3db9c6', '928f5cc14'], 'w9-composition-fix-review', 'supplemental:docs/platform/system-overview/spec.md',
            ['reviews/w8-composition-review.json', 'reviews/w10-composition-rework-review.json'])
c11 = clear(7, '124 content rows plus the three overlapping Lead corrections still needed re-review.',
            ['6f5b9419d', 'c25e8cf6a', 'a8ea05c50'], 'w16-g0-rework-and-park-rule-review', 'A-pass',
            ['reviews/w14-g0-content-rereview.json', 'reviews/w17-parity-rework-review.json'])
g(7).update(status='met-local', commit='daa87810b',
    note='Initial review covers 387 of 423 specs (385 APPROVE / 2 REWORK), with 36 deferred to G9/F. W8 explicitly resolves both recomposed specs; W8/W9 resolves 101 park actions and the supplemental four holder groups. GAP-05 and gloss/check hardening are reviewed through W14. W14/W16/W17 replaces the obsolete content-re-review demand, without certifying the F verdict join or full post-apply binding resolution.')
g(7)['atFinalPinUnderLease'] = [
    'Recheck every approved spec digest at F; recompose/delta-review changed specs and the 36 G9-deferred specs plus predecessor chain (execution plan §2 G7, §3 W3).',
    'Run the full post-apply ledger resolution/rebind, covering all residual bindings, not just GAP-05. Use the W10 inventory (407 distinct = 361 chain-caused + 46 at pin; 556 assertions) only as a historical sizing witness, then re-enumerate at F (w10-composition-rework F7).',
]
evidence(7, 'reviews/w8-composition-review.md', 'reviews/w9-composition-fix-review.json',
         'reviews/w10-composition-rework-review.json', 'reviews/w14-check-hardening-review.json',
         'preflip-execution-plan.md')

# G8: W20 C clears the receipt fix; L13-18 moves local ref creation to F.
c12 = clear(8, '984829939 direct-link retention and 5c3b57347 cold timing not independently reviewed.',
            ['984829939', '5c3b57347'], 'w14-g8-retention-timing-review', 'cold-timing-numbers-match-logs',
            ['reviews/w8-lead-fixes-review.json'])
c12b = clear(8, 'Independent re-review of f67e0f676 records-only archive receipt correction.',
             ['f67e0f676'], 'w20-census-settlement-review', 'C-archive-receipt')
g(8).update(status='met-local', commit='f67e0f676',
    note='W8/W14 approve retention and cold timing; W20 C independently approves f67e0f676: contradictory sandbox fields remain verbatim in historicalSandboxAttempt, current values match verified Lead measurements. W21 A approves the additional 25e8842d3 postMeasurementEdits custody entry. Under L13-18 and L13-19.2 no before-F item remains: create the create-only LOCAL ref from the F rebuild with custody evidence before G10, not from a partition that F will replace. Publication remains owner-gated; retained JSON path-string recovery remains a separate documentation note.')
g(8)['atFinalPinUnderLease'] = [
    'Create the repository-local archive ref from the F rebuild before G10, with commit, partition hash, path, blob, size and SHA256 agreement (L13-18); a disposable rehearsal ref is not custody.',
    'Rebuild partition at F and keep every evidence file named by this gate register, cleared-review provenance and the final status ledger; re-enumerate readers to zero unresolved and retime cold after G10 (L13-13.4; execution plan §3 W4). W14’s 70/92 archived evidence paths is an old count, not the expanded register’s current count.',
]
g(8)['external'] = ['Owner cutover approval S2 is required for archive ref publication and main manifest merge; local rehearsal is not that permission.']
evidence(8, 'reviews/w14-g8-retention-timing-review.json', 'reviews/w20-census-settlement-review.md',
         'reviews/w21-census-rework-and-g5-review.json', 'archive/receipt.json',
         'owner-answers.md', 'preflip-execution-plan.md')

# G9: two owner backlog parks and 15 carried blockers are not 338 unjudged parks.
c13 = clear(9, 'Interim re-judgment of 518 + 144 records not done / no G9 review.',
            ['4f08d504d', 'bc2a6a014', '4c9e1f31e', '63c884240', '33cc5539d'],
            'w16-g0-rework-and-park-rule-review', 'B-pass',
            ['reviews/w10-g9-interim-review.json', 'reviews/w11-g9-rework-review.json',
             'reviews/w12-g9-followup-review.json', 'reviews/w15-g9-parks-review.json'])
c14 = clear(9, 'Doer-SHA provenance and previousMainMergeAccounting still unrepinned (w4-import2).',
            ['4f08d504d', 'bc2a6a014', '4c9e1f31e'], 'w11-g9-rework-review', 'scope-and-repin',
            ['reviews/w10-g9-interim-review.json', 'reviews/w12-g9-followup-review.json',
             'reviews/w13-misc-pin-and-gloss-review.json', 'reviews/w14-check-hardening-review.json'])
c15 = clear(9, '338 mechanical parks await Lead re-judgment or an owner.',
            ['63c884240', '33cc5539d'], 'w16-g0-rework-and-park-rule-review', 'B-pass',
            ['reviews/w15-g9-parks-review.json'])
g(9).update(status='met-local', commit='33cc5539d',
    note='Interim work and rework have independent reviews. Current cohort is 574 physical records / 684 memberships, not 518+144 distinct rows: 526 still-valid, 15 needs-recomposition, 31 superseded, 2 owned backlog parks. The former 338 mechanical parks were re-judged in 63c884240. W15 reviewed the 50 parks, superseded rows and recomposition rows in full (5 parks + 32 superseded + 13 recomposition), and sampled 60 of the 288 still-valid rows; drift-only corrections were approved in W16 B-pass. 15 inherited phase-08 /parked blockers remain open via carriedBlocker at their original owning records (L13-14). 546 prepared bodies; W16 sweep has zero drift/chain/body/judgment errors. Record SHA re-pins and the ratchet exception field are reviewed; L13-13.3 still keeps the two historical Doer refs.')
g(9)['external'] = [
    'Backlog owner must decide the intended current STR70a/STR62 claims for batch-126.jsonl:2 and generators-skills-and-support.jsonl:66, edit docs/backlog.md directly and return exact row identities; these 2 G9 parks are not generic Lead-review debt (g9/receipt.md; W16 B-pass).',
    'The 15 phase-08 /parked dependencies remain open with their original owners through carriedBlocker; WORK/knowledge/export/retention obligations are not settled by G9 drift approval (L13-14; g9/receipt.md).',
]
g(9)['atFinalPinUnderLease'] = [
    'After final main import record F, run g9/sweep.py --check --pin F, rejudge every changed evidence row, recompose drifted bodies (including deferred G7/predecessor specs), and get source-delta review (execution plan §2 G9 / §3 W3).',
    'Fix/materialize the supersession source join or explicitly carry the 2 prepared-shard legacy scan gaps (README, repo-layout-vision), then rerun post-apply scan at F (w11-import3 F3; import3/receipt.md).',
    'Retain keep/doer-pin-92260972c and keep/doer-pin-a27d85d0a until track end under L13-13.3; completed SHA re-pinning is not permission to delete their historical witnesses.',
]
evidence(9, 'g9/receipt.md', 'reviews/w16-g0-rework-and-park-rule-review.json',
         'reviews/w15-g9-parks-review.json', 'reviews/w11-import3-review.json',
         'owner-answers.md', 'preflip-execution-plan.md')

# G10/G11: evidence of a request/agreement is not evidence of execution.
g(10).update(status='external', commit=None,
    note='No G10 rehearsal receipt is present in the snapshot review/receipt chain. L13-1 records a section 7 consent request, not consent. Requires G11 release and the F-code shrunk rehearsal clone.')
g(10)['external'] = ['Git owner section 7 consent is not recorded; after that consent and G11 release, Lead runs holder Land publish/ref verification, non-holder refusal and rollback on the G8 shrunk F-code clone, and commits the owning receipt (execution plan §2 G10).']
g(10)['atFinalPinUnderLease'] = ['G10 rehearsal must use G11’s release and F code commit on the G8 shrunk clone, before final G8 timing (execution plan §3 W4).']
evidence(10, 'owner-answers.md', 'preflip-execution-plan.md')
g(11).update(status='external', commit=None,
    note='L13-1 records SEAT’s staging agreement only; no release id, sourcePin/manifest provenance or installed-host four-route proof is present. L13-12 supersedes the blanket L13-9 WORK stop: fg-server2 reported cutover xong, the older design-lap no-pull restriction is obsolete following its main import (W22). This reconciliation neither authorizes a release/cutover nor treats host-specific constraints as a permanent blanket run ban.')
g(11)['external'] = ['SEAT stages release R from F code (manifest sourcePin provenance); Lead proves installed-host docs-lease acquire/status/release/abandon in a disposable clone without global activation (execution plan §2 G11).', 'Respect L13-12 host-specific stop/import constraints and the separate owner cutover approval; the superseded L13-9 blanket no-run/no-push wording is not the current rule.']
g(11)['atFinalPinUnderLease'] = ['Bind staged release R sourcePin to the F code commit and rerun G11/G10 on any relevant subsequent code change (execution plan §3 W4).']
evidence(11, 'owner-answers.md', 'preflip-execution-plan.md')

# W19 is a separate committed review layer; preserve all original snapshot and
# W18 fingerprints. APPROVE here closes only the exact named review demands.
w19 = load('reviews/w19-live-parity-and-rebinds-review.json')
source(BASE / 'reviews/w19-live-parity-and-rebinds-review.md')
assert len(w19['items']) == 27 and all(r['verdict'] == 'APPROVE' for r in w19['items'])
rebinds = [r for r in w19['items'] if r['kind'] == 'rebind']
assert len(rebinds) == len({r['pointer'] for r in rebinds}) == 25
w19_paths = ['reviews/w19-live-parity-and-rebinds-review.md', 'reviews/w19-live-parity-and-rebinds-review.json']
def w19_clear(number, item, commits, verdict):
    record = dict(item=item, clearedBy=commits, reviews=w19_paths, verdict=verdict)
    g(number)['cleared'].append(record)
    evidence(number, *w19_paths)
    return record

for number in [0, 1]:
    w19_clear(number, 'Independent current-digest review of all 25 pending carries-current-rebindings rows (including 8 changed target digests).',
              ['a8ea05c50'], 'B. 25 pending rebinds in `carries-current-rebindings.json`: 25 APPROVE')
    g(number).update(status='met-local', blockers=[], remaining='')
g(0)['note'] = 'W14/W16/W17 content review remains historical and scoped. W19 independently approves all 25 pending candidate rebinds row by row, with exact bindingSha256 and targetUnitDigest. No before-F local review item remains; the frozen changedBindings/current-digest join, duplicate successor tracking and claim_2e2bc926 re-decision remain F duties.'
w19_clear(1, 'L13-16 live-proof correction: live heading/direct-block coverage restored alongside unchanged witness-pin replay.',
          ['5a3f7580a'], 'A. 5a3f7580a, live parity next to the witness pin: APPROVE')
g(1)['note'] = 'W8–W14 member/composition/import-3 approvals retain their exact scope. W19 approves 5a3f7580a live parity and all 25 pending rebinds row by row. W20 B subsequently approves the stale-duty control and duplicate-target cleanup. Recomposition of the two disclosed drifted pointer patches and post-apply guards remain at F.'
c2b = clear(2, 'Four citation holders and their unapplied retargets independently reviewed in W20 B.',
            ['408078b9a'], 'w20-census-settlement-review', 'B-citation-holders')
c2c = clear(2, 'Seven W20 REWORK helper/closure joins repaired and replayed in 25aa41510; W21 A independently approves the rework.',
            ['25aa41510'], 'w21-census-rework-and-g5-review', 'A-replay')
g(2).update(status='met-local', commit='25aa41510', blockers=[], remaining='',
    note='W20 reviews the 187 original judgments plus 4 grade drifts and approves the four citation holders/retargets; W21 A independently approves all 7 repaired caller joins, detail fixes and audit corrections. L13-19.1 confirms pc-d-0288 as REJECT: hostScan assert.fail diagnostic at test/event-store/migrate-cutover-grant.test.mjs:34 is non-document rendering, not an unowned branch. At catch-up pin cf13e2bd22ce390344837560b35b41adf7da1238 the original census is 779 owning-test joins + 289 unchanged grade REJECTs + 54 settlement REJECTs + 4 citation joins = 1,126, zero open judgment. This does not settle the historical post-pin delta or prove F execution; existing F duties remain.')
evidence(1, 'reviews/w20-census-settlement-review.md', 'reviews/w20-census-settlement-review.json')
evidence(2, 'w19-cleanup-brief.md', 'reviews/w20-census-settlement-review.md',
         'reviews/w21-census-rework-and-g5-review.md', 'owner-answers.md')
c7['item'] = 'c5586146c verifier-pin fix independently checked by W8; the separate receipt-count correction has its own W19 clearance.'
c7b = w19_clear(6, 'Independent re-review of 25e8842d3 misc-fix receipt counts (W18 F4; L13-17.4).',
                ['25e8842d3'], 'C. 25e8842d3, misc-fix receipt counts: APPROVE')
g(6).update(status='met-local', blockers=[], remaining='')
g(6)['note'] = 'W8 covers all 1,423 judgment/note rows; W9 approves the 319-park / 20-operand reclassification by rule with a 56-row spot check (L13-17.3), not row by row. W19 independently approves 25e8842d3 receipt counts. Current 5,413-row custody remains 4,320 confirmations + 924 parks + 163 notes + 6 proposals; met-local is not completion of owned actions. F evidence refresh, co-composition and the combined G2/G6 verifier remain open.'
register['asOf']['reviewFollowUpCommit'] = REVIEW_PIN
register['asOf']['catchUpCommit'] = CATCHUP_PIN

# W22/L13-20: immutable author packets are not independent reviews. Parallel
# reviewers are deliberately excluded from this turn-start snapshot.
for path in sorted(CORRECTION_PATHS):
    source(path)
register['asOf']['correctionCommit'] = CORRECTION_PIN
register['asOf']['basis'] += ' W22/L13-20 corrects scheduling and strict verdict-record coverage; authored G6/G9 packets at the correction pin await exhaustive independent review. New scoped artifacts are separately fingerprinted, not represented as committed reviews.'
for gate in register['gates']:
    gate['ownerItems'] = []
joined = load('g0join/join-608a4ada5.json')
assert joined['pin'] == CORRECTION_PIN and joined['exit'] == 1
# A historical scoped APPROVE cannot fill absent per-row digest records.
g(0).update(status='partial',
    note='Historical scoped semantic reviews remain valid at their exact scopes, including W9/W10 GAP-05 overlays and W19 rebinds. The new strict executable G0 join is not green: ' + json.dumps(joined['counts'], sort_keys=True) + '. No per-row APPROVE is inferred from aggregate-only reviews. These are evidence-record gaps, not invented semantic rejections; the final current-pin join still must pass at F.',
    blockers=['Lead / independent reviewers must supply or correct missing, mismatched and open-REWORK per-row verdict evidence identified in g0join/join-608a4ada5.json before the packet; aggregate prose cannot supply the two required digests. F-only target changes remain delta review at F.'])
g(0)['remaining'] = g(0)['blockers'][0]
evidence(0, 'g0join/join.py', 'g0join/join-608a4ada5.json', 'g0join/receipt.md',
         'reviews/w9-composition-fix-review.json', 'reviews/w10-composition-rework-review.json',
         'reviews/w22-register-met-local-review.json')
g(2)['atFinalPinUnderLease'].append('Compose and apply the 4 unapplied code-comment retargets in census-join/pointer-patches.json with the full approved shared-file F chain; recheck expectedAfterSha256 (recompute for the composed body, retaining the original packet witness), exact forward/rollback hashes, and rerun the citation join. Owner: Lead; no fuzzy application (L13-20.3, W22 G2).')
evidence(2, 'census-join/pointer-patches.json', 'census-join/locator-proof.json', 'reviews/w22-register-met-local-review.json')
g(4)['atFinalPinUnderLease'] = ['After the final main import, rerun node scripts/git-one-door-scan.mjs at F: 0 undeclared sites; resolve and independently review any incoming delta before Land. Owner: Lead / Git-HARDEN (L13-20.3).']
proof = load('preserve-premise/proof.json')
shards = [load(f'preserve-premise/park-judgments/shard-{i}.json') for i in range(1, 4)]
premises = [row for shard in shards for row in shard['rows']]
assert len(premises) == len({r['rowId'] for r in premises}) == 787
premise_counts = dict(collections.Counter(r['disposition'] for r in premises))
unbound = [r for r in proof['rows'] if r['result'] == 'park-current-passage-unbound']
assert len(unbound) == 137
owned = [r for r in premises if r['disposition'] == 'owned-park']
g(6).update(status='partial',
    note='W8 approved park classification, not the 787 premises; L13-20.1 supersedes the false L13-17.2 review claim. The 623 unconfirmed + 162 removed-by-cutover + 2 absent rows now have source/digest-bound authored judgments in park-judgments/shard-{1,2,3}.json (263/263/261): ' + json.dumps(premise_counts, sort_keys=True) + '. Exhaustive independent review of all three shards is pending. The 36 owned parks still need the named coding-domain placement decision before F; they do not need a flip date. Only the 137 current-passage-unbound rows and application/composition of reviewed actions remain F work.',
    blockers=['Independent reviewers exhaustively review all 787 premise judgments in preserve-premise/park-judgments/shard-{1,2,3}.json, binding verdicts to their exact evidence; resolve any REWORK before the packet (L13-20.1/4).'])
g(6)['remaining'] = g(6)['blockers'][0]
for owner in sorted({r['owner'] for r in owned}):
    ids = [r['rowId'] for r in owned if r['owner'] == owner]
    g(6)['ownerItems'].append(owner + ': settle the live coding-artifact placement convention before F for ' + str(len(ids)) + ' owned parks: ' + ', '.join(ids) + '; exact nextAction/reason lives in shard-3.json. Do not defer these choices into the lease window.')
g(6)['atFinalPinUnderLease'] = [
    'Bind/judge the 137 park-current-passage-unbound rows against actual F bytes and obtain independent delta review. Refresh all G6 evidence at the shared G2/G6 F pin, replay twice byte-identically and pass the combined verifier; unchanged digest-bound judgments do not get re-judged by batch (L13-20.1).',
    'Compose/apply the reviewed 163 dated notes, 6 existing repoint proposals and reviewed park-judgment actions with the full F chain, using the real flip date/placement. Only application/composition is deferred, not the 787 premise judgments, exhaustive reviews or the 36 owned placement decisions. Stop on any changed source/target and review its delta before Land.',
]
evidence(6, 'preserve-premise/proof.json', *[f'preserve-premise/park-judgments/shard-{i}.json' for i in range(1, 4)])
g(8)['note'] = g(8)['note'].replace('retained JSON path-string recovery remains a separate documentation note.', 'archive/design.md now documents recovery of retained JSON path strings through the approved archive ref and partition checks (W14/W22); this correction awaits independent review.')
evidence(8, 'archive/design.md')
dependencies = load('g9/phase9-decisions.json')
assert len(dependencies['entries']) == 33
# Backlog intent is an owner question, not a WORK/registry export dependency.
g(9)['ownerItems'] = [g(9)['external'][0]]
g(9)['external'] = ['WORK and registry owners supply the bounded knowledge/registry exports still required by the inherited phase-08 parked records. The 33 Phase-9 dependencies are local decisions, not external blockers; exact untouched exports stay in their original records (L13-20.2; g9/phase9-decisions.json).']
g(9).update(status='partial', blockers=['Independent reviewer exhaustively reviews the 33 local dependencies and exact dispositions in g9/phase9-decisions.json before the packet; resolve any REWORK (L13-20.2/4).'])
g(9)['remaining'] = g(9)['blockers'][0]
g(9)['note'] += ' W22/L13-20 corrects the inherited-dependency split: the 33 Phase-9 entries in seven records are now authored in g9/phase9-decisions.json (' + json.dumps(dependencies['counts'], sort_keys=True) + '); independent review is pending. Only WORK/registry exports remain external; the two backlog intent questions remain separately owner-owned.'
evidence(9, 'g9/phase9-decisions.json')
g(11)['external'][1] = 'Owner cutover/lease/Land approval remains separate. L13-12 historical host stop constraints do not prohibit the main import already performed on design-lap; W22 retires the stale no-pull wording.'
# Surface every owner action, not a compressed catch-all in the packet summary.
g(5)['ownerItems'], g(5)['external'] = g(5)['external'], []
g(8)['ownerItems'], g(8)['external'] = g(8)['external'], []
residual = load('composition/w9-unresolved-bindings.json')['assertions']
glosses = load('composition/w8-citation-glosses.json')
batches = load('review-batches.json')
f_window = {
    'sourcePin': CORRECTION_PIN,
    'meaning': 'Source-derived sizing witnesses, not sums of independent populations or a wall-time estimate. Re-enumerate after F import; stop instead of widening the approved lease budget.',
    'g6UnboundRows': {'count': len(unbound), 'source': 'preserve-premise/proof.json', 'selection': 'rows[result=park-current-passage-unbound]'},
    'g6BeforeF': {'authoredJudgments': len(premises), 'reviewPending': len(premises), 'dispositions': premise_counts, 'ownedPlacementDecisions': len(owned), 'source': 'preserve-premise/park-judgments/shard-{1,2,3}.json', 'insideFWindow': False},
    'g6Composition': {'datedNotes': proof['counts']['byResult']['judgment-preserve-with-dated-note'], 'existingRepointProposals': proof['counts']['byResult']['repoint-proposal'], 'parkJudgmentRepoints': premise_counts['repoint'], 'source': 'preserve-premise/proof.json and park-judgments/shard-{1,2,3}.json'},
    'postApplyBindings': {'distinct': len({(r['effectiveRecord'], r['effectivePointer']) for r in residual}), 'assertions': len(residual), 'source': 'composition/w9-unresolved-bindings.json', 'historicalWitness': True},
    'glosses': {'mainOwnedSites': sum(len(r['ids']) for r in glosses['witnesses'] if r['ownership'] == 'main-at-F'), 'mainOwnedPassages': sum(r['ownership'] == 'main-at-F' for r in glosses['witnesses']), 'source': 'composition/w8-citation-glosses.json', 'historicalWitness': True},
    'deltaReviewsPerGate': {
        'G0': {'effectiveBindingsAtSourcePin': joined['counts']['effectiveRows'], 'frozenChangedBindings': joined['counts']['frozenChangedBindings'], 'laterEffectiveDeltaCount': None, 'source': 'g0join/join-608a4ada5.json', 'rule': 'Matching per-row APPROVE on every effective binding; review F changes only. Current evidence gaps are before-F work.'},
        'G2': {'originalSites': json.loads(load('census-join/locator-proof.json')['commands'][-1]['stdout'])['sites'], 'unappliedRetargets': len(load('census-join/pointer-patches.json')['patches']), 'deltaCountAtF': None, 'source': 'census-join/locator-proof.json and pointer-patches.json', 'rule': 'Rescan/join and review post-pin literal/dynamic delta, including the prepared retarget chain.'},
        'G6': {'unboundRows': len(unbound), 'deltaCountAtF': None, 'source': 'preserve-premise/proof.json', 'rule': 'Review newly bound 137 rows plus changed evidence only; no 787-judgment batch inside F.'},
        'G7': {'totalSpecs': batches['g7Prefilter']['total'], 'deferredSpecs': len(batches['g7Prefilter']['deferred']), 'deltaCountAtF': None, 'source': 'review-batches.json', 'rule': 'Review 36 deferred specs and changed spec/predecessor digests; count after F sweep.'},
        'G9': {'localDependencies': len(dependencies['entries']), 'deltaCountAtF': None, 'source': 'g9/phase9-decisions.json', 'rule': 'Before-F review of local decisions; source-delta review and whole-file recomposition at F.'},
    },
}

# Local, F, owner and external lists project the same per-gate decisions.
register['cutoverReadiness'] = {
    'summary': 'Not ready to send the packet: G0 strict per-row verdict-record gaps, G6 exhaustive review of 787 authored judgments and 36 owner placement decisions, G9 review of 33 local dependencies, and independent review of these register/tool/locator/archive corrections remain before F (L13-20.4). Other historical met-local classifications do not grant final acceptance. Once all local work is met-local, send the owner packet before approval/lease/F. Owner items and other-lane dependencies are enumerated separately below. No lease, release, publication, cutover or Land approval is inferred.',
    'order': ['Complete and independently review local work to met-local', 'Send owner cutover packet at met-local (L13-6)', 'Owner cutover approval within the stated scope and budget', 'Acquire documentation write lease; freeze starts', 'Final main import with accounting; record F', 'Execute F duties and delta reviews; stop if any fails', 'Write and independently review the final status ledger', 'Land within the separately approved frame'],
    'fWindowSize': f_window,
    'ownerItems': [f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['ownerItems']] + ['Owner separately approves cutover, documentation lease and Land; packet includes the F-window scope/budget and stop conditions.'],
    'localCorrectionReview': 'Independent reviewer checks this records slice, G0 tool, locator restoration and G8 recovery sentence before the packet (L13-20.3–4).',
    'beforeFinalPin': [f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['blockers']],
    'atFinalPinUnderLease': [
        'Import main once with merge accounting and record final pin F; any later import reopens changed-path delta work (execution plan §3 W3).',
        *[f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['atFinalPinUnderLease']],
        'Pair-account every new plan-branch commit through the owning Lead/accounting turn; this reconciliation performs no pair accounting (execution plan §1 / §3).',
        'Run the full suite at F in an isolated clone with main-vs-branch attribution, plus native-dependent reproduction checks omitted by scoped Doer proofs; partial g0rework verifier output is not a green full audit (execution plan §8, L13-15.3; W17 F6).',
        'Every committed-byte check takes explicit --pin F; permanent proofs check authoring and live tree, with named machine-readable F duties and failure on unlisted drift (L13-13.2, L13-16).',
        'Write and independently review the final status ledger after passing F duties, before Land; the owner packet was already sent at met-local before approval and lease (L13-6/20).',
    ],
    'external': [f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['external']],
}

# Every original occurrence is preserved in the receipt. Compound sentences have
# independently decided parts, never a blanket "cleared" hiding a live/F duty.
decisions = []


def decide(pointer, item, decision, explanation, gates, paths, parts=None):
    row = {'sourcePointer': pointer, 'item': item, 'decision': decision,
           'resolution': explanation, 'gates': [f'G{i}' for i in gates],
           'evidence': list(dict.fromkeys(paths))}
    if parts:
        row['parts'] = parts
    decisions.append(row)


def cleared_part(record):
    return {'decision': 'cleared', **record}


def f_part(text):
    return {'decision': 'moved to F', 'item': text,
            'evidence': ['preflip-execution-plan.md', 'owner-answers.md']}


# Explicit mapping of all original gate blockers, in their original order.
blocker_map = {
 0: [('cleared', c0), ('cleared', c0), ('moved to F', None), ('moved to F', None), ('moved to F', None), ('moved to F', None)],
 1: [('cleared', c1), ('cleared', c2), ('moved to F', c3), ('cleared', c1), ('cleared', c0)],
 2: [('moved to F', None)] * 4,
 3: [('moved to F', None)] * 2,
 4: [('still open', None), ('cleared', c5), ('still open', None)],
 5: [],
 6: [('cleared', c7), ('cleared', c8), ('moved to F', None), ('moved to F', None)],
 7: [('cleared', c9), ('cleared', c10), ('cleared', c10), ('cleared', c11), ('moved to F', None), ('moved to F', None)],
 8: [('cleared', c12), ('moved to F', None), ('moved to F', None), ('still open', None)],
 9: [('moved to F', None), ('cleared', c13), ('cleared', c14), ('cleared', c13)],
 10: [('still open', None), ('moved to F', None), ('moved to F', None)],
 11: [('still open', None), ('moved to F', None), ('still open', None)],
}
for i, old in enumerate(original['gates']):
    assert len(old['blockers']) == len(blocker_map[i])
    for j, (decision, record) in enumerate(blocker_map[i]):
        paths = ['preflip-execution-plan.md', 'owner-answers.md', *g(i)['evidence']]
        if record:
            explanation = record['item']
        elif decision == 'moved to F':
            explanation = 'Retained as an explicit F duty, not cleared: ' + ' '.join(g(i)['atFinalPinUnderLease'])
        else:
            explanation = 'Still open with corrected scope/owner: ' + ' '.join(g(i)['blockers'] + g(i)['external'])
        parts = None
        if i == 9 and j == 1:
            parts = [cleared_part(c13)]
            explanation = 'Interim re-judgment/review is cleared; final source-delta review is not cleared and remains in G9 atFinalPinUnderLease/0 and the original final-pin occurrence.'
        if i == 6 and j == 0:
            parts = [cleared_part(c7), cleared_part(c7b)]
            explanation = 'W8 cleared the verifier-pin fix; W19 independently cleared the separate 25e8842d3 receipt-count correction. F refresh/combined-verifier duties remain open.'
        if i == 1 and j == 2:
            parts = [cleared_part(c3), f_part(g(1)['atFinalPinUnderLease'][0])]
        if i == 7 and j == 0:
            explanation = 'Both recomposed specs have independent per-spec APPROVE in W8.'
            parts = [cleared_part(c9), cleared_part(c9b)]
        decide(f'/gates/{i}/blockers/{j}', old['blockers'][j], decision, explanation, [i], paths, parts)
    decision = 'still open' if g(i)['blockers'] else ('moved to F' if i not in (4, 10, 11) else 'still open')
    parts = [cleared_part(r) for r in g(i)['cleared']]
    parts += [f_part(s) for s in g(i)['atFinalPinUnderLease']]
    if g(i)['blockers'] or g(i)['external'] or g(i)['ownerItems']:
        parts += [{'decision': 'still open', 'item': s, 'evidence': g(i)['evidence']}
                  for s in g(i)['blockers'] + g(i)['external'] + g(i)['ownerItems']]
    decide(f'/gates/{i}/remaining', old['remaining'], decision,
           g(i)['remaining'] or 'No local before-F work; keep the separately recorded F / owner / external duties open.',
           [i], g(i)['evidence'], parts)

before_map = [
    ('cleared', [0, 7], [c0]),
    ('cleared', [0, 4, 6, 7, 8], [c0, c5, c7, c12, c12b]),
    ('cleared', [6], [c8]),
    ('cleared', [5], [c5b]),
    ('cleared', [9], [c15]),
    ('cleared', [0, 1], [c4]),
]
for j, (decision, numbers, records) in enumerate(before_map):
    parts = [cleared_part(r) for r in records]
    if j == 0 or j == 1:
        parts.append(f_part('claim_2e2bc926 successor must be re-decided after final main import (L13-15.2); W19 cleared the separate candidate-row review debt.'))
    if j == 3:
        parts += [f_part(g(5)['atFinalPinUnderLease'][0]),
                  {'decision': 'still open', 'item': g(5)['ownerItems'][0], 'evidence': g(5)['evidence']}]
    if j == 1:
        parts.append(cleared_part(c7b))
    # The original G9 before-F demand is review/ownership, not completion of
    # the separate backlog/carried-owner actions retained in external.
    if j == 4:
        assert all(part['decision'] == 'cleared' for part in parts)
    decide(f'/cutoverReadiness/beforeFinalPin/{j}', original['cutoverReadiness']['beforeFinalPin'][j], decision,
           ('W21 B approves the complete G5 check; owner acceptance and F rerun remain explicit separate parts.' if j == 3 else
            'Original review/run demand reconciled by its parts below; existing reviews do not close new rebinds, owner actions or final-pin work.'),
           numbers, [p for n in numbers for p in g(n)['evidence']], parts)

final_numbers = [[0, 9], [9], [7, 9], [0], [7], [2], [6], [3], [5], [], [], [8], [], [0, 7], [0, 7], [9], [], [8], [0]]
assert len(final_numbers) == len(original['cutoverReadiness']['atFinalPinUnderLease'])
for j, item in enumerate(original['cutoverReadiness']['atFinalPinUnderLease']):
    numbers = final_numbers[j]
    paths = ['preflip-execution-plan.md', 'owner-answers.md', *[p for n in numbers for p in g(n)['evidence']]]
    if j == 1:
        decision = 'cleared'
        explanation = 'Record re-pins and the previousMainMergeAccounting exception inputCommit are independently reviewed (W10 sha-map; W11 scope-and-repin; W12 rejudge). L13-13.3 still requires keeping historical refs until track end, not until re-pin only.'
        parts = [cleared_part(c14)]
    else:
        decision = 'moved to F'
        explanation = 'Still a final-pin duty, not completed; use the corrected atFinalPinUnderLease projection.'
        parts = [f_part(s) for n in numbers for s in g(n)['atFinalPinUnderLease']]
        if j in (13, 14):
            explanation += ' W10 replaces earlier chain counts with 407 distinct (361 + 46), 556 assertions; W9’s 661 is not an additional backlog.'
        if j == 17:
            explanation += ' L13-13.4 applies to the expanded evidence/review set, not just historical 70/92.'
    decide(f'/cutoverReadiness/atFinalPinUnderLease/{j}', item, decision, explanation, numbers, paths, parts)

# External entries were outside the required three lists, but reconcile them too.
for j, item in enumerate(original['cutoverReadiness']['external']):
    numbers = [[4], [10], [11], [10], [8], []][j]
    decide(f'/cutoverReadiness/external/{j}', item, 'still open',
           'Retain the external decision/execution dependency; apply L13-12 A\' to review-branch ancestry and host-specific stop constraints, rather than the superseded L13-9 blanket wording.',
           numbers, ['owner-answers.md', 'preflip-execution-plan.md'])

# Read and fingerprint all evidence actually cited by the projection. This reads
# committed blobs only, even when a concurrent author is editing the same file.
for gate in register['gates']:
    for rel in gate['evidence']:
        source(BASE / rel)
log_range = '8a9385eca^..' + PIN  # all pre-flip waves, including imported ancestry
log = git('log', '--oneline', log_range).decode()
(OUT / 'plan-branch-log.txt').write_text(log)
local_ref_output = git('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads/archive/', 'refs/archive/').decode()
assert not local_ref_output, 'Reassess G8 if a local archive ref appeared before reconciliation generation.'

counts = []
for old, new in zip(original['gates'], register['gates']):
    counts.append({'g': new['g'], 'before': {
        'status': old['status'], 'blockers': len(old['blockers']), 'remainingEntries': int(bool(old['remaining'])),
        'cleared': len(old.get('cleared', [])),
    }, 'after': {
        'status': new['status'], 'blockers': len(new['blockers']), 'remainingEntries': int(bool(new['remaining'])),
        'cleared': len(new['cleared']), 'atFinalPinUnderLease': len(new['atFinalPinUnderLease']),
        'external': len(new['external']),
    }, 'originalDecisions': dict(collections.Counter(d['decision'] for d in decisions if d['sourcePointer'].startswith('/gates/' + str(register['gates'].index(new)) + '/')))})

receipt = {
    'version': 1, 'authority': 'L12-137; w17-gate-register-reconcile-brief; w21-register-catchup-brief; w23-register-corrections-brief; L13-18–20',
    'asOf': PIN, 'status': 'reconciled-not-cutover-approval',
    'followUp': {'sourceCommit': FOLLOWUP, 'ruling': 'owner-answers.md L13-17',
                 'inputs': FOLLOWUP_READ, 'settlementReceipt': 'census-join/receipt.md',
                 'settlementOutput': 'census-join/settlement.json',
                 'independentSettlementApproval': False},
    'reviewFollowUp': {'sourceCommit': REVIEW_PIN, 'inputs': sorted(REVIEW_INPUTS.values(), key=lambda r: r['path']),
                       'scope': 'W19 exact live-parity, 25 current rebinds and receipt-count approvals only; W20/W21 are a separate catchUp layer.'},
    'evidencePathBase': str(BASE),
    'method': 'Every required original occurrence is keyed by its JSON pointer and original text. Mixed sentences are decomposed into independently decided parts. Counts below count list entries, not unique defects or underlying claim populations; remaining is one original prose entry per gate and may overlap its blockers.',
    'impactAnalysis': 'degraded/unqueried: no fgOS CLI allowed and no impact-analysis MCP exposed; only records and new scoped verifier tooling change.',
    'priorArtReused': 'Existing phase-09 evidence-path convention, independent review verdicts, owner rulings and owning receipt counts; git history of the register and carriedBlocker inspected. No new product mechanism, no claim approval inferred from author tests.',
    'countsPerGate': counts,
    'readinessCounts': {key: {'before': len(original['cutoverReadiness'][key]), 'after': len(register['cutoverReadiness'][key])}
                        for key in ['beforeFinalPin', 'atFinalPinUnderLease', 'external']},
    'decisionCounts': dict(collections.Counter(d['decision'] for d in decisions)),
    'decisions': decisions,
    'catchUp': {'sourceCommit': CATCHUP_PIN, 'inputs': sorted(CATCHUP_INPUTS.values(), key=lambda r: r['path']),
                'scope': 'W20/W21 independent reviews and L13-18–19; 0288 REJECT is a Lead ruling, not a new reviewer verdict. Current replay is gate-reconcile/catchup-proof.json.'},
    'corrections': {'sourceCommit': CORRECTION_PIN, 'inputs': sorted(CORRECTION_INPUTS.values(), key=lambda r: r['path']),
                    'generatedEvidence': sorted(GENERATED_INPUTS.values(), key=lambda r: r['path']),
                    'scope': 'W22/L13-20 corrections only; G6/G9 packets are authored, not independently approved. Generated evidence is uncommitted, not an independent review.'},
    'newlyVisibleOpenItems': register['cutoverReadiness']['beforeFinalPin'],
    'scopeLimits': [
        'No parallel uncommitted carries/g0rework content read; original inputs come from git show at asOf, W18 and W19 from their separately fingerprinted committed layers.',
        'This is evidence reconciliation, not new independent review of the prior Doers, not proof that F work ran.',
        'No pair accounting, Git writes, fgOS CLI, lifecycle verbs, native addons, audit-report.py, npm test, Cargo suite or preview service.',
        'G0 scoped audit remains partial; missing native-dependent full checks belong to the final owning proof.',
        'Historical receipt status/counts are used only at their own pins and subordinate to the later scoped review/ruling.',
    ],
    'checks': {'currentCorrectionProofs': 'gate-reconcile/corrections-proof.json',
               'historicalCatchUpProofs': 'gate-reconcile/catchup-proof.json',
               'command': 'python3 -B ' + str(BASE / 'gate-reconcile/verify.py'),
               'exit': 0, 'output': 'gate-reconcile/verification.json',
               'controlsCommand': 'python3 -B ' + str(BASE / 'gate-reconcile/controls.py'),
               'controlsExit': 0, 'controlsOutput': 'gate-reconcile/controls.json',
               'nativeAddons': 'Current Node descendants inherited --no-addons; historical cleanup logs additionally record a scratch process.dlopen blocker.',
               'scopedCleanupProofs': 'gate-reconcile/reproduction.json',
               'initialFailure': 'Historical first reconciliation: verification exited 1 because its own not-yet-created verification.json was listed as input evidence. The output is now named as output, not self-referential input; no missing source path or ancestry check was bypassed.'},
    'planBranchLog': {'command': 'git log --oneline ' + log_range, 'lines': len(log.splitlines()), 'path': 'gate-reconcile/plan-branch-log.txt'},
    'localArchiveRefs': {'command': 'git for-each-ref --format=%(refname) %(objectname) refs/heads/archive/ refs/archive/', 'stdout': local_ref_output},
    'needsWrites': [],
}
dump(ROOT / BASE / 'preflip-gate-status.json', register)
dump(OUT / 'receipt.json', receipt)
dump(OUT / 'sources.json', {'asOf': PIN, 'inputs': sorted(READ.values(), key=lambda r: r['path']),
                           'reviews': review_inventory, 'reviewFiles': len(review_inventory)})
lines = [
    '# Gate register reconciliation', '',
    f'Original reconciliation inputs: `{PIN}`; W18/L13-17 inputs: `{FOLLOWUP}`; W19 review inputs: `{REVIEW_PIN}`; W20/W21/L13-18–19 catch-up: `{CATCHUP_PIN}`; W22/L13-20 corrections: `{CORRECTION_PIN}`. Each committed layer and the six newly generated evidence files are separately fingerprinted in receipt.json. All historical source fingerprints are retained. No parallel uncommitted carries/g0rework/review bytes were read.', '',
    '## Result', '', register['cutoverReadiness']['summary'], '',
    'Met-local is a pre-F scheduling classification, **not** final gate acceptance. Owner/external/F work stays open.', '',
    '## Counts per gate', '',
    'Counts are register entries, not distinct underlying defects. The prose remaining entry can overlap blockers.', '',
    '| Gate | Status before → after | Blockers before → after | Remaining entries before → after | Cleared | F duties | External |',
    '|---|---|---:|---:|---:|---:|---:|',
]
for row in counts:
    b, a = row['before'], row['after']
    lines.append(f"| {row['g']} | {b['status']} → {a['status']} | {b['blockers']} → {a['blockers']} | {b['remainingEntries']} → {a['remainingEntries']} | {a['cleared']} | {a['atFinalPinUnderLease']} | {a['external']} |")
lines += ['', '## Important boundaries', '',
          '- G2: W20/W21 review chain closes settlement/citation rework. L13-19.1 settles 0288 as non-document diagnostic REJECT. Current 1,126 = 779 proof joins + 289 unchanged grades + 54 settlement REJECTs + 4 citations; zero open judgment. Post-pin/F duties remain open.',
          '- G6 is partial: W8 approved park classification, not premises. The 787 authored judgments await exhaustive independent reviews; 36 owned coding-placement choices stay before F. Only 137 unbound rows and reviewed-action composition stay in F. See fWindowSize for source-derived counts.',
          '- G0 F join duty carries W16 F5: duplicate /bindingRefresh/124..126 follows later rebinds of /6, /20, /21. G3 F placement pre-existed in the old register; W3 is not its authority.',
          '- Import-3: all 98 rows reviewed APPROVE; 8 adapted rows are included in the 24 new source rows, not additional rows.',
          '- G0 is partial under the strict executable join: historical W14/W19 and W9/W10 semantic reviews remain scoped, but absent per-row digests and aggregate-only approvals are not invented. g0join/receipt.md records exit 1 and the exact gaps.',
          '- G1: W19 independently approves the L13-16 live-parity correction and 25 rebinds; W20 B approves the stale-duty control and duplicate-heading cleanup. Two disclosed drifted patches stay at F.',
          '- G9 is partial pending independent review of the 33 local decisions in g9/phase9-decisions.json. WORK/registry exports alone remain external; two backlog-intent choices are ownerItems. Historical scoped W15/W16 approvals do not approve this new packet.',
          '- G5: W21 B approves check-b57e79625.json (exit 0, 1 verbatim / 8 restated / 1 not applicable). Only owner acceptance of 8 exact restatements and the F rerun remain open.',
          '- G8: W20 C independently approves f67e0f676. L13-18 defers the create-only LOCAL archive ref, with custody, to the F rebuild before G10; S2 publication stays owner-gated. No Git mutation here.',
          '- Historical residual sizing is 407 distinct = 361 chain-caused + 46 pre-existing, 556 assertions at W10. Earlier 661 is not an additional population; F must re-enumerate.',
          '- L13-12 replaces L13-9 review-branch/blanket stop wording; no release, lease, publication or cutover permission is inferred.', '',
          '## Every original item', '',
          'The machine receipt preserves each original pointer/text (historical, not a current instruction), explanation, exact evidence paths and independently decided parts of compound entries. Below, evidence groups are linked once instead of repeating their full path lists for every overlapping occurrence. A cleared review demand does not clear the F/owner parts of a compound sentence; those parts are explicit in `receipt.json` and in the register.', '',
          '| Original pointer | Original item | Decision | Evidence group |',
          '|---|---|---|---|']
for row in decisions:
    item = row['item'].replace('|', '\\|').replace('\n', ' ')
    refs = ', '.join(f'[{name}](#{name.lower()}-evidence)' for name in row['gates']) or '[Common](#common-evidence)'
    lines.append(f"| `{row['sourcePointer']}` | {item} | {row['decision']} | {refs} |")
lines += ['', '## Evidence groups', '', 'Paths below are phase-09-relative. Historical/committed correction layers and six new scoped artifacts are distinguished and fingerprinted in receipt.json; generated artifacts are not independent reviews.', '',
          '### Common evidence', '', '`owner-answers.md`, `preflip-execution-plan.md`.', '']
for gate in register['gates']:
    lines += [f"### {gate['g']} evidence", '', ', '.join(f'`{p}`' for p in gate['evidence']) + '.', '']
lines += ['## Reproduce', '',
          '`python3 -B ' + str(BASE / 'gate-reconcile/verify.py') + '`', '',
          'Checks every cited evidence/review path, cleared commit ancestry, exact quoted verdicts, all historical/correction fingerprints, generated-artifact hashes, original occurrence coverage, packet-before-lease order, owner/F/external projections and source-derived F-window counts. Exit 0; see verification.json. controls.py exits 0 with 14 rejecting controls: the existing 10 plus false correction/generated fingerprints, inverted packet order and false F-window size. No prior assertion is removed. Only verification.json /checkedAtHead is volatile; restore it after replay, preserving current results.', '',
          'Let P=plans/260925-documentation-authority-unification/reports/phase-09. Current correction argv/exits/stdout/stderr and deterministic hashes are in corrections-proof.json. corrections-attempts.json preserves the initial exit-1 generator attempt (G5 owner acceptance was moved to ownerItems but one accounting consumer still indexed external); the consumer is migrated, not the duty removed. The following catch-up table is historical at cf13e2bd, not this turn’s proof.', '',
          '| Command | Exit | Evidence |', '|---|---:|---|',
          '| P/census-join/join.py --pin ' + CATCHUP_PIN + ' — final run 1 | 0 | catchup-proof.json |',
          '| Same command — final run 2 | 0 | stdout/stderr and five join/citation outputs byte-identical |',
          '| python3 -B P/g5/check.py --pin b57e79625 | 0 | byte-equal to g5/check-b57e79625.json; 31 controls |',
          '| python3 -B P/gate-reconcile/reconcile.py — twice | 0 / 0 | all generated outputs byte-identical |',
          '| python3 -B P/gate-reconcile/verify.py | 0 | verification.json; checkedAtHead restored afterward |',
          '| python3 -B P/gate-reconcile/controls.py | 0 | controls.json; 10 rejecting controls |', '',
          'Historical catch-up reused the generator, settlement branches and verifier seams; its immutable evidence layer is retained. This turn adds W22/L13-20 correction inputs and explicitly labelled generated artifacts, not new review approvals. 0288 is a Lead-authorized REJECT (L13-19.1), not an invented independent review. No final-F acceptance, lease, ref creation or publication occurs here.', '',
          'Current correction commands and exits (including non-zero G0 gap reports) are in corrections-proof.json and ../g0join/commands.json; the catch-up table above is historical. Historical cleanup logs remain unchanged in reproduction.json, misc-replay.json, ../census-join/replay.json and ../carries/cleanup-verification.json. They are not this turn’s proofs. sources.json keeps all original input fingerprints; receipt.json fingerprints W18, W19 and W20/W21/rulings separately. plan-branch-log.txt remains the original snapshot history. No product suite, native load, old authoring checker, Git mutation, fgOS CLI, pair accounting or preview service was used. Impact-analysis is degraded/unqueried under the no-CLI/no-MCP boundary. Scratch uses tempfile directories under /tmp/fgos-work/ and is removed. needsWrites: [].', '']
(OUT / 'receipt.md').write_text('\n'.join(lines))
print(json.dumps({'gates': len(register['gates']), 'originalOccurrences': len(decisions),
                  'reviewsRead': len(review_inventory), 'inputs': len(READ)}, indent=2))
