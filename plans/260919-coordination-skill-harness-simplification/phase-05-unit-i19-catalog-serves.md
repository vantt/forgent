# Unit I19 (Phase 5) — `serves` trên catalog, `review` slot, `for` cho executor mồ côi, doctor

Capability: `code:implement`. Depends on: I17 (từ vựng đã chốt trong
fragment và spec). Config thuần, không module mới, không CLI mới; phải land
trước Phase 5 việc 2. Phần module/verb/log/reasonCode tách sang
[I20](phase-05-unit-i20-capability-match-module.md).

## Context

- Catalog defaults: `src/setup/registrations.mjs` `DEFAULT_CAPABILITY_SLOTS`
  (~1773), doctor check `advise-execute-capabilities-configured` (~1922),
  `registerCheck`/`registerConfigDefault` (119, 140).
- Validate entry: `src/runner/dispatch/config.mjs:1291`
  `validateCapabilitiesShape`, `ALLOWED_CAPABILITY_ENTRY_KEYS` (1333).
- Purpose resolution: `src/runner/dispatch/plan.mjs` ~196–228
  (`selector.unregistered`); `src/runner/dispatch/resolve.mjs`
  `resolveExecutorIdForPurpose`, `resolveExecutorAndOverrides`.
- Live config: `.fgos/config.json` `runner.capabilities`, `runner.executors`
  (`glm`, `xai`, `deepseek` không có `for`).
- Log writer duy nhất: `src/runner/worker-log.mjs` `appendWorkerLog`.
- Manifest: `docs/architecture-manifest.json`; `test/architecture.test.mjs`.
- Tiền lệ module khớp thuần: `src/runner/coordination/cohort-planner.mjs`
  (pure, không import transport).

## Requirements

1. **Schema `serves`** trên capability entry: object với các key trong
   `DemandFacts` trừ `size`/`rigor`; giá trị scalar hoặc mảng cho phép.
   `ALLOWED_CAPABILITY_ENTRY_KEYS` thêm `serves`; `validateCapabilitiesShape`
   kiểm kiểu. Entry không có `serves` hợp lệ.
2. **Defaults**: mọi slot trong `DEFAULT_CAPABILITY_SLOTS` có `serves` theo
   bảng design record §11; thêm slot `review` (`outputKind: finding`,
   `mutates: false`, confinement như `code:review`). Không thêm
   `prefer`/`overrides` cho `review` (curated default không pin).
3. **Doctor**: mở rộng `advise-execute-capabilities-configured` (hoặc check
   mới `capability-serves-valid`): mọi entry có `serves` hợp lệ; không hai
   entry khai tập thuộc tính y hệt; `review` có mặt.
4. **Live config `.fgos/config.json`** (commit riêng, thuần cộng thêm):
   `serves` cho entry hiện có; slot `review`; `for` cho `glm`/`xai`/`deepseek`
   (giá trị do owner chọn lúc thực thi; mặc định đề xuất: `xai` →
   `["review","code:review"]`, `deepseek` → `["execute"]`, `glm` →
   `["execute"]`). Không đổi `prefer` hiện có.
5. `CHANGELOG.md` `## [Unreleased]`: `serves`, `review`, `for` mới.

## Files

Modify: `src/setup/registrations.mjs`, `src/runner/dispatch/config.mjs`,
`.fgos/config.json` (commit riêng), `test/setup/capability-catalog-doctrine.test.mjs`,
`test/setup/checks.test.mjs`, `CHANGELOG.md`, `docs/specs/distribution.md`
(doctor check row).
Create: không.

## Steps

1. Schema + validate (`serves` sai kiểu → lỗi rõ tên; thiếu `serves` hợp lệ).
2. Defaults `serves` cho mọi slot + slot `review`; doctor check; tests xanh.
3. Live config commit riêng, sau khi owner xác nhận giá trị `for`.

## Verification

```sh
node --test test/setup/capability-catalog-doctrine.test.mjs test/setup/checks.test.mjs
node --test test/runner/dispatch.test.mjs   # config load regression: config cũ không có serves vẫn load
node bin/fgos.mjs doctor
node src/runner/dispatch.mjs decide --for review   # sau live config: không còn selector.unregistered
env -u CLAUDE_CODE_SESSION_ID npm test
```

Review độc lập: `code:review`.

## Risks / rollback

- `validateCapabilitiesShape` là đường nóng của mọi load config: sai kiểu
  `serves` phải là lỗi rõ tên, không làm config cũ (không có `serves`) fail.
- `for` cho executor mồ côi đổi kết quả `decide --for review`/`execute` trên
  máy này: chủ đích, nhưng commit riêng để revert độc lập.
- Rollback: revert từng commit; config live revert riêng.
