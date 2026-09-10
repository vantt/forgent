# Đánh giá thiết kế: Host Invocation And Provider Routing + Node→Rust Migration

**Ngày:** 2026-09-10
**Đối tượng:** `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` (1063 dòng, 2026-09-03), `node-to-rust-component-migration.md` (372 dòng, 2026-09-04)
**Đối chiếu:** `component-boundary-advisory.md`, `repo-layout-vision.md`, `packaging-distribution/{README,scope-map,runtime-identity-and-activation,future-constraints}.md`, `rust-cli-and-proof-components-plan.md`, code thật (`bin/fgos.mjs` 5210 dòng / 73 verb trong `src/cli/command-registry.mjs`; `herdr-plugin/src/fgos.rs:368` spawn `node` + parse `fgos.v1`).
**Tiêu chí người dùng:** đầy đủ, rõ ràng, CLEAN/SRP/hexagon, contract đủ cho tương lai, implement đơn giản trước, performance harness tốt nhất, **tuyệt đối đơn giản dễ hiểu**.

## 1. Kết luận

**Nền kiến trúc đúng và hiếm khi thấy đủ chiều sâu ở phần khó** (authority 2 tầng, failure family đóng, completion-unknown, idempotency trong catalog, registry snapshot bất biến, fail-closed). Phần đó giữ nguyên.

**Chưa đạt tiêu chí "đơn giản, dễ hiểu"** vì 4 lý do cấu trúc, không phải vì thiếu ý:

1. Kernel contract (phần vĩnh viễn) bị trộn với 3 thứ tạm/tương lai trong cùng một tài liệu: ecosystem plugin (§6–9), lane legacy (§13), distribution/setup/doctor (§13 cuối).
2. ~25 danh từ contract, trong đó nhiều cặp **cùng nghĩa khác tên** giữa prose và code mẫu.
3. Lane legacy CLI xuyên qua kernel (router có 2 kiểu input, 2 kiểu output).
4. Router và InvocationService **chồng trách nhiệm** (cả hai đều "invoke").

**Có 3 mâu thuẫn nội bộ phải chốt** (serialization cho built-in, rollback bằng "đổi selection" khi binding bất động, gateway in-process vs adapter out-of-process) và **1 drift liên-stream**: phần distribution trong tài liệu host (2026-09-03) đã bị stream packaging (2026-09-04+) vượt qua nhưng chưa được cập nhật — làm định nghĩa "ship R1" và blocker §3 của plan bị lệch.

Verdict: **điều chỉnh cấu trúc + chốt mâu thuẫn, không thiết kế lại.**

## 2. Những gì đã đúng — giữ nguyên

| Điểm | Vì sao đúng |
|---|---|
| Hai trục tách bạch: host invocation (transport) ⟂ provider routing (mechanism) (§1–2) | Đúng hexagon: host = driving adapter, provider = driven adapter, InvocationService = core. Chặn Cartesian product transport×mechanism. |
| Component class ⟂ invocation mechanism (§6) | Tách "ai sở hữu/release" khỏi "gọi thế nào". Chặn 2 lỗi kinh điển (static-link ≠ core; out-of-process ≠ user plugin). |
| Authority 2 tầng: admission trước routing, grant sau routing (§10) | Một cổng trước selection không thể xét identity/trust của provider được chọn. Lập luận chặt. |
| `LegacyCliPassthrough` ≠ `LegacySemanticProvider` (§13) | Không cho stdout bắt được giả làm semantic result. |
| OperationCatalog do component chủ sở hữu viết, không suy từ CLI (§4) | Chặn CLI registry tự "phong" authority. |
| Async từ v1, failure family đóng, lifecycle record đơn điệu, completion-unknown, idempotency key thuộc catalog (§11) | Đây chính là "contract đủ khía cạnh cho tương lai". Đã đủ. |
| Registry snapshot bất biến/invocation; không priority số, không last-writer-wins; ambiguity fail closed (§5, §9) | Đúng. |
| Discovery data-first (manifest, không exec code) + frame length-prefix, stdout chỉ protocol (§8–9) | Đúng. |
| Migration: Option B, read trước write, không dual-run write, Node removal = hệ quả zero route (migration §2, §10–12) | Đúng và có kỷ luật. |

## 3. Điều chỉnh (xếp theo tác động)

### A. Tách kernel contract thành một trang ≤ 200 dòng, một bảng tên chuẩn

Tài liệu 1063 dòng gánh 4 vai: kernel vĩnh viễn (§3–5, §10–11), ecosystem (§6–9), lane legacy (§13), distribution (§13 cuối, §14).

