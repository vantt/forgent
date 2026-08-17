# DISCUSSION: Chống outdate/mâu thuẫn giữa rule, decision, doc (tsk-1lv)

## 1. Trạng thái hiện tại

Vòng 3 (2026-08-17): người dùng yêu cầu dò tiếp bee từ sau v1.18.3 (distillery
cũ) lên bản mới nhất — thật ra bee đã lên **v2.7.0** (`beegog` local clone,
`abde5ca7`, title chính "doc-rot doors — impact, routing, doc-deferral,
freshness"), tức ĐÚNG package feature mới nhất của bee giải ĐÚNG bài toán
người dùng đang hỏi, không phải một release phụ. Đã đọc trực tiếp
`docs/knowledge/areas/decision-memory/overview.md` + `workflow-state/gates.md`
của bee (nguồn thật, không phải distillery cũ). Phát hiện quan trọng nhất:
bee có quyết định tường minh **R9 "No stored graph, no daemon"** — SỬA lại
khuyến nghị graph ở vòng 2 (xem §5 round 3). Còn 2 câu hỏi treo từ vòng 2
(a/b) — nay có thêm dữ liệu để trả lời phần (a).

Vòng 2 (2026-08-17): người dùng đã trả lời vòng 1 — (1) muốn năng lực CHUNG
cho mọi project dùng fgOS (không chỉ dogfood nội bộ); (2) đồng ý hướng ghép
2 lớp (drift-check rẻ + LLM-compile đắt); và nêu câu hỏi mới: có nên đưa về
một hệ graph để dễ detect không, kèm yêu cầu rescan bee (workshop gốc,
`upstreams/bee/`) xem họ đã giải bài này thế nào. Đã rescan xong — bee CÓ
đúng câu trả lời gần nhất cho câu hỏi graph: từ v1.18.3, bee đã tự thay
`docs/specs/` (prose tay) bằng `docs/knowledge/areas/<area>/` — một "queryable
concept graph" thật, với cơ chế chống-fork 3 lớp và index regenerate như pure
function. Chưa D-ID nào chốt (2 điểm vòng 1 mới trả lời 1 round, theo D4 phải
giữ ổn định thêm ít nhất 1 round nữa mới mint D-ID) — trình bày phân tích bee
+ khuyến nghị graph trước khi hỏi tiếp.

## 2. Mục tiêu & đề bài

Người dùng (chủ fgOS) quan sát một vấn đề vận hành thật: rule/decision/doc
trong repo này sinh ra quá nhiều, decision này supersede decision kia, doc
này lẽ ra phải được viết lại theo quyết định mới nhất nhưng không ai cập nhật
— và hệ quả cụ thể đã xảy ra: một agent làm việc quét ra quyết định CŨ (dù
quyết định mới đã tồn tại), hoặc dùng một tài liệu đã outdate làm kim chỉ nam
trong khi thiết kế thật đã đổi. Yêu cầu: (1) research xem thế giới đã có giải
pháp sẵn cho lớp vấn đề "tổng hợp một tập luật/quyết định rời rạc, có
supersede lẫn nhau, thành MỘT ảnh cuối cùng đúng-nhất-hiện-tại cho agent dùng"
chưa; (2) chỉ sau đó mới bàn có nên tự xây, xây gì, xây ở tầng nào.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Vấn đề có thật, đã xảy ra trong repo này (STR72, 2026-07-21: mọi phiên đọc STR64 là bee-tooling dù đã chốt fgOS, vì source artifact không đồng bộ ngược khi decision supersede) | rõ | Bằng chứng thật, không phải giả định — xem §5 round 1 |
| 2 | fgOS đã có sẵn 3 mảnh cơ chế liên quan (event-log decision, citation-drift check hẹp, §6-regeneration pattern) nhưng KHÔNG mảnh nào tổng quát hoá cho toàn bộ docs/specs + AGENTS.md/CLAUDE.md | rõ | Xem §5 round 1 |
| 3 | Thế giới bên ngoài đã "giải" bài toán này chưa, ở mức tổng quát (không riêng ADR)? | rõ — CHƯA có giải pháp đóng gói sẵn, chỉ có 3 hướng tiếp cận rời rạc | Xem §5 round 1 — ADR community 2026 tự nhận đây là "emerging tension", chưa có tool chuẩn |
| 4 | Phạm vi mong muốn: chỉ dogfood cho fgOS tự quản trị docs của chính nó, hay là năng lực chung mọi project dùng fgOS cũng được hưởng? | người dùng trả lời vòng 1: **năng lực chung** — chưa mint D-ID (mới 1 round, chờ ổn định thêm theo D4) | Ảnh hưởng lớn tới thiết kế — AGENTS.md ưu tiên "Ship Faster" đo bằng tốc độ project DÙNG fgOS, không phải tốc độ tự thân team fgOS |
| 5 | Cơ chế ưu tiên: mở rộng deterministic drift-check (rẻ, chỉ bắt được citation tường minh) hay thêm tầng LLM-assisted "compile lại" kiểu §6 (đắt hơn, bắt được staleness ngầm không trích id) hay cả hai theo lớp? | người dùng trả lời vòng 1: **đồng ý ghép 2 lớp** — chưa mint D-ID (chờ ổn định thêm) | Bee (xem round 2) đã tự đi xa hơn: không chỉ 2 lớp check, mà thay hẳn tầng lưu trữ prose bằng concept-graph |
| 6 | Điểm chặn (gate) đặt ở đâu: CI/pre-commit cứng, hay advisory lúc agent sắp dùng một doc (giống GitNexus impact-check theo AGENTS.md hiện tại), hay cả hai? | CHƯA RÕ | Liên hệ "Release con người" — không nên biến mọi doc-edit thành một cổng chờ người |
| 7 | Có nên đưa decision/doc governance về MỘT hệ graph để dễ detect (câu hỏi mới của người dùng)? | **rõ, ĐÃ SỬA sau round 3**: bee tự trả lời KHÔNG — quyết định tường minh R9 "No stored graph, no daemon" ("a second source of truth is exactly the failure mode this area exists to kill"). Kể cả anti-fork gate cũng không dùng stored graph, chỉ scan-tại-thời-điểm-ghi. Cơ chế thật của bee: sweep tươi mỗi lần (docs/** quét lại từ đầu mỗi close, không cache) + derived index regenerate-được-check-drift + 4 "door" chặn cứng lúc đóng feature | Xem §5 round 3 — thay khuyến nghị round 2 |

## 4. Quyết định đã chốt

(chưa có — vòng 1, chưa điểm nào giữ ổn định qua >1 round)

## 5. Q&A log

### Round 1 — 2026-08-17T04:46Z — scouting + research trình bày

**Nội bộ (scout thật, không suy đoán):**

- `docs/decisions/*.md`: đã là một event-log append-only đúng nghĩa — mỗi
  bản ghi có frontmatter OKF-style, và một quyết định supersede quyết định
  cũ thì KHÔNG sửa đè, chỉ trỏ tới. Đây chính là "nguồn sự thật" (write
  model) mà bài toán cần.
- `scripts/check-decision-citation-drift.mjs` (spec:
  `docs/specs/decision-citation-drift.md`, sinh từ STR72): quét
  `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một decision-id
  ĐÃ bị supersede mà không kèm id thay thế trên cùng dòng. Đây là bước đầu
  fgOS đã tự xây cho ĐÚNG lớp vấn đề người dùng vừa nêu — nhưng có 2 giới
  hạn cứng theo spec: (a) chỉ bắt citation TƯỜNG MINH (viết `ADR0002` hay số
  4-chữ-số khớp id thật) — một đoạn văn xuôi mô tả lại thiết kế cũ mà không
  trích id nào thì lọt qua hoàn toàn; (b) "Open Gaps" tự ghi rõ: KHÔNG wired
  vào CI/npm script/gate nào — phải chạy tay, nên drift có thể tồn tại vô
  thời hạn giữa hai lần chạy tay.
- STR72 (backlog dòng 114, đã `done`) chính là bằng chứng gốc: root cause
  đào ra 2026-07-21 là "khi một quyết định supersede, thay đổi rơi vào
  decision-log nhưng không lan về artifact nguồn (ticket/backlog/spec) đã
  gieo quyết định gốc" — nói cách khác, đúng hiện tượng người dùng vừa mô tả
  đã từng xảy ra thật trong chính repo này, không phải giả định.
- `fgos-coding-shaping` (skill đang chạy discussion này) đã tự áp một kỷ luật
  hẹp cho ĐÚNG lớp vấn đề này, nhưng chỉ trong phạm vi MỘT feature: §6
  "Thiết kế đã chốt" của `DISCUSSION.md` **regenerate toàn bộ mỗi khi decision
  đổi hình dạng thiết kế — không bao giờ append/patch từng mảnh**. Đây chính
  là mô hình "projection rebuild from event log" áp cho văn xuôi, nhưng hiện
  chỉ tồn tại ở quy mô một file `DISCUSSION.md`/feature, chưa tổng quát hoá
  lên `docs/specs/*.md`, `docs/platform-foundations.md`, hay `AGENTS.md`.
- `CLAUDE.md` (project root, mục "Changing a locked law"): đã tự đặt luật
  "Laws … fixed until threshold hit. Changing one supersedes its decision
  ID — never edit in place" — cùng kỷ luật supersede-not-overwrite, đã có ở
  tầng platform-foundations rồi, không cần phát minh lại.
- `docs/specs/reading-map.md`: bản thân file này CHÍNH LÀ một "bản đồ trỏ
  tới sự thật hiện tại" — nhưng nó là văn xuôi tay-viết, không có cơ chế nào
  xác nhận nó còn khớp quyết định mới nhất; nó có thể tự rơi vào đúng bẫy mà
  người dùng mô tả (outdate mà vẫn được dùng làm kim chỉ nam).
- Kiến trúc state layer của chính fgOS (`.fgos/events.jsonl` = nguồn sự
  thật, `.fgos/state.json` = view fold lại, không bao giờ sửa tay) là một
  ví dụ event-sourcing/CQRS SỐNG, đang chạy thật trong repo — cùng mô hình
  mà research external bên dưới xác nhận là hướng tiếp cận chuẩn cho đúng
  lớp bài toán "nhiều bản ghi rời rạc, một số supersede nhau, cần một ảnh
  hiện tại đáng tin".

**External research (WebSearch, 2026-08-17):**

1. **ADR community tự nhận đây là "emerging 2026 tension", chưa có tool
   chuẩn giải trọn**: ADR gốc (Nygard format, adr.github.io) chủ trương
   "supersede, don't overwrite" — đúng hướng fgOS đang làm — nhưng search
   xác nhận rõ: "the running system … changes orders of magnitude faster
   than the ADR corpus … a static document has no way to know whether the
   decision it captured remains consistent" — và 2026 thêm biến số mới: AI
   agent giờ trực tiếp đọc corpus này để hành động, nên độ lệch không còn
   chỉ ảnh hưởng người đọc mà ảnh hưởng hành vi agent thật.
   (adr.github.io, martinfowler.com/bliki/ArchitectureDecisionRecord.html)
2. **Log4brains/adr-tools**: publish ADR thành static site có xem được
   supersede-chain, nhưng KHÔNG tự động regenerate tài liệu hướng-dẫn
   downstream (spec/README/AGENTS.md) từ corpus quyết định — dừng ở
   "browse decision log đẹp hơn", không giải bài "đồng bộ ngược" mà STR72
   đã đào ra là gốc vấn đề. (npmjs.com/package/log4brains)
3. **Policy-as-code / rules engine** (OPA-style): hướng khác hẳn — thay vì
   viết luật lặp lại trong nhiều doc rồi hy vọng đồng bộ tay, đưa luật vào
   MỘT lớp khai báo, version-controlled, được TRUY VẤN SỐNG tại điểm thực
   thi, thay vì LLM phải tự diễn giải lại từ prose (có thể đã cũ) mỗi lần.
   Về bản chất: "đừng nhân bản sự thật vào nhiều doc — trỏ về một nguồn,
   query lúc cần" — đúng hướng `AGENTS.md`'s "Impact-analysis capability
   gate" đã làm cho GitNexus (query `fgos tool query --capability` thay vì
   giả định), chỉ là chưa áp cho lớp decision/rule.
4. **Event sourcing/CQRS "projection rebuild"**: xác nhận trực tiếp mô hình
   fgOS đã tự dùng cho state layer — "events are the single source of
   truth … projections can be rebuilt from the raw events at any time …
   read-side schema evolution safe and routine". Đây là mô tả chính xác cho
   những gì §6 của `DISCUSSION.md` đã làm ở quy mô nhỏ.
5. **AGENTS.md/CLAUDE.md "context rot" là vấn đề được đặt tên rộng rãi
   trong chính giới AI-coding-agent năm 2026**: "Configuration files rot
   just like any other documentation. Stale structural references actively
   mislead." Và một phát hiện đáng chú ý: nghiên cứu ConInstruct (AAAI 2026)
   đo Claude 4.5 Sonnet phát hiện được conflict trong instructions ở mức
   87.3% F1 — NHƯNG "even when models spotted the contradiction, they
   almost never flagged it to the user — they just silently picked one
   interpretation and kept going." Nói cách khác: agent CÓ khả năng nhận ra
   mâu thuẫn, nhưng mặc định im lặng chọn một hướng thay vì báo — đúng cơ
   chế lỗi người dùng vừa mô tả ("agent lại quét và dùng quyết định cũ").
   (augmentcode.com/blog/your-agents-context-is-a-junk-drawer,
   infoworld.com/article/4187057)

**Tổng hợp — chưa có sản phẩm đóng gói sẵn cho đúng bài toán này.** Có 3
mảng rời rạc thế giới đã giải riêng lẻ (ADR supersede discipline, policy-as-
code single-source query, event-sourcing projection-rebuild) nhưng chưa ai
ghép cả 3 lại thành một hệ "compile corpus quyết định → một ảnh văn xuôi
hiện tại, tự phát hiện + tự làm mới khi lệch" dành riêng cho ngữ cảnh coding
agent đọc doc để hành động. fgOS may mắn đã có sẵn cả 3 viên gạch (event-log
decisions, citation-drift checker, §6-regeneration pattern) — vấn đề là
CHƯA GHÉP LẠI VÀ CHƯA TỔNG QUÁT HOÁ, không phải thiếu từ đầu.

**Câu hỏi mở cho người dùng (2 điểm ở §3, #4 và #5):**

Anh muốn bàn tiếp theo hướng nào trước — (a) phạm vi: đây là việc fgOS tự
dọn nhà cho chính nó (docs/specs, AGENTS.md, platform-foundations.md của
repo forgentX), hay muốn thiết kế thành một năng lực fgOS cấp cho MỌI
project đang dùng fgOS (một verb/skill chung, không riêng gì repo này)? Hay
(b) cơ chế: em nghiêng về hướng ghép 2 lớp — lớp rẻ (mở rộng
`check-decision-citation-drift` để bắt cả staleness KHÔNG trích id tường
minh, chạy được ở gate/CI) cộng lớp đắt hơn (LLM-assisted "compile" kiểu §6,
chỉ chạy khi lớp rẻ báo nghi ngờ hoặc theo lịch, để không biến mọi edit nhỏ
thành một cổng chờ người) — anh thấy hướng ghép 2 lớp này có đúng hay có
hướng khác anh đang nghĩ tới?

### Round 2 — 2026-08-17T05:05Z — rescan bee upstream + câu hỏi graph

**Người dùng trả lời vòng 1:** (1) năng lực chung cho mọi project dùng fgOS;
(2) đồng ý ghép 2 lớp; (3) hỏi thêm: có nên đưa về một hệ graph để dễ detect,
và yêu cầu rescan bee upstream trước.

**Scout bee thật** (đã có sẵn distillery: `docs/distillery/sources/bee.md`,
re-extract 2026-07-28 tại bee v1.18.3, cộng grep trực tiếp
`~/.codex/skills/bee-{scribing,grooming,evolving}/SKILL.md` — không suy đoán):

1. **`knowledge-bundle-state-layer`** (v1.18.3, thay đổi lớn nhất liên quan
   trực tiếp câu hỏi) — bee đã tự thay `docs/specs/` (prose tay-viết, đúng
   lớp file mà fgOS repo này cũng đang dùng) bằng
   `docs/knowledge/areas/<area>/`: một **"queryable concept graph"** thật,
   gate bởi `bundleMode(root)` (true chỉ khi có dir VÀ ≥1 concept parse
   được — "một thư mục không tự nhiên là bundle"). Reading order khi có
   bundle: `bundle → decisions → history`; `docs/specs/` cũ trở thành
   **read-only compat surface** — một fence script CHẶN mọi prose mới ghi
   vào đó, chỉ còn resolve các citation cũ qua pointer stub. Đây chính là
   câu trả lời trực tiếp nhất cho câu hỏi "có nên graph hoá" — bee đã làm,
   và làm đúng nghĩa graph (concept nodes + ownership + cross-ref), không
   chỉ ẩn dụ.
2. **`anti-fork-gate-three-layer`** — cơ chế graph-integrity thật: một
   subject đã có concept sở hữu (`bee.authoritative_for`) KHÔNG BAO GIỜ bị
   concept thứ hai claim lại — check toàn-bundle, không chỉ trong 1 area.
   3 lớp: (a) so khớp "khung xương" chữ (NFKC + lowercase + bỏ dấu + fold
   ký tự giả-giống + gộp dấu câu) chặn tên gần-giống; (b) authority sai
   dạng (list/boolean/rỗng) fail-closed thay vì bị lờ đi; (c)
   `bee knowledge check` quét toàn-bundle bắt trùng-nghĩa-diễn-đạt-khác
   ("refunds and reversals" vs "reversals and refunds") — lớp (a) một mình
   không bắt được. Đây trực tiếp là cơ chế "detect" người dùng hỏi tới.
3. **`structured-decision-recall-surface`** — decision recall đi qua filter
   có cấu trúc (`decisions search --tag/--scope/--text`) cộng
   `docs/decisions/index.md` theo area, tuyên bố thẳng: **"bare substring
   grep is the fallback, never the recall path."** Đây là câu trả lời cho
   đúng triệu chứng gốc người dùng nêu ("agent quét ra quyết định cũ") —
   bee không sửa bằng cách dọn dẹp doc tay, mà đổi hẳn CÁCH TRUY XUẤT sang
   index có cấu trúc thay vì grep tự do.
4. **`scribingTarget()`** — một hàm DUY NHẤT trả lời "write này đi đâu",
   trả về path thật hoặc một trong hai typed refusal
   (`fork_denied` kèm tên chủ hiện tại, `subject_required`) — "`path: null`
   là một refusal, refusal không bao giờ là giấy phép tự chọn đường khác."
   Đây là NGĂN CHẶN nhân bản sự thật NGAY TỪ LÚC GHI, không phải dọn dẹp
   sau khi đã nhân bản — mạnh hơn hẳn một checker chạy sau.
5. **`bootstrap-vs-harvest-distinction`** — ở bundle-mode, index của bundle
   là **pure function, regenerate qua `bee.mjs knowledge index`, không bao
   giờ hand-edit** — đúng khớp giả thuyết CQRS/projection-rebuild đã nêu ở
   round 1, bee đã thật sự triển khai nó cho lớp doc/concept, không chỉ
   cho state layer.
6. **`bee-grooming`**'s entropy score đếm thẳng "stale decisions ×5",
   "stale specs ×5", và liệt kê riêng "superseded-but-still-cited
   decisions" là một hạng mục hunt — một sweep định kỳ, không chặn cứng,
   đúng tinh thần "Release con người" (không biến mọi edit thành cổng chờ).
7. **`one-area-one-file-forever`** + **`tech-agnostic-rebuild-bar`** — kỷ
   luật hình dạng nội dung giảm bề mặt outdate: một area đúng một file mãi
   mãi (không `-v2`), và spec phải viết tech-agnostic (đổi framework/lib
   không làm spec sai) — giảm tần suất chính spec đó cần sửa theo quyết
   định implementation.

**Đối chiếu với GitNexus (đã sống sẵn trong repo này, khác bee):** bee không
có sẵn công cụ graph nào nên phải tự xây `docs/knowledge/` từ đầu. fgOS thì
CÓ SẴN GitNexus — một knowledge graph thật đang chạy (17220 symbols, 23895
relationships) — nhưng scan `gitnexus-guide/SKILL.md` không thấy tài liệu
nào về ingest node ngoài-code (decision/doc) vào graph đó; GitNexus theo mọi
tài liệu đang có là graph CODE (symbol/relationship từ static analysis), chưa
rõ có mở được cho node kiểu "Decision"/"Doc"/"Concept" hay không mà không lai
tạp với graph code. Đây là một fork thiết kế thật, chưa suy đoán:

- **(A) Graph mới kiểu bee** — tự xây `docs/knowledge/areas/` hoặc tương
  đương, độc lập GitNexus. An toàn, đã có tiền lệ chạy thật ở bee, nhưng là
  xây lại một cơ chế đã tồn tại dạng khác trong cùng hệ sinh thái công cụ
  của người dùng.
- **(B) Tận dụng GitNexus** — thêm node-kind Decision/Doc vào graph GitNexus
  đã có, để một truy vấn kiểu `impact({target: "0027"})` trả ra mọi
  spec/backlog-row/AGENTS.md-block đang cite quyết định đó. Rẻ hơn nếu
  GitNexus thực sự mở được cho non-code node — nhưng CHƯA XÁC NHẬN được khả
  năng này, cần hỏi thẳng GitNexus hoặc đọc source, không nên giả định.
- **(C) Không cần graph riêng** — chỉ cần structured index (`decisions
  search --tag/--scope`, không nhất thiết phải là graph) là đã đủ giải
  đúng triệu chứng "agent grep ra quyết định cũ" (điểm 3 ở trên) — graph
  chỉ thật sự cần cho bài fork/duplicate-detection (điểm 2), không phải
  cho bài "tìm quyết định mới nhất".

**Khuyến nghị của em:** graph ĐÁNG làm cho đúng MỘT bài toán cụ thể — chống
duplicate-authority/fork giữa các doc/decision đang mô tả cùng một chủ đề
(giống anti-fork-gate của bee) — vì đây là bài toán quan hệ nhiều-nhiều thật
sự khó giải bằng danh sách phẳng. Nhưng phần "agent dùng quyết định cũ"
(triệu chứng gốc anh nêu) có thể giải RẺ HƠN chỉ bằng structured
recall-surface (mục 3) mà không cần graph — bee tự tách 2 cơ chế này ra
làm hai thứ khác nhau (structured recall vs. anti-fork gate), không gộp làm
một. Trước khi quyết (A) hay (B), cần xác nhận thật GitNexus có mở được cho
non-code node không — chưa nên giả định.

**Câu hỏi cho người dùng:** (a) đồng ý tách graph riêng cho fork/duplicate-
detection khỏi structured-recall cho "tìm bản mới nhất" (2 cơ chế khác
nhau, giống bee), hay anh muốn gộp làm một hệ thống? (b) nếu chọn hướng
graph, muốn em xác nhận khả năng non-code node của GitNexus trước khi quyết
(A) tự xây kiểu bee hay (B) tận dụng GitNexus?

### Round 3 — 2026-08-17T09:15Z — bee v2.7.0 (nguồn thật, không phải distillery cũ)

**Nguồn**: `/home/vantt/projects/beegog` (bee source repo thật, local clone,
KHÁC `docs/distillery/sources/bee.md` — file đó dừng ở v1.18.3 2026-07-28).
`git log` xác nhận HEAD = `abde5ca7`, tag `v2.7.0`, commit message tự đặt
tên chính xác: **"doc-rot doors — impact, routing, doc-deferral, freshness"**
— tức đây KHÔNG phải một release phụ, mà là gói tính năng MỚI NHẤT của bee
giải ĐÚNG bài toán người dùng đang hỏi (feature `knowledge-distill-trigger` +
`doc-impact-synthesis`, đóng 2026-08-05 → 2026-08-16). Đọc trực tiếp
`docs/knowledge/areas/decision-memory/overview.md` +
`docs/knowledge/areas/workflow-state/gates.md`.

**Sửa lại câu trả lời graph ở round 2:** bee có quyết định tường minh
**R9 — "No stored graph, no daemon"**: *"All consistency is derived at
read/mutation time; a second source of truth is exactly the failure mode
this area exists to kill."* Ngay cả anti-fork gate (round 2 đã nêu) cũng
KHÔNG dùng stored graph — chỉ là scan `docs/**`/bundle tại thời điểm ghi.
Khuyến nghị "graph đáng làm cho fork-detection" ở round 2 — SAI theo bằng
chứng mới, rút lại.

**Cơ chế thật bee dùng (không graph, không daemon):**

1. **Sweep tươi mỗi lần, không cache/không graph** — một `supersede` tính
   citation sweep qua TOÀN BỘ `docs/**` (khớp full-id + word-boundary
   short8) NGAY TRƯỚC KHI append event; mỗi hit phải reconcile cùng-lượt
   hoặc waive tường minh kèm lý do ghi log; hit chưa reconcile tự tạo một
   "capture stub" nên nó **tái xuất hiện ở mọi lần flush sau** — không thể
   âm thầm biến mất. `decisions log --relation touches:<id>` chạy CÙNG
   sweep này ở thời điểm log thường (không chỉ lúc supersede) — loại trừ
   hợp lý: file index tự-sinh, và thư mục history của chính feature đang
   sống (tự-trích-dẫn không tính là stale).
2. **Mọi write BẮT BUỘC khai quan hệ — không còn chỗ trốn trong prose**
   (R2a): `decisions log` đòi `--relation supersedes:<id>|touches:<id>|none`
   — thiếu hoặc sai dạng bị REFUSE thẳng, kèm gợi ý tới 3 candidate cùng
   scope/tag để sửa ngay. Văn bản decision ĐỌC NHƯ một tuyên bố supersede
   (chứa "supersedes/replaces/overrides/no longer applies/instead of the
   previous") mà không khai `--relation supersedes:` bị REFUSE — số liệu
   thật họ tự audit ra: **70 decide event từng giấu supersession trong
   prose kiểu này so với chỉ 29 supersede event khai đúng** trước khi có
   guard này. Đây CHÍNH XÁC là root cause STR72 mà fgOS từng đào (decision
   đổi framing nhưng chỉ "narrated in prose", máy không thấy) — bee đã đóng
   lỗ này ở tầng CHẶN-GHI, không phải dọn dẹp sau.
3. **Prose "để sau" cũng bị chặn tương tự** — văn bản đọc như trì hoãn
   ("we'll handle this later"...) bị refuse trừ khi trỏ `--trigger <id>` đã
   đăng ký (`bee triggers add --decision <id> --condition "..."` trước).
   Trigger 2 tầng: predicate (`path-exists:`/`path-missing:`, tự
   re-evaluate mỗi lần đọc registry, tự lật `waiting → due`) và manual
   (không bao giờ tự bắn, chờ người xác nhận). Cùng guard này còn áp cho
   PROSE TRONG DOC của feature đang đóng, không chỉ decision text
   (doc-impact-synthesis D3) — "để tính sau" ghi trong spec cũng phải trỏ
   trigger, không được lửng lơ.
4. **Index là projection thật, regenerate-được, có --check drift mode**
   (R5): `docs/decisions/index.md` — never hand-edited, complete by
   construction, byte-stable cho cùng một store, search qua filter có cấu
   trúc (`--tag/--scope/--since/--untagged/--all`), "bare substring grep is
   fallback, never the recall path" — khớp đúng khuyến nghị round 2 (mục
   3), bee đã làm y hệt, không đổi.
5. **4 "door" chặn cứng lúc ĐÓNG feature** (workflow-state/gates.md) — đây
   là điểm MỚI NHẤT, mạnh nhất, chưa từng nêu ở round 1/2:
   - **knowledge-freshness door**: chặn close nếu `bee knowledge check` báo
     `dangling_source`/`dangling_required_context` bên trong area feature
     này ĐÃ ĐỘNG TỚI — feature khác không bị vạ lây.
   - **impact door**: chặn close nếu còn doc nào trong `docs/**` vẫn cite
     một decision CỦA CHÍNH feature đang đóng mà chưa reconcile — sweep lại
     TỪ ĐẦU mỗi lần close (không cache), nên một doc vừa sửa xong tự động
     hết bị chặn ở lần chạy kế.
   - **routing door**: chặn close nếu một D-ID đã khoá trong CONTEXT.md của
     feature KHÔNG có citation nào trong area-spec thật và cũng không có
     record cục bộ — tức bắt đúng lỗi "quyết định khoá rồi nhưng chưa bao
     giờ lan vào spec sống" (đúng gốc rễ STR72).
   - **doc-deferral door**: chặn close nếu prose kiểu "để sau" trong doc đã
     đổi của feature không trỏ trigger nào.
   - Mỗi door đều có escape hatch TƯỜNG MINH, có log — không bao giờ âm
     thầm bypass: `knowledge-freshness-deferral` / `impact-deferral` /
     `routing-deferral` / `doc-deferral`, mỗi cái phải NÊU TÊN feature.

**Ý nghĩa cho fgOS:** đây không còn là gợi ý kiến trúc trừu tượng — bee đã
CHẠY THẬT 4 door này trong production của chính họ (2026-08-05→08-16, nhiều
cell/commit thật). Với fgOS, phần tương ứng gần nhất là điểm chuyển
`awaiting-approval → done` (hoặc `fgos approve`) — đó là nơi tự nhiên để đặt
một "freshness door" tương tự: chặn approve nếu (a) quyết định feature này
log ra còn bị doc nào cite mà chưa reconcile, (b) D-ID khoá trong CONTEXT.md
không có citation nào trong spec sống. Không cần graph, không cần daemon —
chỉ cần sweep tại đúng 2 thời điểm (log-time cho việc khai quan hệ, close/
approve-time cho việc chặn) và một index projection có thể `--check`.

**Câu hỏi cho người dùng (thay câu hỏi (b) ở round 2 — graph không còn là
lựa chọn theo bằng chứng mới):** anh có muốn khoanh scope thiết kế theo đúng
4-door model của bee (freshness/impact/routing/doc-deferral, gắn vào
`fgos approve` thay vì một CI job riêng), hay anh thấy fgOS cần một hình dạng
khác? Và với câu hỏi phạm vi đã chốt tạm ở round 1 (năng lực chung mọi
project dùng fgOS) — model 4-door này gắn ở "approve" verb vốn đã là verb
lõi mọi project dùng fgOS đều đi qua, nên tự nhiên khớp — anh xác nhận đúng
hướng này chứ?

## 6. Thiết kế đã chốt

(chưa có — chưa điểm nào đủ ổn định để tổng hợp thành thiết kế)

## 7. Danh mục hạng mục / task

(chưa có — quá sớm để tách task khi thiết kế chưa hình thành)
