# tsk-62d — mục đích + cách làm (internal code research)

Ngày: 2026-07-31. Scope: đọc code thật (không web research — task này thuần nội bộ repo).

## 1. Phát biểu lại mục đích

tsk-62d cho `judgeDiscovery` (discovery.mjs) và `judgeDecompose` (decompose.mjs) —
hai "phán quan cơ học" chạy nested `claude -p` để quyết item đã đủ rõ/đủ khả thi
chưa — khả năng **tự đi tìm bằng chứng grounding thật (scout: đọc file, grep repo)
TRƯỚC KHI park item lên `awaiting-human`**.

Hiện tại hai judge này chỉ đọc text (title/description/locked context) rồi phán —
không có quyền chạy tool nào ngoài `git add/commit`. Nhiều câu hỏi bị đẩy lên
người trong khi câu trả lời đã nằm sẵn trong repo (vd "file X có tồn tại không",
"hàm Y có test chưa") — lẽ ra judge tự tra được, không cần hỏi người.

Mục tiêu cụ thể: judge tự scout trước → nếu scout đủ làm rõ, tự phán luôn; chỉ
khi VẪN mù mờ sau scout mới rơi xuống nhánh hỏi người hiện có (fgos-coding-exploring).
Không đổi bản chất "real-model judge" đã có — chỉ thêm input (bằng chứng tự tìm)
trước khi judge kết luận.

## 2. Grounding đã xác minh trong code

- `judgeDiscovery`/`judgeDecompose` cùng dùng chung `runJudgeExecutor`
  (`src/intake/judge-executor.mjs`) → `spawnAttempt` → `resolveExecutorCommand`
  (`src/runner/dispatch.mjs:423`). **Cùng một hàm này cũng là hàm `spawnWorker`
  dùng để dispatch worker thật** (GitNexus xác nhận: `resolveExecutorCommand`
  called by cả `spawnAttempt` lẫn `spawnWorker`).
- `allowedTools` hôm nay nằm trong `DEFAULT_RUNNER_CONFIG.executor.args`
  (`dispatch.mjs:207-220`): `Bash(git add:*),Bash(git commit:*)` — **một chuỗi
  DUY NHẤT, dùng chung cho worker thật lẫn 2 judge**. Mở `allowedTools` này ra
  cho judge = mở luôn cho worker (không phải cái task muốn).
- Đã có tiền lệ override theo chiều khác: `resolveExecutorConfig(cfg, tier)`
  (`dispatch.mjs:404-411`) đọc `cfg.executors[tier]` trước, fallback
  `cfg.executor` — một **bảng tra cơ học per-tier** (P41), đúng kỷ luật RUL44
  ("bảng tra luật thứ tự, không gọi model trong vòng chọn"). Đây là điểm mở rộng
  tự nhiên nhất cho tsk-62d: thêm MỘT khóa override nữa (vd theo "role" thay vì
  "tier") thay vì sửa `DEFAULT_RUNNER_CONFIG` dùng chung.
- `judge-executor.mjs`'s `spawnAttempt` gọi `spawnSync` **không truyền `cwd`** →
  chạy tại `process.cwd()` của tiến trình fgOS ngoài (thường là repo root, vì
  clarify/decompose chạy TRƯỚC khi item có worktree riêng — worktree chỉ dựng ở
  `executing`). Nghĩa là một `Bash(rg:*)` cho judge sẽ tự nhiên scan đúng repo
  chính, không cần thêm logic chọn cwd.
- Retry/reliability đã có sẵn: `MAX_JUDGE_ATTEMPTS = 3`
  (`judge-executor.mjs:22`), `JUDGE_STRICT_JSON_SUFFIX` ép JSON thuần khi retry,
  `stripCodeFence` xử lý habit bọc ```json``` của model — cơ chế fail-safe RUL48
  đã sẵn ("một lỗi không bao giờ chặn kết quả, nuốt lặng lẽ về nhánh không-rõ").
  Thêm tool-use thật vào attempt đầu là bề mặt CHƯA test qua cơ chế retry này —
  đúng như task tự nêu ở mục (3).
