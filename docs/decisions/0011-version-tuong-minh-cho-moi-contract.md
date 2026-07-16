---
title: Version tường minh cho mọi contract — schema, artifact, event
date: 2026-07-16
status: accepted
source_decisions: [13916523]
relates_specs: [work-state, runner]
extends: [0007]
---

# 0011 — Version tường minh cho mọi contract

## Bối cảnh

0007 đã khoá "mỗi **event** mang trường schema version". Nhưng fgOS không chỉ
expose event ra ngoài code của nó — nó còn expose **schema** (shape của
work item, state.json) và **artifact** (file sinh ra cho người/agent khác đọc:
report, plan, brief). Cả ba đều là hợp đồng (contract) mà một bên ngoài —
người, agent khác, phiên bản code sau — phải đọc đúng shape mà không cần hỏi
lại. Không khai version ở cả ba là cùng một lỗ hổng 0007 đã vá cho event,
chỉ chưa vá cho hai loại còn lại.

Bằng chứng sống trong chính workshop: bee (harness phát triển cạnh fgOS) đã
tự giải bài này cho artifact bằng một quy ước cụ thể — frontmatter
`artifact_contract: bee-plan/v1` trên mọi artifact có shape ổn định
(`bee-planning`, `bee-briefing`, `bee-xia`: `bee-plan/v1`,
`bee-walkthrough/v1`, `bee-implement-plan/v1`, `bee-research/v1`). Version
nhúng thẳng trong định danh — đọc được bằng mắt (không cần mở schema riêng)
và bằng code (regex/parse một field), khác với version-là-field-số-rời mà
0007 dùng cho event.

## Quyết định

Ba loại contract fgOS expose ra ngoài code của nó — **schema** (shape dữ liệu
bền: work item, state.json), **artifact** (file sinh cho người/agent khác:
report, plan, spec-fragment), và **event** (đã khoá ở 0007) — đều phải khai
version tường minh trong định danh của chính nó, theo mẫu `<name>/v<N>`:

1. **Artifact có shape ổn định mang `contract: <name>/v<N>`** trong
   frontmatter hoặc header của file — không phải một ghi chú rời, mà một
   field có thể regex/parse được bằng code lẫn đọc được bằng mắt.
2. **Schema (work item, state.json) mang version trong chính bản thân dữ
   liệu** — kế thừa nguyên xi cách 0007 đã làm cho event (field version rời,
   vì đây là dữ liệu máy đọc liên tục, không phải file người mở ra đọc).
3. **Tăng `vN` khi shape đổi không tương thích ngược** (field bị xoá/đổi
   nghĩa); thêm field mới an toàn không bắt buộc tăng version (đã có ở 0007
   cho event, áp dụng chung).
4. Không có quy ước version nào là non-goal: nếu một artifact/schema mới
   sinh ra không có kế hoạch đổi shape trong tương lai gần, nó vẫn khai
   `v1` — khai version rẻ, thiếu version mới đắt (không dò được ai đang đọc
   shape nào).

## Hệ quả

- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,
  +artifact), không đổi luật event đã có.
- **Artifact fgOS tương lai (report, plan, spec) theo đúng mẫu bee đã dùng
  sống**: `contract: <ten>/v<N>` — không cần phát minh lại quy ước, port
  nguyên cái đã chứng minh trong workshop.
- **Chi phí:** mỗi artifact/schema type mới phải chọn tên contract + version
  ngay từ v1, không hoãn "để sau".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
