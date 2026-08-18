# CONTEXT.md — dispatch: cơ chế kích hoạt & bàn giao

Item: `tsk-2uf` · domain: `coding`

Nguồn quyết định: `DISCUSSION.md` trong cùng thư mục (5 vòng thảo luận qua
`fgos-coding-shaping`, 2026-08-18). File này là bản khoá máy-đọc-được của
những gì §4 DISCUSSION.md đã chốt; `DISCUSSION.md#design` (§6) là bản diễn
giải đầy đủ, `#tasks` (§7) là danh mục hạng mục.

Không có vòng Socratic mới nào ở bước này: `refs` đã trỏ thẳng vào §6/§7 và
giải quyết hết gray-area, đúng như `fgos-coding-shaping` dự đoán cho một
bàn giao native-first ("expect that pass to generate few or no new
questions — that is this skill doing its job well").

## Ranh giới feature

**Trong phạm vi:** cơ chế *kích hoạt* (trigger/enforcement) và *bàn giao*
(handoff/return) của dispatch — cụ thể là cửa CLI để phát payload từ một
work item đã claim, hợp đồng mà bên thực thi phải theo, hình dạng kết quả
trả về, và việc ranh giới file có hiệu lực thật hay không.

**Ngoài phạm vi:** không đổi `decide`'s own mechanism judgment (D-ADR0033
giữ nguyên: config thắng `hasLiveTaskAccess`); không đổi `loop.mjs`'s
automated path; không đụng merge/approve gate; không thêm domain mới.

## Bằng chứng scout (đã dẫn nguồn)

| Điều | Ở đâu |
|---|---|
| `decide` có `--work <id>`, `executeExecutorCli` **không** có tham số `work` | `src/runner/dispatch.mjs:2168` vs `:1828-1843` |
| `buildPrompt` render prompt thuần từ field đã lưu trên item, gồm cả `skillPath` | `src/runner/dispatch.mjs:111-165` |
| Template dispatch bảo worker đọc `{skillPath}` **và** cấm gọi `fgos` | `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` |
| File được trỏ tới lại bảo gọi `dispatch.mjs decide` và `fgos return <id>` | `.agents/skills/fgos-coding-implement/SKILL.md` (Flow 2, Flow 5) |
| `footprintDiffHits` cờ mọi file ngoài `footprint`, **miễn trừ khi rỗng** (D5) | `src/runner/frozen-judge.mjs:69-100` |
| `normalizeChild` ép child spec self-contained lúc viết (`verify` thật + `action` trích D-ID có thật) | `src/intake/plan.mjs:175-219` |
| D-ID chỉ được đọc từ `CONTEXT.md`/`plan.md`, trong mục locked-decisions (tên heading viết đúng ở dưới; regex `extractLockedDecisionIds` **không neo đầu dòng**, nên nhắc nguyên văn tên heading đó ở bất kỳ đâu phía trên sẽ cướp lát cắt — đã vấp thật khi viết file này) | `src/intake/plan.mjs:50`, `extractLockedDecisionIds` |
| Chỉ MỘT điểm dispatch được ép bằng máy | `.claude/settings.json` → `PreToolUse` matcher `"Agent\|Task"` → `scripts/dispatch-decide-hook.mjs` |
| `capabilities` rỗng hoàn toàn → cửa `decide --for <purpose>` chưa ai ở | `.fgos/config.json` |
| 3 domain ngoài `coding` đều tự khai fixture, `skillMap` toàn `null`, `worktreeBacked:false`, không khai `roleGraph` | `src/state/workflow-stage-graphs.mjs:464-560` |
| Tiền lệ đặt tên coding-specific cho thân generic | `.agents/skills/fgos-coding-driving/SKILL.md` D12 + red flag D10 |
| Upstream: hợp đồng worker là file riêng, vẫn trỏ skill; cold-pickup refusal; token cố định | `/home/vantt/projects/beegog` `v2.7.0` → `packages/bee/agents/bee-build.md.tmpl` |
| Upstream: guard+prepare gom về một hàm thuần vì kiểm **cùng** một luật | `docs/knowledge/areas/hook-runtime/dispatch-guard.md` (beegog) |
| Ad-hoc task id `<scope>#p<n>` **cấu trúc không hợp lệ** với id của work item — dấu `#` không nằm trong pattern; cố ý, để không bao giờ nhầm thành lifecycle id | `src/state/work.mjs:24` (`ID_PATTERN`), `_shared/executor-dispatch-fallback.md` § Ad-hoc |
| Hook chỉ khớp `Agent`/`Task`, chạy `decide` **thay** caller (không kiểm caller đã gọi chưa), và **fail-open** khi lỗi → `dispatch.mjs execute` chạy qua Bash/Monitor **không hook nào chạm** | `scripts/dispatch-decide-hook.mjs` (`AGENT_TOOL_NAMES`, khối fail-open) |
| Research fan-out branch **bỏ qua `decide` ở prose**: *"No purpose check, no decide/resolve round trip"* | `.agents/skills/fgos-researching/SKILL.md` (tsk-5tm-2 D6) |
| Child sinh bởi decompose **không có `docsRef`/`refs`** → worker được dispatch không có đường tới `CONTEXT.md` để đọc chính D-ID mà `action` của nó trích | quan sát trực tiếp trên `tsk-2uf-1/2/3` ngay sau materialize; đã vá bằng `fgos edit` |
| Upstream beehive v2.7.0 đi xa hơn token: worker trả **fenced JSON Result form** `{outcome, commit, files, tests, deviations}` **bên cạnh** status token; `cells finish --report` validate đúng 5 khoá (khoá lạ bị từ chối, khoá thiếu bị nêu tên); *"Tending reads the form, never parses worker prose"* | `docs/knowledge/areas/workflow-state/dispatch.md` (beegog) |
| Upstream beehive v2.7.0: `dispatch wave` dùng **đúng cùng** đường claim+reserve+payload như per-cell `dispatch prepare --kind cell --claim`; output `{wave, skipped, economics}`; một refusal rơi vào `skipped` có lý do có kiểu, **không bao giờ abort cả batch** | cùng file trên |
| Upstream pi **cố ý không có sub-agent** → không đóng góp gì cho câu hỏi đơn vị làm việc; nó là **worker runtime**, không phải orchestrator | `docs/distillery/sources/pi.md` § `minimal-core-by-design` |

