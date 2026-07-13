---
topic: compound-engineering
date: 2026-07-13
based_on: [beegog@af4840c, repository-harness@9cc306d, marketing-cockpit@588d800, symphony@2f0b257]
entries: [repository-harness:growth-rule-friction, repository-harness:proposal-lifecycle-explicit, repository-harness:audit-propose-pipeline, beegog:friction-backlog-outcome-loop, beegog:evolving-loop-two-gates, beegog:entropy-score-trend, beegog:settlement-capture-unprompted, beegog:event-sourced-decisions, beegog:state-vs-log-two-physics, beegog:grooming-project-first, marketing-cockpit:four-memory-types, marketing-cockpit:procedural-memory-reinforcement]
---

# Deep-dive: compound-engineering

> Delta beegog e70602a→af4840c (2026-07-13, verified): không lật kết luận nào. Liên quan: write-guard vá lỗ "guard test một state khi state model có N terminal states" (idle + compounding-complete) — củng cố luận điểm transition/guard theo TẬP trạng thái; thêm doctrine-layer + anchor-suite (entry mới beegog:doctrine-layer-always-loaded, ngoài phạm vi dive này).

**Bottom Line:** "Compound engineering" = mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế: tri thức được bắt lại như sản phẩm phụ, friction nuôi cải tiến, quyết định tích lũy thành memory tái dùng, harness tự sửa mình. Cả 4 nguồn cài đặt compounding ở 3 tầng khác nhau — **capture** (tích tri thức), **friction→outcome** (động cơ cải tiến đo được), **health/trend** (làm compounding quan sát được) — nhưng chia làm 3 trường phái đối lập ở TRỤC "ai đóng vòng": bee = **human-gated + kỷ luật cổng**, harness = **datafied + đo outcome thật**, fgOS = **tự động ở tầng agent + quên có trọng số**. Khuyến nghị cho forgent: distill CHÍNH LÀ một nhạc cụ compound-engineering (index = state, porting-log = decision log, deep-dive = knowledge đã consolidate, cursor = không bao giờ quét lại từ đầu). Thứ forgent còn thiếu và nên lấy: **vòng predicted→actual outcome** (bee+harness, distill đã có mầm `outcome`) + **entropy-trend cho chính learning area** + **digest zero-effort lúc seal**. KHÔNG lấy typed-memory tự-quên của fgOS cho tầng distill (over-engineer) — state-vs-log hai-physics đã đủ.

## Câu hỏi

Làm sao để engineering **cộng dồn** thay vì reset mỗi lần? Cụ thể: (a) tri thức chốt được giữ ở đâu để không mất giữa phiên; (b) friction/lỗi biến thành cải tiến bằng cơ chế gì; (c) làm sao BIẾT cải tiến có thực sự giúp (không phải cảm giác); (d) ai đóng vòng — người hay máy — và với kỷ luật nào?

## Cách từng nguồn giải quyết

### repository-harness (@9cc306d) — trường phái DATAFIED, đo outcome thật
- **Mechanism:** "The harness grows from friction" (`growth-rule-friction`, `docs/HARNESS.md §Growth Rule`): gặp confusion/lặp tay/thiếu rule → sửa harness NGAY hoặc `backlog add` với **predicted impact**; đóng với **actual outcome**; `query backlog --closed` để đối chiếu dự đoán vs thực tế. Phase 5 pipeline (`audit-propose-pipeline`, `PHASE5.md`): validate (`score-context`+`audit` entropy/drift) → check (`verify-all`) → improve (`propose` sinh proposal từ pattern friction). `propose` **read-only**, bulk `--commit` bị cấm.
- **Lifecycle event-sourced** (`proposal-lifecycle-explicit`, decision 0008): người accept/reject **từng proposal key** (`--accept KEY --outcome-after-traces N`); outcome observation ghi **confirmed/ineffective/reverted** theo lịch; evidence mới sau implement = **regression**, sau reject = **reconsideration** — đều cần acceptance mới.
- **Why:** self-improvement phải là **pipeline cơ học audit được**, KHÔNG phải "agent tự nghĩ cách tốt hơn". Trade-off chấp nhận: nặng hạ tầng (SQLite, migrations 009–012, proposal_key = SHA-256) đổi lấy khả năng **đo được "cải tiến có thực giúp không"**. Đây là mặt mạnh riêng: không nguồn nào khác đo outcome chặt bằng.

