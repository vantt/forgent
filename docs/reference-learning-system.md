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

1. **Delta** — tính phần mới kể từ con trỏ, theo `type`: git-repo → `scripts/ref-delta.sh <name>` (commit log + changed files; lần đầu → full scan); living-doc → so changelog/version mới; paper → toàn bộ, một lần.
2. **Extract** — đọc phần delta (hoặc toàn bộ nếu lần đầu), phân loại theo taxonomy, thêm/cập nhật entry trong per-source index.
3. **Compare** — tính năng mới hoặc thay đổi đáng kể → cập nhật hàng tương ứng trong comparison matrix.
4. **Decide** — tính năng đáng port → thêm dòng `candidate` vào porting log; không đáng → `rejected` + lý do.
5. **Seal** — bump `last_analyzed_commit` + `last_analyzed_date` lên HEAD vừa phân tích; cập nhật `domains_covered` nếu có domain mới được extract. **Bước này bắt buộc, luôn làm cuối phiên phân tích.**

### Domain backfill (khi taxonomy thêm domain mới)

Thêm domain mới vào taxonomy khiến `last_analyzed_commit` không còn đủ nghĩa — domain đó chưa từng được extract dù con trỏ đã tiến xa. Xử lý:

- `ref-delta.sh` so sánh taxonomy với `domains_covered` của từng project → báo domain thiếu.
- Backfill = quét **cây source tại HEAD** cho riêng domain thiếu (không replay lịch sử — snapshot hiện tại đã là kết quả tích lũy của mọi commit).
- Xong thì thêm domain vào `domains_covered`; con trỏ commit giữ nguyên.
- Replay lịch sử ("họ từng thử X rồi gỡ, vì sao?") chỉ làm opt-in khi có nghi vấn cụ thể, không phải mặc định.

## Taxonomy — các domain cần học

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

## Tự động hóa (spec, triển khai dần)

- **`scripts/ref-delta.sh`** (đã có) — tính delta commit cho bước 1.
- **Skill `ref-scan`** (tương lai) — gói toàn bộ vòng lặp 5 bước: chạy delta → đọc changed files → phân loại theo taxonomy → đề xuất cập nhật 3 artifact → seal commit. Skill nhận arg là tên project, hỗ trợ `--full` để quét lại từ đầu.
- **Thêm nguồn mới** — luôn đi qua intake: thả URL vào `intake.md` (Capture) → khi triage chấp nhận thì tạo `docs/references/sources/<name>.md` đúng `type`, tải bản sao vào `references/<name>/` nếu cần, chạy vòng lặp lần đầu.
