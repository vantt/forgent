# Rà soát độc lập 32 work item dự kiến đóng

Tôi đã đọc title/description của từng item trong `.fgos/runtime/tmp/work-close-candidates.json`, đối chiếu code và test hiện tại, rồi tra lịch sử bằng `git log --all --grep`, `git log -S` và `git show`. Tôi không dùng status cũ làm bằng chứng. Số dòng bên dưới là dòng của checkout hiện tại; SHA là commit đầy đủ hoặc prefix đủ định danh duy nhất trong repository.

| Item id | Verdict | Lý do một câu | Evidence | Confidence |
|---|---|---|---|---|
| `tsk-1l9` | CLOSE-DONE | Hai nhánh mồ côi đã được land và guard phát hiện delivered-but-unmerged đã được bổ sung. | `c7458c647`, `d00367f91`, `f80b6fcc8`; `src/state/discover-pool.mjs` dùng `discoverableStages`; test `delivered-not-on-trunk` trong `test/setup/checks.test.mjs`. | high |
| `tsk-1wr` | CLOSE-DONE | Câu hỏi thiết kế đã được trả lời bằng việc tắt self-recognition cho target-ref slot, nên sibling process cùng session không còn cùng chiếm lock. | `65aaa2d0bd61`; `src/runner/merge.mjs` truyền tùy chọn tắt self-recognition; test multiprocess trong `test/runner/main-checkout-lock.test.mjs`. | high |
| `tsk-5dk` | CLOSE-DONE | Delivered event nay ghi `mergedSha`/`mergedInto` và manual move từ chối nhánh chưa reachable từ trunk. | `844b9a5eaea8`; `src/verbs/state/move.mjs:24`; test `moveWork stamps mergedSha and mergedInto` tại `test/state/store.test.mjs:397`. | high |
| `tsk-5k4` | CLOSE-DONE | `withMergeTargetSlot` đã được chuyển vào phạm vi `withLockRetry` cho các đường merge liên quan. | `0a4cfafb67b1`; `bin/fgos.mjs`; regression tests target-slot trong `test/cli/fgos-approve.test.mjs` và `test/cli/fgos-merge.test.mjs`. | high |
| `tsk-64o` | CLOSE-DONE | Mục tiêu điều tra không tái hiện đã được đáp ứng bằng diagnostic bền vững ghi `mergedSha`/`mergedInto` trước failure logging. | `8ac8fcd3b615`; `src/cli/approve-fault-log.mjs`, `src/verbs/merge/approve.mjs`; test diagnostic trong `test/verbs/merge/approve.test.mjs`. | high |
| `tsk-25r` | CLOSE-DONE | Parent audit không có finding thứ mười và cả chín child fix đã merge, được kiểm chứng tích hợp. | `4e32e953d` merge parent; `docs/history/tsk-25r-worktree-merge-cleanup-audit/RESEARCH.md` liệt kê 9 child delivered và 627 test pass; rollup `08730a867`. | high |
| `tsk-sdr` | CLOSE-DONE | Khi Iron Law thực sự trip và được acknowledge, approve/sync-root nay ghi audit event có cấu trúc. | `1625e5232`; `recordIronLawAcknowledge` trong `src/verbs/merge/iron-law-level.mjs`, `approve.mjs`, `sync-root.mjs`; tests cùng commit. | high |
| `tsk-64hk` | CLOSE-DONE | `executeExecutorCli` nay có lock theo `cwd` và từ chối dispatch trùng trong khi holder còn live. | `e28de3b7f080`; `src/runner/dispatch/cli.mjs:740-754`, `src/runner/main-checkout-lock.mjs:79-82`; test `executeExecutorCli refuses a concurrent dispatch...` tại `test/runner/dispatch.test.mjs:3551`. | high |
| `tsk-2lq` | CLOSE-DONE | Fast path nay chấp nhận trunk advance không giao nhau bằng so sánh merged tree thay vì đòi HEAD cũ là ancestor nghiêm ngặt. | `988459cec13b`; `src/runner/merge.mjs:1008-1023`; regression tests trong `test/runner/merge.test.mjs` và `test/e2e/pr-gate.test.mjs`. | high |
| `tsk-5k1` | CLOSE-DONE | Regression do opportunistic checks đã được chặn trong test process bằng gate riêng mà không tắt behavior production. | `8607438e9ce5`; `package.json` và `src/state/events-jsonl-truncation-guard.mjs`; tests gate trong `test/runner/claim-port.test.mjs` và `test/state/events-jsonl-truncation-guard.test.mjs`. | high |
| `tsk-6av` | CLOSE-DONE | Self-recovery đã được gom thành shared reference do approve sở hữu, còn merge-next/merge-loop là caller mỏng. | `d74dfea58`; shared `catchup-self-recovery` reference và generated skill renders; các skill contract checks trong test setup. | high |
| `tsk-oet` | CLOSE-DONE | Directive của item đã được thi hành đúng: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` chỉ tắt D1/D2 trong suite. | `8607438e9ce5`; `test/runner/claim-port.test.mjs:743`; test gate trong `test/state/events-jsonl-truncation-guard.test.mjs`. | high |
| `tsk-3tv` | CLOSE-DONE | Generic sync-root outcome nay luôn chuyển tiếp `result.error`, giữ message/stderr/status cho caller và friction. | `5028986189a6`; `src/verbs/merge/sync-root.mjs`; test `sync-root outcome guard catches merge-failed-unclassified` trong `test/cli/fgos-merge.test.mjs`. | high |
| `tsk-6uc` | CLOSE-DONE | Poll line nay so holder identity với caller và gắn nhãn self/other rõ ràng. | `4ea17d8e2ea4`; `src/runner/lock-wait.mjs`; regression test trong `test/runner/lock-wait.test.mjs`. | high |
| `tsk-3bh` | CLOSE-DONE | Dispatch nay chụp dirty paths trước/sau và báo `lostUncommittedPaths` thay vì im lặng khi executor làm mất file. | `c18292352c51`; `src/runner/dispatch/cli.mjs:893-903`; test warning/lost paths tại `test/runner/dispatch.test.mjs:3592`. | high |
| `tsk-26r` | CLOSE-DONE | Ephemeral worktree của return nay xóa `.fgos` ngay sau checkout, cùng invariant với claim worktree. | `a02280a39`; `bin/fgos.mjs:3371`; branch-source tests trong `test/cli/fgos-return.test.mjs`. | high |
| `tsk-tr9` | CLOSE-DONE | Merge conflict chỉ gồm `.fgos` nay được resolve về trusted target side thay vì abort, nên event shard catchup không tự chặn approve. | `10e44585b1ee`; `src/runner/merge.mjs:1220,1332`; test `tsk-tr9 regression` trong `test/runner/merge.test.mjs`. | high |
| `tsk-1wk` | CLOSE-DONE | Sharded writer logs đã có `merge=union`, đúng với baseline cũ. | `017e31d42`; `.gitattributes:15`; test `events-shard-gitattributes-union-merge` trong `test/state/events-shard-gitattributes-union-merge.test.mjs`. | high |
| `tsk-4gi` | CLOSE-DONE | Sau merge, `.fgos` union paths được restore về target state trước khi guard xét staged paths. | `3b3782c5df53`; `src/runner/merge.mjs:1375-1382`; regression tests trong `test/runner/merge.test.mjs`. | high |
| `tsk-1t2` | CLOSE-DONE | General CLI lifecycle nay ghi qua writer shard và test chứng minh không append vào frozen `.fgos/events.jsonl`. | `630dbccd7c33` (test) cùng writer-routing implementation đã land; test `a full add -> edit -> move -> edit CLI lifecycle never appends...` trong `test/cli/fgos-edit.test.mjs`. | high |
| `tsk-2ep` | CLOSE-DONE | Modify/delete conflict chỉ nằm trong merge-union `.fgos` đã được auto-resolve ở cả merge directions. | `10e44585b1ee`; `src/runner/merge.mjs:1220,1723-1725`; regression tests `.fgos-only merge conflicts` trong `test/runner/merge.test.mjs`. | high |
| `tsk-4s6` | CLOSE-DONE | Non-union `.fgos` path nay được trust khi chứng minh không đổi từ `branchHeadAtTake`. | `695debab3227`; `src/runner/merge.mjs:1428`; regression tests stale branch trong `test/runner/merge.test.mjs`. | high |
| `tsk-2e7` | CLOSE-WONTFIX | Tiền đề “global execute lock” không còn đúng: execute lock đã theo `cwd`, còn hai global call site thực sự mutate shared main checkout nên phải giữ global. | `e28de3b7f080`; `src/runner/main-checkout-lock.mjs:79-82`; `docs/history/tsk-2e7-main-checkout-lock-scope/RESEARCH.md` kết luận không còn open question; fanout overlap test trong `test/runner/dispatch.test.mjs`. | high |
| `tsk-198` | CLOSE-DONE | Proof “unchanged” đã chuyển từ blob lookup sang `git diff --quiet`, bao phủ path absent ở cả hai branch endpoints. | `f02241671e2f`; `src/runner/merge.mjs:1184`; regression test absent-at-take trong `test/runner/merge.test.mjs`. | high |
| `tsk-52p` | CLOSE-DONE | Integrity check nay loại `.fgos/` khỏi introduced paths, phù hợp ADR0020 mà vẫn giữ check cho source content. | `bf083321b790`; `src/runner/merge.mjs:1073-1088`; test `tsk-52p` trong `test/runner/merge.test.mjs:1646`. | high |
| `tsk-2jg` | CLOSE-DONE | Heavy pull/legacy item không có `fgw/<id>` nay có current-tree fallback cho plan evidence, không cần tạo branch giả. | `5d6ae236e676`; `src/state/store.mjs` `assertPlanEvidence`; regression tests trong `test/state/store.test.mjs`. | high |
| `tsk-1ck` | CLOSE-DONE | Reset guard nay tính các commit sẽ mất và từ chối clean-tree backward reset nếu không `--confirm`. | `10977bc0d`; `src/runner/main-checkout-reset-guard.mjs:22-53`; `test/runner/main-checkout-reset-guard.test.mjs`. | high |
| `tsk-22bm` | CLOSE-WONTFIX | Metadata sai không thể bypass verify vì return chỉ trust SHA khớp chính xác branch tip; nguyên nhân cwd còn lại trùng lớp upstream đã do `tsk-322` sở hữu, không phải gap mới của item này. | `7734976fc92f`, `163e47042e8b`; `docs/history/dispatch-verified-sha-safety-net-confirmation/RESEARCH.md`; tests “falls through to real verify when sha is stale or mismatched” trong `test/cli/fgos-return*.test.mjs`. | high |
| `tsk-myq` | CLOSE-DONE | Default `fileKey` nay tự derive `events/<name>` cho shard thay vì chỉ basename. | `b98e8e3b7785`; `deriveFileKeyFromLogPath` trong `src/state/events-jsonl-truncation-guard.mjs`; regression tests trong `test/state/events-jsonl-truncation-guard.test.mjs`. | high |
| `tsk-1cc` | CLOSE-WONTFIX | Blind config sweep không còn trong checkpoint implementation: code chỉ stage/commit/reset danh sách `pathspecs`, còn `config.json` chỉ được read để lấy interval. | `src/state/events-jsonl-truncation-guard.mjs:481-497,507-525`; `plans/reports/git-lessons-sweep-261017/sweep2-work-other.md` cũng phân loại obsolete. | high |
| `tsk-3rg5` | CLOSE-WONTFIX | Failure class trên raw shared-main merge không còn áp dụng cho root approve vì merge/verify chạy trong disposable detached worktree đã xóa `.fgos` trước merge. | `7e682516e` (sau chuỗi revert được khôi phục bởi `0b7a62e49`); `src/runner/merge.mjs:1794-1811`; `plans/reports/git-lessons-sweep-261017/sweep2-work-other.md` phân loại obsolete. | high |
| `tsk-4p6` | CLOSE-DONE | Mọi failure-to-block transition trong approve nay bắt CAS mismatch và trả structured `state-changed-concurrently` với actual status mới. | `909b14e49652`; `src/verbs/merge/approve.mjs`; tests AC4/AC5 tại `test/cli/fgos-approve-2.test.mjs` (hai test đã pass trong lần chạy này). | high |

## Tổng kết

- `CLOSE-DONE`: **28**.
- `CLOSE-WONTFIX`: **4**.
- `KEEP`: **0**.

## Bất đồng với earlier review

Earlier review gộp cả 32 item dưới nhãn “already fixed in code”. Tôi không đồng ý với nhãn đó cho bốn item sau, dù vẫn khuyến nghị đóng:

- `tsk-2e7`: premise sai sau khi audit; lock execute đã per-`cwd`, các global lock còn lại là cố ý, nên là `CLOSE-WONTFIX`, không phải fix code cho item.
- `tsk-22bm`: safety net đã có và phần cwd còn lại trùng owner upstream `tsk-322`, nên là `CLOSE-WONTFIX` thay vì code fix riêng.
- `tsk-1cc`: mechanism blind config sweep đã biến mất khỏi implementation hiện tại; đây là obsolete, không có fixing commit riêng đủ để gọi `CLOSE-DONE`.
- `tsk-3rg5`: raw-main merge path mà item mô tả đã bị thay thế bởi disposable CAS worktree; đây là obsolete-by-architecture, không phải direct bug fix.

## Ghi chú về test thực thi

Tôi đã chạy một batch test hẹp bao gồm merge, lock, dispatch, state, approve, edit, gitattributes và reset guard. Các test merge/state hiển thị trong output, gồm hai test AC4/AC5 của `tsk-4p6`, đã pass. Batch cuối cùng exit 1 vì nhiều test dispatch hiện tại cố ghi attestation vào `/home/vantt/.local/state/fgos/attestations`, bị execution sandbox read-only từ chối với `EROFS`; không có assertion failure liên quan behavior của 32 item trước lỗi hạ tầng này. Vì contract cấm ghi ngoài outbox, tôi không thay HOME/state path hay tạo workaround ghi file; verdict dựa trên code hiện tại, regression test source, fixing history và các test đã chạy được.

## Thực hiện đóng (2026-10-17 10:20)

Owner duyệt nhóm A. Controller kiểm xác suất 6/6 item (tsk-1l9, tsk-5k4, tsk-26r, tsk-1t2, tsk-2e7, tsk-1ck): commit, dòng code và test trích dẫn đều khớp. Cả 32 item được ghi `fgos decision --id <item>` kèm bằng chứng rồi chuyển sang `wontfix` qua `fgos move --expect <trạng thái cũ>`; FSM không cho `blocked -> done`, và `wontfix` là trạng thái kết thúc cho item đóng mà không tự làm.
