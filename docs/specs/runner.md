---
area: runner
updated: 2026-07-16
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e]
coverage: full
---

# Spec: Runner (vòng tự hành)

Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-state, giao cho một trợ lý thông minh chạy nền trong không gian cô lập, tự chấm kết quả bằng proof của chính việc đó, rồi ghi lại thành **đề xuất chờ duyệt**. Người dùng: người vận hành repo (khởi động vòng, duyệt đề xuất). Nguyên tắc sống còn: trong vòng dispatch, chỉ runner được ghi trạng thái; worker chỉ để lại commit trên nhánh riêng.

## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc → chấm → ghi (mặc định Phase 2, tuần tự một việc)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): việc kẹt ở `doing` từ lần chạy đổ trước được giải quyết trước khi tìm việc mới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét làm-rõ** (clarify sweep) — xem "Quét làm-rõ trước dispatch" dưới
- Ngay sau quét làm-rõ, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** (decompose sweep) — xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua đúng CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `proposed` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door — xem "Cổng duyệt PR nội bộ" dưới

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế {prompt}/{model} theo từng phần tử, không bao giờ qua shell) · `models` — bảng tier→model (light/standard/heavy) · `timeoutMs` — trần thời gian một worker | yes | có sẵn bản mặc định |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp | visitCount: số lần một việc vào `doing` — dẫn xuất từ nhật ký sự kiện, không trường mới; trần mặc định 3 (provisional) | — | — | — |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3 | — | — | — |

## Behaviors & Operations

### Một vòng --once (hạnh phúc)

- **Runs when:** người vận hành gọi; tuần tự đúng một việc.
- **What changes:** việc đầu frontier được claim (`todo→doing` có kỳ vọng); **ngay sau khi claim, runner ghi nửa DỰ ĐOÁN của một bản ghi kết quả (outcome) cho việc đó** — tier dự kiến, số dep, số lần nhận trước đó (xem spec Work-State); worktree + nhánh `fgw/<id>` mở ra từ đỉnh cây chính; trợ lý chạy nền với prompt dựng từ chính việc đó (mục tiêu / ranh giới worktree / proof kỳ vọng / cấm tự ghi trạng thái), model chọn theo tier của việc; trợ lý tự commit trong worktree; **runner tự chạy lệnh proof của việc trong worktree** — không tin lời trợ lý; đạt → `doing→proposed`, và **CÙNG LÚC runner ghi nửa THỰC TẾ tương ứng** (kết cục `proposed`, goal-check đạt, số lần thử, số commit, số lần nhận) — đo từ chính goal-check/kiểm nhánh của runner, không bao giờ từ lời tự báo của trợ lý; worktree dọn đi, **nhánh ở lại** làm đề xuất.
- **Side effects:** đúng các sự kiện chuyển trạng thái trong nhật ký; output chạy chỉ in console, không bao giờ ghi vào cây committed.
- **Afterwards:** người vận hành thấy việc ở `proposed` + nhánh để review; việc phụ thuộc CHƯA mở (chờ duyệt/merge → `done`); vòng --once thứ hai không giao lại việc nào (frontier trống).

### Quét làm-rõ trước dispatch (clarify sweep)

- **Runs when:** mỗi lượt chạy, ngay sau gặt-lại, TRƯỚC khi giao bất kỳ việc
  thi công (executing) nào.
- **What changes:** mọi việc đang ở stage `clarify` VÀ status `todo` (xem
  spec Work-State "Giai đoạn Làm-rõ") được chạy context-discovery — BẤT KỂ
  giá trị `mode` của item mang gì (mode chỉ là quy ước ai NÊN gọi trước,
  không phải điều kiện runner rẽ nhánh). Việc đang `awaiting-human` (đã hỏi,
  chưa ai trả lời) KHÔNG BAO GIỜ bị quét lại — cùng luật loại-trừ với dispatch
  thường (xem R6 Work-State/R15).
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

