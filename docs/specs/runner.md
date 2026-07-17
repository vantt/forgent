---
area: runner
updated: 2026-07-17
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3]
coverage: full
---

# Spec: Runner (vòng tự hành)

Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-state, giao cho một trợ lý thông minh chạy nền trong không gian cô lập, tự chấm kết quả bằng proof của chính việc đó, rồi ghi lại thành **đề xuất chờ duyệt**. Người dùng: người vận hành repo (khởi động vòng, duyệt đề xuất). Nguyên tắc sống còn: trong vòng dispatch, chỉ runner được ghi trạng thái; worker chỉ để lại commit trên nhánh riêng.

## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): việc kẹt ở `doing` từ lần chạy đổ trước được giải quyết trước khi tìm việc mới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét làm-rõ** (clarify sweep) — xem "Quét làm-rõ trước dispatch" dưới
- Ngay sau quét làm-rõ, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** (decompose sweep) — xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua đúng CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `proposed` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door — xem "Cổng duyệt PR nội bộ" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop P13 Slice 1, D1/D3) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng; đọc-thuần tuyệt đối — xem "Gate A — xếp hạng candidate (evolve)" dưới

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế {prompt}/{model} theo từng phần tử, không bao giờ qua shell) · `models` — bảng tier→model (light/standard/heavy) · `timeoutMs` — trần thời gian một worker | yes | có sẵn bản mặc định |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed | mỗi khối: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra) | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |

## Behaviors & Operations

### Một vòng --once (hạnh phúc)

- **Runs when:** người vận hành gọi; MỘT hoặc NHIỀU việc cùng lúc trong một mẻ (xem "Giao việc theo mẻ, song song có giới hạn" dưới) — mỗi việc đi đúng vòng đời dưới đây, độc lập với việc khác trong cùng mẻ.
- **What changes:** việc đầu frontier được claim (`todo→doing` có kỳ vọng); **ngay sau khi claim, runner ghi nửa DỰ ĐOÁN của một bản ghi kết quả (outcome) cho việc đó** — tier dự kiến, số dep, số lần nhận trước đó (xem spec Work-State); worktree + nhánh `fgw/<id>` mở ra từ đỉnh cây chính; trợ lý chạy nền với prompt dựng từ chính việc đó (mục tiêu / mô tả gốc nguyên văn / ranh giới worktree / proof kỳ vọng / cấm tự ghi trạng thái — cộng thêm một mục Human feedback khi item mang câu trả lời làm-rõ mới nhất và/hoặc lý do từ-chối/đỗ mới nhất, xem R23), dưới quyền TỐI THIỂU khai trong `.fgos-runner.json` (xem R6), model chọn theo tier của việc; trợ lý tự commit trong worktree; **runner tự chạy lệnh proof của việc trong worktree** — không tin lời trợ lý; đạt → `doing→proposed`, và **CÙNG LÚC runner ghi nửa THỰC TẾ tương ứng** (kết cục `proposed`, goal-check đạt, số lần thử, số commit, số lần nhận) — đo từ chính goal-check/kiểm nhánh của runner, không bao giờ từ lời tự báo của trợ lý; worktree dọn đi, **nhánh ở lại** làm đề xuất.
- **Side effects:** đúng các sự kiện chuyển trạng thái trong nhật ký; output của trợ lý được in console NHƯ CŨ, và CÒN được nối thêm vào một bản ghi cục bộ riêng cho việc đó (xem "Ghi lại output của trợ lý sau mỗi lượt dispatch" dưới) — bản ghi này không bao giờ vào cây committed.
- **Afterwards:** người vận hành thấy việc ở `proposed` + nhánh để review; việc phụ thuộc CHƯA mở (chờ duyệt/merge → `done`); vòng --once thứ hai không giao lại việc nào (frontier trống).

### Giao việc theo mẻ, song song có giới hạn, giữ quyền-sở-hữu-gốc

