# Phase 05 — Root-file guard + gated junk deletion

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md) "Phát hiện" #5; synthesis V7 / H3; cases T02 (`28 patch_*.cjs/fix_*.cjs scratch scripts created at repo root and committed`), S30 (`30 file scratch ở gốc repo trong một commit git add -A`, `ca854f443`)
- Hook: `.githooks/pre-commit` (398 dòng, Node): `main()` :334; thứ tự hiện tại: stale worktree index (:338) → staged `.fgos/` deletion (:344) → `.fgos/` change on worker branch (:350) → `hookRunsAtHome` (:356, thoát sớm cho worktree) → main-checkout lock (:363-376) → `.fgos` line regression (:384)
- Kích hoạt: `core.hooksPath` = `/home/vantt/projects/forgentX/.githooks` (tuyệt đối, đã wired trên máy này); writer `installGitHooks` (`src/setup/git-hooks.mjs`, chạy bởi `npm run setup:hooks` và `fgos setup`); check đọc `main-checkout-hook-wired` (`src/setup/registrations.mjs:1436`) — **tái dùng cho H3(iii), không thêm check mới**
- Spec: `docs/specs/distribution.md` "Contributor hooks setup" (:135-149); `docs/specs/runner.md:1211` (pointer tới hook)
- Test dùng hook thật trong repo tạm và commit file ở gốc (`seed.txt`, `proof.txt`, `CONTEXT.md`, ...): `test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, `test/e2e/resync-worktree-bare-invocation.test.mjs`, `test/runner/merge.test.mjs`, `test/runner/claim-port.test.mjs`, `test/runner/main-checkout-lock.test.mjs`, `test/cli/fgos-claim-2.test.mjs`, `test/setup/uninstall-wiring.test.mjs`

## Phân loại file gốc (đã kiểm 2026-10-06, `git log --diff-filter=A`)

`git ls-files | grep -v /` = 45 file.

**Keep (14, không phải rác):** `.gitattributes`, `.gitignore`, `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `Cargo.lock`, `Cargo.toml`, `LICENSE`, `README.md`, `clippy.toml`, `install.sh`, `package-lock.json`, `package.json`, `rustfmt.toml`.

**Delete — tracked, tạo ở `ca854f443` (2026-09-21 "refactor coordination action legality and test fixtures"), 30 file:** `count.cjs`, `debug_args.cjs`, `debug_spec.cjs`, `dump.cjs`, `fix_assignment.cjs`, `fix_herdr.cjs`, `fix_herdr2.cjs`, `fix_openSession.cjs`, `fix_openSession2.cjs`, `fix_openSession3.cjs`, `fix_openSession4.cjs`, `fix_openSession5.cjs`, `fix_openSession6.cjs`, `fix_openSession_safe.cjs`, `fix_test_legacy.cjs`, `fix_tests.cjs`, `openSession.txt`, `original.txt`, `reverse.patch`, `rewrite_store.cjs`, `store_refactor.cjs`, `test_atomics.mjs`, `test_concurrency.cjs`, `test_concurrency.log`, `test_concurrency2.cjs`, `test_concurrency2.log`, `test_herdr.cjs`, `test_regex.cjs`, `timed-executor.mjs`, `timed-executor2.mjs`.
Không file nào được import từ `src/`, `bin/`, `scripts/`, `test/`; tên chúng chỉ xuất hiện như **dữ liệu** git-status trong `test/fixtures/run-outcome/legacy-derivation.json`, `test/fixtures/run-result/real-shapes/09-*.json`, `10-*.json` (không cần sửa). `dump.cjs` đọc `original.txt`; `timed-executor.mjs` ghi tuyệt đối vào `test_concurrency.log` — cùng nhóm.

**Delete — untracked, local:** `output.txt` (gitignored `.gitignore:33`, "test-leak artifacts"; trước đó từng được theo dõi và được bỏ theo dõi có chủ ý ở `7581bb2a9`). Nội dung đã đọc 2026-10-06: đúng 19 byte, chuỗi `produced by worker` kèm xuống dòng, tức là một chuỗi mẫu của worker giả do một test để rò ra thư mục làm việc. Tag không lưu được file chưa theo dõi, nên nội dung này được ghi ở đây thay cho bản sao. Lưu ý: xoá file không chữa được nguồn rò; nếu test vẫn ghi `output.txt` vào cwd thì nó sẽ xuất hiện lại (gitignored nên không làm bẩn commit); tìm và sửa test rò là việc riêng, ghi vào báo cáo phase.

