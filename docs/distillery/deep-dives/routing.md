---
topic: routing
date: 2026-07-13
redived: 2026-07-13 (mở rộng 2→4 nguồn: +symphony@2f0b257, +marketing-cockpit@588d800); 2026-07-15 (delta beehive af4840c→55cf3a4: beehive thêm trục pull-dispatch + multi-lane); 2026-07-21 (delta beehive 94b4a31→05a131f: dispatch có NƠI-DUY-NHẤT-sinh-payload + tier gắn agent-type cụ thể; worktree substrate thành đường lát sẵn với luật lane-first D9)
based_on: [beehive@05a131f, repository-harness@0a79bbe, symphony@2f0b257, marketing-cockpit@588d800]
entries: [beehive:hive-first-skill-router, beehive:phase-machine-cli-owned, beehive:cell-status-lifecycle, beehive:lane-routes-chain-shape, beehive:status-token-wave-dispatch, beehive:mode-tables-trigger-dispatch, beehive:lane-scoped-pipelines, beehive:claim-next-pull-selection, beehive:cross-session-atomic-claims, beehive:chain-integrity-guard-tail, beehive:independent-feature-worktrees, beehive:dispatch-prepare-payload-builder, beehive:pinned-tier-agent-types, beehive:small-lane-serial-execution, beehive:merged-gate-tiny-small, repository-harness:request-class-loop-dispatch, repository-harness:story-status-single-door, repository-harness:runnable-derived-dispatch, repository-harness:mutates-state-command-gate, repository-harness:protocol-next-action-table, symphony:discovery-before-mutation-client, symphony:board-state-precedence-derivation, symphony:agent-adapter-codex-jsonrpc, symphony:run-and-queue-state-machine, symphony:bounded-auto-polling, marketing-cockpit:three-level-intent-routing, marketing-cockpit:signal-driven-chaining, marketing-cockpit:executor-registry-cognitive-tier, marketing-cockpit:failure-recovery-matrix, marketing-cockpit:agent-agnostic-adapter-spec, marketing-cockpit:task-signal-state-machines]
---

# Deep-dive: routing

> stale vs repository-harness@0a79bbe (9cc306d→0a79bbe, 2026-08-07) — cited routing entries (`request-class-loop-dispatch`, `story-status-single-door`, `runnable-derived-dispatch`, `mutates-state-command-gate`, `protocol-next-action-table`) đều thuộc SQLite/CLI compatibility surface, giờ bị đóng băng đằng sau `--compatibility-write` mặc định (Phase 4, decision 0022) thay vì là routing loop mặc định. Routing mặc định cho việc thường giờ nhẹ hơn nhiều: `repository-centered-default-workflow` (3 câu hỏi độc lập: durable-memory/human-judgment/validation, không qua CLI mutation nào). `protocol-next-action-table` (external orchestrator) không đổi — vẫn giữ nguyên vì đã được miễn compatibility freeze. Đáng ngấm vào lần re-dive sau nếu forgent còn tham chiếu repository-harness's default routing loop (nay không còn default).

> **Re-dive delta beehive 94b4a31→05a131f (2026-07-21):** trục dispatch cứng thêm ở CẢ ba tầng, kết luận 4-trục KHÔNG đổi. (1) `beehive:dispatch-prepare-payload-builder` (entry MỚI) — `prepareDispatch()` trở thành NƠI DUY NHẤT sinh payload cho mọi dispatch beehive sở hữu (Agent/spawn_agent/Bash), tự kiểm qua `evaluateDispatch` rồi audit vào `dispatch.jsonl`; PURPOSE MAP ánh xạ kind→slot (cell/gather→generation, reviewer→review, advisor→slot riêng không bao giờ rơi về generation); dispatch kind `cell` bị TỪ CHỐI (`not_claimed`/`not_owner`) nếu cell chưa `claimed` đúng worker đó — refusal luôn typed, không bao giờ bị lách. Đây là bước "hook chặn dispatch sai" (`model-guard-tier-transport`, đã biết) tiến lên "code SINH dispatch đúng". (2) `beehive:pinned-tier-agent-types` (entry MỚI) — mỗi tier có-model nay có MỘT agent type cụ thể (`bee-gather`/`bee-extract`/`bee-review`); `subagent_type:"general-purpose"` bị deny (`generic-type-denied`) vì type chung không mang danh tính tier. Vá đúng lỗ mà bản redive 94b4a31 từng ghi ("boundary ép trong CODE, không phải prompt") còn để hở: khai tier trong PROMPT vẫn chưa đủ nếu agent-type không tự mang model. (3) `beehive:small-lane-serial-execution` (entry MỚI) — làm rõ lane tiny/small LUÔN đi qua ĐÚNG MỘT execution worker được dispatch (never zero, never wave); "0 subagent" của lane scaling chỉ là zero subagent NGHI THỨC, chưa từng là zero worker. (4) `beehive:cross-session-atomic-claims` (đã cite) thêm 2 vá: session tự-nhận khi thiếu env NHƯNG chỉ đúng một session record sống (≥2 sống → vẫn từ chối, không đoán); sweep claim chết nay reset CẢ CELL về `open` (trước đây cell mắc kẹt `claimed` mãi mãi dù claim đã chết). (5) `beehive:independent-feature-worktrees` (đã cite từ 94b4a31) từ PRIMITIVE thành ĐƯỜNG LÁT SẴN: `beehive worktree new --feature <slug>` gộp tạo+grant+bootstrap một lệnh, mọi pre-check typed zero-mutation; kèm doctrine D9 **lane-first**: feature mới trong checkout đang bận mặc định đi LANE (không mở worktree), chỉ lấy grant worktree tại Gate 3 và CHỈ KHI thực sự chồng file — chủ động giảm số lần cần tới bộ máy cô-lập-cây. D9 trực tiếp trả lời câu "chọn substrate nào trước" mà §5 Giải pháp bên dưới từng để mở.

