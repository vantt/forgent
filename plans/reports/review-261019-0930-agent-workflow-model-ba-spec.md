# Review độc lập: bản nháp spec BA mô hình agent ↔ workflow (lane AGENT-WF)

Viết 2026-10-19 (Asia/Saigon), reviewer `agentwf-spec-review` (Kongming, advisory-only, không sửa spec). Đối tượng: `docs/specs/workflow.md` trên nhánh của worktree `agent-a63a3913e5e0beb1e` (3 commit `9ec72efbc`, `2834832e2`, `7020f1d17`) cộng diff của `component-boundary.md`, `reading-map.md`, `runner.md`; cover note `spec-draft-261019-0921-…`; hướng owner `brief-261018-2235-…`; hai gói hội đồng (settled `unit-run-1792368757620-6e4020ea`, reopen `unit-run-1792374387809-85a2ae93`). Mọi khẳng định về code được kiểm trên main checkout `ca3a91c67`.

## Kết luận ngắn

**Sẵn sàng trình owner sau khi sửa** (không cần vòng hội đồng mới). Mô hình đúng với hướng owner, không to hơn cần thiết, phần đặt chỗ N13–N17 phần lớn đúng với code. Nhưng ba chỗ chưa thi hành được như đang viết — và chúng đều là chỗ N1 (luật owner đã chấp nhận) dựa vào:

1. Test kiến trúc đang có **cấm** `src/runner/execution/**` và `src/runner/dispatch/**` import bất cứ gì từ `workflow/`; spec cho cửa và cổng ghi gọi admission trong `src/workflow` mà không nói gì. Phải chọn: port do Execution Core sở hữu (khuyến nghị) hay sửa test.
2. Mỏ neo "ràng buộc worktree/nhánh trên ledger" chưa có **chỉ mục tra ngược** (worktree → case) và chưa có **mutex liên-case** (`advance` theo run, không theo repo): hai case có thể ràng cùng một worktree, và cửa phải quét mọi ledger mỗi lần dispatch.
3. Một gap owner phải thấy rõ, không được nằm trong một ô bảng: N1 chỉ ràng **hai cửa**; chỉnh sửa trong phiên (Edit/Agent in-process — chính đường mà bằng chứng 6.4 của spec nói tới) vẫn ngoài ledger, chỉ còn approve door giữ.

Phần còn lại là sửa chữ và vài quyết định nhỏ nên trình owner cùng lúc.

## Trả lời năm câu hỏi của lead

| # | Câu | Trả lời ngắn |
|---|---|---|
| 1 | Trung thành với hướng owner, không to hơn (RUL104)? Có tái tạo rails hay scheduler thứ hai? | **Có trung thành.** Ba phần (a)/(b)/(c) tách đúng (§1, RUL-WF-1); milestone thay số bước (RUL-WF-2, -3); MUST/SHOULD/MAY instead đúng phép thử của owner (RUL-WF-4); unlisted + `listedRoutesOnly` (RUL-WF-5); N1 fail-closed (RUL-WF-11). Danh sách "không đề xuất" (§12) khớp gói hội đồng. **Không có scheduler thứ hai:** Playbook driver đi qua admission (RUL-WF-18) và vòng DAG hôm nay bị viết lại thành bộ đề xuất. Một chỗ *nguy cơ* to ra: RUL-WF-12 cho Execution Core ghi vào ledger mỗi seat launch (xem S6). |
| 2 | N13/N14/N15/N17/R1 đúng, tối thiểu, thi hành được? | N13 đúng (ba nghĩa "runner" có thật). N14 đúng và đã có điều kiện đảo. N15 đúng về rank (holder-lock spec:138 "a scope may only take a lock of a higher rank than every lock it holds" → giữ `advance` 80 không lấy được `event-append` 70). N17 **bắt buộc** và đúng (runner.mjs:845, :879, :1120, :1171, :1324) nhưng một trong hai cơ chế spec nêu (attempt custody) đắt hơn nhiều so với spec ngụ ý (S7). R1 **chưa thi hành được như viết** (B1, B2, S2, S3). |
| 3 | Phân tầng không vòng, đúng rank manifest, không ai nhận authority sai, chiều phụ thuộc Execution Core ↔ Workflow? | Rank trong §5.3 khớp manifest (`run.mjs` và `workflow/runner.mjs` use-case; `store.mjs`, `ref-digests.mjs` infra; `definition.mjs`, `steps.mjs` kernel; `authority.mjs`, `assignment-runner.mjs` infra). **Nhưng** test A4 cấm import `workflow/` từ execution/dispatch (B1), nên "Execution Core gọi admission" như viết là một vòng **component** hai chiều mà test hiện có không cho. Cách giữ đúng Design Principle 2–3: Execution Core sở hữu **AdmissionPort**, Workflow cài, nối ở entry. Không component nào nhận authority sai; Session Identity giữ nguyên là đúng. |
| 4 | Stranger agent (L5) viết plan được không? | Phần lớn: thực thể, luật, battery 15 kịch bản, ba ví dụ. Thiếu để viết plan an toàn: tên hai test phải đổi/được giữ (S8), hình dạng tối thiểu của chỉ mục binding (B2), thứ tự lock cho case lồng (S4), cách driver thức dậy sau answer (S5), thời điểm admission so với pattern resolution (S9). |
| 5 | Owner phải quyết gì mà spec giấu; spec quyết gì lẽ ra phải hỏi? | Giấu: (i) gap in-session (S1); (ii) port vs sửa test (B1); (iii) đếm seat launch bằng draw hay bằng trần giao cho Unit (S6). Tự quyết hợp lý, không cần hỏi: file spec mới, boundary rows đặt cạnh, không CHANGELOG, không sửa system-overview. |

