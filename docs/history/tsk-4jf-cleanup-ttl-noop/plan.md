# tsk-4jf — plan

## Mode

Flags counted against the mode gate:
- auth / authorization / data model / audit-security / external systems /
  cross-platform / multi-domain: none apply.
- existing covered behavior: YES — `assessCleanupReadiness`
  (`src/state/cleanup-harness.mjs`) and the `cleanup` verb's `case
  'cleanup':` branch (`bin/fgos.mjs`) are both exercised today by
  `test/state/cleanup-harness.test.mjs`, `test/state/cleanup-pool.test.mjs`,
  and `test/cli/fgos.test.mjs` (lines 8450-8480+).
- weak proof around the area: no — the area is already well covered,
  this plan extends existing coverage rather than backfilling a gap.

1 flag → **small**: a few files, no gray areas (CONTEXT.md D1-D5 already
closed every product-level question; what remains is mechanical).

## Approach

Per CONTEXT.md D1-D3, split the TTL check out of the D8 harness so
"not ready yet" (TTL) and "actually failed" (D8's two gate checks) are
distinguishable, and make `cleanup`'s TTL-only case a no-op instead of a
`blocked` park.

Rejected alternative: keep the caller-side guard (`cleanup-pool.mjs`)
as the only fix. Rejected in CONTEXT.md's own scout evidence — 3/6
historical park events happened AFTER that guard (tsk-dvc) shipped,
through a different caller. One-door-write (CTR001) requires the fix in
the verb itself.

### Files touched, in order

1. `src/state/cleanup-harness.mjs` — `assessCleanupReadiness` (line 123):
   return `{ notReadyYet, failed }` instead of `{ ready, reasons }`.
   `checkCleanupTTLElapsed`'s failure goes to `notReadyYet`;
   `checkRetrospectiveContent`/`checkMergeStillResolves` failures go to
   `failed`. This is the risk-bearing change (existing covered behavior) —
   proof point: `node --test test/state/cleanup-harness.test.mjs` covering
   all 4 combinations of {TTL elapsed/not} x {D8 checks pass/fail}, carried
   to `fgos-coding-validating`.
2. `bin/fgos.mjs` — `case 'cleanup':` (line ~1056-1098): read the new
   `{ notReadyYet, failed }` shape.
   - `failed` non-empty → `cleanup -> blocked` exactly as today (unchanged
     `reason` string, still every failing check joined — TTL text included
     only when TTL is ALSO among the reasons being reported, to keep
     `test/cli/fgos.test.mjs`'s existing "reason joined" test, line
     8463-8480, passing unmodified: that test's fixture has both TTL not
     elapsed AND no retrospective content, i.e. `failed` non-empty, so it
     stays on the `blocked` path either way).
   - `failed` empty AND `notReadyYet` non-empty → no-op: no `moveWork`
     call, no new event, item stays at `cleanup`. Return shape: the
     implementer's call (CONTEXT.md's own "Outstanding" note) — a plain
     `{ id, to: 'cleanup', noop: true, reasons: notReadyYet }` is the
     obvious default, matching this verb's existing envelope shape
     (`id`/`to`/`reason(s)` fields already used by the other two branches).
   - Proof point: a new CLI-level test in `test/cli/fgos.test.mjs` proving
     TTL-not-elapsed-alone produces zero `work.move` events (the
     `eventLines(cwd).length` before/after pattern already used at
     lines 1609-1626), carried to `fgos-coding-validating`.
3. `src/state/cleanup-pool.mjs` — update the TTL pre-filter's comment
   (lines 1-10, 17-22) to say plainly it is now a scheduling optimization,
   not the correctness guard (CONTEXT.md D3). No behavior change — the
   filter logic itself is untouched, so no new proof point beyond keeping
   `test/state/cleanup-pool.test.mjs` green.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `assessCleanupReadiness` return shape | medium — two call sites read it (`bin/fgos.mjs`, indirectly `cleanup-pool.mjs` via `checkCleanupTTLElapsed` which is untouched) | 4-combination unit test, `fgos-coding-validating` confirms both call sites updated together |
| `case 'cleanup':` no-op branch | medium — new code path, first no-op ever added to this verb | CLI-level test asserting zero events on TTL-not-elapsed-alone |
| `blocked` branch's existing reason-join behavior | low — must stay byte-compatible with `test/cli/fgos.test.mjs:8463-8480` | that existing test, unmodified, still green |
| `cleanup-pool.mjs` comment | none — comment-only | `test/state/cleanup-pool.test.mjs` still green |

Impact-analysis capability gate, re-checked at `fgos-coding-validating` (not just
`fgos tool query --status present`, which only proves the tool is
installed): GitNexus's own index reports `lastCommit: 251d0b5` while this
branch's HEAD is `5d5b5cc` — the index is behind, so posture is
**impact-analysis: degraded**, not `full` as first recorded during
clarify (correction). `impact({target: "assessCleanupReadiness",
direction: "upstream"})` on the stale index returned `impactedCount: 0`
— a suspicious zero given `bin/fgos.mjs` imports and calls it directly.
Cross-checked with `rg -n "assessCleanupReadiness" bin src`: exactly one
real caller, `bin/fgos.mjs:1073` inside `case 'cleanup':` — matching this
plan's own risk map exactly, no wider blast radius than already assumed.
The gap is real (stale index undercounts) but does not change this plan's
scope: the grep cross-check is the accepted evidence for this item's
medium-risk rows, not the tool's own (stale) answer.

## Split decision

No split. This is one honest piece of work — three files, one shared
concern (TTL vs. D8 separation), already scoped to a single item by the
parent `tsk-1q1`'s own decomposition. `plan.md`'s own mode (`small`)
confirms a further split would be churn, not clarity.

## Assumptions (not material enough to reopen CONTEXT.md)

- No-op return shape (`{ id, to: 'cleanup', noop: true, reasons: ... }`)
  is an implementation detail, not a locked field name — `fgos-coding-validating`
  or execution may adjust field names as long as the no-op behavior
  (no `moveWork`, no event) holds.
- The `blocked` branch continues to join ALL failing reasons (both
  `notReadyYet` and `failed`) into one string when `failed` is non-empty,
  preserving `test/cli/fgos.test.mjs:8463-8480` byte-for-byte — this is
  the only reading of CONTEXT.md D2's "reason ghép như hiện tại" that
  doesn't silently break an existing, currently-passing test.

## Verify (this item, whole)

```
node --test test/state/cleanup-harness.test.mjs test/state/cleanup-pool.test.mjs test/cli/fgos.test.mjs
```
