# G9 per-record source-binding review

## Current drift-only park correction

Check pin: **`72077976bbc6ffb64ba9478553258bedc2d0050d`**, resolved at turn start.
This is not final pin F or independent acceptance. The sections below are
historical receipts at their own pins, not current counts or instructions.
Read first: `../w15-g9-park-rule-brief.md` and
`../reviews/w15-g9-parks-review.{md,json}`. Only `g9/**` was written.

G9 now answers **whether source drift breaks the recorded claim**. A missing
phase-08 export, inventory or retention decision is not itself G9 drift.
`judge.py` carries every nonempty record-level `/parked` list as
`carriedBlocker`; `sweep.py` rejects its omission, incorrect record/hash/pointer
or closed status. The original record remains unchanged and keeps its owner.
This also applies to the retired assignment-policy row: G9 retirement does not
silently close the earlier blocker.

### Counts before and after this correction

| Disposition | All before | All after | Original 338 parks before | Original 338 parks after |
| --- | ---: | ---: | ---: | ---: |
| still-valid-as-recorded | 517 | 526 | 288 | 296 |
| needs-recomposition | 20 | 15 | 13 | 9 |
| superseded-or-retired | 32 | 31 | 32 | 31 |
| owned-park | 5 | 2 | 5 | 2 |
| **Total physical records** | **574** | **574** | **338** | **338** |

The 15 blocker-bearing records move from **5 valid / 5 recomposition / 1
superseded / 4 parks** to **13 valid / 0 recomposition / 1 superseded / 1 park**.
The existing evidence cohort remains 574 physical records, with revisions
separate; no pair accounting. `cli-help-messages:3` was outside the original
338 review rows, so it receives one additional explicit review, not a changed
population denominator: **339 authored reviews**, **4,113 full deltas**, and
**14,969 passage occurrences read**. `park-rule-audit.json` retains every
before disposition; `park-rule-commands.json` records the proof sequence.

### All 15 carriedBlockers

Let `R=plans/260925-documentation-authority-unification/reports/phase-08/`.
For **each** table entry, the actual field in `judgments.json` is
`carriedBlocker={record: R+record, pointer: "/parked", recordSha256: <that
physical row's SHA-256>, status: "open", reason: "The phase-08 blocker stays
open at this record and pointer under its existing owner; the G9 disposition
judges source drift only."}`. Thus each pointer below denotes the original
record's JSON body, not a claim that a G9 park was cleared by an export.

| Record after `R` | G9 disposition | carriedBlocker location and retained dependency |
| --- | --- | --- |
| `step-05-records/generators-skills-and-support.jsonl:66` | owned-park | Same record `#/parked`, **open**: 2 inherited backlog blockers. The separate drift question still needs the backlog owner's intended replacement claim. |
| `step-05-records/generators-skills-and-support.jsonl:200` | still-valid | Same record `#/parked`, **open**: 22 inventory/registry operations; ScopedCommit changes staging, not document identity. |
| `step-05-records/runtime-external-parks.jsonl:2` | still-valid | Same record `#/parked`, **open**: authorized bounded inventory export; no wholesale inventory load. |
| `step-05-records/runtime-judgment-part-26.jsonl:24` | superseded | Same record `#/parked`, **open**: inherited dead-link owner join; module retirement does not close it. |
| `step-05-records/runtime-judgment-part-27.jsonl:35` | still-valid | Same record `#/parked`, **open**: 2 Work.docsRef/content-root operations, owned by WORK; their ADMIT passages are moved byte-equal. |
| `step-05-records/runtime-judgment-part-27.jsonl:39` | still-valid | Same record `#/parked`, **open**: 14 operation-specific Work/stage exports, owned by WORK; ADMIT plan readers remain byte-equal. |
| `step-05-records/runtime-judgment-part-28.jsonl:6` | still-valid | Same record `#/parked`, **open**: 6 dispatch docsRef/content-root operations. |
| `step-05-records/runtime-judgment-part-28.jsonl:32` | still-valid | Same record `#/parked`, **open**: Work.acceptance evidence-token export. |
| `step-05-records/tests-judgment-batch4.jsonl:1` | still-valid | Same record `#/parked`, **open**: 15 scan-root/read-set obligations; drift only changes config fixtures. |
| `step-05-records/tests-judgment-batch4.jsonl:2` | still-valid | Same record `#/parked`, **open**: architecture-manifest retention/move decision. |
| `step-05-records/tests-judgment-batch6.jsonl:1` | still-valid | Same record `#/parked`, **open**: docs-index output retention/move decision. |
| `step-05-records/cli-help-messages.jsonl:3` | still-valid | Same record `#/parked`, **open**: 12 help/writer/retention obligations; current help overlap does not change the bound doc operands. |
| `step-05-records/gateway-contract.jsonl:2` | still-valid | Same record `#/parked`, **open**: 3 gateway schema obligations; YAML parser drift does not relocate the reader. |
| `step-05-records/runtime-judgment-part-22.jsonl:13` | still-valid | Same record `#/parked`, **open**: all 44 Work/registry/narrative blockers; changed id commentary and non-document plumbing do not demand a new doc edit. |
| `step-05-records/setup-doctor-roots.jsonl:21` | still-valid | Same record `#/parked`, **open**: all 45 registration/registry blockers; pathExistsAt probes the same live currentPath at HEAD. |

