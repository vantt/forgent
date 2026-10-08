# Phase 01 — Mẫu câu hỏi quyết định + validator `fgos ask`

## Bối cảnh

- Validator: [src/state/status-fsm.mjs:295-334](../../src/state/status-fsm.mjs) — khi chuyển sang `awaiting-human`, đòi `## Context` và `## Why this matters`, mỗi mục ≥ 20 ký tự, so heading bằng regex `\b` (tsk-539, `9828447d9`).
- Mọi nơi sinh câu hỏi (red-team đếm lại, không phải 3):
  - `src/intake/plan.mjs:266-275` `formatProposalAsk` (3 nhánh). Nhánh rủi ro/blast-radius phải **giữ nguyên chuỗi lý do** `DEFAULT_RISK_GATE_REASON`/`DEFAULT_BLAST_RADIUS_GATE_REASON`, vì gate được nhả bằng `gate.ask.includes(...)` (`plan.mjs:703-713, 732`).
  - `src/intake/plan.mjs:551-556` (verify-dispute).
  - `src/intake/discovery.mjs:455-460` (verify-dispute).
  - `src/intake/discovery.mjs:61-62` `DEFAULT_UNCLEAR_QUESTION` — câu trần, không heading; hôm nay đã trượt validator cũ.
  - `src/intake/discovery.mjs:545` — câu hỏi thô của worker headless (prompt `src/runner/prompt-templates/worker-prompt-discovery.txt:43` bảo worker trả một câu). Test che lỗ này bằng fixture có sẵn heading (`test/runner/loop.test.mjs:2113`).
- Câu hỏi Socratic (exploring/shaping) cũng đi qua `fgos ask` (`domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md:64-82`), nên validator áp lên mọi loại câu hỏi — D1 (owner): 3 phần ở `discovery`/`exploring`, 5 phần ở stage khác.
- `fgos ask` đã có `--rationale`/`--alternatives` (`bin/fgos.mjs:1759-1768`, `src/state/store.mjs:1372-1397`) — kênh song song cho lựa chọn/lý do; bị xoá ở Phase 05 (D3b).
- Render luật: `core/instructions/*.md` chỉ được chiếu vào AGENTS.md khi project có `core/instructions` (`src/setup/registrations.mjs:3502-3504`) — tức chỉ repo fgOS. Project khác chỉ nhận skill qua plugin. Writer là doctor fix `instruction-projections-stale`, chạy trên **main checkout** (`registrations.mjs:3500-3501`), và ghi kèm `.fgos/instructions/effective/repo.json`. Khối chiếu chép **toàn bộ** thân luật vào AGENTS.md (`src/setup/instruction-projections.mjs:125-136`).
- RUL9/L8: mọi luật ở tầng luôn-nạp cần anchor phrase có assert (`docs/specs/platform-foundations.md:72`, tiền lệ `test/docs/rul11-anchor-phrase.test.mjs`).

## Chỗ đặt mẫu (sửa theo red-team)

- **Nguồn duy nhất của mẫu:** `core/skills/_shared/decision-question.md` — đi theo skill tới mọi project (giống `../_shared/citation-format.md`).
- **Luật:** `core/instructions/decision-question.md` ≤ 8 dòng: anchor phrase + trỏ tới `core/skills/_shared/decision-question.md`. Khối chiếu trong AGENTS.md vì vậy chỉ thêm ~10 dòng; khối sinh tự động không tính vào ngân sách, chỉ sửa ở file nguồn.
- **Thông báo lỗi của validator** liệt kê đủ các phần bắt buộc kèm một dòng giải thích mỗi phần, để agent ở project khác học được mẫu từ chính lỗi.

## Mẫu (nội dung `core/skills/_shared/decision-question.md`)

Mọi câu hỏi gửi owner để chọn hướng — trong chat, `AskUserQuestion`, `fgos ask`, gate, review — có đủ 5 phần:

1. **Chuyện gì đang xảy ra** — 1–2 câu, ngôn ngữ thường.
2. **Nguyên nhân** — đã kiểm bằng gì. Chưa biết nguyên nhân thì chỉ xin phép điều tra.
3. **Các lựa chọn** (2–4) — mỗi cái: làm gì, lợi, hại, giá (dòng code ước tính, thời gian, tầng/đường dẫn bị đụng).
4. **Khuyến nghị** — chọn cái nào, vì sao.
5. **Phạm vi của câu trả lời** — đồng ý thì được làm gì, không được làm gì.

