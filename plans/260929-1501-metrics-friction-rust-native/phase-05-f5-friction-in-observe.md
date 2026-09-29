---
phase: F5
title: "Friction trong Observe: writer Rust duy nhất, mọi component ghi qua CLI hoặc lib"
status: completed
priority: P1
effort: "2d"
dependencies: [F1]
---

# Phase F5: Friction thuộc Observe (mốc M3)

<!-- Updated: Validation Session 3 - Rust single writer, Node gọi host, migration lười trong writer -->

## Overview
Friction rời khỏi event log của Work và trở thành dữ liệu của Observe, với subject tổng quát. **Chỉ có một writer**: `fgos_observe::friction` (Rust).
- **Component Node, skill, agent và ngôn ngữ khác:** ghi qua CLI `fgos friction record|resolve`.
- **Component Rust chạy trong host:** gọi thẳng thư viện, cùng hàm mà CLI bọc lại.

Work là người dùng đầu tiên.

## Requirements
- **Contract `observe.friction` v1**, store tracked, shard theo writer: `.fgos/observe/friction/<writerId>.jsonl`, append-only (anh chốt; helper `shard.rs` của F1). <!-- Red Team 2026-09-29 -->
  ```json
  {"v":1,"type":"migration","from":"work.friction","count":752,"resolved":N,"ts":"…"}
  {"v":1,"type":"friction-recorded","ts":"…","subject":{"kind":"work","id":"tsk-x"},"layer":"verification","errorClass":"verify-miss","disposition":"advisory","detail":"…","attempts":1,"docType":null,"producer":"runner.loop"}
  {"v":1,"type":"friction-resolved","ts":"…","subject":{"kind":"work","id":"tsk-x"},"reason":"answer|done|wontfix|clarify-pass|migrated","by":"work"}
  ```
- **Writer duy nhất (Rust, `packages/observe/rust/src/friction.rs`):**
  - `record(root, FrictionInput) -> Result<RecordId>` và `resolve(root, subject, reason, by) -> Result<()>`.
  - Validate: subject kind hợp lệ, `id` không rỗng, `layer` thuộc tập đã công bố.
  - Ghi bằng `O_APPEND` cộng `fsync`, dưới store lock của F1 (`store_lock.rs`: pid + startTime, giành lại khi holder chết). <!-- Red Team 2026-09-29 -->
  - <!-- Red Team 2026-09-29 --> Mỗi record ghi thêm `caller: {pid, sessionId}` lấy thật từ process (bên cạnh `by`/`producer` do caller tự khai), để audit `resolve`. CLI `resolve` vẫn giữ (Session 3 đã chốt Node gọi qua CLI).
  - Luật unsettled: record R là unsettled nếu không có `friction-resolved` nào cùng subject với `ts > R.ts`.
  - Luật rank (port từ `src/evolve/candidates.mjs`): `score = số record unsettled × 2`; attribution lấy từ record mới nhất; sắp `score` giảm dần, hoà thì theo subject id tăng dần.
- **CLI (vỏ mỏng bọc lib):**
  ```text
  fgos friction record  --subject work:tsk-x --layer <l> --error-class <c> --disposition <d> --producer <mod> [--attempts N] [--doc-type T] (--detail "<…>" | --detail-stdin)
  fgos friction resolve --subject work:tsk-x --reason answer|done|wontfix|clarify-pass --by <component>
  fgos friction list [--kind …] [--layer …] [--since]
  fgos friction show <kind:id>
  fgos friction rank [--limit N]
  ```
  `record` và `resolve` là **cửa dành cho component**, được ghi rõ trong spec là API máy (không dành cho người). Text `detail` dài hoặc có ký tự đặc biệt đi qua stdin.
