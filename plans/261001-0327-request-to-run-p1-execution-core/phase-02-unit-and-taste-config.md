---
phase: 2
title: "Unit + khẩu vị config"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: Unit + khẩu vị config

## Overview

Định nghĩa schema **Unit** (hợp đồng dữ liệu duy nhất cho mọi đường vào) và mở rộng config runner cho **khẩu vị** (bảng 5 mức, mức 1–2): `capabilities.<domain:verb>` (prefer, persona, minCheckers, verify, confinement; `rigor` do T), `patterns.defaultRule`, `patterns.reviewed.checkersByRigor`/`maxRounds`. Đăng ký setup/doctor.

## Requirements

- Functional:
  - `src/runner/execution/unit.mjs`: `validateUnit(raw)` → Unit chuẩn hoá hoặc lỗi có hướng dẫn; field: `id, objective, capability, rigor?, writes[], dependsOn[], pattern?, inputs[], expectedOutputs[]`. Unit **không** được chứa `executor|provider|model|tier|invocation|actors|prefer|overrides` (G2) → lỗi.
  - **Containment** (red-team mục 15): `writes[]`, `inputs[]` chỉ nhận path repo-relative trong worktree của Unit hoặc ref `unit-run:<id>/<role>`; từ chối absolute, `..`, symlink ra ngoài; cùng luật cho `taskSpec`.
  - `capability` dạng `domain:verb` hoặc `verb`; tra config `capabilities[domain:verb]` rồi fallback `capabilities[verb]` (không đăng ký trước `docs:*` vào catalog `serves` — synthesis §5 Q4).
  - Config validator (`config.mjs`): capability entry nhận `persona`, `minCheckers`, `verify` (lệnh chạy **confined**, không chạy trên host trần); `runner.patterns` với `defaultRule.mutatingMinRigor`, `reviewed.maxRounds`, `reviewed.checkersByRigor` (mức cao ⊇ mức thấp — validator từ chối nếu không cộng dồn); checker hợp lệ: `reviewer`, `red-team`, `tester`.
  - Doctor: thiếu `runner.patterns` → dùng mặc định cài bởi setup; checker lạ; `checkersByRigor` không cộng dồn; (posture do fgOS áp theo vai — X-1; không còn kiểm `confinement` theo từng capability).
- Non-functional: không đổi hành vi dispatch hiện tại (chưa ai đọc khoá mới cho tới phase 5).

## Architecture

Unit nằm ở `src/runner/execution/` (lõi mới, L5) — **không import `src/state/**`** (A4). Config chỉ một nơi (`.fgos/config.json` project đè global theo từng key).

## Related Code Files

- Create: `src/runner/execution/unit.mjs`, `test/runner/execution/unit.test.mjs`
- Modify: `src/runner/dispatch/config.mjs` (validator), `src/setup/registrations.mjs` (default `runner.patterns`, doctor checks), `src/setup/checks.mjs`
- Tests: `test/runner/dispatch-config*.test.mjs`, `test/setup/registrations.test.mjs`

## Implementation Steps

1. GitNexus `impact` cho validator config; báo blast radius.
2. Viết test trước cho `validateUnit` (hợp lệ; thiếu `id`/`objective`; ghim hạ tầng → lỗi; `writes` rỗng = read-only).
3. Viết `unit.mjs`.
4. Viết test trước cho validator config mới (khoá hợp lệ/không; cộng dồn checker).
5. Sửa `config.mjs`, `registrations.mjs` (default + doctor), `checks.mjs`.
6. Focused tests xanh → commit → merge vào nhánh plan.

## Success Criteria

- [ ] `validateUnit` + validator config có test (xanh), gồm ca âm G2.
- [ ] `fgos setup` ghi default `runner.patterns`; `fgos doctor` báo 3 loại lỗi ở trên.
- [ ] `src/runner/execution/unit.mjs` không import `src/state/**`.

## Risk Assessment

- Khoá mới trùng nghĩa khoá T vừa thêm (`capabilities.<cap>.rigor`) → chỉ tham chiếu, không định nghĩa lại.
- Project khác chưa có `runner.patterns` → default từ setup; doctor cảnh báo, không fail-fast.
