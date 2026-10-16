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

## 5. Thứ tự làm

1. P1 + P2: test trùng, owner trong manifest, allowlist ban đầu = 8 ca. Đây là cổng đã chặn được nguyên nhân chính.
2. P3 + P4: sửa worker contract và skill implement/planning (render lại qua `npm run build:skills`).
3. P5: chốt luật mới, mở rộng phần chiếu L1–L10, rút gọn instruction.
4. P6: hook Stop/SubagentStop gọi lại chính test của P1.
5. Dọn dần allowlist: gom ca 1 (`herdr-round` về `process-identity`), ca 4 (helper pid trong `src/util`), ca 3 (rename.sh qua facade Rust)… mỗi ca một item. Ca 1 nên đi cùng M5 trong báo cáo herdr.

Không cần agent nào ghi nhớ thêm điều gì: P1/P2 ép bằng máy, P3/P4 nằm đúng chỗ worker đọc, P5 giảm nhiễu để luật còn lại được tuân theo.

## 6. Quan hệ với các plan và contract đã có (rà 2026-10-17)

| Mục | Trạng thái | Quan hệ |
|---|---|---|
| `plans/260925-documentation-authority-unification/` | Proposed, chưa được duyệt để chạy | Gom quyền sở hữu tài liệu về `docs/platform/**`; không đụng tới việc chiếu instruction vào `AGENTS.md`/`CLAUDE.md`. Không chặn báo cáo này. |
| Agent Context Engine (H3, `docs/platform/proposals/documentation-system-unification.md:40`, thiết kế ở §4.7.2) | Kiến trúc tương lai, "never a blocker" | Nơi nên kế thừa ngân sách nạp theo từng CLI (mục 2d); không có gì để chờ. |
| Contract `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` và `src/setup/instruction-projections.mjs` | Đã chạy; chỉ ghi `AGENTS.md` | Cơ chế sinh khối "fgOS Effective Instructions". Mục 10 cấm tạo `CLAUDE.md` chỉ để nhân bản `AGENTS.md`, nên commit `40c667c83` khớp contract. |
| `plans/261006-1415-fgos-single-door-mechanisms/` phase 06 "AGENTS.md single writer" | Xong (`a004bb598`) | Luật một bên ghi chỉ áp cho phần viết tay của `AGENTS.md`. Tiền đề "CLAUDE.md chỉ import `@AGENTS.md`" của phase này sai ở thời điểm đó; đã ghi chú trong file phase. |
| Backlog `p-7eb9e65b`, `p-68be2ae3` | proposed | Sở hữu phần chồng lấn với ak và `doctor --fix`. |

**Phân bổ việc:**

- **Làm ngay, chưa plan nào sở hữu:** P1, P3, P4, P6, sửa `statusLine`, canary cho pi và `.omp/rules`, giữ `AGENTS.md` dưới 32 KiB.
- **Gộp vào `p-7eb9e65b`:** đích cài của ak cho từng CLI theo bảng nạp đã đo (mục 2d), bỏ bản trùng `.claude/rules` và `.omp/rules` khi canary xác nhận.
- **Bổ sung vào contract projection:** giới hạn nạp của từng CLI, trước hết là codex chỉ đọc 32 KiB đầu `AGENTS.md`. Contract, code và các plan hiện chưa nói gì về điều này.
- **Vướng contract:** P5 đề xuất sinh danh sách L1–L10 từ `docs/platform-foundations.md`, nhưng mục 4 của contract (dòng 54-56) cấm dùng `docs/**` làm nguồn instruction lúc chạy; nguồn chỉ nằm trong `core/instructions/`, `components/*/instructions/`, `domains/*/instructions/`. Cách khớp contract: sinh danh sách thành một fragment trong `core/instructions/` bằng generator, kèm test fail khi fragment lệch so với các heading `## Lx`. Xem Q6.

## Câu hỏi chưa giải quyết

- **Q1.** ~~Có phải lần chạy `ak` lúc 16/10 11:19 không, và nên giữ đích nào?~~ Đã trả lời: đúng là chủ repo vừa cài ak; nhưng vì 5 CLI được dùng cùng lúc nên không gỡ đích nào (mục 2c). Đã đo cho Claude, codex, omp và pi (mục 2d). Còn mở: agy (chưa cài), và xác nhận pi cùng `.omp/rules` bằng canary.
- **Q6.** P5: sinh danh sách luật thành fragment trong `core/instructions/` kèm test chống lệch (đề xuất, khớp contract mục 4), hay sửa contract để cho phép đọc từ `docs/platform-foundations.md`?
- **Q5.** Xử lý giới hạn 32 KiB của codex thế nào: rút `AGENTS.md` xuống dưới 32 KiB (đề xuất), sắp lại để luật quan trọng nằm trong 32 KiB đầu, hay tăng `project_doc_max_bytes` trên mọi home codex?
- **Q2.** Các worker ngoài tiến trình (pi, agy, Codex) có nạp AGENTS.md không? Nếu không, P3 bắt buộc phải nằm trong worker contract (báo cáo đã đề xuất như vậy).
- **Q3.** Checker của P1 có đang nằm trong bộ test hoặc canary mà runner chạy trước khi commit mỗi Unit không? Nếu không, cần đưa vào để `--no-verify` và việc commit thẳng lên `main` không lách được.
- **Q4.** 7 nguyên tắc nên chốt thành luật khoá mới (L11+, có decision ID) hay đưa vào spec dưới dạng guideline không khoá?
