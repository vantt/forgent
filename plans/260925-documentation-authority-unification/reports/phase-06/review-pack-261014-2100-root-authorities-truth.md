# Root authorities: independent truth sample

Author session: codex-session:17@2026-10-14
Content commit: c8b2d948d6dd0b408011b294fd67aea59870749b
Rows: 30
Population: 226
Population SHA256: `fac63998655cdf42582e357d0946bac41c178498bcf526f456ac82f0d7bfda22`
Seed: `root-authorities-first-bounded-request-2026-10-14-owner-request`

## Truth unit 1

````json
{
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea",
  "shownTextDigest": "dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea"
}
````

````text
- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 2

````json
{
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1",
  "shownTextDigest": "f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1"
}
````

````text
Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 3

````json
{
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2",
  "shownTextDigest": "7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2"
}
````

````text
The platform direction is:
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 4

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-57",
  "unitDigest": "b6f12056369ca7e5650f2f58f585a9df16b8b6a1c04e7b237beda6f36667ab45",
  "shownTextDigest": "b6f12056369ca7e5650f2f58f585a9df16b8b6a1c04e7b237beda6f36667ab45"
}
````

````text
`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 5

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-22",
  "unitDigest": "3a6dcb2e47ba74a351cb9c2daca6c6cd6fff98df8e40eec2f9c3e0d8a72d2561",
  "shownTextDigest": "3a6dcb2e47ba74a351cb9c2daca6c6cd6fff98df8e40eec2f9c3e0d8a72d2561"
}
````

````text
Docs that contain normative design or behavior claims should also track
implementation alignment. Use a compact table in the doc itself or link to a
verification doc:
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 6

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-60",
  "unitDigest": "bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c",
  "shownTextDigest": "bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c"
}
````

````text
Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 7

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-41",
  "unitDigest": "6fd1889b01d12af05ea88205763f14af71126996f95ec74a66ed60f794fbd583",
  "shownTextDigest": "6fd1889b01d12af05ea88205763f14af71126996f95ec74a66ed60f794fbd583"
}
````

````text
- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 8

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-51",
  "unitDigest": "7d63e10ab7e1a99a6ff8a9670bf281b5cca0e3875d33ae93c2061088c086c6d8",
  "shownTextDigest": "7d63e10ab7e1a99a6ff8a9670bf281b5cca0e3875d33ae93c2061088c086c6d8"
}
````

````text
Component-boundary discipline:
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 9

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-32",
  "unitDigest": "3ef0991bbca1a01f425854ee2163524cce0cb46d05a4cb874d795c894b2d284d",
  "shownTextDigest": "3ef0991bbca1a01f425854ee2163524cce0cb46d05a4cb874d795c894b2d284d"
}
````

````text
Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 10

````json
{
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-30",
  "unitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
  "shownTextDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca"
}
````

````text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 11

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-90",
  "unitDigest": "3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e",
  "shownTextDigest": "3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e"
}
````

````text
`conflicts` tìm rủi ro đụng-độ-file giữa các item CÓ THỂ giao SONG SONG. Tập ứng viên là frontier (`ready` = item giao được ngay bây giờ), nên mỗi xung đột là thật: một runner song song có thể nhặt cả hai cùng lúc.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 12

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "712b25def116afd126d457573aee97c662dafefa81fc405d6f94b5d4d03714f4",
  "shownTextDigest": "712b25def116afd126d457573aee97c662dafefa81fc405d6f94b5d4d03714f4"
}
````

````text
They are still governed by this taxonomy.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 13

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-38",
  "unitDigest": "0756c95549ccda581c1a34db1a971c70a94fd97cf12436ad67ffff69e35246c6",
  "shownTextDigest": "0756c95549ccda581c1a34db1a971c70a94fd97cf12436ad67ffff69e35246c6"
}
````

````text
Rules:

- A simple implementation does not shrink the vision by itself.
- Omission from a phase does not mean rejection.
- Mark a preserved intent `superseded` or `rejected` only with explicit human
  decision and rationale.
- Every implementation plan that narrows a vision should include an intent
  traceability table and a must-not-preclude check.
- Keep the ledger close to vision: platform-wide at
  `docs/platform/intent-preservation-ledger.md`, area-specific at
  `docs/platform/<area>/intent-preservation-ledger.md`.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 14

````json
{
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-35",
  "unitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
  "shownTextDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5"
}
````

````text
Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 15

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-26",
  "unitDigest": "254b6fe8f459303477ac0d2ad489dcc3d01fd69b2aee918063c20d66406f675b",
  "shownTextDigest": "254b6fe8f459303477ac0d2ad489dcc3d01fd69b2aee918063c20d66406f675b"
}
````

````text
```txt
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
```
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 16

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-35",
  "unitDigest": "cbcd46946204f1fee09cc538210be3a601fff688a5dc3d80693a266801610daf",
  "shownTextDigest": "cbcd46946204f1fee09cc538210be3a601fff688a5dc3d80693a266801610daf"
}
````

````text
| Document | Role |
|---|---|
| Vision | States the full intended direction and why it matters. |
| Intent preservation ledger | Tracks which parts of that intent are implemented, deferred-preserved, superseded, rejected, or still unknown. |
| Spec | States what is currently true. |
| Architecture | Explains the accepted design shape and trade-offs. |
| Verification | Proves whether current implementation matches the claim. |
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 17

````json
{
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
  "shownTextDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9"
}
````

````text
- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 18

````json
{
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-33",
  "unitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
  "shownTextDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293"
}
````

````text
Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 19

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-33",
  "unitDigest": "c109f65eaf9a8cb77f4761aef1eba002abddd31f4577d6d1eb3c4319ff8ffe20",
  "shownTextDigest": "c109f65eaf9a8cb77f4761aef1eba002abddd31f4577d6d1eb3c4319ff8ffe20"
}
````

````text
The ledger protects against a common failure mode: an agent later reads only the
simplified slice, mistakes it for the final intended shape, and extends the
system from that reduced form. The result is patchwork that drifts away from
the original vision.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 20

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-48",
  "unitDigest": "b4fd3392f55abbeae560ec53ebb763fdf048ff1c40e2f856e0750dc935c6fc8a",
  "shownTextDigest": "b4fd3392f55abbeae560ec53ebb763fdf048ff1c40e2f856e0750dc935c6fc8a"
}
````

````text
Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 21

````json
{
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836",
  "shownTextDigest": "333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836"
}
````

````text
fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 22

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "64ab4802c8d34a064923c09ded3d7e4558195bb8af592cde664318e94ed46f38",
  "shownTextDigest": "64ab4802c8d34a064923c09ded3d7e4558195bb8af592cde664318e94ed46f38"
}
````

````text
One claim should have one owner. Other documents may summarize and link to that
claim, but must not fork authority.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 23

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "ed3f6a8a9333f6cbfdb1187f55a82008fc78796370ede7849c7bf3c257fc8517",
  "shownTextDigest": "ed3f6a8a9333f6cbfdb1187f55a82008fc78796370ede7849c7bf3c257fc8517"
}
````

````text
Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 24

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-65",
  "unitDigest": "96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16",
  "shownTextDigest": "96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16"
}
````

````text
`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 25

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "cd6d9c4f74d86fedc3fd1d0bc9f150fc56ba3dffbc0fc2fdec0fdeed5df29a4e",
  "shownTextDigest": "cd6d9c4f74d86fedc3fd1d0bc9f150fc56ba3dffbc0fc2fdec0fdeed5df29a4e"
}
````

