---
type: research
date: 2026-10-16
status: proposal
---

# Guardrails cho chất lượng sinh code: vì sao luật "một cửa" có mà vẫn trùng, và sửa ở đâu

## Kết luận

Luật hiện có không ngăn được trùng lặp vì ba lý do. Thứ nhất, nó không tới được agent lúc viết code. Thứ hai, nó là văn xuôi triết lý, không có lệnh hay đầu ra nào kiểm chứng được. Thứ ba, không có một cổng máy móc nào bắt "cùng một cơ chế xuất hiện hai lần". Forensics trên 8 ca trùng thật cho thấy khoảng 6/8 ca do agent **không tìm** cái đã có, và 2/8 ca do **di trú xong mà không xoá đường cũ**. Cả hai đều chặn được bằng một bước tìm bắt buộc ở lúc implement cộng với một test máy móc trong `npm test`. Viết thêm luật không giải quyết được.

Tài liệu Claude Code nói thẳng: CLAUDE.md là "context, not enforced configuration"; muốn chặn thì dùng hook ([memory docs](https://code.claude.com/docs/en/memory)). Vì vậy hướng sửa là **rút gọn chữ, thêm cổng**.

Báo cáo tổng hợp từ 4 lane đọc song song: bề mặt instruction, cơ chế kiểm tra tự động, forensics trên git, và thực hành bên ngoài.

## 0. Vấn đề cốt lõi và thứ tự giải quyết (chủ repo chốt 2026-10-17)

**Vấn đề cốt lõi là luật không đến được agent đúng lúc nó làm việc:**

- **Có luật mà không được nạp**, vì cách tổ chức, vì bị tràn, vì bị lẫn, hoặc vì bị che:
  - *tổ chức:* danh sách luật luôn nạp chép tay chỉ tới L8, nên L10 "một cửa" không bao giờ tới agent (mục 2a); luật "tìm cái đã có" chỉ có lúc lập plan, không có trong worker contract và brief mà worker thật sự đọc (mục 2);
  - *tràn:* codex chỉ đọc 32 KiB đầu `AGENTS.md`, mọi luật sau ngưỡng biến mất không báo (mục 2d);
  - *lẫn:* khoảng 15-17 KB luật bị Claude đọc hai lần, luật KISS/DRY nằm lọt giữa khối lặp; hai kit cùng tiêm hai khối Rules nói ngược nhau (mục 2b, điều tra 2026-10-06);
  - *che:* hễ có `CLAUDE.md` thì Claude bỏ qua `AGENTS.md` (mục 2d); worktree không có `.claude/rules` vì bị gitignore.
- **Thiếu luật:** 3 trong 7 nguyên tắc của chủ repo (phân tầng một chiều, hexagonal, ưu tiên Rust cho component nền) chưa có luật nào; chưa có luật "thay thế thì xoá" ở lúc implement (mục 2).

Từ đó agent làm theo nguồn gần nhất nó thấy, không biết cơ chế nào đã có chủ, nên code mọc tràn lan (8 ca trùng ở mục 1), hệ thống phình ra, và mất kiểm soát. Các ca trùng, primitive đặt sai tầng và migration bỏ dở là **hậu quả**; dọn chúng mà không sửa nguồn thì chúng mọc lại.

**Thứ tự giải quyết: kiểm soát ở nguồn trước, dọn hậu quả sau.**

1. **Kiểm soát ở nguồn** (mục 4, nhóm A):
   - *Một sổ luật:* mỗi luật có đúng một nguồn chuẩn (`core/instructions/` theo contract projection), có ID, phạm vi (agent nào, giai đoạn nào), và trỏ tới cơ chế kiểm của nó nếu có.
   - *Bảo đảm giao luật:* chiếu sổ luật tới từng CLI qua đúng một đường theo bảng nạp đã đo (mục 2d), trong ngân sách dung lượng (dưới 32 KiB cho codex), không bị che (`CLAUDE.md` chỉ import `AGENTS.md`, đã làm ở `40c667c83`), không trùng, luật quan trọng đặt trước; và đưa luật cần lúc viết code vào worker contract cùng mẫu brief của lead.
   - *Kiểm chứng giao luật:* một check máy móc (doctor và script `instruction-audit`) fail khi một luật đã đăng ký không tới được một CLI, tới hai lần, hoặc nằm sau ngưỡng cắt.
   - *Phủ luật:* đối chiếu 7 nguyên tắc với sổ luật để thấy chỗ thiếu; luật nào cưỡng chế được thì gắn với test (P1, P2, P4) thay vì chỉ là văn xuôi.
2. **Dọn hậu quả** (mục 4, nhóm B): chuyển primitive nền về một nhà ở tầng thấp, gom 8 ca trùng, hoàn tất các migration bỏ dở, dọn hook và bản sao luật thừa.

Lưu ý từ điều tra 2026-10-06 (mục 7): luật đã nạp vẫn có lúc không đủ (lỗi "hỏi thừa" lặp lại khi luật đang được nạp). Vì vậy "kiểm soát ở nguồn" ở đây gồm cả giao luật đúng chỗ lẫn gắn luật với cơ chế kiểm, không chỉ là viết thêm hay chuyển chỗ văn xuôi.

## 1. Bằng chứng: các ca trùng thật và nguyên nhân gốc

| # | Ca trùng | Vị trí | Nguyên nhân |
|---|---|---|---|
| 1 | `/proc` identity cho spawn worker (cli-spawn với herdr-spawn) | `src/runner/dispatch/herdr-round.mjs:153-277` với `detached-run-supervisor.mjs:65-76`; nhà chung `process-identity.mjs:34` đã có từ 09-21 nhưng herdr-round không chuyển sang | Không tìm. Bản herdr (`8c4b4aeeb`) chép từ cli-spawn (`8e3da27c2`) sau đúng một ngày; comment ở `herdr-round.mjs:156` còn nhắc bản gốc. |
| 2 | Parser `/proc/<pid>/stat` | `reconciliation-planner.mjs:23-41` với `process-identity.mjs:34` | Guard import-graph cấm import module adapter nhưng không chỉ ra module lá dùng chung, nên agent chép thuật toán sang. |
| 3 | Resolver session identity | `plugins/fgOS/skills/terminal/rename.sh:75-94` với `src/util/session-identity.mjs` | Di trú (`b4ec8a35e`, 10-15) tuyên bố "drop the Node resolver" nhưng không đụng tới consumer rename.sh. |
| 4 | Kiểm tra pid còn sống và sleep (12 định nghĩa `isPidAlive`/`isProcessAlive`/`getProcessPgid`, 17 nếu tính cả sleep) | `state/events.mjs`, `state/runtime-coordination.mjs`, `runner/gateway-control.mjs`, `runner/session.mjs`, `runner/loop.mjs`, `dispatch/run-lock.mjs`, `dispatch/provider-capacity.mjs`, `workflow/runner.mjs`… | Không tìm. `src/util` không có helper pid, nên tính năng nào cũng tự viết một bản. |
| 5 | Ghi JSON atomic, temp có fsync | `execution/run.mjs:34` với `dispatch/visibility-session.mjs:90`; `run-lock.mjs:75` với `provider-capacity.mjs:395` | Bản trong `run.mjs` viết 9 ngày sau khi `src/util/unique-tmp-tag.mjs` đã có. Bản fix chỉ được áp vào vài bản sao. |
| 6 | Resolve thư mục `.fgos` | `observe/friction-client.mjs:30` với resolver chuẩn `runner/paths.mjs:98` | Không tìm (resolver chuẩn có trước hai tháng). |
| 7 | Resolve repo root | `setup/git-hooks.mjs:39` với `runner/paths.mjs:27` | Không tìm, hoặc helper nằm sai tầng. |
| 8 | Parser frontmatter | `workflow/plan-source.mjs:11` với `report/frontmatter.mjs:57` (đã export) | Không tìm. |

Đính chính báo cáo herdr ngày 10-15: ý "launcher.sh trùng với cli-spawn" **không đúng**. Chỉ `herdr-round.mjs:96-102` sinh launcher. Phần trùng thật là `/proc` identity, liveness và poll.

Không tìm thấy ca nào do các lane song song cùng xây một thứ. Tuy vậy, kế hoạch 3-lane trong báo cáo herdr chính là nơi rủi ro này sẽ xuất hiện.

### 1a. Chuỗi nguyên nhân từ gốc tới hậu quả

| Tầng | Nguyên nhân | Bằng chứng |
|---|---|---|
| Gốc (mục 0) | Luật không tới agent: không được nạp (tổ chức, tràn, lẫn, che) hoặc thiếu luật | Mục 2a-2d; nguyên tắc 1, 2 chưa có luật ở lúc implement |
| Trực tiếp 1 | Primitive dùng chung không có nhà ở tầng thấp: hàm nền nằm rải trong module tính năng hoặc adapter, nên tìm cũng không có chỗ rõ ràng và không biết bản nào là chuẩn | Ca 4 (không có helper pid trong `src/util`, 12 bản), ca 1 (`process-identity.mjs` nằm ở tầng `dispatch`) |
| Trực tiếp 2 | Phân tầng và guard import đẩy sang chép: bản có sẵn ở tầng không được import, guard chỉ cấm mà không chỉ module lá dùng chung | Ca 2 (`reconciliation-planner` chép parser `/proc/stat`), ca 7 (`setup` tự viết resolve repo root) — vi phạm nguyên tắc 2 |
| Trực tiếp 3 | Thay cơ chế mới nhưng không có tiêu chí "xoá xong mới xong" | Ca 3 (`rename.sh` giữ resolver cũ sau khi chuyển sang Rust), ca 5 (bản fix chỉ áp vào vài bản sao) — vi phạm nguyên tắc 1 |
| Sâu | Luật "tìm cái đã có" không ở trong brief, mà brief là nguồn quyết định thật (40/46 tên report lấy từ brief) | `conditions-261006.md` |
| Sâu | Quy trình thưởng cho việc thêm, không cho việc bớt: tiêu chí "đủ hết mới xong", review luôn sinh thêm phase, không ai giữ tổng thể, cùng một việc bị xây hai lần | `prompt-261008-bloat-root-cause-discussion.md` mục 5 |
| Ngoài phạm vi | Chính sản phẩm fgOS có nhiều cửa cho cùng một việc; khoảng một nửa số ca đến từ sản phẩm, công cụ, vận hành | `harness-investigation-261006-synthesis.md` mục 1 |

## 2. Bề mặt instruction: vì sao luật có mà không ăn

- **L10 "Add-through-not-alongside" (`docs/platform-foundations.md:252`) chính là One Door, nhưng không bao giờ được nạp.** Phần chiếu luôn-nạp (`core/instructions/platform-laws.md` và khối "Platform Operating Laws" trong AGENTS.md) chỉ liệt kê L1–L8. Chính L8 đã gọi tên lỗi này: luật không có ở tầng luôn-nạp thì "behaves exactly like no rule at all". Ngay cả L1–L8 cũng chỉ được nạp **tên luật kèm link**, không nạp nội dung; lời luật chỉ nằm trong `docs/platform-foundations.md`, và agent không tự mở file đó trừ khi được bảo. Xem mục 2a về lý do danh sách bị trễ.
- **Bước tìm prior art chỉ có lúc plan, không có lúc implement.** "Prior art before design" có ở AGENTS.md:43-50, nhưng không có trong `fgos-coding-planning`, `fgos-coding-implement` hay `core/skills/_shared/coding-worker-contract.md`. Worker chạy ngoài tiến trình chỉ đọc worker contract (`fgos-coding-implement/SKILL.md:40-45`), và file đó không có một chữ nào về reuse hay duplicate. Luật gần nhất là "Match existing patterns in the touched files" (`SKILL.md:70-71`), chỉ áp lên các file đang sửa, nên không bắt được một module mới mọc ở chỗ khác.
- **Luật bị nạp lặp và quá dài.** Phần luôn-nạp khoảng 62 KB (≈15k token), trong đó khoảng 17 KB là bản lặp (chi tiết ở mục 2b). Anthropic khuyên dưới 200 dòng mỗi file và nói `@import` không giảm context.
- **3/7 nguyên tắc của anh hoàn toàn chưa có luật:** phân tầng một chiều (cho code), hexagonal ports với driver mỏng, và ưu tiên Rust cho component nền. Có một luật còn kéo ngược hướng hexagonal: `coding-worker-contract.md` dặn chỉ thêm cấu trúc "once a second consumer actually needs it".
- **Luật đang mâu thuẫn nhau.** "Keep changes scoped / Add nothing beyond the request" khiến agent coi bản trùng bên cạnh là ngoài phạm vi rồi bỏ qua, trái với RUL11 "gom tới khi hết".

### 2a. Vì sao danh sách luật dừng ở L8

Danh sách luôn-nạp là chép tay, không sinh từ tài liệu gốc, nên trễ đúng kiểu "hai cửa":

| Ngày | Commit | Chuyện gì xảy ra |
|---|---|---|
| 2026-07-14 | `e350acbda` | AGENTS.md có dòng "L1-L8 locked design laws", lúc đó đúng vì mới có 8 luật. |
| 2026-07-18 | `93f7d3c1c` | Thêm L9 và L10 vào `docs/platform-foundations.md`, nhưng không sửa các chỗ đang ghi "L1-L8": AGENTS.md:8, `docs/specs/reading-map.md:3`, `docs/specs/platform-foundations.md`. |
| 2026-09-14 | `04be428b6` | Tạo `core/instructions/platform-laws.md`, nguồn của khối "Platform Operating Laws". Danh sách L1–L8 được viết tay theo con số cũ, không đọc từ tài liệu gốc. |

Không có test nào so danh sách này với các heading `## Lx` của tài liệu gốc, nên nó lệch hai tháng mà không ai biết. Đây là thêm một ca trùng "một sự thật có hai bản, bản sao không sinh từ bản gốc", vi phạm nguyên tắc 7.

### 2b. Nạp trùng là trùng những gì, và tại sao

Claude Code nạp `CLAUDE.md` (dòng 6 là `@AGENTS.md`, nên kéo theo AGENTS.md) cộng với `.claude/rules/*.md`. Có ba nhóm trùng; nhóm nào cũng do một công cụ ghi vào nhiều đích, mỗi đích tưởng chỉ có mình nó được đọc.

| Nhóm | Bản 1 | Bản 2 | Ai ghi, khi nào | Trạng thái |
|---|---|---|---|---|
| Khối GitNexus | CLAUDE.md:79-122 | AGENTS.md:212-255 | `gitnexus analyze` ghi khối `<!-- gitnexus:start -->` vào cả hai file theo template của nó | Đã commit |
| Khối MDView | CLAUDE.md:50 | AGENTS.md:183 | Template MDView có mặt ở cả hai file | Đã commit |
| Bộ luật AgentKit (Development Rules, Documentation, Orchestration, Primary Workflow, Process, Review, 2 file Skill Routing) | `.claude/rules/*.md`, 8 file, đích Claude, cài 15/10 14:59; thư mục bị `.gitignore` (`/.claude/*`) nên không hiện trong git status | AGENTS.md:296-661, khối `AGENTKIT-OMP:START:engineer`, đích omp/Codex, ghi 16/10 11:19 | Bộ cài AgentKit kit `engineer` (thư mục `engineer/` chưa track, có `.agentkit/install-manifest.json`) | Chưa commit |
| Hook trong `.claude/settings.json` (khoảng 19 hook, ví dụ `session-heartbeat` thêm 7 dòng) | Bản có kiểm tra file `P=...; [ -f "$P" ] \|\| exit 0; exec node "$P"` từ `036884908` (06/09) | Bản gọi thẳng `node "${CLAUDE_PROJECT_DIR}/.claude/hooks/X.cjs"`, nối thêm 16/10 11:19; số lệnh hook tăng từ 50 lên 116 | Nhiều khả năng cùng lần chạy AgentKit (trùng giờ); bộ merge không nhận ra bản có kiểm tra file là cùng một hook | Chưa commit |

Hệ quả: khoảng 17 KB luật bị agent đọc hai lần, luật KISS/DRY nằm lọt thỏm giữa khối lặp, và mỗi hook có thể chạy hai lần mỗi lượt. Ngoài ra khối "fgOS Effective Instructions" (AGENTS.md:261) lặp nhẹ vài ý với phần đầu AGENTS.md.

### 2c. Bổ sung 2026-10-16 tối: bộ luật AgentKit nằm ở 4 nơi, và chủ repo dùng 5 CLI cùng lúc

Sau khi báo cáo được viết, kiểm tra thêm cho thấy cùng 8 file luật AgentKit, nội dung giống hệt từng byte (`cmp`), nằm ở **4 nơi** chứ không phải 2. Cả 3 thư mục rules đều bị gitignore (`.gitignore:66,77,78`).

| Nơi | Ai ghi | CLI đọc |
|---|---|---|
| `.claude/rules/*.md` | ak target `claude-code` | Claude |
| `.omp/rules/*.md` | ak target `omp` | omp |
| `.pi/rules/ak-engineer-*.md` | ak target `pi` | pi (có thể qua extension của ak trong `.pi/extensions`) |
| Khối `AGENTKIT-OMP` trong `AGENTS.md` | ak target `omp` | codex, omp, pi, có thể agy, **và Claude** qua `@AGENTS.md` |

Chủ repo dùng Claude, pi, omp, codex và agy **cùng lúc**. Vì vậy đích cần đạt không phải "chọn một đích cho ak", mà là **mỗi CLI thấy mỗi luật đúng một lần**. Gỡ target `omp` như bản đầu báo cáo gợi ý sẽ làm codex, omp và pi mất bộ luật. Muốn thiết kế đúng cần một **bảng nạp (load matrix)** đo thật: CLI nào tự đọc file nào (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.omp/rules`, `.pi/rules`, file `@import`, AGENTS.md lồng theo thư mục). Hiện mới chắc chắn cho Claude (đọc trùng) và codex (chỉ đọc `AGENTS.md`); omp, pi và agy cần chạy thử từng CLI để xác minh. Mục backlog `p-7eb9e65b` giữ việc này.

Kết quả đo thật cho 4 CLI nằm ở mục 2d; cột "CLI đọc" trên là giả định trước khi đo, mục 2d sửa lại nó.

Cùng nguyên nhân gốc còn một lỗi thứ hai: `fgos doctor --fix` chạy toàn bộ 22 fix một lúc, gồm cả việc ghi vào cấu hình của tool khác; nó bỏ qua file JSON hỏng (`src/setup/agent-hooks.mjs:107-108`) nhưng ghi đè cả file lành bằng `JSON.stringify` (`agent-hooks.mjs:35-37`) và không backup. Hai bộ cài cùng coi một file là của mình, và mỗi bên viết lại toàn bộ file đó. Mục backlog `p-68be2ae3` giữ việc này.

### 2d. Bảng nạp đo thật cho 4 CLI (2026-10-17)

**Cách đo.** Mỗi CLI được bật qua `fgos run`, transport herdr, ghim tài khoản, cùng một prompt: không đọc file nào trong repo, chỉ trả lời từ những gì đã có trong context, liệt kê nguồn instruction và đếm số lần thân của 7 heading xuất hiện. Cả 4 lần chạy đều `pass`.

| CLI | Invocation, tài khoản | Unit run |
|---|---|---|
| Claude Code (Sonnet 5.5) | `claude-herdr-bwrap` | `unit-run-1792172342967-f4a278a0` |
| codex | `codex-herdr-fgovn`, openai `tetnu` | `unit-run-1792172342967-348699f2` |
| omp | `omp-gemini-tetcu72`, gemini `tetcu72` | `unit-run-1792172342966-f4168380` |
| pi | `pi-herdr-openrouter`, deepseek `openrouter` | `unit-run-1792172342967-9208ca5c` |

Báo cáo gốc của từng CLI: `.fgos/assignments/<unit run>/producer/1/runs/01/outbox/report-1.md`.

**Kết quả (số lần thân heading xuất hiện trong context):**

| Heading | Claude | codex | omp | pi |
|---|---|---|---|---|
| `# forgent` | 1 | 1 | 1 | 1 |
| `# Development Rules` | **2** | 1 | 1 | 1 |
| `# Primary Workflow` | **2** | 1 | 1 | 1 |
| `# Skill Domain Routing` | **2** | **0** | 1 | 1 |
| `# GitNexus — Code Intelligence` | **2** | 1 | 1 | 1 |
| `## Documentation Viewing (MDView)` | **2** | 1 | 1 | 1 |
| `## fgOS Effective Instructions` | 1 | 1 | 1 | 1 |
| Nguồn project tự khai | `CLAUDE.md`, `AGENTS.md` (qua `@AGENTS.md`), 8 file `.claude/rules` | chỉ `AGENTS.md` | chỉ `AGENTS.md` | `AGENTS.md` |

**Phát hiện:**

1. **Chỉ Claude đọc trùng.** Bộ luật AgentKit, GitNexus và MDView đều đến Claude hai lần: một lần từ `.claude/rules` hoặc `CLAUDE.md`, một lần từ `AGENTS.md` qua `@AGENTS.md`. Khớp với mục 2b và với số đo của script `instruction-audit` (47 nhóm đoạn trùng, khoảng 17 KB).
2. **codex cắt cụt `AGENTS.md` mà không báo.** codex báo `# Skill Domain Routing` xuất hiện 0 lần dù nó nằm trong `AGENTS.md`. Vị trí byte giải thích chính xác: file dài 38.901 byte; mọi heading bắt đầu trước byte 32.768 (32 KiB, giới hạn `project_doc_max_bytes` mặc định của codex) đều được thấy, ví dụ `# Review, Audit, and Decision Rules` ở byte 31.714; mọi heading sau ngưỡng đều mất, ví dụ `# Skill Domain Routing` ở byte 33.144 và `# Skill Workflow Routing` ở byte 37.022. Đây là lỗi **nặng hơn đọc trùng**: bất cứ thứ gì được nối vào cuối `AGENTS.md` (khối AGENTKIT, các projection của fgOS) đều vô hình với codex.
3. **omp không đọc `.omp/rules`.** omp chỉ nhận `AGENTS.md` và mọi heading xuất hiện đúng một lần, nên bản sao trong `.omp/rules` không được dùng (bản sao chết).
4. **pi chưa kết luận chắc được.** pi đếm mọi heading đúng một lần và nói chúng nằm trong `AGENTS.md`, nhưng lại gọi tên các file `ak-engineer-*.md`, tên chỉ có trong `.pi/rules` (không có trong `AGENTS.md`), và mã extension trong `.pi/extensions` không cho thấy chỗ nạp thư mục đó. Cần đo lại bằng chuỗi đánh dấu (canary) cài vào từng file nguồn.
5. **agy chưa đo** vì chưa cài trên máy này.

**Giới hạn của phép đo.** Đây là số liệu CLI tự khai, có thể đếm sai; kết luận 2 có bằng chứng độc lập (vị trí byte), kết luận 1 khớp với script quét. Pane herdr chạy trong home cách ly, nhưng máy này không có file instruction cấp user nào (`~/.claude/CLAUDE.md`, `~/.codex*/AGENTS.md`, `~/.pi/agent/AGENTS.md`, profile omp đều không có), nên không làm lệch kết quả. Phép đo chắc chắn hơn là canary: cài một chuỗi duy nhất vào mỗi file nguồn rồi hỏi CLI thấy chuỗi nào; cách này cần sửa tạm các file instruction.

**Claude Code tự đọc `AGENTS.md` chỉ khi không có `CLAUDE.md` (đo 2026-10-17, Claude Code 2.1.301).** Thử trong hai thư mục tạm, mỗi file chứa một chuỗi đánh dấu riêng: thư mục chỉ có `AGENTS.md` thì Claude thấy chuỗi của `AGENTS.md`; thư mục có cả `CLAUDE.md` thì Claude chỉ thấy chuỗi của `CLAUDE.md` và trả lời NO khi được hỏi trực tiếp về chuỗi của `AGENTS.md`. Vậy `AGENTS.md` chỉ là phương án dự phòng của Claude. Đã áp dụng (commit `40c667c83`): `CLAUDE.md` chỉ còn `@AGENTS.md` và một đoạn giải thích; mục "Impact-analysis capability gate" chuyển sang `AGENTS.md`; khối GitNexus và MDView bị bỏ khỏi `CLAUDE.md`. Không xoá hẳn `CLAUDE.md`, vì một công cụ như `gitnexus analyze` có thể tạo lại nó chỉ với khối của mình, khi đó Claude lặng lẽ thôi đọc `AGENTS.md`. Sau thay đổi, Claude đếm GitNexus, gate và MDView mỗi thứ 1 lần; `AGENTS.md` đã commit dài 24.768 byte, dưới ngưỡng 32 KiB của codex. Phần trùng còn lại (39 nhóm, khoảng 14 KB) là khối AGENTKIT do ak ghi vào `AGENTS.md` lặp lại `.claude/rules` của ak, cả hai chưa commit; khối đó cũng đẩy `AGENTS.md` trong cây làm việc lên 41.722 byte, vượt ngưỡng của codex.

**Hệ quả cho thiết kế (bổ sung P5).** `AGENTS.md` là kênh chung duy nhất mà codex, omp và pi thực sự đọc, và Claude cũng đọc nó qua import. Vì vậy:

- Luật chung đặt một lần trong `AGENTS.md`, và **tổng `AGENTS.md` phải dưới 32 KiB**, hoặc ít nhất mọi luật quan trọng phải nằm trong 32 KiB đầu. Tăng `project_doc_max_bytes` trong `config.toml` của từng home codex chỉ là vá tạm, vì vẫn phải nhớ làm trên mọi máy và mọi tài khoản.
- Với Claude, bỏ các bản sao mà `AGENTS.md` đã phủ: bộ luật AgentKit trong `.claude/rules`, khối GitNexus và MDView trong `CLAUDE.md`.
- `.omp/rules` không mang lại gì cho omp; xác nhận bằng canary rồi bỏ khỏi đích cài của ak.
- Script `instruction-audit` nên cảnh báo khi `AGENTS.md` vượt 32 KiB, kèm danh sách heading nằm sau ngưỡng.

## 3. Cơ chế tự động: cái đã có và chỗ hổng

| Đã có | Chạy ở | Kiểm gì |
|---|---|---|
| `test/architecture.test.mjs` cùng `docs/architecture-manifest.json` | `npm test`, CI (fail cứng) | Mỗi file phải có một dòng manifest; import một chiều qua 5 tầng; domain silo; vài guard one-door viết tay cho từng symbol |
| `.githooks/pre-commit` | commit | Allowlist file ở root, khoá main checkout, không cho xoá `.fgos` |
| `fgos hook dispatch-decide` | PreToolUse Agent/Task | Một cửa cho dispatch |
| CI Rust | CI | `fmt`, `clippy -D warnings`, `test` (`clippy.toml` để trống) |
| Các hook `.claude/hooks/*.cjs` | Pre/PostToolUse | Hầu như chỉ nhắc chữ; `simplify-gate` có chế độ chặn nhưng mặc định tắt |

Chỗ hổng:

- Không có kiểm tra trùng lặp nào. Cả 8 ca ở mục 1 đều qua hết mọi check.
- Manifest chỉ ghi tầng, không có owner hay authority, nên nguyên tắc 7 chưa được kiểm.
- Bên Rust không có ranh giới crate, không có `[lints]`, không có cargo-deny.
- Không có kiểm tra nào yêu cầu "đường cũ đã xoá" khi thay thế một cơ chế.
- `.claude/settings.json` (chưa commit) tăng từ 50 lên 116 lệnh hook; khoảng 19 hook có hai bản, một bản bọc `[ -f ] || exit 0` và một bản gọi thẳng, nên có thể chạy hai lần mỗi lượt. Riêng `statusLine` (đã có sẵn trong bản đã commit, không phải do lần cài ak này) gọi `/home/vantt/.local/bin/node` và `/home/vantt/projects/forgentX/...`, cả hai đường dẫn đều không tồn tại, nên status line đang hỏng.

## 4. Đề xuất, xếp theo đòn bẩy

Mỗi đề xuất ghi rõ nó ép nguyên tắc nào trong 7 nguyên tắc của anh.

### P1. Checker chống trùng: một module, ba nơi gọi, bốn tầng (nguyên tắc 1, 6) — cao nhất

**Chọn test, không chọn linter.** Trùng lặp là chuyện giữa nhiều file, trong khi rule ESLint soi từng file một; muốn biết hàm đã có ở module khác thì vẫn phải tự dựng chỉ mục toàn repo bên trong rule. Repo cũng không có ESLint (`package.json` không có devDependency, không có script lint), nên thêm ESLint là thêm dependency, thêm config và thêm một cửa kiểm tra thứ hai bên cạnh `npm test`, trái One Door. Repo đã có tiền lệ đúng hình dạng cần làm: `test/architecture.test.mjs` đọc manifest rồi kiểm toàn repo, `scripts/test-ownership-lint.mjs` là lint tự viết. jscpd cũng bị loại vì chỉ bắt bản chép gần nguyên văn, trong khi lỗi chính ở đây là viết lại theo hình dạng khác.

**Một module checker Node thuần**, không thêm dependency, đọc `docs/architecture-manifest.json` (phần owner ở P2), được gọi từ ba chỗ:

| Nơi gọi | Vai trò | Chặn cứng |
|---|---|---|
| `npm test` và CI | Chốt cuối, áp cho mọi agent (Claude, Codex, pi, agy) | Có, đây là cái đảm bảo |
| `.githooks/pre-commit` (chỉ file staged) | Chặn sớm, chạy dưới 1 giây | Có, nhưng bỏ qua được bằng `--no-verify` |
| Hook Stop/SubagentStop (P6) | Để agent tự sửa trước khi bàn giao | Phản hồi, không phải chốt |

**Bốn tầng, tầng sau bù cho tầng trước:**

1. **Sở hữu primitive. Đây là tầng mạnh nhất, làm trước.** Muốn viết lại kiểm tra `/proc` identity thì bắt buộc phải đọc `/proc/`, muốn ghi file atomic thì phải gọi `renameSync`. Manifest khai báo mỗi primitive nhạy cảm có đúng một module owner, ví dụ: đọc `/proc/`, `renameSync` để ghi atomic, đọc biến env session id, resolve `.fgos` và repo root, `spawn`/`spawnSync` cho worker, vòng lặp poll và sleep. Checker quét `src/`; primitive nào bị gọi ngoài module owner thì fail. Tầng này bắt được những ca viết lại khác hình dạng (ca 1, 2, 3, 5, 6, 7).
2. **Trùng định nghĩa.** Cùng một tên hàm (top-level hoặc export) định nghĩa ở từ hai module trở lên thì fail; tầng này bắt ca 4 và ca 8. Thêm bước hash thân hàm sau khi chuẩn hoá (bỏ khoảng trắng và comment, đổi tên biến cục bộ thành `_1`, `_2`) để bắt bản chép rồi đổi tên. Node có sẵn bộ parse đủ dùng nếu đi kèm một tokenizer nhỏ; chi tiết chốt lúc làm.
3. **Ratchet: allowlist chỉ được co lại.** Ngày đầu, allowlist chính là danh sách nợ của 8 ca ở mục 1; dọn tới đâu xoá dòng tới đó (RUL11). Rủi ro thật là agent tự thêm dòng để qua test, nên:
   - mỗi dòng phải có lý do và trỏ tới một item nợ, thiếu thì test fail;
   - dòng không còn cần thì test fail, để allowlist không mục dần;
   - hook PreToolUse chặn agent sửa file allowlist; chỉ người được sửa, hoặc phải qua một câu hỏi quyết định;
   - pre-commit và CI in rõ khi allowlist bị nới, để thay đổi đó luôn hiện ra trong review.
4. **Trùng ngữ nghĩa còn sót: review agent, không dùng máy.** Hai cơ chế cùng bản chất mà không dùng chung primitive và không trùng tên thì máy tĩnh không bắt được. Phần này giao cho review agent chạy trên diff với prompt hẹp: "với mỗi hàm hoặc module mới, tra bảng capability owner và tìm cơ chế cùng bản chất". Tầng này không tất định, nên chỉ là lưới thứ hai.

**Lỗ hổng còn lại:** pre-commit bỏ qua được bằng `--no-verify`, và repo commit thẳng lên `main` nên CI chỉ chạy sau khi đã push. Cái đảm bảo thật phải là `npm test` trong quy trình của chính fgOS: runner chỉ commit khi round pass, nên checker phải nằm trong bộ test hoặc canary mà runner chạy cho mỗi Unit. Điểm này cần kiểm khi lập plan.

### P2. Thêm owner và authority vào architecture manifest (nguyên tắc 7, 3)

Đổi mỗi dòng manifest từ chuỗi tầng thành object `{ layer, owns?: [capability] }`, kèm một bảng capability → module owner duy nhất (ví dụ `process-identity` → `src/runner/dispatch/process-identity.mjs`, `fgos-dir` → `src/runner/paths.mjs`). Test của P1 đọc bảng này để biết primitive nào chỉ được gọi ở đâu.

Guard import-graph phải **chỉ ra module lá cần import**, không chỉ cấm. Như vậy ca 2 không còn bị guard "cấp phép" để chép.

Owner bên Rust là crate, ép bằng một test nhỏ dùng `cargo metadata` để khẳng định hướng phụ thuộc giữa các crate, cộng `clippy.toml` `disallowed_methods` cho I/O nằm ngoài port.

### P3. Bước tìm cơ chế có sẵn bắt buộc ở lúc implement, có đầu ra (nguyên tắc 1, 6)

Thêm vào `core/skills/_shared/coding-worker-contract.md` (nơi worker thật sự đọc) và `fgos-coding-implement` Step 1, ngắn gọn và dạng mệnh lệnh:

> Trước khi tạo file, function hay helper mới trong `src/`: tra bảng capability owner trong manifest và grep tên hoặc primitive (`/proc/`, `renameSync`, `resolveFgosDir`…). Ghi vào agentClaim: các hit tìm được và quyết định reuse/extend/new kèm lý do. Nếu thấy bản trùng thì gom vào owner, không đắp cạnh (L10).

Thêm một dòng tương ứng vào phần Red flags.

### P4. Luật "thay thế thì xoá" ở cùng commit (nguyên tắc 1)

Đưa vào worker contract và planning skill: một thay đổi thay thế resolver, facade hay supervisor phải grep mọi consumer, chuyển hướng hoặc xoá chúng trong **cùng** unit. Không xoá được thì mở item nợ có owner. Plan khai báo `replaces: <path cũ>`, và bước validating kiểm path cũ không còn được tham chiếu. Luật này chặn ca 3 và ca 5.

### P5. Đưa L9–L10 và 3 nguyên tắc còn thiếu vào bề mặt luôn-nạp, đồng thời rút gọn (nguyên tắc 2–4, 7)

- Cho `core/instructions/platform-laws.md` (hoặc `src/setup/instruction-projections.mjs`) **sinh** danh sách luật từ các heading `## Lx` của `docs/platform-foundations.md`, thay vì chép tay. Thêm test fail khi danh sách lệch tài liệu gốc. Sửa các chỗ còn ghi "L1-L8" (AGENTS.md:8, `docs/specs/reading-map.md:3`, `docs/specs/platform-foundations.md`).
- Sửa ở **nguồn sinh**, không sửa bản sao, vì sửa tay sẽ bị lần chạy tool sau ghi đè. GitNexus và MDView: giữ một bản ở AGENTS.md, CLAUDE.md chỉ còn `@AGENTS.md` cùng phần riêng của Claude, nếu template GitNexus cho phép tắt việc ghi vào CLAUDE.md. AgentKit: **không** gỡ target nào (xem mục 2c, 5 CLI dùng cùng lúc). Thay vào đó, có một nguồn luật duy nhất, chiếu ra mỗi CLI qua đúng một đường theo bảng nạp đã đo; đích nào đã được một đường khác phủ thì không ghi thêm (ví dụ luật chung đến Claude chỉ qua `@AGENTS.md`, không lặp trong `.claude/rules`). Mở rộng cơ chế projection có sẵn (`src/setup/instruction-projections.mjs`) thay vì dựng cái mới, và cho `fgos doctor` báo khi một CLI nạp trùng (dùng lại script của skill `instruction-audit`). Việc này nằm ở backlog `p-7eb9e65b`.
- Chốt 7 nguyên tắc của anh thành luật có decision ID trong `docs/platform-foundations.md`, vì đổi luật khoá phải qua supersede, không sửa tại chỗ. Mỗi nguyên tắc chỉ chiếu một dòng mệnh lệnh kèm lệnh hoặc test kiểm chứng. Nguyên tắc nào đã có cổng máy móc thì phần chữ chỉ cần một dòng trỏ tới cổng.
- Gỡ phần lặp: khối GitNexus/MDView lặp giữa CLAUDE.md và AGENTS.md, và khối AGENTKIT lặp `.claude/rules` (xem Q1). Gỡ luôn câu "chỉ thêm cấu trúc khi có consumer thứ hai" trong worker contract, vì nó mâu thuẫn với ports.
- Luật theo vùng (Rust gateway, runner, skills) chuyển sang `.claude/rules/*.md` có `paths:` hoặc AGENTS.md lồng theo thư mục để chỉ nạp khi cần.

### P6. Hook làm lớp phản hồi sớm, không làm chốt cuối (nguyên tắc 1, 6)

- **SubagentStop / Stop**: gọi chính module checker của P1 cùng test layer, chỉ trên các file thay đổi. Fail thì exit 2 kèm thông điệp làm được ngay, dạng "hàm X đã có ở Y, import từ đó". Agent tự sửa trước khi bàn giao.
- **PreToolUse Write (file mới trong `src/`)**: không chặn cứng, chỉ chèn `additionalContext` nhắc tra capability owner. Chặn cứng dễ gây false positive và chậm.
- Chốt cuối vẫn là `npm test` và CI, vì Codex, Gemini, pi và agy không dùng hook của Claude Code. Cân nhắc cho pre-commit chạy riêng test P1 và test layer trên file staged; cả hai đều nhanh.

### P7. Dọn `.claude/settings.json` (vệ sinh)

Gỡ khoảng 19 đăng ký hook trùng và sửa `statusLine` đang gọi node và script ở hai đường dẫn không tồn tại. Thêm một check nhỏ vào `fgos doctor` (`src/setup/registrations.mjs`) để báo lệnh hook bị đăng ký trùng. Dọn tay chỉ có tác dụng tới lần `ak kit refresh` sau; cách bền là hợp đồng phân quyền sở hữu file giữa fgOS và các bộ cài khác (hook nhận diện theo đường dẫn script, mỗi tool chỉ sửa khối của mình) trong backlog `p-7eb9e65b`, cộng với `doctor --fix` an toàn (chạy từng fix, chạy thử, sửa ở mức key, có backup) trong backlog `p-68be2ae3`.

### Đề xuất bổ sung theo chuỗi nguyên nhân (2026-10-17)

- **P8. Primitive nền có nhà ở tầng thấp** (nguyên tắc 2, 4): chuyển các hàm nền dùng chung (kiểm tra pid, đọc `/proc`, ghi file atomic, resolve `.fgos` và repo root) về một module `kernel`/`src/util`, hoặc component Rust nền theo nguyên tắc 4; P2 chỉ ghi tên chủ thì chưa đủ.
- **P9. Guard import phải chỉ đường**: guard nào cấm một import thì thông báo và test phải nêu module lá dùng chung cần import, để guard không còn "cấp phép" chép code.
- **P10. Mẫu brief của lead**: brief giao việc viết code có mục bắt buộc "cơ chế có sẵn đã tìm và quyết định dùng lại, mở rộng hay viết mới, lý do".
- **P11. Cân bằng thêm và bớt** (từ báo cáo bloat 2026-10-08): một dòng ngân sách (dung lượng, thời gian, path được phép) ở đầu mỗi plan; mục bắt buộc "cần xoá hay cắt gì" trong mỗi review.

## 5. Thứ tự làm (sắp lại 2026-10-17: kiểm soát ở nguồn trước)

**Nhóm A: kiểm soát ở nguồn (mục 0).**

1. Sổ luật một nguồn: dùng registry đã có từ packaging-distribution P3-P5 (mục 6); chuyển dần luật viết tay trong `AGENTS.md` thành đơn vị luật trong `core/instructions/` theo mẫu plan 261008; chốt cách sinh danh sách luật (P5, Q6); đối chiếu 7 nguyên tắc để lộ luật còn thiếu và chốt chúng (Q4).
2. Giao luật theo các tầng của proposal §4.6: `AGENTS.md` chỉ giữ L0 (câu chỉ đường và luật luôn cần), dưới 32 KiB, không che, không trùng (P5, Q5, Q7); luật cần lúc viết code (L1) đi vào worker contract và mẫu brief theo phạm vi việc (P3, P10); bộ chiếu có ngân sách theo host, giảm theo độ sâu thay vì cắt, fail closed khi tập luật bắt buộc vượt ngân sách.
3. Kiểm chứng giao luật: bổ sung vào nghĩa vụ ở contract mục 11 và check doctor đã có, dùng lại `instruction-audit` (tới đủ, tới một lần, không nằm sau ngưỡng cắt của host); xác nhận bảng nạp bằng canary cho pi và agy.
4. Gắn luật cưỡng chế được với cơ chế: P2 (chủ của từng năng lực), P1 (test chống trùng), P4 (thay thế thì xoá), P9 (guard chỉ đường), P6 (hook phản hồi sớm), P11 (ngân sách và mục "xoá gì").

**Nhóm B: dọn hậu quả.**

5. P8: chuyển primitive nền về tầng thấp.
6. Dọn dần allowlist của P1: ca 1 (`herdr-round` về nhà chung), ca 4 (helper pid), ca 3 (`rename.sh` qua facade Rust)… mỗi ca một item; ca 1 đi cùng M5 trong báo cáo herdr.
7. P7 và phần ak: dọn hook trùng, bản sao luật thừa (theo Q7).

Mỗi bước ở nhóm A ghi ước lượng trọng lượng (số dòng, số file) trước khi lập plan, để chính cơ chế kiểm soát không thành hệ thống nặng tiếp theo (mục 7).

## 6. Quan hệ với các plan và contract đã có (rà 2026-10-17)

| Mục | Trạng thái | Quan hệ |
|---|---|---|
| `plans/260925-documentation-authority-unification/` | Proposed, chưa được duyệt để chạy | Gom quyền sở hữu tài liệu về `docs/platform/**`; không đụng tới việc chiếu instruction vào `AGENTS.md`/`CLAUDE.md`. Không chặn báo cáo này. |
| Agent Context Engine (H3, `docs/platform/proposals/documentation-system-unification.md:40`, thiết kế ở §4.7.2) | Kiến trúc tương lai, "never a blocker" | Nơi nên kế thừa ngân sách nạp theo từng CLI (mục 2d); không có gì để chờ. |
| Contract `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` và `src/setup/instruction-projections.mjs` | Đã chạy; chỉ ghi `AGENTS.md` | Cơ chế sinh khối "fgOS Effective Instructions". Mục 10 cấm tạo `CLAUDE.md` chỉ để nhân bản `AGENTS.md`, nên commit `40c667c83` khớp contract. |
| `plans/261006-1415-fgos-single-door-mechanisms/` phase 06 "AGENTS.md single writer" | Xong (`a004bb598`) | Luật một bên ghi chỉ áp cho phần viết tay của `AGENTS.md`. Tiền đề "CLAUDE.md chỉ import `@AGENTS.md`" của phase này sai ở thời điểm đó; đã ghi chú trong file phase. |
| Backlog `p-7eb9e65b`, `p-68be2ae3` | proposed | Sở hữu phần chồng lấn với ak và `doctor --fix`. |

**Các plan và tài liệu khác về sinh, chống trùng và sắp xếp instruction (rà lại 2026-10-17, gồm `archive/` và `docs/history/`):**

| Mục | Trạng thái | Phạm vi |
|---|---|---|
| `docs/platform/packaging-distribution/code-panel-rollout-plan.md`, các dòng P3 `pd-instruction-source-registry`, P4 `pd-instruction-merge-policy`, P5 `pd-instruction-renderers` (dòng 74-76, 185-240) | Done (dòng 8; commit `04be428b6`, `2e03118c3`, `caebec897`, `be24172ad`, `19d0640dc`, `9def51380`) | Đã xây: registry nguồn luật (`src/setup/instruction-registry.mjs`, `InstructionRegistry`, `discoverInstructionSources`), thứ tự ghép theo loại `COMPOSITION_KIND_ORDER` law → boundary → procedure → preference → host-adapter (`src/setup/instruction-composition.mjs:46`), mã xung đột và trùng id `COMPOSITION_CONFLICT_CODES` (`:54`), bộ chiếu `AGENTS.md` có khối quản lý (`src/setup/instruction-projections.mjs:19-22,139`). Chỉ chiếu ra `AGENTS.md`; adapter cho host khác để "khi có nhu cầu"; `README.md:98` ghi độ phủ ledger mới một phần |
| `plans/261008-1353-decision-question-template-and-cleanup/` | completed (commit `c6078e1b5`, `9c9514f41`, `3d3d32648`) | Ca chống trùng instruction duy nhất đã làm xong: đưa mẫu câu hỏi quyết định vào `core/instructions/decision-question.md` rồi gỡ các đoạn nói trùng ở `AGENTS.md`, skill, prompt (phase 02) |
| `docs/history/instruction-prose-change-governance/DISCUSSION.md` | Đề xuất, vòng 1, chưa có D-ID | Ai được sửa `AGENTS.md`/`CLAUDE.md`/văn xuôi skill và lúc nào; nửa "chạy lại độc lập tự động" đã bị bác, nửa "cổng cấm sửa ngoài đường tường minh" còn mở |
| `docs/history/dispatch-contract-agents-md/` (tsk-2te) | Đã làm (`a54ae66e2`) | Thêm mục `## Dispatch` vào `AGENTS.md`; không chống trùng |
| `archive/plans/261006-1415-fgos-convention-component/phase-06-agents-line.md` | done (`461e12d12`) | Một dòng `AGENTS.md` trỏ tới `fgos convention`, theo nguyên tắc một nguồn |
| `docs/history/canonical-decision-projection/` (tsk-1lv) | Chưa kiểm trạng thái | Mô hình chiếu quyết định ra index sinh tự động (`docs/decisions/index.md`); tiền lệ cho cách sinh và chống lệch |
| `archive/plans/260825-1841-knowledge-registry/phase-08-projections-doctor.md` | completed | Tiền lệ projection kèm check doctor cho artifact tri thức |

**Thiết kế đích đã có trong proposal document-unification** (`docs/platform/proposals/documentation-system-unification.md`, H3, kiến trúc giữ lại cho tương lai, "never a blocker"; plan `plans/260925-documentation-authority-unification/plan.md:547,579` cấm âm thầm mở rộng sang nó):

- **§4.4 One authoring door (dòng 404-415):** tầng luôn nạp chỉ giữ một câu chỉ đường ổn định; luật chi tiết nằm trong governance, constitution và skill "để chúng không trôi dạt trong mọi file AGENTS được sinh ra".
- **§4.6 Dynamic agent context (dòng 484-620):** năm tầng nạp dần: L0 câu kích hoạt (luôn nạp), L1 effective brief (văn xuôi, RULES, quyết định đang hiệu lực, tách ba phần), L2 gói context theo việc, L3 nguồn chuẩn, L4 lịch sử. Mỗi brief khai phạm vi, host, ID nguồn, digest, **ngân sách byte hoặc token**, phần bị lược kèm link, và fail closed khi có xung đột. Khi vượt ngân sách thì *"degrade by depth, not by arbitrary truncation"* — đúng lời giải cho việc codex cắt cụt `AGENTS.md` (mục 2d). Bề mặt dự kiến: `fgos doc context --for <op> --area <a> --paths <p> --stage <s> --budget <n>` trả về `mustRead`, `inlineBrief`, `readOnDemand`, `historyOnDemand`, `excluded`. Proposal cũng ghi nhận nền hiện tại "implemented but not yet sufficient": effective set chỉ có một đơn vị luật, chưa có brief theo phạm vi kèm ngân sách.
- **§4.7.2 Agent Context Engine (dòng 680-713):** sở hữu Instruction Composer, Effective Decision Reducer, Reading Plan Compiler, Context Budgeter và Context Explainability; fail closed khi tập luật bắt buộc vượt ngân sách. Registry và composition trong `src/setup/` là "mầm" của engine này. Packaging-Distribution chỉ render gói context ra file theo host và giữ ledger, không quyết ghép luật (§4.7.3).

Vì vậy nhóm A nên được đóng khung là **lát cắt đầu tiên của Agent Context Engine theo đúng thiết kế đó**, không phải một cơ chế riêng: giữ L0 trong `AGENTS.md` nhỏ (chỉ câu chỉ đường và luật thật sự luôn cần), đưa L1 vào brief và worker contract theo phạm vi việc, thêm ngân sách theo host vào bộ chiếu với quy tắc giảm theo độ sâu thay vì cắt, và dùng tiêu chí fail closed khi tập luật bắt buộc vượt ngân sách. Làm như vậy vẫn khớp với ranh giới của plan document-unification (không âm thầm mở rộng sang engine đầy đủ), vì chỉ chạm phần đã có mầm trong `src/setup/`.

**Quyền ghép luật: một chủ (RUL102, chốt 2026-10-17).** Trước đó contract packaging-distribution §2 giao "composition engine, registry shape" cho packaging-distribution, còn proposal §4.7.2-4.7.3 giao Instruction Composer cho Agent Context Engine; contract không nhắc tới engine này. Để nguyên thì engine tương lai sẽ được dựng cạnh `src/setup/instruction-composition.mjs`, thành hai composer. Chủ repo chọn: **Agent Context Engine sở hữu việc ghép và chọn luật** (thứ tự theo loại, override, xung đột, chọn theo việc, ngân sách theo host, nạp theo tầng); **packaging-distribution giữ phần giao hàng** (tìm và cài nguồn luật, adapter render theo host, ledger, doctor sửa chữa). Lý do: ngân sách cần biết loại và hiệu lực của luật, nên composer và budgeter phải cùng chủ; packaging-distribution là component cài đặt và giao hàng, để nó quyết nội dung là đặt quyền sai chỗ. Có hai lúc giao luật:

- *Giao tĩnh (ghi file):* khi nguồn luật đổi hoặc lúc setup, cài, nâng cấp, packaging-distribution hỏi engine effective set cho từng host rồi render ra `AGENTS.md` và các file host khác.
- *Giao động (theo việc):* runner hỏi engine một gói context L1/L2 cho việc cụ thể và chèn vào brief của worker; không ghi file, packaging-distribution không tham gia.

Engine không biết host hay file. Chặn trọng lượng: chưa dựng component mới; code trong `src/setup/instruction-registry.mjs` và `instruction-composition.mjs` là mầm của engine và chỉ chuyển sang module riêng khi lát cắt ngân sách và chia tầng đầu tiên được làm, trong cùng thay đổi, không giữ hai nơi. Đã ghi vào `docs/specs/distribution.md` (RUL102) và sửa contract §2.

**Hệ quả cho nhóm A: không dựng mới, mở rộng cái đã có.** Cơ chế sổ luật, thứ tự và bộ chiếu đã có từ P3-P5; chỗ hở là gần như không dùng: `core/instructions/` mới có 2 đơn vị luật (`decision-question.md`, `platform-laws.md`), còn phần lớn luật vẫn viết tay trong `AGENTS.md` ngoài registry. Vì vậy:

- *Sổ luật:* chuyển dần các luật viết tay trong `AGENTS.md` thành đơn vị luật trong `core/instructions/` (theo mẫu của plan 261008), để registry có kind, scope và id cho từng luật; không dựng sổ thứ hai.
- *Thứ tự:* "luật quan trọng đặt trước" lấy từ `COMPOSITION_KIND_ORDER`, không sắp tay.
- *Giao luật theo CLI:* thêm ngân sách dung lượng theo host (32 KiB cho codex) vào bộ chiếu và vào contract; adapter cho host khác chỉ thêm khi bảng nạp (mục 2d) cho thấy `AGENTS.md` không đủ.
- *Kiểm chứng:* bổ sung vào danh sách nghĩa vụ ở contract mục 11 (đã có: projection cũ, registry sai, trùng id, adapter bỏ sót luật, sửa tay vùng quản lý) ba mục mới: vượt ngân sách của host, nạp đúng một lần theo bảng nạp, kiểm chứng bằng canary; dùng lại script `instruction-audit`.
- *Cổng sửa văn xuôi:* nối với `docs/history/instruction-prose-change-governance` thay vì mở một thảo luận mới.
- *Rủi ro cần kiểm trước:* plan 261008 có sửa tay trong vùng `AGENTS.md`; cần xác minh vùng khối quản lý có bị ghi đè khi chiếu lại không; khối AGENTKIT của ak nằm ngoài projection và phải được tính vào khi đếm trùng và dung lượng.

**Phân bổ việc:**

- **Làm ngay, chưa plan nào sở hữu:** P1, P3, P4, P6, sửa `statusLine`, canary cho pi và `.omp/rules`, giữ `AGENTS.md` dưới 32 KiB.
- **Gộp vào `p-7eb9e65b`:** đích cài của ak cho từng CLI theo bảng nạp đã đo (mục 2d), bỏ bản trùng `.claude/rules` và `.omp/rules` khi canary xác nhận.
- **Bổ sung vào contract projection:** giới hạn nạp của từng CLI, trước hết là codex chỉ đọc 32 KiB đầu `AGENTS.md`. Contract, code và các plan hiện chưa nói gì về điều này.
- **Vướng contract:** P5 đề xuất sinh danh sách L1–L10 từ `docs/platform-foundations.md`, nhưng mục 4 của contract (dòng 54-56) cấm dùng `docs/**` làm nguồn instruction lúc chạy; nguồn chỉ nằm trong `core/instructions/`, `components/*/instructions/`, `domains/*/instructions/`. Cách khớp contract: sinh danh sách thành một fragment trong `core/instructions/` bằng generator, kèm test fail khi fragment lệch so với các heading `## Lx`. Xem Q6.

## 7. Bằng chứng từ các lần điều tra trước và tác động lên báo cáo này

Hai lần điều tra trước đã hỏi đúng câu hỏi của báo cáo này nhưng bản đầu không dẫn tới:

| Nguồn | Ngày | Nội dung |
|---|---|---|
| `plans/reports/harness-investigation-261006-synthesis.md` và thư mục `plans/reports/harness-investigation-261006/` (`instruction-audit-261006.md`, `enforcement-audit-261006.md`, `conditions-261006.md`, `critic-261006.md`, `fatal-flaws-261006.md`, 57 ca chấm độc lập) | 2026-10-06 | Vì sao agent vẫn làm tùm lum dù đã có RUL11 |
| `plans/reports/prompt-261008-bloat-root-cause-discussion.md`, bằng chứng chính `plans/reports/opus-genesis-drift-forensics-261008.md` | 2026-10-08 | Vì sao hệ thống đi chệch hướng và phình to, nhìn từ genesis |
| `plans/reports/research-261015-1116-herdr-tab-pane-layout-and-naming.md` | 2026-10-15 | Báo cáo khởi đầu cuộc thảo luận này; mục 1 đính chính ý "launcher.sh trùng" của nó |

**Kết luận của các lần trước đáng giữ:**

- Chỉ khoảng một nửa số ca là lỗi instruction; nửa còn lại là lỗi sản phẩm fgOS, công cụ, hạ tầng hoặc model. Chỉ khoảng 30% ca cần sửa bằng instruction hay cơ chế (synthesis mục 1).
- "Luật rõ mà agent làm trái" gần như không có (1-3/57): agent sai vì không có nguồn đúng, hai nguồn mâu thuẫn, hoặc đi nhầm cửa.
- Quy ước có đúng một nguồn cộng một cơ chế kiểm thì không lệch (3/15); quy ước không chủ, không kiểm thì đều lệch (9/15) (`conditions-261006.md`).
- Dữ liệu bác bỏ cách sửa bằng thêm văn xuôi vào tầng luôn nạp: lỗi "hỏi thừa" lặp 3 lần trong khi luật tương ứng đang được nạp (`fatal-flaws-261006.md` mục 0).
- 0/57 ca được chứng minh là do hai kit (ck, ak) nói ngược nhau; nạp trùng là nợ vệ sinh và tốn token, chưa phải nguyên nhân hành vi đã chứng minh (`critic-261006.md`, `fatal-flaws-261006.md`).
- Guardrail có thể thành hệ thống nặng tiếp theo; mỗi đề xuất phải nêu trọng lượng của chính nó. Bộ tối thiểu được gợi ý: một dòng ngân sách (dung lượng, thời gian, path được phép) ở đầu mỗi plan, một script dưới 100 dòng kiểm diff trước khi merge, và mục bắt buộc "cần xoá hay cắt gì" trong mỗi review (`prompt-261008-bloat-root-cause-discussion.md` mục 6-7).

**Tác động lên báo cáo này:**

| Điểm | Tác động |
|---|---|
| Một nguồn cộng một cơ chế kiểm thì không lệch | Ủng hộ P1 và P2; đây là hướng chính |
| Văn xuôi luôn nạp không sửa được hành vi | P5 không thêm luật văn xuôi mới vào `AGENTS.md` ngoài mức tối thiểu; ưu tiên cơ chế (P1, P2, P4) và đặt luật đúng chỗ worker đọc (P3) |
| Nạp trùng chưa chứng minh là nguyên nhân hành vi | Chống trùng instruction (mục 2b-2d, P5, P7) được xếp là vệ sinh và tiết kiệm token, không phải lời giải chính cho việc code bị sinh trùng. Ngoại lệ là codex cắt cụt `AGENTS.md` ở 32 KiB (mục 2d): đó là luật bị mất thật, không chỉ là tốn token |
| Guardrail có thể thành hệ thống nặng | Mỗi đề xuất P1-P7 cần ghi ước lượng trọng lượng (số dòng, số file) trước khi lập plan; cân nhắc thêm dòng ngân sách cho mỗi plan |
| Quyết định phạm vi của chủ repo ngày 2026-10-06 lúc 12:26: skill, hook và rules của ak và ck là sản phẩm của người khác, chỉ là ràng buộc môi trường, không phải đối tượng để sửa, xoá hay dedupe (synthesis mục 0) | Mâu thuẫn với phần P5 bỏ `.claude/rules` và `.omp/rules` và với backlog `p-7eb9e65b`. Chờ chủ repo xác nhận quyết định đó còn hiệu lực hay được thay (Q7); trong lúc chờ, các bước động vào cấu hình cài của ak không được thực hiện |

## Câu hỏi chưa giải quyết

- **Q1.** ~~Có phải lần chạy `ak` lúc 16/10 11:19 không, và nên giữ đích nào?~~ Đã trả lời: đúng là chủ repo vừa cài ak; nhưng vì 5 CLI được dùng cùng lúc nên không gỡ đích nào (mục 2c). Đã đo cho Claude, codex, omp và pi (mục 2d). Còn mở: agy (chưa cài), và xác nhận pi cùng `.omp/rules` bằng canary.
- **Q2.** Các worker ngoài tiến trình (pi, agy, Codex) có nạp AGENTS.md không? Đã đo một phần (mục 2d): codex, omp và pi đều nạp `AGENTS.md`, nhưng codex chỉ đọc 32 KiB đầu; agy chưa đo. Dù vậy P3 vẫn nên nằm trong worker contract, vì brief là nguồn gần nhất có thẩm quyền mà worker chắc chắn đọc.
- **Q3.** Checker của P1 có đang nằm trong bộ test hoặc canary mà runner chạy trước khi commit mỗi Unit không? Nếu không, cần đưa vào để `--no-verify` và việc commit thẳng lên `main` không lách được.
- **Q4.** 7 nguyên tắc nên chốt thành luật khoá mới (L11+, có decision ID) hay đưa vào spec dưới dạng guideline không khoá?
- **Q5.** Xử lý giới hạn 32 KiB của codex thế nào: rút `AGENTS.md` xuống dưới 32 KiB (đề xuất), sắp lại để luật quan trọng nằm trong 32 KiB đầu, hay tăng `project_doc_max_bytes` trên mọi home codex?
- **Q6.** P5: sinh danh sách luật thành fragment trong `core/instructions/` kèm test chống lệch (đề xuất, khớp contract mục 4), hay sửa contract để cho phép đọc từ `docs/platform-foundations.md`?
- **Q8.** ~~Quyền ghép luật thuộc Agent Context Engine hay packaging-distribution?~~ Đã chốt 2026-10-17: Agent Context Engine ghép và chọn luật, packaging-distribution giao hàng (RUL102, mục 6).
- **Q7.** Quyết định ngày 2026-10-06 ("ak và ck là ràng buộc môi trường, không sửa, xoá hay dedupe") còn hiệu lực không? Nếu còn, phía fgOS chỉ chọn cách đặt luật để tránh trùng, và các bước động vào cấu hình cài của ak (P5, `p-7eb9e65b`) thành đề xuất gửi ak. Nếu thay, ghi một quyết định mới có ID cho phép fgOS cấu hình đích cài của ak trong repo này.
