# RESEARCH — remove-capabilities-prefer-symmetry (tsk-1ai)

## Round 1 — 2026-08-19

**Asked:** find every real call site and test that depends on the current
`capabilities.<name>.prefer` symmetry requirement, so the change is
precise: remove exactly the reverse check (`prefer` names X → X must
self-declare `for`), never the forward check (`for` entries must be real
declared capability names — a separate, legitimate typo-catcher that
stays).

**Checked:**
- `src/runner/dispatch/resolve.mjs:192-200` (`resolveExecutorAndOverrides`,
  step 2 of its own 4-step order): the runtime symmetry throw —
  ```js
  const preferred = cfg?.capabilities?.[executorIdOrPurpose]?.prefer;
  if (preferred) {
    const executor = executors[preferred];
    if (!executor || !Array.isArray(executor.for) || !executor.for.includes(executorIdOrPurpose)) {
      throw new RunnerConfigError(`... "prefer" names "${preferred}" but that executor does not declare "for" including "${executorIdOrPurpose}" itself (symmetry required).`);
    }
    return { executorId: preferred, executor, overrides: cfg.capabilities[executorIdOrPurpose].overrides, configured: true };
  }
  ```
  This is the ONE block to change: resolve `preferred` directly once the
  executor exists, drop the `for`-includes check.
- `src/runner/dispatch/config.mjs:790-800`: the config-LOAD-time mirror of
  the same check (catches a typo'd `prefer` before `resolveExecutorAndOverrides`'s
  own resolve-time throw, per its own comment at 781-789 citing D2). This
  whole `if` block is the one to delete.
- `src/runner/dispatch/config.mjs:581-592` (`validateExecutorEntryShape`,
  the FORWARD check): `executor.for`'s own entries must each already be a
  declared `capabilities`/alias name — **this is a different, legitimate
  check (a typo-catcher on `for` itself) and must NOT be touched.** Nothing
  here asserts the REVERSE (that a `prefer` pointing at this executor
  exists) — confirmed by reading the full function body, no other
  reference to `prefer` inside it.
- No other call site in `src/` reads an executor's `for` array against
  `capabilities.*.prefer` for a consistency check — `grep -rn "\.for\b.*prefer\|prefer.*\.for\b" src/` and a full read of `resolveExecutorIdForPurpose`
  (`resolve.mjs:132-138`, the plain-scan fallback, step 3 of the 4-step
  order) confirm it only ever scans `for` arrays independently, never
  cross-checks against `prefer` — this mechanism is untouched by the
  change.

**Tests needing a real behavior-assertion change** (not just a rename),
`test/runner/dispatch.test.mjs`:
- Line 3328 `'resolveExecutorAndOverrides throws when "prefer" names a
  executor that does not itself declare "for" including the capability
  name (symmetry violation)'` — currently `assert.throws(...)`. New
  behavior: must resolve successfully instead (no throw) — invert to
  `assert.doesNotThrow` / assert the real resolved result.
- Line 3437 `'loadRunnerConfig rejects a load-time symmetry violation ...'`
  — currently `assert.throws(...)`. New behavior: must load successfully
  — invert to `assert.doesNotThrow`.

**Tests unaffected (still pass byte-identical)**, since removing a
requirement never breaks a fixture that already satisfies the OLD
stricter shape — `for` staying present on `agy` in these fixtures is
harmless, not required:
- Line 3308 (symmetry-satisfied case), 3319 (overrides threading), 3354
  (allowCrossProvider error naming), 3421 (well-formed prefer/overrides),
  3457+ (`spawnWorker` end-to-end) — all keep passing; only their
  descriptive names mention "symmetry", cosmetic only, rename optional
  but done for accuracy (a test name asserting a requirement that no
  longer exists is misleading to a future reader).

**D2's exact locked text** (`docs/history/capability-capacity-remodel/
CONTEXT.md:31`, verbatim, to cite precisely in the superseding D-ID):
> `capabilities.<name>` gains two new optional fields: `prefer` (a
> capacity id — that capacity **must** itself declare `for` including
> this capability name; symmetry required, no ungrounded assignment) and
> `overrides` (shallow-merged onto the resolved capacity, limited to
> exactly `rigorOverrides`/`providerModel`/`tier`/`model` — never
> `command`/`args`/`adapter`/`invocations`).

**Historical context (from this same session's own earlier chat
investigation, not re-derived here):** this exact wiring
(`agy.for: ["fgos-coding-implement"]` + `capabilities["fgos-coding-
implement"] = {prefer: "agy"}`) was D3's own real migration (confirmed
live in `.fgos/config.json` history) and was accidentally dropped in
commit `24819bb4` — both sides removed together as a quick fix for a
validation error, not a deliberate architectural rejection of agy as the
coding-implement default. The user, presented with "restore as-is" vs.
"remove the symmetry requirement entirely", explicitly chose removal —
the requirement adds friction (two config edits for one wiring decision)
without a proportional safety benefit for a general-purpose executor
meant to serve many capabilities over time (the mechanical `for`-includes
check never actually verifies real fitness for a job — a careless
`prefer` edit could just as easily add a careless `for` entry too).

**Still open:** none — the exact two functions and two test names to
change are fully identified; no other code path depends on the
requirement.

## Verdict

`clear`. Verify: `npm test` (existing dispatch.test.mjs coverage, updated
in place — no new test needed since the two inverted assertions already
prove the new behavior directly; the `for`-forward-check tests already
prove that mechanism is untouched).