Heading chấp nhận tiếng Việt hoặc tiếng Anh tương đương (`What is happening`, `Cause`, `Options`, `Recommendation`, `Scope of the answer`) — fgOS chạy trên project khác, nhiều skill viết tiếng Anh.

Câu hỏi Socratic khám phá ý định (stage `discovery`/`exploring`): chỉ bắt 3 phần Chuyện gì, Nguyên nhân, Phạm vi (D1). Khi nào hỏi, gom thành bộ: AGENTS.md ưu tiên #2. Khung đã duyệt và gate không đạt được: Phase 03.

## Việc cần làm

1. Tạo `core/skills/_shared/decision-question.md` (≤ 30 dòng) và `core/instructions/decision-question.md` (≤ 8 dòng, `kind: law`, có anchor phrase).
2. Chiếu luật vào AGENTS.md **từ worktree**: `node --input-type=module -e "import {materializeInstructionProjection} from './src/setup/instruction-projections.mjs'; materializeInstructionProjection(process.cwd())"` (xác minh tên export trước khi chạy; không dùng `fgos doctor --fix` vì nó ghi main checkout). Commit AGENTS.md + `.fgos/instructions/effective/repo.json`.
3. Validator: đọc `work.stage`; `discovery`/`exploring` → 3 heading, stage khác → 5 heading. **Một cửa kiểm duy nhất** (owner: "cả 2 đi qua 1 cửa"): một hàm `checkDecisionQuestion(text, { parts })` trong một module nguồn duy nhất trả về các phần còn thiếu, và một hàm in thông báo lỗi kèm mẫu. Validator `fgos ask` và hook `AskUserQuestion` (Phase 04) đều gọi đúng hàm này; không nơi nào tự so heading. Mỗi heading có alias tiếng Anh; so bằng `normalize('NFC')` + `toLowerCase()` + `startsWith`, **không dùng `\b`** (`/^khuyến\s+nghị\b/i` không khớp "khuyến nghị" — red-team đã chạy). Viết dạng vòng lặp trên mảng heading để giữ ngắn.
4. Sửa đủ 5 nơi sinh câu hỏi ở Bối cảnh. Nội dung thật: phần engine không biết (giá, khuyến nghị) ghi rõ "engine không định giá được; lựa chọn là X/Y" thay vì chữ đệm. Câu hỏi thô của worker (`discovery.mjs:545`) và `DEFAULT_UNCLEAR_QUESTION` được engine bọc vào mẫu, như `discovery.mjs:456-460` đã làm. Sửa `worker-prompt-discovery.txt:43` cho worker biết mẫu. Giữ nguyên chuỗi lý do gate rủi ro/blast-radius.
5. Test: đổi fixture có sẵn; thêm vào test validator hiện có 1 case câu hỏi hợp lệ đủ heading (có "Khuyến nghị", có dạng NFD) phải qua, 1 case thiếu "Phạm vi" phải trượt. Thêm 1 assert anchor phrase vào `test/docs/rul11-anchor-phrase.test.mjs` (không tạo file mới).
6. CHANGELOG `[Unreleased]`: 1 dòng.

Sửa skill, AGENTS.md ưu tiên #2 và memory cho khỏi trùng: Phase 02.

## Kiểm chứng

- Hẹp: test validator, `test/intake/*`, `test/cli/fgos-intake*`, `test/runner/loop.test.mjs`, `test/docs/rul11-anchor-phrase.test.mjs`.
- Rộng: `npm test` (unset `CLAUDE_CODE_SESSION_ID` nếu chạy trong agent session).
- `git grep -n -E "Why this matters|Why this$" -- src test` ra 0.
- Ngân sách đo bằng `git diff --numstat <base> -- src` lấy **thêm + xoá**; khối sinh tự động trong AGENTS.md và `repo.json` không tính.

## Rủi ro và rollback

- Validator chỉ chứng minh heading tồn tại và đủ 20 ký tự; **không có reviewer nào** trên đường `fgos ask`. Câu "A hoặc B, tuỳ anh" vẫn có thể qua. Chất lượng thật dựa vào mẫu trong skill; không thêm bước review mới trong plan này.
- Câu trả lời bất kỳ nhả gate: sửa ở Phase 05 (D2b).
- Câu hỏi đang park với cấu trúc cũ không bị ảnh hưởng (validator chỉ chạy lúc chuyển trạng thái).
- Rollback: revert commit của phase.
