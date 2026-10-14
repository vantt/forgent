# Red-team plan "Hai cửa, một runUnit"

Ngày 2026-10-14. Chỉ đọc: không sửa plan, không sửa code, không commit. Quyết định đã chốt ở đầu `plan.md` em không mở lại; báo cáo này chỉ đánh vào cách thực hiện.

## Phạm vi và cách kiểm

- Đã đọc: `plan.md`, `protocol.md`, phase 00–11, 4 báo cáo `council-reopen-r4-*`.
- Đã kiểm lại trên code của main (`f59ba9701`) và các nhánh lane cũ. Những điểm đã khớp: danh sách commit của 3 nhánh B/C/D đúng như phase 00 ghi. Chạy `test/runner/operation-choice.test.mjs` trên `dispatch-write-boundary` được đúng 4 fail / 152 test, khớp báo cáo lane D. Dispatch đã tự từ chối lượt mutating trong main checkout (`src/runner/dispatch/assignment-runner.mjs:497`). Release cũ không từ chối key `runner.*` lạ ở cấp trên cùng (`validateRunnerConfigShape`, `src/runner/dispatch/config.mjs:1438`, không có vòng kiểm key lạ).
- Không chạy `npm test` toàn bộ và không chạy probe thật nào.

## Critical

### C1. Sau phase 10, Work không còn tìm thấy verdict validate-plan của chính nó

- **Bằng chứng:** `findLatestAssignmentRunResult` (`src/runner/operation-choice.mjs:104-140`) chỉ duyệt layout phẳng `.fgos/assignments/<id>/assignment.json` + `runs/`, và lọc bằng `asgn.workId === work.id`, `asgn.stage`, `asgn.resultKind`. Còn runUnit ghi layout lồng `.fgos/assignments/<unitRunId>/producer/1/assignment.json` (đã xem trên đĩa). Assignment của `dispatchBound` là literal `provenance.kind: 'unit-run'`, không có `workId`, `stage` hay `resultKind` (`src/runner/execution/run.mjs:342-372`). Đường "lastRunResult rỗng" của `operation-choice.mjs:808-810` cũng đi vào đúng hàm này.
- **Hậu quả:** khi D8 chuyển sang runUnit, mọi lượt validate-plan chạy xong mà Work không thấy. Item sẽ đứng ở `planning` hoặc chạy lại validate-plan mãi. Các test hiện có không bắt được vì fixture tự trao `lastRunResult`. Phase 08 không có câu hỏi nào về chuyện này. Phase 10 cũng không liệt kê hàm này, dù nó nằm trong file 10 sở hữu.
- **Sửa:** thêm vào spike 08 câu "Work tìm lại kết quả của mình thế nào". Mặc định em đề xuất: Work ghi `unitRunId` của mỗi operation vào event/state của item rồi đọc thẳng `.fgos/assignments/<unitRunId>/unit-summary.json`, không quét. Nếu vẫn quét thì walker phải hiểu layout lồng và lọc theo `declared`. Thêm test đỏ cho chu trình đầy đủ: driver chạy validate-plan qua runUnit, lượt `decide` kế tiếp phải thấy verdict và tiến cạnh. Theo ký ức đội, `.fgos/assignments` có từ 7 walker trở lên với cả hai layout, nên spike cần liệt kê hết walker nào đang đọc kết quả driver.

## High

### H1. `pinInputs` không nói rõ gốc đường dẫn, nên chặn plan cũ có thể sai cả hai chiều

