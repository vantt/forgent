---
title: "6.5 terminal-control: lõi Rust, driver herdr, layout đo thật + policy cắm được"
description: "Component nền terminal-control (packages/terminal-control, crate fgos-terminal-control) gọi theo key/attempt id, giữ map key↔pane, driver herdr có khai báo khả năng, hình học đo thật và cổng placement policy; mọi lời gọi herdr của đường chạy đi qua một cửa; xoá createBatchTab, batchTabFor, closeIfEmpty, nhãn tự chế"
status: completed
priority: P1
effort: 52h
branch: worktree-agent-ae86665b911b82fc1
tags: [terminal-control, herdr, rust, layout, foundation]
created: 2026-10-16
---

# Plan 6.5: terminal-control — lõi Rust + driver herdr

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §7 toàn bộ (7.1 vai trò, 7.2 ghi gì, 7.3 cổng trên, 7.4 luật core, 7.5 driver + khả năng, 7.6 đồng thời phương án (a), 7.7 ca lỗi, 7.8 research giữ/đổi/bác, 7.9 layout, 7.10 chuyển đổi), §4.1–4.2 (L2, quyền/không bao giờ), §6.1.2 dòng "Gate trong pane" (Windows phụ thuộc herdr), §11 entry 6.5, §12.8 (hình học herdr thật). Hội đồng: [kết luận](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) §2.3 (gom tab theo nhóm), §2.4 (bỏ root pane rỗng, đã đo 5 CLI), §4 (ý bị bác), §5 (ALT-TAB1 không làm; lock terminal nếu có phải là kind của holder-lock). Research gốc: [herdr layout](../reports/research-261015-1116-herdr-tab-pane-layout-and-naming.md) (phần bị bác ghi ở r6 §7.8).
- **Quyết định của anh áp vào đây:** terminal-control là component nền riêng (2026-10-15); một người dùng, không tương thích ngược, xoá đường cũ cùng phase; Rust-first; đa nền tảng: Linux trước, cổng trung lập OS; không work item; song song hoá. Không có verb người dùng mới (D2/STR40 giữ, r6 §7.8): chỉ route nội bộ `fgos internal terminal-control`.
- **Windows:** cách `terminal` phụ thuộc herdr chạy được trên Windows. Hôm nay herdr không có trên máy probe Windows (r6 §12.10–12.12: skip "herdr không có trên PATH") và [`herdr-plugin.toml`](../../herdr-dashboard/herdr-plugin.toml) chỉ khai `linux`, `macos`. Vì vậy trên Windows driver herdr khai báo không có khả năng nào, mọi thao tác trả `unsupported`, dispatch qua herdr bị từ chối có tên; cách `direct` không bị ảnh hưởng. Crate vẫn biên dịch cho Windows. Khi herdr có bản Windows, chỉ driver đổi.
- **Không phụ thuộc 6.2/6.3:** terminal-control là L2, dưới supervisor. Trước 6.2/6.3, key = `launchCommandId` của round (assignment) hoặc id round ad-hoc hiện có; 6.3 đổi key sang attempt id mà không đổi cổng. `launch` trả identity của gốc process trong pane (hôm nay là launcher script; ở 6.3 là gate).
- Impact-analysis: GitNexus có mặt; executor chạy `impact` trên `createHerdrClient`, `createBatchTab`, `driveRound`, `reconcileHerdrSpawnRun` trước khi sửa và báo blast radius (dự kiến HIGH với `herdr-round.mjs`).
- Component boundary: **có đổi** (thêm terminal-control L2). P08 cập nhật [`component-boundary.md`](../../docs/platform/component-boundary.md).

## Prior art (đã kiểm `git whatchanged -S`)