### beegog (@af4840c) — trường phái HUMAN-GATED, kỷ luật cổng
- **Capture (tích tri thức tự động):** `settlement-capture-unprompted` (`AGENTS.md` rule 9) — phát hiện "settlement" (rule chốt, behavior xác nhận, value tune xong) là nhiệm vụ agent MỖI TURN, không chờ user; queue vào `.bee/capture-queue.jsonl`, flush tại wrap-up/PreCompact/session-start. `event-sourced-decisions` — decisions.jsonl append-only qua CLI verb, D-ID cited trong spec/cell. Substrate: `state-vs-log-two-physics` — Log (append, per-feature, "how did we get here") + State (overwrite, per-area, "where are we"); "đa số hệ chỉ có log".
- **Friction→outcome:** `friction-backlog-outcome-loop` (thừa kế harness, thêm **5-layer failure attribution**: task spec/context/environment/verification/state); "prediction wrong is signal, not embarrassment — học từ chính sai số dự đoán".
- **Self-modification:** `evolving-loop-two-gates` (`skills/bee-evolving`, decision 0022) — digest **tự sinh khi feature close** (zero-effort dogfood) → rank pain×frequency×corroboration → Gate A (người chọn cluster) → fix qua Iron Law (không inline) → suites green → Gate B (người duyệt diff) → push là bước tay có tên. **Chỉ trong repo bee, guard cơ học, không bao giờ auto/schedule**; "push never automatic" RED-tested 4 kịch bản.
- **Health:** `entropy-score-trend` — điểm = tổng có trọng số (orphaned cells ×10, unverified ×5, stale specs ×5, backlog-without-outcome ×2, broken tools ×8), cap 100, 4 band; grooming BẮT BUỘC báo score KÈM trend so lần trước. `grooming-project-first` — chứng minh non-use trước khi gọi dead, approval từng kill, ghi outcome sau kill.
- **Why:** triết lý gốc "gate là cơ chế code, prompt chỉ là lớp phụ"; nỗi lo là **agent tự lừa mình** ("nó chạy rồi" không bằng chứng). Trade-off: self-modification = lane cao nhất + kỷ luật chặt nhất, chấp nhận CHẬM để không hỏng. Mặt mạnh riêng: kỷ luật cổng + "debt đo được có trend".

### marketing-cockpit / fgOS (@588d800) — trường phái COGNITIVE MEMORY, tự động ở tầng agent
- **Mechanism:** `four-memory-types` (`.fgOS/memory/schema.yaml`) — 4 loại scope/TTL riêng: working (session-only, never-persist), episodic (90d/365d nếu blocked·human-feedback·quality<0.4·new-pattern), semantic (global versioned), procedural (never auto-delete). **Consolidation** cuối task: extract lessons → episodic → update procedural (newer-wins, confidence>0.7 + evidence≥2) → clear working. Context injection có cap (episodic 5, procedural 10). `procedural-memory-reinforcement` — pattern học có **confidence weighted bằng chứng**: reinforcement **+0.1**/episode xác nhận, contradiction **−0.2**/episode mâu thuẫn; xóa chỉ khi confidence<0.2 sau mâu thuẫn HOẶC human mark invalid; staleness flag 365d (báo người, không tự xóa).
- **Why:** compounding xảy ra **TỰ ĐỘNG bên trong agent** theo mô hình khoa học nhận thức, không qua cổng người. Trade-off: tinh vi hơn state-vs-log (2→4 loại + quên có trọng số) nhưng RỦI RO tự-quên/tự-reinforce sai không có human gate trên chính memory. Mặt mạnh riêng: self-improvement ở tầng runtime/agent (bee/harness đều ở tầng harness/human).

### symphony (@2f0b257) — biên: compounding của tính TOÀN VẸN hệ thống, không phải tri thức
- `resource-manifest-self-check` — binary tự validate packaged resources runtime trước khi serve (version/paths/shape/hash), chống asset drift giữa build↔chạy. Không phải knowledge-compounding; đưa vào để đối chiếu: "self-check" là compounding của **integrity guarantee** qua mỗi release, không phải của **tri thức**. Ngoài phạm vi lõi deep-dive này.

