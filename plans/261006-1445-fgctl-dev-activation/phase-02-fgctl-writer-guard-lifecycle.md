# Phase 02 — fgctl writer, guard, lifecycle verbs

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); [phase-00](phase-00-research-and-spec.md) Q1, Q3, Q4, Q7, DP4, DP6, DP7; [phase-01](phase-01-activation-contract-and-schema.md)
- Code: `apps/fgctl/src/main.rs:9-241`; `packages/distribution/rust/src/init.rs` — `init_workspace` :715, `publish_and_tail` :991-1140 (ghi pin :1079-1094, tail :1132), `run_tail` :632-683, `upgrade_workspace` :1193-1335, `repair_workspace` :1336-1484, `verify_workspace` :1487-1579, `get_workspace_status` :1593; `packages/distribution/rust/src/workspace.rs:31` `resolve_workspace_root`; `store.rs:250-256` `release_dir_name`
- Tests hiện có: `test/rust-host/fgctl-init.test.mjs`, `fgctl-upgrade.test.mjs`, `fgctl-stage.test.mjs`

## Requirements

1. **Writer** (dạng lệnh theo DP7): kích hoạt dev cho workspace hiện tại: `activationKind: "dev-source"`, `releasePath` = workspace root (main checkout, DP6), `artifactDigest` = định dạng chốt ở Phase 01, `previousArtifactDigest` = digest `sha256:` của release đang kích hoạt (bắt buộc có — không có release thì từ chối, để luôn có đường thoát), `pinSnapshot` sao từ pin hiện tại. Atomic qua `publish_activation_file` (`init.rs:595`) và `ActivationLockGuard`.
2. **Không ghi** `.fgos/distribution.json`, không ghi `<store>/releases/`, không tạo bản ghi quarantine. Tail (`run_tail`) chạy hay không theo Phase 00 Q3.
3. **Guard (DP4)**: thiếu marker `apps/fgos/Cargo.toml` hoặc `package.json` `name` ≠ `forgent` ở workspace root → exit 1, message nêu lý do, không ghi file nào. Trên nền tảng ngoài phạm vi (Q7) → từ chối tường minh.
4. **Lifecycle khi đang dev**:
   - `fgctl verify`: không tìm release trong store theo digest `dev:*`; báo "dev-source activation has no immutable release to verify", exit theo spec (đề xuất 0 + dòng thông báo), **không** ghi `quarantined`, **không** rename gì.
   - `fgctl repair`: thoát dev = đưa activation về `previousArtifactDigest` qua pipeline có sẵn; không bao giờ chọn `dev:*` làm đích.
   - `fgctl upgrade --from`: được phép; `previous` lấy digest release trước dev, không phải `dev:*`.
   - `fgctl status`: in kiểu kích hoạt.
5. Hành vi `fgctl` khi activation là `release` **không đổi** (byte-identical output test cũ).

## Files

- Modify: `apps/fgctl/src/main.rs` (verb/cờ + usage), `packages/distribution/rust/src/init.rs` (writer, guard, nhánh dev trong verify/repair/upgrade/status), `test/rust-host/fgctl-upgrade.test.mjs` hoặc file mới (chọn file mới để không đụng file 41.7K)
- Create: `test/rust-host/fgctl-dev-activation.test.mjs`
- Delete/merge: không; nếu Phase 00 chọn tái dùng `publish_and_tail` với cờ thay vì hàm riêng thì không nhân đôi pipeline publish

## Steps

1. `impact` upstream cho `publish_and_tail`, `verify_workspace`, `repair_workspace`, `upgrade_workspace`, `get_workspace_status`; cross-check grep (`apps/fgctl/src/main.rs` là caller chính; `apps/fgos` có gọi không). Báo blast radius; HIGH/CRITICAL → dừng.
2. Test đỏ trước (fixture: `FGOS_STATE_HOME` tạm, `$HOME` tạm, `git init`, release giả từ builder sẵn có như `fgctl-init.test.mjs` làm):
   - (a) repo không marker → lệnh dev exit 1, `activation.json` + `.fgos/distribution.json` byte-identical;
   - (b) repo có marker + release kích hoạt → `activationKind == "dev-source"`, `previousArtifactDigest` = digest cũ, pin byte-identical;
   - (c) `fgctl verify` khi dev → không có `"status": "quarantined"`, cây checkout không mất file (so danh sách file trước/sau);
   - (d) `fgctl repair` khi dev → `artifactDigest` = digest cũ, `activationKind` vắng hoặc `release`;
   - (e) chưa có release kích hoạt → lệnh dev từ chối;
   - (f) nền tảng ngoài phạm vi → lời từ chối (skip có lý do trên nền tảng trong phạm vi).
   Tên test mô tả hành vi, không chứa mã plan/phase.
3. Cài đặt; chạy test → xanh.
4. Commit ngay khi xanh.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/rust-host/fgctl-dev-activation.test.mjs` (đỏ → xanh).
2. Lân cận: `node --test test/rust-host/fgctl-init.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/rust-host/fgctl-stage.test.mjs`; `cargo test -p fgos-distribution -p fgctl`.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Nhánh verify/repair sai làm quarantine release thật hoặc đụng checkout | Low×High | Case (c), (d); code không bao giờ dùng `releasePath` của dev làm nguồn rename |
| Guard dựa marker bị lách bằng tạo file giả | Low×Low | Threat model: chống nhầm lẫn, không chống cố ý; ghi rõ trong spec |
| Lệnh dev chạy song song với `upgrade` | Low×Med | Dùng `ActivationLockGuard` như các verb khác |

## Rollback

Trước khi revert code: chạy `fgctl repair` ở mọi workspace đang dev (về release trước). Sau đó `git revert`. Code cũ gặp dev activation → shim exit 3 (fail-closed), không hỏng dữ liệu.
