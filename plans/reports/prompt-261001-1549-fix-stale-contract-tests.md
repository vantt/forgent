# Prompt: cập nhật test cũ theo contract hiện hành + sửa `--help` của Rust host

Dán phần dưới dòng `---` cho agent thực thi. Working directory: `/home/vantt/projects/forgentX`.

**Nguồn:** báo cáo `plans/reports/test-baseline-261001-1543-main-red-suite.md` (§3, 5 contract drift). Hướng xử lý (discussion lead đề xuất; owner duyệt bằng việc giao prompt này): implementation là contract đúng, vì đến từ các plan đã xong và đã merge. Test cũ phải đổi theo implementation, không làm ngược lại. Riêng mục 5 là lỗi của Rust host.

---

## Nhiệm vụ

Làm `npm test` trên `main` xanh **trừ** `test/runner/loop.test.mjs`. File đó thuộc plan T (`plan/260930-tier-rigor-consolidation`); plan T phải làm nó xanh trước khi merge, không phải việc của prompt này.

### A. Cập nhật test theo contract hiện hành

1. `test/e2e/runner-loop.test.mjs:804`: bỏ `fgos check` (đã xoá ở `c36f8d7`, Observe F7). Chuyển sang `fgos metrics outcomes <id>` (`packages/observe/rust/src/metrics_cli/outcomes.rs`), hoặc đọc thẳng view state nếu e2e chạy không có host.
2. `test/e2e/runner-loop.test.mjs:868`: friction không còn nằm trong `events.jsonl` (`120af6b3d`, F5). Kiểm bản ghi trong `.fgos/observe/friction/` của thư mục test.
3. `test/runner/assignment-dispatch.test.mjs:410,2599,2628,3204` và `test/runner/dispatch-operability-production-door.test.mjs:106`: RunResult v3 đã bỏ `status` ở root (`d69ae1014` "drop legacy status/confidence projection"). Assert theo `classification`/`outcome` của v3. Đọc writer v3 trong `src/runner/dispatch/assignment-runner.mjs` để lấy đúng tên field; không đoán.

### B. Sửa Rust host: `fgos friction --help` và `fgos metrics --help` phải thoát mã 0

- Hiện tại: parser đòi subcommand trước khi xét `--help`, nên thoát mã 4 (`packages/observe/rust/src/metrics_cli/`, `friction_cli/`).
- Sửa: xét `--help`/`-h` ở mức command gốc, in help, thoát 0. **Không** thêm ngoại lệ vào `generateCoverageFloorCases` (`test/rust-host/harness.mjs:820`).
- Chạy `test/rust-host/release-tree.test.mjs` + `cargo test` của crate observe.

### C. Dọn hai chỗ xử lý tạm của lượt trước

1. `test/cli/fgos-stage.test.mjs`: test `fgos evolve` đang `test.skip`. Lệnh đã retire, và repo không giữ tương thích ngược (một người dùng) → **xoá test**. Ghi commit nêu lý do.
2. `test/util/host-bin.test.mjs`: `t.skip` khi phát hiện bản cài trên máy dev, nghĩa là test **không bao giờ chạy trên máy của owner**. Làm hermetic thật: chỉ định root/package-root qua tham số hoặc env (nếu `resolveHostBin` chưa có chỗ chèn thì thêm tối thiểu, có test), rồi bỏ skip.

## Phối hợp với plan T (quan trọng)

- Worktree `~/projects/forgentX-tier-rigor-p02` có thay đổi **chưa commit** trên `test/e2e/runner-loop.test.mjs`, `test/runner/assignment-dispatch.test.mjs`, `test/runner/dispatch-operability-production-door.test.mjs`. **Không đụng worktree đó.**
- Diff của prompt này phải **nhỏ, chỉ ở đúng dòng assert**: không đổi format, không đổi helper chung, không sắp lại code, để T merge `main` vào dễ.
- Không sửa `src/runner/dispatch/**`.

## Cách làm

- Worktree riêng: `git worktree add ../forgentX-stale-contract-tests -b fix/stale-contract-tests main`. Symlink `node_modules` và `target`.
- Mọi lệnh test chạy với `env -u CLAUDE_CODE_SESSION_ID`.
- Làm theo thứ tự A → B → C. Mỗi mục: chạy test của file đó, commit (conventional, không plan ID, không nhắc AI).
- Cuối cùng: full `npm test`, rồi `git merge --no-ff` vào `main` (không checkout nhánh trong checkout chính).

## Bàn giao

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Full npm test trước/sau (file fail, test fail) — chỉ còn loop.test.mjs của plan T?
Field v3 đã dùng thay `status` (tên + file:line writer)
Commits trên main
Concerns
```
