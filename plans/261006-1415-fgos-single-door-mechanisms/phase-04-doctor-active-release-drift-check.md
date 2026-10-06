---
title: "Doctor active release drift and development door"
status: done
dependencies: [2, 3]
requiresReview: true
---

# Phase 04 — Doctor check: active release vs checkout, và lệnh dev `fgos:dev`

> Historical revision note: Revision ready — pending; implementation not started or authorized in that planning assignment.

**Current execution evidence:** this phase's comparator/dev-door/native handoff acceptance is complete; see [behavioral tests](reports/phase-04-tests.md), [review closure](reports/phase-04-review-closure.md), [actual development/installed-shim proof](reports/phase-04-live.md), and [full-plan sync](reports/final-plan-sync.md). “Future”/“NOT RUN in current plan revision” below is preserved historical planning wording, superseded by those dated observations, not a present implementation claim. Main activation remains untouched; matching Node freshness does not certify Rust freshness or all doctor readiness.

Dependencies: Phase 02 coherent config-cleaned render + native restage/shim handoff, and Phase 03 completed research. No advisory source migration, early runtime gate or installed advisory product proof is required. Shared build/stage artifacts and shared spec/changelog edits serialize with the separate advisory plan by explicit writer baton, not whole-plan blocking.

## Context links

