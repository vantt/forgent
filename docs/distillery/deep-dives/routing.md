---
topic: routing
date: 2026-07-13
based_on: [beegog@e70602a, repository-harness@9cc306d]
entries: [beegog:hive-first-skill-router, beegog:phase-machine-cli-owned, beegog:cell-status-lifecycle, beegog:lane-routes-chain-shape, beegog:status-token-wave-dispatch, beegog:mode-tables-trigger-dispatch, repository-harness:request-class-loop-dispatch, repository-harness:story-status-single-door, repository-harness:runnable-derived-dispatch, repository-harness:mutates-state-command-gate, repository-harness:protocol-next-action-table]
---

# Deep-dive: routing

**Bottom Line:** Cả hai nguồn giải "chạy gì kế tiếp" bằng cơ chế, không bằng phán đoán — nhưng nhắm vào hai audience khác nhau. bee route cho **agent đọc prose** (handoff sentence, mode table, hook nudge) vì router và runner cùng là một LLM session; harness route cho **process đọc data** (exit code, JSON state field, CAS) vì caller có thể không phải agent (script, CI, Symphony). Đây không phải một bên hơn bên kia — là hai thiết kế đúng cho hai loại trust-boundary khác nhau. Điểm hội tụ độc lập mạnh nhất: cả hai đều biến "việc kế tiếp" thành **truy vấn dẫn xuất từ state** (readyCells/runnable) thay vì danh sách tay. Khuyến nghị cho forgent: dùng model prose-cho-agent + data-cho-cross-boundary tùy interface, không chọn một mô hình toàn cục; và mượn CAS của harness làm bảo hiểm rẻ cho state layer ngay từ đầu dù hiện tại chưa có concurrent writer.

## Câu hỏi

Bee và repository-harness quyết định "chạy gì kế tiếp" ở 3 tầng lồng nhau (state trong 1 task, task/mode trong 1 skill, skill kế tiếp trong hệ sinh thái) bằng cơ chế nào, và tại sao mỗi bên chọn cơ chế đó?

## Cách từng nguồn giải quyết

### beegog

**Tầng 1 (state-routing):** Phase machine sống trong `.bee/state.json`, sở hữu độc quyền bởi CLI (`bee_state.mjs`) — write-guard hook deny mọi hand-edit. `startFeature()` là transition có tiền điều kiện tường minh: chỉ hợp lệ từ `idle`/`compounding-complete`, chặn nếu còn cell nonterminal/worker đăng ký/reservation active/HANDOFF tồn tại; thành công thì atomic-set feature/mode/phase VÀ reset cả 4 gate về false trong cùng một write. Cell status `open → claimed → capped/blocked/dropped` cũng enforce tương tự: `claimCell` đòi execution gate approved + mọi dep đã capped; `capCell` đòi verify pass ghi nhận trước, `behavior_change` còn đòi red-failure evidence.

*Why:* triết lý gốc của bee là "gate là cơ chế code, prompt chỉ là lớp phụ" (`four-gates-code-enforced`). Vấn đề bee lo là **agent tự lừa mình** — tin "nó chạy rồi" mà không có bằng chứng. Phòng thủ là transition bị khóa bằng precondition + quyền sở hữu state chỉ nằm ở CLI, không phải race giữa nhiều process (bee không có concurrent external writer).

**Tầng 2 (task-routing):** Đếm risk-flag cơ học (10 lá cờ) → lane (docs/tiny/small/standard/high-risk/spike); lane rẽ nhánh hình dạng chain: docs thoát planning ngay, tiny/small gộp Gate 2+3 và fold validating inline (`lane-routes-chain-shape`). Mọi skill đa-mode chuẩn hóa dispatch thành bảng `Mode | Trigger | Does` lặp lại nhất quán (bee-scribing 5 mode, bee-briefing 4 mode — `mode-tables-trigger-dispatch`). Orchestrator swarming dispatch theo wave (dep-capped + không chung file → cùng wave), parse status token trả về ([DONE] → goal-check re-run verify; [BLOCKED] → rescue ladder 3 nấc more-context → stronger-tier → escalate — `status-token-wave-dispatch`).

*Why:* "lanes scale ceremony, never memory" — quyết định lane phải tất định từ flag đếm được, không phải cảm nhận agent, để chống ceremony trôi (quá nhẹ hoặc quá nặng theo tâm trạng).

**Tầng 3 (skill-routing):** bee-hive là router entry point duy nhất với bảng tường minh "Request type → First skill"; mọi skill kết thúc bằng một câu handoff cố định gọi tên skill kế tiếp; hook `bee-chain-nudge.mjs` (SubagentStop) đọc phase từ state và nhắc bước kế — advisory-only, không block. Không bao giờ auto-resume: `HANDOFF.json` tồn tại luôn surface cho người chờ xác nhận.

*Why:* giữ quyết định "skill nào kế tiếp" sống trong bộ máy harness (hook + câu handoff tường minh) thay vì trí nhớ agent qua một chain dài — chống mất phương hướng sau compaction/context loss.

### repository-harness

