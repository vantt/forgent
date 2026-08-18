---
item: tsk-66o
mode: standard
---

# plan.md — tsk-66o: computed-parallel-wave-schedule + worktree-dispatch-attestation

## Mode gate

Đếm cờ áp dụng thật (không đoán):

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| auth | Không | — |
| authorization | Không | — |
| data model | Không | Không đổi shape work-item nào, chỉ thêm hàm thuần mới |
| audit/security | **Có** | `worktree-dispatch-attestation` là attestation cho executor ngoài — chạm trust-boundary dù chỉ advisory |
| external systems | Có, nhưng KHÔNG tính là hard-gate | Xem lý giải dưới |
| public contracts | Không | Nội bộ engine, không phải API công khai |
| cross-platform | Không | — |
| existing covered behavior | **Có** | `frozen-judge.mjs`'s check judge-pattern cũ (STR63) phải giữ nguyên 100% (D5) — regression risk thật |
| weak proof around the area | Không | `dispatch.test.mjs` (78K), `graph-metrics.test.mjs` (23K), `frozen-judge.test.mjs` đã cover tốt |
| multi-domain | Không | — |

**3 cờ → standard.** Cờ "external systems" đụng đúng chữ trong danh sách
hard-gate ("external provider") nhưng KHÔNG được tính là hard-gate ở đây:
D3 chốt advisory-only — không đổi HÀNH VI dispatch (vẫn `cli/spawn` y hệt
qua `resolveExecutorConfig`, `allowCrossProvider` gate không đổi), chỉ
CHỤP THÊM metadata (baseCommit/headRef) quanh lời gọi đã có sẵn. Không có
quyền mới, không có luồng dữ liệu mới ra ngoài Claude. Nếu sau này nâng
lên mức 2 (hard-refusal tại merge, hoãn — xem D3), lúc đó mới thật sự đổi
hành vi và cần re-đếm cờ.

## Approach

**Đã chọn:** 2 mảnh độc lập file (không phụ thuộc nhau), cả hai advisory-
only, không đổi hành vi hiện có ngoài phạm vi khai rõ trong D1-D6.

**Đã loại:** gộp chung 1 item lớn (từ chối — 2 file scope hoàn toàn tách
biệt, gộp chỉ làm review khó hơn, không giảm effort thật); build cả 3 mức
attestation cùng lúc (từ chối — D3 chốt mức 1, mức 2/3 hoãn, YAGNI).

`fgos graph --json` (chạy fresh): `tsk-66o` không nằm trong `criticalPath`
lẫn `topUnblock` top-5 của repo — không có việc nào khác đang chờ nó,
đúng như `deps: []` đã xác nhận. `fgos graph --what-if` không cần chạy
cho 2 con vì chúng không cạnh tranh thứ tự — file-disjoint hoàn toàn
(`src/state/graph-metrics.mjs`+`bin/fgos.mjs`/`command-registry.mjs` vs
`src/runner/dispatch.mjs`+`src/runner/frozen-judge.mjs`), làm song song
được thật, không đứa nào unblock đứa kia.

Impact-analysis capability: `present` (GitNexus), Full mode — xác nhận
lại fresh trong `fgos-coding-exploring` round (seq đã ghi, xem CONTEXT.md).

### Risk map

