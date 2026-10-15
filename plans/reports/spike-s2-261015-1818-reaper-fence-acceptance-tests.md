<!-- Bản sao từ nhánh worktree-agent-a1821bf555f8d8f52 (commit a9fa1dd52). File test đỏ có chủ đích nằm ở nhánh đó: test/runner/dispatch-confinement-reaper-fence.test.mjs, chưa merge vào main. -->

# Spike S2: acceptance tests for the reaper fence (item 1a, p-c3a41d07)

## Phạm vi và kết luận ngắn

- Test file: [test/runner/dispatch-confinement-reaper-fence.test.mjs](../../test/runner/dispatch-confinement-reaper-fence.test.mjs)
- Nguồn hợp đồng: packet đã chốt `.fgos/assignments/unit-run-1792057330846-367abcd4/producer/2/runs/01/outbox/report-1.md` (item 1a (i)-(iv), ND11, ND12, S2 (1)-(8), V14/V15/V18/V20/V24/V25, T3, R12) và council report §2.1 `plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md` (hiện chỉ có trong main checkout, chưa có ở commit gốc của nhánh này).
- Chỉ thêm test, không sửa production. Chạy trên code hiện tại (HEAD `7cfad44a0`): **50 test: 22 pass, 13 fail (tất cả là regression cố ý đỏ), 15 todo**.
- Kết luận: defect p-c3a41d07 được tái hiện trên **hàm thật** (không còn chỉ là mô hình trừu tượng): reaper xoá home của worker còn sống ở 13 ca, gồm V14, RT2-1 (V18), RV3-1/RT-R1-1 (V24) và cả ma trận 4h của V15. Theo T3, 1a chưa an toàn cho đến khi 13 ca đỏ này xanh và 15 ca todo được viết thành test thật trên các seam 1a thêm vào.

## Cách test chạy

- Hàm thật: `reapOrphanedConfinementResources`, `cleanupConfinementResource`/`removeConfinementDir` (qua reaper), `markResourceRetained`, `extendOwnershipMarker`, `finalizeConfinementResources`, `defaultPaneOpen` (qua reaper khi không inject).
- Seam inject có sẵn: `checkLiveness` (controller pid sống/chết), `checkPaneOpen` (true/false/null).
- Interleaving: reaper gọi `checkLiveness` và `checkPaneOpen` **sau** lần đọc marker để quyết định và **trước** khi xoá, nên test chèn bước controller vào đó (ca (2)). Cửa sổ RT2-1 (sau lần re-read của `cleanupConfinementResource` và `stopProcessesInside`, ngay trước xoá) được chèn bằng cách bọc `fs.rmSync` một lần (cùng kiểu test hiện có bọc `fs.openSync`), khôi phục trong `finally`.
- Đồng hồ: reaper không có seam clock (`Date.now()` bên trong). Tuổi được đặt bằng cách lùi `createdAt`/`boundAt` trong marker, biên độ tính bằng phút, nên kết quả không phụ thuộc thời gian chạy.
- fs: mọi thư mục dưới `mkdtemp` riêng; worker được mô hình hoá (không có process thật trong home, `stopProcessesInside` không tìm thấy gì). Process duy nhất được spawn là script mock herdr chỉ in JSON.
- `node_modules`: worktree không có, nhưng file test và mọi import chỉ dùng module `node:*` và source nội bộ nên chạy được không cần nó. Em không tạo `node_modules` (hook `scout-block` chặn mọi lệnh Bash chứa chữ đó, em không lách hook).

## Kết quả theo từng ca

Ký hiệu: GREEN = hợp đồng đúng hôm nay và phải giữ xanh; RED = regression chứng minh defect, phải đỏ hôm nay; TODO(fn) = chạy hàm thật nhưng chỉ có nghĩa khi có 1a, báo cáo dạng todo; TODO = seam chưa tồn tại.

