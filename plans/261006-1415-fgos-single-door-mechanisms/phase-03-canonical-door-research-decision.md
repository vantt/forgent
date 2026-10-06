# Phase 03 — Canonical door: research + decision D1

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md) "Phát hiện" #3; synthesis V1 / H1c, §8 mục 5 ("cách bật kích hoạt kiểu phát triển ... chưa kiểm"); cases M23, M30, M42; S32
- Quyết định của anh (không mở lại): **Rust `fgos` là cửa chuẩn**; `node bin/fgos.mjs` là kênh tương thích. **D1 đã chốt B** (2026-10-06): dùng dev door có sẵn, đặt tên bằng npm script `fgos:dev` (việc thuộc Phase 04). Phase này vẫn làm research Q1-Q3 để có bằng chứng; kết quả không đổi quyết định, chỉ báo anh nếu Q1 tìm ra cơ chế có sẵn làm C rẻ hơn.
- Đọc: `docs/specs/distribution.md` (Entry Points, "Dev checkout shell helpers", Edge Cases :285-288, :300-310), `docs/distribution-vision.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (:22-34 ba ngữ cảnh, :102-115 `fgctl upgrade|stage`), `docs/how-to/measure-a-real-case.md` §5 (quy trình stage lại), `AGENTS.md:68-70` (Legacy-Node CLI Ownership Boundary)
- Code: `scripts/fgos-shell-integration.sh` (tier 0 `.fgos/installation/bin/fgos` thắng tier 1 `bin/fgos.mjs`), `.fgos/installation/bin/fgos` (shim do `fgctl` viết, exec `releasePath/bin/fgos`), `apps/fgos/src/legacy_exec.rs:69` `resolve_payload_path` (ưu tiên `FGOS_ACTIVE_RELEASE_PATH`/`FGOS_ACTIVE_MANIFEST_PATH`, rồi dò `target/dev-manifest.json` cạnh binary), `scripts/run-rust-dev-host.mjs` (build debug, ghi `target/dev-manifest.json` với `legacyNode.root: "."`, exec với hai env), `scripts/build-rust-distribution.mjs`, `apps/fgctl/src/main.rs` (verb: `stage|status|init|upgrade|repair|verify`), `packages/distribution/rust/src/init.rs`, `store.rs`, `verify.rs`
- Trạng thái máy (2026-10-06, đọc, không đổi): `.fgos/installation/activation.json` → `artifactDigest sha256:a1ba…`, `pinSnapshot.policy exact-digest`, `activatedAt 2026-10-04T08:31:40Z`; 8 release trong `~/.local/state/fgos/releases/`; manifest release có `components.legacyNode {root: "libexec/legacy-node", entry: "bin/fgos.mjs", digest}` và `files[]` 614 mục có digest, **không** có commit nguồn.

## Requirements

1. Trả lời bằng bằng chứng (file:line hoặc lệnh read-only), ba câu:
   - Q1: `fgctl` có cách nào kích hoạt một workspace trỏ payload Node vào chính repo (dev activation, `legacyNode.root` = checkout) không? (UNPROVEN; chưa thấy trong `main.rs`.)
   - Q2: `scripts/run-rust-dev-host.mjs` có chạy đúng mọi verb `legacy-cli` với code working tree không, chi phí mỗi lần gọi (cargo build debug incremental) bao nhiêu?
   - Q3: quy trình stage lại (§5 measure-a-real-case) tốn bao lâu và để lại gì (release mới trong store, `previousArtifactDigest`)?
2. Một ghi chú research và một quyết định D1 do anh chốt; kết quả D1 là đầu vào cho message của check Phase 04 và rule ở Phase 06.
3. Không chạy lệnh đổi trạng thái (`fgctl init|upgrade|repair|stage`, `fgos setup`, `doctor --fix`) **trong lúc research**. Q2/Q3 chỉ đo nếu anh cho phép ở D1-pre (xem bước 4); nếu không, trả lời bằng đọc code và ghi "chưa đo".

## Files

- Create (lúc thực thi): `plans/261006-1415-fgos-single-door-mechanisms/reports/phase-03-canonical-door-research.md`
- Modify/delete: không có trong phase này.

## Steps

1. Q1: đọc `init.rs` (`init_workspace`, `upgrade_workspace`, nơi ghi `release_path` :1065), `store.rs`, `verify.rs`, `docs/specs/distribution.md`. Tìm prior art: `git log -S'dev-manifest'`, `git log -S'root: "."'`, `git log -S'devActivation'`, `git log -S'dev activation'` (hôm nay: `dev-manifest` có từ `37321ec5a`/`c831811fa`, hai từ sau không có hit đáng kể; `6733de7cf` "reconcile packaging and workspace architecture" cần đọc). Kết luận: có / không có / có một phần.
2. Q2: đọc `run-rust-dev-host.mjs` + `legacy_exec.rs`. Ghi rõ: dev host không đi qua shim workspace, nên shell function `fgos` vẫn chạy release đã kích hoạt.
3. Q3: đọc §5 measure-a-real-case + `build-rust-distribution.mjs`.
4. **D1-pre (gate nhỏ):** nếu cần số đo thật cho Q2/Q3, xin anh cho chạy `node scripts/run-rust-dev-host.mjs version` (ghi `target/`) và/hoặc một vòng stage+upgrade; không thì bỏ qua.
5. Viết ghi chú research, kết thúc bằng D1:
   - **A — Stage lại sau mỗi thay đổi** (`cargo build --release` → `build-rust-distribution.mjs --out <tmp>` → `fgctl stage` + `fgctl upgrade`). Đúng nghĩa "một cửa", không thêm cơ chế; chậm, mỗi lần thêm một release vào store.
   - **B — Gọi tên dev door có sẵn** (`scripts/run-rust-dev-host.mjs`, thêm một npm script, ví dụ `fgos:dev`): Rust host + payload working tree; không đổi `fgctl`/shim. `fgos` trơn vẫn là release đã kích hoạt; check Phase 04 báo khi hai thứ lệch.
   - **C — Dev activation trong `fgctl`** (workspace trỏ payload vào checkout): `fgos` trơn luôn thấy code mới; là năng lực distribution mới → spec trước (gate `AGENTS.md` Install/setup/doctor), lớn hơn phạm vi plan này, thành work item riêng.
   - **Khuyến nghị của em: B**, kèm A cho lúc cần `fgos` trơn mới. Lý do: dùng lại thứ đã có (prior art), không mở năng lực distribution mới cho một nhu cầu chỉ có ở repo tự-host (mission #3, `AGENTS.md:27-33`), và check Phase 04 làm lệch thấy được thay vì im lặng. Nếu Q1 tìm ra cơ chế có sẵn thì C đổi thành "gọi tên cơ chế đó" và em đổi khuyến nghị.
6. D1 đã chốt B và đã ghi ở `plan.md` (bảng Gates). Ghi lại trong research note bằng chứng ủng hộ hoặc chống B; không tự đổi quyết định.

## Tests / validation

- Ghi chú research có câu trả lời cho Q1-Q3, mỗi câu có file:line hoặc lệnh; D1 có lựa chọn của anh.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Lỡ chạy lệnh ghi trạng thái khi research | Low×Med | Bước 4 là gate riêng |
| Kết luận Q1 sai vì đọc thiếu crate | Med×Med | Đọc cả `init.rs`, `store.rs`, `verify.rs`, `lib.rs`; ghi rõ phạm vi đã đọc |

## Rollback

Không có thay đổi; bỏ ghi chú research nếu D1 đổi hướng.

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Thu nhỏ còn 0,5 giờ, chỉ đọc.** D1 đã chốt B, và câu Q1 (fgctl có dev activation không) thuộc `plans/261006-1445-fgctl-dev-activation/phase-00-research-and-spec.md`, không lặp ở đây.
- **Bỏ D1-pre** ("một vòng stage+upgrade"): nó đổi trạng thái kích hoạt thật (`activation.json`, chính sách `exact-digest`) dưới các phiên song song, mà phase này không có sản phẩm nào cần nó.
- Giữ duy nhất việc Phase 04 cần: đọc `scripts/run-rust-dev-host.mjs` để biết (a) cú pháp truyền đối số, (b) cwd của tiến trình con (đã xác nhận: `cwd: process.cwd()`, dòng 94), (c) vị trí `target/dev-manifest.json` và chuyện `target/` được các worktree dùng chung (symlink, đã xác nhận). Kết quả nằm trong Phase 04 bước 1.
