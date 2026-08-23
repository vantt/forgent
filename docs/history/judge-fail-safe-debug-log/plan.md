# plan.md — judge fail-safe debug log (tsk-5d2)

## Mode

**small** (few files, no gray areas — every design question is already
locked in CONTEXT.md D1-D3; graph check below confirms no split is
possible).

Flags counted (mode-gate step 2):
- audit/security-adjacent — writing raw nested-executor stdout/stderr to
  disk touches the same "output discipline" concern worker-log.mjs's D1/D4
  already settled (mitigated: same git-ignored `.fgos/logs/` location, no
  new precedent).
- existing covered behavior — judge-executor.mjs/discovery.mjs/decompose.mjs
  already carry test coverage for the fail-safe fold-in that must not
  regress.

2 flags, no hard-gate flag (no auth/data-loss/external-provider/validation
removal) → small, not standard: CONTEXT.md leaves no open design question,
and the change is additive-only (new file + new optional out-param + new
best-effort log-write call sites), never altering any existing return
value.

`fgos graph tsk-5d2 --json`: component size 1 (no deps, isolated) —
confirms single-piece scope, no split, ordering is mechanical.

Impact-analysis posture (per CLAUDE.md gate, already recorded in
CONTEXT.md): **full** (gitnexus present). Not load-bearing here — no proof
point in this plan leans on blast-radius evidence; the file-touch set is
small and enumerated directly below.

## Approach

Reuse the existing `.fgos/logs/` sole-writer convention
(src/runner/worker-log.mjs: `appendWorkerLog`) rather than inventing a new
storage mechanism (D1). Reuse the existing "optional trailing out-param"
convention judge-executor.mjs already established for `scoutCaptureOut`
(D2/D3) rather than inventing a new threading shape.

