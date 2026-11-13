# HARDEN T9 closing report: Host and Surface (DRAFT)

**Status: draft written on `harden/t9-p16-close` (stacked on `harden/t9-p25`) before B, P10 and P25 are on main after the rc.8 tag.** The sections marked **FILL AFTER LANDING** need numbers measured on main and are empty on purpose: nothing below invents a measurement. Everything else was checked against the stacked branch on 2026-11-13.

Inputs: [plan](../261109-1718-harden-t9-host-surface/plan.md), the lead report of each phase (table below), [arbitration](council-261109-1617-harden-t9-arbitration.md), [baseline](research-261109-1529-harden-t9-baseline.md), the authority audit (decisions 82 and 83).

## 1. Phases

| Phase | What | State | Report |
|---|---|---|---|
| 01 | shell leaves: registry holds verb facts, exit table | landed | lead-261109-1741-harden-t9-p01-shell-leaves.md |
| 02 | invocation-root door | landed | lead-261109-1839-harden-t9-p02-root-door.md |
| 03 | Git and worktree arms | landed | lead-261112-0327-harden-t9-p03-git-worktree-arms.md |
| 04 | Event Store lifecycle wrapper, fault logs, init use case | landed | lead-261112-0357-harden-t9-p04-event-store-lifecycle.md |
| 05 | custody door, classified verify door | landed (owner decision 85) | lead-261112-0438-harden-t9-p05-custody-door.md |
| 06 | run, dispatch, hook verdicts, `accountPin` | landed | lead-261112-0651-harden-t9-p06-run-dispatch-hook.md |
| 07 | scope rule into Execution, Unit result fields, fixtures | landed (owner decision 85) | lead-261112-1059-harden-t9-p07-unit-run-result-fields.md |
| 08 | workflow arm | landed | lead-261112-1217-harden-t9-p08-workflow-arm.md |
| 09 | Workflow reads `infrastructure` and `evaluations[]` | landed (owner decision 85) | lead-261112-1217-harden-t9-p09-workflow-retry-flag.md |
| 10 | setup, doctor, wire-agents arms; `preflight` retired; probe once; timer | done on `harden/t9-p10`, not on main | lead-261113-1836-harden-t9-p10-setup-doctor-surface.md |
| 11 | architecture rule and three-seat acceptance | landed | lead-261112-1248-harden-t9-p11-architecture-rule.md |
| 12 | Rust host verify without self-hash or double addon read | landed | lead-261109-1820-harden-t9-p12-host-verify.md |
| 13 | one command builder | landed | lead-261109-1839-harden-t9-p13-command-builder.md |
| 14 | gateway hardening | landed | lead-261109-1901-harden-t9-p14-gateway.md |
| 15 | symlink-refusal leaf | landed `184d50017` | lead-261109-1839-harden-t9-p15-refuse-symlink.md |
| 16 | this close | draft | this file |
| 17-24 | authority fixes (kill wait, config defaults, adopt probe, outcome module, seat binding, confinement, record port, workflow catalog) | landed | one lead report each |
| 25 | one domain catalog | done on `harden/t9-p25`, not on main | lead-261113-1859-harden-t9-p25-domain-catalog.md |
| 26-34 | seat transcripts, claude seat store, worker env allowlist, one meaning of `refused`, report completeness, outbox write, duration and family, provenance writer, pane provider limit | landed | one lead report each |

Landing order after the rc.8 tag, set by HARDEN: B, then P10, then P25. Mark P15's row landed in the plan when P16 closes (it is landed on main; only the plan cell lags).

## 2. Acceptance criteria, one by one

Scans run on the stacked branch (`harden/t9-p16-close`, 2026-11-13):

