---
type: discussion
title: Core-foundation vs domain-specific directory/module boundary (tsk-397)
tags: [architecture, module-boundary, domain, engine-vs-prose]
timestamp: 2026-08-17T10:16:00.000Z
status: open
---

# Core-foundation vs domain-specific directory/module boundary (tsk-397)

## 1. Trạng thái hiện tại

Round 1 (2026-08-17): item claimed, scouted. Chưa có quyết định nào chốt.
Đang chờ người trả lời câu hỏi mở đầu: tách "engine vs skill/prose" riêng
khỏi "core-foundation vs domain-specific" — vì scout cho thấy tiền đề thứ
hai (multi-domain thật) chưa có bằng chứng thứ hai để tách theo.

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
| 4 | `upstreams/` (path item liệt kê để khảo sát) có tồn tại trong repo không? | Rõ (scout) | Không — thư mục này không có trong checkout hiện tại. |
| 5 | Doctrine layer (AGENTS.md/CLAUDE.md) đã có tiền lệ "luôn nạp vs nạp theo nhu cầu" nào gần với trục engine/skill chưa? | Rõ một phần (scout) | `docs/platform-foundations.md` L8 đã khoá placement test này CHO RIÊNG tầng doctrine (standing sheet vs reference nạp theo nhu cầu) — cùng tinh thần trục (b) nhưng chưa từng generalize ra toàn cây thư mục. |
| 6 | Ranh giới cụ thể core-foundation vs domain-specific nên nằm ở đâu? | Chưa rõ | Phụ thuộc câu hỏi mở (round 1): có đáng tách domain-specific khi mới có 1 domain thật? |
| 7 | Engine vs skill/prose tách theo tiêu chí nào (ngôn ngữ? runtime-executable vs instruction-only? mức nạp?) | Chưa rõ | Cần thảo luận — ba cây skill hiện tại chưa nói rõ tiêu chí này bằng văn bản, chỉ có CLAUDE.md tự chú thích "generated wrapper" cho 2/3 cây. |
| 8 | Mô hình plugin/extension theo domain có đáng chi phí duy trì thêm một tầng tổ chức? | Chưa rõ | Cần cân nhắc so với chi phí hiện trạng (giữ mọi thứ phẳng, domain phân biệt qua data `DOMAINS`, không qua thư mục). |

## 4. Quyết định đã chốt

(chưa có D-ID nào — chưa điểm nào giữ ổn định qua hơn một vòng)

## 5. Q&A log

- 2026-08-17 — Round 1 scout: đọc `src/state/workflow-stage-graphs.mjs`
  (`DOMAINS`), `docs/history/bee-to-fgos-rename/CONTEXT.md`,
  `docs/platform-foundations.md` L1/L2/L8, cây thư mục top-level +
  `.claude/skills` + `.agents/skills` + `plugins/fgOS/skills` +
  `herdr-plugin/src`. Không tìm thấy `upstreams/` hay
  `docs/decisions/0025-rust-migration-strategy.md` trong repo này.

## 6. Thiết kế đã chốt {#design}

(chưa có — chưa hội tụ)

## 7. Danh mục hạng mục / task {#tasks}

(chưa có — chưa đủ hình dạng cụ thể để chia task)
