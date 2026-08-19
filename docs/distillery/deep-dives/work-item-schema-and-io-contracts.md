---
topic: work-item-schema-and-io-contracts
date: 2026-07-15
based_on: [beads@777d24b87, beads-rust@ab0288cb, beads-viewer-rust@7f96da4, repository-harness@0a79bbe, symphony@2f0b257, beehive@05a131f]
entries: [beads:ready-work-ten-dep-types, beads:hash-id-adaptive-length, beads:metadata-set-always-string, beads:discovered-from-lineage, beads:dolt-as-versioned-truth, beads:agent-first-cli-contract, beads:gate-beads-event-driven, beads-rust:agent-first-cli-contract-hardened, beads-rust:toon-token-output, beads-rust:sqlite-jsonl-classic-truth, beads-rust:no-id-pinning-lint, beads-rust:workspace-health-contract, beads-rust:agent-baseline-golden-snapshots, beads-viewer-rust:robot-mode-envelope, beads-viewer-rust:schema-validated-output-contract, beads-viewer-rust:toon-token-efficient-format, beads-viewer-rust:commit-bead-correlation-with-feedback, repository-harness:story-packets, repository-harness:epic-story-hierarchy, repository-harness:story-status-single-door, repository-harness:story-complete-atomic, repository-harness:story-verify-command, repository-harness:orchestration-protocol-v1, repository-harness:protocol-next-action-table, repository-harness:changeset-event-sourcing, beehive:cell-task-unit, beehive:cell-status-lifecycle, beehive:event-sourced-decisions, beehive:semantic-judge-verdict-loop, beehive:cell-lifetime-budgets-anti-loop, symphony:typed-runtime-boundary, symphony:isolated-run-contract, symphony:changeset-content-sha-immutability]
---

# Deep-dive: cấu trúc dữ liệu work-item & hợp đồng I/O (schema, envelope, contract)

> stale vs repository-harness@0a79bbe (9cc306d→0a79bbe, 2026-08-07) — cùng shift default-vs-compatibility như `work-item-management.md`: entry hn được cite (`story-packets`, `epic-story-hierarchy`, `story-status-single-door`, `story-complete-atomic`, `story-verify-command`, `changeset-event-sourcing`) là schema của story/CLI SQLite, giờ compatibility-only (Phase 4, decision 0022) chứ không phải schema mặc định của fresh install. `orchestration-protocol-v1`/`protocol-next-action-table` (contract cho external orchestrator) KHÔNG đổi, vẫn giữ nguyên như cite. Không đổi taxonomy field/envelope đã kết luận — chỉ đổi TRỌNG SỐ "đây có phải trải nghiệm mặc định của hn không" nếu re-dive.

> **Re-dive delta beehive 94b4a31→05a131f (2026-07-21):** đúng trọng tâm dive này — record `beehive cell` (đã cite `cell-task-unit`) MỌC THÊM một tầng lịch sử trong chính `trace`, kết luận §1/§4 (kernel ~8 field hội tụ, "proof" là field đắt) KHÔNG đổi nhưng §2.5 cần một khoản mục mới. (1) `beehive:cell-task-unit` (đã cite) — `trace` nay có 4 sub-field APPEND-ONLY mới: `trace.attempts` (mỗi lần verify/block một dòng: n, verdict, failure_signature, claim_session, acquired_at), `trace.semantic_judge` (verdict theo schema đóng — xem điểm 2), `trace.budget_resets`, `trace.judge_overrides`. Bẫy được chính beehive.md ghi rõ: `trace.deviations` bị `capCell` GHI ĐÈ mỗi lần cap — không phải chỗ để lịch sử; chỉ 4 key append-only mới là sổ thật. Trace scale theo lane (tiny: 1 dòng kết quả → high-risk: + verification_evidence bắt buộc khi `behavior_change:true`, MỌI lane). (2) `beehive:semantic-judge-verdict-loop` (entry MỚI) — một dạng "evidence" THỨ TƯ bên cạnh beehive/hn/symphony đã cite ở §2.5: verdict LLM theo schema đóng `judge-verdict/1` (`PASS`/`NEEDS_REVISION`, mỗi `checks[]` BẮT BUỘC có `evidence`, `failure_signature` bắt buộc khi FAIL) — validator cross-check chặt (PASS mà có FAIL bị loại, ngược lại cũng loại; văn xuôi tự do TỰ NÓ là lỗi validate). Răng thật: `capCell` từ chối cap khi verdict mới nhất `NEEDS_REVISION`, và verdict đó tự MỞ LẠI cell `capped→open` (không phải `claimed`) + xoá `trace.verify_passed` cũ — vá đúng lỗ "cap lại mà không chạy verify mới" mà bản hardening trước để hở. (3) `beehive:cell-lifetime-budgets-anti-loop` (entry MỚI) — ba ngân sách độc lập (`max_claims`, `max_failed_attempts`, `max_same_signature`) kiểm tại CỬA CLAIM, nền là `trace.attempts` + `normalizeFailureSignature` (chuẩn hoá lỗi trước khi hash 12 ký tự — không bao giờ để lọt path tuyệt đối). Đây là field ANTI-LOOP mà không nguồn nào trong 6-record gốc có tường minh — gần nhất là `lease_expires_at`/`heartbeat_at` (crash-survival) nhưng budget là bài toán KHÁC: chống retry-cùng-lỗi, không chống crash.

