# Cấu trúc và điều kiện: vì sao harness để agent làm tùm lum (2026-10-06)

Vai "structure and conditions". Em chỉ đọc. Em chỉ ghi file này và hai script đếm mới cùng thư mục:

- [extract-briefs.py](extract-briefs.py): rút prompt Agent/Task từ transcript.
- [brief-name-origin.py](brief-name-origin.py): truy ai đọc ra tên của từng report W41.

Em không mở `cases-unlabeled-261006.csv` hay `behavior-forensics-*`. Nhận định nào không có bằng chứng thì ghi UNPROVEN. Mã nguyên nhân/can thiệp lấy theo [codebook](classification-codebook-261006.md).

Trong lúc làm có một bằng chứng sống. Khi em Write script `.py`, hook `descriptive-name` tiêm hai khối nói ngược nhau: global bảo "Python … snake_case", project bảo "kebab-case for … Python". Context SubagentStart của em cũng có hai template tên report (`general-purpose-261006-1134-{slug}-report.md` và `…-{slug}.md`). Brief thì đặt tên thứ ba: `conditions-261006.md`. Em theo brief, đúng như mọi subagent trong mẫu ở phần 3.

## Kết luận ngắn

1. **Hầu hết quy ước có nhiều người định nghĩa và không ai kiểm.** Trong 15 quy ước/artifact, chỉ 3 cái có đúng một nguồn định nghĩa và một cơ chế kiểm cơ học: nguồn skill, roster executor, và bộ instruction hiệu lực của fgOS. Cả 3 không thấy drift. Ngược lại, các quy ước có drift đo được đều có từ 2 tới 6 nguồn định nghĩa và không có cơ chế kiểm nào.
2. **Thứ quyết định tên file là nguồn gần nhất có thẩm quyền, không phải hook.** 40/46 report W41 có tên được đọc sẵn trong brief: 39 prompt Agent do lead viết, 1 file prompt. 5 tên do lead tự đặt, 1 không truy được. Không tên nào do người gõ. 10/10 brief trong mẫu có nêu path, và output đều nằm đúng path và tên đó. Brief ăn đứt cả hai hook.
3. **Brief tốt về tiêu chí, kém về nguồn quy ước.** Trong 20 brief: 16 có tiêu chí xong rõ, 14 có phạm vi file rõ. Nhưng 8/10 brief có path tự đặt một kiểu tên riêng. Có 1 brief chép lại một luật đã chết của AGENTS.md (`docs/decisions/`), và 1 brief ra lệnh ngược luật "không mã plan trong comment" đang nạp mỗi phiên.
4. **Observe đã có kho eval và cảm biến stance, nhưng chưa chạy được A/B "cùng việc, khác bộ instruction".** Còn thiếu ba thứ: một cách khai báo bộ instruction thành biến số tái lập được, một bộ chấm cơ học path/tên/việc thừa, và một kịch bản việc nhỏ có đáp án. Kho eval nhận rubric tự do nên không phải sửa Rust.

## 1. Bảng phát hiện cấu trúc

Cột "Triệu chứng" ghi mã P/U/O/R/I/X khi có bằng chứng hành vi đo được. Nếu chỉ có artifact hoặc tương quan, cột này ghi rõ như vậy, hoặc ghi "none proven". Nguồn viết tắt:

- `ARC`: [archaeologist](archaeologist-261006.md)
- `INS`: [instruction-audit](instruction-audit-261006.md)
- `PND`: [path-name-docs-audit](path-name-docs-audit-261006.md)
- `SKC`: [skill-catalog-audit](skill-catalog-audit-261006.md)
- `ENF`: [enforcement-audit](enforcement-audit-261006.md)
- `CRI`: [critic](critic-261006.md)