- **Bằng chứng:** hash `plan.md` hôm nay đọc từ `resolveContentRoot(root, workId, docsRef)`. Hàm này lần lượt thử cwd, rồi worktree của item, rồi stateRoot (`src/runner/paths.mjs:223-243`, `assignment-runner.mjs:1529-1541`). Bên Work so sánh cũng theo đúng thứ tự đó (`operation-choice.mjs:783-806`). `fgos plan --validate` chạy validate-plan với `cwd: contentRoot` (`src/verbs/state/step.mjs:73-79`). Còn runUnit phân giải `inputs` theo `mainRoot` (`run.mjs:338`). Phase 10 chỉ ghi "path repo-relative", không nói tương đối với gốc nào. Đòn red-team 2 của phase 10 lại đòi "path ngoài repo → từ chối", trong khi `plan.md` thật thường nằm trong worktree của item, tức ngoài cwd của lượt read-only.
- **Hậu quả:** digest lấy ở một cây, so ở cây khác. Hoặc là verdict hợp lệ bị bỏ (item kẹt), hoặc là `null === null` bị hiểu sai.
- **Sửa:** Work truyền đường dẫn tuyệt đối đã phân giải. Dispatch chỉ băm đúng đường đó, với tập gốc được phép là `mainRoot` cộng các worktree mà git liệt kê. Thêm ca test: `plan.md` chỉ có trong worktree của item, validate-plan chạy từ stateRoot.

### H2. Rigor bị hạ thầm khi D8 đi qua runUnit

- **Bằng chứng:** `resolveAssignmentDispatchPolicy` nâng rigor theo ba nguồn: `opPolicy.rigor` (`assignment-policy.mjs:225-229`), `work.rigor`, và **`work.risk === 'heavy'` → high** (D18, `:245-251`). Phase 10 chỉ dựng `rigor: max(work.rigor, rigor bước)`, nên mất D18 và có thể mất cả `opPolicy.rigor`. Assignment của `dispatchBound` không có field `rigor` nào (`run.mjs:342-372`). Vậy yêu cầu của phase 11 "policy đọc `assignment.rigor`" không có nguồn dữ liệu. Guard ngữ nghĩa của 11 còn cấm `work.risk` trong dispatch, nên D18 bắt buộc phải dời sang Work, nhưng không phase nào ghi việc này.
- **Hậu quả:** item `risk: heavy` không khai rigor sẽ chạy tier standard. Số checker của pattern reviewed cũng đổi theo rigor. Test của phase 10 chỉ có ca `work.rigor: high`.
- **Sửa:** đưa câu 3 của spike thành "mọi nguồn rigor hôm nay: opPolicy, work.rigor, risk heavy, capability floor, `mutatingMinRigor`". Work tính đủ các nguồn đó rồi đặt `unit.rigor`, sau đó `dispatchBound` ghi `assignment.rigor`. Mỗi nguồn cần một test hồi quy.

### H3. Commit theo `writes` vẫn gom cả file người đang sửa dở trong phạm vi

- **Bằng chứng:** phase 02 bước 2 lấy ứng viên từ `git status --porcelain`, gồm mọi file bẩn. Thứ được lọc chỉ là index (foreign index). Báo cáo red-team r4, phần residual, đã nêu: "Selective landing can still include pre-existing unstaged in-scope changes; scope is not authorship". Plan không xử lý điểm này.
- **Hậu quả:** khi chạy `fgos run "<prompt>" --writes docs --worktree <wt của người>` mà người đang sửa dở `docs/x.md`, file đó bị commit dưới subject của agent. Với scope `['**']` (loop, fanout, D8 mutating) thì giữ nguyên hành vi `add -A` cũ, chấp nhận được. Riêng one-liner và `--units` là cửa mới nên không cần kế thừa lỗi này.
- **Sửa:** chụp `preLaunchDirt` (settlement đã có sẵn). Lúc launch, nếu file trong phạm vi đã bẩn thì từ chối và liệt kê path, trước khi tốn lượt agent (xem H4). Một cách khác là loại các file đó khỏi commit và trả `commit.preDirtyInScope`. Em khuyên từ chối vì đơn giản và không đoán tác giả.

### H4. Lỗi foreign index chỉ lộ ra sau khi agent đã chạy xong

