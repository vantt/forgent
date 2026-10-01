---
title: "P1 Lõi thực thi: Unit, một bind(), một cửa chạy, 3 Pattern cộng tác"
description: "Đóng mối authority L5: 'ai làm' một chỗ (bind), 'chạy qua cửa nào' một cửa, read-only một posture; lõi mới không phụ thuộc L3. Gộp plan read-only X."
status: pending
priority: P1
effort: "~9–11d"
tags: [dispatch, execution-core, bind, collaboration-pattern, read-only, observe]
created: 2026-10-01
blockedBy: [project:plan/260930-tier-rigor-consolidation]
blocks: [261001-0327-request-to-run-p2-runnable-plans, 261001-0327-request-to-run-p3-workflow-separate-from-work]
---

# P1 Lõi thực thi

## Overview

Xây **mô hình gọn** ở L5: hợp đồng **Unit**; một hàm thuần **`bind()`** (bảng 5 mức, bộ lọc, provenance, chọn cơ chế); **3 Pattern cộng tác** bằng code nhỏ (`solo`, `reviewed`, `panel`); **một cửa chạy** `fgos run` bọc `executeAssignment`; read-only là **posture** confinement; fallback theo quota qua `bind()`. Xoá các đường chọn người/cửa chạy cũ. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Mối authority phải đóng (tiêu chí xong — synthesis §7d)

| Mối | Chủ duy nhất sau P1 |
|---|---|
| "ai làm / model / persona" cho mọi lần chạy (lõi mới + đường coordination còn sống) | `src/runner/execution/bind.mjs` |
| "chạy qua cửa nào" | `fgos run` → `executeAssignment` (xoá `dispatch-runs`/`execute` thường) |
| "read-only là gì" | một posture confinement resolve lúc spawn (primary + fallback + resume) |
| lõi mới không phụ thuộc Work (A4) | guard test: `src/runner/execution/**` không import `src/state/**` |

## Quyết định nguồn (không mở lại — synthesis)

D0–D7 (§6), bảng 5 mức + 3 ngoại lệ (§6), cơ chế inline/in-process/out-of-process (§6), override một lần có scope (§6 mức 4), Q0 mô hình gọn, Q4 red-team bắt buộc cho code + `checkersByRigor`, Q6 persona khoá, Q9 bỏ protocol stamp (supersede ADR-006 §6), X gộp (§6b), A4/A5/A6 (§7d), G1–G6 + 8 tiêu chí (§0), bake-off đã sửa (§4b).

## Hợp đồng dữ liệu (định nghĩa trước để các phase song song)

```yaml
# Unit (phase 2 định nghĩa schema; mọi phase dùng)
unit:
  id: area-runner
  objective: "…"
  capability: docs:write          # domain:verb, fallback verb
  rigor: high                     # low|standard|high|critical (T)
  writes: [docs/platform/runner/**]   # rỗng = chỉ đọc
  dependsOn: []
  pattern: reviewed               # tuỳ chọn; vắng thì rule config
  inputs: []                      # ref tới RunResult/artefact được phép thấy (visibility)
  expectedOutputs: ["…"]

# Khẩu vị (config, mức 1–2)
runner:
  capabilities:
    docs:write:  { prefer: [{executor: openai, invocation: …}], rigor: high? }
    docs:review: { prefer: [{executor: claude, invocation: claude-cli-bwrap}], confinement: {mode: required, policy: host-write-denied}, persona: docs-reviewer }
    code:implement: { prefer: […gemini…], minCheckers: [reviewer, red-team], verify: "npm test" }
  patterns:
    defaultRule: { mutatingMinRigor: standard }     # writes≠∅ & rigor≥standard → reviewed; còn lại solo
    reviewed: { maxRounds: 2, checkersByRigor: { low: [reviewer], standard: [reviewer], high: [reviewer, red-team], critical: [reviewer, red-team] } }

# bind(): đầu vào/ra (phase 3)
in:  { unit, role, readOnly, independentOf: [boundRef…], lockedPersona?, overrides[{scope}], session: {provider, tier, hasAgentTool} }
out: { executor, invocation, tier, model, persona, mechanism: inline|in-process|out-of-process, provenance: {field: {value, source}} }
     | { refused: { reason, detail } }

# RunResult outcome (phase 4, 5)
outcome: pass | findings | execution-failure | policy-refusal | blocked   # finding KHÔNG phải failure
```

