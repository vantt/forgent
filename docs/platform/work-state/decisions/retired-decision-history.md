# Retired Decision History: Work State

```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
```

## 1. Provenance Of Retired Decisions

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.

## 2. ADR 0002 Flat Work Model

> **Một phần đã supersede bởi [0012](#8-adr-0012-unified-typed-edge-graph-model):**
> "deps và parent tách rời có chủ đích" nay đọc là "tách rời về lưu trữ và ngữ
> nghĩa, nhưng hợp nhất thành một đồ thị typed-edge derive". Phần còn lại của
> record này (mô hình việc phẳng, một FSM, "epic" là item thường) vẫn hiện hành.

### 0002 Context

forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đường cho hướng
nhiều-agent chạy song song (fan-out). Cám dỗ quen thuộc là dựng cấp bậc entity
riêng: epic ⊃ story ⊃ task, mỗi cấp một schema. Cách đó nhân bội bề mặt trạng thái
và khoá độ mịn công việc vào schema.

### 0002 Decision

- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps** vào nhau.
- **"Epic" chỉ là một item thường** được các item khác trỏ deps tới — không phải một
  cấp entity riêng.
- Vòng đời cấp-câu-chuyện (bối cảnh, phê duyệt) là **thuộc tính/tài liệu gắn vào
  item**, không phải entity mới.
- **Frontier sẵn-sàng** = tập mọi item có toàn bộ deps đã xong, **derive toàn cục**
  từ trạng thái — không phải danh sách duy trì bằng tay.

### 0002 Consequences

- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việc làm-được-ngay
  bất kể chúng thuộc "epic" nào.
- **Việc-kế-tiếp là một truy vấn derive,** không phải danh sách người ta cập nhật tay
  — đúng tiêu chí "agent lạ tự tìm việc kế tiếp từ state".
- **Độ mịn item là kỷ luật planning, không phải tính chất schema:** muốn nhỏ hơn thì
  tách item + deps, không cần thêm loại entity.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 3. ADR 0003 Naming And Data Layout

### 0003 Context

Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước khi viết
code, để mọi area sau này nhất quán và để ranh giới truth/view hiện ra ngay trong
layout.

### 0003 Decision

- **CLI = `fgos`** (cửa lệnh của sản phẩm).
- **Entity đơn vị việc = `work`.**
- **Data dir = `.fgos/`**, trong đó:
  - `events.jsonl` — **committed vào git = sự thật** (per 0001).
  - `state.json` — **bản chiếu, gitignored** (dựng lại được từ replay, không phải
    sự thật).

### 0003 Consequences

- **Brand nhất quán** giữa CLI, tài liệu và data dir.
- **Ranh giới truth/view hiện ngay trong layout:** một file được commit (log), một
  file bị ignore (view) — đọc `.gitignore` là thấy đâu là sự thật.
- Vị trí cụ thể của `.fgos/` (đường dẫn, tổ chức con) là quyền quyết định khi thực
  thi, miễn giữ đúng cặp truth-committed / view-ignored ở trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 4. ADR 0004 Scope And Non-Goals

### 0004 Context

Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và nó *quan hệ
thế nào* với harness (bộ công cụ điều phối) đang được dùng để phát triển chính
forgent. Không chốt hai biên này thì phạm vi trôi và dễ xây thừa.

> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness phát triển nội
> bộ của dự án. Ở đây viết thuần theo sản phẩm — "harness phát triển" — không phụ
> thuộc tên công cụ cụ thể nào.

### 0004 Decision

1. **Domain đầu tiên của lớp state là work-state của chính forgent** — việc của
   repo: item, trạng thái, quyết định. Các consumer khác (ví dụ vùng học từ nguồn
   tham chiếu) **đến sau**, không thiết kế cho chúng ở bước đầu.
2. **Non-goal — chạy song song, không thay thế, không interop:** forgent chạy **song
   song** với harness phát triển đang dùng, **không thay thế nó và không interop**.
   Việc thay thế harness chỉ được **mở lại khi forgent chạm ngưỡng-có-tên**: một agent
   lạ tự tìm được việc kế tiếp từ chính state của forgent.

### 0004 Consequences

- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối nặng; tập trung
  chứng minh work-state tự-quản trước.
- **Ngưỡng mở-lại rõ ràng, không trôi:** "thay harness" là một quyết định có điều
  kiện đặt tên trước, không phải thứ lén mở rộng dọc đường.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 5. ADR 0006 Proposed Status

### 0006 Context

Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều đó mở ba lỗ:

1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A mới chỉ đề
   xuất, chưa nhận vào cây chính).
