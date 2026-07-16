---
title: Coexistence — chạy cạnh một harness agent khác
status: living
relates_decisions: [0009]
relates_backlog: [P10]
---

# Coexistence

fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.

## Lãnh địa (territory)

fgOS chỉ ghi/khóa trong phạm vi:

| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |

Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:

1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.

Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.

## Một-nhạc-trưởng-mỗi-phiên

Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.

## Nhường-nhịn lúc init (marker detection)

`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).

Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.

`init` luôn thành công bất kể phát hiện gì.

## Manifest schema (`.fgos/coexistence.json`)

```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```

`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).

## Known Gaps (thành thật, chưa flip)

Nguyên tắc 2 của record 0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:

1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.

Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.

Phần fgOS của P10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.

## Pointers

- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (P10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
