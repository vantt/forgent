# Bounded runner rationale re-review — 14 rows

Author session: codex-session:unit-run-1792071833745-bbef008d@2026-10-15
Content commit: b80e8c16c94cb04c80cc4e858933a9b2a04ddc60
Registry/request reused: 07d3dec1b
Input/review-report commit: 11fc7590f7d0af4da10205359516aee0b0bff5c9
Review mode: ordinary

Exactly 14 pending source rows, all supersede. Review only the corrected rationale against the prior rework note, unchanged full source/current-target text and concrete follow-up correction labels. All 256 ok verdicts from the two final reports have been applied separately, Notes verbatim. No docs bytes or registry changed; no new sync. Full JSON sidecar: [evidence](review-request-runner-rationale-rereview-b80e8c16c.md.json). Evidence SHA256 is JSON.stringify(payload,null,2) excluding evidenceDigest/sourceDigest/targetDigest. Source/target digests are native unit digests; shown-text SHA256 fields retain their original meaning.

A36: all 14 entries mandatory deep read. Reviewer owns any seeds/draw and verdicts; author chooses none. Return ordinary five-cell claimId/verdict/note/sourceDigest/targetDigest rows with your reviewer identity. No review outcome is preselected. Step 9 closes after these 14 are applied under existing closure rules, then Lead merges main and starts Step 10. Existing residuals, Rings, cutover, promotion truth and fresh-reader obligations persist.

Lead L9-16 accepts both already-reviewed pure-insertion partial-carry approaches and requires strict verbatim residual going forward. Lead L9-17 accepts truth-03 and queues its canAdvanceEdge overbreadth at loop.mjs:1689-1695 for promotion truth checking. Neither decision changes the 14 submitted document units.

Correction evidence remains in [follow-up corrections](step9-a42-followup-corrections.json); complete labels per row appear below. Only rationale differs from the reviewed b80e8c16c row.

## claim_c989dc1877e144abd29d133c0a59efc9

Correction labels: followup-truth-09. Disposition: supersede. Status: pending.

Source digest: 0a8a86fc6704a4bb9bd73ffe0841504d8517b26dc4cb74d8437009bd04be46ae
Target digest: 637ef875f1e436e19b19e1f85ee124b2ac8a67dced524e9ef926c92b84cfc556
Evidence digest: 1fad5b54362b80a3b969c909bbe1f122f70efe9efc1dfd68b792e113529e271f

Prior reviewer note (verbatim):

deep: block Unheaded block 29 source L301-308 to operations/h-51f5cd7279fd.md#unheaded-block-17; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-09) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-09), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 0a8a86fc and target digest 637ef875 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-09); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-29 (lines 301–308) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-17. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-29 with docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-17. Labelled follow-up corrections followup-truth-09 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-29:

````text
**Phần (b) — stream-json qua executor args (backlog STR39, KHÔNG CẦN CODE riêng):**
`.fgos/config.json`'s `runner.executor.args` đã là một mẫu Host Adapter (Data
Dictionary #1) — thêm một cờ như `--output-format stream-json` vào đó (nếu
CLI trợ lý hỗ trợ) chỉ đổi NỘI DUNG stdout trợ lý phát ra, không đổi đường đi
của nó: dispatch.mjs vẫn tee từng chunk y hệt bất kể định dạng (JSON-lines
hay text thường), worker-log.mjs vẫn là cửa ghi duy nhất. Không có nhánh code
nào phân biệt định dạng output — vì không cần: đây thuần là cấu hình, không
phải một tính năng runner phải hiểu.
````

Full unchanged target docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-17:

````text
**Phần (b) — Added in candidate: stream-json / current log correction.**
An executor's output-format argument may change its stdout format when its
CLI supports it. That does not imply a per-chunk tee to the item log: the
current Work loop writes the Unit run capture pointer on run creation, then
appends settled stdout/stderr through `appendWorkerLog`. Inspect the Unit
capture referenced by that pointer for output during the run. Evidence:
`src/runner/loop.mjs:1110-1112,1150-1163`; the old STR39 tee description is
historical, not the current item-log contract.
````


## claim_0686418ae7571d82eade8059c698709d

Correction labels: followup-truth-12. Disposition: supersede. Status: pending.

Source digest: 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7
Target digest: b860dec045aac1ef7bd041e99451ae747df3b3bdcedee268b427ec9eda3ee667
Evidence digest: b3fd2d402b9dd2d805b4fc7327e85ec7c6fb78d48dacc98144c88b93269c934f

Prior reviewer note (verbatim):

deep: heading Actors & Access source L941-941 to subcomponents/h-6df5686d0d54/spec.md#actors-access; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-12) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-12), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 3f682e32 and target digest b860dec0 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-12); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#actors-access (lines 941–941) carried at docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#actors-access with docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access. Labelled follow-up corrections followup-truth-12 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#actors-access:

````text
## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |
````

Full unchanged target docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access:

````text
## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4373`) | Historical operator role | — | — |
````


## claim_add6d13e14df87ad5d5bd46cc5bb98d4

Correction labels: followup-truth-12. Disposition: supersede. Status: pending.

Source digest: 81c2724820c499b40d0e4d2964c798263c2ad99a479582176a95ee13b7f4d24e
Target digest: 69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f
Evidence digest: 0e3a2fbcc441d7c322c186c0d4fe7a1ec5b2b54f2a339f4641440c3312af1519

Prior reviewer note (verbatim):

deep: block Unheaded block 60 source L943-950 to subcomponents/h-6df5686d0d54/spec.md#unheaded-block-3; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-12) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-12), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 81c27248 and target digest 69f0927e differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-12); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-60 (lines 943–950) carried at docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-60 with docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#unheaded-block-3. Labelled follow-up corrections followup-truth-12 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-60:

````text
| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |
````

Full unchanged target docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#unheaded-block-3:

````text
| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4373`) | Historical operator role | — | — |
````


## claim_3ff43c5fd67cb1df9a9c2f81a0849057

Correction labels: followup-truth-06, followup-truth-07, followup-truth-08. Disposition: supersede. Status: pending.

Source digest: c60f41f6b57f862e13f7d0f9d2813b90da9822cd05e4f9df5612ca6b5b7e672d
Target digest: b8280518ac1d2f020be1040eb91e63467e9626fed7f82749f70fc0c534403893
Evidence digest: e58fe3c425708c972f539c59575ad451d72988edf1f4fa7795812d1be601dc90

Prior reviewer note (verbatim):

deep: block Unheaded block 63 source L988-996 to subcomponents/h-6979005beaf7/spec.md#unheaded-block-5; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-06, followup-truth-07, followup-truth-08) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-06, followup-truth-07, followup-truth-08), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest c60f41f6 and target digest b8280518 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-06, followup-truth-07, followup-truth-08); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-63 (lines 988–996) carried at docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-63 with docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-5. Labelled follow-up corrections followup-truth-06, followup-truth-07, followup-truth-08 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-63:

````text
- **RUL32 (vòng tự cải thiện chỉ nhắm vào chính repo sản phẩm, không phải tính năng mở cho host ngoài).** Toàn bộ vòng self-improve (Gate A, Iron Law, và Gate B wiring — cả ba đã xây, STR13 hoàn tất) tác động lên chính `repo/src` của fgOS — công cụ fgOS tự soi lại chính nó, không phải một khả năng fgOS cấp cho project khác mà nó đang điều phối (per self-improve-loop / c8df2479).
- **RUL33 (vòng tự cải thiện luôn on-demand, không bao giờ một nhánh tự động của vòng dispatch thường).** Không bước nào của `fgos-runner --once`/`--dry-run` tự khởi động Gate A hay bất kỳ bước nào sau nó — toàn vòng self-improve chỉ chạy khi người vận hành gọi tay qua verb riêng (`evolve`, và các verb Iron Law/Gate B của slice sau). Lý do: STR9 (auto-merge đề xuất worker) vẫn `awaiting-approval`, chưa đủ tin cậy để mở thêm bề mặt tự động quanh việc tự sửa hệ thống (per self-improve-loop / cb09d6fd).
- **RUL34 (Iron Law áp dụng khi CHẠM cờ rủi ro HOẶC module năng-lực — không cần cả hai).** Phán quyết Iron Law là phép HOẶC của hai phép thử độc lập trên một candidate fix: phép thử module (danh sách minh họa, mở rộng) và phép thử từ khóa (bộ từ khóa rủi ro nặng dùng chung với `fgos submit`, mở rộng). Mô tả fix vắng mặt KHÔNG BAO GIỜ được coi là bằng chứng an toàn — phán quyết vẫn tính đủ từ phép thử module một mình. Danh sách module là minh họa, không đóng khung (per self-improve-loop; xem phép thử năng lực gốc: một module đủ tư cách nếu sửa nó có thể làm YẾU hoặc BỎ QUA chính kỷ luật gate/verify của hệ) (per self-improve-loop). **Phạm vi TÍNH và hệ quả (per `0032`):** phép HOẶC này chỉ được TÍNH khi merge target là trunk — một đề xuất land vào `fgw/<root>` hay vào nhánh cha không bao giờ chạy tới phép thử này, nên "không khớp" và "không được hỏi" là hai kết cục khác nhau, đừng đọc lẫn (xem RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) cho ranh giới, RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) cho cấu hình). Bản thân `classifyIronLaw` không đổi: cùng chữ ký, cùng hai phép thử, cùng bằng chứng `matchedFlags`/`matchedModules` — cái `0032` đổi là chỗ nó được gọi và chuyện gì xảy ra khi `required: true` (mức `ask` từ chối cứng; mức `warn` cảnh báo, ghi bản ghi, rồi merge tiếp).
- **RUL35 (bộ từ khóa rủi ro nặng là MỘT nguồn duy nhất, dùng chung giữa intake và Iron Law).** Bộ từ khóa quyết định tier `heavy` lúc `fgos submit` (xem spec Work-State "Nộp vấn đề tự do (submit)", RUL16 (điểm entropy luôn giải thích được, luôn kèm xu hướng)) và bộ từ khóa quyết định phép thử-từ-khóa của Iron Law là ĐÚNG MỘT bộ dữ liệu — không hai danh sách lệch nhau theo thời gian. Mở rộng bộ này (thêm nhóm hệ-thống-ngoài/bỏ-kiểm-tra/kiểm-toán) đồng thời làm `fgos submit` phân loại nặng hơn cho các mô tả trùng từ khóa mới — một hệ quả CHỦ Ý, không phải hồi quy (per self-improve-loop).
- **RUL36 (`evolve --submit` là hành động ghi DUY NHẤT trên bề mặt evolve, tái dùng CHÍNH cửa `submit`).** `fgos evolve --submit <id>` không tự viết logic tạo-việc riêng — nó soạn một mô tả người-đọc-được từ các trường của candidate (id/disposition/errorClass/layer/attempts/detail, bỏ qua trường vắng mặt thay vì in literal "undefined") rồi gọi CÙNG hàm `submitWork` mà verb `submit` tự dùng (tách ra khỏi thân `submit` đúng cho mục đích này, hành vi `submit` giữ byte-identical trước/sau tách). `evolve` (không cờ) và `evolve --pick <id>` giữ nguyên đọc-thuần tuyệt đối như Slice 1, không đổi bởi cell này (per self-improve-loop).
- **RUL38 (vận chuyển GitHub là MỘT cổng duyệt, không phải một luật thứ hai — github-adapter D1/D3/D5).** `review --github`/`approve --github` không tạo cạnh FSM mới, không đổi role cho `done` (vẫn `human`), và không đổi khuôn `blocked`+friction — CHỈ đổi chỗ xem-diff và chỗ merge sang GitHub. Chỉ áp dụng cho nguồn runner; một GitHub-side gãy KHÔNG BAO GIỜ tự hạ cấp về đường cục bộ (cùng nguyên tắc RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do) áp cho vận chuyển này). Ba giới hạn đã biết, ghi ở Open Gaps: không dọn nhánh sau merge qua GitHub (khác RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do)'s dọn nhánh cục bộ), gãy merge không phân biệt "chưa đủ lượt duyệt" khỏi lỗi thật khác (đều `blocked` như nhau), và đề xuất CON chưa có đường đẩy nhánh của GỐC nên `review --github` không dùng được cho con trên GitHub thật.
- **RUL37 (Iron Law hỏi ở ĐÚNG MỘT ranh giới — trunk — cho MỌI đề xuất nguồn runner tới đó, không riêng gì evolve, không riêng gì vận chuyển cục bộ).** Ngay sau các guard nhận-dạng-worktree hiện có (registry + cấu trúc) và TRƯỚC CẢ nhánh `--github`, `approve` chạy `classifyIronLaw({filesChanged, description})` trên chính đề xuất đang duyệt (`filesChanged` từ `changedFiles`, `description` từ `item.description`) — áp dụng bất kể đề xuất tới từ `evolve --submit`, `add`, hay `submit` thường, VÀ bất kể merge qua cục bộ hay qua GitHub (review-20260718-self-improve-loop f01: trước đây chặn này chỉ nằm trong nhánh merge cục bộ, nên `approve --github` từng bỏ-qua-hoàn-toàn gate này — một lỗ hổng thật, không phải "chưa xây"), vì bài toán hỏi diff này có NĂNG LỰC làm yếu kỷ luật gate/verify của hệ hay không, không phải nó tới từ đâu hay merge bằng đường nào. **RANH GIỚI (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`): chỉ chạy khi merge target là trunk.** `approve` chỉ classify khi `resolveRoot(view, id) === id` — một leaf land vào `fgw/<root>` đi thẳng, không hỏi, vì không gì tới được trunk ở bước đó; pre-check thuần của `merge next` soi gương đúng biểu thức ấy. `sync-root` dùng discriminator KHÁC — `!item.parent` — và cố ý không gộp chung: verb đó chỉ land vào cha TRỰC TIẾP (`targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot)`), còn `resolveRoot` leo tới đỉnh lineage, nên dùng chung một helper sẽ trip cổng trên một merge không bao giờ đi gần trunk (một gốc có cha mà cha lại có ông). Hai biểu thức riêng là CHỦ Ý, không phải copy-paste sót. `required: true` mà thiếu `--acknowledge-iron-law` (cờ boolean, cùng khuôn phân tích cờ với `--async`/`--unattended` của `submit` — không phải cờ mang giá trị như `--timeout`) → hệ quả do `ironLaw.level` quyết (RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)): ở `ask` (mặc định) từ chối cứng (`StoreError('validation', …)`), nêu tên đúng matchedFlags/matchedModules, đề xuất giữ nguyên `awaiting-approval`, không git nào chạy; ở `warn` (opt-in) in cảnh báo ra stderr nêu đúng matchedFlags/matchedModules, ghi MỘT bản ghi `decision` mang `kind: engine` qua `addDecision` (không shell ra `fgos decision`, verb đó không có `--kind`), rồi merge tiếp. Bản ghi mức `warn` ghi TRƯỚC lần merge nó cho phép, không phải sau: nhật ký nói "cổng đã bị bỏ qua", không nói "merge đã xong", nên một merge gãy sau đó vẫn để bản ghi đứng đúng — fgOS không bao giờ tự nhận đã "chứng minh được" một test đỏ chạy trước khi fix (không có hạ tầng theo-dõi lịch-sử đỏ/xanh nào tồn tại); `--acknowledge-iron-law` là cử chỉ CHỦ Ý của người duyệt xác nhận điều đó thay hệ thống, không phải một xác minh cơ học. **Ai quyết, ai gõ (per `0032`):** cử chỉ đó vẫn là của người, nhưng người không phải gõ lệnh — một agent trình bán kính (verb nào, target nào, bao nhiêu item đi kèm) cộng `docs/history/<id>/iron-law-evidence.md` NGUYÊN VĂN, hỏi một lần, và chỉ khi người trả lời duyệt trong chat mới tự chạy lệnh kèm cờ, tự đọc exit code, tự sửa lỗi cơ học rồi retry. Bên thứ hai độc lập thật sự nhìn vào bằng chứng vẫn là điều kiện (`docs/explanation/iron-law-evidence-contract-stays-human-gated.md`); không agent nào được tự thêm cờ trên thẩm quyền của chính nó. **Một item bị giữ không nghẽn item khác (per `0032`):** engine trả sẵn `skipped` / `every ready item is blocked`, nên vòng quét merge ghi id vào danh sách rồi đi tiếp sang ứng viên sau và trình gom một lượt ở cuối; item bị giữ ở NGUYÊN `awaiting-approval` — không `fgos ask`, không `awaiting-human`, không cạnh FSM mới. **Ranh giới CHỦ Ý:** chỉ nguồn `runner` đi qua chặn này — nguồn `pull`/`legacy` (code đã do người tự tay commit thẳng lên main) không đi qua, vì code đó đã là lịch sử theo thang bền vững, không phải một diff đang chờ merge lần đầu (per self-improve-loop — mệnh đề "chặn cứng, ở mọi ranh giới merge, không có mức nào khác" của đã bị supersede bởi `0032`; phần "một điểm chung cho mọi đề xuất nguồn runner tới trunk" giữ nguyên hiệu lực).
- **RUL64 (`ironLaw.level` — key config RIÊNG của cổng Iron Law, fail-closed về `ask`).** Mức đẩy lại của cổng nằm ở `ironLaw.level` trong file cấu hình dùng chung (`.fgos/config.json`), đúng hai giá trị: `ask` (mặc định) và `warn` (opt-in). Key này **không** bao giờ được gộp vào `gateBypass` — floor của `gateBypass` được ghi rõ là không bao giờ chạm Iron Law (`docs/explanation/gate-bypass-design.md`), nên tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi thứ không phải đúng chữ `warn` đều đọc thành `ask`: key vắng mặt, file cấu hình hỏng, giá trị gõ sai, giá trị không phải string — cùng kỷ luật fail-closed mà `--acknowledge-iron-law` đã dùng cho phép thử boolean-trần của nó (review-20260718-self-improve-loop f02), và ở đây còn quan trọng hơn vì mức dễ dãi mới là mức để một diff tự-sửa land mà không ai xem. Đăng ký đủ ba chân theo khuôn `gateBypass` (`src/setup/registrations.mjs`): một config default để `fgos setup` merge vào, một check để `fgos doctor` báo khi key thiếu/không nhận ra, và một fix để `fgos doctor --fix` ghi mặc định `ask` — một dự án chưa từng chạy `fgos setup` vẫn nhận hành vi từ chối, không phải hành vi dễ dãi (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`).
- **RUL31 (kỷ-luật-output NỚI RỘNG: console + bản ghi cục bộ riêng-từng-việc, KHÔNG BAO GIỜ vào cây committed — SUPERSEDE một phần quyết định trước).** Trước đây output của trợ lý chỉ in console, không ghi ra file nào. Nay MỌI kết cục của một lượt dispatch — thành đề xuất, chấm-trượt, quá-giờ, hỏng-spawn (kể cả tràn bộ đệm) — đều CÒN được ghi thêm vào một bản ghi cục bộ, một file riêng mỗi việc, gộp theo thời gian qua các lần thử. Nửa bảo đảm gốc vẫn giữ nguyên tuyệt đối: bản ghi này không bao giờ vào cây committed (không git-track được) — chỉ nửa "không ghi ra file nào cả" bị nới. Một lượt dispatch hỏng trước khi trợ lý sinh ra output (lỗi worktree, không phải lỗi trợ lý) vẫn ghi được một khối (chỉ mang loại lỗi + thông điệp), không throw vì thiếu trường (per worker-dispatch-log / 8575f1a3). **Bổ chú (20260717, review-20260717-daily-batch, review finding F-STR1-1):** bản ghi cục bộ này KHÔNG BAO GIỜ throw ra ngoài, dù chính thao tác ghi thất bại (đĩa đầy, không có quyền ghi, thư mục chỉ-đọc) — bản ghi này là quan sát thuần, không bao giờ được phép làm hỏng hay che khuất kết cục dispatch thật; một lần ghi hỏng chỉ âm thầm bỏ qua (trả về rỗng), không bao giờ lan ra ngoài `dispatchClaimedItem`.
````

Full unchanged target docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-5:

````text
- **RUL32 (vòng tự cải thiện chỉ nhắm vào chính repo sản phẩm, không phải tính năng mở cho host ngoài).** Toàn bộ vòng self-improve (Gate A, Iron Law, và Gate B wiring — cả ba đã xây, STR13 hoàn tất) tác động lên chính `repo/src` của fgOS — công cụ fgOS tự soi lại chính nó, không phải một khả năng fgOS cấp cho project khác mà nó đang điều phối (per self-improve-loop / c8df2479).
- **RUL33 (Added in candidate — former evolve contract; verb removed, not a current CLI surface; vòng tự cải thiện luôn on-demand, không bao giờ một nhánh tự động của vòng dispatch thường).** Không bước nào của `fgos-runner --once`/`--dry-run` tự khởi động Gate A hay bất kỳ bước nào sau nó — toàn vòng self-improve chỉ chạy khi người vận hành gọi tay qua verb riêng (`evolve`, và các verb Iron Law/Gate B của slice sau). Lý do: STR9 (auto-merge đề xuất worker) vẫn `awaiting-approval`, chưa đủ tin cậy để mở thêm bề mặt tự động quanh việc tự sửa hệ thống (per self-improve-loop / cb09d6fd).
- **RUL34 (Iron Law áp dụng khi CHẠM cờ rủi ro HOẶC module năng-lực — không cần cả hai).** Phán quyết Iron Law là phép HOẶC của hai phép thử độc lập trên một candidate fix: phép thử module (danh sách minh họa, mở rộng) và phép thử từ khóa (bộ từ khóa rủi ro nặng dùng chung với `fgos submit`, mở rộng). Mô tả fix vắng mặt KHÔNG BAO GIỜ được coi là bằng chứng an toàn — phán quyết vẫn tính đủ từ phép thử module một mình. Danh sách module là minh họa, không đóng khung (per self-improve-loop; xem phép thử năng lực gốc: một module đủ tư cách nếu sửa nó có thể làm YẾU hoặc BỎ QUA chính kỷ luật gate/verify của hệ) (per self-improve-loop). **Phạm vi TÍNH và hệ quả (per `0032`):** phép HOẶC này chỉ được TÍNH khi merge target là trunk — một đề xuất land vào `fgw/<root>` hay vào nhánh cha không bao giờ chạy tới phép thử này, nên "không khớp" và "không được hỏi" là hai kết cục khác nhau, đừng đọc lẫn (xem RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) cho ranh giới, RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) cho cấu hình). Bản thân `classifyIronLaw` không đổi: cùng chữ ký, cùng hai phép thử, cùng bằng chứng `matchedFlags`/`matchedModules` — cái `0032` đổi là chỗ nó được gọi và chuyện gì xảy ra khi `required: true` (mức `ask` từ chối cứng; mức `warn` cảnh báo, ghi bản ghi, rồi merge tiếp).
- **RUL35 (bộ từ khóa rủi ro nặng là MỘT nguồn duy nhất, dùng chung giữa intake và Iron Law).** Bộ từ khóa quyết định tier `heavy` lúc `fgos submit` (xem spec Work-State "Nộp vấn đề tự do (submit)", RUL16 (điểm entropy luôn giải thích được, luôn kèm xu hướng)) và bộ từ khóa quyết định phép thử-từ-khóa của Iron Law là ĐÚNG MỘT bộ dữ liệu — không hai danh sách lệch nhau theo thời gian. Mở rộng bộ này (thêm nhóm hệ-thống-ngoài/bỏ-kiểm-tra/kiểm-toán) đồng thời làm `fgos submit` phân loại nặng hơn cho các mô tả trùng từ khóa mới — một hệ quả CHỦ Ý, không phải hồi quy (per self-improve-loop).
- **RUL36 (Added in candidate — former evolve contract; verb removed, not a current CLI surface; `evolve --submit` là hành động ghi DUY NHẤT trên bề mặt evolve, tái dùng CHÍNH cửa `submit`).** `fgos evolve --submit <id>` không tự viết logic tạo-việc riêng — nó soạn một mô tả người-đọc-được từ các trường của candidate (id/disposition/errorClass/layer/attempts/detail, bỏ qua trường vắng mặt thay vì in literal "undefined") rồi gọi CÙNG hàm `submitWork` mà verb `submit` tự dùng (tách ra khỏi thân `submit` đúng cho mục đích này, hành vi `submit` giữ byte-identical trước/sau tách). `evolve` (không cờ) và `evolve --pick <id>` giữ nguyên đọc-thuần tuyệt đối như Slice 1, không đổi bởi cell này (per self-improve-loop).
- **RUL38 (vận chuyển GitHub là MỘT cổng duyệt, không phải một luật thứ hai — github-adapter D1/D3/D5).** `review --github`/`approve --github` không tạo cạnh FSM mới, không đổi role cho `done` (vẫn `human`), và không đổi khuôn `blocked`+friction — CHỈ đổi chỗ xem-diff và chỗ merge sang GitHub. Chỉ áp dụng cho nguồn runner; một GitHub-side gãy KHÔNG BAO GIỜ tự hạ cấp về đường cục bộ (cùng nguyên tắc RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do) áp cho vận chuyển này). Ba giới hạn đã biết, ghi ở Open Gaps: không dọn nhánh sau merge qua GitHub (khác RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do)'s dọn nhánh cục bộ), gãy merge không phân biệt "chưa đủ lượt duyệt" khỏi lỗi thật khác (đều `blocked` như nhau), và đề xuất CON chưa có đường đẩy nhánh của GỐC nên `review --github` không dùng được cho con trên GitHub thật.
- **RUL37 (Iron Law hỏi ở ĐÚNG MỘT ranh giới — trunk — cho MỌI đề xuất nguồn runner tới đó, không riêng gì evolve, không riêng gì vận chuyển cục bộ).** Ngay sau các guard nhận-dạng-worktree hiện có (registry + cấu trúc) và TRƯỚC CẢ nhánh `--github`, `approve` chạy `classifyIronLaw({filesChanged, description})` trên chính đề xuất đang duyệt (`filesChanged` từ `changedFiles`, `description` từ `item.description`) — áp dụng bất kể đề xuất tới từ `add` hay `submit` thường (`evolve --submit` là ví dụ lịch sử của cửa đã xoá; Added in candidate), VÀ bất kể merge qua cục bộ hay qua GitHub (review-20260718-self-improve-loop f01: trước đây chặn này chỉ nằm trong nhánh merge cục bộ, nên `approve --github` từng bỏ-qua-hoàn-toàn gate này — một lỗ hổng thật, không phải "chưa xây"), vì bài toán hỏi diff này có NĂNG LỰC làm yếu kỷ luật gate/verify của hệ hay không, không phải nó tới từ đâu hay merge bằng đường nào. **RANH GIỚI (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`): chỉ chạy khi merge target là trunk.** `approve` chỉ classify khi `resolveRoot(view, id) === id` — một leaf land vào `fgw/<root>` đi thẳng, không hỏi, vì không gì tới được trunk ở bước đó; pre-check thuần của `merge next` soi gương đúng biểu thức ấy. `sync-root` dùng discriminator KHÁC — `!item.parent` — và cố ý không gộp chung: verb đó chỉ land vào cha TRỰC TIẾP (`targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot)`), còn `resolveRoot` leo tới đỉnh lineage, nên dùng chung một helper sẽ trip cổng trên một merge không bao giờ đi gần trunk (một gốc có cha mà cha lại có ông). Hai biểu thức riêng là CHỦ Ý, không phải copy-paste sót. `required: true` mà thiếu `--acknowledge-iron-law` (cờ boolean, cùng khuôn phân tích cờ với `--async`/`--unattended` của `submit` — không phải cờ mang giá trị như `--timeout`) → hệ quả do `ironLaw.level` quyết (RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)): ở `ask` (mặc định) từ chối cứng (`StoreError('validation', …)`), nêu tên đúng matchedFlags/matchedModules, đề xuất giữ nguyên `awaiting-approval`, không git nào chạy; ở `warn` (opt-in) in cảnh báo ra stderr nêu đúng matchedFlags/matchedModules, ghi MỘT bản ghi `decision` mang `kind: engine` qua `addDecision` (không shell ra `fgos decision`, verb đó không có `--kind`), rồi merge tiếp. Bản ghi mức `warn` ghi TRƯỚC lần merge nó cho phép, không phải sau: nhật ký nói "cổng đã bị bỏ qua", không nói "merge đã xong", nên một merge gãy sau đó vẫn để bản ghi đứng đúng — fgOS không bao giờ tự nhận đã "chứng minh được" một test đỏ chạy trước khi fix (không có hạ tầng theo-dõi lịch-sử đỏ/xanh nào tồn tại); `--acknowledge-iron-law` là cử chỉ CHỦ Ý của người duyệt xác nhận điều đó thay hệ thống, không phải một xác minh cơ học. **Ai quyết, ai gõ (per `0032`):** cử chỉ đó vẫn là của người, nhưng người không phải gõ lệnh — một agent trình bán kính (verb nào, target nào, bao nhiêu item đi kèm) cộng `docs/history/<id>/iron-law-evidence.md` NGUYÊN VĂN, hỏi một lần, và chỉ khi người trả lời duyệt trong chat mới tự chạy lệnh kèm cờ, tự đọc exit code, tự sửa lỗi cơ học rồi retry. Bên thứ hai độc lập thật sự nhìn vào bằng chứng vẫn là điều kiện (`docs/explanation/iron-law-evidence-contract-stays-human-gated.md`); không agent nào được tự thêm cờ trên thẩm quyền của chính nó. **Một item bị giữ không nghẽn item khác (per `0032`):** engine trả sẵn `skipped` / `every ready item is blocked`, nên vòng quét merge ghi id vào danh sách rồi đi tiếp sang ứng viên sau và trình gom một lượt ở cuối; item bị giữ ở NGUYÊN `awaiting-approval` — không `fgos ask`, không `awaiting-human`, không cạnh FSM mới. **Ranh giới CHỦ Ý:** chỉ nguồn `runner` đi qua chặn này — nguồn `pull`/`legacy` (code đã do người tự tay commit thẳng lên main) không đi qua, vì code đó đã là lịch sử theo thang bền vững, không phải một diff đang chờ merge lần đầu (per self-improve-loop — mệnh đề "chặn cứng, ở mọi ranh giới merge, không có mức nào khác" của đã bị supersede bởi `0032`; phần "một điểm chung cho mọi đề xuất nguồn runner tới trunk" giữ nguyên hiệu lực).
- **RUL64 (`ironLaw.level` — key config RIÊNG của cổng Iron Law, fail-closed về `ask`).** Mức đẩy lại của cổng nằm ở `ironLaw.level` trong file cấu hình dùng chung (`.fgos/config.json`), đúng hai giá trị: `ask` (mặc định) và `warn` (opt-in). Key này **không** bao giờ được gộp vào `gateBypass` — floor của `gateBypass` được ghi rõ là không bao giờ chạm Iron Law (`docs/explanation/gate-bypass-design.md`), nên tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi thứ không phải đúng chữ `warn` đều đọc thành `ask`: key vắng mặt, file cấu hình hỏng, giá trị gõ sai, giá trị không phải string — cùng kỷ luật fail-closed mà `--acknowledge-iron-law` đã dùng cho phép thử boolean-trần của nó (review-20260718-self-improve-loop f02), và ở đây còn quan trọng hơn vì mức dễ dãi mới là mức để một diff tự-sửa land mà không ai xem. Đăng ký đủ ba chân theo khuôn `gateBypass` (`src/setup/registrations.mjs`): một config default để `fgos setup` merge vào, một check để `fgos doctor` báo khi key thiếu/không nhận ra, và một fix để `fgos doctor --fix` ghi mặc định `ask` — một dự án chưa từng chạy `fgos setup` vẫn nhận hành vi từ chối, không phải hành vi dễ dãi (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`).
- **RUL31 (kỷ-luật-output NỚI RỘNG: console + bản ghi cục bộ riêng-từng-việc, KHÔNG BAO GIỜ vào cây committed — SUPERSEDE một phần quyết định trước).** Trước đây output của trợ lý chỉ in console, không ghi ra file nào. Nay MỌI kết cục của một lượt dispatch — thành đề xuất, chấm-trượt, quá-giờ, hỏng-spawn (kể cả tràn bộ đệm) — đều CÒN được ghi thêm vào một bản ghi cục bộ, một file riêng mỗi việc, gộp theo thời gian qua các lần thử. Nửa bảo đảm gốc vẫn giữ nguyên tuyệt đối: bản ghi này không bao giờ vào cây committed (không git-track được) — chỉ nửa "không ghi ra file nào cả" bị nới. Một lượt dispatch hỏng trước khi trợ lý sinh ra output (lỗi worktree, không phải lỗi trợ lý) vẫn ghi được một khối (chỉ mang loại lỗi + thông điệp), không throw vì thiếu trường (per worker-dispatch-log / 8575f1a3). **Bổ chú (20260717, review-20260717-daily-batch, review finding F-STR1-1):** bản ghi cục bộ này KHÔNG BAO GIỜ throw ra ngoài, dù chính thao tác ghi thất bại (đĩa đầy, không có quyền ghi, thư mục chỉ-đọc) — bản ghi này là quan sát thuần, không bao giờ được phép làm hỏng hay che khuất kết cục dispatch thật; một lần ghi hỏng chỉ âm thầm bỏ qua (trả về rỗng), không bao giờ lan ra ngoài `dispatchClaimedItem`.
````


## claim_4b223132b77128c46c544871c36a8e3b

Correction labels: followup-truth-05. Disposition: supersede. Status: pending.

Source digest: a887e766b249d14101e5359838cc0150d1ba01b7178c3bde49ee080066ade0ce
Target digest: b7889c4d1e65be6918b7184594b540b8ead2d8d13d4266f8e0101a6af2375aba
Evidence digest: f98efdfcc1e20270488b97c6cc1f8d024f6502b263677aacdc3a32a5eb88e39f

Prior reviewer note (verbatim):

deep: block Unheaded block 64 source L998-1005 to subcomponents/h-6979005beaf7/spec.md#unheaded-block-6; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-05) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-05), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest a887e766 and target digest b7889c4d differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-05); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-64 (lines 998–1005) carried at docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-64 with docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-6. Labelled follow-up corrections followup-truth-05 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-64:

````text
- **RUL39 (ĐÃ XÂY — backlog STR39, cell live-worker-log-1).** Bản ghi output cục bộ của một việc nhận output theo THỜI GIAN THỰC: từng mảnh output của trợ lý được nối vào bản ghi ngay khi đến (`appendWorkerLogChunk`, worker-log.mjs — cùng cửa ghi DUY NHẤT với khối kết-cục cuối, không mở cửa thứ hai), thay vì chỉ một khối sau khi lượt dispatch kết thúc — người vận hành theo dõi được một worker đang chạy bằng `tail -f .fgos/logs/<id>.log`, mỗi việc một bản ghi nên nhiều worker song song không giẫm dòng nhau. `spawnWorker` (dispatch.mjs) gọi chunk này qua `opts.onChunk(stream, chunk)` ngay trên mỗi sự kiện `data` của stdout/stderr, bọc try/catch để một callback ghi hỏng không bao giờ làm gãy dispatch thật. Khối kết-cục cuối (kể cả quá-giờ/hỏng-spawn) vẫn ghi đủ như RUL31 (kỷ-luật-output nới rộng: console + bản ghi cục bộ riêng-từng-việc, không bao giờ vào cây committed), không đổi vị trí gọi hay bảo đảm, và bảo đảm không-vào-cây-committed giữ nguyên tuyệt đối (per D 644916a4). Xem thêm "Xem live output worker khi đang chạy" ở trên.
- **RUL40 (đã xây — STR40, `scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs`).** Vận hành qua herdr là chế độ được hỗ trợ chính thức (D d3dbe7f5, supersedes D ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux→herdr): một phiên chuẩn bốn pane — (1) vòng runner lặp (`fgos-runner --once` trong shell loop, đứng trên `runner.lock` + idempotent, không flag mới), (2) theo dõi output live từng việc (`tail -F .fgos/logs/*.log`, đứng trên RUL39 (đã xây — backlog STR39, cell live-worker-log-1)), (3) cửa thao tác của người (nộp/trả lời/duyệt, shell tương tác thuần), (4) bảng trạng thái + chuông chờ-người gộp một pane (`herdr-cockpit-notify.mjs`: poll `fgos list --json`, in dòng trạng thái + gọi `herdr notification show` đúng MỘT LẦN khi một việc MỚI vào `awaiting-human` — không lặp lại khi việc vẫn đứng yên ở trạng thái đó, gọi lại nếu việc rời rồi quay lại) — kèm một trang runbook trong docs sản phẩm (`docs/operator-runbook-herdr-cockpit.md`). **LUẬT CỨNG (re-scope 2026-09-06 — decision "RUL40 (herdr là transport và failure detector cho Dispatch, không bao giờ là nguồn sự thật hay receipt) re-scope", scope `runner`, `supersedes:d3dbe7f5`; phát biểu cũ dưới đây giữ làm lịch sử):** herdr KHÔNG BAO GIỜ là nguồn sự thật hay delivery receipt cho bất kỳ trạng thái fgOS hay kết quả Run nào — trạng thái Work luôn qua fgOS CLI (`fgos list`/`rollup`/`triage`), kết quả Run luôn qua file do chính worker ghi (ack/result trong outbox của Run) cộng liveness ladder. Trong phạm vi đó, Dispatch ĐƯỢC dùng agent API của herdr (`agent start`, `agent prompt --wait`, `agent wait`, `agent read`, `pane process-info`) làm **transport** và **failure detector** (`agent_not_ready`, `agent_prompt_stalled`, `blocked`, agent vắng mặt); `agent_status` idle/working/done không bao giờ được đọc thành "xong" hay "đã nhận prompt". Cockpit chrome (`pane split`/`pane run`/`pane read`/`tab create`/`notification show`) giữ nguyên. **Ladder và outcome (dispatch visibility V0):** một vòng dispatch interactive kết thúc theo đúng thứ tự — file result do chính worker ghi (thắng mọi tín hiệu khác, kể cả process đã biến mất), rồi `blocked`, rồi `died` (nhiều lần absent LIÊN TIẾP; một lần `unknown` reset bộ đếm, và đọc liveness hỏng luôn trả `unknown` chứ không bao giờ `absent`), rồi trần tuyệt đối, cuối cùng mới tới đứng-im. Bảy outcome có tên (`settled`, `blocked`, `died`, `timed-out-idle`, `timed-out-ceiling`, `paused-limit`, cộng `unsignaled` của ladder cũ cho adapter không tự khai) thay cho một chữ timeout chung; chỉ `settled` mới đóng pane, `paused-limit` giữ pane kể cả khi caller bật close-always. Màn hình chỉ đọc khi tiến độ đã ngừng, không phải mỗi tick. Chi tiết + lý do: docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md. Lý do re-scope + evidence: `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` §3.3, §4, §14 H1. *Phát biểu cũ (D d3dbe7f5, 2026-07-18, đã superseded):* herdr CHỈ dùng làm chrome — KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định; vi phạm từng gây bug thật ("idle giết agent", dogfood airemote) — bug đó đến từ việc tin `idle` là hoàn thành, không phải từ việc gọi API, và chính điều đó là ranh giới luật mới giữ lại. Đa phiên chung checkout (STR35, đã đóng): herdr tự thương lượng qua `herdr terminal attach --takeover` — hành vi có sẵn của herdr, không phải code mới của cockpit.
  - *Cập nhật 2026-10-05 — pane đã đóng:* câu trả lời `pane_not_found` của herdr cho lần đọc `pane process-info` là một lần đọc, không phải đọc hỏng: pane đã đóng thì không còn agent trong đó, nên tính là `absent` và cộng vào bộ đếm `died` (lý do nêu tên pane). Chỉ mã đó mới vậy; herdr không với tới được, quá hạn hay trả về không đọc được vẫn là `unknown`, và `agent_not_found` một mình cũng không đủ (agent chưa được herdr nhận ra không có nghĩa là pane mất).
- **RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học VĨNH VIỄN, trí tuệ vào qua đúng hai cửa; ĐÃ XÂY — str7-str8-priority-intent).** Vòng chọn-giao của runner không bao giờ gọi một model thông minh: mọi quyết định của nó (việc nào, model nào, tiếp hay dừng) phải tra-bảng hoặc dẫn xuất được từ dữ liệu đã nằm trên item. Trí tuệ vào hệ qua đúng hai cửa — (1) dòng chính: một bộ não thông minh (phiên trợ lý, stage làm-rõ/chia-việc) đọc frontier, chấm điểm, và GHI KẾT LUẬN XUỐNG FIELD của item qua cửa ghi chuẩn (khóa ưu tiên `priority` — người/tác nhân tự khai qua `edit --priority`, xem spec Work-State Data Dictionary #25/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); khóa `intent` — giai đoạn Làm-rõ tự tính, Data Dictionary #26/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); cờ tuần-tự-hóa); picker chỉ đổi khóa sort (frontier v2 — priority ASC, intent DESC, FIFO tie-break, spec Work-State "Đọc (list / ready)"), không đổi bản chất; (2) ngoại lệ có cửa riêng: cửa pull take/return cho một phiên thông minh nhấc đúng một việc ra khỏi dòng máy — kết quả trả về vẫn bị đo lại cơ học như mọi đề xuất. Một trợ lý điều phối không bao giờ trở thành picker; nó là người viết điểm số mà picker đọc (per D f69951df, đã xây per str7-str8-priority-intent).
- **RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`; per-tier `executors.<tier>` rút bởi tsk-in1-2 D6).** Ranh giới executor là một cổng có tên — **CTR009 v2**: registry `EXECUTOR_ADAPTERS` map tên adapter → hàm spawn. Adapter LIVE duy nhất hôm nay là `cli-spawn` (mặc định khi `adapter` vắng mặt trên một khối executor) — chính là hành xử cũ, tách nguyên vẹn ra một hàm riêng (`spawn(command,args,{shell:false})`, timeout trên `'exit'`, maxBuffer tự đếm, `onChunk` tee trước khi đếm). Adapter `rpc`/`app-server` **vẫn deferred, chưa có code** — khai một tên adapter khác `cli-spawn` bị `RunnerConfigError` từ chối ở cả `loadRunnerConfig` lẫn `resolveExecutorCommand` (per D a4fe4c2b). Per-tier override từng có 1 rung trung gian riêng (`executors.<tier>`, giữa `executors.<executorId>` và `executor` toàn cục trong thứ tự ưu tiên) — rút bỏ tại tsk-in1-2 0 entry live trong cấu hình thật, và từng gây bug thật (`tsk-4eu`/`tsk-5tm` — một key không phải tier như `"judge"` rơi thẳng vào `executor` chung, không lỗi). `cfg.executors` giờ là field không được validate/không được đọc — một executor không tự khai `command`/`adapter`/`agentType` rơi thẳng về `executor` toàn cục, không còn điểm dừng trung gian.
- **RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`).** Nội dung chữ nghĩa của prompt worker (`buildPrompt`) không còn hard-code trong `dispatch.mjs`: tách sang file template committed `src/runner/prompt-templates/*.txt`. Chọn template qua `selectTemplate({kind, tier, domain})` — bảng tra cơ học (mảng luật thứ tự, luật cuối là wildcard luôn khớp, per RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa): không gọi model trong vòng chọn) — hôm nay đúng MỘT luật (`worker-prompt-default.txt`), chưa có template phân biệt (YAGNI, cùng kỷ luật "mua cái tên interface, chưa mua bậc" của RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`)). Substitution CHỈ `{placeholder}` string-replace từng phần tử (`renderTemplate`), KHÔNG bao giờ một template engine có logic — mọi thành phần điều-kiện (vd mục `# Human feedback` chỉ xuất hiện khi có feedback, RUL23 (phản hồi người threading vào prompt worker)) vẫn là JS tính TRƯỚC khi substitute, không chuyển vào trong file template. `buildPrompt(work, feedback)` giữ nguyên chữ ký + kiểu trả (string) — mọi test cũ xanh không sửa (bằng chứng byte-identical). `hashTemplate` băm sha256 nội dung RAW file template (không phải output đã render); `spawnWorker` đính `templateName`/`templateHash` lên kết quả trả về VÀ lên `DispatchError` khi adapter reject; `loop.mjs` truyền hai trường này vào `appendWorkerLog`; `worker-log.mjs` in `template <name>@<hash8-chars>` trong header khi có mặt — một lượt chạy tồi truy ngược đúng phiên bản template đã sinh ra nó (per backlog STR49).
- **RUL43 (phát hiện đóng-không-merge trên GitHub là một phép ĐỌC riêng, phân loại chỉ trên hai trường tự-nghĩa — github-adapter D6).** `review --github --pr <n>` (không mở PR mới) là cơ chế yêu cầu cho việc phát hiện một PR bị đóng trên GitHub mà không merge. Phân loại KHÔNG BAO GIỜ dựa vào chuỗi trạng thái tổng quát của GitHub (chưa từng được chứng minh thật cho một PR đã đóng/đã merge, per S1) — chỉ dựa hai trường tự-nó-đã-rõ-nghĩa: đã-đóng-chưa (đúng/sai) và đã-merge-lúc-nào (có/không dấu thời gian). Ba nhánh: còn mở (không việc gì), đã merge (chỉ thông tin, không tự đổi trạng thái cục bộ — kể cả khi merge diễn ra thẳng trên GitHub bỏ qua `approve --github`, đối chiếu lại nằm ngoài phạm vi), đã đóng không merge (nêu số PR, hướng dẫn gọi `fgos reject` — không tự động gọi thay). Dưới MỌI nhánh, kể cả nhánh lỗi gọi GitHub: không sự kiện nào được ghi, không friction nào — một PR bị đóng trên GitHub không tự nó là một hành động duyệt hay từ chối, y hệt nguyên tắc `reject` không tự động (RUL22 (reject không bao giờ đảo lịch sử)) áp cho hướng ngược lại.
- **RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, không niềm tin đặc biệt, có trần + chống trùng).** Kênh báo-cáo mô tả ở "Báo việc-phát-hiện từ trợ lý" (trên) giữ nguyên tắc một-người-ghi (chỉ runner ghi work-state, trợ lý không bao giờ được phép) trong khi vẫn cho trợ lý một đường DỮ LIỆU để lộ ra việc mới: (1) việc tách báo-cáo khỏi output chạy đúng MỘT LẦN cho mỗi lượt dispatch, tại thời điểm kết thúc (thành đề xuất/chấm-trượt/quá-giờ/hỏng) — không lặp lại giữa các lần thử nội bộ của cùng lượt, nên một báo-cáo lộ ra sớm rồi lặp lại ở lần thử sau trong CÙNG lượt không bao giờ tạo hai bản; (2) một báo-cáo hỏng-hình không bao giờ đổi kết cục của chính lượt dispatch — bị bỏ qua âm thầm, không throw; (3) item tạo ra từ báo-cáo vào hệ với KHÔNG niềm tin đặc biệt nào — cùng giai đoạn đầu vào, cùng vòng xét-lại như một item người tự khai; (4) một lượt dispatch chỉ hành động trên tối đa một số báo-cáo GIỚI HẠN, phần dư bị bỏ qua có ghi lại (S10, review-fix P2 — chặn một trợ lý bất thường sinh vô hạn item); (5) một báo-cáo đã được ghi nhận trước đó (khớp dòng dõi phát-hiện + tên việc, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù lặp trong CÙNG output hay tái xuất hiện ở một lượt dispatch SAU của cùng item nguồn (S10, review-fix P2 — chặn trùng lặp khi báo-cáo bị gửi lại) — hai tên việc THẬT SỰ khác nhau vẫn cả hai được tạo (per work-graph-intelligence S2b / 8cf7effe, S10 / 7bbe6315). **Bảo đảm giao-nhận (S11, review-fix P3).** Kênh là cố-gắng-tối-đa, TỐI-ĐA-MỘT-LẦN — không phải ít-nhất-một-lần: một báo-cáo mất giữa lúc phân tích và lúc ghi xong (vd runner chết đột ngột) không được phục hồi, không có đối-soát-lại nào đọc lại output đã lưu để dựng lại báo-cáo đã mất — chấp nhận CÓ CHỦ Ý cho một kênh tư vấn phi-chặn, không phải một hàng đợi đáng tin cậy. **Ranh giới tin cậy (S11, review-fix P3).** Tên/mô tả trong một báo-cáo là văn bản KHÔNG ĐÁNG TIN do trợ lý tự soạn; item tạo ra nạp thẳng văn bản đó vào prompt của worker nghiên-cứu ở stage `discovery` — mặt tiếp xúc thứ hai (sau chính trợ lý) nơi văn bản không đáng tin chạm một model sẽ sinh lệnh chạy được. Giảm nhẹ hiện có: `verify` KHÔNG BAO GIỜ do trợ lý đặt trực tiếp (luôn qua placeholder rồi được gán lại ở vòng nghiên-cứu/làm-rõ, và một đề xuất verify còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi) nên văn bản đó không thể tự nó thành một lệnh shell; item không mang niềm tin đặc biệt, đi qua đúng vòng xét-lại như mọi item khác. Một cửa xét-duyệt-người bắt buộc trước dispatch tự động của item runner-tự-tạo được cân nhắc nhưng CHƯA XÂY (đổi thiết kế lớn hơn phạm vi vá P3) — xem decision ADR0013 (kênh báo-cáo-không-ghi cho discovered-from — worker phát khối rào fgos-discovered, runner đọc và tự ghi). **Kỷ luật ghi log (S11, review-fix P3).** Tên việc trong một báo-cáo — văn bản KHÔNG ĐÁNG TIN — được CHUẨN HOÁ (gộp khoảng trắng/xuống dòng, cắt độ dài) trước khi đưa vào bất kỳ dòng log nào của kênh này; một tên việc mang ký tự xuống dòng không thể giả-mạo thêm dòng log. Việc chuẩn hoá này CHỈ áp dụng cho bản ghi log — tên việc ĐẦY ĐỦ, nguyên văn vẫn được lưu trên item tạo ra, không bị cắt hay đổi.
````

Full unchanged target docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-6:

````text
- **RUL39 (Added in candidate — current-state correction; original STR39 live tee was built historically).** The current Work loop writes a Unit run capture pointer when the run is created and appends the settled output block afterward; it does not tee every stdout/stderr chunk into the item log. `appendWorkerLogChunk` at this caller carries the pointer. Evidence: `src/runner/loop.mjs:1110-1112,1150-1163`. See the corrected live-output operation above.
- **RUL40 (đã xây — STR40, `scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs`).** Vận hành qua herdr là chế độ được hỗ trợ chính thức (D d3dbe7f5, supersedes D ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux→herdr): một phiên chuẩn bốn pane — (1) vòng runner lặp (`fgos-runner --once` trong shell loop, đứng trên `runner.lock` + idempotent, không flag mới), (2) theo dõi output live từng việc (`tail -F .fgos/logs/*.log`, đứng trên RUL39 (đã xây — backlog STR39, cell live-worker-log-1)), (3) cửa thao tác của người (nộp/trả lời/duyệt, shell tương tác thuần), (4) bảng trạng thái + chuông chờ-người gộp một pane (`herdr-cockpit-notify.mjs`: poll `fgos list --json`, in dòng trạng thái + gọi `herdr notification show` đúng MỘT LẦN khi một việc MỚI vào `awaiting-human` — không lặp lại khi việc vẫn đứng yên ở trạng thái đó, gọi lại nếu việc rời rồi quay lại) — kèm một trang runbook trong docs sản phẩm (`docs/operator-runbook-herdr-cockpit.md`). **LUẬT CỨNG (re-scope 2026-09-06 — decision "RUL40 (herdr là transport và failure detector cho Dispatch, không bao giờ là nguồn sự thật hay receipt) re-scope", scope `runner`, `supersedes:d3dbe7f5`; phát biểu cũ dưới đây giữ làm lịch sử):** herdr KHÔNG BAO GIỜ là nguồn sự thật hay delivery receipt cho bất kỳ trạng thái fgOS hay kết quả Run nào — trạng thái Work luôn qua fgOS CLI (`fgos list`/`rollup`/`triage`), kết quả Run luôn qua file do chính worker ghi (ack/result trong outbox của Run) cộng liveness ladder. Trong phạm vi đó, Dispatch ĐƯỢC dùng agent API của herdr (`agent start`, `agent prompt --wait`, `agent wait`, `agent read`, `pane process-info`) làm **transport** và **failure detector** (`agent_not_ready`, `agent_prompt_stalled`, `blocked`, agent vắng mặt); `agent_status` idle/working/done không bao giờ được đọc thành "xong" hay "đã nhận prompt". Cockpit chrome (`pane split`/`pane run`/`pane read`/`tab create`/`notification show`) giữ nguyên. **Ladder và outcome (dispatch visibility V0):** một vòng dispatch interactive kết thúc theo đúng thứ tự — file result do chính worker ghi (thắng mọi tín hiệu khác, kể cả process đã biến mất), rồi `blocked`, rồi `died` (nhiều lần absent LIÊN TIẾP; một lần `unknown` reset bộ đếm, và đọc liveness hỏng luôn trả `unknown` chứ không bao giờ `absent`), rồi trần tuyệt đối, cuối cùng mới tới đứng-im. Bảy outcome có tên (`settled`, `blocked`, `died`, `timed-out-idle`, `timed-out-ceiling`, `paused-limit`, cộng `unsignaled` của ladder cũ cho adapter không tự khai) thay cho một chữ timeout chung; chỉ `settled` mới đóng pane, `paused-limit` giữ pane kể cả khi caller bật close-always. Màn hình chỉ đọc khi tiến độ đã ngừng, không phải mỗi tick. Chi tiết + lý do: docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md. Lý do re-scope + evidence: `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` §3.3, §4, §14 H1. *Phát biểu cũ (D d3dbe7f5, 2026-07-18, đã superseded):* herdr CHỈ dùng làm chrome — KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` làm tín hiệu quyết định; vi phạm từng gây bug thật ("idle giết agent", dogfood airemote) — bug đó đến từ việc tin `idle` là hoàn thành, không phải từ việc gọi API, và chính điều đó là ranh giới luật mới giữ lại. Đa phiên chung checkout (STR35, đã đóng): herdr tự thương lượng qua `herdr terminal attach --takeover` — hành vi có sẵn của herdr, không phải code mới của cockpit.
  - *Cập nhật 2026-10-05 — pane đã đóng:* câu trả lời `pane_not_found` của herdr cho lần đọc `pane process-info` là một lần đọc, không phải đọc hỏng: pane đã đóng thì không còn agent trong đó, nên tính là `absent` và cộng vào bộ đếm `died` (lý do nêu tên pane). Chỉ mã đó mới vậy; herdr không với tới được, quá hạn hay trả về không đọc được vẫn là `unknown`, và `agent_not_found` một mình cũng không đủ (agent chưa được herdr nhận ra không có nghĩa là pane mất).
- **RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học VĨNH VIỄN, trí tuệ vào qua đúng hai cửa; ĐÃ XÂY — str7-str8-priority-intent).** Vòng chọn-giao của runner không bao giờ gọi một model thông minh: mọi quyết định của nó (việc nào, model nào, tiếp hay dừng) phải tra-bảng hoặc dẫn xuất được từ dữ liệu đã nằm trên item. Trí tuệ vào hệ qua đúng hai cửa — (1) dòng chính: một bộ não thông minh (phiên trợ lý, stage làm-rõ/chia-việc) đọc frontier, chấm điểm, và GHI KẾT LUẬN XUỐNG FIELD của item qua cửa ghi chuẩn (khóa ưu tiên `priority` — người/tác nhân tự khai qua `edit --priority`, xem spec Work-State Data Dictionary #25/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); khóa `intent` — giai đoạn Làm-rõ tự tính, Data Dictionary #26/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); cờ tuần-tự-hóa); picker chỉ đổi khóa sort (frontier v2 — priority ASC, intent DESC, FIFO tie-break, spec Work-State "Đọc (list / ready)"), không đổi bản chất; (2) ngoại lệ có cửa riêng: cửa pull take/return cho một phiên thông minh nhấc đúng một việc ra khỏi dòng máy — kết quả trả về vẫn bị đo lại cơ học như mọi đề xuất. Một trợ lý điều phối không bao giờ trở thành picker; nó là người viết điểm số mà picker đọc (per D f69951df, đã xây per str7-str8-priority-intent).
- **RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`; per-tier `executors.<tier>` rút bởi tsk-in1-2 D6).** Ranh giới executor là một cổng có tên — **CTR009 v2**: registry `EXECUTOR_ADAPTERS` map tên adapter → hàm spawn. Adapter LIVE duy nhất hôm nay là `cli-spawn` (mặc định khi `adapter` vắng mặt trên một khối executor) — chính là hành xử cũ, tách nguyên vẹn ra một hàm riêng (`spawn(command,args,{shell:false})`, timeout trên `'exit'`, maxBuffer tự đếm, `onChunk` tee trước khi đếm). Adapter `rpc`/`app-server` **vẫn deferred, chưa có code** — khai một tên adapter khác `cli-spawn` bị `RunnerConfigError` từ chối ở cả `loadRunnerConfig` lẫn `resolveExecutorCommand` (per D a4fe4c2b). Per-tier override từng có 1 rung trung gian riêng (`executors.<tier>`, giữa `executors.<executorId>` và `executor` toàn cục trong thứ tự ưu tiên) — rút bỏ tại tsk-in1-2 0 entry live trong cấu hình thật, và từng gây bug thật (`tsk-4eu`/`tsk-5tm` — một key không phải tier như `"judge"` rơi thẳng vào `executor` chung, không lỗi). `cfg.executors` giờ là field không được validate/không được đọc — một executor không tự khai `command`/`adapter`/`agentType` rơi thẳng về `executor` toàn cục, không còn điểm dừng trung gian.
- **RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`).** Nội dung chữ nghĩa của prompt worker (`buildPrompt`) không còn hard-code trong `dispatch.mjs`: tách sang file template committed `src/runner/prompt-templates/*.txt`. Chọn template qua `selectTemplate({kind, tier, domain})` — bảng tra cơ học (mảng luật thứ tự, luật cuối là wildcard luôn khớp, per RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa): không gọi model trong vòng chọn) — hôm nay đúng MỘT luật (`worker-prompt-default.txt`), chưa có template phân biệt (YAGNI, cùng kỷ luật "mua cái tên interface, chưa mua bậc" của RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`)). Substitution CHỈ `{placeholder}` string-replace từng phần tử (`renderTemplate`), KHÔNG bao giờ một template engine có logic — mọi thành phần điều-kiện (vd mục `# Human feedback` chỉ xuất hiện khi có feedback, RUL23 (phản hồi người threading vào prompt worker)) vẫn là JS tính TRƯỚC khi substitute, không chuyển vào trong file template. `buildPrompt(work, feedback)` giữ nguyên chữ ký + kiểu trả (string) — mọi test cũ xanh không sửa (bằng chứng byte-identical). `hashTemplate` băm sha256 nội dung RAW file template (không phải output đã render); `spawnWorker` đính `templateName`/`templateHash` lên kết quả trả về VÀ lên `DispatchError` khi adapter reject; `loop.mjs` truyền hai trường này vào `appendWorkerLog`; `worker-log.mjs` in `template <name>@<hash8-chars>` trong header khi có mặt — một lượt chạy tồi truy ngược đúng phiên bản template đã sinh ra nó (per backlog STR49).
- **RUL43 (phát hiện đóng-không-merge trên GitHub là một phép ĐỌC riêng, phân loại chỉ trên hai trường tự-nghĩa — github-adapter D6).** `review --github --pr <n>` (không mở PR mới) là cơ chế yêu cầu cho việc phát hiện một PR bị đóng trên GitHub mà không merge. Phân loại KHÔNG BAO GIỜ dựa vào chuỗi trạng thái tổng quát của GitHub (chưa từng được chứng minh thật cho một PR đã đóng/đã merge, per S1) — chỉ dựa hai trường tự-nó-đã-rõ-nghĩa: đã-đóng-chưa (đúng/sai) và đã-merge-lúc-nào (có/không dấu thời gian). Ba nhánh: còn mở (không việc gì), đã merge (chỉ thông tin, không tự đổi trạng thái cục bộ — kể cả khi merge diễn ra thẳng trên GitHub bỏ qua `approve --github`, đối chiếu lại nằm ngoài phạm vi), đã đóng không merge (nêu số PR, hướng dẫn gọi `fgos reject` — không tự động gọi thay). Dưới MỌI nhánh, kể cả nhánh lỗi gọi GitHub: không sự kiện nào được ghi, không friction nào — một PR bị đóng trên GitHub không tự nó là một hành động duyệt hay từ chối, y hệt nguyên tắc `reject` không tự động (RUL22 (reject không bao giờ đảo lịch sử)) áp cho hướng ngược lại.
- **RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, không niềm tin đặc biệt, có trần + chống trùng).** Kênh báo-cáo mô tả ở "Báo việc-phát-hiện từ trợ lý" (trên) giữ nguyên tắc một-người-ghi (chỉ runner ghi work-state, trợ lý không bao giờ được phép) trong khi vẫn cho trợ lý một đường DỮ LIỆU để lộ ra việc mới: (1) việc tách báo-cáo khỏi output chạy đúng MỘT LẦN cho mỗi lượt dispatch, tại thời điểm kết thúc (thành đề xuất/chấm-trượt/quá-giờ/hỏng) — không lặp lại giữa các lần thử nội bộ của cùng lượt, nên một báo-cáo lộ ra sớm rồi lặp lại ở lần thử sau trong CÙNG lượt không bao giờ tạo hai bản; (2) một báo-cáo hỏng-hình không bao giờ đổi kết cục của chính lượt dispatch — bị bỏ qua âm thầm, không throw; (3) item tạo ra từ báo-cáo vào hệ với KHÔNG niềm tin đặc biệt nào — cùng giai đoạn đầu vào, cùng vòng xét-lại như một item người tự khai; (4) một lượt dispatch chỉ hành động trên tối đa một số báo-cáo GIỚI HẠN, phần dư bị bỏ qua có ghi lại (S10, review-fix P2 — chặn một trợ lý bất thường sinh vô hạn item); (5) một báo-cáo đã được ghi nhận trước đó (khớp dòng dõi phát-hiện + tên việc, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù lặp trong CÙNG output hay tái xuất hiện ở một lượt dispatch SAU của cùng item nguồn (S10, review-fix P2 — chặn trùng lặp khi báo-cáo bị gửi lại) — hai tên việc THẬT SỰ khác nhau vẫn cả hai được tạo (per work-graph-intelligence S2b / 8cf7effe, S10 / 7bbe6315). **Bảo đảm giao-nhận (S11, review-fix P3).** Kênh là cố-gắng-tối-đa, TỐI-ĐA-MỘT-LẦN — không phải ít-nhất-một-lần: một báo-cáo mất giữa lúc phân tích và lúc ghi xong (vd runner chết đột ngột) không được phục hồi, không có đối-soát-lại nào đọc lại output đã lưu để dựng lại báo-cáo đã mất — chấp nhận CÓ CHỦ Ý cho một kênh tư vấn phi-chặn, không phải một hàng đợi đáng tin cậy. **Ranh giới tin cậy (S11, review-fix P3).** Tên/mô tả trong một báo-cáo là văn bản KHÔNG ĐÁNG TIN do trợ lý tự soạn; item tạo ra nạp thẳng văn bản đó vào prompt của worker nghiên-cứu ở stage `discovery` — mặt tiếp xúc thứ hai (sau chính trợ lý) nơi văn bản không đáng tin chạm một model sẽ sinh lệnh chạy được. Giảm nhẹ hiện có: `verify` KHÔNG BAO GIỜ do trợ lý đặt trực tiếp (luôn qua placeholder rồi được gán lại ở vòng nghiên-cứu/làm-rõ, và một đề xuất verify còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi) nên văn bản đó không thể tự nó thành một lệnh shell; item không mang niềm tin đặc biệt, đi qua đúng vòng xét-lại như mọi item khác. Một cửa xét-duyệt-người bắt buộc trước dispatch tự động của item runner-tự-tạo được cân nhắc nhưng CHƯA XÂY (đổi thiết kế lớn hơn phạm vi vá P3) — xem decision ADR0013 (kênh báo-cáo-không-ghi cho discovered-from — worker phát khối rào fgos-discovered, runner đọc và tự ghi). **Kỷ luật ghi log (S11, review-fix P3).** Tên việc trong một báo-cáo — văn bản KHÔNG ĐÁNG TIN — được CHUẨN HOÁ (gộp khoảng trắng/xuống dòng, cắt độ dài) trước khi đưa vào bất kỳ dòng log nào của kênh này; một tên việc mang ký tự xuống dòng không thể giả-mạo thêm dòng log. Việc chuẩn hoá này CHỈ áp dụng cho bản ghi log — tên việc ĐẦY ĐỦ, nguyên văn vẫn được lưu trên item tạo ra, không bị cắt hay đổi.
````


## claim_099eb566c825967cf35f9397f2d7b947

Correction labels: followup-truth-11. Disposition: supersede. Status: pending.

Source digest: c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4
Target digest: 42f7d3b5bc55faa2dccd8f8d20cb008002957c8a31549f3fda4d1568c161b894
Evidence digest: 0dc99d881ac91f48391d7b0fa39def3d96c01a182495a3559d70a6b20a40d3b5

Prior reviewer note (verbatim):

deep: heading Edge Cases Settled source L1123-1123 to subcomponents/h-37aced3896a8/spec.md#edge-cases-settled; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-11) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-11), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest c1c87e9a and target digest 42f7d3b5 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-11); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#edge-cases-settled (lines 1123–1123) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#edge-cases-settled. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#edge-cases-settled with docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#edge-cases-settled. Labelled follow-up corrections followup-truth-11 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#edge-cases-settled:

````text
## Edge Cases Settled

- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
````

Full unchanged target docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#edge-cases-settled:

````text
## Edge Cases Settled

- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4373`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
````


## claim_36f4a3c4ae623f3a348faadd747dcba7

Correction labels: followup-truth-11. Disposition: supersede. Status: pending.

Source digest: 153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073
Target digest: 2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c
Evidence digest: d71ff1661b302e9b47176d0d3abfb5d0c666df1012dc554c13b885d95629cd36

Prior reviewer note (verbatim):

deep: block Unheaded block 97 source L1172-1173 to subcomponents/h-37aced3896a8/spec.md#unheaded-block-5; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-11) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-11), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 153dc43f and target digest 2e056142 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-11); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-97 (lines 1172–1173) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-97 with docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-5. Labelled follow-up corrections followup-truth-11 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-97:

````text
- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
````

Full unchanged target docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-5:

````text
- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4373`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
````


## claim_ef6c4ace21b84e2eeb9de2ad200e5cfb

Correction labels: followup-truth-01, followup-truth-02, followup-truth-03, followup-truth-04. Disposition: supersede. Status: pending.

Source digest: 0f54c4919dedb58d73fc7cf55e8d217fb054b04f36911b7990b6e9a78a361713
Target digest: 6f6c6fcfe0b845e97c07b1bc7bc7c33190225499a676a4b7179336280c542012
Evidence digest: d983c0ed12766c8cb84e82281e51ca2cc2d7b5f4496a4849f77476121ae4d07f

Prior reviewer note (verbatim):

deep: heading ExecutorProfile / Invocation — target vocabu source L1297-1297 to contracts/h-b3eb60fb4d2b.md#executorprofile-invocation-target-vocabu; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-01, followup-truth-02, followup-truth-03, followup-truth-04) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-01, followup-truth-02, followup-truth-03, followup-truth-04), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 0f54c491 and target digest 6f6c6fcf differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-01, followup-truth-02, followup-truth-03, followup-truth-04); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration (lines 1297–1297) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration with docs/platform/runner/contracts/h-b3eb60fb4d2b.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration. Labelled follow-up corrections followup-truth-01, followup-truth-02, followup-truth-03, followup-truth-04 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration:

````text
## ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)

Target vocabulary from design.md §3.7 of
`plans/260915-executor-policy-dispatch-seams/design.md` — documented here so
config/doctor warnings (`executor-profile-warnings` check,
`src/setup/executor-profile-warnings.mjs`) have a named migration target to
point at. The **Invocation** half of this vocabulary was already real config
before this section existed (`executors.<id>.invocations[]`, each entry's
own `via`/`command`/`args`/`adapter` — `src/runner/dispatch/config.mjs`'s
`validateInvocationShape`). Phase C (`plans/260917-executor-profile-schema-migration/plan.md`)
made the **ExecutorProfile** half real too: `executors.<id>.identity`
(all four fields required together when declared) and `executors.<id>.supports`
(each field independently optional) are now validated, additive config
fields (`validateExecutorIdentityShape`/`validateExecutorSupportsShape`,
same file) that survive `resolveExecutorAndOverrides` unchanged. Neither
field has a real consumer yet — no resolution/dispatch/PlacementPolicy code
reads `identity`/`supports` for any decision — this is metadata a later
phase can build on, not a behavior change. `claude` is the one real
executor declaring both today (`.fgos/config.json`), proving the shape end
to end; every other `runner.executors.<id>` entry stays exactly as it was,
and legacy executor ids remain fully accepted. **No executor-id
consolidation or config-shape retirement has happened** (that is Phase E,
not started) — this section still describes the fuller target the
vocabulary is headed toward, not a completed migration.

**ExecutorProfile** answers "which principal/backend/trust boundary is
this?" — a stable runtime boundary, never a policy choice:

| Field | Answers | Must NOT be derived from |
|---|---|---|
| `identity.principalRef` | which account/credential family | a concrete rotating account id (Provider Capacity Rotator's own scope, `plans/260916-account-rotator/`) |
| `identity.runtimeBackendRef` | which CLI/runtime this is | model, quality tier, reasoning effort |
| `identity.trustDomain` | how privileged this principal is | persona/role/business case |
| `identity.egressClass` | what it may reach over the network | visibility (visible/headless) alone |

**Invocation** answers "how is this profile actually used for one dispatch?":
adapter (`cli-spawn`/`herdr-spawn`/mcp/api), prompt delivery (argv vs
file-pointer), visible/headless mode, confinement backend/envelope, resource
bindings, provider adapter id. Confinement is normally an invocation
envelope, not identity — it only becomes identity when it changes principal,
backend trust, or egress boundary materially (the same rule design.md's
ProviderAdapter section already states for the shadow-mode Phase 01 module,
`src/runner/dispatch/provider-adapter.mjs`).

Migration targets a legacy config entry maps onto once every executor
consolidates onto this vocabulary (Phase D/E of
`plans/260917-executor-profile-schema-migration/plan.md`, not yet — the
`identity`/`supports` fields being real config, above, is not the same as
this consolidation happening):

| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | a compatibility alias patch (Phase 03, `LEGACY_EXECUTOR_ALIASES` in `src/runner/dispatch/assignment-policy.mjs`) carrying `personaRef`/`toolIntent`/`reasoningEffort` |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |

A later migration (Phase E) can map `claude` + `claude-reviewer` +
`claude-reviewer-herdr` and similar id families into one `ExecutorProfile`
with multiple invocations, but that consolidation has not happened —
`fgos doctor`'s `executor-profile-warnings` check makes the gap between
current config and this target vocabulary machine-visible in the meantime.
````

Full unchanged target docs/platform/runner/contracts/h-b3eb60fb4d2b.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration:

````text
## ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)

Target vocabulary from design.md §3.7 of
`plans/260915-executor-policy-dispatch-seams/design.md` — documented here so
config/doctor warnings (`executor-profile-warnings` check,
`src/setup/executor-profile-warnings.mjs`) have a named migration target to
point at. The **Invocation** half of this vocabulary was already real config
before this section existed (`executors.<id>.invocations[]`, each entry's
own `via`/`command`/`args`/`adapter` — `src/runner/dispatch/config.mjs`'s
`validateInvocationShape`). Phase C (`plans/260917-executor-profile-schema-migration/plan.md`)
made the **ExecutorProfile** half real too: `executors.<id>.identity`
(all four fields required together when declared) and `executors.<id>.supports`
(each field independently optional) are now validated, additive config
fields (`validateExecutorIdentityShape`/`validateExecutorSupportsShape`,
same file) that survive `resolveExecutorAndOverrides` unchanged. **Added in
candidate — current-state correction:** `supports.reasoningEffort` is consumed
by `resolveExecutorCommand` when validating the requested effort; identity
remains validated profile metadata, so the former blanket “no consumer”
statement is stale. The archived migration plan records Phases A–E merged,
including executor-id consolidation. The legacy reviewer ids no longer exist
as registered executors; `EXECUTOR_KINDS` is now `agent|tool`. These facts
come from code and the completed plan, without reading live configuration.
Evidence: `src/runner/dispatch/transport.mjs:176`,
`src/runner/dispatch/assignment-policy.mjs:88-98`,
`src/runner/dispatch/config.mjs:457`, and
`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`.

**ExecutorProfile** answers "which principal/backend/trust boundary is
this?" — a stable runtime boundary, never a policy choice:

| Field | Answers | Must NOT be derived from |
|---|---|---|
| `identity.principalRef` | which account/credential family | a concrete rotating account id (Provider Capacity Rotator's own scope, `plans/260916-account-rotator/`) |
| `identity.runtimeBackendRef` | which CLI/runtime this is | model, quality tier, reasoning effort |
| `identity.trustDomain` | how privileged this principal is | persona/role/business case |
| `identity.egressClass` | what it may reach over the network | visibility (visible/headless) alone |

**Invocation** answers "how is this profile actually used for one dispatch?":
adapter (`cli-spawn`/`herdr-spawn`/mcp/api), prompt delivery (argv vs
file-pointer), visible/headless mode, confinement backend/envelope, resource
bindings, provider adapter id. Confinement is normally an invocation
envelope, not identity — it only becomes identity when it changes principal,
backend trust, or egress boundary materially (the same rule design.md's
ProviderAdapter section already states for the shadow-mode Phase 01 module,
`src/runner/dispatch/provider-adapter.mjs`).

**Added in candidate — migration status correction:** The following table
records the migration mapping, rather than a migration still awaiting Phase
D/E. The completed archived plan records consolidation as merged
(`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`):

| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | Former compatibility alias patch; retired after consolidation. Callers now declare invocation/policy explicitly (`src/runner/dispatch/assignment-policy.mjs:88-98`). |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |

**Added in candidate — consolidation correction:** Phase E is complete;
the archived plan records `claude`/`codex`/`agy` as multi-invocation
executors and the former separate ids as removed. The assignment-policy
module confirms retirement of its legacy-id alias seam. The doctor warning
check remains a migration diagnostic, not evidence that Phase E is pending.
Evidence: `archive/plans/260917-executor-profile-schema-migration/plan.md:733-741`
and `src/runner/dispatch/assignment-policy.mjs:88-98`.
````


## claim_66d031f3f3d5009c11d96357e48d985a

Correction labels: followup-truth-01. Disposition: supersede. Status: pending.

Source digest: 5fde748feccce5cce2990f23d3f2b681442d6ec366063c45ca96204a3458fbcf
Target digest: c334d72c0b9610f0ff55a4b5ac0a2c9166facd2a7900b447f1959e0efb3276e4
Evidence digest: bcfbad2024632a5937c4f623c412a2bfa7ff3466359a895522727883bb38f116

Prior reviewer note (verbatim):

deep: block Unheaded block 106 source L1299-1320 to contracts/h-b3eb60fb4d2b.md#unheaded-block-3; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-01) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-01), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 5fde748f and target digest c334d72c differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-01); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-106 (lines 1299–1320) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-106 with docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-3. Labelled follow-up corrections followup-truth-01 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-106:

````text
Target vocabulary from design.md §3.7 of
`plans/260915-executor-policy-dispatch-seams/design.md` — documented here so
config/doctor warnings (`executor-profile-warnings` check,
`src/setup/executor-profile-warnings.mjs`) have a named migration target to
point at. The **Invocation** half of this vocabulary was already real config
before this section existed (`executors.<id>.invocations[]`, each entry's
own `via`/`command`/`args`/`adapter` — `src/runner/dispatch/config.mjs`'s
`validateInvocationShape`). Phase C (`plans/260917-executor-profile-schema-migration/plan.md`)
made the **ExecutorProfile** half real too: `executors.<id>.identity`
(all four fields required together when declared) and `executors.<id>.supports`
(each field independently optional) are now validated, additive config
fields (`validateExecutorIdentityShape`/`validateExecutorSupportsShape`,
same file) that survive `resolveExecutorAndOverrides` unchanged. Neither
field has a real consumer yet — no resolution/dispatch/PlacementPolicy code
reads `identity`/`supports` for any decision — this is metadata a later
phase can build on, not a behavior change. `claude` is the one real
executor declaring both today (`.fgos/config.json`), proving the shape end
to end; every other `runner.executors.<id>` entry stays exactly as it was,
and legacy executor ids remain fully accepted. **No executor-id
consolidation or config-shape retirement has happened** (that is Phase E,
not started) — this section still describes the fuller target the
vocabulary is headed toward, not a completed migration.
````

Full unchanged target docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-3:

````text
Target vocabulary from design.md §3.7 of
`plans/260915-executor-policy-dispatch-seams/design.md` — documented here so
config/doctor warnings (`executor-profile-warnings` check,
`src/setup/executor-profile-warnings.mjs`) have a named migration target to
point at. The **Invocation** half of this vocabulary was already real config
before this section existed (`executors.<id>.invocations[]`, each entry's
own `via`/`command`/`args`/`adapter` — `src/runner/dispatch/config.mjs`'s
`validateInvocationShape`). Phase C (`plans/260917-executor-profile-schema-migration/plan.md`)
made the **ExecutorProfile** half real too: `executors.<id>.identity`
(all four fields required together when declared) and `executors.<id>.supports`
(each field independently optional) are now validated, additive config
fields (`validateExecutorIdentityShape`/`validateExecutorSupportsShape`,
same file) that survive `resolveExecutorAndOverrides` unchanged. **Added in
candidate — current-state correction:** `supports.reasoningEffort` is consumed
by `resolveExecutorCommand` when validating the requested effort; identity
remains validated profile metadata, so the former blanket “no consumer”
statement is stale. The archived migration plan records Phases A–E merged,
including executor-id consolidation. The legacy reviewer ids no longer exist
as registered executors; `EXECUTOR_KINDS` is now `agent|tool`. These facts
come from code and the completed plan, without reading live configuration.
Evidence: `src/runner/dispatch/transport.mjs:176`,
`src/runner/dispatch/assignment-policy.mjs:88-98`,
`src/runner/dispatch/config.mjs:457`, and
`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`.
````


## claim_d29be3d33893c060220d82b135fcb7c0

Correction labels: followup-truth-02. Disposition: supersede. Status: pending.

Source digest: dfa2fbd2381337a7bc8440220851e83137d4ebf9014eb9e18bc6d9161a615964
Target digest: 0ff401fc6d61831531fb616b1635f9043c166874573071e17cc04f368e9ad183
Evidence digest: 4cfa1cb84d77ee31a7ecf710e60d22ab1fb6158622bf5a920f36ecaa389ca05b

Prior reviewer note (verbatim):

deep: block Unheaded block 110 source L1341-1345 to contracts/h-b3eb60fb4d2b.md#unheaded-block-7; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-02) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-02), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest dfa2fbd2 and target digest 0ff401fc differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-02); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-110 (lines 1341–1345) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-110 with docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-7. Labelled follow-up corrections followup-truth-02 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-110:

````text
Migration targets a legacy config entry maps onto once every executor
consolidates onto this vocabulary (Phase D/E of
`plans/260917-executor-profile-schema-migration/plan.md`, not yet — the
`identity`/`supports` fields being real config, above, is not the same as
this consolidation happening):
````

Full unchanged target docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-7:

````text
**Added in candidate — migration status correction:** The following table
records the migration mapping, rather than a migration still awaiting Phase
D/E. The completed archived plan records consolidation as merged
(`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`):
````


## claim_2811db1449ad8dc4655f8531d5c5701e

Correction labels: followup-truth-03. Disposition: supersede. Status: pending.

Source digest: fc05b724a8cf91d0a56fcedb8c1f936f8771e44e77ae345055e5525b8bdf6bc5
Target digest: 7b630b89fdcb48025ba14f021bdc19bec3eed03ffedf4ac24af141562f7675e3
Evidence digest: cc29f39b6da18d689fd0edc8e5053d7e34cc4fbb13a48bae12ce610115ca93eb

Prior reviewer note (verbatim):

deep: block Unheaded block 111 source L1347-1354 to contracts/h-b3eb60fb4d2b.md#unheaded-block-8; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-03) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-03), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest fc05b724 and target digest 7b630b89 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-03); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-111 (lines 1347–1354) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-111 with docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-8. Labelled follow-up corrections followup-truth-03 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-111:

````text
| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | a compatibility alias patch (Phase 03, `LEGACY_EXECUTOR_ALIASES` in `src/runner/dispatch/assignment-policy.mjs`) carrying `personaRef`/`toolIntent`/`reasoningEffort` |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |
````

Full unchanged target docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-8:

````text
| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | Former compatibility alias patch; retired after consolidation. Callers now declare invocation/policy explicitly (`src/runner/dispatch/assignment-policy.mjs:88-98`). |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |
````


## claim_5f91b173c863af29efb4d8af8c734b4c

Correction labels: followup-truth-04. Disposition: supersede. Status: pending.

Source digest: 8effb31b306362d3a2022b786937e6f66411717f00e1e3679117d7fa3cdf6e4d
Target digest: f4886338571ebec2a610be75ec1eabd41578febbffae0c17605e3bc94ecc744c
Evidence digest: 57f38064a6a6cf091a72dfc23b331414bf1fdacfbc435c399c188e3c32837ab7

Prior reviewer note (verbatim):

deep: block Unheaded block 112 source L1356-1360 to contracts/h-b3eb60fb4d2b.md#unheaded-block-9; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-04) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-04), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest 8effb31b and target digest f4886338 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-04); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-112 (lines 1356–1360) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-112 with docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-9. Labelled follow-up corrections followup-truth-04 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-112:

````text
A later migration (Phase E) can map `claude` + `claude-reviewer` +
`claude-reviewer-herdr` and similar id families into one `ExecutorProfile`
with multiple invocations, but that consolidation has not happened —
`fgos doctor`'s `executor-profile-warnings` check makes the gap between
current config and this target vocabulary machine-visible in the meantime.
````

Full unchanged target docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-9:

````text
**Added in candidate — consolidation correction:** Phase E is complete;
the archived plan records `claude`/`codex`/`agy` as multi-invocation
executors and the former separate ids as removed. The assignment-policy
module confirms retirement of its legacy-id alias seam. The doctor warning
check remains a migration diagnostic, not evidence that Phase E is pending.
Evidence: `archive/plans/260917-executor-profile-schema-migration/plan.md:733-741`
and `src/runner/dispatch/assignment-policy.mjs:88-98`.
````


## claim_a11926d30be8de43744fc81023f6dab5

Correction labels: followup-truth-15. Disposition: supersede. Status: pending.

Source digest: dceb2f2607dd441fb5cb8dbd9b126189c6d98f50e1978cdf010b77032b352e85
Target digest: fa12380ba45b60a32c819272d07b996412a915e0e5bae3a091799807c78d882b
Evidence digest: 63b229fb46728cfc5264ef4273c39e1f21336453e3c072ae363f9f8126567763

Prior reviewer note (verbatim):

deep: block Unheaded block 140 source L1528-1563 to architecture/h-69197b459754.md#unheaded-block-26; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-15) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-15), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest dceb2f26 and target digest fa12380b differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-15); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-140 (lines 1528–1563) carried at docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-26. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-140 with docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-26. Labelled follow-up corrections followup-truth-15 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-140:

````text
**Quorum, retry/replacement, crash recovery, cancellation (Phase 06 R1-R4).**
Mặc định, một session chỉ đóng `completed` khi MỌI SessionActor bắt buộc đã
hoàn tất (evaluateSessionQuorum/closeSessionByQuorum,
`src/runner/coordination/session-engine.mjs`); một `partialPolicy` khai báo
NGAY LÚC MỞ session (`{minimumActors?, allowedOmissions?}`, bất biến sau đó,
không bao giờ tự chế ra lúc đóng) mới cho phép đóng `partial` — và `partial`
không bao giờ tự nhận là `completed`, trạng thái cuối luôn liệt kê đủ actor
missing/failed/late/replaced/dissenting. Retry (`retrySessionTask`) tạo một
Run MỚI cho ĐÚNG Assignment cũ (không tạo Assignment mới), theo policy
`maxRetries` khai báo; kết quả mới `supersede` view hiện hành của session
(`linkResult({allowSupersede: true})`) nhưng KHÔNG BAO GIỜ xoá/ghi đè
RunResult cũ — cả hai đều ở lại event log, bất biến. Thay actor
(`replaceSessionActor`) chỉ xảy ra qua đúng cơ chế này: bind actor mới CÙNG
role với actor cũ (không bao giờ đổi role ngầm), ghi provenance actor
cũ/mới + allocation, rồi việc dispatch thật cho actor mới vẫn đi qua đúng
`dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult` sẵn có —
không có đường dispatch tắt nào bỏ qua governance (provider/tier/diversity/
evidence). Phục hồi sau crash: mọi ghi nhiều-bước mới (retry declare ->
dispatch -> link; bind actor -> record replacement) đều tự self-heal khi
resume (không double-count, không double-dispatch), nhờ một bản ghi claim
trên đĩa riêng cho từng bước — với `replaceSessionActor`, claim khoá đúng
theo cặp (actor cũ, actor thay thế), nên một actor KHÁC đã bind sẵn vì lý
do độc lập (vd. một actor bắt buộc khai báo ngay lúc mở session nhưng chưa
từng dispatch — trạng thái MẶC ĐỊNH của một actor bắt buộc còn mới, không
phải ca hiếm) không bao giờ bị lẫn với resume của chính lệnh này và bị nuốt
mất slot bắt buộc của riêng nó; một state không rõ ràng (claim còn treo,
không rõ tiến trình cũ còn sống hay đã chết) fail closed với lỗi named rõ
hướng sửa, không bao giờ đoán liều. Cancellation
(`cancelSession`) chuyển sang trạng thái cuối `cancelled` (thêm vào
`active|completed|partial|failed`), chặn MỌI Assignment/Run mới (mọi cửa ghi
đều từ chối khi `status !== 'active'`), ghi lại ảnh chụp Assignment đang
in-flight lúc huỷ, nhưng không xoá/sửa Run/RunResult đã có; một Run in-flight
lúc huỷ vẫn được phép `linkResult` khi nó settle muộn. Mọi trạng thái cuối
(`completed|partial|failed|cancelled`) là hấp thụ — không có transition nào
đi tiếp từ trạng thái cuối. Chi tiết đầy đủ:
`docs/architect/agent-coordination/contracts/coordination-session.md`.
````

Full unchanged target docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-26:

````text
**Quorum, retry/replacement, crash recovery, cancellation (Phase 06 R1-R4).**
Mặc định, một session chỉ đóng `completed` khi MỌI SessionActor bắt buộc đã
hoàn tất (evaluateSessionQuorum/closeSessionByQuorum,
`src/runner/coordination/session-engine.mjs` — Added in candidate: removed in
`2180b4e72`; this slice describes the retired engine); một `partialPolicy` khai báo
NGAY LÚC MỞ session (`{minimumActors?, allowedOmissions?}`, bất biến sau đó,
không bao giờ tự chế ra lúc đóng) mới cho phép đóng `partial` — và `partial`
không bao giờ tự nhận là `completed`, trạng thái cuối luôn liệt kê đủ actor
missing/failed/late/replaced/dissenting. Retry (`retrySessionTask`) tạo một
Run MỚI cho ĐÚNG Assignment cũ (không tạo Assignment mới), theo policy
`maxRetries` khai báo; kết quả mới `supersede` view hiện hành của session
(`linkResult({allowSupersede: true})`) nhưng KHÔNG BAO GIỜ xoá/ghi đè
RunResult cũ — cả hai đều ở lại event log, bất biến. Thay actor
(`replaceSessionActor`) chỉ xảy ra qua đúng cơ chế này: bind actor mới CÙNG
role với actor cũ (không bao giờ đổi role ngầm), ghi provenance actor
cũ/mới + allocation, rồi việc dispatch thật cho actor mới vẫn đi qua đúng
`dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult` sẵn có —
không có đường dispatch tắt nào bỏ qua governance (provider/tier/diversity/
evidence). Phục hồi sau crash: mọi ghi nhiều-bước mới (retry declare ->
dispatch -> link; bind actor -> record replacement) đều tự self-heal khi
resume (không double-count, không double-dispatch), nhờ một bản ghi claim
trên đĩa riêng cho từng bước — với `replaceSessionActor`, claim khoá đúng
theo cặp (actor cũ, actor thay thế), nên một actor KHÁC đã bind sẵn vì lý
do độc lập (vd. một actor bắt buộc khai báo ngay lúc mở session nhưng chưa
từng dispatch — trạng thái MẶC ĐỊNH của một actor bắt buộc còn mới, không
phải ca hiếm) không bao giờ bị lẫn với resume của chính lệnh này và bị nuốt
mất slot bắt buộc của riêng nó; một state không rõ ràng (claim còn treo,
không rõ tiến trình cũ còn sống hay đã chết) fail closed với lỗi named rõ
hướng sửa, không bao giờ đoán liều. Cancellation
(`cancelSession`) chuyển sang trạng thái cuối `cancelled` (thêm vào
`active|completed|partial|failed`), chặn MỌI Assignment/Run mới (mọi cửa ghi
đều từ chối khi `status !== 'active'`), ghi lại ảnh chụp Assignment đang
in-flight lúc huỷ, nhưng không xoá/sửa Run/RunResult đã có; một Run in-flight
lúc huỷ vẫn được phép `linkResult` khi nó settle muộn. Mọi trạng thái cuối
(`completed|partial|failed|cancelled`) là hấp thụ — không có transition nào
đi tiếp từ trạng thái cuối. Chi tiết đầy đủ:
`docs/architect/agent-coordination/contracts/coordination-session.md`.
````


## claim_88d627e8f4ea6556a45d97bc81b03f28

Correction labels: followup-truth-16. Disposition: supersede. Status: pending.

Source digest: ff375152abfe9a2c14b52258ea20eac7a8626c8c59ec1c27f1e7819fa8421457
Target digest: 5c2cca94cc507e1f552e5a5a6b298bd81f7c9d5b4bd3abd8fbe9e1c2d24db498
Evidence digest: 398e8d9d8f1540c4e75d32a3f829a63a144d83397514ae00af09a227f44c6556

Prior reviewer note (verbatim):

deep: block Unheaded block 141 source L1565-1577 to architecture/h-69197b459754.md#unheaded-block-27; token-level source-to-target diff read both directions, every hunk lies inside an edit range (followup-truth-16) and is labelled in the carrier, nothing else added or lost; rework: disposition was moved from move to supersede because the unit text now differs (followup-truth-16), yet the rationale still carries the move wording (carried at the target anchor, Full native unit digest equal), which is false because source digest ff375152 and target digest 5c2cca94 differ and the A42 prefix names no concrete correction; replace the stale carried/digest-equal sentence with the labelled correction (followup-truth-16); shard row equals pack, anchors exist, source and target digests recomputed by script

Before rationale:

````text
Judgment: A42 evidenced current-state correction or labelled header/navigation hygiene in this bound unit. Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-141 (lines 1565–1577) carried at docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-27. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.
````

After rationale:

````text
Judgment: supersede the source unit at docs/specs/runner.md#unheaded-block-141 with docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-27. Labelled follow-up corrections followup-truth-16 changed this unit; source and target native unit digests differ. The token-level source-to-target changes are the labelled follow-up edits, with no other source loss or unlabelled addition, as documented in step9-a42-followup-corrections.json. Complete original source remains immutable; dated decision semantics are retained. Full source and current target, concrete correction evidence, and before/after rationale are in the bounded rationale re-review request. Pending independent review; full truth check and revalidation/rebinding remain owed at promotion and legacy cutover.
````

Full source docs/specs/runner.md#unheaded-block-141:

````text
**CLI.** Verb thật (Step 08 Phase 07 R1-R4, `src/verbs/coordination/{schema,run,show}.mjs`
+ `bin/fgos.mjs`): `fgos coordination run --file <request>` (chạy đồng bộ,
mở session + dispatch mọi step khai báo + thử đóng-theo-quorum trong một
lời gọi) và `fgos coordination show <id> --json` (đọc-thôi, không mutation/
external effect). Override executor/model/tier con người đi qua đúng cờ CLI
toàn cục hiện có (`--executor`/`--model`/`--tier`), không mở cửa
infrastructure riêng cho coordination; chính sách per-actor (executor/model/
tier/persona) chỉ được khai trong request file's `actors[]`, không bao giờ
trong protocol reference. Headless adapter cùng entry point engine
(`src/runner/coordination/headless-adapter.mjs`'s `runCoordinationHeadless`),
khác duy nhất ở attachment/visibility/invocation lifecycle (R4). Ví dụ thật:
`docs/how-to/coordination-examples/*.json`; how-to:
`docs/how-to/run-a-coordination-session.md`.
````

Full unchanged target docs/platform/runner/architecture/h-69197b459754.md#unheaded-block-27:

````text
**CLI.** Verb thật (Step 08 Phase 07 R1-R4, `src/verbs/coordination/{schema,run,show}.mjs`
+ `bin/fgos.mjs`): `fgos coordination run --file <request>` (chạy đồng bộ,
mở session + dispatch mọi step khai báo + thử đóng-theo-quorum trong một
lời gọi) và `fgos coordination show <id> --json` (đọc-thôi, không mutation/
external effect). Override executor/model/tier con người đi qua đúng cờ CLI
toàn cục hiện có (`--executor`/`--model`/`--tier`), không mở cửa
infrastructure riêng cho coordination; chính sách per-actor (executor/model/
tier/persona) chỉ được khai trong request file's `actors[]`, không bao giờ
trong protocol reference. Headless adapter cùng entry point engine
(`src/runner/coordination/headless-adapter.mjs`'s `runCoordinationHeadless` —
Added in candidate: removed in `2180b4e72`; former adapter),
khác duy nhất ở attachment/visibility/invocation lifecycle (R4). Ví dụ thật:
`docs/how-to/coordination-examples/*.json`; how-to:
`docs/how-to/run-a-coordination-session.md`.
````

