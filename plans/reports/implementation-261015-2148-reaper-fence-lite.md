# Reaper fence, lite scope (council item 1a, parts i, iii, iv + V14 re-read)

## Phạm vi

- Nguồn hợp đồng: council packet item 1a (i)-(iv), ND11, V14, V24 và [council report §2.1](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md); phạm vi lite do chủ duyệt; acceptance tests S2 ([report](spike-s2-261015-1818-reaper-fence-acceptance-tests.md)).
- Ngoài phạm vi (để cho run supervisor + holder-lock): part (ii) — từ chối bind khi home quá cửa sổ run tính từ lúc tạo, launch check, post-launch check, claim reap độc quyền + tiếp quản claim của claimant đã chết.
- Bổ sung từ Lead trong lúc làm: round cli-spawn confined cũng được bind, vào run supervisor tách rời.

## Đã thay đổi

| File | Thay đổi |
|---|---|
| [cleanup.mjs](../../src/runner/dispatch/confinement/cleanup.mjs) | `bindOwnershipMarker`, `markOwnershipLaunched` (ghi atomic), `LAUNCH_GRACE_MS` = 2 phút, `OWNERSHIP_BINDING_FIELDS`; luật reaper mới cho marker đã bind; đọc lại marker trước khi xoá (khác thì bỏ qua với lý do `marker-changed`); `defaultPaneOpen`/`paneOpenUnlessClosed` hỏi theo endpoint đã ghi; seam `closePane`; liveness mặc định kiểm cả start time |
| [worker-session.mjs](../../src/runner/dispatch/worker-session.mjs) | `herdrEndpointForEnv` (socket path trong env của client, rồi socket của session có tên, rồi socket herdr tự rơi về; không bao giờ đoán tên session), `envForEndpoint` |
| [drivers/bwrap.mjs](../../src/runner/dispatch/confinement/drivers/bwrap.mjs) | `bind` / `markLaunched` cho mọi home đã cấp, cạnh `retain` |
| [authority.mjs](../../src/runner/dispatch/confinement/authority.mjs) | `bindingForPrepared`; `adapterOpts.confinementBinding`; finalizer bỏ qua đúng `OWNERSHIP_BINDING_FIELDS` + `credentialKept` khi so digest, mọi thay đổi khác vẫn là `ownership-marker-mismatch` |
| [transport.mjs](../../src/runner/dispatch/transport.mjs) | truyền `confinementBinding` vào `runHerdrRound`; `bindConfinedHomesToSupervisor` gọi ngay khi supervisor cli-spawn khởi động |
| [herdr-round.mjs](../../src/runner/dispatch/herdr-round.mjs) | với mọi round confined (ngoài `isAssignmentRun`): `bind` trước `pane run` (lỗi thì đóng pane, fail `confinement-bind-failed`), `markLaunched` ngay trước `pane run` hoặc khi resume thấy worker đã chạy |
| [assignment-runner.mjs](../../src/runner/dispatch/assignment-runner.mjs) | bind home với supervisor cli-spawn ở site khởi động supervisor của assignment |
| [registrations.mjs](../../src/setup/registrations.mjs) | doctor `countDeadOwnedConfinementDirs` xét binder của home đã bind, không báo nhầm home của supervisor còn sống |
| [confinement-authority.md](../../docs/specs/confinement-authority.md) §8.6, [CHANGELOG](../../CHANGELOG.md) | mô tả binding, luật reaper, phần còn thiếu |

Luật reaper (marker có `boundAt`, chưa `retainedAt`):

1. Binder (pid + start time) còn sống và `now <= boundAt + max(maxAgeMs, LAUNCH_GRACE_MS + runTimeout + RUN_SETTLE_GRACE_MS)` → giữ, bất kể pane trả lời gì.
2. Ngược lại: không có pane (cli-spawn) → dọn (`process-dead` / `expired`); có pane, binder chết, không có `launchedAt` → dọn và đóng pane rỗng (`bound-never-launched`); còn lại hỏi pane trên endpoint đã ghi: true giữ, null theo luật hết hạn (OQ2 = xoá), false dọn.
3. Marker `retainedAt`: luật pane như cũ. Marker chưa bind: luật cũ.

Một lựa chọn em tự quyết: `launchedAt` được ghi **ngay trước** khi gửi `pane run`, không phải sau. Ghi sau thì nếu controller chết giữa `pane run` và lúc ghi, home có worker đang chạy nhưng thiếu `launchedAt` và sẽ bị xoá — đúng lỗi đang sửa. Ghi trước giữ đúng ý chủ: thiếu `launchedAt` chứng minh chưa có worker nào được launch; trường hợp ngược (có `launchedAt` mà `pane run` hỏng) chỉ làm home theo luật pane, phía an toàn.

