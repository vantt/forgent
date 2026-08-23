# RESEARCH — tsk-60r4 (review cụm merge tsk-2t9c + vệ tinh, 2026-08-16)

## Round 1 — 2026-08-16, discovery grounding

**Asked:** (1) iron-law evidence gate — nơi implement/doc, có convention nào
bắt viết `iron-law-evidence.md` hồi tố cho item đã merge trước khi gate ra
đời không; (2) các artifact được tham chiếu có tồn tại không; (3) verify
command thật cho item review này.

**Checked (repo, cited):**

- `rg "acknowledge-iron-law|iron-law-evidence"` →
  `bin/fgos.mjs:183-199` (`excludeIronLawEvidence` — evidence file là
  "mandatory workflow artifact ... for every Iron-Law-required item", trích
  contract `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md`),
  `src/runner/iron-law-gate.mjs`, `src/verbs/merge/iron-law-level.mjs`,
  `src/cli/command-registry.mjs:829,853`.
- `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` — contract
  tồn tại từ 2026-07-30 (tsk-5t3), TRƯỚC ngày merge tsk-2t9c (2026-08-16).
  Gate fires tại `approve`; không thấy check nào scan hồi tố evidence file
  cho item ĐÃ merged (không có doctor check nào tên iron-law/evidence —
  cần xác nhận lại ở execution).
- `docs/decisions/0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md`
  (dated 2026-08-15, status accepted) — mức `warn`, hỏi ở ranh giới trunk.
- **Artifact check:** `docs/history/fgos-marketing-domain-foundation/`
  chứa đủ 4 file (CONTEXT.md 16K, DISCUSSION.md 64K, design-distill.md
  17K, plan.md 31K). Merge commits trên main: `e268376e` (fgw/tsk-2t9c),
  `5236eb10` (fgw/tsk-3vk), `2a15a63d` (fgw/tsk-ogx) — khớp mô tả.
  `docs/history/tsk-2t9c/` KHÔNG tồn tại (khớp nghi vấn 1: không có
  iron-law-evidence.md).

**Found — mới, ngoài 5 nghi vấn ban đầu:**

- **Decision-number collision:** `docs/decisions/` có HAI file cùng số
  0032: `0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md`
  và `0032-multi-role-team-harness-role-holder-axis-va-handoff.md` (đã
  rename thành `0033-...` trong chính item này) — hai
  nhánh song song (tsk-in1 cluster vs tsk-2t9c) đều lấy số 0032. Cần đưa
  vào scope review (nó thuộc chính cụm này — file multi-role là của
  tsk-2t9c).

**Still open:** nội dung chi tiết 5 file conflict-resolve, tương tác
handoff/roleGraph × kind/via migration — đó là chính công việc của item
này (executing), không phải gap discovery.

**Verdict:** clear — intent của item đã đủ cụ thể (5 nghi vấn + hành động
cho mỗi kết cục), mọi artifact tham chiếu đều thật. Verify đề xuất:
`npm test` (state + cli + runner + e2e; DoD L5-Q5) — báo cáo là artifact
judgment kèm theo.
