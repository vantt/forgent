---
phase: 7
title: "Cross-area integrity and fresh-reader review"
status: pending
priority: P1
effort: ""
dependencies: [6]
---

# Phase 7: Cross-area integrity and fresh-reader review

> Legacy numbering: this was **Phase 06** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

> DRAFT (2026-10-07), written while Phase 6 is still running. Everything marked "UNPROVEN" or named in the table "Inputs that do not exist yet" must be re-checked against the real Phase 6 output before this file is promoted to `phase-07-*.md`. No fact about the final corpus (area list, retiring roots, counts of cross-area edges) is known today.

## Overview

**Status:** `not-started`, `not-authorized`. Blocked by Phase 6 (closed by the owner with verdict PASS or PASS-WITH-AMENDMENTS). Harness per `plan.md` 7.2: fresh-reader plus document review.
**Mode:** the plan worktree only. One executor session at a time: OpenAI Codex run by the owner, with repo access (read files, run `node` and `git` in the worktree) and no chat history. The executor does every step itself, inline and in order: no subagents, no dispatch (the dispatch rules of `AGENTS.md` do not apply), no skills. Review only, except fixes to candidate documents under `docs/platform/**` and to ledger data. No authority flips.
**Review model:** same as Phase 6. The executor writes findings and fixes; a separate review session (the Claude Lead or another fresh session, started by the owner) checks them at every "ready for review" point and writes the verdict file. The executor stops at "ready for review" and resumes when the verdict is committed. Fresh-reader sessions are started by the owner and never see the answer key or the plan. The owner personally decides: real contradictions between sources, anything that changes a locked law, `archive-with-reason` or deletions found during this phase, and every finding the executor marks "needs owner".
**Purpose:** Catch what per-area migration cannot see: claims, contracts, vocabulary and boundaries that are consistent inside each area but not across areas, and a newcomer's ability to navigate and author using only `docs/platform/**`.

### Read first (in this order)

1. [plan.md](plan.md) sections 1, 3, 5, 6 and 7.3 to 7.7 (7.7 is the executor brief: worktree rules, counting rule, report language).
2. This file, completely, before any command.
3. [minimum-constitution.md](minimum-constitution.md) (kinds, placement, `authorityConflict`, `promotionGate` check `intent-and-boundary`), [claim-and-disposition-vocabulary.md](claim-and-disposition-vocabulary.md).
4. The Phase 6 close: `reports/phase-06/step-10-report.md` and the scorecard, `reports/phase-06/holds.md`, `identical-unit-exceptions.md`, `post-review-edits.md`, `promoted-edits.md`, `rehearsal-step-10.md`, `ledger/conflict-resolutions.json`, the area maps `ledger/area-map-*.md`, `reports/phase-06/review-brief.md` (the fresh-reader prompt), `reports/phase-05/pilot-b-fresh-reader.md` and `pilot-b-fresh-reader-key.md` (the format Phase 7 reuses), [semantic-conflicts](reports/phase-05/semantic-conflicts.md).
5. `AGENTS.md` (the six definition-of-done questions) and `docs/doc-governance.md` sections 8 and 11 (intent ledger and component-boundary rules).

### Terms

| Term | Meaning |
|---|---|
| `P`, `W`, `S` | `P` = `plans/260925-documentation-authority-unification`; `W` = `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`; `S` = `/tmp/phase07` (scratch, outside the tree). |
| `B0`, `SYNC` | The Step 0 baseline commit and the merge commit of the latest `git merge main`; recorded in `reports/phase-07/progress.md`. |
| Dimension | One of the nine review dimensions of the table under Architecture. Each has a mechanical part (a helper script) and a judgment part (a reviewer). |
| Helper | A read-only Node script under `reports/phase-07/helpers/` that prints a table; never under `scripts/` (this phase changes no gate script). A helper's output is evidence, not a verdict. |
| Finding | A defect with id `F7-<nnn>`, dimension, severity (Critical, High, Medium, Low), evidence (`path#anchor` or command output), disposition (`fixed`, `needs-owner`, `accepted-with-reason`, `not-a-defect`), fixer and reviewer identity. Listed in `reports/phase-07/findings.md`. |
| Critical, High | Critical: two documents state contradicting normative facts about the same thing, or a contract disagrees with the code on a closed set, or a locked law is altered. High: a claim has two owners, a link or anchor needed to answer a definition-of-done question is dead, or a retired concept is described as current. Medium and Low: wording, labelling, navigation friction. |
| Seeded draw | A sample drawn with a recorded seed by the reviewer, never by the author. |
| Fresh reader, key | As in Phase 6: a session that has not seen the corpus, answers the six definition-of-done questions of `AGENTS.md` for change scenarios, using only `docs/platform/`; the answer key is committed before any reader starts; citations are checked by `node scripts/list-doc-anchors.mjs --check <path#anchor>`. |
| Cross-area scenario | A change that crosses at least two areas (examples under Step 7); Phase 6 readers saw one area at a time. |
| `authoredBy`, `reviewedBy` | Identity strings as in Phase 6: `codex-session:<id>@<YYYY-MM-DD>`, `reviewer:<model>-session:<id>@<YYYY-MM-DD>`, `script:<name>`. |

