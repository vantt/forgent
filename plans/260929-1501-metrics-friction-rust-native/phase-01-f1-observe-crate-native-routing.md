---
phase: F1
title: "Crate Observe + route native có subcommand"
status: done
priority: P1
effort: "1d"
dependencies: []
---

# Phase F1: Crate Observe + route native có subcommand

## Overview
Tạo crate `fgos-observe` (contract, provider), cho Rust host hỗ trợ `fgos metrics <sub>` và `fgos friction <sub>`, và thêm presenter JSON chung. Viết spec tối thiểu cho area mới và cập nhật component-boundary.

## Requirements
- Functional:
  - `command-routes.json`: selector `metrics` và `friction`, `route_kind: native`, `operation_id` = tiền tố namespace (`observe.metrics` / `observe.friction`), cộng field mới `subcommands: true`. Test hiện ép `operation_id` không rỗng.
    <!-- Red Team 2026-09-29 --> `command-routes.json` là **file sinh** (`scripts/export-command-selectors.mjs:218-260` từ `COMMAND_REGISTRY` + `command-route-annotations.json`): sửa generator để emit `subcommands`, không sửa tay file JSON. Test drift trong `command-routes.test.mjs` phải xanh sau khi regenerate.
  - `CommandRouteDescriptor.subcommands: Option<bool>`. Khi bật, op = `operation_id + "." + cli_args[1]`. Thiếu sub hoặc sub lạ thì in danh sách sub và exit 4.
  - Tôn trọng `--dir <root>` (shell function `fgos` luôn nối cờ này). Không có thì dò ngược lên thư mục chứa `.fgos/`, như `resolve_workspace_root` của `packages/work-state/rust/src/lib.rs`.
  - **Registry Node có cờ `nativeOnly: true`** cho `metrics` và `friction` trong `src/cli/command-registry.mjs`. `node bin/fgos.mjs metrics` in "chỉ có ở Rust host" và exit 4. `test/rust-host/command-routes.test.mjs` giữ nguyên luật một-một với `COMMAND_REGISTRY`.
  - Output là envelope `fgos.v1` (`cli_presenter::wrap_envelope`).
  - <!-- Red Team 2026-09-29 --> **Stdin cho route native:** `main.rs:113-120` hiện đọc bỏ tối đa 1 MiB stdin trước khi build request. Đổi thành: projector đọc stdin **một lần** (giới hạn 1 MiB, vượt thì exit 4 kèm lỗi có mã) và truyền `stdin: Option<Vec<u8>>` vào `ObserveRequest`. Route khác giữ hành vi drain như cũ.
  - <!-- Red Team 2026-09-29 --> **Store lock dùng chung** `packages/observe/rust/src/store_lock.rs` (F1 dựng, vì F3 và F5 chạy song song đều cần): lock file O_EXCL `.fgos/observe/.lock` ghi `{pid, startTime, ts}`; holder chết (kiểm `/proc/<pid>` + startTime) hoặc quá TTL 30 giây thì được giành lại; timeout chờ 5 giây thì lỗi có mã `observe-lock-timeout`. Workspace chưa có crate flock, nên tự viết, không thêm dependency.
  - <!-- Red Team 2026-09-29 --> **Store tracked, shard theo writer** (anh chốt): mọi store ghi của Observe là `.fgos/observe/<store>/<writerId>.jsonl` (giống `resolveWriterLogPath`, `src/state/store.mjs:126-149`); reader gộp mọi shard theo `ts`. F1 viết helper `shard_path(root, store)` và `read_all(root, store)` dùng chung. Thêm `observe/` vào `FGOS_NOISE_ONLY_PATHS` (`bin/fgos.mjs:293`) để không tính là footprint.
<!-- Updated: Validation Session 3 - Rust single writer, Node gọi host -->
  - **Node gọi được route native của host** (cửa ghi friction dùng chung cho mọi component, bất kể viết bằng ngôn ngữ nào):
    - `check_recursion_guard()` chuyển từ đầu `main()` vào **nhánh `legacy-cli`**. Route native không bao giờ spawn Node, nên không thể tạo vòng lặp host → Node → host.
    - `legacy_exec` đặt `FGOS_HOST_BIN = std::env::current_exe()` cho process Node con.
    - <!-- Red Team 2026-09-29 --> **Resolve host (anh chốt: env → release manifest → fault):** `resolveHostBin()` lấy `FGOS_HOST_BIN`; không có thì đọc release manifest đang active (`.fgos/installation` → `releasePath` → binary host khai trong manifest). Vẫn chỉ một writer Rust; không dò `target/`. Không tìm được host thì `invokeHost` ném lỗi mã `host-unavailable`. Áp dụng cho mọi entry không qua host: `bin/fgos-runner.mjs` (import thẳng `loop.mjs`), npm global `bin.fgos`, `node bin/fgos.mjs`.
    - <!-- Red Team 2026-09-29 --> **Pin root và version:** client luôn truyền `--dir <main checkout root>` (dùng `resolveMainCheckoutRoot`, `src/runner/paths.mjs:69-86`), không để host dò ngược (worktree có `.fgos` riêng). Envelope trả về có `capabilities`; thiếu sub cần gọi (host cũ, ví dụ shim M1 chỉ có `ping`) thì lỗi mã `host-version-mismatch`.
    - Helper Node dùng chung `src/util/host-bin.mjs`: `invokeHost(args, {input, dir})` gọi `execFileSync(resolveHostBin(), [...args, '--dir', dir])`, parse envelope `fgos.v1`, ném lỗi có mã (`host-unavailable` / `host-version-mismatch` / mã từ host). Không fallback dò `target/`.
    - `scripts/run-tests.mjs`: nếu `FGOS_HOST_BIN` đã có và chạy được thì **dùng luôn, không build** (CI đã build `--release`, `.github/workflows/ci.yml:56-57`). Không có thì `cargo build -p fgos` (debug, incremental) với `CARGO_TARGET_DIR` **riêng cho mỗi checkout** (worktree không có `target/`, hoặc symlink về main thì các làn ghi đè binary của nhau), rồi export `FGOS_HOST_BIN` (thêm `.exe` trên Windows). Job `related` của CI (`ci.yml:164-175`) cũng phải có bước này. <!-- Red Team 2026-09-29 -->
