# Prompt: sửa test fixture rò vào store `.fgos` thật

Dán phần dưới dòng `---` cho agent thực thi. Working directory: `/home/vantt/projects/forgentX`.

---

## Nhiệm vụ

Bộ test của repo đang **ghi dữ liệu fixture vào store `.fgos/` thật** của repo, thay vì vào thư mục tạm. Việc này làm bẩn chính dữ liệu mà component Observe (`fgos metrics`, `fgos friction`) đang dùng để đo harness. Hãy:
1. tìm **mọi** test đang rò;
2. sửa tận gốc để test không thể ghi vào `.fgos` thật nữa, kèm một hàng rào tự động chặn tái phát;
3. dọn dữ liệu rác đã rò, **sau khi backup và được anh xác nhận**.

**Không tạo work item** (`fgos submit`/`fgos add`): work engine hiện chưa tích hợp đúng với lớp harness. Hãy làm trực tiếp trên một nhánh/worktree riêng và báo cáo lại.

## Bằng chứng đã có (2026-09-29)

- `.fgos/coordination/sessions/` có khoảng **297 session không có result**, id dạng fixture: `coord_asgn_001`, `coord_asgn_idem`, `coord_bind_001`, `coord_bind_multi_no_opt`, `coord_rd_disposition_foreign*`, `coord_da_grant_cross_session*`, `coord_sidecar_dir_injection`, `coord_mu97…_…` (id ngẫu nhiên, mới nhất ngày 2026-09-20), `policy-test*`.
- `.fgos/dispatch-runs/` có khoảng **124 run giả**: `depth-test-exec/` (120, mới nhất ngày 2026-09-25), `no-such-exec/`, `some-exec/`.
- Các test nghi ngờ (grep id fixture): `test/runner/coordination-store.test.mjs`, `test/runner/coordination-store-fault-injection.test.mjs`, `test/runner/coordination-recheck-disposition.test.mjs`, `test/runner/dispatch.test.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/setup/checks.test.mjs`.
- Cơ chế nghi ngờ:
  - test spawn CLI với `cwd: repoRoot` (ví dụ `test/runner/dispatch.test.mjs:2924`, `test/cli/dispatch-operability.test.mjs:149-155`);
  - store tự tìm ra `.fgos` của repo: `openDispatchRun` trong `src/runner/dispatch/cli.mjs:260-267` dùng `fgosDir` nếu có, còn `src/runner/coordination/store.mjs:69` xác định `.fgos/coordination/sessions` theo workspace.
  - **Đây chỉ là giả thuyết, phải chứng minh lại**; có thể còn nguồn rò khác.
- Memory của repo: `npm test` không hermetic khi chạy trong agent session (`CLAUDE_CODE_SESSION_ID` lọt vào process con); fixture trong `/tmp` từng làm cạn inode. Lưu ý cả hai khi chạy test.
- **Bối cảnh mới:** plan Observe (`plans/260929-1501-metrics-friction-rust-native/`) đang được implement. Nó thêm store `.fgos/observe/` (cases, friction, snapshots; shard theo writer), và `npm test` sẽ build host Rust rồi export `FGOS_HOST_BIN`. **Test mới của Observe cũng không được ghi vào `.fgos/observe/` thật.** Hàng rào phải bao cả thư mục này.

## Yêu cầu

1. **Chứng minh nguồn rò trước khi sửa.**
   - Snapshot danh sách file trong `.fgos/` (tên kèm mtime, không đọc nội dung nhạy cảm như `secrets.local.env`).
   - Chạy từng file test nghi ngờ **riêng lẻ**, rồi diff snapshot để biết chính xác test nào ghi gì.
   - Sau đó chạy toàn bộ `npm test` (với `CLAUDE_CODE_SESSION_ID` bị unset) và diff lần nữa để bắt các nguồn chưa biết.
   - Ghi bảng: test → đường dẫn bị ghi → cơ chế (cwd, fallback của store, env).
2. **Sửa tận gốc:**
   - Mọi test phải chạy trên thư mục tạm riêng (`mkdtemp`), truyền `--dir` hoặc `cwd` tường minh, và dọn sạch khi xong.
   - Không sửa store để "đoán" là đang chạy test. Hãy sửa test.
   - Nếu có chỗ store fallback về `.fgos` của repo khi thiếu tham số, đánh giá xem fallback đó có phải hành vi đúng cho người dùng thật không. Nếu đúng thì giữ, chỉ sửa test.
3. **Hàng rào chặn tái phát** (một đường duy nhất): trong `scripts/run-tests.mjs`, chụp danh sách file của `.fgos/` repo trước và sau khi chạy suite; nếu có file mới hoặc bị đổi (loại trừ những thứ do chính runner sinh hợp lệ, liệt kê tường minh), suite **fail** và in danh sách vi phạm. Có test cho chính hàng rào này.
4. **Dọn dữ liệu rác (thao tác phá huỷ, bắt buộc theo thứ tự):**
   - Backup `.fgos/coordination/sessions/` và `.fgos/dispatch-runs/` vào `.fgos/backups/test-leak-<ngày>/` (hoặc tar trong scratchpad).
   - Lập danh sách **chính xác** thư mục sẽ xoá: khớp pattern fixture **và** không có `result-linked` (với session), hoặc executor id là fixture (với run). Kèm số lượng.
   - **Dừng lại và hỏi anh xác nhận danh sách** trước khi xoá. Không xoá session nào có result thật.
   - Sau khi xoá, chạy `fgos doctor` (có check `coordination-sessions-closed`) và báo số liệu trước/sau.
5. Quy ước repo:
   - Đọc `AGENTS.md`/`CLAUDE.md`.
   - Chạy capability gate impact-analysis và gitnexus `impact` trước khi sửa code dùng chung.
   - Commit ngay sau khi verify xanh, theo conventional commits, không ghi mã plan hay finding vào commit message.
   - Không dùng `git add -A`.

## Không làm

- Không tạo work item.
- Không sửa code của Observe đang được implement, trừ khi hàng rào phát hiện test Observe rò; khi đó chỉ báo cáo, không sửa.
- Không xoá gì trong `.fgos/` khi chưa backup và chưa được xác nhận.
- Không đụng `.fgos/events*.jsonl` (event log của Work là bất biến).

## Kết quả bàn giao

Báo cáo gồm:
- bảng nguồn rò (đã chứng minh bằng diff);
- danh sách test đã sửa;
- mô tả hàng rào và bằng chứng nó fail khi có rò (một test cố ý rò);
- danh sách đã xoá cùng vị trí backup;
- số liệu trước/sau: số session, số dispatch-run, kết quả `fgos doctor`;
- phần nào chưa chạy (NOT RUN).

Kết thúc bằng:
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: 1–2 câu
Concerns/Blockers: nếu có
```