- **Bằng chứng:** phase 02 req 1 kiểm index ở bước commit, tức sau cả lượt agent. Commit `failed` làm outcome thành `execution-failure` (`run.mjs:507`). Thông điệp lỗi bảo người chạy `fgos run --resume <id>`, nhưng plan không nói resume sẽ chạy lại agent (tốn thêm một lượt, và worktree đang chứa sẵn file của lượt trước) hay chỉ thử commit lại.
- **Hậu quả:** đi ngược D-ADR0030 mục 1 và 2: người quay lại thì thấy lượt hỏng vì một điều kiện đã biết ngay từ lúc launch.
- **Sửa:** kiểm cả foreign index và in-scope dirty (H3) lúc launch, trước khi spawn. Ở bước commit vẫn kiểm lại như phòng thủ thứ hai. Cần định nghĩa đường "chỉ commit lại" khi resume một lượt đã `pass` mà commit hỏng, và đường này không được chạy agent lần nữa. Ca `committed-set-mismatch` (commit đã nằm trên nhánh, round fail) cũng cần nói rõ resume làm gì.

### H5. `--units` có ghi: nhánh không được tích hợp, unit phụ thuộc không thấy thay đổi của unit trước

- **Bằng chứng:** workflow chỉ tích hợp ở step `kind: 'integrate'` (`src/workflow/runner.mjs:373-390`). Worktree của unit tạo từ `baseRef = 'HEAD'` của main root (`src/workflow/integrate.mjs:33-56`) trong `os.tmpdir()`. `settleUnitWorktrees` giữ lại unit chưa tích hợp với lý do "branch not integrated" (`runner.mjs:220-262`). Phase 05 không nói `units-source` có thêm step integrate hay không. G1 chỉ thử 2 unit `writes: []`.
- **Hậu quả:** N2 nhiều unit có ghi: B `dependsOn: [A]` chạy trên HEAD cũ, không thấy code của A. Kết quả nằm rải ở các nhánh `wf/<run>/<unit>`, người phải tự gom. Đây đúng là chỗ "sai tới sai lui" sau G1.
- **Sửa:** chốt ở 05 trước khi code. Phương án nhỏ nhất: unit ghi phụ thuộc unit ghi thì worktree của B lấy base là nhánh của A; output của `workflow start --units` liệt kê nhánh và worktree của từng unit; không tự merge vào trunk. Thêm vào G1 một ca 2 unit ghi có phụ thuộc.

### H6. Verb mới `fgos fanout-batch` bị Rust host từ chối; G3 gọi một verb không tồn tại

- **Bằng chứng:** Rust `fgos` chỉ nhận selector có trong `packages/host-runtime/contracts/command-routes.json`, được nhúng lúc build (`apps/fgos/src/main.rs:24-49`). Hiện có 75 route, không có `fanout-batch`. `test/rust-host/command-routes.test.mjs` cùng `assertAllSelectorsListed` (`scripts/export-command-selectors.mjs:200-213`) đòi registry và route khớp số lượng. File route không có trong danh sách sở hữu của phase 06, và thêm route nghĩa là phải build lại Rust cho `fgos:dev` lẫn release. Riêng G3 bước 3 dùng `fgos:dev -- step <id>`, nhưng không có verb `step`: `planUseCase` được gọi qua `fgos plan <id> --validate` (`bin/fgos.mjs:1170-1190`).
- **Sửa:** dời phần fanout sang runUnit vào 09, vì đó cũng là một bước chuyển tầng Work giống `spawnWorker`. Lối vào nên là `node src/runner/fanout-batch.mjs` (skill fanout vốn đã gọi `node src/runner/dispatch.mjs fanout-batch`, `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md:56`) để không phải đụng route Rust. Nếu vẫn muốn có verb thì thêm route vào file sở hữu của 06. Sửa G3 thành `fgos plan <id> --validate`.

### H7. Bản render ở project khác vẫn dạy cửa đã xoá; rollback mới tính ở mức git

