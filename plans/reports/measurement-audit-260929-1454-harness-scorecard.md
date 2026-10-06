# Đo lường harness: đang có gì, thiếu gì, đề xuất scorecard

Ngày 2026-09-29. Đo trên `main` @ `a15e1b454`, dữ liệu `.fgos/` thật, chạy `node bin/fgos.mjs <verb>` (không dùng shell function để tránh bản shim cũ).

## 1. Kết luận

- **Harness đã có hệ đo lường, nhưng nó đo "sổ sách work item", không đo "harness có hiệu quả không".** Nó trả lời được "item này dự đoán vs thực tế ra sao, còn friction nào chưa xử lý", nhưng không trả lời được "ship nhanh hơn không, người bị gọi bao nhiêu lần, run hỏng do hạ tầng hay do chất lượng".
- **Đo lường dispatch đang mù với engine hiện tại.** `fgos dispatch-report` chỉ đọc 14 event `executor.dispatch` cũ (lần cuối 2026-08-27, `confidence: missing` cả 14), trong khi đã có 1.028 assignment run.
- **Dữ liệu thô đã đủ cho gần hết scorecard.** Chỉ thiếu 3 thứ: tách lỗi hạ tầng khỏi verdict, token/chi phí, và thời lượng cho các run cũ. Không cần hạ tầng đo lường mới; chỉ cần **một verb đọc** tổng hợp từ các store đã có.

## 2. Hiện trạng từng công cụ

| Công cụ | Đo gì | Kết quả hôm nay | Vấn đề |
|---|---|---|---|
| `fgos check` | predicted vs actual của từng item; friction; settlement; learning; entropy | 980 outcome: 902 passed, 8 `verify-miss`, 70 thiếu; **attempts = 1 ở mọi item có số liệu** | "Passed 99%" là chỉ số làm đẹp: chỉ đo verify lúc return, không thấy các vòng review/fix trong session |
| entropy (trong `check`) | điểm tổng hợp độ tùm lum của work-state | score 1105; `.fgos/logs/entropy-history.jsonl` có 981 điểm | **Đính chính 15:10:** có lịch sử, nhưng **mỗi lần gọi `check` (verb [read]) lại ghi thêm một điểm**, nên delta chỉ là so với lần gọi trước, không phải xu hướng theo thời gian; `changelog-nag-history` cũng vậy (534 điểm). Verb đọc mà ghi là vi phạm authority |
| friction (trong `check`) | ma sát theo layer | 752: docs 282, verification 249, state 220, environment 1 | Phần docs chủ yếu là lint "deferred prose"; gần như không ghi được friction của hạ tầng harness |
| `fgos evolve` | xếp hạng friction chưa xử lý thành ứng viên cải tiến | chạy được | Kế thừa đúng giới hạn của friction |
| `fgos dispatch-report` | confidence ladder của dispatch | 14 dispatch, `missing` cả 14, cuối 27/8 | **Chết**: không đọc assignment runs |
| `fgos faults` | lỗi gọi CLI | 265: store-missing 132, unknown-verb 109, init-in-worktree 17, dir-invalid 7 | Chỉ ở tầng CLI |
| `fgos stale` | claim kẹt, item quên sau merge, orphaned run | 16 claim stale (có claim giữ ~1.500 giờ) | Tốt, nhưng không ai chạy định kỳ |
| RunResult v2 (`assignments/*/runs/*/result.json`) | status, classification, durationMs, evidence | 1.028 run: 621 done, 330 failed, 74 no-evidence, 3 blocked | `classification`/`durationMs` chỉ có ở ~100 run mới; **`failed` gộp chung "reviewer bác" với "hạ tầng hỏng"**; token chỉ có ở 10 run |
| Coordination session events | vòng đời session, assignment, disposition | 73 session đóng: p50 2 assignment, 13 phút; p90 6 assignment, 74 phút | Không có verb tổng hợp; 216 session không đóng làm lệch số |

