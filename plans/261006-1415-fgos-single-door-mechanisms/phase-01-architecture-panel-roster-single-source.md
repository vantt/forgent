# Phase 01 — Architecture-panel roster binds through config

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md) "Phát hiện" #1; synthesis V2 / H1a; case T06 ([csv](../reports/harness-investigation-261006/behavior-forensics-cases-261006.csv))
- Source: `core/skills/fgos-architecture-panel/SKILL.md` (701 dòng); workflow `core/workflows/architecture-advisory.yaml:14,24,34,43,52` (bind theo capability `architecture:frame|shape|critique|synthesize|explain`)
- Config: `.fgos/config.json` `runner.capabilities["architecture:*"].prefer` (hôm nay: `claude-herdr`, `openai`, `gemini`, `xai`, `glm/pi-cli-bwrap-openrouter`), `runner.executors[*].invocations`, `runner.modelPolicies`
- Prior art: rename `e7bd9b418` (gom claude/codex/agy executor id vào invocations), `a9fc61324` (đổi tên executor theo provider); `2180b4e72` (2026-10-02) retire L4 coordination engine — `fgos coordination` hôm nay trả "unknown verb"; pattern test `test/runner/dead-vocabulary-guard.test.mjs`
- Spec: `docs/specs/runner.md` (executor/capability binding), đọc mục liên quan trước khi sửa

## Requirements

1. Skill source không còn tự khai executor id, invocation id hay model cụ thể cho từng vai; vai được bind qua capability của Workflow, nguồn duy nhất là `.fgos/config.json`.
2. Một test cơ học chặn roster chép tay quay lại trong `core/skills/**` và `domains/*/skills/**`.
3. Xoá (không thêm song song) các đoạn khẳng định sai: bảng "Role → Executor → Derived model" (`:221-231`), đoạn allowlist `claude-bwrap`/`agy-bwrap`/`codex-bwrap` (`:189-196`), Known Gaps `tsk-1o4` khẳng định ba id "registered in `.fgos/config.json`" (`:604-609`), `tsk-31d` (`:612-613`) và đoạn `agy-bwrap` ở `:680-686` nếu chúng chỉ đúng với id đã retire.

## Files

- Modify: `core/skills/fgos-architecture-panel/SKILL.md`
- Create: `test/skills/skill-sources-bind-executors-through-config.test.mjs`
- Regenerated (không sửa tay, qua `npm run build:skills`): `.agents/skills/fgos-architecture-panel/SKILL.md`, `.claude/skills/fgos-architecture-panel/SKILL.md`, `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md`
- Delete: không có file; xoá các đoạn liệt kê ở Requirements #3
- `CHANGELOG.md` `## [Unreleased]`: một dòng "Changed" (skill người dùng plugin thấy được)

## Steps

1. **R1 (research, UNPROVEN → fact).** Đọc `core/workflows/architecture-advisory.yaml` và `docs/specs/runner.md` phần Workflow binding: xác nhận (a) 8 vai trong bảng skill map vào 5 step capability nào; (b) Workflow có còn cho override executor theo vai không (thứ `actors[]` cũ của `fgos coordination run`, đã retire). Chạy read-only `node bin/fgos.mjs dispatch decide --for architecture:shape` (và frame/critique/synthesize/explain) để thấy binding sống. Kết quả R1 quyết định hình dạng mục mới:
   - Nếu không còn override theo vai: bảng chỉ giữ cột Role, Workflow step/capability, Tier (nếu Workflow còn dùng), Persona, Why; thêm một câu "Executor và model do `runner.capabilities["architecture:<step>"].prefer` + `runner.modelPolicies` trong `.fgos/config.json` quyết; xem binding sống bằng `fgos dispatch decide --for architecture:<step>`".
   - Nếu còn override: bảng ghi capability, không ghi id cụ thể; ví dụ override (nếu cần) phải lấy id từ config lúc chạy, không viết cứng.
   - Nếu vai không map được vào Workflow (skill mô tả cơ chế đã retire nhiều hơn phần roster): dừng, báo Lead; phạm vi phase này chỉ là roster, phần còn lại thành work item riêng (xem câu hỏi mở).
