# Git G0 spec: fold bốn báo cáo proof

Ngày 2026-10-18, giờ Asia/Saigon. Báo cáo này ghi phán quyết cho từng vector của bốn lần chạy proof và chỗ sửa tương ứng trong [docs/platform/git/spec.md](../../docs/platform/git/spec.md). Mọi kết luận đối chiếu với spec ở commit `59637ba26`, là bản mà cả bốn lần chạy đã đọc.

| Viết tắt | Lần chạy | Nội dung |
|---|---|---|
| MC | `unit-run-1792254306261-e7f3b8ba` | Model check M1-M4, P-WAL-ID, P-CUSTODY, C1-C6, kèm probe `flock` thật |
| DC | `unit-run-1792254306560-34bc4761` | Độ bền và chi phí: E1, E3, P-SPACE, P-RESOURCE |
| CL | `unit-run-1792254306706-087ee956` | Phân loại: E6, source-guard, P-RELEASE, P-CUTOVER, V-CONSUMER (chỉ đọc mã) |
| GF | `unit-run-1792257265079-d28a8ade` | Git floor 2.53.0: E5, E2, E4, V-CAS, P-SYM-HOOK, V-CLEAN, V-SYNC |

## Kết quả

Không vector nào được đánh dấu passed. M1, M2 và M4 đứng vững trong mô hình trừu tượng; nhiều mệnh đề hẹp về Git thô cũng đứng vững. Mọi phát hiện vi phạm hoặc không kiểm được đã được xử lý bằng một câu luật trong spec hoặc bằng một mục mở có chủ sở hữu. Không sửa nào đi ngược quyết định Q1-Q7 của owner. Phụ lục vẫn đúng 234 dòng. Dòng trạng thái giữ nguyên và được nối thêm "; proofs folded 2026-10-18, re-check pending". §19 giờ là ba bảng kết quả theo từng vector, mỗi dòng nói rõ cần kiểm lại hay không.

Các sửa này mới là chữ, chưa phải bằng chứng. Mỗi sửa đều nằm trong danh sách kiểm lại ở cuối §19 và ở mục "Việc kiểm lại" bên dưới.

## Phán quyết theo vector

