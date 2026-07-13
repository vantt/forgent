# Consult: compound-learning stack (state/FSM → routing → compound-learning)

**Bottom Line:** Chuỗi phụ thuộc bạn nêu (compound ← routing ← state/FSM) khớp chính xác với những gì 4 nguồn dạy — và tin tốt nhất: **tầng compound đã tồn tại một nửa trong chính distill** (cursor = không bao giờ học lại từ đầu, porting-log = decision log, `outcome` = mầm predicted→actual). Chất liệu định hình mạnh nhất: (1) **log-vs-state hai-physics** của bee làm luật nền TRƯỚC mọi store; (2) bộ ba hội tụ độc lập E3 — *transition-là-API-có-precondition*, *next-work-là-derived-query*, *explicit-accept-per-item* — là xương sống của cả 3 tầng; (3) trục phân kỳ quan trọng nhất phải quyết: **human-gated (bee/harness) vs auto-memory (fgOS)** — khuyến nghị human-gated cho harness/distill tier, để ngỏ fgOS typed-memory cho runtime-agent tier về sau. Lỗ lưới cần biết trước khi code: **beads chưa scan** — nó nằm ĐÚNG làn state+routing (bd ready topo-sort, JSONL-truth, memory-decay compaction); nên scan trước Phase 1.

## Chất liệu theo domain

### self-improvement (lõi tầng 3 — compound)
- `beegog:friction-backlog-outcome-loop` — friction ghi lúc gặp + 5-layer failure attribution; predicted impact lúc tạo, actual outcome lúc đóng; "prediction wrong is signal, not embarrassment".
- `beegog:evolving-loop-two-gates` — digest tự sinh khi close (zero-effort) → rank pain×frequency×corroboration → Gate A người chọn → fix qua Iron Law → Gate B người duyệt diff → push không bao giờ tự động.
- `beegog:entropy-score-trend` — debt là số đo có trọng số + BẮT BUỘC kèm trend so lần trước.
- `beegog:grooming-project-first` — chứng minh non-use trước khi kill; outcome sau kill.
- `repository-harness:growth-rule-friction` — "the harness grows from friction"; sửa ngay hoặc backlog add với predicted impact.
- `repository-harness:audit-propose-pipeline` — self-improvement là pipeline cơ học audit được (validate → check → improve), `propose` read-only, cấm bulk-commit.
- `repository-harness:proposal-lifecycle-explicit` — accept/reject TỪNG proposal key; outcome confirmed/ineffective/reverted theo lịch; evidence mới sau implement = regression, sau reject = reconsideration.
- `marketing-cockpit:procedural-memory-reinforcement` — pattern học có confidence ±bằng chứng (+0.1/−0.2), tầng agent tự động (đối trọng của trường phái human-gated).

### routing (tầng 2 — đã có deep-dive 4-nguồn redived hôm nay)
- Hội tụ E3: `beegog:cell-status-lifecycle` (readyCells) ↔ `repository-harness:runnable-derived-dispatch` (runnable predicate) ↔ `symphony:board-state-precedence-derivation` (6 board-state + recovery) — **next-work = derived query từ deps+status, không bao giờ là danh sách tay**.
- `beegog:hive-first-skill-router` + `beegog:mode-tables-trigger-dispatch` — prose-handoff + trigger-table cho chain agent↔agent (forgent multi-skill đã chốt → đây là mặc định thật).
- `repository-harness:request-class-loop-dispatch` — read-only vs change quyết ở cửa; câu hỏi không sinh nghi thức.
- `marketing-cockpit:failure-recovery-matrix` — 8 error type × (detection, max_retries, escalate-to, recovery steps); circuit breaker; anti-loop (max_skill_visits 2, chain_depth 8, quality-decay 20%).
- `marketing-cockpit:executor-registry-cognitive-tier` — cognitive_tier của task TÁCH khỏi map tier→model; bản trưởng thành của cost-tiered delegation forgent đang dùng.
- `marketing-cockpit:signal-driven-chaining` — pub-sub signal + loop-guard; hướng reactive fan-out đã chốt, port khi dựng tầng đó (F3).