1. **Findings T9-01..22 closed or routed; every High has its red test before the fix.** Evidence: the phase reports above, each with a `Red evidence` section. Open: T9-23 is the packaging plan's.
2. **Doors, scanned.**
   - `agy` in `bin/fgos.mjs`: one hit, the usage text of `hook` (`--format=standard|agy`); no inline hook branch. Met.
   - `resolveMainCheckoutRoot(...) ?? ` in `bin/fgos.mjs`: none. Met.
   - `faultClass = `: none in `bin/fgos.mjs`. The four sites of the argument-parse path were replaced on `harden/t9-fault-class` (`478681a9a`, stacked on `harden/t9-p25`): each pre-handler stage runs through `withFaultClass` (`src/state/store-error.mjs`, beside `StoreError`'s own `faultClass`), so the error carries its class and `main()` tracks no position. Owner of the parse-fault classes: `test/observe/invocation-fault-log.test.mjs` (unknown-verb, dir-invalid, unknown-flag cases and the `withFaultClass` unit case). Met once that branch lands (after P25).
   - `preflight` under `bin src scripts packages/host-runtime/contracts`: no verb, arm, registry entry or route; remaining hits are the Git port's own `preflight` operation, the Workflow seat preflight, `preflightUnitWorktree`, and two comments (`bin/fgos.mjs:19`, `:3411`). Met for the verb; the criterion's "nothing" is too strict for the other meanings of the word.
   - `bin/fgos.mjs` in the gateway and dashboard Rust sources: comments only. Met.
   - `src/event-store`, `src/workflow`, `src/observe`, `src/verbs`, `src/setup` import nothing from `src/cli`: no hit, and the exception list in `test/architecture.test.mjs` is empty (P10).
3. **Behaviour, each by its owning test.** Payload `cwd` judged against the project, a broken config blocking in both hook formats (P06); `fgos list` from `docs/` and `init` from a subdirectory (P02, `test/cli/fgos-disconnected-worktree-guard.test.mjs`); Event Store start and end errors both recorded (P04, `test/event-store/lifecycle.test.mjs`); one shim probe per run, three `claude` calls together, timer unsafe values refused (P10: `test/setup/agent-hooks.test.mjs`, `plugin-marketplace-doctor-check.test.mjs`, `mailbox-sync-timer.test.mjs`); gateway loopback default and caller recorded (P14, `gateway.rs`). The full list and the remaining cases: **FILL AFTER LANDING** from main.
4. **Measured on the activated release.** **FILL AFTER LANDING.** Already measured and kept as evidence: host overhead 51 ms before and 32 ms after P12 (above the 30 ms target; Q4 b leaves any fingerprint cache to the owner); doctor rows in process 2052 ms before and 1450 ms after P10 (load 1.1 to 1.3, three interleaved runs, in `lead-261113-1836-harden-t9-p10-setup-doctor-surface.md`). Not yet measured: `fgos --help`, `dispatch decide`, the Agent/Task and delete-guard hook calls, the entry import closure, Rust test time.
5. **Sizes.** **FILL AFTER LANDING.** Per phase the estimate and the measured line are in each lead report; the layer total (HARDEN commits only, Node, Rust, tests) is measured once on main.
6. **Retired tests name their owners.** Done in each phase report and commit body (examples in P10 and P25 reports).
7. **Land gate green at each land; doctor row ids and count unchanged.** Gate: green at every land. Rows: unchanged through P10 (110 rows, same id hash). **P25 retires one row, `agent-claims-resolve`** (HARDEN's decision of 2026-11-13: a project supplies no task-specs or domain agents, decision 79 Q4); `agent-type-names-unique` stays, narrowed to the project's own tiers. The count is 109 after P25 lands.
8. **Three-seat council scenario passes on contract fields; no custody names in `src/workflow`.** `rg "cwd-lock|unit-custody|workflow-worktree" src/workflow`: none. The scenario is P11's acceptance test (`landed`).
9. **Every AU finding closed, handed off, or listed as Work later; each fix phase has `## Authority`.** Evidence: the `## Authority` sections of the reports of P02, P04, P05, P06, P10, P17-P24 and P29-P32. Handed off: see section 5.

## 3. Reused and missing (prior-art rule)

- Reused: `createDoctorRun().once` (the memo door), `hostBinFromActivation`/`resolveActiveHostBin`, `agent-wiring.mjs` plan and apply, `judgeConfinementOrphans`, the adopt probe of the run supervisor, `refuseSymlink`, `domainCatalog` over the existing `listDomainDirs`, the contract's golden fixtures.
- Missing and added: one activation reader (`readActivationFile`), the version leaf in `src/setup`, `setupUseCase` and `wireAgentsUseCase`, `domainCatalog`/`readCompiledDomain` and the `domain-compiled` contract version, the invocation-root door and its three-reader fixture table, the Event Store lifecycle wrapper.
- Removed by an earlier decision and not revived: the fingerprint cache for host verify (owner decision 81 Q4), `fgos preflight` as a verb (Q1).

## 4. Owner ideas (arbitration section 5)

Untouched, as the plan required. They stay listed in `plans/reports/council-261109-1617-harden-t9-arbitration.md` section 5 for the owner to choose.

## 5. Hand-off of anything not done

- `usage` of the attempt is still `null` (contract, no source).
- Work arms and Work REST/MCP argv, `return` near-copies, `src/verbs/state/edit.mjs:41,48` node hint, seat-binding rows spawning the host 98 and 84 times, `lock-status` 349 ms, `getMainFgosDir` five Git processes, F12 if OPC says "not refused": backlog rows to file at close (ids from `fgos identity mint backlog`).
- The legacy ledger and seat readers (`legacy-ledger-read.mjs`, `legacyFamilyOf`) are deleted one release after landing (backlog `p-7y75kf54rh`).
- The `unit-summary` stored form of the Unit facts (stays version 2).
- Owner and fg-server machine steps for the claude seat store (`guide-261112-1032-declare-claude-seat-store.md`) and the packaging release.
- The `instruction-registry` domain walk keeps the project root being composed (P25 report).

## 6. Deviations and open questions

- `faultClass` in `main()` (criterion 2): closed on `harden/t9-fault-class`; lands after P25.
- Criterion 7's "no new row" held until P25; the retired row is a decision, not a drift.
- Host overhead stays above 30 ms (32 ms measured after P12); the cache question is the owner's.

## 7. Specs and docs updated in this draft

`docs/platform/host-invocation-routing/` (counts 82 selectors, 74 `legacy-cli`, eight native, in `spec.md`, `roadmap.md` and four architecture and contract files; the arm rule, the host verify decision and the `preflight` retirement in `spec.md`), `docs/platform/packaging-distribution/spec.md` (doctor surface and hook verdict decisions), `docs/platform/runner/spec.md`, `docs/platform/runner/README.md` and `docs/platform/runner/contracts/unit-run-result.md` ("Today" column refreshed), `docs/platform/workflow/spec.md` (link), `docs/reading-map.md` (use-case layer line). Already settled by their own phases and left as written: the Event Store lifecycle (`docs/platform/event-store/spec.md`), the gateway loopback default and caller record (`docs/platform/herdr-web-dashboard/spec.md`), the root door facts (`host-invocation-routing/spec.md`).

## 8. FILL AFTER LANDING

Re-measure table; net-size table (estimate beside measured, Unit-contract line separate); the Vietnamese owner-machine guide (`guide-261113-1947-owner-machine-harden-t9-host-surface.md`); the lessons fold into `plans/261021-1118-harden-low-layers-bottom-up/lessons.md`; board line and plan row (through the plan CLI); backlog rows; `fgos convention check`.

## Lessons

Folded into the ledger after landing. Candidates already seen: a layer whose arms hold logic is hardened by moving the logic down; a rule written twice with two outcomes is the real bug (agy failed open while Claude failed closed); a measured number needs a stated load class (the 55 ms and 32 ms figures differ by load); a phase file's dependency list goes stale in a day, re-read it against main before starting.
