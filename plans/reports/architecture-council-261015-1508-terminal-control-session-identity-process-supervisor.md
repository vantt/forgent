# Kết luận hội đồng kiến trúc: terminal-control, session-identity, process supervisor

- Ngày: 2026-10-15. Hội đồng đọc [research gốc](research-261015-1116-herdr-tab-pane-layout-and-naming.md) và phản biện qua hai lượt (lượt đầu + lượt mở lại để sửa lỗi còn sót). File này là **kết luận đang có hiệu lực**, viết lại cho dễ đọc. Bản chi tiết đầy đủ (bằng chứng, mã finding, từng seat nói gì) nằm ở git commit `8b61ae947` và ở mục 8.
- Đây là khuyến nghị, **chưa phải** quyết định của anh và **chưa phải** lệnh triển khai.
- Chuyện lock nằm ở file riêng: [thiết kế nền lock + identity](design-261015-1755-lock-and-identity-foundation-lead-design.md).

## 1. Tóm tắt một trang

Research đề xuất làm một lần thật lớn: gộp mọi cách bật worker vào một supervisor chung, viết hai crate Rust mới (`terminal-control`, `session-identity`), thêm lệnh `fgos terminal`, layout engine, file lock cho layout, và chạy 5 milestone song song.

Hội đồng **không làm theo nguyên trạng**. Lý do chính: research nhắm vào layout và gom code, trong khi hội đồng tìm ra **hai lỗi an toàn đang có thật trong code** cần sửa trước, và nhiều con số của research chưa ai đo.

| Research đề xuất | Hội đồng kết luận | Vì sao |
|---|---|---|
| Gộp cli-spawn, herdr-spawn, BoundInvocation thành một supervisor | **Không gộp** | Ba đường sống sót qua crash theo ba cách khác nhau. Tỷ lệ "85% giống nhau" chưa ai đo |
| Crate Rust `terminal-control` + lệnh `fgos terminal` + layout engine + file lock | **Chưa làm** | Chưa có multiplexer thứ hai (tmux) để cần lớp chung. Lệnh mới trái quyết định cũ "không thêm verb, herdr chỉ là phần hiển thị". Lock layout đặt trong repo sẽ sai với worktree |
| Crate Rust `session-identity` đặt trong host-runtime, giữ thêm bản Node | **Không làm kiểu hai bản** | Hai nơi cùng quyết định "writer là ai" là hai sự thật. Có đi Rust thì Rust là nguồn duy nhất (anh quyết, mục 5) |
| Bỏ root pane rỗng | **Làm** | Đã đo trên herdr thật, an toàn (mục 2.4) |
| Gắn nhãn tab/pane theo nhóm | **Làm**, dạng dữ liệu thuần | Nhãn chỉ để hiển thị; không code nào được đọc nhãn để quyết định |
| Sửa nhận diện writer (identity) | **Làm, mở rộng hơn research** | Hội đồng thấy lỗi nặng hơn research mô tả (mục 2.2) |
| Activation sau một bộ test rút gọn 15 s | **Không** | Luật của repo: `npm test` đầy đủ phải xanh trước khi activation |

Thứ tự: **đợt 1** sửa lỗi an toàn và những thay đổi nhỏ, bằng Node, mỗi việc có test (mục 2). **Đợt 2** chỉ mở khi có số đo hoặc sự kiện cụ thể (mục 3).

## 2. Đợt 1: những việc sẽ làm

### 2.1 Không để reaper xoá home của worker đang chạy (lỗi an toàn 1)

**Hôm nay:** mỗi worker chạy trong sandbox có một thư mục home riêng chứa token đăng nhập. Có một "reaper" chạy định kỳ, dọn home của các lần chạy đã chết. Reaper quyết định "đã chết" bằng cách xem process điều khiển (controller) còn sống không và lần chạy đã quá hạn chưa. Vấn đề: lúc worker vừa được bật trong herdr pane, home **chưa ghi pane nào đang dùng nó**. Nếu controller chết đúng lúc đó, reaper coi home là bỏ hoang, **giết worker đang chạy và xoá token của nó**.

