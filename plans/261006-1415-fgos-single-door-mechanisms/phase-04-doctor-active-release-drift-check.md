# Phase 04 — Doctor check: active release vs checkout, và lệnh dev `fgos:dev`

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md); [phase-03](phase-03-canonical-door-research-decision.md) (D1 quyết message gợi ý cách sửa); synthesis V1 / H1c(iii); case M42 (`'fgos' shell function ran a stale staged release; agent saw old behaviour after committing`)
- `AGENTS.md:72-90` Install/setup/doctor gate; `docs/specs/distribution.md` Data Dictionary #7 (:70, "a module adding one updates this row in the same change"), "Doctor" (:181-197), RUL9 (doctor không ghi gì)
- Code tái dùng: `resolveActiveReleaseForDoctor` (`src/setup/registrations.mjs:4509`; thứ tự: env `FGOS_ACTIVE_RELEASE_PATH` → `.fgos/installation/activation.json` → `manifest.json` → `target/dev-manifest.json` → marker `apps/fgos/Cargo.toml`), các check cùng nhóm `rust-host-binary-present`/`legacy-node-payload-present`/`command-routes-drift` (:4581-4758), `registerCheck` (:126), `hashFile` (`scripts/build-rust-distribution.mjs:41`), danh sách file payload trong `buildRustDistribution` (:265-296, `collectSourceFiles` :82 chưa export). Tiền lệ `src/` import từ `scripts/`: `src/runner/dispatch.mjs:95`, `src/state/retrospective-doors.mjs:23`. `scripts/` nằm trong `package.json` `files`, nên có mặt trong release.
- Tests: `test/setup/checks.test.mjs` (danh sách id cố định, :60-160), `test/rust-host/release-tree.test.mjs`
- How-to: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` bảng check (:180-189)

## Requirements

1. Check mới id `active-release-matches-checkout`: khi cwd là source checkout fgOS (marker `apps/fgos/Cargo.toml`, cùng quy tắc :4573) **và** có release đang kích hoạt với manifest:
   - So **nội dung** payload Node mà một lần build release sẽ stage từ working tree (tập file theo `package.json` `files` + `package.json`, không gồm `node_modules`) với `files[]` của manifest dưới tiền tố `components.legacyNode.root`: đếm file khác digest, file thiếu ở release, file thừa ở release. Khác ≥ 1 → `passed: false`, message nêu số đếm, tối đa 5 path ví dụ, `artifactDigest` + `activatedAt`, và cách sửa theo D1.
   - Nếu có `target/release/fgos`: so `hashFile` với digest `bin/fgos` trong manifest; lệch → nêu trong message như tín hiệu phụ (binary local khác release; không chứng minh Rust source khác HEAD — giới hạn ghi rõ).
2. Pass-skip (passed: true, message nói lý do) khi: không phải source checkout (project ngoài, D-ADR0035), không có release kích hoạt, hoặc release là dev manifest có `legacyNode.root` trỏ vào chính checkout.
3. Read-only tuyệt đối (RUL9); không có fix (không `registerFix`): sửa là việc của người/agent theo D1.
4. So với working tree, không với HEAD: quyết định của em vì M42 xảy ra ngay sau khi sửa code; working tree bắt cả thay đổi chưa commit. Ghi lý do này vào spec row.
5. DRY: tách danh sách file payload ra một hàm export trong `scripts/build-rust-distribution.mjs` (ví dụ `listLegacyNodeSourceFiles(repoRoot)`), `buildRustDistribution` dùng chính hàm đó; check import hàm này và `hashFile`. Không cài lại logic chọn file.
6. **Lệnh dev (D1 = B, anh giao cho phase này):** thêm npm script `"fgos:dev": "node scripts/run-rust-dev-host.mjs"` vào `package.json` (cạnh `setup:hooks`, `build:skills`), để chạy host Rust (build debug tăng dần) với payload Node là working tree: `npm run fgos:dev -- <verb> [args]`. Tên và cú pháp truyền đối số phải được xác nhận bằng đọc `scripts/run-rust-dev-host.mjs` (nó nhận argv thế nào; UNPROVEN cho tới khi đọc). Message của check ở yêu cầu #1 nêu đúng lệnh này làm cách sửa, và nêu thêm cách stage lại (A) cho lúc cần `fgos` trơn mới. Cái bị thay thế: không có (lệnh chưa từng có tên); `scripts/run-rust-dev-host.mjs` giữ nguyên.

## Files

- Modify: `package.json` (thêm script `fgos:dev`), `scripts/build-rust-distribution.mjs` (export hàm liệt kê payload; `buildRustDistribution` gọi nó), `src/setup/registrations.mjs` (hàm check + `registerCheck`, đặt cạnh nhóm rust-host), `test/setup/checks.test.mjs` (thêm id), `docs/specs/distribution.md` (row #7), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (một dòng bảng), `CHANGELOG.md`
- Create: `test/setup/active-release-drift-check.test.mjs`
- Delete/merge: logic chọn file payload chỉ còn một chỗ (hàm export); không có file xoá

## Steps

1. **Impact analysis**: `impact({target:"buildRustDistribution", direction:"upstream"})`, `impact({target:"resolveActiveReleaseForDoctor", direction:"upstream"})` (chỉ dùng lại, không sửa — vẫn chạy để biết nếu buộc phải sửa). Cross-check: `rtk proxy grep -rn "buildRustDistribution\|resolveActiveReleaseForDoctor" src scripts test bin` (callers biết hôm nay: `scripts/run-rust-dev-host.mjs` import `computeArtifactDigest, hashFile`; `test/rust-host/release-tree.test.mjs`; CLI main cuối file). `registrations.mjs` có thể bị index thiếu → không tin "0 caller" nếu chưa grep.
2. **Test đỏ trước** (`test/setup/active-release-drift-check.test.mjs`, kèm một assert rằng `package.json` có script `fgos:dev` trỏ tới `scripts/run-rust-dev-host.mjs` và message của check nhắc đúng tên script đó), dựng fixture tạm: repo giả có `apps/fgos/Cargo.toml`, `package.json` với `files: ["bin","src"]`, vài file; release giả với `manifest.json` (`components.legacyNode.root: "libexec/legacy-node"`, `files[]` digest khớp) và `.fgos/installation/activation.json` trỏ vào nó. Case: (a) khớp → pass; (b) sửa một file trong repo → fail, message có số đếm 1 và path; (c) thêm file mới trong `src/` → fail "missing in release"; (d) không có marker → pass-skip; (e) env `FGOS_ACTIVE_RELEASE_PATH` = checkout với dev manifest root "." → pass-skip. Chạy với `env -u CLAUDE_CODE_SESSION_ID -u FGOS_ACTIVE_RELEASE_PATH -u FGOS_ACTIVE_MANIFEST_PATH` cho các case không dùng env.
3. Tách hàm liệt kê payload; chạy `test/rust-host/release-tree.test.mjs` để chứng minh build không đổi hành vi.
4. Cài check + `registerCheck`; thêm id vào `test/setup/checks.test.mjs`.
5. Docs: how-to có một dòng nói `npm run fgos:dev -- <verb>` để chạy với code đang sửa; row #7 (tên check + mô tả một câu + "so working tree, không so HEAD"), dòng bảng how-to (Check / Means / Fails with / Who / Fix theo D1). CHANGELOG "Added".
6. Chạy thật read-only: `node bin/fgos.mjs doctor` trong repo này → kỳ vọng hôm nay **fail** (release kích hoạt 2026-10-04, repo đã có commit sau đó, vd `6f043ee9d`), message có số đếm > 0. Ghi lại output làm bằng chứng.
7. Đối chiếu `docs/platform/component-boundary.md` → ghi "No component-boundary change" vào commit/PR note.
8. Commit ngay khi xanh.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/setup/active-release-drift-check.test.mjs` (đỏ → xanh).
2. Lân cận: `node --test test/setup/checks.test.mjs test/rust-host/release-tree.test.mjs test/setup/checks-setup-envelope.test.mjs test/setup/checks-setup-idempotent.test.mjs`.
3. Rộng: `npm test`.
4. Thời gian check trên repo thật < 2 s (hash ~600 file); nếu chậm hơn, ghi số đo.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Check đỏ thường trực trong repo vì release luôn cũ → bị lờ đi | Med×Med | Message nêu đúng một lệnh sửa theo D1; doctor exit vẫn 0 (chỉ `--strict` mới exit 1) |
| `fgctl init/upgrade` chạy doctor làm tail: ngay sau upgrade payload khớp → pass, không làm install "degraded" | Low×Med | Case (a) trong test; kiểm thêm bằng đọc `init.rs` tail |
| Import `scripts/` từ `src/` kéo side effect CLI | Low×Med | Script có guard main (`build-rust-distribution.mjs:426`) |
| Danh sách file payload lệch giữa build và check | Low×High | Một hàm chung (Requirement #5) |

## Rollback

`git revert <commit>`; không có dữ liệu/trạng thái cần dọn (check read-only).

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **`node_modules` (Critical, đã xác nhận):** từ `dbaf4ce0f` (2026-10-04) bản build đóng gói phụ thuộc sản xuất vào `libexec/legacy-node/node_modules/**` và `files[]` gồm chúng; hai release dựng sau đó có 233 mục như vậy, release đang kích hoạt có 0. Check phải **loại `<legacyNode.root>/node_modules/**` khỏi tập "file thừa ở release"** (và shim `bin/*` nếu có), và fixture phải có một thư mục phụ thuộc đã stage; kèm một assert "ngay sau `buildRustDistribution` của cùng cây thì check qua".
- **Bỏ tín hiệu băm `target/release/fgos`** (Requirement #1 bullet 2): không ai yêu cầu, tự plan thừa nhận nó không chứng minh gì. Việc Rust host cũ không được check này phát hiện là giới hạn cần ghi rõ: check chỉ phủ payload Node; verb Rust mới thiếu ở host cũ lộ ra qua đường "unknown verb" của Plan B. Plan B phải sửa phụ thuộc của nó cho khớp.
- **Cây được so sánh:** chỉ là `dir` của doctor, không bao giờ `process.cwd()` hay gốc main checkout (`src/setup/registrations.mjs:4510-4511` tìm activation ở cả ba chỗ). Ở worktree liên kết, check pass-skip với thông báo nói activation thuộc main checkout. Thêm fixture (f): worktree của repo có marker mà activation chỉ nằm ở main; và chạy test fixture với `cwd` đặt vào fixture.
- **Bọc thân check** để mọi lỗi ném ra (symlink, đường dẫn thoát checkout, entry thiếu trong bộ liệt kê `collectSourceFiles`) thành `passed: false` kèm thông báo, không làm sập cả `fgos doctor` (`bin/fgos.mjs:3950-3952` không bắt lỗi từng check). Thêm fixture symlink.
- **`fgos:dev` (bước 6):** `npm run` đặt cwd về gốc package và script truyền `process.cwd()` cho tiến trình con, nên mọi verb chạy trên `.fgos/` của repo fgOS dù gọi từ đâu. Script dùng `process.env.INIT_CWD ?? process.cwd()` cho cwd của tiến trình con, và test từ một thư mục con. Các worktree symlink chung `target/`, nên `dev-manifest.json` và `target/debug/fgos` là toàn cục: hai phiên `fgos:dev` ở hai worktree phá nhau. Script tôn trọng `CARGO_TARGET_DIR` nếu được đặt và how-to ghi ràng buộc "một lần `fgos:dev` tại một thời điểm giữa các worktree dùng chung `target/`".
- **Danh sách nơi dùng đầy đủ:** `build-rust-distribution.mjs` có 7 nơi: `test/rust-host/release-tree.test.mjs`, `fgctl-init.test.mjs`, `fgctl-upgrade.test.mjs`, `fgctl-stage.test.mjs`, `scripts/run-rust-dev-host.mjs`, `.github/workflows/ci.yml:317`, `.github/workflows/release.yml:47`. Kiểm hẹp ở bước 3 chạy cả ba test `fgctl-*` và `test/setup/registrations.test.mjs:258-262` (hàng #7 phải khớp danh sách check). Thêm `test/setup/checks.test.mjs` và bảng how-to như đã có.
- **Bước và tiêu chí thêm:** sau khi phase này hạ cánh: stage lại release rồi chạy `fgos doctor` qua shim, ghi kết quả mong đợi (qua) và bản chạy hôm nay (đỏ vì release cũ). Check chỉ có trong release dựng từ sau phase này.