- **Migration lười, nằm ngay trong writer (single path, không có lệnh hay fix riêng):**
  - <!-- Red Team 2026-09-29 --> Mỗi lần writer mở store, nó import những `work.friction` và settlement **mới hơn cursor** từ **legacy friction source**. Cursor là `(src, seq)` cao nhất đã import cho từng shard event, ghi trong record `migration`. Lý do: bản cũ vẫn ghi `work.friction` sau lần migrate đầu (shim M1 trước khi re-stage, clone khác, cài global ở project khác), và các event đó không được mất. Reader không migrate, chỉ writer (giữ lock).
  - Source này do Work cung cấp trong `packages/work-state/rust`, implement trait `LegacyFrictionSource` **định nghĩa trong `fgos-observe::contract`** <!-- Red Team 2026-09-29 -->, đọc `work.friction` cùng settlement lịch sử (`answer`, `→ done`, `clarify-pass`, `→ wontfix`) từ event log và các shard. Composition root truyền nó vào, nên Observe không phụ thuộc work-state.
  - <!-- Red Team 2026-09-29 --> Các record import và record `migration` (có cursor mới) được ghi thành một lô: ghi ra `…/<writerId>.jsonl.tmp`, fsync, rồi append nguyên lô dưới lock. Record import mang `legacy: {src, seq}`; lần mở sau bỏ qua `(src, seq)` đã có, nên crash giữa chừng không tạo bản trùng.
- **Work dùng cửa ghi:**
  - Xoá `addFriction()` trong `src/state/store.mjs`.
  - <!-- Red Team 2026-09-29 --> Chỗ gọi lấy từ grep, không ước lượng: `grep -rn addFriction src bin` hiện ra 44 hit trong 8 file, gồm cả `src/verbs/merge/review.mjs`, `src/state/cleanup-harness.mjs`, `src/state/retrospective-doors.mjs` (plan cũ bỏ sót), cộng test harness re-export (`test/cli/helpers/fgos-cli-harness.mjs:19,1177`) và 6 file test. Ghi danh sách đầy đủ vào report F5 trước khi sửa. Tất cả đổi sang `recordFriction()` trong `src/observe/friction-client.mjs`. Hàm này là client mỏng gọi `invokeHost(['friction','record',…], {input: detail})` của F1, với `subject: work:<id>` và `producer` là tên module. Client không tự ghi file.
  - `moveWork` gọi `resolveFriction` khi có `answer`, khi `to === 'done'`, và khi `to === 'wontfix'`.
  - `moveStage` gọi `resolveFriction` với reason `clarify-pass` khi rời discovery với verdict rõ ràng (cùng điều kiện với `replay.mjs:465-478`).
  - <!-- Red Team 2026-09-29 --> **Lỗi ghi friction là kênh phụ, best-effort:** `recordFriction`/`resolveFriction` không bao giờ đổi kết quả chính của `approve`/`sync-root`/`loop` (tại các chỗ gọi, state đã đổi rồi: `approve.mjs:393-403,488-498`, `loop.mjs:1239-1250`). Lỗi (`host-unavailable`, `host-version-mismatch`, `observe-lock-timeout`, spawn fail) được ghi thành một dòng vào `.fgos/logs/invocation-faults.jsonl` với `faultClass: friction-write-failed` và mã lỗi, và in cảnh báo stderr. Lỗi validate (input sai do lập trình) vẫn ném, để test bắt được.
  - <!-- Red Team 2026-09-29 --> `resolveFriction` từ `moveWork`/`moveStage` chạy **sau khi nhả events lock** (sau commit event), không bao giờ spawn host trong khi đang giữ `withEventsLockAndRefresh` (`store.mjs:1826`).
