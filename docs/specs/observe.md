# Observe Component Specification

Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`

## 1. Overview & Boundaries

Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.

### Owns
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.

### Must Not Own
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.

## 2. Shared Entities & Subjects

| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |

## 3. Storage Model

- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.

## 4. Commands & Routing

- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.

Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).

## 5. Mục theo làn (Sub-spec sections)

### § Metrics (Làn A)
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).

### § Friction (Làn B)
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.

### § Contract & Quyết định (Làn C / F8)
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/coordination-state/contracts/session-events.read.v1.json`, `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable` (`src/setup/registrations.mjs`).

## 6. Lịch sử quyết định

### D-ADR0037 (Observe Component Architecture)

- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
