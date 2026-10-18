# Git G0 spec: fold năm báo cáo kiểm lại

Ngày 2026-10-18, giờ Asia/Saigon. Đây là lần fold thứ hai, hẹp, vào [docs/platform/git/spec.md](../../docs/platform/git/spec.md). Lần fold thứ nhất nằm ở [review-261018-0024-git-g0-proof-fold-verdicts.md](review-261018-0024-git-g0-proof-fold-verdicts.md). Cả năm lần kiểm lại đều đọc spec ở commit `b6bd66cfd`, HEAD `6c1ebfe19`, Git 2.53.0, `/tmp` trên tmpfs, và không lần nào ghi vào checkout.

| Viết tắt | Lần chạy | Nội dung |
|---|---|---|
| M1 | `unit-run-1792258831537-27d2052d` | Model check CAS/recovery với pin và target là hai bước riêng |
| M3 | `unit-run-1792258831682-809bcfd3` | Model check M3/P-CUSTODY và probe `flock` thật |
| WAL | `unit-run-1792258831821-6bcbac29` | Model check P-WAL-ID và probe no-overwrite trên filesystem |
| VCAS | `unit-run-1792258831977-3ff6a365` | Git thật: kill tại barrier trên `files` và `reftable`, phục hồi theo §10/§11 |
| SYM | `unit-run-1792258832134-b64a7405` | Git thật: race symbolic ref, hook, replacement objects, lazy fetch |

## Kết quả

Mọi phát hiện mà một lần kiểm lại báo là vi phạm giờ đều có một sửa chữ trong spec, nên dòng trạng thái đổi thành "re-checked 2026-10-18; ready for owner signature". Không sửa nào đi ngược Q1-Q7. Phụ lục vẫn đúng 234 dòng. Một dòng của bảng R30 (Refs) đã đổi, theo yêu cầu của brief; chi tiết ở mục Sửa 3.

Các lần kiểm lại chỉ đứng vững trong mô hình hữu hạn hoặc probe trên Git thô và fixture; không có gì được chứng minh trên implementation. Hai quy tắc mới của lần fold này (TargetAttempt và Refs dưới khoá 40) mới là chữ và có một lượt kiểm lại nhỏ ở cuối báo cáo.

## Phán quyết theo phát hiện

| Phát hiện (lần chạy) | Phán quyết | Mục đã sửa |
|---|---|---|
| M1 F1: recovery retry khi `ref == expected` sau ABA làm một operation publish hai lần, trace 9 bước (M1) | Chấp nhận, là under-specification | §2 câu ABA; §10 quy tắc 3 và quy tắc 4 mới "TargetAttempt"; bảng recovery §10 tách dòng `ref=expected` thành hai dòng; §9 bước 5; §10 đồ thị pha Land thêm `target-attempt`; §17 |
| M1 F2: "một winner cho mỗi expected OID" sai qua ABA, trace 11 bước (M1) | Chấp nhận; đây là ngữ nghĩa đúng của Git, sai là câu bất biến | §2: winner định nghĩa theo attempt ghi trong WAL và theo thế hệ expected-state không gián đoạn; §15 M1 |
| P-WAL-ID: exact-old CAS + ABA + retry outcome chưa biết cho hai effect (WAL) | Chấp nhận | §10 quy tắc 3 bỏ câu "duplicate attempt is a lost CAS" khi đứng một mình; quy tắc 4 |
| P-WAL-ID: recoverer có resource authority phát lại mù sau crash trước receipt cho hai effect (WAL) | Chấp nhận | §10 quy tắc 4: TargetAttempt cho mọi effect không đảo ngược, recoverer phải quan sát trạng thái thật trước, authority không phải bằng chứng |
| M1 F3 và VCAS: câu "multi-ref ... as an optimization" cho phép cài target trước pin, trace 2 bước (M1), `files` cho target=next, pin=old (VCAS) | Chấp nhận, chọn luật đơn giản nhất: xoá tối ưu | §4: thứ tự pin CAS → read-back → prepared → TargetAttempt → target CAS là bắt buộc, không có tối ưu; Git không bao giờ đưa target vào transaction nhiều ref; phục hồi vẫn nhận cặn của writer cũ hoặc Git thô; §10 dòng `target=next, pin=expected` viết lại; §15 V-CAS; §17 |
| VCAS: `update-ref -d` với exact old xoá branch mà một worktree đăng ký sau snapshot đang checkout, cả hai backend | Chấp nhận | §3 Refs; §5 dòng rank 40; bảng R30 dòng Refs; §11 câu delete; §15 V-CAS; §17 |
| SYM: preflight + read-back không phát hiện symbolic ref tạm thời đã bị CAS `--no-deref` ghi đè | Chấp nhận | §4 C1: containment là bảo đảm; phát hiện chỉ là best effort, không bảo đảm cho trường hợp tạm thời; §15 V-PUB; §17 |
| M3/P-CUSTODY: witness cũ giờ bị từ chối; handle chưa từng khoá bị từ chối | Đứng vững, không cần sửa | §6 câu cuối và §18 mục mở 1 ghi kết quả; §19 |
| VCAS: các trạng thái quan sát được đều quyết định đúng theo §10/§11; `reftable` không thấy partial visibility ở hai barrier | Đứng vững trong probe | §19 |
| SYM: hook tắt, replacement objects, no-lazy-fetch, `git hook run` | Đứng vững trong probe | §19 |

