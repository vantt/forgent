# Review 10: Step 10 close current-content truth draw

Reviewer: reviewer:claude-session:a4954387@2026-10-15
Review mode: truth-sample
HEAD: aecdc30aad0ffd65a2956ff642c4be9410686ede
Content commit: aecdc30aad0ffd65a2956ff642c4be9410686ede
Seed: 48fb8050331b140fe106a318e1077ea5bf5ca93840261d68b38749f3913b11f6 (SHA256 of the start time 2026-10-15T15:22:42Z)

## Scope and method

Read-only review (A28 item 3(a), Step 10). Worktree /home/vantt/projects/forgentX-s8-review, detached at aecdc30aa; scripts and data in work-truth10/ (pop.mjs, all.json, pop.json, bul.txt, paths.txt). Units were extracted with extractMarkdownConservationUnits (through the work-truth9 pop.mjs) from the three Step 10 carriers, after comparing docs/reading-map.md with `git show 980cb2931:docs/reading-map.md` (120 lines before, 182 now; the diff is only the new section 5, lines 122-182).

Population (L10-4), 7 units in all, so all 7 are drawn (fewer than 30, so no sampling; the seed is recorded but selects nothing):
- docs/reading-map.md section 5: the intro paragraph (unheaded-block-15) and the 53-entry bullet list (unheaded-block-16). The extractor returns the whole list as ONE unit. I confirmed the 53 bullets (51 added + 2 reconciled by shared token) are each byte-identical to a line of docs/specs/reading-map.md (53 of 53 verbatim).
- docs/platform/history/documentation-authority-unification/README.md: 4 units (metadata fence, "Added in candidate" paragraph, evidence table, closing paragraph). The H1 heading was excluded.
- docs/platform/agent-confinement/spec.md unheaded-block-47 (line 370), the re-carried binding paragraph. Its "Added in candidate" label line (line 367) is a wrapper and was excluded.
Excluded: AGENTS.md and CLAUDE.md (reclassified out of platform scope), headings.

Truth method. Present-state assertions (a path exists, a verb or symbol exists, a doc owns X, a count) were checked against the tree at aecdc30aa with ls, git ls-files and grep. Normative text and the section's own "known stale carried sentences" label do not excuse an individually checkable false assertion in the list (the label is a disclaimer, not a correction; a reader of the map still gets a missing path). A missing path counts as false (per the task). All 53 bullets' backtick path tokens were extracted and tested (309 tokens, of which about 55 are real repo paths; the rest are symbols, verbs, flags), then the bullets carrying failures were read in full.

## Result

| Measure | Value |
|---|---|
| Population | 7 units (fewer than 30; all drawn) |
| Denominator | 7 |
| False units | 1 of 7 = 14.3% (the 53-entry list, unheaded-block-16) |
| Supplementary entry-level view | at least 7 of the 53 map entries carry a false assertion (about 13%), lower bound, because I did not deep-verify all 53 |

**Exceeds A28 threshold (10%).** A42 then applies the A40/A41 shape automatically.

Caution on the measure: the unit extractor makes the 53-entry list a single unit, so one stale entry fails the whole unit and the 7-unit rate moves in steps of 14.3%. The entry-level count (about 13%) is also above 10%, so the verdict does not depend on the grouping. The other six units (the intro, the four README units, the confinement paragraph) hold.

### False sentences, verbatim, with the correct fact (unit unheaded-block-16, docs/reading-map.md lines 130-182)

