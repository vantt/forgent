---
type: explanation
title: tsk-38t — Phase 2 multi-domain schema (status/statusCategory + domainFields)
tags: [work-state, multi-domain, status-category]
timestamp: 2026-08-04T00:00:00.000Z
---

# CONTEXT — tsk-38t: Phase 2 multi-domain schema

## Phạm vi (feature boundary)

Tách `status` (nhãn hiển thị, domain-specific) khỏi `statusCategory`
(field foundation mới, đóng băng lúc ghi event, dùng cho mọi cơ chế
domain-agnostic của fgOS), cộng thêm `domainFields` (field lồng theo
domain, optional-additive). Đây là supersede thật quyết định
base-workflow-model D1-D3 ("domain không bao giờ chi phối bảng
chuyển-status") — nhưng chỉ cho ĐOẠN TRƯỚC `delivered` của vòng đời, không
phải toàn bộ 10 status (xem D1 dưới). `kind`→`kindCategory` (cùng pattern,
nếu enum hoá `kind` sau này) nằm NGOÀI phạm vi bắt buộc của lần chốt này —
ưu tiên thấp hơn, `kind` chưa tham gia transition/gate nào hôm nay.

Toàn bộ quyết định sản phẩm dưới đây được chốt qua 1 phiên thảo luận mở
(`fgos-coding-shaping`, 12 vòng, 2026-08-04) — xem
`docs/history/phase-2-status-category-schema/DISCUSSION.md` cho đầy đủ
scout evidence, lý luận từng bước, và log Q&A nguyên văn. File này chỉ tóm
tắt kết quả đã ổn định cho `fgos-coding-planning` dùng, không lặp lại lý luận.

## Locked decisions (D1-D6)

| D-ID | Tóm tắt |
|---|---|
| D1 | Domain-specific status vocabulary chỉ áp dụng cho đoạn TRƯỚC `delivered`. Chuỗi `delivered→retrospective→cleanup→done` cố định, dùng chung tên y hệt mọi domain — khác biệt per-domain ở bước `retrospective` nằm ở SKILL nào chạy (mở rộng `skillMap` per-domain đã có), không phải tên status. |
| D2 | `wontfix` ở lại đoạn đầu (domain-owned label — coding giữ nguyên chữ, 0 migration), map cố định vào `statusCategory: 'canceled'`. |
| D3 | Bảng map 6 status đoạn đầu → `statusCategory`: `todo→todo`, `doing/blocked/awaiting-human→in-progress`, `awaiting-approval→review`, `wontfix→canceled`. Căn cứ tiền lệ đã ghi thành luật (`docs/history/status-proposed-rename/CONTEXT.md` D3): 1 status cấp cao mới chỉ khi có hiệu ứng cấu trúc riêng trên frontier/dependency graph. |
| D4 | Backfill `statusCategory` cho ~1500+ event `work.move` cũ qua 1 migration script mới (khuôn `migrate-status-proposed-to-awaiting-approval.mjs`) — KHÔNG lazy-default, vì L3 (luật khoá, `docs/platform-foundations.md`) đòi hỏi replay-from-zero xác định tuyệt đối. |
| D5 | Cơ chế skill-per-domain chỉ cần cho `retrospective` (tái dùng `skillMap` có sẵn, thêm key `'retrospective'`). `cleanup` giữ nguyên pure-harness — không gọi skill nào, khác biệt per-domain đã đủ qua `worktreeBacked`. |
| D6 | `domainFields` chốt nguyên theo thiết kế report gốc (distill) — field optional `domainFields: { [domainName]: {...} }`, ghi đè toàn object mỗi lần edit, validate qua optional `fieldSchema` khai trong `DOMAINS[domain]`. |

Toàn bộ 6 D-ID đã ghi qua `fgos decision --id tsk-38t` (seq 5571, 5585,
5586, 5589, 5595, 5602) trong lúc thảo luận — không ghi lại ở đây.

## Thuật ngữ đã ghim (pinned terms)

- **Đoạn đầu (front segment):** 6 status trước `delivered` —
  `todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`wontfix`.
  Domain-owned label + bảng transition riêng.
- **Đoạn đuôi (tail segment):** `delivered`/`retrospective`/`cleanup`/`done`.
  Cố định, dùng chung mọi domain, không cần `statusCategory`.
- **`statusCategory`:** field foundation mới, ~5-6 giá trị cố định
  (`backlog`/`todo`/`in-progress`/`review`/`completed`/`canceled` —
  `backlog`/`completed` hiện chưa có status nào map vào, dự phòng), đóng
  băng lúc ghi event, KHÔNG derive-on-read.

## Scout đã dùng (paths + evidence)

- `plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md` — report gốc, 10+ vòng phân tích, nguồn của D2/D6 (distill).
- `src/state/status-fsm.mjs` — bảng transition 10 status thật hôm nay (khác 7 status report gốc giả định — report đã lỗi thời ở điểm này).
- `src/state/frontier.mjs:186` (`RESOLVED_STATUSES`) — bằng chứng sống category đã tồn tại ngầm.
- `src/state/retro-pool.mjs`, `bin/fgos.mjs:1012/1088` — xác nhận `fgos-coding-compounding` gọi cứng, không theo domain (nguồn D5).
- `.claude/skills/fgos-routing/SKILL.md` dòng 109-111 — tự xác nhận `retrospective` không đi qua `skillMap` domain-aware (nguồn D5).
- `docs/history/status-proposed-rename/CONTEXT.md` D3 — luật "1 status cấp cao mới chỉ khi có hiệu ứng cấu trúc trên frontier/dependency graph" (nguồn D3).
- `docs/platform-foundations.md` L3 — luật khoá "DB là view, rebuild từ zero bằng replay" (nguồn D4).
- `scripts/migrate-status-proposed-to-awaiting-approval.mjs`, `migrate-actor-to-role.mjs` — tiền lệ migration script (nguồn D4).
- `src/state/store.mjs:196` (`EDITABLE_FIELDS`), `src/state/work.mjs:187` (`validateWorkShape`) — xác nhận `domainFields`/`fieldSchema` chưa tồn tại, thiết kế report vẫn khớp pattern hiện có (nguồn D6).
- `fgos show tsk-3p1` → `status: wontfix` — acceptance clause 5 gốc (gộp vòng explore với tsk-3p1) đã lỗi thời, không còn áp dụng.
- Impact-analysis capability gate (`fgos tool query --capability impact-analysis --status present`): GitNexus registered, `status: present` — nhưng index stale (`last indexed: 251d0b5`, báo lúc phiên này chạy) → **impact-analysis: degraded**, không coi là full. Bất kỳ câu trả lời "không ai đọc literal status ở đây" từ GitNexus trong bước sau nên đối chiếu chéo bằng `rg`/`grep` trước khi tin.

## Tham chiếu chuẩn (canonical references)

- `docs/history/phase-2-status-category-schema/DISCUSSION.md` — toàn bộ lý luận, Q&A log, §6 synthesis kèm sơ đồ, §7 task breakdown (8 task, mỗi task có mục tiêu/D-ID/quan hệ/verify nháp riêng).
- `docs/decisions/0024-doi-ten-status-proposed-thanh-awaiting-approval.md` — khuôn supersede cần theo khi viết decision record mới cho base-workflow-model D1-D3.

## Câu hỏi để lại cho `fgos-coding-planning` (deferred)

- **Shaping quyết định:** `tsk-38t` có nên split thành các item con khớp 8
  task ở DISCUSSION.md §7 hay giữ 1 item chạy tuần tự — đây là phán đoán
  của `fgos-coding-planning`, không phải của skill này.
- **`verify` command cho item** — CHƯA xác định được, và đã thử 4 lần qua
  `fgos discover --verdict clear` (2026-08-04), cả 4 đều bị second-pass
  judge bác vì lý do đúng: không lệnh shell 1 dòng nào chứng minh được các
  bất biến hành vi thật của Phase 2 (statusCategory đóng băng lúc ghi
  event chứ không derive-on-read, bảng transition status riêng per-domain,
  domainFields validate qua fieldSchema, decision record supersede 0006)
  khi CHƯA có test thật. Đây đúng là giới hạn cấu trúc của việc gọi
  `discover` cho 1 item pre-decompose, phức tạp — thuộc đúng phạm vi
  `fgos-coding-planning` (viết test plan thật theo §7 DISCUSSION.md, mỗi task có
  verify riêng), không phải việc đoán thêm ở `fgos-coding-exploring`. `verify`
  field của item cha hiện để tạm `npm test` (rào hồi quy tối thiểu),
  `fgos-coding-planning` cần thay bằng verify thật khi tách task/child item.
- **§3 #6 (doc `triage-table-columns.md` lệch code)** và **§3 #7 (`DOMAINS`
  registry runtime-addable)** — cả 2 độc lập, không chặn, để `fgos-coding-planning`
  quyết có gộp vào cùng đợt hay tách riêng.
- **Acceptance criteria hiện tại của `tsk-38t`** (9 clause, viết trước
  D1-D6) — một số đã lỗi thời (clause 5: gộp explore với `tsk-3p1`, nay
  `wontfix`) hoặc cần viết lại khớp D1-D6 (clause 1 giả định 6 category cố
  định cho MỌI status, D1 đã thu hẹp). `fgos-coding-planning` nên viết lại
  acceptance dựa trên D1-D6, không dùng nguyên bản cũ.
- **Rủi ro footprint trùng với `tsk-f38` (ghi nhận lúc approve gate,
  2026-08-04, người dùng báo trực tiếp):** `tsk-f38` đang ở `executing`,
  sẽ đổi tên skill `fgos-executing` → `fgos-coding-implement`. Tên
  `fgos-executing` hiện là 1 GIÁ TRỊ literal trong `skillMap` của
  `DOMAINS.coding` (`workflow-stage-graphs.mjs`: `executing:
  'fgos-executing'`) — CÙNG FILE mà task `skillMap['retrospective']` (D5,
  `#task-skillmap-retrospective`) và task schema (D2/D3,
  `#task-schema-status-category`) của `tsk-38t` cũng sẽ sửa. Rủi ro: 2
  việc sửa cùng vùng `DOMAINS.coding` trong `workflow-stage-graphs.mjs`
  song song, không phải conflict logic (khác key: `executing` vs
  `retrospective`/`statusLabels`) nhưng CÙNG FILE — `fgos-coding-planning` nên
  kiểm `fgos conflicts` trước khi bắt đầu code, và **đợi `tsk-f38` merge
  xong rồi validate lại 1 lần** (đúng yêu cầu người dùng) xem đổi tên skill
  có ảnh hưởng gì tới `#task-skillmap-retrospective` hay không (khả năng
  thấp — D5 chỉ thêm KEY mới `'retrospective'`, không sửa key `'executing'`
  đã có — nhưng cần xác nhận thật bằng diff sau khi `tsk-f38` xong, không
  suy đoán).
