# A38 key re-seal review: Step 7 reader key (after main merge dd9486292)

Reviewer: reviewer:sonnet-session:a905d510ac8754cef@2026-10-17
Author session: `codex-session:fgos-run_unit-run-17922255a98df5@2026-10-17` (Step 7 Doer) plus Lead anchor repair (L11-19)
Review mode: ordinary
Reviewed commit: 5d6e6c727 (read-only worktree /home/vantt/projects/forgentX-s8-review, detached)
Verdict: REWORK. No seal.

## 1. Diff e9c1996a3..5d6e6c727 (key, brief, docs/platform)

- step-07-reader-brief.md: unchanged.
- step-07-reader-key.md: only 5 lines changed, all anchor repairs: A3 `holder-lock#16-related-files` -> `#21-related-files`; A5 and A6 `holder-lock#15-lịch-sử-quyết-định` -> `#20-lịch-sử-quyết-định`; B4 and B5 `event-store#23-proof-required-before-acceptance-of-the-implementation` -> `#23-proof-gates`. No answer text changed.
- docs/platform candidates changed (5 files):
  1. docs/platform/README.md (event-store row anchor repair only; row text unchanged).
  2. docs/platform/component-boundary.md (Holder-lock L1 row rewritten: now owns main checkout mutex, merge slot, worktree-admin, `fgos lock fence`).
  3. docs/platform/event-store/spec.md (large rewrite, see 3).
  4. docs/platform/holder-lock/spec.md (sections 14-18 added; old 15 and 16 renumbered to 20 and 21).
  5. docs/platform/packaging-distribution/contracts/repository-runtime-layout.md (not one of the eight files, not cited by the key; no effect).

## 2. Anchor checks (`env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check`)

- All 41 distinct docs/platform path#anchor citations in the key: exit 0 (0 failures).
- All 10 path#anchor links in docs/platform/README.md: exit 0.
- Anchors being valid is not enough, see 3.

## 3. Substance re-validation

holder-lock/spec.md (scenario A): sections 1, 2, 3, 4, 8, 13, 19, 20, 21 re-read. The new text adds main-checkout, merge-slot, `worktree-admin` and `fgos lock fence` (no takeover of a live holder, no pid or TTL). Every A answer is still supported, no legacy owner, within the eight-file budget.

event-store/spec.md (scenario B): the header now reads `Design status: Signed by the owner on 2026-10-17 (D-ADR0055)`, `Canonical: Yes`, `Implementation status: Not started`, `Supersedes: L3 clauses 1 and 4 ... D-ADR0003 data layout`. Section 26 is now a signed decision record (D-ADR0055, decision log seq 65; clauses 2 and 3 of L3 stand) and "Open for the owner" says nothing is open. The key's B answers were written for an unsigned draft.

| Answer | Verdict | Evidence |
|---|---|---|
| A1 | ok | README area registry; holder-lock/spec.md:33 (sec 2); process spec sec 3 unchanged |
| A2 | ok | holder-lock/spec.md:25-31, 35-43 (no takeover from live holder) |
| A3 | ok | holder-lock/spec.md:49-68 (sec 3), 141-153 (sec 8), 297-315 (sec 21 related files) |
| A4 | ok | holder-lock/spec.md:70-81 (sec 4); process spec unchanged |
| A5 | ok | holder-lock/spec.md:210-227 (sec 13 setup/doctor/activation vectors), 280-295 (sec 20 history) |
| A6 | ok | holder-lock/spec.md:280-295 (sec 20); governance unchanged |
| A7 | ok | holder-lock/spec.md:49-68; governance and process unchanged |
| B1 | ok | event-store/spec.md:105 (sec 3); holder-lock/spec.md:155-166 (sec 9) |
| B2 | REWORK | event-store/spec.md:5-15 (signed, canonical, implementation not started, supersedes L3 clauses 1 and 4), :716 (sec 26 D-ADR0055). Key says "draft v2, owner signature pending ... proposed supersession" |
| B3 | ok | event-store/spec.md:105-147 (sec 3, 4: event-seal 58 under state 60 throws, event-append 70 allowed), sec 6, 7, 9, 17 present |
| B4 | REWORK | event-store/spec.md:716 and header. Key says "draft status is not law supersession" |
| B5 | ok | event-store/spec.md:610-700 (sec 23.2 items 1-13: kill matrix, reader stress, Work gate races, three machines, legacy parity, rollback, setup/doctor, full npm and cargo tests; sec 24 limits). Anchor `#23-proof-gates` valid; 23.1 pre-signature proofs are marked done, so "acceptance owner" should name 23.2 |
| B6 | REWORK | event-store/spec.md:716, :780. Key says "No placeholder D-ID is a signed decision"; D-ADR0055 is now signed |
| B7 | REWORK | event-store/spec.md:716 (clauses 2 and 3 of L3 stand), :780. Key says "draft's retained DB-view clause ... pending decision" |

