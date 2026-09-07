# Dispatch Visibility V0 — interactive agent, quan sát được, không cần contact

Status: DONE — all 7 phases complete; the V0 definition of done is met on all 8 items | Created: 2026-09-06 | Owner: maintainer
Execution track: `dispatch-visibility-v0`
Design source: [Visibility và Interactive Contact](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md) (§8b.1 mức V0, §11 recommendation, §12b–§12c evidence)

## Read this first

Bản plan này thi hành **Family B** ở mức **V0**: Dispatch sở hữu lifecycle truth,
herdr là transport cộng failure detector, receipt là file do chính worker ghi.
**Không** có verb `contact` trong V0 — shape của nó được khoá trong tài liệu thiết kế
để V1 không phải làm lại, nhưng không code gì.

Ba nguyên tắc không được vi phạm ở bất kỳ phase nào:

```txt
1. Dispatch sở hữu lifecycle truth. Pane, pid, agent_session là binding, mất được, rebind được.
2. Visibility và contact là capability riêng, mechanism không hỗ trợ thì refuse có type.
3. Interactive vẫn đi qua cùng Assignment → Run → RunResult. Không có đường herdr riêng.
```

Luật đã re-scope làm nền cho track này: decision **"RUL40 re-scope"** (scope `runner`,
`supersedes:d3dbe7f5`, 2026-09-06) — herdr không bao giờ là truth hay receipt, nhưng
agent API của nó được dùng làm transport và failure detector.

## Vì sao V0 tồn tại

`herdrSpawnInteractiveAdapter` hôm nay không dùng được cho prompt thật: nó nhét prompt
vào command line rồi để `herdr pane run` gõ như keystroke, nên mọi prompt nhiều dòng
đều hỏng argv (F3). Nó cũng đọc `agent_status` làm tín hiệu hoàn thành duy nhất, thứ đã
sai hai lần đo được: false idle lúc khởi động và dip giữa turn khoảng 25%. Vì vậy
`capabilities.fgos-coding-implement.prefer` đã bị revert về `agy-cli` và interactive
dispatch thực tế đang chết.

P6 (2026-09-06, agent claude thật) đã chứng minh hình dạng thay thế chạy được end-to-end.
V0 là đưa hình dạng đó vào sản phẩm.

## Bằng chứng đã có trước khi mở track

| Câu hỏi | Trả lời | Nguồn |
|---|---|---|
| `agent start` có hấp thụ boot race của shell không | Có. Tab tạo xong gọi ngay, lệnh vẫn chạy đúng, pid xác nhận | §12b |
| Nó có trả lỗi có tên thay vì treo không | Có. `agent_not_ready` + `blocked` sau 3928 ms | §12b |
| Trust dialog có chặn dispatch vào worktree mới không | Có, mọi lần. Pre-seed thì hết, `idle` + `interactive_ready` sau 3897 ms | §12c |
| Worker có tự ghi được receipt không | Có. `ack-1.json` rồi `result-1.json`, đúng thứ tự, không cần biết fgOS | §12c |
| Prompt nhiều dòng có sống qua `agent prompt` không | Có, với claude. 7 dòng nguyên vẹn cả hai marker | §12c |
| Pane `--no-focus` nghỉ ở trạng thái nào | `done`, không phải `idle`. Ready gate phải nhận cả hai | §12c |
| Có cô lập được socket herdr khỏi worker bằng env không | Không. `--env` bị herdr ghi đè, và không cần env vẫn chạm socket qua HOME | §12b |
| `pane close` có giết hết con cháu không | Không. Foreground chết, `setsid` sống sót | §12b |

## Phases

| Phase | Mục tiêu | Vào được sau | Lease chính |
|---|---|---|---|
| 00 ✅ | Worker trong worktree không còn chạy hook hỏng của repo | Điều kiện vào track | `worker-hook-neutral` |
| 01 ✅ | Mechanism khai capability; trust và HOME của worker đúng trước khi khởi động | 00 | `executor-profile` |
| 02 ✅ | Adapter đổi sang `agent start` + brief-as-file + `agent prompt`; receipt là ack file | 01 | `herdr-adapter` |
| 03 ✅ | Ladder poll thay `agent_status`-là-hoàn-thành; outcome có type; pane giữ lại làm forensics | 02 | `herdr-adapter` |
| 04 ✅ | `VisibilitySession` bền; `run.json` phản ánh trạng thái thật; Run mồ côi được reconcile | 03 | `run-truth` |
| 05 ✅ | Cửa quan sát chỉ-đọc; doctor; spec và docs cập nhật | 04 | `observe-surface` |
| 06 ✅ | Proof sống: agy, gateway restart, thử vượt rào | 05 | `v0-proof` |

Một cell mở tại một thời điểm. Phase 02 và 03 cùng chạm `transport.mjs` nên chia sẻ lease
và phải tuần tự.

## Định nghĩa hoàn thành của V0

