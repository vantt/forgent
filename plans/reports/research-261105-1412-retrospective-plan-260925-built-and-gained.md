# Retrospective research: plan 260925, phases 1 to 10, what was built and what was gained

Date: 2026-11-05 (Asia/Saigon). Read-only research. Written for the retrospective post series.

Phase numbers below are the renumbered ones (renumbered from 1 on 2026-09-29). The old plan called
them 00 to 09. Git tags, branch names and the artifact file names under `reports/` keep the old
numbers (for example `reports/phase-02-doc-inventory.json` is Phase 3 evidence).

Sources and conventions in this report:
- TAG = `archive/doc-260925-lineage` (commit `84bbfa7b8`, about 21,300 files). Cited as
  `TAG:plans/260925-documentation-authority-unification/<file>`, abbreviated `TAG:P/<file>`.
  Nothing was extracted or checked out; I used `git show` and `git ls-tree` only.
- MAIN = current main checkout at HEAD `d44076887`.
- Dates come from `git log` and from the phase files. Where a phase file and the board disagree I say so.
- The phase files at TAG are a frozen snapshot of 2026-10-23. Their Phase 9 and Phase 10 status lines
  ("pending", "in progress: PRE-FLIP gates only") are stale. The landing facts come from main commits
  and the board (`plans/261017-1313-fgos-platform-program-board/plan.md:79`).

## 1. Per-phase table

| # | Phase | Built (main artifacts) | Status and close date | Evidence |
|---|---|---|---|---|
| 1 | Correct planning and routing semantics | Verified per-area authority table with two axes (`authorityStatus`, `fileClass`); correction note on the old knowledge-registry plan; ledger entries for the future engine | Completed 2026-09-25; range `ac19f6d1e..documentation-authority-phase-00-20260925`; two independent reviews | `TAG:P/phase-01-*.md`; `TAG:P/current-authority-map-2026-09-25.md`; `TAG:P/independent-frontier-review-2026-09-25.md` |
| 2 | Contain further divergence | Transitional switchboard (doc + JSON); preliminary claim and disposition vocabulary; legacy-docs ratchet (baseline, exceptions, script, test); migration authoring rules; shipped-path-conventions inventory | Completed 2026-09-26; tag `documentation-authority-phase-01-20260926` (target `f0c76c5e5`); re-review APPROVE | `TAG:P/phase-02-*.md`; `TAG:P/transitional-switchboard.json`; `TAG:P/claim-and-disposition-vocabulary.md` |
| 3 | Inventory and conservation ledger | `generate-doc-inventory.mjs` and independent gate checker; opaque identity registry (4,305 sources, 85,772 per-occurrence units at the time); claim rows with exactly one proposed owner each | Completed 2026-09-26; tag `documentation-authority-phase-02-20260926`; closure review APPROVE | `TAG:P/phase-03-*.md`; CHANGELOG lines 85-86 on MAIN |
| 4 | Freeze minimum constitution and method | `minimum-constitution.{md,json}` (frozen 2026-10-06); `claim-ledger.schema.json`; conservation checker; retirement dry-run; alias table and resolver contract; evidence-payload relocation policy; cutover write-lease design; dropped-claims register; generator fix (22.7 s, 1.92 GB peak) | Completed 2026-10-06; content commits `3b409a373..7c632737b` | `TAG:P/phase-04-*.md`; `TAG:P/minimum-constitution.md`; `TAG:P/alias-table-and-resolver-contract.md` |
| 5 | Dual pilot | Pilot A: blind re-audit of promoted host-invocation-routing. Pilot B: work-state spec plus `io-contract.md` rebuilt as `docs/platform/work-state/`. Defect register M-01..M-23; additive method amendments | Completed 2026-10-07, verdict PASS-WITH-AMENDMENTS (owner rulings); no tag | `TAG:P/reports/phase-05/pilot-method-defects.md` |
| 6 | Transform all areas as candidate material | Complete candidate corpus under `docs/platform/**`; reviewed decision shards (`ledger/decisions/`); 9,236 draft alias entries; identity registry and snapshot (68,441 rows, verify true) | Completed 2026-10-17, closed by the owner (A44) | `TAG:P/reports/phase-06/step-10-report.md`; `TAG:P/phase-06-*.md` |
| 7 | Cross-area integrity and fresh-reader review | Nine review dimensions D1-D9 run over the whole candidate corpus; corrections to docs only (for example Gateway CTR010 and confinement CTR011 contract-id split, gateway REST row added) | Completed 2026-10-19 (A48); closing red-team and re-reviews | `TAG:P/reports/phase-07/progress.md`; `TAG:P/phase-07-*.md` |
| 8 | Remove switchboard bypasses, prepare consumers | Consumer inventory (22 skill and task-spec files naming history plans, runtime reader `gateway.rs`, hooks, generators); prepared patch matrix; evidence relocation manifest and checker; documentation-cutover write lease; 12 owned PRE-FLIP gates | Completed 2026-10-23 (L12-136); review A and B APPROVE, C fixed | `TAG:P/reports/phase-08/progress.md`; board `plan.md:79` |
| 9 | Atomic platform-authority cutover | One product commit that moved authority to `docs/platform`, retired `docs/specs` and `docs/architect`, merged the two reading maps, installed three guards (retired roots, placement, link/anchor), repointed consumers, sealed the claim ledger | Landed 2026-11-03 (commit time 22:07 +07, board log 23:50): main `97dd62aa7` | `git show --stat 97dd62aa7`; board `log.md:12` |
| 10 | Post-cutover maintenance MVP | `fgos convention classify` returns `canonical`, `metadataExempt`, `generated`; `scripts/doc-health.mjs` with three rules (links, header metadata, dead references); 26 docs given the governance header; 166 dead backticked paths swept; about 14 plan-era scripts and their tests retired; handoff row PF-I024 | Landed 2026-11-04 about 13:20; board names tip `97cc4b432`; work commits `46310f968..00c64d5a5` | scout report; `docs/platform/convention/spec.md:382`; ledger row PF-I024 |
| after 10 | Cutover lease retirement (not a numbered phase) | Removes the lease module, `docs-lease` verb, hooks and lock row (39 files, +182/-2,734) | Landed 2026-11-04 15:50: `c7a354e1d`, merge `ad72e3a46` | `git show --stat c7a354e1d` |

