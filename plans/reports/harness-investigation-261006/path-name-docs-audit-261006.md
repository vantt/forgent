# Kiểm toán path / tên / tài liệu (vai 3) — 2026-10-06

Chỉ đọc. Script đếm nằm cùng thư mục (`lib_git.py` là helper chung; mọi script gọi git qua `subprocess`, KHÔNG qua pipe `rtk` vì rtk cắt output, xem memory `feedback_rtk_truncates_large_pipe_input`). Lịch sử git chỉ có từ 2026-07-13 (8652 commit). Mọi số dưới đây có lệnh tái chạy: `python3 <script>.py`.

## 1. Kết luận ngắn (em nói thẳng)

1. **Không có một văn bản nào trong repo định nghĩa path + tên cho plan / report / prompt / journal.** Quy ước thật chỉ nằm trong *hook* toolkit (global `~/.claude/hooks`, và bản chép gitignored `.claude/hooks`), không versioned, và hai bản hook nói **hai thứ khác nhau** (có / không hậu tố `-report`). Rule của repo nói "follow the repository's configured plan location" nhưng repo không cấu hình gì (vòng tròn).
2. **Có ít nhất 3 vị trí sống cho `plan.md` và 2 cho journal**, và doctrine skill fgOS còn trỏ vị trí cũ (`docs/history/<feature>/plan.md`) trong khi mọi plan mới từ 2026-09-10 nằm ở `plans/<dir>/plan.md`.
3. **Drift có đo được và nặng ở report**, nhẹ ở plan dir (vì có công cụ cơ khí `ak plan create`). Report đúng quy ước hook (chấp nhận cả hai biến thể): 100% (W29) → 87-100% (W31-W34) → 20-26% (W36, W38-W39) → 16% (W40) → 4% (W41).
4. **Không có cưỡng chế cơ học** cho path/tên `.md` (hook `descriptive-name` chỉ nhắc, `permissionDecision: allow`, fail-open). 116/131 phiên (89%) ghi file `.md` mới vào `plans/`/`docs/` mà chưa từng đọc reading-map / governance / registry trước lần ghi đầu.
5. **"Hệ đăng ký tài liệu" (`doc-registry`) không phải hệ đặt chỗ**: nó là sổ tri thức end-user (479 doc, chỉ 4 root: knowledge/explanation/how-to/reference), không biết `plans/` hay `docs/specs`. Nơi agent *nên* tra trước khi tạo file là `docs/specs/reading-map.md` (AGENTS.md trỏ đến) hoặc `docs/reading-map.md` (docs/README trỏ đến) — **hai file khác nhau, cùng tên, cùng đòi là "đọc cái này trước"**.

## 2. Ai định nghĩa quy ước nào (bảng nguồn)