## So sánh & trade-offs

| Chiều | repository-harness | beegog | fgOS (marketing-cockpit) |
|---|---|---|---|
| **Ai đóng vòng** | người, accept từng proposal-key | người, 2 gate tường minh | máy, consolidation tự động |
| **Dạng tri thức** | datafied (SQLite, proposal_key SHA-256) | text policy (specs/decisions.jsonl) + log/state | typed memory (4 loại + confidence) |
| **Đo outcome?** | ✓ mạnh nhất: confirmed/ineffective/reverted + regression/reconsideration | ~ predicted vs actual + 5-layer attribution | ~ reinforce/contradict weight, không có "reverted" |
| **Capture khi nào** | lúc gặp friction (chủ động add) | MỖI TURN, unprompted (settlement) | cuối task/session (consolidation) |
| **Health metric** | audit entropy/drift score | entropy score **+ trend** | importance-weighted forgetting (implicit) |
| **Quên/thu gọn** | không tự quên (event-sourced) | không tự quên (append-only) | ✓ TTL + importance forgetting |
| **Trade-off lõi** | nặng hạ tầng ↔ đo được thật | chậm+kỷ luật ↔ chống tự-lừa | tự động+tinh vi ↔ rủi ro quên sai không gate |
| **Tầng compounding** | harness/human | harness/human | runtime/agent |

**Điểm hội tụ độc lập (tín hiệu mạnh):** bee `evolving-loop-two-gates` và harness `proposal-lifecycle-explicit` tự đến CÙNG kết luận: **"explicit accept per item"** — cải tiến không bao giờ áp hàng loạt tự động (matrix: `self-modification-loop` verdict `hòa (hội tụ)`). Bee mạnh về gate discipline, harness mạnh về đo outcome. Đây chính là chỗ synthesis > copy.

**Điểm phân kỳ lõi:** TRỤC human-gated (bee/harness) vs automatic (fgOS). Với **learning area như distill** — nơi con người quyết định porting — trường phái human-gated đúng bối cảnh; fgOS auto-memory chỉ hợp nếu forgent có **agent chạy xuyên phiên tự học preference**.

## Giải pháp tổng hợp cho host (forgent / distill)

**Quan sát nền:** distill ĐÃ là hệ compound-engineering hoàn chỉnh ở tầng "học từ nguồn tham chiếu":
- `sources/<name>.md` = **State** (overwrite theo reality, per-source-area) ← bee `state-vs-log`
- `porting-log.md` + `deep-dives/` = **Log/knowledge đã consolidate** (append, quyết định + tổng hợp)
- cursor (`last_analyzed_commit`) = **không bao giờ quét lại từ đầu** — chính là compounding: mỗi scan xây trên scan trước
- `/distill outcome <feature> confirmed|ineffective|adjusted` = **mầm của predicted→actual loop** (đã tồn tại!)

Nên GHÉP như sau — lấy human-gated substrate của bee, đo-outcome của harness, bỏ auto-memory của fgOS:

1. **Nâng `outcome` thành vòng predicted→actual đầy đủ** (lấy harness `proposal-lifecycle-explicit` + bee `friction-backlog-outcome-loop`). Candidate row đã có Score `R# E# F#` = **predicted impact tại tạo**. Khi ported, `/distill outcome` ghi actual. Bổ sung: (a) `check` **nhắc** mọi row `ported/adapted` chưa có `Outcome:` (như harness `backlog-without-outcome ×2`); (b) semantic **reconsideration**: nếu delta scan sau mang evidence mới cho một row đã `rejected`, đánh dấu để human duyệt lại thay vì im lặng. Lấy TỪ harness: kỷ luật "evidence mới sau reject = reconsideration". BỎ: proposal_key SHA-256 / SQLite — quá nặng cho markdown-only distill.

2. **Entropy-trend cho CHÍNH learning area** (dogfood bee `entropy-score-trend` lên distillery). Mở rộng `check` thành điểm có trọng số: unsealed scan ×8, stale deep-dive ×5, candidate-without-outcome ×2, backfill-pending ×5, broken Where-path ×10 → score + **trend so audit trước** (lưu 1 dòng history trong learning area). Làm "debt của hệ học" đo được, không phải cảm giác. Lấy TỪ bee: "score KÈM trend". Rẻ: `check` đã đi qua các invariant này.

