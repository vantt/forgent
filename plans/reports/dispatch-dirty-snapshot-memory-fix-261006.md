# Dispatch dirty-before snapshot memory fix

Ngày: 2026-10-06. Nhánh: main. Chưa commit (lead commit).

## Nguyên nhân (đã kiểm)

- `src/runner/dispatch/assignment-runner.mjs` `snapshotDirtyBeforeFiles`: `fs.readFileSync` cả file, lưu `{ content, hash, exists }` vào Map sống tới hết run (Map truyền tiếp vào `settleRunOutcome`). Grep `snap.content` / `.content` trên `src/`: không nơi nào đọc `content`. Bản ghi baseline `evaluator-baseline.v1` chỉ lấy `{ exists, sha256: snap.hash }`.
- `src/runner/dispatch/settlement.mjs` nhánh read-only: `fs.readFileSync` cả file để băm lại -> đỉnh RAM thêm một lần kích thước file.
- `src/runner/dispatch/detached-run-supervisor.mjs` (`writeEvaluatorBaseline`, ~dòng 887-900): chỉ nhận và ghi object `dirtyBeforeSnapshots` do caller truyền vào, không đọc file, không đụng `content`. Không sửa.
- Rủi ro treo ở bản cũ: `existsSync` đúng với FIFO, `readFileSync` trên FIFO không có writer chặn vô hạn; thiết bị ký tự (ví dụ symlink tới `/dev/zero`) đọc vô hạn tới OOM. Cả hai nơi đều dính. Thư mục: `EISDIR` bị nuốt (snapshot bỏ entry; settlement coi là không tồn tại).

## Thay đổi

- `src/runner/dispatch/proof-helpers.mjs`: thêm `sha256FileSync(filePath)` — mở `O_RDONLY|O_NONBLOCK`, `fstat` trên fd, không phải regular file thì ném lỗi `ENOTREGULAR` (không đọc), còn lại đọc khối 1 MiB vào một buffer dùng lại, `createHash('sha256')`, trả hex. Theo symlink như cũ. Kiểm tra trên fd nên FIFO tráo vào sau `existsSync` cũng không treo. Repo chưa có helper băm theo luồng (`handoff-refs.mjs` `sha256OfFile` vẫn `readFileSync`, nằm ngoài phạm vi), nên đặt một helper duy nhất vào module digest dạng leaf sẵn có; không tạo file mới.
- `src/runner/dispatch/assignment-runner.mjs`: `snapshotDirtyBeforeFiles` dùng `sha256FileSync`, bản ghi chỉ còn `{ hash, exists }`; thêm `export` cho hàm (để test). Chữ ký giữ nguyên.
- `src/runner/dispatch/settlement.mjs`: tách vòng so sánh thành `export function findMutatedDirtyBeforeFiles(cwd, dirtyBeforeSnapshots)` (cùng logic: Map hoặc object, `snap.hash ?? snap.sha256`, lỗi đọc -> coi như không tồn tại), dùng `sha256FileSync`. `settleRunOutcome` gọi nó dưới cùng điều kiện `isReadOnly && dirtyBeforeSnapshots`. Chữ ký `settleRunOutcome` không đổi.
- `test/runner/assignment-runresult.test.mjs`: mở rộng file test hiện có (đã chứa test mutatedDirtyBeforeFiles end-to-end), thêm 5 test.

Hành vi quan sát không đổi: cùng `exists`, cùng hex sha256, cùng xử lý file biến mất/không đọc được, cùng `mutatedDirtyBeforeFiles`, `evaluator-baseline.v1` giữ nguyên định dạng. Khác duy nhất: FIFO/thiết bị giờ bị coi như entry không đọc được (giống thư mục) thay vì treo/đọc vô hạn.

## Bằng chứng

Test mới (`env -u CLAUDE_CODE_SESSION_ID node --test test/runner/assignment-runresult.test.mjs`):
- hash khớp `createHash('sha256').update(readFileSync(f))` trên file 3 MiB + 12345 byte (khối cuối lẻ), file rỗng, symlink.
- thư mục ném lỗi; FIFO không writer ném `ENOTREGULAR` trong < 2 s.
- snapshot: khoá bản ghi đúng `['exists','hash']`; file biến mất -> `{hash:null, exists:false}`; thư mục bị bỏ qua như cũ.
- file thưa 200 MiB: tăng `arrayBuffers` và `rss` < 64 MiB, < 3 s (thực đo ~180 ms).
- `findMutatedDirtyBeforeFiles`: phát hiện sửa/xoá/tạo mới, bỏ qua file 2 MiB không đổi; cùng kết quả với dạng baseline `{exists, sha256}`.

