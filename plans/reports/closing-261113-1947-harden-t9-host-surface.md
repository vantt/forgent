# HARDEN T9 closing report: Host and Surface

**Status: DONE_WITH_CONCERNS.** Every phase is on main; the T9 head is `2788a0d0f` (CI and Release assets check green on it, 2026-11-14). Concerns: the import closure of the entry was not cut, doctor is slower than its target, and the layer is net positive in Node, Rust and tests; sections 2.4, 2.5 and 6 give the numbers. Measured 2026-11-14 on a release build staged from this tree, not through an installed release.

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
| 10 | setup, doctor, wire-agents arms; `preflight` retired; probe once; timer | landed `daa6ef903` (rc.8 does not contain it) | lead-261113-1836-harden-t9-p10-setup-doctor-surface.md |
| 11 | architecture rule and three-seat acceptance | landed | lead-261112-1248-harden-t9-p11-architecture-rule.md |
| 12 | Rust host verify without self-hash or double addon read | landed | lead-261109-1820-harden-t9-p12-host-verify.md |
| 13 | one command builder | landed | lead-261109-1839-harden-t9-p13-command-builder.md |
| 14 | gateway hardening | landed | lead-261109-1901-harden-t9-p14-gateway.md |
| 15 | symlink-refusal leaf | landed `184d50017` | lead-261109-1839-harden-t9-p15-refuse-symlink.md |
| 16 | this close | landed | this file |
| 17-24 | authority fixes (kill wait, config defaults, adopt probe, outcome module, seat binding, confinement, record port, workflow catalog) | landed | one lead report each |
| 25 | one domain catalog | landed `47b721427` | lead-261113-1859-harden-t9-p25-domain-catalog.md |
| 26-34 | seat transcripts, claude seat store, worker env allowlist, one meaning of `refused`, report completeness, outbox write, duration and family, provenance writer, pane provider limit | landed | one lead report each |

Landed after the rc.8 tag in this order: P10, P25, the fault-class change (`2788a0d0f`); each had a full local `npm test` green (8857, 8861 and 8863 tests, 0 failures). GitHub CI was saturated, so the three landed back to back and CI was read once, on the final head. The fault-class change (P35 in the plan) is not a numbered phase of the table above.

## 2. Acceptance criteria, one by one

Scans run on the stacked branch (`harden/t9-p16-close`, 2026-11-13):