### context-memory (tầng 1 — state substrate; đã có deep-dive `state` hôm nay)
- `beegog:state-vs-log-two-physics` — **luật nền**: mỗi mẩu dữ liệu là Log (append, per-feature, "how we got here") hoặc State (overwrite, per-area, "where we are"). forgent đã theo ngầm (distillery=state, reports=log) — chỉ cần phát biểu thành luật.
- `beegog:event-sourced-decisions` — decisions append-only qua CLI verb, D-ID cited.
- `beegog:settlement-capture-unprompted` — bắt "settlement" MỖI TURN không chờ user; capture-queue + flush points.
- `repository-harness:changeset-event-sourcing` — db là view, JSONL committed là truth, rebuild được (đường nâng cấp store).
- `symphony:run-artifact-durability-split` — "chạy xong ≠ merged ≠ bền" thành 5 mức tường minh.
- `marketing-cockpit:four-memory-types` — working/episodic/semantic/procedural + consolidation + forgetting (CÓ ĐIỀU KIỆN cho forgent).
- `beegog:handoff-at-65-percent` — pause/resume là nghi thức, never auto-resume.

### routing§tầng-1 / state-shape (FSM)
- `beegog:phase-machine-cli-owned` — transition là API có precondition, CLI-owned, reset gates atomic, deny hand-edit.
- `repository-harness:story-status-single-door` — terminal state chỉ một cửa vào + CAS expected-status trong transaction.
- `symphony:run-and-queue-state-machine` — 2 FSM song song + single-active-run lock + fence RAII.
- `marketing-cockpit:task-signal-state-machines` — FSM declarative + rename-CAS claim, `state:` field là truth.
- Hội tụ CAS ×3 (harness expected-status / symphony content-sha / fgOS rename-lock) — cài bảo hiểm CAS từ ngày đầu gần như miễn phí.

### quality-gates (chất lượng của vòng học)
- `beegog:evidence-before-claims` + `repository-harness:story-complete-atomic` / `beegog:cell-task-unit` (verify-enforced-close, E3) — "học được" phải có bằng chứng như "làm xong".
- `marketing-cockpit:rigor-scaled-evaluation` — default-FAIL reviewer + 3-tier eval theo cost.
- `beegog:baseline-gate` — never build on red (áp cho chính learning area: check phải xanh trước khi scan tiếp).

### hooks (điểm bắt capture)
- `beegog:chain-nudge-subagent-stop` — harness đẩy chain, không dựa trí nhớ; `beegog:injection-dedup` — chống context bloat khi nhắc.
- `marketing-cockpit:multiplatform-lifecycle-hooks` — telemetry capture (spawn/usage/error) nối vào circuit-breaker; fail-soft exit 0 (`beegog:fail-open-crash-wrappers` cùng họ).

### workflow / harness / skills / orchestration (khung đỡ)
- `beegog:staged-chain-with-gates`, `repository-harness:task-loop-nine-steps` (bước 6 harness-delta biến MỌI task thành cơ hội học — đây chính là compound ở mức task-loop).
- `repository-harness:request-authority-model`, `repository-harness:maturity-ladder-h0-h5` (thang đo tiến hóa — F0–F5 cho forgent), `repository-harness:repo-as-os-six-questions` (acceptance test).
- `beegog:tdd-for-skills-iron-law` + `beegog:pressure-test-scenarios` — mọi skill của vòng học phải qua RED trước (đang là debt của chính distill).
- `beegog:model-tiers-cost-discipline` / orchestrator-assigns-workers — cost-tiering cho việc học cơ học.

### testing-evals (biết vòng học có chạy không)
- `repository-harness:external-benchmark-repo` — phase chỉ đạt khi benchmark ngoài xác nhận, delta kỳ vọng khai báo trước.
- `marketing-cockpit:crossfamily-llm-judge` — model không tự chấm mình.

### repo-layout / safety / tooling / docs-style (nền vật lý)
- `beegog:policy-vs-ops-split` + `marketing-cockpit:four-zone-storage-separation` — learning state sống ở đâu, commit gì ignore gì.
- `beegog:allowlist-not-redaction` + `consumer-revalidates-boundary` — nếu digest học được đi cross-repo: field đóng, không free-text (bài học falsified-by-data).
- `beegog:zero-dep-vendored-helpers` + `unified-dispatcher-command-registry` — CLI surface cho state layer.
- `marketing-cockpit:agent-facing-docs-contract` — nơi learnings được ghi phải có contract cho agent đọc/sửa.

## Trade-offs đáng cân nhắc (từ matrix)

| Trục | Lựa chọn | Khuyến nghị cho forgent |
|---|---|---|
| Ai đóng vòng học | human-gated (bee 2-gate / harness per-key) vs auto (fgOS consolidation) | Human-gated cho harness/distill tier; fgOS memory chỉ khi có runtime agent xuyên phiên |
| Store | JSON zero-dep (bee) vs SQLite+changeset (harness) vs YAML (fgOS) | JSON trước; giữ đường "db-là-view, log-là-truth" khi cần query |
| Đo outcome | harness mạnh nhất (confirmed/ineffective/reverted + regression/reconsideration) | Lấy dạng markdown-nhẹ, bỏ SHA-256/SQLite |
| Capture khi nào | mỗi-turn (bee) vs lúc-friction (harness) vs cuối-task (fgOS) | Mỗi-turn settlement + friction-log — hai kênh bổ nhau |
| state-transition | precondition-gate (bee, chống agent tự lừa) vs CAS (harness, chống race) | Cả hai: precondition mặc định + CAS bảo hiểm |

