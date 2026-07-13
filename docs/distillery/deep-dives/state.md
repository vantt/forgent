---
topic: state
date: 2026-07-13
based_on: [beegog@e70602a, repository-harness@9cc306d, symphony@2f0b257, marketing-cockpit@588d800]
entries: [beegog:state-vs-log-two-physics, beegog:phase-machine-cli-owned, beegog:cell-status-lifecycle, beegog:policy-vs-ops-split, beegog:docs-history-per-feature, repository-harness:durable-sqlite-layer, repository-harness:changeset-event-sourcing, repository-harness:story-status-single-door, repository-harness:epoch-fence-migration-guard, repository-harness:policy-vs-durable-separation, symphony:run-and-queue-state-machine, symphony:run-artifact-durability-split, symphony:changeset-content-sha-immutability, symphony:board-state-precedence-derivation, marketing-cockpit:four-memory-types, marketing-cockpit:procedural-memory-reinforcement, marketing-cockpit:four-zone-storage-separation, marketing-cockpit:task-signal-state-machines]
---

# Deep-dive: state

**Bottom Line:** "State" trong 4 nguồn không phải một thứ mà là **bốn tầng tách biệt** thường bị gộp nhầm: (1) *state-shape* — mô hình vòng đời (FSM enum + precondition); (2) *store vật lý* — JSON zero-dep vs SQLite vs YAML; (3) *knowledge/memory* — cái gì overwrite theo reality vs cái gì append-only theo thời gian; (4) *durability* — "chạy xong ≠ đã merge ≠ đã bền". Insight nền tảng nhất, phát biểu tường minh chỉ ở bee, là **log-vs-state hai vật lý ngược nhau** — mọi thiết kế state đúng đắn bắt đầu từ việc phân loại mỗi mẩu dữ liệu vào một trong hai. fgOS (marketing-cockpit) đẩy trục memory xa nhất: 4 loại memory theo khoa học nhận thức + consolidation loop + quên có trọng số bằng chứng — đây là **candidate mới mạnh nhất deep-dive này tìm ra** (chưa có trong porting-log). Khuyến nghị cho forgent: khóa nguyên lý log-vs-state làm luật thiết kế state layer TRƯỚC khi chọn store; giữ store zero-dep JSON như bee cho tới khi query/aggregate thành nút thắt thật; và nếu forgent cần agent tự học qua nhiều session thì port mô hình typed-memory + consolidation của fgOS (đây là thứ bee/harness/symphony đều KHÔNG có). Mặt concurrency-safety của state (CAS/lock/fence) đã phân tích trong deep-dive `routing` §tầng-1 — ở đây chỉ tham chiếu, không lặp lại.

## Câu hỏi

Bốn nguồn *mô hình hóa, lưu trữ, chuyển tiếp và bền hóa* state bằng cơ chế nào — và ranh giới nào giữa "state" (nơi ta đang ở), "log" (làm sao tới đây) và "memory" (cái agent học được) khiến mỗi bên chọn thiết kế đó?

## Cách từng nguồn giải quyết

### beegog — nguyên lý hai-vật-lý, store zero-dep

**State-shape:** Vòng đời enum có precondition-gated transition ở hai mức — phase (`idle → exploring → planning → validating → swarming → scribing → compounding`, `.bee/state.json`) và cell (`open → claimed → capped/blocked/dropped`, `.bee/cells/`). Transition là API có tiền điều kiện, không phải gán trực tiếp; write-guard hook deny hand-edit (`state-vs-log`, `phase-machine-cli-owned`, `cell-status-lifecycle`).

**Store:** JSON/JSONL zero-dependency. `.bee/state.json` một-writer serialized qua CLI; cell là file JSON tự chứa đủ để dispatch ("plans are prompts", `cell-task-unit`).

**Knowledge/memory — đóng góp lý thuyết lớn nhất:** `state-vs-log-two-physics` phát biểu hai loại tri thức có vật lý NGƯỢC nhau:
- **Log** — append-only, per-*feature*, `decisions.jsonl` + `docs/history/<feature>/`; trả lời *"how did we get here"*; không bao giờ overwrite.
- **State** — overwrite theo reality, per-*area*, `docs/specs/`; trả lời *"where are we"*; luôn phản ánh hiện tại.