| # | Phát hiện | Nguyên nhân | Can thiệp | Bằng chứng | Triệu chứng nuôi | Tin cậy |
|---|---|---|---|---|---|---|
| S1 | `.claude/rules` và `.claude/hooks` bị gitignore, nên 27/28 worktree chạy không có rules/hooks của repo | B | SH (đưa doctrine riêng vào AGENTS.md, theo CRI §3) | `.gitignore:62`; ARC §6; INS §1.2: 58% prompt ở worktree chỉ nhận khối global | P (tương quan, chưa có ca nhân quả) | med |
| S2 | 11 hook ck/ak đăng ký trùng; 83% prompt ở main nhận hai khối Rules | C | SH + CC (doctor bắt hook trùng) | `~/.claude/settings.json:160-169` vs `.claude/settings.json:159-190`; INS §1.1 | none proven: CRI §1 không tìm thấy ca hành vi nào do ck/ak | high (tồn tại) |
| S3 | Hai template tên report (`-report.md` và không `-report`) | C | SH + SP (một lệnh sinh tên) | `~/.claude/hooks/lib/context-builder.cjs:676` vs `.claude/hooks/lib/context-builder.cjs:656` | P (drift report đo được, nhưng nguồn thật là brief, xem §3) | high |
| S4 | Hook `descriptive-name` mâu thuẫn: markdown thì "dùng Naming" hay "bỏ qua"; Python snake hay kebab | C | SH | `~/.claude/hooks/descriptive-name.cjs:17,19` vs `.claude/hooks/descriptive-name.cjs:16,17`; tái hiện trong chính phiên này | none proven | high |
| S5 | YAGNI mặc định (global) vs YAGNI opt-in `--yagni` (repo) | C | SH, vì là quyết định của anh | `~/.claude/rules/development-rules.md:8` vs `.claude/rules/development-rules.md:8-11`; hook `:594` vs `:577` | U/O: none proven. Brief chỉ nêu cờ 1/20 lần (§3) | med |
| S6 | Khối GitNexus/MDView chép hai lần; gate capability vs MUST vô điều kiện | F + C | SP (nơi sinh chỉ ghi một file) | `CLAUDE.md:50-122` vs `AGENTS.md:137-209`; INS M7 | none proven | high |
| S7 | Số symbol GitNexus nằm trong file viết tay, gây commit churn | G2 | CU | INS §3: 34/53 commit `CLAUDE.md`; working tree hôm nay bẩn `AGENTS.md`/`CLAUDE.md` (git status) | X (nhiễu diff) | med |
| S8 | Ba điểm "đọc trước": `docs/specs/reading-map.md`, `docs/reading-map.md`, và "README + docs/" | C | SH | `AGENTS.md:10,38,54`; `docs/README.md:17,28,55`; `~/.claude/rules/CLAUDE.md:9` | P (chỉ 32/595 phiên từng đọc reading-map, PND §5) | med |
| S9 | reading-map có path chết và mô tả sai nguồn skill | H | CC (kiểm link trong preflight) | PND §5: 9/94 token chết; SKC §5: `reading-map.md:26-27` | P: none proven | high (tồn tại) |
| S10 | **Ba** file platform-foundations: legacy, spec, và anchor "Draft, Canonical: Yes, after review" | C | SH | `git ls-files \| grep platform-foundations` = 3; `docs/platform/platform-foundations.md:4-11`; AGENTS.md trỏ 2/3 (`:8,60` vs `:27,97`) | none proven | high |
| S11 | AGENTS.md tự mâu thuẫn về nơi ghi quyết định | C | IN (xoá `AGENTS.md:64-65`) | `AGENTS.md:13` vs `:64-65` | P: một brief đã chép luật chết này (T6, §3); agent tự sửa hướng | high |
| S12 | 302 file trùng giữa `docs/architect` và `docs/platform` (copy, không move) cho một engine đã retire | D + H | SH + VH | PND §4; commit `e1307d33f` | O (artifact) | high |
| S13 | 5 gốc docs không có trong governance (`architect`, `distillery`, `ui-spec`, `journals`, `specs`) | A | SH | PND §4; `docs/doc-governance.md:43-87` | P: none proven | med |
| S14 | `plan.md` ở 3 chỗ; skill fgOS vẫn trỏ `docs/history/<feature>/plan.md` | C + H | SP | `domains/coding/skills/fgos-coding-planning/SKILL.md:16`; `src/runner/paths.mjs:123`; PND §4: 59 file | P (đổi vị trí lịch sử 08→09, PND §4) | med |
| S15 | Journal ở 2 chỗ, 2 kiểu tên (ck → `docs/journals`, ak → `plans/journals`) | C | SH | PND §2: `~/.claude/agents/journal-writer.md:37` vs `.claude/agents/journal-writer.md:49` | P (artifact: 5 + 9 file) | high |
| S16 | Repo không có văn bản nào định nghĩa tên report/prompt; rule repo trỏ vòng | A | SH + SP | `.claude/rules/documentation-management.md:19`; `.agentkit/config.yaml:22-35` toàn comment | P (đo được) | high |
| S17 | `ak plan create` dùng UTC, hook dùng giờ local | C / G2 | CU | INS M3; CRI: "UTC chưa phải hệ thống" | P nhỏ | low (UNPROVEN) |
| S18 | Brief của lead đặt quy ước tên thứ ba và thắng mọi hook | BR (brief_role decisive) | SH + BR (brief dẫn về một nguồn) | §3: 40/46 tên W41 do brief đọc sẵn | P (đo được) | high |
| S19 | 22 file còn nhắc skill đã xoá `fgos-coding-compounding`, kể cả description của `fgos-indexing` | H | CC (tên skill phải tồn tại) + SP | SKC §6; `core/skills/fgos-indexing/SKILL.md:7,16,18` | R/P: none proven | high (tồn tại) |
| S20 | 83 cặp skill song sinh ak/ck (~4,4k token/phiên); 4/106 `ak-*` từng được gọi | F | SH (chọn một kit) | SKC §3-4 | none proven (SKC §10) | high (tồn tại) |
| S21 | 18 `fgos-*` liệt kê hai lần (wrapper + plugin) | F | SP | SKC §3 | none proven | high |
| S22 | Wrapper trỏ `.agents/skills` là "canonical", nhưng đó là bản render | B + H | SP | `.claude/skills/fgos-routing/SKILL.md:12-14`; memory `project_agents_skills_is_render_target…` | P (memory ghi ca sửa tay bị revert) | med |
| S23 | Script check exit 1 mà không cửa nào chạy: `check-decision-codes` 375 vi phạm, `check-backlog-reconciliation` 3 | D | CC (một cửa: preflight trong CI) | ENF §3.1 | none proven | high |
| S24 | `check-hook-registrations-guarded` mồ côi | D | CC | ENF I11 | none proven | high |
| S25 | Cưỡng chế rải qua 5 cửa; `fgos preflight` không ai gọi | D | CC | ENF §3.1; `bin/fgos.mjs:3981` | none proven | high |
| S26 | Chỉ 5/18 bất biến bị chặn thật; path/tên/vị trí/prior-art chỉ là văn xuôi | D | CC | ENF §2 | P/R (drift đo được cho P; R có 2 ca, SKC §7) | high |
| S27 | Luật prior-art chỉ là văn xuôi: 1/8 plan từ 10-02 có nhắc | D | SP (trường bắt buộc trong template plan) | ENF I8; `AGENTS.md:42-49` | R (2 ca có bằng chứng, n nhỏ) | med |
| S28 | RUL11 chỉ có test giữ câu chữ, không có "transport" (L8 §2) | D + B | IN + CC | ARC §2; `test/docs/rul11-anchor-phrase.test.mjs`; `docs/platform-foundations.md:203-207` | none proven | med |
| S29 | doc-registry phủ 478/3130 doc (15%) và chỉ gác verb `compound` | D | SP / SH (quyết định phạm vi) | ENF I5; `bin/fgos.mjs:1597,1694-1705` | P: none proven | high |
| S30 | 30 file scratch ở gốc repo trong một commit `git add -A` | D (G1 phụ) | CC (pre-commit hoặc gitignore) | `ca854f443`; PND §3.4; CRI | O (artifact) | high |
| S31 | Thông báo lỗi pre-commit trỏ tới file không tồn tại | H | SP | `.githooks/pre-commit:352,391`; PND §5 | P: none proven | high (tồn tại) |
| S32 | MEMORY.md tự mâu thuẫn về cửa `fgos` | C | SH | `MEMORY.md:28` vs `:39` | P/X (memory ghi 2 ca chạy bản cũ) | med |
| S33 | Rules global "on-demand" là sai sự thật; nêu 5 doc không tồn tại; session-init đổ tới 214 KB vô ích | F | IN (xoá) + CU | INS M9, §7 | none proven | high (tồn tại) |
| S34 | Doctrine riêng của fgOS (prior art, one-H1, component-boundary) viết tay vào file vendor không track | B | SH | CRI §2; `.claude/rules/primary-workflow.md:19`, `documentation-management.md:30` | none proven | med |
| S35 | Đã có engine bộ instruction một-chủ có phát hiện mâu thuẫn, nhưng chỉ chứa **1** unit; rules/hooks của ck/ak nằm ngoài nó | SH (thiếu phủ) | SP (mở rộng phạm vi, không thêm hệ mới) | `src/setup/instruction-composition.mjs:1-29`; `find core/instructions` = 1 file; `.fgos/instructions/effective/repo.json` 1 rule | none proven | high |
| S36 | 78 lời gọi `path.join(…'.fgos')` đi vòng resolver | D | CC (ratchet) | ENF I3 | none proven | high |
| S37 | `docs/doc-governance.md` không được lớp luôn-nạp nào nhắc tới; 89% phiên ghi md mà không tra | B | IN (một con trỏ) | INS §6; PND §5: 116/131 | P (tương quan) | med |
| S38 | Kịch bản dogfood trỏ quyết định đã retire `docs/decisions/0018-…` | H | CC (cùng check link với S9) | `dogfood-fixture/scenarios/expr-eval-chain.md:3` | none proven | high (tồn tại) |