- **Work ngừng fold friction:** bỏ `case 'work.friction'` và `view.frictions` trong `src/state/replay.mjs`. `view.settlements` giữ nguyên, vì là khái niệm riêng của Work.
  - <!-- Red Team 2026-09-29 --> **Giữ `'work.friction'` trong `SIDE_LOG_ONLY_EVENT_TYPES`** (`store.mjs:971-978`): event lịch sử và event từ bản cũ vẫn tồn tại, bỏ đi thì `settleClaim` coi là drift.
  - <!-- Red Team 2026-09-29 --> **`composeLearning` bỏ hẳn `learning.frictions`** (`store.mjs:480`, stamp vào event đóng ở `:880`); không gọi host trong lock. Test `test/cli/fgos-read-4.test.mjs:481` sửa có chủ đích. Output `list`/`show` bỏ mục `frictions` (`src/verbs/state/read.mjs:103,161`). Đây là thay đổi contract, ghi decision ở F8.
  - <!-- Updated: Validation Session 5 - Work ngừng đọc friction --> **Luật: Work không đọc friction.** Sau F5, Work chỉ còn hai vai trò với Observe: ghi (`recordFriction`) và resolve khi đổi trạng thái. Mọi chỗ Work đang đọc friction (`composeLearning`, `list`/`show`, `item-trace`, entropy) đều bị bỏ, không thay bằng lời gọi host. Muốn xem friction của một item thì dùng `fgos friction show work:<id>` (Observe).
- **Consumer cũ:**
  - Xoá verb `evolve`. <!-- Red Team 2026-09-29 --> Vòng self-improve (anh chốt): `fgos friction rank` để chọn, rồi `fgos submit` để tạo item. Observe không gọi ngược Work. Sửa `test/e2e/self-improve-loop.test.mjs` (`:16,86,175-176`) theo luồng mới. `--pick` được thay bằng `friction show <kind:id>`.
  - <!-- Updated: Validation Session 5 - F5 sửa thẳng entropy.mjs --> Bỏ mục friction và `friction-unsettled` khỏi `check`/entropy **ngay trong `src/report/entropy.mjs`**. Không cần cờ tạm: F7 phụ thuộc F6, F6 phụ thuộc F5, nên F7 luôn chạy sau F5 và xoá file này sau.
  - `src/report/item-trace.mjs` bỏ phần friction.
- Friction implement `ObservationSource` (source `friction`) cho scorecard F4.

## Related Code Files
- Create:
  - `packages/observe/rust/src/friction.rs` (lib, luật, migration lười)
  - `packages/work-state/rust/src/legacy_friction.rs` (`LegacyFrictionSource`)
  - `src/observe/friction-client.mjs` (client mỏng qua `invokeHost`)
  - test Rust (luật, lock, migration idempotent, record/resolve), test Node (client cộng các chỗ gọi, qua host thật), `test/rust-host/friction-parity.test.mjs`
- Modify:
  - `src/state/store.mjs` (xoá `addFriction`; resolve trong `moveWork`/`moveStage`), `src/state/replay.mjs` (bỏ fold)
  - `src/runner/loop.mjs`, `src/verbs/merge/approve.mjs`, `src/verbs/merge/sync-root.mjs`, `bin/fgos.mjs` (các chỗ gọi; xoá `evolve`)
  - `src/report/entropy.mjs` (bỏ phần friction), `src/report/item-trace.mjs`, `src/verbs/state/read.mjs`, `src/verbs/merge/review.mjs`, `src/state/cleanup-harness.mjs`, `src/state/retrospective-doors.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`, `test/e2e/self-improve-loop.test.mjs`, `test/test-ownership.mjs` (bỏ `candidates.mjs`) <!-- Red Team 2026-09-29 -->
  - `src/cli/command-registry.mjs` (xoá `evolve`), `packages/host-runtime/contracts/command-routes.json`
  - `apps/fgos/src/wiring/friction_sources.rs` (nối `LegacyFrictionSource`; làn B) <!-- Session 4: file theo làn -->
  - `docs/specs/observe.md` (cửa ghi, contract, migration), `docs/specs/work-state.md` (Work không còn sở hữu friction), authority map §6–7 (Observe là owner; cạnh `* → fgos friction record/resolve`)
- Delete: `src/evolve/candidates.mjs` cùng test tương ứng

