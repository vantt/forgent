---
id: p-b822cf9f
title: "STR46 buoc merge: viet lai kho .fgos song tu checkout chinh, cung luc ma moi dap xuong main"
status: proposed
priority: P2
area: str46-io-contract
created: 2026-11-21
---

# Why

STR46 buoc merge: viet lai kho .fgos song tu checkout chinh, cung luc ma moi dap xuong main

# Done when

Chay tu /home/vantt/projects/forgent/repo (checkout chinh), KHONG tu worktree str46 - o day .fgos la symlink va cac file cua no bao la da xoa. Dieu kien tien quyet: khong phien nao khac dang ghi (kiem .fgos/sessions.json va .fgos/events.lock truoc khi bat dau). Dung script scripts/migrate-actor-to-role.mjs do cell str46-io-contract-r3-6 tao ra, chay --dry-run truoc. Pham vi mot kho: chi events.jsonl (111 dong, 54 mang ten cu, 5 trong so do la dang predicted long); state.json dung lai bang fgos rebuild, khong sua tay; coexistence.json va entropy-history.jsonl mang 0 ten cu nen ngoai pham vi. Sau khi xong: log khong con ten cu, khong con dong khai version 2, moi dong parse duoc, so dong van la 111, seq lien tuc. Ba file duoc theo doi trong checkout chinh (coexistence.json, entropy-history.jsonl, events.jsonl) nam trong dung mot commit voi lan merge. TUYET DOI khong cham repo/test/fixtures/phase1-events.jsonl. Can mien tru pre-release cua ban ghi 0017 (cell str46-io-contract-r3-1) da ton tai truoc khi chay.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