Tổng có 38 dòng, chia theo nguyên nhân chính:

| Nguyên nhân | Số dòng |
|---|---|
| C | 11 |
| D | 10 |
| H | 4 |
| B | 4 |
| F | 4 |
| A | 2 |
| G2 | 1 |
| BR | 1 |
| SH | 1 |

Đếm theo nhãn đứng đầu của mỗi dòng; tổng đúng 38.

Can thiệp (một dòng có thể mang nhiều mã):

- **SH (sở hữu)** xuất hiện ở 16 dòng.
- **CC (cơ chế)** ở 11 dòng.
- **SP (sản phẩm)** ở 11 dòng.

Chỉ 5 dòng có triệu chứng *đo được trên hành vi*, gồm S3, S8, S16, S18, S26/S27. Các dòng còn lại là artifact, tương quan, hoặc none proven.

## 2. Sổ sở hữu (không có người sở hữu duy nhất)

"Người định nghĩa" là mọi nơi nói quy ước đó là gì, kể cả hook, config, brief và memory. "Cơ chế kiểm" phải là cơ học: test, hook có `exit 2`, doctor, hoặc công cụ sinh.

| Quy ước / artifact | Ai định nghĩa (file:line) | Số nguồn | Ai đổi được | Cơ chế kiểm | Một chủ? | Hệ quả quan sát được |
|---|---|---|---|---|---|---|
| Tên report | hook global `~/.claude/hooks/lib/context-builder.cjs:676`, `subagent-init.cjs:187`; hook project `.claude/hooks/lib/context-builder.cjs:656`, `subagent-init.cjs:201`; `~/.claude/.ck.json` `plan.namingFormat`; brief của lead (`prompt-261006-0955…md:66`, `prompt-261006-0950…md:89`, 39 brief Agent W41) | ≥4, cộng mỗi brief | ck update, ak update/sửa tay (không track), bất kỳ phiên lead nào | không có (`descriptive-name` trả `allow`) | không | W29-W34 dạng hook ≥87%; W41 40/46 theo brief (§3) |
| Tên prompt | không văn bản nào; thói quen của lead | 0 | bất kỳ ai | không có | không | 17 file kiểu prompt trong `plans/reports`, ≥6 kiểu tiền tố (`prompt-`, `review-prompt-`, `brainstorm-prompt-`, `advisor-prompt-`, `from-…-prompt.md`, `…-prompt.md`) |
| Tên + vị trí plan | `~/.claude/.ck.json`; `~/.claude/rules/documentation-management.md:16-18`; `.claude/rules/documentation-management.md:17-19` (trỏ vòng); hook Naming ×2; công cụ `ak plan create`; `domains/coding/skills/fgos-coding-planning/SKILL.md:16`; `src/runner/paths.mjs:123` | 6+ | ck/ak, người sửa skill, code | không check, nhưng **có công cụ sinh tên** | không trên giấy, có cửa sinh cơ học | tháng 10: 15/15 đúng; tháng 9: 21/36 (PND §3.2); `plan.md` từng ở 3 chỗ |
| Journal | `~/.claude/agents/journal-writer.md:37`, `~/.claude/skills/journal/SKILL.md:18` (`docs/journals`); `.claude/agents/journal-writer.md:49`, `ak-journal/SKILL.md:18,55` (`plans/journals`) | 2 kit | ck/ak | không có | không | 5 file + 9 file, hai kiểu tên |
| Vị trí tài liệu | `docs/doc-governance.md:43-87`; hook "DO NOT create md outside plans/docs" (`~/.claude/hooks/lib/context-builder.cjs:587` + bản project); doc-registry (`.fgos/config.json:1466`); `AGENTS.md` L8 | 4 | người sửa doc, ck/ak, verb `fgos doc` | doctor `doc-*`, chỉ trong phạm vi registry (15%) | không | 5 gốc ngoài bản đồ; 302 file trùng; 1 md lạc ở gốc repo |
| Nguồn skill | nguồn `core/skills` + `domains/coding/skills`; sinh bởi `scripts/build-skill-wrappers.mjs`. Mô tả nguồn: wrapper `.claude/skills/fgos-routing/SKILL.md:12-14` (nói `.agents` canonical), `docs/specs/reading-map.md:26-27` (sai), memory | 1 cho artifact; 3 lời mô tả lệch nhau | người sửa core + build | `test/setup/skill-wrappers.test.mjs:269`, `fgos preflight` | **có** cho artifact, không cho lời mô tả | render 19/19 giống nguồn (SKC §5); memory có ca sửa nhầm bản render |
| Roster executor | `~/.fgos/config.json:214` (global) + `.fgos/config.json:604` (project), ưu tiên project > global (luật install gate trong `AGENTS.md`); mặc định ở `src/setup/registrations.mjs`; một resolver (`src/runner/dispatch/resolve.mjs`, `bind.mjs`) | 2 lớp dữ liệu, 1 resolver, ưu tiên khai rõ | anh (config) + `fgos setup` | nhiều doctor (`executor-confinement`, `herdr-executor-kinds`, `executor-profile-warnings`, `workflow-pools-satisfy-independence`…) | **có** (một đường giải) | không đo được drift định nghĩa (UNPROVEN). Sự cố executor trong memory là hành vi, không phải quy ước |
| Cửa `fgos` | `AGENTS.md:109-130` (`fgos run`, `fgos dispatch decide`); mục "Legacy-Node CLI Ownership Boundary" của `AGENTS.md`; `MEMORY.md:28` (hàm shell) vs `:39` (`node bin/fgos.mjs`); brief (`node bin/fgos.mjs`) | ≥4 | bất kỳ phiên nào ghi memory/brief | doctor `cli-version-visible`, `rust-host-binary-present` (chỉ kiểm có mặt) | không | memory có 2 ca chạy bản cũ (`feedback_rtk_proxy_fgos_stale_global_binary`, `project_fgos_shell_function_stale_staged_release_shim`) |
| Bộ hook | `~/.claude/settings.json:160-169` + `~/.claude/hooks/managed-hooks.json` (ck tự heal); `.claude/settings.json:159-190` (ak, trùng cả bên trong); `fgos setup` cho `dispatch-decide-hook` (`src/setup/registrations.mjs:1442`) | 3 | ck, ak, `fgos setup` | doctor chỉ kiểm "có nối"; check hook bị nối hai lần không có (check guard thì mồ côi) | không | 83% prompt nhận hai khối; 253/253 lần Write nhận hai khối Naming |
| File rules | `~/.claude/rules/*.md` (6, ck 07-08); `.claude/rules/*.md` (8, ak 08-30, sửa tay 09-14 và 10-02, không track) | 2 | ck/ak update, sửa tay không lịch sử | không có | không | 4/5 file trùng tên lệch nhau 7/9/40/64 dòng; worktree có 0 rules repo |
| Reading-map | `docs/specs/reading-map.md` (`AGENTS.md:10,38,54`); `docs/reading-map.md` (`docs/README.md:17,28,55`; `docs/doc-governance.md:16`); `~/.claude/rules/CLAUDE.md:9` | 3 điểm vào | người sửa doc | không có | không | 9/94 path chết; 32/595 phiên từng đọc |
| platform-foundations | `docs/platform-foundations.md` (`AGENTS.md:8,60`); `docs/specs/platform-foundations.md` (`AGENTS.md:27,97`); `docs/platform/platform-foundations.md` (Draft, "Canonical: Yes, after review", Owner "Platform documentation") | 3 | người sửa doc | `rul11-anchor-phrase.test.mjs` (chỉ giữ chuỗi anchor trong một file) | không | AGENTS trỏ 2/3 file; bản thứ ba tự nhận sẽ thành canonical |
| Hồ sơ quyết định | `AGENTS.md:13` (index sinh bằng `fgos decision-index`, narrative ở spec); `AGENTS.md:64-65` (`docs/decisions/`); `docs/specs/reading-map.md:16` (header kiểu OKF, đã retire) | 3 | người sửa AGENTS/doc | doctor `decision-index-stale`; `check-decision-citation-drift` (chỉ preflight); các check còn lại chỉ chạy fixture | index: có; nơi đặt narrative: không | brief T6 ra lệnh "Create the `docs/decisions/` entry"; agent tự đọc quy ước rồi ghi `index.md` + `docs/specs/runner.md` (`a09cb29a3`, `7df6ddc4a`) |
| Bộ instruction hiệu lực của fgOS | `core/instructions/platform-laws.md`, compose qua `src/setup/instruction-composition.mjs`, chiếu ra khối "fgOS Effective Instructions" trong AGENTS.md | 1 | owner `platform:core` | doctor `instruction-projections-stale`; compose fail khi có mâu thuẫn | **có** | không drift; nhưng chỉ phủ 1 unit (S35) |
| Path `.fgos` | `src/runner/paths.mjs:92` | 1 | code | chỉ nhắc (SessionStart), không test | một chủ, không có kiểm | 78 chỗ đi vòng (ENF I3) |

