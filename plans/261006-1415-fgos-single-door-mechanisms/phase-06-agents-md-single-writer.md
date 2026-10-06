# Phase 06 — AGENTS.md single-writer edits + anchor test

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md); synthesis V3 (pointer `AGENTS.md:130`), V1 (cửa `fgos`), V8 + V7 (scratch, no-backdoor; cases T02, T03), V10 + H5 (cases M02, M11, M13; §8 mục 2 chốt (b')), V15 phần (doctrine riêng chỉ có ở `.claude/rules` không track — S1, S34)
- Luật L8 doctrine placement (`docs/platform-foundations.md:198-220`): placement test, transport rides with the order, **anchor-suite** (mỗi rule doctrine có cụm từ đặc trưng được test assert). Prior art anchor: `test/docs/rul11-anchor-phrase.test.mjs`.
- Phần `AGENTS.md` viết tay (ngoài các khối do tool sinh `<!-- mdview:START -->`, `<!-- gitnexus:start -->`, `<!-- fgos:instruction-projection:start -->` — không chạm các khối này).
- Đầu vào: D1 (Phase 03), tên check `active-release-matches-checkout` (Phase 04), allowlist trong `.githooks/pre-commit` (Phase 05), header render (Phase 02).

## Preconditions

- **PC1:** `git status --porcelain AGENTS.md CLAUDE.md` rỗng. Thay đổi chưa commit hiện có (số liệu GitNexus, do `gitnexus analyze` ghi) phải được **anh** commit riêng hoặc discard trước. Phase này không commit, không revert chúng. Nếu tool ghi lại trong lúc phase chạy, dừng và báo.
- Phase 02, 04, 05 đã merge (Phase 04 đã thêm npm script `fgos:dev`); D1 đã chốt B. Quy tắc cửa chuẩn ghi tên lệnh `npm run fgos:dev -- <verb>` làm đường chạy code đang sửa, và `fgos` trơn là bản đã kích hoạt.
- **Single writer:** chỉ phase này sửa `AGENTS.md` trong plan; **Plan B (component `convention`) sửa `AGENTS.md` sau khi commit của phase này đã vào main.**

## Requirements (nội dung, mỗi mục một vị trí)

1. **H5 (nguyên văn, không sửa chữ):** ngay dưới mục `2. **Release con người** …` (`AGENTS.md:19`), một dòng thụt 3 khoảng trắng để giữ đánh số danh sách:
   `Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng.`
   Không đụng luật global của anh (`~/.claude/rules/CLAUDE.md`).
2. **Pointer `_shared` (`AGENTS.md:130`):** thay `.agents/skills/_shared/executor-dispatch-fallback.md (mirrored byte-identical at plugins/fgOS/skills/_shared/)` bằng: skill tham chiếu `../_shared/executor-dispatch-fallback.md`; source là `core/skills/_shared/executor-dispatch-fallback.md` (đã kiểm tồn tại); `.agents/skills/` và `plugins/fgOS/skills/` là bản render do `npm run build:skills` sinh, mang header generated, không sửa tay. Giữ câu `.claude/skills contains generated wrappers only`. Xoá cụm "mirrored byte-identical" (không còn là cách mô tả đúng nguồn).
3. **Cửa chuẩn (gộp vào section có sẵn `## Legacy-Node CLI Ownership Boundary`, `AGENTS.md:68-70`, không tạo section mới):** thêm đoạn: Rust `fgos` là cửa chuẩn cho mọi verb; `node bin/fgos.mjs` và `fgos` cài global npm chỉ là kênh tương thích. Trong checkout nguồn này, `fgos` chạy release đã kích hoạt (`.fgos/installation/activation.json`), là một **bản sao** payload Node — sửa `bin/`/`src/` chưa có hiệu lực qua `fgos` cho tới <cách theo D1>. Check `fgos doctor` `active-release-matches-checkout` báo khi lệch. Câu cuối hiện có ("Global npm `bin.fgos` and fallback `node bin/fgos.mjs` remain compatibility channels…") được gộp vào đoạn mới, không lặp.
4. **Scratch (đoạn ngắn ngay sau danh sách "Definition of done"):** file nháp (script, log, patch, dump) không bao giờ đặt ở gốc repo; dùng scratchpad phiên mà runtime cung cấp, nếu không có thì `${TMPDIR:-/tmp}`. `.githooks/pre-commit` từ chối commit thêm file mới ở gốc ngoài allowlist của nó; file gốc hợp lệ mới thì sửa allowlist trong cùng commit. Hook chỉ chạy khi đã wired (`npm run setup:hooks`; `fgos doctor` check `main-checkout-hook-wired`).
5. **No backdoor (gộp vào DoD câu 5, `AGENTS.md:62-63`):** xanh phải đến từ hành vi thật — không thêm env switch, flag hay nhánh code chỉ để test qua (bỏ qua kiểm tra khi chạy dưới test); sửa code hoặc fixture.
6. **Anchor test** `test/docs/agents-doctrine-anchors.test.mjs` (L8 anchor-suite), table-driven: mỗi rule 2-5 có một cụm từ đặc trưng (chọn lúc viết, ghi trong test) phải có nguyên văn trong `AGENTS.md`; câu H5 có nguyên văn; mọi path `core/skills/_shared/*.md` được `AGENTS.md` nhắc tới đều tồn tại; `AGENTS.md` không còn bảo trỏ vào `.agents/skills/_shared/executor-dispatch-fallback.md`. Tên test mô tả hành vi, không chứa mã plan/case.
7. Placement test L8 cho từng rule: cả 5 rule đều cần hold khi không workflow nào chạy → standing sheet đúng chỗ; ghi một dòng xác nhận vào commit/PR note.

## Files

- Modify: `AGENTS.md` (chỉ phần viết tay, 5 vị trí trên)
- Create: `test/docs/agents-doctrine-anchors.test.mjs`
- Không sửa: `CLAUDE.md` (chỉ import `@AGENTS.md`), `.claude/rules/*`, luật global
- Delete/merge: câu "remain compatibility channels" gộp vào đoạn cửa chuẩn; cụm "mirrored byte-identical" ở dòng 130 bị xoá
- `CHANGELOG.md`: không (AGENTS.md không nằm trong `package.json` `files`, không phải thay đổi người dùng fgOS thấy)

## Steps

1. Kiểm PC1. Đọc lại `AGENTS.md` hiện tại (số dòng có thể đã trôi).
2. Viết anchor test trước → **đỏ** (cụm từ chưa có, pointer cũ còn).
3. Sửa `AGENTS.md` 5 vị trí trong **một** commit.
4. Anchor test → xanh. `git diff AGENTS.md` chỉ chứa 5 vị trí, không chạm khối do tool sinh.
5. Đối chiếu `docs/platform/component-boundary.md` → "No component-boundary change".
6. Commit ngay khi xanh. Báo Plan B rằng `AGENTS.md` đã rảnh.

## Impact analysis

Không sửa symbol code. `detect_changes()` trước commit.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/docs/agents-doctrine-anchors.test.mjs` (đỏ → xanh), `node --test test/docs/rul11-anchor-phrase.test.mjs`.
2. Test khác đọc `AGENTS.md` (grep 2026-10-06): `test/docs/decisions-corpus-retired.test.mjs`, `test/setup/instruction-projections.test.mjs`, `test/install/coexist.test.mjs`, `test/e2e/coexistence-canary.test.mjs`, `test/cli/fgos-setup.test.mjs`, `test/cli/fgos-read-5.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/runner/execution/patterns/role-tasks.test.mjs`, `test/runner/dead-vocabulary-guard.test.mjs`.
3. Rộng: `npm test` — đây là acceptance #7 của plan.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Tool (`gitnexus analyze`, mdview, instruction projection) ghi lại `AGENTS.md` giữa chừng | Med×Med | Chỉ sửa ngoài khối marker; PC1 kiểm trước và sau |
| Câu H5 là văn xuôi, có thể vẫn bị bỏ qua (M02/M11/M13 xảy ra dù `:19` đã có) | High×Low | Đã chấp nhận ở §8; đo bằng H4 (ngoài plan) |
| Thêm chữ vào lớp nạp mọi turn | Low×Low | Gộp vào section có sẵn, không tạo section mới cho rule 3, 5 |
| Plan B sửa song song | Med×Med | Ràng buộc thứ tự ở Preconditions và plan.md |

## Rollback

`git revert <commit>` (một commit duy nhất cho `AGENTS.md` + anchor test).

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Quy tắc 4 viết lại:** "đổi allowlist ở gốc repo trong một commit riêng và hạ cánh ở main trước". Bỏ "sửa allowlist trong cùng commit" (nó là đường vòng cho chính lỗi T02 và sai trong worktree vì hook là bản của main checkout).
- **Dấu hiệu hoàn tất cơ học cho Plan B** (thay cho "Báo Plan B"): Plan B chỉ được sửa `AGENTS.md`, `.githooks/pre-commit`, `src/setup/registrations.mjs` khi cả hai file `test/docs/agents-doctrine-anchors.test.mjs` và `test/e2e/root-file-guard-hook.test.mjs` đã có trên main và các cụm neo mới có trong `AGENTS.md`. Cổng `git log` của Plan B đã thoả sẵn nhờ commit không liên quan, nên không dùng.
- **Quy tắc cửa chuẩn nêu thêm hai điều:** `fgos setup` qua release cũ làm mất header render cho tới khi stage lại; và `npm run fgos:dev -- <verb>` chạy ở cwd của người gọi (đã sửa) nhưng chỉ một lần tại một thời điểm giữa các worktree dùng chung `target/`.