*Why:* "đa số hệ chỉ có log" — bee coi việc thiếu tầng state (area-truth ghi đè được) là lỗi thiết kế memory phổ biến. `policy-vs-ops-split` là hệ quả vật lý: markdown `docs/` cho người (policy), JSON `.bee/` cho máy (ops); gitignore tách machine-local (state/log/cache) khỏi team-durable (cells/decisions).

*bee KHÔNG có:* memory được-gõ-kiểu (typed) hay quên tự động — chỉ hai physics, không có TTL/consolidation.

### repository-harness — durable layer query-được, changeset làm git-truth

**State-shape:** Story lifecycle `planned → in_progress/changed → implemented/retired`, single-door + CAS (`story-status-single-door`) — chi tiết concurrency ở deep-dive `routing`. Epoch fence là FSM riêng cho cutover: `fenced → switched_pending_validation → complete/compensated`, fail-closed nếu journal SHA-256 hỏng (`epoch-fence-migration-guard`).

**Store — trục nổi bật nhất:** SQLite `harness.db` qua Rust CLI (bảng intake/story/decision/backlog/tool/intervention/trace). Phương châm tường minh: *"Policy documents describe how to work. The durable layer stores what happened."* (`durable-sqlite-layer`). Nhưng SQLite không diff được trong git → giải bằng **changeset event-sourcing** (`changeset-event-sourcing`): mọi run ghi semantic changeset JSONL (`story.add/update`, `decision.add`...), append **trong cùng SQLite transaction** (rollback chung), full-record chứ không column-diff, idempotent replay, `db rebuild` dựng lại toàn bộ db. db gitignored, **changesets committed** (negation pattern `.gitignore`, `policy-vs-durable-separation`). Từ 9cc306d: `content_sha256` chống double-apply lệch nội dung.

*Why:* harness phục vụ nhiều orchestrator + cần query/aggregate mạnh (work-graph, backlog) → SQLite thắng JSON. Nhưng "truth phải sống trong git" → event log commit được là cầu nối. Đây là **cùng pattern với Beads (steveyegge)** — hội tụ độc lập: db là materialized view, JSONL là source of truth.

### symphony — durability chia 5 mức, state của consumer

**State-shape:** Hai FSM song song — run (`prepared/running → completed|blocked|needs_intake|partial|failed|cancelled`) + auto-queue (`queued → running(attempts++) → completed | retry | failed`), single-active-run lock + migration fence RAII (`run-and-queue-state-machine`). Board state suy ra bằng precedence thuần (`board-state-precedence-derivation`) — xem `routing`.

**Durability — đóng góp riêng biệt:** `run-artifact-durability-split` phân MỌI artifact vào **5 mức bền tường minh**: product/code/docs → branch/PR; `.harness/changesets/*.jsonl` → commit+retain; SUMMARY/RESULT/logs → local compactable; harness.db → local rebuildable; `.symphony/state.db` → local-only. Hệ quả phát biểu thẳng: **"successful run ≠ merged change"** — result valid trong khi branch còn chờ review; PR merge KHÔNG mutate db clone khác, `sync` mới apply một lần. Retention chỉ nén run artifacts (`keep_last≥1`), không đụng changeset.

**Store của consumer:** `.symphony/state.db` do symphony sở hữu; harness.db opaque sau protocol. changeset_sync ghi `content_sha256` bất biến (`changeset-content-sha-immutability`) — verify SHA hai đầu trước+sau apply.

*Why:* symphony là consumer đứng ngoài chạy fleet run song song → phải phân biệt rạch ròi "state của tôi" (`.symphony/`) vs "state của engine" (opaque), và "đã chạy" vs "đã bền" vì một run thành công chưa chắc đã vào main.

### marketing-cockpit (fgOS) — memory được-gõ-kiểu, quên có trọng số

