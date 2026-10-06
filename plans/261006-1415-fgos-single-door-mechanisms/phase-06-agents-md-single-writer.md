---
title: "Single doctrine writer and final acceptance"
status: done
dependencies: [2, 4, 5]
requiresReview: true
---

# Phase 06 — AGENTS.md single-writer doctrine + temporary placement validation

> Historical revision note: Pending — revision ready; implementation not started or authorized in that planning assignment.

**Current execution: complete under the approved execution-only scope.** The five doctrine edits, fresh PC1/generated-block preservation and correct/zero-findings placement review are recorded in [doctrine evidence](reports/phase-06-doctrine-review.md); [Rust verification](reports/final-rust-tests.md) passed176/176. The unchanged standard [Node suite](reports/final-node-tests.md) ran once, exit0:6,948 total/6,875 passed/0 failed/0 cancelled/8 skipped/65 existing migrated TODO. Parent accepted the complete original behavior and authorized CLI closure of this phase/overall plan; see [full-plan sync](reports/final-plan-sync.md). The owner explicitly approved “Hoàn tất trên nhánh execution”: committed/integrated execution phases substitute only for the original precondition requiring Phase02/04/05 main merge below. The separate **Plan B main-integration barrier remains closed** until actual doctrine integration and permanent root-hook behavior-test presence on main. Original requirements/history remain intact; skips/TODO and doctor readiness are not claimed green.

## Context links

