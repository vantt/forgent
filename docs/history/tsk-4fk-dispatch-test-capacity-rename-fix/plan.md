# plan.md — tsk-4fk: dispatch.test.mjs's stale submit-assist-classify assertion

Mode: **tiny** (0-1 flags: only "existing covered behavior" arguably
applies, and only in the narrowest sense — this test itself is the
covered behavior being fixed, not a change to behavior it covers; no
auth, authorization, data model, audit/security, external system, public
contract, cross-platform, or multi-domain flag applies). No `CONTEXT.md`
exists — `fgos-clarifying` found intent fully understood from the item's
own description (exact line, exact rename commit, exact fix) and
`discover` moved `clarify -> decompose` directly.

## Verified against the real repo

- `test/runner/dispatch.test.mjs:618-626` (`committedRunnerConfig()`) —
  the ONLY function in this test file that reads the real committed
  `.fgos/config.json` (main-checkout-resolved, confirmed by its own
  comment: ADR0020 wipes a worktree's local `.fgos/`). The test at line
  643-651 is the ONLY test that calls it and asserts on a capacity name
  from it.
- `git show main:.fgos/config.json` → `runner.capacities` keys are
  `judge-discovery`, `judge-decompose`, `coding-classify-intake` — no
  `submit-assist-classify`. Confirmed `main` itself is red on this exact
  test right now (pre-existing, unrelated to this item's own branch).
- `coding-classify-intake`'s real shape on `main`: `kind: "cli"`,
  `adapter: "cli-spawn"`, `tier: "light"`, `allowCrossProvider: true`,
  `args: ["-p", "{prompt}", "--model", "{model}"]` (includes both
  `{prompt}` and `{model}` tokens) — matches every field-shape assertion
  the test already makes (lines 647-651) unchanged; only the KEY NAME
  changed, not the shape.
- `grep -n "submit-assist-classify" test/runner/dispatch.test.mjs` finds
  ~20 more occurrences beyond line 643-646, all in OTHER tests
  (`resolveExecutorCommand`/`decideCapacityDispatchMechanism`/
  `resolveCapacityCli` tests, lines 1168-2020) — every one of these
  builds its own synthetic, in-memory `cfg.capacities` fixture and never
  calls `committedRunnerConfig()`. They use `'submit-assist-classify'` as
  an arbitrary sample capacity-id string, self-consistent with their own
  fixture, never reading the real file. Confirmed out of scope: renaming
  these would be pure churn with no effect on any assertion's truth
  value, and touches code this item's own scope (the real-config
  assertion) never claimed.

## Approach

Single change: `test/runner/dispatch.test.mjs` lines 643-646 — rename
the looked-up key from `'submit-assist-classify'` to
`'coding-classify-intake'` in the `cfg.capacities?.[...]` lookup and the
`assert.ok(..., 'capacities.submit-assist-classify must exist')` message,
plus the test's own title string (currently
`"...declares the submit-assist-classify capacity..."`) so it names the
real key under test. Field-shape assertions on lines 647-651 (`kind`,
`adapter`, `tier`, `allowCrossProvider`, `args` template) stay unchanged —
already verified above to match `coding-classify-intake`'s real shape.

impact-analysis posture: not applicable — this is a test-only string
rename with no production code path touched, no symbol whose callers
matter.

## No split

One line-range edit in one file, one commit. Nothing to split.

## Outstanding questions

None
