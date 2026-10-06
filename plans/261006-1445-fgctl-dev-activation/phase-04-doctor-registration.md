# Phase 04 — Doctor registration

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); [phase-00](phase-00-research-and-spec.md) Q5; [phase-03](phase-03-host-resolution-shim-and-readers.md)
- Plan A [phase-04](../261006-1415-fgos-single-door-mechanisms/phase-04-doctor-active-release-drift-check.md): check `active-release-matches-checkout`, req 2 pass-skip dev manifest (qua env). **Phải đã merge** trước phase này.
- `AGENTS.md` Install/setup/doctor gate (:72); `docs/specs/distribution.md` Data Dictionary #7 (:70, "a module adding one updates this row in the same change"), RUL9 (:244, doctor không ghi)
- Code: `src/setup/registrations.mjs` `registerCheck` (:126), `resolveActiveReleaseForDoctor` (:4509-4579), nhóm `rust-host-binary-present` / `legacy-node-payload-present` / `command-routes-drift` (:4581-4758); `test/setup/checks.test.mjs` (danh sách id cố định)
- How-to: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` bảng check

## Requirements

1. `resolveActiveReleaseForDoctor` hiểu `activationKind: "dev-source"` (đọc manifest dev theo Phase 03, không coi `releasePath` = checkout là "release thiếu manifest").
2. Doctor báo dev mode bằng đúng một check (id chốt ở Phase 00, đề xuất `workspace-dev-activation`): `passed: true` + message "dev-source activation: running Node payload from <checkout>; Rust host <binary path>; `fgctl repair` returns to <previousArtifactDigest>". `passed: false` khi: binary Rust dev vắng/không chạy được, `previousArtifactDigest` vắng hoặc release đó không còn trong store (mất đường thoát), hoặc activation dev nằm ở workspace không có marker (guard bị lách).
3. `active-release-matches-checkout` (Plan A): pass-skip khi `activationKind == "dev-source"` với message nêu lý do — mở rộng nhánh pass-skip có sẵn, không viết lại check.
4. Các check `rust-host-binary-present`, `legacy-node-payload-present` cho kết quả đúng ở dev mode (không fail giả).
5. Read-only (RUL9); không `registerFix` (sửa = `fgctl repair` hoặc build lại, người/agent tự chạy).
6. `fgctl init/upgrade` tail chạy `doctor` (`init.rs:638`): ở dev mode check mới phải pass để tail không đánh `ready-degraded`.

## Files

- Modify: `src/setup/registrations.mjs`, `test/setup/checks.test.mjs` (thêm id), `docs/specs/distribution.md` (row #7: tên + một câu), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` nếu bảng check ở đó, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (một dòng bảng)
- Create: `test/setup/workspace-dev-activation-check.test.mjs`
- Delete/merge: nhánh pass-skip "dev manifest qua env" của Plan A gộp với nhánh `activationKind` thành một điều kiện "đang chạy payload từ checkout" (một hàm), không để hai cách nhận diện dev song song

## Steps

1. `impact` upstream: `resolveActiveReleaseForDoctor`, hàm check của Plan A; cross-check `rtk proxy grep -n` trong `src/setup/registrations.mjs` (file lớn, index có thể thiếu).
2. Test đỏ trước, fixture như Plan A Phase 04: (a) dev activation hợp lệ → check mới pass, message có checkout + digest thoát; (b) binary vắng → fail; (c) `previousArtifactDigest` trỏ release không có trong store → fail; (d) release activation → check mới pass-skip ("not in dev mode"); (e) `active-release-matches-checkout` pass-skip ở (a).
3. Cài đặt; thêm id vào `checks.test.mjs`.
4. Docs + row #7 trong cùng commit (luật Data Dictionary #7).
5. Chạy thật read-only: `node bin/fgos.mjs doctor` ở repo này (release mode) → check mới báo "not in dev mode". Ghi output.
6. Đối chiếu `docs/platform/component-boundary.md` → note.
7. Commit ngay khi xanh.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID -u FGOS_ACTIVE_RELEASE_PATH -u FGOS_ACTIVE_MANIFEST_PATH`.
1. Hẹp: `node --test test/setup/workspace-dev-activation-check.test.mjs` (đỏ → xanh).
2. Lân cận: `node --test test/setup/checks.test.mjs test/setup/active-release-drift-check.test.mjs test/setup/registrations.test.mjs test/rust-host/fgctl-dev-activation.test.mjs`.
3. Rộng: `npm test`.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Conflict với Plan A trên `registrations.mjs`/row #7 | Med×Low | Chỉ chạy sau khi Plan A Phase 04 merge; row #7 hay conflict (memory) — rebase cẩn thận |
| Hai cách nhận diện dev (env vs activation) lệch nhau | Med×Med | Một hàm nhận diện (Delete/merge ở trên) |

## Rollback

`git revert`; check read-only, không có trạng thái cần dọn.