Tên trôi giữa prose và code mẫu — với tài liệu contract thì đây là lỗi contract:

| Prose | Code mẫu | Ghi chú |
|---|---|---|
| `OperationId` (§4) | `OperationKey` (§4 struct) | cùng nghĩa |
| `ProviderOutcome` (§4) | `ProviderResponse` (§11 trait) | cùng nghĩa |
| `HostInvocation` + `OperationRequest` (§3–4) | `ProviderCall` (§11 trait) | `ProviderCall` không được định nghĩa |
| — | `InvocationControl`, `EventSink` (§11) | không định nghĩa |

Đề xuất: tách 3 file — `kernel-contract.md` (OperationId, HostInvocation, OperationRequest, ProviderOutcome, OperationProvider trait, InvocationService pipeline, failure families, lifecycle record), `external-provider-protocol.md` (§6–9 + WASM), `legacy-transition.md` (§13 lane legacy + CommandRouteDescriptor + payload identity). Một bảng "tên chuẩn" duy nhất ở đầu kernel. Mục distribution/setup/doctor: xóa, thay bằng link (mục F).

### B. Lane legacy CLI ra khỏi kernel — ĐÃ CHỐT (xem §6)

Quyết định gốc (§5 cuối, §13): `LegacyCliRequest` đi qua router, trả `PreRenderedCliResult`. Hệ quả: kernel 2 input type, 2 output type; `OsString` argv xuyên core; 73/73 lệnh R1 trả overhead admit→select→grant→record chỉ để exec Node.

Thay bằng:

```txt
CLI adapter
  -> tra CommandRouteDescriptor[selector]
  -> route_kind == legacy-cli  : exec payload (argv nguyên vẹn, signal forwarding), ghi 1 invocation record
  -> route_kind == native      : build OperationRequest -> InvocationService (kernel duy nhất)
```

Không mất gì thật: CLI projector đã phải tra descriptor cho native; local admission = local caller; payload Node tự chạy gate. Centralization giữ trong **dữ liệu** (descriptor checked, CI drift) thay vì code path.

### C. Router = hàm chọn thuần; InvocationService = pipeline

§3: InvocationService "owns admission, selection, grant, invocation, cancellation, tracing". §5: Router có 8 trách nhiệm gồm "6. Invoke", "7. Normalize failures", "8. Report". Hai thành phần cùng invoke.

```txt
Router            : (OperationId, versions, hostKind, mode, policy, RegistrySnapshot) -> Result<ProviderDescriptor, SelectionRefused>
                    pure, không I/O, không async
InvocationService : received -> admit -> Router.select -> grant -> invoke(adapter) -> normalize -> record
```

Router bỏ trách nhiệm 6–8; lifecycle record (§11) do InvocationService phát.

### D. Chốt mâu thuẫn serialization cho built-in

§4: "router boundary carries encoded bytes … each built-in decodes those bytes". §7/§13: built-in "has no serialization cost". Không thể cả hai.

Đề xuất: contract semantic = **schema + version** (metadata luôn đi kèm); biểu diễn in-process là typed Rust; `EncodedMessage` chỉ tồn tại ở adapter external-process/WASM. Giữ đúng lời hứa "no serialization" — điểm quyết định performance khi read model (`ready`/`list`/`triage`) chuyển native.

### E. Registry linking không nằm trên hot path CLI + perf gate

§5/§9 không nói one-shot CLI đọc cache hay link lại mỗi lần. Ghi tường minh: R1 (chỉ static binding) snapshot là **hằng compile-time**; từ R2 CLI load cache theo fingerprint, rebuild chỉ khi lệch; gateway rebuild giữa invocation, publish atomic. Thêm ngưỡng đo vào harness P1: overhead legacy passthrough so với `node bin/fgos.mjs` trực tiếp ≤ N ms; `version` native < M ms. Plan hiện không có gate performance.

### F. Đồng bộ với stream packaging — ĐÃ CHỐT (xem §6)

| Tài liệu host §13 | Packaging stream (mới hơn, settled) |
|---|---|
| `fgos setup` là cửa cài đặt | `fgctl` cài runtime; lệnh local chạy dưới identity đã activate |
| payload tại `<install-root>/libexec/fgos/legacy-node/fgos.mjs` | release store theo digest; shim `.fgos/installation/bin/fgos`; `activation.json` per-workspace |
| "Runtime locator" boundary | activation binding + invocation lease |
| plan §3: ghi quyết định vào `distribution-vision.md` + `specs/distribution.md` | packaging README: specs wording "not the target"; cả 2 file 0 dòng nhắc Rust |
| plan P0→P9: không có node `fgctl` | R1 "installed as default" nghĩa là fgctl + activation |