- **Runs when:** người vận hành gọi `fgos review <id>` / `fgos approve <id>
  [--timeout <ms>]` / `fgos reject <id> --reason "..."` trên một item đang
  `proposed`.
- **Blocked when:** item không tồn tại — `validation`; item không ở
  `proposed` — `precondition` ("nothing to review/approve/reject"); `reject`
  thiếu `--reason` — `validation` (bắt buộc, cùng khuôn `proposed→todo`);
  `approve --timeout` không phải số dương — `validation`; `approve` trên
  nguồn `runner` khi working tree của main KHÔNG sạch — `validation`. Không
  nhánh chặn nào ghi sự kiện.
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

## Business Rules

- **R1.** Trong vòng dispatch, runner là người ghi duy nhất qua một cửa; worker không bao giờ tự ghi trạng thái (per D3 phase-2-routing / feed7428).
- **R2.** Kết quả worker là ĐỀ XUẤT mức bền D1: commit trên nhánh `fgw/`, phải qua người duyệt mới thành `done`; không bao giờ tự merge (per D4; auto-merge là backlog P9).
- **R3.** Runner tự chạy proof của việc làm goal-check — lời trợ lý không bao giờ là bằng chứng (per D3).
- **R4.** Tuần tự một việc một lúc; nâng song song chỉ sau khi chống-lặp chứng minh trong vận hành thật (A1 — ngưỡng tên, backlog P6).
- **R5.** Model chọn theo tier của việc qua bảng cấu hình (per D6); tập tier reconcile một nguồn tại đây.
- **R6.** Chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, KHÔNG phải sandbox: worker chạy full quyền user. Bất biến phải giữ: work item (nhất là trường proof — được chạy như lệnh shell) do chính người dùng tạo; không bao giờ nạp việc từ nguồn ngoài khi chưa có vòng kiểm (security panel, ghi trong hợp đồng handoff).
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

## Open Gaps

- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của R10 Work-State, mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--config), exit theo phạm trù
- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem "Gặt-lại lúc khởi động") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='clarify' && status==='todo'` (không đọc `item.mode`) và gọi `resolveDiscovery` (`src/intake/discovery.mjs`) cho từng item, truyền `'runner'`; (2) đọc lại view tươi rồi quét mọi item `stage==='decompose' && status==='todo'` và gọi `resolveDecompose` (`src/intake/decompose.mjs`) cho từng item, cùng truyền `'runner'` — cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời clarify; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `actor:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`modelForTier` (tái dùng bởi discovery.mjs VÀ decompose.mjs cho lời gọi model phán); `worktree.mjs` — lifecycle + reclaimOrphanedCheckout; `recovery.mjs` — 8 lớp; `anti-loop.mjs` — visitCount/breaker
- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song
- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ nay `moveStage` tới `decompose`, không còn thẳng `executing`
- `src/intake/decompose.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover` khi item ở stage `decompose`); verb `discover` (phiên sống) truyền `'session'`
- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`entropy-history.jsonl`, cùng thư mục dữ liệu với `events.jsonl`) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này
- `.fgos-runner.json` — config committed (executor template + models light/haiku, standard/sonnet, heavy/opus + timeoutMs)
- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `actor` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle D1)
- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State "Cửa pull giao–nhận việc" cho hợp đồng đầy đủ)
- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per D1-D5 pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff` (diff theo nguồn + cảnh báo degrade trung thực); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → commit-hoặc-abort, spike-proven); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort). KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`proposed→done`/`proposed→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra
- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem "Cổng duyệt PR nội bộ" trên cho hợp đồng đầy đủ)
- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy
- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-clarify + 3 kịch bản stage-decompose: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade) + `test/state/replay.test.mjs` (fold `claimActor`/`headAtTake`/`headAtReturn`) + `test/report/entropy.test.mjs` (entropy thuần) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 508 test toàn suite