Hội đồng thử ba cách vá. Cả ba đều bị red-team lật bằng ví dụ chạy được: ví dụ khi controller chạy chậm, nó gắn pane ngay sau lúc reaper vừa kiểm xong. Cách vá cuối cùng, qua được vòng kiểm tra:

1. **Ghi rõ chủ của home trước khi bật worker:** pane nào, socket herdr nào, pid của controller, lúc nào. Ghi thất bại thì không bật worker.
2. **Muốn xoá phải giành quyền trước:** reaper ghi "tôi đang xoá" (pid, thời điểm), đọc lại, thấy khác thì thôi. Reaper khác chết giữa chừng thì reaper sau mới được tiếp quản.
3. **Controller tự kiểm:** home đã quá hạn thì không gắn pane nữa. Chỉ bật worker trong một khoảng ngắn sau khi gắn. Bật xong kiểm lại một lần, nếu home đã bị giành thì đóng pane và báo lỗi.
4. **Home có chủ còn sống thì được giữ đủ thời gian chạy**, bất kể herdr trả lời gì.

**Trạng thái:** đúng trên giấy. Hai seat Gemini viết mô hình kiểm tra riêng (1.042 và 68.846 trạng thái), không thấy lần xoá nhầm nào. **Chưa có test trên code thật.** Hội đồng đặt điều kiện: chỉ gọi là an toàn sau khi bộ test trên hàm thật (S2) pass. Ba cách vá trước đều hỏng ở đúng khoảng cách giữa mô hình và code thật.

Nếu S2 fail: bỏ cách này, chuyển sang trạng thái "đang giành quyền sở hữu" (acquisition-pending) do seat Astra đề xuất.

**S2 đã viết xong** ([report](spike-s2-261015-1818-reaper-fence-acceptance-tests.md)): file test `test/runner/dispatch-confinement-reaper-fence.test.mjs` trên nhánh `worktree-agent-a1821bf555f8d8f52` (commit `a9fa1dd52`, **chưa merge** vì đỏ có chủ đích). Chạy trên hàm thật: 50 ca — **13 đỏ** (tái hiện lỗi: reaper xoá home của worker đang chạy, hoặc không hề hỏi herdr), 22 xanh (hành vi phải giữ), 15 todo (cần seam của 1a mới viết được). Lead đã chạy lại, khớp. Code thật khác mô tả: reaper được gọi ở **4 chỗ** (`run.mjs:315`, `cli.mjs:1230`, `loop.mjs:1443`, `setup/registrations.mjs:5446`), không phải 2; và có **lỗi sẵn** ở `cli.mjs:1230-1233` (lượt reap sau probe trả `null` cho mọi pane nó không tự đóng, nên xoá home đã retained mà pane vẫn mở — trái comment ngay phía trên). 1a chỉ được gọi là an toàn khi 13 ca đỏ thành xanh và 15 ca todo thành test thật.

Code chạm tới: `src/runner/dispatch/confinement/cleanup.mjs`, `authority.mjs`, `drivers/bwrap.mjs`, `transport.mjs`, `herdr-round.mjs`.

### 2.2 Mỗi worker một danh tính riêng (lỗi an toàn 2)

**Hôm nay:** khi fgOS bật worker, nó truyền writer id của chính phiên điều phối sang worker (`FGOS_SESSION_ID`). Mọi worker và mọi agent trong cùng một phiên Claude Code vì vậy bị coi là **một writer**. Lock nhận ra "người giữ là mình" bằng cách so id, nên các worker độc lập **lọt qua lock của nhau**. Ngay lúc viết, file `main-checkout.lock` đang ghi đúng id phiên Lead do một agent con commit.

