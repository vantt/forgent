# Phase 03: observe store lock và shard snapshot qua crate

Wave 1. Nhánh `rust-callers/p03-observe`, worktree `.claude/worktrees/rc-p03`. Phụ thuộc: P00. Song song với P01, P02, P04.

## Đọc trước

- r6 §6.2 (`observe` = `mutex` repo, hạng 80), §11/4.4 ("observe `store_lock.rs` và shard dùng crate").
- Source: [`store_lock.rs`](../../packages/observe/rust/src/store_lock.rs) (270 dòng: `LockContent`, `StoreLockGuard`, `is_process_dead`, `is_lock_expired`, `acquire_store_lock` ở `:139`), [`shard.rs`](../../packages/observe/rust/src/shard.rs) (writer id đã lấy từ crate session-identity, `b4ec8a35e`; không đổi), [`snapshot.rs:65-75`](../../packages/observe/rust/src/metrics_cli/snapshot.rs) (append shard **không** lock).
- Sáu chỗ gọi `acquire_store_lock` (grep): [`eval_journal.rs:291`](../../packages/observe/rust/src/eval_journal.rs), [`case_journal.rs:264`, `:337`](../../packages/observe/rust/src/case_journal.rs), [`friction.rs:290`, `:341`](../../packages/observe/rust/src/friction.rs); export ở [`lib.rs:25`](../../packages/observe/rust/src/lib.rs).
- Lỗi đang có: hết hạn theo mtime 30 s (ghi > 30 s bị cướp), dọn không đọc lại ([kiểm kê §2.3, §4](../reports/research-261015-1731-lock-inventory-and-standardization.md)).

## Yêu cầu

- `acquire_store_lock(root)` → `fgos_holder_lock::acquire(registry "observe", Ex, Wait 5000 ms)` trên `<root>/.fgos/locks/observe.lock`. Chờ là chờ kernel (`--wait-ms` trong process, crate gọi `flock` trực tiếp, không helper).
  - Hết 5 s → `ObserveLockError::Timeout(path)` (giữ mã `observe-lock-timeout`, D6).
  - `Unavailable` → biến thể mới `ObserveLockError::DriverUnavailable`.
- `StoreLockGuard` bọc `Handle`; `release(self)` và `Drop` = đóng description.
- Xoá: `LockContent`, `is_process_dead`, `is_lock_expired`, `get_process_start_time` (nếu không còn ai dùng: grep), `LOCK_TTL_SECS`, `POLL_INTERVAL`, `extern "C" fn kill`. Giữ `format_iso_now` (dùng cho `ts` của journal, không phải lock; việc `FGOS_NOW` đọc trong production là việc riêng, ngoài plan).
- **Shard snapshot (D4):** `snapshot.rs` lấy `acquire_store_lock(&req.root)` quanh `shard_path` + append + `sync_all`.
- `docs/specs/observe.md` dòng 16, 39 do P04 sửa (P03 chỉ code).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/observe/rust/src/store_lock.rs`, `packages/observe/rust/src/metrics_cli/snapshot.rs`, `packages/observe/rust/src/lib.rs` (chỉ dòng export nếu đổi), `packages/observe/rust/Cargo.toml` (dep `fgos-holder-lock`) |
| sửa | `packages/observe/rust/tests/eval_journal_test.rs` ([`:315`, `:373`, `:391`, `:523`, `:630`](../../packages/observe/rust/tests/eval_journal_test.rs) khẳng định "file `.lock` không còn" → khẳng định lock trống bằng `probe`) |
| tạo | `packages/observe/rust/tests/store_lock_multiprocess.rs` |

## Test

1. Con giữ observe lock, cha `case` ghi → chờ; con nhả sau 1 s → cha ghi được (thời gian ≈ 1 s); con giữ 6 s → cha `observe-lock-timeout` sau ~5 s.
2. Con giữ rồi SIGKILL → cha vào ngay (không đợi 30 s mtime).
3. Ghi dài hơn 30 s (con giữ 35 s, cha chờ với timeout lớn trong test bằng tham số nội bộ của crate, không env): không ai cướp (ca lỗi hôm nay).
4. Snapshot: 4 process cùng `FGOS_SESSION_ID` (cùng shard) ghi 200 snapshot mỗi process → mọi dòng của shard parse được JSON, đủ 800 dòng.
5. Một process Node giữ `observe` qua facade 4.2 → `fgos observe case …` qua binary chờ/timeout đúng (Node + Rust cùng file).

Lệnh: `cargo test -p fgos-observe -p fgos`; test Node liên quan observe (`rg -l 'observe' test/verbs test/rust-host`) với `env -u ... FGOS_HOST_BIN=<build>`.

## Tiêu chí nghiệm thu / rollback

Năm test xanh; `rg 'is_lock_expired|is_process_dead|LOCK_TTL_SECS|create_new' packages/observe/rust/src` rỗng. Rollback: revert.
