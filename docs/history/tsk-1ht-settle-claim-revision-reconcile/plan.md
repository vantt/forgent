# Plan — tsk-1ht: settleClaim revision-CAS reconcile

Mode: high-risk

Flags counted (per `fgos-routing`'s Mode gate): data model (claim/settle
coordination internals), public contracts (`fgos return`'s own
success/refuse semantics change for a real, previously-refusing case),
existing covered behavior (`test/state/runtime-coordination.test.mjs`
already asserts the exact refuse behavior being loosened), weak proof
around the distinguishing case (see RESEARCH.md round 1, point 5 — no
existing test constructs a genuinely different-writer conflict). Also
trips the hard-gate trigger on its own: this change **loosens an existing
validation** (the unconditional CAS refuse) — any single hard-gate flag
forces `high-risk` regardless of count. No CONTEXT.md exists for this item
— discovery's verdict was `clear`, which skips `exploring` by design; there
is nothing to cite from that stage.

## Approach

**Chosen path.** Give `settleClaim` (`src/state/store.mjs:1101-1105`) a
reconcile branch instead of an unconditional refuse: when
`curRev !== freshClaim.preClaimRevision`, before throwing, scan
`readRawEvents(dir)` (`src/state/store.mjs:1998`) for every event whose
payload references this item's `id`, filtered to those appended strictly
after the claim's own `acquiredAt` timestamp. **Implementation detail
confirmed at Repo fit (validating Step 2):** raw events stamp `ts` as
`Date.now()` (a numeric epoch-ms — `src/state/store.mjs:2018`'s
`appendEventLocked`), while `claim.acquiredAt` is stored as
`new Date().toISOString()` (`src/state/runtime-coordination.mjs:214,242`)
— an ISO string, not a number. The reconcile branch must convert
(`new Date(freshClaim.acquiredAt).getTime()`) before comparing to
`event.ts`; comparing them directly (string vs number) would silently
never filter anything. If every one of those
events carries `payload.writer.id === freshClaim.writerId` (the SAME
writer that holds this claim — `resolveWriterIdentity`'s stamp, already
present on every mutating event per RESEARCH.md round 1 point 4), the
drift is self-caused: accept `curRev` as reconciled (proceed exactly as if
the check had matched) and record the reconcile via `fgos decision`-style
provenance so it's visible later, never silent. If even one event in that
window carries a different writer id, keep refusing exactly as today —
this preserves the genuine-conflict case the existing tests (RESEARCH.md
point 5) already lock in, even though those tests never actually
constructed a second writer.

**Alternatives rejected.**
- *Change `getItemDurableRevision` itself* (e.g. hash a narrower subset of
  the item) — rejected: that function is also used by
  `src/runner/claim-port.mjs:306` to snapshot `preClaimRevision` at claim
  time for a different purpose (staleness detection at acquire), and
  narrowing its hash there would silently weaken that unrelated check too.
  Keeping `getItemDurableRevision` untouched and adding the reconcile logic
  as a NEW, settle-time-only helper keeps the blast radius contained to
  `settleClaim`.
- *Trust "only the claim holder can write while claimed"* and skip
  reading events entirely — rejected: RESEARCH.md round 1 point 3 found NO
  write-time guard anywhere that actually prevents a different writer from
  calling `editWork`/`moveWork` on a claimed item today. That assumption
  is false in the current codebase, so the reconcile MUST check real event
  provenance rather than assume single-writer exclusivity.
- *Auto-reconcile always, drop the CAS check entirely* — rejected: this is
  exactly what §16.3 of `docs/architect/doing-coordination-redesign.md`
  forbids ("fails or goes through explicit reconcile" — never "never
  fails"); a genuine concurrent-actor conflict must still refuse.

**Risk map.**

| Component | How risky | What proves it |
|---|---|---|
| `settleClaim`'s new reconcile branch | High — sits on the same critical path every `fgos return`/`fgos catchup` call goes through (blast radius confirmed: `bin/fgos.mjs` return path ×5 call sites, `src/runner/loop.mjs` ×4 call sites — the headless runner daemon's own automated attestation/verify settle path too) | Full existing `test/state/runtime-coordination.test.mjs` suite green (regression net for every currently-passing conflict/settle case), PLUS a new test with two distinct `writerId`s that must still refuse |
| Reading `events.jsonl` inside the already-locked settle critical section | Medium — must not introduce a second lock acquisition or reopen the TOCTOU window `tsk-40m`'s own comments (store.mjs:1070-1078) already closed | `readRawEvents` is a plain read, called from inside the same `withEventsLockAndRefresh`/`withClaimsLock` block already held at this point (store.mjs:1068-1069) — no new lock needed; confirm by re-reading that block before editing |
| `getItemDurableRevision`/`claim-port.mjs` | Low — explicitly NOT touched by this fix (see Alternatives rejected) | No diff in `runtime-coordination.mjs`'s existing exports; `claim-port.mjs` needs no test changes |

