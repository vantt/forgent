# Runtime-Recovery Track — Dispatch/Process Incidents Log

Running log of infrastructure/process problems hit while driving this track via
`fgos-plan-loop`, kept separate from each cell's own code findings. Compiled
into the final closeout report at P08. Updated live as issues occur.

## 1. Cross-worktree `.fgos/` evidence access (P00)

Dispatching a fixer/reviewer into an isolated git worktree, then pointing it at
raw `.fgos/assignments/...` filesystem paths for evidence, fails: `.fgos/` only
exists in the main checkout, not in a linked worktree. Fix: use `contextRefs`
(plain assignment ids) to hand prior findings into a dispatch, never raw
`.fgos/` paths.

## 2. Untracked plan/contract directory (P00, found before P01)

The entire `plans/260911-2305-runtime-recovery/` directory was untracked in
git when this track started driving cells. `git worktree add` only checks out
committed content, so every cell dispatched into an isolated worktree could
not see its own contract files until this was committed (`b88b5097`).

## 3. Stale unconsumed `authorize` wins over a newer one (P00, recurred later)

`resolveBindingAuthorization` picks the FIRST unconsumed `authorize` record for
a given `(nodeId, operationId, targetActorId)` triple, in event order — not the
most recent. If an early fix-round attempt crashes after authorizing but before
its paired operation dispatches, minting a NEW `authorizationId` for a retry of
the same position does not help: the old one is still selected first, with
whatever (possibly empty) grants it had. Safest fix: give the retried operation
no `contextRefs` dependency at all (inline evidence as objective text) rather
than fight authorization ordering.

## 4. `grantedContextRefs`/`contextRefs` cannot cross coordination sessions (P02L, P02H)

`authorizeDeclaredOperation` refuses a ref that resolves to an Assignment not
owned by the current `coordinationId`. A continuation session (opened after an
earlier session exhausted its wall-time budget) cannot reference the earlier
session's assignment ids as `contextRefs` — findings must be inlined as
objective text instead.

## 5. A session can only auto-close to `status: completed` under specific conditions

Observed both ways: P00/P01/P04's sessions never reached `status: completed`
after using a `fixer` role across multiple messy attempt histories (mixing
failed and successful attempts); P02L-b/P02L-c/P02H's continuation sessions DID
auto-close cleanly when every required actor's slot had exactly one clean
recorded completion. Declaring `partialPolicy` at session-open to force a close
is not a safe workaround — it triggers a separately-documented kernel bug
(BL1: auto-close to a terminal status the instant the first required pass
finishes, before any fix round can be authorized). Once a session reports
`completed`, no further step can be dispatched into it (refused: "session is
not active") — treat that as the cell's own closure record, do not try to force
an explicit close disposition into an already-completed session.

## 6. `aggregateBounds.wallTimeMs` and per-executor absolute-ceiling timeouts are two separate, unextendable bounds

- `aggregateBounds` (wall-time, max-rounds, etc.) is fixed at session-open and
  cannot be changed on a resume. P01 and P02L both exhausted their session's
  wall-time budget mid-cell; the fix each time was to open a continuation
  session against the same worktree/branch.
- Separately, `.fgos/config.json`'s global `timeoutMs` (35 minutes) is a
  per-executor absolute ceiling, not overridable per coordination request. A
  recheck broad enough to need a full suite sweep plus several live repro
  scripts on a large cell can hit this even when the session's own wall-time
  budget is far from exhausted (hit once on P02L). Fix: split into a narrower,
  explicitly time-boxed task naming the 1-2 checks that matter most, rather
  than repeating the same broad ask.

## 7. A self-reported "N/N tests, PASS" claim is unreliable and must never be trusted without independent verification

Recurring across nearly every cell in this track: a doer's own `agent-result.json`
claiming a specific green test count, or a fixer's "done" status, has been
wrong often enough that the Lead independently re-running `node --check` and
the real focused test suite after every fix round became mandatory practice,
not optional. Sharpest example: P02L's very first implementation claimed
"18/18 acceptance, 484/484 tests, PASS" on the first attempt; independent
review and red-team immediately falsified this with 4 CRITICAL findings
(stripped worker env, false-success on supervisor death, unreachable required
confinement, forgeable receipts).

## 8. Same class of "dead code" / unreachable-wiring bug recurred in 3 separate cells

P02L (`reconcileCliSpawnRun` had zero production callers), P02H (Authority
never threaded `runId` to the herdr adapter, so `isAssignmentRun` was always
false in production — found TWICE, the second time due to a wrong field path
`compiledPlan.policy.adapter` instead of the real `compiledPlan.invocation.adapter`).
Root cause pattern: a cell's own new tests exercised the new logic by calling
it directly (e.g. `runHerdrRound`), never through the real production
dispatch door (`executeAssignment`) — a gap that let the wiring bug ship
undetected until an adversarial reviewer/red-team round specifically tried the
real production call path. Fix applied going forward: cells now include an
explicit instruction to add a test that dispatches through the REAL production
door, not just the new module directly.

## 9. A doer's own architectural hypothesis can be wrong even when carefully reasoned — must be tested live, not assumed

The Lead's own suggested Herdr "worker-command seam" (`pane run` +
`report-agent`/`report-agent-session`), based on reading `herdr --help` output
alone, was falsified in the very first P02H review round: `herdr pane run` is
shell-text injection (confirmed via `herdr api schema --json`, which has no
`pane.run` request type), not an exec-argv primitive — a prepared `bwrap`
command typed this way gets re-parsed by the pane's shell, losing exact-argv
fidelity. The correct response was the contract's own explicit fallback:
required/preferred confinement fails closed. Lesson: even a well-reasoned
architectural guess from documentation alone needs live verification before a
doer builds on it.

