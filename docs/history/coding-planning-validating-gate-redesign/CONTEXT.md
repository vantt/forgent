# coding planning/validating gate redesign — locked decisions

Item: `tsk-224`. Source request (raw, untrusted per RUL45): sửa gate của
`fgos-coding-planning`/`fgos-coding-validating` từ "duyệt hay không" thành
"agent tự nỗ lực làm plan tốt nhất, chỉ hỏi người khi tự thấy plan chưa ổn,
và khi hỏi thì hỏi để CÙNG ĐIỀU CHỈNH plan chứ không phải xin phép".

> **Cảnh báo đọc:** tài liệu này tham chiếu tới D-ID của
> `docs/history/gate-bypass/CONTEXT.md`. Mọi tham chiếu tới file đó luôn
> viết rõ tiền tố **`gate-bypass D<n>`**. D-ID trần (`D1`…`D9`) luôn là
> của chính tài liệu này.

## Feature boundary

**Trong phạm vi:** số lượng, nội dung, thời điểm, và vị trí của các
skill-embedded confirmation gate ở stage `planning`; tiêu chí quyết định
khi nào agent tự đi tiếp vs dừng hỏi người; đường ghi state thật cho item
con (materialize).

**Ngoài phạm vi:** bật/tắt việc có hỏi hay không (đó là gate-bypass level,
đã có sẵn — `gate-bypass D1`-`D5`); cơ chế `awaiting-human` park; lưới an
toàn `add-stage-default-gap` (item này tôn trọng đúng lý do của nó, chỉ đổi
đường ghi sang cửa engine sẵn có).

## Locked decisions

