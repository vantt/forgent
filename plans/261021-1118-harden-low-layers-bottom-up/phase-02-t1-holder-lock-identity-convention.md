---
phase: 02
title: "T1: Holder-lock, Session Identity, Convention"
status: pending
depends_on: [01 closed, SEAT landed (close only)]
effort: ~4d (rough)
---

# Phase 02 — T1: Holder-lock, Session Identity, Convention

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop). The council fills findings; this file names the inputs. The council may open once phase 01 closes; the phase closes only after SEAT has landed (T0 carry list done, identity/convention edits made).

## Context links

Specs: [holder-lock](../../docs/platform/holder-lock/spec.md), [session-identity](../../docs/platform/session-identity/spec.md), [convention](../../docs/platform/convention/spec.md); [component-boundary](../../docs/platform/component-boundary.md) rows; [rules-growth review](../reports/review-261021-1008-rules-that-grow-the-system.md) R2 (`src/holder-lock` thick facade) and R4 (fences); [TEST plan](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) phase 2 holder-lock row (110 Node tests in 20 files vs 74 Rust).

## Components, crates, Node (proposal §4.1)

| Component | Rust | Node around it |
|---|---|---|
| Holder-lock | `packages/holder-lock/rust` (7 498 lines) | `src/holder-lock/*` 10 files, 2 499 lines (`index.mjs` 718, `fences.mjs` 519, `hold-transport.mjs` 507, `driver.mjs` 370); `src/runner/lock-fence.mjs`; `src/state/hot-lock.mjs` (383, the state store's hot mutex, temporary until the store moves to Rust) |
| Session Identity | `packages/session-identity/rust` (834) | `src/util/session-identity.mjs` (250) |
| Convention | `packages/convention/rust` (1 309) | `src/convention/*` (1 file, 21 lines on main) |

Known leads for the council (not findings yet): `src/holder-lock/driver.mjs:345-359` scans `/proc/*/fd` while Rust holder-lock owns `holders`; `src/setup/holder-lock-checks.mjs:403` reads `/proc`; the `process-observe` route lives in this crate but belongs to T0 (moves per phase 01 Q1); `fences.mjs` and legacy readers depend on the R4 compatibility answer; the 4.2 cutover's promise to delete private `isPidAlive` copies (`docs/platform/process/spec.md:73`) was not kept — ask why.

Doctor rows (`src/setup/registrations.mjs`): `lock-kernel-semantics` :2299, `lock-borrow-vectors` :2304, `lock-holders` :2309, `lock-fences` :2314, `lock-record-unreadable` :2319, `lock-predecessor-kill-wait` :2324, `state-root` :2329, `convention-conformance` :6516, `writer-identity-resolvable` :6639. Setup steps: config default `lock` :2333, fixes `lock-dirs` :2334, `lock-fences` :2382. Gate 8: doctor table (every fail/warn condition keeps a row), fold toward one or two rows per component.

One-door jobs owned here (plan.md success criteria): lock, identity, and `.fgos`/state-root lookup — inventory starts from `rg -l "path\.join\([^)]*'\.fgos'" src bin` (36 files) against the single state-root resolution of holder-lock (`fgos internal state-root`).

## Constraints

- **SEAT collision:** SEAT changes `src/util/session-identity.mjs`, `src/convention/*` (adds `definition-names.mjs`, `seat-id.mjs`) and `packages/convention/*`. The T1 council may run; edits to those files wait until SEAT lands (or the later lander rebases, board rule).
- **Hot mutex (`src/state/hot-lock.mjs`) — no lane gap.** Its liveness judging moved at T0. T1 reviews the mutex itself (users: the state store, `src/runner/lock-fence.mjs:16`, the `src/git/*` guards via `hotLockDepth`, `src/holder-lock/hot-guard.mjs`). Either it moves under holder-lock in Rust here, or the owner accepts it as a named Node exception until WORK replaces the store (T1 ask 1). The state store's writes stay WORK-owned.
- R4 compatibility policy unanswered ⇒ keep existing fences, add none.

## Files

Filled by the T1 sub-plan with Create / Modify / **Delete** / **Tests to retire**. Delete candidates to check: Node `/proc` holder scan, Node identity rules duplicated from Rust, facade code above a thin client (Node budget per component written into its spec), fences past their release (if R4 allows), hand-joined `.fgos` paths. Tests to retire: Node mirrors of Rust holder-lock / identity / convention cases that TEST phase 2 has not already retired.

## Net size

Estimate before council (HARDEN commits only): Node −800 to −1 500 (`src/holder-lock` 2 499 toward a thin client; `.fgos` joins), Rust 0 to +300 (hot mutex if moved), tests −300 to −800. Layer total ≤ 0. Measured in the layer report.

## Risks (layer-specific; plan-wide risks in plan.md)

| Risk | L × I | Mitigation |
|---|---|---|
| Lock change blocks commits across sessions (lock protocol 2 landing took 2.5 h) | M × H | Stop-everything landing in the ask-1 slot; fence plan reviewed by red-team. |
| Moving the hot mutex changes every state write's latency | M × H | Absolute budget per call; in-process only (no spawn under hot lock). |

## Done when

Loop close criteria (plan.md step 9); SEAT landed and the T0 carry list closed; Node decides no lock, holder, identity, convention or state-root rule (hot mutex: moved or owner-named exception); T1 net size ≤ 0.
