---
title: "Root guard and gated junk cleanup"
status: done
dependencies: [4]
requiresReview: true
---

# Phase 05 — Root-file guard + gated junk deletion

> Historical revision note: Pending — revision ready; implementation not started or authorized in that planning assignment.

**Current execution evidence:** root-guard behavior and all approved G1/D2 cleanup are complete; see [hook tests/actual git smoke](reports/phase-05-tests.md), [preservation tag/final owner approval/executed cleanup](reports/phase-05-cleanup-gate.md), and [full-plan sync](reports/final-plan-sync.md). Inventories and deletion instructions below retain historical provenance/accepted requirements; they do not imply the approved deletion is still unexecuted. Full-suite final acceptance remains coordinated in Phase06.

## Context links

- [plan.md](plan.md) "Phát hiện" #5; synthesis V7 / H3; cases T02 (`28 patch_*.cjs/fix_*.cjs scratch scripts created at repo root and committed`), S30 (`30 file scratch ở gốc repo trong một commit git add -A`, `ca854f443`)
- Hook: `.githooks/pre-commit` (398 dòng, Node): `main()` :334; thứ tự hiện tại: stale worktree index (:338) → staged `.fgos/` deletion (:344) → `.fgos/` change on worker branch (:350) → `hookRunsAtHome` (:356, thoát sớm cho worktree) → main-checkout lock (:363-376) → `.fgos` line regression (:384)
- Kích hoạt: `core.hooksPath` = `/home/vantt/projects/forgentX/.githooks` (tuyệt đối, đã wired trên máy này); writer `installGitHooks` (`src/setup/git-hooks.mjs`, chạy bởi `npm run setup:hooks` và `fgos setup`); check đọc `main-checkout-hook-wired` (`src/setup/registrations.mjs:1436`) — **tái dùng cho H3(iii), không thêm check mới**
- Spec: `docs/specs/distribution.md` "Contributor hooks setup" (:135-149); `docs/specs/runner.md:1211` (pointer tới hook)
- Test dùng hook thật trong repo tạm và commit file ở gốc (`seed.txt`, `proof.txt`, `CONTEXT.md`, ...): `test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, `test/e2e/resync-worktree-bare-invocation.test.mjs`, `test/runner/merge.test.mjs`, `test/runner/claim-port.test.mjs`, `test/runner/main-checkout-lock.test.mjs`, `test/cli/fgos-claim-2.test.mjs`, `test/setup/uninstall-wiring.test.mjs`

## Phân loại file gốc (đã kiểm 2026-10-06, `git log --diff-filter=A`)

Historical inventory measured 2026-10-06: 45 tracked root files. Remeasure before execution; 45 is evidence, not a permanent assertion. Account for every difference before deletion; retain the 14-file keep set below.

**Keep (14, không phải rác):** `.gitattributes`, `.gitignore`, `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `Cargo.lock`, `Cargo.toml`, `LICENSE`, `README.md`, `clippy.toml`, `install.sh`, `package-lock.json`, `package.json`, `rustfmt.toml`.

**Delete — tracked, tạo ở `ca854f443` (2026-09-21 "refactor coordination action legality and test fixtures"), 30 file:** `count.cjs`, `debug_args.cjs`, `debug_spec.cjs`, `dump.cjs`, `fix_assignment.cjs`, `fix_herdr.cjs`, `fix_herdr2.cjs`, `fix_openSession.cjs`, `fix_openSession2.cjs`, `fix_openSession3.cjs`, `fix_openSession4.cjs`, `fix_openSession5.cjs`, `fix_openSession6.cjs`, `fix_openSession_safe.cjs`, `fix_test_legacy.cjs`, `fix_tests.cjs`, `openSession.txt`, `original.txt`, `reverse.patch`, `rewrite_store.cjs`, `store_refactor.cjs`, `test_atomics.mjs`, `test_concurrency.cjs`, `test_concurrency.log`, `test_concurrency2.cjs`, `test_concurrency2.log`, `test_herdr.cjs`, `test_regex.cjs`, `timed-executor.mjs`, `timed-executor2.mjs`.
Không file nào được import từ `src/`, `bin/`, `scripts/`, `test/`; tên chúng chỉ xuất hiện như **dữ liệu** git-status trong `test/fixtures/run-outcome/legacy-derivation.json`, `test/fixtures/run-result/real-shapes/09-*.json`, `10-*.json` (không cần sửa). `dump.cjs` đọc `original.txt`; `timed-executor.mjs` ghi tuyệt đối vào `test_concurrency.log` — cùng nhóm.

