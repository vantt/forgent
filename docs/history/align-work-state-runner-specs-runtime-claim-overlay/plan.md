# Plan — tsk-4kn: align work-state/runner specs with runtime claim overlay

Mode: tiny

Flags checked against fgos-routing's Mode gate (auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof, multi-domain): 0 apply. Docs-only
prose correction, no schema/behavior change, real verify already green
(47/47, see RESEARCH.md). `criticalPath`/`topUnblock` (`fgos graph --json`)
carry no entry for `tsk-4kn` — no other item depends on this one, no
cross-item ordering to honor.

## Approach

Correct the two spec files' claim-mechanics prose to match the current
runtime-claim-overlay design (`src/state/runtime-coordination.mjs`,
`src/runner/claim-port.mjs`, `src/state/store.mjs`'s `settleClaim`,
`src/runner/loop.mjs`'s `startupReap`) instead of the retired
durable-`todo→doing`-write model. No alternative approach considered — the
task is a direct prose correction against already-confirmed evidence
(RESEARCH.md Round 1), not a design decision.

Files touched, in order:

1. `docs/specs/work-state.md` — the more foundational of the two specs
   (owns the FSM/claim primitives runner.md's own claim prose points back
   to). Sections to correct:
   - "Cửa pull giao–nhận việc (take/return)" (`:512-554`): the `take`
     bullet's *"Chuyển `todo → doing` qua đúng CAS sẵn có... vào CÙNG sự
     kiện đó"* line — replace with: claim acquires a runtime claim record
     (`.fgos/runtime/claims/<id>.json`, gitignored) via `claimWork`/
     `acquireClaim`, durable status stays at pre-claim value (`todo`, or
     `blocked` for a branch-source reclaim); `doing` is the **effective**
     status the overlay (`buildEffectiveView`) derives while that claim is
     active, never a durable write at claim time. The `return` bullet's
     *"Verify xanh → `doing → awaiting-approval`"* / *"Verify đỏ → `doing
     → blocked`"* lines — reframe as `settleClaim` transitioning DIRECTLY
     from the claim's recorded `preClaimStatus` to `finalStatus`
     (`awaiting-approval`/`blocked`), never through a durable intermediate
     `doing`.
   - Data Dictionary #4 (`status`, `:47`) and #14 (`claimRole`, `:57`):
     add one sentence distinguishing durable status (the folded event-log
     view) from effective status (durable status overlaid with an active
     runtime claim) — the formula `effectiveStatus(item) = activeClaim(item.id)
     ? 'doing' : durableStatus(item)`. `doing` remains a legal FSM value
     (legacy data, and the fallback path below) but a NEW claim never
     durably writes it.
2. `docs/specs/runner.md` — the sections that read the corrected primitive
   from (1):
   - "Một vòng --once" (`:57`): *"việc đầu frontier được claim (`todo→doing`
     có kỳ vọng)"* — correct to describe an acquired runtime claim, durable
     status unchanged at claim time.
   - Entry-points line `:18` and `:21` (reap/claim framing) — same
     correction, one sentence each, pointing at the corrected "Gặt-lại lúc
     khởi động" section below rather than restating it.
   - "Gặt-lại lúc khởi động (reap — phục hồi sau crash)" (`:188-192`) — the
     section acceptance calls out by name. Rewrite to describe BOTH passes
     `startupReap` (`src/runner/loop.mjs:380-502`) actually runs:
     1. Primary pass over active runtime claims (`readClaims`) — a claim
        whose `claimRole`/`actor` is `human`/`session` is skipped entirely
        (pull-door claim, reap never touches it, unchanged conclusion from
        today's prose); every other (runner) claim resolves via
        `settleClaim(..., finalStatus, role: 'runner')` straight from its
        `preClaimStatus` to `awaiting-approval`/`blocked` — no durable
        intermediate `doing`.
     2. Fallback pass over items still carrying a **durable** `status:
        'doing'` with NO active runtime claim (legacy pre-migration data,
        or any other path that still leaves one) — this pass alone still
        uses the old `moveWork(..., expectedStatus: 'doing', ...)`
        mechanism directly, since there is no claim record to settle.
        Same human/session `claimRole` skip applies.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Prose accuracy vs. code | low (mechanical, tiny) | RESEARCH.md Round 1 citations (file:line for every claim); no medium/high entry, no impact-analysis proof point needed (docs-only, no blast radius). |
| Test coupling | none | `docs/specs/*.md` are prose, not consumed by any test; the named verify (`test/state/runtime-coordination.test.mjs` + `test/runner/claim-port.test.mjs`) exercises the CODE the docs now describe, confirming the prose target is accurate, not that the docs themselves changed test behavior. |

## Shape

Direct edit of the two files at the sections named in Approach above —
no new sections, no schema/heading restructuring beyond what's needed to
add the durable-vs-effective-status distinction. Concrete cases the
corrected prose must not omit:

- A `take`/`pick` claim on an already-`blocked` item with a live `fgw/<id>`
  branch (branch-source reclaim) — durable status stays `blocked`, not
  `todo`, while claimed.
- A stale/orphaned claim (`buildEffectiveView`'s `claimIsStale`) — a claim
  whose `preClaimStatus` no longer matches current durable status is NOT
  overlaid as `doing`; the durable status shows through instead. Worth one
  sentence in work-state.md so a reader doesn't assume an active claim
  file always means `doing`.
- `settleClaim` with `finalStatus === preClaimStatus` — writes no durable
  `work.move` at all (nothing to move), only `work.attempt` — relevant to
  the "Bản ghi settlement"/outcome prose already in work-state.md, worth
  a one-line cross-reference, not a rewrite of that section.

## Outstanding questions

None
