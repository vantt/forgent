---
phase: 1
title: "Portable hook door, repair và runnable doctor cho Claude, Codex, AGY, OMP, Pi"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Portable hook door, repair và runnable doctor cho Claude, Codex, AGY, OMP, Pi
## Overview

[Plan và khung](plan.md) là nguồn scope. Thực hiện trong worktree đã tạo, sau khi anh duyệt paths/budget. Không chạy cài đặt/sửa chữa trên project thật trong phase này.

## Requirements
- Functional: consumer không cần source fgOS; cả hai guard (`dispatch-decide` và `decision-question`) giữ nguyên semantics allow/block trên cả 5 agents (Claude Code, Codex, AGY, OMP, Pi); upgrade và project-local precedence không lệch identity.
- Non-functional: giữ user config, migration chỉ exact owned command/file, doctor read-only runnable probe và không chạy arbitrary user commands, không resolver thứ hai.
- Hook registration/repair chỉ trong workspace level của từng agent:
  - Claude Code: `<workspace>/.claude/settings.json`
  - Codex CLI: `<workspace>/.codex/hooks.json`
  - AGY: `<workspace>/.agents/hooks.json`
  - OMP: `<workspace>/.omp/extensions/fgos-hooks.ts`
  - Pi: `<workspace>/.pi/extensions/fgos-hooks.ts`
  Không ghi vào home-global hoặc project khác. Project A/B opt-in độc lập; smoke settings/files A/B/home chứng minh không có cross-project writes từ hook installer.

## Architecture

Owner-locked flow: `fgctl bootstrap → activation từng project → local fgos repair hooks/config/projections`.
1. **Door layer (`bin/fgos.mjs hook <kind>`)**:
   - Stable local shim `.fgos/installation/bin/fgos` → Rust manifest resolver → legacy Node `bin/fgos.mjs hook <kind>` → existing script dưới payload.
   - Hỗ trợ đa giao thức:
     - Claude & Codex: stdin JSON, exit 0 (allow), exit 2 + stderr (block).
     - AGY: stdin JSON camelCase `toolCall`, emit stdout JSON `{"decision":"allow"}` hoặc `{"decision":"deny","reason":"..."}` với exit 0.
     - OMP & Pi: in-process extension template đăng ký `api.on("tool_call")` intercept `task` và `ask`, gọi qua local shim `fgos hook` và trả về `{ block: true, reason }`.
   - CLI hook branch sớm trước `dataDir`, store admission, envelope và invocation-fault mutation.

2. **Installer và Doctor Registry**:
   - Module hóa qua `src/setup/agent-hooks.mjs` (kèm `claude-code-hooks.mjs` backwards-compatible).
   - Doctor checks granular trong `src/setup/registrations.mjs`:
     - `claude-code-hook-wired`
     - `codex-hook-wired`
     - `agy-hook-wired`
     - `omp-hook-wired`
     - `pi-hook-wired`
   - Doctor fix: sửa chữa exact historical entries của Claude, tạo mới hoặc repair file cho Codex/AGY/OMP/Pi; giữ nguyên custom hooks của người dùng.

## Related Code Files

- Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json` — hook selector/protocol đa giao thức.
- Add/Modify: `src/setup/agent-hooks.mjs`, `src/setup/claude-code-hooks.mjs`, `src/setup/registrations.mjs` — managed install/repair/probe và registry checks/fixes cho 5 agents.
- Tests: `test/setup/agent-hooks.test.mjs`, `test/setup/claude-code-hooks.test.mjs`, tests dispatch/decision-question, packaging và rust-host.
- Docs: contract setup-doctor-registry, legacy distribution spec, `docs/io-contract.md` (hook protocol exceptions), changelog.
- Reuse unchanged: `scripts/dispatch-decide-hook.mjs`, `scripts/decision-question-hook.mjs`, `apps/fgos/src/legacy_exec.rs`, `src/setup/bin-discovery.mjs`.
## Implementation Steps

1. Trước edit: LSP references cho exports installer/check; GitNexus upstream impact từng symbol bị đổi; báo callers/processes/risk và cảnh báo HIGH/CRITICAL. Read entry admission/envelope and host routing tests; chỉ edit trong approved frame.
2. Thêm selector `hook` no-store, allowlist hai kinds, invoke script relative từ chính CLI payload; preserve stdin/streams/exit. Hỗ trợ cả exit 0/2 và AGY JSON stdout format. Update command registry + Rust route; unknown kind báo error rõ. Verify host allow 0 và block 2.
3. Dùng stable workspace shim sau activation; reuse validation identity hiện có, không path release tier 0 trả về. Thiếu/hỏng activation phải fail với init/repair instruction, không fallback global/npm/dev. Quote shell literals đúng; không serialize transient dev-host artifact hoặc viết resolver activation mới.
4. Viết adapter install/repair cho cả 5 agents:
   - Claude: migrate exact generated historical entries trong `.claude/settings.json`.
   - Codex: write `.codex/hooks.json` với PreToolUse trỏ vào shim, kiểm tra project trust/hooks feature.
   - AGY: write `.agents/hooks.json` với PreToolUse trỏ vào shim format agy.
   - OMP: write `.omp/extensions/fgos-hooks.ts` intercepting `task` và `ask`.
   - Pi: write `.pi/extensions/fgos-hooks.ts` intercepting `task` và `ask`.
   Bảo toàn adjacent custom hooks và unrelated keys về ngữ nghĩa; JSON/YAML malformed giữ nguyên bytes và báo not wired.
5. Doctor checks & fixes cho 5 agents: tự tính trusted project door, command stored phải bằng canonical serialization; kiểm matcher/type rồi non-shell spawn door với fixed argv và benign input, timeout hữu hạn/captured stderr. Với OMP/Pi: kiểm tra extension syntax và runnable shim. Báo rõ agent nào thiếu/hỏng, fix qua registry mà không yêu cầu legacy setup.
6. Regression tests cho cả 5 agents: legacy migration + preservation/idempotence, malformed config, same-marker custom collision, wrong matcher/type, runnable/import failure, upgrade/runtime precedence và safe quoting.
7. Actual packaged consumer smoke: isolated HOME/state/project, bootstrap/stage runtime A, activate project, local init/doctor fix, execute generated commands/extensions với 5 environments: Claude, Codex, AGY, OMP, Pi. Intercept allow và block đúng cho cả subagent (`Agent`/`Task`/`task`) và decision question (`AskUserQuestion`/`ask`).
8. Negative smoke: thiếu/hỏng activation, missing shim/script/import, path spaces/apostrophe/metacharacters; doctor fail read-only, settings bytes unchanged. Local repair A giữ nguyên project B và host-global config/settings của cả 5 agents.
9. Run targeted Node/host suites once after integration, rồi `npm test`; report unrelated failures, không mở paths/budget để fix. Update spec/contract + Unreleased changelog sau smoke; remove scratch artifacts, docs preview nếu khả dụng. Chưa commit/merge/activate nếu chưa được yêu cầu.

## Success Criteria

- [x] Tất cả acceptance ở plan được chứng minh bằng command output/behavior trên cả 5 agents (Claude Code, Codex, AGY, OMP, Pi).
- [x] Hai hook allow/block đi qua packaged activated Rust host; doctor fail broken commands/activation mà không global fallback.
- [x] Migration, custom preservation, upgrade/local override và idempotence green cho cả 5 agents.
- [x] Test suite và docs hoàn tất trong approved frame.
## Risk Assessment

- Nếu CLI admission hoặc host route không preserve protocol: dùng early hook path, không sửa guard semantics; cần ngoài paths thì replan.
- Legacy compatibility còn tồn tại không phải cửa onboarding mới. Chưa activation phải init trước; không mở fallback để làm smoke xanh.
- Nếu probe benign không bắt lỗi bên trong guard vì fail-open: nó chỉ chứng minh load/import; enforcement bắt buộc được kiểm bằng allow/block smoke riêng, không đổi fail-open scope.
- Nếu runtime upgrade chưa đảm bảo local shim stable: reuse upgrade contract hiện có; bằng chứng mismatch là blocker kiến trúc, không viết activation resolver Node riêng.
- Registry hiện có machine-global fixes: thêm hook fix không tự biến doctor thành project-only. Trước nghiệm thu cửa doctor project-only phải cập nhật approved frame cho scope isolation của registry; không chạy toàn bộ fixes lên HOME thật để chứng minh. Chi tiết và evidence ở plan § Chốt scope với anh.
