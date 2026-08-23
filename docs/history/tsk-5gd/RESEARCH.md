# RESEARCH.md — tsk-5gd (agy/gemini-3.6-flash-medium [DONE] token not detected)

## Round 1 — 2026-08-20

**Asked:** (1) What is the existing documentation pattern in
`coding-worker-contract.md` for recording a live proof-test finding about
an executor/model's `[DONE]`/`[BLOCKED]` compliance, so a new entry for
agy/gemini-3.6-flash-medium follows the same shape? (2) Is there existing
code/mechanism that already detects a missing `[DONE]`/`[BLOCKED]` signal,
and if so, why did tsk-5gd's dispatch still need git-log/git-status
forensics instead of a clean signal? (3) Is `dogfood-fixture/` the right
place for a "live proof-test regression fixture per provider/model", or a
separate, unrelated mechanism?

**Checked:**
- `core/skills/_shared/coding-worker-contract.md` and
  `plugins/fgOS/skills/_shared/coding-worker-contract.md` — byte-identical
  (`diff` confirms). Pattern for a live proof-test entry, established by
  three real precedents (lines 130-177): a bold header
  `**Live proof-test finding (tsk-XXX)**` or `**Follow-up finding
  (tsk-XXX)**`, optionally suffixed with a verdict label (`GREEN`,
  `RED, config-blocked, not contract-blocked`), followed by one prose
  paragraph naming the executor/model, what was dispatched, what was
  observed, and — when known — the root cause, closing with `Full
  evidence: docs/history/<feature>/RESEARCH.md Round N.` citing this same
  kind of research file.
- `src/runner/dispatch/cli.mjs:518-530` (`executeExecutorCli`) — the
  mechanism `tsk-4oq` added: after running the adapter, it captures
  `hasSignal = stdoutStr.includes('[DONE]') || stdoutStr.includes('[BLOCKED]')`
  and only attaches `outcome: 'unsignaled'` (plus `headBefore`/
  `headAfter`) when `hasSignal` is `false`. **This is a naive substring
  check** — it is satisfied by the literal string `[DONE]` appearing
  *anywhere* in stdout, including inside backtick-quoted prose that only
  *describes* the token rather than reporting it as the worker's own
  status line. tsk-5gd's own description says the worker's stdout
  contained `[DONE]` "only ... INSIDE prose describing the feature it
  implemented (the scan for `[DONE]` and `[BLOCKED]` tokens), never as its
  own status signal" — exactly the input shape `hasSignal` cannot
  distinguish from a genuine signal.
- `test/runner/dispatch.test.mjs:3300-3344` — the only two tests covering
  this path: one confirms `outcome:'unsignaled'` when stdout has neither
  token at all; the other confirms `outcome` is omitted when stdout is
  `"task complete [DONE]\n"` (a literal, unquoted, top-of-output token).
  **No test exercises the "token mentioned only inside quoted prose"
  shape** — the exact case tsk-5gd hit live. This is a genuine coverage
  gap, not a duplicate of existing coverage.
- `docs/history/tsk-4oq/iron-law-evidence.md` — confirms `tsk-4oq`
  (commit `de245b41`) is precisely the commit that introduced the
  `hasSignal`/`outcome:'unsignaled'` mechanism above, and that it was
  dispatched and implemented by an agy-class executor itself. tsk-5gd's
  own description says the driver "had to fall back to git-log/git-status
  forensics (exactly the cost tsk-4oq's own fix exists to reduce)" on that
  very dispatch — consistent with `hasSignal` evaluating `true` (because
  the substring existed in quoted prose) and therefore never attaching
  `outcome:'unsignaled'`, leaving whoever reviewed the transcript to
  notice by eye that the token wasn't a real status line and verify via
  git forensics instead of trusting the (silently wrong) clean-signal
  path.
- `dogfood-fixture/scenarios/expr-eval-chain.md` and
  `dogfood-fixture/{src,test,scripts}` — this mechanism replays a
  canonical free-text submission through the real fgOS backlog pipeline
  end-to-end (submit → discovery → planning → executing), for pipeline-
  level regression coverage. It has no notion of "per executor/model
  `[DONE]`-detection unit fixture" — that class of regression already
  lives as plain `node --test` cases in `test/runner/dispatch.test.mjs`
  (the two tests above are exactly that shape). `dogfood-fixture/` is a
  separate, unrelated mechanism for a different layer of the system.

**Found:**
- Root cause is **confirmed**, not "unconfirmed" as the item's own
  description states: `hasSignal`'s naive `.includes('[DONE]')` substring
  check at `src/runner/dispatch/cli.mjs:522` cannot tell a genuine status
  line from an incidental quoted mention, and no test in
  `test/runner/dispatch.test.mjs` exercises that distinction. This is
  option (b) from the item's own two candidate hypotheses, with a named
  code line and a named coverage gap, not "genuine model inconsistency"
  (option (a)).
- The documentation-entry format for `coding-worker-contract.md` is fully
  specified by the three existing precedents — no open question there.
- The "regression fixture" direction the item's description floats
  belongs in `test/runner/dispatch.test.mjs` (same file, same shape as
  the two existing `hasSignal`/`outcome` tests), not in `dogfood-fixture/`
  — those are two distinct, non-overlapping mechanisms.

**Open:** none — all three points resolved with direct evidence (file
line, byte-identical doc mirrors, and the specific missing test case).
