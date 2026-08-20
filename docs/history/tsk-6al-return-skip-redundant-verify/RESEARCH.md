# RESEARCH.md — tsk-6al: return re-runs verify even when a worker already proved it

## Round 1 (2026-08-20) — does `return` already have a skip-if-already-verified check?

**Asked:** Does `fgos return`'s branch-source code path (`bin/fgos.mjs` case
`'return'`, the tmpWorktree detached-checkout branch) have any existing
check that skips re-running `runGoalCheck` when the branch's HEAD is
already known to have been verified green — analogous to
`src/runner/merge.mjs`'s `branchHeadAtReturn`-based skip (merge.mjs:963,
1235, 1257), which skips verify at approve-time when "the merged tree is
identical to `<branchHeadAtReturn>`, already verified green at return"?

**Checked (repo search, `rg`):**
- `rg -n "runGoalCheck\(item" bin/fgos.mjs` → exactly two call sites:
  `bin/fgos.mjs:3132` (branch-source path, inside the disposable detached
  `tmpWorktree`) and `bin/fgos.mjs:3279` (main-source path, on `cwd`
  directly).
- Read `bin/fgos.mjs:3030-3290` (the full `case 'return'` block) directly.
  No conditional anywhere in this range tests the branch tip (or main
  HEAD) against any previously-recorded "already verified at this sha"
  value before calling `runGoalCheck`. The only guards present before the
  verify calls are: `status !== 'doing'`, `claimRole` check, placeholder
  `hasRealVerify` check, `branchAheadCount <= 0` progress check (branch
  path) / `aheadCount <= 0` + clean-tree check (main path). None of these
  compare against a prior verify outcome.
- `awk 'NR==3030,NR==3300' bin/fgos.mjs | rg -n "skip|already verified|identical"`
  → only one hit, an unrelated comment ("stays byte-identical") — no skip
  logic present.
- Contrast, confirmed for the record: `src/runner/merge.mjs:984-991` reads
  `item.branchHeadAtReturn`, compares it to the branch's current tip via
  `git rev-parse`, and — only if they match — skips re-running verify at
  approve time (`merge.mjs:1257`'s output string literally says "verify
  skipped: the merged tree is identical to `<branchHeadAtReturn>`, already
  verified green at return"). This value (`branchHeadAtReturn`) is written
  by `return` itself, *after* return's own verify passes
  (`bin/fgos.mjs:3161`, `moveWork(dir, { ..., branchHeadAtReturn: branchHead })`)
  — i.e. the skip merge.mjs already has is only possible because `return`
  already ran verify once and stamped the sha it passed on. `return` has
  no equivalent upstream stamp to consult, because nothing writes a
  "verified sha" onto the item *before* return is ever called — the
  out-of-process worker's own pre-return verify run (required by
  `coding-worker-contract.md` Layer 2 rule 2) currently leaves no trace on
  the item at all.

**Found:** Confirmed, not refuted. `return` unconditionally re-runs
`runGoalCheck` on both its branch-source and main-source paths — no skip
check exists today. The mechanism merge.mjs already proves out
(compare-tip-to-recorded-sha, skip if identical) has no return-side
equivalent, and structurally *cannot* be copied verbatim: merge.mjs's
version works because the value it compares against (`branchHeadAtReturn`)
is written by a return that already happened. For `return` to skip its own
first verify, some *other* write path must stamp "this sha was verified
green, by X, at time T" onto the item before `return` runs — today nothing
does that. See Round 2 for whether `dispatch.mjs execute` (the mechanism
that runs the out-of-process worker) already captures any such signal.

**Still open:** whether `dispatch.mjs execute` (or the worker's `[DONE]`
report it parses) captures the worker's own verified commit sha anywhere
readable before `return` runs — Round 2.

## Round 2 (2026-08-20) — does the out-of-process dispatch chain capture/thread a verified sha?

**Asked:** Does `dispatch.mjs execute` (`src/runner/dispatch/cli.mjs`) or
the `pick -> execute -> return` chain that actually drives an
out-of-process worker (`fanoutBatchExecutorCli`) capture the worker's own
committed/verified sha anywhere, and pass it through to the `fgos return`
call that follows?

**Checked (repo search, `rg`, then direct read):**
- `rg -n "hasSignal|headBefore|headAfter|outcome:" src/runner/dispatch/cli.mjs`
  → `cli.mjs:518` `headBefore = captureHeadSha(cwd)` (before the adapter
  runs), `cli.mjs:520` `headAfter = captureHeadSha(cwd)` (after), `cli.mjs:522`
  `hasSignal = stdoutStr.includes('[DONE]') || stdoutStr.includes('[BLOCKED]')`,
  `cli.mjs:526` `...(hasSignal ? {} : { outcome: 'unsignaled', headBefore, headAfter })`.
  Read directly: `headBefore`/`headAfter` ARE computed unconditionally on
  every `execute` call, but are only SPREAD into the returned result object
  when `hasSignal` is **false** (i.e. the worker did NOT emit `[DONE]`/
  `[BLOCKED]`). In the success case this item cares about — the worker DID
  emit `[DONE]` — `hasSignal` is true, so `headAfter` (the sha the worker's
  own pre-`[DONE]` verify run, per `coding-worker-contract.md` Layer 2 rule
  2, would have passed on) is silently dropped from `executeExecutorCli`'s
  return value. The `base` object in the `hasSignal: true` case carries only
  `{ mechanism, ...result, provider, command }` — `result` here is the raw
  adapter output (stdout/stderr/status/signal), no sha field.
