# Audit độc lập: `fgos-code-panel` — chất lượng theo "trong mềm, ngoài cứng"

Ngày: 2026-09-05. Phạm vi: đọc trực tiếp skill, protocol, contracts, `run.mjs`/`session-engine.mjs`/`assignment-runner.mjs`/`assignment.mjs`, 11 test file liên quan, live-proof R5 của plan-loop và state thật trên `/home/vantt/projects/fgos-test-drive`. Không sửa file.

Ký hiệu bằng chứng: **[RT]** runtime enforce · **[PR]** chỉ prose yêu cầu · **[FX]** chỉ test fixture giả định · **[LP]** live proof chứng minh · **[CL]** tuyên bố chưa có bằng chứng.

## 1. Findings

### CRITICAL

**C1 — Persona/doctrine không bao giờ tới actor. Persona là trang trí.**
- Bằng chứng: `renderAssignmentPrompt` (`src/runner/dispatch/assignment.mjs:643-700`) chỉ render Assignment id / Work / Role / Objective / Context refs / Expected outputs / đường dẫn artifact. Không render `persona`, không render `constraints`. `executeAssignment` chỉ truyền `prompt, model, tier` vào `executeExecutorCli` (`assignment-runner.mjs:~905-918`). Persona được resolve (`assignment-policy.mjs:130-141`) và ghi vào RunResult `policy.persona` (live: `asgn_lead_r5_childa_op_005` ghi `persona: "adversarial-tester"`, source `cli`) nhưng không có code path nào đưa nó vào prompt. Không test nào assert persona trong prompt (`test/runner/assignment.test.mjs:140-175` chỉ kiểm refs/outputs/paths).
- Thiếu: **trong mềm** không có chỗ để sống — reviewer và red-team chỉ khác nhau bằng 1 câu `objective`; "code-quality-reviewer" vs "edge-case-and-security-attacker" là nhãn.
- Tác động: project dùng fgOS tưởng đã có panel với posture khác nhau; thực tế 3 process nhận cùng dạng prompt 8 dòng.
- Sửa tối thiểu: (skill, ngay) đưa doctrine vào text `objective` từng step; (runtime, nhỏ) render `persona` + `constraints` vào prompt + 1 test; (skill) giải thích persona là prose chuyển vào prompt, không phải enum.
- Nơi sửa: runtime + tests (gốc), skill (tạm thời).

