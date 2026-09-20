# Phase 00 — Decision gate + docs truth pass

Wave 1 · Gate: user · Không sửa code. Context: review §Unresolved questions, §Documentation Corrections, M13.

## Decisions — ACCEPTED 2026-09-20

Người dùng chấp nhận cả 6 khuyến nghị nguyên văn, không sửa đổi. Các phase bị chặn ở cột "Chặn" được mở khoá.

| ID | Câu hỏi | Quyết định | Chặn (nay đã mở) |
|---|---|---|---|
| D1 | Executor id chưa đăng ký (`decide agy`): giữ pinned "rơi về global executor" (`dispatch.test.mjs:5189`) hay `mechanism:'unavailable'` + `reasonCodes:['selector.unregistered']`? | **`unavailable`** — cùng luật với `--for`; typo không được spawn lặng | P05 H6(b) |
| D2 | Direct `execute` door refuse mọi capability `required` vì `backendId` chỉ đọc executor-level: bug hay interim "until P06 wires backends"? | **Bug, sửa** — P06/P08 đã đóng, lý do "chờ P06" không còn hiệu lực; một defaulting rule chung cho cả hai door | P04 H10 |
| D3 | Late result của controller superseded: docs nói "stored and validated", code refuse. | **Ghi `result.superseded.json`** thay vì refuse thẳng — giữ work product; sửa docs #16 cho khớp | P01 L6 |
| D4 | `permissionMode:'bypass'` có hợp lệ trên policy path bwrap không, hay chỉ herdr legacy flags? | **Chỉ khi plan coverage thoả `home/session/workspace`** — derive từ policy thật, không từ legacy flag | P04 M8 |
| D5 | `assess()` effect boundary: nối vào mid-run fallback thật hay đánh dấu reserved? | **Reserved** — xoá khỏi S3 "Implemented" cho tới khi có caller thật, không nối ép | P00 docs (mục 5 dưới) |
| D6 | `confidence` trong `result.json`: giữ tên + định nghĩa lại là receipt grade, hay đổi tên v3? | **Giữ tên**, docs định nghĩa lại — đổi tên là breaking change cho consumer, không đáng | P00 docs (mục §Confidence, Phase 01) |

## Docs sửa ngay (không phụ thuộc code fix — các mục sẽ **vẫn** proposed/partial)

Files: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`, `contracts/assignment-run-runresult.md`, `architecture/runtime-recovery-design.md`, `docs/specs/reading-map.md`, `README.md`, `subcomponents/README.md`, `docs/platform/component-boundary.md`, `docs/architect/proposals/component-authority-boundary-map.md`, `AGENTS.md`, `plans/260916-account-rotator/plan.md`.

1. `fallbackExecutors` → executed cross-provider (33490c36); xoá "reserved-not-executed" ở control-plane :182, :343-344 + comment `assignment-policy.mjs:313-316`, `schema.mjs:277-280`.
2. PlacementPolicy "binds" → "verifies legacy binding, yields on divergence (shadow)"; sửa header `placement-policy.mjs:1-11` (đã có caller).
3. `dispatch recover` "re-enters compiler/confinement/adapter" → mô tả thật (CAS epoch, jsonl, clear claim).
4. S1 "no two winners" → fenced callers only; S3 → partial (assess reserved, D5); S2 → partial (herdr unconfined bind sau start).
5. Proposed-không-có-trong-code: delivery tri-state, `bound/delivered` phases, RunHandle, `ProviderOutcome`, attribution `proven`/`inherited`, observability/contactability per executor, §7 recovery return shape.
6. Contract doc :103-114 "atomic admission/lock not implemented" → implemented cho `retryId` caller; holder `{id,pid}`; `phase/delivery` static.
7. Contract :35-37 inline class "not started" → implemented.
8. `required` confinement = host-write-deny only; hai door default backend khác nhau (cho tới P04 xong).
9. Subcomponent map (uncommitted): worker-home/session/boot thuộc herdr adapter; Capacity sau Admission; Mechanism trước Gate; inventory thêm `drivers/bwrap.mjs`, `probes/harness.mjs`, `src/runner/dispatch.mjs`, `definitions/schema.mjs` (mergePolicyStack), `src/report/dispatch-confidence.mjs`.
10. Forbidden-dependency list → "target" + exception hiện tại (`cli.mjs:1307,1342,21-22,25`; cohort-planner `:151`).
11. `reading-map.md:33-34` trỏ bản platform, bỏ "chưa implemented"; `component-boundary.md:64` trỏ bản platform.
12. `plans/260916-account-rotator/plan.md:3` "not implemented" → implemented (Phase 01–06 trong code), ghi C2 là regression so với Phase 05 contract "quarantine only high-confidence cases".
13. `plans/260910-1243-confinement-authority-implementation/plan.md` P08 note "not merged into main" → kiểm `git branch --contains 569f72d3`; nếu đã ở main, sửa; nếu chưa, đây là quyết định merge tồn đọng (thêm D7).
14. `AGENTS.md` §Dispatch: thêm `executorId` trong result shape; đổi ví dụ `decide --for judge` sang capability có thật.

Docs gắn với code fix (H4 "fails closed", H9, C2, …) sửa **trong** phase tương ứng, không ở đây.

## Validation

- `git diff --stat` chỉ chạm docs/plans; `npm run build:skills` không đổi (không sửa skill).
- Mỗi claim đổi có `file:line` trong review làm căn cứ.
- Component boundary: No component-boundary change.

## Risk / rollback

Chỉ docs; revert bằng git.