### Other corrected judgments and patch ownership

- `step04-029:1` is **still-valid** for live edges `class6-l-000481`,
  `000482`, `000483` (current lines 267-268, 308-309, 362). Only `000484`
  and `000485` are retired, via `retiredPassageIds` and the existing hashed
  `e71381aba` removal record. Verify authenticates that record through the
  same successor-proof door used for whole-record retirements and checks that
  the retained witnesses are moved/unchanged.
- Both backlog parks now ask the owning writer to **edit `docs/backlog.md`
  directly**, return exact row identities, and check `identity-ids-unique`;
  neither asks for regeneration. These are future owner actions, not commands
  run in this slice. The two G9 parks remain `batch-126:2` and generators `:66`.
- `tests-judgment-batch5:25` now says the RESEARCH.md/doc-history comparisons
  were **removed**, not retained. The unrelated line-269 comparison is not
  substituted for them.
- `part-26:2` and `runtime-r20:147` explicitly explain the all-absent result:
  all their bound operands were REJECT non-document ids/labels. The historical
  rejection remains true, but no old operation is claimed to survive and no
  ADMIT document obligation is transferred. This is not the rule for a deleted
  document consumer.
- Every reviewed row with changed AGENTS/switchboard co-cuts now names the
  shared `groups.protected-co-cuts` explanation: board-read timing,
  host/native-door refusals, Identity attribution/minting, candidate-only
  registry/Seat/Workflow routes and the Identity rename. Each reason ties
  those bytes to its primary operation; candidate metadata is not promotion.
- `batch-040:4` is now in doc-navigation, and failover test `batch7:150` in
  seat-workflow. Their dispositions are unchanged.

The five rows leaving needs-recomposition lose their **drift patch references**.
No prepared body is deleted: all **546 bodies remain byte-identical** because
other selected rows still own their patches. CLI registry, MCP and bin bodies
are also referenced by other G9 revisions. The vocabulary body is owned by
composition rows `scan:successor-dead-vocabulary` and
`w2:scan:live-successor-specs`; registrations by
`w8:repin:w2:predecessor:src/setup/registrations.mjs`, all in
`../composition/patch-specs.json`. Their planned migration does not turn
fixture/Git drift into a new doc change. No new patch was introduced or applied.

