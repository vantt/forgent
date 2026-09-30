---
title: "Đo tác động RunResult classification và chốt producer friction tầng nền"
status: pending
priority: P1
created: 2026-09-30
blocks: []
---

# Plan: Đo tác động RunResult classification và chốt producer friction tầng nền

Nguồn:
- Tách từ Phase 6 của plan [RunResult single path](../../archive/plans/260929-1703-runresult-classification-single-path/plan.md) sau khi Phase 1–5 đã hoàn tất và merge vào `main`.
- Gộp plan friction tầng nền (trước đây `plans/260929-1703-baseline-friction-producers/`, draft 2026-09-29, chưa commit). Plan Observe ([completed](../../archive/plans/260929-1501-metrics-friction-rust-native/plan.md)) và plan RunResult đều đã xong; hai việc còn lại dùng **cùng cửa sổ dữ liệu** và cùng nguồn `classification.outcome.category`, nên đo trước rồi mới quyết producer.

## Outcome

**(a) Đo tác động classification.** Đánh giá định lượng tác động thực tế của việc chuyển RunResult sang `classification` single path và ghi nhận `usage` token:
- **#3 (Review pass vòng đầu):** Đo lường chính xác tỷ lệ review pass ngay vòng đầu mà không cần ước lượng.
- **#4 (Phân loại run fail):** Tách bạch rõ rệt run fail do lỗi hạ tầng (`infra`) vs run fail do chất lượng (`verdict`), theo từng executor và adapter.
- **Chi phí & usage:** Ghi nhận token thật từ các executor phi-Claude (`pi`, `codex-cli`).

**(b) Chốt producer friction tầng nền.** Dùng chính số liệu ở (a) — kể cả hai chỉ số phụ cho ngưỡng P1 và cho P3' — để quyết định P1/P3' có dẫn tới hành động thật không. Nếu giữ, tầng nền tự báo friction của chính nó, thay vì chỉ Work báo, qua cửa ghi dùng chung `fgos friction record/resolve` (Node) hoặc lib `fgos_observe::friction` (Rust). Owner của subject cũng tự resolve. Nhờ vậy `fgos friction rank` chỉ ra được **component nào ở tầng nền đang gây vướng**, và đó là đầu vào cho các vòng cải tiến tiếp theo. Nếu loại cả hai thì đóng plan, không viết producer.

## Điều kiện kích hoạt

Plan này ở trạng thái chờ tích luỹ dữ liệu (bake period):
- Cần tối thiểu **1 tuần** kể từ thời điểm merge (2026-09-29) hoặc tối thiểu **50 run mới** trên `main`.
- Khi đủ điều kiện, chạy:
  ```bash
  /ak:cook plans/260930-0335-measure-runresult-classification-impact/plan.md
  ```

## Producer (đã thu hẹp, 2026-09-29)

| # | Producer | Subject | Khi nào ghi | Ai resolve, khi nào | Căn cứ |
|---|---|---|---|---|---|
| P1 | Dispatch: run fail do hạ tầng | `run:<runId>` | `classification.outcome.category === 'infra'` (plan RunResult, D2-A) | Dispatch, khi assignment đó có run sau với `category === 'ok'` | 330/1.028 run `failed`, 74 `no-evidence` (chưa tách được hạ tầng với verdict) |
| P3' | Coordination: session chạm `maxRounds` | `session:<id>` | Session bị chặn vì vượt `aggregateBounds.maxRounds` | Coordination, khi session về trạng thái kết thúc | Memory: `maxRounds:10` là trần cứng của cả session, và khi chạm trần phải thoát bằng tay |

### Ứng viên đã loại (chốt 2026-09-29)