Bốn call site reaper (`run.mjs:315`, `cli.mjs:1230` qua `paneOpenUnlessClosed`, `loop.mjs:1443`, `setup/registrations.mjs` doctor fix) đều nhận luật mới vì luật nằm trong `reapOrphanedConfinementResources`; `paneOpenUnlessClosed` đã chuyển tiếp endpoint.

## Ca S2 trước / sau

Trước: 50 test, 22 pass, 13 fail, 15 todo. Sau: 58 test, 48 pass, 0 fail, 10 todo.

| Ca | Trước | Sau |
|---|---|---|
| (1) chết trước bind | GREEN | GREEN |
| (1) chết sau bind, trước pane run | GREEN (giữ khi pane mở) | đổi kỳ vọng theo chủ: dọn ngay + đóng pane rỗng (GREEN); thêm ca binder sống chưa launch → giữ |
| (1) REGRESSION chết sau pane run | RED | GREEN (controller thật: bind + launch record) |
| (1) bind đúng 1a(i), binder chết, pane mở | GREEN | GREEN |
| (2) REGRESSION V14 | RED | GREEN (re-read) |
| (2b) REGRESSION RT2-1 | RED | todo — part (ii) |
| (2b) REGRESSION thứ tự ngược | RED | GREEN |
| (2b)/(2c) từ chối bind quá cửa sổ, (2d) post-launch check | todo | todo — part (ii) |
| (2c) REGRESSION null / false | RED x2 | GREEN x2 |
| (3) REGRESSION binder sống trong cửa sổ, pane null/false | RED x6 | GREEN x6 |
| (3) binder sống quá cửa sổ / binder chết | GREEN x6 | GREEN x6 |
| (4) retained | GREEN x5 | GREEN x5 |
| (5) đúng field binding → finalize sạch | todo(fn) | GREEN; thêm ca binding cli-spawn và ca sửa `pid` → mismatch |
| (5) field lạ / dispatchId / resource / createdAt | GREEN x4 | GREEN x4 |
| (5) field binding lệch launch record | todo | todo — ngoài phạm vi lite (iv) |
| (6) controller resume rebind, reaper bỏ qua khi đọc lại | todo | GREEN |
| (6) hai reaper, claim treo, tiếp quản claim | todo x3 | todo x3 — part (ii) |
| (7) control session có tên | GREEN | GREEN |
| (7) REGRESSION default-session | RED | GREEN (sửa fixture: bind ghi endpoint trước rồi mới retain, như production) |
| (7) endpoint client thật sự dùng | todo | GREEN (unit `herdrEndpointForEnv` + round thật qua adapter) |
| (7) live herdr | todo | todo — cần herdr thật |
| (8) round không assignment bind trước pane run, ngoài guard | todo | GREEN (adapter thật + mock herdr) |
| (8) bind lỗi → đóng pane, không pane run | todo | GREEN |
| (8) round unconfined không nhận hàm bind | todo | GREEN (`bindingForPrepared`) |
| (8) launch-check / post-launch-check được truyền vào | todo | todo — part (ii) |
| (9) mới: cli-spawn, controller chết + supervisor sống → giữ; supervisor chết → dọn; quá cửa sổ → dọn; pid bị tái dùng → chết; bind lỗi không dừng run | — | GREEN x4 |

## Kiểm chứng

- `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID node --test` trên S2 + các file confinement/herdr/transport/cleanup/credential/import-graph/doctor: 485 test, 474 pass, 0 fail, 1 skipped, 10 todo.
- Các file assignment/dispatch (cli-spawn supervisor, executeAssignment, reconcile): 786 test, 786 pass.
- Chưa chạy `npm test` toàn bộ (Lead chạy).
- GitNexus index cũ; impact lấy bằng grep + đọc call site.

## Còn mở cho run supervisor + holder-lock

1. Part (ii): từ chối bind khi home đã quá cửa sổ run tính từ lúc tạo; launch check (không có claim, marker của mình còn đó, trong launch grace); post-launch check. Không có nó, khe RT2-1 vẫn còn: reaper đã đọc lại marker giống hệt, controller sống-nhưng-quá-hạn bind + launch ngay trước `rmSync`.
2. Claim reap độc quyền + tiếp quản claim của claimant đã chết (hai reaper khác process).
3. So field binding với launch record ở finalizer (ca (5) todo).
4. Cli-spawn bind sau khi supervisor đã chạy: ghi lỗi chỉ báo `confinement-bind-failed`, home giữ hành vi cũ (gắn với controller). Đây là chỗ supervisor tương lai nên tự bind trước khi spawn worker.
5. Đồng hồ: reaper chưa có seam clock; test dùng biên phút.
