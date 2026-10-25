# Link guard rework — current records-only receipt

Authority: [rework brief](../w36-link-guard-rework-brief.md), L13-4.1,
L13-26.2 and L13-28; [review](../reviews/w35-link-guard-review.json).
Replay pin: `8c79219f4a696a1de1310e75ec24d59f80be8eef` (turn-start HEAD).
**All five required proofs exit 0; no source application, decision change,
semantic approval, lease, gate closure or cutover authorization.**

## Corrected population and fixes

`tree()` now computes `(pin paths | composed states) - moving paths`. All **21**
edited move-set sources stay absent, even when F prepares bytes for them. The
same subtraction also removes the old `docs/contracts/` directory when its only
child, the edited gateway YAML, moves. The former zero-Related claim was false:
the reviewed final state still had **11** Related move-source findings. The
corrected rework census is **11 → 0**, not the earlier claimed **67 → 0**.
The earlier initial 67 counted only what the flawed tree reported; it was not
an authenticated count of every Related entry into the move set.

| Measure | Reviewed state before rework | After rework |
| --- | ---: | ---: |
| Platform Markdown files | 628 | 628 |
| Local clickable/Related destinations | 2,701 | 2,705 |
| Related entries into moved sources | 11 | 0 |
| Missing old directory link | 1 | 0 |
| Stale retarget labels, with complete successor evidence | 80 | 0 |
| All `linkGuard` findings, with that evidence | 92 | 0 |
| Link-record rows / final owning patches | 285 / 82 | 377 / 88 |
| Composed files / executed proposals / existing composition links | 594 / 223 / 20 | 595 / 229 / 20 |
| Owning controls | 21 | 25 |

The six cross-file Related entries now agree with their clickable counterparts:
three governance template references, two switchboard references, and the mailbox
handoff reference. Five self-source entries follow rule 2.3 and use their matching
source-title anchors. Seven of these eleven lines already belonged to premise
patches: those **same owners** were extended, and the link record names them via
`composedBy`; there is no competing second patch on a preserved line. The other
four have coordinate-bound replacements in the single final file patch. The
empty contracts directory link follows its sole moved child's successor parent.

All **16** former rule-2.2 rows were rechecked against the move set, all L12/L13
owner rulings, the G5 survivor `docs/reading-map.md`, and the new platform area
specs. Each row records those sources and their hashes in `source.successorChecks`.
Four have successors and are no longer literal:

- `related:36` → Seat Binding spec and its extractor-listed section 5.1 anchor,
  per L13-4.1 (corroborated by the G5 map and the new spec's Source header).
- `link:18` → the retained master-coordinator prompt, evidenced by its move/alias
  and restored current manual-convention header, not the retired engine snapshot.
- `link:19` → the same deliberation-memory plan under `archive/plans/`, per the
  archival relocation in `22e54f834`.
- `related:73` → the archived knowledge-registry plan; its surviving old-directory
  README explicitly names that successor and the archival commit.

`related:64` is now correctly rule 2.3: the carrier names both foundation sources,
but has no matching source-title anchor for this operand. **11** true rule-2.2
rows remain literal: four external machine-absolute citations, six code/test
artifacts deleted with the retired engine in `2180b4e72`, and the absent privacy
hook citation. A different modern mechanism is not an evidenced file successor.
No literal fence body was retargeted.

Rule 2.4 is applied across the complete composed retarget population, including
links changed by earlier F owners and the late Seat Binding/Workflow successors,
not just the eleven labels sampled by the earlier review. **80** additional labels
are repaired (79 filename/path operands and one directory label), plus the label
on the repaired empty-directory route. Descriptive labels are unchanged; mixed
labels retain their `§13.1`, `§14` and `mục 14` locators. The new owning guard uses
move destinations and the existing retarget record as successor evidence, checks
actual final labels, and caches pinned file bytes instead of spawning Git once
per link. Equal basenames at a new location are not false positives. With only
the old incomplete successor metadata the corrected guard finds 64 stale labels;
the complete successor evidence exposes 80, which are all repaired.

| Owning rule | Current rows |
| --- | ---: |
| L13-28.2.1 — evidenced successor | 207 |
| L13-28.2.2 — no successor, literal | 11 |
| L13-28.2.3 — self-source | 70 |
| L13-28.2.4 — additional label repair | 80 |
| L13-28.4 — existing lineage owner link | 3 |
| L13-28.5 — gateway references | 6 |
| **Total** | **377** |

## Proof and remaining final-F duties

[link-validation.json](link-validation.json) authenticates **88** exact forward /
rollback roundtrips, every coordinate stage and basis hash, all **10** earlier-owner
links, **20,297** unchanged Markdown literal regions outside Related operands,
787 unchanged judgments/frozen evidence, and all 158 unchanged G9 decisions. It
reconstructs the reviewed state from pinned records using the existing `compose()`
and `apply_diff` doors, not saved scratch bytes. `row125ReviewCheckpoint` and the
final patch-24 postimage remain unchanged by this rework.

With `P=plans/260925-documentation-authority-unification/reports/phase-09`,
`NODE_OPTIONS=--no-addons`, and Python always `-B`:

| Command | Exit / result |
| --- | --- |
| `python3 -B $P/fchain/check.py --pin HEAD` | **0**; 595 files, 229 proposals, 20 existing links, zero findings |
| `python3 -B $P/fchain/controls.py` | **0**; 25 controls |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | **0**; 787 rows, 0 unresolved, 24 existing duplicate markers |
| `python3 -B $P/g9/check_phase9_decisions.py` | **0**; 158 entries, 595 shared-chain files, 12 gateway readers |
| `node $P/carries/verify-carries.mjs` | **0**; 44 claims, 1,208 bindings; the two existing final-pin duties remain |
| `python3 -B -c <rework.validationSource in link-commands.json>` | **0**; complete roundtrip, population, row/owner and conservation checks |
| `git diff --check` | **0** |

The new clickable and Related probes each target `docs/doc-governance.md`, which
F edits and removes. **Each real compose invocation raises exactly one finding,
`linkGuard: moved-target`, and no unrelated conflict.** The stale-label control
also raises exactly one finding; its valid filename and descriptive-label peers
pass. A separate used-reference-label probe does the same, including a valid
label before the stale one on the same definition and an unused moved definition.
The existing record/manifest disagreement control now runs separately, so it
cannot mask a link-control failure.

The 398 legacy-regex occurrences comprise **394 inside fences and 4 inside
multi-line inline code spans** in `P00.1.md`, not 398 fenced occurrences. None is
a clickable link. `link-retargets.json.finalFDuties` now records machine-readable
open duties for cutover-guard agreement and final-F patch delta review:

- Guard 3 must agree with this witness's fence/code-span and extractor-anchor
  semantics, source removal and label rules; no old regex false positives.
- The three previously changed proposals **f06461, f06591, f07205** need final-F
  delta review. Their actual storage is **shard 2**, not shard 3 as the brief's
  shorthand says; shard 3 only had f07667's stale-dependency cleanup. No shard-3
  bytes change in this rework.
- The newly extended existing proposals **f06504, f06697, f06699, f06700, f06702,
  f06790/f06791/f06794/f06799, f06823** (seven owning files, ten row copies) also
  need final-F delta review. Prior approvals do not transfer to changed hashes.

[link-commands.json](link-commands.json) retains complete current argv/output/exits
and self-contained validation source under `rework`; older proof entries stay
historical. Preliminary author/parser diagnostics and one timed-out aggregate
controls attempt are disclosed there, not counted as passing proofs. `check.json`
is retained because real source/owner/after-image data changed, not just volatile
fields. The untracked `chain-check-8c79219f4.json` is removed. Scratch is confined
to a disposable tempfile directory under `/tmp/fgos-work/` and removed at handback.
No docs, ledger, review, product file, private state, fgOS CLI, git write, native
addon, product test, forbidden audit or pair-accounting command was touched.
Impact-analysis: **degraded**, under the no-CLI/no-MCP boundary; static callers are
F, premise/G9 wiring and owning controls, not a certified complete blast radius.
No preview service is started under this records-only write boundary.

---

# Previous whole-population link guard receipt (historical; corrected above)

Authority: L13-24, L13-26 and L13-28; [brief](../w34-link-guard-brief.md),
[w33 review](../reviews/w33-link-retargets-review.json). Turn-start and replay pin:
`0557f175b0ec253f56d803d0995ea0f26c7faea7`. **All five required proofs pass.
No source application, semantic approval, decision change, lease, gate closure or
cutover authorization.**

## Population, before any retarget amendments

The new scanner examined all **628 Markdown files** in the composed platform
population, not only files touched by F. It uses pinned Git objects minus the
move set, with composed after-images and newly created files overlaid. Files and
directories must exist there; anchors come directly from the unit extractor via
`scripts/list-doc-anchors.mjs::listAnchors`, including its accepted heading slugs.

| Measure | Before | After |
| --- | ---: | ---: |
| Local clickable/Related destinations examined | 2,722 | 2,701 |
| Related guard findings at the reviewed final state (corrected tree; current rework counts) | 11 | 0 |
| Other missing Related destinations | 2 | 0 |
| Missing clickable file destinations | 41 | 0 |
| Missing clickable anchors | 7 | 0 |
| Total `linkGuard` findings | **117** | **0** |
| Prepared link record rows / file patches | 162 / 41 | 285 / 82 |
| Composed files / executed proposals | 572 / 182 | 594 / 223 |
| Explicit existing composition links | 20 | 20 |
| Owning F controls | 19 | 21 |

The w33 legacy-regex population is reproduced exactly: **411** failures in pin
files and **24** in F-created files, **435** total. Of those source occurrences,
**394 are inside literal fences and 4 inside multi-line inline code spans**, and **37 are live relative routes** (13 in pin
files, all 24 in created files). The 398 literal occurrences remain byte-for-byte
unchanged, as required by the brief; they are text, not exempted live links. The
41 missing clickable files comprise those 37 routes plus four machine-absolute
historical proof citations. Seven anchor failures and 69 Related failures make
the full 117. The old backtick-only regex still misreads the same 398 literal
occurrences after this work. The eventual cutover guard must agree with the
matched-fence/unit-anchor semantics of this pre-F witness (L13-28.4), rather than
restore that old regex's false positives.

[link-scan-before.json](link-scan-before.json) retains every initial finding and
all 435 legacy-regex occurrences with literal/source coordinates. An initial
scratch comparison reported 471 because it compared trailing-slash directory
strings incorrectly; its 36 existing directories are not findings. The corrected
435 census, not that diagnostic, is the recorded evidence.

## Rules and single ownership

[link-retargets.json](link-retargets.json) remains the only retarget record. Each
row carries its rule, source selector and exact replacement basis. Each file has
one combined forward/rollback patch. The original 41 patch indices remain stable;
only new-file patch selectors follow them.

| Owning rule | Rows |
| --- | ---: |
| L13-28.2.1 — evidenced successor / anchor rename | 196 |
| L13-28.2.2 — absent target, no successor, made literal | 16 |
| L13-28.2.3 — self-link to matching source-title anchor, otherwise literal | 64 |
| L13-28.4 — link to the earlier lineage-formatting owner | 3 |
| L13-28.5 — additional gateway references | 6 |
| Total | **285** |

The previous turn applied rule 2.4 to only **10** old-path labels (incomplete;
the current rework repairs 80 more labels); the eleventh reviewed label
is in the one original self-link made literal. All **24** w33 self-links are
accounted: **23** point to the matching original-source title anchor, **1** has no
matching anchor and becomes a code span. Related self-references use the same
rule. There are 19 newly literal rows overall; earlier literal lineage operands
are not converted back into live authority claims.

- **Row 125:** exact destination span 2184–2210, `../../reading-map.md`, G5 survivor
  `docs/reading-map.md`, null alias, plan/G5 selector. Its w33-only intermediate
  postimage is independently verified as
  `8ce81ee7f54c1f655e6e814b6f76e8448bb29efff04c83b64de3d75427c9b884`.
  `/patches/24` has the same preimage, but its final combined hash is
  `15feba80d72ad7e128a4a9efe0b1dfbb63692422a6283be1a23c0801ed9d988a`,
  because the same file also needs L13-28's self-anchor and Related amendments.
  Keeping the intermediate hash as the final hash would miscertify those bytes;
  `row125ReviewCheckpoint` preserves the exact requested intermediate witness.
- **Three already-owned lines:** f06461, f06591 and f07205 already own literal
  lineage formatting in shard 2. Their patches now say `Historical source:`
  before the same exact code-span operand, so Related readers do not mistake
  literal provenance for a route. The new record links those owners and carries
  no second delta for those lines. Their judgments, paths and frozen evidence
  are unchanged. Both preserve obligations still pass. These three changed
  proposals require final-F delta review, as recorded in the current receipt.
- **Carriage creation:** its existing `w8:gap05:history` chain is explicitly
  co-composed through the existing exact-base `composesChain` edge. This uses
  the established single final owning patch, not a new replay/overlap waiver.
- **Gateway:** both `x-specs` entries remain on their whole-file successors.
  All four descriptions at 456/607/710/739 follow those same successors. The two
  removed decision-file citations point to their named retained decision
  headings. The real YAML key is `x-decisions` (called `x-docs` in the brief).
- Removed only f07667's contradictory `staleChainDependencies` field. No other
  judgment, reason, evidence or decision changed.

## Reused doors and proof

`compose()` and `composition/compose.py::apply_diff` remain the sole replay
engine. `links.py` extends its existing coordinate-preserving scanner with
Related metadata, file/anchor resolution and the existing extractor's anchor
lookup; no copied slug algorithm or alternate apply engine. Inline, used
reference, image and HTML href destinations are covered. `[x](<…>)` is counted
once; HTML closing tags are not mistaken for local autolinks. Code spans,
backtick/tilde fences and comments remain literal. The owning control retains
the moved-path injection and adds broken ordinary/Related anchors, valid
extracted anchors, Related root directories and literal-code checks through a
real `compose()` invocation. Blank lines end the Related list as in its owner.

[link-validation.json](link-validation.json) authenticates all **82** exact
forward/inverse roundtrips, staged row-to-patch coverage, the three earlier-owner
links, all 787 unchanged judgments/frozen evidence, all 158 unchanged G9
decisions, unchanged historical composition records and **16,614** unchanged
Markdown literal regions outside Related operands. The move set, aliases, all
source documents, ledgers, register and reviews remain untouched.

With `P=plans/260925-documentation-authority-unification/reports/phase-09`, from
repository root, `NODE_OPTIONS=--no-addons` and every Python invocation `-B`:

| Command | Exit / result |
| --- | --- |
| `python3 -B $P/fchain/check.py --pin HEAD` | **0**; 594 files, 223 executed, 20 links, no findings including `linkGuard` |
| `python3 -B $P/fchain/controls.py` | **0**; 21 controls |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | **0**; 787 rows, 0 unresolved, 24 existing resolved markers |
| `python3 -B $P/g9/check_phase9_decisions.py` | **0**; 158 entries, 594 shared-chain files, 12 gateway readers |
| `node $P/carries/verify-carries.mjs` | **0**; 44 claims, 24 pointer files, 1,208 current bindings; two existing final-pin duties unchanged |
| `python3 -B -c <validationSource in link-commands.json>` | **0**; population, exact roundtrips, staged ownership, source/decision/literal conservation |
| `git diff --check` | **0** |

[link-commands.json](link-commands.json) records final argv/stdout/stderr/exits and
self-contained validation source; its previous command evidence stays historical.
Diagnostic commands are not passing proofs: the first baseline serialization
failed on Python sets; the first author attempt assumed the wrong YAML index;
the first integrated F replay rejected six same-line/preservation findings;
a scratch Node census hit its default buffer limit; the initial directory census
was corrected as above. Early validation diagnostics rejected YAML backtick
citations under a Markdown-only assertion, timed out on a character-level diff,
and rejected an absolute Git object path. The final validation checks exact
Markdown literal regions and uses repository-relative Git paths; none of the
production checks were disabled or weakened.

The transient `chain-check-0557f175b.json` is removed after its result was captured;
no unrelated volatile output is retained. Scratch stays in auto-created tempfile
directories under `/tmp/fgos-work/` and is removed at completion. No git writes,
fgOS CLI, private state, native addons, product/full-suite tests, forbidden audit
or pair accounting ran. No config/env default or new infrastructure component
was added: Node and the anchor extractor already serve the required proof doors.
Impact-analysis remains **degraded** under the no-CLI/no-MCP task boundary;
static callers are the F door, premise/G9 wiring and owning controls, not a
certified complete blast radius. Markdown preview is not started because this
records-only task forbids extra state/service writes. Final-F acceptance,
independent review and cutover-guard wiring remain open.

---

# Previous link-retarget and work-state rebase receipt (historical)

Status: **all required mechanical records proofs pass; no product application,
semantic approval, lease, gate closure or cutover authorization.** Authority:
L13-21, L13-24, L13-25 and L13-26; scope: [w30 brief](../w30-fchain-link-retargets-brief.md).
Replay pin: `2c5093b57954790cda1639b36821f71bd2a00c08` (`HEAD`). Immutable G9,
premise and census evidence pins remain unchanged.

## Current evidence and counts

| Measure | Before | After |
| --- | ---: | ---: |
| Stale work-state findings (3 conflict + 1 ownerless) | 4 | 0 |
| Clickable Markdown links into move-set sources | 160 in 40 files | 0 |
| Stale gateway YAML `x-specs` entries | 2 | 0 |
| Prepared L13-26 rows / file patches | 0 / 0 | 162 / 41 |
| No-successor links made literal | 0 | 1 |
| Composed files / executable proposals | 548 / 141 | 572 / 182 |
| Existing explicit composition links | 20 | 20 |
| Historical composition specs preserved | 143 | 143, plus 1 appended replacement |
| F controls | 13 | 19 |

[link-retargets.json](link-retargets.json) owns one row per link and both YAML
list entries, with source coordinates, old/new targets, move-set selectors,
exact alias ids where the move set splits a file, and forward/rollback diffs.
The source is in [manifest.json](manifest.json) **after G9 additions**. The
scanner uses every pinned `docs/platform/**/*.md`, replacing bytes with the F
result wherever composed; new chain-created files are included too. Code spans,
backtick/tilde fences and comments are excluded. Used reference definitions are
also scanned. The one no-successor link (`docs/specs/reading-map.md`) becomes a
code span with its original text retained. Already-retargeted links never enter
this record. The scan's 160/40 population independently matches w28.

[check.json](check.json) binds all final after-hashes and source hashes.
[link-scan-before.json](link-scan-before.json) retains the complete initial link
census. [link-validation.json](link-validation.json) verifies all 41 exact
roundtrips, 49 existing destination files, 64 real destination anchors, unchanged
judgments/evidence and unchanged historical spec objects. Exact commands,
stdout/stderr/exits and the reproducible validation source are in
[link-commands.json](link-commands.json).

## Reused doors and bounded corrections

- Reused `check_shard.replay_chain`, `composition/compose.py::apply_diff`,
  `replacement_result`, the existing pointer-patch reader, exact co-composition
  edges and the move set's draft-alias ids. Git history shows the earlier rebase
  and one-door consolidation; no retired alternate apply path was restored.
- Appended `rebased-current:rebased:w8:gloss:docs/platform/work-state/spec.md`;
  selected it instead of its stale predecessor, refreshed the three copies of
  the existing shard-3 chain-basis patch and the one G9 whole-body witness,
  including its source pin and predecessor metadata. All old specs remain
  unchanged; old shard proposals and the full old witness are retained in
  [link-rebase-history.json](link-rebase-history.json). No decision changes.
- Three retargets share a line with earlier **status framing**, not an earlier
  retarget. Their manifest edges name the complete exact base chain, while the
  before-hash also binds intervening disjoint residuals. `apply_one` now reads
  only actual `chainEntryId` trace entries for that existing base-chain edge,
  not residual entries' absent keys. Independent same-line owners still fail;
  controls prove both the valid edge and rejection of a wrong edge.
- `check.py` now reports `linkIntoMoveSet` on the final composed state; its
  negative control injects a real prepared link through `compose()` and observes
  failure. Conflicting record/manifest `composedBy` fields now fail rather than
  silently choosing the record. The zero-fuzz control disables its exact-base
  guard, asserts that the real `patch --fuzz=0` command fails, and separately
  verifies that pure offsets remain valid. No check is bypassed for green.
- Corrected the stale f07667/f07871 notes. The existing G0 receipt now names
  `rebased:w8:gap05:relocation` and its full step after-hash
  `6b457550660701bf10f5f25f2f466df5e601dafa8df441410d7060ae1cd370db` in its
  [F-duty supplement](../g0rework/final-pin-duties.json). Its later final-file
  hash is distinct; the 134 overlay approvals remain conditional and require
  final-F rebind/delta review. The register and ledger were not edited.

## Commands and exits (current turn)

Run from the repository root with `P=plans/260925-documentation-authority-unification/reports/phase-09`
and `NODE_OPTIONS=--no-addons`. Every Python invocation uses `-B`.

| Command | Exit / result |
| --- | --- |
| `python3 -B $P/fchain/check.py --pin HEAD` | **0**; 572 files, 182 executed, 20 links, zero findings including `linkIntoMoveSet` |
| `python3 -B $P/fchain/controls.py` | **0**; 19 controls |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | **0**; 787 rows, zero unresolved, 24 existing resolved markers |
| `python3 -B $P/g9/check_phase9_decisions.py` | **0**; all 158 decisions, 136 root occurrences, 12 gateway readers |
| `node $P/carries/verify-carries.mjs` | **0**; 44 claims, 24 pointer files, 1,208 bindings; existing two final-pin duties unchanged |
| `python3 -B $P/fchain/prove.py --census` | **0**; original `census-join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` twice, both **0**, all three JSON outputs byte-identical; 140 files / 1,126 sites |
| `python3 -B $P/preserve-premise/park-judgments/check_shard_controls.py` | **0**; 82 controls |
| `python3 -B -c <validation source recorded in link-commands.json>` | **0**; history, judgment, target, anchor and exact replacement conservation |
| `git diff --check` | **0** |

Initial diagnostics: F check exited **1** with four work-state findings. The
scratch rebase author exited **0**, then the F replay had zero old findings and
reported the 160 links. The retarget author exited **0**, but its replay reported
**1** with three status-line overlaps; the explicit existing co-composition
edges above resolve those. One intermediate scratch manifest-edit attempt exited
**1** on a residual trace's absent `chainEntryId`, before saving any file; the
base-chain filter above resolves the actual issue. Preliminary controls (**17**,
then **19**) and required proof reruns all exited **0**. No failed replay is
counted as a passing proof.

Only volatile census argv/tempfile paths and the controls' HEAD field were
restored after semantic equality checks; the transient HEAD-named shard report
was removed. The current invocation and nested census evidence remain in
`link-commands.json`. Scratch was confined to disposable `/tmp/fgos-work/`
folders and removed. No `docs/`, ledger, register, review, product file or private
state was written; no git write, fgOS CLI, native addon, product/full-suite test,
forbidden audit driver or pair accounting ran. Markdown preview was not started
because this records-only task forbids extra state/service writes.

Impact-analysis: **degraded** under the no-CLI/no-MCP boundary. Static affected
callers are the shared F door, premise/G9 checker wiring and owning controls;
no complete blast-radius claim is made. All 787 judgments, 158 G9 decisions,
Step-7 packet and carry/census authoring packets remain unchanged. Independent
review, final-F current-truth acceptance and cutover duties remain open.

---

# Previous current-doc rebase receipt (historical)

Status: **mechanical records proof passes; no product application, semantic approval,
gate closure or cutover authorization.** Authority: L13-21.1 and L13-24, under the
[w27 records brief](../w27-fchain-rebase-brief.md).

Replay pin: `5cb7d0cddabb93f5d5fcd7a0a85468447209fb2b` (`HEAD` during this turn).
G9 immutable decision/evidence pin: `56b3c3ebffddca273154e482e581591113c394da`.
Original premise evidence pin: `c94545de5b45873cb2eb419f10124283fd730a2e`.
Census authoring/replay pin: `608a4ada5f195b0d0b9d3568a71b8dde4954aacb`.

## Read and reproduce

The only prepared-byte replay door remains [check.py](check.py), using the
unchanged [manifest.json](manifest.json). [check.json](check.json) records all
548 composed after-hashes, selected predecessors, concrete owners and source hashes.
[rebase-commands.json](rebase-commands.json) retains exact final argv, stdout,
stderr and exits, plus initial failed diagnostic results.
[rebase-validation.json](rebase-validation.json) records decision/history/scope
conservation checks. [rebase-history.json](rebase-history.json) retains all 21
initial findings and the six old/new spec references and pre/post hashes.

With `P=plans/260925-documentation-authority-unification/reports/phase-09`, use
the commands below. No source document is applied or edited by these proofs.

## Resolutions: 16 conflict, 3 sameLinesTwice, 2 ownerless → zero

1. **Nine stale chain findings across five files:** append six replacement steps
   in `composition/patch-specs.json`, preserving all 137 historical spec objects
   and all 423 Step-7 specs byte-for-byte. Select the replacements through the
   existing effective-id lists, `replaces`, `supersedes` and exact predecessor
   fields, as the earlier chain rebase did. The files are component-boundary,
   runner dispatch-vocabulary architecture, runner business rules, work-state
   and workflow. Component-boundary retains its two distinct steps: the evaluator
   pointer correction and the approved source-carriage relocation. No decision
   or approved placement is redesigned.
2. **Five whole-body witness conflicts:** rebase exactly those five G9 witnesses
   onto current pin bytes and link them to the selected steps. Their old full
   records remain retrievable through each `rebaseHistory` Git commit/selector;
   the other 541 witnesses are unchanged. Witnesses remain non-executable readers.
3. **Shard contract and workflow proposal conflicts:** refresh the existing
   `basis: chain` contract in four row copies: f08069/f08076/f08084 (one work-state
   patch) and f08335 (one workflow patch). The exact replacements, owners, frozen
   evidence, successor bindings, judgments and pin/chain basis choices do not change.
4. **Two ownerless roots:** the successfully replayed work-state and workflow
   replacement steps now bind to their concrete composition-record selectors in
   `check.json.baseOwners`. They are not independent extra patches or invented owners.
5. **Three sameLinesTwice preservation findings:** f07671/f07672/f07686 all
   observe the same dispatch-vocabulary provenance note, already corrected by
   upstream commit `594fe4194` (turn 722). Each links that single upstream owner
   through `preservationRebind.composedBy`, with full pin/file/unit hashes and
   source ordinals; none carries an executable patch. Original judgments and
   frozen evidence remain unchanged. The note is preserved in its corrected form,
   not reverted to obsolete citation wording.

The premise checker owns rebind authentication through the existing Git/span
proof primitives: both ancestry edges, exact source identity, one-to-one line
correspondence and the commit that actually introduced the corrected line.
Without a rebind, the original preservation obligation stays strict. The F door
calls this same owning helper rather than maintaining a second interpretation.
A valid rebind still cannot authorize a later F patch to rewrite the corrected note.

## Reused mechanisms and bounded checker correction

`check_shard.replay_chain`, `composition/compose.py::apply_diff`,
`step-07-assemble.py::hunk_edits`/`locate_edit`, exact forward/inverse diffs and
`replacement_result` remain the replay and rebase primitives. Prior history,
including the earlier appended-root rebase, was inspected before choosing this
representation. No alternative patch engine or permanent rebase script was added.

The first G9 run also exposed an unrelated global-byte-drift guard: all five
changed documents have **zero gateway operand occurrences at both pins**. Its
scanner now authenticates that absence in both domains for changed non-readers.
Actual gateway readers still require exact pin/checkout bytes; adding, removing
or editing a gateway reader remains an error. This does not re-pin decisions,
exclude any file, or change the 473-file / 12-active-reader census.

The complete result retains the upstream inline/fenced-code literal repairs,
work-state priority error-reporting correction and corrected vocabulary citations.
These are explicitly checked in `rebase-validation.json`, not inferred from green
patch application alone.

## Commands and exits

All final commands below exited **0**. Each Python invocation uses `-B`.

| Command | Result / owning evidence |
|---|---|
| `python3 -B $P/fchain/check.py --pin HEAD` | 548 files; 141 executable proposals; 20 existing links; zero findings (`check.json`) |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | 787 rows; zero unresolved; 24 existing resolved markers; shared F exit 0 (`chain-check-5cb7d0cdd.json`) |
| `python3 -B $P/g9/check_phase9_decisions.py` | All 158 decisions; 136 root-document occurrences; 12 gateway readers; pass |
| `node $P/carries/verify-carries.mjs` | 44 claims; 24 pointer files; 1,208 live successor bindings; existing final-pin duties unchanged |
| `python3 -B $P/fchain/prove.py --census` | Original `census-join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` twice; both exit 0; all JSON outputs byte-identical; 140 files / 1,126 sites |
| `python3 -B $P/fchain/controls.py` | 13 controls pass, including non-reader drift and rejection of added/removed/edited gateway readers |
| `python3 -B $P/preserve-premise/park-judgments/check_shard_controls.py` | 82 controls pass, including forged source/owner/hash/ordinal, wrong ancestry, parallel patch and downstream rewrite rejection |
| `python3 -B $P/g9/check_phase9_decisions.py --self-test` | All 30 existing negative controls pass |
| `git diff --check` | Exit 0; no whitespace errors |

Initial diagnostics were not successes: the original F check exited **1** with
16 conflict / 3 sameLinesTwice / 2 ownerless; after the six-step rebase it exited
**1** with only the three preservation findings. The first G9 run exited **1**
with `non-record scan inputs differ from sourcePin`; the bounded scanner correction
above resolves that separately. A first disposable rebase-script attempt failed
before persisting records and was corrected; the successful run and all final
proofs are reflected above. One aggregate verification shell hit its 300-second
harness timeout during the optional G9 self-test; its complete rerun finished
successfully with a longer command budget. No test was disabled or skipped.

The census proof reuses the existing output-only `dump` relocation into
auto-cleaned tempfiles; original inputs, assertions and both citation `--check`
calls still execute. Its existing `census-replay.json` was restored because only
checkout/tempfile argv paths changed; source hash, stdout, exits and every output
hash were identical. Final invocation evidence is in `rebase-commands.json`.

`commands.json`, `root-replay.json`, `composition-replay.json` and `audit.json`
remain historical receipts of the previous turn, not proofs at this pin.
`prove.py --all` includes that turn's deliberately frozen-body audit; it is not
this brief's reproduction command. No old audit was weakened to accept new bytes.

## Boundaries and remaining duties

All 787 original judgments/evidence, the entire 158-decision G9 file, historical
spec objects, Step-7 packet and carry/census authoring packets are unchanged.
Only permitted records/checkers were changed; no `docs/`, ledger, register,
review, product/runtime file or private state was written. No git writes, fgOS
CLI, native addons, npm/cargo/product tests, pair accounting or cutover commands
were used. Scratch was confined to disposable `/tmp/fgos-work/` directories.

Impact analysis is degraded under the brief's CLI/tool constraints: no provider
query or impact tools are available here. Static callers of the changed checker
paths are the premise CLI, shared F checker, G9 checker and their owning controls;
no blast-radius completeness claim is made.

Conservation/current-truth acceptance, independent review, final-F rebind duties,
lease and authorized product application remain unchanged. Green mechanical
replay does not transfer old approvals to new hashes or authorize the cutover.
