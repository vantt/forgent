# Chấm điểm độc lập: ba phương án request-to-run theo thước đo §0

```txt
Document type: Independent rescoring (advisory, stateful record)
Author: kongming (claude-fable-5.1, Claude Code, chỉ đọc)
Snapshot: 2026-09-30 23:20 (Asia/Saigon), main @ cd094f5f7, state thật .fgos/
Thước đo: synthesis-260930-1229 §0 (G1–G6, 8 tiêu chí). Không đọc phần chấm của lead.
Nguồn: synthesis §0/§2/§4/§6 (bỏ "Lập trường lead" + "Đánh giá lại" trong Q0); 3 advisor response; deep-comparison-260929-1446; code + store tự kiểm bên dưới.
```

## 0. Tóm tắt

**Chọn mô hình gọn** (primitive `run --unit --role` + 3 vòng lặp code + Workflow run riêng), điểm có trọng số **4,0/5**; P-A **3,2**; P-B **2,0**. P-B rớt G1, G3, G6. P-A và mô hình gọn đều qua gate nhưng có điều kiện; điều kiện nặng nhất của mô hình gọn là **cửa mutating** (mục 1, E4) và **tiêu chí thu hồi engine** (G3). Bake-off đang đề xuất đo đúng tiêu chí 1–2–4 nhưng **đo nhầm biến** nếu không đồng hình hai nhánh (mục 5).

## 1. Bằng chứng tự kiểm (chỉ những điểm làm thay đổi điểm số)

| # | Fact | Bằng chứng |
|---|---|---|
| E1 | Session phase-01 (mốc §0): 10 run, worker **137 phút**, wall 140 phút (08:14→10:34) → wall ≈ worker; nghi lễ **không nằm trong wall time** mà trong số lệnh/quyết định của Lead + số vòng. doer/fixer = 95 phút (việc thật), reviewer+red-team = 42 phút | `.fgos/assignments/asgn_pi_lead_phase01_op_00{1..10}/runs/*/result.json` durationMs; `sessions/documentation-authority-unification--phase-01/events.jsonl` |
| E2 | **Cả phase 01** tốn 6 session, **25 run**, ~352 phút session-time (5 session có run); tất cả `status: active` | 6 thư mục `sessions/documentation-authority-unification--phase-01*`, events.jsonl |
| E3 | Rubber-stamp có trong store: reviewer = **gemini** (cùng provider doer), 2,7 phút `done`, 3,0 phút `no-evidence`; red-team xai **6/6 lần `status: failed`** dù có finding được Lead `accepted` (disposition seq 12/22/32). `assignment.json.provenance` **không ghi vì sao executor này** (chỉ contract + validators) → nguyên nhân (`preferred` hay `--executor` tay) không truy được từ store | result.json các op_002/005/008, op_003/006/009; `assignment.json` op_001/002 `provenance` keys |
| E4 | Mutating qua `executeAssignment` **bắt buộc** protocol-operation stamp trỏ tới operation `work-product` của một definition, rồi mới kiểm posture worktree; stamp tự nhận là "forgeable by startsWith" nên posture mới là cổng thật | `assignment-runner.mjs:540-560`; `execution-contract.mjs:11-33,139-160,323-326` |
| E5 | `executeAssignment` có 4 caller: `cli.mjs:1413` (execute --assignment), `cli.mjs:1588` (execute --contract), `operation-choice.mjs:2212` (Work loop), `session-engine.mjs:403` (engine, một call site duy nhất) → "một cửa" đã đúng ở tầng assignment; engine chỉ là một trong bốn người gọi | grep |
| E6 | `rigorToTier` **chưa có** trong `src/`; plan tier nằm ở nhánh `plan/260930-tier-rigor-consolidation` chưa merge; hôm nay còn `minTier`/`rigorOverrides` (`assignment-policy.mjs:243-315`), `MODEL_POLICY_TIERS` 6 bậc (`config.mjs:520`) | grep |
| E7 | Engine coordination: session-engine 4.778 dòng; `src/runner/coordination` 14.575 + `src/verbs/coordination` 6.117; close-by-quorum có ≥5 lý do từ chối đóng (`session-engine.mjs:3537-3624`); DAG mode chỉ read-only (`dag-request-compiler.mjs:65`); `strength: preferred` (`master-loop.yaml:128,140`); 0 tham chiếu coding trong session-engine; headless door có (`headless-adapter.mjs`, `run.mjs:389`) | wc, grep |
| E8 | Store: 602 session (§2 ghi 606), 512 active / 27 completed / 57 partial; 28 events.jsonl có close; 170 file test nhắc coordination, 57 nhắc session-engine | node đếm |
| E9 | Lead hôm nay gọi ~8 lệnh `fgos coordination` cho một cell (start, operation×2, disposition, authorize-and-dispatch×2, status, close) | `domains/coding/skills/fgos-code-change/SKILL.md:98-179` |
| E10 | Config: `readOnlyRedirects claude→openai` cả default lẫn per-operation; `executors.for` 8 executor; `review` không `prefer`; `execute.prefer=claude`; `runner.executor.command=claude` | `.fgos/config.json` runner.* |

