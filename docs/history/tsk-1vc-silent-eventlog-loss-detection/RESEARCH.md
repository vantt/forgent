# RESEARCH — tsk-1vc: silent eventlog loss / unread guard warning

## Round 1 — 2026-08-21 (discovery)

**Asked:** Is `recordMainCheckoutGuardWarning`'s output genuinely never read
back anywhere (item's own decision-text claim)? Which of the two
hypothesized loss mechanisms (tsk-cgg's git-reset/checkout/clean revert vs
tsk-1ji's opportunistic-checks periodic auto-commit + guard-mark advance)
actually explains the concrete `tsk-3hks` loss this item reports? Is the
checkpoint-interval / fail-closed-vs-warn design space already decided
anywhere, or still open?

**Checked — repo search, cited:**

- `rg -n "main-checkout-guard-warnings|recordMainCheckoutGuardWarning" src
  bin docs test --glob "*.{mjs,cjs,md}"` — only hits are the write site
  (`src/state/events-jsonl-truncation-guard.mjs:223,228`), the definition
  (`src/state/main-checkout-guard-warnings.mjs:19`), and tests. **No
  `doctor`, `list`, `show`, or `fgos-coding-driving` read site exists.**
  `src/state/main-checkout-guard-warnings.mjs` exports only
  `recordMainCheckoutGuardWarning` — no paired read function in the whole
  file. Confirms the item's own decision-text finding directly, not by
  inference.
- `src/state/events-jsonl-truncation-guard.mjs:163-167` (`writeGuardMark`)
  — plain `fs.writeFileSync`, no lock, no per-session scope. Confirms the
  existing investigation report's ("no lock/scope on the guard mark file")
  claim at the source.
- `src/state/events-jsonl-truncation-guard.mjs:195`
  (`PERIODIC_CHECKPOINT_INTERVAL_SEC = 900`) — hardcoded 15-minute
  constant, no config-file override read anywhere (only a test-only
  `opts.intervalSec` override). The "widen the interval vs. switch to
  event-count-based" trade-off flagged in
  `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`
  has **no code path today** that would let a person choose without a code
  change — it is a genuinely open design decision, not already resolved
  elsewhere.
- `src/runner/claim-port.mjs:123` and `src/runner/merge.mjs:788,911` —
  confirmed `runOpportunisticMainCheckoutChecks` is still wired
  unconditionally into both claim and merge, exactly as the prior report
  described; no fail-closed branch exists anywhere in this file (warn-only
  is the only behavior implemented, `try {} catch { swallow }` at both
  call sites).
- Direct read of the live `.fgos/events.jsonl` (`rg -n "tsk-3hks"`): the
  currently-live log has `tsk-3hks`'s `work.add` at **seq 22816** (ts
  `2026-08-21T03:19:20.749Z`) through its `work.stage` discovery→planning
  move at **seq 22823** (ts `03:20:01.092Z`), then the *next* event in the
  whole log is `tsk-1vc`'s own `work.add` at **seq 22852** (ts
  `03:34:51.852Z`). **Seq 22824–22851 (28 numbers) do not exist anywhere
  in the current live log** — a concrete, still-present gap, not just a
  stale guard-mark false positive. This is stronger evidence than the
  prior report had (it only compared tip-seq vs. mark-seq; this pins the
  exact missing range against real neighboring events).
- `git log --all --format="%h %ad %s" --date=iso-strict` cross-referenced
  against the gap window (`03:20:01`–`03:34:51` UTC = `10:20:01`–`10:34:51`
  local, `+07:00`): three commits landed inside that exact window —
  `5dd2526e` (10:26:52, tsk-c5u docs), `48fe78af` (10:28:24, tsk-4dk-2
  fix), `2023fa72` (10:30:15, tsk-2jz plan) — **none of them is a "periodic
  events.jsonl checkpoint" or a "Merge branch" commit**. The next
  checkpoint/merge pair (`0375c1b2` / `a27c9a6f`, both `10:36:29`–
  `10:36:31`) lands *after* the gap closes (after `tsk-1vc`'s own
  `work.add` at 22852). This weakens a clean "merge-strip-overwrite at a
  visible merge commit" explanation for this specific gap — no merge
  commit sits inside the window — and instead points toward an
  in-working-tree overwrite/race that a later periodic checkpoint then
  silently committed over, or a concurrent-write race on the shared,
  unlocked-for-cross-process append path. Not fully reconstructed; git
  history alone does not show which specific process wrote what into the
  working tree during the gap.