- [plan.md](plan.md); [phase-03](phase-03-canonical-door-research-decision.md) (D1 quyết message gợi ý cách sửa); synthesis V1 / H1c(iii); case M42 (`'fgos' shell function ran a stale staged release; agent saw old behaviour after committing`)
- `AGENTS.md:72-90` Install/setup/doctor gate; `docs/specs/distribution.md` Data Dictionary #7 (:70, "a module adding one updates this row in the same change"), "Doctor" (:181-197), RUL9 (doctor không ghi gì)
- Code tái dùng: `resolveActiveReleaseForDoctor` (`src/setup/registrations.mjs:4509`; thứ tự: env `FGOS_ACTIVE_RELEASE_PATH` → `.fgos/installation/activation.json` → `manifest.json` → `target/dev-manifest.json` → marker `apps/fgos/Cargo.toml`), các check cùng nhóm `rust-host-binary-present`/`legacy-node-payload-present`/`command-routes-drift` (:4581-4758), `registerCheck` (:126), `hashFile` (`scripts/build-rust-distribution.mjs:41`), danh sách file payload trong `buildRustDistribution` (:265-296, `collectSourceFiles` :82 chưa export). Tiền lệ `src/` import từ `scripts/`: `src/runner/dispatch.mjs:95`, `src/state/retrospective-doors.mjs:23`. `scripts/` nằm trong `package.json` `files`, nên có mặt trong release.
- Tests: `test/setup/checks.test.mjs` (danh sách id cố định, :60-160), `test/rust-host/release-tree.test.mjs`
- How-to: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` bảng check (:180-189)

## Requirements

1. Check mới id `active-release-matches-checkout`: scope là **doctor `dir`**, không phải `process.cwd()`, HEAD hoặc gốc main checkout. Chỉ so source checkout có marker `apps/fgos/Cargo.toml` và activated release manifest thuộc workspace đó.
   - Dùng hàm builder chung lấy tập source payload theo `package.json.files` + `package.json`, không `node_modules`; normalize repo-relative paths và map vào `components.legacyNode.root`. Đọc `manifest.files[]` (không `manifest.entries`). Chỉ lấy entries dưới root payload, bỏ `<root>/node_modules/**` và packaging-generated shim entries nếu có; không loại nhầm source `bin/fgos.mjs`. Dùng boundary-aware prefix, không string-prefix chấp nhận root gần giống.
   - Với mỗi source entry, hash contents: có release entry khác digest → `changed`; không có release entry → `missing in release`. Với release payload source entries còn lại không có working-tree counterpart → `extra in release`. Khác tổng ≥1 → `passed:false`, message nêu ba số đếm, tối đa 5 example paths, artifactDigest/activatedAt và B để chạy working-tree code, A để cập nhật plain `fgos`.
   - Không băm `target/release/fgos`; check chỉ phủ **Node payload**. Nó không chứng minh Rust source/host mới; Rust verb mới trên host cũ có thể báo unknown verb. Plan B readiness dựa root-hook behavior test hiện diện + relevant docs changes commit landed, không dựa old wording-anchor test.
2. Pass-skip (`passed:true`, reason rõ) khi ngoài source checkout (D-ADR0035), không có activation, hoặc dev manifest root "." trỏ chính checkout. Linked worktree mà activation chỉ nằm main: pass-skip nói activation belongs to main; không so worktree với payload main. Tái dùng resolver nhưng kiểm ownership của resolved activation trước hashing.
3. Read-only tuyệt đối (RUL9); không có fix (không `registerFix`): sửa là việc của người/agent theo D1.
4. So với working tree, không với HEAD: quyết định của em vì M42 xảy ra ngay sau khi sửa code; working tree bắt cả thay đổi chưa commit. Ghi lý do này vào spec row.
5. DRY: tách danh sách file payload ra một hàm export trong `scripts/build-rust-distribution.mjs` (ví dụ `listLegacyNodeSourceFiles(repoRoot)`), `buildRustDistribution` dùng chính hàm đó; check import hàm này và `hashFile`. Không cài lại logic chọn file.
6. **Dev command D1=B:** thêm `"fgos:dev": "node scripts/run-rust-dev-host.mjs"` cạnh `setup:hooks`/`build:skills`. Existing `process.argv.slice(2)` supports `npm run fgos:dev -- <verb> [args]` (Phase 03 source evidence, chưa runtime proof). **Sửa script**: runtime child cwd là `process.env.INIT_CWD ?? process.cwd()`; Cargo cwd vẫn checkout chứa script. Tôn trọng `CARGO_TARGET_DIR` end-to-end (Cargo build output, binary chọn để chạy/hash, manifest location/content), không chỉ truyền env cho Cargo.
7. **Artifact confinement prerequisite:** lựa chọn concrete layout cho relative/absolute external Cargo targets trước code. Existing verifier từ chối symlink segments và manifest paths thoát release root; giữ nguyên contract đó. Custom build output có thể cần materialize native binary vào confined local runtime root có manifest paths hợp lệ; không ghi path thoát root, không dùng stale default binary, không weaken verify. Nếu layout tương thích chưa chốt, báo thiếu prerequisite và giữ acceptance chưa qua, không âm thầm bỏ support. Đây là implementation design chưa được chứng minh, không code hiện có.
8. **Error contract:** bọc toàn thân check; lỗi đọc/hash/manifest, symlink, containment escape hoặc required listed source entry thiếu trả `passed:false` với actionable message, không throw làm sập doctor. Không fix/registerFix, không mutation/cache/state store. Ignore dependency entries chỉ khỏi comparison, không nới an toàn source traversal.
9. Shared-target concurrency chỉ áp dụng nơi target thực sự shared: how-to yêu cầu một `fgos:dev` invocation tại một thời điểm giữa worktree đó. Report Phase 03 hiện thấy worktree này không có target, main target là directory; lịch sử shared symlink không được trình bày thành trạng thái hiện tại.

## Files

- Modify: `package.json` (npm `fgos:dev`), `scripts/run-rust-dev-host.mjs` (INIT_CWD, target/runtime artifact layout), `scripts/build-rust-distribution.mjs` (shared payload enumeration export), `src/setup/registrations.mjs` (check + registerCheck beside rust-host group), `test/setup/checks.test.mjs`, `test/setup/registrations.test.mjs` (row #7 registry behavior), `docs/specs/distribution.md` (row #7), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `CHANGELOG.md`
- Create: `test/setup/active-release-drift-check.test.mjs`
- Delete/merge: logic chọn file payload chỉ còn một chỗ (hàm export); không có file xoá

## Steps

1. **Impact analysis**: `impact({target:"buildRustDistribution", direction:"upstream"})`, `impact({target:"resolveActiveReleaseForDoctor", direction:"upstream"})` (chỉ dùng lại, không sửa — vẫn chạy để biết nếu buộc phải sửa). Cross-check: `rtk proxy grep -rn "buildRustDistribution\|resolveActiveReleaseForDoctor" src scripts test bin` (callers biết hôm nay: `scripts/run-rust-dev-host.mjs` import `computeArtifactDigest, hashFile`; `test/rust-host/release-tree.test.mjs`; CLI main cuối file). `registrations.mjs` có thể bị index thiếu → không tin "0 caller" nếu chưa grep.
2. **Behavior fixtures before code** in `test/setup/active-release-drift-check.test.mjs`: fake source marker + `files:["bin","src"]`, fake activated manifest with payload digests. (a) equal→pass; (b) edit→changed count/path; (c) add→missing count; (d) remove→extra count; (e) no marker/no activation→reasoned skip; (f) dev manifest root "." pointing checkout→skip; (g) linked worktree marker, activation only main→ownership skip; (h) staged production `node_modules` and generated shim entries do not create false extras; (i) symlink/escape/unreadable/missing enumerated source→failed check, doctor continues; (j) immediately after real `buildRustDistribution` of same tree→pass. Put process cwd in fixture and independently pass doctor's dir to prove no main/cwd leakage. Clear CLAUDE_CODE_SESSION_ID/FGOS_ACTIVE_RELEASE_PATH/FGOS_ACTIVE_MANIFEST_PATH except intentional env fixture. Test status/message facts, not exact wording/source text.
3. Extract shared enumerator and update builder; preserve seven consumers: `test/rust-host/release-tree.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/fgctl-stage.test.mjs`, `scripts/run-rust-dev-host.mjs`, `.github/workflows/ci.yml:317`, `.github/workflows/release.yml:47`. Test actual packaging→doctor agreement including dependency payload, not mocked echo.
4. Cài check + `registerCheck`; thêm id vào `test/setup/checks.test.mjs`.
5. Implement dev-host cwd/target layout and npm name. Add consumer behavior coverage invoking from subdirectory (runtime resolves that workspace while payload stays script checkout), default/relative/absolute custom Cargo targets, fresh chosen binary rather than stale default, and existing symlink refusal. A test may inspect resulting manifest/runtime outcomes, not assert source forwarding text or package-script prose alone. Docs: distribution row #7 (Node payload versus working tree, no HEAD/Rust guarantee), how-to Check/Means/Fails/Who/Fix table, `npm run fgos:dev -- <verb> [args]`, serialized shared-target use, B versus A distinction; changelog Added. No component-boundary change unless concrete layout requires one; stop/replan rather than hide that expansion.
6. Future authorized live check: capture Node doctor against stale activated release before restage (expected drift if contents differ, not assumed from commit dates), then after this phase lands **restage** using existing A route and run `fgos doctor` **through installation shim**. Record activated digest, invocation route, check presence and pass for matching tree. Old shim before restage cannot prove new check works. Source/development check failure is not whole doctor process failure (normal exit 0; `--strict` exit1).
7. Đối chiếu `docs/platform/component-boundary.md`; chỉ ghi “No component-boundary change” nếu concrete layout thực sự giữ boundary. Nếu không, stop/replan theo prerequisite, không khẳng định trước.
8. Commit only during authorized implementation after behavior acceptance and report evidence complete; no commit/stage/build/test in this plan-revision assignment.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID`.
1. Hẹp: `node --test test/setup/active-release-drift-check.test.mjs` (đỏ → xanh).
2. Lân cận: `node --test test/setup/checks.test.mjs test/setup/registrations.test.mjs test/rust-host/release-tree.test.mjs test/rust-host/fgctl-init.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/rust-host/fgctl-stage.test.mjs test/setup/checks-setup-envelope.test.mjs test/setup/checks-setup-idempotent.test.mjs`. Registry id and distribution row #7 inventory must agree; docs/source wording checks are temporary report, not permanent tests.
3. Development-command consumer coverage exercises subdirectory cwd and target layout with verifier intact; no permanent source-text, forwarding-only or mock-echo test.
4. Rộng: `npm test`.
5. Future measured doctor runtime <2s target (historical estimate ~600 files); record actual count/time and investigate if over, do not claim it measured now.
6. Acceptance requires changed/missing/extra behavior, exclusion of staged dependencies, main-worktree skip, unsafe-file failed-check not crash, matching builder pass and final restaged **shim** doctor pass. All are NOT RUN in current plan revision; Phase 00/03 reports supply baseline/source evidence only.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Check đỏ thường trực trong repo vì release luôn cũ → bị lờ đi | Med×Med | Message nêu đúng một lệnh sửa theo D1; doctor exit vẫn 0 (chỉ `--strict` mới exit 1) |
| `fgctl init/upgrade` chạy doctor làm tail: ngay sau upgrade payload khớp → pass, không làm install "degraded" | Low×Med | Case (a) trong test; kiểm thêm bằng đọc `init.rs` tail |
| Import `scripts/` từ `src/` kéo side effect CLI | Low×Med | Script có guard main (`build-rust-distribution.mjs:426`) |
| Danh sách file payload lệch giữa build và check | Low×High | Một hàm chung (Requirement #5) |

## Rollback

`git revert <commit>`; không có dữ liệu/trạng thái cần dọn (check read-only).