## 2. Per-phase narrative

### Phase 1: correct planning and routing semantics (2026-09-25)

What it built. No tooling. It was a truth reset. The plan produced a verified authority table, one
route per area and root document, with `authorityStatus` (`promoted`, `candidate`, `legacy-current`,
`conflicted`, `non-authority`) kept separate from `fileClass`. It wrote a correction note beside the old
knowledge-registry plan (the registry code landed at `5c948d2a4`, enforcement flipped at `6cce97ab3` on
2026-08-27, per plan.md section 2.2) instead of rewriting history.

What it did. It found that `docs/doc-governance.md` section 13, `docs/reading-map.md`,
`docs/specs/reading-map.md` and the portals each stated a different migration rule, and it listed every
always-loaded pointer that bypassed the transitional route (`TAG:P/phase-01-*.md`, Deliverables).

Why it was needed. A plan to collapse authorities cannot start from a belief that there are two clean
trees. Plan.md section 2.1 says readers met "a fragmented authority state, not a clean two-tree split"
(some areas already promoted, some portals still delegating back to legacy roots).

Gained. A stranger could tell proposal, plan, historical plan and intent ledger apart
(success criteria checked in `TAG:P/phase-01-*.md`).

### Phase 2: contain further divergence (2026-09-26)

Built. The transitional switchboard (`docs/transitional-switchboard.md` plus
`transitional-switchboard.json`), the preliminary vocabulary of 16 dispositions and claim kinds, a baseline
of legacy-root files with digests, a ratchet that refused new files and unaccounted edits under legacy
roots, `docs/platform/migration-authoring-rules.md` ("update the current owner once, record the candidate
impact, never dual-author"), and an inventory of path conventions shipped to consumer projects.

Why. While the migration ran, people kept editing legacy roots. Without a ratchet the target would be
chasing a moving source. The shipped-path inventory enforced plan decision 11: this repo's topology must
not silently become the contract of projects that consume fgOS.

Gained. "No writer has to guess between legacy and target; no new legacy file can appear without a recorded
exception" (Phase 2 success criteria, both ticked at TAG).

### Phase 3: inventory and conservation ledger (2026-09-26)

Built. A deterministic inventory generator plus an independent gate checker that recomputes the in-scope
file set. Every heading and every non-trivial unheaded block became a claim row with exactly one proposed
owner; links, consumers (literal, dynamic, glob, fixture, executable proof, shipped contract), duplicates
and conflicts were recorded. A populated opaque identity registry made claim identity path-independent.

Why. The plan's central promise is "no scope reduction by omission" (plan.md section 3, decision 12). That
needs a count of what exists before anything is moved: 4,305 sources, 85,772 units at the base.

Gained. Unresolved conflicts were explicit and blocked promotion (success criteria). This also created the
measurement base that later exposed what earlier audits missed (Phase 5).

### Phase 4: freeze the minimum constitution and migration method (2026-10-06)

Built. The frozen minimum constitution (kinds, placement, cardinality, metadata, conflict handling,
promotion and retirement gates), the claim ledger schema, the conservation checker with the dropped-claims
register wired in, a retirement dry-run, the alias table and resolver contract, the evidence-payload
relocation policy (the payload exists twice byte for byte, so relocation is a deduplication), and the
cutover write-lease design. A pre-step fixed the inventory generator, which ran out of memory because it
read its own roughly 250 MB of saved output; after the fix it finishes in 22.7 s with 1.92 GB peak and an
unchanged 86,085 claim rows (`TAG:P/phase-04-*.md`, pre-step 0a).

Why. Plan decision 6: minimum controls must precede rewriting. The phase also resolved a dependency cycle
between constitution and inventory (Phase 2 publishes the preliminary vocabulary, Phase 4 freezes the
evidence-corrected one).

Gained. A small testable contract for a migration of this size, with deferred richer fields listed instead
of dropped. It also recorded owner decisions on frozen gates (`verify-phase-01` and `verify-phase-02` are
frozen for their approved ranges).

### Phase 5: dual pilot (2026-10-07, PASS-WITH-AMENDMENTS)

Built. Pilot A re-audited one already promoted small area, host-invocation-routing, with a blind
source-to-target pass. Pilot B transformed an unpromoted mixed area, the work-state spec and
`docs/io-contract.md` (366 rows), into candidate target documents, then ran alias, link-rewrite and
fresh-reader tests.

What it found. Pilot A reproduced 16 real drops that the earlier coverage-matrix audit had claimed as
preserved; they became `dropped-002` to `dropped-017` in the register. The pilot also found method
defects M-01..M-23; the ones that mattered most: M-05 (the extractor ignored every block under 20
characters, 3,589 lines across 1,179 files) and M-09 (review packs hid block-level anchor errors).

Scorecard (`TAG:P/reports/phase-05/pilot-method-defects.md`, section 2). Met: E2 structural (10/10 seeded,
0 on the unmutated copy), E3 semantic (6/6 mutations caught, 0/24 false flags, an upper bound), E4
coverage (366/366 reviewed). Not met: E6 aliases (14 of 20 history references resolve), E7 link preview
(15.6% of rewrite edges with an anchor). E1 and E8 were partly met and settled by owner rulings. The
verdict was "Not PASS" until the owner ruled; the plan table records PASS-WITH-AMENDMENTS.

Why it mattered. The point of a pilot is to falsify the method before applying it everywhere. It did:
it changed the review procedure and the gates before Phase 6 scale.

### Phase 6: transform all areas as candidate material (closed 2026-10-17)

Built. The whole target corpus under `docs/platform/**` as candidate material, executed by a single Codex
session at a time with separate review sessions (author and reviewer identities kept apart by a gate check).
Every legacy claim got a reviewed owner or a recorded non-carry. Aggregate close evidence at the final pin
`2a028cdc9`: promotion 160/160, independent review of the identity carry 114/114 ok, global comparison 0
fatal, strict conservation 0 pending, 9,236 draft aliases valid, snapshot 68,441 rows with verify true
(`TAG:P/reports/phase-06/step-10-report.md`).

Why. Plan decision 4: transform candidates area by area without a second live authority.

Caveat. The close report says the two audit receipts are "one author-written audit command/output, not two
independent confirmations", and the close stopped once because the identity scope included root
`AGENTS.md` and not only `docs/` (the L10-42 carry). I report these as the report words them.

### Phase 7: cross-area integrity and fresh-reader review (closed 2026-10-19)

Built. A review of the whole candidate corpus along nine dimensions (one owner per cross-area claim,
producer/consumer contract agreement, vocabulary, document-type separation, component boundary, preserved
intent, projection agreement, newcomer navigation, implementation alignment). Doc corrections only; no
gate, extractor or authority changes.

Example outcome. A contract-id collision was resolved (Gateway keeps CTR010, confinement takes CTR011, the
candidate registry gained the missing Gateway REST row; A45, accepted by a 15/15 independent re-review)
(`TAG:P/reports/phase-07/progress.md`).

Why. Per-area migration cannot see errors that sit between areas. A stranger must be able to answer the
six L5 questions without treating a legacy path as authority.

### Phase 8: eliminate switchboard bypasses, prepare consumers (closed 2026-10-23)

Built. A computed consumer inventory (the plan counts 22 skill and task-spec files that name history plans;
13 literal convention files and nine historical references), a prepared-patch matrix (46,404 unique rows at
one round, 55,658 at the last handoff, zero applied), the evidence-relocation manifest and checker, and the
cutover write lease (design built and rehearsed; see Phase 9).

Why. A cutover that changes files but not behavior leaves skills, hooks, doctor checks and the runtime
(`gateway.rs` read `docs/contracts/...`) pointing at retired paths. The phase turned the cutover into a
prepared, rehearsed change instead of hundreds of ad-hoc edits.

Honest state at close. Twelve PRE-FLIP gates remained owned and unmet when the phase closed (archive ref,
source-pin re-check of 518 records, lease-routed release, holder-land rehearsal, and others), and were
moved into Phase 9 (`TAG:P/phase-09-*.md`, "Owned PRE-FLIP prerequisites"). The progress log also records
an independent-audit baseline red of 247 findings "not waived" (`TAG:P/reports/phase-08/progress.md`).

### Phase 9: atomic cutover (2026-11-03)

Built and done. One product commit, `97dd62aa7` ("docs: cut documentation authority over to docs/platform
and retire the legacy roots"), 1,677 files changed, +182,794 / -239,220. By status letters: 166 added, 943
deleted, 446 modified, 122 renamed; 908 deletions were under `docs/architect`, six under `docs/specs`.
It also:
- merged `docs/specs/reading-map.md` into `docs/reading-map.md` (the old map is deleted in the same commit);
- rewrote `AGENTS.md` (+67 lines), `.githooks/pre-commit`, added `.githooks/reference-transaction`,
  updated skill sources and `bin/fgos.mjs`;
- added the retired-root and placement rows to `packages/convention/contracts/convention.rules.v1.json`
  (forbidden glob rows for `docs/specs/**`, `docs/architect/**`, `docs/decisions/**`, plus the
  `unplaced-platform` catch-all, all posture `block`);
- landed the three documentation guards as the same-change replacement for the ratchet (owner ruling
  L12-89): retired roots refused, placement check in Convention, link and anchor check in doc-health;
- carried the alias table (9,235 entries on main at `plans/260925-.../alias-table.json`) and a sealed
  claim ledger record (`docs/platform/history/documentation-authority-unification/sealed-claim-ledger.json`
  with a `.sha256`; 68,441 rows at snapshot commit `2a028cdc9`).
The bulk plan evidence (about 7.5 GB) was kept off main: local tag `archive/doc-260925-lineage` plus a
backup archive `.doc-work/plan-260925-evidence-84bbfa7b8.tar.zst` (board row DOC, `plan.md:79`). Main keeps
only the 27 plan-dir files that product code and tests read.

Why. Plan decision 5: the authority flip is atomic. Two live systems is exactly the problem the plan set
out to remove.

Open at landing. The board says "Chua activate release (LAND lam)". The scout measured that the activated
release `e02ee83d...` (staged 2026-11-02) did not carry the new rules, so the guards were dormant through
the installed host (scout section 2, gap G1). The board log for 2026-11-04 records LAND landing release
`47e1016d`; I did not re-verify the activation after that.

### Phase 10: post-cutover maintenance MVP (2026-11-04)

What changed from the phase file. The phase file at TAG lists five new `fgos doc` surfaces
(`classify`, `new`, `check`, `inventory`, `retirement-check`). A scout
(`plans/reports/scout-261104-1016-doc-maintenance-facts.md`) found that every check already had a door or
belonged to DOCOS, and that none of these surfaces had ever existed (`git log -S`: 0 commits). The plan was
rewritten to "no new verbs, no parallel checker" (commit `b37aea82c`), and the owner chose A on the batched
decisions (activate release, dead-reference rule, no new verbs, retire the lease as its own item).

Built.
- `fgos convention classify` exposes `canonical`, `metadataExempt`, `generated` (`46310f968`, schema tie
  `568f442f8`). Spec text at `docs/platform/convention/spec.md:171`.
- `scripts/doc-health.mjs` (`8b38f576c` moves the link check there) with three strict rules: links,
  governance header metadata, dead backticked paths unless the line pins a real commit sha
  (`0aef4b710`, `b7873f150`, `1bdcb0e49`). Rules in `docs/platform/convention/spec.md:382`.
- Content fixes: 26 documents given the governance header (`df300488c`), dead-path sweep (`693effa1d`),
  rule stated in governance (`0c41170da`).
- Retired about 14 plan-era scripts and their tests (`159971615`), for example
  `check-doc-candidate-status.mjs` (no longer present on main).
- Handoff row PF-I024 for what was not built (`2d9850892`, `097cf6f7f`).
Afterwards the cutover lease was retired as its own item (`c7a354e1d`, merge `ad72e3a46`).

Why. The Phase 9 guards covered path, placement and links only. Measured on 2026-11-04 before the work:
22 platform docs lacked required metadata (G2) and 166 unpinned dead backticked paths sat in 43 canonical
docs (G3).

## 3. The gain, with evidence

What the repository has now that it did not have before the cutover (checked on MAIN, 2026-11-05):

1. One authority tree. `docs/specs` and `docs/architect` do not exist (`ls` fails on both).
   `docs/platform/` holds 628 Markdown files in 34 area directories. `docs/decisions/` still exists as a
   directory and, by rule, may hold only the generated `index.md` (convention row and scout section 1.1).
   Evidence: `97dd62aa7` stat (908 deletes under `docs/architect`).
2. One reading map. `docs/reading-map.md` contains the merged map with provenance from both old maps
   (header Provenance lines; section 5 "detailed product and source map").
3. A reproducible health check. `node scripts/doc-health.mjs` run today (read-only): "628 platform
   documents, 2607 local links, 302 metadata-exempt, 0 finding(s)". `test/scripts/doc-health.test.mjs`
   has a live self-check wired into the normal suite (one wiring proof); synthetic cases own the three
   rules.
4. Path and kind rules in one place. Convention owns naming and placement; forbidden rows block the retired
   roots (`convention.rules.v1.json:143-148`). Pre-commit calls `convention check` on staged `docs/**`; doctor
   row `convention-conformance` runs `check --all` (scout section 1.1, with registrations line numbers; I did
   not re-read those two files).
5. Lookup lineage survives. The 9,235-entry alias table and the sealed claim ledger
   (`sealed-claim-ledger.json`, sha256 `9fb6187e...`) let old paths and claim identities be traced after
   the old roots are gone; the full plan evidence is on the local tag.
6. L5 answers for a stranger. `AGENTS.md` now routes the six definition-of-done questions through
   `docs/reading-map.md`, `docs/platform/platform-foundations.md` (L1-L10), and the area specs
   ("Before touching code", "Definition of done" sections). I did not run a new fresh-reader test after
   the cutover; the last fresh-reader results are Phase 5 (reader 2: 6 of 6 per scenario, reader 1 missed on
   two invented anchors) and Phase 7 (closing review, details at TAG).
7. Fewer moving parts to carry. Phase 10 retired about 9.5k script lines and 23 test files (scout
   section 1.3 estimate), and the lease removal deleted 2,734 lines across 39 files (`c7a354e1d`).

## 4. What was not gained, or is still open

- The documentation operating system is not built. Board row DOCOS: status "not-planned", no plan exists
  (`plans/261017-1313-fgos-platform-program-board/plan.md:80`). Ledger row PF-I024 lists three unbuilt items:
  one write door (`fgos doc new`), a claim-level owner check, and a check that skills or commands named in a
  canonical doc exist. Measured reasons: `Canonical for` held 18 distinct values and one string was shared by
  60 documents; 12 `fgos <verb>` names not in the Node registry were native verbs or history; `fgos-*`
  names collide with crate names and error codes.
- doc-health runs only in `npm test`. It is not in pre-commit (deliberately; convention spec line 382 says
  "It is not duplicated in pre-commit") and has no doctor row ("adds no ... new doctor registry id"). A
  commit that breaks a link is caught when the suite runs, not at commit time.
- doc-health depends on the native host for classification (`FGOS_HOST_BIN` or built host in tests).
  Unverified here: behavior on a machine with only an older activated release.
- Phase 9 guards were dormant on the installed host at landing (gap G1). Whether the later release
  `47e1016d` carries the new rules was not re-checked in this research.
- A claim-level duplicate-owner check does not exist. Path-level singleton cardinality does.
- Dead-reference rule limits: it covers canonical docs only (kinds `history`, `decision`, `verification`
  exempt), and a same-line sha pin hides a stale claim next to it (accepted risk, scout section 3).
  Code comments citing retired doc roots (9 lines in `src/`) were outside the scope; I did not check
  whether they were later fixed.
- Plan evidence is not in git history on main. It lives on a local tag and a local archive; the sealed
  ledger README says the plan files are "kept with the plan evidence on the local plan branch and in the
  backup archive". If the local tag and archive are lost, the detailed per-claim decisions are gone and only
  the sealed digest record and 27 plan-dir files remain. Whether the tag is pushed: unverified.
- `plans/260925-documentation-authority-unification/plan.md` on main still carries the older
  "in-progress, Phases 1-8 closed, Phase 9 PRE-FLIP" status text (checked at MAIN, lines 3 and 15). The
  board is the current record. This is a stale-status defect in a stateful plan file, not a product defect.
- Method limits from the plan's own records: the Phase 5 aliases and link-preview criteria (E6, E7) were not
  met; the Phase 8 independent-audit baseline red of 247 findings was "not waived" in the progress log;
  Phase 6 close audit receipts are one author-written command. I did not trace how these were finally
  settled before the cutover.
- CONV2 (convention second wave) is still a draft. The scout asked whether the shipped-path inventory
  script feeds it; unanswered here.

## 5. Open questions

1. Is `archive/doc-260925-lineage` pushed to a remote, or only local, and is the `.zst` backup on a second
   machine? This decides whether the conservation evidence survives a lost disk.
2. After release `47e1016d`, do `fgos convention check` and `classify` through the activated host return the
   new rules (the G1 proof, repeated)? Needs a read-only call on design-lap.
3. Should the stale status in `plans/260925-.../plan.md` on main be corrected, or is it intentionally left
   frozen? A retrospective post will quote one of the two.
4. How were the Phase 8 baseline red (247 independent-audit findings) and the Phase 5 E6/E7 misses closed?
   I found their records but not a final disposition in the files I read.
5. Does the owner want doc-health in pre-commit or in a doctor row? Currently a deliberate non-decision.
6. What date and time should the posts use for the cutover: commit time 2026-11-03 22:07 +07, or the board
   log 23:50 (push time)? I used both, labelled.
7. Phase 10 landing tip: the board says `97cc4b432`, but that commit itself only touches
   `setup-doctor-registry.md`; the work commits are `46310f968..00c64d5a5`. Which is the right reference
   for the post? I used both.