> **Re-dive delta beehive 55cf3a4→94b4a31 (2026-07-18):** trục dispatch của beehive tiến hai bước lớn. (1) `beehive:computed-parallel-schedule` — Tầng-2 chuyển từ wave PROMPT-tính (`status-token-wave-dispatch`, đã cite) sang hàm DẪN XUẤT thuần (`computeSchedule`/`detectCycles`, Kahn+Tarjan) + từ chối chu-trình lúc ghi: mạnh thêm hội tụ #1 "next = truy vấn dẫn xuất từ state" và ô "hình dạng dispatch". (2) `beehive:independent-feature-worktrees` — trục fan-out THỨ HAI (cô lập cây qua git worktree, `.bee/` riêng mỗi worktree, merge-back giao dịch) bên cạnh trục claims/lanes same-checkout: §5 "substrate trước dispatch" nay phải bàn HAI lựa chọn substrate, không một. (3) `beehive:native-codex-wait-discipline` nâng đề xuất "failure→recovery routing" của chính dive từ ý-tưởng thành reference-impl. (4) `model-tiers-cost-discipline` update: tier boundary gather-only cưỡng chế ở CODE (`resolveTier`, từ chối `cli_tier_gather_only`), không còn prose-advice.

> Delta beehive e70602a→af4840c (2026-07-13, verified): không lật kết luận nào. Liên quan: write-guard vá lỗ "guard test một state khi state model có N terminal states" (idle + compounding-complete) — củng cố luận điểm transition/guard theo TẬP trạng thái; thêm doctrine-layer + anchor-suite (entry mới beehive:doctrine-layer-always-loaded, ngoài phạm vi dive này).

> **Delta beehive af4840c→55cf3a4 (2026-07-15, re-dive theo yêu cầu — CÓ dịch chuyển kết luận):** fresh-session-handoff (fsh-1..13) đưa vào beehive đúng những cơ chế routing mà bản 4-nguồn quy CHỈ cho fgOS — nhưng theo hướng NGƯỢC lại. (1) **Trục pull-dispatch mới:** `beehive:claim-next-pull-selection` — worker rảnh TỰ kéo unit approved kế (own-lane-first, cross-lane chỉ khi gate duyệt, hold-skip, quét claim-chết trước). fgOS `three-level-intent-routing` là PUSH (bộ định tuyến chấm-điểm gán agent); beehive claim-next là PULL (worker tự chọn trong biên đã duyệt). Không gian fan-out giờ có HAI reference-impl chiều-ngược-nhau, không chỉ một. (2) **Multi-lane phá "chain tuyến tính only":** `beehive:lane-scoped-pipelines` — resolvePipeline giải phase/gate qua lane của phiên trước, mỗi feature là pipeline độc lập song song; beehive không còn đơn-pipeline. (3) **Coordination substrate cho fan-out:** `beehive:cross-session-atomic-claims` (O_EXCL + TTL/heartbeat, reclaim đòi cả-hai) + cross-session hold deny — đây là tầng nền an toàn mà điểm (5)+anti-loop cần, nay có impl thật ngoài fgOS-signal. (4) **Tầng-1 sắc hơn:** `beehive:chain-integrity-guard-tail` — trạng thái close chỉ SINH bởi producer thật (`scribing-run`), không set-được-value; củng cố hội tụ #2 "transition = API có precondition" thành dạng mạnh hơn "state = sản phẩm của hành động thật, không phải giá trị gán". Chi tiết ngấm vào Bottom Line, So sánh (hàng beehive Tầng 2/3), Giải pháp §5, Portable ideas bên dưới.