### Commands and proof

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9`,
`A=0763c2259ee3bf1801f4dc9621cbfa7955a156b6`, and
`P=72077976bbc6ffb64ba9478553258bedc2d0050d`.
Authored evidence is materialized at A to avoid retrieval-pin-only churn;
**both required proofs run at P**, validating all source bytes and record
hashes there, rather than assuming the old pin is fresh.

| Command | Exit |
| --- | ---: |
| `python3 -B "$G/review-parks.py" --pin "$A"` | 0 |
| `python3 -B "$G/judge.py" --pin "$A"` | 0 |
| `python3 -B "$G/sweep.py" --check --pin "$P"` | 0 |
| `python3 -B "$G/verify.py" --pin "$P"` | 0 |
| `git diff --check` | 0 |

Exact expanded commands, exits and stdout hashes are in
`park-rule-commands.json`; stdout is in `park-rule-{review,judge,sweep,verify}.json`.
Subcommands retain their individual exit codes in the sweep output and
`verification-commands.json` (including expected exit-128 absent-path reads,
not misreported as successful commands). Final sweep/verify/whitespace reruns
also exit 0. The inline `python3 -B -c` scope/blocker audit first exited 1 on
a wrapper syntax typo (an extra bracket), then exited 0 after correcting that
wrapper; both exact commands/exits are retained in the same log, with the
successful result in `park-rule-final-audit.json`. No production check or
assertion was skipped.

Sweep: **546 bodies; zero drift, chain mismatch, replay mismatch, unknown
paths, unresolved recompositions or judgment errors**. Verify: all body
roundtrips, all **15 open carried blockers**, partial retirement, **339**
explicit reviews, **10** pure-pin fields, **12** patch-id equivalences and the
existing controls pass. Two added negative controls reject a missing carried
blocker and a missing partial-retirement record; existing dependency,
supersession, park-input and evidence controls are retained.

Prior art reused: the existing judge publication, exact evidence hashes,
phase-08 `/parked` ownership, complete delta materializer, successor proof and
GNU-patch replay. No parallel mechanism. **impact-analysis: degraded** under
the explicit no-fgOS-CLI grant and unavailable MCP; direct callers of changed
record-tooling symbols are G9 judge/sweep/verify only, not product execution.
No locked law, product/runtime contract, install defaults or user-visible
product behavior changes. No product suite, native addon, Git write, lifecycle
verb, preview service, live document or ledger edits. Scratch stays in the
existing unique tempfile workspaces below `/tmp/fgos-work/`, removed on exit;
the final audit records an empty base. `needsWrites=[]` for this records-only
correction; the remaining backlog parks are owner work, not a requested grant.

## Historical park review

Turn-start pin: **`0763c2259ee3bf1801f4dc9621cbfa7955a156b6`**, resolved with
`git rev-parse HEAD` before reading the records. This is a check pin, **not final
pin F**. The older receipts below are historical, not current completion claims.

Reviewed all **338 formerly owned parks**, each against its complete physical
record, bound source passage and current pinned passage. No path/category rule
supplies the new verdicts: [park-decisions.json](park-decisions.json) names every
record separately, its record/evidence hashes, one disposition and a specific
changed-byte explanation. Revisions remain separate. The other **236 records**
keep their dispositions. Scope remains **574 physical records / 684 cohort
memberships**, not pair accounting.

### Before and after

| Disposition | All records before | All records after | Former parks after |
| --- | ---: | ---: | ---: |
| still-valid-as-recorded | 229 | 517 | 288 |
| needs-recomposition | 7 | 20 | 13 |
| superseded-or-retired | 0 | 32 | 32 |
| owned-park | 338 | 5 | 5 |
| **Total** | **574** | **574** | **338** |

The [before sweep](parks-before-check.json) passed at the same pin. Current
locators, passage digests and full record digests remain on **every** judgment
in [judgments.json](judgments.json), joined to [passages.json](passages.json).
The review reads **14,922 passage occurrences** for the formerly parked rows;
[park-review-evidence.json](park-review-evidence.json) retains **4,112 distinct
complete changed/absent deltas**, including large whole-file dependencies, and
hashes of the exact cited record items. Unchanged/moved witnesses reuse the
existing evidence instead of duplicating their text. An absent file has no
invented current line: its pinned-tree absence, deletion/rename record and
actual successor evidence are explicit.

### Shared causes, separately bound rows

Each group has one explanation in `park-decisions.json.groups`; each member
still has its own reason, disposition and evidence.

| Group | Rows | Judgment and common cause |
| --- | ---: | --- |
| doc-navigation | 16 | Check rosters, manifest membership and safety wording changed, not the identity/role of the preserved navigation. |
| config-fixture | 65 | `writeProjectConfig`/global/raw helpers and the Seat Binding schema change runtime config fixtures, not maintained documentation roots. |
| git-infrastructure | 67 | Inspect/Worktree/Land and fixture doors replace raw Git topology, checkout, release and hook plumbing; unchanged document operands remain separately witnessed. |
| process-lock-identity | 78 | Native Process/Identity/lock/durable primitives replace local implementations; their tuples, runtime files, sockets and messages remain non-document operations. |
| seat-workflow | 40 | Explicit seats, pools/tiers and case admission replace role/rigor-derived plumbing; execution outputs and workflow/persona definitions remain runtime data. |
| source-contract-data | 22 | Cargo coordinates, protocol vectors, YAML parsing and code metrics are code/runtime contract inputs, not documentation authority. |
| current-body | 13 | Use a guarded current-byte body, not a stale preservation premise or hunk. |
| retired-consumer | 32 | A named later deletion/rename, accounting record or composition retirement action owns the historical consumer. |
| external-input | 5 | The missing input is a particular owner-selected backlog claim or persisted Work/knowledge export, not a request for a generic reviewer. |

The **32 supersessions** name exact later records and pointers: 23 records for
22 distinct deleted/renamed source/test paths, the two removed approval history
comments (one record), the
exception-accounting successor, four reading-map revisions and three distribution
edge revisions. Reading-map retirement points to
`composition/actions.json#/actions/3` and the detailed `docs/reading-map.md`
section 5; distribution edge revisions point to the explicit `retiresWithTree`
record at `phase-08/step-03-records/batch-040.jsonl:4`. These are record
supersessions, **not** claims that still-present source trees have already been
deleted or promoted. The original distribution retirement record stays valid.
Deletion and rename commits, before/after hashes and current absence are verified;
Identity's real provider successor is read, not invented.

