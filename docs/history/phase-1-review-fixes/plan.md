---
artifact_contract: bee-plan/v1
artifact_readiness: implementation-ready
mode: standard
---

# Plan: Phase 1 Review Fixes

Mode: `standard` — 2 risk flags: public contracts (bề mặt exit-code R4), existing covered behavior (71 test đang phủ vùng sửa).
Why this is the least workflow that protects the work: >3 file, chạm contract công khai — small không đủ; không hard-gate flag — high-risk thừa. Scope synthesis từ review findings thay CONTEXT.md (surface-scope-earlier); mọi finding trích theo id F1–F4 + P3 bundle của `reports/review-session-findings.md` (feature phase-1-state-layer).

## Requirements (from review session — user approved fix-before-Phase-2)

- F1: `move` với cờ trống/empty (`--to` bare, `--expect ""`) phải trả `validation` (exit 4), không lọt sang 2/3. Bảng mã thoát GIỮ NGUYÊN giá trị — chỉ sửa phân loại input hỏng.
- F2: một nguồn duy nhất cho taxonomy category→exit-code; `categoryOf` đọc `err.category` thay vì instanceof-chain; CLI import error surface qua facade store (gộp P3-f6); header store.mjs sửa claim cho đúng (P3-f7).
- F3: test đúng chế độ hỏng thật: view-lệch-còn-tồn-tại → rebuild deep-equal fold tươi; corrupt GIỮA log (valid→corrupt→valid); done-terminal qua CLI thật; exit-5 khi mutation trên log hỏng; test document dep-cycle bất khả thi.
- F4: ràng `status ∈ STATUSES` ở tầng lib. Lựa chọn enforce (trình Gate 2): **khuyến nghị (a)** `validateWorkShape` kiểm membership, dời `STATUSES` về work.mjs (schema sở hữu domain), fsm import lại từ work — tránh vòng import; (b) chỉ store ép `todo` — bị loại vì gap lib vẫn mở.
- Mỹ phẩm: message move in đúng `event #<seq>` (hết `#undefined`).
- Acceptance: cả 4 P2 đóng, suite xanh (≥71 test, thêm mới không giảm), không hành vi nào khác đổi (đặc biệt: giá trị exit-code hiện hành, format events.jsonl, thứ tự event-trước-view-sau).

## Discovery

L0 — mọi finding đã kèm file:line và probe thực nghiệm từ 5 reviewer (review-session-findings.md); critical-patterns mới áp: verify chạy đúng chuỗi literal, glob luôn quote.

## Approach

Một slice, 2 cell nối tiếp (đều đụng `test/cli/fgos.test.mjs`):

1. **Code fixes + test trực tiếp** — taxonomy một nguồn: bảng `category → exit code` export từ store facade (store re-export luôn 4 error class); `categoryOf` đọc `err.category` với fallback 1; guard verb move (bare `true`/`''` → validation 4); fix seq trong message; F4 phương án (a); header store reword. Test mở rộng ngay trong cell: 2 case exit-4 mới, case status ngoài domain bị từ chối, message chứa seq thật.
2. **Gap tests từ review** — 5 test mới theo F3, dùng đúng pattern tmp-dir hiện hành.

**Rejected:** module `errors.mjs` riêng (YAGNI — facade store đủ, tránh thêm file); ép todo ở store thay vì validate schema (gap lib vẫn mở).

**Risk map:** taxonomy refactor chạm 5 file nhưng giá trị mã không đổi — proof: bộ test exit-code hiện hành (17 CLI test) phải pass nguyên vẹn | LOW. F4 đổi hợp đồng lib (status lạ giờ bị từ chối) — greenfield, không consumer ngoài, CLI đã hardcode todo — proof: suite + test mới | LOW. Vòng import work↔fsm — proof: node chạy được là hết chuyện, kiểm ngay khi validating | LOW.

## Test matrix

Dimension cắn được: input rỗng/kiểu sai ở mọi verb flag (không chỉ move — quét cùng pattern requireField) · exit-code từng phạm trù không đổi giá trị · corrupt giữa vs cuối log · view lệch vs view mất · trạng thái ngoài domain ở đường lib · regression 71 test cũ.

## Out of scope

- P3 còn lại không nằm trong F2/F3 bundle trên: proto-key hardening, `--help`, JSON stdout mutation, O(n)×3 (chờ ngưỡng) — ở lại backlog.
- Mọi thứ Phase 2 (routing, frontier).

## Current slice

Slice duy nhất = cả 2 cell. Entry: main sạch, suite 71/71. Exit: 4 P2 đóng, suite xanh với test mới, giá trị exit-code không đổi. Files bounded: `src/state/{work,fsm,store,events}.mjs`, `bin/fgos.mjs`, `test/state/{work,events}.test.mjs`, `test/cli/fgos.test.mjs`, `test/e2e/rebuild-determinism.test.mjs`. Verify tổng: `npm test`.

## Cells

- `phase-1-review-fixes-1` — code fixes F1/F2/F4 + test trực tiếp + fix seq message
- `phase-1-review-fixes-2` — gap tests F3 (deps: 1)
