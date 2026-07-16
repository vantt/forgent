---
area: system-overview
updated: 2026-07-16
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e]
coverage: partial
---

# Spec: System Overview

> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)

## Area Map

- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: chưa có (harvest sẽ viết)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)

## Shared Entities

| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound | work-state (owns fold + đọc qua `fgos check`), runner (ghi cả hai nửa trong vòng dispatch) |
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |

[unknown — các entity khác cần harvest interview; xem Open Gaps]

## Actors & Roles (global)

- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.

[unknown — vai trò khác nếu có, cần harvest]

## Cross-Area Flows

**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `proposed` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.

**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `proposed` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang actor NGƯỜI; gãy đóng cạnh MỚI `proposed→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.

**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `proposed` mang `headAtReturn` — mirror đúng contract `proposed` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).

[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]

## Open Gaps

- distillery: chưa có area spec — harvest từ `docs/reference-learning-system.md` + hành vi distill skill thực chạy.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.

## Pointers (implementation)

- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)
