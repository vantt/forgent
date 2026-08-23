# plan.md: tsk-6uc — main-checkout.lock holder-identity self-vs-other

Mode: small

Flag count: 1 (existing covered behavior — `test/runner/lock-wait.mjs`'s
poll line is already exercised by `test/runner/lock-wait.test.mjs`, 10
passing cases). No hard-gate flag (no auth, no data model, no external
system, no audit/security boundary — this is a stderr diagnostic line in
a dev-tooling CLI). No CONTEXT.md exists (discovery verdict was `clear`,
skipping `exploring`) — nothing to cite; every claim below traces to
`RESEARCH.md`'s Round 1 or a direct read cited inline.

## Approach

**Chosen path.** Add a self-identity comparison at the one print site —
`src/runner/lock-wait.mjs`'s poll line (currently line 90-94,
`` `still waiting on main-checkout lock (holder pid ${err.holderPid}, ...)` ``)
— and append a plain qualifier once the comparison is known, instead of
printing the bare, ambiguous `err.holderPid` value alone.

The comparison must branch on `typeof err.holderPid`, mirroring exactly
the two identity shapes `main-checkout-lock.mjs`'s own self-recognition
check already treats as authoritative (RESEARCH.md Round 1, finding 1-2):

- `number` — compare against `process.pid`. This is the numeric shape the
  three current acquirers (`claim-port.mjs:105`, `merge.mjs:772,889`) all
  use post-tsk-70l/tsk-18k.
- `string` — compare against `resolveWriterIdentity().id`
  (`src/util/session-identity.mjs`, imported fresh into `lock-wait.mjs` —
  call with no `fgosDir` argument; its own JSDoc, lines 111-118, states
  `fgosDir` may be omitted and only skips the registry-confirmation step,
  never throws). This is the string shape `.githooks/pre-commit`'s own
  fallback identity resolution can still write into the lock file today
  (RESEARCH.md Round 1, finding 2) — and the same env-derived id is
  inherited byte-identically by every process forked from the same
  session (`main-checkout-lock.mjs:262-264`'s own D6 comment), so the
  *current* polling process can read that same env var itself, with no
  new plumbing.

Match found → append a plain, non-liveness-claiming qualifier (e.g. "—
likely your own session's other in-flight call"). Match not found →
append the honest complement (e.g. "— a different pid/session"). Neither
phrasing claims the OTHER holder is alive or dead — that stays exactly
`fgos-unlock`'s own job (RESEARCH.md: no existing overlap) — this only
states an identity-equality fact the code can already prove, mirroring
the honesty lesson `tsk-24t` already applied one call site over (never
assert what the code has not actually established).

**Alternatives rejected.**
- *Do the comparison inside `main-checkout-lock.mjs`'s `tryAcquireOnce`
  and attach a `selfMatch: boolean` field to the thrown error* — rejected:
  that function already resolves `identity` as its own local parameter,
  so it technically has both values in scope for free, but every caller
  of `acquireMainCheckoutLock` (`claim-port.mjs`, `merge.mjs`'s two call
  sites) would need to thread that field through their own thrown-error
  shape too, widening the change from one file to four for no added
  correctness — `lock-wait.mjs` can already re-derive the same fact
  independently, at the one place it is actually displayed.
- *Only handle the numeric branch* — rejected: RESEARCH.md Round 1
  confirms the string branch is the one that produced the item's own
  reported evidence (a UUID-format holder id); skipping it would leave
  the exact scenario the item reports unfixed.

**Risk map.**
| Component | Risk | Proof point |
|---|---|---|
| `lock-wait.mjs` print-site change | low — additive to a stderr string only, no change to retry/backoff/acquire semantics | extend `test/runner/lock-wait.test.mjs`'s existing stderr-capture test (lines 129-145) with a numeric self-match, numeric mismatch, and string self-match case |
| New `resolveWriterIdentity` import into `lock-wait.mjs` | low — pure function, already used elsewhere in this module family (`main-checkout-lock.mjs`'s own hook fallback), no fgosDir required here | same test file; assert no exception when no `FGOS_*_SESSION` env var is set (falls through to the numeric/PID branch per the function's own documented fallback) |

Impact-analysis posture: **full** — `fgos tool query --capability
impact-analysis --status present` returned `gitnexus` as `present`
(queried this session). Blast radius kept low by construction (only
`lock-wait.mjs` changes); cross-checked by grep per the capability gate's
own cross-check note — `withLockRetry` has exactly two call sites
(`src/verbs/merge/sync-root.mjs:105`, `src/verbs/merge/approve.mjs:128`),
neither of which reads the printed stderr line programmatically (both
only use `withLockRetry`'s return value / thrown error, never its stderr
side effect).

**Files touched, in order:**
1. `src/runner/lock-wait.mjs` — import `resolveWriterIdentity`, add the
   two-shape comparison, extend the print-site template string.
2. `test/runner/lock-wait.test.mjs` — extend the existing stderr-capture
   test (or add sibling cases) proving both shapes render the correct
   qualifier.

`fgos graph --json` reports this item as its own isolated
single-item component (no deps, nothing depends on it) — no
cross-item ordering constraint to honor.

## Shape

Single piece, pass-through (see Split below) — a direct, mechanical
change: one comparison, one template-string edit, one test extension.
Concrete cases to prove (sized to `small`, no `high-risk`-depth sketch
needed):

- Numeric `holderPid` equal to the test's own `process.pid` → qualifier
  reads as self.
- Numeric `holderPid` different from `process.pid` → qualifier reads as
  other.
- String `holderPid` equal to an injected env session id (test sets the
  same env var `envSessionId` reads, then constructs the error with that
  same string as `holderPid`) → qualifier reads as self.
- No env session var set, `holderPid` is a string anyway (the
  ancestor-walk PID fallback never produces a string, so this is a
  synthetic/defensive case, not a reachable one from real code) — not
  tested; `resolveWriterIdentity`'s own existing test suite
  (`test/runner/session-identity.test.mjs`) already covers that function
  in isolation, this item's own test only needs to prove the *comparison
  and qualifier*, not re-prove `resolveWriterIdentity` itself.

## Split

None. One honest piece — a single-file behavior change plus its test,
already small under the Mode gate. Nothing to materialize at
`fgos-coding-validating`'s gate beyond this plan itself.

## Outstanding questions

None