**Delete — untracked, local:** `output.txt` (gitignored `.gitignore:33`, "test-leak artifacts"; trước đó từng được theo dõi và được bỏ theo dõi có chủ ý ở `7581bb2a9`). Nội dung đã đọc 2026-10-06: đúng 19 byte, chuỗi `produced by worker` kèm xuống dòng, tức là một chuỗi mẫu của worker giả do một test để rò ra thư mục làm việc. Tag không lưu được file chưa theo dõi, nên nội dung này được ghi ở đây thay cho bản sao. Lưu ý: xoá file không chữa được nguồn rò; nếu test vẫn ghi `output.txt` vào cwd thì nó sẽ xuất hiện lại (gitignored nên không làm bẩn commit); tìm và sửa test rò là việc riêng, ghi vào báo cáo phase.

**Decision D2 (anh chốt 2026-10-06):** `tsk-1op-case-study-note.md` (tạo `b7fd7ade1`, 2026-07-26, "record str91 live /fgOS:pick case-study proof") không phải scratch; **move vào `docs/history/`**, không xoá và không thêm root allowlist. Historical check chưa thấy thư mục `tsk-1op`; remeasure lúc thực thi, chọn đích theo mẫu feature-history hiện có và ghi lý do trước G1 final confirmation. Đây là ngoại lệ sửa vị trí tài liệu cũ phải ghi khi plan `260925-documentation-authority-unification` nối lại.

## Requirements

1. Guard trong `.githooks/pre-commit`: refuse (exit 1, message nêu file và cách sửa) khi index staged có file **mới** ở gốc repo (`git diff --cached --name-only --diff-filter=ACR`, path không chứa `/`) không nằm trong allowlist. Sửa/xoá file gốc đã có: cho qua.
2. Allowlist một nguồn: hằng trong hook (14 file Keep; D2 đã chọn move nên không thêm case-study note). Rule ở `AGENTS.md` (Phase 06) trỏ tới hook, không chép danh sách. Refuse một commit vừa sửa allowlist vừa thêm file gốc mới; thông báo chỉ hướng dẫn sửa allowlist trong commit riêng và hạ cánh ở main trước. Không đưa lời khuyên bỏ qua hook vào message, spec hoặc doctrine.
3. Guard chỉ bật khi toplevel **đang commit** là source checkout fgOS (có `apps/fgos/Cargo.toml`; cùng marker doctor dùng ở `registrations.mjs:4573`). Repo tạm của test và project khác dùng chung hook không bị ảnh hưởng.
4. Guard chạy cả trong worktree và trên nhánh `fgw/*`: đặt trước `hookRunsAtHome` (:356).
5. H3(iii): không thêm doctor check; sửa `description` của `main-checkout-hook-wired` để nói hook giờ cũng chặn file mới ở gốc (một chuỗi, không đổi logic).
6. Xoá rác chỉ sau G1.
7. Guard root-file bỏ qua commit merge khi `MERGE_HEAD` tồn tại; không bỏ qua các guard mất dữ liệu có sẵn. `fgos approve` đã verify trước `git merge --no-commit --no-ff` rồi `git commit --no-edit` (`src/runner/merge.mjs:1333,1626-1641`); root guard không được huỷ đường merge này. Allowlist dùng bản hook chạy từ main checkout qua hooksPath tuyệt đối, không đọc một allowlist mới từ index để tự cấp quyền.
8. Dependency: Phase 04 hoàn tất theo native chain 01 → 02(render/restage) và 00 → 03(research), rồi 04 → 05. Giữ toàn bộ root-guard/D2/G1 safety; không có advisory product prerequisite.

## Files

- Modify: `.githooks/pre-commit`, `src/setup/registrations.mjs` (chỉ chuỗi description của `main-checkout-hook-wired`), `docs/specs/distribution.md` ("Contributor hooks setup": một câu về guard), `CHANGELOG.md` (dòng "Added": commit hook refuses new root files outside allowlist)
- Create: `test/e2e/root-file-guard-hook.test.mjs`
- Delete (sau G1): 30 file tracked ở trên + `output.txt` local; D2 theo quyết định

## Steps

