# A38 review verdict: Step 7 reader key 01

Reviewer: reviewer:sonnet-session:a0613bb7e406acd4a@2026-10-17
Author session: `codex-session:fgos-run_unit-run-17922255a98df5@2026-10-17`
Review mode: ordinary
authoredBy (this report): reviewer:sonnet-session:a0613bb7e406acd4a@2026-10-17 (authored none of the reviewed content)
Reviewed runner commit: `e9c1996a31a9bb6346f6e9dd72ddcd25232c90e9` (detached read-only worktree `/home/vantt/projects/forgentX-s8-review`, status clean before and after)

## Verdict: ACCEPT, sealed. 106 of 106 entries accepted; no rework, no stop.

Not run (per assignment): fgos CLI, npm test, native sync, inventory, comparator, generators. Not recomputed: proof sections A (history ratchet), C, I and the Step 9 carry. See "Limits".

## Pins (all match the request)

| Input | SHA-256 | Match |
|---|---|---|
| step-07-reader-brief.md | 55abc55f0bd8190420c817b0a93c4c2cdfd1bfd0f8a15e1b8903161f735f9607 | yes |
| step-07-reader-key.md | b7abe144cd2deaf1b8ba166838ebb6bd568cd50f8640b9a7df83ca4b981e6287 | yes |
| step-07-reader-gap-map.md | bb89f34e808c6f64162c9cbda8767bf7dba9df8c55675ab29fc1883c23f656c4 | yes |
| step-07-proof.json | 998448812d150c566d8bb28afce102cbb921cfe1f09cf33321cc34fafdd15697 | yes |
| part-01-gaps.json (12585 B) | 189eff83f75dbcd87def09ef2985666919567f5e1d451fe7ad85c2383212f226 | yes |
| part-02-key.json (11155 B) | 1830cb41c229bad536069cb826c0a0bc88f1b76fed851a7693e3668de1f19458 | yes |
| 8 candidate files | see seal block; each `sha256sum` equals the request table | yes |

## Part 1: gap dispositions (52 entries)

Independent derivation: I extracted the numbered "area gaps" lists from the five 261015 score reports (whole-system 10, root-authorities 8, runner 7, specs-ui 12, proposals 8) and the host-checkpoint notes section (6: no risk rubric, obsolete npm-bin clause, ten-step procedure, release-manifest owner, no area DoD, whole-run budget exceeded). Total 51, identical to the map's 10/8/7/12/8/6. I also grepped the raw reader answers of all five 261015 batches and the host checkpoint for gap/conflict/could-not statements; every theme found (CTR010 collision, roadmap/topology route, scratchpad home, ratchet exception, owner outside scope, switchboard-binding ambiguity, RUL92/96 and 0062 provenance, plan-loop owner absent, proposal registration, 8-file overshoot) maps to a numbered row. No omitted gap.

Deferred content gaps are named as deferred with a stated phase (Phase 8 protected routing, Phase 9 truth, Step 9 P7-DOC-GAP-02/03); none is presented as repaired. Claimed repairs verified on bytes at e9c1996a3:

- whole-2/4/6, host-5: README system-architecture row (four routes plus topology roadmap and system vision), map section 9, boundary section 5 and L5 links all present and resolving.
- ui-1: README rows for agent-confinement, claude-plugin, decision-citation-drift, distillery, herdr-web-dashboard, observe, ui-spec all present, targets exist.
- runner-4, ui-11: runner and ui-spec READMEs gain boundary section 5, governance and L5 links.
- root-4: work-state README row links ADR 0007 anchor, exists.
- proposals-2/4/6: proposals README lists exactly the 14 non-index markdown files in the folder (verified by `ls`); proposal shape link `documentation-system-design.md#67-proposal` exists.
- runner-1/2: runner README known-conflicts item 7 names RUL76 idle-timeout (pre-existing route).
- host-4: packaging-distribution and host-invocation-routing rows present.
- whole-1: CTR010 Gateway row, CTR011 confinement, CTR012/013 present in map section 7.

| Entries | Verdict |
|---|---|
| whole-1..10 | ACCEPT (10) |
| root-1..8 | ACCEPT (8) |
| runner-1..7 | ACCEPT (7) |
| ui-1..12 | ACCEPT (12) |
| proposals-1..8 | ACCEPT (8) |
| host-1..6 | ACCEPT (6) |
| supplemental-cautions | ACCEPT. New holder-lock, process and event-store routes exist; Event Store stays draft/unsigned; key relies on no missing distribution or law-projection row. |

Part 1 total: 52 ACCEPT.

## Part 2: key (54 entries)

Anchors (41): the 41 distinct `path#anchor` refs I extracted from the key equal the 41 `anchor-NN` refs in part-02 (set difference empty both ways). `node scripts/list-doc-anchors.mjs --check` exits 0 for all 41 (negative control `process/spec.md#nope` exits 1). I read the cited text and confirmed support for the intended answers, including:

- process section 3 (unreadable start time = unknown, pid reuse = dead, namespaces = unknown/hold, zombie dead), section 4 (signal by identity, pidfd), section 7 limits;
- holder-lock section 1 (no decision from pid/TTL/start time/mtime), section 2 (live holder never taken over; Process judge not owned), section 3 port, section 4 guarantee levels, section 8 predecessor rule, section 13 setup/doctor checks, section 14 limits;
- event-store header (Draft v2, owner signature pending, implementation not started, Canonical: No), section 3, section 4 (event-seal 58 under state 60 throws `lock-order-violation`; event-append 70 allowed), section 17, sections 23/24/26 (L3 clauses 2 and 3, DB as view, stand; D-ID placeholder unsigned);
- foundations L3/L5/L9/L10 and section 2; governance sections 3/4/5/11 (all 12 baseline metadata fields present); map sections 7 and 9; boundary sections 4/5/15.