1. Entry at line 153, `domains/coding/AGENTS.md` ...: "tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`)". Correct: the file does not exist (git ls-files and ls: absent) and `skillForStage` appears nowhere in src/ or bin/. `getDomain` lives elsewhere (domain-registry code), not in that file. The three literal-missing-path list in step-10-report.md names this file as known.
2. Entry at line 154, `plugins/fgOS/`: "12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts)". Correct: plugins/fgOS/skills/ holds 36 non-fgos-prefixed verb wrapper directories (answer, approve, ask, cleanup-loop, ... unlock) plus fgos-* skills (55 entries in total); `check` is not among them. plugins/fgOS/.claude-plugin/plugin.json does exist.
3. Entry at line 173 (`src/evolve/candidates.mjs`): "`src/evolve/candidates.mjs` — Gate A candidate ranking ... dùng lại `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` ... surfaced qua `fgos evolve` (liệt kê + `--pick <id>`...)". Correct: src/evolve/ holds only iron-law.mjs; candidates.mjs, entropy.mjs and `listUnsettledFrictionsByWork` do not exist (grep over src, bin, packages: no hit); `fgos evolve` is not a verb (this is the same fact the Step 9 review recorded as F-C, bin/fgos.mjs usage list has no evolve).
4. Entry at line 177 (`src/evolve/iron-law.mjs`): "thuần, chưa có call site (Slice 3 wiring)". Correct: it has call sites: src/runner/iron-law-gate.mjs and src/runner/merge.mjs reference `classifyIronLaw`, src/intake/classify.mjs and risk-keywords.mjs use the shared keywords, and the worker prompt template src/runner/prompt-templates/worker-prompt-skill-pointer.txt:38 imports it.
5. Entry at line 171 (`src/report/enduser-index.mjs`): "(thuần, không I/O — mirror `entropy.mjs`)". Correct: src/report/entropy.mjs does not exist (the entropy signal now lives in packages/observe/rust/src/metrics_cli/entropy.rs, which the map lists separately).
6. Entry at line 179 (`test/`): "benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`". Correct: the path does not exist (docs/history has no phase-3-compound-learning directory; step-10-report.md names it among the three literal-missing paths).
7. Entry at line 180 (`scripts/run-test-canary.mjs` ...): "plan: `plans/260920-immediate-test-feedback-reduction/plan.md`". Correct: the plan moved to archive/plans/260920-immediate-test-feedback-reduction/plan.md; the plans/ path does not exist.

### Observations, not counted