| Ca S2 | Test | Hôm nay |
|---|---|---|
| (1) | controller chết trước bind -> home bị reap (`process-dead`) | GREEN |
| (1) | chết sau bind, trước pane run: pane mở thì giữ, pane đóng thì reap | GREEN |
| (1) | chết sau pane run, worker còn chạy, controller như ship hôm nay (không bind vào marker) -> home phải sống | **RED** |
| (1) | chết sau pane run, marker đã bind đúng 1a(i): binder chết + pane mở -> giữ | GREEN |
| (2) | reaper đọc marker chưa bind, rồi bind + launch + controller chết trước liveness check -> home phải sống (V14) | **RED** |
| (2b) | RT2-1: reaper đã re-read giống hệt, controller bind + launch trước lúc xoá -> không được có worker đã launch mà home bị xoá | **RED** |
| (2b) | thứ tự ngược: controller bind + qua check trước, reaper sau -> phải giữ home | **RED** |
| (2b) | binder quá cửa sổ run tính từ lúc tạo thì từ chối bind | TODO |
| (2c) | marker đã bind, binder sống trong cửa sổ tính từ bind, pane null -> giữ | **RED** |
| (2c) | như trên, pane false (socket sai) -> bỏ qua, giữ | **RED** |
| (2c) | controller quá cửa sổ tạo thì từ chối bind | TODO |
| (2d) | post-launch check thấy marker/home mất hoặc có claim -> đóng pane, fail round | TODO |
| (3) | binder sống, timeout 4h, tuổi 2h / vừa quá maxAge / vừa quá timeout+grace, pane true | GREEN x3 |
| (3) | cùng 3 tuổi, pane null và pane false -> phải giữ | **RED x6** |
| (3) | binder sống nhưng quá cửa sổ bind; binder chết tuổi 2h: true giữ, null reap, false reap | GREEN x6 |
| (4) | marker retained (`retainedAt`): 5 tổ hợp pane/tuổi/liveness, kết quả như hôm nay | GREEN x5 |
| (5) | home bind đúng các field được phép -> finalize sạch | TODO(fn): đỏ hôm nay, `{"kind":"retained","reason":"ownership-marker-mismatch"}` |
| (5) | bind + thêm field lạ / đổi dispatchId / resource / createdAt -> vẫn `ownership-marker-mismatch`, home giữ | GREEN x4 |
| (5) | field bind không khớp launch record -> mismatch | TODO |
| (6) | 2 reaper khác process, resuming controller rebind, claim treo của reaper crash làm controller từ chối, takeover chỉ khi claimant chết | TODO x4 |
| (7) | control: marker retained có session tên -> reaper hỏi đúng session đó qua mock herdr, pane mở giữ, đóng thì reap | GREEN |
| (7) | round default-session (session ghi null như hôm nay) -> reaper phải hỏi herdr và giữ home khi pane mở (V24) | **RED** (mock không hề được gọi) |
| (7) | round ghi đúng endpoint client đã dùng; bản live không mock | TODO x2 |
| (8) | bind/launch-check/post-launch-check đi authority -> transport -> herdr-round cho run assignment và không assignment; bind fail đóng pane trước pane run; round unconfined không nhận hàm bind | TODO x4 |

### Output thật của `node --test`

Lệnh: `node --test --test-reporter=spec test/runner/dispatch-confinement-reaper-fence.test.mjs` (exit 1, đúng mong đợi vì có regression đỏ).

