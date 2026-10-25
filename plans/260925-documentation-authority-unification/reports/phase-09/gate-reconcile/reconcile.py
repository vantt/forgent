#!/usr/bin/env python3
"""Rebuild this records-only reconciliation from its immutable turn-start snapshot.

No product checker, native addon, fgOS CLI, git mutation or concurrent working-tree
input is used. Outputs are confined to the two paths granted by the brief.
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
READ = {}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def source(path):
    path = str(path)
    data = git('show', f'{PIN}:{path}')
    READ[path] = {'path': path, 'sha256': hashlib.sha256(data).hexdigest()}
    return data.decode()


def load(rel):
    return json.loads(source(BASE / rel))


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


original = load('preflip-gate-status.json')
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

# Reuse the register's phase-09-relative path convention, now made explicit.
register['asOf'] = {
    'commit': PIN, 'date': '2026-10-25', 'finalPinF': None,
    'basis': 'Immutable committed turn-start snapshot only (git show ' + PIN + ':path), including every reviews/ file, L13-1..L13-16 and the owning receipts. Concurrent carries/** and g0rework/** edits are excluded. Scope-specific APPROVE/FIXED/pass does not turn an overall REWORK into approval of a whole gate. met-local means no unowned local work remains before F; owner/external/F duties remain explicit, not accepted or completed.',
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
    rows = data.get('verdicts', data.get('findings', data.get('rows', [])))
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
    'Record F and join every frozen changedBindings row plus every later rebind/re-decision to its effective ledger row and an independent APPROVE at matching bindingSha256/targetUnitDigest; zero missing, mismatched or open REWORK (execution plan §2 G0, §3 W3). The 73/257 mismatch count is historical at 77db6ed2b, not a current count.',
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
g(2).update(status='met-local', commit='b25dadae2',
    note='Reviewed custody at 3d0169f39: 1,126 ids = 646 owning-proof joins + 293 REJECT confirmations + 187 owned judgments. Post-pin delta: 143 dynamic sites (87 proof joins / 56 source judgments) and 16 literals, including 8 open judgments. W3 approves their recorded ownership, not settlement of those judgments. The 33 moved Rust proof locators and combined verifier pin remain F work under L13-9.4; no current-pin or final coverage is claimed.')
g(2)['atFinalPinUnderLease'] = [
    'Re-run census-join/join.py --pin F --rescan; refresh the 33 moved Rust locators, settle/review the 187 original owned judgments and 8 open post-pin literal judgments plus any new F delta, and obtain current-pin delta review (execution plan §2 G2 / §3 W3; L13-9.4).',
    'Refresh G2/G6 to a shared F pin and make preserve-premise/verify.py exit 0 without weakening its pin equality (L13-9.4).',
]
evidence(2, 'census-join/receipt.md', 'owner-answers.md', 'preflip-execution-plan.md')
g(3).update(status='met-local', commit='f534aeaea',
    note='All 17 dropped ids have independent per-id APPROVE at cffe725b9, with dropped-010 superseded and no tie. Subsequent target edits do not inherit those approvals; final current-anchor/digest and register-status reconciliation is still required at F, as the existing execution plan W3 requires.')
g(3)['atFinalPinUnderLease'] = [
    'Re-check all 17 restored/superseded targets at F anchors/digests; delta-review changed targets and replace restored-pending-review / superseded-pending-review with final dispositions (execution plan §2 G3 / §3 W3).',
]
evidence(3, 'preflip-execution-plan.md')

# G4: the Lead wording fix did receive an independent review; owner review did not.
c5 = clear(4, '53499dc9d (w6 spec-sentence REWORK fix) not independently re-reviewed.',
           ['53499dc9d'], 'w8-lead-fixes-review', 'git-spec-escape-sentence')
g(4).update(status='met-local', commit='53499dc9d',
    note='Local declaration/wrapper/escape repairs are independently reviewed, including the Lead’s scoped spec sentence in W8. Scanner residual alias-export inheritance remains explicitly owned by Git/HARDEN, not claimed fixed. The 25 declarations require that owner’s review. L13-12 replaces L13-9’s impossible selective-SHA push with full plan-HEAD review branch A\'; WORK reported cutover xong on fg-server2, while design-lap still must not pull main.')
g(4)['external'] = [
    'Git owner / HARDEN reviews the 25 declarations and the explicitly open aliased-export declared-wrapper inheritance gap. Review branch review/doc-git-one-door must use full plan ancestry under L13-12 A\', not L13-9’s superseded selective-commit shape.',
]
evidence(4, 'owner-answers.md', 'reviews/w8-lead-fixes-review.json')

# G5: ten legacy spans are not proof of the surviving entry-union clause.
# The legacy run exists, but its owning review says REWORK on the missing
# surviving-target clause. Keep the original full-check request open; do not
# put a gate-level REWORK verdict into the cleared array.
g(5).update(status='partial', commit='25e8842d3',
    note='g5/check-b726d44ed.json proves 10 spans in the legacy reading-map / holder-lock files only. W8 independently confirms that limited check and explicitly REWORKs the missing surviving docs/reading-map.md entry-union clause. L13-10 sends acceptance of the English banner restatement and Truth-correction suffix to the owner’s cutover packet; it does not approve them or the missing check.')
g(5)['blockers'] = ['Extend g5/check.py with per-span surviving docs/reading-map.md locations and explicit proposed text for the banner restatement and Truth-correction suffix; obtain an independent check of that complete clause. The current 10-span legacy check is insufficient.']
g(5)['remaining'] = g(5)['blockers'][0]
g(5)['external'] = ['Owner acceptance of the surviving reading-map English banner restatement and the compounding/knowledge line’s Truth-correction suffix is required in the cutover packet (L13-10; w8-lead-fixes g5-check-implements-gate).']
g(5)['atFinalPinUnderLease'] = ['Re-run the full retention/accepted-surviving-span check at F (execution plan §2 G5 / §3 W3); do not treat the historical ten-span check as satisfying both clauses.']
evidence(5, 'owner-answers.md', 'preflip-execution-plan.md')

# G6: exhaustive coverage and delta review are both present.
c7 = clear(6, 'c5586146c (w7 pin fix) not independently checked.',
           ['c5586146c'], 'w8-lead-fixes-review', 'misc-verify-g6-pin')
c8 = clear(6, 'No exhaustive APPROVE over all 1,423 judgment/note rows and every overturn.',
           ['db023f065'], 'w9-g6-fix-review', 'item-7-receipts-and-scope',
           ['reviews/w8-g6-parks-review.json', 'reviews/w8-g6-judgments-review.json'])
g(6).update(status='met-local', commit='db023f065',
    note='W8 parks covers all 1,260 rows (1,220 APPROVE / 40 REWORK); W8 judgments covers 163 notes plus the overturn (163 APPROVE / 1 REWORK). W9 independently APPROVEs all seven fix items in db023f065. Current pin-scoped totals: 5,413 = 4,320 bounded confirmations + 924 owned parks + 163 dated notes + 6 repoint proposals; 1,093 action rows are not resolved by this reconciliation, but have reviewed custody/prepared work. Scoped proof replays are byte-identical. c5586146c’s verifier pin was independently approved in W8; the combined verifier is still an F obligation.')
g(6)['atFinalPinUnderLease'] = [
    'Refresh all preserve-premise evidence at F (the earlier 186 G6 rows / 86 wrapper digests are historical lower bounds, not current totals), replay twice byte-identically and obtain delta review (execution plan §2 G6 / §3 W3, L13-9.4).',
    'Co-compose the reviewed 163 dated wrapper notes, owned-park actions and 6 repoint proposals (including the prepared four-line dispatch patch), use actual flip date/placement, and validate them with the full F chain before cutover. Owned parks remain owned, not automatic preserves or blanket retirements (preserve-premise receipt; w9-g6-fix review).',
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

# G8: timing and retention APPROVE is not a present local archive ref.
c12 = clear(8, '984829939 direct-link retention and 5c3b57347 cold timing not independently reviewed.',
            ['984829939', '5c3b57347'], 'w14-g8-retention-timing-review', 'cold-timing-numbers-match-logs',
            ['reviews/w8-lead-fixes-review.json'])
g(8).update(status='partial', commit='f67e0f676',
    note='W8 and W14 independently approve the direct-link retention and real cold timing: 4 files / 783,918 B added; partition 6,918 = 6,026 archive + 892 retained at d3efc70c5; cold 2.93 s / 41.70 s, medians 2.904 s / 12.439 s. f67e0f676 moves contradictory sandbox receipt fields under historicalSandboxAttempt but no later independent review of that records-only fix is present. The local-ref requirement is not met merely by a disposable rehearsal ref; no archive ref exists in this repository’s refs/heads/archive or refs/archive at snapshot inspection.')
g(8)['blockers'] = [
    'Provide the authorized LOCAL archive ref with pinned custody evidence; archive/design.md says it existed only in the disposable rehearsal, whose scratch was removed. No repository-local archive ref was found. No push/main publication is authorized by this task.',
    'Independently re-review f67e0f676’s records-only fix for W14 w8-archive-receipt-json-stale; do not infer independent approval from the Lead’s edit. Keep the separate low documentation note about retained JSON path-string recovery visible.',
]
g(8)['remaining'] = 'Finish local archive-ref custody and the independent receipt-fix check; rebuild/readers/timing stay at F, publication stays owner-gated.'
g(8)['atFinalPinUnderLease'] = [
    'Rebuild partition at F and keep every evidence file named by this gate register, cleared-review provenance and the final status ledger; re-enumerate readers to zero unresolved and retime cold after G10 (L13-13.4; execution plan §3 W4). W14’s 70/92 archived evidence paths is an old count, not the expanded register’s current count.',
]
g(8)['external'] = ['Owner cutover approval S2 is required for archive ref publication and main manifest merge; local rehearsal is not that permission.']
evidence(8, 'reviews/w14-g8-retention-timing-review.json', 'archive/receipt.json',
         'owner-answers.md', 'preflip-execution-plan.md')

# G9: two owner backlog parks and 15 carried blockers are not 338 unjudged parks.
c13 = clear(9, 'Interim re-judgment of 518 + 144 records not done / no G9 review.',
            ['4f08d504d', 'bc2a6a014', '4c9e1f31e', '63c884240', '33cc5539d'],
            'w16-g0-rework-and-park-rule-review', 'B-pass',
            ['reviews/w10-g9-interim-review.json', 'reviews/w11-g9-rework-review.json',
             'reviews/w12-g9-followup-review.json', 'reviews/w15-g9-parks-review.json'])
c14 = clear(9, 'Doer-SHA provenance and previousMainMergeAccounting still unrepinned (w4-import2).',
            ['4f08d504d', 'bc2a6a014', '4c9e1f31e'], 'w11-g9-rework-review', 'scope-and-repin',
            ['reviews/w10-g9-interim-review.json', 'reviews/w12-g9-followup-review.json'])
c15 = clear(9, '338 mechanical parks await Lead re-judgment or an owner.',
            ['63c884240', '33cc5539d'], 'w16-g0-rework-and-park-rule-review', 'B-pass',
            ['reviews/w15-g9-parks-review.json'])
g(9).update(status='met-local', commit='33cc5539d',
    note='Interim work and rework have independent reviews. Current cohort is 574 physical records / 684 memberships, not 518+144 distinct rows: 526 still-valid, 15 needs-recomposition, 31 superseded, 2 owned backlog parks. All former 338 mechanical parks were reviewed and drift-only corrections approved in W16 B-pass. 15 inherited phase-08 /parked blockers remain open via carriedBlocker at their original owning records (L13-14). 546 prepared bodies; W16 sweep has zero drift/chain/body/judgment errors. Record SHA re-pins and the ratchet exception field are reviewed; L13-13.3 still keeps the two historical Doer refs.')
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
    note='L13-1 records SEAT’s staging agreement only; no release id, sourcePin/manifest provenance or installed-host four-route proof is present. L13-12 supersedes the blanket L13-9 WORK stop: fg-server2 reported cutover xong, design-lap must not pull main. This reconciliation neither authorizes a release/cutover nor treats host-specific constraints as a permanent blanket run ban.')
g(11)['external'] = ['SEAT stages release R from F code (manifest sourcePin provenance); Lead proves installed-host docs-lease acquire/status/release/abandon in a disposable clone without global activation (execution plan §2 G11).', 'Respect L13-12 host-specific stop/import constraints and the separate owner cutover approval; the superseded L13-9 blanket no-run/no-push wording is not the current rule.']
g(11)['atFinalPinUnderLease'] = ['Bind staged release R sourcePin to the F code commit and rerun G11/G10 on any relevant subsequent code change (execution plan §3 W4).']
evidence(11, 'owner-answers.md', 'preflip-execution-plan.md')

# Local, F and external lists are projections of the same per-gate decisions.
register['cutoverReadiness'] = {
    'summary': 'Met-local (not met at F): G2, G3, G4, G6, G7, G9. G0/G1 still need independent review of 25 new pending candidate rebinds; G1 also has the L13-16 live-parity REWORK. G5 lacks the surviving-map clause check and owner acceptance; G8 lacks repository-local archive-ref custody and independent review of its receipt correction. These local gaps still block the cutover approval packet. Owner backlog/carried blockers, HARDEN declarations/section 7 consent, SEAT release/routes and G10 rehearsal remain explicit external dependencies; F joins, post-apply rebinds, guards, census/G6 refresh, full-suite attribution and final status review remain unperformed. No cutover, publication, main import or lease is approved here.',
    'beforeFinalPin': [f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['blockers']],
    'atFinalPinUnderLease': [
        'Import main once with merge accounting and record final pin F; any later import reopens changed-path delta work (execution plan §3 W3).',
        *[f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['atFinalPinUnderLease']],
        'Pair-account every new plan-branch commit through the owning Lead/accounting turn; this reconciliation performs no pair accounting (execution plan §1 / §3).',
        'Run the full suite at F in an isolated clone with main-vs-branch attribution, plus native-dependent reproduction checks omitted by scoped Doer proofs; partial g0rework verifier output is not a green full audit (execution plan §8, L13-15.3; W17 F6).',
        'Every committed-byte check takes explicit --pin F; permanent proofs check authoring and live tree, with named machine-readable F duties and failure on unlisted drift (L13-13.2, L13-16).',
        'Write the final status ledger, independently review it, and only then assemble the owner cutover packet with remaining stops explicit (execution plan §9).',
    ],
    'external': [f"{gate['g']}: {item}" for gate in register['gates'] for item in gate['external']] + [
        'Owner separately approves cutover (lease + Land); L12-137 / this reconciliation is pre-flip only.',
    ],
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
 8: [('cleared', c12), ('moved to F', None), ('still open', None), ('still open', None)],
 9: [('moved to F', None), ('moved to F', c13), ('cleared', c14), ('cleared', c13)],
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
            parts = [cleared_part(c13), f_part(g(9)['atFinalPinUnderLease'][0])]
        if i == 1 and j == 2:
            parts = [cleared_part(c3), f_part(g(1)['atFinalPinUnderLease'][0])]
        if i == 7 and j == 0:
            explanation = 'Both recomposed specs have independent per-spec APPROVE in W8.'
            parts = [cleared_part(c9), cleared_part(c9b)]
        decide(f'/gates/{i}/blockers/{j}', old['blockers'][j], decision, explanation, [i], paths, parts)
    decision = 'still open' if g(i)['blockers'] else ('moved to F' if i not in (4, 10, 11) else 'still open')
    parts = [cleared_part(r) for r in g(i)['cleared']]
    parts += [f_part(s) for s in g(i)['atFinalPinUnderLease']]
    if g(i)['blockers'] or g(i)['external']:
        parts += [{'decision': 'still open', 'item': s, 'evidence': g(i)['evidence']}
                  for s in g(i)['blockers'] + g(i)['external']]
    decide(f'/gates/{i}/remaining', old['remaining'], decision,
           g(i)['remaining'] or 'No local before-F work; keep the separately recorded F / owner / external duties open.',
           [i], g(i)['evidence'], parts)

before_map = [
    ('cleared', [0, 7], [c0]),
    ('cleared', [0, 4, 6, 7, 8], [c0, c5, c7, c12]),
    ('cleared', [6], [c8]),
    ('still open', [5], []),
    ('still open', [9], [c15]),
    ('cleared', [0, 1], [c4]),
]
for j, (decision, numbers, records) in enumerate(before_map):
    parts = [cleared_part(r) for r in records]
    if j == 0 or j == 1:
        parts.append(f_part('claim_2e2bc926 successor must be re-decided after final main import (L13-15.2); current new candidate-row review debt is a separate before-F item.'))
    if j == 3:
        parts.append({'decision': 'still open', 'item': g(5)['remaining'], 'evidence': g(5)['evidence']})
    if j == 4:
        parts += [{'decision': 'still open', 'item': s, 'evidence': g(9)['evidence']} for s in g(9)['external']]
    decide(f'/cutoverReadiness/beforeFinalPin/{j}', original['cutoverReadiness']['beforeFinalPin'][j], decision,
           ('Legacy hash run exists, but W8 REWORK keeps the full surviving-target check open.' if j == 3 else
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
    'version': 1, 'authority': 'L12-137; w17-gate-register-reconcile-brief',
    'asOf': PIN, 'status': 'reconciled-not-cutover-approval',
    'evidencePathBase': str(BASE),
    'method': 'Every required original occurrence is keyed by its JSON pointer and original text. Mixed sentences are decomposed into independently decided parts. Counts below count list entries, not unique defects or underlying claim populations; remaining is one original prose entry per gate and may overlap its blockers.',
    'impactAnalysis': 'degraded/unqueried: no fgOS CLI allowed and no impact-analysis MCP exposed; only records and new scoped verifier tooling change.',
    'priorArtReused': 'Existing phase-09 evidence-path convention, independent review verdicts, owner rulings and owning receipt counts; git history of the register and carriedBlocker inspected. No new product mechanism, no claim approval inferred from author tests.',
    'countsPerGate': counts,
    'readinessCounts': {key: {'before': len(original['cutoverReadiness'][key]), 'after': len(register['cutoverReadiness'][key])}
                        for key in ['beforeFinalPin', 'atFinalPinUnderLease', 'external']},
    'decisionCounts': dict(collections.Counter(d['decision'] for d in decisions)),
    'decisions': decisions,
    'newlyVisibleOpenItems': [
        {'gates': ['G0', 'G1'], 'item': g(0)['blockers'][0], 'evidence': ['reviews/w17-parity-rework-review.json', 'carries/current-binding-refresh.json']},
        {'gates': ['G1'], 'item': g(1)['blockers'][0], 'evidence': ['reviews/w17-parity-rework-review.json', 'owner-answers.md']},
        {'gates': ['G8'], 'item': g(8)['blockers'][1], 'evidence': ['reviews/w14-g8-retention-timing-review.json', 'archive/receipt.json', 'archive/design.md']},
    ],
    'scopeLimits': [
        'No parallel uncommitted carries/g0rework content read; all input bytes come from git show at asOf.',
        'This is evidence reconciliation, not new independent review of the prior Doers, not proof that F work ran.',
        'No pair accounting, Git writes, fgOS CLI, lifecycle verbs, native addons, audit-report.py, npm test, Cargo suite or preview service.',
        'G0 scoped audit remains partial; missing native-dependent full checks belong to the final owning proof.',
        'Historical receipt status/counts are used only at their own pins and subordinate to the later scoped review/ruling.',
    ],
    'checks': {'command': 'python3 -B ' + str(BASE / 'gate-reconcile/verify.py'),
               'exit': 0, 'output': 'gate-reconcile/verification.json',
               'controlsCommand': 'python3 -B ' + str(BASE / 'gate-reconcile/controls.py'),
               'controlsExit': 0, 'controlsOutput': 'gate-reconcile/controls.json',
               'initialFailure': 'The first verification exited 1 because its own not-yet-created verification.json was listed as input evidence. The output is now named as output, not self-referential input; no missing source path or ancestry check was bypassed.'},
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
    f'Committed inputs: `{PIN}`. No parallel uncommitted carries/g0rework bytes were read.', '',
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
          '- G6: exhaustive W8 reviews plus W9 fix review exist; current totals are 4,320 confirmations, 924 owned parks, 163 notes, 6 repoints (5,413). Action ownership is not action execution.',
          '- Import-3: all 98 rows reviewed APPROVE; 8 adapted rows are included in the 24 new source rows, not additional rows.',
          '- G0: W14 reviewed 124 distinct rows, including the 3 Lead corrections. New 25 pending rebinds (8 changed target digests) still need current-row independent review.',
          '- G1: W17 live-proof defect remains at this snapshot: 4 stale headings and 1 uncovered block. L13-16 fixes those now; 2 drifted patches stay at F.',
          '- G9: 338 mechanical parks were judged; current dispositions are 526 / 15 / 31 / 2. The 2 backlog-owner parks and 15 inherited phase-08 blockers remain owned/open.',
          '- G5 has only the 10-span legacy check; surviving-map clause and owner acceptance are still missing.',
          '- G8 timing/retention is reviewed. Repository-local archive-ref custody and independent review of f67e0f676 are not established. The task performs no Git mutation.',
          '- Historical residual sizing is 407 distinct = 361 chain-caused + 46 pre-existing, 556 assertions at W10. Earlier 661 is not an additional population; F must re-enumerate.',
          '- L13-12 replaces L13-9 review-branch/blanket stop wording; no release, lease, publication or cutover permission is inferred.', '',
          '## Every original item', '',
          'The machine receipt preserves each original pointer/text, explanation, exact evidence paths and independently decided parts of compound entries. Below, evidence groups are linked once instead of repeating their full path lists for every overlapping occurrence. A cleared review demand does not clear the F/owner parts of a compound sentence; those parts are explicit in `receipt.json` and in the register.', '',
          '| Original pointer | Original item | Decision | Evidence group |',
          '|---|---|---|---|']
for row in decisions:
    item = row['item'].replace('|', '\\|').replace('\n', ' ')
    refs = ', '.join(f'[{name}](#{name.lower()}-evidence)' for name in row['gates']) or '[Common](#common-evidence)'
    lines.append(f"| `{row['sourcePointer']}` | {item} | {row['decision']} | {refs} |")
lines += ['', '## Evidence groups', '', 'All paths below are phase-09-relative and read from the committed snapshot, not current uncommitted files.', '',
          '### Common evidence', '', '`owner-answers.md`, `preflip-execution-plan.md`.', '']
for gate in register['gates']:
    lines += [f"### {gate['g']} evidence", '', ', '.join(f'`{p}`' for p in gate['evidence']) + '.', '']
lines += ['## Reproduce', '',
          '`python3 -B ' + str(BASE / 'gate-reconcile/verify.py') + '`', '',
          'Checks every cited evidence/review path, cleared commit ancestry at both snapshot and HEAD, exact quoted review verdicts, source fingerprints, original-item coverage and counts. The command exits 0; see `verification.json`. `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/controls.py` also exits 0: seven in-memory negative controls reject missing paths, an existing non-ancestor commit, invented quotes, false met-local status, omitted items, false counts and false fingerprints. See `controls.json`. The first verifier run caught a self-reference to its not-yet-created output; that output is now correctly labeled as output, with every real input check retained.', '',
          '`sources.json` inventories every reviews/ file plus required owning receipts at the committed snapshot; `plan-branch-log.txt` is the read-only pre-flip branch history from W0 through the snapshot, including imported ancestry. No product suite, native load or old authoring checker was run. Impact-analysis: degraded under the no-CLI/no-MCP boundary. No preview service was started under the exact records-only write grant.', '']
(OUT / 'receipt.md').write_text('\n'.join(lines))
print(json.dumps({'gates': len(register['gates']), 'originalOccurrences': len(decisions),
                  'reviewsRead': len(review_inventory), 'inputs': len(READ)}, indent=2))