Plan §3 liệt kê 6 blocker nhưng #2/#3 đã settled ở packaging; ngược lại thiếu phụ thuộc thật: P6 (flip) cần fgctl skeleton.

### G. Rollback — ĐÃ CHỐT (xem §6)

Migration §13: "Roll back by changing provider selection". Nhưng host §14 R1 "immutable static bindings", §10 "R1 and R2 prohibit replacement". Đổi selection = release mới. Lời hứa không có cơ chế đỡ.

### H. Gateway R3 in-process vs Project Runtime Adapter out-of-process

Host §3/§7 R3: gateway link host-runtime crate, gọi InvocationService in-process. `future-constraints.md` §2: adapter runtime dự án "must not be loaded in-process". Không mâu thuẫn nếu ghi rõ: R3 áp cho **gateway project-local** (herdr hiện tại, cùng release); **shared gateway** tương lai chỉ chạm runtime qua Project Runtime Adapter (out-of-process) — adapter đó là một `remote-host-use-case` adapter trong runtime dự án.

### I. Bổ sung contract còn thiếu

1. **Human-in-the-loop:** tuyên bố rõ provider không bao giờ block chờ người; trả outcome `parked` (khớp `ask`/awaiting-human, luật "Release con người"). Tránh sau này thêm callback 2 chiều vào trait.
2. `ProviderDescriptor.lifecycle`: liệt kê giá trị (singleton | per-invocation | pooled) hoặc bỏ khỏi v1.
3. Config port: đặt tên (`ContextPort`/`ConfigPort`) hoặc ghi "deferred".
4. R1 catalog = 1 entry (`distribution.build.show`): ghi rõ dùng `const` array, không xây "catalog system".

### J. Nhỏ

- WASM/chat trong enum v1: chấp nhận nếu descriptor dùng open string, không phải variant compile-time bắt buộc.
- `cli_host_use_case.rs` gộp projector + presenter: đặt tên sẵn `cli_projector` / `cli_presenter`, tách khi có áp lực.

## 4. Checklist tiêu chí

| Tiêu chí | Đánh giá |
|---|---|
| Đầy đủ | Kernel + failure/authority: đủ. Thiếu: perf gate, rule human-in-loop, lifecycle values, config port tên. |
| Rõ ràng | Ý rõ; tên chưa nhất quán; 4 vai trộn 1 file. |
| SRP | Router/InvocationService chồng (C); projector/presenter gộp (J). |
| Hexagon | Đúng ở host/provider; rò ở lane legacy xuyên core (B — đã chốt sửa). |
| Contract cho tương lai | Tốt — async, cancel, deadline, completion-unknown, idempotency, capability grant, snapshot bất biến. |
| Implement đơn giản trước | Cần ghi tường minh R1 = const catalog + compile-time snapshot (I.4, E). |
| Performance | Nguyên tắc đúng; mâu thuẫn built-in serialization (D); thiếu số đo (E). |
| Đơn giản, dễ hiểu | Chưa — A, B, C quyết định điều này. |

## 5. Thứ tự làm

1. F — đồng bộ với packaging (định nghĩa "ship R1" phụ thuộc vào đó).
2. A + C + D — kernel contract một trang, tên chuẩn, router thuần, typed in-process.
3. B — lane legacy ra CLI adapter.
4. G, H, I — chốt mâu thuẫn còn lại, thêm rule human-in-loop.
5. E — perf gate vào plan P1.

## 6. Quyết định đã chốt (người dùng, 2026-09-10)

