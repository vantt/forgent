# Phase 00 — Research + spec (không code)

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); Plan A [phase-03](../261006-1415-fgos-single-door-mechanisms/phase-03-canonical-door-research-decision.md) (D1, phương án C), [phase-04](../261006-1415-fgos-single-door-mechanisms/phase-04-doctor-active-release-drift-check.md) (check `active-release-matches-checkout`, req 2 đã pass-skip dev manifest), [phase-06](../261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md) (rule cửa chuẩn trong `AGENTS.md`)
- Synthesis [§7 H1(c), §8](../reports/harness-investigation-261006-synthesis.md)
- `AGENTS.md`: Legacy-Node CLI Ownership Boundary (:68), Install/setup/doctor gate (:72), Ranh giới sứ mệnh D-ADR0035 (:27), Before touching code + Prior art (:36-48)
- Docs: [docs/platform/packaging-distribution/spec.md](../../docs/platform/packaging-distribution/spec.md) §3.3, §4, §7; [contracts/activation-binding.md](../../docs/platform/packaging-distribution/contracts/activation-binding.md) (Frozen V1); [architecture/runtime-identity-and-activation.md](../../docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md); prior art [docs/architect/packaging-distribution/runtime-identity-and-activation.md](../../docs/architect/packaging-distribution/runtime-identity-and-activation.md) :73, :369, :895-920; [docs/architect/host-invocation-routing/legacy-cli-transition.md](../../docs/architect/host-invocation-routing/legacy-cli-transition.md) :46; [docs/specs/distribution.md](../../docs/specs/distribution.md) (legacy promoted source; :114-133 dev helper, :229 RUL5, :285-288 worktree edge case); [docs/distribution-vision.md](../../docs/distribution-vision.md) trụ cột 6 + §3 context thứ 3; [docs/how-to/install-fgos-in-a-project-and-use-doctor.md](../../docs/how-to/install-fgos-in-a-project-and-use-doctor.md) :22-34, :102-115; [docs/how-to/measure-a-real-case.md](../../docs/how-to/measure-a-real-case.md) §5 (:100)

## Prior art (đã kiểm 2026-10-06; Phase 00 xác nhận lại)

| Thứ | Có từ | Bị bỏ bởi | Cố ý? | Dùng lại |
|---|---|---|---|---|
| Thiết kế `dev:<rev>` / `activationKind: dev-source` / `distributable: false` | `6733de7cf` (2026-09-06), architect doc :895-920, "Settled for V1" :73 | Không có commit xoá; promote sang `docs/platform/...` bỏ sót; contract V1 frozen không có trường | UNPROVEN (không thấy lý do ghi lại) | Quy tắc: tường minh, không fallback PATH, báo identity `dev:*`, giữ authority/work-state/schema rules, không distributable |
| `entries.fgos: target/release/fgos`, `root: "."` cho dev | `4db6ee7e5`, legacy-cli-transition.md:46 | Không | — | Hình dạng manifest dev |
| `target/dev-manifest.json` + env `FGOS_ACTIVE_RELEASE_PATH`/`FGOS_ACTIVE_MANIFEST_PATH` | `37321ec5a`, `c831811fa` (P07 CLI adapter) | Còn sống: `scripts/run-rust-dev-host.mjs:28-100`, `apps/fgos/src/legacy_exec.rs:69-154` | — | Đường resolve payload; fixture `apps/fgos/tests/cli_tests.rs:44` `valid_dev_manifest`, :86 `ensure_dev_manifest` |
| Nhãn `host: "dev-source"` | `8e6961c26` (P12) | Còn sống: `packages/distribution/rust/src/lib.rs:91-106` | — | Chỉ là nhãn khi **không** có activation, không phải kiểu kích hoạt |
| Ledger HI-I027 | `docs/platform/host-invocation-routing/intent-preservation-ledger.md:81` | — | — | Kiểm lại claim "`dev:<rev>` and staged release use same mechanism" (`implemented preview`): đúng một phần (cả hai đi qua cùng cơ chế phân giải manifest ở `legacy_exec.rs`), sai ở chỗ `fgctl` không có kích hoạt dev; sửa claim cho đúng phạm vi |

`git log -S'devActivation'` = 0 commit. `-S'dev activation'`, `-S'activationKind'` = chỉ `6733de7cf`. `-S'root: "."'` = `4db6ee7e5`, `19b5fbb35`, `e1307d33f` (docs/trace). Code: 0 hit cho `activationKind|dev activation|dev:<rev>` trong `src scripts apps packages test bin`.

## Requirements — câu hỏi research/spec (tất cả UNPROVEN)

Mỗi câu trả lời phải có `file:line` hoặc lệnh read-only; ghi "chưa đo" nếu không đo được.