### Inputs that do not exist yet (verify each in Step 0; a missing one is `NEEDS_CONTEXT`)

| Input | Producer | Expected path | Why Phase 7 needs it |
|---|---|---|---|
| Closed Phase 6 and the owner's verdict | owner | `plan.md` 7.1 row 6 `completed`, record in 7.5b | start condition |
| Frozen area maps, retiring-root list, new areas | Phase 6 Step 1 | `ledger/area-map-*.md` | the set of areas and documents to cross-check |
| Reviewed decision shards | Phase 6 | `ledger/decisions/*.json` | the ownership data of dimension 1 |
| Conflict resolutions | Phase 6 Step 2 and 10 | `ledger/conflict-resolutions.json` | closed groups; Phase 7 re-checks them |
| Alias drafts and merged draft | Phase 6 Step 10 item 7 | `ledger/alias-drafts/` (merged file name not stated in the Phase 6 file: UNPROVEN) | dimension 8 resolves history references through them |
| Holds, identical-unit exceptions | Phase 6 | `reports/phase-06/holds.md`, `identical-unit-exceptions.md` | expected open data of check E |
| Scorecard, defects, effort | Phase 6 Step 10 item 10 | `reports/phase-06/` (file names not fixed in the Phase 6 file: UNPROVEN) | known defects not to rediscover |
| Reader instructions and key format | Phase 6 Step 1 | `reports/phase-06/review-brief.md` | reused for Step 7 |
| Dry-run ledger snapshot | Phase 6 Step 10 item 8 | `docs/platform/history/documentation-authority-unification/` | dimension 6 reads its README |
| Strict-input decision | owner (Phase 6 owner queue `strict-registry-input`) | `reports/phase-06/owner-queue.md` | the exact form of the gate commands D and E below |

### Preconditions (Step 0 stops if any is missing)

- `reports/phase-07/owner-answers.md` is committed with every field answered (template below) and authorization `yes`. The executor never guesses an answer.
- Clean tree; `pwd` and branch as in the shared rules; every input of the table above exists.

**Template of `reports/phase-07/owner-answers.md`** (`*` marks the recommendation of this draft):

```text
# Phase 7 owner answers
Date: <YYYY-MM-DD>        Recorded by: <owner>
Phase 7 authorized: yes | no
Q7-1 real contradictions in source content: owner decides the truth, executor writes it (SC-1 precedent)* | executor proposes, owner approves in one list
Q7-2 decision records after the cutover: area decisions/ documents plus generated docs/decisions/index.md* | other (name it)
Q7-3 fresh-reader authoring probe (one authoring scenario per reader): yes* | no
Q7-4 reader sessions: owner-started sessions of a model family different from the author* | two in-process read-only readers
Q7-5 sample sizes accepted as chosen thresholds (64 documents, 150 edges, 20 evidence citations): yes* | change (give numbers)
Q7-6 component-boundary check is repeated at Phase 9 if Plan B lands later: yes*
Review sessions: started by the owner; reviewer identity format as in Phase 6
```

## Requirements

- Review the whole candidate corpus as one system, never area by area; findings carry both sides (the two documents or the document and the code).
- Fix only what the review proves wrong, with the smallest edit that keeps every retained claim; no new claims (labelled `Added in candidate` when a link or scaffolding sentence is unavoidable).
- A contradiction whose truth is not decidable from code or from a locked decision is a real conflict: record both statements, do not choose a winner (constitution `authorityConflict`), and route it to the owner list.
- Every edit of a document that has reviewed decision rows is listed in `reports/phase-07/post-review-edits.md` first, then `--rebind`, then the returned rows go to a short review round (Phase 6 loop).
- No change to `AGENTS.md`, `CLAUDE.md`, legacy roots, the extractor closure, the rule text of the constitution or vocabulary, `alias-table.json`, any gate script.

