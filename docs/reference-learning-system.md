# Reference Learning System

Hệ thống ghi nhận – so sánh – porting tính năng từ các learning sources: frontier projects (beegog, repository-harness), tài liệu sản phẩm (Claude Code/Codex docs, changelog), papers. Mục tiêu: học liên tục, **incremental theo con trỏ phù hợp từng loại nguồn**, không bỏ lỡ và không làm lại từ đầu.

Phạm vi: hệ thống này chỉ lo **việc học** (extract điều hay). Việc *áp dụng* kiến thức nằm ngoài — porting log là điểm bàn giao.

## Learning lifecycle

```
Capture → Triage → Extract → Compare → Seal
```

- **Capture** — gặp nguồn hay (repo, paper, blog, docs) → thả vào intake queue ngay, không ngắt mạch việc đang làm.
- **Triage** — định kỳ duyệt queue: nguồn nào đáng học, gán `type`, tạo source file. Đây là phán đoán của con người, không tự động hóa.
- **Extract / Compare / Seal** — vòng phân tích incremental (chi tiết bên dưới).

Phân vai: **harness quản lý nhịp** (hiện tại: chạy tay `ref-delta.sh` + skill `ref-scan`; khi nhịp ổn định: cron hoặc session-start hook nhắc "intake có N nguồn chưa triage, source X có delta"). **Con người quản lý chất lượng** (triage, quyết định đáng học/đáng port).

## Kiến trúc artifact

Mỗi artifact có một vai trò và một nguồn sự thật riêng — không trùng lặp trạng thái giữa các file:

| Artifact | Vai trò | Vị trí |
|---|---|---|
| Intake queue | **Capture** — nguồn mới chờ triage | `docs/references/intake.md` |
| Per-source feature index | **Quan sát** — tính năng/ý tưởng của 1 nguồn, ghi con trỏ đã phân tích tới | `docs/references/sources/<name>.md` |
| Comparison matrix | **So sánh** — tính năng nào, nguồn nào có, triển khai ra sao, ai làm hay hơn | `docs/references/comparison-matrix.md` |
| Porting log | **Quyết định** — đã port gì, từ đâu, chưa port gì, từ chối gì và vì sao | `docs/references/porting-log.md` |

## Loại nguồn và con trỏ incremental

| `type` | Con trỏ | Cách delta |
|---|---|---|
| `git-repo` | `last_analyzed_commit` | `git log <last>..HEAD` (scripts/ref-delta.sh) |
| `paper` | `extracted_date` | bất biến — extract một lần, không có delta |
| `living-doc` | `last_analyzed_version` + `last_analyzed_date` | so version/changelog entry mới kể từ lần trước (thủ công hoặc fetch) |

`living-doc` là cách học từ sản phẩm không có source (Claude Code, Codex): theo dõi docs site + changelog theo version.

Nguyên tắc:

- Trạng thái porting **chỉ** nằm trong porting log. Per-source index thuần quan sát, không ghi "đã port".
- Feature ID ổn định, kebab-case. Tham chiếu chéo dạng `<source>:<slug>` (vd `beegog:gate-workflow`, `paper-x:reflexion-loop`).
- Tính năng bị **từ chối port vẫn phải ghi lại kèm lý do** — tránh đánh giá lại lần sau.
- Bản sao nguồn (clone git, PDF paper, snapshot doc) để trong `references/<name>/` (gitignored — URL/commit hash lưu trong docs đủ để lấy lại).

## Schema

### 1. Per-source index — `docs/references/sources/<name>.md`

Frontmatter máy đọc được (cho CLI/skill parse). Trường chung: `name`, `type`, `url`, `domains_covered`. Con trỏ theo `type`:

```yaml
---
name: beegog
type: git-repo
url: https://github.com/vantt/beegog
local: references/beegog
last_analyzed_commit: null   # commit HEAD tại lần phân tích gần nhất
last_analyzed_date: null
domains_covered: []          # domain đã extract; thiếu so với taxonomy → cần backfill
---
```

Paper: thay 2 dòng `last_analyzed_*` bằng `extracted_date` (null = chưa extract). Living-doc: dùng `last_analyzed_version` + `last_analyzed_date`.

Thân file nhóm theo domain (xem taxonomy bên dưới), mỗi tính năng một entry:

```markdown
## <domain>

### <feature-slug>
- **What:** tính năng làm gì, 1–2 câu
- **Where:** đường dẫn file/dir chính trong repo nguồn
- **Notable:** điểm hay / cách tiếp cận đáng học
- **Keywords:** (tùy chọn) từ đồng nghĩa/thuật ngữ nguồn dùng khác taxonomy — để grep bắt được
- **Seen:** <commit ngắn> (commit lần đầu ghi nhận hoặc lần cập nhật gần nhất)
```

### 2. Comparison matrix — `docs/references/comparison-matrix.md`