Nhóm test liên quan, tất cả xanh (exit 0):
- assignment-runresult, assignment-dispatch, dispatch-reconciliation-import-graph, evidence-attribution, operation-choice, dispatch-reconcile-operation, assignment-enumerator-guard, dispatch-worker-home: 322/322 pass.
- herdr-reconciliation, cli-spawn-reconciliation, dispatch-confinement-authority, herdr-round-reconcile, assignment-cwd-mutex-concurrency: 82/82 pass.
- Không có file test riêng cho settlement/supervisor; các test trên là nơi phủ `settleRunOutcome`/`reconcileCliSpawnRun`/supervisor.

Mutation check (bản sao tạm trong scratchpad, cây làm việc không đụng): trả `snapshotDirtyBeforeFiles` về `readFileSync` + giữ `content` -> 2 test fail: "records only existence and hash" và "hashes a 200 MiB dirty file with bounded memory" (`arrayBuffers grew by 200.0 MiB`).

RSS trước/sau (script tạm, không commit; file thưa 300 MiB dirty, `process.resourceUsage().maxRSS`, mỗi bản một tiến trình):

| Bản | maxRSS trước | đỉnh | tăng | arrayBuffers giữ lại | thời gian | hash |
|---|---|---|---|---|---|---|
| cũ (readFileSync + content) | 66 MiB | 368 MiB | 302 MiB | 300 MiB | 336 ms | 17a88af83717… |
| mới (theo luồng) | 67 MiB | 68 MiB | 1 MiB | 2 MiB | 256 ms | 17a88af83717… |

Bản cũ giữ 300 MiB suốt run và settlement đọc thêm một lần nữa (đỉnh ~2x kích thước file); bản mới không phụ thuộc kích thước file.

## Impact đã báo

GitNexus (repo `/home/vantt/projects/forgentX`, index commit b334695 — cũ hơn HEAD e9deda6fb, đã đối chiếu bằng grep):
- `snapshotDirtyBeforeFiles` upstream: risk CRITICAL, 1 direct caller (`executeAssignment`), 8 process (dispatchClaimedItem, executeAssignment, dispatchBound, …).
- `settleRunOutcome` upstream: risk CRITICAL, 2 direct caller, 9 process (reconcileCliSpawnRun, dispatchClaimedItem, dispatchBound, …).
- Grep xác nhận: `snapshotDirtyBeforeFiles` chỉ gọi tại `executeAssignment`; tiêu thụ snapshot chỉ ở baseline (exists/hash) và `settleRunOutcome`. Giảm thiểu: không đổi chữ ký, không đổi hợp đồng baseline, chỉ thay cách băm + bỏ trường không ai đọc.

## UNPROVEN

- Chưa chạy `npm test` toàn bộ (lead chạy).
- Chưa tái hiện kịch bản gốc `fgos run` song song ~1,9 GB end-to-end; chỉ đo ở mức hàm. Lý thuyết đỉnh giảm từ ~2x tổng kích thước file dirty xuống ~1 MiB.
- FIFO/thiết bị: test cho FIFO; thiết bị ký tự (`/dev/zero` qua symlink) chỉ suy luận từ `fstat().isFile()` false, chưa có test riêng.
- Windows: `O_NONBLOCK` không có thì fallback 0; chưa chạy trên Windows.
- `src/runner/execution/handoff-refs.mjs` `sha256OfFile` vẫn đọc cả file — ngoài phạm vi, có thể dùng `sha256FileSync` sau.

## Cần cập nhật tài liệu

- CHANGELOG.md `## [Unreleased]` (mục Fixed):
  `- Dispatch no longer loads every pre-existing dirty file into memory for the whole run: dirty-before snapshots keep only existence and a streamed sha256, so a worktree with large untracked files no longer drives \`fgos run\` to multi-GB RSS or OOM, and a FIFO or device among the dirty files no longer hangs the run.`
- Spec: không spec nào trong `docs/specs/` mô tả việc đọc cả nội dung snapshot (grep `dirtyBeforeSnapshots|dirtyBefore` trên `docs/specs` rỗng) — không cần sửa.
- No component-boundary change.
