# Phase 08 — Operability/CLI surface + doctor

Wave 4 · Gate: Phase 03 (dùng chung vocab code M2) · Findings: M11, M9(b,c), M16, L3, L10. Context: review §M9/M11/M16, Phụ lục 7/8.

## Requirements

- R1 (M11a) `decideExecutorCli` trả thêm `reasonCodes`, `blockedReason` (additive); xoá dead check `plan.dispatch==='human-only'` (`cli.mjs:1543`, `assignment-runner.mjs:1433`). Test: governance-blocked JSON ≠ unregistered JSON.
- R2 (M11b) Register `fgos dispatch decide|execute|log` trong `command-registry.mjs` delegating `runDispatchCli`, bọc `fgos.v1`; `node src/runner/dispatch.mjs` giữ làm alias tương thích; hook PreToolUse trỏ verb mới.
- R3 (M11c) `--run` alias `--run-id` trên show-run/watch/recover; not-found → một categorised exit (đề xuất `2 precondition`, ghi vào `docs/io-contract.md`); unknown sub-verb throw trước `requireField(runId)` (`bin/fgos.mjs:2982` vs `:3031`); `reconcile plan` có `--run/--assignment` mà không `--action` → validation error (exit 4) nêu action; `cli.mjs:1870` `positional ?? undefined`; usage string thêm `fanout-batch`, `reconcile`.
- R4 (M9b) `watch` snapshot thêm `settled: existsSync(result.json)` và thoát.
- R5 (M9c) RunObservation vocab: `phase` derive từ facts (result.json ⇒ settled; controller/commands ⇒ launched/bound), `delivery` map `not-sent`→`not-started`, `resourceState` map từ visibility status, `evidenceCompleteness.workspace` dùng `unsupported`.
- R6 (M16) Doctor: `herdr-available` resolve qua cùng helper `FGOS_HERDR_BIN ?? 'herdr'` với `transport.mjs:800`; diagnose `FGOS_HERDR_ANCHOR_PANE`; ghi `docs/specs/distribution.md` hai state dir global-only (provider-capacity, attestation) là cố ý. (`confinement-attestation-store-writable` đã làm Phase 04.)
- R7 (L3) Receipt poll: `fs.watch` receipts dir hoặc back-off 250 ms sau 1 s; herdr: back-off 1–2 s sau ack, skip `paneProcessInfo` khi `working`. Đo trước/sau (spawn/round).
- R8 (L10) Provider-family warning skip khi mọi invocation non-`cli`.
- R9 `command-registry.mjs:801` `cwd` description; `touchesState` description nói "writes run/guard files, never events.jsonl"; `--help` render `['sub','run-id']`.

## Files

- `src/runner/dispatch/cli.mjs:1236-1244, 1543, 1870, 1889`; `assignment-runner.mjs:1433, 2271-2290`; `transport.mjs:427-431, 800`
- `src/cli/command-registry.mjs:792-843`; `bin/fgos.mjs:2933-3032`; `src/verbs/dispatch/{show-run,watch,recover,reconcile}.mjs`; `reconciliation-planner.mjs:263`
- `src/runner/dispatch/runtime-inspection.mjs:108-131`; `herdr-round.mjs:345, 716-728, 790`; `config.mjs:802-830`
- `src/setup/registrations.mjs:3535, 3612`; `docs/io-contract.md`; `docs/specs/distribution.md`
- Tests: `test/cli/dispatch-*.test.mjs` (exit codes, alias, unknown sub, reconcile --run without action), `test/runner/dispatch-runtime-inspect.test.mjs` (vocab), new `dispatch-decide-cli.test.mjs`, `test/setup/*doctor*` (herdr bin helper)

## Steps

1. `impact` cho `decideExecutorCli`, `runDispatchCli`, `inspectDispatchRuntime`, registry entries.
2. R1 → R3 → R4 → R5 → R6 → R2 (registry, lớn nhất) → R7 → R8 → R9.
3. Docs: `AGENTS.md` §Dispatch (result shape + verb mới), `docs/io-contract.md`, CHANGELOG `[Unreleased]`.

## Validation

Test gaps #13 (CLI), #14 (doctor) xanh; `fgos --help` liệt kê verb mới; `command-routes-drift` check pass.

## Risk / rollback

R2 đổi surface public — giữ alias, ghi CHANGELOG. R7 là perf: đo trước, không merge nếu latency receipt tăng >100 ms p95. Rollback từng R.
