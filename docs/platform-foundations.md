# Luật nền platform forgent (Phase 0 — compound-learning stack)

Tài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack
(state/FSM → routing → compound-learning). Mỗi luật kèm: phát biểu, nguồn gốc
bằng chứng (cú pháp `nguồn:slug` tra trong `docs/distillery/sources/`), hệ quả
thực hành, và **ngưỡng xem lại** — luật không bất tử, nó bất tử *cho tới khi
ngưỡng có tên của nó bị chạm*. Quyết định gốc mang D-ID trong
`.bee/decisions.jsonl`; chất liệu đầy đủ:
`plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`
+ `docs/distillery/deep-dives/{state,compound-engineering,routing}.md`.

Trạng thái: **chốt 2026-07-13/14** (user). Thay đổi luật = supersede quyết định
D-ID tương ứng, không sửa tại chỗ.

---

## L1 — Hai vật lý của tri thức: Log vs State

**Luật.** Mọi mẩu dữ liệu bền của forgent phải được khai, ngay lúc thiết kế,
là một trong hai:

- **Log** — append-only, tổ chức theo *feature/phiên*, trả lời "làm sao tới
  đây"; không bao giờ overwrite. (vd: `plans/reports/`, decisions.jsonl,
  changeset)
- **State** — overwrite theo reality, tổ chức theo *area*, trả lời "đang ở
  đâu"; luôn phản ánh hiện tại. (vd: `docs/distillery/sources/*.md`, state.json)

Một artifact không khai được nó thuộc vật lý nào là lỗi thiết kế, không phải
chi tiết để sau.

**Nguồn.** `beegog:state-vs-log-two-physics` ("đa số hệ chỉ có log");
harness ngầm cùng mô hình (changesets=log, db=state). forgent đã theo pattern
này một cách ngầm (distillery=state, reports=log) — luật này chỉ phát biểu
thành văn. D-ID `ca7de3cf`.

**Hệ quả.** Review mọi thiết kế state layer bắt đầu bằng câu hỏi "log hay
state?"; file lai (vừa append vừa sửa) phải tách đôi.

**Ngưỡng xem lại.** Không có — đây là luật phân loại, không phải trade-off.

## L2 — Kiến trúc memory hai tầng

**Luật.** forgent dùng ĐỒNG THỜI hai mô hình memory, phân theo tầng:

- **Lower layer** (cơ học, raw, chính xác: state/FSM, cells, cursor,
  changeset) → chỉ hai-physics của L1. Không TTL, không tự quên, không
  consolidation.
- **Higher layer** (process, framework, skill — nơi agent học pattern) →
  bốn memory-type (working / episodic / semantic / procedural) + consolidation
  loop + quên có trọng số bằng chứng.

Hai mô hình không phủ định nhau; sai lầm cần tránh là dùng typed-memory cho
tầng máy (over-engineering) hoặc chỉ hai-physics cho tầng học (agent không
tích lũy được).

**Nguồn.** Synthesis của user 2026-07-13 trên `beegog:state-vs-log-two-physics`
× `marketing-cockpit:four-memory-types` + `procedural-memory-reinforcement`;
tham khảo thêm `beads:remember-prime-memory-loop` (memory-là-node-đồ-thị) và
`beads:llm-tier-compaction` (quên = nén bằng LLM rẻ + giữ snapshot) khi dựng
higher layer. D-ID `ca7de3cf`.

**Hệ quả.** Port `typed-memory-consolidation` chỉ khi dựng higher layer
(sau Phase 1–2); retention math (TTL, ±confidence) tự hiệu chỉnh, không bê
nguyên số fgOS.

**Ngưỡng xem lại.** Nếu higher layer không bao giờ thành hình (forgent dừng ở
harness/tooling), tầng 4-memtype tự rơi — không nợ gì.

## L3 — Luật store: truth ở JSONL, db là view

**Luật.** Bất kỳ database nào vào forgent đều phải thỏa:

1. **Truth = changeset JSONL committed trong git** (semantic operations,
   full-record, append trong cùng transaction với mutation).
2. **DB là materialized view** — rebuild được từ zero bằng replay changeset.
3. **Graph store (nếu có) là view cấp 2** — dựng từ db hoặc từ changeset,
   không bao giờ được ghi ngược.
4. Mọi ghi đi qua MỘT cửa CLI (đơn writer hiện tại; xem L-CAS trong Phase 1).

