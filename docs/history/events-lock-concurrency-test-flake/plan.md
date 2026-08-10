# Plan: test concurrency events.lock flaky làm hỏng cổng merge

Item: tsk-3wn.
Mode: standard

## Lane — how it was counted

No lane was handed off (this item reached planning via `/fgOS:pick` →
`fgos-coding-driving` → `fgos-clarifying`, none of which runs
`fgos-routing`'s Orient step). Applying `fgos-routing`'s own Mode-gate
table directly:

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | No | — |
| data model | No | — |
| audit/security | No | — |
| external systems | No | — |
| public contracts | No | the chosen approach changes a TEST's own constants only; production API and defaults stay untouched |
| cross-platform | No | — |
| existing covered behavior | **Yes** | this test exists because of a real, spike-confirmed corruption bug; weakening it is the one thing this item must not do |
| weak proof around the area | **Yes** | a flaky test means proof in this area is unreliable by definition — that is the whole complaint |
| multi-domain | No | — |

2 flags → **standard**. Not `small`: there is a genuine design choice
between three approaches, and a real obligation to prove the test still
catches the original bug afterwards. Not `high-risk`: no hard-gate flag,
and the change adds no production behavior.

## Decisions this plan is built on

No `CONTEXT.md` — `fgos-clarifying` verdicted the item understood, so the
Socratic path never ran. The item's own description is the locked source
(same shape tsk-5wz/tsk-4qu used).

Verified during planning, not taken on the description's word:

- `test/state/events.test.mjs:225` — confirmed the test forks `N_PROC = 20`
  children, each doing `N_APPEND = 40` appends after a shared wall-clock
  barrier. **800 serialized lock acquisitions.**
- `src/state/events.mjs:50` — `EVENTS_LOCK_TIMEOUT_MS = 2000`, a per-
  acquisition budget.
- `src/state/events.mjs:331-338` — `withEventsLock(logPath, fn)` calls
  `acquireEventsLock(logPath)` with **no options**, and
  `appendEvent(logPath, opts)` passes `opts` to `appendEventCore` (the
  event payload), never to the lock. So there is **no injectable timeout**
  at the public API today — approach (a) from the item's description would
  require widening a production signature.
- **`src/state/events.mjs:44-48` is the decisive finding.** The timeout's
  own doc comment states 2s is *"generous headroom for genuine contention
  (dozens of serialized sub-ms holders) or a slow disk"*. The test creates
  **800** holders — more than an order of magnitude past the envelope the
  constant was designed and documented for. The test is over-scaled
  relative to production's own stated assumption; the constant is not
  under-sized.

Isolation evidence (already on the item, re-confirmed here): the file
passes `17/17` run alone and fails only inside the full `npm test`, where
Node's runner executes test FILES in parallel while this one forks 20 more
processes of its own.

## Approach

**Chosen — (b) from the item's three options: bring the test's own scale
back inside the documented envelope, and prove it still catches the bug.**

Reduce `N_PROC`/`N_APPEND` so the total serialized queue sits well under
the 2000ms per-acquisition budget, while keeping the property that
actually exposes the original defect: several real OS processes released
by a shared barrier so their read-then-write windows genuinely overlap.

Concretely: `N_PROC = 8`, `N_APPEND = 15` → 120 serialized holders. At the
sub-ms-to-low-ms per-hold the comment assumes, that is a few hundred ms of
queue against a 2000ms budget — roughly 5x headroom instead of today's
~1x, while still stampeding 8 concurrent processes.

**Rejected alternatives**
- **(a) Thread a `timeoutMs` through `appendEvent`/`withEventsLock` so the
  test can raise its own budget.** Rejected: it widens a production
  signature purely to accommodate a test, and it makes the test pass by
  hiding the very contention signal the item says must stay visible. It
  also fails the item's own "PHẢI GIỮ ĐÚNG" constraint in spirit.
- **Raise `EVENTS_LOCK_TIMEOUT_MS` itself.** Explicitly ruled out by the
  item's description ("KHÔNG chọn ... đó là sửa nhầm chỗ"), and it would
  slow every real CLI command's failure mode to make one test green.
- **(c) Split into a correctness test and a separate lock-timeout test.**
  Not rejected on merit — it is a reasonable shape — but it is strictly
  more change than (b) for the same outcome, and the item's own YAGNI
  posture favours the smaller move. Recorded here so a later session sees
  it was considered, not missed.

**Risk map**

| Component | Risk | What proves it |
|---|---|---|
| Reducing N_PROC/N_APPEND | **medium** — a smaller stampede could stop exposing the original read-then-write race, silently turning a real regression test into decoration | Deliberately break the lock (make `withEventsLock` bypass its mutex) and confirm the test FAILS on duplicate/gap, not on timeout. This is the single non-skippable proof point of this item. |
| Determinism claim | medium — "it passes now" is not "it is deterministic" | Run the full `npm test` 3 times consecutively; all three green. One green run is explicitly not accepted (item verify point 1). |
| Production untouched | low | `git diff` shows no change under `src/` unless a separate, stated reason exists |

Impact-analysis posture: **degraded**. GitNexus reports `present` but its
index is stale (`4ce7a96`) and it returned a provably wrong zero for
`validateWorkShape` earlier in this same session's history, so blast radius
here was established by grep, not by the tool.

**Order**: `fgos graph --json` reports `topUnblock: []` and this item is
not on the `criticalPath` (depth 10, unrelated ids), so ordering follows
the item's own shape, not cross-item leverage. One piece, no split.

## Shape

- `test/state/events.test.mjs` — lower `N_PROC`/`N_APPEND`, and record in a
  comment WHY those numbers (tie them to the 2000ms budget and to
  `events.mjs:44-48`'s own "dozens of holders" envelope), so a later
  session does not raise them back without meeting the same budget.
- No production file changes expected. If one turns out to be genuinely
  required, that is a scope change to raise, not to slip in.

## Concrete cases to prove against

- **The regression still bites**: with the lock deliberately bypassed, the
  test fails on duplicate/gap. (Non-skippable — see risk map.)
- **Existing behavior must not regress**: the other 16 tests in
  `events.test.mjs` stay green.
- **Under real load**: full `npm test` green 3 consecutive times, which is
  the exact condition that was failing.
- **Boundary**: run the file alone — still green (it always was; this must
  not become a test that only passes in isolation).

## Assumptions

1. Per-hold cost stays in the sub-ms-to-low-ms range the `events.mjs`
   comment assumes. If a future slow-disk environment breaks that, the
   budget math changes — which is why the chosen numbers are written down
   with their reasoning rather than left bare.
2. `tsk-104` and `tsk-4qu` were pushed to `blocked` by this flake and not
   by their own content. Evidence: both failed on this exact test with a
   lock-timeout, and `tsk-104`'s own diff is docs/prose only. Not material
   to this item's acceptance — it is why the item matters, not part of its
   proof.

## Outstanding questions

None
