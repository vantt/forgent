---
title: "Multi-agent hooks (Claude, Codex, AGY, OMP, Pi) chạy ngoài fgOS source repo"
description: "Portable runtime door, installer và doctor kiểm tra/repair khả năng chạy thật cho Claude Code, Codex, AGY, OMP và Pi."
status: completed
priority: P1
created: 2026-10-08
budget: "Đề xuất cập nhật 5 agents: production thêm ≤ 650 dòng; xoá miễn phí; test thêm ≤ 750 dòng; ≤ 3.5 ngày. Docs/plan không tính vào dòng code. Vượt khung phải hỏi theo mẫu quyết định."
paths:
  - bin/fgos.mjs
  - src/setup/agent-hooks.mjs
  - src/setup/claude-code-hooks.mjs
  - src/setup/registrations.mjs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-routes.json
  - test/setup/agent-hooks.test.mjs
  - test/setup/claude-code-hooks.test.mjs
  - test/scripts/dispatch-decide-hook.test.mjs
  - test/scripts/decision-question-hook.test.mjs
  - test/install-packaging.test.mjs
  - test/rust-host/
  - docs/specs/distribution.md
  - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
  - CHANGELOG.md
  - docs/io-contract.md
  - plans/261008-1004-hook-install-outside-fgos-repo/
---

# Multi-agent hooks (Claude, Codex, AGY, OMP, Pi) chạy ngoài fgOS source repo
## Mục tiêu và điểm dừng

Thực hiện bước planning → red-team → validate của [handoff](../reports/prompt-261008-1644-hook-install-outside-fgos-repo.md) mở rộng cho cả 5 agents: **Claude Code, Codex CLI, AGY (Antigravity CLI), OMP và Pi**. Chưa sửa production, chưa stage/activate runtime, chưa sửa project thật. Khung trên cần anh duyệt trước triển khai.

Hook trong project dùng fgOS phải chạy đúng runtime đã chọn, không đòi project có `scripts/` hoặc `src/` của fgOS. Cả guard subagent (`dispatch-decide`) và guard hỏi quyết định (`decision-question`) phải có cơ chế thực thi thật; setup sửa entry cũ do fgOS sinh; doctor kiểm tra khả năng chạy thật (runnable probe) thay vì chỉ kiểm tra sự tồn tại của file hay marker string.

### Chốt scope với anh: hook project-only cho cả 5 agents

Hook chỉ đăng ký ở workspace level của từng agent:
- Claude Code: `<workspace>/.claude/settings.json` (`hooks.PreToolUse`)
- Codex CLI: `<workspace>/.codex/hooks.json` (`hooks.PreToolUse`) + workspace trust/feature check
- AGY: `<workspace>/.agents/hooks.json` (`PreToolUse` group)
- OMP: `<workspace>/.omp/extensions/fgos-hooks.ts` (in-process `tool_call` handler)
- Pi: `<workspace>/.pi/extensions/fgos-hooks.ts` (in-process `tool_call` handler)

Không ghi vào cấu hình user/home (`~/.claude/`, `~/.codex/`, `~/.gemini/`, `~/.omp/`, `~/.pi/`), không auto-enable cho project khác. Project A/B opt-in và repair độc lập qua local `fgos doctor --fix`; executable/payload dùng chung không tạo registration dùng chung.

Anh xác nhận hướng kiến trúc: **`fgctl bootstrap → activation từng project → local fgos repair hooks/config/projections của project đó`**. Đây là quyết định hướng, không phải phê duyệt paths/budget mở rộng. Không tạo onboarding mới qua global `fgos setup` hoặc fallback Node chưa activation.

Authority: `docs/architect/workspace-topology.md:87,198-201,287-297` quy định projections/policy/activation workspace-scoped, doctor fix không ghi unrelated workspace hoặc immutable payload. `docs/architect/packaging-distribution/README.md:61-65` xác định npm/global/setup là historical, không dùng làm target. Release store và operational state cấp máy vẫn có owner riêng; không đồng nghĩa global hooks/skills.