**Sẽ làm:**
- Không cho worker mang theo session id của CLI cha (`CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`).
- Mỗi lần chạy độc lập có writer id riêng; id của cha đi kèm riêng chỉ để biết "ai sinh ra ai". Áp dụng cho cả ba đường bật worker: chạy nền, chạy trong sandbox, chạy trong herdr pane không sandbox. Đường thứ ba hôm nay không nhận id nào.
- Pane codex do người tự mở được nhận diện qua `CODEX_THREAD_ID`.
- **Cấm** quay lại kiểu dùng chung id, kể cả khi sau này thấy chỗ nào cần. Muốn đổi thì phải chứng minh các worker độc lập vẫn loại trừ nhau.

**Trước khi làm:** kiểm kê mọi chỗ đang dùng writer id (spike S1), vì việc này đổi hợp đồng công khai (`docs/io-contract.md`).

**S1 đã xong** ([report](spike-s1-261015-1818-writer-id-consumer-inventory.md)): 29 nơi dùng writer id; **không đường nào hôm nay cần child dùng chung id với cha** (commit lồng của `approve` mượn pid qua `FGOS_MAIN_LOCK_HOLDER_PID`, không mượn session id). Thí nghiệm trên helper production: với id riêng, worker thứ hai bị lock chặn đúng, sibling không settle được claim của nhau, attempt cũ không settle được claim mới. Phải land cùng commit: mint id một chỗ (`launchCommandId` đã lưu, để resume ra cùng id); scrub `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID` rồi đặt id con **khác rỗng** (chuỗi rỗng bị resolver bỏ qua và rơi về id của cha); pane herdr không sandbox nhận id qua `--env`; thứ tự resolver `FGOS_SESSION_ID → CODEX_THREAD_ID → CLAUDE_CODE_SESSION_ID → pid`; sửa `docs/io-contract.md` + CHANGELOG; test hồi quy. **Ba lỗ 1c không tự vá:** `releaseClaim` không kiểm writer (sibling nhả được claim của người khác); `FGOS_MAIN_LOCK_HOLDER_PID` là bearer (hai child cùng mượn đều vào được — thiết kế lock v2 xử lý); subagent chạy trong cùng tiến trình qua Agent tool vẫn chung `CLAUDE_CODE_SESSION_ID` (giới hạn phải ghi rõ).

### 2.3 Gom tab theo nhóm việc

**Hôm nay:** `fgos run` và workflow runner không truyền khoá nhóm xuống, nên tab tự đặt tên kiểu `fgos-lead-<key>-<ts>`.

**Sẽ làm:** truyền thông tin hiển thị (nhóm, nhãn, vai trò, agent, model) xuống như dữ liệu thuần. Mặc định nhóm = run id, hoặc workflow run id nếu chạy qua workflow. Xoá nhãn tự chế. Không code nào đọc nhãn để quyết định việc gì.

### 2.4 Bỏ root pane rỗng

**Hôm nay:** mỗi tab tạo ra có một pane gốc rỗng làm chỗ tách pane. Code dọn tab chỉ chạy khi process tạo tab thoát êm, nên tab rỗng hay bị bỏ lại không ai đóng.

**Đã đo trên herdr thật** với đủ 5 CLI (claude, codex, agy, pi, omp):
- Đóng pane gốc sau worker đầu tiên được.
- Tách pane mới từ pane của worker đang chạy không làm hỏng worker, kể cả đúng lúc nó đang khởi động hay đang nhận brief.
- Pane lỗi được giữ lại không cản worker khác.
- Pane neo đã đóng thì herdr báo lỗi rõ, lấy pane khác trong tab để tách tiếp.
- Pane cuối đóng thì herdr tự xoá tab.

**Sẽ làm:** đóng pane gốc ngay sau worker đầu tiên. Tách worker sau từ pane còn sống; không còn pane thì mở tab mới. **Xoá hẳn** `closeIfEmpty`, vì giữ nó sau khi bỏ pane gốc sẽ đóng nhầm tab có đúng một worker.

