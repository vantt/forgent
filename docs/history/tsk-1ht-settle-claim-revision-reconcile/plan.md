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
after the claim's own `acquiredAt` timestamp. If every one of those
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

**Impact-analysis posture:** `full` — `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present` on this machine. No direct GitNexus MCP query tool was available
in this session's toolset to run a live symbol query, so the blast-radius
claims above were cross-checked directly with `rg -n "settleClaim\("` /
`rg -n "getItemDurableRevision\("` across `src/` and `bin/` instead (full
results recorded in RESEARCH.md round 1) — per the CLAUDE.md gate, a
`present` posture is not a guarantee of complete per-file coverage, so this
substitution is noted here rather than silently assumed equivalent.

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

## Outstanding questions

None