## Findings theo mức độ

### Blocking

**B1. Test A4 cấm chính quan hệ consumer mà spec khoá.** `test/architecture.test.mjs:846-865` — với mọi file trong `src/runner/dispatch/**`, `src/runner/execution/**`, `src/runner/dispatch.mjs`, `src/workflow/**`, test fail nếu import khớp `/(\/workflow\/|^workflow\/|\.\.\/.*workflow\/)/`. Spec §5.2 (b), §5.3 và boundary row Execution Core nói cửa `run.mjs` (use-case) và cổng ghi `authority.mjs`/`assignment-runner.mjs` (infra) **gọi admission** đặt "ở infra hoặc thấp hơn" trong `src/workflow`. Cả cửa lẫn cổng đều nằm trong tập bị cấm. §5.3 chỉ nói "A4 không đổi: ledger của case không phải state của Work" — đúng cho `src/state`, nhưng test còn một vế `workflow/` mà spec không nhắc. L5 câu 4 ("có đổi hành vi được test phủ không?") chưa được trả lời.

*Sửa (khuyến nghị, giữ test nguyên):* Execution Core khai một **port** trong tầng của nó — ví dụ `admission: { bindingOf(worktreeIdentity), admit(proposal), settle(reservationId, receipt) }` — `runUnit()` nhận port qua options; Workflow cài port; nối ở entry (`bin/fgos.mjs` cho `fgos run`, `src/workflow/runner.mjs` cho Playbook driver, Work driver loop khi cutover). **Fail-closed bằng cấu trúc:** `runUnit` từ chối Unit ghi file khi không có port (test cung cấp port "không ràng buộc" tường minh). Khi đó phụ thuộc module một chiều (Workflow → Execution Core), test A4 giữ nguyên, Execution Core đúng nghĩa "sở hữu điểm chặn, không sở hữu luật" (§5.2). Ghi rõ vào §5.3 và boundary row.
*Sửa thay thế:* nới test A4 cho đúng một leaf `src/workflow/admission.mjs` — rẻ hơn nhưng đưa tri thức Workflow vào Execution Core, trái Design Principle 2; chỉ chọn nếu owner muốn ít code hơn.

**B2. Mỏ neo ràng buộc worktree/nhánh chưa có chỉ mục và chưa có mutex liên-case.** RUL-WF-11 bullet 1: "Cửa từ chối, trước `bind()`, một dispatch ghi file nhắm vào worktree/nhánh đang bị ràng buộc với một constrained case mở mà không gọi tên case". Để từ chối, cửa phải trả lời "worktree W có bị case nào mở ràng không?" — hôm nay chỉ có ledger theo run (`.fgos/workflow-runs/<id>/events.jsonl`, 90 run), nghĩa là quét và fold mọi run mỗi lần dispatch; và `advance` là mutex **theo run** (`lock-registry.v1.json`: `advance` scope `run`), nên hai `workflow start` đồng thời có thể ràng cùng một worktree mà không ai chặn. Worktree của case hôm nay là `mkdtemp` dưới `os.tmpdir()` (`src/workflow/integrate.mjs:41`), không có bản ghi nào theo worktree. Spec không nêu cả hai.