> **Re-dive delta beehive 55cf3a4→94b4a31 (2026-07-18, chạm HẸP):** Delegation-contract cli gather branch (nằm trong addendum 94b4a31 của `beehive:model-tiers-cost-discipline`) thêm một kiểu ENVELOPE chưa có ở §3: output phân-định-bằng-marker, fail-closed (`<<<BEE_DIGEST…BEE_DIGEST>>>`; thiếu/rỗng ⇒ fail) + một từ chối ĐỊNH-KIỂU (`cli_tier_gather_only`) gating dispatch-kind (gather vs cell) mà một contract được nhắm — đáng một dòng cạnh bd/br/bvr/hn/symphony trong bảng envelope §3. Kèm: `config validate` từ chối cấu hình cli-tier thiếu `kind:'cli'`/command/prompt-transport hoặc mang cờ auto-approve/sandbox-bypass — chứng cứ bee-side độc lập cho §4 "đọc khoan dung / ghi nghiêm (additive + lazy)" ở tầng config-contract. Kết luận taxonomy field/envelope KHÔNG đổi.

Sáu record thật, quote verbatim tại HEAD (báo cáo nguồn: `plans/reports/distill-schemas-beads-family-260715-report.md`, `plans/reports/distill-schemas-harness-family-260715-report.md`): **bd** Issue (Go, `internal/types/types.go:16-119`), **br** Issue (Rust, `src/model/mod.rs:458-628`), **bvr** Issue (Rust, `src/model.rs:18-68`), **hn** story (SQL, `scripts/schema/001-init.sql:44-61`), **beehive** cell (JSON, `templates/lib/cells.mjs:34-147`), **symphony** RUN_CONTRACT/RESULT (Rust, `run.rs:68-117`). Dive chị em: `work-item-management.md` nhìn *vòng đời/pipeline*; dive này nhìn *tấm da của record và biên I/O* — từng field đắt tiền giải bài toán gì.

**Bottom Line:** Mọi nguồn hội tụ về một **kernel ~8 field** (id, title, status, priority, deps, created/updated, assignee) — phần đó không có gì để học. Giá trị nằm ở **các field "đắt" giải một failure-mode có tên**: `content_hash` + hash-ID thích ứng (identity dưới song song), `lease_expires_at`+`heartbeat_at` (ownership sống sót crash), `dep.type` (một bảng edge chở cả điều phối LẪN tri thức — bd đã đi tới 19 loại), `verify`+evidence-trace (chống fake-done — beehive/hn/symphony ba cách cài cùng một luật), `defer_until` (thời gian là điều kiện ready), `agent_context` kế thừa (br — chống context-compaction), và `data_hash`/`content_sha256` (đổi-hay-chưa và apply-một-lần ở biên I/O). Về envelope: bd thô nhất (raw JSON, không wrapper — bằng chứng rằng *thiếu* envelope cũng là một lựa chọn có hậu quả), bvr chuẩn hóa envelope 4-field, br đi xa nhất (exit-code taxonomy 9 mã + stdout/stderr split + hợp đồng tự-mô-tả 3 tầng versioned), hn/symphony chứng minh cả hai đầu producer/consumer qua protocol v1. **Khuyến nghị cho fgOS**: record gầy + edge có type (bd) × close-verb-có-proof (beehive/hn) × envelope versioned + data_hash + exit-code taxonomy (bvr/br) × evolution-luật "additive + lazy + tolerate-unknown-fields, hard-fail-unknown-version" (hn + bài học phase-3 của chính ta).

## Câu hỏi

Thiết kế record work-item và biên I/O cho fgOS: (1) record cần field nào — và field nào là *bẫy nếu thiếu*; (2) mỗi field đắt tiền giải bài toán gì, tại sao các nguồn giải khác nhau; (3) hợp đồng input (dispatch) và output (envelope) cho agent trông ra sao; (4) schema tiến hóa thế nào mà không vỡ consumer.

---

## §1 — Giải phẫu: sáu record, ba triết lý kích thước

Nhìn cả sáu record cạnh nhau, kích thước KHÔNG phân bố ngẫu nhiên — nó đi theo vai:

| Record | Cỡ | Vai | Triết lý |
|---|---|---|---|
| bd Issue (Go) | ~45 field, 12 nhóm | node vạn năng của đồ thị | **"mọi thứ là bead"** — work, message, event, gate, template, molecule đều nằm CÙNG struct; field nhóm theo concern (leasing, gate, messaging, event, bonding…), đa số `omitempty` |
| br Issue (Rust) | ~40 field | bản port classic + phần cứng hóa | như bd nhưng thêm tombstone 4-field, `source_repo_path`, `agent_context`; `Custom(String)` cho Status/DepType mở |
| bvr Issue | ~20 field | **projection chỉ-đọc** cho phân tích | mọi field `#[serde(default)]` — đọc *khoan dung tối đa* (JSONL bẩn vẫn load); `workspace_prefix`/`content_hash` là `skip` — derived, không bao giờ phát ra |
| hn story (SQL) | 12 cột | packet-có-hợp-đồng | gầy có chủ đích, 4 cột là **proof matrix** (unit/integration/e2e/platform), CHECK constraint khóa status/lane ngay tầng SQL |
| beehive cell (JSON) | ~12 field + trace | **prompt đủ để dispatch** | nửa record là hợp-đồng-trước (`action`, `must_haves.truths/prohibitions`, `read_first`), nửa là bằng-chứng-sau (`trace.verify_output/verify_passed/files_changed`) |
| symphony RUN_CONTRACT | 13 field | hợp đồng MỘT lần chạy | không phải work-item — là *bao thư giao việc*: `required_outputs`, `result_json_schema`, `forbidden_paths`, `agent_instructions` |

