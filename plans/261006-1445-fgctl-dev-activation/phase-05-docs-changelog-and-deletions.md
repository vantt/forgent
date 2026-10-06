# Phase 05 — Docs, CHANGELOG, xoá cửa tạm của Plan A

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); Phase 01-04
- Plan A: [phase-03](../261006-1415-fgos-single-door-mechanisms/phase-03-canonical-door-research-decision.md) (phương án B: `scripts/run-rust-dev-host.mjs` + npm script ví dụ `fgos:dev`), [phase-04](../261006-1415-fgos-single-door-mechanisms/phase-04-doctor-active-release-drift-check.md) (message check gợi ý cách sửa theo D1), [phase-06](../261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md) req 3 (đoạn cửa chuẩn trong `AGENTS.md` mục Legacy-Node CLI Ownership Boundary, câu "sửa `bin/`/`src/` chưa có hiệu lực qua `fgos` cho tới <cách theo D1>")
- `AGENTS.md` Install/setup/doctor gate: thay đổi người dùng thấy → dòng trong `CHANGELOG.md` `## [Unreleased]`
- Docs: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (:31 "third context … contributors only", :102-115 bảng lệnh `fgctl`), `docs/how-to/measure-a-real-case.md` §5 (:100), `docs/platform/packaging-distribution/spec.md` §3.3, §7

## Preconditions

- Plan A Phase 06 đã merge (`AGENTS.md` single-writer); Plan B (component `convention`) đã xong lượt sửa `AGENTS.md`. `git status --porcelain AGENTS.md CLAUDE.md` rỗng (thay đổi do tool sinh phải được anh commit/discard trước, như PC1 của Plan A).
- Đọc lại thực tế Plan A đã land gì: `git log --oneline -- package.json AGENTS.md scripts/run-rust-dev-host.mjs docs/how-to/` từ commit Plan A. Danh sách xoá dưới đây là **dự kiến**; chỉ xoá thứ thật sự đã land.

## Requirements — what gets deleted if this lands (phụ thuộc Plan A)

| Thứ bị xoá/thay | Do phase nào của Plan A đưa vào | Hành động |
|---|---|---|
| npm script cửa dev (ví dụ `fgos:dev` → `node scripts/run-rust-dev-host.mjs`) trong `package.json` | **Plan A Phase 04 thêm** (D1 = B, anh giao 2026-10-06); xác nhận lại tên script và vị trí bằng đọc `package.json` khi tới đây | Xoá script; nếu Plan A không thêm thì ghi "không có gì để xoá" |
| Quy ước "chạy `npm run fgos:dev` / `node scripts/run-rust-dev-host.mjs` để thấy code đang sửa" trong how-to/README | Plan A Phase 04 (how-to) và Phase 06 (`AGENTS.md`) | Thay bằng một câu: kích hoạt dev bằng lệnh `fgctl` của Phase 02, thoát bằng `fgctl repair` |
| Đoạn hai cửa trong `AGENTS.md` (Legacy-Node CLI Ownership Boundary): "`fgos` chạy release đã kích hoạt, là một bản sao … chưa có hiệu lực qua `fgos` cho tới <cách theo B>" | Plan A Phase 06 req 3 | Viết lại: trong checkout nguồn, kích hoạt dev thì `fgos` chạy payload Node của working tree; verb Rust cần build lại; `fgctl repair` thoát. Giữ câu "Rust `fgos` là cửa chuẩn" và câu kênh tương thích |
| Cụm từ anchor của rule cửa chuẩn trong `test/docs/agents-doctrine-anchors.test.mjs` (Plan A Phase 06 req 6) | Plan A Phase 06 | Đổi cụm từ anchor theo đoạn mới trong cùng commit |
| Wording "cách sửa" trong message của check `active-release-matches-checkout` | Plan A Phase 04 | Message nêu lệnh kích hoạt dev thay vì dev script; check giữ nguyên (vẫn hữu ích ở release mode) |
| `scripts/run-rust-dev-host.mjs` | có từ trước Plan A (`c831811fa`) | **Không xoá mặc định**: vẫn là đường build+chạy một lần không kích hoạt, và là fixture tiền lệ. Xoá chỉ khi Phase 00 chứng minh không còn caller (`rtk proxy grep -rn "run-rust-dev-host" .` loại `plans/`, `archive/`) và anh đồng ý |
| Mục "Dev checkout" tier 1 trong `docs/platform/packaging-distribution/spec.md` §3.3/§7 | không (có sẵn) | Bổ sung dev activation là cách self-host qua tier 0; tier 1 (`node bin/fgos.mjs`) giữ là kênh tương thích |

## Files

- Modify: `package.json` (nếu có script để xoá), `AGENTS.md` (chỉ phần viết tay, đoạn Legacy-Node CLI Ownership Boundary), `test/docs/agents-doctrine-anchors.test.mjs` (nếu tồn tại), `src/setup/registrations.mjs` (message), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `docs/how-to/measure-a-real-case.md` §5 (một câu trỏ, nếu §5 nói stage lại là cách duy nhất), `docs/platform/packaging-distribution/spec.md`, `CHANGELOG.md` (`## [Unreleased]` → Added: dev activation qua `fgctl`; Removed: npm script cửa dev nếu có)
- Create: không
- Delete: theo bảng trên

## Steps

1. Kiểm Preconditions; lập danh sách xoá thật bằng grep, ghi số đếm trước (`rtk proxy grep -rn "fgos:dev\|run-rust-dev-host" package.json AGENTS.md README.md docs/how-to | wc -l` — chạy thô qua `rtk proxy` để không bị nén).
2. Test đỏ trước: cập nhật anchor test sang cụm từ mới → đỏ.
3. Sửa `AGENTS.md` trong **một** commit cùng anchor test; không chạm khối do tool sinh (`<!-- gitnexus:start -->`, mdview, instruction projection).
4. Sửa docs, message, `package.json`, CHANGELOG.
5. Đếm lại: số chỗ nhắc cửa tạm = 0 (acceptance #7).
6. `detect_changes()` trước commit; đối chiếu `docs/platform/component-boundary.md`.
7. Commit ngay khi xanh. Báo Plan khác đang chờ `AGENTS.md` rằng file đã rảnh.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/docs/agents-doctrine-anchors.test.mjs test/docs/rul11-anchor-phrase.test.mjs`.
2. Test đọc `AGENTS.md` (danh sách Plan A Phase 06 :55) + `node --test test/setup/checks.test.mjs test/install-packaging.test.mjs` (nếu `package.json` đổi).
3. Rộng: `npm test` (acceptance #8).

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Xoá thứ Plan A chưa land hoặc đã đổi tên | Med×Low | Precondition: lập danh sách từ git log thật |
| Tool ghi lại `AGENTS.md` giữa chừng | Med×Med | Kiểm `git status` trước/sau; chỉ sửa ngoài khối marker |
| Mất đường chạy Rust host không kích hoạt nếu xoá dev script | Low×Med | Mặc định giữ script |

## Rollback

`git revert <commit>` trả lại npm script, đoạn `AGENTS.md` cũ và anchor cũ trong một lần.