- [plan.md](plan.md); synthesis V3 (pointer `AGENTS.md:130`), V1 (cửa `fgos`), V8 + V7 (scratch, no-backdoor; cases T02, T03), V10 + H5 (cases M02, M11, M13; §8 mục 2 chốt (b')), V15 phần (doctrine riêng chỉ có ở `.claude/rules` không track — S1, S34)
- Luật L8 doctrine placement (`docs/platform-foundations.md:198-220`): standing rules phải hold cả khi không workflow chạy; transport rides with the order. Existing anchor-suite/prior art `test/docs/rul11-anchor-phrase.test.mjs` là context, không phải lý do tạo thêm permanent source-anchor test. Phase này dùng temporary doc validation/report và placement review.
- Phần `AGENTS.md` viết tay (ngoài các khối do tool sinh `<!-- mdview:START -->`, `<!-- gitnexus:start -->`, `<!-- fgos:instruction-projection:start -->` — không chạm các khối này).
- Đầu vào: D1 (Phase 03), tên check `active-release-matches-checkout` (Phase 04), allowlist trong `.githooks/pre-commit` (Phase 05), header render (Phase 02).

## Preconditions

- **PC1 current check:** lúc bắt đầu, `git status --porcelain AGENTS.md CLAUDE.md` phải rỗng. GitNexus-generated thay đổi chưa commit là observation lịch sử, không mặc định vẫn tồn tại; đo lại trạng thái hiện tại. Nếu có thay đổi của anh/tool, **anh** commit riêng hoặc discard trước; phase không commit/revert chúng. Nếu tool ghi lại trong lúc phase chạy, dừng và báo.
- Phase 02, 04, 05 đã merge (Phase 04 đã thêm npm script `fgos:dev`); D1 đã chốt B. Quy tắc cửa chuẩn ghi tên lệnh `npm run fgos:dev -- <verb>` làm đường chạy code đang sửa, và `fgos` trơn là bản đã kích hoạt.
- **Single writer:** chỉ phase này sửa `AGENTS.md` trong plan; Plan B (`convention`) chờ barrier tích hợp bên dưới. Completion dựa native Phase 00–06 acceptance; doctrine không thay thế Phase 01 source-binding/config-confinement smoke hoặc header/dev/doctor/root-guard behavior proof. Advisory product/confinement acceptance thuộc plan riêng, không phải prerequisite.

## Requirements (nội dung, mỗi mục một vị trí)

1. **H5 (nguyên văn, không sửa chữ):** ngay dưới mục `2. **Release con người** …` (`AGENTS.md:19`), một dòng thụt 3 khoảng trắng để giữ đánh số danh sách:
   `Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng.`
   Không đụng luật global của anh (`~/.claude/rules/CLAUDE.md`).
2. **Pointer `_shared` (`AGENTS.md:130`):** thay `.agents/skills/_shared/executor-dispatch-fallback.md (mirrored byte-identical at plugins/fgOS/skills/_shared/)` bằng: skill tham chiếu `../_shared/executor-dispatch-fallback.md`; source là `core/skills/_shared/executor-dispatch-fallback.md` (đã kiểm tồn tại); `.agents/skills/` và `plugins/fgOS/skills/` là bản render do `npm run build:skills` sinh, mang header generated, không sửa tay. Giữ câu `.claude/skills contains generated wrappers only`. Xoá cụm "mirrored byte-identical" (không còn là cách mô tả đúng nguồn).
3. **Cửa chuẩn (gộp vào `## Legacy-Node CLI Ownership Boundary`, không tạo section mới):** Rust `fgos` là cửa chuẩn cho mọi verb; global npm và `node bin/fgos.mjs` chỉ là kênh tương thích. `fgos` trơn chạy release đã kích hoạt (`.fgos/installation/activation.json`), một bản sao Node payload; sửa `bin/`/`src/` chưa có hiệu lực ở release đó. D1 đã chốt **B**: `npm run fgos:dev -- <verb>` là cửa code đang sửa qua Rust shim theo implementation Phase 04; không đưa lệnh Rust guessed vào doctrine. `fgos doctor` check `active-release-matches-checkout` phát hiện lệch; restage/activate theo Phase 04 rồi chạy doctor qua shim để kiểm lại. `fgos setup` qua release cũ có thể làm mất header render cho tới khi stage lại. Dev giữ cwd của người gọi qua `INIT_CWD`, không ép về main; tôn trọng `CARGO_TARGET_DIR`, chỉ chạy một lần tại một thời điểm giữa worktree dùng chung target. Drift bỏ qua `node_modules` nhưng phải bắt symlink theo contract Phase 04. Gộp câu compatibility hiện có, không lặp hoặc hứa release tự cập nhật.
4. **Scratch (ngay sau "Definition of done"):** script, log, patch, dump nháp không ở root; dùng scratchpad runtime, fallback `${TMPDIR:-/tmp}`. `.githooks/pre-commit` từ chối root file mới ngoài allowlist của nó; root file hợp lệ cần thay allowlist trong **commit riêng, land ở main trước**, không cùng commit thêm file. Không khuyến nghị bỏ qua hook. Hook chỉ chạy khi wired (`npm run setup:hooks`; doctor check `main-checkout-hook-wired`); merge exception `MERGE_HEAD` của root guard không vô hiệu các guard mất dữ liệu.
5. **No backdoor (gộp vào DoD câu 5, `AGENTS.md:62-63`):** xanh phải đến từ hành vi thật — không thêm env switch, flag hay nhánh code chỉ để test qua (bỏ qua kiểm tra khi chạy dưới test); sửa code hoặc fixture.
6. **Temporary doc validation/report, không test source-anchor mới:** đối chiếu đủ năm rule tại đúng vị trí; H5 nguyên văn là doc requirement; kiểm mọi `core/skills/_shared/*.md` path được nhắc thật sự tồn tại và pointer generated cũ không còn. Ghi evidence vào báo cáo/PR note, không giữ helper hoặc wording/roster/forwarding/mock-echo assertion trong permanent suite.
7. **L8 placement review:** cả năm rule cần hold khi không workflow chạy nên thuộc standing sheet. Ghi từng rule, vị trí và lý do vào báo cáo; giữ generated blocks nguyên vẹn. Đây là evidence placement, không phải wording test.
8. **Plan B integrated barrier:** chỉ cho Plan B sửa `AGENTS.md`, `.githooks/pre-commit`, `src/setup/registrations.mjs` sau khi commit doctrine Phase 06 đã thực sự tích hợp vào main và permanent `test/e2e/root-file-guard-hook.test.mjs` từ Phase 05 hiện diện trên main. Kiểm commit provenance và nội dung tích hợp cụ thể; một `git log` gate đã thoả nhờ commit không liên quan không đủ. Không yêu cầu anchor-test file bị loại khỏi thiết kế.

## Files

- Modify: `AGENTS.md` (chỉ phần viết tay, 5 vị trí trên)
- Create: không permanent test hay source file mới; chỉ temporary validation/report trong phạm vi báo cáo implementation được phép.
- Không sửa: `CLAUDE.md` (chỉ import `@AGENTS.md`), `.claude/rules/*`, luật global
- Delete/merge: câu "remain compatibility channels" gộp vào đoạn cửa chuẩn; cụm "mirrored byte-identical" ở dòng 130 bị xoá
- `CHANGELOG.md`: không (AGENTS.md không nằm trong `package.json` `files`, không phải thay đổi người dùng fgOS thấy)

## Steps

1. Kiểm PC1. Đọc lại `AGENTS.md` hiện tại (số dòng có thể đã trôi).
2. Kiểm doc baseline và chuẩn bị temporary validation cho H5 nguyên văn, path hợp lệ, pointer và L8 placement; không viết permanent source-anchor test.
3. Sửa `AGENTS.md` năm vị trí trong **một** doctrine commit, ngoài generated blocks.
4. Ghi doc validation/report và kiểm PC1 interference sau sửa: chỉ năm vị trí được duyệt, generated blocks không bị tool ghi lại. Nếu tool can thiệp, dừng giải quyết, không commit phần thay đổi của người dùng/tool.
5. Đối chiếu `docs/platform/component-boundary.md` → "No component-boundary change"; ghi từng kết quả L8. Chỉ mở barrier Plan B khi doctrine commit đã land và root guard behavior test đã có trên main.

## Impact analysis

Không sửa symbol code. `detect_changes()` trước commit.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: temporary doc validation/report theo Requirements 6–7; không tạo `test/docs/agents-doctrine-anchors.test.mjs`. Existing `test/docs/rul11-anchor-phrase.test.mjs` không sửa; nếu suite hiện có chạy nó, giữ như hồi quy cũ chứ không mở rộng source-wording coverage.
2. Test khác đọc `AGENTS.md` (grep 2026-10-06): `test/docs/decisions-corpus-retired.test.mjs`, `test/setup/instruction-projections.test.mjs`, `test/install/coexist.test.mjs`, `test/e2e/coexistence-canary.test.mjs`, `test/cli/fgos-setup.test.mjs`, `test/cli/fgos-read-5.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/runner/execution/patterns/role-tasks.test.mjs`, `test/runner/dead-vocabulary-guard.test.mjs`.
3. **Full-suite final acceptance sau mọi phase single-door:** `npm test`, dưới `env -u CLAUDE_CODE_SESSION_ID`, cùng tập kiểm Rust/consumer được các phase liên quan quy định; Phase 06 điều phối gate cuối, không chạy trên trạng thái nửa land. Complete giữ đầy đủ Phase 01 source-binding/config-confinement smoke, Phase 02 header/render/restage, Phase 04 development/doctor/shim và Phase 05 root-guard/D2/G1 acceptance. Phase 00/03 là evidence baseline/read-only đã quan sát, không thay acceptance. Advisory installed-entry live/product proof thuộc [advisory capability completion](../261006-1408-advisory-capability-completion/plan.md), không chặn single-door; history old-v-current quality **NOT RUN** được giữ như lịch sử, không prerequisite. Tất cả kiểm ở mục này là future proof, chưa chạy trong revision plan.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Tool (`gitnexus analyze`, mdview, instruction projection) ghi lại `AGENTS.md` giữa chừng | Med×Med | Chỉ sửa ngoài khối marker; PC1 kiểm trước và sau |
| Câu H5 là văn xuôi, có thể vẫn bị bỏ qua (M02/M11/M13 xảy ra dù `:19` đã có) | High×Low | Đã chấp nhận ở §8; đo bằng H4 (ngoài plan) |
| Thêm chữ vào lớp nạp mọi turn | Low×Low | Gộp vào section có sẵn, không tạo section mới cho rule 3, 5 |
| Plan B sửa song song | Med×Med | Ràng buộc thứ tự ở Preconditions và plan.md |

## Rollback

`git revert <doctrine-commit>` cho một commit `AGENTS.md`; không có anchor test mới cần revert. Thu hồi barrier Plan B nếu commit bị revert trước khi Plan B bắt đầu.

