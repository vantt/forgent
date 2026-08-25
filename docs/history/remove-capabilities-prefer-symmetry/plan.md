# plan.md — tsk-1ai: remove the `for` symmetry requirement

Mode: **standard** (2 mode-gate flags — public contracts: `resolveExecutorAndOverrides`
is a shared, heavily-called dispatch-resolution function (6 real call
sites across `cli.mjs`/`mechanism.mjs`/`resolve.mjs` itself); weak proof
around the area: superseding a previously locked decision (D2) always
needs the reversal made explicit and justified, never silently dropped.
No hard-gate flag). Cites `docs/history/remove-capabilities-prefer-symmetry/
RESEARCH.md` (no `CONTEXT.md` — discovery verdict was `clear`, the real
scope decision was already made live in conversation with the user
before this item was even submitted).

## Approach

1. **`src/runner/dispatch/resolve.mjs:192-200`** (`resolveExecutorAndOverrides`,
   step 2 of its own 4-step order) — remove the `for`-includes throw;
   resolve `preferred` directly once the named executor exists:

   ```js
   const preferred = cfg?.capabilities?.[executorIdOrPurpose]?.prefer;
   if (preferred) {
     const executor = executors[preferred];
     if (!executor) {
       throw new RunnerConfigError(
         `runner config capabilities.${executorIdOrPurpose}.prefer names "${preferred}" but no such executor is registered.`,
       );
     }
     return { executorId: preferred, executor, overrides: cfg.capabilities[executorIdOrPurpose].overrides, configured: true };
   }
   ```

   Keeps the "prefer names a real executor id" check (still a genuine
   typo-catcher, per RESEARCH.md's own test-name list — the "does not
   exist at all" test at line 3336 stays valid and passing unchanged);
   drops only the reverse `for`-includes requirement.

2. **`src/runner/dispatch/config.mjs:790-800`** — delete the whole
   config-load-time mirror block (the AFTER-both-known-good cross-check
   comment at 781-789 becomes stale prose describing a check that no
   longer exists — trim it to note the requirement was superseded, citing
   the new D-ID, never left describing removed behavior as if still real).

3. **Update the two tests whose ASSERTION direction flips** (not just a
   rename), per RESEARCH.md's own precise list:
   - `test/runner/dispatch.test.mjs:3328` — invert from `assert.throws`
     to asserting the real successful resolve (`executorId: 'agy'`,
     `configured: true`), keeping the fixture's own "no for at all" shape
     since that IS the new-behavior case being proven.
   - `test/runner/dispatch.test.mjs:3437` — invert from `assert.throws`
     to `assert.doesNotThrow`.
   - Rename the misleading "(symmetry satisfied)"/"symmetry required" test
     names/comments at lines 3296, 3308, 3421 for accuracy (cosmetic,
     behavior already correct) — never leave a passing test's own name
     asserting a requirement the code no longer enforces.

4. **Supersede D2** in `docs/history/capability-capacity-remodel/
   CONTEXT.md` — never edit the locked D2 row in place (per this repo's
   own "Changing a locked law" convention, applied here to a feature-level
   locked decision the same way). Append a new D5 row citing D2 verbatim
   and stating the real reason: the reverse symmetry check added a
   second required config edit per wiring decision without a
   proportional safety benefit (the mechanical `for`-includes check never
   verified real fitness for a job — a careless `prefer` edit could add a
   careless `for` entry just as easily) — decided live with the user
   after finding the original `agy`/`fgos-coding-implement` wiring
   (D3's own real migration) was accidentally dropped by an unrelated
   cleanup commit (`24819bb4`), not a deliberate rejection.

5. **Wire `agy` back**, now that the mechanism allows it — `.fgos/config.json`
   is engine-owned state, lands as a direct main-checkout commit (ADR0020,
   `docs/how-to/fix-fgos-write-rejected-merge-block.md`), never through
   this branch: `capabilities["fgos-coding-implement"] = {"description":
   "code-implement work for the coding domain's executing stage",
   "prefer": "agy"}` — WITHOUT adding `"for"` to `agy`'s own entry (the
   whole point of the change: `prefer` alone now suffices).

**Impact-analysis posture:** `degraded` — GitNexus (`forgent`) reports
`present`, but querying `impact({target: "resolveExecutorAndOverrides",
direction: "upstream"})` returned `"Target not found"` (stale index — this
symbol has existed since before this session's own earlier renames landed).
Per this repo's own cross-check gate, verified directly instead: `grep -rn
"resolveExecutorAndOverrides" src/` found 6 real call sites, all internal
callers passing through the SAME function being changed (`cli.mjs:95,274,
284,454,481`; `mechanism.mjs:83`; `resolve.mjs:215`) — none need their own
code change, since the behavior change is fully contained inside
`resolveExecutorAndOverrides`'s own body.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `resolveExecutorAndOverrides`'s own new behavior | Low — a strict relaxation (fewer throws), all 6 real callers pass through unchanged, confirmed by grep since GitNexus's index is stale for this symbol | `npm test` — the two inverted tests directly prove the new behavior; the untouched "prefer names a nonexistent executor" test proves that check still holds |
| `validateExecutorEntryShape`'s forward `for`-validates-against-capabilities check | None — confirmed untouched, a fully separate code block (`config.mjs:581-592`) never referencing `prefer` | Same `npm test` run — that block's own existing tests are not touched by this plan and must still pass |
| D2 supersede leaves a broken citation trail | Low | `docs/history/capability-capacity-remodel/CONTEXT.md`'s own D2 row stays verbatim, cited (not edited); new D5 row added — same pattern this repo already uses for every other locked-decision reversal |
| `.fgos/config.json`'s new `capabilities["fgos-coding-implement"]` entry | Low — additive only, `agy`'s own entry is untouched (no `for` added) | Direct main commit, verified live against the real resolver the same way tsk-1cn/tsk-1dsr's own config changes were |

## Files touched

- `src/runner/dispatch/resolve.mjs` — remove the reverse symmetry throw
- `src/runner/dispatch/config.mjs` — remove the load-time mirror check
- `test/runner/dispatch.test.mjs` — invert 2 tests, rename 3 for accuracy
- `docs/history/capability-capacity-remodel/CONTEXT.md` — append D5,
  superseding D2 (never edited in place)
- `.fgos/config.json` — `capabilities["fgos-coding-implement"] =
  {prefer: "agy"}` (direct main commit, ADR0020, separate from this
  branch's own merge)

## No split

One honest piece — the code change, its test updates, and the decision
supersede are one coherent, interdependent edit; splitting would only
add claim/worktree/merge overhead with the exact same "would leave a
change with no test coverage, or a test change with no code behind it"
risk this repo's own precedent (tsk-47r/tsk-1cn) already avoided by
keeping this shape as one piece.

## Outstanding questions

None