## 2. Gate G1–G6

| Gate | P-A (engine) | Mô hình gọn | P-B (vá) |
|---|---|---|---|
| G1 Observe case + RunResult | **Đạt có ĐK**: engine đã qua `executeAssignment` (E5); inline Lead chưa có RunResult (D4/D8 là việc mới); `dispatch-runs` phải xoá (`cli.mjs:260-267`) | **Đạt có ĐK**: primitive bọc `executeAssignment` → RunResult sẵn; cần `unitId` trên assignment để CaseWindow (`case_journal.rs:59-83`, nhóm theo `sessions[]`/`items[]`) nhóm theo unit; inline như P-A | **Không đạt**: giữ `dispatch-runs`, Lead viết inline K3 không materialize |
| G2 không ghim | **Đạt** sau khi bỏ `policy.capability` 6 dòng + `feature.yaml:65 preferExecutor` | **Đạt**: pattern là code, không YAML để ghim | **Đạt có ĐK**: chỉ bỏ pin master loop; `preferExecutor`, `executors.for`, redirect còn |
| G3 một đường | **Đạt có ĐK**: request tự sinh là **lớp thêm** lên schema 8 step; phải cấm request viết tay cùng bước, xoá `agent-led`, DemandFacts, `dispatch-runs` | **Đạt có ĐK**: "engine đóng băng cho panel ẩn danh" = đường thứ hai cho `panel`; phải có **tiêu chí thu hồi đếm được** (delphi/nominal/rfc/group-cognition = 0, panel 8, consult 34 — E8), không phải "chờ xem ai dùng"; `loop.mjs` stage sequencer phải rút vào Workflow run | **Không đạt**: ~10 nơi quyết executor giữ nguyên |
| G4 headless + non-code | **Đạt có ĐK**: headless door có (E7); nhưng 15 unit ghi file = 15 session + driver tay vì DAG read-only | **Đạt có ĐK**: loop code chạy headless theo cấu tạo; **điều kiện cứng: thay cổng stamp (E4)** bằng posture + bind(), nếu không primitive không ghi được file | **Đạt yếu**: 15 request tay |
| G5 độc lập/governance | **Đạt** (giữ `distinctProviderFrom`, đổi `required`; governance ở `executeAssignment`) | **Đạt có ĐK**: loop `reviewed` phải tự áp `independentOf` (tái dùng ~30 dòng `binding.mjs:122-133` + `deriveProviderFamily`); bỏ stamp không yếu governance vì stamp forgeable (E4) nhưng phải supersede ADR-006 §6 tường minh | **Không đạt**: `preferred` giữ nguyên → E3 lặp lại |
| G6 không đổi người lặng lẽ | **Đạt có ĐK**: gom redirect + rotator (F16) vào bind() provenance (S3) | **Đạt có ĐK**: như P-A, dễ hơn vì primitive là entry duy nhất; headless không candidate → dừng + báo | **Không đạt**: redirect claude→openai + default `claude` còn sống (E10) |

P-B rớt 3 gate → loại, vẫn chấm để thấy khoảng cách.

## 3. Tám tiêu chí (1–5)

Mốc: một session phase-01 = 10 run / 3 vòng / 137 phút worker / ~12 write-action của Lead; cả phase = 25 run / 6 session / ~6 h (E1–E2).

