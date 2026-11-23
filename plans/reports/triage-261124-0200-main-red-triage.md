# Phân loại test đỏ trên main (chỉ đọc)

Giờ Asia/Saigon, 2026-11-24 ~02:00. HEAD khi chạy lại: `728212c1f` (chỉ thêm commit docs sau `980d1276d`).
Nguồn: `.fgos/runtime/tmp/suite-npm.log`. Cách chạy lại: `node scripts/run-tests.mjs <file>` (từng file; `node --test` trần sai vì thiếu addon/host nên cho kết quả đỏ giả).

Lưu ý: `run-tests.mjs` có chạy cargo gia tăng để dựng artifact (ngoài ý muốn, chỉ in cảnh báo `arraydeque`) và báo "leaked" file `.fgos/runtime/tmp/suite-cargo2.log`. Không sửa file tracked nào.

Lớp: 1 = môi trường/cây bẩn, 2 = flaky/tải máy, 3 = lỗi thật trên main.

| Test | Lớp | Nguyên nhân | Chủ sở hữu | Cỡ sửa | Sạch có qua? |
|---|---|---|---|---|---|
| `git/one-door.test.mjs` (2 test, :60 :87) | 2 | `inspect-cursor-stale`: HEAD/index đổi trong lúc quét (nhiều session đang landing). Chạy lại: 9/9 pass | `p-vnsigyw6h7` ghi "HEAD moved during the scan" | không cần; có thể làm quét chịu HEAD đổi | Có |
| `install-packaging.test.mjs` (walk :39 EISDIR) | 1 | `snapshotDir` đi qua symlink-tới-thư-mục còn sót (ignored) trong `.fgos/assignments/unit-run-1795055277552-a85436e8/.../outbox/linked-plan` và `unit-run-1795055869808-93bfb6c8/.../outbox/link`. Chạy lại vẫn đỏ | `p-vnsigyw6h7` (đã nêu; status done) | nhỏ: test bỏ qua symlink (`lstat`) hoặc dọn 2 symlink | Có |
| `run-supervisor/terminal-groups.test.mjs:326` | 3 | Tab label đổi `·` thành `: ` ở `483193f2a` (11-21, `packages/terminal-control/rust/src/port.rs` TAB_SEPARATOR); test chưa cập nhật. Chạy lại: đỏ | `p-4nmomwje7j` (P1, proposed); `p-vnsigyw6h7` cùng lỗi | 1 dòng test | Không |
| `rust-host/fgctl-uninstall.test.mjs` (qua fgctl-init-fixture:127) | 2 | `build-rust-distribution --read-checkout-with-addon` thoát 1 giữa suite đầy tải (load avg ~14). Chạy lại: pass | không | không | Có |
| `scripts/check-decision-citation-drift.test.mjs:381` | 2 | `inspect-cursor-stale`, cùng cơ chế one-door. Chạy lại: pass | như one-door | như one-door | Có |
| `scripts/check-decision-citation-drift.test.mjs:497` | 1 | File chưa tracked `plans/backlog/p-2qle2tjflb-harden-next-round-per-layer-loop-...md` trích id D6-D10 (6 findings). Chạy lại: vẫn đỏ | không (file đang chờ land) | nhỏ: bỏ id D-local trong file đó trước khi land | Có, nhưng đỏ ngay khi file này được commit |
| `scripts/convention-conformance.test.mjs:203` (2 post-cutoff) | 1 + 3 | (a) untracked `plans/reports/secretary-handoff-261118-2330.md` (sai mẫu tên); (b) TRACKED `plans/discussions/privileged-chores-research/DISCUSSION.md` (commit 11-23/24; thư mục không theo `ds-<id>-<slug>`). Chạy lại: đỏ | `p-4nmomwje7j` ("one post-cutoff naming violation") | nhỏ: đổi tên thư mục (mint id) và handoff | Không (vì b) |
| `scripts/mailbox-live-confined.test.mjs` (2 test, :254 :414) | 3? chưa chứng minh | `invokeHost(['doctor','--fix','--only',...])` quá 5000ms (`ETIMEDOUT`) trong `installHookThroughDoctor`. Tái hiện 2/2 khi chạy riêng (load ~2.8), nên không chỉ do tải. `--only` mới vào ở `4259868c5` (11-23 22:36) | `p-wwegrs5c6e` là flake khác (11-16); lỗi này chưa có chủ | chưa biết; cần đo thời gian doctor trong sandbox | Chưa biết |
| `scripts/test-select-mutate.test.mjs` | 2 | Cả file bị kill (87s) và để lại `fgos-tp-BvQSbU`. Chạy lại riêng: 30/30 pass | không | không | Có |
| `workflow/guide-schema.test.mjs` (2 test) | 3 | `d44b2fb19` (11-21) thêm `domains/coding/workflows/bugfix.yaml`: 10 workflow, bugfix là `guide` không phải `playbook`; test vẫn đòi 9 + playbook. Đỏ lại | `p-4nmomwje7j`; `p-vnsigyw6h7` đã ghi nhưng đóng "done" mà test còn đỏ | nhỏ (cập nhật test) | Không |
| `state/domain-registry-compiled.test.mjs:27` | 3 | `c03eaaebc`/`ac6c36b98` (11-23): `src/workflow/definition.mjs` nay import `src/native/door.mjs` (cần addon), không có trong danh sách file copy của test. Đỏ lại | `p-4nmomwje7j` | trung bình: tính chất "không phụ thuộc" xung đột với door native; cần quyết định thiết kế | Không |
| `setup/agent-hooks.test.mjs:202` (claude delete guard shim) | 2 | ENOENT `.claude/settings.json` trong tmp fixture lúc suite đầy tải (7.8s). Chạy lại: 17/17 pass | không | không | Có |
| `packages/config/rust/tests/registry_defaults.rs:190` (cargo; chỉ đọc nguồn, không chạy) | 3 | Dòng `@fgos:doc` của `core/config-standard/docLocate.yaml` (dấu `:`) khác `description` của `core/config-schema/docLocate.schema.yaml` (dấu phẩy); dòng doc phải bằng nguồn schema. Do `7106dbf78` (11-23 19:57, docos) | plan `261122-2217-docos-pkm-locate-door` (status draft, lane vừa land) | 1 dòng (đồng bộ câu) | Không |

