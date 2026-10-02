---
title: "P6 Nối thật: herdr làm transport mặc định, posture read-only, fallback quota"
description: "Đóng phần P1 còn dở sau vòng sửa: bind().transport, resolvePosture, nextCandidate đều đã có nhưng không ai gọi. Nối vào đường chạy thật, một đường confinement duy nhất, rồi nghiệm thu bằng lần chạy thật qua pane herdr."
status: in-progress
priority: P1
effort: "~5–6d"
tags: [herdr, transport, posture, confinement, quota, acceptance]
created: 2026-10-02
blockedBy: []
blocks: []
---

# P6 Nối thật: herdr, posture, fallback quota

## Overview

Sau vòng sửa P1–P4 (`9a2e4b0ba`, suite 6404/0), lõi thực thi chạy thật được nhưng **ba cơ chế chốt của P1 chỉ tồn tại dưới dạng hàm không ai gọi**:

| Cơ chế | Hiện trạng (kiểm 2026-10-02) | Mục tiêu owner |
|---|---|---|
| herdr transport (G7) | `bind()` tính `transport` (`src/runner/execution/bind.mjs:252-256`) nhưng `run.mjs` không dùng; mọi lần chạy nghiệm thu là cli headless | **herdr-spawn qua pane là mục tiêu hàng đầu, hơn cả cli-spawn** |
| posture read-only (X-1) | `resolvePosture` (`src/runner/dispatch/confinement/policies.mjs:645`) không có caller, tự dựng `bwrapArgs` riêng (trùng driver `confinement/drivers/bwrap.mjs`); `canApplyPosture` (`:688`) luôn `true` | một posture OS áp cho cả pane herdr lẫn cli, resolve lúc spawn |
| fallback quota (X-3) | `bind().nextCandidate` không có caller ngoài `bind.mjs`; `provider-limit` được phân loại nhưng không ai chuyển candidate | limit → outcome `provider-limit` → candidate kế → pane mới, giữ pane cũ |

Kèm các việc dở từ vòng sửa: 13 capability `marketing:*`/`architecture:*`/`business:*` chỉ nằm trong `.fgos/config.json` (chưa commit, bản gốc `.fgos/config.json.pre-acceptance-261002`), chưa có trong `fgos setup`; synthesizer của `panel` không bị buộc khác panelist; worktree của Unit trong Workflow run không được dọn; chưa so cùng câu hỏi với engine cũ.

Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md). Track đóng sau plan này (P5 không đóng track).

## Quyết định nguồn

synthesis `plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md` §0 G7, §6b X-1/X-3/X-4, §7e; P1 [phase 6](../261001-0327-request-to-run-p1-execution-core/phase-06-readonly-posture-quota-herdr.md); báo cáo vòng sửa + kiểm chứng discussion lead 2026-10-02 (`plans/reports/prompt-261002-1107-request-to-run-fix-round.md`). Giữ D-ADR0033 (executor có CLI luôn out-of-process).

## Luật bằng chứng (bắt buộc)