```text
✔ S2(1) controller killed before binding: no pane, no worker -> the home is reaped
✔ S2(1) controller killed after binding, before pane run: kept while the (empty) pane is open, reaped once it closes
✖ S2(1) REGRESSION controller killed after pane run, worker alive in its pane: the home must survive (p-c3a41d07)
✔ S2(1) controller killed after pane run, home bound as 1a(i) specifies: the dead binder's home is kept while its pane is open
✖ S2(2) REGRESSION reaper reads the unbound marker, then bind + launch + controller death before its liveness check: the home must survive (V14)
✖ S2(2b) REGRESSION RT2-1: controller binds and launches after the reaper's identical re-read and before deletion; never a launched worker whose home is removed
✖ S2(2b) REGRESSION mirrored order: controller binds and passes its check first, the reaper comes after and must keep the home
✔ S2(2b) a binder whose home is past its creation-anchored run window refuses to bind ... # TODO
✖ S2(2c) REGRESSION bound marker, binder alive inside its bind-anchored window, pane answer null: the home is kept (RV3-1 / RT-R1-1 case1A, case1B)
✖ S2(2c) REGRESSION same, pane answer false (wrong or other server's socket): ignored inside the window, the home is kept
✔ S2(2c) a controller already past the creation-anchored window refuses to bind ... # TODO
✔ S2(2d) a launch whose post-launch check finds the marker or home gone ... # TODO
✖ S2(3) REGRESSION binder alive, timeout 4h, age 2h, pane answer null: kept inside the bind-anchored window
✔ S2(3) binder alive, timeout 4h, age 2h, pane answer true: kept inside the bind-anchored window
✖ S2(3) REGRESSION binder alive, timeout 4h, age 2h, pane answer false: kept inside the bind-anchored window
✖ S2(3) REGRESSION binder alive, timeout 4h, just past maxAgeMs, pane answer null: kept inside the bind-anchored window
✔ S2(3) binder alive, timeout 4h, just past maxAgeMs, pane answer true: kept inside the bind-anchored window
✖ S2(3) REGRESSION binder alive, timeout 4h, just past maxAgeMs, pane answer false: kept inside the bind-anchored window
✖ S2(3) REGRESSION binder alive, timeout 4h, just past timeout + settle grace, pane answer null: kept inside the bind-anchored window
✔ S2(3) binder alive, timeout 4h, just past timeout + settle grace, pane answer true: kept inside the bind-anchored window
✖ S2(3) REGRESSION binder alive, timeout 4h, just past timeout + settle grace, pane answer false: kept inside the bind-anchored window
✔ S2(3) binder alive, past its bind-anchored window, pane answer true: kept per (iii)
✔ S2(3) binder alive, past its bind-anchored window, pane answer null: reaped per (iii)
✔ S2(3) binder alive, past its bind-anchored window, pane answer false: reaped per (iii)
✔ S2(3) binder dead, age 2h, pane answer true: kept per (iii)
✔ S2(3) binder dead, age 2h, pane answer null: reaped per (iii)
✔ S2(3) binder dead, age 2h, pane answer false: reaped per (iii)
✔ S2(4) retained marker, pane open, past expiry: kept (unchanged from today)
✔ S2(4) retained marker, pane open, binder alive: kept (unchanged from today)
✔ S2(4) retained marker, pane unanswerable, not expired: kept (unchanged from today)
✔ S2(4) retained marker, pane unanswerable, expired: reaped (unchanged from today)
✔ S2(4) retained marker, pane closed, not expired, binder alive: reaped (unchanged from today)
⚠ S2(5) a home bound with exactly the authorized fields finalizes and is cleaned # needs 1a(iv): ...
✔ S2(5) bound home whose marker also carries an unauthorized new field: still ownership-marker-mismatch, home kept
✔ S2(5) bound home whose marker also carries a changed dispatchId: still ownership-marker-mismatch, home kept
✔ S2(5) bound home whose marker also carries a changed resource kind: still ownership-marker-mismatch, home kept
✔ S2(5) bound home whose marker also carries a changed createdAt: still ownership-marker-mismatch, home kept
✔ S2(5) a bound marker whose binding fields disagree with the launch record ... # TODO
✔ S2(6) two reaper passes from different processes against one home ... # TODO
✔ S2(6) a resuming controller rebinds with its own pid before its launch check ... # TODO
✔ S2(6) a stale claim left by a reaper that crashed after claiming makes the controller refuse launch ... # TODO
✔ S2(6) a later pass takes over a stale claim only once its recorded claimant pid is provably dead ... # TODO
✔ S2(7) control: a retained home whose session is named is asked on that session and follows the pane (mock herdr)
✖ S2(7) REGRESSION default-session round (HERDR_SESSION unset, recorded as null today): the reaper asks herdr on that endpoint and keeps the home while the pane is open (V24)
✔ S2(7) runHerdrRound records the herdr endpoint its client actually used ... # TODO
✔ S2(7) live, not mocked: defaultPaneOpen against the endpoint recorded for a real default-session pane ... # TODO
✔ S2(8) an assignment confined herdr-spawn dispatch hands bind, launch-check and post-launch-check ... # TODO
✔ S2(8) a NON-assignment confined dispatch (no runId / launchCommandId) still calls bind before pane run ... # TODO
✔ S2(8) a bind failure or refusal closes the pane and fails the round before pane run ... # TODO
✔ S2(8) an unconfined round has no home and is handed no bind function ... # TODO
ℹ tests 50
ℹ pass 22
ℹ fail 13
ℹ todo 15
```

Mọi ca đỏ đều đỏ ở đúng assertion hợp đồng (home bị xoá: `actual: false, expected: true`; ca (7): "the reaper never asked herdr"), không phải lỗi phụ. Ca RT2-1 còn assert tiền điều kiện `reaped[0].reason === 'expired'` và tiền điều kiện đó qua.

## Seam 1a phải thêm (cho các ca TODO và để các ca RED chuyển xanh)