- Entry at line 157 (`src/runner/` + `bin/fgos-runner.mjs`): "`dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS` ...)": src/runner/dispatch.mjs is now a 2.8 KB barrel; `EXECUTOR_ADAPTERS` is defined in src/runner/dispatch/transport.mjs. A slice-scoped location error, not counted. The same entry says both that the runner "không còn `--config`" and that `ensureRunnerConfigForDir` skips an explicit `--config`; the second clause is stale wording.
- Entry at line 179 (`test/`): "`npm test`, 2970 test": not re-counted (449 test files exist); unverified, not counted.
- README header line "Purpose: Locate the immutable migration evidence and dry-run snapshot": no dry-run snapshot exists yet and the body says so ("No snapshot is claimed present yet", "not an immutable snapshot"); the Purpose line reads as normative intent and is inconsistent with the body, not counted as a present-state assertion. The only *snapshot* files in the plan (reports/phase-06/history-snapshot-verification.json) belong to an earlier history-receipt feature, not a migration snapshot.
- Intro unit (unheaded-block-15): all claims hold ("merged verbatim" 53 of 53; the how-to and README routes above are present at reading-map lines 73-82 and 18-52; docs/specs/reading-map.md exists). Its "Known stale carried sentences" disclosure is accurate but, as noted, does not correct the sentences.
- README: all six relative links resolve from docs/platform/history/documentation-authority-unification/ (four levels up reach the repo root; plan.md, progress.md, step-10-report.md, owner-answers.md, ledger/decisions/, holds.md all exist); SYNC 17b751966 is a real commit; scripts/propose-doc-decisions.mjs supports --snapshot and --verify (lines 27-28); phase-09 file lists the sealed ledger (line 64) as its job.
- Confinement paragraph: every checkable symbol exists and behaves as stated: `bind`/`markLaunched` in src/runner/dispatch/confinement/drivers/bwrap.mjs:571,574, `bindingForPrepared` authority.mjs:1772, confinement-bind-failed herdr-round.mjs:1903,1954 and transport.mjs:376, supervisor binding transport.mjs:370-406, marker fields and `credentialKept` allow-list cleanup.mjs:143-146, LAUNCH_GRACE_MS 120000 and RUN_SETTLE_GRACE_MS 600000 (cleanup.mjs:23,138,549), reaper rule cleanup.mjs:542-570, `ownership-marker-mismatch` authority.mjs:1861; the "Chưa có" items (holder-lock, exclusive claim on reap, refusing bind past the run window) have no code (no match), as the paragraph says.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_d956ba3fb9a8cce9589194e5f59d021f | rework | docs/reading-map.md#unheaded-block-16 (lines 130-182; source docs/specs/reading-map.md, 53 entries verbatim): 7 false assertions (F1-F7 above): missing `src/state/workflow-stage-graphs.mjs` and `skillForStage`; plugin "12 verb wrapper" (36 exist); `src/evolve/candidates.mjs`, `entropy.mjs`, `listUnsettledFrictionsByWork`, `fgos evolve` absent; `iron-law.mjs` "chưa có call site" (it has several); `entropy.mjs` mirror; f4-benchmark path absent; plans/260920 plan moved to archive/plans. | 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30 | 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30 |
| docs/reading-map.md#unheaded-block-15 | ok | Section 5 intro: 53 of 53 entries byte-identical to docs/specs/reading-map.md; how-to and README routes present above (lines 18-52, 73-82). The stale-sentences caveat is disclosed. No claim row at this HEAD (pending decision). | 4d25460103ef8fb3a28a5f34bcb9680e7db43604944c9b3c222b18ffb1c82077 | 4d25460103ef8fb3a28a5f34bcb9680e7db43604944c9b3c222b18ffb1c82077 |
| docs/platform/history/documentation-authority-unification/README.md#unheaded-block-1 | ok | Metadata fence: Provenance SYNC 17b751966 is a commit; Related plan.md exists; Purpose line says "immutable ... snapshot" while body disclaims both (observation, not counted). No claim row at this HEAD. | 82b4913e62c417cb48019cb98d771b86771764bae507c0160bfbac12434327a0 | 82b4913e62c417cb48019cb98d771b86771764bae507c0160bfbac12434327a0 |
| docs/platform/history/documentation-authority-unification/README.md#unheaded-block-2 | ok | Receipts, decisions and holds live under plans/260925-documentation-authority-unification/; propose-doc-decisions.mjs has --snapshot and --verify (scripts/propose-doc-decisions.mjs:27-28); no snapshot is claimed present; Phase 9 owns sealing (phase-09 file:64). | 5c1ab2fcc7d1e7528c6437e2dce667d33b4258368401a474f641aed4ac9f0fd8 | 5c1ab2fcc7d1e7528c6437e2dce667d33b4258368401a474f641aed4ac9f0fd8 |
| docs/platform/history/documentation-authority-unification/README.md#unheaded-block-3 | ok | Evidence table: all six link targets exist (plan.md, reports/phase-06/progress.md, step-10-report.md, owner-answers.md, ledger/decisions/, holds.md); relative depth correct. | 39e6428d4b8e84c5c99f02b7cf0a2f72de575c9f04a940ebe4bea33080be02be | 39e6428d4b8e84c5c99f02b7cf0a2f72de575c9f04a940ebe4bea33080be02be |
| docs/platform/history/documentation-authority-unification/README.md#unheaded-block-4 | ok | Closing paragraph: states navigation only, no snapshot, no retirement; docs/specs/ legacy sources are still present. | 7d8fa372f556d0efc9044ca87854bc59479535c9c3343c6a7c419d0516fa8512 | 7d8fa372f556d0efc9044ca87854bc59479535c9c3343c6a7c419d0516fa8512 |
| docs/platform/agent-confinement/spec.md#unheaded-block-47 | ok | Re-carried binding paragraph (spec.md line 370): bind/markLaunched (drivers/bwrap.mjs:571,574), bindingForPrepared (authority.mjs:1772), confinement-bind-failed (herdr-round.mjs:1903,1954; transport.mjs:376), supervisor binding (transport.mjs:370-406), marker allow-list (cleanup.mjs:143-146), grace constants (cleanup.mjs:23,138,549), reaper rule (cleanup.mjs:542-570), ownership-marker-mismatch (authority.mjs:1861); the "Chưa có" items have no code. Digest equals the recarry record's targetSHA unit digest. | a7af69f1674754e516550a8802a2acc64dd3a49655a4cdd01fa82d43a540d5ed | a7af69f1674754e516550a8802a2acc64dd3a49655a4cdd01fa82d43a540d5ed |

Source digest equals target digest in every row (verbatim carries). Rows other than the list carry the unit path and anchor in place of a claim ID because the Step 10 decisions are pending and no native claim ID exists at this HEAD; the list row uses claim_d956ba3fb9a8cce9589194e5f59d021f, the claim whose source digest equals the list unit digest (also named in step10-reading-map-merge-execution.json).

Side effects: none; no file in the worktree was modified, no fgos verb was run, .fgos/secrets.local.env was not read.

Status: DONE
Summary: All 7 Step 10 current units drawn (population under 30); 1 of 7 false (14.3%), the 53-entry reading-map list, with 7 verbatim false sentences; exceeds A28 threshold, so A42 applies the A40/A41 shape automatically.
Concerns/Blockers: The extractor treats the 53-entry list as one unit, so the unit rate moves in 14.3% steps; the entry-level lower bound (about 13%) agrees. The other six units hold. The seven false entries are carried verbatim from docs/specs/reading-map.md (the section's own "known stale" label discloses them but does not repair them), so fixing them means editing the carried text (a correction pass), not re-carrying.