**Chi phí đo được, làm nền cho toàn bộ feature:** tsk-3kl tốn ~25 tool call
+ 12m52s wall-clock để chèn 19 dòng prose mà chính phiên Claude đã viết sẵn
nguyên văn vào prompt — không lý do nào trong 4 lý do dispatch hợp lệ được
thoả, vì bàn giao quá đắt nên việc đẩy ra không hoàn vốn.

**`impact-analysis: degraded`** — `fgos tool query` báo provider `gitnexus`
`status: present`, nhưng hook trong phiên liên tục báo *"GitNexus index is
stale (last indexed: 7bb3231)"*. Theo đúng khung ba mức của `CLAUDE.md`:
present nhưng index lệch HEAD ⇒ mọi bằng chứng blast-radius phải bị đánh
dấu là yếu, không được coi là đã xác nhận. Ghi lại ở đây để người đọc sau
khỏi phải suy lại.

## Thuật ngữ đã ghim

- **driver** — phiên sở hữu vòng đời của item: claim, decide, dispatch,
  verify, return, Iron Law.
- **worker** — *người thật sự làm việc*, có thể chính là driver
  (in-process) hoặc một agent provider khác (out-of-process). Không phải
  một vai trong `roleGraph`; là một **hợp đồng**, không phải một danh tính.
- **ticket** — chính work item đã được claim. Không phải một gói prompt
  dựng riêng.
- **cold-pickup refusal** — worker tự thẩm định prompt có đủ để làm không;
  không đủ thì trả `[BLOCKED]` nêu đúng chỗ thiếu, tuyệt đối không đoán.
- **chỗ nối (seam)** — field khai ở registry theo khuôn opt-in per-domain
  của `roleGraph`: vắng mặt nghĩa là domain đó không dispatch worker.
- **lifecycle-bearing unit** (D5) — work item + child work: cùng một shape,
  có claim/worktree/verify/footprint, đi qua merge.
- **ephemeral unit** (D5) — ad-hoc task `<scope>#p<n>` + research fan-out
  branch: không claim, không state, trả digest về cha. Id mang `#` nên
  **cấu trúc** không bao giờ nhầm được thành lifecycle id.
- **builder** (D6) — nơi duy nhất sinh payload dispatch, **biết kind**,
  dùng chung cho mọi transport. Khác **guard** (hook): guard xử lý lời gọi
  *không có đơn vị*, builder xử lý lời gọi *có đơn vị*.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | đẩy việc ra provider ngoài là ĐÚNG, không phải thứ cần giảm bớt -- vấn đề nằm ở cơ chế kích hoạt và cơ chế bàn giao |
