# Code-panel multi-cell facade

Track: `code-panel-multicell-facade`  
Status: APPROVED — ready for `fgos-plan-loop` bootstrap  
Mode: high-risk  
Capability: `code:implement`

## Mục tiêu

Biến `fgos-code-panel` thành cửa vào duy nhất cho công việc coding có review và red-team:

- yêu cầu thẳng, một thay đổi: giữ nguyên đường single-cell hiện tại;
- yêu cầu trỏ tới `plan.md`/`phase-NN-*.md`: giao việc điều phối nhiều cell cho `fgos-plan-loop`;
- mọi cell coding nhận policy chọn test theo rủi ro, không mặc định chạy full suite nhiều lần;
- một phiên mới chỉ gọi `fgos-code-panel` vẫn resume được track từ state trên đĩa, không cần lịch sử chat.

Đây là phần còn thiếu sau track `260915-code-implementation-track-policy`. Track cũ đã làm cứng engine/protocol dùng chung và single-cell panel; track này hoàn tất facade nhiều cell mà thiết kế ban đầu yêu cầu.

## Kiến trúc đích

```text
coding request
  -> fgos-code-panel
       -> direct request: existing single-cell code panel
       -> plan/phase input: fgos-plan-loop track driver
            -> code-panel policy overlay per cell
            -> shared CoordinationSession / standalone-master-coordination-loop
```

Các ranh giới bắt buộc:

1. `fgos-plan-loop` vẫn là driver generic của track; không biết `trackKind: code` và không chứa nhánh coding.
2. `fgos-code-panel` sở hữu việc nhận diện input coding, chọn mode, và tạo coding policy overlay.
3. Không chép thuật toán audit/open/review/red-team/fix/close từ plan-loop vào code-panel.
4. Không bắt plan cũ migrate sang schema YAML mới. Plan/phase hiện có là input hợp lệ.
5. CLI coordination và FlowDefinition vẫn là authority cho mutation, quorum, resume và close.

## Quyết định đã khóa

- Một cửa vào phía người dùng: `fgos-code-panel`.
- Hai mode nội bộ: `direct-single-cell` và `planned-multi-cell`.
- `planned-multi-cell` sử dụng `fgos-plan-loop`, không tự dựng loop thứ hai.
- Policy test là overlay của coding facade, không là field bắt buộc của generic plan format.
- Reviewer/red-team đánh giá proof đã có; không tự chạy lại cùng command nếu proof còn hợp lệ.
- Full suite chạy khi trigger đã khai báo hoặc tại integrated final gate, không chạy mặc định ở mọi role/mọi vòng.

## Policy test

Mỗi cell phải có một test decision được materialize vào objective/evidence:

| Tầng | Khi chạy | Người chạy |
|---|---|---|
| Focused | Luôn có cho hành vi/symbol vừa đổi | Doer; Fixer chỉ chạy lại khi patch làm proof cũ hết hiệu lực |
| Affected | Blast radius hoặc contract liên quan đòi hỏi | Doer/Fixer theo phạm vi thay đổi |
| Full | Trigger rủi ro, phase yêu cầu rõ, hoặc final integrated gate | Một lần tại điểm được khai báo |

Full triggers tối thiểu: shared engine/protocol, CLI contract, persistence/resume, mutation gate, quorum/close, install/setup/distribution, hoặc thay đổi mà focused/affected tests không bao phủ được blast radius.

Proof được tái sử dụng khi cùng `command`, cùng Git tree, và cùng environment fingerprint. Một patch mới chỉ làm mất hiệu lực các proof có phạm vi bị patch chạm tới. Mọi escalation lên full phải ghi lý do.

## Điều kiện vào

- Fix `tsk-1bh` đã merge và test chứng minh session P04 có thể đạt terminal close qua đường bình thường.
- Worktree đang vá `tsk-1bh` sạch/đã bàn giao; track này không sửa chồng lên nó.
- Chụp baseline của các track đang tạm dừng: plan path, cell hiện tại, coordination chain/session, commit đã merge, proof còn hiệu lực.

`fgos-plan-loop` phải kiểm tra ba điều kiện này trong audit/step 0. Nếu fix
`tsk-1bh` chưa có trên `BASE_REF`, dừng ở gate; không mở P00 và không tự nhận
việc sửa `tsk-1bh` vào track này.

## Execution Inputs