| # | Ứng viên | Lý do loại |
|---|---|---|
| P2 | Executor kém tin cậy | Đây là **chỉ số** (xu hướng), không phải friction. Nó đã có trong `metrics runs --by executor` |
| P4 | Session không được đóng sau merge | Đã có doctor check `coordination-sessions-closed` (commit `4358e88c0`) |
| P5 | Test fixture rò vào store thật | Đây là **bug** (test không hermetic), không phải producer. Có prompt sửa riêng: [`fix-test-fixture-leak-prompt.md`](fix-test-fixture-leak-prompt.md) |
| P3 (phần "không có event N giờ") | Session kẹt vì im lặng | Trùng với doctor check `coordination-sessions-closed`. Chỉ giữ trường hợp chạm `maxRounds` (P3') |

## Nguyên tắc đã chốt

- **Friction hay chỉ số:** friction là một vấn đề cụ thể gắn với một subject, cần ai đó xử lý rồi resolve. Chỉ số là xu hướng để quan sát. Không tạo friction cho thứ chỉ cần theo dõi xu hướng.
- **Không lọc trùng lúc ghi:** mỗi lần xảy ra là một record (append-only, giống friction của Work). `rank` đếm số lần; subject `run:` vốn khác nhau cho mỗi run.

## Câu hỏi còn lại (cần số liệu)

1. P1 và P3' có **dẫn tới hành động** thật không, hay chỉ là nhiễu? Xem `friction rank` sau 1–2 tuần.
2. P1 có cần ngưỡng không (ví dụ chỉ ghi khi cùng assignment fail hạ tầng từ lần thứ 2), hay ghi mọi lần? P3' dùng luôn giá trị `maxRounds` có sẵn nên không cần ngưỡng mới.

Hai câu này được trả lời ở phase 2, từ `reports/impact.md` (đo trước, quyết sau — chưa có producer thì chưa có `friction rank` của P1/P3').

## Ràng buộc đã biết

- Chỉ dùng cửa ghi dùng chung (single path). Không có writer riêng.
- Producer đặt trong **component owner**: dispatch hoặc coordination. Observe không tự suy ra friction từ dữ liệu của người khác.
- Không cần backward compat.
- Ghi friction là **kênh phụ best-effort**: lỗi ghi thành `friction-write-failed` trong invocation-faults, không làm hỏng thao tác chính (quyết định của anh trong plan Observe, Session 5).
- **Work không đọc friction**, và Observe không join state của Work. Producer tầng nền cũng tuân theo nguyên tắc này: chỉ ghi và resolve.
- Store Observe được shard theo writer (`.fgos/observe/friction/<writerId>.jsonl`).

## Việc cần làm (chuyển từ điều kiện thoát draft của plan friction)

- [x] Plan Observe đạt M4; plan RunResult merge xong phase 3. — cả hai đã `completed` (2026-09-29); `blockedBy` của plan đo lường đã bỏ.
- [ ] Có ít nhất 1 tuần case thật (`fgos metrics case`), cộng `metrics harness --since` của tuần đó. — chính là [Điều kiện kích hoạt](#điều-kiện-kích-hoạt).
- [ ] Trả lời 2 câu hỏi còn lại bằng số liệu, rồi viết phase cho P1/P3' và validate. — [phase 2](phase-02-decide-friction-producers.md); chi tiết [phase 3](phase-03-dispatch-infra-failure-producer.md)/[phase 4](phase-04-coordination-max-rounds-producer.md) chỉ viết nếu giữ producer.

## Phases

| # | Phase | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Đo tác động bằng Observe](phase-01-measure-impact-with-observe.md) | 0.5d | — | pending |
| 2 | [Quyết định producer friction](phase-02-decide-friction-producers.md) | 0.25d | 1 | pending |
| 3 | [Producer P1 — dispatch run fail hạ tầng](phase-03-dispatch-infra-failure-producer.md) | stub | 2 (nếu giữ P1) | blocked-by-phase-02 |
| 4 | [Producer P3' — coordination chạm maxRounds](phase-04-coordination-max-rounds-producer.md) | stub | 2 (nếu giữ P3') | blocked-by-phase-02 |

## Success Criteria

- [ ] Tính lại baseline "trước" và thu thập dữ liệu "sau" bằng cùng một luật phân nhóm (`deriveOutcome`).
- [ ] Báo cáo `reports/impact.md` hoàn thành với đầy đủ số liệu #3, #4, usage, phân bố fail `infra` lặp trên cùng assignment, và tỷ lệ session chạm `aggregateBounds.maxRounds` (hoặc ghi rõ khoảng trống Observe, không bịa).
- [ ] Phase 2 ghi quyết định P1/P3' (giữ / loại / cần ngưỡng) vào Validation Log, theo quy tắc đã viết trước khi có số.
- [ ] Nếu giữ P1: phase 3 được viết chi tiết và làm xong. Nếu giữ P3': phase 4 được viết chi tiết và làm xong.
- [ ] Nếu loại cả hai: `status: completed` trên plan này, kèm lý do trong Validation Log.

## Validation Log

Nguồn Session 1: plan friction cũ `plans/260929-1703-baseline-friction-producers/` (đã gộp và xoá), ngày 2026-09-29. Không đổi nghĩa.

### Session 1 — 2026-09-29
- Anh chốt: bỏ P2 (là chỉ số), P4 (đã có doctor check `4358e88c0`), P5 (là bug, xử lý bằng prompt riêng, **không tạo work item** vì work engine chưa tích hợp đúng với lớp harness). P3 thu hẹp thành P3' (chạm `maxRounds`).
- Nguyên tắc: friction là vấn đề cần xử lý, chỉ số là xu hướng; không lọc trùng lúc ghi.
- Còn 2 câu hỏi cần số liệu.