| D2 | phân vai theo trí tuệ -- model mạnh làm planning + phân mảnh task với description self-contained, provider model rẻ thực thi mảnh đã chia |
| D3 | tách fgos-coding-implement thành phần driver (claim/decide/dispatch/verify/return/Iron Law) và phần worker (làm trong ranh giới, chứng minh, báo token); phiên Claude khi không dispatch cũng thi hành đúng phần worker đó, y như agy |
| D4 | hop dong worker -- cau truc tong quat (chỗ nối khai ở registry theo đúng khuôn opt-in per-domain của roleGraph), nội dung cụ thể của coding (một bản, tên coding-specific theo tiền lệ fgos-coding-driving D12) |
| — | auto-approved CONTEXT.md gate for tsk-2uf at level standard |
| — | auto-approved validateApprove gate for tsk-2uf at level standard |
| D5 | phân loại đơn vị dispatch thành 2 lớp -- lifecycle-bearing (work + child-work, cùng shape: claim/worktree/verify/footprint) và ephemeral (ad-hoc task <scope>#p<n> + research fan-out branch: không claim, không state, trả digest). Nửa GENERIC của hợp đồng worker (chỉ là phần thực thi, ranh giới, cold-pickup refusal, token cố định, gate thuộc người) áp cho CẢ HAI lớp; nửa CODING-SPECIFIC (git commit, worktree, shell verify) chỉ áp cho lifecycle-bearing |
| D6 | học hình dạng prepareDispatch của beehive -- MỘT builder payload duy nhất, biết kind, xuyên transport. execute --work phải là MỘT CỬA của builder đó, không phải đặc lệ cho work item, để cửa anh em (--task cho ephemeral) ghép vào được sau. Guard (hook PreToolUse) VẪN tách riêng vì nó xử lý lời gọi KHÔNG có đơn vị -- builder không có input để làm việc ở case đó |
| D7 | đổi hình tsk-2uf-1 từ 'thêm cờ --work' thành GOM dispatch.mjs (2204 dòng, 6 concern lẫn trong 1 file) thành các module có ranh giới rõ, với prepareDispatch(unit, opts) là khái niệm có tên ở giữa. dispatch.mjs giữ lại làm barrel re-export nên 13 importer không phải sửa dòng nào |

## Phép thử của D4 — vì sao "trung tính với provider" chưa được chứng minh

D4 khai hợp đồng worker là *cấu trúc tổng quát, nội dung của coding*, và
`tsk-2uf-2` viết hợp đồng đó là **trung tính với provider**. Ghi thẳng ra
đây để không ai đọc nhầm: với đúng **một** provider (`agy`), câu đó là một
**lời khẳng định, không phải một tính chất đã chứng minh**.

Cái lõi thì đã có bằng chứng chạy thật — `tsk-3kl` và `tsk-38w` đều dispatch
qua `agy`, sửa đúng file trong worktree, verify xanh, đã merge — và nó
không phụ thuộc provider nào, vì hợp đồng là **con trỏ tới một file**, không
phải cơ chế skill-loading của harness: agent nào đọc được file là thi hành
được.

Nhưng "một provider chạy được" không suy ra "mọi provider chạy được".
**`tsk-47r` (pi) là phép thử của chính D4**, và được nối `deps: tsk-2uf-2`
đúng vì thế: phải có hợp đồng thật rồi mới thử được.

- **Xanh** → D4 được chứng minh, và fgOS có provider thứ hai chạy nguyên trạng.
- **Đỏ** → chỉ ra chính xác chỗ hợp đồng đang lén lệ thuộc một runtime cụ
  thể. Đây là kết quả **có giá trị**, không phải thất bại — và là lý do phép
  thử phải chạy **sớm**, lúc hợp đồng còn đúng một consumer và còn rẻ để
  sửa, chứ không phải sau khi đã có ba consumer bám vào.

pi rẻ bất thường cho vai này vì nó đọc thẳng project `.agents/skills` đi
ngược lên git root — đúng nơi hợp đồng sẽ nằm. Không adapter, không dịch
format.

## Tham chiếu

- `DISCUSSION.md#design` — thiết kế đầy đủ, kèm sơ đồ so sánh hình dạng
  hôm nay với đề xuất.
- `DISCUSSION.md#tasks` — 5 hạng mục ứng viên (P1–P5) với quan hệ phụ thuộc.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — **bắt buộc đọc
  trước khi đặt `verify` cho bất kỳ hạng mục nào đụng `SKILL.md`** (P2/P3
  chắc chắn đụng): khuôn `npm test && POSITIVE && NEGATIVE`, năm cái bẫy đã
  gặp thật, và lập luận có sẵn cho vòng judge thứ hai.
- D-ADR0033 (`docs/specs/runner.md` §2312) — config thắng
  `hasLiveTaskAccess` cho executor cli-spawn-shaped. **Không mở lại**; mọi
  quyết định dưới đây tương thích với nó.
- `tsk-5tm-3` D5 — `execute` không được quyết định lại *cơ chế*. P1 kiểm
  *tính hợp lệ của lời gọi*, là việc khác.

## Outstanding questions

None
