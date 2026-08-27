# Plan — tsk-2tr: Extract dispatch result normalization ladder

Mode: small

Flags counted per `fgos-routing`'s Mode gate: only "existing covered
behavior" applies (this touches the already-tested result-assembly block
inside `executeExecutorCli`, `RESEARCH.md` round 1) — 1 flag → small (a
few files, no gray areas; the extraction target and its exact current
behavior are already fully characterized by research, nothing left
open).

`fgos graph tsk-2tr --json`: tsk-2tr is its own size-1 component (no
deps, no dependents) — fully isolated, no cross-item ordering to honor.

## Approach

**Chosen path**: extract the result-assembly block currently inline at
the tail of `executeExecutorCli` (`src/runner/dispatch/cli.mjs:516-529`,
confirmed by `RESEARCH.md` round 1) into a small, pure, independently
testable helper in a new sibling module
`src/runner/dispatch/result-ladder.mjs`, and have `executeExecutorCli`
call it instead of inlining the logic. No behavior change — this is a
pure choke-point extraction, not a redesign.

**Why a sibling module, not a section within `cli.mjs`**: `cli.mjs` is
934 lines and already carries executor resolution, lock acquisition, and
adapter dispatch; a pure result-normalization function has no dependency
on any of that (it only needs `result`, `headBefore`, `headAfter`,
`lostUncommittedPaths`) and is naturally unit-testable in isolation once
separated — matching the item's own acceptance bar ("test riêng").

**Alternatives rejected**:
- *Leave it inline, just add more unit tests* — rejected: the item's own
  goal is explicitly "tách thành helper nhỏ", not just more coverage on
  the existing shape.
- *Add a `confidence` field alongside `outcome`* — rejected per the
  item's own acceptance criterion ("chưa thêm confidence field nếu chưa
  có reader") — `RESEARCH.md` confirmed no caller reads such a field
  today, so adding one would be write-only telemetry, explicitly
  disallowed.
- *Rename the shape to a literal `reported`/`legacy-signal`/`inferred`
  three-key object* — rejected: `RESEARCH.md` found this terminology is
  the item's own descriptive framing, not existing code vocabulary or an
  existing reader's contract. The extraction preserves the current flat
  merge shape (`{ outcome?, headBefore?, headAfter?, verifiedSha?,
  lostUncommittedPaths?, ... }`) byte-for-byte; only *where* the logic
  lives changes, not the returned shape.

**Risk map**:

| Component | Risk | What proves it |
|---|---|---|
| Backtick/quote false-positive guard | low | existing test `dispatch.test.mjs:3439-3470` (quoted-only + quoted-and-real-DONE cases), re-run unchanged after extraction |
| Unsignaled fallback (headBefore/headAfter) | low | existing test `dispatch.test.mjs:3368-3383` |
| `verifiedSha` gating (DONE-only) | low | existing test `dispatch.test.mjs:3414-3437` |
| Herdr sentinel vs. worker signal | low | herdr sentinel is stripped inside `transport.mjs` before `result.stdout` reaches this code (RESEARCH.md finding 1) — extraction touches none of that; new unit test adds direct proof at the helper level (a stdout containing a `__fgos_herdr_exit_...`-shaped string but no `[DONE]`/`[BLOCKED]` must still resolve `unsignaled`, never mistaken for a signal) |

All four risk items are low (existing green tests + one new direct unit
test) — no proof point requiring blast-radius/impact-analysis evidence is
needed for a same-module, no-external-dependency extraction like this
one; the `impact-analysis` capability gate is therefore not invoked here
(nothing in this plan leans on blast-radius evidence).

**Files touched, in order**:

1. `src/runner/dispatch/result-ladder.mjs` (new) — the extracted pure
   helper.
2. `src/runner/dispatch/cli.mjs` — replace the inline block
   (`executeExecutorCli`, currently lines ~516-529) with a call to the
   new helper; add the import.
3. `test/runner/dispatch.test.mjs` — add direct unit tests for the new
   helper (backtick-strip, unsignaled+heads, verifiedSha gating, herdr-
   sentinel-shaped-but-unsignaled stdout); the four existing integration
   tests at lines 3368-3470 stay as regression proof through
   `executeExecutorCli` and need no edits.
4. `docs/history/extract-dispatch-result-normalization-ladder/plan.md`
   (this file).

## Shape

Single piece, no split (Step 4: one honest piece already covers the
whole item — a same-module extraction with a fixed, narrow scope and a
verify command already naming exactly the two test files this touches).

Concrete cases the new unit tests must prove, matching the item's own
acceptance criteria one-to-one:

- `[DONE]`/`[BLOCKED]` present in raw (non-quoted) stdout → signaled,
  `outcome`/`headBefore`/`headAfter` omitted (mirrors
  `dispatch.test.mjs:3385-3412`, at the helper level).
- `[DONE]`/`[BLOCKED]` present ONLY inside backtick fences → treated as
  absent, `outcome: 'unsignaled'` with real `headBefore`/`headAfter`
  (mirrors `dispatch.test.mjs:3439-3470`).
- No `[DONE]`/`[BLOCKED]` anywhere → `outcome: 'unsignaled'` +
  `headBefore`/`headAfter` (mirrors `dispatch.test.mjs:3368-3383`).
- `isDone && headAfter` → `verifiedSha` set to `headAfter`; `[BLOCKED]`
  never gets one (mirrors `dispatch.test.mjs:3414-3437`).
- Stdout containing a herdr-shaped exit sentinel string
  (`__fgos_herdr_exit_...`) but no `[DONE]`/`[BLOCKED]` → still
  `unsignaled`, never misread as a signal (new case, direct proof of the
  item's own "herdr sentinel không bị lẫn với worker signal" acceptance
  line).
- No new `confidence` (or similarly-named) field appears anywhere in the
  helper's return shape (asserted by checking `Object.keys` on a couple
  of the above cases, or simply: no test ever reads such a field, and the
  helper's own source has none).

## Outstanding questions

None