*Sửa:* khoá hành vi, không khoá bố cục: (1) ràng buộc là một **bản ghi theo danh tính worktree** (realpath → dev-ino, đúng cách `dispatch-cwd` đã khoá, `src/runner/dispatch/cwd-lock.mjs:5-6`), tạo **atomic-exclusive** (O_EXCL) khi case ràng, xoá khi close/fence; tồn tại + nêu case khác đang mở → từ chối. Tạo exclusive là mutex, không cần hàng lock mới. (2) Bản ghi là **view** dựng lại được từ ledger (L3): ledger ghi event `binding`, chỉ mục chỉ để tra O(1). (3) Battery thêm kịch bản: hai case ràng cùng worktree → case thứ hai bị từ chối lúc start/reservation. Chỗ ở (`.fgos/workflow-runs/bindings/` hay cạnh `dispatch-cwd`) để plan chọn.

### Should-fix

**S1. Gap in-session phải lên mặt bàn owner.** §8 hàng "Skill trong phiên lái một Work item": "Lời gọi Agent/Task trong phiên mà ghi workspace khi một case đang mở thì nằm **ngoài** ledger". Đúng và thành thật, nhưng bằng chứng mở đầu của spec (§16: "chuỗi lead 6.4 cho thấy luật chỉ-văn-xuôi bị bỏ qua ba lần") là **chuỗi lead trong phiên**, không phải Unit qua cửa. Tức là N1 không che đúng lớp sự cố mà spec dùng để biện minh. Owner cần quyết có chấp nhận "N1 = hai cửa; in-session chỉ còn approve door" hay không. *Sửa:* nêu thành một mục riêng ở §1 hoặc §13 và trong "Câu hỏi chỉ owner trả lời được" của cover note; ghi phương án đóng sau (ví dụ hook PreToolUse đọc chỉ mục binding của B2 và từ chối Edit/Agent in-process vào worktree bị ràng khi phiên không gọi tên case) như dòng RUL104, không cài trong spec.

**S2. "Ràng buộc worktree rộng ít nhất bằng `writes` của khung" lẫn hai phạm trù.** RUL-WF-11 bullet cuối và R1: `writes` là đường dẫn repo-relative, worktree là checkout; "rộng bằng" không đo được. Hệ quả thật spec muốn: *không có worktree nào mà activity của case được phép ghi lại không bị ràng.* *Sửa:* (a) ràng lúc **reservation**, không chỉ lúc start: reservation ghi file nêu worktree; worktree chưa ràng → ràng cho case ấy dưới `advance` (từ chối nếu case khác đã ràng, B2); (b) worktree Unit do harness tạo (`createWorkflowWorktree`) tự động ràng; (c) bỏ câu "rộng bằng `writes`".

**S3. Khung không thể đếm dispatch không gọi tên case.** RUL-WF-12: "Dispatch của chính conductor và case lồng đều tính"; RUL-WF-11: "Dispatch chỉ-đọc không bị N1 ràng buộc; nếu chạy trong một case thì vẫn tính vào khung". Một `fgos run` chỉ-đọc của conductor trong phiên owner mà không gọi tên case thì cửa **không biết** nó thuộc case nào — không ràng worktree (chỉ-đọc) và không env (phiên owner). Nên "đều tính" chỉ đúng cho dispatch **đã admit**. *Sửa:* viết thẳng: khung đếm dispatch được admit; dispatch chỉ-đọc không gọi tên case là ngoài khung theo cấu trúc; conductor skill (`fgos-cook`) có nghĩa vụ gọi tên case ở mọi dispatch, kể cả chỉ-đọc, và điều đó là luật của skill, không phải guard.

**S4. Case lồng tiêu khung cha = hai lock cùng rank trong một scope.** §8 "Playbook lồng" và RUL-WF-11: case con tiêu khung cha "lúc admission case con". Cả hai `advance` đều rank 80; holder-lock spec:210: "two locks of the same rank in one scope are forbidden" → ném `lock-order-violation`. *Sửa:* khoá hành vi: trừ khung cha là **một critical section riêng** dưới `advance` của cha (ghi `reservation` vào ledger cha, nhả), **rồi** mở case con; không bao giờ lồng hai `advance`. Battery thêm kịch bản case lồng.

**S5. N17 chưa nói driver thức dậy thế nào sau `answer`.** Hôm nay `answerWorkflow` tự chạy `advanceWorkflowRun` trong tiến trình trả lời dưới `advance` (runner.mjs:1169-1180), tức tiến trình answer **trở thành** driver. Dưới N6+N17 driver tách rời còn sống trong lúc Unit chạy và gate đậu; nếu answer vẫn tự advance → hai driver (đúng lỗi N17 muốn tránh). §7.4/§7.6 chỉ nói resume. *Sửa:* khoá hành vi: `answer` chỉ append gate answer (gắn digest subject) dưới `advance` ngắn; driver đang sống đọc lại projection sau mỗi settle; `answer`/`resume` chỉ đẻ driver khi **không** có driver sống (theo sự thật sống/chết riêng của §5.4). Battery 14 mở rộng: answer trong lúc driver sống không đẻ driver thứ hai.

