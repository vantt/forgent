# Cell 6.3 — planning.validate-plan live smoke

Status: done
Date opened: 2026-08-30
Date closed: 2026-08-30

## Scope

Real (non-fake-executor) run of one `planning.validate-plan` reviewer
Assignment against a throwaway low-risk Work item, per
step-06-work-attached-team-adoption.md §7-8. See
`trace/current-cell.md` for full contract.

## Throwaway Work item

- id: `tsk-5ka`
- title: "Cell 6.3 live smoke: throwaway item for planning.validate-plan"
- kind: `docs`, risk: `light` (current-cell.md said `risk: low`, but the
  `coding` domain's real risk enum is `["light","standard","heavy"]` —
  `light` is the closest/lowest legal value; using `low` would have been
  rejected by `add`'s own validation), verify: `"true"` (no-op, mirrors the
  smoke-tsk-56w-* precedent).
- docsRef: `docs/history/cell-6-3-validate-plan-live-smoke/`
- plan.md: committed at
  `docs/history/cell-6-3-validate-plan-live-smoke/plan.md`
  (git `6e7a5e28`), Mode: tiny, "Outstanding questions: None" — mirrors
  the `smoke-tsk-56w-*` precedent shape exactly.

## Command transcript

1. `git add docs/history/cell-6-3-validate-plan-live-smoke/plan.md && git
   commit` — committed the throwaway plan.md (`6e7a5e28`).
2. `node bin/fgos.mjs add --title ... --kind docs --risk light --verify
   true --stage planning --docs-ref docs/history/cell-6-3-validate-plan-live-smoke/`
   — created `tsk-5ka` directly at `stage: planning` (satisfies §7's
   "Required starting state" without a separate discover step).
3. `node bin/fgos.mjs doctor` — Team Dispatch-relevant checks pass
   (`dispatch-decide-hook-wired: true`, `domain-workflow-operations-coverage:
   true`). 7 unrelated pre-existing repo checks fail (root-drift,
   events-jsonl truncation on unrelated logs, README install-tag, etc.) —
   none touch dispatch/Team-Dispatch machinery; not this cell's scope.
4. `node bin/fgos.mjs workflow operations --stage planning` — confirmed
   `validate-plan` is a declared stage operation (`role: reviewer`,
   `policy.minTier: standard`, `preferPersona: code-reviewer`,
   `preferExecutor: claude`).
5. Built the real Assignment object via the repo's own
   `buildAssignment` (`src/runner/dispatch/assignment.mjs`, imported
   read-only from a throwaway script — no edits to any `dispatch/*.mjs`
   file) for `{work: tsk-5ka, stage: planning, operation: validate-plan}`,
   then persisted it once to
   `.fgos/assignments/asgn_tsk_5ka_validate_plan_001/assignment.json` —
   the same immutable-input contract `executeAssignment` itself uses on
   first run.
6. `node src/runner/dispatch.mjs decide --assignment
   asgn_tsk_5ka_validate_plan_001 --has-live-task-access` → `{"mechanism":
   "out-of-process","configured":true,"executorId":"claude"}`.
7. Per the repo's own dispatch rule (AGENTS.md § Dispatch), an
   `out-of-process` mechanism must run through `dispatch.mjs execute`,
   never a hand-rolled command: `node src/runner/dispatch.mjs execute
   --assignment asgn_tsk_5ka_validate_plan_001 --has-live-task-access
   --cwd <repo-root> --repo-root <repo-root>`. This spawned a real,
   out-of-process `claude` CLI subprocess as the `code-reviewer`-persona
   reviewer, running `fgos-coding-validating`'s real task-spec contract
   against the real repo — not a fake executor. Exit code 0, duration
   ~212s.
8. `node bin/fgos.mjs move tsk-5ka --to wontfix` — parked the throwaway
   item through the normal engine verb (no direct state edit).
9. Regression battery (`node --test test/runner/operation-choice.test.mjs
   test/runner/loop.test.mjs test/runner/assignment-runresult.test.mjs
   test/runner/assignment-dispatch.test.mjs test/e2e/runner-loop.test.mjs
   test/cli/fgos-stage.test.mjs`) — 288 pass, 0 fail.