| Thành phần | Rủi ro | Bằng chứng cần (→ fgos-coding-validating) |
|---|---|---|
| `computeSchedule`/`detectCycles` (mới, `graph-metrics.mjs`) | Trung bình — thuật toán mới (Kahn+Tarjan), sai có thể báo sai sóng | Unit test: 1 cặp chồng footprint + 1 cặp không chồng + 1 chu trình dep giả → đúng số sóng, đúng thành viên, cycle bị từ chối tại cửa ghi deps |
| Chụp `baseCommit`/`headRef` quanh `resolveExecutorConfig` | Thấp — chỉ đọc, không ghi state mới | Test: giá trị chụp khớp `git rev-parse HEAD` thật tại thời điểm gọi |
| `footprintDiffHits` mới trong `frozen-judge.mjs` | Trung bình — phải KHÔNG đụng `frozenJudgeHits` cũ (D5 quy định rõ) | Regression test: `FROZEN_JUDGE_PATTERNS`/`frozenJudgeHits` cho input y hệt trước/sau đổi phải trả kết quả GIỐNG HỆT nhau |
| D5 (miễn khi vắng footprint) | Thấp — logic rẽ nhánh đơn giản | Test: footprint absent → `footprintDiffHits` trả `[]` bất kể diff gì |

## Shape (standard — phased)

**Phase A — `computed-parallel-wave-schedule`** (file: `src/state/graph-metrics.mjs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs`):
1. `detectCycles(view)` — Tarjan, quét MỌI cell bất kể status, self-dep = cycle 1 phần tử (mẫu theo beegog, cite deep-dive).
2. `computeSchedule(view)` — Kahn layering trên `frontier()`, item chồng footprint dời sang wave sau (tái dùng `footprintOverlapAmong` đã có).
3. Verb đọc-only mới đăng ký qua `command-registry.mjs` (tên cụ thể để `fgos-coding-validating`/implementer chọn — không khoá tên verb ở plan này, chỉ khoá shape input/output: trả `{waves: [[ids...]], cycleRefused: bool}`).

**Phase B — `worktree-dispatch-attestation`** (file: `src/runner/dispatch.mjs`, `src/runner/frozen-judge.mjs`):
1. `dispatch.mjs`: chụp `baseCommit` (`git rev-parse HEAD`)/`headRef` ngay trước lời gọi `resolveExecutorConfig` khi target là `cli`-kind cross-provider — ghi vào đâu (log/decision/trace) là chi tiết implementer, plan chỉ khoá: PHẢI chụp TRƯỚC dispatch, không phải sau.
2. `frozen-judge.mjs`: hàm mới `footprintDiffHits(changedFiles, footprint)` — cạnh `frozenJudgeHits` cũ, KHÔNG sửa hàm cũ. Vắng footprint → `[]` (D5). Có footprint → hit cho MỌI file ngoài footprint (không giới hạn `FROZEN_JUDGE_PATTERNS`).

Cả 2 phase advisory-only — không throw, không đổi outcome merge/dispatch nào.

## Quyết định split

2 con thật, mỗi con `parent: tsk-66o`, độc lập file, làm song song được —
đã tạo thật (`tsk-3c7`, `tsk-2ig`):

1. **`tsk-3c7` — computed-parallel-wave-schedule** — footprint: `src/state/graph-metrics.mjs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `test/state/graph-metrics.test.mjs`. Verify: `node --test test/state/graph-metrics.test.mjs`.
2. **`tsk-2ig` — worktree-dispatch-attestation** — footprint: `src/runner/dispatch.mjs`, `src/runner/frozen-judge.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/frozen-judge.test.mjs`. Verify: `node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs`.

Root (`tsk-66o`) verify không đổi (đã khoá qua `discover --force`): `grep -q 'computeSchedule\|detectCycles' src/state/graph-metrics.mjs && grep -q 'baseCommit' src/runner/dispatch.mjs && grep -q 'footprintDiffHits' src/runner/frozen-judge.mjs && node --test test/runner/frozen-judge.test.mjs test/runner/dispatch.test.mjs test/state/graph-metrics.test.mjs`.

## Assumptions (không material, không hỏi lại CONTEXT.md)

- Tên verb CLI mới cho wave-schedule (vd `fgos schedule`) — implementer chọn, không ảnh hưởng scope/behavior/acceptance.
- Nơi lưu `baseCommit`/`headRef` chụp được (log file, decision, hay trace field) — implementer chọn theo pattern sẵn có gần nhất trong `dispatch.mjs`.
