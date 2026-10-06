---
status: completed
---

# Unit I20 (Phase 5) — `capability-match.mjs`, verb `fgos capability match`, log, reasonCode

Capability: `code:implement`. Depends on: I19 (catalog đã có `serves`).
Cần trước khi Phase 5 rewrite panel/`fgos-panel` xong (trigger
mới gọi `capability match` thay vì đoán theo mô tả skill).

## Context

- I19 đã land: `serves` trên `runner.capabilities`, slot `review`.
- Purpose resolution: `src/runner/dispatch/plan.mjs` ~196–228
  (`selector.unregistered`).
- Log writer duy nhất: `src/runner/worker-log.mjs` `appendWorkerLog`.
- Manifest: `docs/architecture-manifest.json`; `test/architecture.test.mjs`;
  boundary test mẫu: `test/runner/dispatch-reconciliation-import-graph.test.mjs`.
- Tiền lệ module khớp thuần: `src/runner/coordination/cohort-planner.mjs`.
- Từ vựng: `TIERS` (`src/state/work.mjs`), `MIN_RIGOR_VALUES`
  (`assignment-policy.mjs`).

## Requirements

1. **`src/runner/capability-match.mjs`**: `matchCapability(demandFacts, catalog)`
   pure; validate facts theo từ vựng (`TIERS`, `MIN_RIGOR_VALUES`); khớp
   theo luật đã chốt; trả `CapabilityMatch { facts, capability, form,
   candidates, source, reason }`. `form` từ `needsIndependentReview`,
   `hasPlanOrTrack`, `size`. Không import `dispatch/` ngoài `config.mjs`
   hằng số; boundary test cấm import `plan.mjs`/`cli.mjs`/`transport.mjs`.
2. **Verb `fgos capability match --demand <json> [--override <capability> --reason <text>] [--json]`**:
   đọc config qua `ensureRunnerConfigForDir`, gọi `matchCapability`, ghi một
   dòng log qua `appendWorkerLog` với `source: match | override | miss`,
   in kết quả. Read-only với state; log là side effect duy nhất.
3. **`decide --for`**: khi `selector.type === 'purpose'`, không `needsSoul`,
   và tên không có trong `cfg.capabilities` (kể cả alias) → push
   `capability.unknown` cạnh `selector.unregistered`. Không đổi `mechanism`.
4. Manifest: `capability-match.mjs` đăng ký layer `infra`; test ownership
   entry với direct test.
5. `CHANGELOG.md` `## [Unreleased]`: verb mới, reasonCode.

## Files

Modify: `src/runner/dispatch/plan.mjs`, `bin/fgos.mjs`,
`src/cli/command-registry.mjs`, `docs/architecture-manifest.json`,
`test/test-ownership.mjs`, `CHANGELOG.md`.
Create: `src/runner/capability-match.mjs`, `test/runner/capability-match.test.mjs`,
`test/cli/capability-match.test.mjs`.

## Steps

1. `capability-match.mjs` + unit tests (fixture catalog; case: code change,
   docs change, refactor thắng implement, finding docs → review, decision →
   advise, hòa → miss, giá trị `outputKind` lạ → miss, facts sai từ vựng →
   lỗi rõ tên).
2. Boundary test: module không import `plan.mjs`/`cli.mjs`/`transport.mjs`.
3. Verb + CLI test + log (`source: match | override | miss`).
4. `decide` reasonCode + regression test cho tên đã đăng ký và cho
   `--needs-soul` label (không nhận `capability.unknown`).

## Verification

```sh
node --test test/runner/capability-match.test.mjs test/cli/capability-match.test.mjs
node --test test/runner/dispatch.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs
node --test test/architecture.test.mjs test/cli/
node bin/fgos.mjs capability match --demand '{"outputKind":"change","domain":"docs","mutates":true,"needsIndependentReview":false,"hasPlanOrTrack":false,"size":"light","rigor":"standard"}'
node src/runner/dispatch.mjs decide --for code:implment   # thêm capability.unknown
env -u CLAUDE_CODE_SESSION_ID npm test
```

Review độc lập: `code:review`.

## Risks / rollback

- `decide` reasonCode: additive; consumer đọc `mechanism` không đổi. Hook
  `scripts/dispatch-decide-hook.mjs` dùng `needsSoul: true` nên không nhận
  `capability.unknown`.
- Verb mới đụng `bin/fgos.mjs` (GitNexus không index symbol file này): grep
  cross-check `case 'capability'` không trùng.
- Rollback: revert; I19 không phụ thuộc I20.
