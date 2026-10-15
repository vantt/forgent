# Phase 04: doctor, spec, io-contract, boundary, CHANGELOG

Thiết kế: [phase-00 §12](phase-00-design-and-review.md).

## Yêu cầu

- Doctor check `writer-identity-resolvable` trong registry chung; pass in `{id, source, binary}`; fail kèm mã lỗi và cách sửa.
- Docs là nguồn duy nhất cho luật: spec mô tả luật và giới hạn; io-contract chỉ trỏ tới spec cho chi tiết pid.

## File

| Hành động | File |
|---|---|
| sửa | `src/setup/registrations.mjs` + test doctor tương ứng |
| tạo | `docs/platform/session-identity/spec.md` |
| sửa | `AGENTS.md` (kênh tương thích cần binary host để ghi), `docs/io-contract.md`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/specs/observe.md`, `docs/specs/distribution.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md`, `CHANGELOG.md` |

## Bước

1. Test doctor (pass với binary thật; fail `host-missing` khi không có binary).
2. Đăng ký check.
3. Viết spec, sửa docs, CHANGELOG.

## Test

`node --test` file test doctor đã chạm; kiểm link trong docs đã sửa.

## Rủi ro / rollback

Thấp. Doctor check gọi facade, nên dùng chung cách tìm binary; không có luật thứ hai.