| # | Tiêu chí | P-A | Mô hình gọn | P-B |
|---|---|---|---|---|
| 1 | Nhanh, nhẹ | **3** — Lead ~3–5 lệnh/unit (run, disposition mỗi vòng finding, close); run/unit ≤5 với `reviewed` không objector; wall ≈ worker +5% (legality/lock từng step). Tiết kiệm đến từ **pattern**, không từ engine | **4** — 1 lệnh/unit (`fgos run --unit X --pattern reviewed`); run/unit ≤5; wall ≈ worker +2%; Lead không đứng giữa các vòng. Không 5 vì worker time (95 phút việc thật) không đổi | **2** — 8 lệnh + 1 request file/unit; K3 = 15 file; run/unit ≤10 (red-team bắt buộc) |
| 2 | Ít phải canh | **3** — disposition là driver action của engine → ≥1 can thiệp/vòng finding trừ khi viết policy auto-accept (thêm cơ chế); K3 15 session = 15 lần mở tay | **4** — can thiệp/unit dự báo 0 (bình thường), 1 khi hết `maxRounds` hoặc không candidate; gom câu hỏi ở Workflow run là việc mới cho cả hai | **1** — ~8–12 can thiệp/unit (E9) |
| 3 | Đúng người | **4** — bind() một chỗ sau S3; đến lúc đó `--executor` từng step (`composers.mjs:53`) và `actors[]` vẫn là lối vòng | **4** — cùng bind(); primitive là entry duy nhất nên lối vòng ít hơn; lệch không lý do dự báo 0 | **2** — thêm `docs:*.prefer` nhưng redirect biến reviewer claude→openai không lý do trừ khi ghim invocation; `executors.for` xai cho `review` (F14) |
| 4 | Chất lượng & kết thúc | **3** — replay/recovery có sẵn (điểm cộng thật); nhưng tỉ lệ tới trạng thái cuối thực đo = 27/602 vì close-by-quorum từ chối ≥5 lý do (E7); finding→`failed` (E3) đang sửa dở (runOutcome migration, git log 09-29/30) | **4** — terminal state = hàm return; `independentOf: required` + finding là outcome không phải failure. Trừ 1: resume sau crash phải tự xây (assignmentId tất định `unit/role/round` + `admitRunAttempt` đã lo "một run chưa settle") | **2** — 0/6 đóng, `preferred` giữ, rubber-stamp lặp |
| 5 | Đơn giản (bề mặt + máy móc) | **2** — bề mặt 6 danh từ, nhưng để trả lời "vì sao executor này, đang ở đâu" phải hiểu thêm session/actor/operation/8 step kind/actionKey/authorize/disposition/close-quorum ≈ 12 khái niệm; trên đường chạy 20,7k dòng coordination + 32k dispatch; 3 state machine (session, run, Work). Request tự sinh **giấu** chứ không bớt | **4** — 5 khái niệm (Unit, 3 Pattern, bind, Run, Workflow run); code mới ~1,5–2k dòng (primitive ~300, 3 loop ~150–300 mỗi cái, Workflow run ~600–800); 2 state machine (run, Workflow run); dispatch 32k vẫn bên dưới (chung cho mọi phương án). Nơi chứa khẩu vị = 1 | **1** — 67 khái niệm/13 câu hỏi (bảng fable), 5 nơi chứa khẩu vị giữ nguyên |
| 6 | Linh hoạt | **4** — domain/khẩu vị/override là data; pattern mới = YAML (data) nhưng schema 8 step kind khó tới mức 0 business flow nào được viết trong 13 file | **4** — domain/khẩu vị/override là data; pattern mới = code (D3 chốt 3 là đủ, ngoài phạm vi) | **2** — domain mới cần request tay hoặc YAML mới |
| 7 | Minh bạch | **4** — `bind --explain`; `coordination status --detail` (actions projector) trả "đang ở đâu, bước tiếp" ngay hôm nay | **4** — cùng `bind --explain`; "đang ở đâu" = đọc RunResult theo unit, cần `fgos run status` mới (nhỏ) | **2** — provenance binding không có trong store (E3) |
| 8 | Chuyển đổi | **3** — theo bước S1–S6, mỗi bước tự chạy; xoá nhỏ (DemandFacts 184 dòng, pins, `dispatch-runs`, `agent-led`) → xoá/thêm ≈ 1:2 | **4** — bước 1 (primitive) tự chạy được, bake-off ngay; tiềm năng xoá 20,7k dòng + 13 YAML + 170 file test → xoá/thêm ≈ 10:1; trừ 1 vì xoá dồn về cuối (G3) và 57 test gắn session-engine | **3** — vài giờ, nhưng xoá ~6 dòng |

## 4. Tổng hợp có trọng số