## Candidate liên quan (porting-log, đã score)

Trực tiếp cho stack này: `porting-outcome-lifecycle` (R2 E3 F1) · `next-work-derived-from-state` (R2 E3 F2) · `verify-enforced-close` (R3 E3 F3) · `cas-expected-status-transitions` (R2 E2 F1) · `state-vs-log-two-physics` (R3 E2 F2) · `distillery-entropy-trend` (R2 E2 F1) · `seal-digest-zero-effort` (R1 E2 F1) · `routing-model-per-interface` (R3 E2 F1) · `cognitive-tier-model-decoupling` (R2 E2 F2) · `request-authority-model` (R3 E2 F1) · `maturity-ladder` (R3 E2 F1) · `six-questions-acceptance` (R3 E1 F1) · `tdd-for-skills-iron-law` (R2 E2 F2) · `default-fail-review-protocol` (R2 E2 F1). Có điều kiện/khi mở rộng: `typed-memory-consolidation`, `signal-driven-chaining`, `intent-scoring-agent-dispatch`, `crossfamily-llm-judge`, `changeset-event-sourcing`, `durability-tier-ladder`.

## Hướng thiết kế + trình tự triển khai (đề xuất — human quyết)

Nguyên tắc ghép: chuỗi phụ thuộc của bạn đúng, nhưng mỗi phase có "phần luật" (gần free, làm ngay) và "phần máy" (code, làm theo nhu cầu). Luật đi trước máy ở mọi tầng.

**Phase 0 — Luật nền (F1, ~free, làm ngay):**
1. Khóa `log-vs-state-two-physics` thành luật thiết kế trong docs forgent (mỗi artifact khai là Log hay State).
2. Khóa `routing-model-per-interface` (prose-handoff cho agent↔agent, data/exit-code cho consumer lạ).
3. Ghi `six-questions-acceptance` làm definition-of-done cho harness + `maturity-ladder` F0–F5 làm roadmap trục.
4. Scan **beads** trước khi code Phase 1 (nó nằm đúng làn state+routing; tránh thiết kế xong mới phát hiện hội tụ/khác biệt).

**Phase 1 — State/FSM substrate:**
- Store JSON/JSONL zero-dep (bee), policy-vs-ops split; state file CLI-owned.
- FSM: enum + **transition là API có precondition** (bee `startFeature` pattern); terminal state một-cửa (harness single-door); **CAS expected-status** cài sẵn làm bảo hiểm (hội tụ ×3).
- Event-sourced decisions (append-only, verb-based) song song với state overwrite.
- Ghi chú đường nâng cấp: khi cần query → SQLite as view + changeset JSONL as truth (KHÔNG SQLite-as-truth).

**Phase 2 — Routing trên state:**
- Next-work = **derived query** từ deps+status (readyCells/runnable pattern) — không danh sách tay; consumer không tự suy lại rule.
- Chain multi-skill: router entry-table + handoff sentence + hook nudge (bee) — mặc định đã chốt.
- Request-class ở cửa (read-only không sinh nghi thức).
- **Failure→recovery matrix + anti-loop** (fgOS): 8 error type, circuit breaker, max_skill_visits/chain_depth, quality-decay — cái bản 2-nguồn không có, chạm đúng /loop + cost-tiering forgent đang dùng.
- `cognitive-tier-model-decoupling`: task khai tier, một map tier→model.
- Để sau (đã chốt hướng, chưa dựng): signal-driven chaining (reactive), intent-scoring (multi-agent).

**Phase 3 — Compound-learning trên routing:**
- **Vòng predicted→actual** (`porting-outcome-lifecycle`): score lúc tạo = prediction; outcome confirmed/ineffective/adjusted lúc đóng; `check` nhắc row thiếu Outcome; reconsideration khi evidence mới cho row rejected.
- **Capture 2 kênh**: settlement mỗi-turn (queue + flush points) + friction-log với 5-layer attribution.
- **Health đo được**: entropy-score + trend cho chính learning area; seal-digest zero-effort ("compounded: +N/±M/+K").
- **Self-modification human-gated**: evolving-loop 2 gate, explicit-accept-per-item (hội tụ E3 bee+harness), Iron Law cho mọi skill sửa chính hệ, push never automatic.
- **Quality của vòng học**: default-FAIL review; benchmark ngoài với expected delta khai trước phase; cross-family judge khi cần chấm output.
- KHÔNG lấy: fgOS auto-consolidation/forgetting cho tier này (rủi ro tự-quên sai không gate; bài toán forgent-distill không có).