**State-shape:** Ba FSM declarative (TaskState/WorkflowState 7 trạng thái + Signal FSM riêng), transition gated bởi initiator+condition; checkpoint atomic (save on stage-complete, restore/rollback, prune >5); claim protocol dùng **atomic filesystem rename làm CAS-lock**, `state:` field là truth (reader tin state không tin filename) — `task-signal-state-machines`. Store là YAML (`.fgOS/runtime/state.yaml`).

**Memory — đóng góp lớn nhất, KHÔNG nguồn nào khác có:** `four-memory-types` phân memory theo khoa học nhận thức, mỗi loại có scope/lifetime/TTL riêng:
- **working** — task-scope, session-only, never-persist
- **episodic** — project, 90d default / 365d nếu important (blocked / human-feedback / quality<0.4 / new-pattern)
- **semantic** — global, versioned, chỉ đổi khi knowledge file đổi
- **procedural** — project, never auto-delete (user preferences/patterns)

**Consolidation loop** cuối task/session: extract lessons → ghi episodic → update procedural (newer-wins cần confidence>0.7 + evidence≥2) → clear working. Context injection có cap (episodic 5, procedural 10, semantic 5). `procedural-memory-reinforcement`: pattern học có confidence với **reinforcement +0.1/episode xác nhận, contradiction −0.2/episode mâu thuẫn**; xóa chỉ khi confidence<0.2 sau mâu thuẫn / human-invalid / role gỡ.

**Zone:** `four-zone-storage-separation` mở rộng policy-vs-ops thành 4 zone: `.fgOS/` (core read-only, agent-agnostic) · `studio/` (user data git-tracked) · `.workspace/` (machine gitignored, run-state/checkpoint, 30d retention) · `.{platform}/` (adapter). Auto-promotion đẩy artifact workspace→studio theo rule; reserved-names guard chống brand đè config/shared.

*Why:* fgOS là framework marketing đa-brand chạy nhiều session dài → agent PHẢI nhớ xuyên session và tự cải thiện. "Log vs state" hai-physics của bee không đủ: cần phân biệt cái quên-được-sau-90-ngày (episodic) với cái không-bao-giờ-quên (procedural preferences), và cần cơ chế reinforcement để pattern tốt nổi lên, pattern sai chìm xuống — self-improvement ở tầng runtime/agent (khác friction-backlog của bee ở tầng harness/human).

## So sánh & trade-offs

| Chiều | beegog | repository-harness | symphony | marketing-cockpit (fgOS) |
|---|---|---|---|---|
| Store vật lý | JSON/JSONL zero-dep | SQLite + changeset JSONL | SQLite (state.db riêng) + protocol | YAML (state.yaml) |
| Truth ở đâu | file JSON là truth | **changeset JSONL là truth, db là view** | changeset (verify SHA 2 đầu) | state.yaml `state:` field |
| Mô hình memory | 2 physics (log/state) | ngầm (changeset=log, db=state) | durability-split (5 mức) | **4 loại typed + consolidation + forgetting** |
| Quên / TTL | không | không (append vĩnh viễn) | retention nén run-artifact (keep_last≥1) | TTL/importance-weighted per-type |
| Self-improvement từ state | friction-backlog (human/harness tier) | không | recovery-action từ run-state | **procedural reinforcement (agent tier)** |
| Concurrency trên state | 1-writer (không cần) | CAS expected-status | lock + fence + rename | rename-CAS cho signal |
| Ranh giới commit/ignore | policy-vs-ops (2 zone) | negation: changesets committed | forbidden-paths guard tại commit | 4 zone + auto-promotion |

**Ba điểm hội tụ độc lập đáng chú ý (tín hiệu E3):**
1. **CAS xuất hiện 3 lần độc lập** — harness `expected-status`, symphony `content_sha256`, fgOS atomic-rename. Cùng insight "so-rồi-ghi nguyên tử" tới từ 3 hướng khác nhau (đã có candidate `cas-expected-status-transitions`).
2. **db-là-view, log-là-truth** — harness changeset ↔ Beads JSONL-truth (đã có candidate `changeset-event-sourcing`).
3. **state-shape = FSM có precondition** — cả 4 nguồn: transition là API gated, không phải gán trực tiếp (đã phủ ở `routing`).