### Sửa 1: ABA và retry

Quy tắc mới là §10 quy tắc 4 "TargetAttempt". Trước mỗi effect không đảo ngược, bên thực hiện cài bền một record `TargetAttempt` mang `priorTargetAttempt: none` cùng giá trị expected và next, rồi mới làm effect. Nếu chuỗi WAL có TargetAttempt mà chưa có record kết quả, kết quả là chưa biết: không recoverer nào phát lại effect đó dưới id này, dù thấy gì. Recoverer chỉ được làm effect khi chính nó thắng việc cài no-overwrite record TargetAttempt đầu tiên của operation; chuỗi hợp lệ không có TargetAttempt nào là bằng chứng WAL rằng chưa từng có lần thử. Crash sau khi cài TargetAttempt và trước effect bị coi là chưa biết, nên effect giữ ở mức nhiều nhất một lần. Đây là marker `cas-attempt-started` mà báo cáo M1 đề xuất; tôi đã kiểm rằng nó chặn cả hai trace (M1 F1 và trace "lock + blind replay" của WAL), vì cả hai đều đi qua một CAS hay effect đã chạy mà chưa có record kết quả.

Một lần CAS thua đã biết kết quả thì kết thúc operation đó. Retry trên tip mới là một operation id mới, vì §2 đã buộc id vào expected values; đó cũng là cách retry của Event Store §10 đi qua port, nên giao thức Event Store không đổi.

### Sửa 3: Refs dưới khoá 40

Mọi thao tác Refs trên `refs/heads/*` (ensureBranch, advanceRef, deleteRef, fastForwardCheckedOut) giờ lấy worktree-admin 40. Trong một lần giữ khoá, thao tác kiểm lại mọi checkout đã đăng ký, chạy CAS exact-old, đọc lại ref và các checkout, rồi mới nhả khoá. Vì 40 bọc `worktree add`, không lần đăng ký worktree nào của fgOS chen vào giữa kiểm tra và effect. Holder-lock §16 đã ghi rằng Git spec §5 quyết định thao tác Git nào lấy khoá này, nên không phải sửa holder-lock và không có khoá mới.

Dòng R30 đã đổi: trước là "none; exact-old CAS is the serialization", có thể giữ "anything below 60". Giờ Git lấy 40; caller có thể đang giữ 10, 15, 20, 30; giữ 40, 50, 60 hoặc 70 thì bị từ chối với `lock-order-violation` trước mọi effect, nên thứ tự vẫn là 20 → 40 → 50. Land vốn đã giữ 40 lúc publish (§9 bước 4), nên nhất quán. M2 đã chạy với dòng Refs không lấy khoá; profile mới hợp lệ theo luật rank, và nằm trong lượt kiểm lại bên dưới.

Không có thao tác typed nào đổi branch của một checkout đang tồn tại. Spec ghi rằng thao tác như vậy, nếu thêm sau, phải lấy 40 trước. Một lần switch bằng Git thô hoặc do worker nằm ngoài bảo đảm đồng thời (§9) và được báo `recovery-required` khi lần đọc lại thấy nó.