**Bottom Line:** Với 2 nguồn (beehive, harness) routing đọc như một trục nhị phân "prose-cho-agent vs data-cho-process". Thêm symphony + fgOS, bức tranh giãn ra thành **bốn trục độc lập** mà thiết kế routing phải quyết RIÊNG từng cái: (1) *audience của interface* — agent↔agent đọc prose vs consumer-không-chắc-agent đọc data (kết luận 2-nguồn vẫn đúng, symphony xác nhận bằng consumer thực chứng); (2) *hình dạng dispatch* — chain tuyến tính cố định (beehive ~~only~~; **@55cf3a4 beehive nay còn có multi-lane song song + pull-dispatch `claim-next`**) vs request-class nhị phân (harness) vs **intent-scoring nhiều-agent PUSH** (fgOS) vs **pub-sub signal có loop-guard** (fgOS) vs **worker-pull trong biên đã duyệt** (beehive claim-next) — không gian fan-out có cả PUSH (fgOS) lẫn PULL (beehive); (3) *failure→recovery routing* — chỉ fgOS + symphony coi "lỗi dẫn tới hành động gì" là bảng định tuyến hạng nhất (circuit-breaker, anti-loop, quality-decay, recovery-action từ run-state); (4) *dispatch tách khỏi model* — fgOS tách `cognitive_tier` của task khỏi ánh xạ tier→model, sạch hơn model-guard của beehive. Điểm hội tụ độc lập mạnh nhất giữ nguyên và nay được củng cố qua 4 nguồn: **"việc/hành động kế tiếp = truy vấn dẫn xuất từ state", không phải danh sách tay** (readyCells ↔ runnable ↔ board-precedence ↔ signal-consume). Khuyến nghị cho forgent không đổi ở lõi (chọn mô hình theo interface, không toàn cục) nhưng bổ sung hai candidate reliability đáng giá mà bản 2-nguồn bỏ lỡ: **anti-loop/recovery-matrix** và **cognitive-tier tách model** — cả hai chạm đúng chỗ forgent đã có (loop, cost-tiered delegation).

## Câu hỏi

Bốn nguồn quyết định "chạy/gọi gì kế tiếp" — ở 3 tầng lồng nhau (state trong 1 task, task/agent trong 1 skill, skill/workflow kế tiếp trong hệ) + khi lỗi — bằng cơ chế nào, và mỗi bên chọn vậy vì ranh giới tin cậy nào?

## Cách từng nguồn giải quyết

### beehive — chain tuyến tính, prose cho agent

**Tầng 1 (state-routing):** Phase machine trong `.bee/state.json`, CLI-owned (`bee_state.mjs`), write-guard deny hand-edit. `startFeature()` là transition tiền-điều-kiện: chỉ từ `idle`/`compounding-complete`, chặn nếu còn cell nonterminal/worker/reservation/HANDOFF; atomic-set feature/mode/phase VÀ reset 4 gate trong cùng write. Cell `open → claimed → capped/blocked/dropped`: `claimCell` đòi execution-gate + deps capped; `capCell` đòi verify pass (+ red-failure evidence khi behavior_change).

*Why:* "gate là cơ chế code, prompt chỉ phụ". Bài toán: **agent tự lừa mình**. Phòng thủ = precondition-lock + CLI-only ownership (một writer, không race).

**Tầng 2 (task-routing):** Đếm risk-flag cơ học (10 cờ) → lane (docs/tiny/small/standard/high-risk/spike); lane rẽ hình dạng chain. Skill đa-mode chuẩn hóa bảng `Mode | Trigger | Does`. Swarming dispatch theo wave (dep-capped + không chung file), parse status token ([DONE]→goal-check; [BLOCKED]→rescue ladder 3 nấc). **@05a131f — dispatch chính nó có nơi-sinh-payload DUY NHẤT:** `dispatch-prepare-payload-builder` (`prepareDispatch()`) render payload cho MỌI dispatch beehive sở hữu, PURPOSE MAP kind→slot, và đòi **claim ownership** trước khi phát payload dispatch kind `cell` (worker chưa `claimed` bị từ chối typed, không lách được) — nâng model-guard từ "chặn dispatch sai" lên "sinh dispatch đúng ngay từ đầu". Đi cùng `pinned-tier-agent-types`: mỗi tier có-model gắn MỘT agent type cụ thể (`bee-gather`/`bee-extract`/`bee-review`), `subagent_type` chung bị deny — tier phải có hiện thân agent, khai trong prompt không đủ. Và `small-lane-serial-execution` làm rõ: lane tiny/small vẫn LUÔN qua đúng một execution worker dispatch thật (never zero, never wave) — "0 subagent" của lane scaling chỉ bỏ ceremony (reviewer/panel), không bao giờ bỏ worker.