- "Xong" = test tự động **và** lần chạy thật trên store checkout chính, có `unitRunId`/`workflowRunId` + đường dẫn file; transport đọc từ file (assignment/run record), không từ lời kể.
- Ca không chạy được → ghi **NOT RUN + lý do**, không ghi Accepted.
- Không thêm hàm "đúng chữ ký nhưng không ai gọi": mỗi cơ chế phải có test đi qua `fgos run` (cửa thật), không chỉ test hàm.

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Làm tươi + sự thật](./phase-01-refresh-facts.md) | — | A | plan |
| 2 | [Posture một đường](./phase-02-posture-single-path.md) | 1 | **B** | `src/runner/dispatch/confinement/**`, phần confinement của `src/runner/dispatch/assignment-runner.mjs` |
| 3 | [Capability mặc định + độc lập synthesizer + dọn worktree](./phase-03-setup-defaults-independence-cleanup.md) | 1 | **B** (∥ 2) | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/runner/execution/patterns/panel.mjs`, `src/workflow/runner.mjs`, `.fgos/config.json` |
| 4 | [herdr transport + fallback quota](./phase-04-herdr-transport-quota-fallback.md) | 2 | C | `src/runner/execution/run.mjs`, `src/runner/execution/bind.mjs`, `src/runner/dispatch/transport.mjs`, `herdr-round.mjs`, `herdr-agent.mjs`, `liveness.mjs` |
| 5 | [Nghiệm thu thật qua herdr](./phase-05-real-acceptance-herdr.md) | 3, 4 | D | `reports/**` |
| 6 | [Docs + boundary + đóng track](./phase-06-docs-boundary-close-track.md) | 5 + P5 merge | E | `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, track `plan.md` |

Sóng B: 2 ∥ 3 (khác file). Phase 4 sau 2 vì posture phải áp **trong** pane.

## Sự thật phase 1 (kiểm 2026-10-02, `main` d6df056e4)

1. **Spike** (`plans/261001-0327-request-to-run-p1-execution-core/reports/spike-herdr-bwrap.md`) chạy **tay** (`herdr pane split/run` + bwrap argv gõ tay giống `resolvePosture`), không qua `fgos run`/driver. Chứng minh khả thi (TTY, repo bị chặn, outbox ghi được, claude `-p` cần grant `~/.claude`); **không** chứng minh posture được áp qua code, REPL tương tác dưới bwrap trong pane = NOT RUN.
2. **Đường confinement hiện hành** = `buildConfinementRequest` (`src/runner/dispatch/confinement/request.mjs:~290`, `requirement` suy từ `cfg.capabilities[cap].confinement` hoặc `invocation.confinement` legacy) → `prepareConfinementForLaunch` (`assignment-runner.mjs:2343`, `confinement/authority.mjs`) → driver `confinement/drivers/bwrap.mjs`; backend lấy từ `executors[id].confinement.backend`. Policy built-in `host-write-denied` / `workspace-write` (`policies.mjs:24-61`). `executeAssignment` chỉ dùng `isReadOnlyMode` làm cổng chặn mutating (`assignment-runner.mjs:600-615`), **không** truyền posture → `requirement`. Đường này là đường duy nhất giữ; `resolvePosture` phải trả `{mode:'required', policyId, policy}` đưa vào `buildConfinementRequest({requirement})`.
3. `bind()` chọn invocation = `candidate.invocation` từ `prefer[]` (`bind.mjs`); `transport` tính ở `bind.mjs:252-256` (`hasHerdrCliInvocation` + `session.herdrPresent`) nhưng chỉ ghi vào provenance; `run.mjs:339/350` truyền `preferInvocation: bound.invocation` — là invocation cli (candidate không biết herdr), `transport` không được đọc nên luôn ra cli.
4. Config: 3 invocation `adapter: herdr-spawn` (`.fgos/config.json`, vd `codex-herdr-fgovn` ~:404); chúng **không** khai `confinement` (cli tương ứng có `backend: bwrap`). `herdr` = `~/.local/bin/herdr`, `HERDR_ENV=1` có trên session này; `bwrap` = `/usr/bin/bwrap`.
5. `provider-limit` phân loại ở `liveness.mjs` + `run.mjs` (`category==='infra'` và `failure.code ∈ {provider-limit, paused-limit}`); `nextCandidate` (`bind.mjs`) không có caller; patterns chưa xử lý outcome này.

## Success Criteria

- [x] `fgos run` chọn herdr khi herdr có mặt và executor có invocation herdr; cli khi headless — test `test/runner/execution/run-herdr.test.mjs` qua `runUnit`; lần chạy thật: transport `herdr` đọc từ `assignment.json` (ca 1–4, ca 3 cả 9 role), `cli` ở ca 6.
- [x] Một đường confinement: `resolvePosture` -> `requirement` -> `buildConfinementRequest` -> driver bwrap, cho herdr và cli; `canApplyPosture` phản ánh backend thật; không còn `bwrapArgs` trong `policies.mjs`.
- [x] Reviewer read-only chạy thật: ghi repo bị chặn, ghi outbox được — qua pane herdr (ca 2, ca 3) và cli (ca 6).
- [x] `provider-limit` -> `nextCandidate` -> candidate kế (pane mới, pane cũ giữ) — test qua `runUnit` + lần chạy thật ca 4 **bằng màn hình limit giả**; màn hình limit thật chưa đo.
- [x] Capability workflow có trong `fgos setup` + doctor (`workflow-capabilities-configured`; phủ cả 27 capability của mọi Workflow đã ship, không chỉ 13); `.fgos/config.json` commit khớp; synthesizer khác họ provider với panelist; worktree Unit được dọn khi Workflow run kết thúc.
- [x] Chạy lại qua pane herdr: Unit `reviewed` (ca 1) và Workflow `architecture-advisory` (ca 3). So cùng câu hỏi với engine cũ = **NOT RUN** (ca 5; lý do ở [acceptance-herdr.md](./reports/acceptance-herdr.md)) — phương án "ghi NOT RUN + lý do" của tiêu chí, không phải đã so.
- [ ] Full `npm test` (Node + Rust) xanh trên nhánh (báo cáo nghiệm thu: lần chạy cuối 6550 test, 0 fail) **và** merge `main` — chờ controller merge. Track đóng sau đó.

## Báo cáo

[phase-02](./reports/phase-02-report.md) · [phase-03](./reports/phase-03-report.md) · [phase-04](./reports/phase-04-report.md) · [nghiệm thu herdr](./reports/acceptance-herdr.md) (PARTIAL: ca 1, 2, 3, 4, 6 Accepted; ca 5 NOT RUN).

## Trạng thái

Phase 1–5 complete; phase 6 in-progress (hoàn tất khi controller merge `main`).

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| REPL tương tác trong bwrap thiếu quyền (TTY, cache, credentials) trong pane | agent trong pane treo/không đăng nhập được | grant tối thiểu tường minh (executor-credentials read); không mở rộng ngầm; nếu không đạt → dừng, báo owner (cổng G7) |
| herdr không có mặt khi agent thực thi chạy headless | `HERDR_ENV` không có | nghiệm thu herdr phải chạy trong session herdr; nếu không thể → NOT RUN, báo owner |
| Hai đường confinement còn song song | `rg bwrapArgs src/runner/dispatch/confinement/policies.mjs` còn | phase 2 xoá; guard test |
| Executor giả lập limit khác màn hình thật | fallback chạy với giả nhưng không với thật | ghi rõ giới hạn trong báo cáo; giữ pattern `DEFAULT_USAGE_LIMIT_PATTERNS` làm nguồn |

## Câu hỏi mở

Không có. Cổng dừng: phase 4/5 không đưa được agent tương tác + posture vào pane herdr → dừng, báo owner (G7 là mục tiêu hàng đầu).

<!-- slug: request-to-run-p6-herdr-posture-quota -->
