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

**Chosen path**: add one new shared wrapper module, `src/runner/lock-wait.mjs`,
exporting `acquireMainCheckoutLockWithWait(dir, lockOpts, waitOpts)`. It
calls the existing `acquireMainCheckoutLock` (never edited, per D1/CONTEXT.md)
exactly as each call site does today; on `HELD` it retries with backoff
(500ms → 1s → 2s, cap 2s — already specified in the item's own text, not
re-litigated here) until either `ACQUIRED` or the wait budget is spent, then
falls through to each call site's own existing HELD-handling (unchanged
error path/message shape). `AMBIGUOUS` is returned immediately, no retry —
matches the primitive's own fail-closed D5, cited in CONTEXT.md's non-goals.

Wait budget, per D3 (default ON): `min(remainingTtlMs read at the first
HELD, waitOpts.waitMs ?? Infinity)`. Three observable CLI shapes result,
all reusing the existing `parseArgs` bare-flag-or-value behavior
(`bin/fgos.mjs:199-218`, no parser change needed):
- no flag → retries up to `remainingTtlMs` (today's silent-fail on transient
  contention becomes a wait instead)
- `--wait <ms>` → retries up to `min(remainingTtlMs, ms)` — tightens the
  budget, does not extend past the TTL
- `--no-wait` → skips the wrapper's retry loop entirely, calls
  `acquireMainCheckoutLock` once and fails exactly as today (regression
  escape hatch, and the only way to get today's old behavior back per D3)

**Alternatives rejected**: putting the retry loop inline in each of
`claim-port.mjs` and `merge.mjs` separately — rejected, violates DRY (design
report §7 already flags this) and doubles the surface needing the same
backoff-cap/TTL-bound correctness proof. Editing `main-checkout-lock.mjs`
itself to add retry — rejected, explicitly out of scope per D1/CONTEXT.md's
feature boundary (primitive stays non-blocking by design; only the CLI-verb
layer gets patience).

**Risk map**:

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| `lock-wait.mjs` retry/backoff/TTL-bound logic | medium — must stop retrying exactly when the budget is spent, never loop past it, never retry `AMBIGUOUS` | unit test: fake `HELD` with a short `remainingTtlMs` (e.g. 1s), assert retry stops and reports failure at or just after that bound, not before and not indefinitely after |
| `claimWork` sync→async signature change | **medium-high** (found at first `fgos-validating` pass, `test/runner/claim-port.test.mjs:47,58,74,91,107,123,137` all call `claimWork` synchronously today; `assert.throws(() => claimWork(...))` at lines 58/74 stops catching anything once `claimWork` returns a rejected Promise instead of throwing) — `claimWork` (`src/runner/claim-port.mjs:86`) is a plain sync function today; a sleep-based retry loop forces it to become `async`. `mergeRunnerItem` (`merge.mjs:619`) is already `async`, so only the `claimWork` side carries this risk | rewrite all 7 call sites in `claim-port.test.mjs` to `await`/`assert.rejects` before touching `claim-port.mjs` itself, so the rewrite's correctness is visible against today's behavior first, then swap the implementation underneath |
| `loop.mjs`'s own `claimWork` call (**found at first `fgos-validating` pass** — omitted from the original file list) | medium — `src/runner/loop.mjs:452` calls `claimWork(dir, { ..., actor: 'runner', ... })` from the autonomous runner dispatcher; D3's default-ON would silently make the runner loop start blocking/retrying on lock contention too, a context `research-260730-1133-cli-wait-flag-main-checkout-lock-design.md` §9's own second unresolved question explicitly said should stay excluded (scope is the interactive CLI-verb layer, not the automated dispatcher) | pass `noWait: true` explicitly at `loop.mjs:452`, preserving today's exact immediate-fail behavior there; add a test asserting the runner loop's dispatch-claim behavior is byte-for-byte unchanged by this item |
| `--no-wait` opt-out wiring across verb cases in `bin/fgos.mjs` | low — mechanical flag threading | one test per verb (take/pick/approve) asserting `--no-wait` reproduces byte-for-byte today's error on a forced `HELD` fixture |
| exhausted-wait failure message | low — UX only, no logic risk | assert the message states elapsed wait time, distinguishable from today's immediate-fail message (design report's own suggestion) |

**Files touched, in order**:
1. `src/runner/lock-wait.mjs` (new) — the shared wrapper, unit-tested in
   isolation first since every call site depends on its correctness.
2. `test/runner/claim-port.test.mjs` — rewrite the 7 existing synchronous
   `claimWork` call sites to `await`/`assert.rejects` (lines 47, 58, 74, 91,
   107, 123, 137) **before** step 3, so the async-signature migration is
   proven against today's behavior first, not bundled invisibly into the
   feature change.
3. `src/runner/claim-port.mjs` — make `claimWork` `async`; swap its direct
   `acquireMainCheckoutLock` call for the wrapper; add `noWait`/`waitMs` to
   its existing options bag (`{ id, actor, isolate, claimTrigger, repoRoot,
   worktreeDir, skipOutcome }` — additive fields only).
4. `src/runner/loop.mjs:452` — add `noWait: true` to its existing
   `claimWork` call, preserving today's immediate-fail behavior for the
   autonomous runner dispatcher (see risk map row above).
5. `src/runner/merge.mjs` — same swap inside `mergeRunnerItem` (already
   `async`, no signature change needed here); add `noWait`/`waitMs` to its
   existing `{ timeoutMs }` options bag.
6. `bin/fgos.mjs` — parse `--wait`/`--no-wait` on the `take`, `pick`, and
   `approve` verb cases only (lines 1311/1369/1678) and thread them into
   the calls from steps 3/5. **Not `merge`** (line 1126): `merge next`
   never calls `mergeRunnerItem` directly — it recurses into
   `runVerb('approve', flags, [id], dir)` (line 1152), forwarding `flags`
   unchanged, so it inherits the new flags automatically through `approve`
   with no separate parsing needed (found at first `fgos-validating` pass;
   corrects the original file list, which counted `merge` as a fourth
   parse site).
7. Remaining tests alongside 1-6 (see risk map) — no change needed to
   `main-checkout-lock.test.mjs` (the primitive itself is untouched, per
   D1/CONTEXT.md); no change needed to `merge.test.mjs`'s call signature
   (already async).

## Cases to prove (standard-mode depth)

- Boundary: `HELD` clears with 1 tick left in the backoff schedule (retry
  succeeds right at the edge of the wait budget, not one tick late).
- Existing behavior that must not regress: a plain `take`/`pick`/`approve`
  (and, through it, `merge next`) call with `--no-wait` fails exactly as
  today's call with no flags at all does right now (same error class, same
  message shape) — and the autonomous runner loop's own dispatch-claim call
  (`loop.mjs:452`, always `noWait: true`) is unchanged in every case.
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