## Tóm tắt theo lớp
- Lớp 1 (cây bẩn): install-packaging (symlink ignored), drift:497 (untracked backlog), một nửa convention (untracked handoff).
- Lớp 2 (flaky/tải): one-door x2, drift:381, fgctl-uninstall, test-select-mutate, agent-hooks. Tất cả pass khi chạy riêng.
- Lớp 3 (thật): terminal-groups, guide-schema x2, domain-registry nodeps, convention (DISCUSSION.md), registry_defaults.rs:190; mailbox có thể thuộc lớp 3.
- Vẫn đỏ ở checkout sạch: terminal-groups, guide-schema, domain-registry, convention, registry_defaults.rs, và mailbox nếu lỗi doctor là thật.

## Câu hỏi chưa giải quyết
1. Mailbox: `doctor --fix --only <id>` có thật chậm hơn 5s trong sandbox từ `4259868c5` không, hay host sandbox khởi động lạnh? Cần đo; `p-wwegrs5c6e` (khóa V7n) không mô tả đúng lỗi này.
2. `p-vnsigyw6h7` đóng "done" nhưng guide-schema, terminal-groups, install-packaging còn đỏ: mở lại hay chuyển hẳn sang `p-4nmomwje7j`?
3. domain-registry nodeps: giữ tính chất "chỉ vài file nguồn, không addon" hay chấp nhận door native? Quyết định thiết kế của owner.
4. `plans/discussions/privileged-chores-research/` (tracked, sai mẫu tên): ai đổi tên? Shaper chỉ land discussion của mình.
5. Cột "sạch có qua" cho lớp 1/2 là suy luận từ nguyên nhân, chưa chạy trong worktree sạch.
6. `fgos convention path --kind report --slug main-red-triage` báo `invalid-type`; dùng tên dự phòng. `--kind` đúng là gì?
