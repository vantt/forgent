# Plan — `resolveDiscovery` trusts a committed CONTEXT.md instead of blind re-judging

Item: tsk-ozl · CONTEXT.md: same directory, D1-D3

## Mode

**small** (a few files, no gray areas — D1-D3 already lock every product
decision; what's left is implementation shape).

Flag count: **1** (existing covered behavior — `resolveDiscovery`/
`judgeDiscovery` already has a real test file, `test/intake/discovery.test.mjs`,
whose behavior this change extends). Auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform, weak
proof, multi-domain: none apply — `discover`'s CLI output shape
(`{outcome, id, verdict?}`) is unchanged, only what triggers `outcome:
'clear'` gains a second path.

## Approach

**Chosen path:** extract-and-reuse. `decompose.mjs`'s `readLockedContext`
(decompose.mjs:36-50) is already exactly the D2 trust-signal check
(docsRef set + `<docsRef>/CONTEXT.md` readable+non-empty), just scoped to
building a decompose prompt. Export it from `decompose.mjs` and import it
in `discovery.mjs`, rather than writing a second, drifting copy — same
`repoRoot`/`docsRef` shape both files already share (`decompose.mjs:329`
derives `repoRoot` from `path.dirname(dir)`, discovery.mjs's
`resolveDiscovery` can do the same).

**Rejected alternative:** a clarify-local reimplementation of the same
file-read. Rejected — pure duplication of decompose.mjs's already-correct
fail-open logic (missing docsRef, missing file, unreadable file all
degrade to `''`, never throw), violates DRY for zero behavioral gain.

**Skip-and-advance shape** (in `resolveDiscovery`, before calling
`judgeDiscovery`):
1. Compute `lockedContext = readLockedContext(repoRoot, work.docsRef)`.
2. If `lockedContext` is non-empty (D2 signal — applies to both
   `role: 'session'` and `role: 'runner'` per D3, no role branch):
   - `addDecision(dir, { id, text: 'discovery skip: trusted committed CONTEXT.md, no model call', source: 'resolveDiscovery', rationale: 'docsRef points at a non-empty CONTEXT.md (D2 trust signal, tsk-ozl) — skipping judgeDiscovery to avoid re-judging a decision already locked and approved' })`
     — mirrors `logDecomposeVerdict`'s audit-trail pattern
     (decompose.mjs:75-78) so `view.decisions`/`fgos list` readers can tell
     "skipped, trusted CONTEXT.md" apart from "model judged clear".
   - `addDiscovery(dir, { id, clear: true })` — keeps `view.discovery`'s
     existing shape/consumers intact (buildDiscoveryPrompt's own history
     section already renders a `clear=true` entry with no
     question/verify fine).
   - `moveStage(dir, { id, to: 'decompose', expectedStage: 'clarify', verify: FALLBACK_VERIFY, role })`
     — same fallback `judgeDiscovery`'s own clear-but-no-verify path
     already uses (discovery.mjs:262); a real `verify` is
     `fgos-coding-planning`'s job at the next stage regardless of which path
     produced the transition, so no new verify source is needed.
   - Return `{ outcome: 'clear', id, verdict: { clear: true, skipped: true } }`
     — the `skipped: true` field is additive, existing callers reading
     `outcome`/`id` are unaffected.
   - **Do not call `judgeDiscovery`** — this is the whole point, no model
     spawn on this path.
3. Else (no trust signal): fall through to the existing unconditional
   `judgeDiscovery` call, byte-identical to today.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `resolveDiscovery`'s new branch | medium — wrong signal check could silently skip a REAL judgment the sweep still needs (RUL19's guarantee) | unit test: sweep-role call on an item with no docsRef still calls the model (existing behavior byte-identical) |
| Skip path's `moveStage` call | low — reuses the exact same call shape the `clear: true` path already makes | unit test: skip path transitions `clarify` → `decompose` exactly once, CAS-safe (`expectedStage: 'clarify'`) |
| Skip path's `addDiscovery`/`addDecision` writes | low — additive, same store doors already in use elsewhere in this file/its sibling | unit test: `view.discovery`/`view.decisions` both gain the expected entries after a skip |
| `judgeDiscovery`'s blind path (untouched) | none — this plan does not touch it | n/a, regression-covered by existing `test/intake/discovery.test.mjs` cases |

**Files touched:**
- `src/intake/plan.mjs` — export `readLockedContext` (currently
  module-private).
- `src/intake/discovery.mjs` — import `readLockedContext`, add the
  skip-and-advance branch in `resolveDiscovery`, add `path`/`addDecision`
  imports as needed.
- `test/intake/discovery.test.mjs` — extend with skip-path cases (see
  Sketch below); this is the item's own `verify` command's target.

**Order:** single item, `fgos graph --json` shows tsk-ozl in a 2-item
component (`tsk-ozl`, `tsk-2b0`) and in `topUnblock` but not
`criticalPath` — no other queued item depends on this one finishing first,
and this item has no internal ordering choice to make (one file pair, one
branch). Order is moot for a single-piece item; noted per instructions,
not acted on.

**Impact-analysis gate:** `fgos tool query --capability impact-analysis
--status present` → GitNexus registered and `present` → posture **full**.
The MUST rules in this repo's `CLAUDE.md` apply as written at execution
time: run `impact({target: "resolveDiscovery", direction: "upstream"})`
(and on `judgeDiscovery`, `readLockedContext` once exported) before
editing, and `detect_changes({scope: "compare", base_ref: "main"})` before
committing.

## Shape (small-mode sketch)

Concrete cases to prove in `test/intake/discovery.test.mjs`, added to the
existing suite:
- **Skip fires:** item has `docsRef` set, `<docsRef>/CONTEXT.md` exists
  and is non-empty → `resolveDiscovery` returns `outcome: 'clear'`
  without invoking the judge executor; stage moves to `decompose`; a
  `discovery skip:` decision is logged.
- **Skip does not fire — no docsRef:** unchanged from today, model is
  called.
- **Skip does not fire — docsRef set but file missing/empty:** matches
  `readLockedContext`'s existing fail-open behavior (empty string) →
  falls through to `judgeDiscovery`, unchanged from today.
- **Both roles skip identically (D3):** the same skip fires whether
  `role` is `'session'` or `'runner'` — no role-conditional branch to
  test around, just confirm the call takes no role parameter in its
  guard.
- **Existing `judgeDiscovery` behavior regression check:** the
  fail-safe/clear/unclear branches already covered stay byte-identical
  when the trust signal is absent.

No split — this is one honest piece of work; proceeds as itself.

## Execution note

Per the locked decision that Execute and its verify already have a
working mechanical path, this plan does not redesign that — it only names
the one command that proves the piece done:

```
node --test test/intake/discovery.test.mjs
```

(the item's stored `verify` from the live `clear` verdict,
`npm test src/intake/discovery.test.mjs`, points at the wrong path AND the
wrong invocation — the real test file is `test/intake/discovery.test.mjs`,
and `npm test <path>` does not scope the suite: the `test` script hardcodes
`node --test 'test/**/*.test.mjs'`, so npm appends the path as an
*additional* target rather than filtering to it — confirmed by actually
running it during `fgos-coding-validating` (ran the full 1919-test, 111.8s suite
instead of the intended file). `node --test <path>` directly is the real
scoped command — confirmed: 36 tests, ~1s, all passing today as the
pre-change baseline. `fgos-coding-implement` should use the corrected command
above.)