**Đối chiếu 2026-09-07** (bằng chứng: `docs/architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md`):
1 ✅ đo sống (claude, trust pre-seed, không dialog nào) · 2 ✅ brief mang nguyên văn prompt 7 dòng ·
3 ✅ kết luận từ file worker ghi, `agent_status` không còn được đọc thành "xong" ở bất kỳ đâu ·
4 ✅ `died` sau 1525 ms, pane giữ lại, lý do có tên · 5 ✅ `run.json` đóng sổ khi settle, reconcile ra settled/died/unknown ·
6 ✅ process riêng chạy `fgos dispatch watch`, 15 lần đọc, không cần lease ·
7 ✅ 5705 test, 5695 pass, 3 đỏ đều có sẵn trên main ·
8 ✅ confinement đã nối vào adapter và **đo sống**: worker nhận socket của session riêng, HOME riêng, không với tới cockpit của operator (16 agent) — `proofs/2026-09-07-v0/confinement-result.json`. Khai confinement mà dựng không được thì dispatch bị **từ chối**, không âm thầm hạ cấp.

V0 đóng được khi tất cả đúng cùng lúc:

1. Một dispatch interactive vào worktree mới đi tới `agent-ready` mà không cần người trả lời dialog nào.
2. Prompt thật nhiều dòng của `fgos-coding-implement` tới được worker nguyên vẹn.
3. Hoàn thành được kết luận từ file worker ghi, không bao giờ từ `agent_status`.
4. Một dispatch thất bại để lại pane mở kèm lý do có tên, không phải timeout chung chung.
5. `run.json` không còn kẹt ở `running` sau khi Run kết thúc hay sau khi process dispatch chết.
6. Một người xem được agent đang làm gì mà không cần quyền gửi input.
7. `npm test` xanh; hành vi mới có test tương ứng.
8. Không capability nào chỉ interactive hoặc chỉ headless mới với tới được mà không khai rõ (ADR-010 §3).

## Ngoài phạm vi V0, ghi rõ để không trôi vào

- Verb `contact` và mọi kind của nó ngoài `system` (pointer, exit). Shape đã khoá ở §8.3, không code.
- Hook-based contact tại turn boundary (Family C). V2.
- `checkpoint`. Mechanism khai `false`, refuse có type.
- Interrupt như một effect có grant riêng. V0 chỉ có timeout và đóng pane.
- Dashboard, UI, gateway route mới.
- Sửa `herdr-plugin/src/*.rs`.
- Đổi `capabilities.fgos-coding-implement.prefer` sang một executor herdr. Đó là quyết định vận hành sau khi Phase 06 xanh, không phải một phần của V0.

## Rủi ro và cách chặn

| Rủi ro | Chặn bằng |
|---|---|
| Sửa `transport.mjs` làm hỏng `cli-spawn` đang gánh production | `cli-spawn` không được đụng một dòng nào; test hiện có của nó phải xanh không sửa assertion |
| Ghi vào `~/.claude.json` của người dùng làm hỏng config | Chỉ thêm entry cho path fgOS tự tạo từ root đã được tin; atomic tmp-rename; xoá khi teardown; fail loud khi field đổi tên |
| Worker chạm socket herdr điều khiển pane của người | Phase 01 HOME riêng; nếu không đạt thì capability profile phải mang nhãn `unsafe` và executor bị giới hạn |
| Hai phiên cùng sửa `transport.mjs` | Lease `herdr-adapter` giữ Phase 02 và 03 tuần tự |
| Main checkout dùng chung bị phiên khác đổi nhánh giữa chừng | Mọi phase làm trong worktree riêng của track, không bao giờ trong main checkout |
| Đo trên một agent rồi tưởng đúng cho mọi agent | Phase 06 bắt buộc chạy agy; kết quả agy không được sửa ngược kết luận claude, chỉ thêm nhãn capability |

## Phase files

- [Phase 00 — worker hook neutralization](phase-00-worker-hook-neutralization.md)
- [Phase 01 — executor capability profile, trust, HOME](phase-01-executor-profile-trust-home.md)
- [Phase 02 — adapter onto agent start and brief delivery](phase-02-adapter-agent-start-and-brief.md)
- [Phase 03 — signal ladder, typed outcomes, forensics](phase-03-signal-ladder-and-outcomes.md)
- [Phase 04 — VisibilitySession and Run truth](phase-04-visibility-session-and-run-truth.md)
- [Phase 05 — observe surface, doctor, docs](phase-05-observe-surface-and-docs.md)
- [Phase 06 — live proof matrix](phase-06-live-proof-matrix.md)

## Câu hỏi chưa giải quyết

1. ~~Pane herdr có sống qua `herdr server stop/start` không.~~ **ĐÃ ĐO 2026-09-07 (P3, session riêng `fgos-v0-proof2`)**: pane SỐNG qua restart — trước `[w1:p1, w1:p2]`, sau `[w1:p1, w1:p2]`, cùng id. Chốt `resume: reattach-or-relaunch`. Log: `proofs/2026-09-07-v0/failure-result.json`.
2. agy tuân thủ hợp đồng ack/result ở mức nào dưới `accept-edits`. Đo ở Phase 06; dưới ngưỡng thì agy mất nhãn interactive, không phải thiết kế sai.
3. Có tách được HOME cho worker mà agent CLI vẫn khởi động bình thường không. Phase 01 phải trả lời trước khi Phase 02 dựa vào nó.
4. Hang detection. Upstream đã park sau khi đo CPU và output counter đều không phân biệt được. V0 chấp nhận chỉ có idle-timeout và ceiling, ghi rõ là khoảng trống chứ không giả vờ có.
