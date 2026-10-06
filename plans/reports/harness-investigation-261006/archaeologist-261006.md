# Nhà khảo cổ: nguồn gốc và tàn dư của harness (2026-10-06)

Chỉ đọc. Mọi lệnh chạy tại `/home/vantt/projects/forgentX`, nhánh `main`. Em ghi UNPROVEN ở chỗ chưa có bằng chứng.

## 1. Kết luận ngắn

1. Harness hiện tại là **ba lớp từ ba nguồn khác nhau chồng lên nhau**, không phải một thiết kế: ClaudeKit global (`ck`, 2026-07-08), AgentKit repo-local (`ak`, 2026-08-30), và doctrine fgOS (AGENTS.md/CLAUDE.md, git-tracked). Chỉ lớp thứ ba có lịch sử git.
2. `.claude/rules/*.md` của repo **không nằm trong git** (`.gitignore:62` `/.claude/*`, `git ls-files .claude/rules` = 0). Header hệ thống ghi "checked into the codebase" là sai. Hệ quả đo được: 27/28 worktree không có rules của repo.
3. RUL11 ra đời có chủ đích, có lý do rõ, nhưng **phạm vi gốc là cấu trúc code** (dispatch.mjs, bin/fgos.mjs). Cưỡng chế duy nhất là test kiểm tra chuỗi anchor có mặt. Không có gì kiểm tra hành vi path/tên/tra-có-sẵn. Đây là chỗ lệch giữa ý định và thứ anh đang kỳ vọng.
4. Các lần gỡ lớn (bee, docs/decisions/*.md, vài skill) đều **có chủ đích** và có commit nói rõ. Nhưng gỡ **không sạch**: để lại ít nhất 3 mâu thuẫn/tàn dư còn hoạt động (mục 5).
5. Điều khiến "rules trùng tên khác nội dung": rules global là ClaudeKit cũ (tháng 7), rules repo là bản AgentKit (tháng 8) rồi bị sửa tay (tháng 9-10). Hai bộ không ai đồng bộ.

## 2. RUL11: khi nào, vì sao

- Khóa ngày 2026-08-18 ở `b63ab155f` (tsk-7u7): thêm RUL11 vào `docs/specs/platform-foundations.md:74`, narrative D-ADR0036 ở `:387-470`, anchor `khong phai no nang ma no tum lum` ở `AGENTS.md:97-` (đoạn "RUL11"), test `test/docs/rul11-anchor-phrase.test.mjs`. `git log -S'RUL11'` đầu tiên: `b297249f6` (plan), rồi `b63ab155f`.
- Nguồn gốc: lời anh 2026-08-18 (trích nguyên văn `platform-foundations.md:~395`). Bằng chứng đi kèm là hai ca **code**: `tsk-2uf-1` (thêm cờ `--work` vào dispatch.mjs 2204 dòng, 6 concern, config+validate chiếm 794 dòng) và `tsk-38h` (bin/fgos.mjs, GitNexus zero-index).
- Cưỡng chế thật: test chỉ assert (a) anchor có trong `AGENTS.md`, (b) dòng `**RUL11.**` khớp từng chữ, (c) heading `### 0036`. Không có kiểm tra "một nguồn path", "một cửa tên", "tra có sẵn trước khi tạo". Tự bản narrative cũng nói: "việc gom thật là phạm vi tsk-2uf-1 và các item khảo sát mảng còn lại, không phải item này" (`platform-foundations.md:~445`).
- Hệ quả: RUL11 là câu khẩu hiệu nạp mọi turn (đúng RUL9), nhưng nó không nói cụ thể "path/tên/tra sẵn" nên agent không có tiêu chí hành động. UNPROVEN rằng đây là nguyên nhân chính; nó là một giả thuyết cho vai pháp y kiểm.

## 3. Dòng thời gian các lớp instruction

| Lớp | Ra đời | Bằng chứng | Trong git? |
|---|---|---|---|
| `~/.claude/rules/*` (6 file, gồm `CLAUDE.md` "ClaudeKit Engineer Context") | 2026-07-08 11:15 | `stat` mtime; `~/.claude/.ck.json` mtime 07-08; `~/.claude/hooks/managed-hooks.json` ghi "ClaudeKit CLI" | Không |
| `AGENTS.md`, `CLAUDE.md` (repo) | 2026-07-14 `823926cc7` (onboard bee) rồi `e350acbda` cùng ngày "divorce doctrine swap — pure product AGENTS/CLAUDE" | `git log --diff-filter=A` | Có |
| `.claude/rules/*` (8 file), `.claude/hooks/*`, `.agentkit/`, 106 skill `ak-*` | 2026-08-30 11:33 | `stat` mtime đồng loạt; `.agentkit/config.yaml`; `.claude/hooks/.agentkit-runtime.json` | **Không** (`.gitignore:62`) |
| `.claude/rules/documentation-management.md` sửa tay | 2026-09-14 | mtime | Không |
| `.claude/rules/primary-workflow.md` sửa tay (thêm "Find prior art") | 2026-10-02 | mtime; khớp `b048e852d` 2026-10-02 thêm "Prior art before design" vào AGENTS.md | Không |
| RUL11 | 2026-08-18 | mục 2 | Có |
| "Prior art before design" (AGENTS.md) | 2026-10-02 `b048e852d` | `git log -S` | Có |
| Khối GitNexus capability gate (CLAUDE.md) | 2026-07-31 `032cb15e4` | `git log -S` | Có |
| Khối MDView | 2026-08-17 `1dc7ab607` | `git log -S` | Có |

Vì sao hai bộ rules cùng tên khác nội dung: bộ repo là biến thể AgentKit (nhắc `/ak:`, `kongming`, `fable`, `--yagni`), bộ global là ClaudeKit (nhắc `/ck:`). Độ lệch đo bằng `diff | grep -c '^[<>]'`: development-rules 7, primary-workflow 40, documentation-management 64, orchestration-protocol 9, review-audit-self-decision 0. Không có commit/quyết định nào ghi "hai bộ này cố ý khác nhau". UNPROVEN ý định; phần `--yagni` và `plans/` ở repo trông là chỉnh tay có chủ ý (xem 4.1).

## 4. Mâu thuẫn còn sống (có file:dòng)

4.1 YAGNI: `~/.claude/rules/development-rules.md:8` "Prefer YAGNI, KISS, and DRY in that order" vs `.claude/rules/development-rules.md:10` "Apply KISS and DRY... YAGNI only when user passes `--yagni`". Cả hai nạp mỗi phiên. Quyết định gốc của anh về `--yagni` chưa tìm thấy trong git (file không tracked) nên UNPROVEN; chỉ biết bản repo là bản sau và có thêm điều khoản "Deliver the full requested scope". Không đề xuất đảo.

4.2 Hai hook cùng tên chạy mỗi lượt: `dev-rules-reminder.cjs` đăng ký ở `~/.claude/settings.json:160-169` (bản ck, mtime 07-08) và `.claude/settings.json:159-180` (bản ak, mtime 08-30). Đây là nguồn của hai khối "Rules" trong ghi chú anh. Hai hook này khác phiên bản (3.1K vs 3.3K). Nội dung khác nhau chi tiết giao cho vai 2.

4.3 Hai nguồn đặt tên plan: `~/.claude/.ck.json` `plan.namingFormat "{date}-{issue}-{slug}"`, `.agentkit/config.yaml:30-32` (comment, mặc định cùng format), còn rules global `documentation-management.md:16-18` bảo `plans/<timestamp>-<slug>/`; repo `.claude/rules/documentation-management.md:17` bảo "follow the repository's configured plan location". Thực tế `plans/` có 18/21 mục dạng `NNNNNN-NNNN-slug`, 1 mục `NNNNNN-slug` (`260925-documentation-authority-unification`), 1 `reports/`, 1 `journals/`. `plans/reports/` 253 file, nhiều tiền tố (`prompt-`, `internal-research-`, `research-`, `distill-...`, `independent-re-review-...`) không có quy ước thống nhất. Vai 3 đo tiếp.

4.3b Plan còn hai hệ: plan kiểu kit (`plans/`) và plan per-item của fgOS (`plan.md` do `fgos-coding-planning` ghi, sống ở `domains/coding/skills/`). Em chưa lần ra đường dẫn của plan.md per-item: UNPROVEN.

4.4 Tàn dư decisions: `AGENTS.md:64-66` DoD câu 6 "A settled decision goes into `docs/decisions/`" mâu thuẫn với `AGENTS.md:13` ("docs/decisions/index.md generated projection; narrative lives in docs/specs/<area>.md"). `docs/decisions/` hiện chỉ có `index.md` (`ls`, `git ls-files docs/decisions | wc -l` = 1). Commit retire `4722361ae` (2026-08-17, tsk-1lv-4) nói đã sửa "AGENTS.md's product-priority-order pointer" nhưng không sửa câu 6. Ngoài ra `docs/specs/reading-map.md:16` vẫn mô tả `docs/decisions/` như "hồ sơ quyết định dài hạn" có OKF-style header (đã retire).

4.5 Hai reading-map: `docs/specs/reading-map.md` (27.5K, tiếng Việt, AGENTS.md:10,38,54 trỏ vào đây) và `docs/reading-map.md` (3.7K, tiếng Anh, `2085d88fe` 2026-09-26, thuộc plan "documentation authority unification"). Plan đó tự ghi `Plan status: Proposed — not authorized for execution` và thừa nhận "fragmented authority state" (`plans/260925-documentation-authority-unification/plan.md:3-6,25`). Tức hai hệ đang cùng tồn tại, hệ mới chưa được duyệt nhưng đã có file trên `main`. Tương tự `docs/platform-foundations.md` (16K) và `docs/specs/platform-foundations.md` (33K): hai file, AGENTS.md trỏ cả hai (`:8` vs `:27`); có vẻ là nguồn luật vs spec (reading-map nói thế) nên em xếp là có chủ ý, không phải mâu thuẫn.

4.6 Tải kép: `CLAUDE.md` nạp `AGENTS.md` bằng `@`; cả hai chứa khối `# GitNexus` (`AGENTS.md:167`, `CLAUDE.md:80`) và `## Documentation Viewing (MDView)` (`AGENTS.md:137`, `CLAUDE.md:50`). 17180 + 6643 byte = 23.8K, riêng hai khối lặp lại. Nguồn: `CLAUDE.md` tự ghi khối GitNexus "regenerates ... on `gitnexus analyze`" nên lặp do công cụ ghi vào cả hai file. Điểm này vai 2 sẽ đo token.

4.7 Hai catalog skill trùng chức năng: global `~/.claude/skills` 106 mục (ck:*), repo `.claude/skills` 133 mục = 106 `ak-*` + 18 `fgos-*` + 9 khác (distill, gitnexus*, ui-spec). Cùng chức năng hai tên (`ck:plan`/`ak:plan`, `ck:cook`/`ak:cook`...). Ước lượng không phải đếm đủ 106 cặp; em chỉ đối chiếu số lượng bằng nhau (106=106) và cặp plan/cook. Bản đồ chi tiết thuộc vai 4. Lưu ý: tên không tiền tố trong ghi chú anh (`plan`, `cook`) là thư mục global; ở repo chỉ có `ak-plan`.

4.8 Nguồn skill thật không phải "core/skills 12": là `core/skills` (12) + `domains/coding/skills` (9) = 21, render sang `.agents/skills` (20) rồi `plugins/fgOS/skills` và `.claude/skills/fgos-*`. `e859e71d6` (2026-09-14) chuyển `fgos-code-panel` sang `domains/coding/`. Ghi chú anh nên sửa.

## 5. Cái gì từng có và bị gỡ, có chủ ý không

| Thứ | Gỡ khi nào | Chủ ý? | Còn sót |
|---|---|---|---|
| Hệ **bee** (`.bee/`, 16 skill `bee-*`, hook) | Onboard `823926cc7` 2026-07-14; untrack `e99998633` cùng ngày ("workshop tree... repo divorce"); doctrine swap `e350acbda`; đổi tên `BEE_`→`FGOS_` `783ac37d6` 2026-08-13 (tsk-19z). Quyết định mission-boundary: `ffbf8fae9`, `05f0c746e` (tsk-4us, 2026-08-17) | Có (commit message + D1/tsk-4us) | `.gitignore:47-58` còn khối `# BEE:START..END` và `/.bee/` dù `.bee/` không còn trên đĩa; 4 chỗ comment trong `bin/fgos.mjs` (1922, 1945, 4194, 4198) và `core/skills/_shared/*.md` (executor-dispatch-fallback.md:217,292; coding-worker-contract.md:69) nói "bee's ...". Chỉ là tham chiếu lịch sử, không nạp mỗi turn. Không phát hiện tên `bee` trong AGENTS/CLAUDE/rules hiện hành |
| `docs/decisions/0001-0033.md` | `4722361ae` 2026-08-17 (tsk-1lv-4, plan D5) | Có, ghi chi tiết trong commit | Mâu thuẫn 4.4; `docs/decisions/` tồn tại chỉ một file `index.md` |
| Skill `fgos-submit-assist` | `d49a52e7a` 2026-08-09 (tsk-6ar, "retire ... superseded") | Có | Chưa kiểm còn tham chiếu |
| Skill `fgos-code-change`, `fgos-capability-dispatching`, `fgos-plan-loop`, `DemandFacts` | `6527596eb` 2026-10-01 "P2 complete ... fgos-run driver, DemandFacts retired" | Có (commit nêu retired) | Chưa kiểm |
| Coordination engine | Không bị gỡ: `2180b4e72` 2026-10-02 "Phase 6 complete - L4 coordination e...". Các commit khớp "retire" là tách/gỡ từng phần (`315612e46`, `97357222b` gỡ `fgos evolve`) | Có | Cái em tưởng "bị gỡ" thực ra vẫn sống; UNPROVEN là có tàn dư |
| ClaudeKit `ck:` | Không gỡ. Vẫn cài global từ 07-08; AgentKit `ak:` cài thêm 08-30, **cả hai cùng nạp** | UNPROVEN có chủ ý song song hay do quên gỡ | Mâu thuẫn 4.1-4.3, 4.7 |

Ghi chú về chủ ý: `docs/distillery` và `upstreams/claudekit-engineer` là ca học từ nguồn ngoài có chủ ý (`22446b5d1` 2026-08-25 "full-repo scan of claudekit-engineer"), không phải tàn dư.

## 6. Nhiễu khác tìm thấy trên đường

- Gốc repo có **27 file scratch được commit trong một lần** `ca854f443` (2026-09-21, "refactor coordination action legality and test fixtures"): `count.cjs`, `debug_args.cjs`, `fix_openSession.cjs` đến `fix_openSession6.cjs`, `test_concurrency*.cjs`, `timed-executor*.mjs`, `openSession.txt`, `original.txt`... (`git ls-files | grep -v /`: 45 file gốc, 27 là scratch). Commit đó cũng kéo `.fgos/instructions/effective/repo.json`. Đây là ca "tùm lum" bằng chứng cứng, nguồn gốc rõ: một commit lẫn.
- `docs/` có tối thiểu 17 thư mục cấp một (`ls docs`), `docs/history` 880 mục. Plan `260925-documentation-authority-unification` là nỗ lực đã thừa nhận vấn đề; chưa được duyệt.
- 28 worktree (`git worktree list | wc -l`), trong đó 27 không có `.claude/rules`, và `.claude/skills` chỉ có 20-24 mục `fgos-*`/distill (so với 133 ở main). Agent chạy trong worktree thấy một harness khác main. Đây là biến số lớn cho "mỗi lần một kiểu".

## 7. Giả thuyết cho các vai khác (có thể bác bỏ)

- Nếu agent trong worktree làm tùm lum nhiều hơn ở main, thì thiếu repo rules là nguyên nhân (bác bỏ: tỉ lệ lỗi như nhau).
- Nếu hai hook cùng chạy làm agent chọn bừa YAGNI, sẽ thấy ca nhắc `--yagni` trái nhau trong transcript.
- Nếu RUL11 khó áp dụng vì phạm vi gốc hẹp, sẽ thấy agent hỏi/diễn giải RUL11 chỉ cho code, không cho path/tên.

## 8. Điều chưa giải quyết

1. Anh có chủ ý giữ cả ClaudeKit global lẫn AgentKit repo cùng lúc không? Không có tài liệu nào ghi.
2. Chỉnh tay `.claude/rules/*` ngày 09-14 và 10-02 là ai/phiên nào? Không có lịch sử vì file untracked.
3. Có bản sao lưu của `.claude/rules` ở đâu để so sánh phiên bản? Em không tìm.
4. `fgos-submit-assist`, `fgos-code-change`... còn tham chiếu mồ côi nào không? Chưa quét.
5. Plan per-item `plan.md` của fgOS nằm ở đâu so với `plans/`? Chưa chứng minh.

Status: DONE_WITH_CONCERNS
Summary: Dựng được dòng thời gian của RUL11, các lớp rules, và các lần gỡ (bee, docs/decisions, skill); tìm ra 5 mâu thuẫn/tàn dư có file:dòng, và hai sự thật cấu trúc quan trọng: `.claude/rules` không nằm trong git (27/28 worktree thiếu), và RUL11 chỉ được cưỡng chế bằng test anchor chuỗi.
Concerns: `.claude/rules` và global rules không có lịch sử nên chủ ý chỉnh sửa là UNPROVEN; chưa quét hết tham chiếu mồ côi tới skill đã retire; nội dung chi tiết hai khối hook thuộc vai 2.