## Implementation Steps
1. **Trước mọi thay đổi**: lưu output đầy đủ của `node bin/fgos.mjs evolve` (qua `--limit`/`--cursor` cho hết trang) làm mốc parity.
2. Chạy gitnexus `impact` cho `addFriction`, `moveWork`, `moveStage`, `rebuildView`; báo blast radius. Nếu HIGH hoặc CRITICAL thì dừng lại báo anh.
3. Viết `friction.rs` (lib + CLI), `LegacyFrictionSource`, rồi nối trong composition root. Test migration trên một **bản copy** của `.fgos` thật: `friction rank` so với mốc, chênh lệch cho phép **chỉ** gồm các id `wontfix`.
4. Viết `friction-client.mjs`, chuyển các chỗ gọi, thêm resolve, bỏ fold, sửa consumer cũ.
5. Merge F5, rồi re-stage (quy trình F3). Backup `.fgos/events*`, `.fgos/cache/state.json`, `.fgos/observe/`. Chạy `fgos friction record` đầu tiên trên store thật (writer migrate), `fgos friction rank` so với mốc, rồi `npm test` và `cargo test --workspace`. <!-- Red Team 2026-09-29 -->

## Success Criteria
- [x] Parity rank chỉ chênh đúng các id `wontfix`, và danh sách chênh lệch được ghi ra.
- [x] `grep -rn "addFriction" src bin test` không còn gì. `work.friction` chỉ còn ở `legacy_friction.rs`, `SIDE_LOG_ONLY_EVENT_TYPES` và `scripts/measure-verify-cost.mjs:74`. <!-- Red Team 2026-09-29 -->
- [x] <!-- Red Team 2026-09-29 --> `approve` gặp merge conflict khi không có host: kết quả vẫn là `blocked` kèm `reason`/`conflictedFiles`, và có một dòng `friction-write-failed` trong `invocation-faults`.
- [x] <!-- Red Team 2026-09-29 --> `work.friction` do bản cũ ghi sau lần migrate đầu được import ở lần mở kế tiếp; crash giữa lô import không tạo bản trùng.
- [x] <!-- Red Team 2026-09-29 --> Ghi friction từ một worktree đi vào store của main checkout.
- [x] Không file Node nào ghi vào `.fgos/observe/` (test quét source).
- [x] <!-- Updated: Validation Session 5 - Work ngừng đọc friction --> Không file Node nào của Work đọc friction: `grep -rn "frictions" src/state src/verbs src/report` không còn chỗ đọc.
- [x] Mở store lần hai không import lại những `(src, seq)` đã có.
- [x] Friction tạo trong test được resolve khi item sang `wontfix`.
- [x] Một test gọi `fgos friction record` từ shell (giả lập component ngôn ngữ khác) ghi được, và `friction show` đọc lại được.

## Risk Assessment
- **Blast radius ở Work core** (`store.mjs`, `replay.mjs`). `backward-compat.test` đang khoá fold lịch sử; cập nhật fixture có chủ đích và ghi lý do.
- **Chi phí spawn host mỗi lần ghi friction.** Friction hiếm (khoảng 750 bản ghi trong 2 tháng) nên chấp nhận được. Dấu hiệu sai: `approve` hoặc `loop` chậm rõ rệt. Cách xử lý: đo trước và sau, và báo lại nếu vượt 100 ms mỗi lần gọi.
- **Migration lười chạy khi có phiên khác đang ghi `.fgos`.** Lock của store observe chỉ bảo vệ file của nó. Import theo cursor `(src, seq)` và dedupe theo `legacy`, nên event Node append song song sẽ được lấy ở lần mở sau, không mất. Chạy lần đầu ở bước 5 sau khi đã backup. <!-- Red Team 2026-09-29 -->
- <!-- Red Team 2026-09-29 --> **Shim M1 còn payload cũ (vẫn gọi `addFriction`).** Re-stage (quy trình F3) **ngay khi merge F5**, trước khi chạy migration trên store thật ở bước 5. Event cũ lọt qua vẫn được cursor bắt.
