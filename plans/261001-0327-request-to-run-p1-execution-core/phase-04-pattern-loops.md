---
phase: 4
title: "Vòng lặp Pattern cộng tác"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 4: Vòng lặp Pattern cộng tác

## Overview

Viết 3 **Pattern cộng tác** (`solo`, `reviewed`, `panel`) thành **vòng lặp code nhỏ**, thuần, nhận một hàm `runRole` được tiêm vào (phase 5 cung cấp hàm thật). Dùng chung cho cả khi có Lead lẫn headless (không chạy vòng lặp bằng prose — synthesis Q0). Kết quả là outcome tường minh; finding không phải failure.

## Requirements

- Functional:
  - `solo`: một lần `runRole(producer)`.
  - `reviewed`: producer → checkers **song song** (theo `checkersByRigor[rigor] ∪ capabilities[cap].minCheckers`; code luôn có `red-team` — Q4) + lệnh `verify` tất định nếu có (không phải agent) → nếu có finding chưa giải quyết: producer sửa, checkers chấm lại; tối đa `maxRounds` → hết vòng còn finding: outcome `findings` (park, gom câu hỏi), không đánh `failed`. Checker bắt buộc `independentOf: [producer]` (D7).
  - `panel`: N vai độc lập song song (mỗi vai `independentOf` các vai còn lại) với cùng `inputs` → một vai `synthesize` (solo) nhận N kết quả.
  - Preset: `{pattern, params}` có tên (vd `code-change` = `reviewed` + reviewer + red-team + tester + `verify`); bảng preset nằm trong config hoặc module, phase 2 schema đã cho chỗ.
  - Trạng thái vòng lặp ghi qua interface `log(event)` được tiêm (phase 5 nối vào store `unit-runs`) để **resume**: chạy lại từ sự kiện cuối, không làm lại vai đã `pass`.
  - Outcome: `pass | findings | execution-failure | policy-refusal | blocked`.
- Non-functional: module thuần; không import `src/state/**`, `src/runner/coordination/**`, `src/runner/dispatch/**` (chỉ dùng hàm được tiêm).

## Architecture

```text
runPattern(name|preset, unit, cfg, { runRole, verify, log, resumeFrom? }) → { outcome, rounds, results[] }
reviewed: producer ─► [checker₁ ∥ checker₂ ∥ verify] ─► findings? ─yes,≤max─► producer(fix) ─► recheck …
panel:    [member₁ ∥ … ∥ memberₙ] ─► synthesize
```

## Related Code Files

- Create: `src/runner/execution/patterns/solo.mjs`, `reviewed.mjs`, `panel.mjs`, `index.mjs` (preset), `test/runner/execution/patterns/*.test.mjs`

## Implementation Steps

1. Test trước với `runRole` giả: `reviewed` pass vòng 1; finding → sửa → pass; hết `maxRounds` → `findings` (không `failed`); checker execution-failure khác finding; verify fail = finding; resume giữa vòng 2 không chạy lại vai đã pass; `panel` 3 thành viên + synthesize; `policy-refusal` từ `runRole` lan đúng.
2. Viết 3 module + preset.
3. Test kiến trúc (không import ngoài).
4. Commit → merge vào nhánh plan.

## Success Criteria

- [ ] Toàn bộ ca ở bước 1 xanh.
- [ ] Không chỗ nào ghi finding thành `failed`.
- [ ] Module không import ngoài phạm vi.

## Risk Assessment

- Thiếu luật engine đang có (recheck-disposition, driver authorize) → tín hiệu ở nghiệm thu phase 8; thêm luật cụ thể vào `reviewed`, không mang lại engine.