| Artifact | Nguồn quy ước | Path/tên nói | Bằng chứng |
|---|---|---|---|
| Plan dir | hook `## Naming` (global + project) | `plans/YYMMDD-HHmm-slug/` (giờ **local**) | `~/.claude/hooks/lib/context-builder.cjs:676-677`; `~/.claude/.ck.json` `namingFormat {date}-{issue}-{slug}`, `dateFormat YYMMDD-HHmm` |
| Plan dir | `ak plan create` (công cụ thật) | `plans/YYMMDD-HHmm-slug/` nhưng giờ **UTC** | `plans/261005-1143-observe-…` có birth time `18:43 +0700` = 11:43 UTC (`stat`) → tên khớp UTC, hook ghi local |
| Plan dir | global rule `~/.claude/rules/documentation-management.md:18` | `plans/<timestamp>-<descriptive-slug>/` | file đó |
| Plan dir | rule repo `.claude/rules/documentation-management.md:19` | "follow the repository's configured plan location" | không có config: `.agentkit/config.yaml:22-35` toàn comment |
| `plan.md` (work-item) | skill fgOS `domains/coding/skills/fgos-coding-planning/SKILL.md:16` | `docs/history/<feature>/plan.md` (+ CONTEXT.md, DISCUSSION.md) | 59 file `domains|core|plugins` còn trỏ `docs/history/` |
| Report | hook global (`context-builder.cjs:676`, `subagent-init.cjs:187`) | `{type}-{date}-{slug}-report.md` | |
| Report | hook project gitignored (`.claude/hooks/lib/context-builder.cjs:656`, `subagent-init.cjs:201`) | `{type}-{date}-{slug}.md` **(không `-report`)** | `.gitignore:62` `/.claude/*` → không versioned |
| Report | prompt của lead (de facto) | `slug-YYMMDD.md` | vd `prompt-261006-0950-…md:89` `observe-acceptance-fixes-261006.md` |
| `{type}` | hook | "agent name, report type, or context" (3 nghĩa) | project hook 658; 249 file `plans/reports` có ~45 token đầu khác nhau |
| Journal | global `~/.claude/agents/journal-writer.md:37`, `~/.claude/skills/journal/SKILL.md:18` | `./docs/journals/` | |
| Journal | project `.claude/agents/journal-writer.md:49`, `ak-journal/SKILL.md:18,55` | `./plans/journals/YYYY-MM-DD-slug.md` | |
| "Cấm `.md` ngoài plans/docs" | hook `buildRulesSection` | `DO NOT create markdown files outside plans or docs` | `~/.claude/hooks/lib/context-builder.cjs:587` |
| Docs placement | `docs/doc-governance.md §2` | `docs/{platform,user/{tutorials,how-to,reference,explanation},generated,knowledge,history,templates}` | `doc-governance.md:43-87` |
| Docs thật | disk | `docs/{specs,architect,distillery,ui-spec,journals,how-to,reference,…}` ở root docs | bảng §4 |
| Điểm đọc đầu | `AGENTS.md:10,38,54` | `docs/specs/reading-map.md` | |
| Điểm đọc đầu | `docs/README.md:28` | `docs/reading-map.md` (và gọi specs/reading-map là "legacy") | 2 file khác nhau (108 vs 55 dòng) |

Bất nhất quan trọng nhất: (a) `{type}-…-report.md` vs `{type}-….md` do **hai hook cùng chạy** (global + project) — chính context khởi động của em hiện chứa cả hai khối `## Naming` mâu thuẫn; (b) giờ local (hook) vs UTC (`ak plan create`); (c) `docs/history` vs `plans/` cho plan.md; (d) `docs/journals` vs `plans/journals`; (e) hai reading-map.

## 3. Số đo drift (script)

### 3.1 Report trong `plans/**/reports/` — đúng quy ước hook (chấp nhận cả hai biến thể)
(`naming-drift-relaxed.py`; "đúng" = `^{type}-YYMMDD-HHmm-{slug}(-report)?.md$`)

| Tuần ISO | W29 | W31 | W32 | W33 | W34 | W35 | W36 | W37 | W38 | W39 | W40 | W41 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| đúng/tổng | 29/29 | 34/39 | 15/15 | 20/20 | 13/14 | 11/15 | 19/93 | 23/31 | 5/25 | 24/93 | 23/141 | 2/47 |

200 report mới nhất: 30/200 (15%) đúng. Bản **nghiêm** (chỉ biến thể có `-report`, `naming-drift.py --live`): 50 + 100 report mới nhất = 0%; theo tháng 07: 77%, 08: 78%, 09: 18%, 10: 0%.

Hình dạng tên từ 2026-09-26 (`naming-drift-relaxed.py`): 94 không ngày (đa số báo cáo con trong thư mục thí nghiệm/plan), 42 `slug-YYMMDD.md`, 41 đúng quy ước, 33 khác, 7 ngày ở giữa.
Chỉ 17% file sai-tên có basename đã được viết sẵn trong prompt/plan (`prompt-dictated-names.py`: 9/52) → phần lớn do agent hoặc lead tự chọn, KHÔNG phải prompt ép (giới hạn: so khớp chuỗi basename nên có thể đếm thiếu).

### 3.2 Plan dir
`plans/` có 19 dir với `plan.md`; theo tháng tạo: 07 1/1, 08 7/7, **09 21/36 (58%)**, **10 15/15 (100%)** đúng `YYMMDD-HHmm-slug`. Dir sai gần nhất: `260925-documentation-authority-unification` (chính plan để sửa doc governance). Từ 09-29 trở đi 100% — vì có công cụ sinh tên cơ khí, không nhờ văn xuôi. Đây là bằng chứng tốt nhất rằng *cơ chế* thắng *quy ước chữ*.