### Recomposition

Twelve former parks reuse their existing selected G9 bodies. One new body is
prepared for `packages/distribution/rust/src/workspace.rs`: its module comment
still cited `docs/specs/distribution.md:297`, while the implementation already uses
`GitDriver::open_at`/`trusted_main_root`. The comment-only patch names the current
`activation-binding.md` **Git Common Directory Discovery** contract, retaining
main-checkout versus linked-worktree semantics. No executable Rust byte changes.
The target contract is separately line/hash-bound in that row's additional evidence.

[park-supplemental-specs.json](park-supplemental-specs.json) feeds the **existing**
`spec_chains` → `recompose` → sweep/verify door; it does not create another patch
application mechanism. [recomposed.json](recomposed.json) now has **546 bodies**.
All original **545 before/after hashes and diffs are unchanged**;
[final audit](park-final-audit.json) compares them against the turn-start packet.
Every body is
forward/rollback byte-exact under `patch --batch --fuzz=0 --reject-file=- -p1`;
recomposition made **1,518 patch calls**, all exit 0. Fifteen historical chain
inputs still use the existing exact authored-edit relocation; none is an unresolved
preimage problem. No prepared body was applied to the source checkout.

### Every remaining owned park

All paths below are relative to the plan's `reports/` directory. Each is also
an exact full-path id in `judgments.json` and `park-decisions.json`.

| Record | Named owner | Missing input and concrete next action |
| --- | --- | --- |
| `phase-08/step-03-records/batch-126.jsonl:2` (`docs/backlog.md`) | Backlog owner / documentation-unification plan owner | STR70a still asserts the old `work-state.md:647-675` decision/outcome precedent and STR62 the old `:864` parent/deps/blocks/sibling model. Choose the intended current replacement claims through the owning backlog writer, reconcile them with WORK, replace the measured citations and regenerate the projection. Retire the removed js-yaml advisory binding; return the writer inputs and exact resulting row identities. |
| `phase-08/step-05-records/generators-skills-and-support.jsonl:66` (`docs/backlog.md`) | Backlog owner / documentation-unification plan owner | The later registry/support record inherits the same STR70a claim; it cannot infer a new product intention from a changed line number. Carry the same authoritative backlog correction into this separate revision and show its resulting source binding; the js-yaml advisory is gone. |
| `phase-08/step-05-records/generators-skills-and-support.jsonl:200` (`scripts/knowledge-migration.mjs`) | Knowledge registry owner / documentation-unification plan owner | Export folded topics/docs and the authorized inventory rows (`topicId`, `role`, `purposeSlug`, `oldPath`, `currentPath`). Join each document to exactly one source/target identity, then re-review the 22 registry-dependent operations before any move. ScopedCommit replacing raw staging does not supply those missing persisted values. |
| `phase-08/step-05-records/runtime-judgment-part-27.jsonl:35` (`src/runner/loop.mjs`) | **WORK lane owner** | Export the claimed ready-validation candidates, their `docsRef`, actual content roots and `plan.md` bytes. Bind each plan and compare READY/non-READY verdicts before/after its move, proving non-READY does not mutate Work. The changed branch-settlement code supplies none of these inputs. |
| `phase-08/step-05-records/runtime-judgment-part-27.jsonl:39` (`src/runner/operation-choice.mjs`) | **WORK lane owner** | Export the selected item/stage/content root for **each** operation-specific plan lookup, including the final branch. Bind those plans independently and compare eligibility/selected operation before/after moving them; the earlier planner branch cannot stand in for the final branch. |