*Why:* "lanes scale ceremony, never memory" — lane tất định từ flag đếm được, chống ceremony trôi.

**Tầng 3 (skill-routing):** bee-hive router entry-point duy nhất, bảng "Request type → First skill"; mọi skill kết thúc bằng câu handoff cố định; hook `bee-chain-nudge.mjs` (SubagentStop) nhắc bước kế — advisory, không block; không auto-resume (HANDOFF surface cho người).

*Why:* giữ "skill kế tiếp" trong bộ máy harness (hook + handoff prose) thay vì trí nhớ agent — chống drift sau compaction. **Chain tuyến tính**: mỗi node biết node kế tiếp tường minh.

### repository-harness — request-class nhị phân, data cho process

**Tầng 1:** Story status **single-door** — chỉ `story complete` set `implemented`; `story update` reject target đó. Concurrency = compare-and-set (`--expected-status` khớp trong cùng transaction; lệch → CONFLICT/exit 3, không ghi). Epoch fence FSM riêng, fail-closed nếu journal SHA hỏng.

*Why:* thiết kế cho **nhiều process/orchestrator đồng thời** chạm SQLite chung ("another process changes it to `changed`"). Bài toán là race, không phải trung thực. CAS là primitive đúng cho race; beehive không cần (1 writer).

**Tầng 2:** Request class (read-only vs change) quyết định MỘT LẦN ở cửa, gate toàn bộ loop — **nhị phân**, không phổ nhiều lane. Nhánh change: risk-flag → lane (tiny/normal/high-risk) quyết độ sâu doc. `mutates_state()` classifier (Rust) map MỌI biến thể lệnh (kể cả per-flag `--commit`) → boolean, cấp phát epoch-fence guard.

*Why:* CLI tiêu thụ bởi nhiều loại caller — phân loại phải là hàm thuần của cú pháp, đoán trước được không cần chạy thử.

**Tầng 3:** `protocol-next-action-table` biến "caller ngoài làm gì kế tiếp" thành bảng dữ liệu: `database_state` → hành động; exit 0/2/3/4/5 → phạm trù lỗi; mutation timeout = bất định → rediscover trước retry. "Branch on error code, never on message."

*Why:* caller có thể KHÔNG phải LLM (Symphony) — protocol phải là data contract không cần đọc văn xuôi.

### symphony — consumer thực chứng của protocol v1

Symphony (đã tách khỏi harness sang repo riêng) là **bên GỌI thật** của protocol v1 — biến giả định "caller ngoài" của harness thành code thực thi.

**Tầng 1:** Hai FSM song song — run (`prepared/running → completed|blocked|needs_intake|partial|failed|cancelled`) + auto-queue (`queued → running(attempts++) → completed|retry|failed`), single-active-run lock + migration fence RAII (`run-and-queue-state-machine`). Cùng họ "transition là API có precondition" với harness CAS + beehive phase-machine.

**Tầng 2 (derived dispatch — phong phú nhất):** `board-state-precedence-derivation` suy board-state mỗi story bằng precedence cố định: implemented→Done → changed→NeedsAttention → cycle→Blocked → run-active→InProgress → run-terminal (completed+synced→Done / completed+PR→Review / thiếu artifact→NeedsAttention) → blockers→Blocked → planned→Ready. Work classification: runnable yes/warn/no + reason. → 6 board-state + recovery routing, hơn `runnable` nhị phân của harness.

**Tầng 3 (client side):** `discovery-before-mutation-client` — MỌI thao tác chạm harness mở đầu bằng `preflight()`: discover contract (read-only, chấp nhận DB missing) → validate protocol version/schema range/database_state/capabilities/env; fail TRƯỚC mọi mutation. Exit-code branching đúng từng rule; unknown code 2..5 tolerated (additive). `agent-adapter-codex-jsonrpc`: dispatch agent qua adapter cắm được (custom spawn | codex full JSON-RPC với idle-reconciliation 30s — "agent im lặng ≠ chết" ở tầng transport). `bounded-auto-polling`: autonomy có caps + external-source boundary tường minh (declare "chưa support" thay vì im lặng).