- **Q1 — `fgctl`/crate distribution đã hỗ trợ dạng dev activation nào chưa?** Giả thuyết hiện tại: **không**. `apps/fgctl/src/main.rs:10` chỉ có `stage|status|init|upgrade|repair|verify`, không flag dev; `WorkspaceActivationBinding` (`packages/distribution/rust/src/init.rs:130-148`) không có trường kiểu; `publish_and_tail` (`init.rs:991-1140`) luôn ghi `release_path = candidate_dir` trong store. Kiểm nốt: `extract.rs`, `canonical.rs`, `lock.rs`, `workspace.rs`, `store.rs`, `verify.rs`, `lib.rs:220-300`, `apps/fgctl/tests` (nếu có). Kết luận: có / không / một phần.
- **Q2 — Phạm vi: chỉ payload Node hay cả binary Rust?** Ràng buộc đã thấy: shim exec `$release_path/bin/fgos` (`init.rs:24-41`, `SHIM_FGOS_ENTRY` :485); checkout không có `bin/fgos` (`bin/` chỉ có `fgos.mjs`, `fgos-runner.mjs`), và `package.json` `files` chứa `bin` nên đặt binary vào `bin/` sẽ lọt vào npm pack. `verify_legacy_node` (`verify.rs:189-279`) cấm `..` và buộc payload nằm dưới release root → `releasePath` phải là checkout. Trả lời: binary nào (`target/debug/fgos` hay `target/release/fgos`), shim tìm nó thế nào (đọc `entries.fgos` từ manifest dev? trường mới trong activation?), khi binary thiếu/cũ thì sao (đề xuất: exit 3, message nêu `cargo build`; không tự build).
- **Q3 — Tương tác với `exact-digest`, `previousArtifactDigest`, `fgctl verify`, `fgctl repair`, `fgctl upgrade`.** Đã thấy:
  - `resolve_payload_path` (`legacy_exec.rs:141-151`) chạy `recompute_artifact_digest` + `verify_release_files` + `verify_legacy_node` **mỗi lần gọi** verb legacy; `artifactDigest` của manifest phải là `sha256:` tính lại (`verify.rs:82-112`) và `legacyNode.digest` của `bin/fgos.mjs` được so mỗi lần → tree sống hỏng ngay khi sửa `bin/fgos.mjs`, trừ khi dev bỏ băm (DP3) hoặc sinh lại manifest mỗi lần (chi phí: đo).
  - `verify_workspace` (`init.rs:1487-1579`) và `repair_workspace` (`init.rs:1336-1484`) tìm release bằng `release_dir_path(store_root, artifact_digest)`, **bỏ qua** `releasePath` → với digest `dev:*` sẽ báo "release directory does not exist" rồi ghi `status: "quarantined"` → shim exit 3. Phải rẽ nhánh theo kiểu kích hoạt; tuyệt đối không bao giờ rename đường dẫn checkout.
  - `publish_and_tail` (`init.rs:1079-1094`) ghi `.fgos/distribution.json` khi `update_pin` hoặc file vắng; file này được git track ở repo này (`git ls-files .fgos/distribution.json`) → dev activation **không** được ghi pin.
  - `previousArtifactDigest`: đề xuất khi vào dev, `previous` = digest `sha256:` của release đang kích hoạt; `repair` từ dev = thoát dev; `upgrade` từ dev không bao giờ ghi `previous = dev:*` (repair về `dev:*` không có thư mục store). Kiểm `upgrade_workspace` (`init.rs:1193-1335`, nhánh quarantined :1316).
  - `run_tail` (`init.rs:632-683`) chạy `fgos init`, `doctor --fix`, `doctor` qua shim → trong dev mode tail chạy code của checkout; xác định tail có bắt buộc cho dev activation không.
  - Ghi rõ bảo đảm nào mất: tái lập theo digest, `fgctl verify` (không có gì để so), rollback chỉ còn 1 bước về release trước.