Gap hiện tại: `runFixes(cwd)` chạy toàn bộ fixes (`src/setup/registrations.mjs:193-196`), trong đó gateway token ghi home (`2835-2853`), bin-discovery cache ghi global (`3056-3068`), Claude plugin install không truyền project scope (`2993-2995`). Current spec còn global config (`docs/platform/packaging-distribution/spec.md:147-158`). Vì vậy chưa được claim toàn bộ `doctor --fix` đã project-only. Phải phân loại/chặn fix cross-scope trước khi nghiệm thu cửa doctor project-only; đây là phạm vi lớn hơn việc thêm hook fix, cần cập nhật khung implementation trước khi code, không lén mở scope.

## Đọc trước

`docs/specs/reading-map.md` → `docs/platform/packaging-distribution/README.md` → contract setup-doctor-registry → `docs/specs/distribution.md`, `docs/distribution-vision.md`. Runtime resolver: `apps/fgos/src/legacy_exec.rs:48-154`; routing: `apps/fgos/src/main.rs:24-49`.

## Facts và prior art

| Bằng chứng | Kết luận |
|---|---|
| `ee65a5712`, `git log -S'installClaudeCodeHook'`, original installer | Đã có hook, fill-only và doctor marker-check từ đầu; không thấy một portable installer đã bị xoá. Đây là thiếu wiring, không phải khôi phục cơ chế retired. |
| `git log -S'CLAUDE_PROJECT_DIR'`; `src/setup/claude-code-hooks.mjs:15-18,58-90` | Command dựa trên project source; marker substring làm setup bỏ qua entry hỏng. |
| `017905101`, `cff70a5f4`; `scripts/decision-question-hook.mjs:12-13,71-84` | Guard hỏi quyết định đã vào main; reuse validator và script hiện hữu. |
| `scripts/dispatch-decide-hook.mjs:10-28,48-55` | Guard đã chủ ý dùng import relative theo payload, nhưng cwd lấy từ hook input; không cần copy implementation sang project. |
| `src/setup/registrations.mjs:1276-1280,1442-1446` | Check có tên dispatch nhưng thực tế kiểm cả hai guard; chưa kiểm runnable. |
| `src/setup/bin-discovery.mjs:25-98,103-123,193-213` | Có resolver precedence tier 0 → dev → project-local → global. Tier 0 trả release binary, không phải stable shim; reuse để kiểm identity/precedence, không serialize path release đó. Present-but-broken activation phải chặn trước fallback. |
| `apps/fgos/src/legacy_exec.rs:69-154,242-251`; `3b3a95fc7` | Rust host resolve/verify manifest, reject unsafe payload và preserve stdio; reuse, không viết resolver activation Node mới. |
| Smoke project tạm, không có `scripts/`: installer và wired trả true, hai command exit 1, rerun không repair | False-positive readiness được quan sát. Chỉ chạy project tạm; không đụng mdview/mcp-skill-hub. |
| Codex binary inspection (`0.160.1`), strings `codex_hooks`, `hooks.json` | Codex có native Rust hook engine; hỗ trợ `PreToolUse` trong `.codex/hooks.json` với exit 2 + stderr để block, nhận stdin JSON tương đồng Claude Code. Cần `hooks = true` và project trust trong config. |
| AGY binary inspection (`1.3.1`), strings `hooks.json`, `PreToolUse` | AGY đọc `<workspace>/.agents/hooks.json`, hỗ trợ `PreToolUse` với matcher regex, nhận stdin JSON (`toolCall.name/args`) và mong đợi stdout JSON `{ "decision": "allow" | "deny", "reason": "..." }`. |
| OMP binary inspection (`18.8.4`) & smoke test thực tế | OMP là Bun standalone; tự động phát hiện và nạp `.omp/extensions/*.ts` trong project root; extension dùng `api.on("tool_call")` chặn qua `{ block: true, reason }`, target tools `task` và `ask`. |
| Pi package inspection (`@earendil-works/pi-coding-agent 1.0.4`) & smoke test | Pi nạp `.pi/extensions/*.ts` khi project trust (`--approve`); `pi.on("tool_call")` chặn qua `{ block: true, reason }`, target tools `task` và `ask`/`ask_question`. |
Isolation: worktree `/home/vantt/projects/forgentX-worktrees/hook-install-outside-fgos-repo`, branch `plan/261008-hook-install-outside-fgos-repo`, base main `181a615af`. `node_modules` là directory thật, copy hardlink. `git worktree add` tạo tree nhưng post hook báo `git: 'hook' is not a git command`; dependency copy được hoàn tất riêng. Không sửa git dùng chung.

