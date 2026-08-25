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
(`stdoutStr.includes('[DONE]')`) to a check that strips backtick-quoted
spans (`` `...` ``) out of `stdoutStr` first, then does the same
substring check on what remains. RESEARCH.md Round 1 confirmed this is
the real root cause of the finding this item records (root cause is
confirmed, not "unconfirmed" as the item's own description still says) —
the current check is fooled by `[DONE]` appearing inside backtick-quoted
prose describing the token itself, which is exactly what
agy/gemini-3.6-flash-medium's transcript did (tsk-5gd's own description:
"only backtick-quoted mentions of the token INSIDE prose").

**Alternatives rejected:**
- *Rewrite the prompt template to be more directive* (the item's own
  "improvement direction" second idea) — rejected as the primary fix: it
  treats a detection bug as a prompt-tuning problem, is unverifiable
  without live model dispatches (expensive, flaky), and does not close
  the gap for any other executor/model that happens to echo the token in
  prose. Worth a follow-up note in the doc entry, not the fix itself.
- *Require the token as its own standalone trimmed line, nothing else on
  it* — this was this plan's first draft, and `fgos-coding-validating`'s
  Reality Gate caught it as a real Assumptions-dimension FAIL: the two
  existing GREEN fixtures in `test/runner/dispatch.test.mjs:3320,3322`
  are `"task complete [DONE]\n"` and `"task stuck [BLOCKED]\n"` —
  *neither* is the token alone on its line, so a strict standalone-line
  rule would have flipped both existing tests to `unsignaled` and broken
  the `pi`/`claude` GREEN coverage this item must not regress. Rejected
  once reality-checked against the actual fixture strings, not on
  plausibility.
- **Backtick-stripping (chosen)** — verified by hand against all four
  known cases before being accepted: `"task complete [DONE]\n"` (no
  backticks) → unchanged, still signals `true`; `"task stuck
  [BLOCKED]\n"` (no backticks) → unchanged, still signals `true`;
  `writeEchoExecutor`'s plain JSON stdout (no tokens, no backticks,
  `test/runner/dispatch.test.mjs:71-82`) → still `false`; tsk-5gd's real
  transcript (token only inside `` ` `` `` ` `` spans) → after stripping,
  `false` → `outcome:'unsignaled'`, the desired new behavior. All four
  cases check out against the real fixture code, not assumed.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `hasSignal` detection change (`cli.mjs:522`) | medium — changes behavior of an Iron-Law-flagged, self-modifying-capable module (`docs/history/tsk-4oq/iron-law-evidence.md` confirms `src/runner/dispatch/cli.mjs` is in `MODULE_RULES`, required:true) | design verified by hand at `fgos-coding-validating` against all 4 known stdout shapes (see Approach above, "Backtick-stripping (chosen)") — execution still owes the failing-test-first proof: the new quoted-prose regression test must fail against the pre-fix code and pass after, same discipline tsk-4oq's own evidence file used |
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

1. Fix `hasSignal` in `cli.mjs` to strip backtick-quoted spans out of
   `stdoutStr` first, then run the same `[DONE]`/`[BLOCKED]` substring
   check on what remains (verified design, see Approach above).
2. Add a regression test asserting `outcome:'unsignaled'` when stdout
   contains `[DONE]` only inside backtick-quoted text (mirroring
   tsk-5gd's real transcript shape), confirmed failing against the
   pre-fix code first, then passing after — same discipline as
   `docs/history/tsk-4oq/iron-law-evidence.md`.
3. Append the live proof-test finding entry to both
   `coding-worker-contract.md` mirrors, citing tsk-5gd and
   `docs/history/tsk-5gd/RESEARCH.md`, following the exact bold-header +
   prose + "Full evidence:" shape of the `pi`/`claude` precedents.

Concrete cases to prove against (all 4 verified by hand at validating,
per the Approach section's risk-map row): (a) token absent entirely —
must still report `unsignaled` (existing test, must stay green); (b)
token present as plain text with no surrounding backticks, e.g. `"task
complete [DONE]"` — must still report signaled (existing test, must stay
green); (c) token only inside backtick-quoted text (tsk-5gd's real case)
— must newly report `unsignaled`; (d) token appearing both inside
backticks AND as plain text in the same stdout — must still report
signaled (the plain-text occurrence survives stripping).

## Outstanding questions

None