Other cells (C1-C7) cite only unchanged files; the single component-boundary change is the Holder-lock row, not cited by any C answer. Spot-checked: unchanged by construction (git diff lists no other docs/platform file).

Further finding (candidate, not key): docs/platform/README.md:55 still says "Draft durability design; decision awaiting signature". This is now false against event-store/spec.md:7 and :716, and readers start at the README. Also platform-foundations.md L3 (lines 164-190) still lists clauses 1 and 4 as law with no note of D-ADR0055 (the spec says it supersedes them), and component-boundary.md:84 still says state store locks "stay with the state store until the event store decision". These make a reader's B answers conflict with their own cited sources.

## 4. Required fix (exact)

Candidate edits (outside the key; Lead decides, then re-hash and re-request review):
1. docs/platform/README.md:55: replace "Draft durability design; [decision awaiting signature](...#26-decision-record) and [proof required](...#23-proof-gates); navigation does not accept or implement it" with wording that the spec is a signed design (D-ADR0055, 2026-10-17), implementation not started, with the same two links.
2. Decide and record the reconciliation of platform-foundations.md L3 (supersession note for clauses 1 and 4 per D-ADR0055, using a new decision id, never an in-place rewrite, per L3) and the component-boundary.md:84 "until the event store decision" phrase. If this is intentionally deferred to Step 9, the key must say so (see B4/B6).

Key edits (step-07-reader-key.md, same anchors):
- B2: "Event Store spec is signed (D-ADR0055, 2026-10-17), the contract for starting implementation under the section 23 gates; implementation not started. The proposal is a durability/contract change that supersedes L3 clauses 1 and 4; clauses 2 and 3 (DB is a view) stand." Anchors: `event-store/spec.md#event-store-component-specification` (header), `#26-decision-record`, `platform-foundations.md#2-authority`.
- B4: "High: acknowledged loss, deadlock/order violation, unrebuildable view. A signed design is not an implemented one; implementation not started and 23.2 gates unmet. L3 text in foundations is still unreconciled; changing a locked law supersedes its decision id, never in-place rewrite." Keep the same four anchors.
- B5: change "Section 23 is the acceptance owner" to "Section 23.2 (23.1 is the done pre-signature set)"; same anchors.
- B6: "Preserve the signed D-ADR0055 and the law text separately from implementation status; reconcile foundations L3, component-boundary and affected owner docs; no new D-ID is assumed signed." Anchors unchanged.
- B7: "Invented DB-truth claim conflicts with L3 clause 2 and D-ADR0055, which keeps the database a rebuildable view; route as a change proposal superseding a signed decision, at foundations plus Event Store section 26, never as a new fact in a cache guide." Rest unchanged.
- Update part-02-key.json and step-07-proof.json to match, recompute hashes (README, component-boundary, foundations if touched, event-store spec, key).

Advisory (kept): accept either CTR005 wording.

## 5. Seal

NOT SEALED. Candidate hashes at 5d6e6c727 for reference only (will change after rework): key a638b02e77c2cb925c74233a03082b9f6a9fa126fd84836fc0db08aca0d90919.

Status: DONE
Summary: Not sealed (key sha256 a638b02e... at 5d6e6c727). Anchors all valid (41 key + 10 README exit 0) and A1-A7, B1, B3, B5 hold; rework B2, B4, B6, B7 (spec now signed D-ADR0055, key says draft/unsigned), tweak B5 wording to 23.2, and fix the stale README row (line 55) plus the foundations L3 and component-boundary:84 reconciliation or its explicit deferral.