Nhờ luật này, chọn engine là quyết định *đảo-ngược-được*: SQLite hôm nay,
engine khác mai kia, chỉ cần replay.

**Nguồn.** `repository-harness:changeset-event-sourcing` (đã dogfood, giải
"SQLite không diff được trong git"); `symphony:changeset-content-sha-immutability`
(content-addressed chống double-apply). Engine ưu tiên khi tới ngưỡng: SQLite
(recursive CTE đủ cho traversal vừa); graph engine chỉ khi traversal là nút
thắt đo được (LadybugDB là ứng viên sống duy nhất; CozoDB dormant từ 12/2023).
D-ID `ae461c8b`.

**Ngưỡng xem lại (có tên, từ evidence beads 2026-07-14).**
`beads:dolt-as-versioned-truth`: beads đã RẼ KHỎI JSONL-truth sang
Dolt-as-truth khi **multi-agent write trở thành tải chính**. Luật L3 đứng vững
cho forgent vì hai tiền đề: (a) single-writer, (b) cần git-diffable. Khi tiền
đề (a) gãy — nhiều agent ghi đồng thời như tải chính — phải mở lại luật này
với beads làm case study, không vá tại chỗ.

## L4 — Routing model theo audience của từng interface

**Luật.** Không có MỘT mô hình routing toàn cục. Mỗi interface chọn mô hình
theo audience của nó:

- **Agent ↔ agent trong chain** (mặc định của forgent — multi-skill đã chốt):
  prose-handoff tường minh (câu handoff cuối skill, bảng entry-router) + hook
  nudge advisory. LLM đọc prose tốt hơn parse JSON.
