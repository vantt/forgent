# Phase 02: Observe dùng crate, xoá bản chép

Thiết kế: [phase-00 §9](phase-00-design-and-review.md).

## Yêu cầu

- `shard.rs` không còn `resolve_writer_id`; tên shard đặt từ `WriterIdentity` (`<id>` hoặc `pid-<id>`).
- `friction.rs` `current_caller().session_id` lấy từ crate (`env`/`registry` → có, còn lại → vắng).
- `eval_journal.rs` dùng cùng hàm tên shard.

## File

`packages/observe/rust/Cargo.toml`, `src/shard.rs`, `src/lib.rs`, `src/eval_journal.rs`, `src/friction.rs`, `tests/eval_journal_test.rs`.

## Bước

1. Test: tên shard với `FGOS_SESSION_ID` = id; với chỉ `CLAUDE_CODE_SESSION_ID` = id đó (trước đây `pid-<own>`); không env → `pid-<số>`.
2. Thay hàm, xoá re-export cũ, sửa caller và test đang dùng `resolve_writer_id`.
3. `cargo test -p fgos-observe` (chạy với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID` vì env của phiên agent nay ảnh hưởng tên shard).

## Rủi ro / rollback

Tên shard của writer terminal đổi (nhiều process chung một shard). Ghi đã nằm dưới `acquire_store_lock`, reader đọc mọi shard. Revert commit nếu không sửa được trong 2 vòng.