- `discovery.mjs`'s header docs tự ghi rõ: "FAIL-SAFE (D4): judgeDiscovery never
  throws... The system is never allowed to treat an uncertain judgement as a
  pass." — bất kỳ scout attempt nào lỗi/timeout PHẢI fold về "chưa rõ", không
  được crash hay tự suy positive.
- RUL42 (`docs/specs/runner.md:893`) xác nhận đúng như task tự nêu ở mục (4):
  RUL42 khóa **vòng chọn-giao (picker)** cơ học vĩnh viễn — không cấm judge tự
  suy luận. `judgeDiscovery`/`judgeDecompose` là "bộ não thông minh ở giai đoạn
  làm-rõ/chia-việc" — đúng cửa (1) mà RUL42 tự mô tả cho trí tuệ vào hệ. Judge
  vẫn chỉ GHI kết luận qua field chuẩn (`addDiscovery`/`addDecision`/
  `moveStage`) như cũ — không tự áp cạnh chuyển-stage, không đụng picker. **Xác
  nhận: không vi phạm RUL42.**

## 3. Sibling context (cost sizing)

- **tsk-4xr** (fgos-coding-exploring re-scout mid-conversation) — RẺ hơn nhiều: chỉ
  sửa `SKILL.md` step 2 (thêm hướng dẫn "scout lại khi câu trả lời hé lộ term
  mới"), không đụng config/architecture — fgos-coding-exploring vốn đã là live session
  có tool access sẵn. Không phải hard dependency của tsk-62d nhưng cùng hướng
  ("cho vòng làm-rõ nhiều grounding hơn trước khi hỏi người") — có thể cân nhắc
  làm tsk-4xr trước vì rẻ, học được pattern prompt/scout trước khi đụng
  tsk-62d (đắt hơn: sửa nested spawn, allowedTools, reliability).
- **tsk-3go** (discover-loop skill) — độc lập về mặt code, nhưng CHUNG một
  đồng hồ chi phí: cả hai đều làm MỖI lượt discover/decompose tốn hơn (tsk-3go:
  chạy loop quét nhiều item liên tục; tsk-62d: mỗi lượt giờ có tool call thật
  thay vì text completion thuần). Nếu làm cả hai, nên size chung — chạy
  discover-loop VỚI judge đã có scout thật = nhân chi phí hai chiều cùng lúc.

## 4. Cách làm — options

**Vấn đề cốt lõi cần giải trước khi code**: `allowedTools` hôm nay là 1 chuỗi
dùng chung worker + judge qua cùng `resolveExecutorCommand`. Cần tách.

### Option A — role-scoped executor override (khuyến nghị)
Thêm một khóa override thứ hai cạnh `cfg.executors[tier]` đã có, vd
`cfg.executors.judge` (hoặc field riêng `cfg.judgeExecutor`), chứa
`args` riêng với `allowedTools` mở rộng có kiểm soát (vd
`Bash(rg:*),Bash(git add:*),Bash(git commit:*)` — thêm `rg`, không mở `Bash(*)`
tràn lan). `judge-executor.mjs`'s `spawnAttempt` gọi
`resolveExecutorCommand(cfg, { prompt, model, role: 'judge' })` thay vì tier;
`resolveExecutorConfig` thêm một nhánh đọc `cfg.executors.judge` trước
`cfg.executor` khi `role === 'judge'`.
- Ưu: đúng pattern P41 đã có (bảng tra, không sửa hành vi worker), tối thiểu
  diff, giữ `DEFAULT_RUNNER_CONFIG` cho worker y nguyên.
- Cần: thêm 1 field config mới, migrate default `.fgos-runner.json` (thêm
  `executors.judge` block) — chưa phá vỡ config cũ vì có fallback
  `cfg.executor`.

### Option B — args override truyền thẳng, không qua config
`runJudgeExecutor`/`spawnAttempt` build `args` riêng tại chỗ (không qua
`cfg.executor.args`), hard-code `allowedTools` cho judge ngay trong
`judge-executor.mjs`.
- Ưu: không đụng schema config, diff nhỏ hơn nữa.
- Nhược: phá nguyên tắc "template không hard-code trong code, tách config"
  (RUL44 tinh thần) — người vận hành muốn tắt/chỉnh scout cho judge phải sửa
  code thay vì config. Không khớp pattern P41 đã xây.

**Khuyến nghị: Option A** — nhất quán với cách repo đã giải bài toán y hệt
(per-tier override) một lần rồi (P41/RUL44), rủi ro thấp, không đụng
`DEFAULT_RUNNER_CONFIG` dùng chung.

### Việc còn lại sau khi tách allowedTools
1. Prompt build (`buildDiscoveryPrompt`/tương đương trong decompose.mjs) cần
   thêm bước: model tự quyết có cần scout không, RỒI mới trả JSON verdict —
   nghĩa là ĐỔI shape từ "1 lượt text completion" sang "1 phiên có thể gọi
   tool nhiều bước trước khi trả JSON cuối". Đây là thay đổi lớn hơn allowedTools
   — cần xác nhận `claude -p` với `--allowedTools` cho phép model tự chủ
   động gọi Bash trong headless mode (nhiều khả năng có, cần verify thực tế
   bằng 1 lượt chạy tay trước khi code).
2. Reliability check theo mục (3) của task: chạy thử N lượt judge có scout,
   đo tỷ lệ parse-fail so với baseline không-scout — nếu tăng đáng kể, retry
   3 lần hiện tại có thể không đủ.
3. Cost/latency: đo thời gian 1 lượt judge có scout vs không — quyết có cần
   giới hạn số lệnh `rg` mỗi lượt hay timeout riêng cho scout phase không.

## 5. Quyết định đã chốt (2026-07-31, qua thảo luận)

- **Cơ chế cấp quyền: Option A** — role-scoped executor override
  (`cfg.executors.judge`, song song `cfg.executors[tier]` đã có ở P41), KHÔNG
  hard-code args trong `judge-executor.mjs`. `resolveExecutorCommand` nhận
  thêm chiều `role` cạnh `tier` hiện có.
- **Không build Skill riêng cho scout.** Lý do: RUL6 (`docs/specs/runner.md:853`)
  — headless `claude -p` phòng thủ bằng chỉ-dẫn + allowlist TỐI THIỂU, không
  sandbox; mở Skill tool là mở thêm bề mặt, ngược tinh thần "tối thiểu". Khác
  lớp thực thi: fgos-coding-exploring's scout chạy trong session tương tác (đã có
  Grep/Bash sẵn); judgeDiscovery/judgeDecompose chạy nested `claude -p` process
  con riêng, không thừa hưởng skill catalog của session cha — Skill tool không
  giải đúng vấn đề (vấn đề thật là scope `--allowedTools` của process con).
- **DRY cho câu chữ "1 lượt scout" giữa 3 chỗ dùng (fgos-coding-exploring step 1,
  judgeDiscovery, judgeDecompose): tách prompt-template file riêng**, theo
  đúng pattern RUL44 đã có (`src/runner/prompt-templates/*.txt`, committed,
  chỉ substitution, không logic trong template). Không phải Skill artifact.

## Câu hỏi chưa chốt
- `Bash(rg:*)` đủ hay cần thêm `Read`-shaped tool (đọc file trực tiếp, không
  qua rg) cho judge? Task gốc chỉ nêu ví dụ `rg`, chưa chốt danh sách tool đầy
  đủ.
- Option A field name (`cfg.executors.judge` vs field riêng `judgeExecutor`)
  — quyết ở bước planning, chưa cần chốt ở bước discuss này.
- Có nên làm tsk-4xr trước để validate pattern "scout thêm giữa chừng" rẻ hơn,
  rồi mới áp dụng lên tsk-62d (đắt hơn, đụng nested spawn) không? Gợi ý có
  trong mục 3, chưa phải quyết định.