*Why:* symphony chứng minh **platform-boundary là contract, không phải shared code** — capability là "behavioral promise, not product name". Xác nhận trục audience-based của bản 2-nguồn: bên consumer thật đọc data (exit code), không đọc prose.

### marketing-cockpit (fgOS) — ba cơ chế routing mới

fgOS là **flavor thứ ba** của domain: một framework core → N nền tảng qua adapter (`agent-agnostic-adapter-spec`: 4 required + 6 optional-with-fallback). Nó mang vào ba mô hình routing không nguồn nào khác có:

**(A) Intent-scoring nhiều-agent (`three-level-intent-routing`) — tầng 2 kiểu mới.** `routing.yaml` route 3 tầng: L1 intent (pattern-match cụm từ, score = token khớp, `specificity_first`, tie-break priority) → L2 skill→agent (tie-break `fewer_active_tasks` = load-balancing) → L3 dynamic (reserved) → fallback campaign-manager. Có test case ("plan social calendar Q3" → social-batch score 2 vs editorial 0).

*Khác biệt:* beehive route chain cố định, harness route nhị phân — fgOS là **dispatch nhiều-agent theo intent scoring cơ học + cân tải**, tất định và có test.

**(B) Signal pub-sub chaining (`signal-driven-chaining`) — tầng 3 kiểu mới.** Workflow nối nhau qua signal (catalog 14+, mỗi cái emitter/consumers/ttl/payload). Auto-dispatch: `auto_dispatch_to[]` + debounce 60s + max_retries 3; **loop detection** `dispatch_chain[]` max depth 5 (từ chối nếu workflow đã trong chain). Rule cứng: consumer pending→consumed trước khi đọc payload.

*Khác biệt:* beehive chain tuyến tính (mỗi node biết node kế); fgOS là **reactive fan-out qua pub-sub có loop-guard + ttl/starvation** — cho phép nhiều consumer, không phải chuỗi thẳng.

**(C) Failure→recovery routing (`failure-recovery-matrix`) — trục thứ tư, hoàn toàn mới.** 8 error type, mỗi cái detection + max_retries + escalate-to + recovery steps thứ tự (context_overflow→summarize; api_failure retry5 exp-backoff+circuit-breaker; deadline/infinite_loop/budget retry0 hard-stop). **Circuit breaker** per service (3 fail/5min→open, 30min cooldown). **Anti-loop**: max_skill_visits 2, max_chain_depth 8, quality-decay 20% relative drop→escalate. Default-fail: block+surface, never silently skip.

*Khác biệt:* beehive có rescue ladder (3 nấc) + harness/symphony có recovery-action từ run-state, nhưng chỉ fgOS **tường minh hóa lỗi→hành động thành ma trận** với circuit-breaker + anti-loop + quality-decay — mức phòng thủ runtime hiếm.

**Bonus — dispatch tách model (`executor-registry-cognitive-tier`):** task khai `cognitive_tier` (lightweight/standard/analytical/critical); `model-policy.yaml` map tier→model per-nền; `executor-registry.yaml` map executor→invocation (task/cli/mcp/api). Silent downgrade critical→...→lightweight khi cần.

*Why fgOS cần tất cả:* framework marketing đa-brand, đa-nền-tảng, chạy fleet nhiều agent song song reactive → cần intent-dispatch (nhiều agent), signal-chain (reactive), recovery-matrix (fleet không người trông), tier-decoupling (đổi model một chỗ cho N nền).

## So sánh & trade-offs

