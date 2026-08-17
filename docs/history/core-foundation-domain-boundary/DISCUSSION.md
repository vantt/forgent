---
type: discussion
title: Core-foundation vs domain-specific directory/module boundary (tsk-397)
tags: [architecture, module-boundary, domain, engine-vs-prose]
timestamp: 2026-08-17T10:16:00.000Z
status: open
---

# Core-foundation vs domain-specific directory/module boundary (tsk-397)

## 1. Trạng thái hiện tại

Round 2 (2026-08-17): đã xác định đúng nguồn so sánh thật —
`/home/vantt/projects/beegog/` (live checkout, KHÁC với
`upstreams/beegog/` trong chính repo này, vốn chỉ là clone đã pull nhưng
vẫn dừng ở bản cũ). Live checkout có đúng cấu trúc v2.7.0 item mô tả:
`packages/bee-rs` (crate Rust duy nhất), `packages/bee` (vendor payload),
`skills/` (9 skill). Người đã xác nhận dùng checkout này làm nguồn so
sánh. Phát hiện mới: beegog không có khái niệm multi-domain nào giống
`DOMAINS` của fgOS — nên nó là tiền lệ thật cho trục (b) engine-vs-prose,
nhưng KHÔNG phải tiền lệ cho trục (a) core-foundation-vs-domain-specific.
Vẫn đang chờ người trả lời câu hỏi mở đầu từ round 1: có nên tách hai
trục thành hai luồng riêng — chốt trục (b) ngay (có tiền lệ thật + pain
thật: 3 cây skill trùng lặp), park trục (a) tới khi có domain sản xuất
thật thứ hai?

## 2. Mục tiêu & đề bài

tsk-397 muốn thảo luận và điều chỉnh ranh giới thư mục/module của fgOS
theo hai trục độc lập: (a) core-foundation (dùng chung mọi domain) vs
domain-specific (harness + skill riêng theo domain), và (b) engine (code
chạy được — cả JS lẫn Rust) vs skill/prose (doctrine mà agent đọc), tham
khảo mô hình bee upstream (packages/bee-rs = rust core, packages/bee =
vendor payload, skills/ = prose, 9 skill sau khi hợp nhất từ 18). Đây là
item thảo luận kiến trúc thuần tuý — không quyết định implement gì — cần
shaping/discovery trước khi khoá bất kỳ quyết định nào. fgOS thật ra là
multi-domain (`DOMAINS` trong `src/state/workflow-stage-graphs.mjs`) nên
"core" không phải một lớp phẳng theo giả định ban đầu của người submit;
mục tiêu là tìm ranh giới cụ thể trong cây thư mục hiện tại (`src/`,
`bin/`, `plugins/`, `.claude/skills`, `.agents/skills`, `herdr-plugin/`,
`agents/`) và cân nhắc mô hình plugin/extension theo domain có đáng chi
phí duy trì thêm một tầng tổ chức hay không.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Domain nào trong `DOMAINS` là domain sản xuất thật, có skill/harness riêng, cần một ranh giới domain-specific để phục vụ? | Rõ (scout) | Chỉ `coding` có skillMap thật + worktree-backed. `synthetic`, `triage`, `fixture-marketing` đều tự nhận là illustrative/disposable fixture trong chính comment của code — không skill nào từng load, không worktree/merge thật. |
| 2 | Mô hình bee upstream (packages/bee-rs/packages/bee/skills, decision 0025-rust-migration-strategy) có phải một hợp đồng sống với forgentX hiện tại không? | Rõ (scout) | Không. `docs/history/bee-to-fgos-rename/CONTEXT.md` D1 (chốt 2026-08-13, người trả lời trực tiếp): forgentX đã cô lập hoàn toàn khỏi bee, không còn interop sống, "anything learned from bee has already been internalized rather than depended on". Decision 0025 của forgentX là một quyết định khác hẳn (product-priority-order), không phải rust-migration-strategy. |
| 3 | Cây thư mục hiện tại đã có tách engine (code chạy được) khỏi skill/prose chưa? | Rõ một phần (scout) | Có JS engine (`bin/`, `src/`) + Rust engine riêng (`herdr-plugin/`, crate độc lập, song song `src/` chứ không lồng trong nó) tách khỏi ba cây skill: `.claude/skills/` (16, generated wrapper), `.agents/skills/` (16, nguồn canonical thật — CLAUDE.md tự ghi rõ), `plugins/fgOS/skills/` (~52, cây route theo plugin manifest, chứa cả wrapper theo-verb lẫn các skill `fgos-coding-*` cốt lõi). Prose đã tách khỏi code, nhưng đang nhân bản qua 3 cây thay vì 1 nguồn + render. |
| 4 | `upstreams/` (path item liệt kê để khảo sát) có tồn tại trong repo không? | Rõ (scout, sửa lại round 1) | Có, trong main checkout (`upstreams/bee/`, `upstreams/beegog/`, gitignored) — round 1 chỉ kiểm trong worktree cô lập nên báo sai "không tồn tại". Cả hai đều là bản CŨ hơn `/home/vantt/projects/beegog/` (live). |
| 5 | Doctrine layer (AGENTS.md/CLAUDE.md) đã có tiền lệ "luôn nạp vs nạp theo nhu cầu" nào gần với trục engine/skill chưa? | Rõ một phần (scout) | `docs/platform-foundations.md` L8 đã khoá placement test này CHO RIÊNG tầng doctrine (standing sheet vs reference nạp theo nhu cầu) — cùng tinh thần trục (b) nhưng chưa từng generalize ra toàn cây thư mục. |
| 6 | Ranh giới cụ thể core-foundation vs domain-specific nên nằm ở đâu? | Chưa rõ | Phụ thuộc câu hỏi mở (round 1): có đáng tách domain-specific khi mới có 1 domain thật? |
| 7 | Engine vs skill/prose tách theo tiêu chí nào (ngôn ngữ? runtime-executable vs instruction-only? mức nạp?) | Chưa rõ | Cần thảo luận — ba cây skill hiện tại chưa nói rõ tiêu chí này bằng văn bản, chỉ có CLAUDE.md tự chú thích "generated wrapper" cho 2/3 cây. |
| 8 | Mô hình plugin/extension theo domain có đáng chi phí duy trì thêm một tầng tổ chức? | Chưa rõ | Cần cân nhắc so với chi phí hiện trạng (giữ mọi thứ phẳng, domain phân biệt qua data `DOMAINS`, không qua thư mục). |
| 9 | Nguồn so sánh bee/beegog thật nằm ở đâu, và nó có tiền lệ cho trục nào? | Rõ (scout + xác nhận người, round 2) | `/home/vantt/projects/beegog/` (live checkout, KHÁC repo-con `upstreams/beegog/` đã pull nhưng vẫn cũ) có đúng cấu trúc v2.7.0: `packages/bee-rs` (1 crate, 1 binary), `packages/bee` (vendor payload), `skills/` (9 skill, giảm từ 18/15). Không tìm thấy khái niệm multi-domain nào trong beegog (`grep -i "multi-domain\|DOMAINS\b"` không ra kết quả liên quan) — beegog là tiền lệ thật cho trục (b), KHÔNG phải tiền lệ cho trục (a). |