### 3.3 "Last 200 commits thêm `.md`" (`last200-commits-drift.py 200`)
Cửa sổ 2026-09-21 → 10-06, 493 file: 287 (58%) đúng placement+tên; 64 sai tên; 142 sai placement. 123/142 placement-sai là **một** dir thí nghiệm (`260919-coordination-skill-harness-simplification`, tên chỉ-ngày); phần còn lại ~61 là `plans/reports` sai tên. Cửa sổ 100 commit: 81%. Nói cách khác, drift tập trung ở report, không ở plan dir; số tổng bị một dir kéo.

### 3.4 `.md` ngoài `plans/` + `docs/`
`md-inventory.py`: 4449 `.md` tracked: docs 3130, archive 568, plans 427, plugins 89, .claude 74, .agents 53, core 51, domains 43. Ngoài `plans/docs/upstreams/archive`: 324 file nhưng 252 là SKILL/ref, 17 agent def, 16 domains task-specs — **hợp lệ (instruction source/render)**. File `.md` thật sự lạc chỗ: **1** — `tsk-1op-case-study-note.md` ở root (2026-07-26, `b7fd7ade1`). Hook cấm `.md` ngoài plans/docs thực tế gần như được tôn trọng (vì mới vi phạm 1 file); drift thật nằm ở *bên trong* plans/docs.

Lạc chỗ không-md: **30 file scratch ở root** (`fix_openSession*.cjs`, `rewrite_store.cjs`, `test_concurrency*.log`, `reverse.patch`, `openSession.txt`…) commit trong **một** commit `ca854f443` ("refactor coordination action legality…", 88 file, 2026-09-21), vẫn trên main sau 15 ngày, không có reference (grep: chỉ thấy trong worktree agent). Dấu hiệu `git add -A` quét scratch; không có guard `.gitignore` hay hook nào chặn (hook tên chỉ nhắc cho `Write`, không cho `git add`).

## 4. Docs roots và trùng lặp

`docs-roots-and-registry.py` (md tracked): history 1678, platform 439, architect 415, knowledge 332, explanation 137, distillery 37, how-to 23, ui-spec 15, specs 14, templates 11, reference 7, journals 5.
Không có trong placement map của governance: `architect`, `distillery`, `ui-spec`, `journals`, `specs` (nằm ở đoạn "legacy remain valid"). Governance vẽ `docs/user/{tutorials,how-to,reference,explanation}`; thực tế `docs/user/` có 1 file, 4 quadrant nằm ở root docs.

**Trùng lặp byte-giống-nhau** (`duplicate-docs.py`): 362 nhóm, 433 file thừa; **302 file thừa nằm giữa `docs/architect` ↔ `docs/platform`** (cây `agent-coordination`: 937 vs 945 file tracked; `docs/platform/agent-coordination` thêm 2026-09-18 theo commit `e1307d33f` "migrate to docs/platform/ target structure" — copy chứ không move; bản `architect` vẫn "remain current" theo `docs/platform/agent-coordination/README.md`). Trong khi `docs/specs/reading-map.md:35` + ghi chú README 2026-10-02 nói engine này đã **thu hồi (D-0050)**. Tức ~300 file nhân đôi cho một hệ đã retire. 239 basename xuất hiện ở ≥2 root docs.
Skill render (`.agents`, `.claude`, `plugins` ↔ `core`/`domains`): ~124 file nhân bản — đã biết là bản render (memory `project_agents_skills_is_render_target_edit_core_skills`), không tính drift, nhưng agent mở nhầm bản render là rủi ro đã ghi nhận.

Nhiều report cùng chủ đề (`topic-clusters-and-orphans.py`, token trong tên `plans/reports/*.md`, 240 file): distill 25, dispatch 20, harness 16, inventory 14, unit 14, merge 13, observe 12 (07→10-06). Cụm `unit-i12` 7 file (5 vòng re-review), `runtime-recovery` 6 file trong một ngày 260911. Không có chỉ mục nào cho `plans/reports` (ngoài `ls`). `plans/reports` còn chứa prompt (8), handoff (4), `.diff` (5), `.json` (2), `.html` (2) và 4 thư mục con (`council-lens-experiment-261004`, `observe-measurement-261005`, `artifacts`, `harness-investigation-261006`): một "reports" đang kiêm kho prompt/handoff/experiment.
Orphan dir: `plans/` không còn dir mồ côi thật (mọi dir tên-ngày đều có `plan.md`; `plans/reports/*` subdir là vị trí thứ ba cho thí nghiệm). Orphan lớn thật là 30 file scratch ở root (mục 3.4).