| Thứ | Vào ở | Ghi chú cho thiết kế |
|---|---|---|
| `createBatchTab`, `batchTabFor`, nhãn `fgos-lead-<key>-<ts>` | `2e1a29517`, `c256a2846` | Tab trong RAM của process, `closeIfEmpty` ở `exit` (chỉ chạy khi thoát êm) — xoá (r6 §7.4.3, hội đồng §2.4) |
| `FGOS_HERDR_ANCHOR_PANE` ([`transport.mjs:847`](../../src/runner/dispatch/transport.mjs), doctor [`registrations.mjs:4279`](../../src/setup/registrations.mjs)) | — | Neo pane do caller đưa; trở thành `attach` + `groupKey` |
| herdr-dashboard `next_split_target` dùng `herdr pane layout` ([`layout.rs:351-378`](../../herdr-dashboard/src/layout.rs)) | `4acaaeb19` (tsk-1q3), `81b1ed203` (tsk-1zq tái dùng pane) | **Tái dùng** hiểu biết về JSON `pane layout` (`result.layout.area`, `panes[].rect`) cho driver; herdr-dashboard là workspace Cargo riêng (excluded), giữ nguyên, chuyển nó lên terminal-control là việc hoãn có tên |
| fake herdr binary [`test/helpers/fake-herdr-pane.mjs`](../../test/helpers/fake-herdr-pane.mjs) qua `FGOS_HERDR_BIN` | — | Driver Rust gọi cùng CLI herdr và đọc `FGOS_HERDR_BIN`, nên test hiện có giữ được fixture này |
| Không có crate terminal-control nào từng tồn tại rồi bị gỡ | — | `git whatchanged -S'terminal-control'` chỉ ra report/design |

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Driver herdr gọi **CLI** `herdr` (như Node hôm nay và herdr-dashboard), không tự nói giao thức socket | Giữ được fake herdr của test; giao thức socket của herdr không có hợp đồng công khai trong repo. `serverIncarnation` lấy bằng `SO_PEERCRED` trên socket herdr ngay trước **và** sau mỗi `pane close`; lệch → `unknown`, không đóng lần nữa. Khe còn lại (server restart đúng giữa hai lần kiểm) ghi thẳng trong spec. P01 đo nguồn socket/pid; nếu herdr CLI có cách gắn incarnation vào lệnh close thì dùng cách đó |
| D2 | **Một cửa herdr:** mọi lời gọi herdr của đường chạy Node (`herdr-round`, `herdr-reconcile`, `worker-session-boot`, account probe `closePane` ở [`dispatch/cli.mjs:1220`](../../src/runner/dispatch/cli.mjs), reaper [`cleanup.mjs:410`, `:428`](../../src/runner/dispatch/confinement/cleanup.mjs)) đi qua terminal-control trong P06; xoá `createHerdrClient` | RUL11 (gom tùm lum); r6 §7.10 "không lúc nào một caller có hai bản". Thao tác agent của herdr (`agent start/prompt/read/get/explain/send-keys`, `report`) ánh xạ vào `launch` (khả năng `activity.state`), `send`, `read`, `inspect`, `label` (bảng ở P06) |
| D3 | Không làm mô-đun Node trung gian `src/terminal-control/` có logic (r6 §7.10 bước "Ngay (Node)"); Node chỉ có client mỏng gọi route + hàng promise theo `groupKey` | Anh quyết Rust-first và không dual; client mỏng không quyết định gì |
| D4 | `allocationGraceMs` mặc định = `READY_TIMEOUT_MS` ([`herdr-round.mjs:389`](../../src/runner/dispatch/herdr-round.mjs), 30000) + 30000 = 60000; doctor từ chối giá trị < base + 30000. Khi 6.2 land, base đổi thành hạn chờ binding của supervisor | r6 §7.9 điểm 4 cần "thời hạn chờ binding + 30 s"; trước 6.2, thời hạn tương đương là chờ pane sẵn sàng |
| D5 | `retainFailedPaneMs` mặc định `null` = giữ tới khi người đóng (hành vi hôm nay, `paneFateFor` [`herdr-round.mjs:1381`](../../src/runner/dispatch/herdr-round.mjs)); quét chỉ báo doctor | r6 §7.9 điểm 4 |
| D6 | `terminal.layout.minCols/minRows` lấy từ đo P01 (CLI đòi lớn nhất trong 5 CLI); `maxPanesPerTab` mặc định = số pane tối đa mà tab 352×69 (máy anh, r6 §12.8) chứa được với min đó theo `measured-split`, tính bằng fixture, không đoán | Không dùng 85×20 / "tối đa 4" của research khi chưa đo (r6 §7.9) |
| D7 | herdr-dashboard (workspace Cargo riêng) và tmux driver **không** trong 6.5 | Hoãn có tên; cổng đã có chỗ cho chúng |

## Phạm vi

Trong 6.5: package `packages/terminal-control` (contract + crate `fgos-terminal-control`); cổng trên theo key (`allocate`, `attach`, `launch` → `{pid, startTime, bootId, pgid}`, `send`, `read`, `inspect`, `release{close|retain(until)}`, `label`); allocation record + marker `launch-requested`/`launched`/`released`; luật core 7.4; driver herdr có khai báo khả năng + `layout.geometry` + `serverIncarnation`; cổng placement policy + `measured-split`; route nội bộ; client Node + hàng theo `groupKey`; chuyển mọi caller herdr của Node; `/fgOS:terminal` sang `attach`/`label`; cấu hình `terminal.*` + doctor + setup; docs; landing.

