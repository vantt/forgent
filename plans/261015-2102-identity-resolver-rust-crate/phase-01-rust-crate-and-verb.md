# Phase 01: contract, vector, crate và verb `fgos identity`

Thiết kế: [phase-00 §2–§5, §10](phase-00-design-and-review.md).

## Yêu cầu

- Crate `fgos-session-identity` thuần: `resolve(env, tree, caller_pid, fgos_dir) -> WriterIdentity`; `resolve_current(fgos_dir)` cho caller Rust trong process (dùng pid của chính nó).
- Adapter `/proc` sau trait `ProcessTree`; unix khác dùng `getsid`; Windows trả `unresolved`.
- Provider native `session-identity.resolve` + route `identity`, chạy được khi recursion guard bật.

## File

| Hành động | File |
|---|---|
| tạo | `packages/session-identity/contracts/session-identity.resolve.v1.json`, `session-identity.golden.v1.json` |
| tạo | `packages/session-identity/rust/Cargo.toml`, `src/lib.rs`, `src/resolve.rs`, `src/proc_tree.rs`, `src/provider.rs`, `tests/golden.rs` |
| sửa | `Cargo.toml` (member), `Cargo.lock`, `apps/fgos/Cargo.toml`, `apps/fgos/src/main.rs` (descriptor + provider), `apps/fgos/src/cli_projector.rs` (`--pid`, `--fgos-dir`) |
| sửa | `packages/host-runtime/rust/src/catalog.rs`, `packages/host-runtime/contracts/command-route-annotations.json`, `command-routes.json` (sinh lại bằng `scripts/export-command-selectors.mjs`) |
| sửa | `src/cli/command-registry.mjs` (help `identity`) |
| sửa nếu cần | `test/rust-host/command-routes.test.mjs`, `test/rust-host/help-routes.test.mjs` |

## Bước

1. Viết contract + vector trước, `tests/golden.rs` đỏ.
2. Cài `resolve` + `proc_tree` (parse stat từ `)` cuối: ppid, session, tty_nr), golden xanh.
3. Provider + projector + route + catalog.
4. Test binary thật: `fgos identity` với env id; `GUARD=1` vẫn chạy; `--pid` sai dạng → exit 4; flag lạ → exit 4.

## Test

`cargo test -p fgos-session-identity -p fgos -p fgos-host-runtime`; `node --test test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs`.

## Rủi ro / rollback

Thêm mới, chưa ai gọi: revert commit là xong. Rủi ro chính là grammar operation id và test catalog; chạy test catalog ngay sau bước 3.