**C2 — Session không bao giờ close theo cả hai đường thường gặp; mục "Close" của skill sai.**
- Bằng chứng: `closeSessionByQuorum` (`session-engine.mjs:3576-3640`) yêu cầu mọi actor trong `manifest.actors` (doer/reviewer/red-team/**fixer**) `completed`, không thì cần `partialPolicy` khai từ lúc open. (a) First pass sạch, không fix round → `fixer` `missing` → refuse. (b) Có tsk-371 → doer graded `failed` → refuse. `open.json` của skill không có `partialPolicy`, không có `aggregateBounds`. `disposition` là string tự do ≤200 ký tự (`src/verbs/coordination/schema.mjs` `validateDispositionStep`), `recordDriverDisposition` chỉ append ledger — `"cell-closed"` không có nghĩa runtime. **[LP]** cả 6 session trên fgos-test-drive vẫn `status: active`, `partialPolicy: null`; Lead report Gap 3: "`closeAttempted: true, closed: false` forever".
- Thiếu: **ngoài cứng** quorum/close rule không dùng được; replay không phân biệt "đã đóng" với "bỏ dở" (Q12).
- Sửa tối thiểu: skill khai `partialPolicy: {allowedOmissions: ["fixer"]}` + `aggregateBounds.wallTimeMs` trong `open.json`; runtime fix tsk-371; protocol/engine: quyết định fixer không gating hoặc close theo driver disposition.
- Nơi sửa: skill (ngay), runtime (tsk-371), protocol.

**C3 — Template fix round hỏng nguyên văn; nửa revise→recheck của loop chưa có live proof nào.**
- Bằng chứng: `fix-1.json` của skill: 2 step `authorize` cho `reviewer-recheck`/`red-team-recheck` không có `grantedContextRefs`, trong khi operation step dùng `contextRefs: ["$ref:revise"]` → `dispatchDeclaredOperation` refuse: "contextRefs entry ... is not granted by authorization ... (grantedContextRefs: [])" (`session-engine.mjs:2601-2612`). **[LP]** Lead report Gap 7 tái hiện đúng lỗi này trên template plan-loop cùng shape; code-panel copy sau khi gap đã được ghi mà không sửa. Thêm `wallTimeMs` mặc định 1h (`src/runner/coordination/schema.mjs:75-81`) giết cả 2 fix round live (Gap 8) → cả cell-1 lẫn cell-2 Lead **tự sửa tay** và tự verify, Fixer/recheck qua engine chưa từng chạy.
- Thiếu: **ngoài cứng** revision-aware recheck, bounded rounds có tồn tại trong engine nhưng không đến được từ skill; **[CL]** "Fixer + recheck trên revision mới".
- Sửa tối thiểu: thêm `"grantedContextRefs": ["$ref:revise"]` vào 2 authorize step; khai `wallTimeMs` lớn hơn khi open; live proof lại một fix round thật.
- Nơi sửa: skill + live proof.

### HIGH

**H1 — Advisory actor bị chấm `no-evidence` trừ khi viết thêm `agent-report.md`; không có findings vocabulary.**
- Bằng chứng: `classifyRunEvidence` (`assignment-runner.mjs:~440-455`): read-only + `done` + không có companion report → `no-evidence`. Skill chỉ yêu cầu `agent-result.json`. **[LP]** op_005 red-team có agent-result đúng, finding đúng → `no-evidence`; cell-2 reviewer op_002 không có file nào, findings chỉ nằm trong `stdout.log` nhưng Lead vẫn accept; red-team childa2_op_003 dùng `status: "failed"` để chở findings → graded failed. Không có schema findings (id/severity) ở bất kỳ tầng nào; disposition per-finding chỉ là `targetRef` string tự do.
- Thiếu: **ngoài cứng** evidence rule không được truyền; **trong mềm** không có doctrine format finding.
- Sửa: skill bắt buộc advisory actor viết `agent-report.md` (findings theo id/severity/file/scenario) + `agent-result.json` `status: done`; runtime sau này: findings có cấu trúc.
- Nơi sửa: skill (ngay), runtime (sau).

**H2 — Driver không có doctrine và không có đường đọc evidence.**
- Bằng chứng: `show` trả ids/quorum/dispositions/pending (`show.mjs:288-312`), không trả summary RunResult. Skill §2 nói "Read results, disposition findings" nhưng không nói evidence nằm ở `.fgos/assignments/<id>/runs/NN/` **của main checkout** (index.md: `--cwd` không dời `.fgos/`), không có severity ladder, không có tiêu chí defect vs preference, không có quy tắc accept/reject/defer, không yêu cầu verify claim với diff. `master-coordinator.md` có đủ (E/F/H).
- Thiếu: **trong mềm** — Q9: runtime chỉ ghi, skill không giúp quyết.
- Sửa: skill viết Driver doctrine (mượn master-coordinator E/F/H + "verify Doer claim bằng cách tự chạy test").

**H3 — Doer/Fixer không có coding doctrine; roster doer chưa từng được proof.**
- Bằng chứng: objective doer 2 câu; không có scout repo/spec/test, giới hạn scope, chọn test, commit format, xử lý mơ hồ (`status: blocked`), đọc CLAUDE.md/AGENTS.md. Fixer: "Apply the accepted findings". Doer mặc định `agy-cli`: `rigorOverrides` ép mọi tier → `lightweight`; live doer là `codex-cli`, agy chưa từng làm doer mutating trong live proof. **[CL]** agy commit được trong `--mode accept-edits`.
- Thiếu: **trong mềm** Q3.
- Sửa: role packet Doer/Fixer trong objective; live proof với roster thật.

**H4 — Chọn tier/model per-actor gần như danh nghĩa.**
- Bằng chứng: `analytical` → `sonnet` mặc định (`config.mjs:138`) = `standard`; `codex-cli` args không có `{model}`; `agy-cli` rigorOverrides → lightweight; `--model`/`actors[].model` bị refuse cho declared-protocol (`run.mjs` `assertModelSupportedForKind`). RunResult có ghi tier/model/executor/persona **[RT]** (Q7: có bằng chứng binding) nhưng tier chọn không đổi hành vi với 2/3 executor. Test `dispatch-coordination-role-tiers.test.mjs` chỉ proof với fake executor `test-model-*` **[FX]**.
- Thiếu: **ngoài cứng** per-role selection có channel nhưng không hiệu lực; **trong mềm** không có tiêu chí khi nào escalate.
- Sửa: skill nói rõ tier làm gì với từng executor + khi nào `critical`; config codex thêm `{model}`; runtime mở model channel cho declared-protocol.

**H5 — Mutation boundary chỉ được chấm điểm, không được ngăn; advisory actor chạy chung worktree với fixer.**
- Bằng chứng: `claude-reviewer` giữ `acceptEdits`; `codex-cli` chạy `--dangerously-bypass-approvals-and-sandbox`; write bị graded failed nhưng file vẫn nằm trên đĩa (**[LP]** neg2b `NEGATIVE-CHECK-B.md`); `rollbackReadOnlyMutations` zero caller (tsk-2bu). Reviewer/red-team chạy trong cùng worktree fixer sẽ sửa → contamination (live Test 3: red-team để lại fuzz script untracked).
- Thiếu: **ngoài cứng** — H5 là thứ prose nhắc nhưng runtime phải enforce (Q16).
- Sửa: runtime gọi rollback cho assignment read-only hoặc chạy advisory trong checkout detached; skill tạm: `git status --porcelain` sau mỗi advisory step, reset trước fix round.

**H6 — Không có test và không có live proof nào cho chính code-panel.**
- Bằng chứng: commit `7e9606a4` = SKILL.md ×3 mirror + CHANGELOG. `grep code-panel test/` = 0. 11 test file liên quan chứng minh legality engine với fake executor (`coordination-run-live-proof.test.mjs:27-60` spawn `process.execPath fake-executor.mjs`). Không test nào đẩy `mutation: "mutating"` qua `runCoordinationUseCase` (grep 0) — đó là lý do tsk-371 lọt. Live proof R5 dùng roster plan-loop (doer codex / red-team agy), không phải roster code-panel (doer agy / red-team codex).
- Thiếu: Q13/Q14 — tests chứng minh harness; live proof chứng minh dispatch/commit/resume, không chứng minh chất lượng review.
- Sửa: test `run.mjs` forward mutation; live proof với roster code-panel, có 1 fix round thật.

### MEDIUM

**M1 — Độc lập chỉ ở mức context của prompt, không fenced.** Steps chạy tuần tự (`run.mjs` R1); reviewer/red-team là process mới, chỉ ref `$ref:produce` **[RT]**; nhưng cả hai đọc được `.fgos/assignments/*/runs/*` của nhau (cùng repoRoot), và prompt chỉ đưa `asgn_...` id thô, không nói dereference ở đâu. Q8: độc lập nhờ cấu trúc, không có guard chống cross-read. Sửa: skill dặn không đọc run dir sibling; runtime truyền ref dạng path.

**M2 — Dissent/failed actor không có chỗ cấu trúc.** `run.mjs` gọi `closeSessionByQuorum` không truyền `dissentingActorIds`; disposition free-text; nếu sau này close partial với `allowedOmissions`, actor `failed` chỉ hiện ở `failedActors`. Q10: runtime không synthesis (tốt) nhưng cũng không giữ dissent. Sửa: run.mjs suy `dissentingActorIds` từ disposition `rejected`; skill bắt close rationale liệt kê mọi finding + disposition.

**M3 — Resume chỉ nửa đường.** `chain`/`show` cho ids + pending auth + dispositions **[RT]**; code-panel không nhắc `chain` (plan-loop có); status `active` vĩnh viễn (C2); live proof phải pre-feed 3 gap vào prompt của process resume (Lead report Test 3). Q12: agent mới resume được nếu đã đọc SKILL.md + tự biết gaps. Sửa: skill thêm mục Resume (chain → đọc dispositions → evidence path → next).

**M4 — Ergonomics thua direct implementation cho change nhỏ (Q17/Q18).** 3 file JSON tay (~40/60/20 dòng), 3 CLI call, worktree tay, copy assignment id tay giữa các call (không `$ref` xuyên call), đào evidence tay, 5 workaround tay (tsk-371, partialPolicy, grantedContextRefs, wallTime, agent-report). Project ngoài cần `.fgos/config.json` có executors + `modelPolicies` (fgos-test-drive phải sửa "missing modelPolicies", key `openai-codex` vs `codex`); `fgos setup` không seed `codex-cli`/`modelPolicies`. `launch-master-loop` chỉ first pass, không per-actor policy. Sửa: composer `fgos coordination code-panel open|fix|close` hoặc script trong skill; doctor check executors+modelPolicies.

**M5 — Mục "Known gap" chỉ ghi tsk-371** trong khi live proof đã ghi 8 gap, 4 gap còn lại (2,3,5,7,8) đều trúng thẳng template code-panel. Sửa: skill.

### LOW

- **L1** `writerId` là string tự khai, `assertDriverIdentity` so bằng (`store.mjs`); đúng với trust model "request file trusted" nhưng skill nên nói rõ.
- **L2** Red-team `codex-cli` bypass sandbox trên máy Lead; với project ngoài đây là quyết định an ninh cần nói rõ trong skill.
- **L3** Skill trích line number (`schema.mjs:46-50,133`) dễ drift.
- **L4** `agy-cli` từ chối framing "attack" (Gap 6); persona text hiện tại executor-agnostic, đổi executor là gãy.

## 2. Bảng capability

| Capability | Required | Present | Mức | Evidence | Gap |
|---|---|---|---|---|---|
| Actor/run independence (process riêng) | ✔ | ✔ | Enforced | `executeAssignment` spawn mỗi assignment; LP 3 executor | Không fence cross-read run dir (M1) |
| Per-role executor selection | ✔ | ✔ | Enforced | `actorPolicyFields` → `cliPolicy` → RunResult provenance | — |
| Per-role tier/model có hiệu lực | ✔ | ◐ | Assumed | LP: codex không `{model}`, agy ép lightweight | H4 |
| Persona → prompt | ✔ | ✘ | Claimed | `renderAssignmentPrompt` không render | C1 |
| Constraints → prompt | ✔ | ✘ | Claimed | như trên | C1 |
| Authority boundary (no Work keys) | ✔ | ✔ | Enforced | `assertNoWorkLifecycleKeys` + tests | — |
| Merge ngoài session | ✔ | ✔ | Enforced+Guided | Không step nào merge; skill nói Lead merge | — |
| Mutation gate 4 điều kiện | ✔ | ◐ | Enforced nhưng unreachable | `assertMutatingDispatchAllowed`; run.mjs không forward | tsk-371 |
| Read-only actor không được sửa repo | ✔ | ◐ | Graded only | grade failed, file còn; rollback 0 caller | H5 |
| Worktree isolation | ✔ | ✔ | Guided+Enforced | `--cwd` + main-checkout refusal | Advisory chung worktree fixer |
| Visibility control (grantedContextRefs) | ✔ | ✔ | Enforced | session-engine 2560-2612 | Template không dùng đúng (C3) |
| Immutable RunResult/evidence | ✔ | ✔ | Enforced | assignment.json immutable, sha256 claim/report | — |
| Findings có cấu trúc | ✔ | ✘ | Absent | agent-result chỉ status/summary | H1 |
| Per-finding disposition | ✔ | ◐ | Ledger only | free string targetRef/disposition | H1/H2 |
| Disposition doctrine (driver) | ✔ | ✘ | Absent | skill §2 | H2 |
| Revision-aware recheck (≠ retry) | ✔ | ✔ | Enforced | authorization-keyed taskKey, ticket-reuse guard | Chưa reach được từ template (C3) |
| Bounded rounds | ✔ | ✔ | Enforced | aggregateBounds, maxInvocations | wallTime 1h quá ngắn (C3) |
| Crash/resume | ✔ | ✔ | Enforced | replay từ event log; LP kill -9 | Skill không nhắc chain (M3) |
| Quorum/close | ✔ | ◐ | Enforced nhưng unreachable | fixer missing / doer failed | C2 |
| Dissent giữ nguyên | ✔ | ✘ | Absent | dissentingActorIds không truyền | M2 |
| Doer coding doctrine | ✔ | ✘ | Absent | objective 2 câu | H3 |
| Reviewer doctrine | ✔ | ✘ | Absent | 1 câu | C1/H1 |
| Red-team attack posture | ✔ | ✘ | Absent | 1 câu | C1 |
| Fixer discipline (chỉ sửa accepted) | ✔ | ◐ | Guided | "Apply the accepted findings" | H3 |
| Test sufficiency judgment | ✔ | ✘ | Absent | — | H2/H3 |
| Uncertainty handling (`blocked`) | ✔ | ✘ | Absent | vocab không được nói (Gap 2) | H1 |
| Adaptation theo loại change | ✔ | ✘ | Absent | 1 câu "sharpen persona" | H4 |
| Usable từ project ngoài | ✔ | ◐ | Assumed | LP cần sửa config tay | M4 |
| Tests cho code-panel | ✔ | ✘ | Absent | grep 0 | H6 |
| Live proof roster code-panel | ✔ | ✘ | Absent | LP roster khác | H6 |

## 3. Trả lời 18 câu hỏi

1. Chủ yếu là harness chạy Doer/Reviewer/Red-Team. Phần "tư duy" chỉ còn 1 câu objective/step.
2. Không đủ soul. SKILL.md là hướng dẫn điền JSON + gọi CLI, kèm 1 known-gap.
3. Không. Doer không có scout/scope/test/commit/blocked doctrine; roster doer chưa proof.
4. Không. Khác nhau đúng 1 câu objective + persona label không tới prompt (C1).
5. Đúng. Persona là chuỗi ngắn, được ghi vào RunResult nhưng không truyền vào assignment prompt.
6. Chọn được executor per-actor (enforced); tier/model gần như danh nghĩa với agy/codex; roster hardcode trong prose, không có tiêu chí chọn.
7. Có: RunResult `policy.provenance.{executor,tier,persona}` + `executorId` thật (kể cả redirect `claude→claude-reviewer`). Nhưng đó là bằng chứng binding được ghi, không phải bằng chứng persona được dùng.
8. Độc lập về context nhờ cấu trúc (ref chỉ `$ref:produce`), tuần tự về timing, không fence cross-read.
9. Runtime chỉ ghi. Skill không có doctrine disposition; `show` không trả findings.
10. Runtime không synthesis. Nhưng session không close được nên câu hỏi hiện moot; khi close partial, failed actor chỉ nằm ở `failedActors`, dissent không được ghi.
11. tsk-371 (doer failed), partialPolicy (không close), grantedContextRefs (fix round refuse), wallTime 1h (fix round refuse), agent-report.md (advisory no-evidence), status vocab (failed cần `error`), agy từ chối "attack".
12. Resume được về mặt dữ liệu (chain/show/dispositions) nhưng agent mới phải tự biết 5 gap và không phân biệt được closed/abandoned.
13. Legality/harness. Không test nào đo chất lượng reasoning; không test nào đi qua CLI door với `mutating`.
14. Dispatch, commit, kill/resume, Work-state untouched. Chất lượng review chỉ được đọc bằng mắt Lead; fix round qua engine chưa từng chạy.
15. Over-contract: `disposition` string + `contribution`/aggregation/visibility-window machinery cho use case 1 cell; `authorize` + `operation` cặp đôi ×3 cho một fix round nên là 1 composer call.
16. Prose-only mà nên enforce: rollback read-only mutation; partialPolicy/wallTime mặc định; grantedContextRefs tự suy từ contextRefs; findings shape; dissent từ disposition.
17. Chậm hơn direct implementation + `/code-review` cho change nhỏ (M4).
18. Chưa. Cần hiểu CoordinationSession (partialPolicy, authorize, $ref, taskKey, evidence path) và sửa config executors/modelPolicies tay.

## 4. So với `master-coordinator.md`

| Khía cạnh | master-coordinator (manual) | code-panel |
|---|---|---|
| Role packets, Must Read, context budget | Có, chi tiết | Không |
| Severity ladder, disposition rule, close criteria | Có (E/F/H) | Không |
| Test baseline, stop gates | Có | Không |
| Independence | Prose + "never impersonate" | Enforced (process riêng, mediated refs) |
| Mutation/authority gating | Prose | Enforced (schema + engine) |
| Ledger/replay/resume | File md tay | Event log, replay, chain |
| Bounded rounds, ticket reuse | Prose | Enforced |
| Chất lượng điều phối thực tế | Cao khi Lead giỏi | Thấp: Lead phải tự bù doctrine + 5 workaround |

Kết luận: master-coordinator = soul không có vỏ cứng; code-panel = vỏ cứng mất soul. Chưa cái nào là "trong mềm, ngoài cứng".

## 5. Kết luận riêng

- **Hard shell**: nền tảng tốt (authority, provenance, ticket-reuse, replay, mediated visibility) nhưng 3 cổng quan trọng không tới được từ skill (mutation forward, close, fix round) và 1 boundary chỉ chấm điểm (read-only mutation).
- **Soul/prose**: rỗng. Không role doctrine, không driver doctrine, persona không tới actor, adaptation không có.
- **End-to-end thực tế**: theo template nguyên văn, first pass chạy được (nếu config executors đúng) nhưng doer bị chấm failed, advisory no-evidence, fix round bị refuse, session không close. Live proof duy nhất là của plan-loop với roster khác và Lead tự sửa tay.

## 6. Verdict: **REVISE**

Không UNSAFE (Work/merge authority giữ được, mutation bị graded), không READY, và không chỉ HOLLOW vì template hiện tại không chạy hết vòng.

## 7. Thứ tự khắc phục

1. **Phục hồi soul**: viết role packets Doer/Reviewer/Red-Team/Fixer + Driver doctrine (severity, defect vs preference, verify claim, accept/reject/defer, close criteria) vào skill; runtime render `persona` + `constraints` vào prompt (+test).
2. **Đóng safety gaps**: tsk-371; skill khai `partialPolicy`/`wallTimeMs`; `grantedContextRefs` trong fix template; advisory bắt buộc `agent-report.md` + status vocab; rollback/fence read-only (tsk-2bu); `dissentingActorIds` từ disposition rejected; test đi qua CLI door với `mutating`.
3. **Usability**: composer/script cho open/fix/close với `$ref` xuyên call; mục Resume dùng `chain`; doctor check executors + modelPolicies; findings có cấu trúc.
4. **Proof lại trên project ngoài fgOS** với roster code-panel thật, gồm 1 fix round qua engine, recheck trên revision mới, close thật, và đánh giá chất lượng findings bằng seeded bugs có đáp án.

## Câu hỏi chưa giải quyết

- Có nên để `fixer` là gating actor trong protocol, hay chấp nhận `partialPolicy` là cách chuẩn?
- `agy-cli` có commit được trong `--mode accept-edits` không? Chưa có bằng chứng.
- Red-team chạy `codex-cli` bypass sandbox có phải quyết định có chủ đích cho project ngoài không?