- **Bằng chứng:** `mcp-skill-hub` và `mdview` có bản copy `.agents/skills/_shared/executor-dispatch-fallback.md`, `coding-worker-contract.md`, `fgos-fanout/SKILL.md`, `fgos-coding-implement/references/return-mechanics.md` đều dạy `dispatch execute` (đã grep). Activation đi theo từng workspace, ghim digest chính xác (`.fgos/installation/activation.json`: `pinSnapshot.policy: exact-digest`, có `previousArtifactDigest`). Câu của plan "doctrine render đi theo release" (phase 07, phần rủi ro) chưa được kiểm: nếu activation không render lại `.agents/skills` của từng project thì agent ở đó đọc doctrine cũ trên binary mới.
- **Sửa:** thêm vào bước activate (do owner chọn lúc) checklist cho từng project: activate, `fgos setup`, `rg "dispatch execute" .agents .claude` phải ra 0. Rollback thật là `fgctl repair` về `previousArtifactDigest`, không phải `git revert`. Ghi rõ như vậy trong phase 06 và 07.

### H8. Chặn `[ ] { } ! ?` trong `writes` từ chối path hợp lệ của project dùng fgOS

- **Bằng chứng:** phase 01 req 1 từ chối các ký tự đó. Nhưng phase 02 đưa cho git danh sách file literal (`GIT_LITERAL_PATHSPECS=1`), và matcher chỉ diễn giải `*`/`**`. Path kiểu Next.js `app/[slug]/page.tsx` hay `app/(group)/[id]/route.ts` rất phổ biến ở mission #1.
- **Sửa:** chỉ coi `*` và `**` là ký tự đặc biệt, mọi ký tự khác là literal. Vẫn chặn `:` đầu path, `..`, path tuyệt đối, `\` và NUL. Thêm ca `app/[slug]/page.tsx` vào bảng test của 01.

### H9. N1/N2 chưa "dùng được thật" chừng nào chưa activate một release

- **Bằng chứng:** plain `fgos` chạy release đã activate. Plan để chuyện activate làm câu hỏi mở 2, và chỉ nhắc sau G2. Mọi cổng G0–G3 chạy `npm run fgos:dev` bên trong repo fgOS.
- **Hậu quả:** owner và project khác chỉ thấy N2 sau G2, dù code đã xong từ G1. Phát hành ở G1 hoàn toàn cộng thêm (chưa xoá gì), nên rủi ro thấp. Phát hành ở G2 mới là bản rủi ro.
- **Sửa:** sau G1, build/stage/activate cho repo này và một project thử (ví dụ `fgos-test-drive`), rồi chạy one-liner read-only cùng preset từ project đó bằng plain `fgos`. Bước này có thể làm song song với W4. G2 cut một release riêng.

### H10. Plan song song 3–4 lane nhưng không nói lane chạy bằng cơ chế nào

- **Bằng chứng:** protocol yêu cầu lane tự `git commit` và tự chạy `npm test`. Executor out-of-process chạy confined có gitdir read-only (tức chính lý do của R0). Theo ký ức đội, executor claude headless không tự chạy test được. Còn agent in-process song song thì đã có tiền lệ đua ghim worktree và ghi vào main checkout (ký ức "fanout worktree pin race", "Parallel drivers need worktree pinning"). Đường găng ~9.5 ngày giả định 3–4 lane chạy song song an toàn.
- **Sửa:** ghi rõ cơ chế của từng lane. Từ W4, chạy lane bằng chính `fgos run --unit` có `writes` (runner commit, Lead chạy `npm test` trước khi merge): vừa đúng cơ chế, vừa là dogfood N2. Nếu dùng agent in-process thì mỗi lane `isolation: worktree` riêng, và Lead `pwd`/`git -C` kiểm trước merge.

## Medium

### M1. Phase 00 sửa kỳ vọng test ngược với chính tên test

Test thứ 4 tên là "...correctly reports failed, **not silently downgraded to no-evidence**". Phương án B đổi kỳ vọng thành `validation-no-evidence-do-not-advance-work`. Đúng là cả hai nhánh đều `stop: true` và `canAdvanceEdge: false` (`operation-choice.mjs:823-840`), nên điều khiển không đổi, nhưng operator mất tín hiệu "có thay đổi lạ", và chuyện này trái với "không nới test". **Sửa:** dùng một reason riêng (ví dụ `validation-correlated-mutation-do-not-advance-work`) hoặc giữ `failed` kèm `warnings`, đổi tên test có chủ đích, ghi lý do trong báo cáo lane.

### M2. Hai lần ff 07 rồi 06 phá đúng bất biến plan tự đặt

Phase 07 dạy verb `fgos fanout-batch` và shape `fired[]` mới, mà cả hai chỉ có sau khi 06 vào. Giữa hai lần ff, main dạy một cửa chưa tồn tại, trong khi có các phiên khác đang chạy. **Sửa:** 06 rebase lên nhánh 07, Lead ff một lần tới tip của 06. Nếu nhận H6 (dời fanout sang 09) thì phần này cũng đi theo 09.

### M3. Red-team và cổng có phần nghi thức

- Không có red-team cho 00 (giải xung đột ở `settlement.mjs` CRITICAL, 9 luồng), 04 (`bind` HIGH, đổi cách chọn executor) và 05 (G2, persona, `--units`).
- Danh sách đòn do chính người viết plan soạn trước. Red-team cần được tự do tấn công, danh sách chỉ là sàn tối thiểu.
- Mỗi cổng là một lượt happy-path, task viết docs, rigor low. Không ca nào thử `--seats`, `--effort`, `--units` có ghi, hay failover (UNPROVEN).
- **Sửa:** red-team cho 00 và 04. Thêm vào G1 ca `--units` có ghi (H5) và một preset có `--seats`. Lượt nào mà người đọc chưa xem transcript thì không tính là đạt.

### M4. `runner.generatedPaths` trong `DEFAULT_RUNNER_CONFIG` sẽ tự ghi vào config của mọi project

`ensureRunnerConfigForDir` tự thêm key mặc định còn thiếu rồi ghi lại `.fgos/config.json` (`config.mjs:353-368`), là file được git track ở cả repo này lẫn project khác. Nó ghi cả vào main checkout khi lane chạy `fgos:dev` (runUnit lấy snapshot config từ `mainCheckoutRoot`, `run.mjs:115-118`). Release cũ không từ chối key này, nên bước 6 của phase 01 (đo release cũ) gần như chắc chắn ra "không sao". Rủi ro thật nằm ở chuyện bẩn file đang track. **Sửa:** không đưa key vào DEFAULT, đọc mặc định `[]` trong code. Doctor check vẫn giữ.

### M5. Thư mục plan chưa được commit

`git status` cho `?? plans/261014-1400-two-doors-one-rununit/`. Worktree lane tạo từ main sẽ không có phase file hay `reports/`. Probe G0/G1 lại ghi vào `plans/261014-1400.../reports/`. **Sửa:** commit thư mục plan lên main trước W0, dùng `git commit -- <path>`.

### M6. Đường găng và tổng công đang lạc quan

- Ước lượng chưa tính vòng review/red-team. Theo `npm test` của các lane cũ, mỗi lượt full suite mất khoảng 635s. Mỗi lần merge cần một lượt trên lane sau rebase và một lượt trên main, nên W4 có 4 lane là khoảng 85 phút suite chạy tuần tự, chưa kể fail.
- Phase 10 sẽ lớn hơn 2.5d khi tính thêm C1, H1, H2.
- Đường găng trong plan bỏ sót đoạn 05 tail + G1 trước 10 (10 phụ thuộc G1).
- Thực tế: khoảng 11–12 ngày lịch cho cả plan.

### M7. Phase 09 còn thiếu đòn

Cần thêm ba đòn:
- Khi loop chạy trong herdr, runUnit có thể chọn transport herdr. Lúc đó có thể không có `stdout.log` cho `lastWorkerOutput`.
- `reapOrphanedConfinementResources` chạy ở mỗi lần gọi runUnit (`run.mjs:158`), nên khi loop chạy nhiều worker đồng thời thì có thể dọn nhầm home riêng của worker khác.
- Runner bị SIGKILL thì khoá cwd của worktree item treo tới hết TTL (35 phút, theo ký ức đội), và lượt sau của loop bị từ chối "already in flight".

### M8. Chia sở hữu file

`src/runner/loop.mjs:1902` re-export `fanoutBatchExecutorCli`. Phase 06 sở hữu `fanout-batch.mjs` nhưng L9 mới sở hữu `loop.mjs` trong W4. **Sửa:** ghi rõ người sửa dòng này. H6 giải quyết luôn điểm này.

## Low

- **L1.** Heredoc của G0 (`phase-03:46`) chạy `mkdir -p .fgos/runtime/tmp` mà không nói cwd, nhưng lệnh sau lại dùng đường dẫn tuyệt đối dưới main. Nên dùng đường dẫn tuyệt đối cho cả hai.
- **L2.** G1 bước 3 đếm `ls .fgos/assignments | wc -l` không đổi. Có phiên khác ghi cùng lúc nên phép đếm này dễ chập chờn. Nên kiểm "không có unit-run mới nào có `unit.id` bắt đầu bằng `adhoc-`".
- **L3.** Giữa bước kiểm index và `git commit` vẫn còn khe TOCTOU, hiện chỉ phát hiện được sau commit. Nên ghi là residual, đừng hứa là chặn được.
- **L4.** `expandGenerated` thô kéo cả cây render. Khi đã có entry, nếu trong worktree có render lệch do `fgos setup` của release cũ thì nó vào commit. Hiện chấp nhận được vì entry chỉ được thêm sau khi activate.

## Trả lời 5 câu của Lead

1. **Lịch:** xem mục cuối. Có hai chỗ bị tuần tự hoá mà không cần:
   - 01 không phụ thuộc 00 thật. Chồng lấn với nhánh B chỉ có 17 dòng ở `config.mjs` và 2 dòng ở `run.mjs`; rebase là xong.
   - 04 và 05 không cần đợi G0. 04 sửa `unit.mjs`/`bind.mjs`/bin, 05 sửa `src/workflow/**`; chúng chỉ cần 01 (cho `unit.mjs` và `definition.mjs`). G0 và G1 gộp được thành một cổng: nếu G0 hỏng thì chỉ 02/03 phải làm lại, 04/05 không bị ảnh hưởng.
   - 08 bắt đầu được ngay sau 00, vì nó chỉ đọc.
   - Phần fanout của 06 là việc tầng Work, nên gộp vào 09.
2. **Sai tới sai lui:**
   - Rủi ro lớn nhất là 10: spike thiếu ba câu C1, H1, H2.
   - Kế đến là 05 với H5: `--units` có ghi chưa có thiết kế tích hợp.
   - Thứ tự merge 07→06 cần là một lần ff (M2).
   - Phương án B ở 00 sẽ bị viết lại ở 10. Chấp nhận được, nhưng đặt reason riêng ngay từ đầu (M1) thì 10 khỏi phải đổi kỳ vọng thêm lần nữa.
   - 4 test đỏ của 00 đã tái hiện đúng (148/152 pass), nên bước 2 của 00 an toàn.
3. **An toàn:**
   - Commit theo `writes`: thiếu H3 (file bẩn sẵn trong phạm vi), H4 (lỗi lộ sau lượt agent), L3 (TOCTOU).
   - Xoá D1/D2/D3: gãy bản render ở project khác (H7) và route Rust (H6). Trong `src/` không còn caller sống nào ngoài các chỗ plan đã liệt kê (đã grep `src bin scripts core domains`).
   - Cắt Work: mất bảo đảm rigor (H2) và stale-plan (C1, H1) nếu làm theo plan như đang viết.
4. **Validate/red-team:** có phần nghi thức (M3). Cổng G0/G1 chứng minh được one-liner và preset trong repo fgOS, nhưng chưa chứng minh `--units` có ghi, `--seats`, `--effort`, hay đường release đã activate (H9).
5. **Thiếu:** rollback ở mức release (`fgctl repair`, H7); route Rust (H6); doctor không cần thêm gì ngoài check của 01; key config mới nên đọc mặc định trong code (M4); và commit thư mục plan (M5).

## Đường nhanh nhất tới N1+N2 dùng được

**N1 thật ra đã gần như có sẵn:** `workflow start <preset> --seats` đã có trong CLI (`bin/fgos.mjs:2171-2197`), và 7 preset nằm ở `core/workflows/`. Phần N1 còn thiếu chỉ là `--effort` (05) và doctrine. **N2 hôm nay** chạy được qua `fgos run --unit - --override '{"executor":"<id>"}'`. Còn thiếu: cú pháp một dòng, `--units`, lượt ghi tự commit (R0), và doctrine. Ngoài ra doctrine hiện đang dạy `--units`, một cờ chưa tồn tại (`core/skills/fgos-run/SKILL.md:31`).

| Bước | Nội dung | Song song với | Ước lượng |
|---|---|---|---|
| S0 | Commit thư mục plan (M5); bổ sung C1/H1/H2 vào câu hỏi của 08; chốt H3/H4 vào 02, H5 vào 05, H8 vào 01 (Lead sửa plan) | — | 0.25d |
| A | 00 (Lead) ∥ 01 (nhánh từ main, rebase sau 00) ∥ 08 spike | 3 lane | 1d |
| B | 02 (+ preflight H3/H4) ∥ 03 ∥ 04 ∥ 05-core (+ H5) | 4 lane, file không chồng nhau | 1.25d |
| C | 05 tail CLI (sau 04) ∥ 07a: doctrine cộng thêm (dạy one-liner/`--units`, chưa xoá gì) | 2 lane | 0.25–0.5d |
| D | Cổng gộp G0+G1 (gồm `--units` có ghi, `--seats`); Lead áp spec/CHANGELOG | — | 0.5d |
| E | Build/stage/activate release cộng thêm cho repo này và một project thử; chạy one-liner và preset bằng plain `fgos` từ project đó | song song với mở W4 | 0.25d |

**N1+N2 dùng được thật sau khoảng 3.5–4 ngày lịch** (cộng 0.5d đệm review), so với khoảng 6 ngày theo plan hiện tại (00→01→02→G0→04→05 tail→G1, chưa activate). Phần còn lại (06 chỉ xoá, 07b, 09 + fanout, 10, 11) chạy sau đó, không chặn việc dùng N1/N2. Với C1/H1/H2 thì nhánh này thực tế mất khoảng 6–7 ngày nữa.

Phase cắt mỏng được mà không phải làm lại:
- 06 thành chỉ xoá + guard import, khoảng 1d; fanout chuyển sang 09.
- 07 tách 07a (cộng thêm, đi cùng G1) và 07b (gỡ cửa cũ, ff cùng 06).
- 03 giữ nguyên.
- 08 làm ngay ở đợt A, để spike kịp thời gian duyệt trước W4.

Status: DONE_WITH_CONCERNS
Summary: Plan không bị chặn, nhưng phase 10 như đang viết sẽ làm Work mất dấu verdict validate-plan (C1, đã xác minh trên code), lấy digest `plan.md` không rõ gốc (H1) và hạ rigor (H2). Commit theo `writes` vẫn gom file người đang sửa dở (H3), và `--units` có ghi chưa có thiết kế tích hợp (H5). Bỏ hai chỗ tuần tự không cần thiết và activate release ngay sau G1 thì N1+N2 dùng được thật sau khoảng 3.5–4 ngày lịch thay vì khoảng 6.