- **Interface chạm consumer không-chắc-là-agent** (CLI, hook, CI, script
  ngoài): kỷ luật data — exit-code theo phạm trù ("branch on code, never on
  message"), decision-table tường minh cho mỗi state khả dĩ, mutation timeout
  = bất định → rediscover trước retry.

**Nguồn.** Deep-dive `routing` (4 nguồn): `beegog:hive-first-skill-router` vs
`repository-harness:protocol-next-action-table`; symphony là consumer thực
chứng của trường phái data. Nguyên lý con đi kèm (5 nguồn hội tụ độc lập):
**"việc kế tiếp = truy vấn dẫn xuất từ state"**, không bao giờ là danh sách
tay (readyCells ↔ runnable ↔ board-precedence ↔ signal-consume ↔ bd ready).
D-ID `14ebeea9`.

**Hệ quả.** Thiết kế mỗi interface mới bắt đầu bằng câu "ai đọc đầu ra này?";
reliability layer (anti-loop, recovery-matrix, circuit-breaker — theo
`marketing-cockpit:failure-recovery-matrix`) thuộc Phase 2.

**Ngưỡng xem lại.** Khi forgent lên multi-agent dispatch thật: bổ sung
intent-scoring (fgOS) — đã có candidate, không phải đổi luật.

## L5 — Definition of done: sáu câu hỏi

**Luật.** forgent "có harness" khi một agent lạ, không chat history, trả lời
được sáu câu:

1. Đọc gì trước? 2. Việc này thuộc loại gì? 3. Nó chạm contract nào?
4. Rủi ro bao nhiêu? 5. Proof gì thì xong? 6. Bài học nào để lại?

Mọi phase của compound stack nghiệm thu bằng cách hỏi lại sáu câu này — không
phải bằng feature list.

**Nguồn.** `repository-harness:repo-as-os-six-questions`. Câu 6 chính là
compound-learning — nó nằm trong definition of done, không phải tính năng
cộng thêm.

**Ngưỡng xem lại.** Không có — đây là acceptance test, chỉ có thể THÊM câu.

## L6 — Maturity ladder F0–F5

**Luật.** Tiến hóa của forgent đo bằng thang bậc kiểm chứng được, mỗi bậc có
tiêu chí + chỉ số, không phải cảm giác:

| Bậc | Tên | Tiêu chí kiểm chứng |
|---|---|---|
| F0 | Bare | Repo + docs, chưa có luật thành văn |
| F1 | Lawful | Tài liệu này tồn tại; mọi artifact khai log/state (L1); 6 câu trả lời được BẰNG TAY |
| F2 | Stateful | State layer Phase 1 chạy: FSM + precondition + CAS + decisions event-sourced; 6 câu trả lời từ state, không từ trí nhớ |
| F3 | Routed | Routing Phase 2: next-work derived, chain handoff, recovery-matrix; agent lạ tự tìm việc kế tiếp |
| F4 | Compounding | Vòng predicted→actual chạy; capture 2 kênh; entropy-trend + seal-digest; câu 6 tự động |
| F5 | Self-improving | Học từ chính vận hành (higher-layer memory, evolving loop human-gated); cải tiến có outcome đo được |

Mỗi bậc chỉ được tuyên bố khi có bằng chứng chạy thật (benchmark/check output),
theo `repository-harness:maturity-ladder-h0-h5` — "không tự phán".

**Claimed.** F4 — 2026-07-16, trên bằng chứng benchmark ngoài thật (real
`fgos`/`fgos-runner` binaries, bản sao pristine, không fixture): vòng
predicted→actual đủ 2 nửa; capture 2 kênh (settlement actor-attributed
runner/human, friction 5-layer); entropy-trend + seal-digest qua hai lần
`check`; câu-6 tự động lúc đóng. Chi tiết + toàn bộ output dán nguyên văn:
`docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (round 2,
6/6 delta PASS).

**Ngưỡng xem lại.** Nội dung từng bậc tinh chỉnh được khi vào phase tương ứng;
cấu trúc thang giữ nguyên.

## L7 — Durability ladder

**Luật.** "Chạy xong ≠ đã merge ≠ đã bền." Mọi artifact khai mức bền tường minh:

| Mức | Nghĩa | Ví dụ forgent |
|---|---|---|
| D1 branch/PR | đề xuất, chờ duyệt | nhánh feature |
| D2 commit-retain | truth vĩnh viễn trong git | changeset, decisions, distillery, doc này |
| D3 local-compactable | bằng chứng phiên, nén được | plans/reports cũ, run artifacts |
| D4 local-rebuildable | dựng lại được từ D2 | db-view tương lai, cache |
| D5 local-only | máy này thôi | .bee/state.json, HANDOFF |

**Nguồn.** `symphony:run-artifact-durability-split` (5 mức, sinh từ ràng buộc
consumer thật); mở rộng của L1.

**Ngưỡng xem lại.** Khi forgent có fleet-run/branch-PR flow thật, mức D1/D3
cần quy tắc retention cụ thể — bổ sung, không đổi thang.

## L8 — Doctrine placement rule (always-loaded layer)

**Luật.** Tầng "doctrine" của forgent (CLAUDE.md/AGENTS.md — nạp mọi turn)
tuân ba quy tắc:

1. **Placement test một câu:** "rule này có cần hold khi không workflow nào
   đang chạy không?" — yes → standing sheet; no → reference nạp theo nhu cầu.
   Rule đặt sai nhà "behaves exactly like no rule at all".
2. **Transport rides with the order:** lệnh trên standing sheet phải mang kèm
   mức tối thiểu để tuân thủ ngay lần đầu (không được để "cách làm" nằm ở
   reference chỉ nạp khi invoke).
3. **Anchor-suite:** mỗi doctrine rule có cụm từ đặc trưng được check tự động
   assert theo tên — doctrine không được rỗng dần trong im lặng.

**Nguồn.** `beegog:doctrine-layer-always-loaded` (@af4840c — hai bài học
failure-driven từ lỗi thật); họ hàng: `marketing-cockpit:projection-governance-coverage`
(phân hạng enforce-ability của convention).

**Hệ quả.** Khi forgent viết AGENTS/CLAUDE của chính nó (F2+), mọi rule đi qua
placement test; check của forgent (distill check hoặc kế nhiệm) nhận thêm
anchor assertions.

**Ngưỡng xem lại.** Không có — failure-driven, hai lần trả giá ở upstream rồi.

## L9 — Thang hoàn tất của MỘT việc: run ≠ merge ≠ durable

**Luật.** Một work-item đi qua BA mức hoàn tất KHÁC NHAU; consumer không được gộp:

| Mức | Trạng thái item | Ai tuyên | Nghĩa |
|---|---|---|---|
| run-complete | `proposed` | runner (D3, verify tự chạy lại) | worker chạy xong + verify xanh TRÊN NHÁNH — "đã làm" nhưng CHƯA vào main |
| merge-complete | `done` | cổng duyệt/merge (CTR005) | đã duyệt + nhập vào cây chính — "đã nhận" |
| durable | `done` + đã đẩy | github-adapter (P28) | đã đẩy lên remote, sống ngoài máy này — "đã bền" |

**Phân biệt với L7 (bắt buộc — hai trục khác nhau).** L7 đo độ bền LƯU TRỮ của một
*artifact* (nó SỐNG ở đâu: D1 nhánh … D5 local-only). L9 đo TRẠNG THÁI hoàn tất
của một *việc* (nó ĐÃ ĐI tới đâu trong vòng đời). Một item `proposed` là
run-complete ở L9 trong khi artifact nhánh của nó là L7-D1 — cùng một sự việc,
hai câu hỏi khác nhau. Header của L7 mượn cụm "chạy xong ≠ đã merge ≠ đã bền" để
nói tinh thần; L9 là chỗ ba mức đó thành khái niệm có tên cho vòng đời việc.

**Nguồn.** Sống ngầm trong P17 (PR lifecycle) và P28 (github-adapter); trực tiếp
liên quan hai nửa của `fgos check` (predicted/actual outcome) và cổng merge CTR005.
D-ID sẽ gán khi một slice đầu tiên cần trích L9 làm ràng buộc thiết kế.

**Hệ quả.** Đọc `proposed` là "xong" là lỗi phân tầng — mới run-complete. Một yêu
cầu "ship/release" đòi merge-complete tối thiểu; "bền/đã lưu ngoài" đòi durable.
`approve --github` không tự dọn nhánh remote (github-adapter S3) chính là ranh
giới merge-complete vs durable chưa khép kín — biết-nhưng-chưa-sửa, không nhầm là
đã bền.

**Ngưỡng xem lại.** Khi có fleet-run / remote-push flow thật, mỗi mức cần quy tắc
retention/đối-chiếu riêng — bổ sung, không đổi ba mức.

## L10 — Add-through-not-alongside: mở rộng QUA cửa, không đắp CẠNH cửa

**Luật.** Một hành vi ghi/đọc mới LUÔN mở rộng cửa hiện có, KHÔNG BAO GIỜ mở một
đường song song bên cạnh nó:

- Trạng thái mới → thêm nhánh transition qua CÙNG `moveWork` (một cửa ghi), không
  một hàm ghi riêng.
- Field mới → cưỡi CÙNG event, sống qua CÙNG fold (spread `work.add`), không một
  event-type/log riêng.
- Read mới → qua facade store hiện có, không import thẳng một tầng Domain vào
  Entry.

**Nguồn / bằng chứng (đã DONE, không phải mục tiêu).** `awaiting-human` là một
`moveWork` wrapper (`store.mjs` `putInAwaiting`/`answerAwaiting`), không phải write
path thứ hai. work-graph-intelligence (P43 + S7–S9) chạm mọi metric/advisory qua
facade store (`readyWork`/`graphMetrics`/`graphWhatIf`/`staleDoingAdvisory`/
`footprintConflicts`), và thêm field (`discoveredFrom`, `footprint`) cưỡi cùng
`work.add` spread — không cửa mới nào. Đây là doctrine đứng SAU L3 rule 4 (mọi ghi
qua MỘT cửa) và contract CTR002 (single-write-door).

**Hệ quả.** "Cửa có lỗ hổng vẫn là luật không có lỗ hổng" — đắp một đường cạnh cửa
làm MỌI bảo đảm của cửa (CAS, cycle-check phi-chu-trình, envelope CTR001, serialize
write-queue) mất hiệu lực TRONG IM LẶNG, vì đường mới không đi qua chúng. Review/
test bắt "một write path THỨ HAI" hay "Entry import thẳng Domain" là red flag ngang
với bỏ CAS.

**Ngưỡng xem lại.** Khi multi-writer thật (gãy tiền đề single-writer của L3): cửa
có thể tiến hóa thành lease/daemon, nhưng bất biến "MỘT cửa, mở rộng qua nó" giữ
nguyên — chính là điều L3 ngưỡng-xem-lại đã hẹn.

---

## Trình tự thi công phía trên các luật

Phase 1 (state/FSM: JSON zero-dep + transition-API-có-precondition +
single-door + CAS) → Phase 2 (routing: derived next-work + chain handoff +
recovery) → Phase 3 (compound: predicted→actual, capture 2 kênh,
entropy-trend, evolving human-gated). Chi tiết + candidate map: consult report
đã dẫn ở đầu. Ba candidate F1 của distill (`porting-outcome-lifecycle`,
`distillery-entropy-trend`, `seal-digest-zero-effort`) chạy song song được —
distill là phòng thí nghiệm compound đầu tiên.