All anchor-01..anchor-41 ACCEPT (41).

Scenario checks:

- scenario-A ACCEPT: seven questions (six L5 plus authoring probe). Key cites 5 files (README, map, governance, holder-lock, process); the witness adds foundations for L5. Fits 8-file budget; no legacy owner.
- scenario-B ACCEPT: README, event-store, governance, holder-lock, foundations (5).
- scenario-C ACCEPT: README, map, boundary, governance, foundations, process (6).
- Union recomputed from the key text: 8 files total, exactly the brief list; no ninth file needed, no source/legacy/contract payload needed. External package contracts and tests are pointers only.

Candidate snapshots candidate-1..8 ACCEPT (8): each full-file SHA-256 equals the request table.

Boundary and isolation:

- mutation-boundary ACCEPT. `git diff bfca3d516 e9c1996a3 --stat` touches only: five READMEs under docs/platform (README, proposals, runner, ui-spec, work-state) and phase-07 report files. The five edits are logged in `post-review-edits.md` ("Step 7 navigation edits") with before and after SHA-256; I verified every "after" hash against the files and every "before" hash against `git show bfca3d516:`. The diffs are link and row additions only, and every added link target exists. The eight candidate files are byte-identical to the request pins. H recomputed: `env -u CLAUDE_CODE_SESSION_ID node scripts/check-doc-candidate-status.mjs --strict --json` exit 0, 612 files, 217 checked, 0 findings (matches proof). B recomputed: the five pinned script blob hashes equal `git hash-object`.
- seal-and-isolation ACCEPT. Brief and key both carry the post-cutover frame (legacy as provenance only, unknown stays unknown, Event Store draft stays draft, cutover accepts nothing). Brief forbids key, request, reports, source, legacy and switchboard reads; scenario premises are assessment tasks, not implementation instructions or law supersessions. Strict scoring (5/6 each, partial zero, three probes, eight files whole-run, no fabricated anchors) is stated in the key.

Part 2 total: 54 ACCEPT (41 anchors, 8 candidates, 3 scenarios, 2 boundary).

## Non-blocking advisories (not rework)

1. Key C3 lists CTR005 as "approval/merge" without noting the map marks it `planned (STR17)`. The key already says exact API schemas are unverified and requires only state, execution/evidence and completion obligations; a reader stating "planned" is correct. Scorer should not penalise either wording.
2. The key's A answers cite 5 files while the witness lists 6 for A (foundations for L5). Union is 8 either way.
3. The README "current source during migration" column still points at legacy paths. The post-cutover frame and key do not need them as owner, so no stop; Step 9 owns that truth.
4. The event-store header `Related:` paths use pre-migration forms (docs/platform-foundations.md). Pointers only; no key answer depends on them.

## Limits

- Proof sections A (history ratchet over 15 commits), C and I were not recomputed (their generators/comparators are prohibited here); I and the imported-route/frozen-I limitation, and H's limitation that Event Store is unrouted by the protected switchboard (H checks 217 routed docs only), are preserved as disclosed in the proof. No native identity or full-truth close is claimed. Full npm test is not run (Step 9).
- Reader execution and scoring were not performed; this review covers key, brief, gap map, anchors and navigation only.

## Evidence commands

`sha256sum` on pins and 8 candidates; `git diff bfca3d516 e9c1996a3 --stat`; `git --no-pager diff ... -- <5 READMEs>`; `node scripts/list-doc-anchors.mjs --check <ref>` for 41 refs; link-target existence script over the five READMEs; `ls docs/platform/proposals`; `check-doc-candidate-status.mjs --strict --json`; `git hash-object` for proof B.

## Seal

```json
{
  "sealedAt": "2026-10-17T08:31:30Z",
  "keySha256": "b7abe144cd2deaf1b8ba166838ebb6bd568cd50f8640b9a7df83ca4b981e6287",
  "keyPath": "plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-key.md",
  "runnerCommit": "e9c1996a31a9bb6346f6e9dd72ddcd25232c90e9",
  "reviewer": "reviewer:sonnet-session:a0613bb7e406acd4a@2026-10-17",
  "candidates": {
    "docs/platform/README.md": "e684084bd7f480ceaec329e2bbcee9da6f55db9755436305f7e8619d3b6b63ee",
    "docs/platform/architecture-map.md": "62a92dc3cf248e02ffc6be3d341858b3351f2cc3b3c2e90fbc1b6add9099a165",
    "docs/platform/component-boundary.md": "65c27c782a9323f723307f2a449ebf0b41efa18a7a341a7e308735296b272871",
    "docs/platform/event-store/spec.md": "4348ba168489493017e0c95bfbee0c44fe511f7522d4aeed1d54310aff9ce472",
    "docs/platform/governance.md": "0e7d820925c594df12b2895a18158fdb91a2e2c5cf257f5d61463b3e9f7af536",
    "docs/platform/holder-lock/spec.md": "e600666ed6bec9809ec377f0254c7c3e2ef5dd1b07e6b5933a7a1fba8bd0b1b7",
    "docs/platform/platform-foundations.md": "1cfda337e23e4b5f8a5f1a6cf65346f553a1668c49888ab7b44df02595412223",
    "docs/platform/process/spec.md": "dbca061feff054beb0141739936b2e91a127805b80afdf040ba8ec2bd983c28e"
  }
}
```

Reader start timestamps must be later than `sealedAt`; any candidate, key or brief byte change invalidates this seal. Step 7 may be marked accepted and Step 8 ready by the Lead.