Ngoài: kind `terminal-placement` của holder-lock (chỉ khi S5 bắn, r6 §7.6); tmux driver; herdr-dashboard; gate trong pane, agent-protocol (6.3); key = attempt id (6.3).

## Phase và phụ thuộc

Tiền đề: **4.2 đã land** (crate `fgos-process`: `boot_id`, `start_time`, `judge`; `state_root`; nhánh `internal` trong `apps/fgos/src/main.rs`). Song song được với 4.3, 4.4a.

| Phase | Nội dung | Phụ thuộc | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-and-crate-skeleton.md) | Contract cổng, record, route, policy fixture; crate rỗng | 4.2 landed | 0 | 3 |
| [01](phase-01-herdr-measurements.md) | Đo trên herdr thật: incarnation, `pane layout`, kích thước tối thiểu 5 CLI, bảng thao tác herdr | 00 | 1 | 5 |
| [02](phase-02-core-allocation-and-rules.md) | Lõi: allocation record, map key↔pane, luật 7.4, ca lỗi 7.7, quét đối soát | 00 | 1 | 8 |
| [03](phase-03-herdr-driver.md) | Driver herdr: khả năng, thao tác, geometry, incarnation, Windows `unsupported` | 00; 01 (incarnation) | 1 | 7 |
| [04](phase-04-placement-policy.md) | Cổng policy + `measured-split` + fixture hình học | 00 | 1 | 4 |
| [05](phase-05-internal-route-and-node-client.md) | Route `fgos internal terminal-control`, client Node, hàng theo `groupKey` | 02, 03, 04 | 2 | 4 |
| [06](phase-06-migrate-herdr-callers.md) | Chuyển `herdr-round`, `herdr-reconcile`, `worker-session-boot`, account probe, reaper; xoá `createHerdrClient`, `createBatchTab`, `batchTabFor`, `closeIfEmpty` | 05 | 3 | 12 |
| [07](phase-07-terminal-skill-attach-label.md) | `/fgOS:terminal`, `terminal-close` sang `attach`/`label`/`release` | 05 | 3 | 2 |
| [08](phase-08-config-doctor-setup-docs-changelog.md) | `terminal.*` config, doctor, setup, spec, boundary, CHANGELOG | 00 (docs); 01 (mặc định); 05 (check) | 1–3 | 4 |
| [09](phase-09-integration-real-herdr-landing.md) | Tích hợp, full test, nghiệm thu trên herdr thật 5 CLI, landing | 00–08 | 4 | 3 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02 ∥ P03 ∥ P04 ∥ P08(docs)     (P03 chốt phần incarnation sau báo cáo P01)
wave 2: P05
wave 3: P06 ∥ P07 ∥ P08(config + check)
wave 4: P09 (Lead)
```

Nhánh tích hợp `terminal-control/integration` (worktree `.claude/worktrees/tc-integration`); phase `terminal-control/pNN-<slug>`, worktree `.claude/worktrees/tc-pNN`. Thứ tự merge: P00 → P01 → P04 → P02 → P03 → P08 (docs) → P05 → P07 → P06 → P08 (config/check). Chủ file dùng chung: `Cargo.toml`/`Cargo.lock` gốc, contract → P00; `apps/fgos/src/main.rs` → P05; `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, docs → P08; `src/runner/dispatch/*` → P06. Không phase nào sửa `bin/fgos.mjs`, `test/test-ownership.mjs`.

**Quan hệ với plan khác:** 4.3 và 6.5 cùng sửa `registrations.mjs`, `CHANGELOG.md`, `component-boundary.md`, `reading-map.md`: plan land sau rebase (chỉ thêm dòng). 6.2 (chưa có plan) sẽ xoá phần reaper trong `cleanup.mjs`: nếu 6.2 land trước P06 thì P06 bỏ phần reaper; nếu sau thì 6.2 dùng `inspect`/`release` của terminal-control.

## Data flow

```text
herdr-round (điều phối, một process cho một nhóm)
  client.mjs: hàng promise theo groupKey
    └─ spawnSync  fgos internal terminal-control <op> --protocol 1 --json  (stdin: request JSON)
          core (Rust): allocation store  stateRoot/terminal/herdr/<incarnation>/allocations/<key>.json
            ├─ allocate: đọc hint groups/<groupKey>.json → kiểm sống → driver.layout.geometry
            │            → policy.place(...) → driver tab.create | pane.split → đo lại → link record
            ├─ launch:   marker launch-requested → driver pane.run (+ agent start nếu activity) → identity → marker launched
            ├─ send/read/inspect: driver (activity nếu có)
            └─ release:  close (kiểm incarnation trước/sau) | retain(until); marker released
          driver herdr: Command herdr (FGOS_HERDR_BIN) ; SO_PEERCRED trên socket herdr
```