| Chiều | beehive | repository-harness | symphony | marketing-cockpit (fgOS) |
|---|---|---|---|---|
| Audience router | LLM agent đọc prose | process đọc data | process đọc data (consumer thật) | agent + adapter per-nền |
| Tầng 1 phòng thủ | agent tự lừa mình (precondition + ownership) | race đa-writer (CAS) | race + lock + migration fence | signal double-consume (rename-CAS) |
| Tầng 2 hình dạng | flag→lane, 6 lane, cascade mọi artifact; **@55cf3a4 + multi-lane song song (resolvePipeline per-lane); @05a131f + tiny/small luôn 1 execution worker serial (never 0, never wave)** | request-class nhị phân | board-precedence 6-state + recovery | **intent-scoring→agent + load-balance** |
| Tầng 3 hình dạng | chain tuyến tính (handoff prose); **@55cf3a4 + pull-dispatch `claim-next` (worker tự kéo trong biên duyệt) + cross-session claim/hold; @05a131f + `prepareDispatch()` là nơi-sinh-payload DUY NHẤT (claim-ownership refusal) + tier↔agent-type pin cụ thể** | request/response data contract | client preflight + exit-code branch | **pub-sub signal PUSH, loop-guard, fan-out** |
| Payload dispatch có thẩm quyền? | **@05a131f — ✓ prepareDispatch() single-source, self-audited, refuses non-owner** | — (không có khái niệm dispatch payload; CAS ở cấp record) | — | — |
| Failure→recovery | rescue ladder 3 nấc | exit-code phạm trù | recovery-action từ run-state | **ma trận 8-type + circuit-breaker + anti-loop** |
| Dispatch vs model | model-guard (tier gắn task) | — | codex idle-reconcile transport | **cognitive_tier tách khỏi tier→model map** |
| Multi-runtime | dual-runtime 2 belt | monolith | consumer 1 engine | **1 core → N nền, 4+6 capability** |

**Bốn điểm hội tụ độc lập (tín hiệu E3):**
1. **"kế tiếp = truy vấn dẫn xuất từ state"** — readyCells ↔ runnable ↔ board-precedence ↔ signal-consume: bốn nguồn độc lập, không phải danh sách tay.
2. **transition = API có precondition** — phase-machine ↔ story-CAS ↔ run-FSM ↔ signal-FSM.
3. **CAS xuất hiện 3 lần** — harness expected-status, symphony content_sha256, fgOS atomic-rename.
4. **autonomy phải bounded** — beehive gate-floor, symphony caps, fgOS anti-loop/circuit-breaker: cùng insight "vòng lặp tự động cần trần cứng". **@55cf3a4 beehive thêm một dạng bounded thứ hai: coordination cơ học** — reclaim đòi cả-TTL-lẫn-heartbeat (không cướp phiên còn sống), cross-session hold deny, quét claim-chết trước khi nói "hết việc"; đa-tác-nhân bị chặn bằng primitive, không bằng quy ước.

**Điểm KHÔNG hội tụ (giá trị cao, 1 nguồn):** intent-scoring dispatch, signal pub-sub chaining, failure-recovery-matrix, cognitive-tier decoupling — đều chỉ fgOS. Không phải vì 3 nguồn kia giải khác, mà vì họ **không cần** (không chạy fleet reactive đa-nền). Với forgent, câu hỏi là *forgent có tiến tới quy mô đó không*.

## Giải pháp tổng hợp cho host

Giữ nguyên lõi bản 2-nguồn, bổ sung 4-nguồn:

1. **Lõi (không đổi): chọn mô hình routing theo INTERFACE, không toàn cục.** Interface agent↔agent trong chain (default forgent) → prose-handoff + hook nudge (beehive). Interface chạm consumer-không-chắc-agent (`distill.mjs`, hook, CI) → exit-code-theo-category + decision-table + "mutation timeout = rediscover" (harness/symphony). Symphony giờ là **bằng chứng thực thi** rằng data-contract-cho-consumer chạy được qua ranh giới product thật — tự tin hơn khi áp.

2. **Tầng 1: single-writer beehive + CAS rẻ** (không đổi — xem `state` deep-dive). Bốn nguồn xác nhận "transition là API có precondition".

3. **MỚI — Failure→recovery routing (đáng port sớm).** forgent ĐÃ có khái niệm loop (session này có `/loop`, autonomous mode). fgOS `failure-recovery-matrix` chạm đúng: **anti-loop (max visits/depth) + circuit-breaker + quality-decay + default-fail-block** là trần cứng chống runaway. Rẻ hơn nhiều so với debug một loop cháy. Đây là candidate reliability bản 2-nguồn bỏ lỡ.

4. **MỚI — Cognitive-tier tách model.** Memory của forgent đã có "cost-tiered delegation" (haiku cho mechanical, frontier cho judgment). fgOS `executor-registry-cognitive-tier` là bản trưởng thành: task khai `cognitive_tier`, một map tier→model đổi model cả hệ. Nếu forgent có nhiều điểm delegation, tách policy khỏi task-site (như fgOS) sạch hơn hardcode model mỗi chỗ.

