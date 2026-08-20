# plan.md — tsk-5gd

Mode: standard

2 flags applied (per `fgos-routing`'s Mode gate): existing covered
behavior (`executeExecutorCli`'s `hasSignal` check already has two
regression tests in `test/runner/dispatch.test.mjs`, both of which this
fix must keep green) and weak proof around the area (the exact edge case
this item found — the token appearing only inside quoted prose — has zero
existing coverage, per RESEARCH.md Round 1). No hard-gate flag (auth,
data loss, audit/security, external provider, removing a validation)
applies — this narrows detection precision, it does not remove any
existing check.

## Approach

**Chosen path:** narrow `hasSignal`'s detection in
`src/runner/dispatch/cli.mjs:522` from a raw substring check
(`stdoutStr.includes('[DONE]')`) to a check that only counts the token
when it appears as its own status line — not merely present anywhere in
stdout. RESEARCH.md Round 1 confirmed this is the real root cause of the
finding this item records (D: root cause is confirmed, not "unconfirmed"
as the item's own description still says) — the current check is fooled
by `[DONE]` appearing inside backtick-quoted prose describing the token
itself, which is exactly what agy/gemini-3.6-flash-medium's transcript
did.

**Alternatives rejected:**
- *Rewrite the prompt template to be more directive* (the item's own
  "improvement direction" second idea) — rejected as the primary fix: it
  treats a detection bug as a prompt-tuning problem, is unverifiable
  without live model dispatches (expensive, flaky), and does not close
  the gap for any other executor/model that happens to echo the token in
  prose. Worth a follow-up note in the doc entry, not the fix itself.
- *Require the token on a line by itself with nothing else* (strictest
  read) — rejected as too brittle: `pi`'s and `claude`'s existing GREEN
  entries in `coding-worker-contract.md` were not verified against a
  "nothing else on the line" rule, and over-tightening risks a false
  negative on a currently-passing executor. The fix instead requires the
  token to appear as a standalone line (trimmed match), not embedded
  inside a longer sentence or inside backticks/quotes — precise enough to
  reject tsk-5gd's transcript, loose enough not to regress the two
  existing GREEN tests.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `hasSignal` detection change (`cli.mjs:522`) | medium — changes behavior of an Iron-Law-flagged, self-modifying-capable module (`docs/history/tsk-4oq/iron-law-evidence.md` confirms `src/runner/dispatch/cli.mjs` is in `MODULE_RULES`, required:true) | failing-test-first proof at `fgos-coding-validating`/execution: a new regression test for the quoted-prose case must fail against the pre-fix code and pass after, same discipline tsk-4oq's own evidence file used |
| Existing GREEN coverage (`pi`, `claude`) | low | the two existing tests in `test/runner/dispatch.test.mjs:3300-3344` must stay green unmodified — no new test may weaken them |
| Doc entry accuracy (`coding-worker-contract.md`) | low | entry cites this item's id and `docs/history/tsk-5gd/RESEARCH.md`, following the exact precedent shape (bold header, prose, "Full evidence:" line) — both mirrored copies (`core/skills/_shared/` and `plugins/fgOS/skills/_shared/`) updated identically, verified with `diff` |

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but `list_repos` shows this repo's index 1047 commits behind
HEAD — too stale to trust for blast radius. Cross-checked manually
instead: `grep -rl "executeExecutorCli" src bin plugins core` shows the
only callers are inside `src/runner/dispatch/{config,transport,resolve,
prepare}.mjs` and `src/runner/dispatch.mjs` — all internal to the
dispatch subsystem, no caller outside it. The change is contained to that
cluster; no public/external contract is touched.

**Files touched, in order:**
1. `src/runner/dispatch/cli.mjs` — narrow `hasSignal`.
2. `test/runner/dispatch.test.mjs` — add the quoted-prose regression test
   (failing-test-first against the pre-fix code, per the risk-map proof
   point above), alongside the two existing tests at line ~3300.
3. `core/skills/_shared/coding-worker-contract.md` and
   `plugins/fgOS/skills/_shared/coding-worker-contract.md` (byte-identical
   mirrors, per RESEARCH.md Round 1) — append the new live proof-test
   entry for agy/gemini-3.6-flash-medium, same precedent shape as the
   `pi`/`claude` entries already there.

`deps: []`, no other open item references this one — no `fgos graph`
ordering constraint applies; this is a self-contained leaf.

## Shape

One phase, no split (Step 4: this is one honest piece — a single root
cause, a single code change, one new test, one doc entry; nothing here is
independently workable on its own).

1. Fix `hasSignal` in `cli.mjs` to require the token as its own trimmed
   line in stdout, not merely present as a substring anywhere.
2. Add a regression test asserting `outcome:'unsignaled'` when stdout
   contains `[DONE]` only inside quoted/prose text (mirroring
   tsk-5gd's real transcript shape), confirmed failing against the
   pre-fix code first, then passing after — same discipline as
   `docs/history/tsk-4oq/iron-law-evidence.md`.
3. Append the live proof-test finding entry to both
   `coding-worker-contract.md` mirrors, citing tsk-5gd and
   `docs/history/tsk-5gd/RESEARCH.md`, following the exact bold-header +
   prose + "Full evidence:" shape of the `pi`/`claude` precedents.

Concrete cases to prove against: (a) token absent entirely — must still
report `unsignaled` (existing test, must stay green); (b) token as a
genuine standalone status line — must still report signaled (existing
test, must stay green); (c) token only inside quoted/prose text (tsk-5gd's
real case) — must newly report `unsignaled`; (d) token on its own line but
with trailing/leading whitespace — should still count as signaled (trim
before compare, do not over-tighten).

## Outstanding questions

None