- **Chuẩn bị cho làm song song** (F1 là nút thắt duy nhất; sau F1, ba làn chạy độc lập mà không đụng chung file):
  - Dựng sẵn crate rỗng `packages/run-result/rust`, `packages/coordination-state/rust` và thêm vào `Cargo.toml` members, để các làn không phải sửa `Cargo.toml` gốc.
  - <!-- Red Team 2026-09-29 --> Thêm sẵn dependency `fgos-observe` vào `packages/work-state/rust/Cargo.toml` (làn A F6 và làn B F5 đều cần; trait `LegacyFrictionSource` định nghĩa trong `fgos-observe::contract`, không ở work-state).
  - <!-- Red Team 2026-09-29 --> `CATALOG` (`catalog.rs:17`, test ép `len()==3` ở :59): **một descriptor cho mỗi namespace** (`observe.metrics`, `observe.friction`), provider tự dispatch sub bên trong, nên các làn không phải sửa `catalog.rs`. F1 cập nhật assert thành 5.
  - `packages/observe/rust/src/provider.rs` chỉ là bảng chuyển tiếp theo namespace: `metrics.*` → `metrics_cli/mod.rs` (làn A sở hữu), `friction.*` → `friction_cli.rs` (làn B sở hữu). F1 tạo cả hai file với một stub sub `ping`.
  - Phần nối source ở composition root tách thành hai file: `apps/fgos/src/wiring/metrics_sources.rs` (làn A) và `apps/fgos/src/wiring/friction_sources.rs` (làn B).
  - Entry `metrics` và `friction` trong `command-routes.json` và registry Node được thêm **ngay ở F1**. Các làn chỉ **xoá** verb cũ của riêng mình.
  - `docs/specs/observe.md` có sẵn mục riêng cho từng làn: § Metrics (A), § Friction (B), § Contract & quyết định (F8).
- Non-functional:
  - 73 route legacy và 2 route native hiện có giữ nguyên hành vi.
  - Host đang chạy `legacy-cli` mà nhận thêm một lời gọi `legacy-cli` lồng nhau thì vẫn bị guard chặn như cũ.

## Architecture
```text
argv: metrics harness --case x --dir /p
main.rs ─ routes["metrics"] {native, operation_id:"observe.metrics", subcommands:true}
        ─ op = "observe.metrics.harness"
        ─ cli_projector: observe.* → ObserveRequest { sub, args: Vec<String>, root }
        ─ InvocationService → ObserveProvider (packages/observe/rust)
        ─ ProviderOutcome::Completed(JsonOutcome(serde_json::Value))
        ─ cli_presenter: downcast JsonOutcome → wrap_envelope
```
- `JsonOutcome(pub serde_json::Value)` đặt ở `fgos-host-runtime` contracts: presenter downcast một lần cho mọi provider mới.
- Descriptor mỗi sub được đăng ký trong `CATALOG` (`packages/host-runtime/rust/src/catalog.rs`), vì `build_snapshot` nhận catalog.
- Contract types trong `fgos-observe::contract`:
  ```rust
  pub enum SubjectKind { Run, Session, Executor, Case, Work }
  pub struct Subject { pub kind: SubjectKind, pub id: String }
  pub struct Observation { pub ts: String, pub subject: Subject, pub kind: String,   // vd "run.settled"
                           pub attrs: serde_json::Map<String, Value>, pub source: &'static str }
  pub struct Window { pub since: Option<String>, pub until: Option<String> }
  pub trait ObservationSource {
      fn source_id(&self) -> &'static str;
      fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError>;
  }
  ```
  Chưa cần streaming iterator: cỡ dữ liệu là khoảng 1k run và khoảng 600 session. Đo lại ở F4.

## Related Code Files
- Create:
  - `packages/observe/rust/{Cargo.toml,src/lib.rs,src/contract.rs,src/provider.rs}`
  - `docs/specs/observe.md` (tối thiểu: component, Owns/Must-not-own, subject, lệnh, các mục theo làn § Metrics / § Friction / § Contract & quyết định)