**Driver path used, and why:** decided via `dispatch.mjs decide --assignment
... --has-live-task-access`, which resolved to `out-of-process` (executor
`claude`, `configured: true`) rather than `in-process` — so the Doer did
not need to act as the reviewer directly; `dispatch.mjs execute` drove a
real, separate `claude` CLI subprocess end to end, which is the more
faithful "real dispatch pipeline" proof for a reviewer-role Assignment
(matches `validate-plan`'s own task-spec: "the reviewer MUST ONLY write
verdict artifacts... MUST NOT call `fgos plan` or fire Work lifecycle
edges directly").

## Artifacts captured

All under `.fgos/assignments/asgn_tsk_5ka_validate_plan_001/`:

- `assignment.json`
- `runs/01/run.json`
- `runs/01/dispatch-plan.json`
- `runs/01/agent-result.json` (+ `agent-report.md`)
- `runs/01/evidence.json`
- `runs/01/result.json` (+ `runs/01/exit.json`)

## Driver outcome

- `agent-result.json` / `result.json.agentClaim`: verdict `READY`, all six
  reality-gate dimensions PASS, `feasibilityMatrix: []` (no medium+ risk
  named — correct for a docs-only tiny-mode plan), two non-blocking gaps
  noted by the reviewer itself (a referenced but nonexistent
  `CONTEXT.md` — not required for a self-contained tiny-mode plan; and
  that its own sandboxed tool access refused direct `fgos`/impact-analysis
  CLI calls, consistent with the task-spec's reviewer boundary, and
  immaterial since the plan touches zero code).
- `result.json`: `status: "done"`, `confidence: "reported"`.
- `evidence.json`: `operationMutability: "read-only"`, `gitBefore ===
  gitAfter`, `changedFiles: []` — the reviewer Assignment made no repo
  mutation. `dirtyBefore`/`dirtyAfter` both list the same pre-existing
  unrelated dirty files (coordinator's trace edits, untracked
  `.claude/agents/*`, `.agentkit/*`) — nothing new introduced.
- No Work lifecycle verb fired inside the Assignment: `tsk-5ka` stayed at
  `status: todo`, `stage: planning` immediately after the run (confirmed
  via `fgos show tsk-5ka`) — the driver-side `wontfix` move (step 8 above)
  happened afterward, separately, through the normal engine verb, exactly
  as the acceptance criteria require ("Any Work state change happens only
  through existing engine verbs").

**`run.json` still says `"status": "running"` after settle — expected, not
a gap.** Read `src/runner/dispatch/assignment-runner.mjs` (read-only,
lines 653-666 plus its own file-header comment at line 7, "Always writes
run.json before process spawn"): `run.json` is written exactly once,
before the executor subprocess is spawned, and is never rewritten
afterward. The authoritative settled record lives in `exit.json`
(`exitCode`/`signal`/`settledAt`, written post-spawn) and `result.json`
(`status`/`confidence`, derived by `classifyRunEvidence`). `run.json`'s
`"running"` value is a pre-spawn snapshot by design, superseded by those
two files — not a stuck or mis-settled run.

## Regression battery

`node --test test/runner/operation-choice.test.mjs test/runner/loop.test.mjs
test/runner/assignment-runresult.test.mjs test/runner/assignment-dispatch.test.mjs
test/e2e/runner-loop.test.mjs test/cli/fgos-stage.test.mjs`

tests 288, pass 288, fail 0, cancelled 0, skipped 0.

## Findings (Reviewer)

No blocking findings. Verdict: legitimate live proof, safe to close, safe
to red-team further. Independent verification performed (not narrative
trust): real `work.move` event confirmed in the per-session event log
(`todo`->`wontfix`, `role:"human"`, no hand-edited `.fgos` state);
millisecond-level timing consistency across assignment/run/exit records;
`agent-report.md`/`agent-result.json` sha256 independently recomputed and
matched against `result.json`'s `settleReports`/`claimSha256` (files could
not have been forged without the real settle path in
`assignment-runner.mjs`, which predates this cell's boundary commit);
`changedFiles: []`/`gitBefore===gitAfter` traced to real
`computeChangedFiles`/git calls in `assignment-runner.mjs` (not
self-reported); `run.json` "running" claim confirmed against
`assignment-runner.mjs` lines 653-666 (written once, pre-spawn) plus its
file-header comment; grepped `assignment-runner.mjs` for any Work-mutation
call — none found, confirming no lifecycle leak is even possible from that
code path. Regression suite (288/288) independently re-run and reproduced.
Minor non-blocking notes: ~7h real-world gap between run settle and the
`wontfix` move is unexplained but inert (checked: nothing else touched
tsk-5ka or dispatch code in that window); this cell delivers only
Adoption-Completion-Criteria item 1 (read-only op) by design, item 2
(an executing-stage op) is explicitly out of scope here (Cell 6.4/6.5/6.6).

## Findings (Red-team)

Verdict: no exploitable/blocking issue in this cell's actual live run.
Three attack classes CLEAN: (2) `--has-live-task-access` self-declaration
cannot escalate mechanism choice (`mechanism.mjs:42-45,64` — config wins
for cli-spawn-shaped executors regardless of the flag, confirmed live);
(3) no replay/reuse path to fake a second live proof without a real
subprocess run (`assignment-runner.mjs:526-547` treats `assignment.json`
as immutable input, evidence computed live per run); (4) no Work-lifecycle
verb reachable from inside the Assignment, human-only gate and
dirty-before/no-evidence logic behaved correctly (re-confirms Reviewer).

One MEDIUM, non-blocking, queued-follow-up finding, unique to this being a
LIVE (not fake-executor) run — fake-executor testing in prior cells could
not have surfaced it: **the reviewer role's spawned subprocess is not
privilege-scoped; the "must only write verdict artifacts, must not fire
Work lifecycle edges" boundary in `domains/coding/task-specs/validate-plan.md:44`
is enforced by (a) prompt discipline, (b) the worker-oriented
`--allowedTools`/`acceptEdits` config incidentally also blocking `fgos`/CLI
calls for THIS run (empirically true here, but not scoped-by-design — the
allowedTools list has been widened before for legitimate worker needs, per
`docs/history/claude-executor-allowedtools-fix/`), and (c) settle-time
fail-closed rollback (`assignment-runner.mjs:401-404`,
`rollbackReadOnlyMutations` 248-317 — real, already-hardened, detect-and-revert
not prevent). `assignment.mjs:336` (`READ_ONLY_ROLES`) only feeds a persona
label and post-hoc evidence classification; it never branches executor
args, so a reviewer and a worker resolve to the identical executor profile
(same `acceptEdits` + `Bash(git commit:*)` grant). This leaves a narrow
TOCTOU window (a stray write/commit could exist on disk between subprocess
exit and rollback) and no test asserts reviewer/worker executor profiles
stay distinct. This run's own evidence stayed clean (`changedFiles: []`,
no `fgos` call succeeded per the reviewer's own stdout) — not exploited,
but the gap is now empirically demonstrated rather than theoretical.
Minimal fix (not applied here, queued): give `READ_ONLY_ROLES` assignments
their own narrower `executors.<id>` entry (no `acceptEdits`, no
`Bash(git commit:*)`) at `assignment-runner.mjs`'s executor-default site
(~line 679), plus a regression test asserting the reviewer path's resolved
args never include `Bash(git commit`.

## Gaps

- current-cell.md specified `risk: low`; the real `coding`-domain risk
  enum has no `low` value (`light`/`standard`/`heavy`) — substituted
  `light` (documented above). Worth a follow-up doc fix in
  step-06-work-attached-team-adoption.md/current-cell.md prose if this
  cell's own risk wording is reused verbatim elsewhere.
- No code path in `src/runner/dispatch/*.mjs` needed a change to make
  this live smoke work — confirms Cell 6.3 is a pure ops/proof task, not
  a hardening task.
- ~7h unexplained (but inert, independently checked) gap between run
  settlement and the driver-side `wontfix` move — cosmetic, not a proof
  gap per Reviewer.
- RESOLVED (Fix Round 1 + 2): reviewer-role executor invocation was not
  privilege-scoped (identical executor profile as worker: `acceptEdits` +
  `Bash(git commit:*)`). Fix Round 1 added a scoped `claude-reviewer`
  executor profile (git-write grant dropped) gated on
  `READ_ONLY_ROLES`; a review pass then found that gate missed
  operation-based read-only classification (`judge-ambiguity`,
  `lock-decisions`, `shape-plan` at their real default `role: implementer`
  wiring). Fix Round 2 widened the gate to `isReadOnlyAssignment(...)`,
  closing that coverage gap. Accepted residual carried forward: this is a
  git-write tool-family gate, not real per-run path-scoped Write
  enforcement (Claude Code's own permission syntax doesn't consult
  `Write(path)` rules); existing settle-time fail-closed rollback remains
  the defense-in-depth. See Fix Round 1 / Fix Round 1 Review / Fix Round 2
  sections below for full detail.

## Status

done — one real `planning.validate-plan` reviewer Assignment ran through
the actual out-of-process dispatch pipeline against throwaway item
`tsk-5ka`; all six required artifacts exist; driver outcome is a reported
`READY` verdict with no in-Assignment Work lifecycle move; the throwaway
item is now parked `wontfix`; full regression battery is green (292/292
after two fix rounds). Reviewer: SAFE, no blockers, on the base live-smoke
proof. Red-team: no exploitable issue in the actual run; one MEDIUM
design-gap finding raised, fixed in Fix Round 1, a coverage hole in that
fix caught by a follow-up review pass (HIGH), closed in Fix Round 2.
Cell closed by coordinator after independent re-verification of both fix
rounds (diff read, tests re-run).

## Fix Round 1

Closed the Red-team MEDIUM finding: a `READ_ONLY_ROLES` (reviewer/
researcher/advisor) Assignment resolved to the IDENTICAL executor profile
as a worker (`acceptEdits` + `Bash(git add:*),Bash(git commit:*)`).

**CLI scoping research (fix step 1).** Confirmed against `claude --help`
and the official permission-rules doc
(`code.claude.com/docs/en/permissions`): Claude Code only ever CONSULTS a
path-scoped rule written as `Edit(<path>)` or `Read(<path>)` — a rule
written as `Write(<path>)` is accepted at parse time but never consulted
(the doc's own words: "If you write a path rule for Write ... instead,
Claude Code accepts the rule but never consults it ... Use `Edit(docs/**)`
in place of `Write(docs/**)`"). `Edit(<path>)` DOES govern Write too (a
tool-family rule, not just the literal `Edit` tool). So real path-scoped
enforcement is possible in principle via `Edit(<runDir>/**)` — but this
executor's spawn args are a static, config-time string template
(`resolveExecutorCommand`/`transport.mjs`, only `{prompt}`/`{model}` ever
get substituted); the reviewer's own `runDir` is only known at dispatch
time (one directory per run attempt, `runs/NN/`), so wiring a real
`Edit(<runDir>/**)` rule would need a new per-run templating dimension in
`transport.mjs` — outside this fix round's authorized file scope
(`assignment-runner.mjs` + `.fgos/config.json` only) and outside its
non-goals ("do not build path-scoped Write enforcement ... rather than
inventing a new enforcement layer"). **Accepted residual:** this fix is a
tool-FAMILY gate (no git-write grant for the reviewer profile, for any
path), not a path-scoped one; the existing settle-time fail-closed
rollback (`assignment-runner.mjs`'s `rollbackReadOnlyMutations`,
248-317/401-404) remains the defense-in-depth for anything a
tool-family gate alone cannot prevent.

**What changed:**

- `src/runner/dispatch/assignment.mjs` — hoisted the function-local
  `READ_ONLY_ROLES` Set (`reviewer`/`researcher`/`advisor`) to a module-level
  export, so `assignment-runner.mjs` can gate a dispatch-time executor
  resolution on the identical role set `isReadOnlyAssignment` already uses,
  without duplicating it.
- `.fgos/config.json` — added `runner.executors.claude-reviewer`: same
  `-p {prompt} --model {model} --permission-mode acceptEdits` invocation
  as `runner.executors.claude`, minus the `--allowedTools` flag entirely
  (was `Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git
  commit:*)`). `acceptEdits` is kept so the reviewer can still Write its
  own `agent-result.json`/`agent-report.md` into its run dir (the exact
  capability proven live in this cell's base run) — dropping the whole
  `--allowedTools` flag removes every Bash grant (the reviewer never had a
  legitimate use for any), while Claude Code's own built-in read-only Bash
  allowlist (status/diff/log-class commands) is unaffected regardless of
  `--allowedTools`.
- `src/runner/dispatch/assignment-runner.mjs` — at the executor-dispatch
  site (`executeAssignment`, right after the pre-existing "dispatch decide
  mismatch" guard): computes `resolvedExecutorId`, redirecting to
  `claude-reviewer` only when (a) `effectiveAssignment.role` is in
  `READ_ONLY_ROLES`, (b) the resolved family is the default `claude`
  (`effectivePolicy.executorPreference[0] === 'claude'`), and (c)
  `cfg.executors['claude-reviewer']` actually exists — absent-safe: no
  config entry means byte-identical `claude` dispatch, same as before this
  fix. A non-`claude` `preferExecutor` (`pi`, `agy-cli`, `codex`, ...) is
  never touched — the gate only ever fires on the literal `'claude'`
  string. `resolvedExecutorId` (not the raw policy value) now also feeds
  `run.json`'s and the settled `RunResult`'s `executorId` field, so the
  audit trail names the executor that actually ran, while
  `RunResult.policy.executorPreference` still records the pre-routing
  declared preference unchanged (both fields present, distinct purposes).

**Tests added** (`test/runner/assignment-dispatch.test.mjs`, 3 new,
end-to-end through the real `executeAssignment` with fake spawned
executors that record their own received argv):

1. a `role: reviewer` `validate-plan` Assignment resolves
   `executorId: 'claude-reviewer'`, never spawns the worker executor at
   all, and the reviewer's own received argv never contains
   `Bash(git commit`.
2. the identical Assignment with `role: 'implementer'` (worker/default)
   is unaffected: resolves `executorId: 'claude'`, never spawns the
   `claude-reviewer` profile, and its received argv still contains
   `Bash(git commit` — proving the gate is role-scoped, not a global
   tightening.
3. with no `runner.executors.claude-reviewer` entry configured at all, a
   `role: reviewer` Assignment still resolves `executorId: 'claude'` and
   spawns the plain worker profile — the absent-safe fallback.

**Test results.** New file-local run:
`node --test test/runner/assignment-dispatch.test.mjs` — 15/15 pass (12
pre-existing + 3 new), 0 fail. Full regression battery re-run:
`node --test test/runner/operation-choice.test.mjs test/runner/loop.test.mjs
test/runner/assignment-runresult.test.mjs test/runner/assignment-dispatch.test.mjs
test/e2e/runner-loop.test.mjs test/cli/fgos-stage.test.mjs` — 291/291 pass
(288 base + 3 new), 0 fail.

**Status:** done. No behavior change for worker-role or non-`claude`
executor dispatch (proven by test 2 above and by the gate's own
`=== 'claude'` literal check). Residual (documented, not a gap left
silent): the fix is a git-write tool-family gate, not real per-run
path-scoped Write enforcement — see the CLI scoping research note above
for exactly why, and why closing that residual would need a new
templating dimension outside this fix round's authorized scope.

## Fix Round 1 Review — HIGH finding, fix overstated

Verdict: NOT safe to close, needs Fix Round 2. Reviewer verified
everything else in Fix Round 1 clean (explicit `preferExecutor:"claude"`
gating correctly, real `cfg` provenance from `.fgos/config.json`, tests
exercise the real `executeAssignment` path not a stub, no
`executorId`-consumer regression, absent-safe fallback correct) but found
one real, non-hypothetical coverage gap:

**HIGH — operation legality bypass.** The gate at
`assignment-runner.mjs:594-599` checks
`READ_ONLY_ROLES.has(effectiveAssignment.role ?? 'implementer')` only.
`isReadOnlyAssignment` (`assignment.mjs:341-362`) — the classification
this fix claims to close the gap for — also returns `true` via
`READ_ONLY_OPS.has(op)` regardless of role. Three operations
(`judge-ambiguity`, `lock-decisions`, `shape-plan`) declare
`role: implementer` in `domains/coding/workflows/feature.yaml` (lines
11/27/53) by their normal default wiring, are read-only-by-operation, and
still resolve the full worker `claude` executor (git-write intact) — no
override or misuse needed, just the real declared default. Fix Round 1's
own new test 2 (role-override to `implementer` on `validate-plan`) proves
the shape of the gap rather than closing it. Coordinator independently
confirmed via grep of both files. Recommended fix: gate on
`isReadOnlyAssignment(effectiveAssignment)` instead of the narrower
role-only check.

## Fix Round 2

Closed the Fix Round 1 review HIGH finding: the dispatch-time executor-scoping
gate checked `READ_ONLY_ROLES.has(role)` only, so `judge-ambiguity`/
`lock-decisions`/`shape-plan` — read-only by *operation* via `READ_ONLY_OPS`,
not role, and all declared `role: implementer` by default in
`domains/coding/workflows/feature.yaml` — still resolved the full worker
`claude` executor (git-write grant intact) at their real default wiring, no
override or misuse needed.

**What changed:**

- `src/runner/dispatch/assignment-runner.mjs` — the gate condition at the
  executor-dispatch site changed from
  `READ_ONLY_ROLES.has(effectiveAssignment.role ?? 'implementer')` to
  `isReadOnlyAssignment(effectiveAssignment)` (already imported), so the
  gate now shares the identical read-only classification `evidence`
  classification and mission-mode checks elsewhere in this file already use
  — role-based (`reviewer`/`researcher`/`advisor`) OR operation-based
  (`READ_ONLY_OPS`), with `KNOWN_MUTATING_OPS` still correctly overriding
  both to `false`. The other two gate legs (`defaultExecutorId === 'claude'`,
  `cfg.executors['claude-reviewer']` presence) are unchanged — same
  absent-safe, `claude`-only-family scope as Fix Round 1. The now-unused
  `READ_ONLY_ROLES` import was removed from this file (still exported from
  `assignment.mjs` for its other consumer, `isReadOnlyAssignment` itself);
  the stale explanatory comment above the gate was widened to describe the
  operation-based path too.

**Tests** (`test/runner/assignment-dispatch.test.mjs`):

1. New: a `shape-plan` Assignment built with no role override (so it takes
   its real default `role: implementer` from `feature.yaml`) resolves
   `executorId: 'claude-reviewer'`, never spawns the worker executor, and
   the reviewer's received argv never contains `Bash(git commit` — proves
   the operation-based read-only path is now covered without any role
   override.
2. Replaced Fix Round 1's "worker/default-role assignment is unaffected"
   test: its premise used `operation: 'validate-plan'` with an explicit
   `role: 'implementer'` override — `validate-plan` is itself in
   `READ_ONLY_OPS`, so under the new gate that Assignment would now
   (correctly) resolve `claude-reviewer`, which would have made the old
   test assert the wrong thing. Replaced with a genuinely mutating
   operation (`implement-item`, in `KNOWN_MUTATING_OPS`) at its real
   default role, with a real git repo and a worker script that mutates a
   tracked file so `classifyRunEvidence` has genuine `changedFiles`
   evidence to settle `done`. Confirms `executorId: 'claude'`, the reviewer
   profile is never spawned, and the git-write grant is still present in
   the worker's received argv — i.e. `KNOWN_MUTATING_OPS`'s override inside
   `isReadOnlyAssignment` correctly carries through to the new gate
   condition.
3. Existing Fix Round 1 tests 1 and 3 (`role: reviewer` → `claude-reviewer`;
   absent-config fallback) needed no changes — both already exercise a
   role-only-read-only case that is unaffected by widening the gate to
   `isReadOnlyAssignment`.

**Test results.** `node --test test/runner/assignment-dispatch.test.mjs` —
16/16 pass (15 prior + 1 net new; one Fix Round 1 test replaced in place, one
new test added). Full regression battery re-run:
`node --test test/runner/operation-choice.test.mjs test/runner/loop.test.mjs
test/runner/assignment-runresult.test.mjs test/runner/assignment-dispatch.test.mjs
test/e2e/runner-loop.test.mjs test/cli/fgos-stage.test.mjs` — 292/292 pass
(291 prior + 1 net new), 0 fail.

**Status:** done. `judge-ambiguity`/`lock-decisions`/`shape-plan` at their
real default `role: implementer` now correctly resolve `claude-reviewer`
when the config entry exists; mutating ops (`implement-item`,
`fix-verify-red`, `scoped-subtask`) still resolve plain `claude` regardless
of role, proven against a real mutating-evidence run rather than a role
override on an intrinsically read-only operation. No behavior change for a
non-`claude` `preferExecutor` or for an absent `claude-reviewer` config
entry (both untouched legs of the gate). Residual noted in Fix Round 1
(tool-family gate, not per-run path-scoped Write enforcement; settle-time
fail-closed rollback remains the defense-in-depth) is unchanged by this
round.