Store mới: `.fgos/unit-runs/<unitRunId>/events.jsonl` (JSONL — luật L3 nền tảng) giữ: unit, overrides, trạng thái vòng lặp pattern (để resume). Assignment mang `unitRunId` + `role` + `round`. Phase 1 kiểm lại xem có nên tái dùng shape của `packages/coordination-state` thay vì store mới (quyết bằng bằng chứng, ghi lại).

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file (độc quyền trong sóng) |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | T merge | A | — (chỉ đọc + sửa plan) |
| 2 | [Unit + khẩu vị config](./phase-02-unit-and-taste-config.md) | 1 | **B** | `src/runner/execution/unit.mjs` (mới), `src/runner/dispatch/config.mjs`, `src/setup/registrations.mjs`, `src/setup/checks.mjs` |
| 3 | [bind() lõi](./phase-03-bind-core.md) | 1 | **B** | `src/runner/execution/bind.mjs` (mới) + test |
| 4 | [Vòng lặp Pattern cộng tác](./phase-04-pattern-loops.md) | 1 | **B** | `src/runner/execution/patterns/**` (mới) + test |
| 5 | [Cửa chạy `fgos run`](./phase-05-run-door.md) | 2, 3, 4 | C | `src/runner/execution/run.mjs` (mới), `src/runner/dispatch/assignment-runner.mjs` (cổng mutating, ghi `unitRunId`), `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/cli.mjs` (xoá `openDispatchRun`/`execute` thường), `src/runner/dispatch/assignment.mjs` (persona body), `bin/fgos.mjs` + `src/cli/command-registry.mjs` (verb `run`), `packages/run-result/rust`, `packages/observe/rust` (nhóm theo `unitRunId`) |
| 6 | [Read-only posture, quota, herdr (gộp X)](./phase-06-readonly-posture-quota-herdr.md) | 5 | **D** | `src/runner/dispatch/assignment-runner.mjs` (khối redirect ~1428-1455, chọn invocation fallback ~2318-2353), `src/runner/dispatch/placement-policy.mjs` (xoá), `src/runner/dispatch/confinement/**`, `src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/provider-adapter.mjs`, `src/runner/dispatch/transport.mjs` |
| 7 | [Đường coordination dùng bind()](./phase-07-coordination-path-on-bind.md) | 5 | **D** | `src/verbs/coordination/binding.mjs`, `src/verbs/coordination/composers.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/definitions/schema.mjs` (PolicyPatch), `core/coordination-protocols/standalone-master-coordination-loop.yaml`, `domains/coding/workflows/feature.yaml:65` |
| 8 | [Nghiệm thu ca 1 + docs + boundary](./phase-08-acceptance-docs-boundary.md) | 6, 7; việc lẻ A, B | E | `.fgos/config.json`, `~/.fgos/config.json` (giá trị khẩu vị), `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, `test/architecture*.test.mjs` |

Sóng B: 3 phase song song (file mới hoặc khác nhau; 3 và 4 dùng hợp đồng ở trên, test bằng fixture/stub, không cần 2 xong). Sóng D: 6 ∥ 7 (khác vùng file; `assignment-runner.mjs` chỉ thuộc 6, `resolve.mjs`/`assignment-policy.mjs` chỉ thuộc 7). Mỗi phase một worktree; merge vào nhánh plan theo thứ tự xong.

## Success Criteria

- [ ] 4 mối authority ở bảng trên có đúng một chủ; guard test L5-execution → L3 xanh.
- [ ] `rg -n "readOnlyRedirects|placement-policy|openDispatchRun|dispatch-runs|PROTOCOL_OPERATION_STAMP|executors\.\w+\.for\b|preferPersona|'code-reviewer'" src` → chỉ còn chỗ có lý do ghi trong báo cáo phase (mục tiêu: rỗng).
- [ ] Mọi assignment có `provenance.binding` (chuỗi 5 mức); doctor check "RunResult ghi file phải có provenance.binding".
- [ ] Nghiệm thu ca 1 đạt G1–G6 và không thua engine ở tiêu chí 1, 2, 4; đúng người: lệch không lý do = 0 (phase 8).
- [ ] `docs/specs/runner.md` có quyết định mới (gồm supersede ADR-006 §6); component-boundary cập nhật authority L5; CHANGELOG.
- [ ] Full `npm test` xanh trên nhánh plan; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng định trước |
|---|---|---|
| Bỏ protocol stamp mở cửa ghi file cho caller đi vòng `bind()` | doctor check provenance fail; run ghi file ở checkout chính | cổng = posture worktree **và** `provenance.binding` hợp lệ; test âm |
| Vòng lặp pattern thiếu luật engine đang có (recheck, disposition) → chất lượng tụt | ca 1: tỉ lệ finding chấp nhận thấp hơn nhánh engine; reviewer < 3 phút, 0 finding liên tiếp | bổ sung luật cụ thể vào `reviewed`; không mang lại engine |
| Resume sau crash tự xây yếu | ca kill-resume fail | assignment id tất định `unitRunId/role/round` + `admitRunAttempt`; store `unit-runs` JSONL |
| Read-only bằng confinement làm vỡ pane herdr / project khác thiếu `executors.claude` | X ràng buộc 1, 7 | doctor quét step read-only × executor; quyết herdr ở phase 6 bước 1 |
| Đổi `code:review` → claude kích hoạt redirect | review chạy openai lặng lẽ | `prefer` luôn kèm invocation cho tới khi phase 6 xoá redirect (đã kiểm: invocation trong prefer → `hasExplicitInvocationPin`) |

## Câu hỏi mở

1. Phase 6: trigger fallback quota — khai `runner.providers.<p>.accounts` hay classifier lỗi usage-limit lúc runtime? (X câu hỏi brainstorm; cần owner, liên quan bảo mật/chi phí.)
2. Phase 6: pane herdr cho vai read-only — giữ (cần confinement cho herdr-spawn) hay bỏ cho reviewer? (A5)
3. Phase 1: store `unit-runs` mới hay tái dùng shape `coordination-state`?

<!-- slug: request-to-run-p1-execution-core -->