**needsWrites:** `docs/backlog.md`, for the two named backlog rows/revisions
above, through its owning writer. It was **not edited**. No `.fgos/`, registry
or secret data was inspected or requested as a new write grant. The three other
parks need authorized read exports, not guessed paths or code edits.

### Reproduce and verify

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9` and
`P=0763c2259ee3bf1801f4dc9621cbfa7955a156b6`.

| Actual command, in order | Exit |
| --- | ---: |
| `python3 -B "$G/review-parks.py" --pin "$P"` | 0 |
| `python3 -B "$G/recompose.py" --pin "$P"` | 0 |
| `python3 -B "$G/judge.py" --pin "$P"` | 0 |
| `python3 -B "$G/sweep.py" --check --pin "$P"` | 0 |
| `python3 -B "$G/verify.py" --pin "$P"` | 0 |
| `git diff --check` | 0 |

Exact argv/exits/output hashes: [park-check-commands.json](park-check-commands.json).
The [current sweep](park-sweep-check.json) has zero drift, chain mismatches,
body replay mismatches or judgment errors. [Verification](park-verify-run.json)
preserves all four original controls, 10 pure-pin checks and 12 patch-id
equivalences, and authenticates all reviewed source deltas and successor records.
The owning validator also rejects missing exact dependency reviews, missing
supersession records and missing concrete park inputs. The old blanket
changed-dependency rejection is replaced by an exact **record + complete evidence
hash + authored per-row decision + dependency locator/digest** requirement;
source drift still reopens that row. No failure is waived by a flag or test branch.

Scratch uses only the existing unique `tempfile` workspaces below
`/tmp/fgos-work/`; the final sequence leaves **no new residue** and never removes
the shared base. [Scratch proof](park-scratch-proof.json).

Prior art reused: G9 source extraction/digest joins, exact hunk relocation,
existing chain/replay door, GNU patch, named composition retirement actions and
actual Git removal/rename history. **impact-analysis: degraded**: fgOS CLI is
explicitly forbidden and this session has no impact-analysis MCP tool; local
callers are the G9 judge, sweep and verify only. No product/runtime contract,
component boundary, law, test suite or install configuration changes. No Git
writes, fgOS CLI/lifecycle calls, suites, live docs, ledgers, composition files,
state, secrets or authority promotion. No preview service was started under the
exact write grant. Independent semantic acceptance, final F and cutover remain
outside this author review.

## Historical gloss-polish receipt

### Earlier live-check / replay hardening

Check HEAD: **`8b4d778d32b5930ab7c80d9d19b2f26b95441ee1`**, not final pin F.
The complete [reproduction](w13-reproduction.json) exits **0**. The existing
polish driver is reused with `PREFIX='w13'`; exact `python3 -B -c` argv and all
subprocess exits are retained there and in [w13-commands.json](w13-commands.json).
No live doc or ledger bytes were edited.

- Witness #2 now describes two forks **recorded at the time** and explicitly
  says the Stop-drain decision was later settled. It no longer calls an answered
  decision open. The mailbox gloss spec's diff, inverse and witness are regenerated.
- The owning audit reads the physical lines immediately above/below each witness
  in the **complete replayed after-file**, including unglossed items. It keeps the
  earlier before-witness evidence for simultaneous loss of every adjacent label.
  A single decision citation inside an already numbered item is not confused
  with its outer list number. Full result: **104 witnesses; 102 pass + 2 reviewed
  matches; 0 review-required**; 11 vertical-list witnesses.
- Existing simultaneous-label-loss controls remain, and new lone-witness controls
  strip labels from each git row and from numbered, lettered and decision-labelled
  samples with unglossed neighbours. All reject loss and accept restored labels.
  [Audit and full controls](../composition/w13-audit-controls.json).
- Full prepared chain: 74 files / 106 steps, **424 patch calls, all exit 0**,
  per-step and full reverse rollback byte-exact. Independent replay: **221 patch
  calls, all exit 0**. Citation scan after the real scratch skill generator:
  **0 findings / exit 0**, not merely zero new findings. The before-F negative
  scan still reports its expected 130 findings / exit 1; baseline unchanged.
- G9 recomposes **545 bodies**. Only `docs/platform/agent-mailbox/spec.md` changes
  body diff/hash; its preimage and the other **544 body diffs/hashes** are unchanged.
  [Delta](w13-recomposition-delta.json). Sweep reports zero current drift,
  predecessor-chain mismatches, body mismatches or judgment errors. Evidence joins,
  provenance checks, counts, judgments and parks are unchanged.

### Scratch lifetime and overlap

`recompose.workspace()` lazily uses a unique `tempfile.mkdtemp` directly below
`/tmp/fgos-work`, then removes **only its own directory** in `finally`. It never
removes the shared base. Both historical G9 driver entry points now own a unique
workspace too; no fixed workspace is reused or deleted by another invocation.
Imports create no scratch directory. Normal/exception controls keep two separate
processes' workspaces alive simultaneously: finishing the first leaves the
second intact. Two real overlapping sweep checks both exit **0**. Every check
leaves the base empty. Evidence: [final audit](w13-final-audit.json) and
[actual check snapshots](w13-tempfile-proof.json).

### Commands and exits

Let `P=plans/260925-documentation-authority-unification/reports/phase-09`.

| Command | Exit |
|---|---:|
| Existing polish driver via `python3 -B -c` with `PREFIX='w13'` | 0 |
| `python3 -B "$P/g9/recompose.py" --pin HEAD` | 0 |
| `python3 -B "$P/g9/sweep.py" --check --pin HEAD` | 0; two additional concurrent runs also 0 |
| `python3 -B "$P/g9/verify.py" --pin HEAD` | 0 |
| Scratch composition `verify.py` / `independent-replay.py`, both `python3 -B` | 0 / 0 |
| `python3 -B "$P/misc-fix/verify.py"` | 0 |
| `python3 -B "$P/misc-fix/rebind.py" --check` | 0 |
| Owning `rebind/rebind.py --check`, scratch-only wrapper | 0; drift 0 |
| `git diff --check` | 0 |

The first enclosing attempt (exit 1) is retained in [w13-first-attempt.json](w13-first-attempt.json):
the stronger context exposed witness #0's outer number versus embedded citation.
The list parser was corrected; no witness was exempted and no proof weakened.
Prior art reused: exact authored-hunk relocation, Step 7 parser, full/independent
composition recipes, GNU patch and owning audit. Impact-analysis degraded under
the no-CLI grant. No Git writes, fgOS CLI/state, suites, pair accounting, new
product feature or preview service. `needsWrites=[]`; no authority promotion,
independent acceptance or gate closure claimed. Earlier receipt below is historical.

## Earlier gloss-polish run

Replay/check pin: **`8fd37e3590d3654729cf2d177c90bb0fbb17dff9`** (`HEAD` during this run), **not final pin F**. The complete reproduction, `sweep.py --check --pin HEAD` and `verify.py --pin HEAD` exit **0**. This receipt supersedes current completion claims in the previous receipt; W11 artifacts remain historical evidence at their own pins. No authority promotion, semantic acceptance, parity or gate closure is claimed.

## Bounded repairs

Repaired **14 distinct gloss witnesses** (#2, #35–#39, #47, #50, #59, #61, #62, #64, #65, #94); the four composition gloss specs have regenerated diffs, inverse diffs and expected-after hashes. See [composition receipt](../composition/receipt.md) and [w12-preparation.json](../composition/w12-preparation.json).

- Git's local list retains every number 1–9 as `(n)`, including grouped labels, capitals and no duplicated subtitles.
- Holder-lock uses `(n)` for list items, keeping `mục` for sections. The corrected Vietnamese cross-reference points to **ý (8) của đoạn main-door**, not the unrelated repo-lease decision.
- The mixed-language sentences, garbled join and nested parentheses are repaired. The flattened citation still uses the scanner's required `ID (gloss)` form.
- All **104** witness lines are checked against real replayed before/after bytes. The extended existing audit covers vertical numbered/lettered lists as well as inline lists: **102 pass + 2 explained matches**, no unresolved matches. Missing-label controls reject all five git rows and generic numbered/lettered examples.

## Recomposition and unchanged judgments

All **545 bodies** were recomposed at the check pin. Exactly **four body diffs/hashes changed**: agent-mailbox spec, git spec, holder-lock spec and runner subcomponent `h-02842f76ffd2/spec.md`; their preimages are unchanged. The other **541 body diffs/hashes are unchanged**. [w12-recomposition-delta.json](w12-recomposition-delta.json) records the old/new hashes. Fifteen historical chain inputs required the existing exact authored-edit relocation; the resulting packet has no unresolved problems or current preimage drift.

Every body passes whole-file-guarded forward/rollback replay with `patch --batch --fuzz=0 --reject-file=- -p1`. Sweep independently compares each body replay with its current chain replay and ordered predecessor metadata: **zero drift, zero chain mismatches, zero body mismatches, zero judgment errors**. Verify also passes its 545 body roundtrips, evidence joins, four existing negative controls, 10 pure-pin fields and 12 patch-id equivalences.

No judge/ledger changes were needed. Source-judgment records retain their original pin provenance (`d786e305e`); content-bound evidence checks authenticate them at this run's HEAD. Counts remain **684 cohort memberships / 574 physical records**; revisions remain distinct:

| Classification | Records | Evidence passages per row |
|---|---:|---:|
| unchanged | 55 | 3,576 |
| moved | 89 | 13,040 |
| changed | 352 | 3,583 |
| absent | 78 | 995 |
| **Total** | **574** | **21,194** |

The **21,194 per-row evidence occurrences** reference **20,621 unique passages** in `passages.json`; they are not the same count. Dispositions remain **229 still-valid-as-recorded / 7 needs-recomposition / 338 owned-park**. The LF-only classification rule and all remaining parks are unchanged.

## Temporary workspace hygiene

`recompose.py` no longer creates a directory at import. Its workspace context creates a `tempfile.TemporaryDirectory` lazily under `/tmp/fgos-work/w12-gloss`, removes it on exit, and removes the parent only if it created that parent and it is empty. Caller-owned scratch roots are preserved. `verify.py` now reuses this workspace rather than maintaining another import-time root. Sweep's docstring distinguishes disposable replay writes from persistent output.

Actual sweep/verify runs started with scratch absent and left it absent. Import-only and normal/exception cleanup controls are recorded in [w12-final-audit.json](w12-final-audit.json); the enclosing reproduction's checks are in [w12-tempfile-proof.json](w12-tempfile-proof.json).

## Commands and exits

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9`, `C` be its sibling `composition`, and `T=/tmp/fgos-work/w12-gloss`. Every Python invocation uses **`python3 -B`**.