- Modify:
  - `Cargo.toml` (members), `apps/fgos/{Cargo.toml,src/main.rs,src/cli_projector.rs,src/cli_presenter.rs}`
  - `packages/host-runtime/rust/src/{catalog.rs,contracts.rs}`, `packages/host-runtime/contracts/command-routes.json`
  - `src/cli/command-registry.mjs`, `bin/fgos.mjs` (nhánh `nativeOnly`), `test/rust-host/command-routes.test.mjs`
  - `apps/fgos/src/legacy_exec.rs` (đặt `FGOS_HOST_BIN`; guard chỉ ở nhánh legacy), `scripts/run-tests.mjs` (build cộng export)
- Create (thêm): `src/util/host-bin.mjs` cộng test, `packages/observe/rust/src/store_lock.rs`, `packages/observe/rust/src/shard.rs` <!-- Red Team 2026-09-29 -->
- Modify (thêm): `scripts/export-command-selectors.mjs`, `packages/host-runtime/contracts/command-route-annotations.json`, `packages/work-state/rust/Cargo.toml`, `test/rust-host/vectors/envelope/version.json`, `.github/workflows/ci.yml` (job `related`), `bin/fgos.mjs` (`FGOS_NOISE_ONLY_PATHS`) <!-- Red Team 2026-09-29 -->
  - `docs/platform/component-boundary.md` §4 (thêm Observe), `docs/specs/reading-map.md`

## Implementation Steps
1. Đọc `test/rust-host/command-routes.test.mjs` và `src/cli/command-registry.mjs` (cấu trúc entry).
2. Thêm `subcommands` vào descriptor và nhánh native trong `main.rs`.
3. Tạo `fgos-observe` với `observe.metrics.ping`, trả `{ok, root}` để kiểm route từ đầu tới cuối.
4. Thêm `JsonOutcome` và nhánh presenter tương ứng.
5. Thêm entry `nativeOnly` ở Node cộng nhánh refuse, kèm test Node.
6. Chuyển recursion guard vào nhánh legacy; đặt `FGOS_HOST_BIN`; viết `host-bin.mjs`; cho `run-tests.mjs` build rồi export. Test: từ Node gọi `invokeHost(['metrics','ping'])` thành công; một lời gọi `legacy-cli` lồng nhau vẫn bị chặn.
7. Viết spec tối thiểu và thêm dòng component-boundary.

## Success Criteria
- [ ] `cargo run -p fgos -- metrics ping --dir .` in envelope có `root`.
- [ ] `cargo run -p fgos -- metrics` exit 4 kèm danh sách sub.
- [ ] `gate-bypass` byte-identical như trước. <!-- Red Team 2026-09-29 --> `version` **đổi** vì danh sách verb lấy từ key của `command-routes.json` (`packages/distribution/rust/src/lib.rs:452-473`): regenerate `test/rust-host/vectors/envelope/version.json` bằng `test/rust-host/generate-vectors.mjs`; mỗi làn xoá verb thì regenerate khi rebase.
- [ ] <!-- Red Team 2026-09-29 --> Friction detail có newline, dấu ngoặc và dài 64 KB đi qua stdin round-trip nguyên vẹn.
- [ ] <!-- Red Team 2026-09-29 --> `invokeHost` chạy được với env trống (resolve qua manifest), và báo `host-unavailable` khi không có host; `fgos-runner` với env trống không crash.
- [ ] <!-- Red Team 2026-09-29 --> Store lock: holder bị SIGKILL thì lần gọi sau giành lại được lock.
- [ ] `node bin/fgos.mjs metrics` exit 4 với thông báo native-only.
- [ ] `cargo test --workspace` và `node --test test/rust-host/command-routes.test.mjs` xanh.
- [ ] `npm test` tự build host và mọi test Node thấy `FGOS_HOST_BIN`; lời gọi `legacy-cli` lồng nhau vẫn bị chặn.

## Risk Assessment
- **Node test giờ phụ thuộc Rust build** (đã chấp nhận). Dấu hiệu: `npm test` chậm ở lần đầu, hoặc fail khi máy không có cargo. Cách xử lý: build debug incremental; báo lỗi rõ ràng khi thiếu cargo. Chạy `node bin/fgos.mjs` trực tiếp (không qua host) thì các lệnh ghi friction báo lỗi có mã. Đây là chủ đích của single path.
- **Nới recursion guard mở ra vòng lặp.** Chỉ nới cho route native; có test chặn lời gọi `legacy-cli` lồng nhau.
- **Mỗi sub cần một descriptor trong `CATALOG`, gây lặp.** Chấp nhận; thêm helper hoặc macro nếu lặp quá 5 lần.
- **Nhánh `nativeOnly` ảnh hưởng tới help, doctor và dispatcher Node.** Dấu hiệu: test help/registry đỏ. Cách xử lý: coi `nativeOnly` là entry hợp lệ ở mọi consumer registry; grep mọi chỗ duyệt `COMMAND_REGISTRY`.
