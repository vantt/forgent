# Prompt: nối lại plan documentation-authority-unification (đồng bộ main, kiểm kê lại, cập nhật plan bằng ak-plan)

Dán nguyên văn (hoặc đưa đường dẫn file này) cho một agent lead mới. Agent làm việc **trong worktree có sẵn** của plan, không làm trong main checkout.

## Bối cảnh

- Repo `/home/vantt/projects/forgentX`. Worktree của plan: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`, hiện sạch (`git status` rỗng), commit đầu `551687021` (2026-09-29). Anh xác nhận **không có phiên nào đang giữ worktree này**.
- Plan: `plans/260925-documentation-authority-unification/plan.md` (đã chuyển sang định dạng AgentKit, `status: in-progress`, `revised: 2026-09-29`). Mục tiêu: gom các quyền chuẩn tài liệu platform về `docs/platform/**` theo claim, không mất claim/lý do/hợp đồng/quyết định nào. Phase 1-3 (đánh số lại; số cũ 00-02) đã hoàn tất và có tag `documentation-authority-phase-01-20260926`, `documentation-authority-phase-02-20260926`. Phase 3 là kho kiểm kê toàn repo và sổ bảo toàn claim (`reports/phase-02-doc-inventory.{json,md}`, chốt ngày 2026-09-26). Phase 4-10 chưa được phép chạy.
- Hai kế hoạch mà `blockedBy` khai (`260929-1501-metrics-friction-rust-native`, `260929-1703-runresult-classification-single-path`) đã `completed` và nằm ở `archive/plans/`: chốt chặn hình thức đã hết (đã kiểm ngày 2026-10-06).
- Lý do dừng cũ (`reports/harness-readiness-2026-09-29.md`): muốn chạy các phase tài liệu qua cơ chế `coordination` của fgOS và đo bằng Observe. Cơ chế đó **đã bị gỡ** (commit `2180b4e72`, "L4 coordination engine retired"; verb `fgos coordination` không còn). Các mục §2 và §4 của báo cáo đó (actor pins, "một session mỗi phase") vì vậy đã lỗi thời. "Revision 2" của nó vẫn đúng ở ý chính: soạn tài liệu ở lại với Lead, review chỉ bằng đường đọc-không-ghi.
- Độ lệch đã đo (2026-10-06): từ điểm gốc chung (`81f7db801`, 2026-09-29) main đã đi trước branch **399 commit**; branch có **59 commit chưa merge**. Trong 399 commit đó có 102 commit chạm `docs/`, 61 file docs đổi, 6 file docs mới, 20 file thuộc các gốc cũ (`docs/specs`, `docs/architect`). Kho kiểm kê cũ 18 ngày.

## Việc được giao (và phạm vi được phép)

1. **Đồng bộ main vào branch** bằng `merge` (tiền lệ trong lịch sử branch: commit `32747d500` "merge: sync main into documentation-authority-unification branch"). Không rebase, không viết lại lịch sử, không force-push.
2. **Kiểm kê lại**: chạy lại bộ sinh kiểm kê của Phase 3 trên cây đã đồng bộ, chạy script verify của plan, rồi so sánh với kho kiểm kê cũ: claim mới, claim đổi, claim mất, tài liệu mới ngoài `docs/platform/**`, mọi thay đổi trên main vào gốc cũ (ghi nhận theo tiền lệ commit `b3fbcdd41` "account main-sync edits to legacy roots as reviewed exceptions": đọc commit đó trước khi làm).
3. **Cập nhật plan bằng `ak:plan`** (hoặc `ak plan`, dùng như công cụ; không sửa AgentKit): đưa `plan.md` và các file phase về đúng thực tại, theo mục "Cần đưa vào plan" bên dưới.

**Không được phép** nếu anh chưa nói rõ: bắt đầu nội dung Phase 4 trở đi; sửa nội dung tài liệu trong `docs/platform/**` hay gốc cũ ngoài phần đồng bộ/kiểm kê; cutover; merge branch vào main; push; xoá worktree hoặc branch; sửa main checkout. Plan §5 yêu cầu anh cho phép **tường minh từng phase**; Phase 4 vẫn là `not-authorized`. Đây là Phase "nối lại", chỉ đọc nội dung và cập nhật hồ sơ.

## Cần đưa vào plan (từ cuộc điều tra harness 2026-10-06)

Báo cáo gốc: `plans/reports/harness-investigation-261006-synthesis.md` (trong main checkout). Những điều plan phải hấp thụ:

- **Claim bị rơi, không cố ý (anh xác nhận):** mục "Dev / Source Activation" (`docs/architect/packaging-distribution/runtime-identity-and-activation.md:73,895-920`, commit `6733de7cf`, "Settled for V1") không có mặt ở `docs/platform/packaging-distribution/`. Kho kiểm kê cũ đã nhắc nó (`reports/phase-02-doc-inventory.parts/part-0008.jsonl`). Ghi nó vào sổ bảo toàn như claim bị rơi cần khôi phục; lý do rơi chưa tìm ra, đừng suy đoán. Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft) sẽ thực hiện lại cơ chế này.
- **Tách đôi nguồn chuẩn đã biết:** ba bản `platform-foundations.md` (`docs/platform-foundations.md`, `docs/specs/platform-foundations.md`, `docs/platform/platform-foundations.md`), hai reading-map (`docs/specs/reading-map.md`, `docs/reading-map.md`), `AGENTS.md` trỏ vào 2 trong 3 bản cũ, `plan.md` ở ba chỗ (`docs/history/<feature>/`, `plans/`, skill fgOS còn trỏ `docs/history`), journal ở hai chỗ (`plans/journals/`, `docs/journals/`), 302 file trùng giữa `docs/architect` và `docs/platform`, 9 trong 94 đường dẫn của `docs/specs/reading-map.md` đã chết. Kiểm lại từng điểm trên cây đã đồng bộ, không tin số này.
- **Ba plan đang chờ duyệt sẽ sửa tài liệu cũ trên main** (đều là ngoại lệ phải ghi nhận): Plan A `plans/261006-1415-fgos-single-door-mechanisms/` (`docs/specs/distribution.md`, một dòng trong reading-map nếu có; **một phase duy nhất, phase 06, sửa `AGENTS.md`**), Plan B `plans/261006-1415-fgos-convention-component/` (spec mới ở `docs/platform/convention/spec.md`, một dòng con trỏ trong `docs/specs/reading-map.md` và `docs/specs/system-overview.md`, một hàng trong `docs/platform/component-boundary.md`), Plan C (draft, sẽ chạm `docs/platform/packaging-distribution/**` và hàng #7 của `docs/specs/distribution.md`). Plan phải nêu thứ tự: **cutover nguyên tử (phase 9 hiện tại) chạy sau Plan A phase 06 và Plan B phase 06**, vì cùng ghi `AGENTS.md`.
- **Cơ chế chạy đã đổi:** vòng bốn vai của `coordination` không còn. Cập nhật mục harness của plan: soạn bởi Lead, review bằng đường đọc-không-ghi còn tồn tại hôm nay (kiểm bằng `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access` và đọc `docs/specs/runner.md`; đừng giả định). Observe chỉ là phần đo thêm, **không còn là điều kiện chặn**; ghi rõ cái gì của Observe dùng được hôm nay (`node bin/fgos.mjs metrics ...`), kiểm bằng lệnh, không bằng trí nhớ.

## Ràng buộc

- Chỉ làm trong worktree. `pwd` và `git branch --show-current` trước mọi lệnh git (cwd từng trôi về main checkout trong các phiên nhiều worktree). Không chạy `git checkout`/`switch` ở main checkout.
- Worktree có `node_modules` và `target` thật; nếu test báo thiếu, kiểm trước khi kết luận là hồi quy. Chạy test với `env -u CLAUDE_CODE_SESSION_ID` (`npm test` không hermetic trong phiên agent).
- **Đếm bằng script hoặc `rtk proxy`, không đếm bằng `grep | wc` qua hook:** hook `rtk` nén output (đã đo: cùng một lệnh ra 130 qua hook, 3320 khi chạy thô). Mọi con số trong báo cáo phải kèm cách đo.
- Dùng `node bin/fgos.mjs` trong worktree cho truy vấn chỉ đọc; không dùng hàm shell `fgos`, không dùng `rtk proxy fgos`. Không chạy lệnh đổi trạng thái (`fgos submit/pick/move/approve`, `fgctl init/upgrade/stage`, `doctor --fix`). Không đọc `.fgos/secrets.local.env`.
- Trước khi gọi Agent/Task tool: `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access`; chỉ dùng khi kết quả là `in-process`. Phụ tá chỉ đọc, phạm vi nhỏ, mỗi phụ tá nhận nhiệm vụ, file được đọc, nơi ghi, tiêu chí xong, đuôi `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.
- Commit nhỏ, đúng định dạng conventional, không nhắc AI, không đưa nhãn phase/mã quyết định vào comment hoặc tên test. Commit ngay sau khi xanh; chỉ commit đường dẫn của mình (`git commit -- <paths>`), không `git add -A`.
- Không bỏ quyết định đã khoá trong `plan.md` §3 (đặc biệt: một claim một chủ; di trú theo claim; cutover nguyên tử; không bỏ phạm vi bằng cách lặng lẽ bỏ sót). Muốn đổi một quyết định đã khoá thì trình bày: quyết định gốc, mối lo, đánh đổi, phương án, rồi chờ anh.
- `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit, và `rtk` là dự án của người khác: dùng được như công cụ, không đề xuất sửa.
- Xưng "em", gọi "anh". Báo cáo ngắn, nói thật, ghi UNPROVEN chỗ chưa chứng minh.

## Điểm dừng (báo anh, không tự quyết)

- Merge có xung đột ở nội dung `docs/platform/**`, hoặc từ 10 file trở lên.
- Bộ sinh kiểm kê hoặc script verify của plan fail vì nguyên nhân chưa hiểu.
- Kiểm kê mới cho thấy claim bị mất mà không có chỗ ghi nhận.
- Cần sửa cơ chế gate hoặc script của plan để chạy được.

## Đầu ra

1. Branch đã chứa đầu main tại thời điểm đồng bộ (`git merge-base --is-ancestor main HEAD` thành công), cây sạch, các commit đồng bộ/kiểm kê/cập nhật plan tách rõ.
2. Kho kiểm kê tái sinh, script verify chạy với mã thoát ghi lại.
3. Báo cáo nối lại, đặt trong worktree tại `plans/reports/` theo quy ước tên `{type}-{YYMMDD-HHMM}-{slug}.md` (ví dụ `resume-261006-HHMM-doc-authority-unification.md`): số đo độ lệch trước và sau; claim mới, đổi, mất; tài liệu mới ngoài `docs/platform/**`; ngoại lệ đã ghi nhận; ước lượng khối lượng Phase 4-10 (sau khi đọc các file phase); rủi ro; câu hỏi cần anh quyết; đề xuất lịch và thứ tự với Plan A, B, C.
4. `plan.md` và các file phase đã cập nhật bằng `ak:plan`: `revised:` mới, trạng thái từng phase đúng, mục harness viết lại theo thực tại, khối "bảo toàn claim bị rơi", thứ tự với Plan A/B/C, không có phase nào bị đánh dấu được phép.
5. Một đoạn cuối cho anh: kết luận, ba việc cần quyết, và việc đầu tiên nếu anh cho phép Phase 4.

## Tiêu chí hoàn thành

- [ ] `git merge-base --is-ancestor main HEAD` thành công; `git status` sạch; không có push.
- [ ] Kiểm kê tái sinh và script verify của plan có kết quả ghi lại (mã thoát, số đếm kèm cách đo).
- [ ] Claim "Dev / Source Activation" có mặt trong sổ bảo toàn như claim bị rơi cần khôi phục.
- [ ] Mọi sửa đổi trên main vào gốc cũ từ 2026-09-29 đều được ghi nhận (ngoại lệ có duyệt hoặc claim đã chuyển).
- [ ] `plan.md` phản ánh: coordination đã gỡ, blockers đã hết, thứ tự với Plan A/B/C, Observe là phần thêm.
- [ ] Không phase nào ở trạng thái được phép; Phase 4 ghi rõ chờ anh.
- [ ] Main checkout không bị đổi bởi agent này.

## Không làm

- Không bắt đầu di trú nội dung. Không viết lại tài liệu. Không merge vào main. Không push. Không dọn các worktree khác.
- Không biến việc này thành kế hoạch triển khai mới ngoài phạm vi cập nhật plan hiện có.