Mỗi domain một bảng tổng quan (✓ / ✗ / ~), mỗi ô link về entry trong per-project index. Chỉ khi cần so sánh sâu mới thêm subsection deep-dive:

```markdown
## <domain>
| Feature (canonical) | beegog | repository-harness | Best-in-class | Ghi chú |
|---|---|---|---|---|
| gate-workflow | ✓ [→](sources/beegog.md#gate-workflow) | ✗ | beegog | human gates 4 tầng |

### Deep-dive: <canonical-slug> (tùy chọn)
So sánh cách triển khai khi khác biệt đáng kể giữa các project.
```

### 3. Porting log — `docs/references/porting-log.md`

```markdown
| Feature | Nguồn | Status | Đích trong forgent | Commit | Ghi chú / Lý do |
|---|---|---|---|---|---|
| gate-workflow | beegog:gate-workflow | ported | skills/gates/ | abc1234 | adapt: bỏ gate 4 |
```

Status: `candidate` → `planned` → `in-progress` → `ported` / `adapted` (port có sửa) / `rejected` (kèm lý do bắt buộc).

## Vòng Extract → Compare → Seal (incremental)

1. **Delta** — tính phần mới kể từ con trỏ: `ref-scan.mjs delta <name>` (git-repo: commit log + changed files, lần đầu → full scan; paper: một lần; living-doc: in con trỏ đã ghi để agent tự so với changelog/version mới).
2. **Extract** — đọc phần delta (hoặc toàn bộ nếu lần đầu), phân loại theo taxonomy, thêm/cập nhật entry trong per-source index.
3. **Compare** — tính năng mới hoặc thay đổi đáng kể → cập nhật hàng tương ứng trong comparison matrix.
4. **Decide** — tính năng đáng port → thêm dòng `candidate` vào porting log; không đáng → `rejected` + lý do.
5. **Seal** — `ref-scan.mjs seal <name> [--domains ...]`: ghi con trỏ atomic (commit/date/version + `domains_covered`), không sửa tay frontmatter. **Bước này bắt buộc, luôn làm cuối phiên phân tích.** Sau seal chạy `ref-scan.mjs check` để verify (con trỏ resolve được, Where paths tồn tại, matrix anchors đúng, domain thiếu backfill).

### Domain backfill (khi taxonomy thêm domain mới)

Thêm domain mới vào `docs/references/taxonomy.txt` khiến `last_analyzed_commit` không còn đủ nghĩa — domain đó chưa từng được extract dù con trỏ đã tiến xa. Xử lý:

- `ref-scan.mjs delta/check` so sánh taxonomy.txt với `domains_covered` của từng nguồn → báo domain thiếu.
- Backfill = quét **cây source tại HEAD** cho riêng domain thiếu (không replay lịch sử — snapshot hiện tại đã là kết quả tích lũy của mọi commit).
- Xong thì thêm domain vào `domains_covered`; con trỏ commit giữ nguyên.
- Replay lịch sử ("họ từng thử X rồi gỡ, vì sao?") chỉ làm opt-in khi có nghi vấn cụ thể, không phải mặc định.

## Tra cứu related & ngưỡng scaling (quyết định 2026-07-13)

**Quyết định: KHÔNG dùng SQLite/vector/embedding DB ở giai đoạn này.** Corpus index hiện ~10–12k tokens; một lượt đọc trọn bằng model extraction-tier tốn ~1 cent. Hạ tầng search thêm hai nguồn sự thật (markdown + db → drift) và lặp đúng bẫy "schema built ahead of tooling" đã quan sát ở repository-harness.

**Công thức quét related cho agent khi extract (rẻ, không đọc lại hết):**

1. Grep **comparison matrix** trước — mỗi hàng canonical feature chính là cụm "related artifacts" giữa các nguồn.
2. Grep slug/keyword trong `sources/*.md` (`grep -rn <term> docs/references/`).
3. Chỉ đọc đúng các entry match (mỗi entry ~200 tokens), không đọc cả file.

**Chống semantic gap** (nguồn dùng từ khác taxonomy: "file locks" vs "reservations"): thêm dòng `Keywords:` tùy chọn vào entry — không cần embeddings.

**Ngưỡng kích hoạt xét lại** (cơ học, không cảm tính) — chạm một trong hai thì mới bàn:
- corpus index >100k tokens hoặc >8–10 nguồn;
- friction lặp lại có ghi nhận: "quét related nhiều lượt grep vẫn sót".

**Bậc leo thang khi chạm ngưỡng:** SQLite FTS5 (lexical, sinh tự động TỪ markdown — md vẫn là truth, db là cache rebuild được, theo đúng pattern harness-changesets/Beads) → embeddings chỉ khi FTS chứng minh recall vẫn thiếu.

## Impact scoring & deep-dive (quyết định 2026-07-13)

Vì đây là hệ thống học tập, hai cơ chế này là đầu ra quan trọng nhất: score chỉ cho human biết **chỗ nào đáng chú ý**, deep-dive biến chú ý thành **giải pháp tổng hợp**.