1. **B — lane legacy nằm trong CLI adapter.** Kernel chỉ còn 1 contract (`OperationRequest` → `ProviderOutcome`). CLI adapter tra `CommandRouteDescriptor`: `legacy-cli` → exec payload Node trực tiếp (argv nguyên vẹn, signal forwarding, 1 invocation record); `native` → build `OperationRequest` → InvocationService. `LegacyCliRequest`/`PreRenderedCliResult` rời khỏi kernel.
2. **F — stream packaging là authority cho cài đặt.** Luật phân ranh:
   - **`fgctl` cài đặt runtime**: acquire/stage/verify release, publish activation, upgrade, rollback, uninstall. Thay đổi *identity* của runtime.
   - **Thiết lập bên trong một runtime đã có** — chỉ 2 lệnh local, luôn chạy dưới identity đã activate, không bao giờ chọn/tải/thay release:
     - `fgos init` = lần đầu (tạo `.fgos/`, rc/shell integration, hooks, config default, projection);
     - `fgos doctor --fix` = mọi thứ sau đó (repair, config-merge default mới, projection stale, hooks drift).
   - Đối chiếu `runtime-identity-and-activation.md` §11–12: khớp nguyên văn — `fgctl init/repair/upgrade` là lệnh duy nhất đổi identity, đuôi cố định `fgos init` → `doctor --fix` → `doctor`; `fgos init` = adopt workspace (kể cả project có `.fgos/` sẵn). "Init" có 2 tầng cùng tên khác authority (`fgctl init` máy-level / `fgos init` workspace-level) — cố ý.
   - **Verb `setup` bị bỏ** — tồn tại của nó là thừa khi đã có init + doctor --fix (khớp `scope-map.md:25`). Thân verb hôm nay đã gọi `runFixes()` như `doctor --fix` (tsk-5hi); 3 việc phụ chia đi: rc `source` line → `fgctl` (máy-level, trỏ shell vào shim); config default + git hooks + Claude hook → `fgos init` lần đầu rồi fix registration có sẵn (`config-not-stale`, `main-checkout-hook-wired`, `dispatch-decide-hook-wired`). Blast radius: ~20 file ngoài history còn nhắc `fgos setup` (README, CHANGELOG, AGENTS.md, 5 spec, doc-registry, 10 file `src/`). Mọi việc `setup` đang làm chuyển vào `init` (lần đầu) hoặc thành fix registration của `doctor --fix` (lặp lại). Đây là đổi contract CLI công khai: cần dòng CHANGELOG, migration path cho caller hiện có (shell function, docs, plugin skill gọi `fgos setup`), và check `setup-verb-removed` để doctor báo caller cũ.
   - Tài liệu host xóa mục distribution/setup/doctor, thay bằng link sang `runtime-identity-and-activation.md`. Plan thêm node `fgctl skeleton` trước P6; gạch blocker §3 đã settled ở packaging; plan host sở hữu P0–P5, P7–P9.
