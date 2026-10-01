---
phase: 3
title: "bind() lõi"
status: pending
priority: P1
effort: "2d"
dependencies: [1]
---

# Phase 3: bind() lõi

## Overview

Viết **`bind()`** — chỗ duy nhất quyết executor / invocation / transport (herdr|cli) / tier / model / persona / cơ chế / posture cho một vai của một Unit, theo **bảng 5 mức**, kèm provenance từng field và từ chối có lý do (G6). **Tái dùng** `src/runner/dispatch/mechanism.mjs` (giữ D-ADR0033 — Q-A) và chuẩn hoá candidate của `resolve.mjs`; không viết lại. Chưa nối vào đường chạy (phase 5, 7 nối).

## Requirements

- Functional:
  - **Executor (+invocation)**: override mức 4 (`overrides[{scope:{unit?,role?}, origin}]`) → `capabilities[domain:verb].prefer[]` → `capabilities[verb].prefer[]` → hết: `inline` nếu có Lead **và** vai là producer; lỗi rõ nếu headless. Không mặc định `claude`. Mức 3 không chọn executor.
  - **Transport (G7)**: executor đã chọn có invocation herdr và `session.herdrPresent` → `transport: herdr`; ngược lại `cli`. Không còn invocation `*-readonly` (X-4): chọn invocation chỉ là chọn đường + tài khoản (thứ tự `prefer[]`).
  - **Cơ chế (Q-A)**: gọi `mechanism.mjs` — executor có CLI (claude, codex, agy, pi) **luôn `out-of-process`**; `in-process` chỉ cho agent native không có CLI; `inline` chỉ cho vai producer do chính Lead làm, **không bao giờ** cho `reviewer`/`red-team`/thành viên panel/vai có ràng buộc visibility.
  - **Posture (X-1)**: vai read-only → `read-only`; vai ghi file → `workspace-write` (grant theo `writes[]`); phase này chỉ trả nhãn, phase 6 áp thật.
  - **Bộ lọc**: `readOnly` (candidate phải có posture áp được — interface `canApplyPosture(candidate, posture, ctx)`, cài đặt thật ở phase 6), `independentOf` (khác provider family với vai đã bind; theo tập, không theo thứ tự). Override vi phạm `independentOf` → từ chối, trừ khi `acceptDependence: true` **và** `origin: human-cli`.
  - **Governance** phủ quyết cuối (kiểm phase 1: khoá thật trong config; hiện `runner.governance` null).
  - **Tier**: `rigor = max(rigor unit/step, capabilities[cap].rigor) ?? standard`; `tier = max(rigorToTier[rigor], override.tier)`, override tier bị chặn bởi trần toàn cục (`runner.maxTier` nếu owner khai); `model = resolveTierModel(...)` (T).
  - **Persona**: override → persona khoá bởi Workflow (không thay được — Q6) → vai do step khai → `capabilities[cap].persona` → không có.
  - **Quota (X-3)**: hàm `nextCandidate(prevBinding, reason='provider-limit')` trả candidate kế trong `prefer[]` (vẫn qua mọi bộ lọc), provenance ghi `fallbackFrom` + lý do.
  - **Provenance**: mọi field `{value, source}`; `overrides[].origin` ghi lại.
  - Từ chối: `no-candidate | independence | governance | locked-persona | headless-no-executor | posture-unavailable`.
- Non-functional: hàm thuần (nhận config đã snapshot); không import `src/state/**`, `src/runner/coordination/**`.

## Architecture

```text
bind(ask, ctx) ─ candidates(mức 4→2→1) ─► filter(posture, independentOf, governance) ─► pick
               ├► transport = herdr nếu có invocation herdr ∧ herdrPresent, else cli
               ├► mechanism = mechanism.mjs(executor, ctx)   (D-ADR0033)
               ├► tier/model (T) · persona chain · posture label
               └► provenance
```

Hợp đồng in/out thuần, có `contractVersion` — theo kiểu operation contract của kernel Rust (`packages/host-runtime/rust/src/operation_provider_router.rs`) để sau chuyển sang Rust không thiết kế lại (A6).

## Related Code Files

- Create: `src/runner/execution/bind.mjs`, `test/runner/execution/bind.test.mjs`
- Import (không sửa): `src/runner/dispatch/mechanism.mjs`, `resolve.mjs` (`normalizePreferCandidates`, `deriveProviderFamily`, `resolveTierModel` của T)

## Implementation Steps

1. Test bảng trước: K1 (author gemini out-of-process herdr; reviewer claude out-of-process herdr, read-only, khác provider), K2 (read-only producer inline), K3 (docs author openai herdr; reviewer claude herdr read-only), K4 (panel 3 provider), K6 (override reviewer openai, `origin: human-cli`), không có herdr → cli, quota → candidate kế, persona khoá, no-candidate, governance, headless không executor, override vi phạm độc lập từ `agent`.
2. Viết `bind.mjs` tới khi xanh.
3. Test kiến trúc (không import ngoài phạm vi).
4. Commit → merge vào nhánh plan.

## Success Criteria

- [ ] Bảng ca xanh; mọi kết quả có provenance đủ field (gồm `transport`, `posture`, `origin`).
- [ ] Không vai checker nào ra `inline`/`in-process` với executor có CLI.
- [ ] Không có nhánh trả executor khi bị lọc hết (G6).

## Risk Assessment

- `independentOf` theo tập có thể rỗng khi ít provider → từ chối có lý do; doctor (phase 6) kiểm "mỗi capability read-only có ≥ 2 provider family áp được posture".