**Tầng 1:** Story status là **single door** — chỉ `story complete` được set `implemented`; `story update` REJECT tường minh target đó qua `reject_ordinary_story_implementation()`. Concurrency xử lý bằng compare-and-set: update đòi `--expected-status` khớp status hiện tại **trong cùng transaction**; lệch → `CONFLICT`/exit 3, không ghi gì. Epoch fence là state machine riêng: `fenced → switched_pending_validation → complete/compensated`, fail-closed nếu journal SHA-256 hỏng/thiếu.

*Why:* harness được thiết kế cho **nhiều process/orchestrator đồng thời** chạm cùng SQLite store (ví dụ tường minh trong contract: "another process changes it to `changed`"). Vấn đề không phải "agent có trung thực" (bài toán của bee) mà là "hai process có đang race". CAS là primitive đúng cho race; bee không cần vì `.bee/state.json` chỉ có một writer tại một thời điểm (serialized qua CLI).

**Tầng 2:** Request class (read-only vs change) quyết định MỘT LẦN ở đầu mọi tương tác và gate toàn bộ hình dạng loop — nhị phân, không phải phổ nhiều lane như bee. Trong nhánh "change", risk-flag → lane (tiny/normal/high-risk) quyết định độ sâu tài liệu. `mutates_state()` classifier trong Rust map MỌI biến thể lệnh CLI (kể cả theo flag cụ thể như `--commit`, `--record-evidence`) thành boolean, cấp phát epoch-fence guard từ đó — đây là bản mã hóa của "lệnh nào được chạy ngay bây giờ".

*Why:* harness là CLI được tiêu thụ bởi nhiều loại caller khác nhau (agent, script, external orchestrator như Symphony) — phân loại phải là hàm thuần của cú pháp lệnh, không phải phán đoán, vì bất kỳ caller nào cũng phải đoán trước được hành vi mutate mà không cần chạy thử (dùng cả cho fencing lẫn audit).

**Tầng 3:** `orchestration-protocol-v1` biến "caller ngoài làm gì kế tiếp" thành bảng dữ liệu: `database_state` (missing/current/needs_migration/unsupported) → hành động quy định; exit code (0/2/3/4/5) → phạm trù lỗi; mutation timeout = outcome bất định → bắt buộc rediscover + query status trước khi retry, không bao giờ giả định rollback hay commit. "Branch on error code, never on message."

*Why:* harness phục vụ caller ngoài, có thể KHÔNG phải LLM (Symphony, decision 0009) — protocol phải là data contract ổn định không cần đọc văn xuôi, vì caller có thể là script thuần. Khác về bản chất với tầng 3 của bee, vốn giả định caller LÀ một LLM đọc được câu handoff.

## So sánh & trade-offs

| Chiều | beegog | repository-harness |
|---|---|---|
| Audience của router | LLM agent trong cùng session/chain — đọc prose | Bất kỳ process nào, có thể không phải agent — đọc data |
| Bài toán tầng 1 phòng thủ | Agent tự lừa mình (không bằng chứng vẫn tin "xong") | Race giữa nhiều writer đồng thời (lost update) |
| Cơ chế tầng 1 | Precondition-gated transition + CLI-only ownership | Compare-and-set (expected-status trong transaction) |
| Cách chọn lane (tầng 2) | Đếm flag cơ học, 6 lane, cascade vào MỌI artifact downstream (dạng plan, gate merge, dispatch tier) | Đếm flag cơ học (bee thừa kế cùng danh sách), 3 lane, chỉ quyết định độ sâu tài liệu |
| Hình dạng tầng 3 | Chu trình đóng, cyclic — mọi node biết node kế tiếp tường minh | Không phải chain nhiều-skill — 1 request/response với external consumer tự quyết hành động tiếp từ data |
| Giao tiếp lỗi | Handoff sentence + advisory hook nudge (không block) | Exit code + "branch on code, never on message" |

**Lưu ý so sánh không hoàn toàn cùng mức:** harness không phải hệ multi-skill nên "tầng 3" của nó thực ra là *cross-system protocol routing* chứ không phải *chọn skill kế tiếp* — vẫn đáng đối chiếu vì là lời giải khác cho cùng bài toán tổng quát "quyết định hành động tiếp theo qua một ranh giới tin cậy", chỉ là ranh giới khác nhau (agent↔agent vs process↔process).

**Hội tụ độc lập đáng chú ý (tầng 1↔2):** cả hai đều biến "việc/task chạy được kế tiếp" thành **predicate dẫn xuất từ state**, không phải danh sách tay — bee's `readyCells()` (dep đã capped) và harness's `runnable` SQL predicate (status=planned AND verify_command non-empty AND mọi blocker implemented) là cùng một insight tới từ hai hướng độc lập. Harness còn đi xa hơn: contract cấm tường minh consumer tự suy lại rule ("must not reproduce the SQL rules") — chống drift định nghĩa khi có nhiều consumer.

## Giải pháp tổng hợp cho host

Đề xuất cho lớp routing của forgent (nếu/khi xây), ghép từ cả hai theo nguyên tắc **chọn mô hình theo interface, không chọn một mô hình toàn cục**:

