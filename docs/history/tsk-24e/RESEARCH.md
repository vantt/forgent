# tsk-24e — events.jsonl concurrent data-loss, post-fix gap — RESEARCH

## Round 1 (2026-08-20)

**Asked:** tsk-24e's own description + 3 decisions report fresh, live
(2026-08-20) data loss on `.fgos/events.jsonl` for tsk-6al, tsk-4oq,
tsk-5dnt, tsk-1el under real concurrent multi-session load on the shared
main checkout. Three related fixes are already merged and confirmed
present on disk in this checkout:

- **tsk-1q5** (root cause A — `refreshView` ran outside `withEventsLock`,
  a lost-update race at the derived `state.json` cache layer): confirmed
  fixed. `grep -n "withEventsLock\|refreshView" src/state/store.mjs`
  shows every mutation call site (`addWork`, `editWork`, `moveWork`,
  `moveStage`, `addDiscovery`, `addDecision`, ...) now goes through
  `withEventsLockAndRefresh` (`store.mjs:148-152`), which folds
  `refreshView(dir)` INSIDE the same lock scope as the append — the header
  comment at `store.mjs:137-146` names this exact fix and cites tsk-1q5.
- **tsk-3wq** (git-tracked `events.jsonl` losing raw log lines under
  concurrent branch merges): confirmed fixed for the MERGE vector.
  `.gitattributes` (repo root) has `.fgos/events.jsonl merge=union` with a
  header comment citing tsk-3wq and `docs/history/live-events-seq-
  corruption/CONTEXT.md` (tsk-n4i). `scripts/events-jsonl-contiguity.mjs`
  exists on disk; `src/setup/registrations.mjs:1177/1183` registers the
  `events-jsonl-contiguous` `fgos doctor` check/fix pair.
- **tsk-2tm** (`main-checkout-lock.mjs` torn-read/TOCTOU on the lock FILE
  itself, causing false AMBIGUOUS claim outcomes): scoped explicitly to
  `tryAcquireOnce`'s two-step create/refresh (per
  `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` D1) — a
  different failure mode (false negative on CLAIMING) from tsk-24e's own
  (real appended data disappearing).