3. **G — không cho config thay built-in provider** (chốt câu hỏi mở #2 = "prohibit"). Rollback R1–R2 = release rollback qua `fgctl` (release trước còn cả Rust native lẫn Node payload trong cửa sổ quan sát). Sửa migration §13: bỏ câu "roll back by changing provider selection".

4. **Bỏ verb `setup`** — `fgos init` lần đầu, `fgos doctor --fix` mọi lần sau. (Chốt sau khi cân nhắc giữ `setup`; người dùng chọn đơn giản hơn.)

## 7. Trạng thái thực thi (2026-09-10)

Đã áp dụng A–J + 4 quyết định vào tài liệu (chưa commit):

| File | Kết quả |
|---|---|
| `host-invocation-provider-routing.md` | 1063 → 233 dòng, kernel contract; bảng 17 tên chuẩn; router thuần / InvocationService pipeline; typed in-process; lane legacy ra CLI adapter; mục distribution → link packaging; rule `parked`; `lifecycle`, `ConfigPort`, R1 `const` catalog |
| `external-provider-protocol.md` (mới, 127) | component class, mechanism, `fgos.component.v1`, `EncodedMessage`, registry linker, namespace |
| `legacy-cli-transition.md` (mới, 78) | passthrough vs `LegacySemanticProvider`, `CommandRouteDescriptor`, payload identity (không nêu path cài đặt), fgos.v1 parity, rollback qua `fgctl` |
| `node-to-rust-component-migration.md` | 372 → 413; 6 quyết định; cột performance gate ở §14; decision #2 settled |
| `rust-cli-and-proof-components-plan.md` | 511 → 629; node `PK` (fgctl skeleton) → P6; §3 gạch 2/3/4 settled, đóng #6 = never; P1 perf gate (≤25 ms exec overhead, ≤10 ms `version`, placeholder chốt ở P0); P3 kernel 1 contract; P4 đổi tên "CLI adapter legacy exec"; P6 build release tree cho `fgctl`; P0 kiểm kê caller `fgos setup` |

Reports của 3 agent: `plans/reports/{host-doc-rewrite-260910-1554-kernel-split,migration-doc-update-260910-1557-settled-decisions,plan-doc-update-260910-1554-fgctl-dependency-and-settled-decisions}-report.md`.

Việc còn lại ngoài phạm vi tài liệu kiến trúc: (1) `docs/specs/reading-map.md` chưa từng có entry cho `host-invocation-routing/` — bổ sung khi stream này được promote; (2) xóa verb `setup` là thay đổi CLI contract riêng, làm sau khi P0 kiểm kê caller; (3) `docs/specs/distribution.md` sẽ regenerate từ packaging stream.

## 8. Quyết định bổ sung (brainstorm 2026-09-10, đã chốt)

5. **Payload Node không di chuyển, không đổi tên file.** Identity `legacy-node` trong manifest (`components.legacyNode.root`/`entry`) + trường `legacy_payload` của descriptor. Payload = npm `files` nguyên khối, staged `libexec/legacy-node/` với layout y hệt source → zero sửa import (`bin/fgos.mjs` tự tính root từ `import.meta.url`). Bỏ ý "chuyển sang `packages/legacy-node/node/fgos.mjs`" (gãy import, và `repo-layout-vision` §7 cố ý hoãn layout Node). Đổi tên file chỉ xảy ra lúc xóa.
6. **CLI Rust: tên public vẫn `fgos`**; crate `apps/fgos` (binary `fgos`, module `cli_projector`/`cli_presenter`/`legacy_exec`), `packages/host-runtime/rust` (`fgos-host-runtime`), `packages/distribution/rust` (`fgos-distribution`). R1 = 3 crate; `component-protocol` sang R2; **không có** `packages/legacy-node/` crate. Root `Cargo.toml` workspace, `herdr-plugin` ngoài workspace ở R1.
7. **Resolve bằng manifest, không hardcode:** `join(activeReleasePath, legacyNode.root, legacyNode.entry)`; dev `dev:<rev>` khai `root: "."`, `entries.fgos: "target/release/fgos"`. Đề xuất ghi vào `runtime-identity` §5 (đã ghi, đánh dấu "proposed by host-invocation stream"). Shim: khuyến nghị script `sh` cho V1 (ghi vào open decision #3).
8. **Caller cũ:** ~150 hit grep nhưng 9 điểm gọi thật; 75 test giữ; 20 `.agents`/`plugins` là render từ 1 file `core/skills`. Cutover = thêm tier 0 (shim) vào resolver duy nhất của mỗi runtime, không sửa 9 chỗ rời rạc. Ghi vào plan P0 (inventory) + P4 bước 9.

Files sửa thêm: kernel §9, `legacy-cli-transition.md` §2, migration §1 + §5.2, plan P0/P2/P4, `runtime-identity` §5 + §15.3.

## 9. Track plan-loop (2026-09-10)

Plan kiến trúc **chưa** chạy được bằng group-thinking: sai hình dạng (không có track/roster/lease/cell-status), P6 phụ thuộc `fgctl` chưa có, 3 quyết định sản phẩm treo, reviewer chưa có `cargo` trong allowlist, P1/P3 quá lớn cho một cell. Đã tạo track `plans/260910-1700-rust-host-r1-kernel/` (plan.md + 12 phase) khoanh scope **R1-kernel** (P0–P5 + release-tree builder + tier-0 resolver; flip/fgctl-proof là track sau):

| Cell | Lane | Capability |
|---|---|---|
| P00 inventory & inputs freeze | Lead | code:review |
| P01 command-route descriptor · P02 parity harness · P03 envelope vectors | Node | code:implement |
| P04 workspace · P05 contracts+Router · P06 InvocationService+authority · P07 legacy exec (full-suite) · P08 native version (perf gate) | Rust | code:implement |
| P09 release-tree builder + doctor (full-suite) · P10 tier-0 resolver | Node/mixed | code:implement |
| P11 docs/changelog/closeout (full-suite) | Lead | code:review |

Quyết định kỹ thuật phát sinh khi viết track (đã đồng bộ vào kernel §5/§6/§10 + plan P3): `RegistrySnapshot` không phải hằng compile-time trong crate kernel — kernel không được phụ thuộc crate provider — mà được lắp **một lần ở composition root `apps/fgos`** qua `build_snapshot(catalog, providers, fingerprint)` thuần; P07 lắp với fixture echo (test `version` fail-closed "no binding"), P08 thêm provider distribution vào cùng call site.

Prerequisites trước P00 (Lead, ngoài cell): commit toàn bộ doc + track; thêm `cargo test/clippy/fmt/build` (cả dạng `rtk`) vào allowlist `claude-reviewer-herdr`; xác nhận bảng Decisions (default: linux-x64-glibc; preview; window 2 release; budget 25 ms/10 ms).

## Câu hỏi chưa giải quyết

1. Bảng Decisions trong `plan.md` — anh xác nhận default hay đổi hàng nào?