**Đếm.**

- **Một nguồn và có kiểm cơ học: 3/15**, gồm nguồn skill (cho artifact), roster executor và bộ instruction hiệu lực.
- **Một nguồn, không kiểm: 1**, là path `.fgos`.
- **Nhiều nguồn nhưng có cửa sinh cơ học: 2**, gồm tên plan (`ak plan create`) và index quyết định.
- **Không chủ và không kiểm: 9.**

**Tương quan với drift.**

- Nhóm 3 có một chủ và có kiểm:
  - render skill: 0 lệch;
  - instruction hiệu lực: 0 lệch;
  - roster executor: chưa đo.
- Nhóm 9 không chủ, không kiểm, đều có drift đo được:
  - report: tên đổi theo tuần;
  - journal: 2 chỗ;
  - reading-map và platform-foundations: 2-3 file;
  - docs: 302 file trùng.
- Ca rõ nhất là tên plan. Trên giấy nó có 6+ nguồn và không có check nào, nhưng tháng 10 đạt 15/15 nhờ có **cửa sinh cơ học**.
- Ca ngược là report W41. Không có chủ, nhưng 40/46 tên vẫn đồng nhất vì **một nguồn gần nhất là brief** áp đảo.

Vậy biến số dự báo tốt nhất **không phải số văn bản định nghĩa**, mà là: có một cửa cơ học mà agent buộc phải đi qua không, hoặc có đúng một nguồn gần nhất không.