| ID | Decision |
|----|----------|
| **D1** | **Đúng 1 gate trong stage `planning`.** Gộp `planApprove` (`fgos-coding-planning`) + `validateApprove` (`fgos-coding-validating`) thành một điểm hỏi người duy nhất, đặt tại `fgos-coding-validating`, **ngay trước materialize**. `fgos-coding-planning` không còn gate riêng — nó viết `plan.md` rồi bàn giao. Bằng chứng: case study `tsk-5wr` cho thấy 2 gate hiện tại tạo ra 1 gate có sức nặng thật (chọn phương án) + 1 gate gần như rỗng (tự chấm rồi tự xin duyệt); cả 2 lần người chỉ gõ "approve". |
| **D2** | **`contextApprove` (`fgos-coding-exploring`) giữ nguyên, không đụng — và không cần đụng.** Nó đã đúng-sẵn về mặt cơ chế: `fgos discover --verdict clear` nhảy thẳng `discovery`→`planning`, bỏ qua `exploring` (`bin/fgos.mjs` case `discover`; CLI help: "A clear verdict moves the item forward to planning"), nên `contextApprove` chỉ chạy khi verdict `unclear` đẩy item vào `exploring` — tức đúng lúc có người cùng brainstorm và câu "ok hết chưa, duyệt chưa" là câu hỏi thật. "Đúng 1 gate" ở D1 là 1 gate **trong `planning`**, không phải 1 gate cho cả vòng đời. |
| **D3** | **Tiêu chí im-lặng-mặc-định = 2 tầng, thứ tự A→B bắt buộc, không đảo được.** **Tầng A:** khoảng trống này có đóng được bằng một hành động **hợp lệ** trong tầm tay không (chạy lệnh, đọc file, gọi `fgos-researching`, chạy `fgos graph --what-if`)? Có → LÀM, rồi hỏi lại từ đầu; không hỏi người. Thoát tầng A chỉ khi: hành động không tồn tại, đã thử và thất bại, **hoặc bị luật cấm** (ca `CONTEXT.md` đã khoá — agent bị cấm mở lại nên về cấu trúc không tự gỡ được). **Tầng B:** cái sống sót — sai thì sửa tốn gì? Rẻ → pin thành assumption có nhãn trong `plan.md`, đi tiếp. Đắt → hỏi. **Lý do A phải trước B:** B đánh giá cái giá của việc ĐOÁN, mà chưa vét A thì đoán là lựa chọn giả; đánh giá cost trước khi vét hành động = hợp lý hoá sự lười — đúng lỗi `tsk-5wr` mắc ở ca `cargo test` chưa từng chạy. |
| **D4** | **Tầng B đo cái gì, chính xác.** (a) Đo chi phí **SỬA khi sai**, không phải chi phí **LÀM** — giải pháp 3 ngày mà lùi được dễ thì đoán an toàn hơn giải pháp 1 giờ khoá cứng public contract. (b) Đo tại thời điểm cái sai **LỘ RA** (giữa/sau execute), **không** phải tại thời điểm đoán — bắt buộc, vì D7 dời materialize xuống sau gate nên ngay tại gate mọi thứ đều rẻ; đo tại gate thì tầng B luôn trả "rẻ" và cả thiết kế sụp. (c) Chi phí sửa **bao gồm thiệt hại đã xảy ra trong cửa sổ chưa phát hiện**, không chỉ diff để vá. (d) Chi phí thuộc về **DECISION**, không phải từng option — mặc định một khoảng trống một con số, không phải ma trận option × chi phí. |
| **D5** | **Ngoại lệ chọn-đường-lùi-được.** Khi các option lệch nhau về khả năng lùi: **chọn đường lùi được, đi tiếp, KHỎI HỎI.** Chỉ hỏi khi mọi đường còn sống đều khó lùi, hoặc đường lùi được rõ ràng là sai. Đây là chỗ biến một lần đáng-lẽ-đã-hỏi thành một lần ship (AGENTS.md ưu tiên #2). |
| **D6** | **Đúng 3 trigger hỏi, cơ học, không cảm tính.** **T1** — còn ≥2 phương án sống sau khi đã so sánh thật. **T2** — plan cần thứ mà một quyết định `CONTEXT.md` đã khoá nói ngược, không tự gỡ bằng cite được. **T3** — một mảnh không viết nổi `action` cite được D-ID thật, hoặc không có verify chạy được thật (engine đã cưỡng chế sẵn tại `src/intake/plan.mjs:197-201`; không viết nổi **LÀ** tín hiệu bí, không phải lý do bịa `action` cho đủ điều kiện). **BỎ** gợi ý gốc "rủi ro cao mà proof-surface không đủ": `fgos-coding-validating`'s feasibility matrix đã xử — row không có evidence được chấp nhận thì tự động `NOT READY`, mà `NOT READY` **trả về planning chứ không hỏi người**; thêm trigger này là làm trùng và biến một vòng tự sửa thành một lần dừng chờ người. |
| **D7** | **Materialize dời hẳn sang sau gate, qua cửa engine sẵn có.** `fgos-coding-planning`'s step 4 viết đặc tả từng con (title, verify, `action` trích D-ID, footprint) dưới dạng prose/JSON **trong `plan.md`** — **không** gọi `fgos add --parent` nữa. Việc ghi state thật xảy ra đúng 1 lần, tại gate của `fgos-coding-validating`, qua `fgos plan <id> --verdict decompose --children '<JSON>'`. Hệ quả kép: (a) cắt sai trước gate không tốn gì vì chưa ghi gì; (b) con sinh thẳng ở `stage: executing` (`src/intake/plan.mjs:866`) nên **không có gate riêng để phải lướt qua** (đối chứng: `fgos-coding-implement` hoàn toàn không có gate nào). Nhánh `--verdict decompose --children` đã tồn tại sẵn trong `fgos-coding-validating`'s Gate section nhưng chưa bao giờ đi tới được, vì planning's step 4 luôn tạo con thủ công trước. |
| **D8** | **Số phận các quyết định `gate-bypass/CONTEXT.md`.** **Supersede `gate-bypass D6`** (bypass `validateApprove` theo verdict READY) — gate nó phục vụ không còn tồn tại độc lập sau D1. **Supersede `gate-bypass D2` CHỈ vế "never the session's own confidence/vibe read"** — thay bằng bất biến D9; phần "mechanical completeness / zero open items" giữ nguyên, vẫn là một input cơ học tươi đọc `plan.md` tại gate. **Supersede `gate-bypass D4`** (sàn hard-gate) — xem D10. **GIỮ `gate-bypass D5` cả hai vế**: trục `tier` và trần `level`. |
| **D9** | **Bất biến monotone — thứ làm tiêu chí self-reported an toàn theo cấu trúc, không theo lời hứa.** Phán đoán của agent **chỉ được nâng lên ĐẮT, không bao giờ hạ xuống dưới sàn cơ học**. Mọi check chỉ đẩy về phía **HỎI**, không bao giờ về phía im lặng. Đây là câu trả lời trực tiếp cho phản đối của `gate-bypass D2`: self-grading nguy hiểm khi nó *hạ* chuẩn — ở đây nó không thể. Code hôm nay đã đúng vậy rồi (`canAutoApprove` trả `false` ngay khi bất kỳ check nào fail, `gate-bypass.mjs:130-138`); D9 khoá nó thành quyết định thay vì để nó là tính chất tình cờ. |
| **D10** | **`gate-bypass D4` chính LÀ tầng B, tính sai chỗ sai lúc → gộp vào tầng B làm SÀN CƠ HỌC, và mở rộng nguồn đọc.** Danh sách 34 từ khoá (`src/intake/risk-keywords.mjs:18-26`) gần như là định nghĩa của "sai thì không lùi được" (`irreversible`, `không thể hoàn tác`, `data loss`, `mất dữ liệu`, `migration`, `delete`, `breaking change`, `payment`) — nó hỏi đúng câu hỏi của tầng B, chỉ khác là trả lời bằng grep trên `title`+`description` (text submit, đông lạnh từ trước cả `discovery`) và không bao giờ đọc `plan.md`/footprint. **Sửa:** giữ nguyên tính không-thương-lượng (dính sàn = ĐẮT, agent không hạ được — D9), nhưng nguồn đọc thành **HỢP** của text submit **và** `plan.md` + footprint + spec con. Union, không thay thế → không mất coverage nào, chỉ thêm. |
| **D11** | **`gate-bypass D5` trục `tier` KHÔNG hỏi về rủi ro — nó hỏi về khẩu vị giao việc.** Size ≠ reversibility (refactor `heavy` gọn trong 1 branch thì revert một phát; sửa 1 dòng migration `light` thì không lùi được). Trục này trả lời "người uỷ quyền cho máy tự chạy tới hạng cân nào" — một câu hỏi hợp lệ, **khác chiều** với tầng B nên không xung đột và không cần thay. **Giữ nguyên, chỉ ghi rõ lại nó nghĩa là gì.** Trần `level` cũng giữ: nó là **thứ duy nhất trong cả hệ** cho phép người nói "dừng tự duyệt, tôi muốn xem", và chính là lớp human-set ceiling mà `gate-bypass D2` viện dẫn để phản đối self-grading — bỏ nó là bỏ luôn lý lẽ bảo vệ D3. |
| **D14** | **Giao thức hand-back `planning`→`exploring` — trong phạm vi item này, vì D1 sai nếu thiếu nó.** Hôm nay nhánh Material của `fgos-coding-planning` step 6 (SKILL.md:263-274) **không ghi lại gì**: không `fgos decision`, không field, không event — khoảng trống chỉ sống dưới dạng prose trong phiên, nên phiên chết là mất sạch, và re-entry chạy lại full step 1 của `fgos-coding-exploring` rồi bắn lại `contextApprove` → **gate thứ hai trong `planning`**. Ba vế, prose-only trong 2 file SKILL.md, **không field mới, không đụng engine**: **(a) chiều đi** — trước khi hand-back, `fgos-coding-planning` ghi một `fgos decision` nêu rõ khoảng trống là gì, vì sao material, và **tầng A đã thử gì mà không đóng được**; **(b) chiều về** — `fgos-coding-exploring` re-entry đọc decision đó và **chỉ xử đúng khoảng trống ấy**, không chạy lại step 1 scan, kết thúc bằng append D-ID mới + giữ `## Outstanding questions: None`; **(c) gate** — re-entry **không hỏi lại `contextApprove`**: hand-back xảy ra *vì* vừa hỏi người một câu Socratic, nên hỏi "approve CONTEXT.md?" ngay sau đó đúng là gate rỗng `tsk-5wr` phàn nàn; còn nếu gap tự giải được không cần hỏi ai thì quyết định mới ấy vẫn đi qua gate gộp duy nhất ở `planning` (D1). Ghi nhận thêm: `planning`→`exploring` **không phải một stage move** — domain `coding` có 8 cạnh và **không cạnh nào lùi** (`workflow-stage-graphs.mjs:125-160`), nên đây thuần tuý là một lời gọi skill trong cùng phiên; mọi bản vá phải giữ đúng tính chất đó. |
| **D13** | **Supersede bằng cách APPEND row mới, không bao giờ sửa thân row cũ.** `docs/history/gate-bypass/CONTEXT.md`'s D6/D7/D8 đã do `tsk-539`/`tsk-1vi` append vào cùng file — đó là tiền lệ sẵn có cho `docs/history/<feature>/CONTEXT.md`. D8 của tài liệu này triển khai theo đúng khuôn đó: append row mới ghi rõ vế nào của `gate-bypass D2` bị thay và bởi D-ID nào, để nguyên chữ của D2/D4/D6. Cùng luật áp cho dòng D6 trong `docs/history/gate-question-quality-and-routing/DISCUSSION.md:734`. Nguồn luật: `docs/explanation/a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md` §"never edit the superseded doc's body" + AGENTS.md "Changing a locked law". Lưu ý phân biệt: luật `superseded_by` frontmatter + `scripts/check-decision-supersession.mjs` chỉ quét `docs/decisions/NNNN-*.md`, **không** quét `docs/history/**` — nên item này không phải mint một decision record mới, chỉ append row. |
| **D12** | **Hình dạng câu hỏi khi phải hỏi.** Chỉ trình bày đúng chỗ đang bí (không dán cả plan rồi chốt một câu); kèm nỗ lực của chính agent (đã so những phương án nào, dựa bằng chứng gì) để người **SỬA** chứ không bắt đầu từ số không; hỏi đúng cái input còn thiếu, **không** hỏi duyệt-hay-không; nhiều chỗ bí thì **gom thành một bộ hỏi một lần** (AGENTS.md ưu tiên #2); không bí chỗ nào thì **không có câu hỏi nào**, chỉ post một dòng thông báo không-chặn (tái dùng đúng pattern dòng `auto-approved:` đang có, `gate-bypass D3`). |

## Pinned terms

- **Sàn cơ học** — phần của tầng B tính được không cần phán đoán (D10's
  keyword union). Agent nâng lên được, hạ xuống không được (D9).
- **Khẩu vị giao việc** — thứ `tier`×`level` đo (D11). Không phải rủi ro.
- **Materialize** — lần ghi state thật đầu tiên tạo item con (D7).

## Scout evidence cited

- `src/intake/plan.mjs:157-169,184-201` — `extractLockedDecisionIds`;
  `action` bắt buộc + phải cite D-ID thật từ bảng `## Locked decisions`
  của cha, thiếu/sai thì `normalizeChild` trả `null` và cả verdict hỏng.
- `src/intake/plan.mjs:845-871` — vòng `addWork` của nhánh decompose, con
  tạo với `stage: stageForStep(domain, 'Execute')`.
- `.claude/skills/fgos-coding-planning/SKILL.md:191-231` — step 4 hiện gọi
  `fgos add --parent --stage planning`, không có field `action`.
- `.claude/skills/fgos-coding-planning/SKILL.md:334` — nguyên văn gate
  hiện tại: "Work shape is ready. Approve before execution?"
- `.claude/skills/fgos-coding-validating/SKILL.md:229` — nguyên văn:
  "Feasibility validated. Approve moving to executing?"
- `.claude/skills/fgos-coding-validating/SKILL.md:239-250` — ba nhánh
  `fgos plan`; nhánh `--verdict decompose --children` (dòng 247) tồn tại
  sẵn nhưng bị nhánh dòng 248-249 chặn vì con đã tạo thủ công trước.
- `src/state/gate-bypass.mjs:130-138` — `canAutoApprove`: hard-gate floor →
  tier coverage → `hasOpenItems`, mọi nhánh fail đều trả `false`.
- `src/state/gate-bypass.mjs:150-158` — `canAutoApproveValidate`
  (`gate-bypass D6`), dùng lại 2 check đầu, đổi check thứ ba sang verdict.
- `src/state/gate-bypass.mjs:94-99` — `isTierCovered`, so `tierRank <
  levelRank`; `DEFAULT_LEVEL = 'off'` (dòng 25) — mặc định không bypass gì.
- `src/intake/risk-keywords.mjs:18-26` — 34 từ khoá; `matchesKeyword`
  word-boundary-aware.
- **Đo thật trên 675 item của repo này (2026-08-13):** sàn hard-gate dính
  94 item (13.9%); trong đó `audit`(37) + `schema`(28) + `migration`(15) =
  **80/94 = 85%**. Mẫu: `tsk-3wr` "Test suite của fgOS", `tsk-3hb` "Thảo
  luận đổi syntax CLI", `tsk-63c` "Fold role vào gates[id]", `tsk-6b6`
  "judgeDecompose không ghi lý do verdict", `tsk-veg` "Thêm 1 view/verb
  liệt kê work item" — không cái nào không-lùi-được; ba từ đó là từ vựng
  hằng ngày của chính fgOS. Nhóm đúng nghĩa rủi ro (`mất dữ liệu`,
  `data loss`, `sự cố`, `delete`, `breaking change`) chỉ ~18.
  **Hai cảnh báo:** (1) đây là repo tự-host, ở repo sản phẩm khác
  "migration" nhiều khả năng đúng nghĩa DB migration → **không suy rộng
  con số 85% ra ngoài fgOS**; (2) false positive là **fail-safe** — gây
  hỏi thừa, không gây bỏ sót, nên `gate-bypass D4` không nguy hiểm, nó
  **đắt** đúng loại tiền của ưu tiên #2.
- **Đo trục tier (cùng ngày, level `standard`):** phân bố
  `standard` 379 / `light` 191 / `heavy` 105; trục tier chặn 105 item,
  sàn keyword chặn 94, trùng nhau 55 — trục tier đóng góp riêng **50 item**.
- `docs/history/gate-bypass/CONTEXT.md:38-45` — `gate-bypass D1`-`D8`;
  dòng 43 xác nhận `gate-bypass D6` = `seq 9891, tsk-539`, tức cùng một D6
  với dòng D6 trong `docs/history/gate-question-quality-and-routing/
  DISCUSSION.md:734`. **Supersede phải đụng cả hai chỗ.**
- `.claude/skills/fgos-clarifying/SKILL.md:47-65` — tiền lệ "im lặng mặc
  định", nhưng closed-world ở Init; không transferable thẳng sang
  planning/validating (open world) — lý do D3 phải tự định nghĩa tầng A.
- `.claude/skills/fgos-coding-implement/SKILL.md` — đối chứng: stage
  `executing` không có gate nào, chỉ `fgos ask` khi thật sự bí.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — khuôn
  `npm test && POSITIVE && NEGATIVE` + 5 cái bẫy, dùng cho verify của item.
- `impact-analysis: degraded` — `fgos tool query --capability
  impact-analysis --status present` trả `gitnexus` `status: present`,
  nhưng index chậm **228 commit** so với HEAD (`79fead39` vs `2c9a49c3`,
  2026-08-13). `present` không bao giờ có nghĩa index còn tươi (tsk-j7y).
  **Đính chính một dòng bằng chứng, không phải sửa một quyết định đã
  khoá** — dòng này ban đầu ghi `full`, bị reality gate của
  `fgos-coding-validating` bắt; không quyết định D1-D14 nào dựa vào
  blast-radius nên không có D-ID nào bị ảnh hưởng.

## Deferred to planning

- Tên gate record cho gate gộp (`planApprove` / `validateApprove` / tên
  mới) và cách xử item đang in-flight đã mang `gates[id].planApprove`.
  Áp D4: sai thì tự sửa trong một chu kỳ → **rẻ** → assumption, không hỏi.
- Hình dạng JS cụ thể của predicate mới thay `canAutoApprove`/
  `canAutoApproveValidate`; có tách hàm mới hay sửa tại chỗ.
- Cách đọc footprint/spec con cho D10's union khi `plan.md` mới là prose
  (chưa materialize) — đọc từ `plan.md` text hay từ verdict JSON dựng sẵn.
- Vế POSITIVE/NEGATIVE cuối cùng của verify, sau khi chốt câu chữ thật sẽ
  ghim vào hai SKILL.md.

## Outstanding questions

None — mọi quyết định sản phẩm đã khoá (D1-D14). Giao thức hand-back
`planning`→`exploring` đã chốt nằm trong phạm vi item này (D14), không tách
item riêng. Hình dạng triển khai còn lại thuộc `fgos-coding-planning`, liệt
kê ở mục "Deferred to planning" phía trên.