1. **Impact analysis:** hook là file không đuôi, GitNexus có thể không index → `rtk proxy grep -rn "githooks/pre-commit" test src scripts` để liệt kê mọi nơi chạy hook (danh sách ở Context). `impact` không áp dụng cho chuỗi description; vẫn `detect_changes()` trước commit.
2. **Test hành vi đỏ trước** (`test/e2e/root-file-guard-hook.test.mjs`, theo mẫu `test/e2e/main-checkout-lock-hook.test.mjs`): repo tạm, `core.hooksPath` trỏ `.githooks` thật, có marker `apps/fgos/Cargo.toml`. Case: (a) thêm `scratch.cjs` ở gốc → commit exit ≠ 0, stderr nêu file/cách sửa; (b) thêm `src/x.mjs` → qua; (c) sửa hoặc xoá root file đã có → qua; (d) repo không marker, thêm `seed.txt` → qua; (e) worktree có marker và `fgw/*`, thêm root file → chặn; (f) commit sửa allowlist đồng thời thêm root file → chặn; (g) thay đổi allowlist đã land riêng ở main cho phép root file hợp lệ ở commit sau; (h) `MERGE_HEAD` bỏ qua riêng root guard, giữ các guard cũ và đường approve merge thành công. Không assert source wording/anchor. Các fixture hook hiện tại chưa tạo marker (bằng chứng 2026-10-06); thêm marker vào fixture mới, không nới guard để test qua.
3. Cài guard trong `main()` trước `hookRunsAtHome`; dùng `committingToplevel` (không dùng `repoRoot` = vị trí hook) để đọc marker.
4. Sửa description `main-checkout-hook-wired`; câu spec; CHANGELOG. Commit guard (commit 1) khi test xanh.
5. **G1 (anh duyệt có điều kiện 2026-10-06: xoá được, nhưng phải có tag trước):** đo lại inventory và tìm lại consumer/import của đúng 30 tên; tạo tag chú thích `git tag -a pre-root-junk-cleanup -m "Snapshot before root junk cleanup" HEAD` ngay trước xoá. Nếu tag đã tồn tại, kiểm provenance/cây và dừng giải quyết khác biệt, không force ghi đè. `git ls-tree --name-only pre-root-junk-cleanup` đối chiếu từng tên trong danh sách 30 tracked file, yêu cầu đủ đúng 30 tên; `git show --stat` không chứng minh cây tag chứa chúng. Trình anh danh sách cuối cùng, D2 move đích cụ thể, lệnh xoá và cảnh báo tag không lưu `output.txt`; chỉ sau xác nhận lần cuối mới `git rm` đúng 30 file, xoá `output.txt` local nếu còn, và `git mv` case-study vào `docs/history/` theo mẫu feature history. Đếm lại root tracked và đối chiếu keep set + mọi thay đổi hợp lệ đã duyệt; 14 là kết quả dự kiến của inventory lịch sử, không hard-code nếu baseline đã đổi.
6. Commit ngay khi xanh (memory: phiên song song từng xoá file chưa commit).

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/e2e/root-file-guard-hook.test.mjs` (đỏ → xanh).
2. Hồi quy **đủ 16 file chạm hook** (inventory 2026-10-06; tìm lại lúc thực thi, thêm mọi consumer mới): `test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, `test/e2e/resync-worktree-bare-invocation.test.mjs`, `test/runner/merge.test.mjs`, `test/runner/claim-port.test.mjs`, `test/runner/main-checkout-lock.test.mjs`, `test/cli/fgos-claim-2.test.mjs`, `test/setup/uninstall-wiring.test.mjs`, `test/setup/checks.test.mjs`, `test/scripts/install-git-hooks.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `test/setup/checks-setup-config.test.mjs`, `test/setup/checks-setup-hookspath.test.mjs`, `test/setup/dir-resolution.test.mjs`, `test/setup/uninstall-wiring-2.test.mjs`, `test/setup/uninstall-wiring-3.test.mjs`. Run bằng `node --test` với toàn bộ danh sách, cộng root guard test mới và đường approve e2e.
3. Sau xoá: `node --test test/runner/run-outcome.test.mjs test/observe/observe-contracts-fixtures.test.mjs` (hai test đọc `legacy-derivation.json` và `run-result/real-shapes`, đã grep 2026-10-06; fixtures có thể còn được nạp theo thư mục — grep lại lúc thực thi) để chứng minh fixture không phụ thuộc file thật.
4. Full-suite final acceptance: `npm test` sau khi mọi phase single-door đã land (Phase 06 điều phối). Đây là kiểm chứng tương lai, chưa chạy trong revision; báo cáo 00/03 không chứng minh gate này. Advisory product acceptance thuộc plan riêng, không phải gate của root cleanup.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Guard vỡ test dùng hook thật | High×High | Requirement #3 + nhóm test bước 2 |
| Cần thêm file gốc hợp lệ từ worktree: hooksPath tuyệt đối dùng allowlist ở main, không bản worktree | Med×Low | Land thay đổi allowlist trong commit riêng ở main trước; từ chối cùng commit thêm file mới; không khuyến nghị bỏ qua hook |
| Thư mục mới ở gốc (vd `scratch/`) không bị chặn | Med×Low | Ngoài phạm vi (chỉ file); ghi câu hỏi mở |
| Xoá nhầm file còn được dùng | Low×Med | Đã grep import; khôi phục bằng `git checkout ca854f443 -- <file>` |

## Rollback

Commit 1 (guard) và commit 2 (xoá) revert độc lập. File tracked lấy lại từ `ca854f443`; `output.txt` mất vĩnh viễn (G1 phải nói rõ).