- Read `fanoutBatchExecutorCli` (`cli.mjs:709-821`), the one caller that
  actually chains `pick -> executeExecutorCli -> return` for an
  out-of-process worker (used by `fgos-fanout`): `cli.mjs:777-796` calls
  `executeExecutorCli` and stores its result as `execRes`; `cli.mjs:798-802`
  immediately calls `fgos return <id>` via a bare `execFileSync` with no
  flag, env var, or file passing anything from `execRes` through — confirmed
  by reading the full `execFileSync` args array (`[BIN_FGOS_PATH, 'return',
  candidateId, '--dir', root]`, plus `{ cwd, encoding, stdio }`, nothing
  else). `execRes` is only read afterward, at `cli.mjs:804-809`, to build the
  `fired` summary (`status`/`signal`/`errorClass` — no sha there either).
- `bin/fgos.mjs`'s `case 'return'` (confirmed in Round 1) takes no flag or
  env input that could carry a pre-verified sha even if one were threaded to
  it — its only inputs are `id`, `--timeout`/`--no-timeout`, and
  `--no-new-commits-ok`.

**Found:** Confirmed, not refuted. No signal survives from the worker's own
pre-`[DONE]` verify run to `return`. Three independent gaps compound:
(1) `executeExecutorCli` computes `headAfter` but drops it from the result
whenever the worker actually signals `[DONE]` (the one case where a real
verified sha would exist); (2) even if it were kept, `fanoutBatchExecutorCli`
does not thread it into the subsequent `return` call; (3) `return` itself
has no parameter that could accept it. A fix needs all three points closed
together — capturing a value that then has nowhere to go, or accepting a
value nothing ever sends, would each be a no-op alone.

**No further branches to research** — both halves of the original question
(does `return` skip today; does the dispatch chain already carry a
verified-sha signal) are now grounded in direct file:line evidence, not
plausibility. Fix shape is now an implementation/planning decision, not a
research gap: `fgos-coding-planning` should read this file before writing
`plan.md`.

## Round 3 (2026-08-20) — reality-gate finding: `fanoutBatchExecutorCli` is not the item's own confirmed-live caller

**Found during `fgos-coding-validating`'s Repo-fit check on the first
`plan.md` draft**, which wired the fix only into `fanoutBatchExecutorCli`
(`src/runner/dispatch/cli.mjs:709-821`, the `fgos-fanout` batch caller).
That draft's own citation for "the only caller that chains `pick ->
executeExecutorCli -> return` for an out-of-process worker" turned out to
be wrong — checked directly:

- `.agents/skills/fgos-coding-implement/SKILL.md` Step 2 (Implement) +
  `references/implement-and-collaboration.md:19-22`: the single-item
  DRIVER session itself (not a code function) calls `node
  src/runner/dispatch.mjs execute <executorId> --prompt "..."
  --has-live-task-access` directly when the mechanism is `out-of-process`,
  then reads `result.stdout` as the work product and confirms the
  worker's own commit via `git log -1`.
- `.agents/skills/fgos-coding-implement/SKILL.md` Step 5 (Return) +
  `references/return-mechanics.md:12`: the SAME driver session, as an
  independent LATER step, calls bare `fgos return <id>` — no flag, no
  data threaded from the `execute` call's result at all.
- These are two separate skill-prose-driven steps in the same session,
  never a single code function — `fanoutBatchExecutorCli` is a distinct,
  different caller (used only by `fgos-fanout`'s concurrent multi-child
  batch dispatch), not this single-item flow.
- The item's own description says "Confirmed live 2026-08-20 driving
  tsk-1uf" — a single-item drive, i.e. exactly the `fgos-coding-implement`
  driver flow above, not a fanout batch run.

**Found:** Confirmed, not refuted — a real gap in the first plan draft.
Closing this requires a FOURTH touch point beyond the original three: the
skill-prose in `fgos-coding-implement/references/implement-and-
collaboration.md` (out-of-process branch) and `references/return-
mechanics.md` (Step 5) must instruct the driver session itself to read
`verifiedSha` from the `execute` CLI's JSON stdout and pass it to its own
subsequent `fgos return <id>` call as the same flag `bin/fgos.mjs` accepts
(design already caller-agnostic, so no change needed to the flag's own
shape — only to which callers actually pass it). `fanoutBatchExecutorCli`
threading stays in scope too — it is a second real, still-relevant caller
of the same flag — but it is not, on its own, the item's own confirmed-live
reproduction path. See `plan.md`'s revised Approach.