2. Khi kết quả bị **từ chối**, không có lối ra rõ ràng cho item.
3. Trạng thái **chờ-duyệt** không nhìn thấy được trong FSM.

### 0006 Decision

Thêm trạng thái **`proposed`** vào FSM, với các cạnh:

- `doing → proposed` — goal-check pass, runner ghi `proposed`.
- `proposed → done` — được duyệt/merge.
- `proposed → todo` — **từ chối:** event mang lý do, item quay lại frontier;
  anti-loop max-visits chặn lặp vô hạn.
- `blocked` giữ nguyên hai chiều với `todo`/`doing` (muốn "park" thì dùng
  `todo → blocked` sẵn có).

- **`done` vẫn là trạng thái terminal**, và từ nay nghĩa là **"đã nhận vào cây
  chính"** (không chỉ "worker báo xong").
- **Frontier chỉ mở việc phụ thuộc khi dep thật sự `done`** — nên B không bao giờ
  chạy trên nền thiếu code A.

### 0006 Consequences

- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây chính.
- **Chờ-duyệt hiện rõ:** `proposed` là trạng thái nhìn thấy được, không phải giai
  đoạn ẩn.
- **Từ chối có lối ra sạch:** item về `todo` kèm lý do, được anti-loop bảo vệ.
- Record này **supersede** tập trạng thái FSM của Phase 1; spec work-state phản ánh
  tập trạng thái mới.

- Record này supersede **Tập trạng thái FSM của Phase 1 (spec work-state cập nhật khi đóng feature)**.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 6. ADR 0007 Schema And Event Evolution

### 0007 Context

Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ liệu** ghi trên
một nhật ký đã committed vào git (0001). Log cũ (viết dưới code cũ) phải tiếp tục
đọc được dưới code mới, nếu không nguyên lý "log là sự thật dựng-lại-được" sụp.

### 0007 Decision

Ba luật cho mọi tiến hoá schema/event từ đây về sau:

1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration ghi đè event
   cũ. Sự thật chỉ được thêm, không viết lại.
2. **Replay backward-compatible, CÓ TEST.** Item/event thiếu trường mới nhận
   **default khai báo tường minh**. Cụ thể: log của phiên bản trước phải replay được
   dưới code phiên bản sau — và điều này được một test bảo vệ, không phải giả định.
3. **Mỗi event mang trường schema version** (từ khi luật này có hiệu lực), để code
   đọc biết mình đang replay shape nào.

### 0007 Consequences

- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì thêm event
  mới, không sửa event cũ.
- **Test replay là phòng tuyến:** hồi quy tương thích ngược bị bắt bằng test, không
  bằng may rủi.
- **Chi phí:** phải khai default tường minh cho trường mới và duy trì test replay
  xuyên phiên bản — đổi lại là log không bao giờ "mục".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 7. ADR 0011 Explicit Version For Every Contract

### 0011 Context

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

### 0011 Decision

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

### 0011 Consequences

- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,
  +artifact), không đổi luật event đã có.
- **Artifact fgOS tương lai (report, plan, spec) theo đúng mẫu bee đã dùng
  sống**: `contract: <ten>/v<N>` — không cần phát minh lại quy ước, port
  nguyên cái đã chứng minh trong workshop.
- **Chi phí:** mỗi artifact/schema type mới phải chọn tên contract + version
  ngay từ v1, không hoãn "để sau".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 8. ADR 0012 Unified Typed-Edge Graph Model

### 0012 Context

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

### 0012 Decision

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
  1. **RUL11 (tiến hóa schema)** (log bất khả xâm phạm, `work-state.md:703`): một trường
     `edges[]` lưu trữ mới sẽ đòi migration cho mọi event cũ; một
     read-projection thuần Domain thì không.
  2. **Học thuyết DT2 "add-through-không-alongside"**: mở rộng cửa ghi hiện
     có (`assertNoCycle` cộng thêm `assertNoUnifiedCycle`, cùng một cửa)
     thay vì mở một đường ghi song song.
  3. **~10 consumer đọc trực tiếp `.deps`/`.parent`** (frontier, impact,
     `validateDeps`, v.v.) — giữ nguyên, không cần migrate.
- Vì thuần dẫn xuất: **không có trường lưu trữ mới; tại thời điểm quyết định
  này, SCHEMA_VERSION vẫn ở 2** (nay đã lên 3, per str46-io-contract),
  mọi event cũ replay y hệt (RUL11 (tiến hóa schema)).

### 0012 Consequences

- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record 0012,
  hàng component §6 (`dep-graph.mjs`) và hàng contract **C2** đều cập nhật để
  phản ánh bảo đảm phi-chu-trình đã mở rộng sang đồ thị hợp nhất.