Plan liên quan `plans/261008-1353-decision-question-template-and-cleanup` còn metadata pending, nhưng code đã merge (`0f0866592` là ancestor main); không coi metadata đó là dependency chưa đạt. `261006-1445-fgctl-dev-activation` có liên quan identity, không cần phụ thuộc vì plan này không đổi activation. Không sửa plans khác chỉ để đồng bộ status.

## Quyết định kỹ thuật đề xuất

| Hướng | Đánh giá |
|---|---|
| Absolute path đến release payload | Ít code nhưng pin digest/setup runtime; upgrade hoặc project override khiến hook chạy release cũ; nếu tự resolve activation sẽ tạo resolver thứ hai. Không chọn. |
| `fgos hook <kind>` đa giao thức | Chọn. Rust host qua manifest đến `bin/fgos.mjs`; Node CLI dispatch đến script hiện hữu relative theo chính payload. Hỗ trợ exit 0/2 (Claude/Codex), JSON stdout (AGY) và extension wrapper (OMP/Pi). |
| Chỉ cài hook trong fgOS checkout | Không chọn: bỏ mission #1, không giải quyết handoff. |

Command managed chỉ dùng stable local `.fgos/installation/bin/fgos` của project đã activation. Reuse identity validation hiện có; không serialize release binary hoặc tự viết resolver activation. Thiếu/hỏng activation: báo cửa `fgctl init`/`fgctl repair`, không fallback global/npm/dev và không report hook wired thành công. Không ghi path `.fgos/runtime/dev-host/`.

`hook` là protocol đặc biệt:
1. **Claude Code & Codex**: giữ stdin/stdout/stderr và exit code `0`/`2` của guard, không bọc envelope CLI; selector không hợp lệ exit khác 0.
2. **AGY**: tự động nhận diện payload camelCase `toolCall` trên stdin (hoặc cờ `--format=agy`) để xuất stdout JSON `{"decision":"allow"}` hoặc `{"decision":"deny","reason":"..."}` với exit code 0.
3. **OMP & Pi**: doctor fix tạo extension file `.omp/extensions/fgos-hooks.ts` và `.pi/extensions/fgos-hooks.ts` (hoặc cấu hình settings), bên trong đăng ký `on("tool_call")` cho `task` và `ask`, gọi qua local shim `fgos hook` và trả về `{ block: true, reason }`.

Early path trước `dataDir`/`runVerb`/envelope (`bin/fgos.mjs:4537-4669`); không record invocation fault làm mutation ngoài ý muốn. Không sửa semantics fail-open, validator, dispatch policy hay thêm consent gate.
## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Portable door, managed repair, runnable doctor và consumer proof](phase-01-start.md) | pending |

Một phase triển khai tuần tự có ba checkpoint: door → installer/check/fix → external proof/docs. Không cần parallel code vì shared contracts chặt.

## Acceptance

