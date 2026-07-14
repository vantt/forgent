# Routing Handoff Contract — fgos-runner

Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).

## Khung prompt 4 phần

Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:

1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.

## Bảng entry-router

Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.

| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (R5) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos-runner.json` (`executor.command`/`args`, template `{prompt}`/`{model}`) | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |

## Câu handoff chuẩn

Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:

> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."

Khi từ chối (`proposed → todo`), câu tương ứng:

> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."

## Ranh giới tin cậy

Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:

- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos-runner.json` là config THỰC THI ĐƯỢC, không phải dữ liệu thụ
  động.** Ai sửa được file này quyết định runner spawn tiến trình gì, với
  argument gì (per `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed
  (D2 — bền vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của
  code: chỉ áp dụng từ một checkout đã tin cậy sẵn.

## Tham chiếu

`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/history/phase-2-routing/CONTEXT.md` D3/D4.