1. **bind** theo từng home do Confinement Authority cấp (cạnh `prepared.retain` ở `drivers/bwrap.mjs:563`), truyền qua `adapterOpts` (`authority.mjs:1089-1139`, hiện không có field này) và `herdrSpawnInteractiveAdapter` (`transport.mjs`) vào `runHerdrRound`; gọi tại pre-run site `herdr-round.mjs:1877-1905` **ngoài** `if (isAssignmentRun)` (`:1889`). Ghi atomic `paneId`, endpoint herdr thật, pid binder, `boundAt`; từ chối khi home quá cửa sổ run tính từ lúc tạo. Ca cần: (1) regression, (2b), (2c) controller, (7) endpoint, (8).
2. **launch-check**: không có claim, marker đã bind còn đó với pid của chính mình, còn trong launch grace tính từ `boundAt`. Ca cần: (2b), (6).
3. **post-launch-check** gọi sau `pane run`: mất marker/home hoặc có claim -> đóng pane, fail round. Ca cần: (2d).
4. **reclaim claim** độc quyền (O_EXCL hoặc CAS) có claimant pid + start time + `claimedAt`, claim-rồi-re-read trong **mọi** đường xoá, takeover khi claimant chết, với một seam inject liveness của claimant (hiện `isProcessAlive` là hàm nội bộ, chỉ inject được qua `checkLiveness` vốn dành cho controller). Ca cần: (2), (6).
5. **Luật reaper (iii)**: marker có `paneId`, không có `retainedAt`, binder sống -> giữ tới `boundAt + max(maxAgeMs, launchGrace + runTimeout + settleGrace)` bất kể pane trả lời gì. Ca cần: (2c), (3).
6. **defaultPaneOpen hỏi endpoint đã ghi** (socket path), kể cả khi không có session tên. Ca cần: (7).
7. **Finalizer (iv)**: tập field đóng được phép thay đổi sau prepare, khớp launch record. Ca cần: (5).
8. **Seam đồng hồ** cho reaper (tuỳ chọn, khuyến nghị): test hiện lùi timestamp trong marker, đủ tất định với biên phút, nhưng `launchGrace` nhỏ (giây) sẽ cần clock inject để test biên chính xác.

Hai điểm swap trong file test, 1a chỉ cần sửa ở đây:

- `controllerAsShippedToday` (bind no-op, launch luôn được phép, không post-check) mô tả đúng production hôm nay; thay bằng các hàm seam 1-3 để (1)/(2b) chuyển xanh.
- `writeBindingFixture` ghi các field `paneId`, `herdrEndpoint`, `pid`, `boundAt`. Packet không đặt tên field endpoint; tên `herdrEndpoint` là giả định của em. 1a dùng tên này hoặc sửa đúng helper này.

## Chỗ code thật khác hoặc rộng hơn mô tả của council

1. **Có 4 đường gọi reaper, không phải 2.** V22 kể `run.mjs:315` và `cli.mjs:1230`; còn `loop.mjs:1443` (runner khởi động) và `setup/registrations.mjs:5446` (doctor fix). Item 1a (ii) nói "mọi đường xoá" nên không mâu thuẫn, nhưng danh sách phải đủ 4 khi implement.
2. **`cli.mjs:1230-1233` không xét như sweep thường, trái với comment ngay trên nó.** Lượt reap sau probe inject `checkPaneOpen: (paneId) => closedPanes.has(paneId) ? false : null`, tức trả `null` cho **mọi** pane khác. Một home retained có session tên, pane vẫn mở, đã quá maxAge sẽ bị lượt này xoá (null + expired), trong khi sweep thường hỏi herdr và giữ nó. Đây là defect có sẵn, cùng loại với ND11 ("pane mở chứng minh được thì giữ home retained"). Em ghi nhận, không sửa (ngoài phạm vi).
3. **Tên field endpoint chưa được chốt** trong 1a(i)/(iv) ("the herdr endpoint field(s)"). Test cần một tên cụ thể.
4. Các mô tả khác được xác nhận đúng trên code thật: re-read trong `cleanupConfinementResource` chỉ kiểm hợp lệ + dispatchId (V14); `markResourceRetained` bỏ session null và `defaultPaneOpen` trả null khi thiếu session (V24, ca (7) chứng minh mock herdr không hề được gọi); digest của finalizer chỉ loại trừ `credentialKept` (V16, ca (5) todo đỏ đúng `ownership-marker-mismatch`); ma trận V15 tái hiện ở (3).

## Câu hỏi mở

1. **Mốc của "just past timeout+grace" ở S2 (3).** Packet không nói tính từ lúc tạo hay từ `boundAt`. Em tính từ lúc tạo, với `boundAt = createdAt + 1 phút`, nên điểm này nằm trong cửa sổ bind với mọi launch grace >= 0. Nếu ý council là tính từ `boundAt` và launch grace = 0 thì điểm đó nằm ngoài cửa sổ và kỳ vọng sẽ khác.
2. **Giá trị launch grace.** Ca "quá cửa sổ bind" giả định launch grace < 1h (packet gọi là "short"). 1a cần một hằng số export để test biên chính xác.
3. **Ca (1) "chết sau bind, trước pane run".** Em kỳ vọng theo R5: giữ khi pane (rỗng) còn mở, reap khi pane đóng. Nếu chủ muốn reap ngay (không có worker) thì cần thêm phân biệt bound-chưa-launch, và hiện không có field nào thể hiện điều đó.
4. **Ca (7) live.** Bản không mock (pane default-session thật) để todo vì bộ test tất định không gọi herdr thật. Cần một lượt chạy live riêng khi có 1a.
5. **Defect `cli.mjs:1232`** (mục 2 ở trên) có cần mở thành một item riêng không? Theo RUL11 em đề xuất ghi item riêng.