**Decision D2 (anh chốt):** `tsk-1op-case-study-note.md` (tạo `b7fd7ade1`, 2026-07-26, "record str91 live /fgOS:pick case-study proof") — không phải rác scratch nhưng sai chỗ. Phương án: giữ ở gốc (thêm vào allowlist) / `git mv` vào `docs/history/` / xoá. Em khuyến nghị `git mv` vào nơi docs history của item tương ứng nếu có, vì gốc repo chỉ nên chứa file cấu hình và tài liệu cửa vào. **Anh đã chọn (2026-10-06): `git mv` vào `docs/history/`.** Chưa có thư mục `tsk-1op` ở đó (đã kiểm); chọn thư mục theo mẫu của `docs/history` (thư mục theo tính năng) lúc thi hành và ghi lý do. Đây là sửa một gốc tài liệu cũ, nên phải được ghi là ngoại lệ khi plan `260925-documentation-authority-unification` được nối lại.

## Requirements

1. Guard trong `.githooks/pre-commit`: refuse (exit 1, message nêu file và cách sửa) khi index staged có file **mới** ở gốc repo (`git diff --cached --name-only --diff-filter=ACR`, path không chứa `/`) không nằm trong allowlist. Sửa/xoá file gốc đã có: cho qua.
2. Allowlist một nguồn: hằng trong hook (14 file Keep + quyết định D2). Rule ở `AGENTS.md` (Phase 06) trỏ tới hook, không chép danh sách.
3. Guard chỉ bật khi toplevel **đang commit** là source checkout fgOS (có `apps/fgos/Cargo.toml`; cùng marker doctor dùng ở `registrations.mjs:4573`). Repo tạm của test và project khác dùng chung hook không bị ảnh hưởng.
4. Guard chạy cả trong worktree và trên nhánh `fgw/*`: đặt trước `hookRunsAtHome` (:356).
5. H3(iii): không thêm doctor check; sửa `description` của `main-checkout-hook-wired` để nói hook giờ cũng chặn file mới ở gốc (một chuỗi, không đổi logic).
6. Xoá rác chỉ sau G1.

## Files

- Modify: `.githooks/pre-commit`, `src/setup/registrations.mjs` (chỉ chuỗi description của `main-checkout-hook-wired`), `docs/specs/distribution.md` ("Contributor hooks setup": một câu về guard), `CHANGELOG.md` (dòng "Added": commit hook refuses new root files outside allowlist)
- Create: `test/e2e/root-file-guard-hook.test.mjs`
- Delete (sau G1): 30 file tracked ở trên + `output.txt` local; D2 theo quyết định

## Steps

