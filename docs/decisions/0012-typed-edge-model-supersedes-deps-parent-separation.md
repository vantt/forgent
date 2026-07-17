---
title: Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời
date: 2026-07-18
status: accepted
source_decisions: [b5c0ba0c, 896219a7]
supersedes: ["0002"]
relates_specs: [work-state]
---

# 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời

## Bối cảnh

0002 khoá "deps và parent là hai quan hệ tách rời có chủ đích": `deps` là cạnh
phụ thuộc phẳng cho phép fan-out xuyên story; `parent` là quan hệ lineage
(decompose) mà chỉ frontier dùng riêng để chặn cha cho tới khi mọi con xong
(`work.mjs:165-166` trước sửa). work-graph-intelligence S1 (decision 896219a7)
đóng một lỗ hổng sống: `deps` không có cycle-check — `editWork` có thể ghi một
chu trình A↔B lặng lẽ. Guard của S1 chỉ phủ nhánh `deps`.

Việc dò tay lúc validating S2a phát hiện một lỗ hổng sống **khác**, benign
nhưng có thật: `parent` **không bao giờ được existence-check**
(`validateDeps`, `work.mjs:205-213`, chỉ xét `deps`; `store.mjs` trước S2a
chưa từng đọc `parent`). Hai lệnh `addWork` với một `parent` trỏ tới một id
chưa tồn tại (dangling forward parent) đóng được một chu trình cha-con A↔B mà
guard deps-only bỏ sót — vô hại (`frontier.mjs`'s tập `seen` chặn treo máy khi
duyệt) nhưng thật, không phải giả định lý thuyết.

Beads (nguồn tham khảo đã mined — `beads.md:36`, `work-item-management.md:117`)
mô hình hoá cycle-check hợp nhất trên `blocks`+`parent-child`+`conditional` —
không tách theo trường lưu trữ. fgOS đi theo đúng bằng chứng đó: gộp `deps` và
`parent` thành MỘT đồ thị cạnh-định-kiểu (typed edges) cho mục đích tính toán
và bảo đảm phi-chu-trình, trong khi hai trường lưu trữ vẫn tách riêng.

## Quyết định

- **fgOS mô hình hoá quan hệ giữa các work item bằng MỘT đồ thị cạnh-định-kiểu
  DẪN XUẤT** (derived — không phải một trường vật lý mới): `deps` chiếu thành
  cạnh `blocks` (`I -> d`, nghĩa "I chờ d"); `parent` chiếu thành cạnh
  `parent-child` (`P -> C`, nghĩa "cha chờ con" — đúng hướng
  `hasOpenDescendant` của `frontier.mjs`, không phải hướng con→cha ngây thơ,
  vì hướng ngây thơ sẽ làm một chu trình hỗn hợp blocks/parent-child không
  phát hiện được). `waits-for` và `discovered-from` là **từ vựng đã khai báo**
  — chưa có dạng lưu trữ hay producer nào (hoãn sang S2b).
- **Quyết định này SUPERSEDE 0002** (và spec Data Dictionary #13,
  `work.mjs:164-166`) ở đúng một điểm: "deps và parent tách rời có chủ đích"
  giờ đọc là "tách rời về **lưu trữ và ngữ nghĩa**, nhưng hợp nhất thành
  **một đồ thị** cho cycle-check và mọi compute slice sau này (S5+)". 0002
  không sai về lưu trữ — phần đó giữ nguyên; nó chỉ chưa tính tới việc hai
  quan hệ cần chung một bảo đảm phi-chu-trình.
- **Bảo đảm phi-chu-trình tại cửa ghi duy nhất (`store.mjs`) giờ phủ ĐỒ THỊ
  HỢP NHẤT `blocks`+`parent-child`**, không chỉ `deps` — **đã ship và verify
  xanh** (work-graph-intelligence cell -3/-4): `src/state/dep-graph.mjs` thêm
  `buildUnifiedEdges`/`findUnifiedCycle`/`assertNoUnifiedCycle` bên cạnh các
  hàm `deps`-only của S1 (`findDepCycle`/`assertNoCycle`, giữ nguyên hành vi
  và chữ ký); `store.mjs` gọi `assertNoUnifiedCycle` cạnh `assertNoCycle` cũ
  tại cả `addWork` và `editWork`, trước `appendEvent`. Điều này **đóng** lỗ
  hổng chu trình cha-con sống nói trên (benign nhưng có thật) — làm cho bất
  biến 896219a7 ("đồ thị phi chu trình") đúng cho **toàn bộ** đồ thị hợp
  nhất, không chỉ nhánh `deps`.
- **Dẫn xuất, không vật lý (derived-not-physical) — ba căn cứ:**
  1. **R11** (log bất khả xâm phạm, `work-state.md:703`): một trường
     `edges[]` lưu trữ mới sẽ đòi migration cho mọi event cũ; một
     read-projection thuần Domain thì không.
  2. **Học thuyết DT2 "add-through-không-alongside"**: mở rộng cửa ghi hiện
     có (`assertNoCycle` cộng thêm `assertNoUnifiedCycle`, cùng một cửa)
     thay vì mở một đường ghi song song.
  3. **~10 consumer đọc trực tiếp `.deps`/`.parent`** (frontier, impact,
     `validateDeps`, v.v.) — giữ nguyên, không cần migrate.
- Vì thuần dẫn xuất: **không có trường lưu trữ mới, `SCHEMA_VERSION` giữ
  nguyên 2**, mọi event cũ replay y hệt (R11).

## Hệ quả

- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record 0012,
  hàng component §6 (`dep-graph.mjs`) và hàng contract **C2** đều cập nhật để
  phản ánh bảo đảm phi-chu-trình đã mở rộng sang đồ thị hợp nhất.
- `waits-for`/`discovered-from` vẫn chỉ là từ vựng khai báo — không producer,
  không dạng lưu trữ — cho tới S2b (dạng lưu trữ thật, `SCHEMA_VERSION`→3,
  có producer, và quyết định riêng cho tính chất load-bearing/chặn hay
  không của `waits-for`).

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