**S6. Đếm seat launch bằng draw mỗi launch làm Execution Core ghi ledger giữa chừng; có cách nhẹ hơn.** RUL-WF-12: "Execution Core rút một đơn vị cho mỗi seat launch" → mỗi launch trong `runRole` (run.mjs:755, :877 `for (;;)`) lấy `advance`, đọc JSONL, append — Execution Core trở thành writer của ledger (trái RUL-WF-24 "một cửa ghi ledger" trừ khi qua port), thêm N lock/append mỗi Unit. Bảo đảm tương đương và đơn giản hơn: admission **giữ trần** (đã có trong spec: ghế × `maxRounds` × fallback), **giao trần ấy cho Unit** như một bound của Unit (cạnh `timeoutMs`, `maxRounds`); `runUnit` tự dừng launch khi hết; **settle** ghi số đã dùng + `frame-exhausted` nếu chạm trần. Ledger chỉ bị chạm hai lần (reserve, settle); "còn lại" trong lúc chạy hiển thị reservation (đúng nghĩa reservation). Kết cục ghế giữ nguyên như spec (provider-limit + `fallbackExhausted`). Battery 13 vẫn kiểm được qua settle. *Đây là lựa chọn RUL104 (nhẹ hơn, ít lock hơn, không thêm writer) — nên trình owner cùng B1.*

**S7. N17: "attempt custody" đắt hơn spec ngụ ý; nêu sự thật để làn holder-lock chọn đúng.** Driver tách rời hôm nay là `spawn(..., {detached: true})` của `fgos workflow resume --foreground` (runner.mjs:898-918), **không** phải một attempt dưới Run Supervisor — nên "đọc từ custody attempt của driver" đòi đưa driver vào gate/supervisor (envelope, attempt lock, adopt…), lớn hơn hẳn một hàng lease theo run (`attempt` rank 15 là mẫu sẵn). Spec để làn holder-lock chọn là đúng; nhưng nên ghi sự thật này ở §5.4/R-list để làn ấy không chọn nhầm vì tưởng custody đã có.

**S8. Nêu tên hai test ở §5.3 (L5).** "Test cô lập kernel" = `test/state/domain-registry-compiled.test.mjs:26-41` (sáu file: `src/state/domain-registry.mjs`, `src/workflow/definition.mjs`, `src/runner/dispatch/write-scope.mjs`, `src/runner/dispatch/run-timeout.mjs`, `src/workflow/steps.mjs`, `domains/coding/compiled.json`; chạy `domainSteps` trong child process không có gì khác). "Test A4" = `test/architecture.test.mjs:846-865` (B1). Stranger agent cần tên file để viết plan.

**S9. Thời điểm admission so với pattern.** §5.2 (a) "xin admission trước `bind()`/spawn"; RUL-WF-12 trần seat launch "tính từ pattern nó sẽ chạy". Pattern và số ghế (reviewed: checker theo rigor) được giải ở `resolvePattern` (presets, domain) trước bind — đúng, nhưng spec nên viết "sau khi pattern được giải, trước `bind()`" để plan không đặt admission trước khi biết số ghế.

### Note

**N-a.** §10.2: `listedRoutesOnly` xuất hiện trên milestone `approved` **và** trên decision point `{at: approved}`; RUL-WF-5/N9 nói cờ có authority ở decision point, bản sao route table chỉ là tài liệu — bản trên milestone là chỗ thứ ba. Bỏ khỏi milestone trong phác thảo.
**N-b.** §10.2 `frameDefaults` chứa chuỗi ("theo số con của plan") ở ô số; banner "chỉ minh hoạ" có, nhưng thay bằng "đặt lúc duyệt từ plan" để không bị chép.
**N-c.** N15: ứng viên cụ thể cho làn holder-lock là re-rank `advance` xuống 65 (giữa `state` 60 và `event-append` 70): sau N17 `advance` chỉ bọc reserve/release, không còn bọc integrate (merge-slot 20/main 50 hôm nay chạy dưới `advance` nhờ scope riêng), nên 65 không vi phạm gì. Chỉ là gợi ý, quyền ở làn ấy.
**N-d.** `src/workflow/ref-digests.mjs:4` ghi `gate-answer:` là "already immutable" trong khi `writeGateAnswerFile` (runner.mjs:1226-1229) cho câu trả lời sau **thay** câu trước; RUL-WF-14 sửa đúng hướng (từ chối thay approval đã tiêu). Plan nhớ đổi cả comment/hành vi digest.
**N-e.** `docs/specs/system-overview.md` hiện không có hàng `workflow`; cover note đã nói thêm khi land — đồng ý.
**N-f.** Tên component: boundary row gọi "Workflow guide + Workflow case" (component), spec §5.2 gọi component là "Workflow case" trong khi guide schema cũng thuộc nó. Thống nhất: component **Workflow**, hai thực thể **guide** và **case**.
**N-g.** `docs/platform/event-store/spec.md:8` "Implementation status: Not started" lệch với board (ES 06 trên main) — spec đã ghi ở §13; là việc làn Event Store.

