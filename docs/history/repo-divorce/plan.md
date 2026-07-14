---
artifact_contract: bee-plan/v1
artifact_readiness: implementation-ready
mode: high-risk
---

# Plan: Repo Divorce

Mode: `high-risk` — cờ hard-gate: nguy-cơ-mất-dữ-liệu (di chuyển `.git`, gỡ tracking); cờ thường: existing covered behavior (234 test phải xanh nguyên trạng), multi-domain (git + docs + config + doctrine).
Why this is the least workflow that protects the work: thao tác cấu trúc lên chính nền đứng của mọi thứ — chuẩn dưới không có persona panel và không bắt buộc diễn-tập-trên-bản-sao trước khi đụng đồ thật.

## Requirements (from CONTEXT.md)

D1 lịch sử thực dụng (.git theo sản phẩm, MỘT commit untrack là điểm-không-quay-lại, không rewrite) · D2 bảng cắt tài liệu (specs/platform-foundations/backlog/handoff-contract/decisions xuống; history/plans/distillery/naming/upstreams + máy bee ở lại) · D3 history ở xưởng, export chưng cất là P12 · D4 xưởng git init riêng, ./repo nested untracked · A1 tên `./repo` · A2 phiên dev mở tại gốc xưởng (ghi thành luật AGENTS.md xưởng) · A3 GitNexus dọn sau · A4 không sandbox riêng. Acceptance (khớp CoS P11): suite 234/234 xanh trong `./repo`; một cell bee smoke trọn vòng ghi vào `./repo`; `fgos ready` + `fgos-runner --dry-run` chạy đúng chỗ mới; doctrine hai bên tách đôi; onboard check xưởng vẫn ok.

## Discovery

L0/L1 — chất liệu đã đầy đủ trong 2 báo cáo consult/collision + CONTEXT; điểm duy nhất cần bằng chứng chạy thật là chính cuộc diễn tập (thuộc validating, không phải research).

## Approach

Xem `docs/history/repo-divorce/approach.md` (high-risk → file riêng). Cốt lõi: **script có checkpoint + dry-run, diễn tập trọn vẹn trên bản sao workspace trong /tmp trước khi đụng đồ thật**; danh sách move sinh từ `git ls-files` đối chiếu bảng D2, không hardcode.

## Shape — Phase plan

| Phase | What Changes | Why Now | Demo | Unlocks |
|---|---|---|---|---|
| A. Công cụ + doctrine staged | `scripts/repo-divorce.mjs` (dry-run/execute, checkpoint) + 4 file doctrine soạn sẵn (AGENTS/CLAUDE hai bên) + reading-map tách đôi soạn sẵn — CHƯA mutate gì ngoài file mới | mọi thứ sau cần công cụ đã diễn tập được | `--dry-run` in kế hoạch đầy đủ từ git ls-files, 0 mutation | B |
| B. Diễn tập (thuộc validating) | chạy `--execute` trên BẢN SAO /tmp; toàn bộ proof suite chạy trên bản sao | không ai đụng đồ thật khi chưa thấy bản sao xanh | bản sao: 234/234 trong repo, untrack đúng, doctrine tách, onboard ok | Gate 3 |
| C. Chạy thật + proof | script `--execute` trên workspace thật + sửa commands + proof suite thật + dọn GitNexus | bản sao đã xanh | đủ 5 acceptance của P11 trên đồ thật | Phase 3 sản phẩm |

## Test matrix

Move nguyên khối: `git -C repo status` sạch sau move (layout khớp index) · Untrack: `git ls-files` sau commit chỉ còn path sản phẩm; không file sản phẩm nào bị gỡ nhầm (diff danh sách trước/sau đối chiếu bảng D2) · Doctrine: AGENTS.md repo không còn chuỗi bee-marker; onboard check xưởng `up_to_date`; A2 thành luật trong AGENTS.md xưởng · Verify mới chạy nguyên văn · fgos/runner cwd mới: ready + --dry-run · bee smoke: một cell tiny trọn vòng ghi `./repo` · Nested git: git xưởng không nuốt `./repo` (status xưởng sạch với ignore) · Điểm-không-quay-lại: script đòi xác nhận tường minh trước commit untrack; trước đó mọi bước lùi được bằng move ngược (test trên bản sao: chạy nửa chừng rồi lùi).

## Current slice

Slice 1 = Phase A (công cụ + staged, KHÔNG mutate gì ngoài file mới). Entry: workspace nguyên trạng, 234/234. Exit: dry-run in kế hoạch đầy đủ 0-mutation; 4 doctrine + 2 reading-map staged đọc-duyệt được. Slice 2 = Phase C (execute thật) — cells CHỈ tạo sau khi diễn tập B xanh + Gate 3 riêng. Verify slice 1: `npm test` (không đổi) + dry-run exit 0.

## Cells

- `repo-divorce-1` — scripts/repo-divorce.mjs: checkpoint/dry-run/execute/rollback, phân loại từ ls-files
- `repo-divorce-2` — doctrine ×4 + reading-map ×2 staged dưới scripts/repo-divorce-staged/

## Out of scope

Tầng động/coexistence (P10) · export chưng cất (P12) · sửa bee upstream · re-review 2 candidates (user gọi riêng) · mọi thay đổi hành vi sản phẩm.