3. **Digest zero-effort lúc seal** (lấy bee `evolving-loop-two-gates` "digest tự sinh khi close"). `seal` đã là bước bắt buộc cuối phiên — emit thêm 1 dòng "compounded: +N entry, ±M changed, +K candidate" append vào một `.distill-digest` hoặc report. Cho phép thấy compounding tích lũy mà không tốn effort; sau nhiều seal → chuỗi digest = "harness học được gì theo thời gian".

4. **GIỮ human-gated, KHÔNG lấy fgOS auto-forgetting** cho tầng distill. state-vs-log hai-physics (index/log) đã là substrate đúng; porting là quyết định người. Typed-memory-consolidation (4 loại + reinforce/contradict tự động) chỉ dành cho **một tầng khác** của forgent nếu sau này có runtime agent nhớ preference xuyên phiên — KHÔNG cho distill. Đây là "bỏ gì và vì sao": auto-memory giải bài toán forgent-distill KHÔNG có (không có agent tự học chạy nền; con người luôn ở vòng).

Kết quả ghép: distill giữ triết lý human-gated của bee, mượn **kỷ luật đo-outcome** của harness ở dạng markdown-nhẹ, mượn **digest-on-close + entropy-trend** làm compounding quan sát được — mà không kéo theo hạ tầng nặng (SQLite/proposal_key) hay rủi ro auto-memory.

## Portable ideas

Các ý dưới → candidate rows trong porting-log (memory-layer candidates state-vs-log/four-memory-types/typed-memory-consolidation ĐÃ có sẵn, không lặp):

| Idea | Nguồn | R/E/F | Ghi chú |
|---|---|---|---|
| `porting-outcome-lifecycle` | harness:proposal-lifecycle-explicit + beegog:friction-backlog-outcome-loop | R2 E3 F1 | Nâng `/distill outcome` thành predicted→actual đầy đủ: `check` nhắc row ported chưa có Outcome; reconsideration khi delta mang evidence mới cho row rejected. E3: hội tụ độc lập bee+harness về explicit-per-item + harness đã dogfood đo confirmed/ineffective. F1: chủ yếu convention + nhắc trong `check`, distill đã có mầm `outcome` |
| `distillery-entropy-trend` | beegog:entropy-score-trend | R2 E2 F1 | Mở rộng `check` thành weighted score (unsealed ×8, stale deep-dive ×5, candidate-without-outcome ×2, backfill-pending ×5, broken Where ×10) + trend so audit trước. E2: bee dogfood có công thức + trend. F1: `check` đã đi qua các invariant |
| `seal-digest-zero-effort` | beegog:evolving-loop-two-gates | R1 E2 F1 | `seal` emit 1 dòng digest "compounded: +N/±M/+K" → chuỗi digest = học được gì theo thời gian. E2: bee dogfood digest-on-close. F1: một dòng append tại seal |

## Open questions

1. ~~reconsideration lưu ở đâu?~~ **ĐÃ QUYẾT 2026-07-13 (user):** policy-side — cờ reconsideration ghi vào cột Ghi chú của row porting-log (theo đúng pattern delta-discipline hook sẵn có cho row ported).
2. ~~trend history policy-side hay machine-side?~~ **ĐÃ QUYẾT 2026-07-13 (user):** policy-side, git-tracked — vì điểm quá khứ không tái tính được (mất là mất vĩnh viễn) và nó phục vụ quyết định của người → team-durable. Machine-side chỉ dành cho cache tái tạo được.
3. ~~forgent có runtime agent xuyên phiên không?~~ **ĐÃ QUYẾT 2026-07-13 (user):** kiến trúc **2 tầng đồng thời** — lower layer (cơ học/raw: state, cursor, changeset) dùng log-vs-state 2-physics; higher layer (process/framework/skill) dùng 4 mem-type + consolidation. Không phủ định nhau. Typed-memory-consolidation hết "có điều kiện" — nó là subsystem của higher layer, port khi dựng tầng đó (xem deep-dive `state` §open-questions).