Số liệu run theo adapter (đính chính cho các báo cáo trước): cli 643 run (57% done), herdr 286 run (61% done), bwrap 99 run (84% done). Theo executor: `xai` 10/35 done, `openai` 10/24, `agy-herdr` 19/46, `glm-cli` 0/4. Tức là **độ tin cậy của executor chênh nhau rất lớn** và có thể đo ngay.

## 3. Scorecard đề xuất (theo thứ tự ưu tiên của AGENTS.md)

Mỗi chỉ số ghi rõ nguồn. "Có" nghĩa là dữ liệu đã tồn tại; "Thiếu" nghĩa là phải ghi thêm.

| # | Ưu tiên | Chỉ số | Nguồn | Hôm nay |
|---|---|---|---|---|
| 1 | Ship Faster | Lead time item: `work.add` → `done`, p50/p90 | event log — Có | p50 232 giờ, p90 515 giờ (có tính thời gian chờ backlog) |
| 2 | Ship Faster | Cycle time: claim → awaiting-approval | `work.move` — Có | chưa tính |
| 3 | Ship Faster | Thời lượng + số assignment mỗi coordination session | session events — Có | p50 13 phút / 2 assignment |
| 4 | Release con người | Số lần chạm người mỗi item: ask + answer + gate-approve + human close | event log + settlement — Có | gate-approve trung bình 0,91 mỗi item |
| 5 | Release con người | Thời gian item nằm ở `awaiting-human` | `work.move` — Có | chưa tính |
| 6 | DoD | Tỉ lệ review pass ngay vòng đầu; số finding `accepted` mỗi session | disposition events — Có | chưa tính |
| 7 | DoD | Lỗi lọt: item bị mở lại, hoặc bug item trỏ về item đã done | event log + refs — Có một phần | chưa tính |
| 8 | Sức khoẻ harness | Run fail do **hạ tầng** vs do **verdict**, theo executor và adapter | RunResult — **Thiếu** phân loại ở run cũ | chưa tách được |
| 9 | Sức khoẻ harness | Session bỏ ngỏ, claim stale, orphaned run | session events + `stale` — Có | 216 session mở, 16 claim stale |
| 10 | Sức khoẻ harness | Commit `fix(dispatch\|coordination\|runner)` mỗi tuần | git log — Có | tuần 38 đạt đỉnh 107 commit engine |
| 11 | Chi phí | Token/chi phí mỗi item và mỗi session | RunResult — **Thiếu** | 10/1.028 run có |
| 12 | Độ phức tạp | Dòng code `src/runner` + `packages` + `apps`; số protocol/route thực dùng | repo + session — Có | 46k engine; 3/13 protocol; 2/75 route native |

Có 5 chỉ số nên theo dõi hàng tuần: **#1, #4, #6, #8, #12**. Mỗi chỉ số đại diện một câu hỏi: nhanh hơn không, người rảnh hơn không, chất lượng hơn không, harness có tự làm vỡ mình không, và có phình ra không.

## 3b. Thứ tự triển khai (chốt 2026-09-29 15:00)

Nguyên tắc sắp xếp: (1) dữ liệu nào **không backfill được** thì bắt đầu ghi trước; (2) lấy baseline **trước** khi track thu gọn làm thay đổi hệ thống; (3) các chỉ số outcome xếp theo thứ tự ưu tiên của AGENTS.md; (4) chỉ số nào cần định nghĩa mơ hồ thì để sau cùng.

| Thứ tự | Chỉ số | Lý do | Dữ liệu |
|---|---|---|---|
| 1 | #4 fail do hạ tầng vs do verdict | Trả lời thẳng câu "harness có tự làm vỡ mình không"; chỉ ra lớp hay executor nào cần cắt. Phải thêm `failure.origin` **ngay**, vì mỗi ngày chưa ghi là mất dữ liệu vĩnh viễn | ~100 run gần nhất tính được bằng `classification.execution.status`; run mới cần trường mới |
| 2 | #1 lead time + cycle time | Ưu tiên #1 Ship Faster; cần baseline cho bake-off | Có đủ |
| 3 | #2 số lần chạm người mỗi item | Ưu tiên #2 Release con người | Có đủ |
| 4 | #5 độ phức tạp | Rẻ nhất, nhưng là rào chắn chứ không phải kết quả; chỉ cần chụp baseline cùng đợt với #1/#2 | Có đủ |
| 5 | #3 review pass vòng đầu | Cần chốt nghĩa của "failed" và của disposition trước; mơ hồ nhất | Có một phần |