```text
TRACK_BRANCH: code-panel-multicell-facade
BASE_REF: resolve once from main after tsk-1bh has landed; record immutable SHA in track index
CELL_BRANCH: code-panel-multicell-facade--p<NN>
COORDINATION_ID: code-panel-multicell-facade-p<NN>
ROSTER: doer -> agy-cli / focused-code-implementer; fixer -> agy-cli /
  focused-code-implementer; reviewer -> claude-reviewer / independent-code-reviewer;
  red-team -> codex-cli / adversarial-code-red-team
FULL_TEST: env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test
BASELINE: Date 2026-09-15, BASE_REF 45569ac3379445e93436524c1226159b3869265c,
  command `env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test`,
  environment fingerprint node v24.18.0 / npm 11.16.0 / Linux x86_64 /
  package-lock.json sha256:b097ecd850ca73e265a2dcbf94c63aa48c118069db53d42b00996fecd83fe2fc,
  result tests 6528 pass 6467 fail 52 (47 unique failing titles), of which 46 are
  test/rust-host/* (missing compiled Rust binary, pre-existing, unrelated to this track)
  and 1 is test/cli/fgos-intake-4.test.mjs:318 'ask/answer round-trip on a genuinely legacy durable-doing item (no claim)'
  (seq:2 vs actual seq:3 assertion mismatch, confirmed deterministic by isolated re-run,
  pre-existing, unrelated to this track) -- this baseline list may only shrink, never grow,
  for every later full-suite gate in this track. Full proof record at
  docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/full-suite-baseline.md
MERGE_CADENCE_TO_MAIN: final-only
MAIN_TO_TRACK_SYNC: mandatory immediately before the final full-proof gate;
  merge latest main into TRACK_BRANCH, resolve there, then test that integrated
  tree. If main advances afterward, repeat this sync/test cycle. A sync replaces,
  never appends to, the recorded baseline.
MAX_FIX_ROUNDS: 3 per cell
```

Executor names above are the verbatim coordination roster for reproducible
requests, not permission to bypass execution-time dispatch governance.

## Product Gates

| Phase | Cell | Capability | Status | Exit |
|---|---|---|---|---|
| 00 | Contract và baseline | `code:implement` | planned | `tsk-1bh` terminal-close proof + durable resume inventory; targeted proof |
| 01 | Facade hai mode | `code:implement` | planned | mode/delegation tests xanh; projected skills đồng bộ. **Full-suite gate** nếu projected/shared skill mechanical trigger được xác nhận |
| 02 | Coding test-policy overlay | `code:implement` | planned | tier/reuse/escalation fixtures xanh; targeted proof |
| 03 | Resume và compatibility | `code:implement` | planned | fresh-process + legacy + direct regressions xanh. **Full-suite gate** vì chạm resume contract nếu implementation vượt quá skill prose |
| 04 | Live proof và rollout | `code:implement` | planned | multi-cell/live resume/direct smoke xanh; `npm test` final integrated proof. **Full-suite gate.** |

Plan-level Product Gates và `## Verification` của phase có precedence. Bất kỳ
diff nào chạm dispatch/self-host hooks, session/replay/schema core, shared
invariants, migrations, test-harness foundations hoặc package/install/release
scripts đều nâng cell hiện tại thành full-suite gate dù bảng chưa đánh dấu.

## Final integration protocol

Final integration follows one direction for proof and the opposite direction
only for publication:

```text
latest main -> TRACK_BRANCH -> resolve -> full proof -> merge TRACK_BRANCH -> main
```

1. Ngay trước final gate, merge latest `main` vào `TRACK_BRANCH` và giải quyết
   mọi conflict trong track worktree.
2. Chạy full proof trên kết quả đó; record `testedSha`, Git tree hash và
   environment fingerprint.
3. Merge track ra `main` bằng Lead authority.
4. So sánh tree hash của `main` sau merge với tree đã test và xác nhận
   environment fingerprint không đổi. Commit SHA khác do merge commit không
   tự làm proof stale.
5. Nếu tree và environment giống, reuse proof và không chạy full suite lần hai.
6. Nếu merge/conflict resolution làm tree đổi, `main` đã tiến thêm, hoặc
   environment đổi, không sửa tiếp trực tiếp trên `main`: sync latest `main`
   trở lại track, resolve/fix/test ở đó, rồi thử merge ra lại.

Mỗi distinct `(Git tree, environment fingerprint)` chỉ cần một full proof hợp
lệ. Post-merge full test trên `main` là fallback cho stale proof, không phải
bước mặc định.

## Phases

| Phase | Kết quả độc lập | Phụ thuộc |
|---|---|---|
| [P00](phase-00-contract-and-baseline.md) | Contract facade và baseline resume được khóa bằng test/spec | `tsk-1bh` landed |
| [P01](phase-01-two-mode-facade.md) | `fgos-code-panel` chọn đúng direct hoặc planned mode | P00 |
| [P02](phase-02-coding-test-policy-overlay.md) | Mỗi planned cell nhận test policy tiết kiệm, có escalation rõ | P01 |
| [P03](phase-03-resume-and-compatibility.md) | Fresh session resume plan cũ qua code-panel, single-cell không hồi quy | P02 |
| [P04](phase-04-live-proof-and-rollout.md) | Live proof đo được chi phí test và mở lại các plan bị dừng | P03 |

Mỗi phase là một cell của plan-loop, dispatch capability `code:implement`, và phải qua review + red-team độc lập trước khi close.

## Cell status