**Giới hạn của suy luận này.**

- n = 15, trong đó chỉ khoảng 7 quy ước có số drift.
- Ba mẫu số drift khác nhau (CRI §7) nên không gộp được.
- Có nhiễu chéo: thứ kiểm được bằng máy thường là thứ gần code (skill, config), vốn đã dễ giữ đều. Sở hữu và khả năng kiểm đi cùng nhau nên không tách được tác động riêng.
- Chỉ có một so sánh trước/sau thật: plan dir, tháng 9 so với tháng 10, khi bắt đầu dùng công cụ. Nó không có nhóm đối chứng.
- Vì vậy đây là **tương quan, quan hệ nhân quả là UNPROVEN**.

## 3. Mẫu chất lượng brief

**Cách lấy mẫu (lấy tất định, không chọn tay).**

- 10 file prompt mới nhất trong `plans/reports/` theo ngày trong tên. Trong số đó, 7 file tên bắt đầu `prompt-`, cộng `brainstorm-prompt-260930-1102`, `review-prompt-260911-1805` và một trong hai file `prompt-261001-0955`, cho đủ 10.
- 10 prompt Agent/Task lấy từ transcript forgentX từ 2026-09-25. `extract-briefs.py 2026-09-25` cho 209 dòng. Em bỏ 18 dòng "dispatch", hầu hết là lệnh `rg` dương tính giả, còn 191. Từ đó lấy cứ 19 dòng một cái và bỏ brief của chính em, được các chỉ mục 0, 20, 39, 58, 77, 102, 130, 150, 169, 189.
- Brief dispatch ra ngoài tiến trình (codex/agy) không có trong mẫu, vì transcript không chứa prompt thật của chúng. Đây là một giới hạn.
- Không có secret nào trong các brief được trích.

Chú giải cột:

- **Path**: có nêu path file đầu ra không. Ghi `trả lời` khi kết quả là tin nhắn hoặc commit, không phải file.
- **Tên**: tên trong brief khớp quy ước nào. `hook-p` là template hook project; `riêng` là brief tự đặt.
- **Tiêu chí**: tiêu chí xong hoặc kiểm chứng.
- **File**: allowlist hoặc vùng cấm.
- **Cờ**: cờ phạm vi `--yagni`.
- **Xung đột**: chỗ brief xung đột với lớp hook/rules đang nạp.
- **Đúng chỗ?**: output có nằm đúng path và tên brief nêu không.

| # | Brief | Path | Tên | Tiêu chí | File | Cờ | Xung đột | Đúng chỗ? |
|---|---|---|---|---|---|---|---|---|
| P1 | `prompt-261006-0955-investigate-harness-drift-rul11.md` | có (`:59,66`) | riêng `<vai>-261006.md` | có (`:70-77`) | có allowlist (`:27,77`) | không | tên trái cả hai hook | có (synthesis + 9 báo cáo vai) |
| P2 | `prompt-261006-0950-fix-observe-acceptance-findings.md` | có (`:89`) | riêng `slug-YYMMDD` | có (`:84-90`) | vùng cấm (`:78-81`) | không ("không mở thêm scope") | tên | có (`observe-acceptance-fixes-261006.md`) |
| P3 | `prompt-261002-1107-request-to-run-fix-round.md` | có (`spike-herdr-bwrap.md`) | riêng, local theo plan | có (mục D, Bàn giao) | vùng cấm/worktree | không | tên; report đặt trong plan, trái "Reports → plans/reports" | có, kèm 2 file `.log` anh em |
| P4 | `prompt-261001-1810-tier-rigor-continue-phase-3-4.md` | trả lời | — | có | worktree | không | — | — |
| P5 | `prompt-261001-1549-fix-stale-contract-tests.md` | trả lời | — | có | allowlist theo dòng | không | — | — |
| P6 | `prompt-261001-1504-baseline-red-test-suite.md` | có (`:51`) | hook-p (`test-baseline-261001-<HHMM>-…`) | có (bảng phân loại) | vùng cấm | không | trái hook global (`-report`) | có (`…-1543-main-red-suite.md`) |
| P7 | `prompt-261001-0955-fix-observe-harness-protocol-count.md` | trả lời | — | có (fail trước, xanh sau) | một phần | không | — | — |
| P8 | `prompt-261001-0955-fix-test-fixture-store-leak.md` | trả lời | — | một phần (theo prompt gốc) | một phần | không | — | — |
| P9 | `brainstorm-prompt-260930-1102-request-to-run-decomposition.md` | có (`:218`) | riêng | một phần (mẫu trả lời) | read-only (`:13`) | không | tên | có (3/3 `brainstorm-response-260930-*`) |
| P10 | `review-prompt-260911-1805-runtime-recovery-detailed-design.md` | có (`:216`) | hook-p (`design-review-<yymmdd-hhmm>-…`) | một phần (nội dung bắt buộc) | "Write only this report" | không | trái hook global | có (`…-260911-2233-…`) |
| T1 | #0 Explore, 09-25 | trả lời | — | có (7 mục, ≤300 chữ) | read-only | không | — | — |
| T2 | #20 reviewer I20 | trả lời | — | có | read-only | không | — | — |
| T3 | #39 fixer I22 | trả lời + commit | — | có | một phần | không | **ra lệnh trái rule**: "unit-ID citations in comments/test names… leave as-is". Rule ngược lại là "Stable Code Artifacts" trong `review-audit-self-decision.md`, nạp cả hai bản | — |
| T4 | #58 reviewer I25 | trả lời | — | có | read-only | không | — | — |
| T5 | #77 plan review | trả lời | — | có | read-only | không | — | — |
| T6 | #102 P8b Rust | có | riêng (`unit-P8b-rust-claude-only-execution-report.md`) | có | allowlist thư mục | không | tên; **chép luật chết** "Create the `docs/decisions/` entry" (`AGENTS.md:65` vs `:13`) | có (`a09cb29a3`); agent tự sửa sang index + spec |
| T7 | #130 phase 4 p6 | có | riêng, local theo plan | có (test, guard) | worktree, cấm git | **có**: "Mode: auto, full scope (no --yagni)" | tên/vị trí | có |
| T8 | #150 council Socrates | trả lời | — | một phần (định dạng) | read-only | không | — | — |
| T9 | #169 answer/resume detach | có | riêng `slug-261005` | có | vùng cấm theo hàm | không ("smallest") | tên | có |
| T10 | #189 workflow step inputs | có | riêng `slug-261005` | có | vùng cấm | không ("keep SIMPLE") | tên | có |

