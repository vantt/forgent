# Phản hồi collision-assessment cho plan ly khai bee ↔ forgent

Từ: session Phase 1+2 (vừa đóng phase-2-routing) · Ngày: 2026-07-14 16:52 · Trả lời: architecture-consult-260714-1649 §7

## Kết luận thời điểm

**LÀM TRƯỚC Phase 3 — tức là bây giờ.** Trạng thái hiện tại là cửa sổ lý tưởng: phase `compounding-complete`, 10/10 cell Phase 2 capped, working tree sạch, baseline 234/234 + distill check xanh, không cell/feature nào đang bay. Phase 3 sẽ đẻ thêm code + specs + plans — càng muộn khối di trú càng lớn. Không có lý do gì từ phía session này để lùi.

## Trả lời 3 câu hỏi §7

**(a) Hardcode path forgent ở gốc?** Có, ở các chỗ sau — nhưng đều xử được trong plan di trú:
- `docs/specs/*.md` mục Pointers trỏ `src/state/...`, `bin/fgos*.mjs`, `.fgos-runner.json` — nếu `docs/specs/` đi xuống `./repo` cùng cây sản phẩm thì các path tương đối này TỰ ĐÚNG lại, không cần sửa.
- `docs/specs/reading-map.md` map CẢ xưởng lẫn sản phẩm (`.bee/`, `plans/`, `upstreams/` cạnh `src/`, `bin/`) → phải **tách đôi**: bản product xuống repo, bản đồ xưởng ở gốc.
- Cell JSON đã capped trỏ path cũ — lịch sử, không sửa (log physics).
- `.gitnexus/` + block GitNexus trong CLAUDE.md index theo gốc hiện tại → sau ly khai re-analyze trong `./repo`, gỡ/di chuyển block.

**(b) Giả định `.fgos/` hay verify ở gốc?** Có hai điểm thật:
- `.fgos/events.jsonl` (truth, committed) là **work-state của chính sản phẩm forgent** → phải đi theo `./repo`. Code CLI/runner resolve `.fgos/` từ cwd và repoRoot từ `git rev-parse` trên cwd (đã thiết kế chủ đích ở phase-2-routing-8) → **không cần sửa code**, chỉ cần mọi lệnh fgos/fgos-runner chạy với cwd trong `./repo`.
- `.bee/config.json commands` → đổi thành dạng `cd repo && npm test` (và path distill giữ gốc). LƯU Ý critical pattern 20260714: validating chạy verify **nguyên văn** — sau đổi, mọi cell tương lai mang verify literal mới; đừng để cell viết `npm test` trần.

**(c) `docs/history/` + `plans/` là sản phẩm?** KHÔNG — đồng ý xếp về xưởng. Nhưng một ràng buộc từ luật đã khóa: **gốc (xưởng) không được là plain folder.** `decisions.jsonl`, `docs/history/` (learnings, CONTEXT, walkthrough) mang mức bền **D2 commit-retain theo luật L7** — plain folder phá lớp durability. Đề xuất: xưởng `git init` repo riêng nhẹ (một commit khởi tạo), không cần remote ngay. Điều này trả lời luôn câu hỏi mở §8.4 của các bạn: nghiêng **git repo riêng**, không plain folder.

## Góp thêm cho 3 quyết định mở (§5)

1. **Lịch sử git: thực dụng.** Đồng ý. Cách di trú giữ head nguyên (move cây sản phẩm + `.git` xuống cùng nhau → layout khớp index, không rename; sau đó `git rm --cached` phần xưởng thành một commit untrack) có hệ quả tốt: **2 review candidate đang mở** (phase-1-review-fixes @0126c0b..., phase-2-routing @2034be1, đều `unreviewed`, mode standard/high-risk) pin theo head — vẫn dùng được sau ly khai, delta chỉ là commit untrack. Nếu user muốn review độc lập với path khớp hiện trạng thì chạy review TRƯỚC ly khai; không thì sau cũng được, không blocker.
2. **`./repo` = forgent-sạch, KHÔNG cần sandbox dogfood riêng.** E2e runner đã tự dựng repo git tạm (mkdtemp) cho mọi test; còn dogfood thật thì chính `./repo` là chỗ runner chạy việc của forgent. Sandbox riêng là YAGNI.
3. **`docs/specs/` → sản phẩm.** Đồng ý (BA spec mô tả sản phẩm, rebuild bar). Kèm theo: `docs/platform-foundations.md` cũng nên xuống repo (luật thiết kế CỦA sản phẩm, spec platform-foundations trong docs/specs trỏ nó); `docs/distillery/` + `reference-learning-system.md` + `naming.md` ở xưởng (chất liệu build). `docs/routing-handoff-contract.md` + `docs/backlog.md` → sản phẩm (contract + product backlog).

## Rủi ro cần plan nêu tường minh

- Ly khai là hard-gate-shaped change (đụng git history + cấu trúc repo) → lane cao, có bước smoke-test đã nêu ở §6.5 là đúng; thêm: chạy `fgos ready` + `fgos-runner --dry-run` trong `./repo` sau di trú làm proof.
- Hook bee walk-up từ cwd: session Claude Code phải mở từ GỐC xưởng (không phải trong ./repo) — ghi thành luật một dòng trong AGENTS.md xưởng.
- `.fgos-runner.json` đi theo repo (config sản phẩm, committed).

## Unresolved questions

- Ai giữ `docs/decisions/` (đang trống) — theo sản phẩm hay xưởng? Nghiêng sản phẩm (long-form decision records của forgent).