- `waits-for`/`discovered-from` vẫn chỉ là từ vựng khai báo — không producer,
  không dạng lưu trữ — cho tới S2b (dạng lưu trữ thật; chỗ dành SCHEMA_VERSION
  cho S2b dời sang 4 vì STR46 đã lấy 3 trước, per str46-io-contract — có
  producer, và quyết định riêng cho tính chất load-bearing/chặn hay không của
  `waits-for`).

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 9. ADR 0013 Report-Not-Write Channel For Discovered-From

### 0013 Context

work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage phi-chặn
ghi lại "việc này lộ ra trong lúc làm việc kia". Trường đã có hai nhà sản xuất:
(A) cờ tường minh `fgos add/submit --discovered-from <id>` (người/agent gọi tay,
cell wgi-7); (B) **tự động từ runner** — khi một worker đang chạy một việc phát
hiện ra một đơn vị công việc mới đáng tồn tại riêng.

Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà ghi duy nhất**
trong suốt một lượt dispatch (C2). Prompt của worker cấm nó gọi `fgos` hay ghi
`.fgos/` (`dispatch.mjs`), và lượt spawn không truyền cho worker id của việc đang
chạy dưới dạng ngữ cảnh ghi được. Nếu để worker tự tạo item, ta phá vỡ
runner-một-cửa-ghi và mất luôn tính tái lập của goal-check (chỉ `verify` mới phán
việc worker làm, không phải report của nó).

### 0013 Decision

Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worker và runner,
mở rộng hợp đồng C3 (orchestrator ↔ worker) — không supersede gì:

1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kênh: worker
   CÓ THỂ phát một hay nhiều khối rào `fgos-discovered` trong output của nó
   (JSON: `title` bắt buộc; `kind`/`risk`/`description` tuỳ chọn) để nêu một việc
   mới phát hiện. Đây là dữ liệu, KHÔNG phải lệnh ghi — worker vẫn KHÔNG BAO GIỜ
   gọi `fgos` hay chạm `.fgos/`. Ràng buộc này giữ nguyên từng chữ.

2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse các khối
   `fgos-discovered` từ output đã bắt của worker **đúng một lần mỗi lượt dispatch,
   tại kết cục cuối** (không parse trong mỗi lần retry — nếu không một khối lặp
   lại sẽ đúc ra item trùng qua `generateId`). Parse phủ **cả hai** nguồn output:
   `worker.stdout` (đường thành-đề-xuất/chấm-trượt) VÀ `err.stdout` (đường
   quá-giờ/hỏng-spawn — một worker quá giờ vẫn có thể đã nêu việc).

3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không phải object
   → log rồi bỏ qua; parser KHÔNG BAO GIỜ throw, KHÔNG BAO GIỜ đổi kết cục của
   worker hay luồng điều khiển của dispatch. Một report méo không bao giờ làm
   trật một lượt dispatch.

4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(title)` +
   `classify(title)` cho tier/kind/risk (giá trị trong khối ghi đè), một `verify`
   placeholder DÙNG CHUNG (`FALLBACK_VERIFY` từ `discovery.mjs` — không nhân bản
   literal), `status: 'todo'`, `stage: 'clarify'` (để context-discovery sau đó gắn
   `verify` thật, y như một item submit), `deps: []`, `refs: []`,
   `discoveredFrom = item.id` của việc đang chạy. Mọi lần ghi đi qua
   `queue.enqueue` (cửa ghi tuần-tự-hoá), không bao giờ `addWork` thô — an toàn
   fan-out.

### 0013 Consequences

- **Runner vẫn một-cửa-ghi.** Worker phát dữ liệu; RUNNER ghi. Không có
  đường ghi song song mới nào mở ra.
- **`discoveredFrom` là lineage phi-chặn** — loại khỏi cycle-check theo thiết kế
  (nó không phải cạnh phụ-thuộc), cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm
  đó (nay đã lên 3, per str46-io-contract) — trường lazy additive.
- **C3 mở rộng, có tên, không sửa ngầm.** architecture-map v0.3 → v0.4: hàng C3
  thêm mệnh đề kênh khám-phá; §11 changelog ghi delta. Không module mới, không
  row §6/manifest mới — `loop.mjs`/`dispatch.mjs` mở rộng tại chỗ.

### 0013 Trust Boundary

`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔNG ĐÁNG TIN — do
chính worker (một trợ lý đang chạy, có thể bị chèn lệnh từ nội dung không đáng tin nó
đọc phải) tự soạn. Item runner tạo ra từ đó vào thẳng giai đoạn `clarify`, nơi
`title`/`description` nạp vào prompt của MODEL làm-rõ — đây là mặt tiếp xúc thứ hai
(sau chính worker) nơi văn bản không đáng tin chạm tới một model sẽ sinh ra lệnh chạy
được. Chấp nhận CÓ CHỦ Ý, không phải bỏ sót: giảm nhẹ đã có từ thiết kế gốc giữ nguyên
— `verify` KHÔNG BAO GIỜ do worker đặt (luôn `FALLBACK_VERIFY` rồi model/người ở bước
làm-rõ gán lại), nên văn bản worker không đáng tin không thể trực tiếp trở thành một
lệnh shell chạy được; item không mang niềm tin đặc biệt nào, đi qua đúng vòng xét-lại
như một item người tự khai. **Phương án đã cân nhắc, CHƯA XÂY:** một cửa xét-duyệt-người
bắt buộc trước khi một item runner-tự-tạo được dispatch tự động (thay vì vào thẳng
`clarify` như hôm nay) — đổi thiết kế lớn hơn phạm vi một P3 review-fix, ghi lại đây để
cân nhắc lại nếu bằng chứng chèn-lệnh thật xuất hiện.

