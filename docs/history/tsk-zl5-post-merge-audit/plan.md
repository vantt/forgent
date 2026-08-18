# Plan — tsk-zl5: post-merge review of tsk-1y6 and tsk-3xog

Mode: **high-risk** (hard-gate flag: audit/security — the review's subject
is the Iron Law merge-safety gate itself; also applies: existing covered
behavior — 3352+ pre-existing tests must stay green through this landing;
weak proof around the area — GitNexus's index is confirmed stale, see
below, so blast-radius evidence for the original implementation was
degraded and this review cannot lean on it either).

No `CONTEXT.md` exists for this item — `discovery`'s own verdict came back
`clear` (RESEARCH.md round 1: every file/commit/decision the task names is
real and matches its own description), which skips `exploring` by design.
This item's own description text — a fully-specified, D-ID-citing checklist
— is the locked scope; nothing here reopens or reinterprets it.

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` returns `gitnexus` at `status: present`, but
`.gitnexus/meta.json`'s `lastCommit` reads `7bb3231`, and current HEAD
(`36e0602f`) is many commits past that, including both merges under review.
Any blast-radius claim from GitNexus in this review is stale evidence; this
plan treats direct `rg`/file reads as the only trustworthy source, same
posture the task's own tooling notes already flagged.

## Approach

This is a review item, not a build item: the deliverable is a written
report (`REVIEW.md`), not new production code. No split candidates exist —
one person doing one sequential read-and-verify pass IS the honest shape
(`fgos graph --what-if` has nothing to compare: there is no second viable
ordering for "read a diff, check a claim against it"). The order below is
fixed by data dependency, not judgment:

1. Re-establish the two diff ranges (`f8cf7e36...210a4a61` for tsk-1y6,
   `6bfb149c...f8cf7e36` for tsk-3xog) via `git diff`/`git log`, so every
   claim below is checked against the actual patch, not against prose
   memory of what was intended.
2. Read `docs/history/iron-law-gate-human-ux/CONTEXT.md` (already read in
   RESEARCH.md round 1 — D1-D9 confirmed real) and
   `docs/history/tsk-3xog`'s own item description (its "CẬP NHẬT ... ĐÃ LỖI
   THỜI" section) as the fixed ruler every code claim below is checked
   against. Neither gets re-litigated (task's own instruction, honored).
3. For each of the 5 files-groups the task names (tsk-1y6-1 gate code,
   tsk-1y6-2 approve skill, tsk-1y6-3 merge-loop/merge-next, tsk-1y6-4
   spec/decision record, tsk-3xog heading contract), check the code/prose
   directly against the specific claim listed — never trust the evidence
   file's own prose without cross-reading the real source it describes.
4. Re-examine the three "judgment calls" the task flags, from the actual
   diff/config, not from the original session's own stated reasoning.
5. Run `npm test` once, fresh, and record the real pass/fail count against
   the "3352+ pass / 0 fail" claim — main has moved since that number was
   recorded, so this is a live check, not a re-quote.
6. Write every finding to `REVIEW.md` with `file:line` citations, a
   `## Verdict` section per checked item (confirmed / discrepancy /
   unable-to-verify), and a top-level summary.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| A1b discriminator separateness (bin/fgos.mjs) | Medium — a shared-helper refactor would silently violate D1 if the boundary logic diverges later | Read the three call sites directly, quote each discriminator expression verbatim |