5. **HƯỚNG ĐÃ CHỐT (2026-07-13) — intent-scoring + signal-chaining; cập nhật 2026-07-15: tầng fan-out nay tách rõ SUBSTRATE vs DISPATCH.** forgent xác nhận tiến tới **nhiều agent song song / reactive fan-out**. Delta beehive @55cf3a4 cho thấy tầng này gồm HAI lớp phân biệt, hai nguồn cấp hai lớp khác nhau:
   - **Lớp coordination-substrate (beehive cấp, impl thật, dogfood):** cross-session atomic claims + lanes + hold deny (`same-checkout-multi-session-coordination`) — nhiều tác nhân tranh cùng checkout mà không giẫm chân, bằng primitive cơ học chứ không quy ước. Đây là NỀN mà mọi fan-out phải đứng lên; fgOS signal-layer GIẢ ĐỊNH có nền này nhưng không tự cấp.
   - **Lớp dispatch (hai chiều tham chiếu):** PUSH — fgOS intent-scoring gán agent (L1→L2, có test + load-balance); PULL — beehive `claim-next` worker tự kéo unit approved của lane mình. Chọn theo mô hình điều khiển forgent muốn (orchestrator-gán vs worker-tự-lấy); có thể trộn (orchestrator gán lane, worker pull trong lane).
   - **Lớp reactive (fgOS cấp):** signal pub-sub (loop-guard depth5 + ttl) cho workflow nối nhau không cần orchestrator.

   **Thứ tự dựng đề xuất:** substrate (beehive claims/lanes/holds) TRƯỚC — nó là nền + đi cặp anti-loop; rồi chọn dispatch PUSH/PULL; reactive signal-chain sau cùng. **Hệ quả cứng không đổi:** fan-out song song KÉO THEO `anti-loop-recovery-matrix` (điểm 3) thành **tiền-điều-kiện** — substrate + anti-loop là cặp mở-cổng, không được mở fan-out thiếu một trong hai.

   **Cập nhật 2026-07-21 (delta @05a131f) — beehive tự trả lời "substrate nào trước" bằng doctrine, không chỉ để mở:** `independent-feature-worktrees` giờ có luật D9 **lane-first** — feature mới trong một checkout đang bận mặc định đi qua LANE (khóa-trong-cây, rẻ, không cần bootstrap `.bee/` riêng); chỉ leo lên grant worktree (cô-lập-cây) tại Gate 3 và CHỈ KHI thực sự chồng file với việc đang chạy. Cùng lúc, worktree-substrate đã thành đường lát sẵn một-lệnh (`beehive worktree new --feature <slug>`) nên chi phí "leo lên" khi cần là thấp. **Áp cho forgent:** không cần chọn một substrate cố định trước khi biết mức song song thật — mặc định lane (rẻ), định nghĩa TRƯỚC một ngưỡng khách quan để leo lên cô-lập-cây (vd "≥N feature đồng thời chạm chung thư mục lõi"), giữ leo-lên là quyết định RẺ (một lệnh, typed pre-check, zero-mutation cho tới bước ghi thật) chứ không phải một lần dựng hạ tầng.

**Thứ tự:** (1)(2) đã khuyến nghị → (3) recovery-matrix khi dựng autonomous loop → (4) cognitive-tier khi delegation nhiều điểm → (5) khi lên multi-agent: coordination-substrate (beehive claims/lanes/holds) + anti-loop TRƯỚC, rồi dispatch PUSH/PULL, reactive-signal sau cùng.

## Portable ideas