### 0013 Delivery Guarantee

Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-once) — KHÔNG PHẢI
ít-nhất-một-lần. Một report hợp lệ được `runner` phân tích thành công đúng MỘT LẦN, tại
kết cục cuối của lượt dispatch; nếu tiến trình runner chết giữa lúc phân tích và lúc
`addWork` ghi xong, report đó mất — không có cơ chế đối-soát-lại nào đọc lại output đã
lưu để phục hồi report đã mất. Xem spec Runner "Báo việc-phát-hiện từ trợ lý" / RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm).

### 0013 Alternatives Considered

- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi và làm report
  của worker thành đường ghi không qua goal-check.
- **Truyền id việc đang chạy vào worker để nó tự stamp `discoveredFrom`.** Bỏ —
  vẫn là worker ghi; cùng vi phạm.
- **Parse trong mỗi lần retry.** Bỏ — một khối phát lại qua các lần thử sẽ đúc ra
  item trùng; parse một lần tại kết cục cuối là điểm đúng.

## 10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule

### 0019 Context

`RUL11 (tiến hóa schema)` (`docs/specs/work-state.md:886`, D-ID `feed7428`) cấm tường minh: "Nhật ký
đã commit bất khả xâm phạm — không bao giờ migration ghi đè". Luật này nằm trong
một spec, không phải một decision record — nó không có file riêng mang khoá
`superseded_by` để trỏ ngược.

STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, khoá `actor`
trong `settlements[]`, `payload.predicted.actor`) thành `role`/`claimRole` trên
sự kiện đã commit. Ba kho `.fgos` mang dữ liệu cũ: kho sống dùng chung giữa mọi
worktree, kho `dogfood-fixture` (git-theo-dõi trong chính repo sản phẩm), và kho
`fgos-test-drive`. Không viết lại các kho này thì replay sẽ đọc vĩnh viễn hai tên
cho cùng một trường.

### 0019 Decision

Ghi nhận một **miễn trừ pre-release** cho `RUL11 (tiến hóa schema)`: trong lúc sản phẩm còn chưa
phát hành, một thao tác migration được phép **viết lại tại chỗ** (ghi đè
`events.jsonl`, không phải append sự kiện bù) thay vì tuân thủ tuyệt đối
"không bao giờ migration ghi đè".

- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở trên: kho
  sống dùng chung, kho `dogfood-fixture`, và kho `fgos-test-drive`. Cả ba cùng
  nằm trong phạm vi được phép viết lại — không phân biệt kho nào "quan trọng
  hơn" kho nào.
- **Lát cắt (slicing) là chuyện khác, tách bạch khỏi phạm vi.** Slice nào của
  STR46 thực sự thi hành việc viết lại cho kho nào là một quyết định lịch trình,
  không phải một quyết định phạm vi, và nó đã bị dời hai lần: kho sống được dời
  sang bước merge (vì nó dùng chung qua symlink giữa mọi worktree đang sống, và
  viết lại lúc mã còn trên nhánh chưa merge sẽ mở cửa sổ hỏng), rồi kho
  `fgos-test-drive` theo sau khi write-guard được đo là từ chối mọi đường dẫn nằm
  ngoài worktree. Một bản ghi vĩnh viễn không được kế thừa một quyết định lịch
  trình còn đang di chuyển — nên bản ghi này chỉ khoá PHẠM VI, không khoá SLICE
  nào viết kho nào lúc nào.