## 10. Repeated OOM kills from unrelated concurrent load on the shared machine

The dispatch machine had ~10-11 unrelated long-running `claude`/`agy`/`codex`
sessions active throughout this track (pre-dating it, outside this session's
control). This caused repeated `killed` background-task outcomes:
- 3 consecutive OOM kills on one P02L fix-round dispatch.
- 5 consecutive OOM kills on one P02H fix-round dispatch (switching the fixer
  role from `agy-herdr` to headless `claude` did not resolve it — the pressure
  was system-wide, not specific to the herdr pane's own footprint).
Each kill left an orphaned `dispatch.claim` file (an exclusive-create lock the
killed process never released) and, when the killed step had already reached
herdr-spawn, an orphaned pane still shown as `working` in `herdr agent list`
indefinitely. Recovery recipe used every time: `herdr pane close <id>` for any
orphaned pane belonging to this track's own worktree, then
`rm -f .fgos/assignments/<id>/dispatch.claim` for the stuck assignment, then
retry the identical dispatch. The coordination engine's own claim-file design
is a deliberate fail-closed safety choice ("a crashed in-flight dispatch still
needs manual reconciliation, not silent auto-retry") — the recovery step is a
manual reconciliation performed each time, not a bypass of that safety
property.

## 11. Manual `nohup ... &` backgrounding does not survive the Bash tool call boundary

One dispatch was started with a hand-rolled `nohup node ... &` instead of the
harness's own `run_in_background` mechanism (early in the track, before this
was corrected). It was killed when the originating tool call ended, leaving an
assignment claimed-but-orphaned with a consumed authorization and no result.
Every dispatch after that point used `run_in_background: true` and survived
multi-hour real dispatches without this problem.

## 12. Headless `claude` executor's real Bash allowlist is easy to misjudge, and the resulting failure mode looks identical to "couldn't commit"

The default `claude` executor config restricts a mutating dispatch's Bash tool
to exactly `git add`/`git commit` — nothing else, not even `git status` or
`node --test`. A doer that first hits a refusal on some OTHER Bash command
(e.g. `find`, `git status`) has, on multiple occasions across this track,
concluded the ENTIRE Bash surface including `git add`/`git commit` must also be
blocked, and reported `blocked`/gave up without ever attempting the commit that
would have worked. This recurred at least 3 times (P04's first fix round, P01's
first fix round, P03's first produce round) before the fix (an explicit,
repeated reminder in every headless-`claude` dispatch's objective: "Bash only
works for git add/git commit, nothing else — do NOT give up on committing
because other Bash calls are refused") became standard practice for every
mutating dispatch on this executor.

## 13. `agent-result.json` schema requires status-specific extra fields not obvious from the base spec

A `status: "blocked"` claim requires a non-empty `blocker` field (and
`status: "failed"` requires `error`); the base "status must be one of
done|blocked|failed|no-evidence, summary is required" prompt text a dispatched
executor sees does not mention this. At least 2 dispatches across this track
produced a schema-invalid claim (missing the status-specific required field),
which `assignment-runner.mjs`'s own claim validator classifies as `failed`
regardless of the executor's real intent, even when the executor did real,
salvageable work and described a genuine blocker in its own `summary` text.

## 14. `git branch -f <integration-branch> main` after every cell's docs commit silently discarded the integration branch's own merge history (CRITICAL, own mistake)

Found before opening P03. The Lead's own recurring pattern — merge a closed
cell into the `runtime-recovery` integration branch, switch to `main`, write
that cell's trace doc + `plan.md` row, commit to `main`, then run
`git branch -f runtime-recovery main` to "keep them in sync" — silently
discarded `runtime-recovery`'s own `--no-ff` merge commit every single time,
because `main` never itself carried the merged cell code; only
`runtime-recovery` did, and force-moving its pointer to `main`'s (code-less)
docs-only tip discarded that association each time (confirmed via
`git reflog show runtime-recovery`). Each cell's own now-deleted branch had
already forked from a correct point before the corresponding reset hit, so
three of the four affected cells' code (P01, P02L, P02H) survived by accident
via later 3-way merges pulling it back in through those still-intact branch
tips; P04's code did not (it was orphaned before P01 ever merged on top of it)
and required an explicit second recovery merge from its own preserved commit
object (`6bb50205`). Recovered in full (`2252e46b`, `4fe997ff`); all affected
suites re-verified green post-recovery (140+19+55+79+72 tests, 0 fail).
**User-confirmed resolution:** rather than revert-and-re-separate, the
recovered code stays on `main`, and the `runtime-recovery` integration branch
is retired — every cell from P03 onward merges directly into `main`. This
is exactly the kind of destructive-git-operation risk the standing safety
rules call for pausing on; the actual force-push/reset happened without that
pause being triggered because each individual `branch -f` looked like routine
branch-pointer housekeeping, not a destructive operation, until the cumulative
effect was traced through the reflog.

## 15. Per-cwd dispatch lock held by a `node bin/fgos.mjs coordination run` process the Lead wrongly believed had already finished (P03, root cause of two wasted retries)

The very first P03 dispatch (background task `b9srwevkr`, launched hours
earlier) never actually exited: the Lead checked `ps aux | grep "coordination
run"` mid-session, found no visible match (the shell wrapper's own multi-KB
`eval` line pushed the real process line out of a truncated view), wrongly
concluded the process had ended, closed its now-orphaned herdr reviewer pane,
and moved on to a fresh continuation session for the same cell. The original
process, still alive, kept holding `cli.mjs`'s own per-cwd dispatch lock
(`.fgos/dispatch--<url-encoded-cwd>.lock` — separate from the per-assignment
`dispatch.claim` file) for the worktree the whole time. Two subsequent
review+red-team retries against that same worktree both failed immediately
with `"dispatch for cwd ... is already in flight"`, because the real holder
was still running, not because of any code or scheduling issue. Only killing
the actual PID (found via a full, untruncated `ps aux` and matching the exact
command line) and removing the stale lock file resolved it — the background
task's own `failed`/`completed` notification only arrived once the process was
explicitly killed. Lesson: when a background task's process can't be found in
a quick `ps aux | grep`, verify with the full untruncated output (or `pgrep
-af`) before concluding it has exited — a long wrapper line can hide the real
process in a truncated grep view.

## 16. Re-dispatching a failed step with the SAME `taskKey` replays the cached failure instead of retrying (P03)

`createAndExecuteSessionTask` checks for an already-`result-linked` outcome for
the assignment before doing any real work, and returns it as-is — this applies
even when that prior outcome is itself `failed`. Re-submitting an identical
request (same `taskKey`) after fixing the actual blocker (in this case, the
real cwd-lock holder) just replayed the stale `"already in flight"` failure
from the first attempt, byte-for-byte including its original elapsed-time
figure, rather than re-executing. Fix: a genuine retry of a failed step needs a
NEW `taskKey` (and, since it is a different position invocation, this is
distinct from the `authorize`+driver-authorized-operation retry pattern used
for revise/recheck rounds — a first-pass `operation` step has no `authorize`
step of its own, so the only way to force re-execution is a fresh `taskKey`).

## 17. Long real-time gaps between dispatch completion and the Lead noticing (this session)

At least one dispatch (P03's original produce attempt) sat completed-but-unread
for roughly 12 hours of real elapsed time before being checked, during which an
already-orphaned reviewer pane (dispatched against a failed produce step, no
parent process left to manage it) sat indefinitely in `working` state. Not
itself a data-loss risk (the underlying files were intact), but a reminder that
a completed/failed background dispatch should be checked and reconciled
promptly rather than left to accumulate.

## 18. Reviewer/red-team returning `status: "done"` with real HIGH/MEDIUM findings still gets classified `failed` in quorum (P05)

Both P05's reviewer and red-team completed real, substantive work — full
repro-backed findings with file:line evidence, not a claim-validity or
schema-shape problem — and each explicitly wrote "NOT a clean PASS" in their
own summary. The coordination engine still recorded both as `status: "failed"`
in the session quorum (not `done`/`verified`), because a reviewer/red-team
operation's pass/fail classification is driven by whether it reports a clean
PASS, not by whether the agent executed successfully. This is correct
behavior, not a bug — worth recording only because it looks, from the
`coordination show` quorum view alone, indistinguishable from an actual
execution failure (crash, claim-invalid, timeout) until the underlying
`agent-result.json` is read. Lesson: always read the actual `agent-result.json`
before assuming a `failed` quorum entry means the dispatch itself broke.

## 19. Doer hit the account's own Claude usage/session limit mid-produce, leaving real uncommitted work behind (P05S)

P05S's doer (headless `claude`, produce-candidate) wrote all 7 leased files
(2 new, 5 modified, ~900 lines total) into the worktree exactly matching the
cell's contract, then hit the account's own session/usage limit
("You've hit your session limit · resets 2:10pm") before running its final
`git add`+`git commit` — so `exit.json` shows `exitCode: 1`, no
`agent-result.json` was ever written, and `gitBefore === gitAfter` in
`result.json` (no commit landed) even though the working tree was genuinely,
substantially dirty. The downstream reviewer then ran for the full 35-minute
wall-time ceiling with nothing to review (HEAD had no diff from the produce
step's own dispatch base) and timed out, leaving an orphaned idle herdr pane;
red-team was dispatched after it regardless (the coordination protocol does
not check the reviewer's own outcome before firing red-team in this pattern).
Lesson: an `exitCode`-based failure with no `agent-result.json` and no commit,
but a genuinely dirty worktree, should be diagnosed by reading the raw
`protected/capture/*/stdout.log` (not just `agent-result.json`, which won't
exist) before assuming the implementation itself is bad — real, substantial,
on-contract work can survive an account-limit interruption and be worth
building on (verify + finish + commit) rather than re-implementing from
scratch with a fresh taskKey.

## 20. Reviewer's real PASS-with-findings report refused as a whole-round false positive due to UNRELATED concurrent dirt in the shared main checkout (P05S)

P05S's reviewer (herdr-spawn) was correctly confined to and did all its real
work in its assigned worktree (`../runtime-recovery-p05s`) — its own
`agent-result.json` shows a genuine, substantive review (16/16 + 759/760 +
720/721 real test runs, 1 MEDIUM + 5 LOW findings, no HIGH). The dispatch
infrastructure still recorded the whole round as `exitCode: 1`/quorum
`failed`, with `stderr.log` reporting: "executor ... reported success but
wrote outside its workspace... these paths became dirty in
/home/vantt/projects/forgentX during the round: docs/platform/
packaging-distribution/code-panel-rollout-plan.md" and two sibling files.
Checked directly: those 3 files were genuinely dirty in the MAIN checkout,
but confirmed unrelated to this reviewer's own work — they belong to a
completely different, concurrently-running herdr pane/session on the same
machine ("Execute code-panel rollout plan", independently observed as
`working` at the same wall-clock time) editing the exact same docs. The
safety check that refuses a round when unexpected paths go dirty cannot
currently distinguish "this round's own agent leaked outside its assigned
worktree" from "some unrelated concurrent session on the same shared machine
happened to dirty the main checkout while this round was running" — both
present identically as "paths dirty outside the assigned workspace" from the
refusing round's point of view. Lesson: before discarding a `failed`-quorum
round as a real execution failure, check whether the round's OWN
`agent-result.json` (if one exists, as here) shows genuine substantive work —
and if the stderr reason is "wrote outside its workspace", independently
verify (`git status`/`git log -1 -- <path>`) whether the flagged dirty paths
are plausibly this round's own leak versus unrelated concurrent activity on
a shared machine, before either accepting or discarding the round's content.