**Điểm KHÔNG hội tụ (chỉ 1 nguồn, nhưng giá trị cao):** memory typed + consolidation + forgetting chỉ có ở fgOS. Đây là khoảng trống của 3 nguồn còn lại, không phải vì họ giải khác mà vì họ **không cần** (bee/harness/symphony không có agent học xuyên session dài-hạn như marketing đa-brand). → Với forgent, câu hỏi là *forgent có cần tầng memory đó không*, không phải *chọn mô hình nào*.

## Giải pháp tổng hợp cho host

Thiết kế state+memory layer cho forgent, ghép theo nguyên tắc **phân tầng — mỗi tầng chọn nguồn đúng nhất, không copy một nguồn trọn gói**:

1. **Tầng nguyên lý (khóa TRƯỚC khi code) — theo bee.** Áp `log-vs-state-two-physics` làm luật thiết kế: mỗi mẩu state phải khai rõ nó là *log* (append-only, per-feature, "how we got here") hay *state* (overwrite, per-area, "where we are"). Đây là quyết định rẻ nhất và có đòn bẩy cao nhất — làm sai tầng này thì mọi store phía dưới sai theo. forgent hiện có `docs/distillery/` (state: overwrite per-area) + `plans/reports/` (log: append per-session) — thực ra ĐÃ theo pattern này một cách ngầm; chỉ cần phát biểu thành luật.

2. **Tầng store — zero-dep JSON như bee, giữ đường nâng cấp changeset của harness.** forgent hôm nay không có nhu cầu query/aggregate mạnh → JSON/JSONL zero-dep thắng (dễ vendor, diff-được-trong-git miễn phí, không dependency). CHỈ nâng lên SQLite khi query/aggregate thành nút thắt thật (YAGNI). Nếu/khi nâng: bê nguyên pattern harness — **db là materialized view, changeset JSONL committed là truth, `rebuild` dựng lại db** — để không mất tính diff-được-trong-git. Không đi thẳng SQLite-as-truth.

3. **Tầng durability — mượn "5 mức bền" của symphony NGAY khi có branch/PR flow.** Phát biểu tường minh "chạy xong ≠ đã merge ≠ đã bền" tránh bug kiểu coi run thành công là đã-xong. forgent chưa có fleet-run nên chưa cấp bách, nhưng nguyên tắc rẻ để ghi vào doc từ đầu.

4. **Tầng memory — CÓ ĐIỀU KIỆN, chỉ port fgOS nếu forgent cần agent học xuyên session.** Đây là quyết định product, không phải kỹ thuật:
   - Nếu forgent chỉ là harness/tooling (như bee/harness) → hai-physics của bee là ĐỦ, đừng thêm typed-memory (over-engineering).
   - Nếu forgent muốn agent nhớ preference người dùng + tự cải thiện pattern xuyên nhiều session (như fgOS) → port `four-memory-types` + `procedural-memory-reinforcement`: phân working/episodic/semantic/procedural, consolidation loop cuối session, quên có trọng số bằng chứng. Đây là thứ 3 nguồn kia KHÔNG cung cấp — giá trị độc nhất của việc đã scan marketing-cockpit.
   - Lấy gì / bỏ gì: lấy phân loại 4-type + consolidation + reinforcement math; BỎ độ phức tạp multi-brand zone (`studio/{brand_id}/`) trừ khi forgent thật sự đa-tenant.

5. **Tầng concurrency-safety — theo khuyến nghị deep-dive `routing`:** default single-writer kiểu bee + cài sẵn CAS rẻ (`expected-status` hoặc rename-lock) cho mọi ghi vào state dùng chung, phòng background job tương lai. Không lặp lại phân tích ở đây.

**Thứ tự thực thi đề xuất:** (1) khóa nguyên lý log-vs-state — gần như free, làm ngay → (5) cài CAS khi dựng state layer → (2) store JSON, nâng cấp có điều kiện → (3)(4) chỉ khi product cần branch-flow / cross-session memory. Quyết định lớn duy nhất cần human: **forgent có cần tầng memory (4) không** — vì nó là subsystem thật, không phải convention.

