# events-jsonl-truncation-force-rebaseline — RESEARCH

## Round 1 — 2026-08-26 (tsk-46v discovery+live remediation)

**Asked:** tsk-46v reports `fgos doctor`'s `events-jsonl-not-truncated`
check actively failing right now (2026-08-26), naming `events.jsonl` plus
8 per-writer shard files. Scope: investigate the recurring source, apply
the runbook's re-baseline step, decide whether the guard needs to become a
hard pre-flight block.

**Live-confirmed, real, ongoing:** `fgos doctor --dir
/home/vantt/projects/forgentX` (run at investigation start) reproduced the
exact break the item reports: `events-jsonl-not-truncated` failing with
`current tip seq 24759 is lower than the last recorded mark (seq 24765)`.

**Found the actual blocking bug — the documented runbook does not work as
written, in two independent ways:**

1. **Wrong sidecar path.** `docs/how-to/resolve-an-events-jsonl-
   truncation.md`'s own example command uses `.fgos/events-jsonl.
   truncation-guard.json` — but the REAL path, per
   `FGOS_FILE.GUARD_MARK`'s resolver (`src/state/fgos-file-registry.mjs:38`:
   `path.join(fgosDir, 'runtime', 'events-jsonl.truncation-guard.json')`),
   is `.fgos/runtime/events-jsonl.truncation-guard.json`. Following the
   doc literally (confirmed by actually doing it first) creates a stray,
   inert file at the wrong path — the real guard sidecar, and therefore
   the real break, is never touched. This alone would explain why the
   break has stood unacknowledged: anyone who tried the documented command
   before would have seen it "succeed" while doctor kept failing anyway.
2. **Even against the correct path, `--advance` cannot move past a real
   break, by design.** `advanceEventsJsonlTruncationGuard`
   (`src/state/events-jsonl-truncation-guard.mjs:215-221`) only calls
   `writeGuardMark` when `report.ok` — confirmed live: running it against
   the real sidecar path left the mark exactly where it was (`still
   BROKEN` for `events.jsonl` and 8 shard files, same reasons doctor
   reported). The function's own doc comment confirms this is intentional
   ("Never advances the mark on a break, so the failing mark stays pointed
   at the last known-good position for whoever investigates") — a real
   safety property, not a bug in that function. But the runbook's own step
   3 claims running `--advance` "advances the mark to the log's current
   tip. `fgos doctor` will pass again on the next run" — **that claim is
   false for exactly the case the runbook exists to handle** (a real
   break). No `--force`/acknowledge mode exists anywhere in
   `scripts/events-jsonl-truncation-guard.mjs` or the underlying module to
   actually perform the re-baseline the doc promises.

**Immediate remediation applied live** (this session, main checkout,
outside any commit — an operational action, not a code change): manually
computed each tracked file's current tip mark
(`computeGuardMark`) and wrote it directly via `writeGuardMark` against
the CORRECT path (`.fgos/runtime/events-jsonl.truncation-guard.json`) for
all 50 tracked files. Re-ran `fgos doctor` immediately after — confirmed
`events-jsonl-not-truncated` now `passed: true` ("truncation guard holds
across events.jsonl + 49 per-writer file(s)"). This also re-enables
`runOpportunisticMainCheckoutChecks`'s own D2 fallback auto-commit, which
was silently disabled the entire time this break stood unacknowledged
(`store.mjs`/`events-jsonl-truncation-guard.mjs:361-362`: `if
(breakFlagged) return;` — a break that is never acknowledged permanently
suppresses the auto-commit safety net for every subsequent session, not
just the one that hit it).

**Recurring-source investigation — bounded by real structural limits:**
`git reflog` from inside a worktree-isolated session shows only that
worktree's own 2-entry local reflog (confirmed live: `git reflog -50`
returned just the worktree's own creation entries) — no access to the
main checkout's real reflog, matching this item's own report ("no
reflog/history access from a worktree-isolated session to identify the
actor"). No `.fgos/main-checkout-guard-warnings.jsonl` file exists on
disk in the main checkout either (checked directly) — the warning-record
mechanism (`recordMainCheckoutGuardWarning`) never got a chance to log
anything useful before this break, or its own record predates what's
currently on disk. **The exact actor/process that ran the destructive git
command cannot be identified from any evidence available to this session
— this matches the item's own admission and is a structural limit, not a
gap this investigation failed to close.** The known mechanism class (a
raw `git stash`/`checkout --`/`reset --hard`/`clean` against the shared
main checkout while `.fgos/events.jsonl` had live uncommitted appends) is
already fully documented (`docs/history/events-jsonl-git-tracked-
truncation/`), and multiple concurrent sessions/loops are confirmed
active against this same repo today (this session independently observed
tsk-1ck being merged by another process mid-investigation) — consistent
with "some concurrent session ran a raw destructive git command," not a
single new culprit to name.

**tsk-1ji's own mitigation (2026-08-20) did not prevent this recurrence**
(2026-08-26) — confirmed by commit date: tsk-1ji's `runOpportunisticMain
CheckoutChecks` auto-commit-stale-dirty fallback was already live 6 days
before this incident. It is opportunistic (only runs inside a `fgos`
verb call, e.g. `claimWork`) and can only auto-commit a dirty tail it
gets to see — a raw external `git reset --hard` between two `fgos` calls
still wins the race if it lands before the next opportunistic check's own
commit. This is a real, structural limit of an opportunistic (vs.
pre-flight-blocking) mitigation, not evidence tsk-1ji's fix is broken.

## Verdict

`clear`. Scope:
1. **Fix the runbook's actual re-baseline capability** — add a real
   "force" mode (new function + CLI flag) that does what the doc already
   promises: acknowledge a real break and move the mark to the current
   tip, for every tracked file in one call, deliberately separate from
   `--advance`'s existing (correct, unchanged) "never move past a break"
   safety behavior.
2. **Correct the runbook doc** — right path
   (`.fgos/runtime/events-jsonl.truncation-guard.json`), right command
   (the new force mode).
3. **Hard pre-flight block: deferred, not implemented this pass.** The
   core blocker (a runbook that silently didn't work) is now fixed, which
   directly addresses why this break went unacknowledged for as long as it
   did. A hard pre-flight refuse on `fgos submit`/`fgos pick` is a
   separate, larger design decision (false-positive risk against
   legitimate work, needs its own careful scoping) that this item's own
   "not prescriptive" framing does not force onto this pass — recorded
   here as a real, open follow-up rather than silently dropped.

**Verify:** `node --test test/state/events-jsonl-truncation-guard.test.mjs`
— new tests: (a) the new force-rebaseline function/CLI mode moves every
tracked file's mark to its current tip even when broken; (b) the existing
`--advance`/`advanceEventsJsonlTruncationGuard` behavior (never move past
a break) stays unchanged and still tested. Plus a live re-confirmation
that `fgos doctor`'s `events-jsonl-not-truncated` check passes against the
real main checkout after the code fix ships (already manually confirmed
true via the live remediation above; the code fix makes this repeatable
via a real command instead of a one-off manual script).