| Vector | Phát hiện (lần chạy) | Sửa trong spec | Cần kiểm lại? |
|---|---|---|---|
| M1 | Đứng vững: không publish hai lần, nhiều nhất một CAS thắng, không publish trước WAL bền (MC). Mô hình coi target cộng pin là một bước nguyên tử, nhưng sửa V-CAS đã bỏ giả định này | §19 ghi giới hạn | Có: chạy lại với pin và target là hai bước, crash ở giữa |
| M2 | Đứng vững: 266.240 tổ hợp, không có chu trình chờ hai scope (MC) | §5 thay chữ "pending M2" bằng kết quả và giới hạn | Không cần chạy lại mô hình; V-ORDER vẫn bắt buộc |
| M3, P-CUSTODY | Vi phạm: controller chết, descendant của producer không giữ fd lease vẫn ghi trong lúc successor giữ lease; tái hiện bằng `flock` thật (MC) | §6 thêm luật nhận successor: chỉ khi có handoff đã ghi, hoặc miền tiến trình của holder trước được chứng minh rỗng theo holder-lock §8; không có driver thì fail closed với `custody-predecessor-unknown`, và Execution dùng worktree mới | Có |
| Borrower test (MC F2) | Ba điều kiện của holder-lock §5 vẫn qua với một description chưa từng khoá | §5: chỉ nhận handle đã acquire của LockScope cùng process, truyền dạng opaque qua addon; try-lock thành công không chứng minh custody liên tục | Qua V-CUSTODY |
| M4 | Đứng vững khi lỗi xảy ra trước effect; negative control không dedup cho ra hai settlement (MC) | §9 bước 6: settlement của consumer duy nhất theo `(repoIdentity, operationId, settlementKind)` | Có, sau khi Work và Event Store xác nhận (mục mở 9) |
| P-WAL-ID | Không kiểm được vì spec chưa nêu primitive; không có loại trừ thì có hai transition writer (MC) | §10: primitive là cài no-overwrite record đánh số kế tiếp; bên thua dừng trước effect; thao tác không có lock registry thì effect phải là exact-old CAS; RepositoryConfig chưa được mở qua operation id | Có |
| C1-C6 (M-EXT) | C3, C4 đứng vững trong trừu tượng; C1, C2, C5, C6 không kiểm được (MC) | §15 và §19 tách từng C và ánh xạ sang vector thật | Qua các vector được ánh xạ |
| V-CAS | Một winner đứng vững. Vi phạm: transaction nhiều ref trên backend `files` bị kill sau rename target để target = next, pin = expected, còn `pin.lock` (GF) | §4: pin được ghi và đọc lại trước CAS một ref cho target; không bao giờ coi multi-ref là nguyên tử khi crash. §10 thêm dòng phục hồi từ WAL; `.lock` sót xử lý theo §11, không unlink theo tuổi hay PID | Có, trên `files` và `reftable` |
| P-SYM-HOOK, V-PUB | `update-ref` thô chạy hook `reference-transaction` và theo symbolic ref ra `refs/heads/victim`; `--no-deref` thay symbolic ref bằng direct ref mà không báo (GF) | §4 C1: hai kiểm tra tách biệt, chặn bằng `--no-deref` và từ chối symbolic ở preflight lẫn read-back; mọi lời gọi Publication tắt hook bằng `core.hooksPath` tin cậy | Có, thêm phép thử race thay thế direct thành symbolic |
| V-TRUST | `refs/replace/*` của repo làm `cat-file` đọc commit khác cho cùng OID (GF) | §4 C1: mọi lần đọc định danh tắt replacement objects | Có |
| E5 layout | Shallow trả ancestry "no" sai dù đủ hai endpoint; partial clone tự fetch khi đọc; thiếu alternate chỉ ra lỗi chung (GF) | §2: `shallow-history-incomplete`; §4: no-lazy-fetch cho mọi thao tác không phải Remote, từ chối có tên theo layout | Có |
| E4 | Child gọi `setsid()` từ hook hoặc filter sống sót sau khi kill process group (GF) | §5: huỷ dùng containment của Process; không có driver trả `Empty` thì báo `containment-unproven` | Có, qua driver containment từng nền tảng |
| V-CRASH, E2 | Barrier Git thô đứng vững; read-tree bị ngắt không retry được; bốn dạng cặn worktree (GF) | §10 thêm dòng read-tree; §11 liệt kê bốn dạng cặn | Có, trên implementation |
| V-CLEAN | `update-ref -d` xoá được branch đang checkout (GF) | §3 Refs: CAS không bảo vệ branch đang dùng; kiểm lại mọi checkout đăng ký; thêm `fastForwardCheckedOut` hẹp | Có |
| E1 | Không kiểm được (tmpfs, không root). Git 2.53.0 không fsync thư mục, kể cả `core.fsync=all`; `rename` thường ghi đè record (DC) | §10: `fgos-git` tự fsync thư mục object, ref và WAL theo thứ tự; cài record bằng `RENAME_NOREPLACE` hoặc `link`; chỉ quảng bá `processCrash` cho tới khi E1 qua | Có, trên thiết bị thật |
| E3 | Đo baseline CLI và mô hình WAL; addon kết hợp chưa có nên không đo được; không có budget viết trước nên không phán (DC) | §19 ghi số đo; §15 tách workload. Cò đảo Q1 chưa bị chạm | Có, với budget viết trước |
| P-SPACE | Lỗi tiêm trước effect đứng vững; ENOSPC thật không kiểm được; sau effect chưa chạy (DC) | §10 C4 ghi kết quả và kiểm short write | Có |
| P-RESOURCE | Spec chỉ có tên, không có tiêu chí (MC, DC) | §15 định nghĩa tiêu chí | Có |
| E6 | §13 bỏ sót các nhóm điểm ghi; T/T2/T3 không được định nghĩa; sáu file test nằm ngoài mọi kho (CL) | §13 thêm dòng cho mọi điểm F-E1 tới F-E10; §15 định nghĩa nhãn kept/retargeted/retired | Có, lúc hiện thực |
| V-GATE, source-guard | Không có luật phát hiện; chín hình dạng mã thật lọt qua (CL) | §12: định nghĩa "lần ghi git" và guard hai phần (quét tĩnh theo luồng dữ liệu, kiểm spawn lúc chạy test); Inspect tắt optional locks | Có, với chín probe gieo sẵn |
| P-CUTOVER | Không có cơ chế grant cho commit xoá file sự kiện mà Event Store §18 cần; phụ thuộc thứ tự chưa nêu (CL) | §7: `cutoverGrant` nhận ra qua main 50 borrow cộng bản ghi WAL đúng đường dẫn, không env hay PID. §12: cutover Event Store đi trước hoặc cùng release mở Land mới | Có |
| P-RELEASE | Chỉ làm được theo kiểu dừng toàn bộ; không ai chạy kiểm tra C5 lúc rollback (CL) | §12: cửa kích hoạt `fgctl` chạy C5 qua hợp đồng đọc của distribution, kèm fence cho `fgctl` cũ; writer không lock buộc cutover dừng toàn bộ | Có |
| V-CONSUMER | Trung lập miền, nhưng ném lỗi khi HEAD tách rời và không có luật cho project không có git (CL) | §1 `notARepository`; §13 dòng `integrate.mjs`; §14 | Có, chạy động |
| §13 S3 | Câu "chờ S3" đã cũ: `bbf7b7929` đã land qua `c2cadb082` (CL, đã kiểm lại bằng `git merge-base`) | §13 dòng `claim-port.mjs` và đoạn cuối | Không |