**Allowed paths** (everything else is never modified; check A enforces it; list in `reports/phase-07/allowed-paths.json`):

| Path | Limit |
|---|---|
| `docs/platform/**` | fixes the review proves necessary; each logged in `reports/phase-07/post-review-edits.md`; documents routed `promoted` (the three area portals) are also logged with their diff in `reports/phase-07/promoted-edits.md` |
| `P/ledger/**` | decision shards for changed rows, `conflict-resolutions.json` entries, alias drafts |
| `P/reports/phase-07/**` | everything the phase writes, including `helpers/` |
| `P/dropped-claims-register.json` | `reviewedDisposition` fields only, if a finding touches an entry |
| `P/transitional-switchboard.json`, `docs/transitional-switchboard.md` | additive candidate routes only, if a finding shows an unrouted document |
| `P/plan.md` | `7.1` row 7 and the answers record in `7.5b` |
| `scripts/check-legacy-docs-ratchet.exceptions.json` | sync accounting |

## Architecture

Nine dimensions, one table. Mechanical column: what a helper or an existing gate proves; judgment column: what the reviewer reads. Both are mandatory; a dimension is closed only when its helper output is committed and its judgment sample is reviewed.

| # | Dimension | Mechanical part | Judgment part | Evidence file |
|---|---|---|---|---|
| 1 | One owner per cross-area claim | gate check D (`one-owner-per-semantic-claim`, `identical-units-multiple-owners`); helper `cross-area-claims.mjs`: (a) every `Canonical for` value claimed by two or more documents (exact match, and token overlap at least 0.6, a chosen threshold), (b) the same normalized heading text in two areas | the reviewer reads 100% of the pairs the helper lists | `reports/phase-07/d1-ownership.md` |
| 2 | Contract producer and consumer agreement | helper `closed-sets.mjs`: for each closed set named in the table below, the set stated in the contract document and the set in code, side by side | the reviewer reads every cross-area edge that targets a contract section (all if 150 or fewer, else 150 by seeded draw), both ends | `d2-contracts.md` |
| 3 | Platform-wide vocabulary consistency | helper `vocabulary-scan.mjs`: (a) the retired symbols of `test/runner/dead-vocabulary-guard.test.mjs` and the retired engine names (coordination session, herdr plugin names) searched in all `docs/platform/**` outside `history/` and evidence payloads, (b) the status, stage, exit-code and verb lists found in any document, compared with the sets of dimension 2 | the reviewer reads every hit | `d3-vocabulary.md` |
| 4 | Vision, spec, architecture, contract, decision separation | `node scripts/check-doc-constitution.mjs --no-ledger --check-placement --promotion` (0 leftover, 0 headerless) | stratified sample of 64 documents (8 per kind: spec, architecture, contract, decision, vision, guide-runbook, verification, proposal), seeded; defect = a document whose body is mostly another kind (at most 2 of 64, a chosen threshold) | `d4-separation.md` |
| 5 | Component-boundary correctness | helper `boundary-check.mjs`: each component named in `docs/platform/component-boundary.md` and in the area portals exists (a directory under `packages/`, `apps/`, `src/`, or an entry of `docs/architecture-manifest.json`), and each manifest component is named in a platform document | the reviewer compares the carried boundary text with `docs/architect/component-boundary/**` rows and records `No component-boundary change` or the change (`.claude/rules/documentation-management.md`) | `d5-boundary.md` |
| 6 | Preserved intent and deferred capabilities | helper `intent-check.mjs`: every row of every intent ledger has a status; every deferred row has a revisit trigger; each of the 16 `deferredToEngine` items of the constitution appears in a ledger by id; the full-horizon proposal `docs/platform/proposals/documentation-system-unification.md` differs from its pin only by labelled edits | the reviewer answers the `intent-and-boundary` check and writes `review-record.json` | `d6-intent.md`, `review-record.json` |
| 7 | Generated projection and source agreement | read-only freshness commands: `node bin/fgos.mjs decision-index --check` (never writes), the doc index and backlog generators' `--check` forms where they exist (UNPROVEN: read each `--help` first; record `no check mode` when absent), skill renders regenerated in a scratch clone and compared (`npm run build:skills` there; the diff must be empty) | none; any difference is a finding | `d7-projections.md` |
| 8 | Newcomer navigation without legacy paths | helper `reachability.mjs`: breadth-first walk over relative links from `docs/platform/README.md`; every non-history, non-payload document reachable within 3 hops; every area portal links every document of its area; no link from a platform document into `docs/specs/**`, `docs/architect/**`, `docs/io-contract.md` or `plans/` unless the line is labelled provenance | fresh readers (Step 7) | `d8-navigation.md`, Step 7 files |
| 9 | Implementation alignment and evidence quality | helper `alignment-check.mjs`: for each `verification/implementation-alignment.md`, every backticked repository path, `fgos <verb>` and symbol cited as implemented exists at HEAD (`COMMAND_REGISTRY` for verbs) | seeded sample of 20 evidence citations across areas: open the evidence and judge `supports`, `weak`, `absent` (at least 18 of 20 `supports`, a chosen threshold) | `d9-alignment.md` |