**Số đếm trên 20 brief.**

- **Path:** 10/20 có path. 10 brief còn lại trả về tin nhắn hoặc commit, không cần file. Trong 10 việc cần file, cả 10 đều nêu path.
- **Tên:** cả 10 brief có path đều đọc sẵn tên hoặc mẫu tên. Chỉ 2/10 khớp một biến thể hook (P6, P10, đều là bản project). 8/10 tự đặt kiểu riêng. Vì hai hook nói ngược nhau, **10/10 tên trái ít nhất một hook**.
- **Tiêu chí:** 16 có tiêu chí rõ, 4 có một phần, 0 không có.
- **File:** 14 có allowlist hoặc read-only rõ, 6 chỉ có một phần, 0 không có.
- **Cờ `--yagni`:** chỉ 1/20 nói rõ (T7). Trên toàn bộ 158 brief Agent khác nhau từ 09-25 (đếm heuristic bằng regex), 7/158 nhắc `--yagni`.
- **Xung đột với lớp đã nạp:** 11/20 có ít nhất một xung đột.
  - 8 về tên;
  - 3 về vị trí report (P3, T6, T7);
  - 1 ra lệnh trái rule (T3);
  - 1 chép luật đã chết (T6).
- **Kết quả:** 10/10 brief có path cho output nằm đúng path và đúng tên brief nêu. P6 điền `<HHMM>` đúng mẫu. P3 thêm 2 file `.log` anh em. T6 về sau bị chuyển cả plan sang `archive/` theo quy trình đóng plan.

**Đếm heuristic trên 158 brief Agent duy nhất.** Đây là regex nên chỉ là chỉ báo, không phải đo chính xác.

| Đặc điểm | Số brief |
|---|---|
| Có path `.md/.json` | 135 |
| Có đuôi `Status: DONE` | 121 |
| Có tiêu chí hoặc lệnh kiểm chứng | 112 |
| Read-only / không ghi | 104 |
| Tên dạng `slug-YYMMDD` | 41 |
| Tên dạng `type-YYMMDD-HHmm` | 33 |

**Giới hạn của phần này.**

- Mẫu 20 là nhỏ.
- Các file prompt là brief do người đưa cho một lead mới, không phải prompt Agent. Kết quả của chúng phụ thuộc lead.
- Phép "đúng chỗ" kiểm path/tên, không kiểm chất lượng.
- Brief ngoài tiến trình (codex/agy) không có trong mẫu.

### Tên của 40/48 report W41 lấy từ brief hay từ thói quen lead?

Em chạy `brief-name-origin.py`. Script lấy mọi file cấp một trong `plans/reports/` được add trong ISO W41: 46 file theo `git log --diff-filter=A`, chứ không phải 48 như CRI §4 đếm. Với mỗi file, script tìm lần đầu tiên basename nguyên văn xuất hiện trong transcript forgentX từ 10-04: trong prompt Agent, lệnh dispatch, tin người gõ, hoặc text của assistant.

| Nguồn đọc tên ra | Số file | Phiên |
|---|---|---|
| Brief Agent do lead viết | 39 | `a019f72e` 26, `913dab9b` 13 |
| Brief dạng file do lead viết (`prompt-261006-0950…md:89` → `observe-acceptance-fixes-261006.md`) | 1 | `913dab9b` |
| Lead tự đặt khi tự ghi (text của assistant) | 5 | `herdr-native-status-experiment`, `agy-blind-canary`, `delphi-mdview-live-run`, hai file `prompt-261006-*` |
| Không truy được | 1 | `observe-herdr-acceptance-diagnostic-261005.json` |
| Người gõ trong tin nhắn | 0 | Lần duy nhất người dán tên W41 là handoff 10-05 10:23 UTC, liệt kê *sau khi* các file đã có (handoff do agent soạn) |

**Kết luận.** Tên W41 đến từ brief, và brief là của lead (Claude), không phải của anh. Gốc của kiểu `slug-YYMMDD` là thói quen của lead, truyền qua brief. Mỗi khi lead spawn agent, hook Naming được tiêm cả cho lead lẫn cho agent, nhưng lead vẫn đặt khác hai hook, và agent làm đúng brief.