## Những đề xuất không làm theo nguyên văn, và lý do

- **Cho descendant của producer thừa kế fd lease (M3).** Không làm. Holder-lock §5 quy tắc 6 cho biết mọi bản sao của description đều có thể gọi `LOCK_UN` và nhả lock, còn một descendant đóng hết fd thì vẫn thoát được. Vì vậy thừa kế fd không phải cơ chế an toàn; chứng minh miền rỗng mới là cơ chế. Spec ghi rằng trao lease cho attempt gate, vốn chạy trong miền, là hình thức lease sẵn có của holder-lock §6.
- **Multi-ref transaction làm cách cài CAS.** Không giữ như giả định. Spec giờ ghi pin trước rồi mới CAS target một ref, nên trạng thái "target mới, pin cũ" không còn là đường bình thường. Multi-ref vẫn được phép như tối ưu, nhưng phục hồi phải chấp nhận mọi tập con hiệu ứng.
- **Tách `resync-worktree` thành một thao tác mới.** Không tạo thao tác mới. Spec mở rộng SafeRestore `apply` bằng `reapplyLocalDelta`, theo nguyên tắc một cửa.
- **Thao tác "typed file move" cho knowledge-migration.** Không tạo. Một lần di chuyển là ScopedCommit với cả hai đường dẫn literal.
- **`push -u` của verb `review`.** Bỏ cờ `-u`, vì §3 và §12 đã cấm ngầm sửa push config. Đây là thay đổi người dùng nhìn thấy, nên lúc hiện thực cần một dòng CHANGELOG.

## Việc kiểm lại

Các objective dưới đây dán được vào một units file. Mọi unit đều chỉ đọc checkout (`writes: []`) và làm việc dưới `/tmp`, giống bốn lần chạy trước. Các unit chạy được ngay trên chữ spec mới là `m1-recheck`, `m3-custody-recheck`, `p-wal-id-recheck`, `vcas-recovery-recheck` và `p-sym-hook-race`. Các unit còn lại cần implementation, thiết bị thật hoặc budget do owner viết trước, nên ghi lại để lên lịch, không chạy ngay.