**Question 1 — is there code-level protection (not just skill-prose
convention) against a concurrent session's raw `git checkout`/`git reset
--hard` on the shared main checkout discarding another session's
uncommitted `.fgos/events.jsonl` local modifications, given the `union`
merge driver only fires on merge-class git operations (merge/rebase/
cherry-pick), never on a plain checkout/reset?**

Checked (repo search, no code found doing this):
- `grep -rln "\.fgos" src/runner/*.mjs | xargs grep -l "git.*commit"` →
  only `claim-port.mjs`, `main-checkout-lock.mjs`, `merge.mjs`,
  `paths.mjs`, `worktree.mjs` reference `.fgos` near the word "commit" at
  all, and reading each: none of them ever runs `git commit` on
  `.fgos/events.jsonl` — the word "commit" in `claim-port.mjs` (lines
  140/162/186/238/368/380) refers to `moveWork` durably recording a state
  EVENT, never a real `git commit`. There is no periodic/automatic `git
  commit` of `.fgos/events.jsonl` anywhere in `src/`. Confirmed by this
  session's own `git status` showing `.fgos/events.jsonl` as `M`
  (uncommitted) both at conversation start and now — consistent with the
  file sitting uncommitted for extended stretches under real usage. Actual
  commits of it are session/human-driven (e.g. the repo's own recent
  `chore(.fgos): checkpoint events.jsonl after tsk-ut6 pipeline` pattern in
  `git log`), not automated.
- The `.githooks/pre-commit` hook (referenced by `claim-port.mjs:96-103`'s
  own comment) only fires ON a real `git commit` someone already chose to
  run — it writes a main-checkout-lock signal, it does not prevent or
  guard a `checkout`/`reset` from discarding uncommitted content.
- `AGENTS.md`-derived skill prose (`plugins/fgOS/skills/pick/SKILL.md`
  step 4: "Never bypass this step with a raw `git checkout <fgw/branch>`
  on the main checkout", "Never run a raw `git reset --hard` on the main
  checkout without a full `git status` first ... Use `fgos main-checkout-
  reset --sha <sha> [--confirm]` instead") is the ONLY protection found —
  a convention an agent must remember and follow, not a code-level guard.
  `fgos main-checkout-reset` itself (mentioned as the safe alternative) is
  a real command but nothing forces its use over a raw `git reset --hard`.

**Nuance found while checking:** an ordinary `git checkout <branch>`
already refuses by itself when it would silently discard uncommitted
tracked changes ("local changes would be overwritten by checkout") — this
is git's own default safety, not this repo's code. The genuinely
unprotected operations are the FORCE variants — `git reset --hard`, `git
checkout -f`, `git clean -fd`, or a `git merge`/`git pull` a session runs
by hand outside `fgos merge`'s own already-guarded path (which aborts
outright the moment any `.fgos/` path is staged, per
`docs/history/events-jsonl-merge-driver-recurring-write-loss/plan.md`
Revision 2, `src/runner/merge.mjs:877-891`) — exactly the operations
AGENTS.md's own prose already names as dangerous, and exactly what tsk-1q5's
plan.md left as an unresolved "Outstanding question" (root cause B: no
test-provable fix, spun toward "a concrete hardening step... or a
follow-up item" — never actually built; tsk-3wq's real scope turned out to
be the merge-driver + `repairTruncatedLastLine` lock fix + doctor check,
none of which touch a raw force-checkout/reset vector).

**Answer: no code-level guard exists for the force-checkout/reset vector.
Only skill-prose convention.**

**Question 2 — does `main-checkout-lock.mjs` interact with/protect
`events.jsonl`'s own `withEventsLock`, such that a stale main-checkout-lock
(TTL-expired, held by a different session's identity) could let two
sessions' events.jsonl-mutating operations race?**

Checked: `grep -rn "acquireMainCheckoutLock" src bin` → 4 real call sites:
`src/runner/dispatch/cli.mjs:483`, `src/runner/claim-port.mjs:104`,
`src/runner/merge.mjs:773,894`, `bin/fgos.mjs:3883` (the `lock-status`/
`unlock` verb's own read path). GitNexus confirms `acquireMainCheckoutLock`
is called by `claimWork` (via `IsUsableIdentity`/`WriteAtomicCreate`/
`WriteAtomicReplace`/`IsPidAlive` flow steps) — i.e. `fgos pick`/`fgos
take`, plus `merge.mjs`'s approve/merge path. `claim-port.mjs:96-103`'s own
comment states explicitly: "Acquire main-checkout-lock before any state
mutation" — for THIS module, meaning claim's own `moveWork` call.

There is NO call to `acquireMainCheckoutLock` anywhere in `src/state/
store.mjs`, `src/state/events.mjs`, or in the verb implementations for
`discover`/`return`/`edit`/`decision`/`handoff` (checked: `grep -rn
"acquireMainCheckoutLock" src/state/` returns nothing). `main-checkout-
lock.mjs`'s own module header is explicit about this too: "this module
touches neither runner.lock, sessions.lock, nor events.lock" — it is a
FOURTH, independent lock lineage, deliberately not wired to
`acquireEventsLock`. Its own purpose statement: "detects any process
actively committing directly against this checkout" (a real `git commit`,
STR65 clobbering of `.git/index`) — not a general events.jsonl-mutation
guard.

**Answer: main-checkout-lock and events.jsonl's `withEventsLock` are
disconnected mechanisms.** `main-checkout-lock` is consulted only by
`claimWork` (pick/take) and `merge.mjs` (approve/merge) — real git-level
checkout/commit operations — never by the pure state-mutating verbs
(`discover`, `return`, `edit`, `decision`, ...) that only touch
`events.jsonl` via `withEventsLock`. tsk-24e's own tsk-1el decision, which
correlates a stale main-checkout-lock (different session's identity,
`lockAgeMs 517034`) with a `fgos return` call's data loss, is most likely
a coincidental correlation (both symptoms of the same busy concurrent
window) rather than a causal link through this specific lock — `return`
never touches `acquireMainCheckoutLock` at all, so a stale claim/merge
lock cannot itself be the mechanism that dropped `return`'s own append.
The `withEventsLockAndRefresh` fix (tsk-1q5) already covers `return`'s own
append+refresh race; if `return` events are still being lost post-fix, the
more likely mechanism is Question 1's answer (an uncommitted `events.jsonl`
still sitting exposed to a force-checkout/reset by a concurrent session,
independent of which lock either session's foreground operation happened
to be checking at that moment).

## Verdict

**Clear** (the research question itself has a definite, evidence-backed
answer): the merged fixes (tsk-1q5/tsk-3wq/tsk-2tm) close the three race
classes they targeted, confirmed present in current code. A real,
never-implemented gap remains — root cause B's "prevention" half (tsk-1q5's
own Outstanding Question: "a concrete hardening step... or a follow-up
item") was reasoned about but never built; tsk-3wq's actual scope covered
only the merge-time vector (`union` driver), not the force-checkout/reset
vector. That gap plausibly explains tsk-24e's fresh post-fix evidence.
Closing it is a genuine scope decision (which hardening shape: an
auto-commit cadence for `.fgos/events.jsonl`, a pre-flight hook blocking
raw `git reset --hard`/`checkout -f` on the main checkout the way `fgos
main-checkout-reset` already gates its own path, or something else) —
not something this research call should pick on its own.
