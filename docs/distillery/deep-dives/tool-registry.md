---
topic: tool-registry
date: 2026-07-30
based_on: [repository-harness@0a79bbe, beads@777d24b87, symphony@2f0b257, compound-engineering-plugin@32fae6c]
entries: [repository-harness:tool-registry-capability, repository-harness:doctor-preflight, beads:capability-gated-storage-interface, symphony:optional-provider-degrade-ladder, compound-engineering-plugin:bundled-skill-scripts]
---

# Deep-dive: tool-registry

> stale vs repository-harness@0a79bbe (9cc306d→0a79bbe, 2026-08-07) — một health-check THỨ HAI, tách biệt, xuất hiện: crate Rust `harness` mới (khác `harness-cli` được cite ở `doctor-preflight`) tự có `doctor()` riêng (7 check: transaction pending, resolution pending, merge-tool availability, provenance hợp lệ, path-safety từng file quản lý) cho CHÍNH installer/updater engine, không phải cho project-registered tool. Không đụng đến outbound/inbound registry pattern đã cite (đó vẫn là `harness-cli`'s registry) — nhưng nếu re-dive, đáng đối chiếu 2 kiểu "doctor" trong cùng 1 dự án: một cái self-check-cho-chính-harness, một cái registry-cho-tool-ngoài.

**Bottom Line:** repository-harness tách rạch ròi hai chiều — *outbound* (harness's own compiled commands, luôn có) vs *inbound* (project tự đăng ký extra tool: gitnexus/c3/linter — optional, may absent). Cơ chế injection KHÔNG nằm trong code: registry chỉ trả **fact** (`status: present/missing/unknown`), chính **agent** (qua prose contract trong AGENTS.md/doc, không phải compiled logic) đọc fact đó và áp policy. Symphony chứng minh điều này portable — nó KHÔNG viết lại registry, chỉ viết lại policy prose (3-nấc degrade ladder) tái dùng registry của harness. Với fgOS: port một `fgos tool` verb-group tối thiểu (register/check/query, one-door-write qua event-log, không cần SQL riêng), rồi sửa PROSE của fgos-coding-planning/fgos-coding-validating/fgos-coding-implement để hỏi capability `impact-analysis` thay vì hardcode tên "GitNexus" — đúng nguyên tắc cốt lõi "core consults capabilities, never tools" (US-027). Đây fix thẳng tsk-1e4: hiện CLAUDE.md bắt cứng MUST chạy GitNexus bất kể máy có cài hay không; thiếu registry nên không phân biệt được "chưa từng đăng ký" (skip sạch) với "đăng ký rồi mà hỏng" (gap thật, cảnh báo).

## Câu hỏi

Harness (repository-harness) và các dự án dùng chung nó (symphony, beads, compound-engineering-plugin) giải quyết bài toán gì bằng "tool registry"? Cụ thể: harness *inject* tool vào chỗ nào trong flow, tool nào tồn tại như concept (kind/capability/responsibility/scan_target/status), và các nguồn khác có hội tụ hay khác hướng?

## Cách từng nguồn giải quyết

### repository-harness — registry 2 chiều, data-only, agent-applied policy

**Cơ chế** (`docs/TOOL_REGISTRY.md`, schema `scripts/schema/003-tool-registry.sql` + `005-tool-extensions.sql`, code `crates/harness-cli/src/{domain,application,interface,infrastructure}.rs`):

- Bảng SQL `tool`: migration 003 tạo cột base (`name`, `command`, `description`, `responsibility`, `args`); migration 005 **ALTER TABLE additive** thêm `kind` (default `'cli'`), `capability`, `scan_target`, `status` (default `'unknown'`), `checked_at` — không phá dữ liệu cũ, tự backfill `kind` từ prefix quy ước (`command LIKE 'mcp:%'` → `kind='mcp'`).
- 3 lệnh: `tool register --name --kind --capability --command --scan --responsibility [--force]`, `tool check [--name] [--json]`, `tool remove --name`.
- `--kind` ∈ `cli|binary|mcp|skill|http` — quyết định **cách probe**: `cli`/`binary` resolve trên `PATH` hoặc path; `mcp`/`skill` check `scan_target` tồn tại trên đĩa (`.gitnexus`, `~/.claude/skills/c3`); `http` TCP-ping 2s. `mcp`/`skill`/`http` KHÔNG cần `--force` vì chúng vốn không nằm trên `PATH`.
- `--capability` free-text nhưng **normalize kebab-case** (`normalize_capability` trong `domain.rs:285`) — "Impact Analysis"/"impact_analysis"/"impact-analysis" đều gộp về 1 string. **Đây là điểm khớp DUY NHẤT giữa 1 bước workflow và 1 tool** — bước chỉ tham chiếu capability, KHÔNG BAO GIỜ tham chiếu tên tool cụ thể (US-027 Design Notes: "the core consults capabilities, never tools").
- `tool check` LUÔN exit 0 — thiếu tool là **fact cần report**, không phải lỗi CLI. `present` với `mcp/skill` nghĩa là "equipped" (file/config resolve), KHÔNG phải "live phiên này" — agent runtime tự xác nhận usability lúc gọi thật (chỉ agent thấy được MCP server có connect hay không).
- Query: `query tools --capability impact-analysis [--status present]` trả **set** provider (nhiều tool cùng phục vụ 1 capability — gitnexus + c3 bổ sung lẫn nhau, không loại trừ).
- **Injection point thật sự nằm ở đâu?** Không nằm trong code Rust. `query tools` chỉ trả JSON fact. Chỗ agent **phải** dùng fact đó là **AGENTS.md** của chính harness — file đó ra lệnh bằng prose ("first run bootstrap, then classify via FEATURE_INTAKE.md, then query matrix") không phải hard-code trong CLI. Tức là: registry data-driven, còn injection/policy là **prose contract layer**, giống hệt cách fgOS dùng SKILL.md để ra lệnh cho agent thay vì code.
- Degrade ladder generic (khớp theo present-provider count): 0 provider registered → **Inactive**, skip sạch, ghi `capability X: inactive`, KHÔNG PHẢI drift; có đăng ký nhưng scan ra `missing`/`unknown` → **Degraded**, chạy tiếp với cái resolve được, set cờ `Weak proof`, ghi rõ gap; tất cả present → **Full**. Điểm tinh tế: "**A registered tool that scans as missing is a failed validity gate, not a skip**" — khác hẳn "0 provider" (vô hại) với "provider đăng ký rồi mà hỏng" (gap thật, phải cảnh báo).
- `audit`/`propose` (US-072) đọc registry để tự phát hiện drift: story cần capability X mà registry báo `present`=0 → propose flag thật, không còn nói mò "thiếu review" khi review-provider đã đăng ký present.

**Why:** một chỗ probe presence tách khỏi chỗ dùng nó — future extension (impact-analysis) là 1 consumer, KHÔNG phải dependency của harness lõi. Trade-off: registry cần schema/CLI riêng (chi phí xây lớn hơn) đổi lấy machine-readable JSON cho MỌI agent runtime (không riêng Claude).

### symphony — tái dùng registry của harness, chỉ viết lại policy prose (3 nấc)

**Cơ chế** (`docs/OPTIONAL_TOOLING.md`): Symphony build/run/validate không cần Impeccable (external design-review provider) — không bundle, không prerequisite. Với capability `design-review`:
1. Không provider đăng ký → skip sạch, ghi `design-review: inactive` lúc trace, KHÔNG fail validation.
2. Đăng ký nhưng missing/unusable → chạy tiếp required checks (build/Playwright/a11y/human screenshot), báo **degraded warning**, đánh dấu **proof weak** nếu workflow đòi provider đó.
3. Present & usable → thêm audit optional, **bổ sung chứ không thay** required evidence.

"Harness's generic tool registry sở hữu discovery + status; Symphony không quy định install command/scan path (external/runtime-specific)" — và cấm cứng thêm `.impeccable`/`.codex`/`.agents` vào repo. Symphony không viết code registry mới — chỉ tái dùng data layer của harness, viết lại policy ở tầng doc.

**Why:** giữ core seamless trên máy chưa cài Impeccable, nhưng khi workflow (design-heavy) THẬT SỰ đòi bằng chứng design-review mà provider hỏng, phải lộ rõ weak-proof thay vì giả vờ đủ bằng chứng.

### beads — capability như "behavioral promise" ở tầng storage, gate từng-subcommand-một

**Cơ chế** (`cmd/bd/doctor.go`, `PROPOSAL-pluggable-storage-backends.md`): không có registry SQL chung — capability boundary nằm NGAY TRONG interface Go (~107 method lõi + 5 sub-interface tùy chọn: VersionControl/HistoryViewer/RemoteStore/SyncStore/FederationStore). Backend khai capability, feature degrade sạch khi thiếu. Đợt 777d24b mở rộng: cùng ranh giới đó giờ điều phối `bd doctor` chạy embedded-mode được TỚI ĐÂU — mở **từng-subcommand-một** (`--check=artifacts|conventions|pollution` bật trước, `--perf/--server/--migration` vẫn server-gated), unsupported variant trả **structured JSON trên stderr** (`code: "embedded_unsupported"`, `checks_supported_in_embedded_mode`, `checks_unsupported_in_embedded_mode`) — máy đọc được, không phải text tự do.

**Why:** khác harness (registry ngoài, agent tự query), beads gate NGAY tại compile-time interface — capability = static type boundary, không phải runtime probe. Trade-off: cứng hơn (mỗi capability mới cần thay interface Go) nhưng an toàn hơn (compiler ép mọi implementation phải khai rõ có/không hỗ trợ).

### compound-engineering-plugin — optional capability ở tầng script, `command -v` trần

**Cơ chế**: skill mang script `.py`/`.sh` chạy qua absolute `SKILL_DIR` anchor; detect tool optional bằng `command -v` thô — không registry, không schema. "Thiếu tool là capability optional, không phải failure."

**Why:** chi phí thấp nhất trong 4 nguồn — không cần data layer, chỉ cần 1 dòng shell test trước khi gọi. Phù hợp khi chỉ có 1-2 optional dependency, không cần multi-provider-per-capability hay audit-drift.

## Ví dụ end-to-end: 1 capability (`impact-analysis`) chạy cụ thể ra sao + cơ chế inject thật

Đào sâu thêm sau 2 lần patch trước — câu hỏi: harness "inject" capability vào ĐÚNG chỗ nào trong flow, bằng cơ chế gì, không phải chỉ nói chung chung "agent tự đọc".

### Bước 0 — Setup (chạy 1 lần, người/onboarding script)

```bash
harness-cli tool register --name gitnexus --kind mcp \
  --capability impact-analysis --scan ".gitnexus" --command "mcp:gitnexus" \
  --description "Code-graph blast radius" --responsibility Verification
harness-cli tool register --name c3 --kind skill \
  --capability impact-analysis --scan ".c3" --command "skill:c3" \
  --description "Component model and drift audit" --responsibility Verification
```
Ghi 2 dòng vào bảng `tool`, CÙNG `capability=impact-analysis` — set 2 provider bổ sung nhau (US-027: "gitnexus and c3 both serve impact-analysis and are complementary").

### Bước 1 — Probe presence (chạy lại mỗi lần môi trường có thể đổi — TOOL_REGISTRY.md: "Run it at intake start so status reflects current reality")

```bash
harness-cli tool check --json
```
Giả sử máy này có `.gitnexus/` nhưng không có `.c3/`: ghi `gitnexus.status=present`, `c3.status=missing`, cả hai `checked_at=<now>`. Lệnh LUÔN exit 0.

### Bước 2 — MỘT bước workflow cần capability này hỏi TRƯỚC KHI quyết định

```bash
harness-cli query tools --capability impact-analysis --status present
```
→ trả về set 1 phần tử (gitnexus). Đây là toàn bộ những gì CLI làm — **không có bước nào trong chính source code harness tự động GỌI lệnh này cho agent**. Xác nhận bằng cách đọc `docs/CONTEXT_RULES.md` (bảng lane×phase quyết định agent đọc gì ở mỗi giai đoạn intake/planning/implementation/validation/trace) — **KHÔNG một dòng nào nhắc `query tools` hay `capability`**. `docs/HARNESS.md` chỉ liệt `query tools --summary`/`--json` dưới mục "Phase 5 Evolution Commands" — một lệnh CÓ THỂ DÙNG, không phải một retrieval-trigger BẮT BUỘC.

**Đây là phát hiện quan trọng nhất của mục này: chính repository-harness — nơi sinh ra cơ chế — CŨNG KHÔNG tự "inject" capability-check vào workflow bắt buộc của chính nó.** Cơ chế inject thật sự là: **ai viết prose cho một bước cụ thể (AGENTS.md của MỘT project khác, hay 1 skill/story riêng) tự quyết định chèn câu "trước khi làm X, hỏi capability Y" vào đúng chỗ đó.** CLI chỉ là oracle sự-thật; không có hook cấu trúc nào tự động gọi nó.

### Bước 3 — Nơi DUY NHẤT thấy injection thật xảy ra: symphony's `OPTIONAL_TOOLING.md`

Symphony KHÔNG sửa CLI, KHÔNG thêm retrieval-trigger vào bảng nào — chỉ viết 1 file prose (`docs/OPTIONAL_TOOLING.md`) nói: "for the `design-review` capability, (1) không đăng ký → skip... (2) đăng ký nhưng hỏng → chạy tiếp required checks, warn degraded, mark proof weak... (3) present → thêm audit optional." Việc GỌI `query tools --capability design-review` xảy ra ở đâu trong flow symphony thật? Vẫn không phải structural hook — là agent đọc `OPTIONAL_TOOLING.md` (1 trong các doc "Must" đọc theo lane, tương tự CONTEXT_RULES) TẠI ĐÚNG THỜI ĐIỂM validate, rồi tự gọi CLI theo đúng câu chữ đã đọc. **Injection = agent tuân theo 1 câu văn tại đúng file nó được dạy phải đọc ở đúng phase — không hơn.**

### Áp thẳng vào tsk-1e4 (impact-analysis, GitNexus, forgentX)

| Bước | Lệnh/hành động | Ai làm | Khi nào |
|---|---|---|---|
| Setup | `fgos tool register --name gitnexus --kind mcp --capability impact-analysis --scan .gitnexus ...` | người (1 lần, việc của tsk-4ad) | lúc onboard repo |
| Probe | `fgos tool check` — ghi status vào `.fgos/tool-status.local.json` (KHÔNG event-log, xem mục Store ở trên) | agent hoặc `fgos doctor` (entry mới trong `DOCTOR_CHECKS`) | đầu phiên, hoặc lúc `fgos doctor` chạy |
| **Inject thật** | Sửa PROSE trong `.claude/skills/fgos-coding-validating/SKILL.md` (+ fgos-coding-planning/executing + `CLAUDE.md`) thêm câu: "trước khi yêu cầu impact-analysis evidence trong verify/test scope, chạy `fgos tool query --capability impact-analysis --status present`" | **người viết skill (chính là việc tsk-1e4)** | mỗi lần fgos-coding-validating chạy tới bước cần quyết verify/test scope |
| Áp policy | 0 registered → inactive, skip; registered nhưng không present → degraded, weak-proof note; present → full, giữ nguyên MUST hiện tại | agent đọc câu ở bước "Inject thật" | ngay sau khi có kết quả query |
| Ghi vết | note posture (`impact-analysis: full/degraded/inactive`) vào plan.md/verify note | agent | cuối bước validate |

Không có "cơ chế harness" nào tự động làm bước "Inject thật" hộ — đây CHÍNH LÀ công việc của tsk-1e4, không phải thứ tsk-1dj (port verb-group) tự nhiên mang lại. Port xong `fgos tool` mà không sửa prose 3 skill thì capability tồn tại nhưng KHÔNG AI HỎI NÓ — giống hệt cách `query tools` tồn tại trong chính harness mà CONTEXT_RULES.md chưa bao giờ nhắc tới.

## So sánh & trade-offs

| Trục | repository-harness | symphony | beads | compound-engineering-plugin |
|---|---|---|---|---|
| Nơi khai capability | SQL registry (data, runtime) | tái dùng harness's registry | Go interface (compile-time type) | `command -v` (runtime, không lưu) |
| Multi-provider/1 capability | ✓ (set, bổ sung lẫn nhau) | ✓ (kế thừa harness) | ✗ (1 backend/1 lúc) | ✗ |
| Phân biệt inactive vs degraded | ✓ tường minh (0 vs registered-but-missing) | ✓ 3 nấc rõ | ~ (supported/unsupported list, không có "registered nhưng hỏng") | ✗ (chỉ có/không) |
| Audit tự phát hiện drift | ✓ (`propose` đọc registry) | dùng chung harness audit | ✗ | ✗ |
| Chi phí xây | cao (schema+CLI+migration) | ~zero (chỉ viết prose) | trung bình (Go interface đã có sẵn kiến trúc) | thấp nhất |
| Machine-readable cho agent | ✓ `--json` mọi query | ✓ (thừa hưởng) | ✓ (`--json` stderr payload) | ✗ (agent phải tự thử lệnh) |

Điểm hội tụ chéo cả 4: **"absent capability = clean skip, never a failure"** — không nguồn nào coi thiếu optional tool là lỗi cứng. Điểm khác biệt thật: harness/symphony phân biệt được "chưa đăng ký" (vô hại) với "đăng ký rồi mà hỏng" (gap thật cần cảnh báo weak-proof) — beads và compound-engineering-plugin KHÔNG có khái niệm "đăng ký" tách khỏi "đang chạy", nên gộp 2 case đó làm một.

## Giải pháp tổng hợp cho host (fgOS)

Lấy **data model + degrade ladder của repository-harness/symphony** (vì fgOS đã có multi-provider tiềm năng cho `impact-analysis`: GitNexus MCP hôm nay, có thể thêm provider khác sau — cần phân biệt inactive/degraded/full, không chỉ có/không). Bỏ SQL riêng (beads/repository-harness dùng SQLite vì đã có sẵn Rust+rusqlite; fgOS đã có event-log + view.json fold pattern — dùng LẠI hạ tầng đó, không mở thêm store).

**Thiết kế cụ thể:**

1. **Store — SỬA sau consult 2026-07-30 (xem `plans/reports/distill-consult-260730-2152-tool-registry-capability-vocab-report.md`, Trade-off #2):** KHÔNG fold TOÀN BỘ vào event-log chung. `tool.register`/`tool.remove` (quyết định TEAM — "project này dùng gitnexus cho impact-analysis") vẫn qua `.fgos/events.jsonl` fold vào `view.tools: { <name>: {kind, capability, scanTarget, command, responsibility, description} }`, đúng one-door-write. Nhưng `tool.check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không phải quyết định team — beehive's `.bee/doctor-attest.json` (never-tracked, tách khỏi `config.json` tracked) là tiền lệ đúng: ghi vào 1 file cục bộ gitignored riêng (`.fgos/tool-status.local.json`), KHÔNG phải event. Fold ngầm lúc query: `view.tools` (đăng ký) overlay file cục bộ (trạng thái máy này) → record đầy đủ. Máy khác không có file đó → mọi tool đã đăng ký hiện `unknown`, đúng ngữ nghĩa gốc của US-027 ("no scan_target hoặc chưa scan → unknown, agent tự confirm").
2. **Verbs mới** (theo đúng khuôn `fgos <verb> [write|read]` đã thấy trong help output):
   - `fgos tool register --name gitnexus --kind mcp --capability impact-analysis --scan .gitnexus --responsibility Verification --description "..."` [write, qua event-log] — validate: `kind` ∈ cli/binary/mcp/skill/http; `capability` normalize kebab-case; unique `name`.
   - `fgos tool check [--name x] [--json]` [write, nhưng luôn exit 0, ghi file cục bộ KHÔNG qua event-log] — probe theo kind (mcp/skill: path `scanTarget` tồn tại; cli/binary: `command -v`; http: TCP ping ngắn), persist `status`+`checkedAt` vào `.fgos/tool-status.local.json` (thêm vào `.gitignore`).
   - `fgos tool query --capability impact-analysis [--status present]` [read] — trả provider set (registry + overlay status cục bộ), JSON envelope `fgos.v1` giống mọi verb khác.
   - `fgos tool remove --name x` [write, qua event-log].
   - **Không thêm verb `fgos tool doctor` riêng.** fgOS đã có `fgos doctor` (`bin/fgos.mjs:2530`, mảng mở `DOCTOR_CHECKS` tại `src/setup/checks.mjs:173`, mỗi entry `{id, description, check(cwd)}`) — thêm 1 entry mới (`tool-registry-configured`, gọi `tool query`/status cục bộ, báo inactive/degraded/full) vào mảng có sẵn, đúng doctrine "add-through-not-alongside" đã chốt trong `porting-log.md:86` (thêm cạnh mới thay vì đi qua chỗ đã có là red-flag của chính fgOS).
3. **Capability vocab khởi điểm** (chỉ cần đúng 1 cho use case hiện tại, mở rộng sau theo YAGNI): `impact-analysis` — provider đầu tiên đăng ký sẵn `gitnexus` (kind `mcp`, scan `.gitnexus`).
4. **Sửa prose 3 skill** (fgos-coding-planning, fgos-coding-validating, fgos-coding-implement) + CLAUDE.md — thay hardcode "GitNexus" bằng capability lookup, theo đúng 3-nấc symphony:
   - Query trước: `fgos tool query --capability impact-analysis --status present`.
   - 0 provider present VÀ 0 provider registered → **Inactive**: bỏ qua yêu cầu impact analysis trong verify/test scope, ghi `impact-analysis: inactive` vào plan/verify note — không phải thiếu sót, không chặn.
   - Có đăng ký (gitnexus) nhưng `status != present` → **Degraded**: vẫn chạy required test/build khác, nhưng đánh dấu proof weak trong plan.md/verify note, ghi rõ gap ("GitNexus registered but not present on this machine — blast radius not confirmed").
   - Present → **Full**: giữ nguyên hành vi MUST hiện tại của CLAUDE.md (chạy impact trước khi sửa symbol, cảnh báo HIGH/CRITICAL).
5. **Nguyên tắc khóa cứng** (từ US-027, áp cho fgOS y hệt): fgos-coding-planning/validating tham chiếu **capability** `impact-analysis`, KHÔNG BAO GIỜ tham chiếu tên "GitNexus" trực tiếp trong logic gate — GitNexus chỉ là provider đầu tiên đăng ký. Thêm provider thứ 2 (vd 1 tool khác) sau này không cần sửa lại 3 skill.
6. **Không port**: SQL schema riêng (không cần, event-log đã đủ), beads's Go-interface compile-time gating (fgOS không có type system tương ứng để ép), audit/`propose` tự động phát hiện drift của US-072 (để dành — YAGNI, port sau nếu thấy cần khi có ≥2 capability).

## Portable ideas → porting-log candidates

| Ý | R | E | F | Ghi chú |
|---|---|---|---|---|
| `fgos tool` verb-group (register/check/query, event-log-backed, degrade-ladder JSON) | R3 | E2 | F2 | Đã có candidate row `tool-registry-capability` (porting-log.md:34, hiện `R2 E2 F2`) — đề xuất nâng R lên 3 vì giờ có use case cụ thể chặn (tsk-1e4) thay vì "hay ho để học" chung chung |
| Sửa CLAUDE.md/fgos-coding-planning/validating dùng capability thay vì hardcode tên tool | R3 | E1 | F3 | Chi phí thấp (chỉ sửa prose sau khi có verb ở trên), impact ngay lên tsk-1e4 |
| Phân biệt "0 provider" (inactive) vs "provider registered nhưng missing" (degraded, weak-proof) trong verify note | R2 | E1 | F3 | Cốt lõi US-027; không có thì mọi absence trông giống nhau |
| `audit`/`propose` tự phát hiện drift giữa story yêu cầu capability và registry status (US-072) | R1 | E3 | F1 | Hoãn — chỉ đáng khi fgOS có ≥2 capability đăng ký thật, hiện chỉ có 1 ứng viên (impact-analysis) |

*(R/E/F giữ nguyên rubric distillery hiện có; đây là đề xuất điều chỉnh dòng đã tồn tại ở porting-log.md:34, không tạo dòng mới trùng — cần human xác nhận trước khi sửa porting-log.)*

## Cấu hình forgentX hiện tại (tsk-4ad; register/remove rút bởi tsk-in1-1 D1)

Verb-group `fgos tool` (port của tsk-1dj) đã sống trong `bin/fgos.mjs`; mục
này chỉ ghi lại cấu hình THẬT của repo forgentX hôm nay, và cách một người
khác tự chỉnh/mở rộng nó mà không cần hỏi lại.

> **tsk-in1-1 D1** (sau tsk-4ad): `register`/`remove` — 2 verb CLI mô tả
> ngay dưới đây — đã bị rút. Provider giờ khai báo thẳng trong
> `runner.capacities.<id>` (`.fgos/config.json`), sửa file config như mọi
> `capacities` entry khác (`toolsFromCapacities`, `src/state/
> tool-registry.mjs`, nhặt entry nào khai `capability`), không qua event-log
> nữa. Chi tiết shape hiện tại + lý do: `docs/reference/forgentx-tool-
> registry-configuration.md`. Phần narrative bên trên (trước mục này) là
> ghi chép thiết kế TẠI THỜI ĐIỂM port (tsk-1dj/tsk-4ad) — giữ nguyên làm
> lịch sử quyết định, không sửa theo đổi mới này.

**Đăng ký sống** (xác nhận bằng `fgos tool query --capability impact-analysis --json`):

- `gitnexus` — `kind: mcp`, `capability: impact-analysis`, `scan: .gitnexus`,
  `responsibility: Verification`, `description: Code-graph blast radius`.
  Provider đầu tiên và duy nhất cho `impact-analysis` hôm nay.

**Capability vocab đang dùng**: đúng 1 nhãn — `impact-analysis` (kebab-case,
tự chuẩn hoá qua `normalizeCapability`, `src/state/tool-registry.mjs`). Thêm
nhãn mới không cần sửa code: chỉ cần `--capability <ten-moi>` lúc `register`
— consumer (một skill, hay CLAUDE.md) tự quyết định có hỏi nhãn đó hay
không, registry không áp policy.

**Thêm 1 provider mới** (cho `impact-analysis` hoặc một capability khác):

```
fgos tool register --name <ten> --kind <cli|binary|mcp|skill|http> \
  --capability <nhan> --command <lenh-hoac-mcp:ten> \
  [--scan <duong-dan>] [--responsibility <vai-tro>] [--description "..."] \
  --dir <main-checkout-root>
```

`--scan` bắt buộc cho `kind` `mcp`/`skill` (không nằm trên `PATH`, presence
check bằng scan path trên đĩa thay vì `command -v`). `--name` phải duy nhất
— đăng ký trùng tên bị từ chối thẳng (`validateToolRegistration`); muốn thay
một provider đã có, `fgos tool remove --name <ten>` trước rồi `register`
lại. Chạy từ một worktree (không phải main checkout) luôn cần `--dir` trỏ
về main checkout — registry là state chia sẻ chung một chỗ, không phải
per-branch (ADR0020).

**Probe & đọc trạng thái**:

- `fgos tool check [--name x] [--json]` — probe từng tool đã đăng ký, ghi
  `status`+`checkedAt` vào `.fgos/tool-status.local.json` (cục bộ,
  gitignored, KHÔNG qua event-log — sự thật về máy đang chạy, không phải
  quyết định team). Luôn exit 0, kể cả khi tool thiếu.
- `fgos tool query --capability <nhan> [--status present]` — trả provider
  set, gộp đăng ký (chia sẻ) với overlay trạng thái cục bộ (máy này).
- `fgos doctor` — check `tool-registry-configured` (`src/setup/checks.mjs`)
  tự báo posture tổng quát, không cần tự gọi `tool query` tay.

**Đọc 3 nấc trạng thái** (degrade ladder, xem "Giải pháp tổng hợp" ở trên):

- **inactive** — 0 tool đăng ký cho capability này. Vô hại, bỏ qua sạch,
  không phải thiếu sót.
- **degraded** — có đăng ký nhưng probe ra `missing`, hoặc chưa từng
  `check` (`unknown`). Gap thật — cảnh báo weak-proof trong verify/plan
  note, nhưng vẫn chạy tiếp phần khác.
- **full** — mọi tool đăng ký đều `present`. Giữ nguyên hành vi MUST hiện
  tại không đổi.

Việc CHƯA nằm trong tsk-4ad: sửa prose 3 skill (fgos-coding-planning/validating/
executing) + CLAUDE.md để MỖI BƯỚC workflow tự hỏi capability
(`fgos tool query --capability impact-analysis --status present`) thay vì
hardcode tên "GitNexus" trong logic gate — đó là injection thật sự (xem
mục "Ví dụ end-to-end" ở trên), và là việc riêng của tsk-1e4. tsk-4ad dừng
ở: đăng ký provider, có DOCTOR_CHECKS entry, và ghi chú đọc-hiểu-được này.

## Open questions

- ~~fgOS event-log hiện có cơ chế fold multi-value map...~~ **Đã xác nhận**: `src/state/replay.mjs:30` `foldEvents()` là 1 switch phẳng theo `event.type` (`work.add`, `work.move`, `work.edit`, `decision`, `work.outcome`, `work.stage`, `work.discovery`, `goal.focus`, `work.friction`...) sinh ra `view`. Thêm `tool.register`/`tool.check`/`tool.remove` là 3 case mới cùng khuôn, fold vào `view.tools`. Không cần store mới; có thể tách logic validate/query ra 1 file riêng (`src/state/tool-registry.mjs`, theo mẫu `porting-store.mjs` đã tách khỏi `replay.mjs`) rồi gọi từ case trong `replay.mjs`, giữ switch mỏng.
- `tool check` cho kind `mcp` trong fgOS nên probe path nào tương ứng `.gitnexus` — xác nhận đúng thư mục/marker GitNexus dùng trong forgentX (README nhắc `.gitnexus/run.cjs`) trước khi hardcode `scanTarget` mặc định.
- Porting-log row hiện tại (`R2 E2 F2`) có nên nâng điểm hay tạo dòng mới — theo luật distill, quyết định là của người, không tự sửa porting-log trong phiên này.