**Một thay đổi anh sẽ thấy:** các bước chạy nối tiếp nhau (ví dụ reviewer chạy sau producer) sẽ mở tab mới cùng nhãn, vì tab cũ đã tự biến mất. Phương án giữ một pane giữ chỗ để có một tab xuyên suốt (ALT-TAB1) **không làm** (anh quyết 2026-10-15).

**Còn phải kiểm:** chạy lại qua đúng code `createBatchTab` trong sandbox (S3').

### 2.5 Cổng hoàn thành

Mỗi việc trên có test riêng. Trước khi activation: `npm test` đầy đủ phải xanh. Ghi CHANGELOG vì người dùng fgOS sẽ thấy thay đổi.

## 3. Đợt 2: chưa làm, mở khi nào

| Việc | Mở khi | Đo / quan sát bằng gì |
|---|---|---|
| Crate Rust `session-identity` (nguồn identity duy nhất, Node gọi sang) | Anh chọn hướng Rust (mục 5). **Số đo đã có:** gọi thẳng binary Rust ~3,3 ms, đạt nếu thiết kế đúng 5 điều kiện ([S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md)) | Đã đo |
| Crate Rust `terminal-control` + lệnh mới | Có multiplexer thứ hai thật (tmux…), hoặc có process không cùng cây cha cần chung tab | Rà mã nguồn (S5) |
| Lock cho terminal | Như dòng trên | S5 |
| Gom code kiểm `/proc` và dựng launcher giữa hai đường bật worker | Hai bên trùng ≥ 80% | Diffstat (S8, vài phút) |
| Một supervisor riêng cho mỗi lần chạy (đề xuất của Astra) | Quan sát được herdr-spawn mất deadline/kết quả khi controller crash | Thử crash thật |
| Danh tính cho pane do người tự mở | Quan sát herdr thật, hoặc thấy va chạm writer gây hại | S7 |

Các phép đo S5, S7, S8 rẻ, chạy được ngay để biến "hoãn" thành quyết định có số.

## 4. Những ý của research bị bác

- **"85% lifecycle giống nhau", helper 4 hàm, ước lượng LOC và thời gian:** chưa đo. Helper 4 hàm không diễn đạt được các trạng thái "không rõ / không hỗ trợ / giữ lại".
- **Identity đặt trong host-runtime và giữ song song bản Node:** hai sự thật, trái nguyên tắc tách component nền độc lập.
- **File lock cho layout đặt trong repo:** sai với linked worktree và với herdr dùng chung giữa nhiều repo.
- **Lệnh `fgos terminal` mới:** đảo quyết định cũ mà không nói ra. Bản release cũ ở project khác sẽ lỗi khi gặp lệnh lạ.
- **Đọc nhãn pane để suy ra trạng thái:** biến phần hiển thị thành khoá dữ liệu.
- **Layout theo hướng màn hình dọc:** tự mâu thuẫn với chính thuật toán của nó, và quên ô viền khi tách pane.
- **Gate 15 s rồi activation:** trái luật "npm test đầy đủ".

## 5. Chờ anh quyết

| Câu | Lựa chọn | Hội đồng khuyên | Lead nghĩ |
|---|---|---|---|
| **Khi nào làm Rust** (OQ1) | (a) Node trước, Rust khi có trigger · (b) crate identity ngay · (c) hai crate + bản Node song song · (d) hai nền Rust, một nguồn identity, Node chỉ gọi sang | (a), **không bao giờ (c)** | **(d) thu hẹp**: S6 đã đạt có điều kiện, và hiện đã có hai bản Rust tự tính identity/lock lệch với Node, tức "Rust sau" nghĩa là chấp nhận hai sự thật. Chi tiết ở [thiết kế nền](design-261015-1755-lock-and-identity-foundation-lead-design.md) |
| **Giữ credential khi không hỏi được pane** (OQ2): herdr không trả lời, credential đã quá hạn | (a) quá hạn thì xoá · (b) giữ tới khi chắc chắn pane đã đóng · (c) xoá nhưng liệt kê để người xử lý | (a) | **Đã quyết (anh, 2026-10-15): (a) quá hạn thì xoá.** Sau cách vá 2.1, chỉ áp dụng khi controller đã chết hoặc đã quá hạn; không lan sang run đang chạy |
| **Một tab xuyên các bước nối tiếp** (ALT-TAB1) | có / không | — | **Đã quyết (anh, 2026-10-15): không làm.** Bước nối tiếp mở tab mới cùng nhãn. Xem lại chỉ khi dùng thực tế thấy phiền |
| **Mời thêm chuyên môn ngoài** (gate `close`) | herdr nội bộ, process/PTY Linux, chính sách credential, tích hợp Rust/Node, thu hồi tài nguyên đồng thời | Hội đồng chỉ liệt kê | **Đã quyết (anh, 2026-10-15): `[]`, không mời ai.** Hai run đã đóng |

## 6. Bước tiếp theo đề nghị

1. **Viết test S2 trên code thật** cho cách vá 2.1, trong worktree riêng, chỉ thêm test. Đây là cổng của lỗi an toàn quan trọng nhất.
2. **Chạy S1** (kiểm kê nơi dùng writer id) trước việc 2.2.
3. **Gộp đợt 1 của file này với phần lock** (tách `main-checkout.lock`, xem [thiết kế nền](design-261015-1755-lock-and-identity-foundation-lead-design.md)) vào một plan triển khai, vì lock và identity dính nhau.

## 7. Độ tin cậy

- **Seat** (theo bản ghi của runner):
  - Đề xuất thiết kế độc lập: gpt-6-astra, Claude Fable, gemini-4-argon-high, ba họ khác nhau, mỗi seat không thấy bài của seat khác.
  - Tổng hợp: Claude Opus.
  - Phản biện lượt đầu: grok-4.6, deepseek-v4-pro, gpt-6.1-sol.
  - Phản biện lượt mở lại: gemini-4-argon-high.
  - Giải thích: Claude Fable.
- **Hạn chế:**
  - Seat tổng hợp và seat giải thích cùng họ Claude với Lead.
  - Reviewer và red-team của mỗi lượt cùng một model với nhau.
  - Mọi kiểm chứng của cách vá 2.1 mới là mô hình.
  - Chưa ai chạy `npm test` hay quan sát herdr trong sandbox.
- **Điểm chắc nhất:** hai lỗi an toàn 2.1 và 2.2 đã thấy trực tiếp trong source. Lỗi 2.1 đã tái hiện được trong bộ nhớ.

## 8. Tra cứu bản gốc

| Nội dung | Ở đâu |
|---|---|
| Bản chi tiết cũ của file này (bằng chứng, finding, bất đồng từng seat, bảng đo herdr 5 CLI) | `git show 8b61ae947:plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md` |
| Kết luận tổng hợp cuối (JSON đầy đủ) | `.fgos/assignments/unit-run-1792057330846-367abcd4/producer/2/runs/01/outbox/report-1.md` |
| Bản giải thích tiếng Việt của lượt mở lại | `.fgos/assignments/unit-run-1792060497202-2aed6723/producer/1/runs/01/outbox/report-1.md` |
| Lượt đầu (tổng hợp, ba thiết kế, phản biện) | `.fgos/assignments/unit-run-1792053135431-be87d799/`, `unit-run-1792051281308-0c298779/`, `unit-run-1792052454167-c5b9e16c/` |
| Hai workflow run | `wf-run-1792050915567-d978f530` (lượt đầu), `wf-run-1792057330643-71c4907b` (mở lại); cả hai **đã đóng** (anh trả lời gate `close`: "[]: không mời ai, đóng run", 2026-10-15) |
| Report đi kèm | [S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [Rust-first](proposal-261015-1715-rust-first-component-hook-identity-lock.md), [kiểm kê lock](research-261015-1731-lock-inventory-and-standardization.md), [thiết kế nền lock + identity](design-261015-1755-lock-and-identity-foundation-lead-design.md) |