## Portable ideas

| Idea | Nguồn | R E F | Ghi chú |
|---|---|---|---|
| log-vs-state-two-physics | beegog:state-vs-log-two-physics | R3 E2 F2 | (đã có trong porting-log) nâng khuyến nghị: khóa làm luật thiết kế TRƯỚC store; forgent đã theo ngầm (distillery vs reports) — chỉ cần phát biểu |
| typed-memory-consolidation | marketing-cockpit:four-memory-types + procedural-memory-reinforcement | R3 E2 F3 | **MỚI** — 4-type memory + consolidation loop + forgetting có trọng số; thứ bee/harness/symphony đều thiếu; CÓ ĐIỀU KIỆN: chỉ nếu forgent cần agent học xuyên session |
| durability-tier-ladder | symphony:run-artifact-durability-split | R2 E2 F1 | **MỚI** — "chạy xong ≠ merged ≠ durable" thành N mức bền tường minh; rẻ để ghi vào doc từ đầu; chỉ đáng khi có branch/PR flow |
| db-as-view-log-as-truth | repository-harness:changeset-event-sourcing | R2 E3 F3 | (đã có `changeset-event-sourcing`) — chỉ liên quan khi/nếu nâng store lên SQLite; giữ đường diff-trong-git |
| cas-expected-status-transitions | repository-harness:story-status-single-door | R2 E2 F1 | (đã có) — mặt concurrency, xem deep-dive routing |

## Open questions

- ~~**forgent có cần tầng memory typed (điểm 4) không?**~~ **ĐÃ QUYẾT 2026-07-13 (user):** cần CẢ HAI, **phân tầng** — log-vs-state 2-physics cho **lower layer** (cơ học, raw, chính xác: state/FSM, cells, cursor, changeset); 4 mem-type + consolidation cho **higher layer** (process, framework, skill — nơi agent học pattern). Hai mô hình không phủ định nhau: physics là vật lý lưu trữ của tầng máy, mem-type là vòng đời tri thức của tầng nhận thức. Synthesis này CHỈNH lại khuyến nghị gốc của deep-dive (vốn coi typed-memory là có-điều-kiện thay-thế) — điều kiện resolve thành kiến trúc 2 tầng đồng thời.
- Nếu port typed-memory: retention math của fgOS (90d/365d, confidence>0.7, evidence≥2, ±0.1/−0.2) là giá trị fgOS chọn cho domain marketing — forgent cần tự hiệu chỉnh, không bê nguyên số.
- Store nâng cấp: nếu forgent chọn graph-native (cells/routing là graph tự nhiên) thì câu hỏi Kuzu-archived/CozoDB đã nêu ở deep-dive `routing` §open-questions vẫn treo — chưa quyết JSON+tự-CAS vs embedded graph DB.
  - Cập nhật evidence 2026-07-13 (web, Docs-label): **CozoDB thực tế dormant** — release cuối v0.7.6 12/2023, ~2.5 năm không release, một-tác-giả; khuyến nghị trước đó gọi nó "active" là SAI, rút lại. Ứng viên graph embedded còn sống duy nhất: **LadybugDB** (fork kế thừa Kuzu, v0.17.0 05/2026, active nhưng non trẻ từ 10/2025). Đường an toàn nhất khi nâng store: **SQLite-as-view + changeset-JSONL-as-truth** (pattern harness, store-agnostic — đổi engine sau bằng replay), graph engine chỉ khi traversal là nút thắt thật.
  - **ĐÃ QUYẾT 2026-07-13 (user):** cơ chế changeset-JSONL kiểu harness được CHỐT thành luật cho mọi db tương lai của forgent — "db chỉ được vào khi là view; truth ở JSONL committed trong git; rebuild dựng lại từ zero". Chọn engine (SQLite/Ladybug) vẫn defer tới khi ngưỡng friction có bằng chứng — nhưng nhờ luật này, chọn engine là quyết định đảo-ngược-được (replay), không phải cửa một chiều.