````text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 26

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-76",
  "unitDigest": "def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93",
  "shownTextDigest": "def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93"
}
````

````text
- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 27

````json
{
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746",
  "shownTextDigest": "760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746"
}
````

````text
Platform laws are durable constraints. Changing a law requires superseding its decision record; do not silently edit the old rationale away.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 28

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "405df32d0d9bc4863fd36d2af33005f1a29e06a3d0710c3f5f7de1fc3e52e765",
  "shownTextDigest": "405df32d0d9bc4863fd36d2af33005f1a29e06a3d0710c3f5f7de1fc3e52e765"
}
````

````text
This document is the governance contract for maintained fgOS documentation.
It defines how docs declare authority, where they belong, and how temporary
discussion becomes canonical knowledge.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 29

````json
{
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-71",
  "unitDigest": "62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4",
  "shownTextDigest": "62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4"
}
````

````text
`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`, `acceptance` (per str73-done-flip-cos-check — Data Dictionary #24,
RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done); ghi qua `JSON.parse`, không phải `parseListFlag` của `refs`/`deps`,
vì text clause có thể chứa dấu phẩy), `priority`, `intent` (per str7-str8-priority-intent —
Data Dictionary #25/#26; `--priority` ép kiểu số nguyên không âm, `--intent` ép
kiểu số nguyên bất kỳ dấu; truyền cờ KHÔNG kèm giá trị theo sau bị chặn tường
minh — không bao giờ âm thầm biến thành số nhờ ép kiểu boolean). Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

## Truth unit 30

````json
{
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-44",
  "unitDigest": "06d281ea753e7ec1d95f50dae55193e34b538fe8195874b2d01798a080796781",
  "shownTextDigest": "06d281ea753e7ec1d95f50dae55193e34b538fe8195874b2d01798a080796781"
}
````

````text
Maintained canonical docs should use numbered section headings:
````

Reviewer: check every asserted current fact against code with exact file/blob/range evidence. Distinguish dated design/intent; record assertion and false-unit denominators.