**Điểm quyết định human — ĐÃ CHỐT (2026-07-13, sau khi trình consult):** (a) memory: kiến trúc **2 tầng đồng thời** — 2-physics cho lower layer (cơ học/raw/chính xác), 4 mem-type cho higher layer (process/framework/skill), không phủ định nhau; (b) trend-history + reconsideration: **policy-side** (git-tracked; reconsideration vào Ghi chú porting-log); (c) store: **luật changeset-JSONL-as-truth chốt** cho mọi db tương lai (db = view, rebuild từ zero) — engine defer tới ngưỡng friction, và nhờ luật này chọn engine đảo-ngược-được. Chi tiết + evidence CozoDB-dormant: deep-dives `state`/`compound-engineering` §open-questions.

## Coverage ledger

| Domain | Trạng thái |
|---|---|
| harness | consulted (6: request-authority, task-loop, maturity-ladder, six-questions, baseline-gate, executor-registry) |
| skills | consulted (3: tdd-iron-law, skill-tier-schema, trigger-only) |
| hooks | consulted (5: chain-nudge, injection-dedup, fail-open, multiplatform-hooks, write-guard) |
| workflow | consulted (4: staged-chain, feature-intake, declarative-schema, async-gate) |
| orchestration | consulted (4: model-tiers, orchestrator-assigns, advisor, funnel-roster) |
| routing | consulted (12 — toàn bộ, qua deep-dive redived) |
| integration-contract | consulted (3: adapter-spec, protocol-v1, boundary — chạm nhẹ qua routing-model-per-interface) |
| context-memory | consulted (9 — toàn bộ hai physics → 4-type spectrum) |
| planning | **ruled out** — cấu trúc plan/phase artifact không định hình vòng học; phase-documents-benchmark-deltas đã bắt qua testing-evals |
| quality-gates | consulted (6: verify-enforced-close, default-FAIL, story-complete, baseline, review-severity, recovery-matrix) |
| docs-style | consulted (3: agent-facing-docs-contract, adoption-audits/numbered-docs, glossary) |
| tooling | consulted (3: zero-dep-helpers, command-registry, modular-doctor) |
| config-packaging | **ruled out** — install/release không thuộc vòng học; drift-detection đã bắt qua tooling nếu cần |
| repo-layout | consulted (3: policy-vs-ops, four-zone, docs-history-per-feature) |
| safety | consulted (2: allowlist-not-redaction + consumer-revalidates — áp khi digest học được đi cross-repo) |
| self-improvement | consulted (8 — toàn bộ, domain lõi) |
| ux | **ruled out** — silent-bookkeeping chỉ là ràng buộc trình bày lên vòng học (máy móc học không narrate vào chat); không entry nào định hình cơ chế |
| testing-evals | consulted (4: pressure-tests, external-benchmark, crossfamily-judge, contract-tests) |

## Ngoài lưới

- **beads — chưa scan, LIÊN QUAN CAO**: task-graph + `bd ready` topo-sort (đúng làn derived-next-work), JSONL-truth+SQLite-cache (đúng làn store), **memory-decay compaction** (đúng làn compound/forgetting). Khuyến nghị mạnh: scan trước Phase 1.
- **learn-harness-engineering — chưa scan**: course 12 bài về harness engineering, có bản audit đối chiếu từ bee; liên quan mức khung khái niệm.
- Deep-dives đều fresh hôm nay (routing redived 4-nguồn, state + compound-engineering mới) — không stale.
- fgOS các domain planning/safety/ux seal dạng gộp/thin — nếu Phase 3 cần chi tiết compliance/guardrail của fgOS thì backfill sâu thêm.
- Symphony/harness/bee/fgOS đều là repo sống — delta scan trước mỗi phase lớn để bắt tiến hóa (đặc biệt harness Phase 5 self-improvement đang chạy dở).

## Unresolved questions

1. Runtime agent xuyên phiên: có/không → quyết typed-memory-consolidation (R3 E2 F3, đang CÓ ĐIỀU KIỆN).
2. Trend-history + reconsideration lưu policy-side (git) hay machine-side (ignored)?
3. Store: JSON+CAS đủ bao lâu; ngưỡng nào nâng graph-native/SQLite-view?