- **Q4 — Guard và biện minh mission.** Ai được bật: (a) chỉ checkout nguồn fgOS — marker `apps/fgos/Cargo.toml` (cùng quy tắc `src/setup/registrations.mjs:4573`) cộng `package.json` `name == "forgent"` (`docs/specs/distribution.md` Data Dictionary #1); (b) mở cho tác giả extension Node (cần định nghĩa "payload Node của họ" là gì — hôm nay payload là cả gói `package.json` `files`, không phải extension). Biện minh trung thực: phục vụ mission #3 (dogfood, D-ADR0035), lợi ích cho mission #1/#2 chỉ có khi (b) có người dùng thật; cái giá là mất tái lập/rollback theo digest trên workspace đó. Guard phải fail-closed: không marker → exit ≠ 0, không ghi gì.
- **Q5 — Doctor hiển thị dev mode thế nào.** Trường nào trong `activation.json` (đề xuất `activationKind`), message doctor (một dòng: đang dev, checkout nào, release sẽ quay về khi `fgctl repair`), check mới hay mở rộng check có sẵn (`rust-host-binary-present`, `legacy-node-payload-present` quanh `registrations.mjs:4581-4758`). Quan hệ với `active-release-matches-checkout` (Plan A Phase 04): pass-skip khi dev (Plan A req 2 đã có nhánh dev manifest qua env; cần thêm nhánh đọc `activationKind`). `resolveActiveReleaseForDoctor` (`registrations.mjs:4509-4579`) đọc `releasePath/manifest.json` → với dev phải biết đọc manifest dev.
- **Q6 — Shim.** Shim hiện tại chỉ đọc `status` và `releasePath` bằng `sed` (`init.rs:24-41`; bản cài ở `.fgos/installation/bin/fgos`), exec `$release_path/bin/fgos` không set env. Phương án: (a) shim đọc thêm trường entry/kiểu và set `FGOS_ACTIVE_RELEASE_PATH`/`FGOS_ACTIVE_MANIFEST_PATH` rồi exec `target/*/fgos`; (b) dev activation trỏ `releasePath` vào một thư mục release dev nhỏ có `bin/fgos` (không được là symlink — `verify_candidate_host_entry` `init.rs:541-592` từ chối symlink; copy binary = lại đóng băng Rust, chấp nhận được theo DP2). So sánh, đo, chọn. Reader khác của tier 0 phải liệt kê và quyết đổi/không: `scripts/fgos-shell-integration.sh:70-88` (chỉ kiểm shim, có lẽ không đổi), `src/setup/bin-discovery.mjs:25-97` (đọc `releasePath/manifest.json` → `entries.fgos`), `src/util/host-bin.mjs:18-62` (qua bin-discovery), `packages/herdr-fgos-common/rust/src/fgos.rs:387-399` (chỉ kiểm shim), `packages/distribution/rust/src/lib.rs:220-300` `resolve_runtime_identity_info`, `scripts/ci-external-consumer.sh` (đọc activation), `get_workspace_status` (`init.rs:1593`). `shimVersion` có phải tăng không.
- **Q7 — Windows/nền tảng khác.** CI chạy `ubuntu-latest, macos-latest, windows-latest` (`.github/workflows/ci.yml:15`); Windows ghi `fgos.cmd` gọi `sh` (`init.rs:1021-1027`); `release_dir_name` đổi `:` thành `-` trên Windows (`store.rs:250-256`) → `dev:*` cũng có `:`. Quyết: trong phạm vi (test chạy cả 3 OS) hay ngoài phạm vi (lệnh dev từ chối trên Windows với message rõ, test assert lời từ chối). Khuyến nghị sơ bộ: ngoài phạm vi, từ chối tường minh.
- **Q8 — Project khác không bị ảnh hưởng.** Chứng minh: guard (Q4) chặn; trường mới tuỳ chọn, vắng = hành vi cũ; golden `activation-binding-full/minimal.json` không đổi; test forward-compat `schema_golden.rs:298` cho thấy reader cũ bỏ qua trường lạ — nhưng reader cũ gặp dev activation sẽ exec `checkout/bin/fgos` (không tồn tại) → exit 3: fail-closed, xác nhận bằng đọc shim. `fgctl init/upgrade` trong project ngoài không bao giờ tạo dev activation.
- **Q9 — Spec ở đâu.** `docs/specs/distribution.md` đã là "Legacy status: Promoted source" (:9-20), reader entry là `docs/platform/packaging-distribution/README.md`. Đề xuất: chủ = `docs/platform/packaging-distribution/spec.md` (§3.3/§4/§7) + `contracts/activation-binding.md` (bỏ trạng thái frozen cho đúng một trường, hoặc V2) + khôi phục mục "Dev / Source Activation" vào `architecture/runtime-identity-and-activation.md`; `docs/specs/distribution.md` chỉ thêm một dòng trỏ (theo `AGENTS.md` "spec trước code"). Kiểm `docs/platform/component-boundary.md`. Sửa ledger HI-I027.
- **Q10 — Việc bỏ mục "Dev / Source Activation" khi promote có cố ý không.** **Đã trả lời: không cố ý** (anh xác nhận 2026-10-06). Phase 00 chỉ còn việc ghi lại bằng chứng (`runtime-identity-and-activation.md:73,895-920`, commit `6733de7cf`; vắng mặt ở `docs/platform/packaging-distribution/`; có trong kho kiểm kê của plan 260925) và đưa claim vào bảng bảo toàn của plan đó như claim bị rơi. Không cần tìm thêm quyết định ngược.

## Decision points (anh quyết ở cuối phase; em ghi phân tích + khuyến nghị)

| Id | Lựa chọn | Trade-off | Khuyến nghị |
|---|---|---|---|
| DP2 phạm vi | (a) chỉ Node, binary vẫn từ release; (b) Node + binary `target/*/fgos` | (a) không có đường hợp lệ vì payload phải nằm dưới release root (Q2) trừ khi đổi `verify_legacy_node`; (b) binary cũ khi quên build | (b), binary build sẵn, shim không build |
| DP3 toàn vẹn | (a) sinh lại manifest dev mỗi lần gọi; (b) bỏ băm `files[]` khi `dev-source`, giữ containment/symlink | (a) giữ bất biến nhưng tốn băm mỗi lệnh (~600 file, đo); (b) nới bảo đảm, đúng thiết kế V1 cũ | (b) |
| DP4 guard | (a) chỉ checkout fgOS; (b) cả extension author | (b) chưa có người dùng, chưa định nghĩa payload extension | (a), mở khi trigger |
| DP5 schema | (a) trường tuỳ chọn trong V1; (b) `schemaVersion: 2` | (a) rẻ, cần chứng minh reader cũ fail-closed; (b) sạch nhưng đổi mọi reader + golden | (a) nếu Q8 chứng minh fail-closed |
| DP6 worktree | (a) luôn main checkout; (b) theo worktree | `resolve_workspace_root` dùng git-common-dir → một activation/repo; (b) cần activation theo worktree, lớn | (a), ghi giới hạn |
| DP7 dạng lệnh | (a) verb mới `fgctl dev`; (b) cờ `fgctl init --dev` | (a) tách rõ, usage riêng; (b) ít verb nhưng trộn hai pipeline | Chốt sau Q1-Q3 |

## Files

- Create (lúc thực thi): `plans/261006-1445-fgctl-dev-activation/reports/phase-00-dev-activation-research.md` (trả lời Q1-Q9 + bảng DP); bản nháp spec `plans/261006-1445-fgctl-dev-activation/reports/phase-00-dev-activation-spec-draft.md` (nội dung sẽ vào `docs/platform/...` ở Phase 01).
- Modify/delete: không.

## Steps

1. Đọc lại `AGENTS.md` (4 mục ở Context), `docs/specs/reading-map.md`, spec + contract ở Context.
2. Chạy lại prior-art (`git log -S` 5 chuỗi ở bảng trên, thêm `-S'distributable'`, `-G'dev-source'`), đọc `6733de7cf` và commit promote `3835596e2`/`46bd59d93` để tìm lý do bỏ mục dev. Hỏi: có cố ý không.
3. Q1-Q3, Q6: đọc code liệt kê; impact read-only bằng GitNexus (`impact` upstream cho `resolve_payload_path`, `verify_workspace`, `repair_workspace`, `publish_and_tail`, `resolveWorkspaceInstallationBin`, `resolveActiveReleaseForDoctor`), cross-check bằng `rtk proxy grep` vì index có thể thiếu.
4. Q3/Q6 số đo (chi phí băm mỗi lần gọi, thời gian `cargo build` incremental): chỉ đo khi anh cho phép (ghi `target/`); không thì "chưa đo".
5. Q4, Q5, Q7, Q8, Q9: viết câu trả lời + khuyến nghị.
6. Viết spec draft: hành vi người dùng thấy, bảng bảo đảm mất/giữ, guard, lifecycle (vào dev, gọi, verify, repair = thoát, upgrade từ dev), doctor, nền tảng.
7. Trình DP1-DP7 cho anh; ghi lựa chọn vào `plan.md`.

## Tests / validation

- Báo cáo research có đủ Q1-Q9, mỗi câu có bằng chứng hoặc nhãn "chưa đo"; không còn câu nào chỉ có "UNPROVEN" không kèm bước kiểm.
- Spec draft được anh duyệt (DP1) trước khi Phase 01 bắt đầu.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Lỡ chạy lệnh ghi trạng thái (`fgctl init/upgrade/repair/verify`, `run-rust-dev-host`) khi research — `fgctl verify` có thể quarantine release thật | Low×High | Chỉ đọc code; đo cần anh cho phép từng lệnh |
| Kết luận Q1 sai vì đọc thiếu | Med×Med | Đọc hết 9 file trong `packages/distribution/rust/src/` + `apps/fgctl`; ghi phạm vi đã đọc |
| Spec phình thành thiết kế lại distribution | Med×Med | Chỉ trả lời Q1-Q9; mọi thứ khác ghi "ngoài phạm vi" |

## Rollback

Không có thay đổi code; bỏ báo cáo nếu DP0/DP1 = không làm.