## Tiêu chí xong

1. `cargo test -p fgos-terminal-control -p fgos` xanh; `cargo check -p fgos-terminal-control --target x86_64-pc-windows-msvc --target aarch64-apple-darwin` xanh; trên Windows mọi thao tác `unsupported` (unit test `cfg(windows)` hoặc driver không có herdr).
2. Vector luật 7.4 xanh trên fake herdr **và** trên herdr thật: gom tab theo `groupKey`; tab mới mở bằng pane của chính worker đầu (không root pane rỗng); neo chết → tab mới cùng nhãn; core chỉ đóng pane do nó cấp, không bao giờ đóng tab; nhãn không được đọc để quyết định.
3. Ca lỗi 7.7 có test: điều phối chết sau `allocate` (không ai đóng chỉ vì quá hạn; quét chỉ báo); `launch-requested` không `launched` → giữ; herdr server restart → record incarnation cũ vô hiệu, `inspect` trả `gone`/`unknown`, không đóng pane của incarnation mới; `retain` quá `until` chỉ đóng khi cùng incarnation và foreground không lạ.
4. Policy: fixture 352×69, 110×80, tab đầy; trên herdr thật lấp một tab tới giới hạn → pane kế tiếp mở tab mới cùng nhóm, không pane nào dưới min; driver không có `layout.geometry` → luật hôm nay (tách neo, `down`, 0.3).
5. `rg 'createHerdrClient|createBatchTab|batchTabFor|closeIfEmpty|fgos-lead-' src plugins` rỗng; `rg "'herdr'" src` chỉ còn `resolveHerdrBin` (đường binary truyền xuống route).
6. Nghiệm thu herdr thật 5 CLI (claude, codex, agy, pi, omp): một round mỗi CLI qua `fgos run` herdr, settle đủ; seat cùng nhóm vào cùng tab.
7. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`; doctor `terminal-control` pass ở ba workspace sau landing.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Viết lại `herdr-round.mjs` (2295 dòng) làm vỡ round herdr | Cao × Cao | P06 một phase một chủ; giữ fake herdr fixture; nghiệm thu herdr thật 5 CLI ở P09; rollback revert cả P05–P07 |
| Chi phí mỗi thao tác thêm một process (route) ở vòng poll `read` | TB × Thấp | Đo ở P05 (p50 route + herdr); nếu poll > 1 lần/s mỗi pane gây tải, gộp `read`+`inspect` một lời gọi |
| Khe incarnation giữa hai lần kiểm khi đóng | Thấp × TB | D1; spec nói thẳng; `unknown` = giữ |
| Hai điều phối cùng `groupKey` | Thấp × Thấp | Hai tab cùng nhãn, vô hại (r6 §7.6); trigger S5 → kind `terminal-placement` |
| Windows không có herdr | Chắc × Thấp | `unsupported` có tên; `direct` vẫn chạy |

## Rollback

Thuần code + một thư mục state mới (`stateRoot/terminal/`) chỉ là cache record. Rollback: revert merge, activate release trước; xoá `stateRoot/terminal/` được (pane đang mở không bị đóng vì record mất: không ai đóng thứ không có record). Cấu hình `terminal.*` thừa trong config vô hại với release cũ (release cũ bỏ qua khoá lạ? — **kiểm ở P08**: nếu validator của release cũ từ chối khoá lạ thì như bài học `~/.fgos/config.json` 2026-10-13, khoá chỉ ghi vào config project, không ghi global, cho tới khi mọi workspace đã activate release mới).

## Câu hỏi mở cho anh

1. **Đã chốt 2026-10-16: giữ mặc định, chuyển mọi lời gọi herdr** (nguyên tắc One Door và luật gom tùm lum). (D2) 6.5 chuyển **mọi** lời gọi herdr của Node sang terminal-control, kể cả thao tác agent (`agent start/prompt/read`), thay vì chỉ vòng đời pane. Rộng hơn r6 §11/6.5 một chút nhưng đúng "một cửa"; nếu anh muốn hẹp (chỉ allocate/launch/release, agent ops để 6.3 cùng agent-protocol) thì P06 giảm ~5 h và `herdr-agent.mjs` giữ phần agent tới 6.3.