### Sửa 4: P-SYM-HOOK

Bảo đảm là containment: CAS `--no-deref` với expected OID không bao giờ đổi ref ngoài `refs/fgos/*`, và SYM đã xác nhận điều này trên 2.53.0. Kiểm tra symbolic ở preflight và read-back vẫn giữ, nhưng chỉ là best effort: nó bắt được symbolic ref còn tồn tại lúc đọc lại (SYM chứng minh), không bắt được symbolic ref tạm thời đã bị CAS ghi đè. Không báo cáo nào chứng minh một cơ chế phát hiện cho trường hợp đó, nên spec ghi rõ là không bảo đảm và không hứa cơ chế nào.

## Những gì chỉ được chứng minh trong mô hình hoặc probe hữu hạn

- Thứ tự pin CAS → read-back → prepared → target CAS không publish hai lần và không gán attribution khi thiếu bằng chứng WAL, với hai lander, next khác nhau hoặc bằng nhau, crash ở sáu ranh giới (M1, 289 trạng thái mỗi cấu hình).
- Ràng buộc record 0: cùng id khác digest, hoặc khác resource set, bị từ chối theo cả hai thứ tự cài (M1, WAL).
- Một transition writer cho mỗi số record, bên thua dừng ở `EEXIST`, trong 36 cấu hình, 89.026 trạng thái (WAL).
- `renameat2(RENAME_NOREPLACE)` và `link`+`unlink` cho đúng một winner trong 100 vòng × 3 writer, và SIGKILL giữa `link` và `unlink` để lại hai tên cùng inode; chỉ trên tmpfs, không phải bằng chứng stable media (WAL).
- Luật nhận successor của §6 từ chối witness "controller chết → successor lấy lease trống" trong mô hình và trong probe `flock` 20/20; handle chưa từng khoá bị từ chối ở adapter mô hình (M3). Đây không phải V-CUSTODY trên implementation và không phải bằng chứng an toàn commit đồng thời.
- Cắt giữa pin và target theo thứ tự tuần tự để lại target=old, pin=next trên cả `files` và `reftable`; mọi trạng thái quan sát được quyết định theo §10/§11 từ WAL mô phỏng, không unlink lock theo tuổi hay PID; quarantine `pin.lock` có provenance sửa được pin (VCAS). `reftable` không thấy partial visibility ở hai barrier đã đo, và không suy rộng thành bảo đảm.
- Containment của `--no-deref`; bảy primitive Publication không chạy hook khi `core.hooksPath` trỏ vào thư mục rỗng tin cậy; `--no-replace-objects` đọc object gốc; `GIT_NO_LAZY_FETCH=1` chặn lazy fetch cho status, diff, cat-file, checkout và merge fast-forward; `git hook run pre-commit` có trên 2.53.0 (SYM). Merge mới chỉ là fast-forward, chưa phủ mọi thuật toán conflict.

## Đề xuất của báo cáo không đưa vào lần fold này

- **Cặn native của `reftable` (VCAS, đề xuất §10-11).** Báo cáo đề xuất ghi rõ rằng `tables.list.lock` và file table chưa công bố là cặn riêng của backend và không được xoá chung chung. Báo cáo tự nói đây là làm rõ phạm vi, không phải vi phạm, và §11 đã cấm xoá lock native theo tuổi hay PID. Brief chỉ cho sửa bốn điểm nên tôi không đưa vào; nên gộp khi viết Git plan.
- **Generation chống ABA cho mọi writer (M1 F2).** Không thêm. Báo cáo M1 cũng không đề xuất thêm cơ chế chỉ để proof xanh; spec chỉ sửa câu bất biến.

## Việc kiểm lại

Chỉ cho sửa 1 và sửa 3; sửa 2 và sửa 4 chỉ xoá hoặc thu hẹp một lời khẳng định. Cả hai unit chỉ đọc checkout (`writes: []`) và làm việc dưới `/tmp`, như các lần trước.

