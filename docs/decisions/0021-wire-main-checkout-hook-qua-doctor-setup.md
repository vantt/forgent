---
type: explanation
title: 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence
tags: []
timestamp: 2026-07-28T00:00:00.000Z
source_capture_ids: []
date: 2026-07-28
status: accepted
extends: [0005]
relates_specs: [runner]
---

# 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence

## Bối cảnh

`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.

Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.

Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.

## Quyết định

Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):

- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).

### Vì sao không app-level lock-wrap trong `approve`

Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.

### Vì sao không epoch-fence-merge-gate

Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.

## Hệ quả

- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
