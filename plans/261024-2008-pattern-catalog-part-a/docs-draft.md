---
title: "Nháp docs Part A: catalog pattern"
description: "Nội dung đã soạn sẵn cho các spec và how-to của Part A, chờ DOC land cấu trúc docs/platform/<area>/spec.md rồi chép vào. Không phải nguồn chân lý; code và test là nguồn."
---

# Nháp docs Part A (COOK, 2026-10-29)

Trạng thái: **nháp**, chưa chép vào `docs/`. Chờ dòng "DOC đã Land" trên board; khi đó chép từng khối vào đường dẫn mới (`docs/platform/workflow/spec.md`, `runner/spec.md`, `seat-binding/spec.md`, `config/spec.md`) và kiểm lại số dòng, vì các đường dẫn cũ `docs/specs/*.md` trong bảng 12a của phase 12 sẽ đổi. D-ADR đã mint: **D-ADR0074** (`fgos identity mint d-adr`, 2026-10-29). CHANGELOG đã land cùng code, không cần chép lại.

Nguồn đối chiếu: `plans/261023-1619-collaboration-degree-spec/spec-draft.md` mục 2, 5, 7, 8, 12, 13, 18; code trên main `3aa9859f3`. Mỗi câu dưới đây phải kiểm lại với code lúc chép.

## 1. workflow, mục 2.2 (bảng thuật ngữ)

Thêm các dòng:

| Thuật ngữ | Nghĩa |
|---|---|
| **loop** | một trong bốn động cơ nằm trong code: `solo`, `reviewed`, `panel`, `debate` |
| **pattern** | lựa chọn có tên = loop + tham số mặc định + bất biến + một câu `promise`; khai trong config theo lớp project > global > shipped. Mỗi loop có một pattern shipped cùng tên với mặc định thường, nên `--pattern reviewed` vẫn chạy |
| **params** | phần chỉnh của một pattern cho một unit |
| **request** | giá trị `--params` / `--param` cho một lần dispatch |
| **baseline** | selector mà chuỗi ưu tiên chọn khi không có request |
| **pin** | collaboration hiệu lực lưu trong bản ghi unit (`unit.json`), `--resume` phát lại đúng nó |

## 2. workflow, mục 7.2 bước 3

Câu hiện tại: "**Cửa**: giải pattern; phân giải ngữ cảnh authority qua port (RUL-WF-11); từ chối nếu không hợp lệ."

Thay bằng: "**Cửa**: khi không có selector thì kế thừa `unit` của activity; áp request nếu có; kiểm mọi nơi mang tham số (activity, step, config, request); giải đúng một lần qua catalog trong config và ghim kết quả vào bản ghi unit; phân giải ngữ cảnh authority qua port (RUL-WF-11); từ chối theo tên nếu không hợp lệ, trước khi admission."

## 3. workflow, mục 6: RUL-WF-29

"**RUL-WF-29 (mức độ qua params).** Mức hợp tác của một unit chủ yếu là `params` của một pattern; tên pattern mới chỉ dành cho một lời hứa (`promise`) khác. Selector đến theo chuỗi một-cửa (activity `unit` làm baseline, rồi step, rồi `--pattern` kèm `--reason` trong case); hai selector không khớp bị từ chối `selector-conflict`. Mặc định thay thế được (giá trị cụ thể hơn **thay**, không hợp) và sàn (số checker tối thiểu) luôn cộng dồn, không bao giờ last-writer-wins. `acceptOutcomes` của một unit được xét theo loop đã giải: loop phải là `reviewed`."

## 4. runner (mục CollaborationPattern, cờ `fgos run`, verify, rigor)

Các vị trí cũ: `:1499-1500`, `:1146`, `:1115`, "Hợp đồng rigor và tier" `:87`, `:1535`.

- Mô tả collaboration: agent-led hoặc khai qua Workflow; bốn loop trong code; catalog pattern trong config (`runner.patterns`: loop, defaults, promise); tuning loop ở `runner.loops` (`maxRounds`, `checkersByRigor` cho `reviewed`); một lần giải, ghim vào bản ghi unit.
- `fgos run` thêm cờ `--pattern`, `--params` (một object JSON), `--param key=value`, `--reason` (bắt buộc khi đổi mức trong một case); lỗi `selector-conflict`; tham số ngoài giới hạn bị từ chối, nêu giới hạn.
- Verify: `solo` chạy command `--verify` một lần sau producer và để lại receipt; `panel` và `debate` từ chối với `verify-command-unsupported`; `reviewed` giữ nguyên (không verify thì kết quả mang `verify: { ran: false, reason }`).
- "Hợp đồng rigor và tier": nghĩa không đổi; `checkersByRigor` sống dưới `runner.loops.reviewed`; thiếu dòng rigor thì rơi về dòng `standard` chỉ với rigor dưới `standard`, thiếu dòng `high` hoặc `critical` là lỗi cấu hình.
- Đường dẫn code: `src/runner/execution/patterns/{catalog,catalog-entries,retired-keys}.mjs`, `loops/*` (gồm `role-tasks.mjs`, `verify.mjs`).

