---
phase: 09
title: "WORK hand-off: Work data drift and Workflow case bindings leave doctor through WORK's doors; HARDEN adds the two pointer rows after"
status: pending
depends_on: [07]
parallel: "WORK's part runs on WORK's schedule (foundation first, Work later); HARDEN's pointer part waits for WORK's doors"
owning_lane: "WORK (rows, doors, normal-path repair); HARDEN (two pointer rows, board record)"
effort: "HARDEN ~0.5d; WORK estimates its own part"
net_size: "HARDEN: Node +20 / Rust 0 / tests +10; WORK: its own budget, target ≤ 0"
---

# Phase 09 — WORK hand-off and Work pointer

## Context

Decision 65: "each lane's rows are handed to it on the board"; Work fixes are batched later (foundation first). These rows are WORK's; this phase records exactly what WORK receives and what HARDEN does after. Code read on `fd476d709`:

| Row | Body | Registration | Cost (audit) | Today's door |
|---|---|---|---|---|
| `work-classification-vocabulary` | `src/setup/registrations.mjs:1806-1832` | `:1833-1838` | 506 ms | none |
| `work-step-vocabulary` | `:1854-1878` | `:1879-1884` | – (live failing: tsk-5db on retired step `clarify`) | none |
| `work-recorded-conflicts` | `:1888-1901` | `:1902-1907` | – | `fgos show <id>` per item |
| `root-drift` | `:1723-1773` | `:1928-1933` | 479 ms | none |
| `leaf-notify-drift` | `:1774-1805` | `:1934-1939` | 242 ms | none |
| `delivered-not-on-trunk` | `:1957-1991` | `:1992-1997` | 4 465 ms | none |
| `workflow-case-bindings` (+fix) | `src/setup/workflow-case-checks.mjs:69-97`, fix `:99-124` | `registrations.mjs:5506-5511` | 1 619 ms | repair only in `doctor --fix` (`repairCaseBindings` is called only from `src/setup`; `src/workflow/case-bindings.mjs:181`) |
| `workflow-case-binding-sentinel` | `workflow-case-checks.mjs:59-67` | `registrations.mjs:5501-5505` | 1 ms | readiness: **stays**; the sentinel is also written on the normal path (`src/workflow/case-bindings.mjs:83,95`, `case-admission-port.mjs:211`) |

Existing Work read verbs WORK may extend instead of adding one: `fgos stale` (`bin/fgos.mjs:2391`), `fgos conflicts` (`:2449`), `fgos show`, `fgos workflow status`.

## Requirements

**WORK (hand-off; WORK plans and lands it):**
1. Each of the six Work rows' judgments is answered by one Work read verb (WORK chooses; extending an existing verb preferred, RUL104), with its tests moved, never copied.
2. `workflow-case-bindings`: the check becomes a read section of a Workflow verb (e.g. `fgos workflow status`), and the repair runs on the Workflow normal path (case admission or advance under the case's `advance` lock, as `fixWorkflowCaseBindings` does at `workflow-case-checks.mjs:105-121`) **before** the fix leaves `doctor --fix`; the sentinel-only repair stays a readiness fix (split `fixWorkflowCaseBindings`: sentinel part stays registered, settle/rebuild part moves).
3. WORK deletes the six rows and the bindings row/fix from doctor in the same change as its doors (L10), updating `checks.test.mjs`, the registry contract inventory and `CHANGELOG.md`.
4. WORK's door names are posted on the board so HARDEN can write the pointers.

**HARDEN:**
5. Same turn this plan is accepted: copy rows 1–4 to WORK on the board (one line, with this phase file linked) and to the WORK row of the program board (owner decision 8).
6. After WORK's change lands: add `work-incidents` (Work) and keep `workflow-case-bindings` as the Workflow pointer (id kept, pointer form), both by the plan's pointer rule (warn, no fix, cost cap), naming WORK's verbs. If WORK's verbs can give a count cheaply (≤ 250 ms), print N; else "run `<verb>`".
7. P10 re-measures doctor time after this lands (target ≤ 12 s together with T5's seat-row cut).

## Files

**HARDEN create/modify:** `src/setup/registrations.mjs` (two pointer registrations), the pointer bodies in the modules WORK leaves (`src/setup/workflow-case-checks.mjs` or a Work module), `test/setup/checks.test.mjs`, registry contract, `CHANGELOG.md`.

**WORK:** its own plan; files listed above under Context.

**Delete (WORK):** the six Work row bodies and registrations; the settle/rebuild part of `fixWorkflowCaseBindings`.

**Tests to retire (WORK):** each row's doctor cases → the Work/Workflow verb's test that now owns the judgment (named in WORK's report).

## Net size

HARDEN: two pointers +20 Node, +10 tests. WORK: rows −250 Node out of `src/setup`, verbs + normal-path repair +≤ 200 (target net ≤ 0).

## Validation

- WORK: its gate; `fgos doctor` on fg-server2 without the seven rows; the Work verbs answer the moved judgments (incl. tsk-5db's retired step); a crashed binding is settled by the Workflow normal path without `doctor --fix`.
- HARDEN: FR `test/setup/checks.test.mjs test/setup/workflow-case-checks.test.mjs test/setup/registrations.test.mjs`; pointer cost; doctor time.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| WORK's batch lands late; doctor stays ~19 s meanwhile | H × L | Expected (foundation first); P10 records the gap and the ≤ 12 s target as pending on the board |
| Binding repair leaves `--fix` before the normal path repairs | L × H | Requirement 2 ordering; WORK's change is one landing (L10) |
| HARDEN writes pointers to verbs WORK later renames | L × L | Pointers are written after WORK lands, from the board line |

## Rollback

WORK reverts its own merge (doctor rows and fix come back). HARDEN's pointer commit reverts alone. No on-disk format change from HARDEN.

## Done when

Board lines written (HARDEN, at acceptance); WORK's change landed; two pointer rows landed; doctor re-measured.

## Lead brief essentials

HARDEN never edits Work/Workflow modules beyond the pointer bodies. All plan.md lead rules apply to HARDEN's part.
