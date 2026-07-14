# Rehearsal B — bằng chứng validating cho slice C (execute thật)

Date: 2026-07-14 · 3 vòng trên bản sao nguyên trạng 450MB (`cp -a` cả `.git`, đồ ignored) tại /tmp · workspace thật không bị đụng.

## Vòng 1 — cây dơ + rollback thật

- Cây có 3 file tracked chưa commit → script dừng ngay sau bước move (postcheck drift), đúng thiết kế. **Bài học cho cú thật: commit sạch cây trước khi chạy.**
- `--rollback` chạy trên hiện trường nửa-chừng thật (không phải fixture): đảo LIFO đúng, cây về nguyên trạng từng byte git-status. Khớp critical-pattern "đường crash-recovery phải có test giết-thật".

## Vòng 2 — 3 BLOCKER thật (fix: cells repo-divorce-3, repo-divorce-4, commits 4bdbe8b, 59b36ba)

| # | Lỗi | Vá |
|---|---|---|
| F0 (vòng 2 mở màn) | `git rm --cached upstreams` fatal — upstreams/ ignored, 0 file tracked (workspace thật y hệt) | untrack lọc tracked-only qua `git ls-files`, skip + log entry ignored (cell 3) |
| F1 | swap doctrine **no-op im lặng** — script chờ `staged/repo/`+`staged/workshop/`, cell 2 giao 6 file phẳng suffix-named; repo/AGENTS.md sau cắt vẫn nguyên khối BEE | STAGED_MAP tường minh 6 file → đích; thiếu file nào throw ngay (cell 4) |
| F2 | `Author identity unknown` tại commit init xưởng — **SAU điểm-không-quay-đầu** (máy không có git identity global, chỉ repo-local) | stepPrecheck bước 0 phi-mutation: resolve identity (local→global), assert 6 staged + 2 pattern config; fail chết TRƯỚC bước 1; identity set repo-local vào git xưởng (cell 4) |
| F3 | `.gitignore` xưởng thiếu `/upstreams/` → 5 embedded repo bị stage thành gitlink | thêm `/upstreams/` (giữ semantics ignore gốc) (cell 4) |

## Vòng 3 — GREEN toàn tuyến (bản sao mới tinh, commit drift trước)

- Execute exit 0, đủ 6 bước, `upstreams` skip-untrack log đúng.
- **repo/**: lịch sử nguyên vẹn (log tới commit cũ), status chỉ còn 3 file doctrine swapped (xem Ghi chú), AGENTS.md 0 `BEE:` 0 `gitnexus`, `docs/specs/reading-map.md` bản repo, **`npm test` trong repo tách: 234/234 pass**.
- **xưởng/**: AGENTS.md có `GỐC XƯỞNG` + khối bee nguyên vẹn, `docs/reading-map.md` bản xưởng, git riêng 1 commit init, `repo/` ignored (check-ignore pass), upstreams 0 entry tracked, 0 gitlink 160000.
- config vá đúng: `"test": "cd repo && npm test"`, verify tương tự.
- `--rollback` sau execute trọn vẹn: từ chối exit 1 "no checkpoint journal found", 0 mutation.

## Ghi chú trình Gate 3 (không phải blocker)

1. Sau cắt, repo/ còn 3 file doctrine swapped ở trạng thái modified-chưa-commit (AGENTS.md, CLAUDE.md, docs/specs/reading-map.md) — reviewable-by-design; con người duyệt nội dung rồi tự commit như hành động đầu tiên trong repo mới. Tương tự xưởng còn `.bee/config.json` patched-chưa-commit (patch bước 6 chạy sau commit init bước 5).
2. Điều kiện tiên quyết cú thật: cây tracked sạch (vòng 1), git identity resolve được (precheck bước 0 tự chặn).

Verdict: **rehearsal GREEN — đủ điều kiện mở slice C (execute thật) với Gate 3 riêng.**