**Plan.md đổi chỗ không đổi doctrine** (`new-md-by-root.py`): tạo `plan.md` mới theo tháng: 07 `docs/history` 74 / `plans` 1; 08 `docs/history` **541** / `plans` 5; 09 `docs/history` 5 / `plans` 35; 10 `plans` 15. Lần thêm `docs/history/*plan.md` cuối: 2026-09-09. Từ đó mọi plan nằm `plans/`. Nhưng `domains/coding/skills/fgos-coding-planning/SKILL.md:16`, `fgos-coding-shaping` (DISCUSSION.md), `src/runner/paths.mjs:123` và 59 file doctrine vẫn trỏ `docs/history/<feature>/`. UNPROVEN: ai/commit nào chủ ý bỏ `docs/history` (cần vai Nhà khảo cổ; em không tìm thấy spec nào ghi quyết định này — cần `git log -S'docs/history/<feature>'` + "Lịch sử quyết định" runner.md).

Journal: `docs/journals` (5 file, `YYMMDD-HHmm-slug`, cuối 2026-08-03) → `plans/journals` (9 file, `YYYY-MM-DD-slug`, từ 2026-09-29). Hai toolkit (`ck:` global ghi `docs/journals`, `ak:` project ghi `plans/journals`) cùng cài, mỗi bên một đường.

## 5. Registry / reading-map có được tra không?

- `doc-registry.json` (650 KB) + `doc-registry.md` (285 KB): 479 topic/doc; 478 `currentPath` còn tồn tại; phủ root `knowledge` 333, `explanation` 136, `reference` 6, `how-to` 4; 480/499 file end-user+knowledge nằm trong registry. **Không** phủ `plans/`, `docs/specs`, `docs/platform`, `docs/architect`. Sinh lần cuối 2026-09-15 (commit `23fb220e3`; commit 09-04 ghi "stale since 09-03"). Không nằm trong AGENTS.md, CLAUDE.md, `.claude/rules/*`, reading-map. Vai trò: bộ sinh `fgos doc-registry` cho compound-learn, không phải "tra trước khi tạo file".
- Transcript (`transcript-consult-check.py`, 595 phiên gồm subagent, các dir `-home-vantt-projects-forgentX*`; chỉ đếm Read/Bash đọc file, không tính nội dung nạp sẵn): 131 phiên ghi `.md` vào `plans/`/`docs/`; **116 (89%) chưa đọc** reading-map/doc-governance/doc-registry/docs-README trước lần ghi đầu, 15 (11%) có đọc. Chỉ riêng `reading-map`: 14/131 đọc trước. `doc-registry`: 1/131. Chỉ 32/595 phiên (5%) từng đọc reading-map dù `AGENTS.md:38` bảo "Read reading-map first". Giới hạn: nhiều phiên là subagent được giao sẵn path trong prompt (không cần tra); số này đo "tra" chứ không đo "đúng/sai".
- Mục tiêu đọc đã thối: `docs/specs/reading-map.md` 9/94 token path không tồn tại (`src/evolve/candidates.mjs`, `src/state/workflow-stage-graphs.mjs`, `plans/260920-immediate-test-feedback-reduction/plan.md` đã sang `archive/plans/`, `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`, `.claude-plugin/plugin.json`…). `domains/coding/AGENTS.md` 2/13 trỏ file không tồn tại, và `.githooks/pre-commit:352,391` in lỗi chỉ tới `docs/how-to/fix-fgos-write-rejected-merge-block.md` — **file không tồn tại** (em đã `ls`). `AGENTS.md`, `CLAUDE.md`: 0 token chết. Lưu ý reading-map (55 dòng, mỗi dòng là một đoạn văn dài 500-2000 ký tự) khó dùng như bảng tra đặt chỗ; nó mô tả *code/doc đã có*, không có mục "file mới loại X đặt ở đâu, tên gì".

## 6. Cưỡng chế hiện có (path/tên md)