| Command | Exit / result |
|---|---|
| `python3 -B "$G/w12-gloss-polish.py"` | **0**, complete reproduction; scratch removed |
| `python3 -B "$G/recompose.py" --pin HEAD` | **0**, 545 bodies; 1,515 patch calls, all 0 |
| `python3 -B "$G/sweep.py" --check --pin HEAD` | **0**, 1,016 chain/body patch calls, all 0 |
| `python3 -B "$G/verify.py" --pin HEAD` | **0**, 2,014 patch calls, all 0 |
| Reused `python3 -B "$T/verify.py"` (composition) | **0**, complete chain, witnesses, citation and binding/action checks |
| Reused `python3 -B "$T/independent-replay.py"` | **0**, 74 files; 221 patch calls, all 0 |
| Scratch skill generator; citation scan, before F / full chain | **0; 1 / 0**, intentional 130 findings → zero |
| Import-only, workspace normal/exception cleanup and scope/index controls | **0**, `w12-final-audit.json` |
| `git diff --check`; read-only scope/index audit | **0** |

Exact commands/exits are in [w12-commands.json](w12-commands.json), `patch-commands.json`, `sweep-check.json`, `verification-commands.json` and composition's W12 artifacts. The verification command log retains 35 expected `git show` exit-128 absence reads; these are not successful commands. Three initial enclosing attempts exited 1 and are retained as `w12-first-attempt.json`, `w12-second-attempt.json`, `w12-third-attempt.json`: caller-owned scratch cleanup, citation-parenthesis format, then verify's inherited scratch mkdir. The third attempt created an empty historical scratch directory outside the allowed scratch root; it was removed and the independent mkdir mechanism retired. The final complete run has no such residue.

Prior art reused: G9 exact authored-hunk relocation, Step 7 parser, GNU patch, W11 audit generator and persisted full/independent composition recipes, unchanged shared resolver/extractors. **impact-analysis: degraded** under the explicit no-fgOS-CLI grant; records tooling only, no runtime changes. Only `g9/**` and `composition/**` changed; no live docs, ledgers, pair accounting, product code/tests, baseline, Git write, fgOS CLI, state/secrets or suites. No preview service was launched under the exact write grant. `needsWrites=[]`. Final-pin F, independent acceptance, cutover and residual binding drift remain Lead-owned.
