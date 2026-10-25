Verdicts: 217 APPROVE / 44 REWORK

# W23 review: G6 park judgments, shard 3

## Scope

- Target: `preserve-premise/park-judgments/shard-3.json` and `shard-3.md` at commit 42893a825, 261 rows (ids in `shard-3-ids.json`).
- Pin: `c94545de5b45873cb2eb419f10124283fd730a2e`, which is the parent of 42893a825. Between the pin and HEAD 587222468 only `plans/` changed, so no docs, domains, src or plugins bytes moved.
- Rules applied: the brief `w22-g6-park-judgments-brief.md` and L13-20.1. I also used L12-10 (`reports/phase-08/owner-answers.md:86-88`), L13-10, the ledger area maps, `proof.json` operand facts (`removedByMoveOrStep6`, `beforePresent`, `afterPresent`) and the G9 `phase9-decisions.json`.
- Method: I gave every row its own verdict. For each row I read the bound line at the pin, the file header and framing, the successor span, and the row's own patch replacement. Scripts did two things only: check that every repoint operand is mapped by its cited ledger row, and replay all 39 patches myself.

## Mechanical checks

| Check | Result |
|---|---|
| `python3 -B .../check_shard_3.py --shard 3` | exit 0: 261 rows, 98/77/50/36, 39 patches, 78 replays |
| My own `patch --batch --fuzz=0 -p1` replay of all 39 patches, forward then `-R`, on blobs at the pin (my own script, not the doer's checker) | 39/39 exact. Proposed sha matches, reverse restores the original bytes, no offset or fuzz |
| Every repoint replacement touches the row's own `currentLines` | 77/77 |
| Repoint and successor operands mapped by the cited ledger row (`area-map-*.md`, `host-invocation-rebound-successors.json`) | all except f08335 (no ledger row; the successor is the `Source: docs/specs/workflow.md` carrier, which is acceptable) and f07852/f07854 (identity rename, git evidence) |
| Successor span contains the carried relationship | 50/50. f08412 carries it with a rebased destination by design |
| Same-file patch overlap with shards 1 and 2 | none found |
| Replay after the existing F chain (phase-08 `step-07-composed-patches.json` `file:<path>` entries whose beforeSha equals the pin, then composition `effectiveSpecIds` + `finalPinFSpecIds` in order, each with a byte guard) | 3 rows duplicate a chain retarget (finding 6); 13 rows in 4 files fail on context only (non-blocking note) |
| G9 decisions touching shard files | only the gateway yaml move, which agrees with f07976, f07985, f08419 and f08443 |

## REWORK findings

### 1. The 36 owned parks can be decided now (medium; f08458 … f08803, group `unresolved-live-artifact-convention`)

All 36 rows are the live `docs/history/<feature>/…` or `docs/history/<id>/iron-law-evidence.md` convention. The shard parks them as needing a coding-domain placement decision before the flip. The repository already decides them:

- **L12-10:** "The 13 shipped docs/history/<feature>/plan.md writer conventions and sibling CONTEXT/RESEARCH/DISCUSSION conventions describe external-project topology and stay unchanged in this plan … Any convention change is a separate backlog item … history is not a legacy authority root."
- **proof.json:** every operand in these rows has `removedByMoveOrStep6: false`. The governance target layout the shard itself cites (`docs/platform/governance.md:77-108`) keeps `docs/history/`. The cutover does not move the path, so keeping the passage unchanged is safe.
- **Inconsistent with other rows in this shard:** the same convention family in code comments is judged preserve-confirmed elsewhere in this shard (f08643, f08645, f08648, f08755, f08788).
- **L13-10 does not support the park:** its "Live conventions … stay parked" only kept these rows out of the file-level auto-confirm rule. L13-20.1 then requires all of them to be settled before F.
- **The nextAction contradicts L12-10:** "compose this passage and its readers/writers together" asks for changes that L12-10 rules out for this plan.

Fix: re-judge all 36 as keep-unchanged and cite L12-10 plus the move-set fact. The brief has no "preserve, operand unaffected" label, so use preserve-confirmed with that evidence, or have the Lead add the label. None of them needs an owner question or F work. Without this fix, 36 pre-F Lead asks that are already answered stay in G6.

### 2. f07667: the repoint is not triggered and the patch rewrites carried words (medium)

- The operand `docs/how-to/coordination-examples/*.json` survives the cutover: `removedByMoveOrStep6` is false and every concrete examples file has `afterPresent: true`.
- Sibling f07668, in the same paragraph, is `preserve-operand-reachability-unchanged`.
- The same file's line 23 note says "Known stale carried sentences; full truth check owed at promotion … preserve deleted-module, retired-corpus … text verbatim".
- The patch rewrites source wording at L177 (`**CLI.** Verb thật` → `**Historical CLI (retired engine; …)** Former verbs`). That is a truth correction owed at promotion, not a pointer change caused by the cutover.

Fix: re-judge as preserve-confirmed. If the Lead wants a flag on the retired CLI, add an `Added in candidate:` marker without changing source words.

### 3. roadmap.md section 9 and the P12 row contradict their approved siblings (f07889 medium, f07886 low)

- **Siblings already confirmed as history:** in `docs/platform/system-architecture/architecture/roadmap.md`, f07869 (line 151, P8 row of the same phase table) and f07888 (line 275, the first sentence of the same section 9: "new architecture writing stays under docs/architect/") are already preserve-source-confirmed-history.
- **The header says it is provenance:** "historic claims below are provenance, not fresh review".
- **f07889 rewrites the rule:** the patch turns "`docs/specs/*` is treated as generated/curated state. It should not be edited" into a new live rule for platform area specs and drops "generated". L278-280 still say "update the generated source … regenerate/check the spec projection", and L275 still points at docs/architect.
- **f07886 contradicts f07889:** the patch makes P12 say the platform specs are "Regenerated", which contradicts the shard's own f07889 premise.

Fix: preserve-confirmed for both, consistent with the siblings.

### 4. f07871: the retarget narrows a directory to one file (low)

- `roadmap.md:52` says "Historical contracts are preserved in `agent-coordination/contracts/`". The operand is the directory.
- The patch points only at `.../history/retired-engine/files/contracts/coordination-session.md`.
- That directory holds five files at the pin: README, assignment-run-runresult, coordination-session, flow-definition and workflow-stage-operation.

Fix: retarget to the directory or its README.md, then regenerate the composed 13-row roadmap patch. The other 12 rows' replacements are fine.

### 5. f08668: a dead decision citation is repointed while its siblings are preserved (low)

- The operand `docs/decisions/0026-...md` has `beforePresent: false`. The cutover does not change it, so the brief's repoint condition is not met.
- f08810 (`docs/decisions/0026:73-87`), f08681, f08685, f08731, f08817, f08824 and f08827 cite retired decision ids the same way and are preserve-confirmed.
- The patch edits `src/runner/dispatch/config.mjs` at F without a cutover cause.

Fix: preserve-confirmed. If the Lead wants dead `docs/decisions/` citations fixed, that is one separate item for all eight.

### 6. Three repoints duplicate a retarget already in the F chain (low; f08496, f08634, f08665)

The phase-08 step-07 composed patches already make these exact line changes:

- **f08496 (`herdr-dashboard/src/pane_scan.rs`):** the chain entry's beforeSha equals the pin. After the chain, the shard patch reports "Reversed (or previously applied)".
- **f08634 (`plugins/fgOS/skills/terminal/SKILL.md`) and f08665 (`src/runner/dispatch/assignment-runner.mjs`):** the step-07 entries encode the same retarget, but their beforeSha is stale against the pin.

A second patch for the same line is a parallel door. Fix: record each row as covered by its chain entry, rebase the two stale entries in the chain, and drop the shard patches. The judgments themselves (live navigation to a removed runbook or contract) are correct.

## APPROVE groups

| Group | Rows | Why approved |
|---|---:|---|
| historical-package-record | 23 | Dated track closeout, source-preservation audit errata and inventories, and text inside the history carrier |
| literal-example | 9 | Hypothetical paths, YAML payload examples, wireframe data, traversal strings |
| source-carriage-note | 21 | "Added in candidate" provenance notes (runner.md:<line> retention, frozen-source Purpose/Provenance) |
| historical-decision-or-proof | 45 | Dated or citation-only references to proofs, done plans (`status: done` at plan.md:2 for f08509/f08510), decision-history files, corpus surveys |
| live-navigation (excluding the 8 reworked) | 46 | Related/read-first/contract pointers to removed roots; every target matches its ledger row; links are relative-correct (f08084, f08096, f08104) |
| source-coordinate-label | 23 | Self-carrier legacy pointers labelled as provenance, with no self-link |
| successor-navigation-merge | 40 | Reading-map merge (ledger row 18), switchboard (row 31), ui-spec (specs-ui map), work-state/workflow carriers |
| historical-template-carriage | 8 | docs/templates archived verbatim (ledger rows 20/22/23/29) |
| identity-rename | 2 | 9fdaac9ba is an ancestor of the pin; Identity section 7a carries the relationship |

Non-blocking notes:

- **f07532:** the Related list in this file is relative; consider `../governance.md`.
- **Context-only conflicts with the F chain (13 rows):** f07380/f07398 (`platform/platform-foundations.md`), f07697/f07698/f07701 (`runner/contracts/routing-handoff.md`), f08012/f08013/f08021/f08024 (`work-state/README.md`) and f08033/f08044/f08046/f08047 (`work-state/contracts/cli-io-contract.md`). The judgments are right and the chain leaves these lines unchanged, but the shard patches fail at `--fuzz=0` once the chain has edited neighbouring lines. The roadmap.md patch applies only with an offset. The shard already says a composition turn must merge its patches; that turn must rebase these patches onto the chain output, not onto the bare pin.
- **f07786, f07789, f07790:** the composition spec `w8:gloss:docs/platform/runner/spec.md` inserts a gloss into the bound line 30. The operand survives, but the line digest changes at F.
- **f07852, f07854, f08335:** their successor units still point at removed roots (`identity/spec.md:22` and `:159` → `docs/io-contract.md`; `workflow/spec.md:694` → `docs/platform-foundations.md`), and proof.json has no row for those lines. The shard says pointer composition is owned elsewhere. Confirm a named F duty owns them.

## Process notes

- The brief lists one writable `check_shard.py`. Shard 3, like shards 1 and 2, wrote its own `check_shard_3.py`. The launch note named that file, so this is not a row defect, but the Lead should record the deviation.
- `check_shard_3.py` checks bindings, digests and replay. It does not check that a repoint's operand is actually removed at cutover, or that a patch touches only pointer tokens. It also replays only against the bare pin, never after the existing F chain. Those gaps are what let findings 2, 3, 5 and 6 through.

## Commands

| Command | Exit |
|---|---|
| `git status --short`, `git log`, `git merge-base --is-ancestor 42893a825 HEAD`, `git diff --stat c94545de5 HEAD -- . ':!plans'` | 0 |
| `python3 -B .../park-judgments/check_shard_3.py --shard 3` | 0 |
| `python3 -B` evidence scripts (dumps, ledger mapping, operand facts, successor coverage, cross-shard overlap) under a tempfile dir in `/tmp/fgos-work/` | 0 |
| independent `patch --fuzz=0` forward/reverse replay, 39 patches | 0 (39/39) |
| F-chain replay (step-07 + composition effective specs, byte-guarded) then `patch --dry-run --fuzz=0` of each shard patch | 0 (script); results above |
| scratch removal | 0 |