- **Hết hiệu lực (lapse).** Miễn trừ này **hết hiệu lực khi sản phẩm lên
  v1.0.0**. Từ mốc đó, `RUL11 (tiến hóa schema)` áp dụng đầy đủ trở lại không ngoại lệ — không có
  mốc thì "đang còn xây" sẽ thành một cái cớ vĩnh viễn.
- **Không bao gồm.** Miễn trừ này **không** bao trùm
  `repo/test/fixtures/phase1-events.jsonl` — file đã commit, header tự khai
  "NEVER regenerated or hand-edited", và mang một khẳng định bất biến riêng tại
  `test/state/backward-compat.test.mjs:245` ("the fixture file itself is never
  modified by any test in this suite"). File này không mang trường `actor` nên
  không có gì để đổi; nó bị loại rõ ràng để một script quét theo mẫu
  `**/events.jsonl` không vô tình chạm vào nó.

Vì `RUL11 (tiến hóa schema)` là một luật trong spec chứ không phải một decision record, cách
supersede đúng là: bản ghi này mang `supersedes: []` (không có id nào để trỏ),
và chính dòng `RUL11 (tiến hóa schema)` trong `docs/specs/work-state.md` được sửa để trích dẫn
ngược lại bản ghi này — văn xuôi làm việc mà `superseded_by` sẽ làm nếu mục tiêu
là một decision record.

### 0019 Consequences

- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và
  `fgos rebuild`, mọi bản chiếu dựng từ log chỉ còn thấy `role`/`claimRole`.
- **Miễn trừ có hạn, không phải giấy phép vĩnh viễn.** Sau v1.0.0, mọi migration
  tương lai quay lại nghĩa vụ append-không-đè của `RUL11 (tiến hóa schema)` như hôm nay.
- **`phase1-events.jsonl` giữ nguyên vai trò chuẩn nghiệm thu tương thích ngược**
  — nó không bị đưa vào bất kỳ lần viết lại nào, kể cả lần này.
- Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 11. ADR 0024 Rename Proposed Status To Awaiting-Approval

### 0024 Context

`0006` đặt tên status `proposed` cho trạng thái "goal-check đạt, đề xuất nằm
trên nhánh chờ duyệt". Quan sát người dùng (2026-07-28, `tsk-66l`): `proposed`
là danh từ trừu tượng, không tự nói "chờ gì" — khác 5 trong 7 status còn lại
(`todo`/`doing`/`blocked`/`done`/`wontfix`), vốn tự-giải-nghĩa hoặc có tiền lệ
ngành (GitHub/Jira). `awaiting-human` đã có convention `awaiting-*` cho trạng
thái chờ; `proposed` là ngoại lệ duy nhất không theo convention đó.

Xác nhận qua đọc code (không suy đoán): FSM chứa `proposed` là domain-agnostic
— `test/e2e/synthetic-domain.test.mjs` chứng minh domain `synthetic` (không
dùng git/merge) cũng đi qua đúng status này. Vậy một tên gắn nghĩa "merge"
(`awaiting-merge`) sẽ SAI bản chất — hardcode ngữ nghĩa domain `coding` vào một
field lẽ ra domain-agnostic.

`proposed` còn là từ vựng DÙNG CHUNG giữa hai field: `work.status` VÀ
`outcome.actual.outcome`/disposition (`docs/specs/work-state.md` Data
Dictionary #4 và O4 cùng dùng chuỗi này cho cùng 1 khái niệm) — đổi một nơi mà
bỏ nơi kia sẽ tái tạo đúng khoảng ambiguity giữa 2 field lẽ ra đồng nghĩa.

### 0024 Decision

Đổi tên giá trị `proposed` → `awaiting-approval`, đồng nhất ở CẢ HAI nơi dùng
chung từ vựng: `work.status` (1 trong 7 giá trị enum, `src/state/work.mjs`
`STATUSES`) và `outcome.actual.outcome`/`outcome.predicted.outcome`. Không đổi
FSM edges (`blocked→X`, `doing→X`, `X→done`, `X→todo`, `X→blocked` giữ nguyên
cấu trúc — chỉ đổi TÊN của `X`) — `0006`'s thiết kế FSM vẫn nguyên vẹn, record
này chỉ supersede THUẬT NGỮ, không phải cạnh chuyển trạng thái.

Migration: dưới miễn trừ pre-release cho RUL11 (tiến hóa schema) đã có tiền lệ (`0019`,
`package.json` version `0.1.0`, miễn trừ còn hiệu lực tới v1.0.0), viết
`scripts/migrate-status-proposed-to-awaiting-approval.mjs` (theo đúng khuôn an
toàn của `scripts/migrate-actor-to-role.mjs`: single-path, backup bắt buộc,
dry-run, seq-contiguity check) để ghi đè tại chỗ 3 kho `.fgos` trong phạm vi
`0019` (kho sống dùng chung, `dogfood-fixture/.fgos`, `fgos-test-drive/.fgos`)
— KHÔNG đụng `test/fixtures/phase1-events.jsonl` (đã đo: 0 chỗ chứa
`"proposed"`, loại trừ vô hại).

### 0024 Consequences

- Mọi consumer đọc `.status === 'proposed'` hoặc `.outcome === 'proposed'`
  phải đổi sang `'awaiting-approval'` cùng lúc với migration — không có
  compat-shim vĩnh viễn trong `replay.mjs`.
- Dry-run migration script phát hiện kho sống mang một corruption seq-trùng
  lịch sử đã biết trước (`src/state/events.mjs:25`,
  "spike-confirmed duplicate-seq corruption") — không liên quan tới rename
  này, chặn Pha B trên riêng kho sống cho tới khi ai đó xử lý riêng; không
  chặn `dogfood-fixture`/`fgos-test-drive` (dry-run sạch trên cả hai).
- `0006` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của nó (chỉ nhận thêm
  `superseded_by: 0024` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc);
  record này khai `supersedes: [0006]` — supersede MỘT PHẦN (thuật ngữ), không
  phải toàn bộ thiết kế FSM của `0006`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary

### 0027 Context

`base-workflow-model` (git content-hash `2ae492d8`) không tồn tại như một file
`docs/decisions/` đánh số riêng — nó chỉ sống dưới dạng trích dẫn nội tuyến
`per base-workflow-model / 2ae492d8` ở đúng 3 chỗ trong code/spec hôm
nay: `docs/specs/work-state.md` dòng 61 (Data Dictionary #21, field `domain`)
và dòng 1070 (RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage)), và file header của `src/state/workflow-stage-graphs.mjs`
dòng 1-2. Record này supersede đúng nguyên văn đó — không có id đánh số nào
khác để trỏ tới, nên `supersedes` khai thẳng content-hash `2ae492d8`, đúng
khuôn trích dẫn mà `work-state.md`/`workflow-stage-graphs.mjs` đã tự dùng, thay
vì bịa một id `00NN` không có thật.

**Luật gốc (nguyên văn từ `work-state.md` dòng 1070, RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage)):** "Một
domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào
trong 5 bước base-workflow mỗi stage thỏa), và cạnh chuyển-stage hợp lệ riêng
của nó — domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`), tách
bạch tuyệt đối khỏi `status`." Nói cách khác: `stage` (vĩ mô — domain tự khai
qua `DOMAINS` registry, `workflow-stage-graphs.mjs`) và `status` (vi mô — một
bảng `TRANSITIONS` PHẲNG duy nhất trong `status-fsm.mjs`, dùng chung cho MỌI
domain, không domain nào override) là hai trục tách biệt tuyệt đối. Domain
`coding` và `synthetic` hôm nay (`workflow-stage-graphs.mjs` dòng 51-91) đúng
là ví dụ sống của vế đầu (`DOMAINS[domain].stages/stepMap/transitions`); vế
sau (status) chưa từng có tương đương — `status-fsm.mjs`'s `TRANSITIONS`
(24 cạnh) và `work.mjs`'s `STATUSES` (10 giá trị: `todo`/`doing`/`blocked`/
`awaiting-approval`/`awaiting-human`/`delivered`/`retrospective`/`cleanup`/
`done`/`wontfix`) là hằng số toàn cục duy nhất, không tham số hoá theo
`work.domain` ở đâu cả.

**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain
sản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà
không phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế
domain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,
discovery-judge, compound-learn trigger) có một cách đọc "item đang ở đâu"
không phụ thuộc từ vựng domain. Bản thân report nguồn
(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,
round 4) ban đầu kết luận **"domain sở hữu TOÀN BỘ bảng transition"** — một
khung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP
trong phiên `fgos-coding-exploring` cho `tsk-38t`
(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):
§1 tự ghi nhận "Đây là thu hẹp thật so với kết luận round-4 của report gốc
('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain
thật sự cần tự khai (đoạn đầu vòng đời)". Quyết định (chốt vòng 3, seq 5571, xác nhận
người dùng nguyên văn: "đúng, mỗi phần domain sẽ có status/stage trước deliver
là chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học
khác (skill), cleanup cũng sẽ có cách dọn khác (skill)") là quyết định thật sự
được chốt — record này formalize đúng, không phải khung rộng ban đầu của
report.

### 0027 Decision

**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10
status hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí "domain có
được tự đặt nhãn/cạnh chuyển khác cho status này không" (DISCUSSION.md §6):

- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /
  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain
  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự
  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên
  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không
  ép dùng.
- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`
  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được
  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery
  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác
  nhận trực tiếp: "loại hình việc nào cũng cần delivery, retro, và cleanup...
  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup"). Khác biệt
  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở
  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,
  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên
  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field
  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status.

Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,
đóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —
luật L3, `docs/platform-foundations.md`):