**Impact-analysis posture:** `degraded` — `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present` on this machine (re-confirmed at validating time,
2026-08-26T08:40Z), but a live PostToolUse hook flagged the index itself
as stale at commit `7bb3231`, and `git diff --stat 7bb3231 HEAD --
src/state/store.mjs src/state/runtime-coordination.mjs` shows +1073/-117
and +343 lines respectively since that index — both files this plan
depends on have been rewritten well past what GitNexus last saw. Per the
CLAUDE.md gate, `present` never implies fresh, so this is named plainly as
`degraded`, not `full`. The evidence this plan actually relies on is the
direct cross-check instead: `rg -n "settleClaim\("` / `rg -n
"getItemDurableRevision\("` across `src/` and `bin/`, read against the
CURRENT file contents (not GitNexus's stale graph) — full results recorded
in RESEARCH.md round 1. This substitution is the honest gap, not a silent
equivalence.

**Files touched, in order:**
1. `src/state/store.mjs` — add the reconcile branch inside `settleClaim`
   (around line 1101-1106), reusing `readRawEvents` already imported/used
   elsewhere in this file.
2. `test/state/runtime-coordination.test.mjs` — add the new two-writer
   test (RESEARCH.md point 5's gap); leave every existing test unchanged
   as the regression net.
3. `docs/history/tsk-1ht-settle-claim-revision-reconcile/plan.md` — this
   file (already written).

No dependency graph ordering applies: `fgos graph --json` shows `tsk-1ht`
in its own size-1 connected component (`deps: []`, nothing depends on it),
so there is no cross-item sequencing to honor.

## Shape

Single, focused fix — not split into multiple items (see "Decide the
split" below). Concrete cases to prove, scaled to `high-risk`:

- **Same-writer drift, single edit** — claim → one `fgos edit` (same
  writer) → `fgos return` succeeds (the tsk-1sl repro, minimal form).
- **Same-writer drift, multiple edits across stages** — claim → `fgos
  edit`(tier/kind/risk) → `fgos discover` → `fgos edit`(docsRef) → `fgos
  gate-approve` → `fgos plan` → `fgos return` succeeds (tsk-1sl's full
  reported sequence).
- **Genuine cross-writer conflict still refuses** — claim under writer A →
  a durable edit stamped with a DIFFERENT writer id lands on the item →
  `fgos return` (as writer A) still throws `StoreError('conflict', ...)` —
  the new regression test this plan requires.
- **Existing status-drift and claimId-mismatch checks untouched** — the
  pre-existing checks at store.mjs:1039-1043 (claimId) and 1064-1065/1086-
  1088 (settling writer identity) are orthogonal to this fix and must keep
  behaving exactly as today; the full existing suite is the proof.
- **No event exists yet for a claim with no prior writes** (the common,
  unmodified case) — revision matches, no reconcile branch even entered;
  must stay a no-op, same as today.

## Decide the split, if any

No split. This is one honest, contained piece: a single reconcile branch
in one function plus its regression test. Nothing here has an
independently shippable sub-piece — splitting a ~10-20 line conditional
and its one test into multiple work items would be pure ceremony.

## Leave execution alone

One command proves this piece done — the full coordination regression
suite, since the whole point is "existing conflict-refusal behavior
unchanged AND the new same-writer/cross-writer distinction both hold":

```
node --test test/state/runtime-coordination.test.mjs
```

The live end-to-end repro (`fgos pick` → several same-writer `fgos edit`/
`fgos discover`/`fgos plan` calls → `fgos return` succeeding, tsk-1sl's own
sequence) is the human-facing confirmation `fgos-coding-implement` should
still run once, per the item's own Verify text — but the single command
recorded on `work.verify` (synced below) is the mechanical one `fgos
return` re-checks.

## Reality gate (fgos-coding-validating)

| Dimension | Verdict | Citation |
|---|---|---|
| Mode fit | PASS | `high-risk` matches the hard-gate trigger this fix itself trips (loosening an existing validation) per `fgos-routing`'s Mode gate — not over/under-built |
| Repo fit | PASS | Every claimed line re-read directly: `store.mjs:1101-1105` (settleClaim's refuse), `store.mjs:1998` (`readRawEvents`, confirmed a plain read — no lock of its own, per its own doc comment "never appends, never rebuilds the view"), `store.mjs:2018` (`ts: Date.now()`), `runtime-coordination.mjs:214,242` (`acquiredAt: new Date().toISOString()`) — the ts-format mismatch this surfaced is now folded into Approach above |
| Assumptions | PASS | "No write-time guard blocks a different writer" — confirmed via `rg -n "writerId" src/state/store.mjs`, only settleClaim itself checks it (RESEARCH.md point 3). "Every mutating event stamps `payload.writer`" — confirmed by direct read of 6+ call sites (RESEARCH.md point 4) |
| Smaller path | PASS | Considered stamping a `lastWriterId` onto the claim record on every edit instead of scanning events — rejected: that touches every mutating function in `store.mjs`, a strictly bigger footprint than a read-only scan of data (event `writer` stamps) that already exists |
| Proof surface | PASS | `work.verify` synced to `node --test test/state/runtime-coordination.test.mjs` — real, runnable, already executed once as a baseline (see Feasibility matrix) |
| Impact-analysis posture | DEGRADED (named, not blocking) | `fgos tool query --capability impact-analysis --status present` → present, but a live PostToolUse hook flagged the GitNexus index stale at `7bb3231`, and `git diff --stat 7bb3231 HEAD -- src/state/store.mjs src/state/runtime-coordination.mjs` shows +1073/-117 and +343 lines since — both files this plan touches were rewritten past what the index last saw. Direct `rg` cross-check substituted (RESEARCH.md point 3, this file's own Files-touched section) |

## Feasibility matrix

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| Existing conflict/settle test suite is green before this change (regression net is real, not assumed) | High | Actual test run, real output | `node --test test/state/runtime-coordination.test.mjs` run directly: 21/21 pass, 0 fail (see command output, this session, 2026-08-26T08:4x) | PASS |
| No write-time guard today lets a non-claim-holder writer edit a claimed item (so the reconcile MUST check real event provenance, never assume single-writer exclusivity) | High | Direct grep of every `writerId`-checking site in `store.mjs` | `rg -n "writerId" src/state/store.mjs` → only lines 1064-1066/1086-1088, both inside `settleClaim` itself, checking the SETTLER not the editor | PASS |
| Every mutating event already carries `payload.writer` (the reconcile's core data source) | High | Direct read of the event-append call sites | `store.mjs` lines ~468 (`work.edit`), ~502, ~712, ~1401, ~1496, ~1533 all show `payload.writer = resolveWriterIdentity(dir)` before `appendEventLocked` | PASS |
| `readRawEvents` is safe to call from inside settleClaim's already-held `events.lock`/`claims.lock` critical section (no re-entrant lock, no deadlock) | High | Read the function body and its own doc comment | `store.mjs:1998`, `readRawEvents(dir) { return readAllEvents(dir); }`, doc comment directly above: "this accessor never appends, never rebuilds the view" — a plain read, no lock acquisition | PASS |
| Blast radius of touching `settleClaim`/`getItemDurableRevision` is fully known, despite the GitNexus index being stale for these exact files | Medium (impact-analysis posture: degraded, named per Reality gate row above) | GitNexus query (unavailable/stale) or a direct grep cross-check | `rg -n "settleClaim\("` across `src/`,`bin/`: `bin/fgos.mjs` ×5 (return path), `src/runner/loop.mjs` ×4 (the headless runner's own attestation/verify settle path), `store.mjs`'s own internal delegate ×1. `rg -n "getItemDurableRevision\("`: one external caller, `src/runner/claim-port.mjs:306` (claim-acquire time, untouched by this fix) | PASS WITH CONSTRAINT — gap named plainly per gate rule, not silently dropped |

## Decide

**READY WITH CONSTRAINTS.** Every reality-gate dimension passes; the one
constraint (impact-analysis posture is `degraded`, not `full`) is named
plainly above rather than silently assumed away, and the direct-grep
substitute evidence is real and specific enough that the constraint does
not block — it is carried forward as a note for whoever implements this,
in case a symbol this plan did not find surfaces during the actual diff.
No T1 (competing options), T2 (CONTEXT.md contradiction — none exists;
this item skipped `exploring`), or T3 (unwritable child spec — no split)
trigger fired. Cost verdict: **REVERSIBLE** (the ts-format fix and the
degraded-posture note are both already folded into the plan itself, not
left as open risk).

## Outstanding questions

None