```json
[
  {
    "id": "m1-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Model-check re-run for docs/platform/git/spec.md after the 2026-10-18 proof fold. Never write to the forgent checkout; work under /tmp/<own-dir>. Report in Vietnamese. Re-run M1 (two landers, crash at every boundary, equal-next OID, ABA, same id with different digest, cross-resource id) with the pin CAS and the target CAS as two separate steps (spec §4 'CAS and pin ordering', §10 recovery table), a crash allowed between them, and recovery driven only by the file WAL. Invariants: each operation publishes at most once; at most one CAS winner per expected value; no target publication before a durable prepared record and a read-back pin; recovery never rolls back the target or replays it, and never claims thisInvocationWonCas without WAL evidence. Lead with a verdict table, then bounds, then counterexamples with the shortest trace and a proposed text fix, then full scripts."
  },
  {
    "id": "m3-custody-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Model-check and real-flock re-run of M3 and P-CUSTODY for docs/platform/git/spec.md §6 'Successor admission after controller death' and §5 (opaque handle rule). Never write to the forgent checkout; work under /tmp/<own-dir>. Report in Vietnamese. Model controller, borrowed git child, producer descendant without the lease fd (also a setsid descendant), successor, commit retry and handoff, with the admission rule: successor admitted only after a recorded handoff or a holder-lock §8 predecessor domain proven Empty; no driver means fail closed with custody-predecessor-unknown and a new worktree. The earlier witness 'controller dies -> successor acquires free lease' must become a refusal. Also model a never-locked description passed as a handle and show it is refused. Repeat the real probe with pipes and flock (no sleeps). Lead with a verdict table, then bounds, counterexamples, full scripts."
  },
  {
    "id": "p-wal-id-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Model-check P-WAL-ID against docs/platform/git/spec.md §10 'The one-transition-writer primitive'. Never write to the forgent checkout; work under /tmp/<own-dir>. Report in Vietnamese. Model two or three requesters with the same operation id (same digest, different digest, different resource set), the no-overwrite install of record 0 and of each next record, crashes between install and effect, and a recoverer holding the operation's resource authority. For operations without a registry lock the effect is an exact-old CAS. Invariants: one transition writer per record number; a loser performs no effect of that transition; never two effects for one operation; a different digest or resource set is refused. Also run a real-filesystem probe on /tmp of renameat2(RENAME_NOREPLACE) and link()+unlink() install under concurrent writers and a crash between link and unlink. Lead with a verdict table, then bounds, counterexamples, full scripts."
  },
  {
    "id": "vcas-recovery-recheck",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Real-git experiment under /tmp/<own-dir> for V-CAS after the fold of docs/platform/git/spec.md (§4 'CAS and pin ordering', §10 recovery table, §11 native locks). Never write to the forgent checkout. Report in Vietnamese. Using the installed git with an LD_PRELOAD rename/unlink barrier and SIGKILL at fixed barriers, on both the files and the reftable backends: kill between the pin CAS and the target CAS; kill inside a multi-ref update-ref --stdin transaction between individual ref installs; kill at reference-transaction prepared. For every observed state, show that the §10 rules decide it from a simulated WAL record without unlinking a .lock by age or PID, without replaying or rolling back the target. Also confirm update-ref -d on a checked-out branch and the §3 Refs revalidation rule. Lead with a verdict table, then environment, counterexamples with shortest reproduction and text fix, then full scripts."
  },
  {
    "id": "p-sym-hook-race",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Real-git experiment under /tmp/<own-dir> for P-SYM-HOOK and V-TRUST after the fold of docs/platform/git/spec.md §4 C1 and the hooks paragraph. Never write to the forgent checkout. Report in Vietnamese. With the installed git: (1) an adversary turns a direct refs/fgos/events/* ref into a symbolic ref between preflight and an update-ref --no-deref with expected OID; show that nothing outside refs/fgos/* changes and that a read-back check detects the substitution; (2) every Publication primitive (hash-object, mktree, commit-tree, update-ref, for-each-ref, cat-file, rev-list) with core.hooksPath set to an empty trusted location and replacement objects disabled shows no reference-transaction hook effect and reads original objects despite refs/replace/*; (3) GIT_NO_LAZY_FETCH=1 blocks lazy fetch for status, diff, cat-file, checkout and merge in a promisor partial clone; (4) whether 'git hook run pre-commit' exists on this git. Lead with a verdict table, then environment, counterexamples, full scripts."
  },
  {
    "id": "e1-durability-device",
    "capability": "coding:explore",
    "rigor": "critical",
    "writes": [],
    "objective": "Needs a machine with root or device-mapper on a real ext4 device; do not run on tmpfs. E1 for docs/platform/git/spec.md §10 'Directory durability is Git's own job': power-cut fault injection (dm-flakey or dm-log-writes) for loose objects, refs, packed-refs and the file WAL, with fgos-git's own directory fsyncs in the stated order. Also strace the fgos-git implementation to show the order objects dir fsync -> WAL prepared -> CAS -> ref dir chain fsync -> receipt. Report which durability level each filesystem earns; otherwise processCrash only. Report in Vietnamese."
  },
  {
    "id": "e3-combined-addon",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Blocked until the combined N-API addon exists and the owner has written E3 budgets before the run. E3 for docs/platform/git/spec.md §15: run on ext4 with the workload split of §15 (new object, existing object, no-op ref, changing ref, local transport with and without transferred objects, full typed operation), report Node->addon calls and Git subprocess counts separately, p50/p95/p99, WAL backlog metrics, and rollback with live processes. Compare against the DC baseline of unit-run-1792254306560-34bc4761. Report in Vietnamese."
  },
  {
    "id": "space-resource-after-effect",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Needs a small private filesystem (loop mount or user namespace) and the fgos-git implementation. P-SPACE and P-RESOURCE for docs/platform/git/spec.md §10 C4 and §15: inject ENOSPC, EIO, permission, EMFILE/ENFILE, ENOMEM, spawn EAGAIN, output and queue saturation and deadline cancellation at pre-effect and post-effect barriers (prepare, object, pin, CAS, receipt, parent-dir sync). Required: refusal before effect, pending durability after effect, no evidence deleted for capacity, bounded admission and output, every descriptor closed. Declare ceilings before measuring. Report in Vietnamese."
  },
  {
    "id": "gate-cutover-release-consumer",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Needs the Git component implementation. Run V-GATE with seeded false-negative probes for the nine code shapes of docs/platform/git/spec.md §12; P-CUTOVER with the cutoverGrant of §7 (other .fgos deletions still refused, no env/PID grant); P-RELEASE with a live old process during activate and rollback, pending WAL refused by the activation door, old fgctl fenced; V-CONSUMER dynamically with business-discussion in a detached HEAD without origin/HEAD and in a directory that is not a repository. Report in Vietnamese."
  },
  {
    "id": "e4-containment",
    "capability": "coding:explore",
    "rigor": "high",
    "writes": [],
    "objective": "Needs the Process containment drivers. E4 for docs/platform/git/spec.md §5: hooks, filters and aliases that start same-group, setsid() and double-fork children, under a deadline and after git exits; show descendant drain through each platform's containment domain and containment-unproven where no driver answers Empty. Linux first; Windows only after its driver. Report in Vietnamese."
  }
]
```