Kiểu tên này xuất hiện trong lượt người dùng sớm nhất ngày 2026-09-15 (`d4aa8a2d`, `executor-policy-baseline-260915.md`) và 2026-09-20 (`5cbe7412`, "Create exactly one Markdown file: plans/reports/dispatch-execution-engine-architecture-review-260920.md"). Hai prompt đó do người gõ hay dán từ một agent khác thì **UNPROVEN**. Bản tóm tắt sau mỗi lần compaction (`a019f72e` 10-04, 10-05) có chép lại danh sách tên, nên thói quen được mang qua compaction.

Giới hạn: script chỉ so khớp basename nguyên văn. Brief chỉ cho *mẫu* tên (ví dụ `<vai>-261006.md`) không bị đếm; vì vậy 40/46 là cận dưới của phần do brief quyết định.

## 4. Kiểm kê đo hành vi (prior art trước khi thiết kế)

### 4.1 Cái đã có

Commit gốc của phần này là `0b06824a7` ("see nested runs, add unit summaries, a stance sensor and an eval store"). Các commit sửa sau đó: `75606d308`, `b2c7b4588`, `9e47cee82`. Plan: `plans/261005-1143-observe-run-visibility-and-discussion-measurement/`, phase 5-6.

| Thành phần | Đo cái gì | Ở đâu |
|---|---|---|
| **Kho eval** `metrics eval record\|list` | Record chỉ ghi thêm `{evalId, harness (nhãn tự do), question, setup, scores{criterion: 0..2}, rubric, judge, runRefs[]}`; writer giữ `v/type/ts`. Score được kiểm khi ghi và khi đọc; trùng `evalId` bị báo lỗi | `packages/observe/contracts/observe.eval.v1.json`, `packages/observe/rust/src/eval_journal.rs`, `metrics_cli/eval.rs`; `docs/specs/observe.md:64-65`; dữ liệu `.fgos/observe/evals/observe-measurement-261005.jsonl` (2 record, có track) |
| Rubric | `discussion-quality.v1`: 5 tiêu chí, mỗi tiêu chí 0-2. **Rubric khác vẫn tự do** (`observe.md:64`). Working tree đang có thay đổi chưa commit ép đúng 5 key cho rubric này (git status: `observe.eval.v1.json`, `eval_journal.rs` modified) | `docs/reference/discussion-quality-rubric.md` |
| Cách so sánh mù | Quy trình: thư mục scratch ngoài `.fgos` chỉ chứa `A.md`/`B.md`, judge Opus phiên mới, ghi mapping ở ngoài. Phân biệt "mù dữ liệu" với "cô lập" | `docs/how-to/compare-discussion-setups-with-metrics-eval.md` |
| **Cảm biến stance** | Thụ động. Panelist trả `stance: {choice, confidence}` trong claim; các lựa chọn khai qua `--stance-options "a\|b\|c"`. `metrics discussions` cho `stances`, `stancesMissing`, `stancesInvalid`, `agreement` (tỉ lệ nhóm lớn nhất), `genuineSplit` (không lựa chọn nào đạt 2/3). Không có lựa chọn thì ghi `unmeasured`; không bao giờ chặn | phase-05; `src/runner/execution/unit-summary.mjs`; `packages/observe/rust/src/metrics_cli/discussions.rs:131-161` |
| `metrics case` | Một cửa sổ đo cho một việc, gắn `harness ∈ {fgos, cook-plan, plain}`, verdict `usable\|fixed\|discarded`, số lần can thiệp tay, thời lượng; mỗi project chỉ một case mở | `case_journal.rs:248-250`; phase-06 dòng 19 lý giải vì sao không dùng nó để chấm |
| Scorecard `metrics harness/runs/outcomes/entropy/faults/coverage/snapshot` | Đếm run theo executor/adapter/role, phân loại outcome, độ phủ run | `scorecard.rs`, `metrics_cli/*` |
| Nguồn transcript Claude | **Chỉ đọc token usage** (`FastUsage`), không đọc `tool_use` | `packages/observe/rust/src/sources/claude_transcripts.rs:7-40` |
| Cảm biến tự làm trong cuộc điều tra này | Drift tên/vị trí từ git, phiên có tra reading-map hay không, ai đọc ra tên | `naming-drift*.py`, `last200-commits-drift.py`, `transcript-consult-check.py`, `brief-name-origin.py` (thư mục này) |
| Fixture việc tái lập | Kịch bản có text submit chuẩn, tiêu chí đạt và script reset | `dogfood-fixture/scenarios/expr-eval-chain.md`; skill `dogfood-fixture:*` |
| Đòn bẩy để đổi lớp instruction | `claude --help` (bản đã kiểm) có `--setting-sources`, `--tools`, `--strict-mcp-config`, `--safe-mode`, `--disable-slash-commands`. Nhưng `dispatch execute` không có pass-through cờ, và **chưa có invocation cô lập nào được khai báo** (grep `setting-sources\|safe-mode\|strict-mcp` trong `.fgos/config.json` và `src/setup/registrations.mjs` ra 0) | how-to §2 |

**Cách chạy một eval hôm nay:**

1. Chạy các setup thật bằng `fgos run --pattern …` hoặc `fgos workflow start … --stance-options …`.
2. Chép output sang thư mục scratch mù, cho judge chấm.
3. Ghép lại mapping ở ngoài, ghi bằng `fgos metrics eval record --dir <root> < eval.json`.
4. Đọc bằng `fgos metrics eval list --harness X --question Y`. Agreement xem bằng `metrics discussions`.

### 4.2 Có chạy được A/B "cùng việc nhỏ, khác bộ instruction" không?

Chạy được **một phần**. Phần ghi và đọc kết quả đã đủ:

- `harness` là nhãn tự do, có thể đặt tên bộ instruction, ví dụ `agents-only` và `all-layers`.
- `rubric` tự do, có thể là `harness-conformance.v1` với tiêu chí `path-correct`, `name-correct`, `no-reinvention`, `no-extra-files`, mỗi cái 0-2.
- `judge` có thể là `checker:<script>@<sha>`.
- `runRefs` là id các unit run.

