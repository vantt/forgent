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

Viết **`bind()`** — hàm thuần, chỗ duy nhất quyết executor / invocation / tier / model / persona / cơ chế chạy cho một vai của một Unit, theo **bảng 5 mức** (synthesis §6), kèm provenance từng field và từ chối có lý do (G6). Chưa nối vào đường chạy (phase 5, 7 nối).

## Requirements

- Functional:
  - **Executor (+invocation)**: override mức 4 (`overrides[{scope:{unit?,role?}}]`) → `capabilities[domain:verb].prefer[]` → `capabilities[verb].prefer[]` (project đè global theo key) → không còn gì: `inline` nếu có Lead, lỗi rõ nếu headless. **Không** mặc định `claude`. Mức 3 (unit/Workflow) không bao giờ chọn executor.
  - **Bộ lọc** áp lên mọi candidate: `readOnly` (chỉ nhận candidate có posture read-only — hàm kiểm posture do phase 6 cung cấp; phase này dùng interface `isReadOnlyCapable(candidate, config)` với cài đặt tạm theo `confinement` của capability), `independentOf` (khác provider family với vai đã bind; giải theo tập vai đã bind truyền vào, không theo thứ tự mảng). Override vi phạm `independentOf` → từ chối, trừ khi override có `acceptDependence: true`.
  - **Governance** (`disallowedProviders/Executors`) phủ quyết cuối.
  - **Tier**: `rigor = max(rigor unit/step, capabilities[cap].rigor) ?? standard`; `tier = max(rigorToTier[rigor], override.tier)`; `model = resolveTierModel(cfg, tier, provider)` (hàm của T). Không hạ được sàn.
  - **Persona**: override → persona khoá bởi Workflow (`lockedPersona`; override **không** thay được — trả lỗi rõ, Q6) → vai do step khai → `capabilities[cap].persona` → không có.
  - **Cơ chế**: candidate khác provider với session Lead → `out-of-process`; cùng provider và (vai cần context sạch: `reviewer`/`red-team`/panel member, hoặc tier khác session, hoặc song song) → `in-process` (trả `model` cho Agent tool); cùng provider, `tier session ≥ tier`, vai không cần độc lập → `inline`.
  - **Provenance**: `{executor:{value,source}, invocation…, tier…, model…, persona…, mechanism…}`; `source` ∈ `override|lockedPersona|unit|capability:<key>|capability-fallback:<verb>|default|session`.
  - Từ chối: `{refused:{reason: no-candidate|independence|governance|locked-persona|headless-no-executor, detail}}` — không bao giờ tự hạ (G6).
- Non-functional: hàm thuần (không I/O ngoài đọc config đã truyền vào); không import `src/state/**`; không import `src/runner/coordination/**`.

## Architecture

```text
bind(ask, ctx) ── candidates(prefer[] theo mức) ─► filter(readOnly, independentOf, governance) ─► pick first
                └► tier = max(rigorToTier[max(rigor…)], override.tier) ─► resolveTierModel
                └► persona chain ─► mechanism rule ─► provenance
```

Thiết kế theo hợp đồng operation (request/outcome contract, authority policy) như kernel Rust `packages/host-runtime/rust/src/operation_provider_router.rs` (A6, điều chỉnh 5): input/output là object thuần, có `contractVersion`.

## Related Code Files

- Create: `src/runner/execution/bind.mjs`, `test/runner/execution/bind.test.mjs` (bảng ca K1–K6 + ca âm)
- Read-only tham chiếu: `src/runner/dispatch/resolve.mjs` (`resolveTierModel`, `deriveProviderFamily`, `normalizePreferCandidates`), `src/verbs/coordination/binding.mjs` (logic `distinctProviderFrom` để tái dùng ý, không import)

## Implementation Steps

1. Viết bảng test trước (table-driven): K1 (code, author gemini out-of-process, reviewer claude in-process khác provider), K2 (read-only inline), K3 (docs author openai flagship, reviewer claude bwrap), K4 (panel 3 provider khác nhau), K6 (override reviewer openai), persona khoá, no-candidate, governance, headless không executor, override vi phạm độc lập.
2. Viết `bind.mjs` tới khi bảng xanh.
3. Thêm test kiến trúc: `src/runner/execution/**` không import `src/state/**`, `src/runner/coordination/**`.
4. Commit → merge vào nhánh plan.

## Success Criteria

- [ ] Bảng ca K1–K6 + 6 ca âm xanh; mọi kết quả có provenance đủ field.
- [ ] Không có nhánh nào trả executor khi bị lọc hết (G6).
- [ ] Test kiến trúc xanh.

## Risk Assessment

- `independentOf` theo tập đã bind có thể ra rỗng với panel lớn (ít provider) → từ chối có lý do; doctor (phase 8) kiểm "mỗi capability read-only có ≥ 2 provider family có posture read-only".
- `isReadOnlyCapable` tạm có thể khác cài đặt thật của phase 6 → interface cố định ở phase này; phase 6 chỉ thay cài đặt.