Không có: `scripts/check-*` chỉ ba loại (decision-citation-drift, decision-codes, decision-supersession, locked-decisions-heading, backlog-reconciliation, hook-registrations); `.githooks/pre-commit` và CI (`ci.yml`) không kiểm tra tên/placement md; grep `test|scripts|src|.githooks|.github` không có test nào đọc `doc-governance` hay `plans/reports` làm hợp đồng (chỉ fixture). Hook duy nhất liên quan tên: `descriptive-name.cjs` (PreToolUse:Write, `permissionDecision: allow`, "All paths allowed", fail-open) — chỉ nhắc. Hook "Naming" dính vào mọi lượt nhưng nội dung gồm hai biến thể. Cùng kiểu mâu thuẫn ở `PreToolUse:Write`: khi em ghi file báo cáo này, hai khối "File naming guidance" xuất hiện cùng lúc, một khối bảo "dùng `## Naming`, đặt tên có workflow + scope", khối kia bảo "bỏ qua guidance này nếu tạo file markdown" (cũng hai hook cùng đăng ký). Tên file em được giao (`path-name-docs-audit-261006.md`) lại là biến thể thứ ba (`slug-YYMMDD`), tức chính phiên điều tra này cũng không theo hook.

## 7. Phân loại nguyên nhân (cho vai tổng hợp)

| Drift | Loại |
|---|---|
| Report sai tên (W36→W41) | **không cưỡng chế** + **mâu thuẫn** (hai hook, 2 biến thể; prompt lead dùng biến thể thứ ba) |
| Plan dir ngày-không-giờ (Sep 14-25) | từng không cưỡng chế; đã hết sau `ak plan create` (cơ khí) |
| plan.md ở `docs/history` vs `plans/` | **mâu thuẫn doctrine** (skill fgOS cũ, hook mới) |
| journal 2 chỗ | **mâu thuẫn** (toolkit ck vs ak cùng cài) |
| 302 file docs nhân đôi | quy trình "migrate" copy, không move; không gì chặn |
| 30 file scratch ở root | không cưỡng chế (không `.gitignore`/hook cho `git add -A`) |
| không tra reading-map | **rule bị chôn/văn xuôi** (AGENTS.md:38 chỉ nhắc; bản đồ lại quá dài và không có mục "đặt file mới ở đâu") |

## 8. UNPROVEN / không đo được

- Quyết định chủ ý bỏ `docs/history/<feature>/plan.md` (cần khảo cổ).
- Agent nào đặt tên từng report (lead vs worker) — transcript không đối chiếu từng file.
- Chi phí thật của drift (có agent nào tạo trùng vì không tìm thấy file có sẵn?) — vai Pháp y hành vi.
- Mức "nhiễu" của 2 khối Naming mâu thuẫn lên hành vi: chỉ có tương quan (conformity rơi từ W35; hook project/global cùng chạy từ lúc nào? chưa kiểm cài đặt lịch sử).
- Chưa thử thí nghiệm A/B instruction.

## Unresolved questions
1. Hook project (`.claude/hooks`, gitignored) và global đều đăng ký — ai cố ý cài song song, và bản nào là bản chuẩn? Nếu bỏ một bản thì biến thể tên nào thắng?
2. `docs/platform/agent-coordination` còn là "target" hay đã chết cùng engine bị thu hồi (D-0050)? Quyết định số phận bản sao `docs/architect/agent-coordination`.
3. `docs/reading-map.md` hay `docs/specs/reading-map.md` là điểm đọc-đầu chuẩn?
4. Repo muốn một nơi plan.md duy nhất (`plans/` hay `docs/history/`) cho work-item fgOS?

Status: DONE_WITH_CONCERNS
Summary: Đã đo drift path/tên từ git (script lưu cùng thư mục) và đối chiếu mọi nguồn quy ước; kết luận chính là không có văn bản repo định nghĩa path/tên, hai hook mâu thuẫn, 3 chỗ plan.md, 302 file nhân đôi, report conformity rơi từ ~90% (T8) xuống ~4% (W41), và 89% phiên ghi md không tra reading-map.
Concerns: transcript-metric không phân biệt phiên được prompt giao sẵn path; "ai đặt tên" và quyết định bỏ `docs/history` là UNPROVEN; thời điểm hai hook cùng chạy chưa dò lịch sử cài đặt.