Không cần sửa Rust. Stance sensor không dùng được cho việc này: nó đo độ đồng thuận giữa các panelist, không đo việc tuân theo một rule. `metrics case` cũng không dùng được: danh sách harness bị hardcode và chỉ cho một case mở.

Còn thiếu:

1. **Biến số "bộ instruction" chưa tái lập được.** Không có invocation nào khai báo lớp nào được nạp, và `dispatch execute` không truyền cờ. Phần chưa kiểm: `--setting-sources` có loại được `~/.claude/rules/*.md` và `CLAUDE.md` hay chỉ loại settings/hook (UNPROVEN).
2. **Không có bộ chấm cơ học** cho path/tên/file thừa trên diff của một run. Hiện chỉ có script điều tra rời, chạy trên lịch sử git.
3. **Không có kịch bản có đáp án** cho ba loại lỗi:
   - P: một việc viết báo cáo nhỏ, đáp án là path và tên đúng;
   - R: một việc mà năng lực đã có sẵn, đáp án là tên skill hoặc lệnh có sẵn;
   - O/I: một sửa nhỏ có allowlist file.
4. **Chưa có đáp án cho "tên đúng".** Hôm nay có ba quy ước tên report, nên `name-correct` chưa có oracle. Có hai cách: anh chốt một quy ước trước, hoặc chấm "khớp quy ước mà chính bộ instruction của arm đó nói".
5. **Cỡ mẫu và chi phí.** Mỗi arm × kịch bản cần ≥5 lần chạy thì mới hơn mức chỉ hướng. Với 2 arm × 3 kịch bản là ≥30 lần chạy agent. Brief gốc cho phép bỏ qua phần này nếu không có quota.

### 4.3 Bổ sung nhỏ nhất (ưu tiên tái dùng)

1. **Rubric**: một doc `docs/reference/harness-conformance-rubric.md` (`harness-conformance.v1`, 4 tiêu chí, anchor 0/1/2), đặt cạnh `discussion-quality-rubric.md`. Kho eval giữ nguyên.
2. **Bộ chấm**: một script nhận `(worktree, base sha, file đáp án của kịch bản)`, đọc `git diff --name-status base..HEAD` rồi in JSON eval cho `metrics eval record`. Phần so khớp tái dùng logic của `naming-drift-relaxed.py` và `brief-name-origin.py`. Chấm hoàn toàn bằng máy, không cần judge LLM. Riêng `no-reinvention` cần danh sách năng lực có sẵn trong file đáp án.
3. **Kịch bản**: 3 kịch bản theo đúng định dạng `dogfood-fixture/scenarios/*.md` (text chuẩn + tiêu chí đạt + reset), thêm một mục "đáp án" để script đọc.
4. **Biến số bộ instruction**:
   - Rẻ nhất, không cần config: dùng **thí nghiệm tự nhiên có sẵn**. Worktree đã thiếu `.claude/rules` và `.claude/hooks` (S1), còn main checkout có đủ cả hai kit. Chạy cùng kịch bản trong một worktree mới và trong main là có hai arm.
   - Sạch hơn: khai 2 invocation `claude` trong `.fgos/config.json` qua cơ chế invocation hiện có, với cờ đã kiểm bằng `claude --help`. Tuân luật install gate: đăng ký vào setup/doctor nếu thêm config mặc định.
5. Không làm lúc này: mở rộng `claude_transcripts.rs` để đọc `tool_use` (Write path). Đó sẽ là cảm biến thụ động trên mọi phiên, giá trị cao nhưng không còn là "nhỏ nhất".

Thứ bị bỏ khi làm xong: các script đo rời trong thư mục điều tra này có thể nhập vào bộ chấm, không giữ song song.

## Câu hỏi chưa giải quyết

1. Report naming nên theo quy ước nào? Đó là điều kiện để `name-correct` có đáp án (§4.2 mục 4). Đây là quyết định của anh.
2. `--setting-sources` của Claude CLI có loại được `CLAUDE.md` và `~/.claude/rules/*.md`, hay chỉ settings/hook? Chưa kiểm, vì em không chạy agent.
3. Hai prompt người dán ngày 09-15 và 09-20, có kiểu `slug-YYMMDD`, là do anh viết hay dán từ một agent khác?
4. Ba file `platform-foundations.md`: bản `docs/platform/` (Draft, "Canonical: Yes, after review") có đang trên đường thay hai bản kia không? Nếu có thì ai duyệt?
5. Prompt của dispatch ra ngoài tiến trình (codex/agy) nằm ở đâu để lấy mẫu brief? Mẫu của em chỉ có Agent/Task trong tiến trình.

Status: DONE_WITH_CONCERNS

Summary:

- Em đã lập bảng 38 phát hiện cấu trúc có mã nguyên nhân/can thiệp, và sổ sở hữu cho 15 quy ước: 3/15 có một chủ cộng cơ chế kiểm, và 3 cái đó không drift.
- 20 brief mẫu đều được làm đúng path/tên brief nêu. 40/46 tên report W41 do brief của lead đọc ra, không phải do người, nên brief thắng hook.
- Observe đã có kho eval (rubric tự do) đủ để ghi kết quả A/B. Còn thiếu biến số bộ instruction, bộ chấm cơ học và kịch bản có đáp án; bổ sung nhỏ nhất là một rubric doc, một script chấm, 3 kịch bản dogfood và dùng worktree/main làm hai arm.

Concerns:

- Tương quan "một chủ ↔ ít drift" có n nhỏ và bị nhiễu chéo (sở hữu và khả năng kiểm đi cùng nhau).
- 40/46 là cận dưới vì chỉ khớp basename nguyên văn.
- Mẫu brief không có dispatch ngoài tiến trình.
- Phần "triệu chứng" của bảng 1 chỉ dựa trên bằng chứng trong báo cáo vai và memory, không dựa trên bộ ca đã chấm.