| D7 fail-closed (missing config key / unknown level) | Medium — a silent fail-to-warn would be a real safety regression on the gate this whole item is about | Read the resolver function; trace both the missing-key and unknown-value branches to their return value |
| D8 `kind:'engine'` write path | Medium — shelling to `fgos decision` would silently mis-tag every warn-level skip as `kind:'design'`, corrupting downstream retrospective reads (the exact failure class `docs/history/iron-law-gate-human-ux/CONTEXT.md`'s own scout evidence table already names) | Read the actual call site; confirm it calls `addDecision` in-process, not a CLI shell-out |
| Evidence-file failing-test-first claim (5-fail/5-pass) | Light — a false claim here only misleads a future reader, doesn't affect running behavior | Read the real test file's git history / diff, count actual assertions added |
| tsk-3xog guard heuristic false-negative gap | Medium — an 11%-of-corpus bug already existed once (the item's own stated motivation); a residual gap means the class of bug isn't actually closed | Read the guard script's regex/heuristic directly, reason about heading shapes it would miss |
| 30-file heading-only rename | Light — a content change hiding in a "heading rename" commit would be scope creep, but low blast radius (docs only) | `git diff` a handful of the 30 files, confirm only the `## Locked decisions`-adjacent heading line changed |
| Retroactive `docs/history/tsk-3xog/plan.md` honesty | Light — inaccurate retroactive docs mislead future readers but don't change already-merged behavior | Compare the plan's narrative against the real diff range `6bfb149c...f8cf7e36` |
| Rescoped verify clause 4 (`main...HEAD` → `fgw/tsk-1y6...HEAD`) | Medium — if this rescoping quietly weakens what the verify actually proves, the item's own DoD claim is hollow | Re-derive both diff expressions' real semantics on a shared branch, confirm the narrower form still proves the same thing the wider one would have |
| False-positive Iron Law trip on "schema" | Light — already human-acknowledged before merge, so the risk here is only "was the acknowledgment reasoning sound", not an unmerged gate hold | Read the actual cited description text and confirm "schema" only appears inside the example filename, never as a real schema-touching claim |

## Feasibility matrix (fgos-coding-validating pass)

**Reality gate** — mode fit PASS (high-risk lane matches the audit/security
hard-gate flag this item genuinely carries); repo fit PASS (RESEARCH.md
round 1: all 22 named files exist) **with one real caveat** (see row 1
below — the code moved since the task text was written); assumptions PASS
(every plan assumption below is either proven or flagged); smaller path
PASS (no honestly smaller shape than one sequential review pass exists);
proof surface PASS (item's own `verify` is a real runnable command, no
split children to check); impact-analysis posture PASS
(`.gitnexus/meta.json`'s `lastCommit` is `7bb3231`, current HEAD is
`36e0602f` — confirmed stale, matches the `degraded` posture plan.md
already recorded).

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| The task's cited file:line anchors (`bin/fgos.mjs` ~2487/3494/4100) still hold | Medium | Read `bin/fgos.mjs` for `classifyIronLaw`/`wouldTripIronLaw` | **They don't.** `grep -rn classifyIronLaw` outside test files hits only `src/evolve/iron-law.mjs` (definition) and `src/runner/iron-law-gate.mjs` (one call site). `bin/fgos.mjs` has zero hits. A later item (`src/runner/iron-law-gate.mjs`'s own header comment cites `tsk-49i D1`) extracted the three call sites into `src/verbs/merge/{approve,sync-root,merge}.mjs` + a shared `src/runner/iron-law-gate.mjs`/`src/verbs/merge/iron-law-level.mjs` pair, post-dating tsk-1y6's merge | Plan updated (see Approach step 3 caveat below) — findable by symbol name, not by the task's line numbers |
| A1b: the trunk-boundary discriminator stays two separate expressions per call site, not merged into a shared helper | Medium | Read the real call sites | `approve.mjs:282` passes `{ view }` (→ `resolveRoot(view, item.id) === item.id` inside the shared `ironLawDiffOpts`); `sync-root.mjs:65` passes `{ trunk: item.parent ? targetBranch : null }` (the literal `!item.parent` ternary, at the call site itself). The two discriminator EXPRESSIONS are still separate and call-site-local; what got shared post-tsk-1y6 (`tsk-49i D1`) is only the git-mechanics preamble (diff resolution, branch-exists check) the original CONTEXT.md never asked to keep triplicated | Confirmed checkable — real nuanced verdict, full writeup belongs in REVIEW.md |
| D7: missing config key / unrecognized level fails closed to `ask` | Medium | Read the level resolver | `src/verbs/merge/iron-law-level.mjs:19-22`: `IRON_LAW_LEVELS.includes(level) ? level : DEFAULT_IRON_LAW_LEVEL`; `registrations.mjs:1096-1097`: `IRON_LAW_LEVELS = ['ask','warn']`, `DEFAULT_IRON_LAW_LEVEL = 'ask'` | Confirmed PASS with real evidence already in hand |
| D8: `warn`-level skip record uses `addDecision` with `kind:'engine'` directly, never shells to `fgos decision` | Medium | Read the record-writer | `iron-law-level.mjs:34-41` (`recordIronLawSkip`): calls `addDecision(dir, {..., kind: 'engine'})` in-process; its own comment cites the exact reason the task's D8 check names (`fgos decision` has no `--kind` flag, would default to `kind:'design'`) | Confirmed PASS with real evidence already in hand |
| tsk-3xog's heading-drift guard has no false-negative gap for an unseen heading shape | Medium | Read `scripts/check-locked-decisions-heading-drift.mjs`'s heuristic | Not yet read in this pass — file confirmed to exist (RESEARCH.md round 1); reading its actual regex/heuristic is execution-stage work | Checkable, deferred to execution (no blocker — the file exists and is readable) |
| `tsk-1y6-4`'s verify clause 4 rescoping (`main...HEAD` → `fgw/tsk-1y6...HEAD`) is sound, not a loophole | Medium | Read the item's real verify field / event history | Not yet read in this pass — `tsk-1y6-4` may no longer exist as a live item (its children materialize then finish); real check is `fgos show tsk-1y6-4` or the event log, execution-stage work | Checkable, deferred to execution (no blocker) |
| tsk-3xog's "schema" Iron Law trip was a real false positive | Light | Read the item's actual description text | Not yet read in this pass — item description already partly seen via `fgos show tsk-3xog` (RESEARCH.md round 1 quoted it in full); the "schema" substring itself needs a direct grep against that same text, execution-stage work | Checkable, deferred to execution (no blocker) |

**Decision: READY WITH CONSTRAINTS.** The plan is provably buildable — every
row above is checkable with real evidence, three rows are already fully
resolved with real citations, and the remaining three have a confirmed
real file to read with no access blocker. The one constraint: execution
must re-locate the Iron Law gate code by symbol name
(`classifyIronLaw`/`ironLawForItem`/`ironLawDiffOpts`/`readIronLawLevel`/
`recordIronLawSkip`), not by the task's own `bin/fgos.mjs` line-number
anchors, which are stale post-refactor. This does not change the item's
scope or acceptance criteria — the locked decisions (D1-D9) being verified
are unchanged; only their file location moved.

## Outstanding questions

None