| Cell | Status | Coordination | Commit | Evidence |
|---|---|---|---|---|
| P00 | in-progress | code-panel-multicell-facade--p00 | — | targeted (docs/evidence-only) |
| P01 | planned | — | — | — |
| P02 | planned | — | — | — |
| P03 | planned | — | — | — |
| P04 | planned | — | — | — |

Driver cập nhật bảng này khi open/close từng cell. Chỉ một cell được
`in-progress`; thứ tự P00 -> P04 là bắt buộc.

## Thứ tự file dự kiến

1. Spec/skill contract và test kiến trúc.
2. Source skill `domains/coding/skills/fgos-code-panel/SKILL.md`.
3. Shared fragment hoặc helper nhỏ cho policy overlay, chỉ khi P00 chứng minh cần thiết.
4. Generated/plugin projections bằng generator hiện có.
5. Verification traces, closeout, `CHANGELOG.md` nếu hành vi người dùng thay đổi.

Không sửa generic engine trước khi một failing test chứng minh engine thiếu primitive. Nếu thiếu primitive thật, dừng phase tương ứng và re-plan thay vì lén mở rộng scope.

## Out Of Scope

- Sửa hoặc thay thế fix `tsk-1bh` đang được phiên khác sở hữu.
- Thêm `trackKind`, `executionPolicy`, plan schema/validator bắt buộc hoặc
  domain-specific branch vào generic plan-loop/engine.
- Thay đổi Work lifecycle, `fgos pick/cook/submit`, dashboard hoặc gateway.
- Tối ưu runtime test runner/npm suite bên dưới; track này tối ưu test
  selection và proof reuse của code-panel.
- Migrate hàng loạt plan cũ hoặc sửa các worktree/branch đang hoạt động.

## Risk map

| Rủi ro | Mức | Proof point |
|---|---|---|
| Facade chỉ đổi wording, thực tế không resume được | Cao | P03 fresh-process proof từ state trên đĩa |
| Copy logic plan-loop gây drift | Cao | Static architecture test + review file ownership ở P01 |
| Tiết kiệm test làm lọt regression | Cao | P02 trigger matrix và P04 cell cố ý kích hoạt full |
| Vẫn chạy full lặp lại ở reviewer/red-team hoặc sau merge ra main | Trung bình | Trace đếm command theo role/tree/environment trong P04 |
| Plan cũ bị ép migrate | Cao | Legacy fixture không có metadata mới ở P03 |
| Single-cell code-panel hồi quy | Trung bình | Existing suite + direct live smoke ở P03/P04 |
| Fix `tsk-1bh` chưa đủ làm close treo | Cao | P00 terminal-close precondition |

## Definition of done

1. Người dùng chỉ cần gọi `fgos-code-panel` cho cả direct request và plan-driven track.
2. Input plan chạy qua đúng `fgos-plan-loop`; không có loop orchestration bản sao.
3. Fresh session xác định được next cell và resume đúng từ durable state.
4. Một legacy plan không có metadata mới vẫn chạy được.
5. Trace chứng minh reviewer/red-team không lặp lại full suite khi proof hợp lệ.
6. Track fixture có ít nhất hai cell: một cell chỉ focused/affected, một cell kích hoạt full; final integration chạy full không quá một lần cho cùng `(tree, environment)` và không mặc định test lại trên `main`.
7. Direct single-cell behavior và tests hiện có vẫn xanh.
8. `npm test` xanh tại final integrated gate; focused suites xanh ở từng phase.
9. Docs/projections/changelog đồng bộ và có closeout dẫn tới evidence.

## Verification strategy

- Trong từng phase: chạy focused tests trước; affected tests theo GitNexus blast radius.
- Trước mọi symbol edit: chạy GitNexus impact và báo risk.
- Trước commit: chạy `detect_changes({scope: "compare", base_ref: "main"})`.
- Chỉ P04 chạy full suite mặc định; phase sớm chỉ chạy full khi trigger table yêu cầu.
- Live traces phải ghi command, tree hash, environment fingerprint, role, duration, result, và reuse/escalation reason.
- Final gate luôn sync `main` vào track trước khi test. Merge ra `main` chỉ
  invalidate proof khi tree hoặc environment thực sự đổi; commit SHA khác
  một mình không đủ.

Durable trace root:
`docs/architect/agent-coordination/verification/code-panel-multicell-facade/`.
Mỗi cell phải ghi ba state riêng: `coordination-accepted` tại `testedSha`,
`merged-to-track` tại `integratedSha`, và `checkpoint-verified` chỉ tại gate.
Nếu hai SHA khác nhau, không suy proof qua merge trừ khi tree giống hệt và
environment fingerprint không đổi; khi đó ghi rõ `treeIdentical: true`.

## Rollback

Facade phải additive. Rollback an toàn là bỏ nhánh `planned-multi-cell` và policy overlay, để đường direct single-cell cùng `fgos-plan-loop` độc lập tiếp tục hoạt động. Không rollback engine/protocol dùng chung.

## Outstanding questions

None