Trọng số: tiêu chí 1–2 ×3 (ưu tiên sản phẩm #1/#2), 3–4 ×2, 5 ×1,5 (owner nhấn máy móc bên dưới), 6–8 ×1. Tổng 14,5.

| | P-A | Mô hình gọn | P-B |
|---|---|---|---|
| Điểm thô | 9+9+8+6+3+4+4+3 = 46 | 12+12+8+8+6+4+4+4 = 58 | 6+6+4+4+1,5+2+2+3 = 28,5 |
| /5 | **3,17** | **4,00** | **1,97** |

Độ nhạy: nếu P-A có auto-driver làm tiêu chí 2 lên 4 → 3,38; nếu bake-off cho mô hình gọn thua chất lượng (tiêu chí 4 xuống 2) → 3,72. Thứ hạng chỉ đảo nếu mô hình gọn **rớt gate** (G3 không có tiêu chí thu hồi, hoặc G5 nếu cửa mutating bị mở không qua bind()).

## 5. Độ chắc chắn và bake-off

Điểm là phỏng đoán, cần bake-off: tiêu chí 1 (Lead lệnh/unit, wall), 2 (can thiệp), 4 (finding thật được chấp nhận, tỉ lệ tới cuối). Điểm chắc từ tĩnh, không cần bake-off: 5 (đếm dòng/khái niệm), 8 (đếm xoá/thêm), G1–G6 (đọc code).

Bake-off đề xuất (2 area docs, engine vs primitive+`reviewed`, cùng Observe case) **đo đúng tiêu chí nhạy nhất** nhưng có bốn lỗ:

1. **Đo nhầm biến.** Nhánh engine hôm nay = master loop có red-team bắt buộc + `preferred`; nhánh gọn = `reviewed` không objector + `required`. Chênh lệch sẽ là **pattern**, không phải engine. Phải đồng hình trước: sửa master loop thành `reviewed` (bỏ pin, red-team `driver-authorized`, `required`) — chính là S1 của fable — rồi mới so. Nếu không muốn sửa engine trước bake-off thì chạy nhánh gọn **hai lần** (có và không objector) để tách hai hiệu ứng.
2. **Wall time là chỉ số sai.** E1: wall ≈ worker. Đo **Lead-active** (số lệnh, số quyết định, thời gian Lead chờ giữa hai lệnh) và **số vòng × phút fixer**; wall chỉ để đối chiếu.
3. **Thiếu ca resume + no-candidate.** Kill driver giữa vòng 2 rồi resume; cấu hình chỉ một provider có invocation read-only để ép G6 (phải dừng + báo, không tự hạ). Không có hai ca này thì tiêu chí 4b và G6 vẫn là phỏng đoán.
4. **Tier chưa có (E6).** Bake-off dùng `minTier` hôm nay, ghi rõ; đừng chờ plan tier.

Điều kiện cần cho nhánh gọn chạy được: primitive tối thiểu bọc `executeAssignment` (~300 dòng), thay cổng stamp bằng posture + bind() (E4), config `docs:write`/`docs:review.prefer` kèm invocation (redirect còn sống), sửa `metrics harness` F12. Đây cũng là toàn bộ chi phí "bước 1", không có đầu tư chìm nếu engine thắng.

## 6. Lập trường

**Chọn mô hình gọn.** Ba lý do mạnh nhất:

1. **Phần đắt không phải phần engine bảo vệ.** E1/E3: chi phí thật = số vòng + Lead đứng giữa các vòng + không đóng được session; engine không giảm ba thứ này (close-quorum còn làm khó thứ ba). Binding và RunResult — hai thứ thật sự cần — đã nằm ở `executeAssignment`, ngoài engine (E5).
2. **Mọi quyết định đã chốt (Unit, bind(), 5 mức, override, Workflow tách Work) không cần engine**; mô hình gọn giữ nguyên chúng và chỉ đổi "chạy pattern bằng gì". Chi phí xây mới ~2k dòng, nhỏ hơn chi phí học và duy trì 20,7k dòng cho 3/13 pattern được dùng.
3. **RUL11 + ưu tiên #2**: headless-by-construction (loop code) thắng headless-by-driver (request 8 step kind + authorize). Cùng một loop cho có Lead và không Lead → không có hai sequencer (cảnh báo E1 của fable được chữa bằng chính thiết kế).

Ba cách nó sai + tín hiệu sớm:

1. **Loop `reviewed` bằng code hoá ra thiếu luật engine đang có (visibility, authorize từng bước, recheck-disposition)** → chất lượng review tụt. Tín hiệu: bake-off cho tỉ lệ finding được chấp nhận thấp hơn nhánh engine đồng hình, hoặc reviewer < 3 phút với 0 finding ≥2 lần liên tiếp.
2. **Cửa mutating mở quá rộng** sau khi bỏ stamp: caller bất kỳ gọi primitive với `--executor` bỏ qua bind(). Tín hiệu: doctor check "mọi RunResult mutating có `provenance.binding`" fail; hoặc một run ghi file xuất hiện ở main checkout.
3. **Engine "đóng băng" thành vĩnh viễn** → hai đường (G3 rớt muộn). Tín hiệu: sau mốc thu hồi (đề xuất: khi bake-off xong + S2), còn session mới mở bằng `coordination start` ngoài `panel` ẩn danh; hoặc có PR sửa session-engine cho một Pattern mà loop đã phủ.

## 7. Chỗ §0 / §2 sai hoặc thiếu

1. **Mốc tiêu chí 1 "~150 phút / 3 vòng / ~10 run" là một session trong sáu** (E2). Cả phase = 25 run, ~6 h session-time, 6 session mở. Dùng mốc phase, nếu không mọi cải thiện đo được sẽ bị đánh giá thấp ~2,5 lần.
2. **Chỉ số "thời gian ngoài công việc thật / unit" đo sai nếu đo bằng wall** (E1: 140 wall vs 137 worker). Nghi lễ nằm ở Lead-active và số vòng; §0 nên đổi chỉ số.
3. **§2 "chưa kiểm `strength: preferred` là nguyên nhân rubber-stamp"**: store xác nhận hệ quả (reviewer gemini = doer, 2,7/3,0 phút, một `no-evidence`), nhưng **không truy được nguyên nhân** vì `assignment.json.provenance` không ghi chuỗi binding (E3). Đây là lỗ minh bạch hôm nay, đáng thành fact riêng: tiêu chí 7 hiện = 1.
4. **Thiếu fact về cửa mutating** (E4): mọi phương án bỏ "protocol stamp" (D4/D8) đang chạm ADR-006 §6; phải supersede tường minh, dù stamp tự nhận forgeable.
5. **Thiếu fact `rigorToTier` chưa tồn tại** (E6): bảng 5 mức cột tier và quy tắc `mechanism` của bind() đang tựa vào plan chưa merge.
6. F13: 602 session, không 606 (nhỏ). F11 đúng; bổ sung: red-team "finding bị ghi failed" là 6/6, không phải "gần như mỗi vòng".
7. §0 G4 nói "một domain không phải code": docs **là** domain không phải code — đủ cho bake-off, nhưng chưa chứng minh Workflow run + cổng người (marketing). Nên tách: G4a headless, G4b Workflow non-code (plan tách Workflow lo).

## 8. Phương án thứ tư

Không đề xuất phương án mới; chỉ một **biến thể của mô hình gọn đáng chốt ngay**: `panel` ẩn danh (0 người dùng, E8) **không** giữ engine đóng băng mà xoá cùng track, `panel` = loop song song + tổng hợp; muốn ẩn danh thì sau này thêm vào loop (một cờ "không thấy kết quả bạn"). Biến thể này qua G3 sạch, tiêu chí 8 lên 5; giá là mất option "panel có luật visibility" mà chưa ai trả tiền. Nếu owner không muốn chốt xoá bây giờ, giữ mô hình gọn kèm mốc thu hồi có ngày.

## Assumptions

- Bake-off sẽ chạy trước S2 và cả hai nhánh dùng cùng config docs taste — **cao**; nếu bake-off bị bỏ, điểm tiêu chí 1/2/4 của mô hình gọn hạ 1 bậc mỗi ô nhưng thứ hạng không đổi.
- Plan tier merge trước S3 — **trung bình**; nếu không, bind() dùng `minTier` tạm và cột tier của bảng 5 mức bị hoãn, không ảnh hưởng lựa chọn engine.
- "Inline có RunResult" (D4/D8) là việc chung cho mọi phương án, không tính vào chênh lệch — **cao**.
- Số dòng code mới của mô hình gọn (~1,5–2k) là ước lượng từ kích thước `executeAssignment` caller hiện có (`cli.mjs` execute --contract ~200 dòng) — **trung bình**; nếu vượt 4k thì tiêu chí 5 xuống 3, vẫn trên P-A.

Status: DONE_WITH_CONCERNS
Summary: Mô hình gọn 4,0 > P-A 3,2 > P-B 2,0 (rớt G1/G3/G6); thứ hạng chỉ đảo nếu mô hình gọn rớt G3 (không có tiêu chí thu hồi engine) hoặc G5 (cửa mutating mở không qua bind()).
Concerns/Blockers: (1) bake-off như đang đề xuất đo pattern chứ không đo engine — phải đồng hình hai nhánh hoặc chạy nhánh gọn hai lần; (2) mốc §0 "150 phút/10 run" là 1/6 phase thật; (3) bỏ protocol stamp chạm ADR-006 §6, cần supersede tường minh; (4) `rigorToTier` chưa tồn tại trên main.