**Scoring** — mỗi candidate trong porting log mang `R# E# F#` (Reach / Evidence / Effort, rubric trong skill `extract-rules.md`):
- Chấm **một lần lúc tạo candidate** (context còn nóng — theo bài học `pain-computed-once` của bee: hai lần đọc phải cho cùng thứ hạng). **Không bao giờ batch re-evaluate toàn hệ thống**; re-score một dòng chỉ khi delta scan mang evidence mới (event-driven, gần như miễn phí vì delta vốn đã đọc phần đổi).
- Tổng R×E/F **không lưu** — `ref-scan.mjs rank` derive lúc đọc (derived-never-stored). Độ hợp với roadmap hiện tại cũng không lưu — human phán lúc triage.
- E3 (hội tụ độc lập giữa các nguồn) là tín hiệu mạnh nhất — hai ca đầu tiên đã bắt được: verify-enforced-close (bee ↔ harness), changeset-event-sourcing (harness ↔ beads).

**Deep-dive** — khi human chọn theme để đào sâu (thường là hàng score cao mà các nguồn giải KHÁC nhau): protocol kim tự tháp trong skill `deep-dive-protocol.md` (assemble từ matrix/index → tái dùng inventory reports đã trả tiền → đọc đúng Where paths — không bao giờ re-scan nguồn). Output `docs/references/deep-dives/<topic>.md`, Bottom Line trước, **bắt buộc kết bằng Giải pháp tổng hợp** — ghép cái tốt nhất của từng approach thành design phù hợp bối cảnh mình, nêu rõ lấy gì từ đâu và bỏ gì vì sao. Sau khi port, ghi `Outcome:` vào dòng porting-log (vòng predicted→actual của harness).

## Taxonomy — các domain cần học

Danh sách máy-đọc (nguồn sự thật cho backfill detection): `docs/references/taxonomy.txt`. Định nghĩa chi tiết bên dưới — hai nơi phải khớp tên domain.

- `harness` — vòng lặp agent chính, tool surface, permission model, sandbox
- `skills` — cấu trúc skill, trigger description, progressive disclosure, routing
- `hooks` — lifecycle events (session start, pre/post tool, privacy guard)
- `workflow` — pipeline làm việc, gates, phases, chế độ go/auto
- `orchestration` — subagents, teams, swarm, phân vùng file ownership
- `context-memory` — memory files, compaction, journal, state & resume
- `planning` — cấu trúc plan/phase/report, plan gates
- `quality-gates` — review loops, adversarial verify, evals, TDD-for-skills
- `docs-style` — cách viết tài liệu, 3 facet: **structure** (progressive disclosure, entry point nạp mặc định vs nạp theo nhu cầu, doc cho người tách khỏi doc cho agent), **narrative** (giọng imperative, trigger phrases, token economy, bảng vs prose, ghi "why" để giữ invariant), **doc-types** (AGENTS.md / CLAUDE.md / SKILL.md / spec / plan — vai trò và khuôn mẫu từng loại)
- `tooling` — support CLI, MCP server, structured output
- `config-packaging` — plugin manifest, install flow, versioning, phân phối
- `repo-layout` — folder structure & scaffold: cái gì nằm đâu (state dir vs docs vs skills), gitignore ranh giới nào, naming convention cho agent Grep/Glob được, init/bootstrap flow tạo project mới
- `safety` — privacy hooks, secret handling, allowlists
- `self-improvement` — thu feedback, digest, vòng tự cải tiến
- `ux` — progress display, status protocol, human-in-the-loop UX
- `testing-evals` — cách test hành vi agent, pressure-test skill

Taxonomy mở — thêm domain mới khi gặp, nhưng phải dùng thống nhất ở cả 3 artifact.

## Tự động hóa — skill `ref-scan` (đã triển khai 2026-07-13)

Skill portable tại **`.agents/skills/ref-scan/`** (canonical, agent-neutral; thin wrapper: symlink `.claude/skills/ref-scan`). Gồm SKILL.md (lifecycle + gates), `references/extract-rules.md` (quy tắc extract/matrix/porting), và `scripts/ref-scan.mjs` (Node 18+ zero-dep, thay thế `ref-delta.sh` cũ) với các lệnh:

- `init` — scaffold learning area vào bất kỳ project nào (idempotent, managed gitignore block `REF-SCAN:START/END`)
- `add <name> --type <t> --url <u>` — tạo source file khi triage chấp nhận (bước Triage vẫn là quyết định của người)
- `delta <name>` — bước 1 của vòng lặp, theo type
- `seal <name>` — bước 5, ghi con trỏ atomic
- `check [<name>]` — verify tính nhất quán (cursor, Where paths, matrix anchors, backfill)

Tài liệu này giữ vai trò decision record của forgent; operating manual chi tiết đi theo skill để dùng được ở mọi project.