- **Runs when:** ngay sau quét làm-rõ + quét chia-việc, và lặp lại mỗi khi một mẻ vừa dispatch xong (một hoặc nhiều việc trong mẻ tới kết cục cuối).
- **What changes:** đọc lại TOÀN BỘ tập việc sẵn-sàng tươi; lọc theo quyền sở-hữu gốc — một việc chỉ lọt vào mẻ nếu gốc của nó CHƯA có chủ, hoặc đã thuộc về CHÍNH lượt chạy này (một chủ khác giành nhận cùng gốc bị từ chối, cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác — trên một máy chỉ một chủ tồn tại nên đường từ-chối này hiếm khi thật sự xảy ra, nhưng vẫn được kiểm mỗi lần); nhóm phần còn lại theo gốc, lấy tối đa N gốc, mỗi gốc lấy tối đa M con (trần hai tầng, Data Dictionary #6); mỗi việc trong mẻ được nhận (`todo→doing`) qua đúng MỘT cửa ghi tuần tự (xem R24) — dù nhiều việc thi công song song, quyết-nhận và ghi-nhận của từng việc vẫn nối tiếp nhau, không bao giờ hai lượt nhận chen lẫn; việc bị từ chối nhận ở lại chờ mẻ sau, không mất.
- **Side effects:** mỗi việc trong mẻ chạy vòng đời "Một vòng --once" ở trên, đồng thời với việc khác trong CÙNG mẻ, cho tới kết cục cuối của từng việc (đề xuất, đỗ, hoặc dừng).
- **Afterwards:** mẻ xong (mọi việc trong mẻ đã tới kết cục) → đọc lại tập sẵn-sàng TƯƠI (việc vừa xong có thể mở khóa việc phụ thuộc, hoặc mở khóa chính gốc của nó nếu đó là con cuối cùng) rồi nạp mẻ kế tiếp — lặp tới khi KHÔNG còn việc đang chạy VÀ KHÔNG còn việc sẵn-sàng, vòng --once mới kết thúc thật sự.

### Cây nhánh tích hợp — con nhập vào nhánh của gốc, chỉ gốc nhập vào cây chính

- **Runs when:** mỗi lần một việc CON (có việc cha, xem spec Work-State "Giai đoạn Chia-việc") được dispatch hoặc đề xuất của nó được duyệt.
- **What changes:** một việc GỐC (không việc cha, hoặc chính là đỉnh một cây) mở nhánh đề xuất riêng như mọi việc khác (Data Dictionary #2) — nhánh đó nay CŨNG đóng vai nhánh tích hợp của cả cây hậu duệ nó. Một việc CON mở worktree từ ĐỈNH nhánh của gốc nó (không phải từ cây chính) — kế thừa mọi việc anh em cùng gốc đã nhập trước nó. Đề xuất của một việc CON, khi qua cổng duyệt PR nội bộ, nhập vào NHÁNH CỦA GỐC — không bao giờ nhập thẳng vào cây chính. Một việc ĐỘC LẬP (không con, không cha) đi đúng đường cũ không đổi: đề xuất của nó nhập thẳng vào cây chính như trước.
- **Afterwards:** chỉ khi TOÀN BỘ con của một gốc đã `done`, gốc mới tới lượt sẵn-sàng dispatch (cơ chế lineage sẵn có, xem spec Work-State) — verify của chính gốc lúc đó chạy trên nhánh của gốc (đã chứa mọi con đã nhập) như phép kiểm tích hợp cho cả cây; gốc đi tiếp đúng vòng đời và cổng duyệt như mọi việc khác, và CHỈ đề xuất của gốc mới nhập vào cây chính, đúng một lần cho cả tính năng. Bảo đảm nghiệp vụ: cây chính không bao giờ nhận một mảnh dở của một tính năng nhiều-việc — chỉ nhận nguyên vẹn khi toàn bộ cây đã xong (xem R25).

### Trôi tích hợp & đồng bộ lại tại gốc→cây chính (integration drift)

- **Runs when:** cổng duyệt PR nội bộ (`approve`) xử lý đề xuất của một GỐC từng có con (đã đi qua cây nhánh tích hợp ở trên).
- **What changes:** trước khi nhập vào cây chính, hệ thống kiểm CẢ HAI điều kiện: (a) nhập có xung đột văn bản không; (b) SAU khi nhập (nhưng CHƯA chốt), verify của chính gốc chạy lại trên cây đã nhập — đại diện cho "cả tính năng cộng với mọi thứ khác đã vào cây chính từ lúc gốc bắt đầu vẫn đúng cùng nhau", không chỉ "nhập được không xung đột". Xung đột văn bản HOẶC verify đỏ ở bước (b) đều bị coi ngang nhau — cả hai là TRÔI tích hợp: hủy sạch việc nhập (cây chính giữ nguyên, không bao giờ giữ một nhập xanh-mà-gãy), gốc đỗ lại mang lý do trôi-tích-hợp RIÊNG (phân biệt với lý do gãy-nhập thường của một việc không-con) cùng dấu vết chỗ cây chính đang đứng lúc đó.
- **Afterwards:** gốc đỗ vì trôi tích hợp chờ người gọi đồng bộ lại (xem "Đồng bộ lại một việc đỗ (catch-up)" dưới); nhập sạch + verify xanh ở bước (b) → gốc `done`, tính năng hoàn tất trên cây chính.

### Đồng bộ lại một việc đỗ (catch-up)

- **Runs when:** người vận hành gọi `fgos catchup <id>` trên một việc đang `blocked` vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp).
- **Blocked when:** việc không tồn tại — `validation`; việc không ở `blocked` — `precondition`; lý do đỗ hiện tại không thuộc nhóm gãy-nhập (vd đỗ vì chạm trần chống-lặp, hoặc gặt-do-crash) — `validation`, đồng bộ-lại không giúp được những lý do đó, người phải cầm việc qua cửa pull để tự sửa tay; nhánh riêng của việc không còn tồn tại — `validation`.
- **What changes:** hệ thống xác định ĐÍCH cần đồng bộ — nhánh của gốc nếu việc là con, cây chính nếu việc là gốc/độc lập — rồi kéo trạng thái MỚI NHẤT của đích vào nhánh riêng của việc (nhập, chưa chốt), chạy verify của chính việc trên kết quả TRƯỚC KHI chốt: nhập sạch + verify xanh → chốt, việc chuyển thẳng `blocked → sẵn sàng nộp lại` — KHÔNG đi qua `đang làm`, một bước CƠ HỌC không tính vào ngân sách chống-lặp của việc; còn xung đột → hủy sạch việc nhập vừa thử, việc giữ nguyên `blocked`, thông báo tên các tệp xung đột cho người tự xử lý; verify đỏ sau khi nhập sạch → cũng hủy sạch, việc giữ nguyên `blocked`, người phải tự điều tra vì sao đồng bộ xong mà verify vẫn gãy — cả hai đường thất bại này KHÔNG có cơ chế agent tự giải xung đột (đó là mở rộng sau, xem Open Gaps).
- **Side effects:** không gì ngoài dấu vết trên nhánh riêng của chính việc đó (khi thành công) — cây chính/nhánh của gốc không bao giờ bị đụng bởi lệnh này.
- **Afterwards:** đồng bộ thành công → việc actionable lại qua đúng cổng duyệt PR nội bộ như một đề xuất bình thường, không cần nộp lại từ đầu; đồng bộ thất bại → việc vẫn đỗ, người chọn giữa gọi lại `catchup` sau khi đích đổi tiếp, hoặc cầm việc qua cửa pull để tự làm-lại tay — đường làm-lại tay CÓ tính vào ngân sách chống-lặp (đi qua `đang làm` bình thường), phân biệt với đường cơ học ở trên (xem R28).

### Quét làm-rõ trước dispatch (clarify sweep)

- **Runs when:** mỗi lượt chạy, ngay sau gặt-lại, TRƯỚC khi giao bất kỳ việc
  thi công (executing) nào.
- **What changes:** mọi việc đang ở stage `clarify` VÀ status `todo` (xem
  spec Work-State "Giai đoạn Làm-rõ") được chạy context-discovery — BẤT KỂ
  giá trị `mode` của item mang gì (mode chỉ là quy ước ai NÊN gọi trước,
  không phải điều kiện runner rẽ nhánh). Việc đang `awaiting-human` (đã hỏi,
  chưa ai trả lời) KHÔNG BAO GIỜ bị quét lại — cùng luật loại-trừ với dispatch
  thường (xem R6 Work-State/R15). Prompt phán mà runner gọi ở đây mang cùng
  ngữ cảnh đầy đủ như lời gọi `fgos discover` tay — description gốc + cặp
  hỏi-đáp mới nhất + các lần phán trước của item (per discovery-context P30
  / cfae0120, xem spec Work-State "Giai đoạn Làm-rõ") — không phải một bản
  rút gọn riêng cho vòng tự hành.
- **Side effects:** một lời gọi model thật cho mỗi item quét được — không
  bao giờ throw ra ngoài dù model lỗi/timeout (fail-safe, xem spec
  Work-State).
- **Afterwards:** item đủ rõ chuyển sang stage `decompose` (mang verify thật,
  không thẳng `executing` — giai đoạn chia-việc chèn ở giữa) — CÙNG lượt chạy
  này, quét chia-việc bên dưới (xem "Quét chia-việc trước dispatch") có thể
  nhặt được nó ngay; item chưa đủ rõ đậu ở `awaiting-human` mang câu hỏi,
  đợi lượt chạy sau (hoặc gọi tay `fgos discover`) khi đã có câu trả lời.
  Đây là **lưới đỡ**: dù người submit dùng chế độ tương tác-ngay nhưng phiên
  chat của họ chết trước khi tự gọi `discover`, lượt chạy tiếp theo của vòng
  tự hành vẫn tự quét — không item nào kẹt vô hình.

### Quét chia-việc trước dispatch (decompose sweep)

- **Runs when:** mỗi lượt chạy, NGAY SAU quét làm-rõ (không phải một lượt
  chạy riêng) và vẫn TRƯỚC khi giao bất kỳ việc thi công (executing) nào.
  Đọc lại view TƯƠI sau quét làm-rõ — một item vừa được quét làm-rõ đẩy sang
  stage `decompose` trong CÙNG lượt chạy này vẫn bị quét chia-việc ngay, không
  phải đợi lượt chạy sau.
- **What changes:** mọi item đang ở stage `decompose` VÀ status `todo` (xem
  spec Work-State "Giai đoạn Chia-việc") được chạy phán chia-việc — BẤT KỂ
  giá trị `mode` của item. Việc đang `awaiting-human` KHÔNG BAO GIỜ bị quét
  lại — cùng luật loại-trừ với mọi dispatch khác (R6/R15 Work-State).
- **Side effects:** một lời gọi model thật cho mỗi item quét được — không
  bao giờ throw ra ngoài dù model lỗi/timeout, hay verdict sinh con thiếu
  verify (fail-safe, xem spec Work-State).
- **Afterwards:** item pass-through hoặc vừa sinh đủ con (gốc chuyển
  `decompose → executing`) — CÙNG lượt chạy này, vòng dispatch bên dưới có
  thể nhặt được gốc ngay nếu deps/lineage cũng đã mở (gốc không có hậu duệ
  dang dở); item cần người quyết đậu ở `awaiting-human` mang đề xuất chia,
  đợi lượt chạy sau (hoặc gọi tay `fgos discover`) khi đã có câu trả lời. Đây
  cũng là một **lưới đỡ**, cùng tinh thần quét làm-rõ: không item nào ở stage
  `decompose` kẹt vô hình dù không ai gọi `discover` tay.

### Gặt-lại lúc khởi động (reap — phục hồi sau crash)

- **Runs when:** đầu MỌI lần chạy.
- **What changes:** trước hết, mọi item `doing` mang `claimActor` là `human`/`session` (cầm qua cửa pull `take` — xem spec Work-State) bị BỎ QUA hoàn toàn — người/phiên cầm vô thời hạn, gặt-lại không bao giờ giẫm lên claim đó (stage-decompose D1). Với phần còn lại (claim của runner, hoặc claim di sản không actor), việc kẹt ở `doing` (runner lần trước chết giữa chừng) được giải quyết theo nhánh của nó: có commit + proof đạt → hoàn tất `doing→proposed` (idempotent); không → `doing→blocked` kèm lý do gặt-do-crash. Nhánh bị worktree mồ côi giữ được đòi lại (dọn worktree cũ rồi mở lại); nhánh rỗng không commit → tỉa; nhánh có hàng → giữ cho người review.
- **On failure:** lỗi worktree khi gặt → việc đó về `blocked` có lý do, bước gặt KHÔNG BAO GIỜ chết thô — chạy-lại-sau-crash an toàn tự thân (có test giết thật giữa chừng).

### Chấm trượt / lỗi giữa vòng

- **What changes:** tra bảng phục hồi theo lớp lỗi — thử-lại (worktree mới, DÙNG LẠI nhánh cũ đã reset về đỉnh, trong trần attempt) → hết trần thì đỗ-lại (`doing→blocked` kèm lý do); lỗi tranh-chấp-ghi (kỳ vọng lệch vì người vận hành vừa ghi tay) → dọn dẹp rồi DỪNG sạch — không bao giờ giành ghi với người.
- **Side effects:** worktree luôn được dọn trên mọi đường thoát (kể cả dừng); quá trần chống-lặp → việc bị `todo→blocked` lý do chống-lặp, rời hẳn frontier.
- Khi việc bị đỗ-lại (`parked`, hết trần thử lại hoặc lỗi không thử lại được) hoặc bị dừng vì cầu dao (`halted`, chấm-trượt-liên-tiếp), runner **CŨNG ghi nửa THỰC TẾ** của bản ghi outcome — thất bại được học, không chỉ thành công. Nửa thực tế KHÔNG được ghi ở một lượt-thử-còn-thử-lại-được (chỉ ghi đúng một lần, ở kết cục CUỐI của việc).
- **Cùng lúc đó, runner ghi thêm một bản ghi friction** (kênh 2 của capture 2 kênh, Phase 3 Slice 2, xem spec Work-State): runner tự quy tội — dịch lớp lỗi thành một trong **5 lớp friction** cơ học: hỏng-spawn/quá-giờ/hỏng-worktree → `environment` · chấm-trượt → `verification` · nhật-ký-hỏng/việc-kẹt-do-crash/tranh-chấp-ghi → `state` · đề-xuất-bị-trả → `context` · lớp lạ → `task-spec` (mặc định). Bảng dịch là dữ liệu tĩnh, không phán xét — tích lũy friction là bằng chứng để hiệu chỉnh sau này, không phải kết luận tại chỗ.

### Ghi lại output của trợ lý sau mỗi lượt dispatch (persist log)

- **Runs when:** ngay sau MỖI kết cục của một lượt dispatch cho một việc —
  trợ lý chạy xong (dù sau đó goal-check đạt hay chấm-trượt), HOẶC dispatch
  hỏng trước khi trợ lý kịp chạy xong (quá-giờ, hỏng-spawn kể cả tràn bộ
  đệm, hoặc lỗi worktree không liên quan gì tới trợ lý).
- **What changes:** output (stdout/stderr) của trợ lý cho lượt thử đó được
  nối thêm thành một khối có dấu thời gian vào một bản ghi cục bộ riêng cho
  việc đó (một file mỗi việc, gộp mọi lần thử theo thời gian — lần thử sau
  KHÔNG đè lần thử trước). Khi dispatch hỏng TRƯỚC khi trợ lý kịp sinh ra
  output (vd lỗi worktree), khối ghi lại chỉ mang loại lỗi + thông điệp —
  KHÔNG throw vì thiếu output/tier/model.
- **Side effects:** một khối mới nối vào bản ghi cục bộ của việc đó; bản ghi
  này KHÔNG BAO GIỜ vào cây committed — không đổi nửa bảo đảm cốt lõi của
  luật kỷ-luật-output cũ (xem R31).
- **Afterwards:** người vận hành (hoặc một phiên agent khác) đọc lại được
  đúng những gì trợ lý đã làm/nói cho một việc, ngay cả sau khi console đã
  cuộn qua mất — kể cả cho những lượt thử KHÔNG BAO GIỜ tới `proposed`
  (quá-giờ, hỏng-spawn). Kết quả goal-check (verify) KHÔNG nằm trong bản ghi
  này — vẫn chỉ in console như trước, ngoài phạm vi thay đổi này.

### Ai ngã-ngũ — actor trên settlement (Phase 3 S3-closeout)

Mỗi ngã-ngũ (kênh 1 của capture 2 kênh — xem spec Work-State "Bản ghi
settlement") mang thêm ai/cái gì đã ngã-ngũ nó:

- **Runs when:** mọi ngã-ngũ mà chính runner tự ghi trong vòng dispatch của
  nó — quét làm-rõ cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ.
- **What changes:** ngã-ngũ đó mang `actor` = **runner**. Ngã-ngũ do một
  phiên đang sống tự gọi tay context-discovery mang `actor` = **session**;
  ngã-ngũ do người gọi qua một lệnh CLI (chuyển trạng thái tay, trả lời một
  câu hỏi đang chờ) mang `actor` = **human** — ba giá trị này phủ hết mọi
  đường ngã-ngũ hiện có.
- **Afterwards:** ai đọc lại nhật ký (qua `fgos check`) biết chính xác AI đã
  đưa item qua từng ngã-ngũ của nó, không chỉ SỰ KIỆN gì đã xảy ra.

### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject

MỘT cổng duyệt duy nhất cho MỌI đề xuất `proposed`, bất kể nguồn (per D4
pr-lifecycle / 1359ab5e): một đề xuất do runner tự đề xuất (nhánh `fgw/<id>`
còn sống) và một đề xuất đến qua cửa pull `take`/`return` (dải commit
`headAtTake→headAtReturn`, xem spec Work-State) đi qua CÙNG ba verb, cùng
luật. Trước khi `review`/`approve` hành động, đề xuất được PHÂN LOẠI đúng một
trong ba nguồn: **runner** (nhánh `fgw/<id>` tồn tại — `git rev-parse
--verify`), **pull** (không nhánh, nhưng mang cả `headAtTake` VÀ
`headAtReturn`), hoặc **legacy** (không cả hai — đề xuất từ trước feature này,
hoặc nhánh/dấu vết đã mất).

Song song với phân loại NGUỒN ở trên, một đề xuất nguồn **runner** còn được phân
biệt theo TẦNG trong cây nhánh tích hợp (xem "Cây nhánh tích hợp" trên): một đề
xuất **con** (có việc cha) so sánh/nhập với NHÁNH CỦA GỐC nó thay vì cây chính;
một đề xuất **gốc/độc lập** so sánh/nhập với cây chính như trước, không đổi. Một
việc con gãy nhập mang đúng lý do gãy-nhập sẵn có (`merge-conflict`/`verify-fail-
post-merge`) như mọi nhập gãy khác; lý do trôi-tích-hợp riêng chỉ dành cho một
GỐC từng có con gãy nhập vào CÂY CHÍNH (xem "Trôi tích hợp & đồng bộ lại" trên).

- **Runs when:** người vận hành gọi `fgos review <id>` / `fgos approve <id>
  [--timeout <ms>]` / `fgos reject <id> --reason "..."` trên một item đang
  `proposed`.
- **Blocked when:** item không tồn tại — `validation`; item không ở
  `proposed` — `precondition` ("nothing to review/approve/reject"); `reject`
  thiếu `--reason` — `validation` (bắt buộc, cùng khuôn `proposed→todo`);
  `approve --timeout` không phải số dương — `validation`; `approve` trên
  nguồn `runner` khi working tree của main KHÔNG sạch — `validation` (phép
  kiểm này loại trừ `.fgos/`: store sống mang cửa ghi riêng, tự mutate bởi
  chính take/return/approve nên không bao giờ tính là bẩn — `isFgosOnlyStatusLine`,
  `src/runner/merge.mjs`). Không nhánh chặn nào ghi sự kiện.
- **What changes:**
  - `review <id>` — thuần đọc (không sự kiện nào): in diff theo nguồn —
    `runner` → `git diff main...fgw/<id>`; `pull` → `git diff
    headAtTake..headAtReturn` (dải NÀY có thể chứa commit của một phiên khác
    chen giữa `take`..`return` trong môi trường nhiều-phiên — CHẤP NHẬN
    degrade trung thực: in thêm một cảnh báo đếm số commit lạ trong dải,
    không bao giờ giấu); `legacy` → in cảnh báo "không có nguồn diff", KHÔNG
    BAO GIỜ nổ. Kèm một trace tóm tắt (outcome/friction hiện có của item, tái
    dùng định dạng của `check` sẵn có — không formatter mới).
  - `approve <id>` — nguồn `runner`: `git merge --no-commit --no-ff
    fgw/<id>` staging-only vào main (spike "nocommit-probe", xem
    `docs/history/pr-lifecycle/reports/validation-s1-gate.md`); **conflict**
    → `git merge --abort` (main nguyên vẹn byte-for-byte, spike
    "merge-abort-probe") + `proposed → blocked` (reason `merge-conflict`) +
    một bản ghi friction lớp `state`; **staged sạch** → chạy `verify` CỦA
    ITEM (goal-check) trên chính cây đã staged, CHƯA commit — xanh → `git
    commit` (hoàn tất merge) rồi `proposed → done` mang **actor `human`**
    (D3: người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học) + dọn
    nhánh/worktree (best-effort); đỏ → `git merge --abort` (main nguyên vẹn)
    + `proposed → blocked` (reason `verify-fail-post-merge`) + friction lớp
    `verification`. Nguồn `pull`/`legacy` — KHÔNG có bước merge (code đã
    trên main, D4): chạy thẳng `verify` của item trên main qua CÙNG hàm
    `runGoalCheck` mà `return`/runner dùng — xanh → `done` actor human; đỏ →
    `blocked` (reason `verify-fail`) + friction `verification`.
  - `reject <id> --reason` — `proposed → todo` mang `reason` + actor human;
    KHÔNG BAO GIỜ chạy một lệnh git nào (D4 "không auto-revert" — code của
    một đề xuất pull-door đã trên main là lịch sử; `reject` chỉ là từ-chối
    coi-là-xong, không đảo ngược lịch sử).
- **Side effects:** `approve` nguồn `runner` chạy các tiến trình con git
  (`merge --no-commit --no-ff`, `merge --abort` khi cần, `commit`) cộng một
  lần chạy `verify` của item; `approve` nguồn `pull`/`legacy` chỉ chạy
  `verify`; `review`/`reject` không có side effect ngoài đọc/ghi sự kiện
  tương ứng.
- **Afterwards:** merge sạch → item `done`, nhánh/worktree dọn, việc phụ
  thuộc mở khóa như mọi `done` khác; merge/verify gãy → item `blocked` mang
  reason cụ thể, đậu lại chờ người (không tự rebase, không halt cả vòng
  runner); `reject` → item về `todo` mang reason, vào lại hàng chờ, chống-lặp
  đếm bình thường như mọi lần trả về khác.

### Gate A — xếp hạng candidate (evolve)

Bước vào của vòng tự cải thiện (self-improve loop, P13 Slice 1 — CONTEXT.md
D1/D3/D6/D11/D12): fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành một
danh sách candidate, người chọn đúng một hoặc dừng. Loop này chỉ nhắm vào
chính `repo/src` của fgOS (D1) — không phải một tính năng mở cho host project
ngoài — và chạy khi người gọi tay, không bao giờ là một nhánh tự động của
vòng dispatch thường (D3).

- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê) hoặc `fgos evolve
  --pick <id>` (xem chi tiết một candidate) — không có input tương tác nào
  khác, không vòng lặp chờ trả lời (D11: hai bước, không stdin).
- **Blocked when:** `--pick <id>` không khớp candidate nào đang mở —
  `validation`, thông điệp rõ ràng, KHÔNG BAO GIỜ hỏi lại (D11 "input sai là
  lỗi sạch, không re-prompt"); `--pick` mang cờ trần (không giá trị) cũng bị
  từ chối cùng khuôn `validation` như mọi verb khác dùng `requireField`.
- **What changes:** không gì — đây là một cửa đọc-thuần tuyệt đối (D6), cùng
  request-class với `ready`/`list`/`check`: đọc view qua `listWork(dir)` DUY
  NHẤT, không bao giờ `rebuild`/`refreshView`/`initStore` (những cửa GHI
  view/log). Không verb nào khác trong file này đổi hành vi vì cell này.
  - `fgos evolve` (không `--pick`) — xếp hạng MỖI id còn friction chưa
    ngã-ngũ (`src/evolve/candidates.mjs`'s `rankCandidates`, D12: tái dùng cơ
    học `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của
    `entropy.mjs`, không tự định nghĩa lại "chưa ngã-ngũ" hay trọng số riêng)
    rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/disposition/
    errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ luật "mọi
    trường người cần để phán" như phần friction của `check`). Không friction
    chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ ràng, exit 0 — chưa
    khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp đồng đọc-thuần của
    `ready`/`list`.
  - `fgos evolve --pick <id>` — xếp hạng lại CÙNG một view rồi tìm `id`
    trong danh sách; khớp → in bản ghi friction đầy đủ của candidate đó, TÁI
    DÙNG đúng formatter friction sẵn có của `check` (không viết formatter
    mới); không khớp → lỗi `validation` sạch, không đổi trạng thái. Chạy
    `fgos evolve` không mang `--pick` CHÍNH LÀ kết cục "dừng" của Gate A
    (D6) — không có input hủy/dừng riêng nào khác cần xử lý.
- **Side effects:** không có — không sự kiện nào vào nhật ký, không dòng nào
  vào `state.json`, không tiến trình con git nào (đây không phải một verb
  thao tác nhánh/worktree như `review`/`approve`/`catchup`).
- **Afterwards:** người vận hành thấy đúng candidate mình cần để quyết định
  bước tiếp theo (Iron Law + Gate B, các slice sau — D2/D5/D9, chưa xây ở cell
  này); không candidate nào bị chọn tự động, không đề xuất nào được tạo ra
  chỉ vì `evolve` chạy.

### Tín hiệu compounding qua check (entropy-trend + seal-digest)

Ngoài mục outcome/friction/settlement/học đã có, `fgos check` (lệnh đọc-thuần
dùng chung với Work-State — xem spec Work-State) còn tổng hợp một tín hiệu
sức khỏe cho toàn bộ vòng compounding.

- **Runs when:** mỗi lần `fgos check` được gọi (có id hay không).
- **Blocked when:** không có điều kiện chặn riêng — cùng hợp đồng lỗi với
  `check`, đọc thuần.
- **What changes:** không có event nào vào nhật ký sự kiện (đây vẫn là một
  lệnh đọc) — riêng lần chạy này tự thêm đúng MỘT dòng vào một lịch sử xu
  hướng nằm CÙNG chỗ với dữ liệu của kho đang được đọc (không phải nhật ký sự
  kiện, không đi qua cửa ghi work-state).
- **Side effects:** một dòng mới trong lịch sử xu hướng; không có lời gọi
  model nào.
- **Afterwards:**
  - Một **điểm entropy** có trọng số cho work-state hiện hành, cộng dồn từ
    năm tín hiệu, mỗi tín hiệu luôn giải thích được (không bao giờ một con số
    trần trụi): item ở trạng thái cuối (đề xuất/đỗ/xong) mà thiếu nửa
    thực-tế của kết quả (trọng số nặng nhất), item hiện đang "doing" (snapshot
    tại thời điểm check, không có ngưỡng thời gian riêng — trọng số nặng
    ngang hàng), item còn ở stage `clarify` (trọng vừa), một bản ghi friction
    chưa có settlement nào theo sau trên CÙNG id (trọng nhẹ), item đang đậu
    chờ người (trọng nhẹ).
  - Điểm này LUÔN đi kèm **so với lần `check` gần nhất** — lần đọc đầu tiên
    là baseline (chưa có gì để so); mọi lần sau in kèm phần chênh lệch thật.
  - Một dòng **seal-digest** tóm tắt những gì đã "gộp thêm" kể từ lần `check`
    trước: số kết quả mới có nửa thực-tế, số friction mới, số settlement
    mới — mỗi mệnh đề chỉ bị bỏ qua khi CẢ số đếm hiện tại VÀ phần chênh lệch
    của nó đều bằng 0; một kênh có dữ liệu tồn tại nhưng không đổi từ lần
    trước vẫn in ra, dưới dạng "không đổi" (giá trị 0), chỉ kênh thật sự
    trống mới im lặng hoàn toàn.
  - Kho chưa từng có việc nào → toàn bộ tín hiệu này vắng mặt, `check` không
    tự khởi tạo bất cứ gì — giữ nguyên hợp đồng đọc-thuần.

## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |

## Business Rules

- **R1.** Trong vòng dispatch, runner là người ghi duy nhất qua một cửa; worker không bao giờ tự ghi trạng thái (per D3 phase-2-routing / feed7428).
- **R2.** Kết quả worker là ĐỀ XUẤT mức bền D1: commit trên nhánh `fgw/`, phải qua người duyệt mới thành `done`; không bao giờ tự merge (per D4; auto-merge là backlog P9).
- **R3.** Runner tự chạy proof của việc làm goal-check — lời trợ lý không bao giờ là bằng chứng (per D3).
- **R4 (giao việc theo mẻ, giới hạn hai tầng, quyền-sở-hữu-gốc giữ nguyên trong lượt chạy).** Một lượt chạy giao TỐI ĐA N việc cùng lúc, giới hạn qua cấu hình hai tầng — số gốc đồng thời × số con đồng thời mỗi gốc (Data Dictionary #6); mọi con của MỘT gốc luôn về tay cùng một chủ trong suốt một lượt chạy (Data Dictionary #7, xem R26); dispatch nạp lại mẻ tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng. Chống-lặp qua vận hành thật (A1) là điều kiện đã chứng minh TRƯỚC khi song song được dựng — không còn là một ngưỡng-tên treo chờ (per D5/D10/D13/D14/D15 fan-out-parallel / 2e92b7a5).
- **R5.** Model chọn theo tier của việc qua bảng cấu hình (per D6); tập tier reconcile một nguồn tại đây.
- **R6.** Chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, KHÔNG phải sandbox OS/container. Worker headless chạy dưới tập quyền TỐI THIỂU khai tường minh trong `.fgos-runner.json` `executor.args`: `--permission-mode acceptEdits` (tự nhận sửa file) cộng đúng `--allowedTools "Bash(git add:*),Bash(git commit:*)"` — không rộng hơn; `--dangerously-skip-permissions` bị BÁC có chủ đích (worker chỉ cần sửa-file + commit trong worktree, prompt đã cấm merge/push/tự gọi fgos, và goal-check không tin lời trợ lý — R13 — nên quyền rộng hơn là rủi ro không cần) (per worker-execution / 22699c61, 04a6cd05). Root cause spike-proven (2 biến thể, claude CLI thật): thiếu allowlist này, headless `claude -p` sửa file được nhưng `git commit` treo vô thời hạn chờ duyệt tương tác → nhánh đề xuất luôn rỗng, dispatch luôn đỗ. Bất biến phải giữ: work item (nhất là trường proof — được chạy như lệnh shell) do chính người dùng tạo; không bao giờ nạp việc từ nguồn ngoài khi chưa có vòng kiểm (security panel, ghi trong hợp đồng handoff).
- **R7.** Lớp lỗi lạ → dừng, không bao giờ mặc định thử-lại (fail-safe).
- **R8.** Bước gặt-lại làm chạy-lại-sau-crash an toàn tự thân: không việc nào vô hình, không commit đôi, không worktree rò (reliability panel — 3 blocker vá trước khi code).
- **R9 (thực thi khi dev).** Mọi kiểm chứng chạy trong Claude Code bằng subscription: suite dùng executor giả (0 token), worker thật qua claude CLI login. API key chỉ hợp lệ khi tính năng đang test là executor-cắm-ngoài, và là key của môi trường người dùng (per 774b73ef).
- **R10 (diễn tập không chạm log thật).** Nhật ký sự kiện append-only bất biến → một event diễn tập lọt vào là rác vĩnh viễn: canary/drill LUÔN chạy trên repo mồi dùng-xong-vứt; chỉ dogfood việc-thật mới ghi log thật — và đó là lịch sử vận hành chủ đích (per f3a16887).
- **R11 (thang kiểm chứng).** T0 suite executor-giả mọi commit · T1 dogfood việc thật hằng ngày · T1c canary khai-môi-trường (worker tự báo pwd/git-root/doctrine nó thấy, verify assert từng dòng) định kỳ và sau mỗi đổi harness · T2 máy-trắng (HOME giả + credential tối thiểu) trước release (per f3a16887). Bất biến nền: mỗi agent khởi đầu tại project-root CỦA NÓ — thợ ở xưởng, worker ở git-root của worktree nó đứng.
- **R12 (khoá liên-tiến-trình).** Mỗi kho chỉ một runner sống tại một thời điểm: đầu MỌI lần chạy (trước cả bước gặt-lại — gặt cũng ghi trạng thái), runner chiếm khoá độc quyền trong vùng trạng thái, ghi định danh tiến trình của mình. Kho đang có runner sống → lần chạy mới thoát «bận» bằng mã thoát riêng (không trùng mã nào hiện hành): không ghi trạng thái, không đụng worktree, không đụng khoá của người giữ. Khoá của runner đã chết (crash để lại, hoặc nội dung không chứng minh được chủ sống) → **dọn-rồi-nhường**: kiểm nội dung sát trước khi xoá (đổi rồi thì không đụng), xoá xong lượt đó vẫn lui ra «bận» — không lượt chạy nào vừa xoá khoá vừa tự chiếm trong cùng một lần, nên hai lượt cùng gặp khoá chết không thể cướp khoá mới của nhau; lượt kế tiếp chiếm khoá sạch (sau crash, phục hồi trọn trong hai lượt). Khoá luôn được nhả trên mọi đường thoát.
- **R13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại).** Mỗi lần dispatch, runner ghi bản ghi outcome ở CẢ hai đầu: nửa dự đoán lúc nhận việc, nửa thực tế ở MỌI kết cục cuối — thành đề xuất, bị đỗ, hay bị dừng — không bao giờ chỉ ghi khi thành công. Giá trị thực tế luôn lấy từ phép đo goal-check/kiểm nhánh của chính runner, không bao giờ từ báo cáo tự khai của trợ lý (per D2/D3 phase-3-compound-learning / 1a80b4d3; mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở R3). Bản ghi outcome đọc lại được qua lệnh đọc-thuần `fgos check` của tầng Work-State — runner không có verb ghi riêng cho việc này.
- **R14 (quét làm-rõ chạy trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau gặt-lại và trước khi tìm việc thi công, runner quét TOÀN BỘ item `stage: clarify` + `status: todo` và tự chạy context-discovery — không đọc/không rẽ nhánh theo field `mode` của item (per D5/D13 stage-clarify / 9a19eea5, xem spec Work-State R17-R19). Never chạm item `awaiting-human` — cùng luật loại-trừ R6/R15 của tầng Work-State áp cho cả bước quét này. Đây là lưới đỡ: phiên submit sống chết giữa chừng không để lại việc kẹt vô hình.
- **R15 (actor trên mọi ngã-ngũ tự động của runner).** Mọi ngã-ngũ mà runner TỰ ghi trong vòng dispatch (quét làm-rõ cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ) mang `actor` = `runner`; ngã-ngũ do phiên sống gọi tay context-discovery/phán chia-việc mang `actor` = `session`; ngã-ngũ do người gọi qua lệnh CLI mang `actor` = `human` — ba giá trị phủ hết mọi đường ngã-ngũ hiện có, không đường nào bị bỏ sót (per D2 phase-3-compound-learning S3-closeout / 96a65365; xem spec Work-State "Bản ghi settlement").
- **R16 (điểm entropy luôn giải thích được + luôn kèm xu hướng).** Điểm entropy trên `check` không bao giờ là một con số đơn độc — luôn kèm các thành phần đã cộng nên nó, và luôn so với lần `check` gần nhất (lần đầu là baseline). Seal-digest chỉ im lặng một mệnh đề khi kênh đó thật sự không có gì để nói (số đếm hiện tại VÀ chênh lệch đều bằng 0) — một kênh có dữ liệu nhưng không đổi từ lần trước vẫn in ra "không đổi" (per D2 phase-3-compound-learning S3-closeout / 96a65365).
- **R17 (quét chia-việc chạy ngay sau quét làm-rõ, trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau quét làm-rõ và trước khi tìm việc thi công, runner đọc lại view tươi rồi quét TOÀN BỘ item `stage: decompose` + `status: todo` và tự chạy phán chia-việc — không đọc/không rẽ nhánh theo field `mode` của item. Never chạm item `awaiting-human` — cùng luật loại-trừ R6/R15 Work-State áp cho bước quét này. Đọc view tươi sau quét làm-rõ nghĩa là một item vừa rời clarify trong CÙNG lượt chạy vẫn được quét chia-việc ngay, không đợi lượt sau (per D2 stage-decompose / 43f257ae, xem spec Work-State "Giai đoạn Chia-việc").
- **R18 (gặt-lại claim-actor-aware — không giẫm người/phiên cầm qua cửa pull).** Bước gặt-lại lúc khởi động CHỈ gặt claim mà chính runner đã tạo và crash giữa chừng; một item `doing` mang `claimActor` `human`/`session` (đến từ `fgos take` — spec Work-State "Cửa pull giao–nhận việc") không bao giờ bị reclaim, dù nó không mang commit/proof nào — người/phiên cầm việc vô thời hạn cho tới khi chính họ `fgos return`. Đây là một THU HẸP thuần túy của tập item vốn đã bị reap — không mở rộng, không giảm an toàn của gặt-lại cho claim của chính runner (per D1 stage-decompose, chốt tại validating sau 1 BLOCKER / 43f257ae, 6f2cbc47, a30a3d3c).
- **R19 (`return` mirror trung thực contract `proposed` của runner, không tin lời).** Cửa pull `return` chỉ chuyển `doing → proposed` sau khi TỰ đo — không tin báo cáo của người gọi — cả ba: working tree host repo sạch, HEAD tiến so `headAtTake` ghi lúc `take`, và verify thật của item chạy xanh qua CÙNG hàm goal-check runner dùng (`runGoalCheck`, `src/runner/goal-check.mjs`) — mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở R3/R13 sang tác nhân cửa pull. Verify đỏ đi đúng đường `blocked` + friction lớp `verification`, y hệt đường đỗ chấm-trượt của chính runner; không sinh settlement ở `return` (settlement thuộc cạnh `→done`, per D4 stage-decompose — xem spec Work-State) (per D1 stage-decompose / 43f257ae, 6f2cbc47, a30a3d3c).
- **R20 (cổng duyệt là cửa MỘT DUY NHẤT cho mọi đề xuất, bất kể nguồn).** `review`/`approve`/`reject` hành động trên CẢ hai nguồn đề xuất — runner (nhánh `fgw/<id>`) và pull-door (dải `headAtTake→headAtReturn`) — qua cùng một luật, không hai bộ quy tắc song song; đề xuất di sản (thiếu cả nhánh lẫn cặp head) degrade trung thực (một cảnh báo, không throw) thay vì bị từ chối hoàn toàn (per D4 pr-lifecycle / 1359ab5e).
- **R21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do).** `approve` trên nguồn runner không bao giờ để main ở trạng thái merge dở trên bất kỳ đường thoát nào: conflict hoặc verify đỏ sau merge đều `git merge --abort` (main nguyên vẹn byte-for-byte, chứng minh bằng spike + test thật) rồi đậu item ở `blocked` mang lý do cụ thể (`merge-conflict`/`verify-fail-post-merge`) — KHÔNG tự rebase, KHÔNG halt cả vòng runner. `done` qua approve luôn mang actor `human` (per D3 pr-lifecycle / 1359ab5e — người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học, per vision §8 "người ở cổng").
- **R22 (reject không bao giờ đảo lịch sử).** `reject` là một move FSM thuần `proposed→todo` mang `reason`; không bao giờ gọi một lệnh git nào, kể cả cho một đề xuất pull-door đã có code thật trên main — code đó ở lại như lịch sử, `reject` chỉ từ-chối coi-là-xong, không revert/rewrite (per D4 pr-lifecycle / 1359ab5e).
- **R23 (phản hồi người threading vào prompt worker).** Prompt dựng cho worker (`buildPrompt`) mang thêm một mục `# Human feedback` TÙY CHỌN khi item mang câu trả lời làm-rõ mới nhất (fold từ cổng chờ-người, xem spec Work-State "Bản ghi cổng-người") và/hoặc lý do từ-chối/đỗ mới nhất (`item.reason`, xem spec Work-State Data Dictionary #18): câu trả lời in NGUYÊN VĂN dưới nhãn quyết-định-cuối-cùng-ràng-buộc, lý do mới nhất in NGUYÊN VĂN dưới nhãn ưu-tiên-sửa-trước-tiên. Vắng cả hai → mục này KHÔNG xuất hiện, prompt giữ nguyên byte-identical hình cũ (cộng thêm thuần, không phá vỡ hợp đồng 4 section pin sẵn có). Runner đọc lại view TƯƠI ngay trước khi spawn worker (item truyền vào dispatch có thể cũ hơn move gần nhất của chính lượt gặt-lại/quét) rồi truyền `feedback: {answer, reason}` xuống `spawnWorker`. Đây là cách một vòng reject hội tụ: dogfood-thật cho thấy không có mục này, worker vòng sau lặp lại đúng đề xuất vừa bị từ chối vì không thấy lý do (per worker-execution P33 / 396d9d9e).
- **R24 (một-người-ghi vẫn giữ nguyên dưới song song, qua một cửa ghi tuần tự).** Dù nhiều việc thi công đồng thời trong một mẻ, MỌI thay đổi trạng thái (nhận việc, đề xuất, đỗ, nhập) đi qua ĐÚNG một cửa ghi tuần tự — một giao dịch ghi trọn vẹn rồi mới tới giao dịch kế tiếp, không bao giờ hai thay đổi chen lẫn nhau giữa chừng. Đây là hệ quả trực tiếp của R1 dưới điều kiện mới: song song ở việc THỰC THI (nhiều worker chạy đồng thời), không phải ở việc GHI (per D16 fan-out-parallel).
- **R25 (cây chính chỉ nhận nguyên một tính năng đã xong, không mảnh dở — SUPERSEDE quyết định trước đó).** Một việc CON không bao giờ nhập thẳng vào cây chính — nó nhập vào nhánh của GỐC nó; chỉ đề xuất của chính GỐC (sau khi mọi con đã xong) mới nhập vào cây chính, đúng một lần cho cả tính năng. Điều này THAY quyết định trước đây ("mỗi việc một đề xuất, thẳng vào cây chính") trong bối cảnh một việc có con — quyết định cũ vẫn đúng nguyên vẹn cho một việc ĐỘC LẬP (không con), đi thẳng đường cũ không đổi (per D2/D3 fan-out-parallel / 2e92b7a5, supersede-in-context quyết định D2 pr-lifecycle).
- **R26 (quyền-sở-hữu-gốc — mọi con của một gốc về tay cùng một chủ trong một lượt chạy).** Lúc con ĐẦU TIÊN của một gốc được nhận trong một lượt chạy, gốc đó gắn chủ; con tiếp theo của CÙNG gốc chỉ được nhận bởi ĐÚNG chủ đó — một chủ khác giành nhận bị từ chối (cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác), việc đó ở lại chờ mẻ sau. Chủ xả khi gốc xong. Bảo vệ nguyên tắc "mọi con của một gốc chung một không gian làm việc" (per D5/D13 fan-out-parallel).
- **R27 (nhập gốc→cây chính bắt CẢ xung đột văn bản LẪN trôi ngữ nghĩa im lặng).** Một GỐC từng có con, lúc nhập vào cây chính, được kiểm CẢ hai: nhập có xung đột văn bản không, VÀ sau khi nhập (chưa chốt) verify của chính gốc còn xanh không trên cây đã nhập — verify đỏ ở bước này là TRÔI ngữ nghĩa (nhập sạch nhưng kết hợp gãy), bị coi ngang xung đột văn bản: hủy sạch, cây chính không bao giờ giữ một nhập xanh-mà-gãy (per D6/D9 fan-out-parallel / f0c40acc). Vì đây là phép kiểm DUY NHẤT cho cả cây hậu duệ, verify của gốc phải đủ mạnh lúc soạn — verify mỏng bỏ lọt trôi ngữ nghĩa.
- **R28 (đồng bộ-lại sạch = cơ học không đếm; làm-lại tay = có đếm).** Một việc đỗ vì gãy nhập được đồng bộ-lại: nếu sau khi kéo đích mới nhất vào, nhập sạch VÀ verify xanh, việc trở lại sẵn sàng nộp lại theo đường cơ học (không qua "đang làm", không tính vào ngân sách chống-lặp của việc) — phân biệt với người CHỌN cầm việc qua cửa pull để tự làm-lại tay, đường đó QUA "đang làm" như bình thường và ĐƯỢC đếm (per D11/D18 fan-out-parallel).
- **R29 (cổng chống-lặp reset theo can thiệp người CUỐI CÙNG của chính việc, per-item, trigger-set đóng).** Cổng chặn dispatch (khác `visitCount` lifetime metric ở R13 — xem Data Dictionary #4/#4b) đếm `visitsSinceLastHumanEvent`: số lần việc vào `doing` KỂ TỪ sự kiện người cuối cùng của CHÍNH việc đó. Trigger-set đóng — chỉ hai hình reset: việc rời `awaiting-human` bằng một câu trả lời của người (`answer`, actor `human`), hoặc một move mang `reason` VỚI actor `human` (reject/park do người quyết). Một lần resume trần (`blocked→todo` không `reason`), một lần người `take` việc (`blocked→doing`, actor `human`, không `answer`/`reason`), và mọi move của chính runner (kể cả park mang `reason` của chính nó) đều KHÔNG reset — chỉ tính là một visit như mọi lần khác. Không có sự kiện người nào của việc → ngân sách bằng đúng lifetime `visitCount` (một vòng lỗi máy thuần vẫn chết ở trần 3, không đổi). `MAX_VISITS=3` và mọi call site của `visitCount` (outcome/metric đã ship) giữ nguyên — chỉ điểm CHẶN DISPATCH đổi công thức đếm (per D1 human-rounds / 5a6900b2).
- **R30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới).** Một việc `blocked` mang nhánh đề xuất còn sống (`fgw/<id>`) — kể cả bị đỗ do chạm trần chống-lặp — có cửa công khai để người hoàn tất: `take` claim qua cạnh `blocked→doing` sẵn có, ghi `branchHeadAtTake` (HEAD của NHÁNH lúc take — discriminator DUY NHẤT của nguồn-nhánh, không dùng `classifySource` để phân biệt vì nó ưu-tiên-nhánh); người commit thêm lên nhánh; `return` kiểm `branchHeadAtTake` TRƯỚC mọi guard main-based (cây làm việc chính của người không bao giờ bị đọc/đụng), verify chạy trong một worktree TẠM, DETACHED tại đúng SHA của nhánh (không bao giờ checkout theo tên, không `reclaimOrphanedCheckout` — an toàn cả khi người đang đứng trên chính nhánh đó ở một worktree khác) → sạch + xanh → `proposed` mang `branchHeadAtReturn`; **TUYỆT ĐỐI không ghi `headAtReturn`** cho nguồn-nhánh (trộn hai marker cho `reviewDiff` một dải vô nghĩa). Không commit mới trên nhánh, hoặc verify đỏ trong worktree tạm → từ chối rõ lý do, việc giữ nguyên `doing`. Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` như bình thường (nhánh `fgw/<id>` còn sống — không cần đổi `classifySource`/`merge.mjs`) và đi qua CÙNG cổng duyệt PR nội bộ (per D2 human-rounds / 5a6900b2, xem spec Work-State "Cửa pull giao–nhận việc").

- **R31 (kỷ-luật-output NỚI RỘNG: console + bản ghi cục bộ riêng-từng-việc, KHÔNG BAO GIỜ vào cây committed — SUPERSEDE một phần quyết định trước).** Trước đây output của trợ lý chỉ in console, không ghi ra file nào. Nay MỌI kết cục của một lượt dispatch — thành đề xuất, chấm-trượt, quá-giờ, hỏng-spawn (kể cả tràn bộ đệm) — đều CÒN được ghi thêm vào một bản ghi cục bộ, một file riêng mỗi việc, gộp theo thời gian qua các lần thử. Nửa bảo đảm gốc vẫn giữ nguyên tuyệt đối: bản ghi này không bao giờ vào cây committed (không git-track được) — chỉ nửa "không ghi ra file nào cả" bị nới. Một lượt dispatch hỏng trước khi trợ lý sinh ra output (lỗi worktree, không phải lỗi trợ lý) vẫn ghi được một khối (chỉ mang loại lỗi + thông điệp), không throw vì thiếu trường (per D1/D2/D3/D4 worker-dispatch-log / 8575f1a3). **Bổ chú (20260717, review-20260717-daily-batch, review finding F-P1-1):** bản ghi cục bộ này KHÔNG BAO GIỜ throw ra ngoài, dù chính thao tác ghi thất bại (đĩa đầy, không có quyền ghi, thư mục chỉ-đọc) — bản ghi này là quan sát thuần, không bao giờ được phép làm hỏng hay che khuất kết cục dispatch thật; một lần ghi hỏng chỉ âm thầm bỏ qua (trả về rỗng), không bao giờ lan ra ngoài `dispatchClaimedItem`.

## Edge Cases Settled

- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → proposed, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`proposed→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos check` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét làm-rõ với model trả lời rác/timeout: không crash vòng chạy — item rơi về `awaiting-human` với câu hỏi mặc định cố định, lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng một lần chạy thật với executor kịch bản in stdout không phải JSON.
- Item vừa qua quét làm-rõ trong CÙNG lượt chạy: nếu deps cũng đã xong, vòng dispatch bên dưới nhặt được ngay, không cần đợi lượt chạy kế tiếp — chứng minh bằng e2e một lượt `--once` duy nhất đưa item từ `clarify` tới `proposed`.
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét làm-rõ, nhận việc, đề xuất, đỗ) đều mang đúng `actor` = `runner`; ngã-ngũ đóng tay qua CLI mang `actor` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét làm-rõ rồi quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai stage (`clarify → decompose → executing`) hoàn tất và item tới `proposed` trước khi lượt chạy đó kết thúc — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Item phức tạp sinh ≥2 con qua quét chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời clarify) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt quét sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với stage-clarify.
- Quét chia-việc với model trả lời rác/timeout, hoặc verdict chia có con thiếu verify: không crash vòng chạy — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimActor` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `proposed` → `review` → `approve` → merge → `done`, mang settlement actor human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge, per D4) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (D4 no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (R29).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc R29 được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `proposed` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (R30).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của R10 Work-State, mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
- Chưa có escalation tự động khi một việc trải qua NHIỀU vòng người liên tiếp mà vẫn chưa hội tụ (vd item nổi lên "cần bàn sâu" sau N vòng người) — R29 chỉ mở lại ngân sách theo can thiệp người, không giới hạn tổng số vòng người; escalation dạng đó cần intent-scoring và deferred có chủ đích (human-rounds D1, xem `docs/backlog.md` P8).
- Nhiều tiến trình/máy ghi trạng thái thật cùng lúc (đa-writer, đa-máy) chưa được dựng — quyền-sở-hữu-gốc hôm nay chỉ sống trong bộ nhớ của MỘT lượt chạy, không bền qua tiến trình/máy khác; một lượt chạy thứ hai trên máy khác không biết gì về chủ của lượt thứ nhất (deferred, backlog P27).
- Nạp mẻ mới hôm nay là chờ-mẻ-trước-xong-rồi-đọc-lại (poll khi một việc trong mẻ hoàn tất), không phải phản ứng tức thời theo tín hiệu bên ngoài; và vòng chạy vẫn kết thúc khi hết việc (không sống liên tục chờ việc mới) — cả hai là ranh giới có chủ đích với một cơ chế phản ứng-theo-tín-hiệu-liên-tục rộng hơn (deferred, backlog P8).
- Chưa có ưu tiên nhập khi nhiều gốc cùng cạnh tranh cây chính — một gốc thua một lần đồng bộ-lại rồi thua lại lần sau (do gốc khác vào trước liên tục) không có cơ chế được ưu tiên hơn ở lần thử kế tiếp (deferred, backlog P7).
- Khi đồng bộ-lại gặp xung đột thật, không có agent nào tự giải xung đột rồi đưa người duyệt lại — người luôn phải tự đọc và sửa tay (deferred lên một tầng cao hơn, backlog P19).
- Chưa dự đoán trước những việc con nào của cùng một gốc khả năng chạm cùng chỗ để xếp chúng chạy nối tiếp thay vì song song — hai con cùng gốc chạm cùng chỗ vẫn ĐÚNG (một con catch-up/làm-lại), chỉ không phải TỐI ƯU (giảm việc-song-song-phí là một cải tiến hiệu năng hoãn lại, không phải một lưới đúng-sai, deferred, backlog P16).
- Một cây nhiều hơn hai tầng (gốc-của-gốc, cháu) hôm nay chưa từng được tạo ra bởi hệ thống (phán chia-việc chỉ sinh con ở đúng một tầng dưới gốc) — cơ chế cây nhánh tích hợp phân giải MỌI con về nhánh của ĐỈNH cây (không phải nhánh của cha trực tiếp), điều này chỉ tương đương với "con nhập vào nhánh cha" khi cây đúng hai tầng; một cây sâu hơn hai tầng, nếu tương lai sinh ra được, sẽ cần xác nhận lại điều này còn đúng hay không — chưa kiểm chứng vì chưa có dữ liệu thật để thử.
- Cổng duyệt PR nội bộ do người gọi tay không có khóa chống hai lần gọi cùng lúc trên cùng một gốc (vd người duyệt hai việc con cùng gốc gần như đồng thời, hoặc người duyệt trong khi chính vòng tự hành đang dispatch gốc đó) — rủi ro thấp dưới một người vận hành, một cửa ghi tuần tự chỉ bảo vệ phần ghi trạng thái chứ không khóa riêng thao tác nhập của cổng duyệt tay; chưa xảy ra thật, ghi nhận như một giả định chưa kiểm.

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--config), exit theo phạm trù
- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem "Gặt-lại lúc khởi động") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='clarify' && status==='todo'` (không đọc `item.mode`) và gọi `resolveDiscovery` (`src/intake/discovery.mjs`) cho từng item, truyền `'runner'`; (2) đọc lại view tươi rồi quét mọi item `stage==='decompose' && status==='todo'` và gọi `resolveDecompose` (`src/intake/decompose.mjs`) cho từng item, cùng truyền `'runner'` — cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời clarify; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `actor:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution P33 / 396d9d9e, xem R23); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`modelForTier` (tái dùng bởi discovery.mjs VÀ decompose.mjs cho lời gọi model phán); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem R23); `description` là `work.description` nguyên văn, degrade "(không có)" khi vắng (per discovery-context P30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc, per D3/D4/D17); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `actor==='human'` mang `answer` hoặc `reason`, xem R29) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (D10/D13/D14/D15, cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos-runner.json`, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue()` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành của D13), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `root-affinity.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (D15); `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item
- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song
- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ nay `moveStage` tới `decompose`, không còn thẳng `executing`; `judgeDiscovery` nhận thêm `view` tùy chọn (per discovery-context P30) — cả sweep của runner LẪN verb `discover` truyền view đã đọc sẵn, không lời gọi nào cần đọc thêm
- `src/intake/decompose.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover` khi item ở stage `decompose`); verb `discover` (phiên sống) truyền `'session'`
- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`entropy-history.jsonl`, cùng thư mục dữ liệu với `events.jsonl`) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này
- `.fgos-runner.json` — config committed (executor template + models light/haiku, standard/sonnet, heavy/opus + timeoutMs); `executor.args` mang `--permission-mode acceptEdits` + `--allowedTools "Bash(git add:*),Bash(git commit:*)"` (quyền TỐI THIỂU, xem R6); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa)
- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue()`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau (D16); hiện thực in-process của "cửa ghi" D12
- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process, per D13): `createOwnershipStore()` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này
- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `actor` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle D1)
- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State "Cửa pull giao–nhận việc" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (R30, xem spec Work-State "Cửa pull giao–nhận việc")
- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per D1-D5 pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per D3 fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → commit-hoặc-abort, spike-proven; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort). KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`proposed→done`/`proposed→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra
- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem "Cổng duyệt PR nội bộ" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `root-affinity.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường (D8); gốc không con giữ nguyên hành vi/lý do cũ, không đổi
- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem "Đồng bộ lại một việc đỗ (catch-up)" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `integration-drift`} và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'proposed', expectedStatus:'blocked')` — cạnh D18, không `reason`, không qua `doing` (per D6/D7/D11, spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)
- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop P13 Slice 1, per D6/D11/D12): thuần (`rankCandidates(view)`), không fs/Date.now(), tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa "chưa ngã-ngũ" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.
- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem "Gate A — xếp hạng candidate (evolve)" trên cho hợp đồng đầy đủ): hai bước, KHÔNG BAO GIỜ stdin tương tác (D11) — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới). Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore` — nên không sự kiện nào vào nhật ký, không dòng nào vào `state.json`, không tiến trình con git nào.
- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per D3 worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed, per D4/D1) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent` (per D3). Manifest layer (`docs/architecture-manifest.json`): infra.
- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy
- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-clarify + 3 kịch bản stage-decompose: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimActor`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→proposed`, D18) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 637 test toàn suite (`cd repo && npm test`)
