---
phase: 6
title: "Transform all platform areas as candidate material"
status: pending
priority: P1
effort: ""
dependencies: [5]
---

# Phase 6: Transform all platform areas as candidate material

> Legacy numbering: this was **Phase 05** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`. Phase 5 is closed (PASS-WITH-AMENDMENTS, 2026-10-07). Planned 2026-10-07, revised the same day after validation and red-team (change log: [planning report section 12](reports/phase-06-planning-261007.md)). Evidence, area inventory, estimate and the owner questions Q1 to Q5: [reports/phase-06-planning-261007.md](reports/phase-06-planning-261007.md).
**Mode:** the plan worktree only. One executor session at a time: OpenAI Codex run by the owner, with repo access (read files, run `node` and `git` in the worktree) and no chat history. The executor does every step itself, inline and in order: no subagents, no dispatch (the dispatch rules of `AGENTS.md` do not apply), no skills. Candidate and review only; no authority flips.
**Review model:** the executor authors rows (`pending`). A row becomes `reviewed` only through a separate review session per batch (the Claude Lead or another fresh session, started by the owner). The executor stops at "ready for review" and resumes when the verdicts are committed. The owner personally reviews only the lists routed to the owner: `archive-with-reason` outside the Q3 delegation, every `delete-as-obsolete`, real conflicts, holds.
**Purpose:** Build the complete target corpus without creating a second live system. Every legacy platform claim ends with one reviewed owner in `docs/platform/**` or a recorded non-carry; every platform document carries the full header.

### Read first (in this order)

1. [plan.md](plan.md) sections 1, 3, 5 and 7.3 to 7.7 (7.7 is the executor brief: worktree rules, counting rule, report language).
2. This file, completely, before any command.
3. [minimum-constitution.md](minimum-constitution.md), [claim-and-disposition-vocabulary.md](claim-and-disposition-vocabulary.md), [pilot/README.md](pilot/README.md), [pilot/claim-decisions.schema.json](pilot/claim-decisions.schema.json), and one worked decision row: any row of `pilot/decisions/b-behaviors.json`.
4. Phase 5 method record: [pilot-method-defects](reports/phase-05/pilot-method-defects.md), [fix-round](reports/phase-05/fix-round.md), [pilot-b-sensitivity](reports/phase-05/pilot-b-sensitivity.md), [pilot-b-fresh-reader-key](reports/phase-05/pilot-b-fresh-reader-key.md), [pilot-a-discrepancy](reports/phase-05/pilot-a-discrepancy.md) section 2, [semantic-conflicts](reports/phase-05/semantic-conflicts.md), [dropped-claims-register.json](dropped-claims-register.json).
5. `AGENTS.md` (the six definition-of-done questions) and the planning report.

### Terms

| Term | Meaning |
|---|---|
| `P` | Shorthand for `plans/260925-documentation-authority-unification` (the plan directory), used in paths and commands. |
| Pin, `B0` | The Step 0 baseline commit; its sha, the per-source blob ids, the evidence tree hash and the extractor blob ids are recorded in `reports/phase-06/baseline.md`. All "unchanged since the pin" checks compare against recorded values, never against a branch name. |
| Sync pin, `SYNC` | The merge commit of the latest `git merge main` (or `B0` before any merge); recorded in `reports/phase-06/progress.md`. |
| Legacy source | A file of the platform-authority corpus with authority `legacy-current` or `unclassified` outside `docs/platform/` (1,040 files, 22,426 rows at planning time). Five more non-authority files carry rows that need a disposition (see Architecture). |
| Decision shard | A JSON file of reviewed row decisions in the shape of `pilot/claim-decisions.schema.json`, merged onto the inventory in memory by `--decisions`. New entry kinds and fields come from the Step 1 tools. |
| `authoredBy`, `reviewedBy` | Identity strings: `codex-session:<id>@<YYYY-MM-DD>` for the executor, `reviewer:<model>-session:<id>@<YYYY-MM-DD>` for a reviewer, `script:<name>` for rows proven by a script. `<id>` is the session id if the tool shows one, else the running number kept in `progress.md`. |
| Exact carry, classes | A source unit whose digest also exists in its counterpart document. Only the classes defined under Architecture are script-proven. |
| Diff pack | A Markdown file generated per shard (`propose-doc-decisions.mjs --pack`): per row the source unit, the target unit at the anchor, a unified diff and the proposed decision. The reviewer reads packs, not JSON. |
| Hold, hold list | A row left `unknown-blocking` (`reviewStatus: blocking`) because it waits for an owner decision. Listed in `reports/phase-06/holds.md`, one table row per claim id (format: claim id, source `path#anchor`, reason, decision needed, date asked, date answered). The file contains no other claim ids. At most 10 hold rows besides the seven dropped-001 units. |
| Stratified sample | A sample drawn by the reviewer with a recorded seed, split into the strata the brief names; drawn by the reviewer, never by the author. |
| Seeded pack | 30 rows of a batch: 24 unchanged controls and 6 with one mutated target text (added claim, swapped number or enum, removed negation, dropped clause, deleted list item), shuffled, built and held by the reviewer session (`propose-doc-decisions.mjs --seed-pack`, run by the reviewer, never by the author); the key stays with the reviewer and is not committed until the verdict is. Thresholds (at least 5 of 6 mutations caught, at most 2 false flags among the 24) are chosen thresholds, not measurements; Phase 5 measured 6 of 6 and 0 of 24 on this design. |
| Fresh reader, scenarios | A session that has not seen the batch's targets, answers the six definition-of-done questions of `AGENTS.md` for three change scenarios of the area, using only `docs/platform/<area>/`; format, key and scoring rule: `reports/phase-05/pilot-b-fresh-reader-key.md`. The key is committed before any reader starts. |
| SC-1 | The conflict about which verbs carry `externalEffect: true`: [semantic-conflicts](reports/phase-05/semantic-conflicts.md). The code (`COMMAND_REGISTRY`, 15 verbs, no `coordination`) is the truth (owner, 2026-10-07). |
| HI-I027 | Row 81 of `docs/platform/host-invocation-routing/intent-preservation-ledger.md` (legacy payload resolution); its cell must match the carried contract text ([lead-verification](reports/phase-05/lead-verification-e5-e9.md), group G43). |
| dropped-001 to 017 | The entries of `dropped-claims-register.json`: dropped-001 is dev/source activation (packaging-distribution, Plan C); dropped-002 to 017 are the 16 host-invocation drops found by Pilot A. |
| Plan A, B, C | The three plans in `plan.md` 7.5. Plan B edits `docs/platform/component-boundary.md` and adds `docs/platform/convention/spec.md`; Plan C is an unscheduled draft that restores dropped-001. |
| Phase 5 defect ids (M-nn), criteria (E1 to E11) | Entries of [pilot-method-defects](reports/phase-05/pilot-method-defects.md). This file states the rule in words and does not rely on the ids. |
| 973 legacy paths, `no-alias` | The legacy paths read by path from immutable history (`archive/`, `plans/`, `docs/history/`, `.fgos/`, `CHANGELOG.md`); Step 1 regenerates the list from the inventory's consumer edges. `no-alias` is the resolver's answer when the alias table has no entry; a path left there needs a written reason (a `retired-with-evidence` entry or a listed exception). |

### Preconditions (Step 0 stops if any is missing)

- `reports/phase-06/owner-answers.md` is committed with every field answered (template below), authorization `yes`, and every answer inside the supported set of the table "What each answer changes". It is the only record of the owner's answers; the executor never guesses one.
- Clean tree; `pwd` and branch as in the shared rules.

**Template of `reports/phase-06/owner-answers.md`** (written by the owner or from the owner's words; `*` marks the recommendation of the planning report; this text only pre-fills the template, the file does not exist yet):

```text
# Phase 6 owner answers
Date: <YYYY-MM-DD>        Recorded by: <owner>
Phase 6 authorized: yes | no
Q1 evidence mirrors: a* | b | c
Q2a tooling: A* | B | C
Q2b script-proven rows may be `reviewed` by the script: yes* | no
Q2c corpus scope: i* | ii | iii
Q2x tools marked "x" in the Step 1 table: authorized* | not authorized
Q3 files without a target: a* | b | c      archive-with-reason delegated to the executor: yes* | no
Q4 dropped claims: a* | b | c
Q5 root documents: a* | b | c
N1 docs/decisions/index.md: keep as a generated projection, not a retiring root* | retire as a root
N2 executor may author the next batch while one waits for review: no* | yes (authoring only)
Review sessions: started by the owner; reviewer identity format: reviewer:<model>-session:<id>@<date>
Authored/reviewed separation (authoredBy gate check): decided 2026-10-07, yes
```

**What each answer changes** (an answer not listed as supported means: stop, report, replan with the owner):

| Answer | Steps that change | Rule |
|---|---|---|
| Q1 a* | 1, 2 | Mirror entries use `delete-as-duplicate` against the byte-identical platform copy. |
| Q1 b | 1, 2 | Mirror entries use `retain-as-evidence` (no target owner); conflict-resolution rule for mirror groups is "both copies stay"; the cutover destination of the 867 files is queued for the owner. |
| Q1 c | 2, criteria 1 and 4 | No mirror entries; the Step 2 scope is every child of `docs/architect/agent-coordination/` except `verification/<collection>/` payloads (plus `verification/README.md`); the 867 files stay `unknown-blocking`, are named in `holds.md` as one range line with the row count, and are excluded from the hold maximum. |
| Q2a A* | 1 | All tools of the Step 1 table that are not marked `Q2c` or `x`. |
| Q2a B, C | 1, 2 and every batch | Replan: tools not authorized are dropped and every row they would carry becomes a hand-written reviewed row; effort about doubles (planning report section 6). |
| Q2b yes* | 2, 6 | Mirror and unit-exact rows carry `reviewedBy: script:check-doc-inventory-gates`. |
| Q2b no | 2 | Those rows stay `pending` and go through diff packs and the review loop (16,640 rows, effort about doubles); replan the estimate. |
| Q2c i* | 1, 2 | Tool T3 is built and the corpus rules are applied at the end of Step 2 (history, user knowledge, consumer-project rows). |
| Q2c ii | all | A gate semantic change: stop and replan. |
| Q2c iii | 10, criteria 1 and 10 | No T3; only scoped strict is used; global strict stays red and is recorded as such. |
| Q2x authorized* | 1 | Tools marked `x` are built. Not authorized: replan Steps 1, 2 and 6. |
| Q3 a* | 7, 8 | Place by constitution kind, text verbatim. |
| Q3 b | 7, 8 | Replan: full claim-level re-authoring, about four times the Step 7 cost. |
| Q3 c | 7 | Step 7 places the whole proposals and redesign set as one history bundle by `archive-with-reason`; the owner sees the file list once. |
| delegation no | 7, 8 | Every `archive-with-reason` goes to the owner list instead of the executor deciding. |
| Q4 a* | 3, 4 | As written in Steps 3 and 4. |
| Q4 b | 3, 4 | No restores; the register entries stay open (owed to Phase 9); the Step 3 done-test and criterion 5 drop the restore count. |
| Q4 c | 4 | dropped-001 is restored verbatim (flagged "not implemented in code") instead of a stub. |
| Q5 a* | 1, 5 | Additive constitution kinds `governance`, `portal`, `switchboard-doc`; the two migration plans go to `history` by `archive-with-reason`; `AGENTS.md` and `CLAUDE.md` rows are `reclassify-out-of-platform-scope`. |
| Q5 b | 5 | The six documents move under `docs/platform/`; each consumer rewrite is queued for Phase 8; no amendment. |
| Q5 c | 5 | Each document is decided in the area map as a recorded exception; no amendment. |
| N1 keep* | 1, 5 | `docs/decisions/index.md` gets `regenerate-from-source` and is not a retiring root. |
| N1 retire | 1, 5 | It is added to the retiring roots data; the owner names the replacing generated location. |
| N2 no* | all | Strictly one batch at a time. |
| N2 yes | all | Allowed only P1 to P3 of the next batch, never decisions that touch files shared with the waiting batch. |

## Requirements

- schedule by target ownership and dependency, not arbitrary source files;
- preserve all retained details before improving prose; no new claims (scaffolding the map adds is labelled `Added in candidate`);
- separate current state, intended direction, obligation, rationale, decision and proof into their correct owners by constitution kind;
- update the area portal as part of each target unit; links to documents of a later batch are written as plain paths in code text, not links (the single link pass is Step 10 item 2);
- keep targets candidate until repository-wide promotion (status comes from the switchboard);
- a promoted area portal may link only to documents of its own area or to documents already routed `promoted`; such portal links are not reader-document links to a candidate (check I covers only the root instruction and navigation documents), and a link from a portal to another area's candidate is a defect;
- record every deletion or archive reason in the ledger; the gate runs after each batch phase (see checks);
- disposition rule: `supersede` = the target carries the WHOLE unit, possibly reworded; part carried = `partial-carry` with a `remainder`; text absent = `unknown-blocking` with `searched`; a row whose only carrier is a pointer back to a legacy document is not carried;
- duplicate groups: every legacy member of one duplicate group (same `semanticClaimId`) names the same single owner, the canonical platform copy at the relocation path (if several platform copies exist, the one under the area's own path); the other legacy members are `delete-as-duplicate` against that same copy. Identical short units in different legacy files name the same owner and anchor whenever the counterpart text exists once; a legitimate second owner is listed in `reports/phase-06/identical-unit-exceptions.md` (same table format as the hold list) and counted by check D.

**Allowed paths** (everything else is never modified; check A enforces it; `P` = `plans/260925-documentation-authority-unification`):

| Path | Limit |
|---|---|
| `docs/platform/**` | per the frozen maps; edits to an existing document: header block, verbatim restores, link repoints in the Step 10 pass, and four named content edits: the SC-1 text (Step 5), HI-I027 (Step 3), the dropped-001 stub (Step 4), promoted-area restores (Step 3); each is logged in `reports/phase-06/post-review-edits.md` |
| `P/ledger/**`, `P/reports/phase-06/**` | decisions, area maps, conflict resolutions, alias drafts, reports, helper checks |
| `P/pilot/decisions/*.json`, `P/pilot/claim-decisions.schema.json` | pilot rows: review fields and `targetUnitDigest` only, when a drift forces re-review; schema: additive fields and entry kinds |
| `P/transitional-switchboard.json`, `docs/transitional-switchboard.md` | additive candidate routes only; this branch is the single writer (main's routes arrive by merge) |
| `P/dropped-claims-register.json` | `reviewedDisposition` fields only |
| `P/claim-and-disposition-vocabulary.{md,json}`, `P/minimum-constitution.{md,json}` | additive 2.x amendments (2.4-001, the Q5 kinds); rule text unchanged |
| `P/reports/doc-inventory.{json,md}`, `P/reports/identity-registry.json` | the three checkpoint refreshes only |
| `P/plan.md` | `7.1` row 6 and the answers record in `7.5b` |
| `scripts/` (tools in the Step 1 table), `test/scripts/` | tests first |
| `scripts/check-legacy-docs-ratchet.exceptions.json` | sync accounting |

**Never modified:** `docs/specs/**`, `docs/architect/**`, `docs/io-contract.md`, `AGENTS.md`, `CLAUDE.md`, `docs/reading-map.md`, `docs/specs/reading-map.md`, every other legacy source, `P/alias-table.json` (empty until Phase 9), the rule text of the constitution and vocabulary, and the extractor closure: `scripts/generate-doc-inventory.mjs` plus the modules it imports (`scripts/doc-inventory-artifact.mjs`, `scripts/generate-shipped-path-inventory.mjs`, `scripts/check-legacy-docs-ratchet.mjs`, `scripts/lib/is-main-module.mjs`).

## Architecture

Approach: reuse the Pilot B procedure per area (target map, candidate authoring, decision rows, independent review, sensitivity checks), plus a script channel for rows provable by script. Facts (regenerated 2026-10-07 at `39630b398`, method in the planning report): 1,040 legacy files, 22,426 rows; 16,640 rows are exact carries (12,882 of them agent-coordination evidence mirrors); 5,420 judgment rows are open; 818 duplicate and 151 semantic-conflict groups are evidence mirrors, name collisions or history; 110 canonical documents lack promotion fields. Step 1 recomputes every figure below with `propose-doc-decisions.mjs --summary` and records the table in `reports/phase-06/baseline-counts.md`; where it differs, the recomputed value wins.

| Step | Batch | Sources | Targets | Rows (judgment) |
|---|---|---|---|---:|
| 0 | Pin | all legacy sources | `reports/phase-06/baseline.md` | |
| 1 | Tooling and area maps | none | `scripts/`, `ledger/area-map-*.md`, `reports/phase-06/review-brief.md` | 0 |
| 2 | Agent coordination | `docs/architect/agent-coordination/**` (867 evidence files, 70 documents) | `docs/platform/agent-coordination/**` | 17,034 (394) |
| 3 | Host-invocation-routing | `docs/architect/host-invocation-routing/*.md` (6) | `docs/platform/host-invocation-routing/**` | 431 (431) |
| 4 | Packaging-distribution | `docs/architect/packaging-distribution/*.md` (8), `docs/specs/distribution.md` | `docs/platform/packaging-distribution/**` | 402 (402) |
| 5 | Root authorities, laws, work-state close | root `docs/*.md`, templates, user, contracts, work-state SC-1 | `docs/platform/work-state/**`, area-map targets | 975 (609) |
| 6 | Whole-system architecture | `docs/architect/component-boundary/**`, `docs/architecture-map.md`, `docs/specs/system-overview.md`, 7 architect singles | `docs/platform/component-boundary.md`, `architecture-map.md`, map targets | 826 (826) |
| 7 | Proposals and redesigns | `docs/architect/proposals/**` (14), 5 redesign singles, domainization | `docs/platform/proposals/**`, `history/**`, map targets | 1,815 (1,815) |
| 8 | Specs and ui-spec | 6 `docs/specs/*.md` singles, `docs/ui-spec/**` | one new area each under `docs/platform/<area>/` | 557 (557) |
| 9 | Runner | `docs/specs/runner.md` (457 KB, 157 headings) | `docs/platform/runner/**` | 470 (470) |
| 10 | Close | `AGENTS.md`, `CLAUDE.md` rows; whole corpus | `docs/platform/history/documentation-authority-unification/` | 104 |

Reconciliation of the counts: the column sums to 22,614 rows against 22,426 legacy rows because the 104 rows of `AGENTS.md` and `CLAUDE.md` appear in Step 5 and Step 10, and Step 5 also holds 84 rows of three non-authority root documents; judgment 5,504 against 5,420 is the same 84. Five further files with rows that still need a disposition sit in no row above: `docs/distribution-vision.md` (22), `docs/id-systems-audit.md` (32), `docs/work-item-lifecycle-vision.md` (25), `docs/backlog.md` (5) and the non-legacy `docs/platform/proposals/documentation-system-unification.md` (198), 282 rows. The Step 5 area map names each of the five. `--summary --coverage` lists every inventory source file named by no area map and no Step 2 mirror entry; the list must be empty before Step 2 starts. Also named explicitly by the maps: `docs/decisions/index.md` (N1), `docs/architecture-manifest.json`, `docs/doc-registry.json`, `docs/doc-registry.md`, `docs/enduser-docs-index.json`, and the 131 `docs/platform` documents (outside evidence payloads) that the switchboard leaves unrouted: Step 1 gives them additive candidate routes (area status unchanged).

**Exact-carry classes** (thresholds are chosen, not measured; Step 1 reports the row count of each class):

| Class | Proof | `reviewed` by |
|---|---|---|
| Mirror | blob id of the legacy file equals the blob id of its platform copy; the gate recomputes it on every run | script (Q2b) |
| Unit-exact | the unit digest occurs exactly once in the counterpart file, the chain of ancestor heading titles is equal in both files, the unit has at least 40 characters, and at least half of the document's units are exact; the gate recomputes all of it on every run, and binds the target by digest (the gate derives the current anchor), never by a positional `unheaded-block-N` | script (Q2b) |
| Weak-exact | the digest repeats in the counterpart, or ancestry differs, or the unit is short, or the document's exact share is below half | reviewer, through a diff pack |
| Judgment | no digest match | reviewer, through a diff pack |

Order is fixed: sources with the highest churn (`runner.md` 96 commits in 30 days, `distribution.md` 57, `reading-map.md` 24, `observe.md` 10 in 14 days) are decided last in their batch or last overall. Plan B condition for Step 6: see Step 6.

## Related Code Files

- Modify or create (Step 1, only what Q2 and the table authorize): `scripts/check-doc-inventory-gates.mjs`, `scripts/propose-doc-decisions.mjs` (new), `scripts/check-doc-retirement.mjs`, `scripts/check-doc-constitution.mjs`, `scripts/check-doc-candidate-status.mjs`, tests under `test/scripts/`, `pilot/claim-decisions.schema.json`, vocabulary amendment 2.4-001. No setup or doctor registration: these are repository-only gates, not shipped files (record that answer in `baseline.md`, per the install/setup/doctor gate of `AGENTS.md`).
- Create: `P/ledger/` (`decisions/`, `area-map-<batch>.md`, `conflict-resolutions.json`, `alias-drafts/`), `P/reports/phase-06/` (the files listed in Step 0, one report per batch, review requests and verdicts, holds, scorecard).
- Create or modify: `docs/platform/**` per the frozen maps; additive routes in the switchboard; `dropped-claims-register.json`; `scripts/check-legacy-docs-ratchet.exceptions.json`.

## Implementation Steps

### Shared rules (apply to every step)

**Session rules**

- Work only in `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`. Before any git command run `pwd` and `git branch --show-current` (must be `plan/260925-documentation-authority-unification`). Never write in `/home/vantt/projects/forgentX`. Merge main with `git merge main`; never rebase, never force-push, never push.
- Commit only explicit paths: `git commit -m "<conventional message>" -- <paths>`; never `git add -A`; messages `docs(unification): ...`, `docs(<area>): ...`, `feat(docs-gates): ...`; no phase, step or finding labels in messages, comments or test names; commit the same turn the checks are green. Report to the owner as `plan.md` 7.7 says (Vietnamese, em and anh, short, evidence-based); file contents stay English.
- Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs`. Count with node scripts, never `grep | wc`.
- Scratch: `S=/tmp/phase06; mkdir -p $S; cp P/reports/identity-registry.json $S/`, then `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry $S/identity-registry.json --json-out $S/doc-inventory.json --md-out $S/doc-inventory.md` (about 18 s; peak memory about 2.3 GB; keep at least 1 GB of free disk in scratch, UNPROVEN; one run at a time). Shards are never committed. Refresh before every gate run that follows a commit; the registry must report no lost id (check G).
- Resume protocol (a run lasts days and sessions end without notice). Start of every session: read `reports/phase-06/progress.md`; `git status --porcelain` must be empty (if not, list the files and stop: a previous session left partial work); confirm `HEAD` descends from the recorded last green commit; rebuild scratch if `$S` is gone; rerun checks A to H once. End of every session: update `progress.md` (step, state, last green commit, `B0`, `SYNC`, commits of the current batch, pending review requests, owner-queue items open, next action) and commit it. States of a batch: `authoring`, `ready-for-review`, `in-review`, `rework`, `reader-runs`, `closed`.
- Owner questions go into `reports/phase-06/owner-queue.md` (id, question, options with the executor's recommendation, which step it blocks, date asked, answer). Release the queue to the owner once per batch at the moment of "ready for review", as one set; ask earlier only for a blocker. A parked question never stops work that does not depend on it.

**Checks.** Variables used below (set them at the start of every session): `W=/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, `P=plans/260925-documentation-authority-unification`, `S=/tmp/phase06`, `B0` and `SYNC` from `progress.md`. In prose `P/` means `$P/`. Commands are meant to be run from `$W` as written.

```bash
# A  own commits stay inside the Allowed paths (first-parent + no-merges: independent of what main brought in); exit 0, no output
git log --first-parent --no-merges --name-only --format= $B0..HEAD | sort -u | node -e 'const ok=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const bad=require("fs").readFileSync(0,"utf8").split("\n").filter(Boolean).filter(p=>!ok.some(x=>p===x||p.startsWith(x)));console.log(bad.join("\n"));process.exit(bad.length?1:0)' $P/reports/phase-06/allowed-paths.json

# B  extractor closure unchanged; empty output (a difference after a merge means main changed the extractor: stop)
for f in scripts/generate-doc-inventory.mjs scripts/doc-inventory-artifact.mjs scripts/generate-shipped-path-inventory.mjs scripts/check-legacy-docs-ratchet.mjs scripts/lib/is-main-module.mjs; do echo "$f $(git rev-parse HEAD:$f)"; done | diff - $P/reports/phase-06/extractor-blobs.txt

# C  no area status changed since the last sync; prints [] and exits 0
node -e 'const {execFileSync:x}=require("child_process");const f=process.argv[2];const a=JSON.parse(x("git",["show",process.argv[1]+":"+f]));const b=JSON.parse(require("fs").readFileSync(f,"utf8"));const bad=a.areas.filter(o=>{const n=b.areas.find(m=>m.area===o.area);return !n||n.authorityStatus!==o.authorityStatus});console.log(JSON.stringify(bad.map(o=>o.area)));process.exit(bad.length?1:0)' $SYNC $P/transitional-switchboard.json

# D  gate, non-strict (refresh the scratch inventory first); exit 0
node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions $P/pilot/decisions --decisions $P/ledger/decisions --json > $S/gate.json
#    before tool T0 exists pass only `--decisions $P/pilot/decisions` (the loader reads one --decisions and throws on a missing or empty directory);
#    after T0 add `--decisions $P/ledger/decisions` once that directory holds a shard

# E  gate, scoped strict (batch close, Step 10): D plus --strict and one --scope per source path of the batch (a scope matching nothing is an error)
node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions $P/pilot/decisions --decisions $P/ledger/decisions --strict --scope <source> [--scope <source> ...] --json > $S/strict.json
#    expected open data is exactly the hold list and the identical-unit exceptions; prints ok
node -e 'const fs=require("fs");const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const ids=f=>new Set(fs.readFileSync(f,"utf8").match(/claim_[0-9a-f]{32}/g)||[]).size;const H=ids(process.argv[2]),X=ids(process.argv[3]);const exp={"claims-unknown-blocking":H,"claims-not-reviewed":H,"identical-units-multiple-owners":X};const open=Object.fromEntries((r.conservationOpen||[]).map(o=>[o.type,o.count]));const bad=[];for(const t of new Set([...Object.keys(exp),...Object.keys(open)]))if((open[t]||0)!==(exp[t]||0))bad.push(t+": found "+(open[t]||0)+", expected "+(exp[t]||0));for(const f of r.fatalFindings||[])if(!(f.type in exp))bad.push("fatal: "+f.type+" "+f.message);console.log(bad.join("\n")||"ok");process.exit(bad.length?1:0)' $S/strict.json $P/reports/phase-06/holds.md $P/reports/phase-06/identical-unit-exceptions.md

# F  ratchet and placement; both exit 0 (placement has no path filter: compare the whole line with the baseline line in baseline.md; at Step 10 add --promotion)
node scripts/check-legacy-docs-ratchet.mjs
node scripts/check-doc-constitution.mjs --no-ledger --check-placement

# G  no lost claim id, no self-review (read from the JSON of D, never from the exit code of a pipe); exit 0, no output
node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const bad=(r.fatalFindings||[]).filter(f=>/^(claim-id-not-conserved|decision-self-review)$/.test(f.type));console.log(bad.map(f=>f.message).join("\n"));process.exit(bad.length?1:0)' $S/gate.json

# H  candidate status, no finding that is not in the baseline (run after the commit: the check reads tracked files); exit 0, no output
node scripts/check-doc-candidate-status.mjs --json > $S/cs.json
node -e 'const fs=require("fs");const k=f=>f.type+"|"+f.path;const cur=JSON.parse(fs.readFileSync(process.argv[1],"utf8")).findings.map(k);const base=new Set(JSON.parse(fs.readFileSync(process.argv[2],"utf8")).findings.map(k));const nw=cur.filter(x=>!base.has(x));console.log(nw.join("\n"));process.exit(nw.length?1:0)' $S/cs.json $P/reports/phase-06/candidate-status-baseline.json

# I  no reader or instruction document links a candidate; empty output (after a merge read the new lines; re-baseline only if they name promoted paths or Plan B's own path)
git grep -h -o 'docs/platform/[^ )`|>"]*' -- AGENTS.md CLAUDE.md README.md docs/README.md docs/reading-map.md docs/specs/reading-map.md | sort -u | diff - $P/reports/phase-06/reader-links-baseline.txt
```

The candidate-status baseline holds the five findings of planning time: three `missing-promotion-fields` close in Steps 2 to 4; two `unresolved-link` in the host-invocation portal (they name `plans/260915-host-invocation-r2-external-process/plan.md` and `plans/260918-host-invocation-r3-remote-peer/plan.md`, which do not exist) close in Step 3 by repointing or labelling. The goal at Step 10 is 0 findings.

When each check runs: after every commit that changes only `docs/platform/**` text: A, B, H (cheap). After every shard commit and at the end of each batch phase (P3, P4, P5, P6): A to I with a scratch refresh (E only at P6). After every tool commit: the full test suite, plus D on the Step 0 inventory giving the same JSON as `$S/gate-baseline.json` apart from the commit and digest fields. After a merge of main: all checks, the ratchet exceptions entry, then re-pin `SYNC`.

Expected red until Phase 9, recorded as a delta per batch and never fixed by weakening a gate: global `--strict`, `check-doc-retirement.mjs --cutover`, `check-doc-constitution.mjs --cutover` and `--promotion` (until Step 10).

**Decision shards and review**

- Shards live in `P/ledger/decisions/s<step>-<area>-<part>.json` (about 500 rows at most), `shard` equal to the file name, `authorshipRequired: true`. Every row carries `authoredBy` (the executor) and is written `pending` (or `blocking`). Rows of Phase 5 keep their old shape (no `authoredBy`; the flag is off in their shards).
- Review request: when P4 of a batch is committed, the executor writes `reports/phase-06/review-request-<step>.md` (shard files and commit, row counts per class, the commands to regenerate packs, the list of lists routed to the owner), commits it, sets the batch state `ready-for-review`, releases the owner queue, and STOPS with a final message that names the file. The owner starts the reviewer with the prompt "follow reports/phase-06/review-brief.md for review-request-<step>.md".
- Reviewer (per `review-brief.md`): answers the seeded pack first; then reads 100% of the pending rows through diff packs in both directions (source to target, and every candidate heading and block back to a row); hand-recomputes 10% of the rows (seeded draw, anchors with `node scripts/list-doc-anchors.mjs --check <path#anchor>`); writes the per-row verdict table to `reports/phase-06/review-<step>-<shard>.md`; flips rows with `node scripts/propose-doc-decisions.mjs --apply-review <shard> --verdicts <file> --reviewer <id>`, which sets `reviewStatus: reviewed`, `reviewedBy`, `reviewedAt` and the current `targetUnitDigest` for rows judged `ok`, leaves `rework` and `hold` rows `pending` with the note, and refuses a reviewer id equal to a row's `authoredBy`; commits the verdict file and the shard in one commit. The reviewer edits no document and no shard by hand.
- Rework: the executor fixes `rework` rows once, rewrites the review request for those rows, and stops again. A second `rework` on more than 3% of the batch's rows is a stop condition. `hold` rows go to `holds.md` and the owner queue.
- The only rows `reviewed` without a reviewer session are mirror and unit-exact entries of the Mirror and Unit-exact classes under Q2b yes; the gate expands them with `authoredBy: script:propose-doc-decisions` and `reviewedBy: script:check-doc-inventory-gates`. A hand-written row with a `script:` identity is a fatal finding. The same independence applies to the tool code review (Step 1), the 100-row spot check, the 10% recompute and the fresh-reader runs: none is done by the session that authored the thing checked.
- Order of edits against reviews: authoring and every edit of a batch's targets (headers, portal, links) are finished and committed before decisions for that batch are reviewed; `targetUnitDigest` is stamped at review time. A later edit of a document that already has reviewed decisions (SC-1, link repoints, header stragglers) is listed in `reports/phase-06/post-review-edits.md` first; afterwards run D and take every `decision-target-drift` finding as follows: `propose-doc-decisions.mjs --rebind <shard>` re-finds the unit by its stored digest in the same owner (unique match: the anchor is rewritten, the review stays valid; no match or several: the row returns to `pending`), and the returned rows go to the next review round of that step. Edits to a document whose rows were reviewed in an earlier step open a short re-review request, same loop.
- Edits to a document that the switchboard routes `promoted` (at least the three area portals; list them from the switchboard) change what readers see today: each is logged with its diff in `reports/phase-06/promoted-edits.md` and shown to the owner at that batch's checkpoint.

**Per-batch loop (P1 to P6)**

- P1 pin and sync main (`git merge main`; account new legacy edits in the ratchet exceptions; record `SYNC`; record the batch's source blob ids). P2 freeze the target map (subdivisions labelled `Added in candidate`). P3 author candidates (verbatim carry, one H1, full header: Document type, Audience, Purpose, Design status `Candidate`, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related, Supersedes, Superseded by; commit per document, portal last). P4 decide rows (script proposals first, judgment rows by hand; non-blind: the ledger and audit documents of a promoted area are legitimate carriers); commit shards; review request; STOP. P5 is the review session (above), then rework. P6 close: link-rewrite preview and draft alias entries from the reviewed rows; fresh readers (key committed first, 3 scenarios, two reader sessions started by the owner, at least 5 of 6 correct per scenario, 0 non-existent anchors checked with `node scripts/list-doc-anchors.mjs --check <path#anchor>`, 0 legacy-authority answers, at most 8 files read per run); sync main; scratch refresh; changed rows re-decided and re-reviewed; scoped strict (check E); batch report `reports/phase-06/step-<nn>-report.md` (counts by class, hold rows, defects, effort in rows per session and sessions used).
- Red-team pass: at the end of Steps 2, 5, 7, 9 and 10 the reviewer session runs a hostile pass over the step group's diff using the red-team section of `review-brief.md` (prompt file committed in Step 1; no skill is used), and writes `reports/phase-06/red-team-<step>.md`; every Critical and High finding is fixed or owner-accepted before the step closes (0 open Critical or High).
- Sampled candidate blocks (the check that no unlabelled invented claim exists): the reviewer draws 50 blocks with a recorded seed, 20 from the blocks no decision names, 20 from blocks carried with a rewritten rationale, 10 at random; a block that carries a claim neither in a source row nor labelled `Added in candidate` is a defect.

**Stop conditions** (stop, report to the owner, decide nothing; each has its measure)

| # | Condition | Measure |
|---|---|---|
| 1 | A constitution or vocabulary rule or the extractor unit definition would have to change | the needed edit is not an additive 2.x amendment, or check B differs |
| 2 | A gate script needs a change beyond the Step 1 table and `owner-answers.md` | the diff touches a tool or a function the table does not name |
| 3 | A claim id is lost or claims vanish | check G (`claim-id-not-conserved`) or a refresh whose registry reports a missing id |
| 4 | A batch is defective after one rework | reviewer verdicts `rework` on more than 3% of the batch's rows in the second review round |
| 5 | Invented claims in candidates | 2 or more of the 50 sampled blocks (3%) carry an unlabelled invented claim |
| 6 | Source drift | rows in batch source files whose blob id differs from the batch pin, divided by the batch rows, above 10% (blob ids from `source-blobs.txt`; rows from `--summary`); below 10%, stale rows are re-decided (`decision-digest-stale` lists them) |
| 7 | A merge conflict touches `docs/platform/**` content or 10 or more files | `git diff --name-only --diff-filter=U` after the merge |
| 8 | Isolation broken | check A, B, C or I fails, or an area status changes |
| 9 | Another plan writes a hot target while its batch is open | `git log --no-merges --format=%h $SYNC_old..$SYNC_new -- docs/platform/packaging-distribution docs/specs/distribution.md docs/specs/runner.md` is non-empty for the open batch's paths (a source-side change is drift under 6; a `docs/platform/packaging-distribution` change is a stop) |
| 10 | A re-run fails twice | the same check command is red after one fix attempt |
| 11 | Effort ceiling | measured without tokens, from the batch reports and `progress.md`: judgment rows decided per review round and the rework rate (rows with verdict `rework` over rows reviewed). Baseline: the average of Steps 3 and 4 (Step 2 is mostly diff review and is not a baseline); stop and replan when a later step's rows per review round fall below two thirds of it or its rework rate is above twice it, or when the review-run count passes 90 for the phase without Step 9 closed (the planning estimate: about 5,420 rows at about 61 rows per run). Owner-reported tokens, when available, are an extra signal, never the only one. A trigger means replan with the owner, not failure |
| 12 | Gate-semantic blocker found by a rehearsal | the Step 2 rehearsal or the Step 10 rehearsal lists a blocker that only a gate semantic change or a new owner decision can clear |
| 13 | Review method fails | a seeded pack answered under the thresholds by two different reviewer sessions in a row |
| 14 | A precondition fails | `owner-answers.md` missing, a field still `pending`, or an unsupported answer; tree dirty at a session start; Plan B state not recorded |

### Step 0. Authorization and pin

1. Preconditions above; `pwd`; branch; `git status --porcelain` empty; `git merge main`; record `git rev-parse main`.
2. Scratch inventory; run D with the pilot directory only and save the JSON as `$S/gate-baseline.json`; run the ratchet and placement checks (F); `node scripts/check-doc-retirement.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --cutover --json` (expected exit nonzero; at planning 15 blocked, 4 pass, 1 owed to review).
3. Write under `reports/phase-06/`: `baseline.md` (HEAD, main HEAD, `SYNC`; exit codes and expected lines of the commands above; the open-data counts from `conservationOpen` of the baseline JSON; duplicate and conflict group counts from `explicitOpenFindings`; the answer to the install/setup/doctor question; `fgos` is not used); `source-blobs.txt` (`git ls-tree -r HEAD -- docs` plus the other legacy root files, `path blobid`); the evidence tree hashes (`git rev-parse HEAD:docs/architect/agent-coordination/verification` and the platform copy); `extractor-blobs.txt` (the five files of check B); `candidate-status-baseline.json` (the H run); `reader-links-baseline.txt` (the I command output); `allowed-paths.json`; `progress.md`, `owner-queue.md`, `holds.md`, `identical-unit-exceptions.md`, `post-review-edits.md`, `promoted-edits.md` (headers only); the state of Plans A, B and C (`git log main --format='%h %s' -- plans/261006-1415-fgos-single-door-mechanisms plans/261006-1415-fgos-convention-component plans/261006-1445-fgctl-dev-activation` and whether each plan's status is landed). Record the answers of `owner-answers.md` in `plan.md` 7.5b as one bullet.
4. Commit `docs(unification): record the phase baseline and pins`; record that commit as `B0` in `progress.md` and in a second small commit. Done: baseline committed; D exit 0; F ratchet exit 0.

### Step 1. Tooling and area maps

1. Tools, tests first (red) then code (green), separate commits, one tool per commit, T0 first; default behavior unchanged (suite green; D on the Step 0 inventory gives the same JSON as the baseline). Shapes extend `pilot/claim-decisions.schema.json` (additive; shard `version` stays 1; the loader's field lists are updated in the same commit); write the CLI contract of `propose-doc-decisions.mjs` into its `--help` and into the review brief before authoring.

| Tool | What and data shape | Needs |
|---|---|---|
| T0 | gate: repeatable `--decisions`; each path must exist and hold at least one shard, the error names the path | Q2 |
| T1 | mirror entries `mirrors: [{path, target, blobSha}]`; the gate verifies equal blobs on every run and expands the rows (disposition per Q1) | Q2 |
| T2 | `propose-doc-decisions.mjs`: `--summary` (counts per area and class, duplicate groups with more than one legacy member, groups not all-mirror, the 973-path list, the 282-row list), `--propose` (writes exact entries for the Unit-exact class and demotes the rest to Weak-exact with the reason); entries `exact: [{source, target, rows:[{claimId, sourceUnitDigest, targetUnitDigest}]}]` re-proven by the gate on every run | Q2 |
| T2r | same script, review modes: `--pack`, `--seed-pack`, `--score-pack`, `--apply-review` (see shared rules) | decided 2026-10-07 |
| T2x | same script: `--coverage`, `--rebind`, `--snapshot` (writes the merged claim rows of the legacy sources in `claim-ledger.schema.json` shape plus sha256; `--verify` recomputes both) | x |
| T3 | corpus-rule entries (history, user knowledge, consumer project): a rule decision for a whole corpus, checked against the item classification, rows expanded and `reviewed` by the gate | Q2c |
| T4 | `ledger/conflict-resolutions.json` `{version:1, groups:[{kind:"duplicate"\|"semantic", key (the group's `blobSha` or `key`), resolution, rule, evidence}]}` read by `no-unresolved-conflicts` in `check-doc-retirement.mjs`; a resolved group counts as closed | Q2 |
| T5 | retiring roots as data in `check-doc-retirement.mjs` (the named root documents; roots `docs/specs` and `docs/architect` stay as ruled in Phase 4) | Q2 |
| T6 | reverse check as open data (candidate blocks no decision names); `--decisions` for `check-doc-constitution.mjs`; untracked files in `check-doc-candidate-status.mjs` | Q2 |
| T7 | vocabulary amendment 2.4-001 (`delete-as-duplicate`, `defer-with-owner`, `reject-with-rationale` and the others to in-use), recorded after first use | Q2 |
| T8 | `authoredBy` row field and `authorSession` shard field, shard flag `authorshipRequired`; fatal findings: `decision-self-review` when a `reviewed` row's `reviewedBy` equals `authoredBy` (or the shard's `authorSession` equals the reviewer's session id), `decision-review-report-missing` when a `reviewed` non-script row has no committed `reports/phase-06/review-<step>-<shard>.md` whose header names a `reviewer` equal to the row's `reviewedBy` and different from the author, a `reviewed` row without `authoredBy` in such a shard, and a hand-written row with a `script:` identity | decided 2026-10-07 |
| T9 | gate: dropped-claims `reviewedDisposition` with `decision: restored` must carry `owner`, `anchor`, `unitDigest` and the gate recomputes that digest at the committed tree; `defer-with-owner` must carry `stubOwner`, `stubAnchor` and the anchor must exist; probe tests: a synthetic duplicate group of 4 (2 legacy, 2 platform copies) passes only with one owner; two legacy files sharing a short unit are listed by `identical-units-multiple-owners` | x |

   Done: new tests red then green, full suite green, a structural mutation run on the gate (copies of one shard directory with one seeded defect each: removed row, missing anchor, row decided twice, unknown id, `reviewed` without `reviewedBy`, stale digest, as in [pilot-b-sensitivity](reports/phase-05/pilot-b-sensitivity.md) section 1, plus self-review, mirror with unequal blobs, exact entry with a changed digest, restore without anchor): every defect reported, 0 findings on the clean copy; a reviewer session (not the author) read the tool diff once and wrote `reports/phase-06/review-tooling.md`.
2. Write `reports/phase-06/review-brief.md`. Required content: what the reviewer reads (review request, the diff packs, the vocabulary, constitution, shard schema, this file's shared rules); the checks per row (disposition rule, whole versus partial carry, one owner, own rationale, `remainder` named, no pointer-back carrier, claim kind, no unlabelled invented claim in the target); both directions; the seeded pack (answered first, thresholds, a miss under threshold is reported and the review is repeated by another session); the 10% recompute and the stratified draws with seeds recorded; the output file format; the flip command; what `rework` and `hold` mean; a red-team section (hostile prompt: find lost or weakened claims, wrong owners, invented claims, stale digests, unlabelled additions, gate bypasses; severity Critical, High, Medium, Low); what the reviewer must not do (edit a document or a shard by hand, review rows it authored); and the fresh-reader prompt for the reader sessions (use only `docs/platform/<area>/`, answer the six questions, cite `path#anchor`, no other repository search).
3. Area maps `ledger/area-map-<batch>.md` for Steps 3 to 9. Columns: source file or heading range; target document and heading; constitution kind; operation (place verbatim, split, `archive-with-reason`, regenerate, retire); one owner per row; retiring root documents; placement of the unmapped document types (Q5); additive candidate routes for new areas and for the 131 unrouted documents. Freeze before authoring; add the routes to the switchboard (single writer; area status unchanged). Done: `--summary --coverage` lists 0 unmapped sources; probe documents under each new area classify as that area and `candidate`; check C passes.
4. Write `reports/phase-06/baseline-counts.md` from `--summary` (table of Architecture recomputed, class counts, groups).

### Step 2. Agent coordination

Sources `docs/architect/agent-coordination/**`; targets `docs/platform/agent-coordination/**`.

1. Promotion headers for the 68 platform documents first, before any decision: header block only. Check per file (a helper in `reports/phase-06/`): after removing the first fenced header block that follows the H1 from the old and new text, the remainder is byte-identical.
2. Mirror entries for the 867 evidence files (T1); exact entries for the Unit-exact rows of the 70 documents (T2); the Weak-exact and Judgment rows (about 394 plus the demoted ones) are authored as `pending` from diff packs. Two legacy-only documents (`documentation-standardization-plan.md`, `documentation-governance.md`, 190 rows) are triaged for `archive-with-reason`; the list goes to the owner queue.
3. `ledger/conflict-resolutions.json` (T4): 816 duplicate groups (the retirement check already excludes 814 whose paths are all mirror payloads; Step 1 lists the other groups, each closed by a stated rule), 138 evidence name-collision groups (the reviewer draws 20 groups by seed and hand-checks them first), later the 12 history groups.
4. Spot check by the reviewer: a stratified draw of Unit-exact rows with the seed recorded: 30 from short units (40 to 79 characters), 30 from documents whose exact share is under 80%, 40 random from the rest; 0 errors; one error returns the class: its rule is tightened in the tool (test first) and the whole class is re-proposed.
5. Corpus rules (T3, only under Q2c i): apply to the history, user knowledge and consumer-project rows; reviewed by the reviewer session.
6. Reduced promotion rehearsal, now rather than at the end: in a throwaway clone under scratch, set this area's candidate routes to promoted and its legacy root to retired as Phase 9 does (read `phase-09-atomic-platform-authority-cutover.md` and `docs/transitional-switchboard.md` for the values the switchboard accepts), regenerate, run scoped strict and `check-doc-retirement.mjs --cutover`, record which checks still block and why in `reports/phase-06/rehearsal-step-02.md`, remove the clone. Also record whether rows of candidate documents (18,497 at planning) block the retirement checks. A blocker that needs a gate semantic change is stop condition 12.
7. Done: check E for `docs/architect/agent-coordination` (the whole directory unless Q1 c); `check-doc-retirement.mjs --cutover` shows `no-unresolved-conflicts` counting only groups outside this step; the reviewer's verdicts committed; owner reports token total (stop condition 11 checkpoint).

### Step 3. Host-invocation-routing

Re-decide all 431 rows under current ids (first-round shards in `pilot/first-round/` are evidence only, a prior). Restore dropped-002 to 017 verbatim at the anchors the map names (status note where code differs; check each against code and git history first; an entry found obsolete goes to the owner queue); each register entry gets a `reviewedDisposition` with `owner`, `anchor`, `unitDigest` (T9). Reconcile HI-I027. Repoint or label the two unresolved links of the portal. The restores edit documents of an area the switchboard marks promoted: log them in `promoted-edits.md` and show the diff at the checkpoint. Done: all 16 registered groups appear as restored or flagged and T9 verifies their anchors; check E for the 6 sources; first checkpoint refresh of the committed manifest and registry (`node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry P/reports/identity-registry.json --json-out P/reports/doc-inventory.json --md-out P/reports/doc-inventory.md`, `P` in full; no id lost, default gate exit 0) and an effort report.

### Step 4. Packaging-distribution

All 402 rows. dropped-001: its seven units get `defer-with-owner` against a labelled stub heading in `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` ("not carried; restoration tracked by dropped-001 and Plan C"); the register keeps the Plan C owner and carries `stubOwner` and `stubAnchor`. Decide `docs/specs/distribution.md` rows last: before the commit compare its blob id with `source-blobs.txt`; if changed, refresh, re-decide the stale rows. The one `implementation-alignment.md` name collision between host-invocation-routing and packaging-distribution is closed here by a named rule in `conflict-resolutions.json` (different areas, different documents), after reading both files. Done: check E; the stub rows are the only `defer-with-owner` rows and are `reviewed`.

### Step 5. Root authorities, laws, work-state close

SC-1: before editing, list the reviewed Pilot B rows whose target is `contracts/cli-io-contract.md#entry-fields-and-effect-axes`; edit the candidate text to say the effect-axis verbs come from the manifest (`COMMAND_REGISTRY`, 15 verbs, no `coordination`) and remove the exclusive two-verb list; log it in `post-review-edits.md`; run D; every `decision-target-drift` row (and the two held SC-1 rows) goes through the review loop again, not "stays valid". Decide the root documents, templates, user, contracts, generated and json files, the three non-authority root documents and the five files of the Architecture reconciliation per the map and Q5/N1. `AGENTS.md` and `CLAUDE.md` rows wait for Step 10. Done: check E for the batch sources; `check-doc-constitution.mjs --no-ledger --promotion` lists no gap for new documents; owner reports token total.

### Step 6. Whole-system architecture

Plan B rule (owner, 2026-10-07; also for Step 4 `docs/specs/distribution.md` and for `docs/specs/system-overview.md`, `docs/platform/component-boundary.md`): right before starting work on one of these files, `git merge main`, compare its blob id with `source-blobs.txt` (for `component-boundary.md` compare against the value recorded at the last sync), and if Plan B landed meanwhile re-pin, refresh, and redo every affected row (re-decide, back to review). The Plan B state is also recorded in `baseline.md`. Merge main immediately before touching `component-boundary.md`; the switchboard route for `convention/spec.md` arrives by that merge and is added in the sync commit. Author against the existing `component-boundary.md` and `architecture-map.md`; per `.claude/rules/documentation-management.md` record `No component-boundary change` or the change in the batch report. Done: check E; second checkpoint refresh and an effort report.

### Step 7. Proposals and redesigns

Triage table of the 27 files (kind, status, evidence it is still a live proposal, historical or carried elsewhere), then place by constitution kind with the text verbatim; `archive-with-reason` within the Q3 delegation; any `delete-as-obsolete` goes to the owner queue. Budget at the per-row rate, not the 2.1 million of the planning report (withdrawn; about 8 million, red-team estimate, UNPROVEN): no tool pre-places these rows. Done: check E; owner reports token total.

### Step 8. Specs and ui-spec

One area per spec (spec, contracts, decisions as content requires; Pilot B shape); `docs/ui-spec/**` as one area. Decide `observe.md` and `confinement-authority.md` last, comparing their blob ids with `source-blobs.txt` before each commit. Done: check E.

### Step 9. Runner

Map the 157 headings first (retired decision history to `decisions/`, contracts to `contracts/`, shared agent-coordination parts to the subcomponent the map names); author in sections of about 55 KB; compare the `docs/specs/runner.md` blob id with `source-blobs.txt` before every commit; sync main before starting and before closing; rows whose digest changed are re-decided and re-reviewed, never merged by hand. Done: check E at the final main sync.

### Step 10. Close

1. Decide `AGENTS.md` and `CLAUDE.md` rows after the last sync.
2. Link pass: repoint links between candidates in one pass (and any header stragglers), list them in `post-review-edits.md`, run D, `--rebind`, and send every returned row to a final review round.
2b. Close by named rule or decision, with a done condition each: the 12 history semantic-conflict groups, the 2 history duplicate-content groups and the 78-file duplicate group that spans history copies (listed by `--summary`); link queues complete for all sources (every inbound edge classified with a target or a queue entry).
3. Check E over every legacy source (the gate sources listed in `baseline-counts.md`); open data equals the hold list.
4. `check-doc-constitution.mjs --no-ledger --promotion`: 0 headerless, 0 missing; check H shows 0 findings.
5. Promotion rehearsal of the whole corpus in a throwaway clone (as in Step 2 item 6; record what still blocks in `rehearsal-step-10.md`; remove the clone).
6. Register: 17 of 17 `reviewedDisposition` entries verified by T9 and reviewer-confirmed; the dropped-001 stub exists.
7. Merge alias drafts; validate with `node scripts/doc-alias-resolver.mjs --table <merged draft>` (exit 0); report coverage of the 973 legacy paths (covered, or `no-alias` with a reason).
8. Create `docs/platform/history/documentation-authority-unification/` with a README (history kind) and a dry-run snapshot from `propose-doc-decisions.mjs --snapshot`, verified with `--verify`; Phase 9 owns the sealed format and the sealing.
9. Third checkpoint refresh; repeat the structural mutation run of Step 1 on the final gate.
10. Scorecard, defects, effort record in `reports/phase-06/`; set `plan.md` 7.1 row 6 to "awaiting owner review". Closing is the owner's act; no tag.

## Effort (rough, UNPROVEN)

About 5,500 judgment rows plus 16,640 script-proven rows over 10 steps. Phase 5 measured, with Claude in-process subagents, about 4.8k tokens per row for author plus reviewer; that figure and the "185 runs, about 30 million tokens" derived from it do not transfer to one Codex session and are kept only as a scale: about 30 million tokens (21 to 46 million) plus the 6 million correction of Step 7, so about 36 million (27 to 52), UNPROVEN. Review cost: about 90 review runs (5,420 judgment rows at about 61 rows per run), same-model and therefore weak on shared blind spots; the compensating controls are the gate checks, the reviewer-held seeded pack, the reviewer's 10% recompute and 100% read, the red-team passes, and owner sampling of the owner lists. Calendar time is now dominated by sessions the owner starts: per batch one reviewer session (two with rework) and two fresh-reader sessions; the executor's own throughput (rows per session) is measured in Steps 2 to 4 and replaces the Phase 5 figures. Without the tooling the work is about twice as large. Per-step figures: planning report section 6.

## Success Criteria

Every item has its measure; "recorded" means in `reports/phase-06/`.

- [ ] every legacy source file (count in `baseline-counts.md`) and the five files of the reconciliation have one non-blocking file disposition and every row is `reviewed` with its own rationale, authored by one identity and reviewed by another; check E over all sources prints `ok` with at most 10 hold rows besides the seven dropped-001 units; check G reports 0 `decision-self-review`;
- [ ] at least 95% of candidate headings trace to a source row or carry `Added in candidate`; 0 unlabelled invented claims in each batch's sampled blocks; the reverse check (T6) lists 0 unreferenced candidate blocks;
- [ ] mirror and unit-exact rows re-proven by the gate at the final HEAD; each batch's stratified spot check finds 0 errors; weak-exact and judgment rows 100% reviewed;
- [ ] 818 of 818 duplicate and 151 of 151 semantic-conflict groups closed by recorded rule or decision (T4); `check-doc-retirement.mjs --cutover` shows `no-unresolved-conflicts` passing; every group not covered by the retirement check's mirror exclusion is listed with its rule;
- [ ] 17 of 17 dropped-claims entries have a reviewed disposition whose restore or stub anchor the gate verified (T9);
- [ ] `--promotion` 0 headerless and 0 missing fields; check H 0 findings; `--check-placement` 0 leftover; the 131 previously unrouted documents are routed;
- [ ] alias drafts validate (exit 0); every one of the 973 history-read legacy paths covered or `no-alias` with a reason; the link preview classifies 100% of inbound edges with a target or a queue entry;
- [ ] per batch, fresh readers: at least 5 of 6 correct in each of 3 scenarios, 0 non-existent anchors, 0 legacy-authority answers, at most 8 files per run;
- [ ] no authority flip (checks A, B, C, I green at the end), ratchet exit 0, suite green, no claim id lost (check G), no extractor change (check B); the Step 2 and Step 10 rehearsals ran and their blockers are recorded; the ledger destination holds a verified dry-run snapshot and the destination README.

Verdicts: PASS, PASS-WITH-AMENDMENTS (additive script fixes and 2.x amendments only), METHOD-MUST-CHANGE (stop and report).

## Risk Assessment

Program-level risks and countermeasures: `plan.md` section 11. Phase-specific:

| Risk | Detection | Response |
|---|---|---|
| Hot sources move during a batch | blob id against `source-blobs.txt` before each commit; sync at batch start and close | re-decide only changed rows; hot sources last |
| Exact-carry rows hide a wrong owner | the gate re-proves every class on every run; stratified spot check; one-owner gate | return the batch, tighten the class rule (test first), re-propose the class |
| The author reviews its own rows | `decision-self-review` and `script:` identity findings | none can reach `reviewed`; the owner starts a separate reviewer session |
| A reviewer of the same model shares the author's blind spots | seeded pack, 10% recompute, reverse check, partial-carry rule | repeat with another reviewer session; stop condition 13 |
| A content-dropping author | seeded pack, reverse check, partial-carry rule | rework once, then stop condition 4 |
| Later edits invalidate reviewed rows | `decision-target-drift` | edit targets before review; `--rebind`; post-review edit list |
| Pending plans write legacy docs, `AGENTS.md` or Plan B's targets | sync at batch start and close; stop conditions 7 and 9 | account exception, re-pin, re-decide changed rows |
| Repository growth (shards about 4 MB, each registry refresh about 12 MB compressed) | sizes per checkpoint | three refreshes only |
| Gate tooling change breaks existing behavior | existing tests, unchanged JSON on the Step 0 inventory | revert the tool commit |

Rollback (the work is additive): per batch, `git revert` the batch's own commits (listed in `progress.md`; merges of main excluded). Whole phase, only on the owner's say: first save the tip (`git branch backup/phase-06-<date>`), then `git reset --hard $B0`; redo `git merge main`; then `git status` clean, checks D and F green, `git diff $B0 HEAD -- docs/platform P/` empty apart from what main brought, the register back to 17 open entries.