1. **Impact analysis:** hook là file không đuôi, GitNexus có thể không index → `rtk proxy grep -rn "githooks/pre-commit" test src scripts` để liệt kê mọi nơi chạy hook (danh sách ở Context). `impact` không áp dụng cho chuỗi description; vẫn `detect_changes()` trước commit.
2. **Test đỏ trước** (`test/e2e/root-file-guard-hook.test.mjs`, theo mẫu `test/e2e/main-checkout-lock-hook.test.mjs`): repo tạm, `core.hooksPath` trỏ `.githooks` thật, có marker `apps/fgos/Cargo.toml`. Case: (a) thêm `scratch.cjs` ở gốc → commit exit ≠ 0, stderr nêu `scratch.cjs`; (b) thêm `src/x.mjs` → qua; (c) sửa `package.json` có sẵn → qua; (d) repo tạm **không** marker, thêm `seed.txt` → qua; (e) worktree của repo có marker, thêm file gốc → bị chặn. Tên test mô tả hành vi.
3. Cài guard trong `main()` trước `hookRunsAtHome`; dùng `committingToplevel` (không dùng `repoRoot` = vị trí hook) để đọc marker.
4. Sửa description `main-checkout-hook-wired`; câu spec; CHANGELOG. Commit guard (commit 1) khi test xanh.
5. **G1 (anh duyệt có điều kiện 2026-10-06: xoá được, nhưng phải có tag trước):** tạo tag chú thích `pre-root-junk-cleanup` trên HEAD ngay trước khi xoá (tiền lệ trong repo: `pre-skill-prose-cleanup-tsk-56w`, `pre-tsk-397-merge`; tên mô tả hành vi, không mang nhãn phase), kiểm `git show pre-root-junk-cleanup --stat` có đủ 30 file; rồi trình anh danh sách cuối cùng kèm lệnh; chỉ khi anh xác nhận lần cuối: `git rm` 30 file, `rm output.txt`, xử lý D2. Kiểm `git ls-files | grep -v / | wc -l` = 14 (hoặc 15 nếu D2 giữ ở gốc; với `git mv` vào docs/history là 14).
6. Commit ngay khi xanh (memory: phiên song song từng xoá file chưa commit).

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/e2e/root-file-guard-hook.test.mjs` (đỏ → xanh).
2. Hồi quy hook: `node --test test/e2e/main-checkout-lock-hook.test.mjs test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs test/e2e/resync-worktree-bare-invocation.test.mjs test/runner/merge.test.mjs test/runner/claim-port.test.mjs test/runner/main-checkout-lock.test.mjs test/cli/fgos-claim-2.test.mjs test/setup/uninstall-wiring.test.mjs test/setup/checks.test.mjs`.
3. Sau xoá: `node --test test/runner/run-outcome.test.mjs test/observe/observe-contracts-fixtures.test.mjs` (hai test đọc `legacy-derivation.json` và `run-result/real-shapes`, đã grep 2026-10-06; fixtures có thể còn được nạp theo thư mục — grep lại lúc thực thi) để chứng minh fixture không phụ thuộc file thật.
4. Rộng: `npm test`.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Guard vỡ test dùng hook thật | High×High | Requirement #3 + nhóm test bước 2 |
| Cần thêm file gốc hợp lệ từ một worktree: hook chạy là bản ở main checkout (hooksPath tuyệt đối), allowlist mới trong worktree chưa có hiệu lực | Med×Low | Message hướng dẫn: thêm vào allowlist và land thay đổi allowlist trước, hoặc `--no-verify` có chủ ý; ghi trong spec |
| Thư mục mới ở gốc (vd `scratch/`) không bị chặn | Med×Low | Ngoài phạm vi (chỉ file); ghi câu hỏi mở |
| Xoá nhầm file còn được dùng | Low×Med | Đã grep import; khôi phục bằng `git checkout ca854f443 -- <file>` |

## Rollback

Commit 1 (guard) và commit 2 (xoá) revert độc lập. File tracked lấy lại từ `ca854f443`; `output.txt` mất vĩnh viễn (G1 phải nói rõ).

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Không bao giờ nhắc `--no-verify`** trong output của hook, spec, how-to hay `AGENTS.md` (hôm nay repo có 0 chỗ nhắc; nó bỏ qua mọi chốt chặn của hook, kể cả hai chốt chống mất dữ liệu ở `.githooks/pre-commit:122-127,337-354`). Thông báo từ chối chỉ nói: đưa thay đổi allowlist vào một commit riêng, hạ cánh ở main trước.
- **Chốt chặn từ chối một commit vừa sửa allowlist vừa thêm file gốc mới**, để thay đổi allowlist luôn đứng riêng và xem được.
- **Chốt chặn bỏ qua commit merge** (`MERGE_HEAD` tồn tại): `fgos approve` chạy `git merge --no-commit --no-ff` rồi `git commit --no-edit` sau khi verify đã xong (`src/runner/merge.mjs:1333,1626-1641`); nếu hook từ chối, merge bị huỷ sau verify. Thêm ca e2e cho đường approve. Đọc allowlist từ index của cây đang commit (đề xuất của reviewer) **không nhận**: hook chạy từ đường dẫn tuyệt đối của main checkout, đây là thiết kế đã có, và quy tắc "hạ cánh ở main trước" đủ.
- **Kiểm tag G1:** `git show <tag> --stat` in diff của commit được gắn tag, không in cây. Dùng `git ls-tree --name-only pre-root-junk-cleanup` lọc theo danh sách 30 tên, yêu cầu đếm đúng 30.
- **Danh sách hồi quy hook đầy đủ:** 16 file test chạm hook (`rtk proxy grep -rlE "githooks|hooksPath|installGitHooks" test`), thêm vào kiểm hẹp: `test/scripts/install-git-hooks.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `checks-setup-config.test.mjs`, `checks-setup-hookspath.test.mjs`, `dir-resolution.test.mjs`, `uninstall-wiring-2.test.mjs`, `uninstall-wiring-3.test.mjs` ngoài tám file đã nêu. Chưa test nào tạo marker `apps/fgos/Cargo.toml`, nên ca (e) cần mã fixture mới.