Giai đoạn:
- **A (≈1 ngày):**
  - Thêm `failure.origin` và `usage` vào RunResult.
  - Chụp baseline #1/#2/#5 bằng một script đọc dữ liệu.
- **B:** Verb `fgos harness-report` gồm #4, #1, #2, #5, cộng snapshot hàng tuần.
- **C:** Thêm #3, sau khi đã chốt nghĩa.

## 3c. Namespace: `fgos metrics` (chốt 2026-09-29 15:03)

Luật: `metrics` chỉ **đọc và tổng hợp theo thời gian**. Lệnh ghi duy nhất được phép là `metrics snapshot`, ghi vào trend store đã có sẵn của entropy. Danh từ nào có vòng đời ghi thì có namespace riêng (ví dụ `fgos friction`). Còn các view vận hành "ngay bây giờ" như stale/triage/conflicts/slots/schedule/graph/rollup thì không thuộc `metrics`.

```text
fgos metrics harness   [--since] [--json]   scorecard 5 chỉ số (mới)
fgos metrics runs      [--by executor|adapter]  thay dispatch-report; done/failed/no-evidence, infra vs verdict
fgos metrics outcomes  [<id>]               thay check (predicted vs actual)
fgos metrics entropy                        tách khỏi check, có trend
fgos metrics faults                         thay faults
fgos metrics snapshot                       ghi 1 điểm trend (dùng cho lịch hàng tuần)
fgos friction list|show|rank|settle         danh từ riêng; `rank` thay evolve
```

Tên cũ (`check`, `faults`, `dispatch-report`, `evolve`) giữ làm alias thêm một release. Mỗi lần alias được gọi thì ghi vào faults, dùng để biết khi nào xoá được.

## 4. Cách triển khai (tối thiểu)

1. **Một verb đọc**, ví dụ `fgos harness-report [--since] [--json]`. Pure reader trên event log, session events, assignment results và git log. Không ghi gì. Nên đặt cạnh `src/report/`.
2. **Snapshot tách khỏi lệnh đọc**: chỉ `metrics snapshot` được ghi trend; bỏ việc `check` tự append mỗi lần gọi.
3. **Sửa hoặc thay `dispatch-report`**: trỏ nó vào assignment runs, hoặc gộp vào verb mới rồi đánh dấu deprecated.
4. **Hai trường mới trong RunResult:**
   - `failure.origin: infra | verdict | policy`, để tách "reviewer bác" khỏi "hạ tầng hỏng".
   - `usage {inputTokens, outputTokens, costUsd?}`, lấy từ output JSON của claude/codex khi có.
5. **Bake-off dùng chính scorecard này.** Với herdr-cook-plan: lấy #1/#3 từ ledger và checkpoint cộng git log; lấy #4 từ các dòng `answer` có `decided_by: user`; lấy #6 từ report của từng attempt. Cùng một thước đo cho cả hai.
6. **Ngưỡng hành động** (đề xuất):
   - #8 tỉ lệ infra-fail > 15% ở một executor thì hạ ưu tiên hoặc tắt executor đó.
   - #9 session mở > 7 ngày thì `doctor` báo.
   - #12 tăng liên tục 2 tuần mà #1/#4/#6 không cải thiện thì dừng thêm cơ chế, chuyển sang track thu gọn.

## Câu hỏi chưa giải quyết

- `failed` của reviewer/red-team: khi reviewer bác một candidate, đó là "failed" hay "done với verdict fail"? Cần chốt nghĩa trước khi đo #6 và #8.
- Lead time có nên loại thời gian nằm ở backlog `todo` không? Đề xuất tính cả hai: lead time và cycle time.
- Snapshot hàng tuần chạy bằng gì: `/loop`, schedule, hay khi chạy `doctor`?