## 4. Quyết định đã chốt

(chưa có D-ID nào — chưa điểm nào giữ ổn định qua hơn một vòng)

## 5. Q&A log

- 2026-08-17 — Round 1 scout: đọc `src/state/workflow-stage-graphs.mjs`
  (`DOMAINS`), `docs/history/bee-to-fgos-rename/CONTEXT.md`,
  `docs/platform-foundations.md` L1/L2/L8, cây thư mục top-level +
  `.claude/skills` + `.agents/skills` + `plugins/fgOS/skills` +
  `herdr-plugin/src`. Không tìm thấy `upstreams/` hay
  `docs/decisions/0025-rust-migration-strategy.md` trong repo này
  (SAI — chỉ tìm trong worktree cô lập, xem round 2).
- 2026-08-17 — Round 2 Q&A: người chỉ ra round 1 sai — `upstreams/`
  CÓ tồn tại trong main checkout. Scout tìm thấy `upstreams/bee/` (snapshot
  nhẹ skills/+AGENTS.md, nguồn "forgent-workshop", bee v1.18.3,
  2026-07-28) và `upstreams/beegog/` (git clone `github.com/vantt/beegog`,
  1.7.10-rc @ 05a131f, 2026-07-21) — cả hai đều CŨ hơn cấu trúc v2.7.0 item
  mô tả (không có `packages/bee-rs`). Người pull `upstreams/beegog` lên
  bản mới nhất — vẫn không thấy `packages/`, skill giảm còn 15 (mất
  bee-context-locking/bee-herding/bee-qualifying) nhưng chưa tới rust-core.
  Người hỏi "upstream/bee là project gì" — trả lời: `bee` và `beegog` là
  MỘT project (không phải hai), chỉ khác cơ chế capture (`bee` = trích
  định kỳ từ workshop sống, `beegog` = git clone của repo đã push). Người
  hỏi "project nào đang có code tận v2.7?" — tìm thấy
  `/home/vantt/projects/beegog/` (live checkout riêng, khác
  `upstreams/beegog/`), xác nhận có `packages/bee-rs` (1 crate `bee`, 1
  binary), `packages/bee` (vendor payload: prompts/, hooks/, statusline/,
  agents/*.tmpl, AGENTS.block.md), `skills/` (9 skill), và
  `docs/decisions/0025-rust-migration-strategy.md` — khớp đúng mô tả của
  item. Grep "multi-domain"/"DOMAINS\b" trong beegog không ra kết quả liên
  quan — beegog không có khái niệm multi-domain. Người xác nhận: dùng
  `/home/vantt/projects/beegog/` làm nguồn so sánh cho phần còn lại của
  thảo luận.

## 6. Thiết kế đã chốt {#design}

(chưa có — chưa hội tụ)

## 7. Danh mục hạng mục / task {#tasks}

(chưa có — chưa đủ hình dạng cụ thể để chia task)
