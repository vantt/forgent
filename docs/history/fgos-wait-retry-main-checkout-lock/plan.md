# PLAN: --wait retry for main-checkout-lock CLI verbs (tsk-6c2)

Decisions this plan honors: D1, D2, D3 in `CONTEXT.md` (same directory).
Nothing below reopens or reinterprets any of them.

## Mode

Flags counted (per fgos-planning's mechanical gate):

| Flag | Applies? | Why |
|---|---|---|
| public contracts | yes | D3 flips a CLI default (take/pick/merge/approve go from immediate-fail-on-HELD to retry-with-backoff by default) — a user-facing behavior change, not additive-only |
| existing covered behavior | yes | claim-port.mjs's `claimWork` and merge.mjs's `mergeRunnerItem` both have existing tests asserting today's immediate-fail-on-HELD/AMBIGUOUS shape; this change touches that exact path |
| weak proof around the area | yes | survey report (`research-260730-1133-open-lock-contention-items-survey.md` §4) documents 7 prior "done" items patching this same lock/claim cluster piecemeal — a track record of this area being easy to get subtly wrong |
| auth / authorization | no | — |
| data model | no | no `.fgos/state.json` schema change |
| audit/security | no | not a security control, a concurrency-UX mechanism |
| external systems | no | local file-lock + git only |
| cross-platform | no | reuses `main-checkout-lock.mjs`'s existing cross-platform `wx`-create; no new OS-specific code |
| multi-domain | no | single domain (coding/CLI) |

3 flags, no hard-gate flag (auth/data-loss/audit-security/external-provider/
removing-a-validation) → **standard**.

## Split decision

`fgos graph --json` (checked before drafting this plan): `tsk-6c2` appears
in neither `criticalPath` nor `topUnblock` — nothing else in the backlog is
waiting on this item to unblock. No parallelism or sequencing pressure from
other work. Combined with the mode-3 flag count (not high-risk) and the
scope already narrowed by D1 (take/pick/merge/approve behaviorally, 3 real
parse sites since `merge` forwards to `approve` — see file list below):
this is **one honest piece of work**, not split into child items. It
proceeds as `tsk-6c2` itself.

## Approach

**Chosen path (revised after `fgos-validating`'s third pass — see
"Approach history" below)**: retry lives entirely at the `bin/fgos.mjs`
CLI-verb layer, matching `research-260730-1133-cli-wait-flag-main-checkout-lock-design.md`
§3's own original framing ("flag optional ở lớp CLI verb... gọi lại y
nguyên `acquireMainCheckoutLock`"). `claimWork` and `mergeRunnerItem` are
safe to retry as whole calls, unmodified: in both, the lock acquire is the
first substantive operation, strictly before any state mutation
(`claim-port.mjs`: `acquireMainCheckoutLock` runs before any `moveWork`;
`merge.mjs`: `acquireMainCheckoutLock` runs before `mergeRunnerItemLocked`'s
git merge) — so catching the thrown lock error and re-invoking the same
call from scratch after a backoff sleep is equivalent to retrying just the
acquire step, with no partial-mutation risk.

One new function, `withLockRetry(fn, waitOpts)` (new file
`src/runner/lock-wait.mjs`), wraps a zero-arg thunk: call `fn()`, and if it
throws with a lock-held signal, sleep (backoff 500ms → 1s → 2s, cap 2s —
already specified in the item's own text) and call `fn()` again, bounded by
`min(remainingTtlMs read off the first thrown error, waitOpts.waitMs ??
Infinity)`; any other error (including `AMBIGUOUS`) rethrows immediately,
no retry — matches the primitive's fail-closed D5, cited in CONTEXT.md's
non-goals. `bin/fgos.mjs`'s `take`/`pick`/`approve` cases call it as
`await withLockRetry(() => claimWork(dir, opts), waitOpts)` /
`await withLockRetry(() => mergeRunnerItem(repoRoot, item, opts), waitOpts)`
— `mergeRunnerItem` is already `async`, so wrapping it costs nothing new;
`claimWork` stays exactly as synchronous as it is today, called freshly on
each retry attempt exactly like the CLI already calls it once.

To let `withLockRetry` read `remainingTtlMs` without parsing it back out of
an error message, `ClaimError`'s constructor gains an optional 3rd `details`
argument (mirroring `MergeError`'s existing `constructor(message, details =
{})` / `Object.assign(this, details)` pattern at `merge.mjs:56-61`, already
additive) and the two `throw new ClaimError('lock-held', ...)` /
`new MergeError(..., { branch })` call sites pass `{ remainingTtlMs,
holderPid, lockAgeMs }` alongside what they already pass. Existing
assertions on `err.code`/`err.category`/the message text are untouched —
this only adds new properties.

**Why this is smaller than the first two drafts of this plan**: neither
`claimWork` nor `mergeRunnerItem`'s call signature or async-ness changes, so
`loop.mjs:452` (the autonomous runner's own `claimWork` call) is never
touched at all — it simply never goes through `withLockRetry` because it
never goes through `bin/fgos.mjs`'s CLI dispatch. No `noWait`/`await` fix
needed there, no risk of silently changing the runner loop's behavior in
the first place. And because `claimWork` keeps its exact synchronous
contract, none of the 7 existing synchronous call sites in
`test/runner/claim-port.test.mjs` need rewriting.

**Alternatives rejected**:
- Retrying inside `claimWork`/`mergeRunnerItem` themselves (the first two
  drafts of this plan) — rejected after `fgos-validating` found it forces
  `claimWork` to become `async`, which breaks 7 existing synchronous test
  assertions and silently changes `loop.mjs:452`'s autonomous-dispatch
  behavior unless separately patched. The CLI-layer retry avoids both
  problems by construction, not by patching around them.
- Editing `main-checkout-lock.mjs` itself to add retry — rejected,
  explicitly out of scope per D1/CONTEXT.md's feature boundary (primitive
  stays non-blocking by design; only the CLI-verb layer gets patience).

**Risk map**:

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| `withLockRetry`'s backoff/TTL-bound logic | medium — must stop retrying exactly when the budget is spent, never loop past it, never retry a non-lock-held error | unit test: a thunk that throws a `ClaimError('lock-held', ..., { remainingTtlMs: 1000 })` a few times then succeeds, assert retry stops and reports failure at or just after that 1s bound, not before and not indefinitely after; a thunk throwing `lock-ambiguous` or any other error must never retry |
| `ClaimError`/`MergeError` gaining `details` properties | low — additive only | existing `claim-port.test.mjs`/`merge.test.mjs` assertions on `err.code`/`err.category`/message text run unmodified and still pass (no rewrite needed, unlike the rejected approach) |
| `--no-wait` opt-out wiring across `take`/`pick`/`approve` in `bin/fgos.mjs` | low — mechanical flag threading | one test per verb asserting `--no-wait` reproduces byte-for-byte today's error on a forced `HELD` fixture |
| exhausted-wait failure message | low — UX only, no logic risk | assert the message states elapsed wait time, distinguishable from today's immediate-fail message (design report's own suggestion) |

**Files touched, in order**:
1. `src/runner/claim-port.mjs` — add the optional 3rd `details` arg to
   `ClaimError`'s constructor; pass `{ remainingTtlMs, holderPid,
   lockAgeMs }` at its `lock-held` throw site. `claimWork` itself is
   otherwise untouched — still synchronous, still throws at the same
   point.
2. `src/runner/merge.mjs` — add `remainingTtlMs`/`holderPid`/`lockAgeMs`
   into the existing `details` object at the `HELD` throw site inside
   `mergeRunnerItem` (constructor already supports this). `mergeRunnerItem`
   itself is otherwise untouched.
3. `src/runner/lock-wait.mjs` (new) — `withLockRetry(fn, waitOpts)`,
   unit-tested in isolation first since both CLI call sites depend on its
   correctness.
4. `bin/fgos.mjs` — parse `--wait`/`--no-wait` on the `take`, `pick`, and
   `approve` verb cases only (lines 1311/1369/1678) and wrap their existing
   `claimWork`/`mergeRunnerItem` calls in `withLockRetry`. **Not `merge`**
   (line 1126): `merge next` never calls `mergeRunnerItem` directly — it
   recurses into `runVerb('approve', flags, [id], dir)` (line 1152),
   forwarding `flags` unchanged, so it inherits the new flags automatically
   through `approve` with no separate parsing needed.
5. Remaining tests alongside 1-4 (see risk map) — no change needed to
   `main-checkout-lock.test.mjs` (the primitive itself is untouched, per
   D1/CONTEXT.md); no change needed to `loop.mjs` or its tests at all (see
   "why this is smaller" above).

**Approach history** (kept for the item's own record, not re-litigated):
the first plan draft put the retry inside `claimWork`/`mergeRunnerItem`
directly; `fgos-validating`'s first pass found it omitted `loop.mjs:452` as
a caller needing an explicit opt-out; its second pass found that call site
also needed an `await` fix once `claimWork` turned `async`; its third pass
found a smaller path that avoids touching `claimWork`'s signature (and
therefore `loop.mjs`) at all. This section reflects that third, current
design.

## Cases to prove (standard-mode depth)

- Boundary: `HELD` clears with 1 tick left in the backoff schedule (retry
  succeeds right at the edge of the wait budget, not one tick late).
- Existing behavior that must not regress: a plain `take`/`pick`/`approve`
  (and, through it, `merge next`) call with `--no-wait` fails exactly as
  today's call with no flags at all does right now (same error class, same
  message shape) — and the autonomous runner loop's own dispatch-claim call
  (`loop.mjs:452`, never routed through `withLockRetry` at all) is
  byte-for-byte unchanged, with no code of this item's touching that file.
- Concurrent-ish: two back-to-back acquire attempts within the same process
  (simulating the hook-just-committed case from CONTEXT.md's root-cause
  section) — second attempt retries into an `ACQUIRED` once the first
  identity's TTL window is simulated to close.
- Partial failure: wait budget exhausted while still `HELD` — verb still
  fails (never silently proceeds without the lock), with the new message.
- `AMBIGUOUS` at any point during the retry loop — no retry attempted,
  immediate fail, same as today.

## Execution note

Per the locked stance that Execute and its verify already have a working
mechanical path, this plan does not redesign `return`'s verify/re-verify
behavior or the engine's goal-check — those are untouched by this item
(D1 already removed `return` from scope entirely). The one verify command
for this item: `npm test -- --grep 'main-checkout-lock|wait'` (matches the
`fgos discover` verdict already recorded for `tsk-6c2`).