1. **Findings T9-01..22 closed or routed; every High has its red test before the fix.** Evidence: the phase reports above, each with a `Red evidence` section. Open: T9-23 is the packaging plan's.
2. **Doors, scanned.**
   - `agy` in `bin/fgos.mjs`: one hit, the usage text of `hook` (`--format=standard|agy`); no inline hook branch. Met.
   - `resolveMainCheckoutRoot(...) ?? ` in `bin/fgos.mjs`: none. Met.
   - `faultClass = `: none in `bin/fgos.mjs`. The four sites of the argument-parse path were replaced on `harden/t9-fault-class` (`478681a9a`, stacked on `harden/t9-p25`): each pre-handler stage runs through `withFaultClass` (`src/state/store-error.mjs`, beside `StoreError`'s own `faultClass`), so the error carries its class and `main()` tracks no position. Owner of the parse-fault classes: `test/observe/invocation-fault-log.test.mjs` (unknown-verb, dir-invalid, unknown-flag cases and the `withFaultClass` unit case). Met: landed in `2788a0d0f`.
   - `preflight` under `bin src scripts packages/host-runtime/contracts`: no verb, arm, registry entry or route; remaining hits are the Git port's own `preflight` operation, the Workflow seat preflight, `preflightUnitWorktree`, and two comments (`bin/fgos.mjs:19`, `:3411`). Met for the verb; the criterion's "nothing" is too strict for the other meanings of the word.
   - `bin/fgos.mjs` in the gateway and dashboard Rust sources: comments only. Met.
   - `src/event-store`, `src/workflow`, `src/observe`, `src/verbs`, `src/setup` import nothing from `src/cli`: no hit, and the exception list in `test/architecture.test.mjs` is empty (P10).
3. **Behaviour, each by its owning test.** Payload `cwd` judged against the project, a broken config blocking in both hook formats (P06); `fgos list` from `docs/` and `init` from a subdirectory (P02, `test/cli/fgos-disconnected-worktree-guard.test.mjs`); Event Store start and end errors both recorded (P04, `test/event-store/lifecycle.test.mjs`); one shim probe per run, three `claude` calls together, timer unsafe values refused (P10: `test/setup/agent-hooks.test.mjs`, `plugin-marketplace-doctor-check.test.mjs`, `mailbox-sync-timer.test.mjs`); installed domain personas only, `agents list` ignores a project's `domains/` (P25: `test/runner/agent-listing.test.mjs`); gateway loopback default and caller recorded (P14, `gateway.rs`). The remaining cases are in each phase report's `Red evidence` section; this report adds no second copy.
4. **Measured, 2026-11-14, median of 5, release build staged from this tree through the Rust host** (not an installed release; machine load 3 to 4 against 25 to 34 at the baseline, so absolute drops are partly load and the ratios inside one run are the safer read).

   | Item | Baseline | Now |
   |---|---|---|
   | `fgos version` (Rust native) | 58 ms | 11 ms |
   | `fgos --help` | 319 ms | 97 ms |
   | the payload run by node directly | 178 ms | 81 ms |
   | host overhead per legacy call (help minus payload) | about 140 ms at the baseline load, 55 ms in the plan | about 16 ms (target at most 30): **met**, with the load caveat |
   | `fgos dispatch decide --for judge` | 220 ms | 189 ms (runs 181 to 231): unproven |
   | `fgos list --json` | 822 ms | 759 ms |
   | `fgos doctor --json` | 45 221 ms (load-dominated) | 14 990 ms, 109 rows; the target of 12 s is **missed** |
   | modules loaded by `--help` | 220 (207 project files) | 211, all project files: the import closure was **not cut** and the 10 ms target is missed |

   In the scratch release root four doctor rows were not ok (`tool-registry-configured`, `work-step-vocabulary`, `provider-capacity-state`, and `active-release-matches-checkout`, expected for a copied tree). Earlier evidence kept: doctor rows in process 2052 ms before and 1450 ms after P10 under load 1.1 to 1.3. **Not measured:** the Agent/Task and delete-guard hook calls, `workflow status`, and the Rust test time (a suite was not allowed to run). `fgos worktree list` of an unknown sub-verb now exits 4, a code of the exit table, where it exited 1.
5. **Sizes, measured 2026-11-14 on 84 hand-selected T9 commits on main since the baseline (selection by subject, can be off by a few at the edges; list kept in the scratchpad of this session).**

   | Group | `bin/fgos.mjs` | Node `src` | Rust src | tests |
   |---|---|---|---|---|
   | Base phases (estimate) | -945 | +535 | -30 | -460 |
   | Base phases (measured) | **-1022** | **+1082** | **+507** | **+1008** |
   | Unit-contract phases 05, 07, 09, 11 (estimate -35 / +145 in Node and tests), kept apart | none | +304 | none | +629 |
   | Audit fix phases 17-25 | 0 | +197 | +91 | +652 |
   | Later additions 26-35 | +5 | +553 | +19 | +737 |
   | All 84 | -1017 | +2136 | +617 | +3026 |

   `bin/fgos.mjs` is 4310 lines against 5379 (beat its estimate). `src/cli/command-registry.mjs` is 2730 against 2598, growth from the per-verb facts. **The layer rule of net at most 0 is missed in Node, Rust and tests**; the main overshoots are phase 06 (+566 Node), the gateway (+360 Rust) and the host verify (+122 Rust). Rust and test growth is chosen behaviour in the plan; the Node overshoot of about 550 over the estimate is for the owner to accept or not (section 6).
6. **Retired tests name their owners.** Done in each phase report and commit body (examples in P10 and P25 reports).
7. **Land gate green at each land; doctor row ids and count unchanged.** Gate: green at every land. Rows: unchanged through P10 (110 rows, same id hash). **P25 retires one row, `agent-claims-resolve`** (HARDEN's decision of 2026-11-13: a project supplies no task-specs or domain agents, decision 79 Q4); `agent-type-names-unique` stays, narrowed to the project's own tiers. The count is 109 on main (measured above).
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
- The `unit-summary` stored form carries three Unit facts in version 3 (another lane); the other Unit-contract fields stay on `data` only.
- Owner and fg-server machine steps for the claude seat store (`guide-261112-1032-declare-claude-seat-store.md`) and the packaging release.
- The `instruction-registry` domain walk keeps the project root being composed (P25 report).

## 6. Deviations and open questions

- `faultClass` in `main()` (criterion 2): closed and landed in `2788a0d0f`.
- Criterion 7's "no new row" held until P25; the retired row is a decision, not a drift.
- Host overhead is about 16 ms on a quieter machine (32 ms after P12 under load); the criterion of 30 ms is met and the cache question closes without a cache (decision 81 Q4).
- **Missed, for the owner to accept or not:** the entry still loads 211 modules (target: a cut of 10 ms of import); `fgos doctor` takes about 15 s in a scratch release root against the 12 s target; the layer is net positive in Node (+2136 over 84 commits, +1082 in the base phases against +535 estimated), Rust and tests. `dispatch decide` gained about 30 ms but with a spread of 50 ms, so unproven.
- The measurement ran on a staged release build of this tree, not an installed release, on a machine at load 3 to 4; the baseline load was 25 to 34.
- DOC hand-off (the board names the owner `forgentx-5f`; no such session runs here): `docs/explanation/fgos-preflight-verb.md` is now a retired page because `fgos preflight` answers "unknown verb".

## 7. Specs and docs updated

`docs/platform/host-invocation-routing/` (counts 82 selectors, 74 `legacy-cli`, eight native, in `spec.md`, `roadmap.md` and four architecture and contract files; the arm rule, the host verify decision and the `preflight` retirement in `spec.md`), `docs/platform/packaging-distribution/spec.md` (doctor surface and hook verdict decisions), `docs/platform/runner/spec.md`, `docs/platform/runner/README.md` and `docs/platform/runner/contracts/unit-run-result.md` ("Today" column refreshed), `docs/platform/workflow/spec.md` (link), `docs/reading-map.md` (use-case layer line). Already settled by their own phases and left as written: the Event Store lifecycle (`docs/platform/event-store/spec.md`), the gateway loopback default and caller record (`docs/platform/herdr-web-dashboard/spec.md`), the root door facts (`host-invocation-routing/spec.md`).

## 8. Close items

Vietnamese owner-machine guide: `guide-261114-1149-owner-machine-harden-t9-host-surface.md`. Lessons folded into `plans/261021-1118-harden-low-layers-bottom-up/lessons.md` (HL-29 to HL-31, OL-30 and OL-31, and the T9 row of section 5). Board line and plan row written with this report; backlog rows filed from section 5.

## Lessons

- A layer whose arms hold logic is hardened by moving the logic down; the net size of such a layer still grows in Node, because each use case, door and fixture is new code the arm never needed.
- A rule written twice with two outcomes is the real bug (agy failed open while Claude failed closed).
- A measured number needs a stated load class: 55 ms, 32 ms and 16 ms are the same overhead at three loads, so a target has to name the load.
- A phase file's dependency list goes stale in a day; re-read it against main before starting. A stacked branch also goes stale in a day: after its base lands, replay only its own commits with `git rebase --onto origin/main <old base tip>`, not a plain rebase.
- When a CI queue is saturated, land back to back with full local gates and read CI once, on the final head; cancel the queued runs of superseded commits.