1. **Tầng 1 — mặc định theo bee, bảo hiểm theo harness.** forgent hiện là single-agent-session giống bee (không có concurrent writer vào state layer) → dùng ownership code-only + precondition-gated transition làm mặc định (deny hand-edit, reset atomic). Nhưng thêm ngay từ đầu một CAS check rẻ (`--expected-status` kiểu harness) cho MỌI transition ghi vào state dùng chung — bảo hiểm gần như miễn phí, phòng khi sau này có background job (vd compounding chạy nền) + interactive session cùng chạm state cùng lúc.

2. **Tầng 2 — dùng nguyên danh sách flag cơ học** (đã hội tụ độc lập ở cả hai nguồn, không cần tái phát minh). Giữ nó dạng dữ liệu thuần (JSON list of flag defs), không nhúng trong văn xuôi skill — để grep được, audit được, và không lệch giữa các nơi trích dẫn nó.

3. **Tầng 3 — hai mô hình song song theo loại consumer** (2026-07-13: forgent xác nhận multi-skill — mô hình bee là mặc định thật, không còn giả định):
   - Interface agent↔agent trong cùng chain (đây là default case của forgent): dùng mô hình bee — handoff sentence tường minh + hook nudge advisory. Rẻ, phù hợp vì cả hai đầu đều là LLM đọc prose tốt hơn parse JSON.
   - Interface chạm consumer không-chắc-là-agent (CLI của chính distill.mjs, hook, CI, hoặc bất kỳ script ngoài nào gọi vào forgent): áp kỷ luật harness — exit-code-theo-category (không match string lỗi), decision-table tường minh cho mỗi state khả dĩ (như `database_state`), và "mutation timeout = bất định → rediscover trước retry".

4. Chọn mô hình tại **thời điểm thiết kế mỗi interface cụ thể**, không tại thời điểm thiết kế toàn hệ — vì ngay trong forgent, `distill.mjs` (CLI, có thể gọi bởi non-agent) và một multi-skill chain tương lai (nếu có, agent-only) sẽ cần hai mô hình khác nhau cùng lúc.

## Portable ideas

| Idea | Nguồn | R E F | Ghi chú |
|---|---|---|---|
| cas-expected-status-transitions | repository-harness:story-status-single-door | R2 E2 F1 | State transition guard chống lost-update; chưa cấp bách (forgent single-writer hôm nay) nhưng rẻ để cài ngay khi dựng state layer — tránh phải retrofit sau khi có 2nd writer |
| routing-model-per-interface | tổng hợp (beegog:hive-first-skill-router + repository-harness:protocol-next-action-table) | R3 E2 F1 | Nguyên tắc thiết kế: prose-handoff cho interface agent↔agent trong chain, data/exit-code cho interface chạm consumer không-chắc-là-agent — chọn theo audience của từng interface, không chọn một mô hình toàn cục |

(next-work-derived-from-state — hội tụ readyCells/runnable — đã có candidate row từ backfill trước, không lặp lại ở đây.)

## Open questions

- ~~forgent có kế hoạch multi-skill chain thật sự...~~ **Đã trả lời 2026-07-13: forgent chắc chắn multi-skill** → mô hình bee (prose-handoff + hook nudge) là tầng 3 mặc định thật cho interface agent↔agent, không còn là giả định điều kiện.
- Nếu chọn port `cas-expected-status-transitions`, cần biết state layer forgent dùng gì. Khảo sát nhanh 2026-07-13 (web, ngoài phạm vi 2 nguồn — đánh dấu Docs/Inference, không phải Local/Upstream): nếu state layer vẫn JSON (kiểu bee), CAS cần tự cài version/lock field vì JSON không có transaction sẵn. Nếu cân nhắc nâng lên embedded DB có graph (do forgent cần model dependency/routing dạng graph — cells/stories/skill-chain đều là graph tự nhiên):
  - **KuzuDB** (embedded property graph, Cypher, từng là lựa chọn SQLite-cho-graph rõ nhất) — **đã bị archive 10/2025** sau khi Apple mua lại Kùzu Inc.; hiện chỉ còn community fork (LadybugDB, bighorn/Kineviz), chưa đủ track record để tin cậy làm dependency mới.
  - **CozoDB** — vẫn active, embeddable, Datalog + hỗ trợ graph/vector/relational, có backend SQLite (`cozo-sqlite`) nên transaction/CAS đến miễn phí từ SQLite bên dưới — ứng viên an toàn hơn Kuzu hiện tại nếu forgent muốn state layer graph-native.
  - Alternative khác nổi lên sau vụ Kuzu (chưa đủ evidence để khuyến nghị): FalkorDB (GraphBLAS, source-available, không open-source), ArcadeDB, HugeGraph — cần khảo sát riêng nếu forgent thật sự muốn graph engine, đây là câu hỏi implementation riêng, ngoài phạm vi deep-dive routing này.
  - **Chưa quyết:** JSON+tự-cài-CAS (rẻ, đủ cho quy mô hiện tại) hay nâng lên CozoDB (graph-native, CAS có sẵn qua SQLite backend, nhưng thêm dependency) — cần user quyết, không tự chọn thay.