| Idea | Nguồn | R E F | Ghi chú |
|---|---|---|---|
| routing-model-per-interface | beehive:hive-first-skill-router + repository-harness:protocol-next-action-table | R3 E2 F1 | (đã có) lõi không đổi; symphony nay là consumer thực chứng → nâng evidence thực tế |
| anti-loop-recovery-matrix | marketing-cockpit:failure-recovery-matrix | R3 E2 F2 | **MỚI** — anti-loop (max visits/depth) + circuit-breaker + quality-decay + default-fail-block; chạm đúng `/loop`/autonomous của forgent; trần cứng chống runaway. E2: sinh từ ràng buộc fleet-không-người-trông |
| cognitive-tier-model-decoupling | marketing-cockpit:executor-registry-cognitive-tier | R2 E2 F2 | **MỚI** — task khai cognitive_tier, một map tier→model đổi cả hệ; bản trưởng thành của cost-tiered-delegation forgent đã dùng; sạch hơn hardcode model per-site |
| intent-scoring-agent-dispatch | marketing-cockpit:three-level-intent-routing | R2 E1 F2 | **MỚI, CÓ ĐIỀU KIỆN** — dispatch nhiều-agent theo token-scoring + fewer-active-tasks; chỉ khi forgent lên multi-agent; có test case. E1: một nguồn, chưa outcome |
| signal-driven-chaining | marketing-cockpit:signal-driven-chaining | R2 E1 F3 | **MỚI, CÓ ĐIỀU KIỆN** — pub-sub reactive chaining + loop-guard depth5 + ttl; chỉ khi cần fan-out/reactive; F3 subsystem, YAGNI hôm nay |
| next-work-derived-from-state | beehive:cell-status-lifecycle + repository-harness:runnable-derived-dispatch | R2 E3 F2 | (đã có) nay hội tụ 4-nguồn (thêm symphony board-precedence) → evidence mạnh hơn |
| same-checkout-multi-session-coordination | beehive:cross-session-atomic-claims + beehive:lane-scoped-pipelines | R3 E2 F3 | **MỚI @55cf3a4** (đã log porting-log) — lớp coordination-substrate của fan-out (claims O_EXCL+TTL/heartbeat + lanes + hold deny) + mô hình PULL (claim-next). Nền phải-có-trước dispatch/reactive; đi cặp anti-loop. E2: beehive dogfood (xưởng này chạy nó) |
| chain-integrity-tail-guard | beehive:chain-integrity-guard-tail | R2 E2 F2 | **MỚI @55cf3a4** (đã log porting-log) — tầng-1 dạng mạnh: close chỉ SINH bởi producer thật, không set-value; sinh từ post-mortem giả-7-close. Nối AGENTS.md critical-rule 12 |
| dispatch-single-source-payload-builder | beehive:dispatch-prepare-payload-builder | R2 E2 F2 | **MỚI @05a131f** — một hàm DUY NHẤT sinh payload cho mọi dispatch, tự audit, từ chối typed khi cell chưa claimed bởi đúng caller. Đúng chỗ forgent cần nếu multi-agent fan-out lên thật: payload dispatch = thẩm quyền hành động, không phát cho người chưa cầm claim. E2: sinh từ hardening thật (hardening-7) |
| tier-pinned-agent-identity | beehive:pinned-tier-agent-types | R2 E2 F1 | **MỚI @05a131f** — mỗi tier có model cần MỘT agent-type mang danh tính riêng (không dùng type chung); vá lỗ "khai tier trong prompt mà agent-type không tự mang model = âm thầm rơi về model mặc định". F1: chủ yếu là 3 template + một check deny |
| worktree-lane-first-doctrine | beehive:independent-feature-worktrees | R2 E2 F2 | **MỚI @05a131f (D9)** — mặc định substrate rẻ (lane), chỉ leo cô-lập-cây khi Gate 3 VÀ thực sự chồng file; leo-lên là một lệnh rẻ (typed, zero-mutation cho tới bước ghi). Trả lời trực tiếp câu "chọn substrate nào trước" mà dive này từng để mở ở §5 |

## Open questions

- ~~forgent có tiến tới multi-agent song song / reactive fan-out?~~ **Đã trả lời 2026-07-13: CÓ** → điểm (5) không còn là YAGNI. `intent-scoring-agent-dispatch` (route 1 request → nhiều agent) và `signal-driven-chaining` (reactive fan-out + loop-guard) chuyển từ "CÓ ĐIỀU KIỆN maybe" sang **hướng đã chốt** — port khi tầng multi-agent thực sự được dựng, không phải ngay hôm nay (vẫn còn chain tuyến tính). Điểm cần lưu ngay: khi lên fan-out song song, `anti-loop-recovery-matrix` (điểm 3) thành **bắt buộc, không còn tùy chọn** — fan-out không loop-guard là công thức runaway.
- ~~forgent có multi-skill chain thật?~~ **Đã trả lời 2026-07-13: chắc chắn multi-skill** → prose-handoff (beehive) là tầng-3 mặc định.
- Nếu port `anti-loop-recovery-matrix`: các ngưỡng fgOS (max_skill_visits 2, max_chain_depth 8, quality-decay 20%, circuit 3fail/5min) là giá trị domain marketing — forgent cần tự hiệu chỉnh theo đặc tính loop của mình.
- CAS store: ~~câu hỏi JSON+tự-CAS vs embedded graph DB vẫn treo~~ — cập nhật 2026-07-13: CozoDB xác nhận dormant (release cuối 12/2023); user CHỐT luật changeset-JSONL-as-truth cho mọi db tương lai (db = view, đổi engine bằng replay); engine cụ thể defer tới ngưỡng friction. Chi tiết: `state` deep-dive §open-questions.
