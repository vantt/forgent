# Research — tsk-4kn: align work-state/runner specs with runtime claim overlay

## Round 1 (2026-08-26, discovery stage, fgos-coding-discovering)

**Asked:** Do `docs/specs/runner.md` and `docs/specs/work-state.md` currently
describe claim (`take`/`pick`) as a durable `todo → doing` write? What is
the actual current behavior of `claimWork`, `runtime-coordination.mjs`,
and `settleClaim`? How does startup reap treat session/human claims today?

**Checked (repo):**

- `docs/specs/work-state.md:527` — "Cửa pull giao–nhận việc (take/return)":
  *"Chuyển `todo → doing` qua đúng CAS sẵn có, gắn thêm `role`... vào CÙNG
  sự kiện đó"* — describes claim as writing a durable CAS-guarded
  `todo→doing` event. Same section (`:543-549`) describes `return` as
  `doing → awaiting-approval` / `doing → blocked` off a durable `doing`.
  Outdated against current code (below).
- `docs/specs/runner.md:57` — "Một vòng --once (hạnh phúc)": *"việc đầu
  frontier được claim (`todo→doing` có kỳ vọng)"*. `:18` (reap) and `:21`
  (`take`/`return`) carry the same durable-`doing` framing. `:188-192`
  ("Gặt-lại lúc khởi động") describes reap purely in terms of durable
  `status: 'doing'` — no mention of the runtime claim overlay at all.
- `src/state/runtime-coordination.mjs:1-6` (module header) — *"Separates
  live claim/doing coordination from the durable append-only eventlog...
  Active claims live under `.fgos/runtime/claims/<id>.json` (gitignored).
  Effective view derives: `effectiveStatus(item) = activeClaim(item.id) ?
  'doing' : durableStatus(item)`."*
  - `acquireClaim` (`:179-253`) writes ONLY a runtime claim file — no
    durable event.
  - `buildEffectiveView` (`:295-343`) — overlays `status: 'doing'` onto
    the durable item ONLY when an active, non-stale claim exists; a
    claim whose `preClaimStatus` no longer matches the current durable
    status is treated as stale/orphaned (`claimIsStale`, `:311-315`) and
    NOT overlaid.
- `src/runner/claim-port.mjs:110-371` (`claimWork`, the one choke-point for
  take/pick/runner-claim) — comment at `:4-7`: *"acquireClaim (runtime
  claim only — tsk-40m retired the durable moveWork(to:'doing') claim-time
  write entirely; doing is derived purely from the active-claim
  overlay)"*. The CAS check at claim time (`:297-305`) validates against
  the item's durable **pre-claim** status (`todo`, or `blocked` for a
  branch-source reclaim) — never `doing`.
- `src/state/store.mjs:1073-1220` (`settleClaim`) — doc comment: *"Settle
  an active runtime claim on item `id`, transitioning it DIRECTLY from its
  preClaimStatus to `finalStatus`... no durable intermediate
  work.move(->doing) leg."* Writes `work.attempt` always, and a single
  `work.move(preClaimStatus->finalStatus)` UNLESS `finalStatus ===
  preClaimStatus` (nothing to durably move) — then releases the runtime
  claim in the same critical section. Confirms: durable settlement goes
  **pre-claim status → final status directly**, `doing` never lands as a
  durable value for a new-style claim.
- `src/runner/loop.mjs:380-502` (`startupReap`) — two passes:
  1. `:386-443` — iterates **active runtime claims** (`readClaims`).
     Claims whose `claimRole`/`actor` is `human` or `session` are skipped
     entirely (`:391`, untouched — this is the pull-door claim, never
     reaped). Everything else (runner claims) is resolved via
     `settleClaim(..., finalStatus, role: 'runner')` straight to
     `awaiting-approval` or `blocked` — no intermediate durable `doing`.
  2. `:446-502` — a **fallback scan for legacy durable `status: 'doing'`
     items with no active runtime claim** (pre-migration data, or any
     other path that still leaves a durable `doing`) — this branch alone
     still uses `moveWork(dir, { id, to, expectedStatus: 'doing', ... })`
     directly against the durable status, exactly the old mechanism.
     Also skips `claimRole` human/session.
- `docs/architect/doing-coordination-redesign.md` (950 lines, `tsk-40m`
  design doc, "design target confirmed 2026-08-25") — full design source
  for all of the above; §6.1–6.4 (durable vs effective status), §9
  (required flows incl. first claim / return / reclaim), §11 (CAS rules)
  match the code read above exactly. No dedicated reap section in the doc
  itself — reap's actual behavior was read directly from
  `loop.mjs:380-502` (above), which is authoritative.
- `test/state/runtime-coordination.test.mjs` + `test/runner/claim-port.test.mjs`
  — 47/47 pass on current HEAD (`node --test` run, 2026-08-26). Exercises
  exactly the behaviors above (acquire/settle/stale-claim/effective-view/
  reclaim). This is the real, runnable verify the task text already named.

**Verdict:** `clear`. The task's own description (`claimWork` no longer
durably writes `doing`; `doing` is the effective status from an active
runtime claim overlay; durable settlement goes straight from pre-claim
status to final status) matches the code exactly. The two spec files'
current prose (cited above) is stale against this. Classification: `kind`
corrected from mechanical-submit default `bug` to `docs` (no code/behavior
is touched, `docs/specs/*` only) — `tier`/`risk` (`light`/`light`) already
match the evidence (two-file prose edit, no schema/behavior change).

**Verify carried forward:**
`node --test test/state/runtime-coordination.test.mjs test/runner/claim-port.test.mjs`

## Round 2 (2026-08-26, discovery stage, resubmit after tsk-38i-class truncation loss)

**Asked:** Does Round 1's evidence still hold for the resubmitted item?

**Checked:** Same `fgw/tsk-4kn` branch, same commits (`ef2dd826`, `cff86806`,
`83eb4065`, `8d28f3ba`) — nothing in the repo's own code changed between
Round 1 and this resubmission (same session, minutes apart, no other
commit landed on `main` in between per `git log`). The doc corrections
from `83eb4065`/`8d28f3ba` are already committed on this exact branch and
were independently re-verified by the driving session (diff read in full,
one stray-English-word typo fixed and committed, `node --test
test/state/runtime-coordination.test.mjs test/runner/claim-port.test.mjs`
rerun clean at 47/47) before the original item's event history was lost to
the truncation incident tracked at `tsk-38i`.

**Verdict:** `clear` (unchanged from Round 1). Classification unchanged:
`kind: docs`, `tier: light`, `risk: light`.

**Verify carried forward (unchanged):**
`node --test test/state/runtime-coordination.test.mjs test/runner/claim-port.test.mjs`