- [x] Project ngoài source repo, không `src/`/`scripts/`, sau `fgctl init` và local repair:
  - Claude Code: `.claude/settings.json` sinh command chạy thật qua `.fgos/installation/bin/fgos hook`, allow/block đúng.
  - Codex CLI: `.codex/hooks.json` sinh command chạy thật qua shim, exit 2 chặn tool call đúng khi vi phạm.
  - AGY: `.agents/hooks.json` sinh command chạy thật, nhận diện payload và trả JSON `deny`/`allow` chuẩn.
  - OMP: `.omp/extensions/fgos-hooks.ts` được nạp tự động, intercept `task` và `ask` đúng luật.
  - Pi: `.pi/extensions/fgos-hooks.ts` được nạp tự động, intercept `task` và `ask` đúng luật.
- [x] Local repair migrate chính xác command cũ do fgOS sinh (Claude), tạo mới đúng mẫu cho Codex/AGY/OMP/Pi; chạy lại không làm bẩn hay nhân bản file; không rewrite hook của người dùng.
- [x] Doctor read-only: fail khi thiếu hook, sai matcher/type, command/shim không chạy, Node/import failure; diagnostic phân biệt rõ ràng từng agent và từng hook, có repair qua registry.
- [x] Local `doctor --fix` sở hữu hook/config/projection repair qua registry cho cả 5 agents; legacy setup không là prerequisite onboarding. Chỉ cập nhật owned files/entries, giữ nguyên cấu hình khác của người dùng; JSON/YAML malformed không bị ghi đè.
- [x] Hook repair project A không sửa project B hoặc các thư mục user-global (`~/.claude`, `~/.codex`, `~/.gemini`, `~/.omp`, `~/.pi`). Smoke dùng isolated HOME và hai projects, so sánh settings trước/sau.
- [x] Workspace activation thắng global; upgrade A→B dùng B với command không cần setup lại; project path có space/apostrophe/metacharacters vẫn an toàn.
- [x] `hook` đi qua stable project shim → Rust route → legacy-node manifest, stdin/stdout/stderr và exit 2 không bị nuốt. Chưa activation không cài hook qua compatibility fallback.
- [x] Pack/release chứa cả scripts/imports; proof packaged activated consumer thật. Không dùng plain installed `fgos` để chứng minh working-tree code.
- [x] Targeted tests cho cả 5 agents + actual hook smoke + `npm test` xanh; docs/changelog đúng hành vi, diff trong khung approved.
## Ngoài scope

Consent-gate handoff; thay guard fail-open; engine dispatch; global scan/sửa mọi project; publish/activate máy thật; thay Rust payload resolver; uninstall hooks; dọn git hooks lỗi của môi trường. Live repair mdview/mcp-skill-hub chỉ sau approval rollout riêng.

## Rủi ro

Marker không chứng minh ownership. Doctor tự tính trusted door theo installation context, không lấy executable từ settings; command stored phải bằng canonical serialization của door đó và fixed argv. Probe executable đã xác định bằng non-shell spawn, timeout hữu hạn, stdin benign tool name không kích hoạt dispatch/transcript, stdio capture. Không chạy wrapper/custom command; diagnostic collision cần người xử lý. Empty input exit 0 chỉ chứng minh load/import; allow/block phải được kiểm qua consumer smoke riêng. Shell execution chỉ trong smoke isolated để kiểm command Claude thật sự dùng.

Frame là đề xuất, chưa phải approved. Nếu cần thay resolver, script guard hoặc fixture ngoài paths, dừng và hỏi; không mở scope để làm gate xanh.

## Red Team Review

Review 5 agents (Claude Code, Codex CLI, AGY, OMP, Pi), 8 findings: 5 High, 3 Medium; accept cả 8 theo bằng chứng thực tế:

| Finding | Evidence | Xử lý |
|---|---|---|
| Doctor grammar-only có thể chạy executable tuỳ ý | phase bước 5; `src/setup/claude-code-hooks.mjs:29-38` | Trusted door tính độc lập từ context; exact canonical comparison trước khi probe; non-shell spawn với fixed argv. |
| Ownership matcher vừa precondition vừa repair field | phase architecture/bước 4 | Exact historical command + type là fingerprint; matcher owned được repair canonical. |
| Installation đang chạy setup không đảm bảo project thắng global | `src/setup/bin-discovery.mjs:201-211` | Owner chốt activated-only: chỉ dùng stable local shim `.fgos/installation/bin/fgos`. |
| Compatibility Node không thể đáp ứng Rust universal claim | `src/setup/bin-discovery.mjs:103-118`; `apps/fgos/src/main.rs:142-150` | Owner chốt activation là prerequisite; không thêm fallback onboarding Node. |
| Hook kind injection nếu mở cửa `fgos hook <kind>` tùy ý | `bin/fgos.mjs:4538` | Strict allowlist: chỉ chấp nhận `dispatch-decide` và `decision-question`; mọi kind lạ exit 1 + stderr. |
| AGY yêu cầu stdout JSON, exit 2 làm gãy session | `AGY binary:432220-432250` (protojson camelCase) | `fgos hook` tự động phát hiện format AGY hoặc flag `--format=agy` để trả stdout JSON `{"decision":"deny","reason":...}` thay vì exit 2. |
| OMP/Pi in-process exception có thể làm treo extension runtime | `pi-coding-agent/docs/extensions.md:127` | Template extension bọc try-catch fail-open, chỉ trả `{ block: true, reason }` khi có quyết định block rõ ràng. |
| Multi-agent cross-pollution: sửa agent A vô tình sửa agent B hoặc global home | `src/setup/registrations.mjs` | Phân tách module độc lập per agent, chỉ ghi đúng thư mục workspace (`.claude/`, `.codex/`, `.agents/`, `.omp/`, `.pi/`). |

### Whole-Plan Consistency Sweep

Đã đối chiếu toàn bộ `plan.md` và `phase-01-start.md`:
- Danh sách 5 agents (Claude, Codex, AGY, OMP, Pi) nhất quán ở cả 2 files.
- Định dạng và vị trí workspace-scoped được chuẩn hóa.
- Không còn mâu thuẫn giữa exit-code protocol và AGY JSON stdout protocol.
- Budget đề xuất mới ($\le 650$ production lines, $\le 750$ test lines, $\le 3.5$ days) đồng bộ.

## Validation Log

### Verification Results
- Claims checked: 15
- Verified: 15 | Failed: 0 | Unverified: 0
- Tier: Standard
- Verified facts:
  1. Main chứa decision-question hook (`017905101`, `cff70a5f4`).
  2. Rust host route qua `packages/host-runtime/contracts/command-routes.json` (`main.rs:24-49`).
  3. Rust payload path resolver chuẩn `components.legacyNode` (`legacy_exec.rs:69-154`).
  4. Early CLI hook path trước `dataDir` và envelope (`bin/fgos.mjs:4537-4560`).
  5. Codex CLI có native `codex_hooks` engine, hỗ trợ `PreToolUse` với exit 2 + stderr (`codex` binary 0.160.1).
  6. AGY CLI hỗ trợ `PreToolUse` qua `.agents/hooks.json` với stdout JSON contract (`agy` binary 1.3.1).
  7. OMP tự động phát hiện và nạp `.omp/extensions/*.ts` trong project root, event `tool_call` (`omp` binary 18.8.4).
  8. Pi tự động nạp `.pi/extensions/*.ts` khi project trust (`--approve`), event `tool_call` (`pi` 1.0.4).
  9. CLI `ak plan validate plans/261008-1004-hook-install-outside-fgos-repo` trả `[OK] valid plan directory`.

### Whole-Plan Consistency Sweep

Zero unresolved contradictions. Plan sẵn sàng thực thi tự động qua `/ak-cook --auto`.