| status (đoạn đầu) | statusCategory |
|---|---|
| `todo` | `todo` |
| `doing` | `in-progress` |
| `blocked` | `in-progress` |
| `awaiting-human` | `in-progress` |
| `awaiting-approval` | `review` |
| `wontfix` | `canceled` |

`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được
dùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24
cạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category
`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.
Validate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó
(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ
chế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,
discovery-judge) đọc "item đang ở nhóm nào" mà không cần học từ vựng của từng
domain.

4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng
mãi mãi cho mọi domain, không có khái niệm "domain tự đặt nhãn cho `delivered`"
để cần nén.

Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):
thêm field optional `domainFields: { [domainName]: {...} } }` trên work item
cho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần
`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua
`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern
độc lập với phần status/category ở trên, KHÔNG được implement trong record này
(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi).

### 0027 Consumer Audit

Quét bằng `rg -n "STATUSES|TRANSITIONS" src/ bin/ --glob '*.mjs'` và
`rg -n "'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|
'delivered'|'retrospective'|'cleanup'|'wontfix'"` trên `frontier.mjs`,
`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm
quét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập
"giống category" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`
(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu
acceptance của `tsk-38t`. Cột "Đổi?" nói rõ consumer này có cần đổi sang đọc
`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal
mãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên.

#### 0027 Audit 1 Status Source Of Truth

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của "10 giá trị coding" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |
| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |
| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |
| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |

#### 0027 Audit 2 Resolved Statuses Set

`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',
'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố
định) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).
Đây chính là hệ quả DISCUSSION.md §6 "Hệ quả 1" đã lường trước: khi hiện thực
hoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===
'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào
cùng category) — không còn là 1 Set string thuần.

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |
| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho "chưa bắt đầu" vẫn được nhặt |
| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |
| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |
| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |
| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |
| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |
| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |
| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |

#### 0027 Audit 3 CLI Status Literals

| File:line (khu vực) | Vai trò | Đổi? |
|---|---|---|
| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |
| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |
| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |
| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |
| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |
| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |
| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |

#### 0027 Audit 4 Runner Consumers

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |
| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |
| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |
| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |
| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |
| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |

#### 0027 Audit 5 Other Domain-Agnostic Mechanisms

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** ("`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi") |
| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |
| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), "rendered as-is" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị "as-is" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |
| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == "doing" \|\| item.status == "awaiting-approval"` (tsk-4vo) để hiển thị pane "in-process" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |

#### 0027 Audit 6 Adjacent Gaps

`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`
(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá
theo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key
`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không
phải một "consumer literal status" cần audit ở record này.

### 0027 Consequences

- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**
  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,
  consumer-migration theo audit ở trên, `skillMap.retrospective`,
  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng
  transition khác coding để chứng minh thiết kế) — **không phần nào trong số
  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance
  gốc của `tsk-38t` ("cần decision record mới đúng khuôn 0024 supersede 0006,
  viết TRƯỚC khi code").
- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn
  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain
  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain
  registry cho `stage` vẫn đứng nguyên, không bị chạm).
- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)
  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay
  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7
  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,
  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng
  gọi `.has` trên đúng 1 Set dùng chung.
  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH
  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu
  `RESOLVED_STATUSES`.
- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit "consumer của status" không
  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc
  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần
  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.
- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là
  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,
  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần.

## 13. ADR 0032 Multi-Role Team Harness

> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),
> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng
> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-
> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),
> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3
> mảnh triển khai, chi tiết per-file).
> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`
> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản
> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là
> `docs/history/fgos-marketing-domain-foundation/`).

### 0032 Foundation Architecture

- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự
  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.
  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự
  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ
  (chặn và dạy tại chỗ).
- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11
  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×
  `role/holder` (mới, opt-in per-domain qua `roleGraph`).
- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —
  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +
  roleGraph + gates) / Dispatch (executor nào chạy —
  `src/runner/dispatch.mjs` decide/execute, một cửa).

### 0032 Handoff

- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4
  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /
  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá
  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).
  Ranh giới: cùng item → handoff; khác item/cây → signal.
- **Call lồng được, trần callstack** (mặc định 3, config override — con
  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).
- **Ghi log hai mức**: async call = handoff event đầy đủ, holder
  đổi; sync call trong-session (subagent) = một event `call-summary`
  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.
  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong
  event + worktree commit cho artifact) — không cần checkpoint machinery
  riêng như cockpit.
- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới
  item/worktree (merge main CTR005, publish ra ngoài, terminal
  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —
  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng
  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp
  nguyên xi cho marketing (publish = hard, editorial approval = soft).

### 0032 Declarative Structure

- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1
  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật
  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)
  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /
  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có
  default; item cũ fold về default, không migration. Phân biệt đóng
  đinh: **workflow** = shape lifecycle MỘT item; **template**
  (`fgos expand`) = composition NHIỀU item thành cây.
- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —
  contract: input/output/gates/verify-template; bất biến theo người làm)
  / **skill** (know-how — của executor, compound-learn rewrite tự do) /
  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model
  weights, marketing là tài sản file thật của cockpit) / **context**
  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn
  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3
  executor ngay hôm nay (người + /code-review + reviewer-agent tương
  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`
  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi
  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi
  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,
  không engine coupling → A-lite không tách đại trà.
- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng
  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,
  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho "làm sao
  agent biết khi nào nên hỏi gì và hỏi ai". Prototype đã chạy thật ở
  dạng ngầm: filter material/grounded/answerable của exploring = trigger
  advise; description của fgos-researching = trigger consult. Phân công
  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra
  ở compound-learn qua call-summary/handoff events.
- **Position vs Agent-type**: roleGraph đóng ở **5
  position** (implementer / researcher / reviewer / helper /
  advisor) — nguyên tắc *nở task trước, nở role sau*
  (security-auditor = Reviewer + phiếu `audit-security`, không phải role
  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition
  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một
  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.
  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*
  Không roster file, không humans registry, không agent-pools: pool size
  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm
  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).
  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa
  ưu tiên #2 "release con người". Coding có ~13 phiếu: 6 phiếu stage của
  implementer + 7 phiếu call-target.
- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,
  không phải ghế team. Cross-item: nhiều soul cùng position chạy song
  song (parallel claims sẵn có). Trong item: call nhắm `(position,
  phiếu)` → rơi vào frontier như work-order nhỏ → session mang
  agent-type có phiếu đó trong `claims` tự claim (**pull**, không
  push-assign), claim event ghi (sessionId, agent-type); **sticky trong
  một call-thread** (vòng sau về đúng soul giữ context); **targeted
  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho
  compound-learn soi. Soul instance là runtime record sinh lúc claim —
  không phải config. Solo mode thoái hoá êm: một soul mang nhiều
  agent-type, self-review vẫn hữu hình trong log.
- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**
  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con
  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft
  ghi reason, không chặn cứng), **schema là domain data** khai cạnh
  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:
  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor
  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —
  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact
  coding là văn xuôi, không phải structured data. Việc cockpit thường
  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do
  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item
  kẹt.

### 0032 Implementation Sequence

**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban
đầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành
move hữu hình, không phát minh tương tác mới:

| Reason | Tương tác ngầm hiện có |
|---|---|
| consult | `fgos-researching` gọi giữa exploring/planning |
| review | `code-review` / vòng approve-reject |
| assist | subagent fanout (`fgos-fanout`, Agent tool) |
| advise | `fgos ask`/`answer` + `awaiting-human` |

Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp
coding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song
①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate).

### 0032 Marketing Cockpit Comparison Conclusion

**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →
biểu diễn lại thành event typed-payload + projection theo consumer
cursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật
duy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại
— *hoãn* tới use-case thật); 25 workflow → phân về template stamper
(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →
skill sau `fgos gate` CLI mỏng (chờ câu hỏi #7).

**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →
task-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →
knowledge; studio/brand → context.

**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —
event-sourced work item thay thế, phải giết đầu tiên); run FSM riêng
(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs
awaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3
file routing/delegation/priority (protocol-not-engine, prose-enforced là
liability — 1 DOMAINS entry engine-enforced thay thế); phần lớn
checkpoint machinery (có free từ event log + worktree commit); adapter
đa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước).

### 0032 Deliberately Deferred Questions

1. **#7 — Judge-gate (LLM-graded rubric) có tính là "proof" theo luật L5
   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing
   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng
   domain vừa thêm. Quyết tường minh ở lượt marketing.
2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —
   YAGNI, chưa xây.
3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice
   invalidation).
4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive
   chỉ khi cron chứng minh thiếu.
5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team
   nhiều người thật.

## 14. Related Files

- [Work State area portal](../README.md)
- [Work State spec](../spec.md)
- [Multi-role harness distill record](../history/multi-role-harness-distill-record.md)
