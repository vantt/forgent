# 0010 — Bản đồ kiến trúc là bản chuẩn

**Ngày:** 2026-07-16 · **Trạng thái:** chốt

## Bối cảnh

Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.

## Quyết định

1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
   chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một
   chiều xuống (được nhảy tầng), đo trên đồ thị import thật. Host Adapter là ổ
   cắm (port + config), không phải tầng import. Hai lớp phủ: physics (5 từ dành
   riêng `store/event/state/signal/run`) và authority (6 vai). Hai sổ đăng ký:
   component (14/14 module, tách row component/slice) và contract (C1–C9).
2. **Nghi thức "thẻ căn cước trước code"** (map §9.1) có hiệu lực như **phụ lục
   definition-of-done**: một module/slice mới phải có row trong sổ §6 trước khi
   có code. Không sửa văn bản luật L5 tại chỗ, không mở luật mới — khi L5 tới
   ngưỡng xem lại thì gộp chính thức lúc supersede.
3. **Năm câu hỏi mở của bản đồ chốt theo đề xuất:** (a) nợ C2 một-cửa-ghi
   per-process giải ở PBI riêng trước STR6 fan-out, không chặn STR15; (b) xử lý L5
   như trên; (c) `dispatch.mjs` giữ một file ở Infra, chỉ tách khi STR8/STR16 đòi;
   (d) C1 envelope đợi STR14; (e) registry-manifest + 2 phép kiểm máy (chiều
   import + đủ sổ) là **PBI STR20, đứng trước S2-friction**.
4. Bản đồ nối vào đường đọc chuẩn: `docs/specs/reading-map.md` + mục lục README.
   Tài liệu bàn luận gốc ở xưởng hạ thành thinking record.

## Hệ quả

- Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
  registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng
  hoặc file thiếu row).
- Đổi bản đồ = decision record mới supersede 0010 + nâng version, không sửa ngầm.
- Nợ có tên còn mở: C2 cross-process lease (trước STR6), C6 designed-chưa-code,
  C3 partial (3 field RUN_CONTRACT vay khi fan-out).