2. **Viết test trước (đỏ).** `test/skills/skill-sources-bind-executors-through-config.test.mjs`, tên test mô tả hành vi, ví dụ "skill sources never name a concrete model from runner.modelPolicies" và "skill sources never name a retired executor id". Quét `.md` trong `core/skills` và `domains/*/skills`:
   - Tập model id = mọi giá trị chuỗi trong `runner.modelPolicies` có chứa chữ số (loại `opus`/`sonnet`/`haiku`/`fable` vốn là từ thường trong văn bản).
   - Tập id retire = các executor id bị đổi ở `e7bd9b418`/`a9fc61324` (lấy từ diff của hai commit; tối thiểu `claude-bwrap`, `agy-bwrap`, `codex-bwrap`), regex `\b<id>\b`.
   - Chạy `env -u CLAUDE_CODE_SESSION_ID node --test test/skills/skill-sources-bind-executors-through-config.test.mjs` → phải **đỏ** trên tree hiện tại, chỉ ra `fgos-architecture-panel/SKILL.md`.
3. **Sửa skill source** theo kết quả R1; xoá các đoạn ở Requirements #3. Không đụng phần ngoài roster/binding.
4. `npm run build:skills`; `git diff --stat` chỉ được thấy 4 file SKILL.md của skill này (memory: diff trước khi commit file sinh lại).
5. Test bước 2 → **xanh**.
6. CHANGELOG một dòng; commit ngay khi xanh. Commit message mô tả hành vi, không chứa mã plan/phase/case.

## Impact analysis

- Không sửa symbol code (chỉ markdown + test mới) → không cần `impact()`. Vẫn chạy `detect_changes()` trước commit.

## Tests / validation

1. Hẹp: `env -u CLAUDE_CODE_SESSION_ID node --test test/skills/skill-sources-bind-executors-through-config.test.mjs` (đỏ → xanh).
2. Render: `env -u CLAUDE_CODE_SESSION_ID node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/runner/dead-vocabulary-guard.test.mjs`.
3. Acceptance: lệnh baseline Phase 00 bước 3 trả 0 hit.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Xoá nhầm rationale đa dạng provider (giá trị thật của panel) | Med×Med | Giữ cột Why/Persona; chỉ bỏ id cụ thể |
| Skill còn nhiều chỗ mô tả `coordination run` đã retire ngoài roster (`:136,147,643`) | High×Low | Ngoài phạm vi; ghi câu hỏi mở, không mở rộng phase |
| Test quá rộng bắt nhầm bằng chứng lịch sử (vd `gpt-5.5` trong `_shared/coding-worker-contract.md`) | Low×Low | Tập model lấy từ config hiện tại; `gpt-5.5` không có trong config |

## Rollback

`git revert <commit>` rồi `npm run build:skills`. Test mới bị revert cùng.

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Bất biến sandbox (thêm vào R1 và vào skill):** năm capability `architecture:frame|shape|critique|synthesize|explain` trong `.fgos/config.json` **không có** chính sách confinement (đã xác nhận), trong khi `advise` có `host-write-denied`. Đoạn `SKILL.md:189-196` hiện là chỗ duy nhất nói vai cố vấn phải chạy trong hộp cát chặn ghi. R1 phải chạy `node bin/fgos.mjs dispatch decide` cho từng bước, ghi tư thế confinement đã phân giải (enforced hay instructed). Skill giữ lại một dòng bất biến: vai cố vấn cần capability có chính sách `host-write-denied`. Nếu tư thế không phải enforced, phase **dừng và báo anh** (không tự sửa config trong phase này).
- **Phạm vi xoá mở rộng:** gồm cả khối dòng 132-175 ("verified live"), vì nó mang cùng khẳng định sai về executor đã gỡ. Không để test đỏ vì phạm vi hẹp.
- **Test chặn roster theo hình dạng, không theo thành viên config hiện tại:** cấm token có dạng id model (`(gpt|gemini|grok|glm|deepseek|claude)-…<chữ số>…`) và id kiểu executor không có trong `runner.executors`, cộng danh sách cố định id đã gỡ; có một allowlist theo đường dẫn cho tài liệu lịch sử. Không dùng tập giá trị `runner.modelPolicies` hiện tại làm tập cấm (config đổi 54 lần từ 2026-09-06, test sẽ vừa mù với id cũ vừa đỏ vì việc không liên quan; `gpt-5.6-sol`, ví dụ chính của plan, không có trong config nên cách cũ không bắt được).