**Still open (not resolved by evidence, not this stage's call):**

1. Whether the specific `tsk-3hks` gap (seq 22824–22851) was caused by
   tsk-cgg's original mechanism, tsk-1ji's opportunistic-checks mechanism,
   or a third, undocumented one — git history alone does not pin the exact
   writer/operation; would need either a live reproduction harness or
   deeper log/process-level instrumentation than exists today to fully
   close.
2. Checkpoint-interval width vs. loss-window trade-off, and whether the
   guard should ever move from warn-only to fail-closed — both explicitly
   flagged in the prior investigation report as needing a human call
   ("Cần anh quyết trade-off tốc độ vs an toàn"), and confirmed above as
   having no existing code path that already decides it.
3. Where exactly the fix for "warning recorded but never read back" should
   hook in (`fgos doctor` check registry vs. a live-session read inside
   `fgos-coding-driving`'s own Orient step, mirroring how
   `postLandDrift`/`src/state/postland-drift.mjs` was wired in for
   tsk-1el) — a design/approach choice, not attempted here since it
   depends on (2) above (whether this item's own scope grows to include a
   fail-closed decision or stays narrowly "surface the existing warn-only
   signal").

## Round 2 — 2026-08-21 (validating, correction)

**Caught:** Round 1's "seq 22824-22851 gap" finding was wrong. It was
inferred from `rg -n "tsk-3hks"` jumping straight from a match at seq
22823 to the next match at seq 22852 — but that search only shows lines
*containing* "tsk-3hks"; it never actually inspected what filled the
seq numbers in between.

**Checked, this round:**
- `node scripts/events-jsonl-contiguity.mjs --check .fgos/events.jsonl` —
  this repo's own existing gap/duplicate detector (`src/state/events-
  jsonl-contiguity.mjs`, shipped for `tsk-3wq`, registered into `fgos
  doctor`), which Round 1 should have used instead of a manual grep
  cross-reference. Result: `{"ok": true, "totalLines": 22972, "duplicates":
  [], "gaps": []}` — no numeric gap exists in the live log.
- Direct `rg` for the literal seq numbers 22823-22852 (not filtered by
  item id): all present, with real timestamps `03:30:30`-`03:31:xx`,
  belonging to other items' genuine, unrelated activity.
- `docs/explanation/events-jsonl-lost-update-race-under-concurrent-
  session-writes.md` (tsk-1q5/tsk-3wq) — an existing, already-proven
  two-root-cause taxonomy for exactly this failure class (root cause A:
  `refreshView` outside `withEventsLock`, fixed; root cause B:
  git-tracked `events.jsonl` discarded by a raw `git merge`/checkout,
  fixed via `.gitattributes merge=union`). Neither is asserted to explain
  `tsk-3hks`'s own loss, but D4's reproduction harness must rule both out
  explicitly rather than assume a third, unfixed mechanism by default.
- `test/runner/merge-target-slot-multiprocess.test.mjs`,
  `test/state/events.test.mjs` (twenty-process barrier pattern) — real,
  existing multiprocess-test precedent in this repo (confirmed by reading
  both files), correcting Round 1's plan.md draft's "no existing file to
  extend" claim.

**Corrected verdict:** "the gap" (a numeric seq hole) does not exist and
is retracted (CONTEXT.md D7, supersedes D4's citation). The surviving,
real evidence for `tsk-3hks`'s own loss is qualitative only: the item's
own description states it was recovered by recreation (`fgos add` with
the same id/fields), and the guard's own "regressed" warning
(`.fgos/main-checkout-guard-warnings.jsonl`: tip seq 22816 vs. recorded
mark 22850 at `03:19:28`) — already explained in the prior investigation
report as a likely false positive from the guard-mark file's own
unlocked, unscoped race. D4's actual directive (real live reproduction,
never git-log/timestamp inference) is unweakened by this correction; if
anything it is reinforced, since a clean silent-disappear-and-renumber
leaves no numeric trace a post-hoc scan could ever find.