```json
[
  {
    "id": "target-attempt-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Model-check re-run for docs/platform/git/spec.md §10 rule 4 'TargetAttempt: no blind re-effect', §2 (winner per WAL attempt and expected-state generation) and the §10 recovery rows for ref=expected. Never write to the forgent checkout; work under /tmp/<own-dir>. Report in Vietnamese. Re-use the M1 model of unit-run-1792258831537-27d2052d and the P-WAL-ID model of unit-run-1792258831821-6bcbac29, adding a durable TargetAttempt record installed no-overwrite before every target CAS or locked effect, and an outcome record after it. Required: the 9-step M1 trace (crash after a winning CAS, external ABA back to expected, recovery retries) and the P-WAL-ID trace (crash after effect before receipt, recoverer with resource authority replays) both end in recovery-required with no second effect; a recoverer may re-attempt only by winning the install of the operation's first TargetAttempt and then performs exactly one effect; a crash between TargetAttempt and the effect ends as unknown, never retried; each operation publishes at most once; at most one successful CAS per uninterrupted expected-state generation; no thisInvocationWonCas without an outcome record. Include equal-next, two and three contenders, and a live original writer racing a recoverer for the TargetAttempt record. Lead with a verdict table, then bounds, counterexamples with the shortest trace, full scripts."
  },
  {
    "id": "refs-under-admin-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Re-check for docs/platform/git/spec.md §3 Refs, §5 rank 40 row and the R30 Refs row: every Refs mutation of refs/heads/* holds worktree-admin 40 from the checkout revalidation through the exact-old CAS and read-back. Never write to the forgent checkout; work under /tmp/<own-dir>. Report in Vietnamese. (1) Finite model: a Refs deleter/advancer, a worktree-add actor and a Land, all fgOS writers under the stated locks (worktree add under 40, Land 20 -> 40 -> 50); show that no interleaving deletes or advances a branch that a registered checkout holds at the CAS, including a worktree registered after an earlier snapshot, and that the controlled interleaving of unit-run-1792258831977-3ff6a365 becomes a refusal. (2) M2 delta: add the new Refs profile (acquires 40; may already hold 10, 15, 20, 30; holding 40, 50, 60 or 70 refused) to the rank model of unit-run-1792254306261-e7f3b8ba and confirm no two-scope wait cycle. (3) Real git on files and reftable with a simulated flock standing in for 40: the snapshot-then-worktree-add race is refused when both sides take the lock, and update-ref -d still succeeds when the adding side bypasses it (raw Git is outside the guarantee). Lead with a verdict table, then bounds, counterexamples, full scripts."
  }
]
```

Năm nhóm vẫn bị chặn ở G0 và được giữ làm điều kiện lúc hiện thực trong §19, không chạy lại ở đây: `e1-durability-device`, `e3-combined-addon`, `space-resource-after-effect`, `gate-cutover-release-consumer`, `e4-containment`. Objective của chúng vẫn như trong báo cáo fold thứ nhất.

## Cần owner quyết

Không có sửa nào mâu thuẫn với Q1-Q7, nên lần fold này không thêm câu hỏi quyết định. Có hai điểm owner nên biết khi ký:

- Dòng Refs của bảng R30, bảng mà owner đã chấp nhận ngày 2026-10-17, đã đổi từ "không khoá" sang "lấy 40". Thay đổi này dùng khoá có sẵn, đúng thứ tự rank và không trái Q6 ("vẫn một khoá admin").
- Câu hỏi Workflow chạy được ngoài repo hay không (mục mở 8 của §18) vẫn đang chờ, từ báo cáo fold thứ nhất.

## Câu hỏi còn mở

- Dòng trạng thái đổi sang "ready for owner signature" theo đúng điều kiện của brief: không còn vi phạm nào thiếu sửa chữ. Tuy vậy, hai quy tắc mới (TargetAttempt, Refs dưới 40) chưa được kiểm lại. Nếu owner muốn ký trên chữ đã kiểm, nên chạy hai unit ở trên trước khi ký.
- Quy tắc TargetAttempt đổi thất bại kiểu "chưa biết kết quả" thành `recovery-required` thay vì tự hoàn tất. Số worktree hoặc operation bị giữ lại vì vậy có thể tăng; doctor đã báo nợ này (§10), và đây là đánh đổi có chủ ý để effect giữ ở mức nhiều nhất một lần.
