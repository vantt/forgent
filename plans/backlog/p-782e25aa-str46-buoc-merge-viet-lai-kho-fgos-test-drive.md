---
id: p-782e25aa
title: "STR46 buoc merge: viet lai kho fgos-test-drive tu ngoai worktree str46"
status: proposed
priority: P2
area: str46-io-contract
created: 2026-11-21
---

# Why

STR46 buoc merge: viet lai kho fgos-test-drive tu ngoai worktree str46

# Done when

Kho /home/vantt/projects/fgos-test-drive/.fgos KHONG viet duoc tu worktree str46: write guard tu choi moi duong dan khong nam gon trong worktree vat ly (da do bang probe that, khong phai suy doan). Vi vay no roi khoi lat 1 cung ly do da doi kho song ra. Pham vi: events.jsonl 26 dong, 12 dong mang ten cu, 0 dang predicted long, tat ca deu mang truong version. Kho la mot repo git nhung .fgos KHONG duoc theo doi nen khong co nghia vu commit. Dung script scripts/migrate-actor-to-role.mjs (cell str46-io-contract-r3-6), chay --dry-run truoc, backup ra ngoai thu muc kho. Sau do chay lai ban chieu bang cach dat thu muc lam viec VAO chinh kho do roi goi bin/fgos.mjs rebuild - fgos lay kho tu process.cwd() va KHONG co co --dir nao, nen goi tu cho khac se nham vao kho sai. Xong: log khong con ten cu, khong con dong khai version 2, moi dong parse duoc, 26 dong, seq lien tuc. Chay cung dip voi PBI p-b822cf9f (kho song), tu mot noi co quyen ghi ca hai.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