Closed sets for dimension 2 (the executor locates each in code with `git grep` and records `file:line`; a set with no code owner is recorded `no code owner`): CLI verbs and their `externalEffect` flag (`COMMAND_REGISTRY`, 15 verbs flagged at the time of the SC-1 ruling), exit codes (the single table of the CLI contract), work-item statuses and stages (state machine), dispatch mechanism results (`in-process`, `out-of-process`, `unavailable`), envelope and contract version tokens, claim dispositions and document kinds (vocabulary and constitution), event types of the log. These are examples from the pilots; the list is extended by what Step 2 finds.

## Related Code Files

- Read only: `scripts/check-doc-inventory-gates.mjs`, `scripts/check-doc-constitution.mjs`, `scripts/check-doc-candidate-status.mjs`, `scripts/check-doc-retirement.mjs`, `scripts/check-legacy-docs-ratchet.mjs`, `scripts/doc-alias-resolver.mjs`, `scripts/list-doc-anchors.mjs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `docs/architecture-manifest.json`.
- Create: `P/reports/phase-07/**` (files named in the table and the steps), `P/reports/phase-07/helpers/*.mjs` (nine helpers or fewer).
- Modify: `docs/platform/**` documents named by findings; shards and conflict resolutions under `P/ledger/`.

## Implementation Steps

### Shared rules (apply to every step)

**Session rules**

- Work only in `W`. Before any git command run `pwd` and `git branch --show-current` (must be `plan/260925-documentation-authority-unification`). Never write in `/home/vantt/projects/forgentX`. Merge main with `git merge main`; never rebase, never force-push, never push.
- Commit only explicit paths: `git commit -m "<conventional message>" -- <paths>`; never `git add -A`; messages `docs(unification): ...`, `docs(<area>): ...`; no phase, step or finding labels in messages, comments or test names (finding ids live in the findings file, not in commit messages or documents); commit the same turn the checks are green. Report to the owner as `plan.md` 7.7 says (Vietnamese, em and anh, short, evidence-based); file contents stay English.
- Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs`. Count with node scripts, never `grep | wc`. Helpers print the method line (what was counted, over which commit) before every number.
- Scratch: `S=/tmp/phase07; mkdir -p $S; cp P/reports/identity-registry.json $S/`, then `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry $S/identity-registry.json --json-out $S/doc-inventory.json --md-out $S/doc-inventory.md` (about 18 s, peak memory about 2.3 GB, one run at a time; shards never committed). Refresh before every gate run that follows a commit. Throwaway clones (Step 5 projection check) are made with `git clone --local <W> $S/clone`, never with `git worktree add` (that writes into the repository's `.git`), and removed after use.
- Resume protocol. Start of every session: read `reports/phase-07/progress.md`; `git status --porcelain` must be empty (if not, list the files and stop); confirm `HEAD` descends from the recorded last green commit; rebuild scratch if `$S` is gone; rerun checks A to I once. End of every session: update `progress.md` (step, state, last green commit, `B0`, `SYNC`, findings open and closed counts, pending review requests, owner-queue items open, next action) and commit it. States: `measuring`, `fixing`, `ready-for-review`, `in-review`, `rework`, `reader-runs`, `closed`.
- Owner questions go into `reports/phase-07/owner-queue.md` (id, question, options with the executor's recommendation, which step it blocks, date asked, answer). Release the queue once at each "ready for review", as one set.

**Checks.** Variables: `W`, `P`, `S`, `B0`, `SYNC`. Commands run from `W`.

```bash
# A  own commits stay inside the Allowed paths (first-parent, no merges); exit 0, no output (same one-liner as the Phase 6 file, with reports/phase-07/allowed-paths.json)
# B  extractor closure unchanged; empty output
for f in scripts/generate-doc-inventory.mjs scripts/doc-inventory-artifact.mjs scripts/generate-shipped-path-inventory.mjs scripts/check-legacy-docs-ratchet.mjs scripts/lib/is-main-module.mjs; do echo "$f $(git rev-parse HEAD:$f)"; done | diff - $P/reports/phase-06/extractor-blobs.txt
# C  no area status changed since SYNC; prints [] (same one-liner as Phase 6 check C, with $SYNC)
# D  gate, non-strict, all decision inputs; exit 0. The previous-registry form follows the owner's answer recorded in reports/phase-06/owner-queue.md (strict-registry-input); until it exists this line is UNPROVEN
node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions $P/pilot/decisions --decisions $P/ledger/decisions --json > $S/gate.json
# E  gate, scoped strict over every legacy source (one --scope per source path listed in reports/phase-06/baseline-counts.md); open data equals the final Phase 6 hold list and identical-unit exceptions; prints ok (same checker one-liner as Phase 6 check E)
node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions $P/pilot/decisions --decisions $P/ledger/decisions --strict --scope <source> [--scope <source> ...] --json > $S/strict.json
# F  ratchet, placement and promotion; all exit 0, promotion reports 0 headerless and 0 missing
node scripts/check-legacy-docs-ratchet.mjs
node scripts/check-doc-constitution.mjs --no-ledger --check-placement --promotion
# G  no lost claim id, no self-review in D's JSON (same one-liner as Phase 6 check G)
# H  candidate status: 0 findings (the Phase 6 goal)
node scripts/check-doc-candidate-status.mjs --json > $S/cs.json
# I  no reader or instruction document links a candidate: output equals reports/phase-06/reader-links-baseline.txt
git grep -h -o 'docs/platform/[^ )`|>"]*' -- AGENTS.md CLAUDE.md README.md docs/README.md docs/reading-map.md docs/specs/reading-map.md | sort -u | diff - $P/reports/phase-06/reader-links-baseline.txt
# J  retirement dry run, for the record only (exit 1 is expected until Phase 9)
node scripts/check-doc-retirement.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --cutover --json > $S/retirement.json
```

(The retirement check takes `--inventory` and `--identity-registry` and, for the one human-review check, `--review-record <file>`.)

When each check runs: A, B, H after every commit that changes only `docs/platform/**` text; A to I after every fix commit batch and at the end of every step; after a merge of main: all, the ratchet exceptions entry, then re-pin `SYNC`.

Expected red until Phase 9, recorded as a delta and never fixed by weakening a gate: global `--strict`, `check-doc-retirement.mjs --cutover` (blocked checks that Phase 8 and 9 own: `consumers-rewritten`, `evidence-digests`, `write-lease`, `aliases-cover-immutable-refs`, and whatever Phase 6's last rehearsal listed).

**Findings and review**

- `findings.md` is a table committed with every step. A finding is closed only when its disposition is recorded and, for `fixed`, a reviewer verdict names it. The executor never marks a finding `not-a-defect` that a helper listed as a hit without a one-line reason.
- Review request: at the end of Steps 2 to 6 (one request for the group), write `reports/phase-07/review-request-<n>.md` (what was measured, helper outputs with commits, findings by severity, fixes with commits, list routed to the owner), commit it, set `ready-for-review`, release the owner queue, and STOP naming the file. The owner starts the reviewer with "follow reports/phase-07/review-brief.md for review-request-<n>.md".
- Reviewer: reads 100% of the helper tables and finding rows; redoes the seeded judgment samples of dimensions 4 and 9 and a 10% recompute of the mechanical counts (by running the helper itself); checks every `fixed` finding in the diff (the fix is the smallest one, no claim lost, no unlabelled claim added); writes `reports/phase-07/review-<n>.md` with a verdict per finding (`ok`, `rework`, `hold`) and, only after Step 6, the `review-record.json` for `intent-and-boundary`. The reviewer edits no document by hand and refuses to review a finding it fixed or authored.
- Rework: once. A second `rework` on more than 3% of the findings reviewed is a stop condition.

**Stop conditions** (stop, report to the owner, decide nothing; each has its measure)

| # | Condition | Measure |
|---|---|---|
| 1 | A constitution or vocabulary rule, or the extractor unit definition, would have to change | the needed edit is not an additive 2.x amendment, or check B differs |
| 2 | A gate script needs a change | any diff under `scripts/` is needed |
| 3 | A claim id is lost | check G fails or a refresh reports a missing id |
| 4 | The transformation is defective at the source | after the first review round, 10 or more Critical or High findings, or 3 or more of the 64 sampled documents fail dimension 4 (chosen thresholds, not measurements) |
| 5 | A Critical finding is not closed after one rework | open Critical count above 0 at the second review verdict |
| 6 | Source drift | a sync of main changes blobs of legacy roots whose rows are reviewed (compare with `reports/phase-06/source-blobs.txt` and its last update); changed rows divided by all rows of the affected batch above 10%: stop; below: re-decide through the Phase 6 loop |
| 7 | A merge conflict touches `docs/platform/**` content or 10 or more files | `git diff --name-only --diff-filter=U` after the merge |
| 8 | Isolation broken | check A, B, C or I fails, or an area status changes |
| 9 | Fresh readers fail twice | in two consecutive reader rounds, any scenario below 5 of 6 correct for the same reader session, or any non-existent anchor, or any legacy-authority answer |
| 10 | A precondition fails | an input of the table is missing, `owner-answers.md` missing or unsupported, tree dirty at a session start |
| 11 | Plan B or another plan lands during the phase and edits a reviewed area | `git log --no-merges --format=%h $SYNC_old..$SYNC_new -- docs/platform docs/specs docs/architect` shows a path of a reviewed batch: pause, sync, redo the affected dimensions |
| 12 | A re-run fails twice | the same check is red after one fix attempt |

### Step 0. Authorization, pin and inputs

1. Preconditions; `pwd`; branch; `git status --porcelain` empty; `git merge main`; record `git rev-parse main`; account new main-side legacy edits as ratchet exceptions (content-review-owed) exactly as Phase 6 did.
2. Verify every input of the table; write `reports/phase-07/inputs.md` (path, commit that last changed it, exists yes/no).
3. Scratch inventory; run D, F, H, I and J; save JSON. Write `reports/phase-07/baseline.md` (HEAD, main HEAD, `SYNC`, exit codes, open-data counts read by node from the JSON, the retirement dry run's blocked list), `allowed-paths.json`, `progress.md`, `owner-queue.md`, `findings.md` (header only), `post-review-edits.md`, `promoted-edits.md`. Record the answers of `owner-answers.md` in `plan.md` 7.5b as one bullet.
4. Write `reports/phase-07/review-brief.md` from the Phase 6 brief: what the reviewer reads, the checks per dimension, seeded draws, the verdict format, what the reviewer must not do, a hostile pass section (find contradictions between areas, claims with two owners, retired concepts described as current, dead navigation, evidence that does not support its claim), and the fresh-reader prompt of Step 7.
5. Commit `docs(unification): record the cross-area review baseline`; record that commit as `B0` in `progress.md` and in a second small commit. Done: baseline committed; D exit 0; F ratchet exit 0.

### Step 1. Helpers

Write the helpers under `reports/phase-07/helpers/` (read-only; each prints method, commit and counts as JSON and Markdown to stdout). Each helper first runs on a synthetic fixture with one seeded defect and must report it (a probe), then on the real tree; keep the fixture beside the helper. Helpers: `cross-area-claims`, `closed-sets`, `vocabulary-scan`, `boundary-check`, `intent-check`, `reachability`, `alignment-check`. Done: every helper reports its seeded defect and 0 defects on a clean fixture; outputs for the real tree are saved in `reports/phase-07/` and committed. No review needed for a helper beyond the reviewer re-running it in Steps 2 to 6.

### Step 2. Ownership and contracts (dimensions 1, 2)

Run `cross-area-claims` and `closed-sets`; read every hit; record findings. Re-check the closed conflict groups of `ledger/conflict-resolutions.json` against their stated rules (read 20 groups by seed chosen by the reviewer later; the executor reads all groups that span two areas). Cross-area edges that target a contract section: build the list from the inventory's link edges between areas (method line in the file), read both ends, record findings. Fix `fixed` findings in small commits (one document per commit), each logged in `post-review-edits.md`. Done: files `d1-ownership.md`, `d2-contracts.md` committed; open Critical findings listed with their owner route.

### Step 3. Vocabulary and separation (dimensions 3, 4)

Run `vocabulary-scan`; run the placement and promotion checks; the reviewer draws the 64-document sample at the review request and the executor does not pre-read it (the executor records only the helper hits). Fix per Step 2. Done: `d3-vocabulary.md`, `d4-separation.md` (the latter filled by the reviewer).

### Step 4. Boundary and intent (dimensions 5, 6)

Run `boundary-check` and `intent-check`; record `No component-boundary change` or the change after reading Plan B's state (`git log main --format='%h %s' -- plans/261006-1415-fgos-convention-component docs/platform/component-boundary.md docs/platform/convention`; Plan B's own new area enters the inventory as a candidate with no legacy source). Update intent ledgers only for claims this phase narrowed (rows in `post-review-edits.md`). Done: `d5-boundary.md`, `d6-intent.md`.

### Step 5. Projections, alignment, navigation mechanics (dimensions 7, 8 mechanical, 9)

Run the freshness commands of dimension 7 (read each `--help` first; never run a generator without its check form; no state-mutating `fgos` verb; `node bin/fgos.mjs decision-index --check` only), the clone-and-regenerate render comparison (`git clone --local W $S/clone`, symlink `node_modules` and `target` from `W`, `npm run build:skills`, `git status --porcelain` must be empty, remove the clone), `alignment-check`, `reachability`. Done: `d7-projections.md`, `d8-navigation.md` (mechanical part), `d9-alignment.md` (mechanical part).

### Step 6. Findings review

1. Write `review-request-1.md` for Steps 2 to 5; STOP at `ready-for-review`.
2. After the verdict: rework once; rerun A to I with a scratch refresh; sync main; changed rows (`decision-target-drift`, `decision-digest-stale`) go through `--rebind` and a short review round.
3. The reviewer fills the judgment parts of dimensions 4 and 9, answers the `intent-and-boundary` check and writes `review-record.json` (`{"intent-and-boundary": {"reviewer": "...", "reviewedAt": "YYYY-MM-DD", "evidence": "reports/phase-07/review-1.md"}}`). Verify with `node scripts/check-doc-retirement.mjs ... --review-record P/reports/phase-07/review-record.json --json`: that check moves from owed to pass.
Done: no open Critical finding; every High finding fixed or on the owner list; verdict committed.

### Step 7. Fresh readers: navigation and authoring (dimension 8)

1. Scenarios (three, each crossing at least two areas; the reader sees none of them in advance; adjust to the real area list): (A) add a new CLI verb that changes the work-item event schema and appears in the runner's dispatch decision; (B) change a field of the agent-to-agent handoff contract that host-invocation-routing and agent-coordination both consume; (C) add a new platform area (where does its spec go, which documents must register it, what does the definition of done require). Optional authoring probe (Q7-3): each reader also states, for a made-up claim ("fgos adds an `archived` status"), the document and heading where the claim is written, the metadata it needs, and the documents that must link it; scored against the key, nothing is written in the repository.
2. Write the answer key (acceptable owners per question, `path#anchor` checked by script) and commit it BEFORE any reader starts; record the commit in the report. The key is written by the executor from the area maps and the constitution; the reviewer checks it for answers that are too lenient.
3. Reader prompt (committed in `review-brief.md`): use only `docs/platform/` starting at `docs/platform/README.md`; never open `docs/specs/**`, `docs/architect/**`, `docs/io-contract.md`, `plans/`, `archive/`, `.fgos/`; treat `docs/platform/**` as canonical even where a document says "candidate"; answer the six definition-of-done questions per scenario with `path#anchor` citations and list every file opened in order; to resolve an old path found in text, use `node scripts/doc-alias-resolver.mjs --table <merged alias draft> --resolve <path> --exact`.
4. Two reader sessions started by the owner (Q7-4), each in a fresh session, one round each. Score by the Phase 6 rule (correct = acceptable owner with an existing, supporting citation and no legacy authority). Measures: at least 5 of 6 correct in every scenario, 0 non-existent anchors (check every citation with `node scripts/list-doc-anchors.mjs --check`), 0 legacy-authority answers, at most 8 files opened before the first correct owner document, 0 opened files under the forbidden roots (from the file lists; reader isolation is an instruction, not a sandbox: UNPROVEN, state it in the report).
5. Failures: classify each as a corpus defect (fix, finding), key defect (fix the key, rerun that reader), or reader error. A corpus defect is fixed and the failed scenario rerun by a new reader session; second failure is stop condition 9. The known pilot gap "where is a new decision record written" is expected to appear again: its answer follows Q7-2.
6. Done: `reports/phase-07/fresh-readers.md` (scores, anchors, files, failures, classification), key committed before readers, reader file lists stored.

### Step 8. Hostile pass and close

1. One hostile review pass by a reviewer session (prompt in `review-brief.md`) over the whole Phase 7 diff and the findings file: what did this review not look at; which cross-area claim, contract, term or navigation path remains unchecked; which helper rule was too narrow. Output `reports/phase-07/red-team-1.md`; 0 open Critical or High findings or owner acceptance.
2. Sync main; refresh; run A to J; counts of the final state in `reports/phase-07/step-report.md` (findings by dimension and severity, fixes, rows re-reviewed, hold list unchanged or listed, effort in sessions and review rounds, helper outputs, reader scores).
3. Write `reports/phase-07/handover-to-phase-08.md`: the final retiring-root list as used, the cross-area link graph counts, the findings left open with owner route, the consumer-relevant observations (links from always-loaded documents, shipped skills, tests and code comments that the review noticed), and the paths of the final alias draft.
4. Set `plan.md` 7.1 row 7 to "awaiting owner review". Closing is the owner's act; no tag.

## Success Criteria

Every item has its measure; "recorded" means in `reports/phase-07/`.

- [ ] all nine dimensions have their evidence file committed with method lines; helper probes reported their seeded defects;
- [ ] 0 open Critical findings and 0 open High findings that are not on the owner list; every finding has a disposition; every `fixed` finding has a reviewer verdict `ok`;
- [ ] check E prints `ok` and its open data equals the final Phase 6 hold list; check D exit 0; check G 0 findings; check H 0 findings; `--promotion` 0 headerless and 0 missing; ratchet exit 0; checks A, B, C, I green;
- [ ] `intent-and-boundary` passes in `check-doc-retirement.mjs` with the committed `review-record.json`;
- [ ] dimension 4 sample: at most 2 of 64 documents fail; dimension 9 sample: at least 18 of 20 citations `supports`;
- [ ] `decision-index --check` and the render comparison show no difference, and every generated document without a check form is listed as UNPROVEN;
- [ ] fresh readers: at least 5 of 6 correct in each of 3 scenarios per reader, 0 non-existent anchors, 0 legacy-authority answers, at most 8 files before the first correct owner, 0 forbidden-root files opened; a stranger can answer read-first, owner, contract, risk, verification and learning questions for cross-area changes without legacy authority;
- [ ] the retirement dry run's blocked list contains only checks that Phases 8 and 9 own, each named;
- [ ] no authority flip, no gate script changed, no extractor change, no claim id lost.

Verdicts: PASS, PASS-WITH-AMENDMENTS (additive fixes only), METHOD-MUST-CHANGE (stop and report).

## Risk Assessment

Program-level risks and countermeasures: `plan.md` section 11. Phase-specific:

| Risk | Detection | Response |
|---|---|---|
| The review repeats the author's blind spots (same model family) | seeded samples drawn by the reviewer, reader sessions from another family when available, hostile pass | stop condition 9 or 4; widen the samples with the owner |
| A helper rule is too narrow and the dimension looks green | helper probes with a seeded defect; hostile pass question "which rule was too narrow" | extend the helper, rerun, record |
| A fix edits a document with reviewed rows and silently stales them | `decision-target-drift` in check D | log first, `--rebind`, short review round |
| A real contradiction in the source gets "fixed" by choosing a winner | finding disposition `needs-owner` is the only allowed route; reviewer checks the diff of each `fixed` conflict | owner list; constitution `authorityConflict` |
| Plan B lands during the phase and changes component boundaries | stop condition 11 | sync, redo dimensions 1, 5, 8 |
| Readers see candidate banners and discount the corpus | reader prompt says to treat `docs/platform/**` as canonical; pilots recorded this exact effect as working as designed | none; recorded |
| Generated documents have no check mode | `--help` read per generator | UNPROVEN entry; carried to Phase 8 as a preparation item |

Rollback (the work is additive): `git revert` the phase's own commits (listed in `progress.md`; merges of main excluded). Whole phase, only on the owner's say: save the tip (`git branch backup/phase-07-<date>`), then `git reset --hard $B0`, redo `git merge main`, then `git status` clean and checks D and F green.

## Owner questions (bundled; recommendations marked `*`; the full text with options is in `open-questions.md`)

Q7-1 to Q7-6 are in the template of `owner-answers.md` above.