Ba triết lý: (a) **record béo, đồ thị đồng nhất** (bd/br — ngữ nghĩa dồn vào edge + issue-type, một công cụ query mọi thứ); (b) **record gầy, hợp đồng trong packet** (hn/beehive — ngữ nghĩa dồn vào must_haves/acceptance/proof, ép chất lượng từng việc); (c) **record khoan-dung, chỉ-đọc** (bvr — consumer không bao giờ tin producer viết sạch). Symphony đứng ngoài: nó tách "work-item bền" khỏi "hợp đồng một lần chạy" thành hai vật thể — một tách mà bd (molecule) và beehive (cell = cả hai vai) đều KHÔNG làm.

---

## §2 — Các field high-impact: bài toán → cách giải → vì sao

### 2.1 `id` + `content_hash` — identity dưới sáng-tạo-song-song

**Bài toán:** nhiều agent tạo việc đồng thời, không điều phối trung tâm → trùng ID; và "cùng một việc bị tạo hai lần" (dedup) là chuyện khác với "hai ID va nhau".

- **bd** tách ĐÔI: `ID` = SHA256→base36 cắt 3-8 ký tự **thích ứng** (vượt 25% xác suất va chạm thì tự dài ra, toán ở `engdocs/COLLISION_MATH.md`) — giải va chạm; `ContentHash string \`json:"-"\`` — SHA256 của canonical content, internal-only — giải dedup/sync. Hai bài toán, hai field, một cái không bao giờ ra JSONL.
- **br** giữ nguyên + thêm kỷ luật test: meta-lint `no_id_pinning` FAIL CI nếu test nào assert giá trị ID sinh ra (hash đổi theo fixture/hash-fn → test giòn); escape hatch `// invariant: <reason>` ([beads-rust:no-id-pinning-lint](../sources/beads-rust.md#no-id-pinning-lint)).
- **hn/beehive** dùng ID người-đặt (`US-001`, `phase-3-compound-learning-1`) — đọc được, kể chuyện được, nhưng CHỈ an toàn vì single-writer tạo việc tuần tự.
- **bvr** thêm chiều thứ ba: `workspace_prefix` (skip-serialized) — khi gộp N repo vào một view, ID namespaced lúc load, prefix giữ lại để *khôi phục raw ID* khi cần trỏ ngược về nguồn.

**Vì sao khác nhau:** quyết định nằm ở "ai tạo việc". Người tạo → tên đọc-được thắng. Máy tạo song song → hash thắng, và khi đó *kỷ luật test đi kèm* (no-pinning) không phải tùy chọn. fgOS đã chốt hướng multi-agent tạo việc → cụm bd/br là đường phải đi.

### 2.2 `status` — field rẻ nhất, hợp đồng transition mới là thứ đắt

**Bài toán:** status là một string; thứ vỡ không phải giá trị mà là *ai được ghi nó, bằng đường nào, đua với ai*.

Bốn tầng cứng dần, nhìn thấy rõ trong code:
1. **bvr**: `pub status: String` — consumer chỉ-đọc, không ý kiến. Đúng vai.
2. **bd**: enum 7 giá trị (`open/in_progress/blocked/deferred/closed/pinned/hooked` — `hooked` = "đang bị worker giữ" là status riêng, không phải flag!), nhưng transition chủ yếu là quy ước + lease.
3. **hn**: CHECK constraint trong SQL + **CAS**: mọi update mang `--expected-status`, so trong CÙNG write transaction, lệch → CONFLICT exit 3, không ghi gì; và `implemented` là **cửa đơn** — `reject_ordinary_story_implementation()` từ chối mọi update thường nhắm status đó, chỉ verb `story complete` (chạy fresh proof, atomic) vào được ([hn:story-status-single-door](../sources/repository-harness.md#story-status-single-door), [hn:story-complete-atomic](../sources/repository-harness.md#story-complete-atomic)).
4. **beehive**: `capCell` *từ chối cơ học* khi thiếu `verify_passed` + evidence; và mạnh nhất — phase `compounding` **không gán-được-giá-trị**, chỉ SINH bởi producer thật (`scribing-run`), sau post-mortem một phiên giả close 7 lần bằng hand-edit (beehive:chain-integrity-guard-tail, xem `state.md`).

**Đọc ra:** status không phải field — nó là **API có precondition**. Giá trị cao nhất của corpus: (hn) CAS cho đa-writer + (hn/beehive) trạng thái terminal chỉ có MỘT đường vào và đường đó đòi proof + (beehive) trạng thái là *sản phẩm của hành động thật, không phải giá trị ghi vào*.

### 2.3 `dependencies[].type` — một bảng edge chở cả điều phối lẫn tri thức

**Bài toán:** đồ thị việc cần cả quan-hệ-chặn (điều phối) lẫn quan-hệ-nghĩa (tri thức); nhét chung không phân lớp thì hoặc ready-set nghẹt, hoặc tri thức rơi vào ghi chú tự do.

- **bd** (verbatim `types.go:781-818`): enum `DependencyType` **19 hằng** ở HEAD — 4 workflow (`blocks`, `parent-child`, `conditional-blocks` "B chạy chỉ khi A fail", `waits-for` "fanout gate chờ children động") là lớp DUY NHẤT ảnh hưởng ready; 15 loại còn lại chở nghĩa: lineage (`discovered-from`, `caused-by`), hội thoại (`replies-to` + `thread_id` trên edge!), phiên bản (`supersedes`, `duplicates`), **thực thể** (`authored-by`, `assigned-to`, `approved-by`, `attests` — Decision 004 dồn cả quan-hệ-người vào bảng edge), ủy quyền (`delegated-from` — hoàn thành cascade lên), và `until` ("mute tới khi X đóng" — điều kiện thời-gian-sống bằng edge). Edge còn mang `metadata` JSON riêng (similarity score, proficiency…).
- **br** port 11 loại + `Custom(String)` untagged — mở cho loại mới không vỡ parse.
- **hn** giữ dependency là bảng SQL riêng có cycle-check DFS lúc insert, `query work-graph` trả stories+edges trong 1 transaction kèm `revision` hash.
- **beehive** chỉ có `deps: [cell-id]` — một loại, blocking, đủ cho swarm một-feature.

**Vì sao đây là field cao-giá nhất của cụm beads:** nó biến những thứ hệ khác phải mở bảng riêng (comment thread, audit trail, approval, assignment) thành *cùng một cấu trúc query được*. Cái giá: schema nghĩa của 19 loại sống trong docs/quy ước, không phải trong kiểu — `conditional-blocks` sai nghĩa là sai điều phối im lặng. Bài học phân lớp quan trọng hơn con số: **blocking là lớp ĐÓNG và bé (4), non-blocking là lớp MỞ** — thêm loại tri thức mới không bao giờ được đụng ready-semantics.

### 2.4 `lease_expires_at` + `heartbeat_at` — ownership sống sót crash

**Bài toán:** worker claim việc rồi chết — việc kẹt "in_progress" vĩnh viễn, hoặc bị cướp nhầm khi worker chỉ chậm.

- **bd** (verbatim): 2 field NULL-when-free ngay TRÊN issue (`lease_expires_at`, `heartbeat_at`), comment nói rõ `row_lock` là cơ chế nội bộ *cố ý không* phơi ra record. Reclaim đòi lease hết hạn.
- **beehive** cùng bài nhưng ở tầng file: claim O_EXCL + TTL/heartbeat, reclaim đòi **CẢ** TTL-hết **LẪN** heartbeat-cũ — hai điều kiện chống cướp-nhầm-worker-chậm (beehive:cross-session-atomic-claims).
- **hn/symphony** không cần field này: single-run lock + worktree cô lập — ownership giải bằng *kiến trúc* thay vì *dữ liệu*.

**Đọc ra:** ba chỗ đặt ownership: trong record (bd), trong filesystem primitive (beehive), trong isolation (symphony). Nếu fgOS đi same-checkout multi-session (đã chốt hướng này) thì lease phải là **dữ liệu nhìn thấy được trên record** — vì mọi phiên đều cần đọc "ai đang giữ, còn sống không" để route việc; và luật hai-điều-kiện của beehive là phần cứng hóa đáng giữ.

### 2.5 `verify` + evidence — chống fake-done bằng cấu trúc record

**Bài toán:** "should work" được chấp nhận như bằng chứng; close mà không ai chạy gì.

Ba cách cài cùng một luật, khác chỗ đặt:
- **beehive cell**: `verify` (lệnh chạy được, bắt buộc non-empty NGAY lúc tạo cell) + trace sau-chạy (`verify_command/verify_output/verify_passed/verified_at/files_changed`, thêm `red_failure_evidence` cho behavior_change). Cell thật của xưởng này (phase-3-compound-learning-1) cho thấy nó hoạt động: `verify_output: "tests 243, pass 243…"` — proof là DATA trên record, đọc lại được sau 6 tháng.
- **hn story**: `verify_command` cột riêng + 4 cột proof-matrix (`unit/integration/e2e/platform_proof` INTEGER) — proof không chỉ "có/không" mà *theo tầng*, và `verify-all` re-sweep phát hiện "capped-nhưng-nay-fail".
- **symphony RESULT.json**: `validation.commands[]{command, result}` hoặc `validation.unavailable: <lý do>` — **bắt buộc khai một trong hai**: hoặc bằng chứng, hoặc lời thú nhận tường minh; im lặng không phải lựa chọn hợp lệ.

**Đọc ra:** hội tụ ×3 độc lập (đã ghi ở porting-log `verify-enforced-close` E3). Điểm tinh của symphony đáng nhấc riêng: field `unavailable` — cho phép "không chạy được validation" là giá trị *hợp lệ có lý do*, thay vì để trống rồi người đọc đoán. Cùng gene với br health "absence = not evaluated ≠ passed".

**Mới @05a131f — evidence không dừng ở "chạy chưa", mà còn "verify TỰ nó có đáng tin không":** beehive thêm hai tầng field mới lên trên bộ ba `verify/evidence` đã hội tụ:
- `trace.semantic_judge` (`beehive:semantic-judge-verdict-loop`) — verdict LLM theo schema đóng `judge-verdict/1`, MỖI check bắt buộc mang `evidence` riêng + `failure_signature` khi FAIL; validator cross-check (không cho `PASS` lẫn check FAIL, không cho `NEEDS_REVISION` mà không FAIL nào, và văn xuôi tự do tự nó là lỗi validate). Đây là "proof-của-proof": verify xanh chỉ chứng minh lệnh chạy qua, judge verdict chứng minh KẾT QUẢ đúng ý định cell — hai lớp evidence khác nhau mà 6-record gốc gộp làm một.
- `trace.attempts` + `trace.budget_resets` (`beehive:cell-lifetime-budgets-anti-loop`) — sổ append-only mỗi lần thử (verdict, `failure_signature` đã chuẩn hoá, `claim_session`, `acquired_at`), làm nền cho 3 ngân sách kiểm tại cửa claim (`max_claims`/`max_failed_attempts`/`max_same_signature`). Field này giải bài toán KHÁC `lease_expires_at`/`heartbeat_at` (crash-survival, đã bàn ở §2.4): chống *retry-cùng-lỗi-vô-hạn* của một worker còn sống, không chống worker chết.

Cả hai đều dạy CÙNG một bài học schema: khi "proof" trở thành trục tin cậy trung tâm (beehive/hn/symphony đã hội tụ), nó không dừng ở một field boolean — nó cần LỊCH SỬ (append-only, không phải overwrite) để phân biệt "lần này pass" khỏi "pass sau N lần thử cùng lỗi". Bẫy đáng chép: `trace.deviations` của beehive bị `capCell` GHI ĐÈ mỗi lần cap — record tự phân loại field nào là sổ (append-only) và field nào là snapshot (overwrite), và trộn hai loại là lỗi thiết kế âm thầm.

### 2.6 `agent_context` (br) — governing instructions kế thừa xuống descendant

**Bài toán:** agent nhận việc con giữa chừng — constraint của epic cha đã rơi khỏi context (compaction, cold-start); nó làm đúng việc, sai luật.

- **br** (verbatim `mod.rs:361-378`, #297): field `agent_context` — canonical-JSON (skills/constraints/references/workflow, schema cố ý mở) đặt trên bead TỔ TIÊN; khi `inherited_context.enabled` và agent `--claim`/`show` việc con, output **phát kèm** context tổ tiên. Không hiện trong list/search — "governance metadata, not browsable content". Ancestor không có context → skip im lặng.

**Vì sao đây là field đáng chú ý nhất đợt này:** nó giải đúng bài fgOS gặp hằng ngày (beehive giải bằng `read_first` + CONTEXT.md — nhưng đó là *đường dẫn phải tự đọc*; br biến nó thành *payload tự đến lúc claim*, đúng thời điểm cần, sống trong store nên miễn nhiễm compaction). Một nguồn, chưa outcome (E1), nhưng cơ chế sạch.

### 2.7 `defer_until` / `due_at` — thời gian là điều kiện ready, không phải ghi chú

**bd**: `defer_until` = "ẩn khỏi `bd ready` tới lúc đó" — thời gian tham gia THẲNG vào predicate ready, cùng hạng với blocker; `due_at` đi vào Urgency của bvr triage. Đối chiếu: beehive/hn không có — "chờ" phải vật hóa thành blocked/gate. Kết nối trực tiếp câu hỏi exploring đang mở của fgOS ("biểu diễn 'chờ gì', timeout"): bd cho thấy *chờ-thời-gian* rẻ nhất là một field so-sánh-được trong predicate, còn *chờ-sự-kiện* mới cần gate-bead (`await_type: gh:run|gh:pr|timer|human|mail` + `waiters[]` — điểm-chờ là node, notify là danh sách mail trên node).

### 2.8 `metadata` — extension point và bài học typing

**bd**: `Metadata json.RawMessage` — JSON tự do validated-well-formed, chỗ thoát cho mọi thứ chưa có field. Nhưng bài học đắt nằm ở [beads:metadata-set-always-string](../sources/beads.md#metadata-set-always-string): `--set-metadata key=value` từng suy `"1"` → integer, phá round-trip cho consumer chờ string — sửa thành **luôn-string, kiểu tường minh qua `--metadata-json` riêng** (breaking, chấp nhận). **Luật rút ra cho mọi biên CLI của fgOS: không suy-diễn-kiểu ngầm ở biên; mặc định string, kiểu là opt-in tường minh.** br còn thêm mảnh khoan dung: coerce `"metadata":""` (legacy bẩn) → `None` lúc deserialize thay vì error — *đọc khoan dung, ghi chặt*.

### 2.9 `external_ref` / `source_repo` / `source_repo_path` — identity xuyên hệ

**bd/br/bvr** đều mang `external_ref` ("gh-9", "jira-ABC") — dây neo sang hệ ngoài, và bd thêm `--external-ref` exact-match filter để agent-hook tra ngược không full-scan. br tách ĐÔI source: `source_repo` (basename — ổn định xuyên máy) vs `source_repo_path` (đường tuyệt đối — route về đúng thư mục trên máy này); comment verbatim ghi rõ ca va chạm hai clone cùng tên. **Bài học nhỏ mà thấm: "định danh nguồn" và "địa chỉ nguồn" là hai field, hai độ bền** — trộn là hỏng hoặc portability hoặc routing.

### 2.10 Vòng đời dữ liệu ngay trong record: `ephemeral`/`wisp_type`, compaction, tombstone

- **bd**: `ephemeral` (không sync qua git), `wisp_type` (phân loại cho TTL-compaction), `compaction_level/compacted_at/compacted_at_commit/original_size` — record biết mình đã bị nén mấy lần, lúc nào, tại commit nào; quên-có-hóa-đơn.
- **br**: tombstone 4-field (`deleted_at/by/reason/original_type`) — xóa là *trạng thái có lý do*, không phải mất dòng; sống chung với luật NO-DELETION của agent.
- **hn**: không cần — event-log là nơi nhớ, record hiện tại được phép gọn.

**Đọc ra:** khi truth là store (bd/br), vòng-đời-dữ-liệu phải là FIELD; khi truth là event-log (hn, luật fgOS đã chốt), vòng đời nằm ở log và record được miễn. fgOS chỉ cần nhóm này nếu/khi có bề mặt store-truth phụ.

---

## §3 — Hợp đồng I/O: envelope, exit code, tự-mô-tả

### Đầu ra (CLI → agent)

Bốn nấc trưởng thành nhìn thấy được:

1. **bd — KHÔNG envelope** (finding có bằng chứng: `json.Marshal(record)` thẳng, không wrapper). Consumer không biết payload sinh lúc nào, từ dữ liệu nào, version gì. Chính bvr phải *tự vá* điều này khi làm viewer — bằng chứng sống rằng thiếu envelope là nợ đẩy xuống downstream.
2. **bvr — envelope 4 field** (verbatim `robot.rs:14-20`): `{generated_at, data_hash, output_format, version}`. Field đắt nhất: **`data_hash`** — SHA256 của `(id, status, priority, updated_at)` sort theo id, cắt 16 hex, separator `\x1f` (verbatim `robot.rs:43-76`). Agent so hash kỳ trước — *dữ liệu đổi chưa?* — không cần diff payload, không cần state server-side. Chú ý hash CHỌN field: chỉ 4 field "trạng thái đáng kể", không hash cả record → title đổi chính tả không làm agent tưởng đồ thị đổi.
3. **br — hợp đồng cứng + tự-mô-tả 3 tầng**: stdout=data / stderr=diagnostics là LUẬT, exit-code taxonomy **đóng, 9 mã** ("parse the stream that matches the exit code" — branch được TRƯỚC khi parse JSON); `br capabilities` (contract metadata máy-đọc) → `br schema` (JSON Schema per shape) → `br robot-docs guide` (prose ≤80 dòng); output schema versioned (`br.coordination.v1`) kèm tie-break tất định ghi trong contract; TOON format có `--stats` **đo** token savings thay vì khẳng định ([beads-rust:agent-first-cli-contract-hardened](../sources/beads-rust.md#agent-first-cli-contract-hardened)).
4. **hn protocol v1 + symphony consumer — hai đầu chứng minh nhau**: mỗi lệnh `--json` in đúng MỘT envelope ra stdout; exit 0/2/3/4/5 với "branch on error `code`, never on message"; **"mutation timeout = unknown outcome → rediscover trước khi retry"** (luật chống double-apply quý nhất của corpus); unknown-fields tolerated / unknown protocol version hard-fail; output cap 16 MiB; discovery envelope (`ContractDiscoveryResult`, verbatim) mang `protocol_version/cli_version/schema_min/max/database_state/capabilities[]` và next-action là **bảng quyết định trong contract**, không phải code của consumer. Symphony phía kia pin compatibility tuple và validate RESULT.json trước khi promote.

Và tầng **đóng băng bằng test** chạy dọc cả cụm: bvr schema-validation + robot-matrix e2e trên 12+ lệnh (ordering-invariant JSON); br golden-snapshot chính bề mặt agent-facing (`agent_baseline/` — help/schema/examples diff với binary live, "fresh-agent journey" làm acceptance).

### Đầu vào (orchestrator → worker)

Hai vật thể cùng nghề "prompt đủ để dispatch", khác tầng:
- **beehive cell**: hợp đồng NỘI DUNG — `action` (văn xuôi chi tiết), `must_haves.truths` (điều phải đúng, quan sát được), `prohibitions` (điều CẤM — trong cell thật: "KHÔNG replace view.outcomes[id]…"), `read_first`, `verify`. Worker biết *phải làm gì, không được làm gì, chứng minh bằng gì*.
- **symphony RUN_CONTRACT** (verbatim): hợp đồng MÔI TRƯỜNG — `worktree`, `harness_cli{executable, argv}`, `env{db_path, run_id, run_mode}`, `required_outputs[]`, `result_json_schema` (schema của RESULT nhúng NGAY trong contract giao việc!), `forbidden_paths[]`, `agent_instructions[]`. Worker biết *chạy ở đâu, gọi gì, nộp gì theo schema nào, cấm đụng đâu*.

Ghép lại mới đủ một lệnh giao việc hoàn chỉnh — không nguồn nào có cả hai trong một vật thể.

### Biên ingest (worker → store): changeset record

**hn** (verbatim example): JSONL header `{op:"changeset.header", version, run_id, base_schema_version}` + operation lines `{op:"story.add", id|uid, version, payload}` — payload **full-record, không column-diff**; append trong CÙNG SQLite transaction; `content_sha256` làm identity — **symphony verify SHA hai đầu** (trước + sau apply), đã-apply-cùng-SHA → skip idempotent. Ba luật (full-record / same-transaction / content-addressed) chính là phần fgOS đã lấy vào luật changeset 2026-07-13, nay có thêm verbatim làm chuẩn đối chiếu.

---

## §4 — So sánh trade-offs theo chiều

| Chiều | bd/br | hn | beehive | bvr | symphony | Trade-off lõi |
|---|---|---|---|---|---|---|
| Record | béo, vạn năng | gầy + proof matrix | prompt + trace | projection khoan dung | bao thư per-run | béo = 1 công cụ query mọi thứ; gầy = từng việc tự-mô-tả |
| Ngữ nghĩa đặt ở | edge (19 loại) + issue_type | packet nội dung | must_haves/prohibitions | — (chỉ đọc) | contract giao việc | edge giàu → cross-cutting query; packet giàu → chất lượng từng việc |
| Ai ghi status | lease + quy ước | CAS + single-door verb | cap-refusal + producer-sinh | không ghi | validate rồi promote | data-race trị bằng CAS; fake-done trị bằng verb-đòi-proof |
| Identity | hash thích ứng + content_hash | người đặt | người đặt | namespace lúc load | run_id | máy-tạo-song-song ↔ đọc-được-kể-chuyện-được |
| Envelope out | ✗ (bd) → 3-tầng versioned (br) | 1 envelope + exit taxonomy + discovery | status tokens | 4-field + data_hash | RESULT.json validated | chi phí envelope trả một lần ở producer, hay trả mãi ở mọi consumer |
| Evolution | Custom(String) untagged; omitempty | tolerate-unknown-fields, hard-fail-unknown-version; op `version` per-record | — | serde(default) toàn bộ | version pin + tuple | đọc khoan dung + ghi versioned là cặp bài trùng |
| Token economy | TOON + `--stats` đo | 16 MiB cap | silent bookkeeping | TOON fallback | — | tiết kiệm token phải ĐO được, không khẳng định chay |

**Hội tụ đáng tin (≥3 nguồn độc lập):** (1) close/complete phải đòi proof tươi — beehive/hn/symphony; (2) agent output là envelope versioned máy-đọc, agent không đụng UI người — bvr/br/hn(/bd một nửa); (3) đọc khoan dung + ghi chặt — bvr serde(default), br coerce-legacy, hn tolerate-unknown-fields; (4) content-addressed identity cho apply-một-lần — hn/symphony content_sha256, bd content_hash (mục đích khác một chút: dedup).

**Phân kỳ đáng cân:** ngữ-nghĩa-ở-edge vs ngữ-nghĩa-ở-packet (§1) — không ai "thắng"; hn chọn packet vì single-writer + review con người; bd chọn edge vì multi-agent + query đa dạng. fgOS ở giữa: multi-agent (nghiêng edge) nhưng lifecycle bán-tự-động cần human đọc từng việc (nghiêng packet).

---

## §5 — Giải pháp tổng hợp cho forgent

Đề xuất **kernel record + 4 nhóm field opt-in + hợp đồng I/O 2 mảnh**, mỗi lựa chọn ghi nguồn:

### Work-item record (JSONL event-sourced theo luật đã chốt; đây là hình của VIEW sau replay)

```
kernel (bắt buộc):
  id            — hash base36 thích ứng + namespace prefix   [bd; kèm kỷ luật no-id-pinning của br]
  title, type, status, priority(0-4)
  created_at/by, updated_at

edges[] (bảng riêng trong view, type hai LỚP):               [bd, thu gọn]
  blocking  (lớp ĐÓNG):  blocks | parent-child | waits-for
  semantic  (lớp MỞ):    discovered-from | caused-by | supersedes | duplicates | relates-to | ...
  → ready = derived query CHỈ nhìn lớp blocking; thêm loại semantic không bao giờ đổi điều phối

proof (bắt buộc từ lane small+):                             [beehive + hn + symphony]
  verify        — lệnh chạy được, đặt LÚC TẠO việc
  evidence      — {verify_output, verify_passed, verified_at, files_changed}
                  HOẶC {unavailable: <lý do>} — im lặng không hợp lệ    [symphony]
  → close là VERB đòi evidence tươi, không phải status gán được        [hn single-door + beehive cap]

proof-history (opt-in, khi close có vòng tự-sửa):             [beehive @05a131f]
  attempts[]      — append-only: {n, verdict, failure_signature, session, at}
  judge_verdict   — {verdict, checks[]{evidence, failure_signature?}, confidence} — "proof của proof"
  → NEEDS_REVISION mở lại việc + xoá evidence cũ; ngân sách (max_claims/max_failed/max_same_signature)
    kiểm tại claim, không phải tại close — chống retry-cùng-lỗi, KHÁC bài crash-survival của ownership

ownership (chỉ khi multi-session bật):                       [bd field + beehive luật]
  lease_expires_at, heartbeat_at — NULL khi tự do; reclaim đòi CẢ hai điều kiện

scheduling (opt-in):
  defer_until   — tham gia thẳng predicate ready              [bd]
  due_at        — chỉ nuôi ranking, không chặn                [bd→bvr]

context (opt-in, cân nhắc sau):
  agent_context — governance JSON kế thừa, phát lúc claim     [br #297]

extension:
  metadata      — JSON tự do; biên CLI LUÔN string, kiểu qua flag riêng  [bd bài học GH#4146]
  external_ref  — neo hệ ngoài, có filter exact-match          [bd]
```

**Bỏ, có lý do:** nhóm messaging/gate/molecule của bd (mọi-thứ-là-bead) — fgOS đã có decisions.jsonl + capture riêng, gộp vào một struct vạn năng là nhập khẩu cả hệ hình chưa cần; tombstone/compaction — truth của fgOS là event-log, log là nơi nhớ (§2.10); Dolt — luật 2026-07-13 đã chốt, điều-kiện-xem-lại đã ghi tên.

### Envelope output (mọi lệnh `--json` của fgos CLI)

```
{ contract: "fgos.v1",            — hard-fail nếu consumer không biết  [hn]
  generated_at, data_hash,        — hash CHỌN field trạng thái, sort id, 16 hex  [bvr]
  data: {...} }                   — unknown fields trong data: tolerate  [hn]
+ exit-code taxonomy ĐÓNG, branch-on-code-never-message               [br + hn]
+ stdout=data / stderr=diagnostics                                     [br]
+ mutation timeout = unknown outcome → rediscover trước retry          [hn]
+ đóng băng bằng: schema-test ordering-invariant (bvr) + golden-snapshot bề mặt agent (br)
```

Tự-mô-tả (`fgos capabilities` / `fgos schema`) và TOON: **chờ** — capabilities đáng làm khi có consumer ngoài đầu tiên (như hn chỉ làm khi symphony tách); TOON chờ số đo token thật của chính fgOS (br dạy: phải có `--stats` mới đáng tin).

### Dispatch input (giao việc cho worker)

Giữ cell beehive làm hợp đồng NỘI DUNG (đã dogfood), vay 3 field của RUN_CONTRACT khi fan-out đa-session: `forbidden_paths[]` (đang là hold/reservation — vật hóa vào lệnh giao việc), `required_outputs[]`, và `result_json_schema` nhúng trong lệnh giao việc [symphony].

### Evolution — luật chung cho mọi schema trên đây

Additive event type + lazy view key (bài học phase-3 của CHÍNH fgOS, nay khớp verbatim với `#[serde(default)]` toàn-bộ của bvr và tolerate-unknown của hn) + version per-record trên changeset op [hn] + unknown-version hard-fail [hn]. Đọc khoan dung, ghi chặt, version tường minh — ba chân kiềng.

## Portable ideas

Đa số đã có row trong porting-log (không tạo trùng): `agent-output-envelope-contract` (R3 E3 F2 — dive này bổ sung verbatim + luật timeout-rediscover vào Ghi chú), `verify-enforced-close` (R3 E3 F3), `cas-expected-status-transitions` (R2 E2 F1), `hash-id-adaptive-length` (R1 E2 F1 — đi cặp no-id-pinning), `agent-surface-golden-snapshots` (R3 E2 F2), `discovered-from-lineage` (R2 E2 F1), `changeset-event-sourcing` (planned). **Mới từ dive này:**

- `agent-context-inherited-governance` (br #297) — R3 E1 F2: field governance kế thừa phát lúc claim, chống compaction/cold-start; R3 vì chạm mọi dispatch, E1 một nguồn chưa outcome.
- `two-layer-edge-taxonomy` (bd 19-type, chưng thành luật 2 lớp) — R2 E2 F1: lớp blocking đóng-và-bé quyết định ready, lớp semantic mở chở tri thức; E2: bd production + hn tách bảng cùng tinh thần.
- `judge-verdict-schema-closed` (beehive:semantic-judge-verdict-loop, MỚI @05a131f) — R2 E1 F2: verdict LLM theo schema đóng (`checks[]` bắt buộc `evidence`, cross-check PASS/FAIL nhất quán, văn xuôi tự do = lỗi validate) làm "proof của proof" bên trên verify boolean đã hội tụ ×3. E1: một nguồn, sinh từ hardening nội bộ (bản thân đã sửa một lỗ D7 của chính nó — dấu hiệu cơ chế còn đang settle, chưa đủ chín để R cao hơn).
- `attempt-history-loop-budget` (beehive:cell-lifetime-budgets-anti-loop, MỚI @05a131f) — R2 E2 F2: sổ append-only mỗi lần thử + ngân sách kiểm tại claim (max_claims/max_failed_attempts/max_same_signature qua `normalizeFailureSignature`); giải bài toán retry-cùng-lỗi-vô-hạn mà `lease_expires_at` (crash-survival) không chạm tới. E2: đi cùng bằng chứng sống — cùng đợt hardening sinh cả `native-codex-wait-discipline` (anti-loop phía chờ) lẫn budget này (anti-loop phía thử-lại), hai mảnh độc lập cùng một nguyên nhân gốc (GH issue thật).

## Câu hỏi mở

1. `agent_context` kế thừa vs `read_first` của cell — gộp hay giữ hai cơ chế (push-lúc-claim vs pull-tự-đọc)? Cần một feature thật làm bàn thử.
2. Ngưỡng bật nhóm ownership (lease trên record): trước hay sau khi same-checkout-multi-session-coordination được port?
3. `waits-for` + gate-bead của bd (chờ-sự-kiện vật hóa thành node) — có đáng vào lớp blocking của fgOS ngay từ đầu, hay để "chờ gì" của exploring hiện tại quyết?
4. `data_hash` chọn field nào cho fgOS view (id, status, priority, updated_at như bvr — hay thêm lane/gate)? Quyết lúc có consumer đầu tiên.
5. **MỚI @05a131f:** `proof-history` (attempts/judge_verdict) có đáng vào kernel record của fgOS ngay từ đầu, hay chờ tới khi fgOS có vòng tự-sửa/re-dispatch thật (beehive sinh field này từ đúng nhu cầu đó, không phải trước)? Nghiêng CÓ ĐIỀU KIỆN — cùng nhịp với "ownership chỉ khi multi-session bật" ở câu hỏi 2.