## Những gì đã kiểm và đúng (để owner khỏi nghi)

- `advance` giữ suốt `advanceWorkflowRun` (runner.mjs:1120, :1171, :1324) và kiêm liveness (`ADVANCE_STALE_MS` :845, `advanceReport` :879, `assertNoLiveAdvance` :823) — N17 là bắt buộc nếu muốn N6.
- `appendWorkflowEvent` `seq = existing.length + 1`, `appendFileSync`, không lock trong store (store.mjs:85-94) — R4 đúng; RUL-WF-24 cần thiết.
- Liên kết `workflow {runId, stepId, unitId}` trong `unit.json` chỉ là provenance: `normalizeWorkflowLink` (unit.mjs:60-67) kiểm hình, `run.mjs:425, :539` ghi, không ai đọc để cho/từ chối — §5.1 đúng. Hình liên kết sẽ phải đổi sang `{runId, activity, reservationId}` (§4) — plan nhớ.
- Env mang vào worker: chỉ `FGOS_DISPATCH_DEPTH` (adapters.mjs:85; authority.mjs:1393); codex nhận `FGOS_SESSION_ID` qua `shell_environment_policy.set` (assignment-runner.mjs:599); không reader `att-` nào trong `src/**/*.mjs` — R1 "chưa có reader" đúng.
- Rank manifest: `run.mjs` use-case, `workflow/runner.mjs` + `index.mjs` use-case, `store.mjs`/`ref-digests.mjs` infra, `definition.mjs`/`steps.mjs` kernel, patterns domain, `authority.mjs`/`assignment-runner.mjs` infra — §5.3 khớp.
- Lock order tăng dần theo rank trong một scope (holder-lock spec:138, :210); `attempt` 15 → `dispatch-cwd` 30 lấy chung scope (direct-launch.mjs:46-59) — N15 và N6 lập luận đúng.
- `--plan` còn sống (runner.mjs:24, :946) — thu hồi là có thật, không phải đã xoá.
- `feature.yaml` có `units`, `dependsOn`, `gate`, `kind: integrate` (dòng 27, 37, 61, 68, 92, 107, 138, 144-149) — N16 đúng; `domainSteps` phải trả bốn step (test kernel).
- Boundary rows: chữ hiện hành giữ nguyên, đoạn đề xuất đặt cạnh, có pointer — cách làm đúng cho nhánh chưa duyệt.
- 0048 §2, 0049 §4 được trích đúng nghĩa (runner.md:3141-3160); 0048 §3 và 0049 §1–3 giữ — đúng.

## Khuyến nghị trình owner (một lần, gom)

1. Duyệt mô hình + supersede một phần 0048 §2, 0049 §4 (như cover note).
2. **Chọn B1:** port do Execution Core sở hữu (khuyến nghị) hay nới test A4.
3. **Chọn S6:** trần seat launch giao cho Unit + settle (khuyến nghị) hay draw mỗi launch.
4. **Chấp nhận gap S1** (N1 = hai cửa; in-session còn approve door) và có muốn ghi phương án hook như dòng RUL104.
5. F1–F7, F9 duyệt như cover note đề nghị; F10/F11 để làn holder-lock/Event Store; F8 hoãn; F13 sau.

## Verdict

**Sẵn sàng trình owner sau khi sửa.** Lý do: hướng owner được cài trung thành; danh sách "không đề xuất" chặn to-hơn; các khẳng định đặt chỗ ít được review (N13–N17) kiểm trên code đều đứng vững về *luật*. Điều chưa đứng là *thi hành được*: B1 và B2 là hai chỗ mà N1 — thứ owner đã chấp nhận — không chạy được như viết, và S1 là điều owner phải thấy trước khi ký. Cả ba sửa bằng chữ spec và một–hai lựa chọn nhỏ; không có bằng chứng mới nào lật quyết định đã settle, nên không cần mở hội đồng lần nữa. Bản sửa nên qua một lượt red-team ngắn cho đúng B1/B2/S4/S5 (lock và test) trước khi owner đọc.
