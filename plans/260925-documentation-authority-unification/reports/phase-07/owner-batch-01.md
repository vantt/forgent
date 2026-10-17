# Owner batch 01 — sent item and Step 1 discovery result

Date: 2026-10-17. Author:
`codex-session:fgos-run_unit-run-17922054c556f0@2026-10-17`.

## CTR010 — already sent by the Lead

**Chuyện gì đang xảy ra:** `CTR010` names both the registered live
`confinement-authority.v1` contract and the Gateway REST `/v1` contract; the platform
registry has no separate Gateway REST row. The Lead already sent this question to the
owner before this Step 1 execution.

**Nguyên nhân:** the collision is present in `docs/platform/architecture-map.md`,
`docs/platform/component-boundary.md` and
`docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`. A42 does not
delegate stable/public contract renumbering.

**Các lựa chọn:**

1. **A:** Gateway keeps `CTR010`; confinement-authority receives the next verified-free
   number and Gateway gets a registry row. This updates the registered confinement
   identity and its rollout/history references.
2. **B:** Confinement-authority keeps `CTR010`; Gateway receives the next verified-free
   number and a Gateway registry row. This updates Gateway candidate/knowledge/YAML
   references.
3. **C:** Defer the choice. Step 3's collision rows and Step 9's zero-conflict verdict
   remain parked.

**Khuyến nghị:** the Lead recommendation sent to the owner is **A**: Gateway keeps
`CTR010`, confinement-authority takes the next free number, and Gateway receives its
missing registry row.

**Phạm vi của câu trả lời:** contract numbering and the missing Gateway registry row
only. It does not authorize promotion, retirement, cutover, main landing, push,
locked-law change or unrelated document edits.

Status: **sent by Lead; answer pending**. Step 1 found no additional owner-only
question. All unrelated work continues.
