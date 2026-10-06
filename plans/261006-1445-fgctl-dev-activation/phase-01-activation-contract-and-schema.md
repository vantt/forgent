# Phase 01 — Activation contract + schema

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); [phase-00](phase-00-research-and-spec.md) (spec draft, DP5, DP7)
- `docs/platform/packaging-distribution/contracts/activation-binding.md` (Frozen V1), `architecture/runtime-identity-and-activation.md`, `spec.md` §3.3/§4/§7; prior art `docs/architect/packaging-distribution/runtime-identity-and-activation.md:895-920`
- Code: `packages/distribution/rust/src/init.rs:130-148` (`WorkspaceActivationBinding`), `packages/distribution/rust/tests/schema_golden.rs:239,285,298`, goldens `packages/distribution/rust/tests/goldens/activation-binding-{full,minimal}.json`

## Requirements

1. Spec duyệt ở Phase 00 vào đúng nhà (Q9): `spec.md`, contract, architecture (khôi phục mục Dev/Source Activation đã bị bỏ sót khi promote), một dòng trỏ trong `docs/specs/distribution.md` mục "Dev checkout shell helpers".
2. Schema theo DP5. Mặc định đề xuất: trường tuỳ chọn `activationKind` (`"release"` | `"dev-source"`, vắng = `"release"`), `artifactDigest` dạng `dev:<workspaceId>` khi dev (định dạng chốt ở Phase 00), không đổi `schemaVersion`. Nếu DP5 = (b) thì `schemaVersion: 2` và phase này gồm cả đường đọc V1.
3. Không thêm trường nào ngoài spec đã duyệt.
4. Sửa claim HI-I027 trong `docs/platform/host-invocation-routing/intent-preservation-ledger.md:81` cho đúng trạng thái.

## Files

- Modify: `packages/distribution/rust/src/init.rs` (struct + serde default), `packages/distribution/rust/tests/schema_golden.rs`, `docs/platform/packaging-distribution/{spec.md,contracts/activation-binding.md,architecture/runtime-identity-and-activation.md}`, `docs/platform/packaging-distribution/verification/implementation-alignment.md` (một hàng, trạng thái "target"), `docs/platform/host-invocation-routing/intent-preservation-ledger.md`, `docs/specs/distribution.md` (một dòng trỏ)
- Create: `packages/distribution/rust/tests/goldens/activation-binding-dev-source.json`
- Delete/merge: không có file xoá; hai golden cũ giữ nguyên byte

## Steps

1. `impact({target:"WorkspaceActivationBinding", direction:"upstream"})`; cross-check `rtk proxy grep -rn "WorkspaceActivationBinding\|ActivationBinding" packages apps`. Báo blast radius; HIGH/CRITICAL → dừng hỏi anh.
2. Test đỏ trước: golden dev-source roundtrip; golden cũ deserialize ra kiểu `release`.
3. Thêm trường; chạy test → xanh.
4. Docs theo Requirement 1, 4. Đối chiếu `docs/platform/component-boundary.md` → ghi note.
5. Commit ngay khi xanh.

## Tests / validation

1. Hẹp: `cargo test -p fgos-distribution --test schema_golden`.
2. Lân cận: `cargo test -p fgos-distribution`; `env -u CLAUDE_CODE_SESSION_ID node --test test/rust-host/fgctl-init.test.mjs test/rust-host/fgctl-upgrade.test.mjs`.
3. `git diff --exit-code packages/distribution/rust/tests/goldens/activation-binding-full.json packages/distribution/rust/tests/goldens/activation-binding-minimal.json` = 0.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Đổi contract frozen làm reader khác (Node, herdr) hiểu sai | Med×High | Trường tuỳ chọn; reader chưa biết trường sẽ fail-closed (Phase 00 Q8 chứng minh) |
| Docs promote và architect lệch nhau lần nữa | Med×Low | Chỉ sửa bản `docs/platform`; bản `docs/architect` là legacy, không sửa |

## Rollback

`git revert`; chưa có writer nên không có dữ liệu dev nào tồn tại.