## Cần owner quyết

**Câu 1. Workflow chỉ-đọc có chạy được trong thư mục không phải repo git không?**

- **Đang xảy ra gì.** `fgos run` và workflow `business-discussion` hiện ném `RunnerConfigError` "fgos run must run inside a git repository" khi không có repo (`src/runner/execution/run.mjs:98-108`), dù workflow này không có unit ghi và chỉ cần Inspect.
- **Nguyên nhân.** Runner tìm repo gốc vô điều kiện lúc khởi động. Spec Git giờ đã nói phần của Git: Inspect trả `notARepository` có kiểu và không bao giờ biến việc thiếu repo thành lỗi workflow (§1). Việc runner có đi tiếp hay không là quyết định của Workflow, và nó phụ thuộc ý định sản phẩm cho mission #2.
- **Các phương án và chi phí.** (a) Cho phép: workflow chỉ-đọc chạy không cần repo, unit có `writes` vẫn bắt buộc repo. Chi phí là sửa runner và thêm test V-CONSUMER cho trường hợp không có repo; project kinh doanh không phải `git init` mới dùng được. (b) Giữ bắt buộc repo: không tốn công sửa, nhưng mọi project nền kinh doanh phải là repo git, kể cả khi không có code. (c) Cho phép theo cấu hình từng workflow: linh hoạt nhất, nhưng thêm một khoá cấu hình phải đăng ký vào setup và doctor.
- **Khuyến nghị.** Chọn (a). Mission #2 là lý do fgOS tồn tại, và một workflow không ghi gì thì không có lý do kỹ thuật để đòi repo. Ranh giới "có `writes` thì cần repo" đã sẵn trong luật của `fgos run` (`--writes` cần linked worktree).
- **Phạm vi câu trả lời.** Chỉ quyết hành vi của runner Workflow với unit chỉ-đọc. Không đổi luật của Git (§1 đã cố định), không đổi yêu cầu repo cho unit có `writes`. Câu trả lời đóng mục mở 8 của §18.

Không có sửa nào khác mâu thuẫn với Q1-Q7, nên không còn câu hỏi nào khác cho owner.

## Câu hỏi còn mở

- Model check M1 đã đứng vững với target cộng pin là một bước nguyên tử. Sửa V-CAS đổi giao thức sang hai bước, nên kết quả M1 cũ không còn áp đúng giao thức mới cho tới khi `m1-recheck` chạy.
- Luật nhận successor (§6) làm mọi lần controller chết trên Linux và macOS để lại một worktree bị từ chối, cho tới khi attempt lock và containment có thật. Spec cho Execution dùng worktree mới để item không bị chặn; worktree cũ được giữ lại và doctor báo. Nếu số worktree bị giữ lại tăng nhanh thì đó là tín hiệu cần ưu tiên run supervisor.
- Bằng chứng của CL đến từ đọc mã, không chạy động; các số dòng là bằng chứng tại HEAD `1e238aead`, không phải định danh ổn định.