Rejected alternative: writing the log directly inside
`runBoundedAttempts`/`runJudgeExecutor` using `fgosDir` + a hardcoded
filename keyed only by capacityId. Rejected because the log is meaningful
per work-item (a reader debugging "why did tsk-X's discover take 3.5min and
come back unclear" needs to find `tsk-X`'s own file), and judge-executor.mjs
does not receive `work.id` today — threading `id` into it would widen its
existing capacity-agnostic signature for a caller-specific concern. Cleaner
split: judge-executor.mjs reports (via out-param) which of its own two
distinguishable branches fired and the raw evidence; the caller
(discovery.mjs/decompose.mjs), which already holds `work.id` and `dir`,
performs the actual file write for every branch (its own outer-catch, its
own shape-invalid check, and judge-executor's reported branch).

## Files touched

1. **`src/intake/judge-fail-log.mjs` (new).** One exported function,
   `appendJudgeFailLog(dir, id, entry)`, mirroring
   `worker-log.mjs`'s `appendWorkerLog` shape exactly: resolves
   `.fgos/logs/` via the same `resolveLogsDir`, appends one timestamped,
   readable block to `<id>-judge-fail.log`, `NEVER THROWS` (same
   `try {...} catch { return null; }` discipline, same F-P1-1 rationale —
   this is pure git-ignored observability, never load-bearing). Entry shape:
   `{ reason, ...detail }` where `reason` is one of `outer-exception` /
   `non-parse-exit` / `parse-exhausted` / `shape-invalid`, and `detail`
   varies per reason (see below). Reuses the same truncation discipline
   `judge-executor.mjs`'s `SCOUT_OUTPUT_MAX_CHARS` already sets a precedent
   for, applied to any raw stdout/stderr field, so one runaway attempt can
   never blow up the log file.

2. **`src/intake/judge-executor.mjs`.** `runBoundedAttempts` gains an
   optional trailing `failDetailOut` param (same mutable-object convention
   as `scoutCapture`/`capacityId`/`fgosDir`): when a non-parse-exit occurs
   (`result.error` or `result.status !== 0`), before returning `null`,
   stash `{ reason: 'non-parse-exit', attempt, status, signal, error:
   result.error?.message, stderr: result.stderr }` onto it and stop (this
   already returns immediately per existing behavior — no attempt loop
   change). When every attempt instead parse-fails, stash `{ reason:
   'parse-exhausted', attempts: [{attempt, stdout}, ...] }` (one entry per
   attempt, each `stdout` truncated) before the loop falls through to
   `return null`. `runRetryingExecutor` and `runJudgeExecutor` thread this
   new param straight through exactly like `scoutCapture` already does.
   `runJudgeExecutor` gains one more optional trailing param, `id` (needed
   for the caller-owned write — see below), OR (preferred, simpler) the
   caller performs the write itself using its own `work.id` +
   `failDetailOut`, and `runJudgeExecutor` only returns/exposes
   `failDetailOut` back to the caller the same way `scoutCaptureOut`
   already is exposed. This choice (caller writes, executor only reports)
   avoids adding `id` to `runJudgeExecutor`'s signature at all — resolved at
   implementation time, not a product decision; pinned as an assumption
   below.
   Byte-identical for every existing caller that omits the new param
   (same guarantee this file's own doc comments already give every other
   optional trailing param).

3. **`src/intake/discovery.mjs` (`judgeDiscovery`).**
   - Outer `catch {}` → `catch (err) {}`: binds the exception so its
     `message`/`stack` can be logged (`reason: 'outer-exception'`) via
     `appendJudgeFailLog(fgosDir, work?.id, {...})` before returning the
     unchanged `{clear: false, question: DEFAULT_UNCLEAR_QUESTION}`.
     Best-effort: this call itself must never throw or change the return
     value (matches `appendJudgeFailLog`'s own never-throws contract, plus
     the call site does not await/rely on its result).
   - The `!verdict || typeof verdict.clear !== 'boolean'` branch: when
     `verdict` is `null`, read `failDetailOut.reason`
     (`non-parse-exit`/`parse-exhausted`) and its detail, log it, then
     return the unchanged fallback. When `verdict` is a non-null object but
     `clear` isn't boolean, log `reason: 'shape-invalid'` with the
     stringified `verdict` object, then return the unchanged fallback.
   - No other line in this function changes; the two success-path returns
     (clear/unclear with `impactScore`/`researchToolCallCount`/proposals)
     are untouched.

4. **`src/intake/plan.mjs` (`judgeDecompose`).** Same treatment,
   scoped to the ONE entry-level fail-safe check this item's D2 actually
   covers — the shared `!verdict || typeof verdict.verdict !== 'string'`
   check (line 243, structurally identical to discovery.mjs's check) and
   the outer `catch {}` (line 312). `judgeDecompose`'s own deeper
   content-validation branches (missing top-level `reason` at line
   291-293, an invalid child at line 296-298, an unrecognized
   `verdict.verdict` string at line 309-311) are a different concern — the
   model DID return parseable, shaped JSON there; it just returned content
   this function's own domain rules reject. Those are pinned as an
   out-of-scope assumption below, not silently folded in.

## Assumptions (pinned, not asked — implementation-level, per
`fgos-coding-planning`'s own material/grounded/answerable filter)

- `runJudgeExecutor`'s own signature grows by exactly one optional trailing
  out-param (`failDetailOut`); the actual mechanics of whether it also
  needs `id` threaded in, or the caller writes using its own already-held
  `work.id`, is an implementation choice for `fgos-coding-implement`, not a locked
  product decision — CONTEXT.md's D1-D3 already fix the observable
  contract (location, scope, per-branch tagging), not this internal
  threading detail.
- `judgeDecompose`'s deeper content-validation `{kind: 'invalid'}` branches
  (missing reason / invalid child / unrecognized verdict string) are OUT
  OF SCOPE for this item — D2 only extends the debug log to the SAME
  shared fail-safe code path `judgeDiscovery` has (the entry-level
  null/wrong-shape check), not every downstream validation branch
  `judgeDecompose` happens to also return `{kind:'invalid'}` from. Revisit
  as a separate item if this turns out to matter in practice.
- **Correction (fgos-coding-validating reality-gate FAIL, proof surface):** the
  model's own proposed `verify` from the real `discover` call
  (`npm test -- --grep 'judgeDiscovery.*fail-safe'`) is not runnable —
  this repo's `package.json` test script is `node --test
  'test/**/*.test.mjs'` (Node's built-in test runner), which has no
  `--grep` flag (confirmed: `node --test --help` lists
  `--test-name-pattern`, not `--grep`). Real verify for this item:
  `node --test test/intake/judge-executor.test.mjs test/intake/discovery.test.mjs test/intake/plan.test.mjs`
  — the three existing files that already cover
  `judgeDiscovery`/`judgeDecompose`/`judge-executor.mjs`
  (`test/intake/judge-executor.test.mjs`, `test/intake/discovery.test.mjs`,
  confirmed to exist; `test/intake/plan.test.mjs` is this same
  cluster's third file for `judgeDecompose`), plus the new fail-safe-branch
  tests this item adds to them. `fgos edit tsk-5d2 --verify "..."` applies
  this before `fgos-coding-implement` runs.

## Proof points (carried to `fgos-coding-validating`)

1. **New writer never throws / matches existing convention.** Read
   `worker-log.mjs` and `judge-fail-log.mjs` side by side — same
   `resolveLogsDir`, same `try{...}catch{return null}` shape, same
   git-ignored `.fgos/logs/` target.
2. **Existing fail-safe contract is unchanged for every existing test.**
   Full existing `judgeDiscovery`/`judgeDecompose`/`judge-executor` test
   files still pass unmodified — the return value for every branch (clear,
   unclear, invalid, pass-through, need-human, decompose) is byte-identical
   to before this change for every caller that doesn't inspect
   `.fgos/logs/`.
3. **Each of the 4 branches produces a correctly-tagged log entry.** New
   tests stub the executor (via whatever seam the existing test suite
   already uses to fake `spawnSync`/the nested `claude -p` call) to force,
   in turn: (a) a thrown exception inside `judgeDiscovery`'s try body, (b) a
   non-zero exit / spawn error on the first attempt, (c) prose/non-JSON
   stdout on all 3 attempts, (d) a parsed object missing/mistyping `clear`.
   Each assert: the returned verdict to the caller is exactly the existing
   generic fallback (unchanged), AND `.fgos/logs/<id>-judge-fail.log`
   contains one entry tagged with the correct `reason:`.
4. **`npm test` green in full**, not just the new/touched files.
