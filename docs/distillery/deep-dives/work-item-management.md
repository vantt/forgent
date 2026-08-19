---
topic: work-item-management
date: 2026-07-15
based_on: [repository-harness@0a79bbe, beads@777d24b87, beads-rust@ab0288cb, beads-viewer-rust@7f96da4]
entries: [repository-harness:durable-sqlite-layer, repository-harness:changeset-event-sourcing, repository-harness:policy-vs-durable-separation, repository-harness:story-packets, repository-harness:feature-intake-mandatory, repository-harness:hard-gates-intake, repository-harness:epic-story-hierarchy, repository-harness:runnable-derived-dispatch, repository-harness:story-status-single-door, repository-harness:story-complete-atomic, repository-harness:proof-matrix, repository-harness:story-verify-command, repository-harness:phase-documents-benchmark-deltas, repository-harness:orchestration-protocol-v1, repository-harness:protocol-next-action-table, beads:dolt-as-versioned-truth, beads:ready-work-ten-dep-types, beads:gate-beads-event-driven, beads:formula-molecule-lifecycle, beads:multiagent-routing-and-slots, beads:hash-id-adaptive-length, beads:discovered-from-lineage, beads:agent-first-cli-contract, beads:close-last-touched, beads-rust:sqlite-jsonl-classic-truth, beads-rust:sync-safety-blast-radius, beads-rust:workspace-health-contract, beads-rust:coordination-evidence-classifier, beads-rust:two-tier-locking-app-backoff, beads-rust:scheduler-swarm-planning, beads-rust:workflow-gates-policy, beads-rust:cross-project-routing, beads-rust:br-only-cli-additions, beads-viewer-rust:transparent-triage-scoring, beads-viewer-rust:forecast-eta-pipeline, beads-viewer-rust:greedy-topk-unblock-and-whatif, beads-viewer-rust:graph-drift-detection, beads-viewer-rust:robot-mode-envelope, beads-viewer-rust:mcp-agent-mail-coordination, beads-viewer-rust:suggestion-feedback-loop, beads-viewer-rust:commit-bead-correlation-with-feedback]
---

# Deep-dive: quản lý work-item — JSONL-in-git, triage, chọn việc, xếp việc, planning, điều phối agent

> stale vs repository-harness@0a79bbe (9cc306d→0a79bbe, 2026-08-07) — gần như mọi entry hn được cite ở đây (`story-packets`, `feature-intake-mandatory`, `hard-gates-intake`, `epic-story-hierarchy`, `story-status-single-door`, `story-complete-atomic`, `proof-matrix`, `story-verify-command`, `phase-documents-benchmark-deltas`) thuộc vòng đời story/SQLite giờ KHÔNG còn default: Phase 1-2 (decision 0019/0020) thay default bằng `docs/plans/active|completed/` Git-native; Phase 4 (decision 0022) khoá ghi ngoài ý sau `--compatibility-write`. `phase-documents-benchmark-deltas` chính nó bị superseded — định dạng roadmap PHASE-N.md kèm benchmark-% biến mất, thay bằng plan file mục-tiêu-quan-sát-được (vd "e-inna replay pass"). `orchestration-protocol-v1`/`protocol-next-action-table` (hợp đồng cho external orchestrator) KHÔNG đổi — được miễn freeze tường minh. Ảnh hưởng tới Bottom Line: mô tả "hn mạnh nhất ở cửa vào/cửa ra" vẫn ĐÚNG VỀ MẶT CƠ CHẾ, nhưng cần ghi rõ đó giờ là compatibility-profile (`--with-cli`), không phải trải nghiệm mặc định của một fresh install hn nữa — nếu re-dive, nên thêm trục "cái gì default vs cái gì phải chọn tường minh" cho cả 4 nguồn.

Bốn nguồn: **repository-harness** (hn, SQLite + changesets), **beads** (bd, Go — Steve Yegge, đã pivot Dolt), **beads-rust** (br, Rust — Dicklesworthstone, cố ý ở lại classic SQLite+JSONL), **beads-viewer-rust** (bvr, tầng phân tích đặt trên đồ thị beads). Hai deep-dive liên quan: `state.md` (vật lý store, đã phân tích changeset vs Dolt vs JSONL sâu hơn về mặt state) và `routing.md` (concurrency tầng-1). Dive này nhìn cùng dữ liệu theo trục **vòng đời của một work-item**: sống ở đâu (git/JSONL) → là gì (unit model) → vào hệ bằng cửa nào (triage) → chọn cái nào (selection) → xếp thứ tự ra sao (ordering) → plan bằng gì → và nhiều agent cùng làm thì điều phối thế nào.

**Bottom Line:** Bảy câu hỏi này thực ra là **một pipeline có tầng**, và không nguồn nào sở hữu cả pipeline: hn mạnh nhất ở *cửa vào* (intake phân risk + story packet có proof) và *cửa ra* (close atomic, contract cho orchestrator ngoài); bd mạnh nhất ở *mô hình unit* (issue = node đồ thị 10 loại dependency, mọi thứ — gate, message, workflow — đều là bead) và *coordination nguyên thủy* (claim/lease/slot); br mạnh nhất ở *độ tin cậy vận hành* (locking + backoff, health contract, sync không thể phá cây, scheduler tất định); bvr mạnh nhất — và **một mình một chiếu** — ở *tầng quyết định phía trên ready-set*: xếp hạng giải-thích-được, chọn-k-mở-khóa-nhiều-nhất, what-if, forecast, drift. Về JSONL-in-git, ba nguồn cho ba lời giải và bd+br là **cặp đối chứng tự nhiên**: cùng xuất phát điểm, bd rẽ sang Dolt khi multi-writer thành tải chính, br ở lại và chứng minh classic đủ dùng ở single-writer — biến "khi nào rời JSONL-truth" thành một quyết định có điều kiện kích hoạt rõ, không phải khẩu vị. Khuyến nghị lớn nhất cho forgent: giữ kiến trúc "eligibility là truy vấn dẫn xuất do store tính" (hội tụ 5 nguồn), và **port tầng bvr** (ranking + top-k unblock + parallel tracks) làm bộ não chọn-việc cho lifecycle bán-tự-động — đây là mảnh cả beehive lẫn hn đều chưa có.

## Câu hỏi

Một hệ quản lý việc cho agent phải trả lời: (1) truth của việc sống ở đâu để vừa git-diff được vừa chịu được nhiều writer; (2) work-item mô hình hóa thế nào; (3) việc mới vào hệ được phân loại ra sao; (4) trong các việc đủ điều kiện, cái nào *đáng làm nhất*; (5) thứ tự lấy việc có là hợp đồng không; (6) planning dựa trên dữ liệu gì; (7) nhiều agent cùng làm thì tranh chấp xử lý bằng cơ chế nào?

---

## §1 — Git-track JSONL: ba lời giải cho một bài toán

Bài toán gốc: **store có query được thì không diff được trong git; thứ diff được trong git thì không query được.** Bốn nguồn cho ba lời giải + một non-answer có chủ đích:

### hn — DB là view, event-log JSONL là git-truth
`harness.db` (SQLite) **gitignored**; mọi mutation ghi **semantic changeset JSONL** (`story.add/update`, `decision.add`…) append **trong cùng SQLite transaction** (rollback chung), full-record chứ không column-diff; `.harness/changesets/` **committed** (negation pattern trong `.gitignore`); `db rebuild` dựng lại toàn bộ DB từ changesets; `content_sha256` chống double-apply lệch nội dung ([changeset-event-sourcing](../sources/repository-harness.md#changeset-event-sourcing), [policy-vs-durable-separation](../sources/repository-harness.md#policy-vs-durable-separation)). Được ăn cả hai: SQL để query, git để diff/review/merge event log.

### bd — rẽ hẳn khỏi JSONL-truth: version control nằm TRONG store
Pivot lớn @303e263: **Dolt SQL** (`.beads/dolt/`, gitignored) là canonical source; `issues.jsonl` chỉ còn interchange/export. Concurrency chuyển từ branch-per-worker sang **all-on-main + transaction discipline**, 3-phase commit, sync qua `bd dolt push/pull` — Dolt native, không nhờ git ([dolt-as-versioned-truth](../sources/beads.md#dolt-as-versioned-truth)). Đánh đổi tường minh: **mất git-diffable trong repo**, được multi-writer + history/branch/merge cấp DB.

### br — cố ý ở lại classic, và tôi-luyện nó
br fork bd tại kiến trúc PRE-pivot rồi **từ chối đi theo**: SQLite (`.beads/beads.db`, gitignored) là primary/working store; **JSONL (`.beads/issues.jsonl`, git-tracked) là "authoritative interchange copy"**; thêm base-snapshot `.beads/beads.base.jsonl` để 3-way merge phân biệt được sửa-DB với sửa-JSONL; derived state (dirty flags, blocked cache, export hash) rebuild được và **không bao giờ được cao hơn primary** ([sqlite-jsonl-classic-truth](../sources/beads-rust.md#sqlite-jsonl-classic-truth)). Ở lại không phải là đứng yên: br bọc lõi classic bằng health contract 4 mức ([workspace-health-contract](../sources/beads-rust.md#workspace-health-contract)), sync-safety chứng-minh-được-blast-radius (§7), và `.br_history/` — snapshot JSONL timestamped tự động mỗi export, rotate, `history list/diff/restore/prune` — **time-travel cấp workspace không nhờ git** ([br-only-cli-additions](../sources/beads-rust.md#br-only-cli-additions)).

### bvr — không sở hữu truth, chỉ đọc
bvr đọc đồ thị của beads và trả lời "dữ liệu đổi chưa" bằng `data_hash` trong robot envelope (SHA256 của trạng thái issue ổn định) — consumer không cần diff, chỉ so hash ([robot-mode-envelope](../sources/beads-viewer-rust.md#robot-mode-envelope)).

### Đọc ra quyết định gì

bd và br là **thí nghiệm đối chứng hiếm có**: cùng codebase gốc, hai người khác nhau, hai kết luận — và cả hai đều đúng *trong điều kiện của mình*. Điều kiện kích hoạt rời JSONL-truth mà bd để lộ: **multi-agent write trở thành tải chính** (nhiều writer đồng thời vào cùng store, merge JSONL thành nút thắt). Trước ngưỡng đó, br chứng minh classic + kỷ luật (base-snapshot 3-way merge, derived-never-above-primary, health taxonomy) là đủ — và giữ được thứ Dolt phải bỏ: **JSONL diff được trong PR, review được bằng mắt người**. hn là đường thứ ba đứng giữa: nếu cần query mạnh ngay từ đầu, đừng track DB — track **event log** của DB; đây cũng chính là luật changeset forgent đã chốt.

Bảng quyết định rút ra:

| Điều kiện | Lời giải | Nguồn chứng |
|---|---|---|
| Single-writer (hoặc ít phiên, claim-serialized), cần git-diff/review | JSONL-in-git là truth, DB (nếu có) là view rebuild được | br, beehive |
| Cần SQL query/aggregate mạnh, vẫn cần truth trong git | DB gitignored + semantic changeset JSONL committed, rebuild từ log | hn |
| Multi-writer là tải chính, chấp nhận mất git-diff | Versioned-DB-as-truth (VC trong store) | bd |

### Góc nhìn sản phẩm đằng sau ba lời giải: coordination sống ở đâu?

Khác biệt truth-store không phải khẩu vị kỹ thuật mà là hệ quả của một giả định sản phẩm: **writer là ai, và store đóng vai gì.**

- **bd: store là trạm điều phối của một hạm đội.** Tầm nhìn là fleet agent chạy nền, liên tục, không người trông (Gastown: agent/molecule/gate/rig/convoy, daemon/RPC, federation + sovereignty tiers — đúng những thứ br cắt bỏ). Trong mô hình đó đồ thị việc là **message bus sống**: gate là bead, message là bead, memory (`bd remember`) là bead, molecule đang chạy là các bead chuyển trạng thái liên tục. Mọi giao tiếp và mọi bước workflow đều là *write vào store* → multi-writer là **tải chính, không phải ngoại lệ** → JSONL merge textual chết đúng chỗ này → version control phải vào trong store (Dolt all-on-main). Cái giá git-diffable chấp nhận được vì git không còn là nơi điều phối — `bd dolt push/pull` thay vai đó.
- **br: store là công cụ thụ động của một phiên làm việc.** Non-invasive by construction: không daemon, không auto-git, "git là việc của agent". Writer là **một phiên tại một thời điểm**; swarm là tải phụ được *serialize* (`.write.lock` + backoff). Store chỉ ghi *kết quả*, không chở *giao tiếp* — coordination đẩy ra ngoài (Agent Mail, advisory classifier thuần đọc). Với giả định đó multi-writer DB là độ phức tạp mua về không để làm gì (Gastown = "~40% codebase complexity", cắt vĩnh viễn); JSONL-in-git còn là *tính năng*: review đồ thị việc trong PR bằng mắt.
- **hn: writer không phải agent — writer là run.** Agent không ghi thẳng vào store lúc làm việc; đơn vị tương tranh là run cô lập, trả về changeset, apply tuần tự. Tranh chấp giải ở *cửa giao dịch* (CAS), không ở *tầng storage*.

Một trục tóm cả ba: bd đặt coordination *trong store*; br đặt *ngoài store*; hn đặt *ở pipeline run→changeset*.

### Harness có "giải" multi-write không? — multi-execution, không phải multi-write

Mô hình isolate-then-merge của hn (run = worktree riêng + **copy** harness.db → làm xong trả **semantic changeset** → apply tuần tự idempotent vào db gốc) đúng là "mỗi agent tự ghi riêng, merge sau" — nhưng nó **né** multi-write chứ không **đấu** với multi-write:

1. **Điểm hợp nhất vẫn single-writer.** Apply changeset là append tuần tự qua một cửa; symphony auto-mode thậm chí giữ single-active-run lock — agent *làm việc* song song, store *không bị ghi* song song.
2. **Không có merge engine.** Changeset là full-record: hai run cùng sửa một story theo hai hướng → apply theo thứ tự = **last-write-wins**; `content_sha256` *báo* lệch (cùng ID khác nội dung) chứ không *hòa* lệch. Đây chính là thứ Dolt cho bd: merge cấp store với branch/history thật.
3. **An toàn đến từ phân hoạch trước, không từ cơ chế sau.** Orchestrator giao scope rời nhau cho từng run; CAS (`--expected-status` → CONFLICT exit 3) chặn đụng độ ở cửa lệnh. Khi giả định scope-rời-nhau đúng, merge-sau trở nên tầm thường vì chẳng có gì để merge.

So sánh gọn: hn = **git-flow** trên work-store (nhánh riêng → tích hợp tuần tự — hợp khi việc phân hoạch được); bd = **Google Docs** (mọi người cùng một tài liệu, store tự xử tương tranh — bắt buộc khi agent giao tiếp *qua chính store*: message/gate/memory-bead không phân hoạch trước được). bd không thể dùng lời giải của hn vì tải của họ về bản chất là shared-entity writes.

**Hệ quả cho forgent:** beehive đã đúng hình hn (swarm + file reservation + one-commit-per-cell = phân hoạch trước, tích hợp tuần tự). Bài multi-write *được thiết kế cho biến mất* chừng nào giữ được ba tính chất: **(a)** orchestrator chia scope rời nhau; **(b)** điểm ghi chung là append tuần tự (JSONL event); **(c)** agent không dùng work-store làm kênh giao tiếp. Ngưỡng phải xem lại là khi một trong ba vỡ — thường (c) vỡ trước (ví dụ: nếu async-human-gate/signal tiến hóa thành message-passing ghi qua work-store).

---

## §2 — Mô hình work-item: packet-có-hợp-đồng vs node-đồ-thị

### hn — story packet: đơn vị việc có contract và proof
Story = status + lane + product contract + acceptance criteria + validation matrix cells + harness delta + evidence; high-risk story = folder 4 file (overview/design/execplan/validation) — **ceremony scale theo lane bằng cấu trúc file** ([story-packets](../sources/repository-harness.md#story-packets)). Story mang `verify_command` chạy được ([story-verify-command](../sources/repository-harness.md#story-verify-command)); coverage là **proof matrix** tra được (story × unit/integration/e2e/platform), "thiếu cột proof phải có giải thích" ([proof-matrix](../sources/repository-harness.md#proof-matrix)). Hierarchy epic→US + dependency nằm **trong schema**, cycle bị chặn từ lúc insert (DFS), `query work-graph` trả stories + edges trong 1 transaction kèm revision hash ([epic-story-hierarchy](../sources/repository-harness.md#epic-story-hierarchy)).

### bd — mọi thứ là bead: unit tối giản, ngữ nghĩa dồn vào edge
Issue là node đồ thị với **10 loại dependency chia hai lớp**: 4 blocking (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`) quyết định ready-set, 6 non-blocking (`related`, `discovered-from`, `caused-by`, `validates`, `supersedes`, `duplicates`) chở **tri thức** mà không nghẹt điều phối ([ready-work-ten-dep-types](../sources/beads.md#ready-work-ten-dep-types)). Ba hệ quả kiến trúc đẹp:
- **Workflow cũng là issues**: formula (định nghĩa TOML) instantiate thành molecule = tập bead thật trong đồ thị; workflow đang chạy không phải state riêng, query bằng cùng công cụ với task thường ([formula-molecule-lifecycle](../sources/beads.md#formula-molecule-lifecycle)).
- **Gate cũng là issue type** (`gh:pr`, `gh:run`, `timer`, `bead`, `human`) — điểm-chờ vật hóa thành node; message/event/role cũng là bead ([gate-beads-event-driven](../sources/beads.md#gate-beads-event-driven)).
- **Lineage là edge**: việc lòi ra giữa chừng ghi bằng `discovered-from` — "làm A lòi ra B" là dữ liệu topology query được, không phải ghi chú tự do ([discovered-from-lineage](../sources/beads.md#discovered-from-lineage)).

ID là hash SHA256→base36 cắt **thích ứng** (3–8 ký tự, vượt 25% xác suất va chạm thì tự dài ra) — nhiều agent tạo ID song song không cần điều phối trung tâm ([hash-id-adaptive-length](../sources/beads.md#hash-id-adaptive-length)).

### br — giữ model classic, chuyển phần "luật" sang policy data
br giữ issue model v14 (interop với bd classic) nhưng thêm: **gate khai báo trong `.beads/policy.yaml`** keyed theo transition `"from -> to"`, enforce tại chokepoint close/transition; cả **luật ready cũng config được** (`workflow.status_groups.ready`) — luật thành dữ liệu per-project thay vì hardcode ([workflow-gates-policy](../sources/beads-rust.md#workflow-gates-policy)). Ergonomics tạo/sửa hàng loạt: bulk update field bất kỳ, saved queries, changelog theo issue type ([br-only-cli-additions](../sources/beads-rust.md#br-only-cli-additions)).

### Đối chiếu
Hai triết lý unit: hn dồn ngữ nghĩa vào **bên trong packet** (contract, acceptance, proof — nặng, giàu, ceremony theo lane); bd dồn ngữ nghĩa vào **edge của đồ thị** (unit gầy, topology giàu). Gate minh họa sắc nhất — cùng một khái niệm, ba tầng cài đặt: beehive gate cứng trong code, br gate là *config data* enforce tại một cửa, bd gate là *node đồ thị* có lifecycle riêng. Càng về phía bd, hệ càng đồng nhất (một công cụ query mọi thứ) nhưng càng ít "khuôn" ép chất lượng nội dung từng việc; càng về phía hn, từng việc càng tự-mô-tả nhưng cross-cutting query càng phụ thuộc schema.

---

## §3 — Triage: hai nghĩa khác nhau, đừng gộp

Corpus tách "triage" thành hai bài toán khác hẳn nhau:

### Triage-lúc-nhận (intake): việc này *loại gì, rủi ro bao nhiêu* — hn sở hữu
Mọi prompt qua intake **trước khi** đổi code: 6 input types, 10 risk flags, **hard gates** (auth / data loss / audit / external provider / validation removal → luôn high-risk, không thương lượng bằng đếm flag); output cố định 5 dòng (Lane/Reason/Docs/Story/Validation); intake row ghi durable TRƯỚC khi implement, kể cả việc tiny. Nguyên tắc phát biểu thẳng: *"The human does not need to classify risk. The harness does."* ([feature-intake-mandatory](../sources/repository-harness.md#feature-intake-mandatory), [hard-gates-intake](../sources/repository-harness.md#hard-gates-intake)). bd/br gần như không có tầng này — issue vào hệ với priority 0–4 + type do người/agent tự đặt; br chỉ thêm lint template (`bd lint`/`br` tương đương) kiểm hình thức.

### Triage-tồn-đọng (backlog): trong N việc mở, *cái nào đáng chú ý* — bvr sở hữu
- **Impact score 8 thành phần minh bạch**: PageRank 0.22 + Betweenness 0.20 + BlockerRatio 0.13 + PriorityBoost 0.10 + TimeToImpact 0.10 + Urgency 0.10 + Risk 0.10 (đảo dấu — thấp = tốt) + Staleness 0.05 (cap 90 ngày); trọng số chuẩn hóa tổng = 1.0; **5 preset** (Default, GraphHeavy, PriorityFirst, QuickWins, RiskAverse) chỉnh trọng số rồi renormalize. Mỗi khuyến nghị trả về **từng thành phần điểm** — không blackbox ([transparent-triage-scoring](../sources/beads-viewer-rust.md#transparent-triage-scoring)). Cấu trúc đồ thị chiếm 42% (PageRank + Betweenness), tín hiệu vận hành 58%.
- **Suggestion engine có kỷ luật**: 5 tín hiệu (duplicate Jaccard ≥0.7, missing dep, label mapping, cycle warning, stale >90d + PageRank thấp), ngưỡng confidence tường minh, **cap 20–50/loại** — không xả danh sách vô hạn; người accept/dismiss → tín hiệu tự-chỉnh ([suggestion-feedback-loop](../sources/beads-viewer-rust.md#suggestion-feedback-loop)).
- **Drift detection**: so đồ thị hiện tại với baseline snapshot trên 6 chiều; **cycle mới = CRITICAL**; blocked +≥5 → WARNING; actionable giảm ≥30% → WARNING — sức khỏe backlog thành gate đo được với exit code có nghĩa ([graph-drift-detection](../sources/beads-viewer-rust.md#graph-drift-detection)).

### Đọc ra
Hệ hoàn chỉnh cần **cả hai cửa**: intake-triage quyết định *nghi thức* (lane, gate, ceremony) — một quyết định về rủi ro; backlog-triage quyết định *sự chú ý* (việc nào nổi lên) — một quyết định về giá trị. hn làm cửa một mà không có cửa hai (backlog chỉ là bảng friction); bd/bvr làm cửa hai mà gần như bỏ cửa một. beehive hiện giống hn (mode gate = cửa một). forgent lifecycle bán-tự-động cần cửa hai để pipeline tự chạy không người trông.

---

## §4 — Chọn việc xịn nhất: bốn tầng xếp chồng

Xếp các cơ chế của corpus lại thì lộ ra một **stack 4 tầng**, mỗi nguồn dừng ở một tầng khác nhau:

### Tầng 1 — Eligibility (nhị phân): "việc nào ĐƯỢC làm?"
Hội tụ mạnh nhất toàn distillery (5 nguồn độc lập — xem `routing.md` và ô matrix `next-work-derived-from-state`): **việc-kế-tiếp là truy vấn dẫn xuất do store tính, không phải danh sách ai đó bảo trì.**
- hn: `runnable` = predicate SQL (status planned AND verify_command non-empty AND mọi blocker đã implemented); contract **cấm consumer tự suy lại** ("Consumers use this field and must not reproduce the SQL rules") ([runnable-derived-dispatch](../sources/repository-harness.md#runnable-derived-dispatch)).
- bd: `bd ready` = issue open + không blocker mở nào, trên 4 loại blocking dep; cycle detection phủ **đồ thị hợp nhất** blocks + parent-child + conditional (chu trình xuyên phân cấp trước vô hình, nay bắt được) ([ready-work-ten-dep-types](../sources/beads.md#ready-work-ten-dep-types)).
- br: cùng predicate nhưng **ready là policy** (`status_groups.ready` config được).

### Tầng 2 — Ordering (hợp đồng): "cùng đủ điều kiện thì lấy cái nào trước?"
Bài học đắt của bd @777d24b: thứ tự lấy việc từng là *arbitrary* — giờ là **hợp đồng tường minh** `(priority ASC, created_at ASC, id ASC)` = FIFO trong cùng priority-tier, **pin trong protocol test** (`r2Less`), cùng thứ tự cho cả query-path lẫn claim-path. Ý nghĩa: không đói việc cũ, hai agent nhìn cùng hàng đợi thấy cùng thứ tự. br cùng kết luận: `br scheduler` output versioned `br.scheduler.v1` + **tie-break tất định ghi thẳng trong contract** + fallback policy "preserve conservative ordering when evidence ties" ([scheduler-swarm-planning](../sources/beads-rust.md#scheduler-swarm-planning)). Hai sibling độc lập cùng rút ra: **ordering không thành hợp đồng test-được thì multi-agent sẽ dẫm nhau ngầm.**

### Tầng 3 — Ranking (có điểm, giải thích được): "cái nào ĐÁNG nhất?"
Chỉ bvr có (§3): ready cho biết "được làm chưa", impact-score cho biết "nên làm cái nào trước **và vì sao**". Điểm phân biệt then chốt với mọi hệ priority-field: priority là *input người khai*, impact-score là *dẫn xuất từ topology + vận hành* — nó nhìn thấy thứ người đặt priority không thấy (việc P3 đang chặn 12 việc khác qua 2 tầng).

### Tầng 4 — Portfolio (chọn TẬP việc): "fan ra k việc nào để mở khóa nhiều nhất?"
Cũng chỉ bvr: **greedy submodular top-k** — mỗi bước chọn issue mở khóa nhiều nhất các downstream *chưa* được mở bởi các lựa chọn trước (marginal, không double-count); **what-if** mô phỏng hoàn thành X → direct unblocks, transitive unblocks (delta actionable), ngày tiết kiệm, cycle bị phá; `plan.rs` phân rã open issues thành **connected component = track song song** ([greedy-topk-unblock-and-whatif](../sources/beads-viewer-rust.md#greedy-topk-unblock-and-whatif)).

### Đọc ra
Tầng 1–2 là **nghĩa vụ của store** (đúng đắn, tất định, test được); tầng 3–4 là **bộ não khuyến nghị** (có trọng số, có preset, có giải thích — người/orchestrator quyết cuối). Tách hai nhóm này đúng như bvr tách khỏi bd: tracker không cần biết PageRank, viewer không được quyền claim. Với forgent: tầng 4 chính là hàm mục tiêu của reactive fan-out — "fan ra việc gì để tối đa hóa việc-sẵn-sàng kế tiếp" là đúng nghĩa greedy-unblock.

---

## §5 — Xếp việc: từ thứ tự lấy việc đến năng lực chịu tải

Ba mảnh bổ nhau, không nguồn nào trùm:

1. **Thứ tự trong hàng đợi** — hợp đồng FIFO-trong-priority của bd + tie-break tất định của br (§4 tầng 2). Đây là "xếp việc" ở nghĩa hẹp nhất và là mảnh bắt buộc trước khi có swarm.
2. **Cấu trúc song song** — bvr `plan.rs`: connected components của đồ thị open-issues = các track độc lập chạy song song không tranh chấp; kết hợp critical-path/slack metrics (analysis layer) cho biết track nào dài nhất. hn góp mặt phẳng thời gian thô hơn: PHASE docs xếp stories "theo dependency order" ([phase-documents-benchmark-deltas](../sources/repository-harness.md#phase-documents-benchmark-deltas)).
3. **Năng lực chịu tải** — br một mình một chiếu: **swarm capacity-planning report** (`br.swarm-capacity-report.v1`) phát "agent bands" green/yellow/red từ số đo thật (count/sync-status/doctor) + guidance fallback cho laptop/VM nhỏ; kèm runbook tuning lock-timeout theo profile (probe 1000ms / default / bulk 60000ms) ([scheduler-swarm-planning](../sources/beads-rust.md#scheduler-swarm-planning)). Xếp việc không chỉ là "việc nào trước" mà còn "host này chịu được mấy agent" — mảnh thực dụng cho fleet không người trông.

Thời gian hóa lịch: bvr **forecast ETA** = median lịch sử × hệ số phức tạp (loại × độ sâu × độ dài mô tả) × velocity-per-label (30 ngày trượt, **lấy label chậm nhất — bi quan có chủ đích**) + ngày chờ blocker, kèm biên tin cậy; economics tính estimate coverage, throughput window, burn rate ([forecast-eta-pipeline](../sources/beads-viewer-rust.md#forecast-eta-pipeline)) — "khi nào xong / tốn bao nhiêu" dựng từ chính đồ thị việc, không cần tool PM ngoài.

---

## §6 — Hỗ trợ planning: ba trường phái

### hn — plan là tài liệu falsifiable
PHASE-N.md khai báo target maturity delta, stories theo dependency order, **và expected benchmark deltas trước khi làm** ("compliance 74% → 85-90%"); friction từ benchmark quay lại thành decision record ([phase-documents-benchmark-deltas](../sources/repository-harness.md#phase-documents-benchmark-deltas)). Plan có tiêu chí đo trước → kết quả đối chiếu được, không tự phán. Cùng gene predicted→actual với compound-learning của forgent.

### bd — plan là instantiation: formula → molecule
Plan không phải document mà là **template thực thi được**: formula (TOML: steps, variables, deps) instantiate thành molecule — tập bead thật trong đồ thị, chạy đến đâu thấy đến đó bằng chính `bd ready`; xong thì squash/burn (compaction có chủ đích) ([formula-molecule-lifecycle](../sources/beads.md#formula-molecule-lifecycle)). Gate-bead cho phép plan chứa điểm-chờ-sự-kiện (PR merged, CI xong, người duyệt) như node hạng nhất — plan bất đồng bộ tự nhiên.

### bvr — plan là mô phỏng trên dữ liệu
What-if ("nếu xong X thì mở khóa gì, tiết kiệm mấy ngày"), top-k unblock ("k việc nào đáng dồn lực"), parallel tracks ("chia mấy mũi"), forecast/economics ("bao giờ, bao nhiêu"), drift ("plan cũ còn khớp thực địa không") — toàn bộ là **decision support trước khi cam kết**, không đụng tracker.

### Đọc ra
Ba trường phái trả lời ba câu khác nhau: hn — *plan này thành công không?* (đo được); bd — *plan này chạy thế nào?* (thực thi được); bvr — *plan nào đáng chọn?* (mô phỏng được). Lifecycle bán-tự-động của fgOS (base-workflow: init/làm rõ/chia việc/thực thi/compound-learn) cần cả ba: bvr-style simulation ở bước *chia việc*, bd-style instantiation ở bước *thực thi*, hn-style expected-deltas ở bước *compound-learn*.

---

## §7 — Hỗ trợ agent execution & coordination

### Danh tính và quyền: ai đang làm?
- bd: danh tính agent lấy từ **môi trường** (git config `beads.role`, SSH heuristic) thay vì khai báo trong prompt — chống giả mạo rẻ; agent signing để execution trail audit được; contributor namespace isolation (ID prefix riêng) ([multiagent-routing-and-slots](../sources/beads.md#multiagent-routing-and-slots)).
- hn: quyền gắn vào **danh tính lệnh**, không vào lời hứa caller — `Cli::mutates_state()` phân loại tập trung, nuôi cả epoch fence lẫn SQL read-only ([mutates-state-command-gate](../sources/repository-harness.md#mutates-state-command-gate)).

### Tranh chấp việc: claim, lease, CAS
- bd: **atomic claim + lease TTL + heartbeat** — worker giữ việc phải chứng minh còn sống; merge slots cho điểm hẹp.
- hn: **compare-and-set** — `story update --expected-status` so trạng thái trong cùng write transaction, lệch → CONFLICT exit 3, không ghi gì; `implemented` chỉ có **một cửa vào** (`story complete` — fresh proof + closure trong 1 transaction, `story update --status implemented` bị reject) ([story-status-single-door](../sources/repository-harness.md#story-status-single-door), [story-complete-atomic](../sources/repository-harness.md#story-complete-atomic)).
- br: hai primitive lock **khác ngữ nghĩa** — `.write.lock` blocking exclusive (serialize mọi mutation, timeout 30s) vs `.sync.lock` advisory try-and-yield; trên nữa là retry `BEGIN IMMEDIATE` 8 lần **exponential backoff + ±25% jitter** (tắt busy-wait native vì hot-spin 100% CPU) — chống thundering herd khi swarm tranh cùng store; mid-mutation DB hỏng → rebuild từ JSONL rồi chạy lại closure ([two-tier-locking-app-backoff](../sources/beads-rust.md#two-tier-locking-app-backoff)).

### Việc bị bỏ rơi: reclaim cần bằng chứng, không cướp nhầm
br `coordination status` là **bộ phân loại bằng-chứng thuần đọc**: ngưỡng stale/abandoned theo *loại chủ* (swarm-agent 120'/480', human 1440'/4320' — người được chờ lâu hơn máy); nguyên tắc lõi *"Missing Agent Mail data is explicit evidence, not proof of abandonment"*; **không bao giờ auto-reclaim** — emit envelope `br.coordination.v1` với `reclaim_allowed_by_policy` + `suggested_commands`, và lệnh đầu tiên của mọi reclaim luôn là **audit comment**; incident chuẩn hóa append vào `.beads/interactions.jsonl` với `snapshot_hash` — flight recorder content-addressed ([coordination-evidence-classifier](../sources/beads-rust.md#coordination-evidence-classifier)). Tách *phân loại* (pure, no I/O) khỏi *hành động* (human-gated) là mảnh advisory mà mọi hệ claim cơ học (kể cả beehive) còn thiếu.

### Ranh giới hệ-với-hệ: contract, không phải chung DB
- hn: **orchestration protocol v1** — discovery trước mutation (`query contract --json`, không auto-init), mỗi lệnh in đúng 1 JSON envelope, exit codes cố định 0/2/3/4/5, *"branch on error code, never on message"*, mutation timeout = unknown outcome → rediscover trước khi retry; next-action của orchestrator ngoài là **bảng quyết định dữ liệu** trong contract, không phải router code ([orchestration-protocol-v1](../sources/repository-harness.md#orchestration-protocol-v1), [protocol-next-action-table](../sources/repository-harness.md#protocol-next-action-table)).
- bd/bvr: agent **cấm đường interactive** — `--json` bắt buộc, `bvr` trần mở TUI là block session; bvr thêm `data_hash` để agent poll rẻ ([agent-first-cli-contract](../sources/beads.md#agent-first-cli-contract), [robot-mode-envelope](../sources/beads-viewer-rust.md#robot-mode-envelope)).
- Ergonomics phiên: bd `close` không cần id — marker "last-touched" là ngữ cảnh ngầm của session ([close-last-touched](../sources/beads.md#close-last-touched)).

### Bốn trường phái coordination (bổ sung, không thay nhau)
1. **Lock tại filesystem** — beehive: O_EXCL claim + TTL/heartbeat + hold per-path (cùng checkout).
2. **Điều phối tại store** — bd: multi-writer DB all-on-main + atomic claim + merge slot + namespace.
3. **Cô lập cây** — symphony: worktree riêng + changeset về sau (ngoài scope dive này).
4. **Message-passing** — bvr: MCP Agent Mail giữa agent cùng repo ([mcp-agent-mail-coordination](../sources/beads-viewer-rust.md#mcp-agent-mail-coordination)).

Và xuyên-repo: bd chọn **federation thật** (Dolt remotes, SyncOrchestrator, sovereignty tiers) — đồng bộ dữ liệu; br chọn **routing thuần địa chỉ** (`routes.jsonl` prefix→path, acquire lock của workspace đích, "never runs git, never network") — dispatch không đồng bộ ([federation-topologies](../sources/beads.md#federation-topologies), [cross-project-routing](../sources/beads-rust.md#cross-project-routing)). Cùng nhu cầu multi-project, hai mức cam kết rất khác nhau về độ xâm lấn.

---

## §8 — Case walk-through: 1 dev, N feature song song, feature chạm cùng file

Tổng hợp §2/§4/§5/§7 thành flow cụ thể. Kịch bản: 1 developer, 1 project, feature A/B/C chạy song song, A và B cùng đụng `services/billing.ts`.

### Hai mặt phẳng xung đột — đừng gộp

Khác biệt bốn nguồn nằm ở mặt phẳng **work-store** (§1); còn ở mặt phẳng **code-file**, cả bốn — kể cả bd với Dolt — quy về một công thức hai nước: **phân hoạch được thì phân hoạch lúc plan; phần không phân hoạch được thì tuần tự hóa tại một cửa merge.** Dolt merge được *đồ thị việc*, không merge được *source code* — bd cũng chỉ có agent-trên-branch + **merge slot** (một cửa tuần tự tại điểm tích hợp). Khác biệt thật là *thời điểm* xử xung đột: hn/beehive xử **sớm** (plan-time, scope rời nhau trước khi chạy), bd xử **muộn** (cho hết vào đồ thị, claim atomic từng bead, dồn về cửa merge), br **né** (serialize mọi write).

### Flow 5 bước: song song tối đa, xung đột tối thiểu

1. **Plan từng feature, tách việc theo đường ranh FILE/MODULE — không theo đường ranh feature.** Mỗi task **khai footprint file lúc tạo** (beehive cell `--files`, hn story scope; bd *không có* trường này — điểm yếu thật của bd cho bài code-conflict). Footprint khai trước là nguyên liệu của mọi bước sau.
2. **Giao footprint chéo các feature — nước đi quyết định cả ván.** Với mỗi file bị ≥2 feature đụng, theo thứ tự ưu tiên: **(a) hoist** phần chung thành task upstream riêng (cả A lẫn B khai `blocks` dep vào nó) — **xung đột biến thành dependency**, phép biến hình quan trọng nhất corpus, và là thứ đồ thị 10-dep-type của bd diễn đạt tự nhiên nhất; **(b) sequence** — task-A-billing `blocks` task-B-billing, chọn chiều theo cái nào mở khóa nhiều downstream hơn (bvr what-if); **(c) re-slice** — overlap đôi khi là dấu hiệu chia việc sai, cắt lại ranh giới (kể cả thêm task chuẩn bị tách module).
3. **Dựng đồ thị xong mới biết song song thật là bao nhiêu.** Connected components (bvr `plan.rs`): C không đụng file chung → component riêng → track an toàn tuyệt đối; A và B cùng component nhưng phần xung đột đã thành edge — phần còn lại vẫn song song được. Đồ thị nói thật mức song song khả thi, đừng tin "3 feature = 3 luồng". Greedy top-k → task hoist ở (a) luôn đi sớm nhất vì mở khóa cả hai nhánh.
4. **Dispatch: ready dẫn xuất + claim atomic + enforce footprint lúc chạy.** Hai chế độ: *cùng checkout* (beehive) — reserve file trước khi ghi, đụng → `[BLOCKED]`, xung đột lộ ngay lúc chạm, chi phí giải thấp nhất; *worktree cô lập* (hn/symphony) — không có xung đột sống nhưng xung đột **hoãn về merge**, rẻ lúc chạy, đắt lúc tích hợp nếu bước 2 làm ẩu.
5. **Tích hợp tuần tự qua một cửa, re-verify sau từng merge.** Merge slot: mỗi lần một nhánh; merge xong chạy lại verify của các task đã đóng *trên trạng thái sau merge* (hn `verify-all` sweep — bắt "capped nhưng nay fail").

### Taxonomy xung đột và cách giải

| Tình huống | Lộ ra khi nào | Giải |
|---|---|---|
| Biết trước lúc plan (A, B cùng khai `billing.ts`) | Bước 2 | Hoist / sequence / re-slice — thành dependency, không bao giờ thành sự cố |
| Đụng lúc chạy, cùng checkout | Reservation deny | `[BLOCKED]`, orchestrator re-scope hoặc đổi thứ tự — không "ghi đại" |
| Git conflict lúc merge (footprint khai sót, worktree) | Merge slot | Tuần tự hóa + resolve tay; footprint-khai-thiếu là friction → backlog |
| **Xung đột ngữ nghĩa — nguy hiểm nhất:** hai nhánh xanh cô lập, merge sạch git, nhưng sai *cùng nhau* | Chỉ lộ ở integrated verify | Đúng critical-pattern forgent đã trả học phí ("hai cell xanh-cô-lập lệch hợp đồng"): validating kiểm **hợp-đồng-gộp** giữa task cùng chạm một cấu trúc; merge xong verify tổng thể, không cộng dồn kết quả cô lập |
| Phát hiện giữa chừng (làm A lòi ra phải sửa file B đang giữ) | Mid-flight | Không sửa vòng qua guard: node mới + edge `discovered-from` (bd) / task mới + BLOCKED (beehive) → orchestrator xếp lại — phát hiện là *dữ liệu đồ thị*, không phải cớ phá phân hoạch |

### Vị trí của bd trong flow này

bd không chia việc độc lập trước — cho mọi thứ vào đồ thị rồi dựa vào claim atomic + lease TTL + merge slot. Với *work-store* bd đã giải multi-writer bằng Dolt; với *code* bd đứng cùng thuyền mọi người: footprint không giao nhau, hoặc xếp hàng ở cửa merge. Cái bd cho thêm mà hn/beehive thiếu: **ngôn ngữ đồ thị đủ giàu để mã hóa kết quả bước 2** (`blocks`, `conditional-blocks`, `waits-for`, `discovered-from`) — phân hoạch và tuần tự hóa thành *dữ liệu query được* thay vì quyết định nằm trong đầu orchestrator.

**Đúc kết:** song song tối đa không mua bằng lock tốt hơn mà bằng **decomposition tốt hơn** — khai footprint lúc tạo task, biến overlap thành dependency lúc plan, để connected-components quyết định số luồng, enforce bằng reservation/worktree lúc chạy, phần còn sót dồn về một cửa merge có re-verify.

### Ai đang giải bài này tốt nhất — chấm theo từng bước

| Bước của flow | Ai tốt nhất | Vì sao / thiếu gì |
|---|---|---|
| 1. Khai footprint | **beehive** (duy nhất) | cell `--files`; hn chỉ scope quy ước, bd không có trường, bvr chỉ đọc |
| 2. Overlap → dependency | **bd có ngôn ngữ, không ai có mắt** | 10 dep-type diễn đạt đẹp nhất, nhưng issue không mang footprint nên bd không *phát hiện* được overlap — chỉ chở quyết định orchestrator nghĩ sẵn |
| 3. Mức song song thật | **bvr** (một mình) | connected components + top-k + what-if; nhưng chỉ nhìn đồ thị task, không nhìn file, không enforce |
| 4. Enforce lúc chạy | **beehive** | reservation deny cơ học + cross-session claim/hold + lane |
| 5. Tích hợp + re-verify | **hn/symphony** | worktree + changeset + CAS + `verify-all` sweep bắt "đã đóng nhưng nay fail" |

Nếu buộc gọi tên một hệ cho đúng kịch bản này *hôm nay*: **beehive** — hệ duy nhất đóng mặt phẳng nguy hiểm thật (code-file conflict) bằng cơ chế thay vì quy ước, cộng validating kiểm hợp-đồng-gộp đúng thuốc cho loại xung đột đắt nhất (ngữ nghĩa, xanh-cô-lập). Nhưng beehive thắng bằng **an toàn**, không phải **song song**: thiếu hẳn tầng 3–4 (§4), ít xung đột một phần vì fan-out dè dặt. br gần như đứng ngoài (chọn serialize); đóng góp của nó ở tầng chịu-contention + advisory-evidence.

**Khoảng trống chung — và là cơ hội của forgent:** bước 2 (giao footprint chéo các feature để tự phát hiện overlap và đề xuất hoist/sequence) **không nguồn nào làm**. Nguyên liệu tồn tại rời rạc: beehive *có dữ liệu* (footprint), bvr *có não* (graph analysis), bd *có ngôn ngữ* (dep types) — không ai ghép thành "đưa N feature vào, nhận về đồ thị task đã phân hoạch + số track song song + điểm phải tuần tự". Fan-out planner của fgOS làm đúng một việc này — intersect footprint lúc plan, đề xuất hoist/sequence, để reservation bắt phần khai sót — là đứng trên cả bốn nguồn ở đúng bài toán multi-agent parallel cần nhất.

### Song song đáng gờm không cần multi-write: số học và ba trần thật

Bộ đồ nghề góp nhặt ở trên có tạo được song song đáng gờm mà không cần multi-write store? **Có — chứng minh bằng số học, không phải niềm tin.**

**Số học của store:** một agent làm một cell 5–30 phút; mỗi cell chạm store ~3–5 lần ghi (claim, verify record, cap), mỗi lần vài ms. Hai mươi agent song song → tần suất ghi vẫn **dưới một lần/phút** — một điểm append tuần tự xử lý dư sức. bd cần multi-write vì store của họ chở *giao tiếp* (heartbeat, message/gate/memory-bead — hàng nghìn write nhỏ liên tục); store chỉ ghi *kết quả* thì single-writer không bao giờ là nút thắt — chính là điều kiện (c) §1 ở dạng định lượng.

**Mỗi món nâng một trần khác nhau:** độ rộng (bao nhiêu track) ← intersection planner + components, phân hoạch tính bằng máy thay vì phán đoán dè dặt — trần beehive đang thấp nhất, món lời nhất; độ bền dòng chảy (ready-set không cạn) ← greedy top-k, xong một việc nở ra nhiều việc sẵn-sàng; lấy việc an toàn tốc độ cao ← ordering contract + atomic claim; mặt phẳng code ← reservation + hoist-thành-dependency.

**Ba trần thật còn lại (không phải store):**
1. **Gate người — trần cứng nhất, multi-write không giải được.** Thuốc: async-human-gate (việc chờ người = node đậu-chờ, track khác chạy tiếp) + gate-bypass lane thấp. Trần này quyết song song thực tế nhiều hơn mọi thứ về store.
2. **Cửa merge tuần tự — Amdahl.** Phần tuần tự = merge + integrated re-verify; giữ nó ngắn so với thời gian làm việc (cell nhỏ, verify nhanh) thì 10–20 track vẫn thoát; verify 10 phút/merge thì trần sập bất kể store gì.
3. **Độ chính xác khai footprint** — lưới 1 chỉ tốt bằng lời khai; vòng predicted-vs-actual làm nó tự tốt lên.

**Công thức:** song song đáng gờm = **rộng lúc plan × dày ready-set × claim rẻ × store tuần-tự-nhưng-nhanh × cửa merge ngắn** — không biến nào cần multi-write. Multi-write chỉ cần khi biến store thành kênh chat giữa agent (đã quyết không làm). Trần cần canh là gate người và cửa merge — một cái giải bằng async-human-gate, một cái bằng kỷ luật cell nhỏ + verify nhanh.

### Lý thuyết nền: plan không tự-chứa, và ba lưới an toàn

Phát biểu tổng quát của bước 2: **muốn giải xung đột lúc plan thì mỗi plan phải được xem xét trên chính các plan khác đang sống.** Ba hệ quả + một giới hạn:

1. **Plan không còn là artifact tự-chứa.** Tính hợp lệ của một plan là thuộc tính của *portfolio* (tập plan đang mở), không phải của feature. Hệ quả kỹ thuật: hai plan văn xuôi không intersect được — footprint phải là **dữ liệu so được bằng máy**. Đây là lý do sâu vì sao cell `--files` của beehive quan trọng hơn vẻ ngoài: nó biến plan thành thứ giao nhau được.
2. **Phép giao là việc của một chỗ ngồi.** N plan xem xét pairwise = N² cuộc thương lượng không trọng tài; thực tế mọi nguồn quy về **một orchestrator giữ decide-altitude** làm phép fold trên toàn portfolio — admission control kiểu scheduler: plan mới qua phép giao, ra một trong ba kết quả (song song / bị sequence / re-slice). Không phải plan "nhìn nhau" — **một chỗ nhìn tất cả**.
3. **Xem xét chéo là sự kiện lặp, không phải bước duyệt một lần.** Plan đổi giữa chừng (`discovered-from` là bằng chứng) → phép giao chạy lại mỗi khi có task mới / footprint mutation — gắn với *transition* của đồ thị việc, khớp mô hình capture-bám-transition fgOS đã chốt.

**Giới hạn — vì sao plan-time không bao giờ đủ:** footprint lúc plan là *dự đoán*, lúc chạy là *sự thật*. Lý thuyết đầy đủ là **ba lưới an toàn**, độ chắc chắn giảm dần, chi phí tăng dần:

| Lưới | Bắt loại xung đột | Tính chất |
|---|---|---|
| 1. Plan-time intersection | Dự đoán được | Rẻ nhất, sớm nhất; chỉ đúng bằng độ chính xác lời khai |
| 2. Runtime reservation | Thực tế (footprint drift khỏi lời khai) | Đỡ phần khai sót |
| 3. Merge-time integrated verify | Ngữ nghĩa (xanh cô lập, sai cùng nhau) | Hai lưới trên mù; đắt nhất |

Vế đảo là lựa chọn của bd: *không* intersect lúc plan, trả toàn bộ chi phí ở lưới 2–3. **Chi phí xung đột là đại lượng bảo toàn** — không xóa được, chỉ chọn trả lúc nào: plan-time là nơi *phát hiện* rẻ nhất, merge-time là nơi *giải quyết* đắt nhất.

**Mảnh thưởng chưa nguồn nào khai thác:** beehive bắt cap nộp `--files` *thực tế* → hệ có sẵn cả dự-đoán (plan) lẫn sự-thật (cap) → **độ chính xác khai footprint đo được** (predicted vs actual). Đó là vòng compound-learning tự nhiên cho lưới 1: orchestrator học "loại việc nào hay khai sót file gì", lưới 1 tự tốt lên thay vì đứng yên — phần mở rộng trực tiếp của khoảng trống bước 2, cùng gene predicted→actual của distill outcome-loop.

---

## §9 — Mở rộng tỷ lệ: giao tiếp agent, hub đa-project, đa-máy, sync store

### Bốn khe giao tiếp của một agent — "listen" được cài ở đâu

Agent không phải process lắng nghe socket; nó là vòng lặp `prompt → tool call → kết quả → …`. LLM chỉ "nghe" được ở đúng bốn khe, và mọi cơ chế intercommunication trong corpus là biến thể của chúng:

1. **Prompt ban đầu** — không chở hội thoại, chở *giao thức*: "trước claim check mailbox, khi BLOCKED báo orchestrator". Prompt là nơi **cài lịch nghe**, không phải kênh chat.
2. **Kết quả tool call (pull)** — kênh phổ biến nhất: MCP Agent Mail của bvr là **polling trá hình** (agent chỉ thấy mail khi *nó chọn* check, thời điểm quy định trong AGENTS.md); message/gate-bead của bd là query store; **refusal-as-message** của beehive (reservation deny trả về "file của worker X tới hh:mm") là kênh giao tiếp ngầm hiệu quả nhất mà không ai gọi là chat.
3. **Harness injection (push thật)** — chỉ ai sở hữu vòng lặp mới làm được: harness nhét message vào turn boundary kế tiếp (SendMessage giữa teammate). **fgOS đang xây harness nghĩa là fgOS nắm khe 3** — thứ bd/bvr (CLI/MCP đứng ngoài vòng lặp) không bao giờ chạm; họ buộc dùng khe 2, fgOS được chọn cả hai.
4. **Ranh giới vòng đời (spawn/return)** — dispatch prompt đi, status token về; kênh chính của beehive hiện tại.

Thiết kế fgOS: "listen" = check-cài-ở-chokepoint (khe 2, signal pub-sub file hiện tại) + injection khi cần realtime (khe 3, lợi thế platform). Quyết định "store không phải kênh chat" nguyên vẹn: message transport là kênh riêng, chỉ *kết quả* ghi vào work-store.

### Hub đa-project: tách mặt phẳng chú ý khỏi mặt phẳng làm việc

1 người × N project × M máy không cần *dữ liệu* tập trung — cần **điểm-cần-chú-ý** tập trung: gate chờ duyệt, câu hỏi treo, việc blocked (chính là node đậu-chờ của async-human-gate, gom về một inbox). Ba tầng, truth không rời chỗ:

1. **Store per-project = truth** (sovereignty, bài br routes) — không đồng bộ store với store → không có multi-master.
2. **Hub = read-model + inbox, không phải store thứ hai.** Mỗi project export attention-envelope (`gate-opened/question-raised/blocked/capped`, versioned, project-id + node-id) từ chính emission wrap ở dispatcher — thêm một sink là xong. Hub thuần derived: mất hub rebuild từ các project. Đúng quan hệ bvr↔beads nâng lên tỷ lệ multi-project.
3. **Đường trả lời một cửa có provenance**: duyệt gate ở hub → answer event về đúng project store qua single door, ghi "answered-via-hub". Mỗi câu trả lời đích danh một project.

Chat/planning tập trung là mặt *client* (cockpit nối N project), không phải mặt store. Federation kiểu bd chỉ khi có dependency xuyên-project thật — ngưỡng còn xa.

### Đa-máy trong MỘT project: máy = worker cỡ lớn

Nỗi sợ distributed-locking tan biến nhờ quyết định có sẵn: **worker không tự chọn việc — orchestrator giao** (critical rule 3). Không có cạnh tranh claim thì không cần khóa phân tán. Kỷ luật:

- **Giao nguyên connected-component cho mỗi máy** (flow §8 nâng một nấc); claims/reservations hạt mịn thuần local từng máy. Hệ quả trung thực: **số máy hữu ích = số track độc lập** — trần là cấu trúc đồ thị, không phải phần cứng; intersection planner trả lời "có đáng bật máy thứ hai" trước khi bật.
- Ba lý do thật cần 2 máy, ba cơ chế: compute → chia component; environment (GPU/macOS vs Linux) → **capability tag** trên máy + doctor preflight (gene tool-registry hn); availability (laptop↔server) → không phải song song mà là **migration**: HANDOFF + git push + máy kia adopt.
- Store thêm đúng ba trường: **assignee + lease TTL** trên cell (máy chết → evidence classifier kiểu br đề xuất reassign, audit-comment-first, không auto-cướp — món #12 lộ trình), capability tag, attention envelope.
- **Cấm duy nhất:** chia sẻ claim/reservation hạt-mịn xuyên máy qua git sync — async sync có race window không vá được bằng kỷ luật. Hạt-mịn sống trong một máy; xuyên-máy chỉ hạt-thô (component assignment) do một chỗ ngồi quyết. Hai máy "cần" cùng cày một component → tín hiệu re-slice (§8 bước 2), không phải tín hiệu dựng distributed lock.

### Sync store giữa máy: kiểu harness — sync log, không sync state

Đồng bộ *snapshot state* qua git là tự sát (hai máy cập nhật cùng file trạng thái → conflict không resolve nổi). Hai vật lý merge khác hẳn: **append-only log merge = union** (per-machine log file → conflict = 0); **state snapshot merge = địa ngục** (phép hòa đúng duy nhất là replay lịch sử — tức quay về log). Phân loại store hiện tại:

| Dữ liệu | Vật lý | Sync 2 máy |
|---|---|---|
| decisions/capture/attention/cap events (jsonl) | Log sẵn | Sync thẳng; per-machine file nếu muốn zero-conflict |
| Cell files | State nhưng partition theo assignee | Chỉ assignee ghi → không conflict *nhờ kỷ luật giao việc* |
| `state.json`, counters, backlog toàn cục | State không partition được | **Chỗ duy nhất bắt buộc kiểu harness**: derived-from-events (fold trên log) hoặc single-owner (orchestrator ghi) |

Bê nguyên từ harness: `content_sha256` per event (idempotent replay, phát hiện cùng-ID-khác-nội-dung), event full-record, `rebuild` từ log. **Điều kiện tiên quyết đã vô tình xây xong**: decision b0da87aa chốt emission wrap tại dispatcher — mọi mutation qua một cửa, viết thêm một dòng event tại đó = changeset gần miễn phí. (Trường phái kia: br snapshot + `beads.base.jsonl` 3-way merge — hợp khi snapshot là interchange cho hệ ngoài; mình own cả hai đầu + có chokepoint → chọn harness.)

### Thứ tự event khi merge lệch thời điểm: fold order tất định, không phải arrival order

Ca hỏi: event sinh-trước ở máy A nhưng merge *sau* khi máy B đã merge. **Thứ tự merge không được phép có ý nghĩa** — log trong git là một *tập* event; state = fold trên tập, fold sort theo khóa tất định trước khi chạy. Bốn luật:

1. Event mang đủ khóa: sha (dedup), wall ts, machine-id, seq per-máy; per-machine log file giữ nguyên thứ tự cục bộ (quan hệ nhân-quả chặt duy nhất).
2. **Fold order = sort `(ts, machine-id, seq)`** — mọi máy có cùng tập event fold ra cùng state, bất kể lịch sử merge. Đến-muộn chỉ nghĩa là "state tạm thiếu event"; rebuild-sau-mỗi-merge xử lý. Clock lệch: tải phút-cách-phút thì wall-clock + tiebreak đủ, chưa cần logical clock.
3. Partition triệt gần hết ca nguy hiểm: cùng-record chỉ một máy ghi tại một thời điểm; chuỗi cùng-record xuyên máy chỉ ở reassign — đi qua orchestrator nên tự serialize nhân-quả (event giao-lại happens-after bằng chứng lease hết).
4. Ca sót (hai máy cùng ghi một record — kỷ luật vỡ, lease bug): **nổi lên, không nuốt im** — event chuyển-trạng-thái mang `prev_sha`/`expected_state` (CAS của harness kiểm *lúc replay*); precondition lệch → **anomaly queue** cho orchestrator/người, tuyệt đối không last-write-wins trên state transition. Cùng gene học phí Phase 3: fold phải *merge*, không *replace*.

---

## So sánh tổng hợp

| Trục | repository-harness | beads (bd) | beads-rust (br) | beads-viewer-rust (bvr) |
|---|---|---|---|---|
| Truth trong git | DB gitignored + **changeset JSONL committed**, rebuild từ log | **Rời JSONL-truth** → Dolt-as-truth, JSONL export-only | **JSONL git-tracked là truth**, SQLite là working store + base-snapshot 3-way | Không sở hữu; đọc + `data_hash` |
| Unit model | Story packet giàu contract, ceremony theo lane | Bead gầy + 10 dep types; workflow/gate/message đều là bead | Classic bead + gate/ready-rule là **policy data** | Không tạo unit; phân tích unit |
| Triage intake | ✓ mạnh nhất: risk flags + hard gates + lane, ghi durable trước | ✗ (priority tự khai) | ~ lint template | ✗ |
| Triage backlog | ~ friction backlog | ✗ | ✗ | ✓ duy nhất: impact 8 thành phần + suggest có cap + drift |
| Eligibility | runnable predicate, cấm consumer suy lại | `bd ready`, cycle-check đồ thị hợp nhất | ready = policy config | (đọc actionable từ store) |
| Ordering | dependency order trong PHASE docs | **FIFO-trong-priority pin bằng protocol test** | scheduler tất định, schema versioned + capacity bands | connected components = parallel tracks |
| Ranking/portfolio | ✗ | ✗ | ✗ | ✓ duy nhất: impact score + greedy top-k + what-if |
| Planning | Expected benchmark deltas (falsifiable) | Formula→molecule (executable) | Rollout ladder cho thay đổi hệ | Forecast/economics/what-if (simulation) |
| Claim/tranh chấp | CAS + single-door close atomic | Atomic claim + lease TTL/heartbeat + merge slot | 2-tier lock + jittered backoff + evidence-classifier advisory | Agent Mail (message-passing) |
| Ranh giới hệ ngoài | Protocol v1 (envelope, exit codes, rediscover) | `--json` bắt buộc, cấm interactive | 3 tầng tự-mô-tả + exit-code taxonomy | Robot envelope + data_hash |

## Hội tụ & phân kỳ đáng giá

1. **Hội tụ (×5, mạnh nhất corpus): eligibility là truy vấn dẫn xuất của store.** readyCells (beehive) ↔ runnable (hn) ↔ `bd ready` ↔ br policy-ready ↔ board-precedence (symphony). Kèm hệ quả cả hn lẫn bd cùng rút: consumer không được tự suy lại luật, và cycle phải chặn ở lúc ghi edge.
2. **Hội tụ (×2, mới): ordering phải là hợp đồng test-được.** bd pin FIFO bằng protocol test; br ghi tie-break vào contract versioned. Cả hai đến từ cùng vết thương: thứ tự arbitrary + nhiều agent = dẫm nhau không tái hiện được.
3. **Hội tụ (×2): reclaim đòi bằng chứng.** beehive (TTL-hết VÀ heartbeat-cũ) ↔ br (audit-comment-first, missing-data-không-phải-proof, human chờ lâu hơn máy). br thêm tầng advisory thuần đọc tách khỏi hành động.
4. **Phân kỳ có điều kiện kích hoạt (đắt nhất): JSONL-truth vs versioned-DB-truth.** bd rẽ khi multi-writer thành tải chính; br ở lại khi single-writer + cần git-diff; hn né bằng isolate-then-merge (§1). Không phải khẩu vị — là giả định "coordination sống ở đâu": câu hỏi kích hoạt đúng không phải "bao nhiêu writer" mà là **"agent có giao tiếp qua work-store không"** — chọn kiểu bd thì ngưỡng Dolt đến rất nhanh; giữ kiểu hn/beehive (giao tiếp qua claim/handoff/signal, store chỉ ghi kết quả) thì JSONL-in-git sống rất lâu.
5. **Lỗ hổng chung của cả ba tracker, bvr lấp:** không hệ nào *xếp hạng* hay *chọn tập* — tất cả dừng ở eligibility + ordering. Tầng quyết định (ranking, portfolio, forecast, drift) sống ở một consumer read-only tách biệt. Chính sự tách này là bài học kiến trúc: **store lo đúng-đắn, viewer lo khôn-ngoan** — nâng cấp bộ não chọn việc không đụng transaction path.

## Portable ideas cho forgent

Xếp theo giá trị/chi phí, đối chiếu hướng đã chốt (multi-agent parallel + reactive fan-out; lifecycle bán-tự-động):

1. **Tầng chọn-việc kiểu bvr trên work-graph** — impact score 8 thành phần (đơn giản hóa được: bỏ betweenness nếu đồ thị nhỏ), greedy top-k unblock làm hàm mục tiêu fan-out, connected components làm wave-partition. Đây là mảnh "chọn việc xịn nhất + xếp việc" mà beehive/hn/fgOS đều chưa có; điều kiện tiên quyết duy nhất là dep-graph đã có (cell deps đã có).
2. **Ordering thành hợp đồng test-được** — beehive `claim-next` nên pin thứ tự (priority, created, id) bằng test protocol như bd `r2Less`; rẻ, chặn cả lớp bug "hai phiên thấy hàng đợi khác nhau".
3. **Evidence-classifier advisory cho claim stale** — tầng thuần-đọc kiểu br trên claims/holds hiện có của beehive: phân loại + suggest, không bao giờ tự reclaim; ngưỡng theo loại chủ (human ≫ agent). Khớp nguyên tắc gate-người của fgOS.
4. **Hai nghĩa triage tách bạch trong lifecycle fgOS** — intake-triage (risk/lane, đã có qua mode gate) và backlog-triage (impact/attention, chưa có) là hai stage khác nhau của base-workflow; đừng để một field `priority` gánh cả hai.
5. **`discovered-from` edge cho compound-learning** — capture 2 kênh của fgOS (đã chốt bám transition FSM) nên ghi lineage "làm A lòi ra B" thành edge có ngữ nghĩa thay vì stub text — bd chứng minh nó query được thành topology tri thức.
6. **Giữ luật changeset/JSONL-in-git, ghi rõ điều kiện xem lại** — cặp đối chứng bd/br + phân tích isolate-then-merge (§1) cho điều kiện kích hoạt cụ thể: chỉ xem lại truth-store khi một trong ba tính chất (a) scope rời nhau / (b) điểm ghi chung append tuần tự / (c) store không phải kênh giao tiếp bị vỡ — thường (c) vỡ trước. Ghi điều kiện này vào decision record để khỏi tái tranh luận theo khẩu vị.
7. **What-if + forecast cho gate-người** — ở lifecycle bán-tự-động, câu gate hỏi người nên kèm số kiểu bvr ("làm X mở khóa 7 việc, tiết kiệm ~4 ngày") — gate question có evidence là đúng văn hóa gate-presentation của beehive.
8. **Footprint-intersection planner — chiếm khoảng trống chung (§8).** Ghép ba nguyên liệu đã có sẵn ở ba nguồn: footprint per-task (beehive `--files`) + graph analysis (bvr components/top-k) + dep vocabulary (bd) thành bước plan tự động: intersect footprint N feature → phát hiện overlap → đề xuất hoist/sequence/re-slice → xuất đồ thị task + số track song song. Không nguồn nào làm; là mảnh fan-out planner giá trị nhất cho hướng multi-agent parallel của fgOS (cùng họ #1 nhưng thêm chiều file-plane). Kèm vòng học: đo predicted-vs-actual footprint (plan `--files` vs cap `--files`) để lưới plan-time tự tốt lên (§8 lý thuyết nền).

### Lộ trình lắp ráp tầng graph cơ học: học ai cái gì, thứ tự nào, bỏ gì

"Cơ học" theo nghĩa của corpus: tất định, contract versioned, test được, giải thích bằng số — LLM chỉ đứng trước (khai footprint/dep) hoặc sau (quyết theo khuyến nghị), phần tính ở giữa là thuật toán thuần. Hai tầng máy móc có hai quán quân khác nhau: **tầng đúng-đắn trong store** = hn/bd; **tầng tính-toán trên đồ thị** = bvr một mình một chiếu. Thứ tự lắp cho forgent (đồ thị cell nhỏ — chục node, không phải 10k — nên nhiều máy móc quy-mô của họ là YAGNI):

**Nền store (hn + bd, lắp trước tiên):**
1. Cycle-check ngay lúc insert edge (DFS tại cửa ghi) — chu trình không bao giờ tồn tại trong store (hn).
2. Snapshot toàn đồ thị một-transaction + revision hash — tầng phân tích đọc lát cắt đứng yên (hn).
3. Điều khoản contract "consumer không suy lại luật ready" — một câu, chống drift đa-consumer (hn).
4. Edge có kiểu, tách blocking vs non-blocking — tập tối thiểu: `blocks`, `parent-child`, `waits-for` + `discovered-from`; KHÔNG bê cả 10 loại (bd).
5. Cycle-check trên đồ thị hợp nhất mọi loại blocking edge — bd trả bằng bug thật: check riêng từng loại thì chu trình xuyên phân cấp vô hình.
6. Thứ-tự-lấy-việc pin bằng protocol test (kiểu `r2Less`) cho `claim-next` (bd).

**Não tính toán (bvr, lắp sau khi 1–6 vững, đúng thứ tự):**
7. Connected components — rẻ nhất, giá trị cao nhất: "portfolio có mấy track song song thật". Làm trước mọi thứ khác.
8. Greedy top-k unblock — hàm mục tiêu fan-out (marginal, không đếm trùng).
9. What-if ("xong X mở khóa gì") — evidence cho câu hỏi gate-người.
10. Khung kiến trúc, không phải công thức: lõi graph + module phân tích chỉ-đọc-xuống, mỗi phép tính ghi computed/skipped kèm lý do, output có `data_hash` — toán của bvr là hàng giáo khoa, kỷ luật đóng gói mới là tài sản.

**Kỷ luật vận hành (br, lắp khi swarm thật chạy):**
11. Tie-break tất định ghi vào output contract versioned (kiểu `br.scheduler.v1`).
12. Advisory evidence classifier cho claim stale — thuần đọc trên claims/holds, không bao giờ tự reclaim, ngưỡng human ≫ agent.

**Đã có (beehive, giữ + khai thác):**
13. Footprint `--files` + reservation + cap nộp files thực tế → bật vòng predicted-vs-actual (§8).

Đích: món 13 + 7 + 4 ghép thành footprint-intersection planner (#8 ở trên).

**Cố tình KHÔNG học:**

| Bỏ qua | Vì sao |
|---|---|
| Dolt / federation (bd) | Chỉ cần khi agent giao tiếp qua work-store — điều kiện (c) §1 chưa vỡ |
| PageRank / betweenness / eigenvector / HITS (bvr) | Máy centrality cho đồ thị nghìn node; chục node thì components + top-k đủ |
| Structural-hash cache, size-adaptive config (bvr) | Giải bài 10k–250k node; đồ thị nhỏ tính lại còn nhanh hơn quản cache |
| Forecast / economics (bvr) | Cần lịch sử velocity đủ dày — chưa có dữ liệu thì công thức sinh số ảo |
| TOON, Agent Mail, jittered backoff (br/bvr) | Đúng thuốc cho bệnh chưa mắc (token-loop dài, message-passing, contention storm) |

Một câu: **nền hn+bd trước (edge có kiểu + cycle-check tại cửa + snapshot có hash + ordering có test), rồi não bvr theo thứ tự components → top-k → what-if, bọc kỷ luật contract của br, cắm vào footprint beehive đã có sẵn.**

### Chuẩn thực thi cho tầng mjs: single-CLI + 5 kỷ luật, không hexagon (decision b0da87aa)

Câu hỏi "mjs có bó không, có nên đổi Rust/Go, có nên ép hexagonal/DTO/service từ đầu" — chốt như sau:

**Ngôn ngữ: giữ Node/mjs.** Sức mạnh cơ chế của cả 4 nguồn đến từ contract + test + determinism, không từ ngôn ngữ (toán là giáo khoa; CAS/cycle-check/revision-hash diễn đạt được mọi ngôn ngữ). Lý do thật họ chọn Rust/Go — phân phối binary, quy mô 10k+ node, type-fence — forgent chỉ thèm cái thứ ba, và nó mua rẻ được: JSDoc types + `tsc --noEmit --checkJs` trong verify gate (zero-build, giữ vendorability). Bằng chứng đắt nhất *chống* đổi sớm nằm trong chính corpus: br/bvr là rewrite của hệ **đã chốt hành vi** (spec-first + reference oracle + conformance fixtures) — forgent đang pha khám phá, đổi lúc spec lỏng là mua độ cứng lúc cần độ dẻo. Bản mjs hôm nay không phải nợ: nó là **oracle tương lai** của cuộc port. Trigger xét lại (một trong ba, trùng khung §1): (a) hành vi chốt — specs đạt rebuild bar; (b) cần single-binary ngoài hệ Node; (c) đồ thị nghìn node / multi-writer thành tải chính.

**Single-CLI một execution path: đồng thuận tuyệt đối 4 nguồn + học phí Phase 3 của chính forgent.** hn `Cli::mutates_state()` một classifier nuôi fence + read-only + protocol; `story complete` một cửa duy nhất; br exit-code taxonomy khả thi vì bề mặt là một CLI; beehive dispatcher đã đúng hình. Wiring / trace / intervention / đóng event-signal đều là hệ quả của choke-point — capture bám transition FSM chỉ trọn vẹn khi mọi transition qua một cửa, và emission wrap ở dispatcher phủ **cả đường thất bại** (critical-pattern 20260715).

**5 kỷ luật thay cho hexagon:**
1. Registry nâng cấp: mỗi command khai `mutates`/`emits` + schema in/out — guard/trace/capture đấu vào phân loại, không vào từng lệnh.
2. Emission wrap tại dispatcher (pre/post + failure path) — một chỗ, phủ hết.
3. **Functional core, imperative shell** — quyết định là hàm thuần, I/O ra mép (br: evidence classifier pure/no-I/O, write_combining ship pure types; bvr: 23 module thuần đọc trên lõi). Test không cần mock; port sau này gần như cơ học. Graph layer mới sinh ra đã thuần.
4. **Parse-first tại biên** (hn): schema-validate một lần ở cửa dispatcher, bên trong tin shape — DTO-as-validated-shape, không DTO class.
5. **Kỷ luật hướng phụ thuộc** (bvr inverse tree): import chỉ xuống, enforce bằng một test.

**Không làm:** DTO/service class nội bộ, port/adapter trong core. Ports-and-adapters chỉ ở đúng biên có nhiều adapter thật: adapter spec đa-runtime (Claude/Gemini/Codex) của fgOS.

**Phần thưởng kép:** registry schema + examples test chạy thật + một execution path = bề mặt CLI *chính là spec* — đến ngày port, conformance fixtures sinh thẳng từ registry examples theo đúng playbook spec-first của bvr.

## Câu hỏi mở

- Ngưỡng "multi-writer thành tải chính" không định lượng được bằng số phiên — tín hiệu đúng là định tính: một trong ba tính chất (a)(b)(c) ở §1 vỡ, thường là (c). Còn mở: có nên đặt guard/metric phát hiện sớm "(c) đang vỡ" (ví dụ: đếm write vào work-store không gắn với cell/claim nào)?
- Impact-score của bvr chưa được validate ngoài dogfood của chính nó; trọng số 0.22/0.20/... là chọn tay. Nếu port, cần vòng feedback accept/reject (kiểu suggestion engine) để tự chỉnh thay vì tin trọng số gốc.
- Gate-as-node (bd) vs gate-as-policy (br) cho async-human-gate của forgent: gate-bead tự nhiên hơn cho pause-chờ-sự-kiện (đúng feature đang mở), nhưng đưa gate vào work-graph nghĩa là ready-query phải hiểu gate semantics — chưa rõ chi phí với cell model hiện tại.