## 5. seat-binding (`:91`, `:214`, `:245`, đổi `updated` ở header)

- `red-team` là `minCheckers` mặc định của capability `code` và `code:*`; một mục `minCheckers` tường minh thay nó (khóa khớp đúng, rồi theo tiền tố). Lưu ý: một mục tường minh không có red-team thì capability `code:*` không còn nhận red-team.
- Seat id dành riêng là `verify` và `verifier` (`RESERVED_SEAT_IDS`): một ghế khai trùng bị từ chối với `param-invalid`. Tên pattern dành riêng trong catalog là `seatBinding` và `defaultRule` (khóa sau là khóa đã nghỉ).
- `checkersByRigor` ở `runner.loops.reviewed`.
- Marker `runner.patterns.seatBinding.schema` là tên dành riêng, `schema: 2` sau khi chuyển đổi; release cũ từ chối file schema 2; release mới đọc schema 1 và 2. `fgos doctor` cảnh báo khi project có `runner.loops.*` mà marker thiếu hoặc dưới 2.

## 6. config spec (`:133`)

"Danh mục chuẩn gồm **catalog pattern** (thay cho 'các pattern, các workflow preset'); `runner.loops` là phần tuning của loop. Khóa đã nghỉ (`runner.patterns.defaultRule`, `runner.patterns.research-fan-out-gated`, `maxRounds` và `checkersByRigor` dưới `runner.patterns.reviewed`) bị từ chối ở file với `config-key-retired`, nêu file và khóa thay thế; một lỗi gộp mọi khóa cũ thấy được."

## 7. how-to cài đặt và doctor (`:233`)

Dòng `runner-patterns-config` ghi rõ nó kiểm gì: catalog pattern, `runner.loops`, khóa đã nghỉ, và với file JSON cũ thì in danh sách khóa phải sửa tay rồi chạy `fgos config migrate`. Thêm một đoạn ngắn cho `fgos setup`: chuyển file YAML của project, giữ bản sao lưu cạnh file; file global in lệnh `fgos config set|unset ... --reason` chạy ngoài project.

## 8. how-to khác

- `use-fgos-group-thinking.md`: tên pattern nay lấy từ catalog; `--seats` mở rộng mọi pattern có loop `panel`, không chỉ tên `panel`; panel có seat curated (persona, tier, task theo seat) vẫn bị từ chối.
- `run-a-coordination-session.md`: một dispatch trong case mặc định nhận `unit` của activity; chỉ cần `--pattern ... --reason` để đổi mức.

## 9. Lịch sử quyết định (runner), D-ADR0074

Mục dán vào "Lịch sử quyết định" của spec runner, theo khuôn các mục D-ADR đang có (kiểm khuôn lúc chép):

**D-ADR0074 — catalog pattern trong config; mức hợp tác chủ yếu qua params (2026-10-29, owner 2026-10-23 và 2026-10-24).**

Quyết định của owner: Q1 = (a), assessor (thiết kế chỉ là lời khuyên, thuộc Part B); mức độ chủ yếu là `params`, tên mới chỉ cho một lời hứa khác; Q2 không có overlay: project chỉnh cận và mặc định qua config, agent xin kèm lý do, Core giải một lần và ghim, MUST và bất biến không ghi đè được; bộ từ vựng của mục 2 spec (loop, pattern, params, request, baseline, pin); việc đổi tên vật lý làm trong Part A (một bước L10); Q-A = (b) hình dạng cận; Q-B và Q-C theo mặc định của gói câu hỏi. Đổi tên id và thư mục (`wf-run-`, `.fgos/workflow-runs/`, `unit-run-`) **không** thuộc Part A (mục backlog `wf-physical-rename`). Ngày 2026-10-29: không viết migration JSON, config repo đã là YAML, project cũ chuyển tay một lần.

Hệ quả: release cũ từ chối file config đã chuyển (có chủ ý, là hàng rào); `red-team` thành mặc định của resolver cho `code:*`; một catalog duy nhất cho run, unit workflow và doctor.

Điều kiện đảo lại: nếu hàng rào release cũ làm một máy không nâng cấp được kịp, hoặc nếu `params` không đủ biểu đạt một mức hợp tác thật (cần quá nhiều pattern mới cho mỗi mức), mở lại quyết định này thay vì vá bằng overlay.

## 10. Việc chép (khi DOC land)

1. Merge `origin/main`, đọc từng file đích trước khi sửa.
2. Chép khối 1 đến 9 vào đúng chỗ; không chép số dòng cũ, tìm lại câu trích.
3. `fgos decision-index` nếu mục lịch sử đổi bảng chiếu; chạy `node scripts/check-decision-citation-drift.mjs`, `check-decision-codes.mjs`, `check-decision-supersession.mjs`; kiểm link.
4. Tên test thêm trong đợt này không mang mã quyết định.
