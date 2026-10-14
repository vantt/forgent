# Hội đồng một-cửa cho dispatch: kết luận và bất đồng

Bản ghi bền của workflow `architecture-advisory` run `wf-run-1791954414059-0de8603c` (2026-10-14, worktree `council-onedoor` tách từ main e7f02ed09). Trạng thái: **khuyến nghị, chưa được owner duyệt**; gói có 5 phát hiện review còn mở (mục 4).

Nguồn settled: framing `unit-run-1791954414346-78258b8e`, shaping `unit-run-1791954538847-421322d2` (claude-herdr, openai, gemini, synthesizer claude-herdr), critique `unit-run-1791954802802-67738bc2`, synthesis `unit-run-1791955179547-c6c78e66` (producer/2 = gói cuối r2; reviewer/2, red-team/2 = openai), explanation `unit-run-1791955734774-274cabe5`. Gói JSON đầy đủ được chép nguyên văn ở cuối file.

Ba lần chạy trước hỏng, mỗi lần đúng một triệu chứng trong danh sách đề xuất: run 1–2 ghế synthesizer xai trả exit 0 nhưng claim sai schema / không evidence (bị claim v2 chặn); run 3 ghế framing bị `read-only-mutation` vì phiên khác commit e7f02ed09 lên main giữa chừng (đề xuất 8, tái hiện thật). Run 4 chạy với pool `architecture:shape` bỏ xai/glm (owner chọn phương án B, chỉ cho lần này; config đã trả về sau run) và trên worktree tách riêng.

## 1. Phán quyết (đồng thuận 4/4 về hướng, không phải về lộ trình)

Hợp nhất **cửa hợp đồng**, giữ **hai tầng cài đặt**. Cửa chuẩn = hợp đồng Assignment (`fgos run`/`runUnit` → `executeAssignment`): receipt `assignment-run-result` v3 + claim `agent-result-claim` v2 + evidence bền. `executeExecutorCli` là transport nội bộ, không phải cửa của caller. `execute <executor>` thô hạ xuống transport/compat trong hướng dẫn, chưa xoá. RUL68 giữ nguyên.

## 2. Lộ trình

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 0 | Merge 360aced90, 5d8b7cdb1, af132275b (af132275b giữ phạm vi, viết lại spec/changelog là "read-only `--contract` lấy posture từ capability qua binding", không phải lane thứ tư); điều kiện `npm test` xanh với `CLAUDE_CODE_SESSION_ID` bỏ đặt | Việc 1, 3 đã vào main (53d92958a, dca2e62da). af132275b chờ owner |
| 1 | Sửa `RunResult.confinement` null: predicate `settlement.mjs:697` so `'confined'` (mode không tồn tại, `policies.mjs:68`) và requirement không tới settlement (`assignment-runner.mjs:1472-1484`). Nhãn lấy từ backend thật chạy | Chưa giao |
| 2 | Đề xuất 8 vào settlement qua attribution ladder: correlated → warning. Reject chỉ khi có observer ghi-path gắn run (chưa tồn tại) | Lane D |
| 3 | Doctrine sau code: AGENTS.md:167 + `executor-dispatch-fallback.md` (việc mới → `fgos run`; một lượt chỉ đọc → `execute --contract --for <cap>`; thô = compat) | Sau bước 0 |
| 4 | Wrapper D1 → Unit một lượt: HOÃN, cần owner thay thế RUL68 chiều một + phép đo có chủ | Owner |
| 5 | Xoá D1 thô: chỉ owner quyết, decision record thay RUL68-D1 và RUL77 | Owner |
| 6 | (tuỳ chọn) từ chối lượt ghi chạy từ main checkout ở cửa thô | Owner |

## 3. Tám đề xuất sau hợp nhất

- #1/#2 (log): gộp vào provenance plan/work trên Assignment, không thêm verb `log`. #3: `finalMessage` = `agentClaim.summary`, không field mới. → Lane A.
- #4 effort: transport không đưa effort vào argv; `--effort` parse một lần thành override của `bind()`. #5: cảnh báo model-drift là provenance trong RunResult. → Lane B.
- #7: classifier chạy được khi không có lease, chỉ đọc đầu vào RUL65b cho phép (stderr độ tin cậy cao, outcome adapter đã biết, JSON có cấu trúc), không đọc stdout chung; giờ thử lại chỉ khi provider có tín hiệu cấu trúc; quarantine dùng lại `until` sẵn có; tự hẹn chạy lại thuộc Workflow runner, câu hỏi riêng. → Lane C.
- #8: bước 2. #6: chưa là posture; không xây bwrap subpath; tạm: read-only cho phân tích, worktree + workspace-write cho sửa doc kèm kiểm phạm vi sau sự việc (`scope-checked`, chưa tồn tại, không bao giờ gọi là "confined"). → Lane D, #6 chờ owner nhận hướng Q4.

## 4. Phát hiện review còn mở trên gói r2

| ID | Mức | Nội dung |
|---|---|---|
| F1 / RT2-1 | trung bình | `namedDefaults[0]` "thô còn gọi được tới khi 0 caller đo được" mâu thuẫn bước 5; thay bằng gate di trú do owner quyết, có giới hạn phạm vi |
| F2 / RT2-2 | trung bình | `unresolvedDissent[2]` còn nói "#8 từ chối phụ thuộc attestation" — tiền đề đã bị thay; #8 xuống warning không phụ thuộc bước 1 |
| RT2-3 | **cao** | Ngoài attribution còn nhiều đường refuse: `evidence-attribution.mjs:195-205`, `settlement.mjs:291-300`, `run-result.mjs:528-531`, `cli.mjs:883-885` (`strayWriteError`). Lane D phải liệt kê mọi đường refuse và có test hồi quy phiên-không-liên-quan end-to-end ở bước warning |

## 5. Bất đồng chưa giải (giữ nguyên)

1. Wrapper D1 → Unit: framing, panelist-1, panelist-3 muốn xây ngay để agent được dạy cửa mạnh; panelist-2 (gói theo) doctrine trước, đo, chỉ xây khi chứng minh có lượt ghi qua cửa thô. Giải bằng đo.
2. Hình dạng docs-only: posture thứ ba qua bind() / allowlist theo capability fail-closed / worktree + kiểm phạm vi. Chưa phương án nào chứng minh.
3. Thứ tự sửa confinement: nhẹ.

## 6. Thiếu chuyên môn (cổng close hỏi owner)

bwrap / Linux namespace sandbox policy; định dạng output usage-limit của provider CLI (Codex/OpenAI, xai); đo lưu lượng caller và telemetry di trú qua các cài đặt ngoài; quy trách nhiệm ghi file theo run và cô lập đồng thời; tiến hoá schema RunResult và tương thích caller.

## 7. Việc cần owner quyết

Thay thế RUL68 chiều một cho D1 (trước khi xây wrapper); hành vi lượt ghi từ main checkout (bước 6); sở hữu event `executor.dispatch` (D-0049 §3); chủ/cửa sổ/nguồn ingress/điểm mù của phép đo bước 4; xoá D1 thô và thay RUL77; nhận hướng Q4 không; mời thêm chuyên môn ở mục 6 không.

## Phụ lục: gói cuối r2 (nguyên văn)

```json
{
  "packet": "final-recommendation",
  "assignment": "unit-run-1791955179547-c6c78e66/producer/2",
  "role": "producer",
  "mutation": "read-only",
  "repoHead": "e7f02ed09 (worktree council-onedoor); fix/dispatch-followups tip e210bb725 contains af132275b, not merged",
  "approvalStatus": "NOT APPROVED. This packet is a recommendation for owner/Lead decision. No owner sign-off and no reviewer acceptance of this packet exist. The only consensus claimed is what is attributed below.",
  "verdict": {
    "summary": "Unify the CONTRACT door, keep two implementation tiers: the standard hand-off for any executor turn is the Assignment contract (fgos run / runUnit -> executeAssignment, the current Assignment receipt assignment-run-result v3 (RUN_RESULT_CONTRACT; settlement writes it via normalizeRunResultV3) + the separate agent-result-claim v2 + durable evidence; no receipt version migration is proposed + durable evidence). executeExecutorCli stays as an internal transport, not a caller door. Do NOT build the D1 -> one-shot-Unit wrapper yet; ship merge + correctness fixes + doctrine first, and gate the wrapper on (i) an owner-approved decision superseding RUL68's one-way bridge and (ii) an owned measurement whose coverage and blind spots are stated; incomplete telemetry is inconclusive, never zero.",
    "answers": {
      "q1_standard_door": "One contract door (Assignment; receipt = assignment-run-result v3, claim = agent-result-claim v2, two distinct contracts). Raw `fgos dispatch execute <executor>` is demoted to transport/compat in guidance, not deleted. RUL68 stays in force IN FULL, including its rule that the purpose door never calls back into Assignment (docs/specs/runner.md:1048). Any D1 redirection that crosses that boundary (the step-4 wrapper) needs an owner/Lead-approved superseding decision record BEFORE it is built; deleting raw D1 (step 5) is a separate, later gate. This packet does not decide that reversal. Agreement 4/4 on the contract door (framing, panelist-1, panelist-2, panelist-3; synthesizer concurs); this is agreement on direction, not on rollout or approval.",
      "q2_minimal_route": [
        "0. Merge fix/dispatch-followups commits 360aced90, 5d8b7cdb1 and af132275b. af132275b is kept with frozen scope and reworded in spec/changelog as 'read-only --contract takes its posture from the capability via binding', not a fourth lane. Merge precondition: npm test green with CLAUDE_CODE_SESSION_ID unset, and the branch diff touches only binding/posture plus the two fixes.",
        "1. Fix RunResult.confinement null as its own item, covering both causes: the predicate tests mode 'confined', which is not a legal mode, and the resolved requirement lives only in a local variable and never reaches settlement. The label must come from the backend that actually ran (attestation), not from the requested mode. Contract test: non-null when bwrap ran, null when truly unconfined. Scope of this fix: BACKEND provenance only (which backend ran, which policy coverage it claimed). It does not tell which process wrote which path: bwrap prepare returns claims from plan.coverage (confinement/drivers/bwrap.mjs:568-574), not observed writes.",
        "2. Move proposal #8 (stray-write / read-only-mutation check) into settlement using the evidence-attribution ladder: correlated -> warning now. Proven -> reject requires a trusted, run-bound, positive written-path observer with path coverage (evidence-attribution.mjs:18-19,125-135); step 1 does NOT supply it, and settlement today passes only pre/post dirt (settlement.mjs:655). No such observer exists; building one is unproven new work and its own decision question (RUL11). Until it exists #8 stays at warning. Never promote concurrent main changes to rejection wholesale: that recreates the council run 3 false rejection.",
        "3. Doctrine after code: AGENTS.md:167 and core/skills/_shared/executor-dispatch-fallback.md: new work -> fgos run; read-only single shot -> execute --contract --for <cap>; raw execute <executor> = transport/compat. Must state the mutating single-turn branch truthfully: the only CONTRACT-backed mutating single turn is a Unit via fgos run in a linked worktree; raw execute <executor> still physically writes today, from any cwd including the main checkout (cli.mjs:362-367, 1523-1535), without lease/claim/contract. Then rebuild skill renders.",
        "4. DEFERRED: D1 -> one-shot Unit wrapper. Two prerequisites, both owner/Lead: (i) an approved decision superseding RUL68's one-way bridge for D1 (required before ANY build, regardless of measurement); (ii) a measurement spec naming owner, window, the ingress actually observed, installations/callers covered, D1 separated from D7/D9, and blind spots. Raw execute does not write executor.dispatch (cli.mjs:1523-1540); `dispatch log` is caller-invoked and needs a Work id (dispatch.mjs:111-135); source grep cannot see external projects. So today's data can show demand exists, never that it is absent. A trustworthy count would need an ingress record at the raw door: new work, UNPROVEN, its own decision question. Before building, decide main-checkout mutating behavior for the wrapper (fail closed vs auto-worktree).",
        "5. Delete raw D1 only by owner decision with a decision record superseding RUL68-D1 and RUL77 'one lane per door'. The measurement is an input with its stated coverage; 'no events seen' is inconclusive, not zero callers. Kept separate from the step-4 RUL68 gate.",
        "6. OPTIONAL, owner decision: if ALL mutating execution from the main checkout must fail closed (not just the future wrapper), add an explicit raw-D1 compatibility refusal for mutating runs with cwd == repo root, with a test. Doctrine alone is not that gate. Not decided by this packet."
      ],
      "q2_fate_af132275b": "Merge (frozen scope, reworded). Revert only if the owner decides to remove --contract entirely; no seat argued for that. No council seat has run its tests.",
      "q3_after_unification": {
        "collapse": "#1/#2 (dispatch log) -> a plan/work provenance id on the Assignment, no new `log` verb; #3 finalMessage -> agentClaim.summary, no new field.",
        "remain_shared_layer": "#4 effort (transport argv ignores effort; no CLI sets cliOverride.reasoningEffort), #5 model-drift warning as RunResult provenance, #6 posture (scope check pending; see Q4), #7 only the provider-structured-signal part, #8 settlement attribution.",
        "laneA": "Claim summary + plan/work provenance on the Assignment path. Drop the `log` verb and the `finalMessage` field. Depends on step 0.",
        "laneB": "--effort parsed once as a bind() override and pushed into argv; model-drift provenance warning.",
        "laneC": "Classifier that runs without a lease, reading ONLY what RUL65b permits (high-confidence provider stderr, known adapter outcome such as paused-limit, structured agent JSON such as stopReason) and never general stdout. Retry time only if a provider-specific structured signal exists. Status/quarantine reuses the existing provider-limit + quarantine `until`. Self-rescheduling belongs to the Workflow runner and is a separate decision question. Brief lane-c-usage-limit.md must be corrected before code (it still says 'giờ thử lại đọc từ output provider').",
        "laneD": "#8 into settlement per step 2 (warning only until a run-bound written-path observer exists). #6: if the owner accepts Q4, Lane D implements the scope check as pending work with: a named RunResult field, scope semantics (declared doc globs), owner, and a proof gate covering out-of-scope writes and committed, untracked and renamed files. Until that lands and is verified, report workspace-write plus declared intent only, never 'scope-checked'."
      },
      "q4_docs_only_confined": "Not a posture yet. Do not build bwrap subpath mounting now (new tooling = its own decision question under RUL11; bwrap subpath support UNPROVEN). Recommended interim, PENDING and not yet existing (no 'scope-checked' value exists in src or packages/run-result): read-only posture for analysis; linked worktree + workspace-write for doc edits, plus a settlement check of changed files vs declared scope, recorded as a distinct value 'scope-checked', never 'confined'. Until that check is implemented and verified (Lane D), results report workspace-write + declared intent only. Even when built, it is post-hoc detection, not prevention.",
      "q5_agents_md_149_vs_167": "Keep 149 ('fgos run is the primary door for new work'). Rewrite 167 only after step 0 lands (and again if step 4 lands, which itself needs the RUL68 superseding decision), so agents are never taught a path that does not exist. The conflict is in taught behavior, not literal wording."
    }
  },
  "evidence": [
    {
      "claim": "settlement.mjs:697 tests requirement.mode === 'confined'",
      "source": "src/runner/dispatch/settlement.mjs:697",
      "status": "re-verified by this producer"
    },
    {
      "claim": "Legal modes are required|preferred|unconfined; 'confined' never occurs",
      "source": "src/runner/dispatch/confinement/policies.mjs:68",
      "status": "re-verified"
    },
    {
      "claim": "resolvePosture knows only read-only/workspace-write and always returns mode 'required'",
      "source": "src/runner/dispatch/confinement/policies.mjs:656-669",
      "status": "re-verified"
    },
    {
      "claim": "confinementRequirement is a local; effectivePolicy = compiledPlan.policy is not updated with it",
      "source": "src/runner/dispatch/assignment-runner.mjs:1472-1484",
      "status": "re-verified"
    },
    {
      "claim": "An inline mutating Assignment is effectively unbuildable: it needs explicit isReadOnlyMode:false AND either a protocol-operation stamp (engine retired, :466) or a verified unit-run gate (:574)",
      "source": "src/runner/dispatch/assignment-runner.mjs:394-466,574",
      "status": "re-verified; nuance: not a literal unconditional ban, but the only live path is unit-run"
    },
    {
      "claim": "RUL65b forbids classifying from general stdout",
      "source": "docs/specs/runner.md:1024",
      "status": "re-verified"
    },
    {
      "claim": "AGENTS.md 149 vs 167 teach different doors",
      "source": "AGENTS.md:149, AGENTS.md:167",
      "status": "re-verified"
    },
    {
      "claim": "Lane C brief still asks for retry time 'from provider output'",
      "source": "plans/261014-1033-dispatch-operator-improvements/lanes/lane-c-usage-limit.md:8",
      "status": "re-verified (reviewer cited :6; the actual line is 8)"
    },
    {
      "claim": "af132275b exists only on fix/dispatch-followups",
      "source": "git branch --contains af132275b",
      "status": "re-verified"
    },
    {
      "claim": "Three implementation tiers and three callers of executeExecutorCli",
      "source": "framing report section 1 (run.mjs:151, assignment-runner.mjs:1301, cli.mjs:362; callers cli.mjs:1523, assignment-runner.mjs:2670, fanout-batch.mjs:106)",
      "status": "from framing; not re-verified here"
    },
    {
      "claim": "Council run 3 read-only-mutation was caused by another session committing e7f02ed09 to main mid-run",
      "source": "owner brief context (c); cli.mjs:152-184 git-status before/after check",
      "status": "owner-reported + framing code reading"
    },
    {
      "claim": "xai synthesizer exit 0 with invalid/no-evidence claim was caught by claim v2 validation",
      "source": "owner brief context (a); settlement.mjs:523 validateAgentResultClaim per framing",
      "status": "owner-reported; cited line not re-verified"
    },
    {
      "claim": "Current Assignment receipt is assignment-run-result v3; settlement writes v3",
      "source": "src/runner/dispatch/run-result.mjs:13,291-292; src/runner/dispatch/settlement.mjs:688",
      "status": "re-verified by producer/2"
    },
    {
      "claim": "RUL68: purpose door never calls back into the Assignment tier",
      "source": "docs/specs/runner.md:1048",
      "status": "re-verified by producer/2"
    },
    {
      "claim": "Raw execute calls executeExecutorCli and prints; no executor.dispatch record",
      "source": "src/runner/dispatch/cli.mjs:1523-1540",
      "status": "re-verified by producer/2 (no executor.dispatch string in cli.mjs)"
    },
    {
      "claim": "bwrap prepare returns claims from plan.coverage, not observed writes",
      "source": "src/runner/dispatch/confinement/drivers/bwrap.mjs:568-574",
      "status": "re-verified by producer/2"
    },
    {
      "claim": "Settlement attribution uses only pre/post dirt",
      "source": "src/runner/dispatch/settlement.mjs:655",
      "status": "re-verified by producer/2"
    },
    {
      "claim": "No 'scope-checked' value exists",
      "source": "grep src packages",
      "status": "re-verified by producer/2"
    },
    {
      "claim": "dispatch log is separate and needs --id; raw execute cwd defaults to process.cwd()",
      "source": "src/runner/dispatch.mjs:111-135; cli.mjs:362-367",
      "status": "cited by red-team/1; not re-verified by producer/2"
    }
  ],
  "alternatives": [
    {
      "option": "Delete raw D1 now (P3 phase 5 intent, phase-05-cut-dispatch-work-imports.md:21)",
      "disposition": "rejected",
      "why": "Breaks always-loaded guidance (AGENTS.md:167, executor-dispatch-fallback.md) and the Lead's manual use; the same abrupt deletion was red-team-blocked before. Unanimous."
    },
    {
      "option": "Build the D1 -> one-shot Unit wrapper now",
      "disposition": "deferred behind measurement",
      "why": "Panelist-2: it is effectively a new public Unit compiler with unresolved artifact/worktree/output/cleanup semantics. The counter-argument (agents keep using the weakest door) is partly addressed by doctrine step 3. Neither side has refuted or proven its case; data decides. Independently of the measurement, it crosses RUL68's one-way bridge, so it needs a superseding decision first (reviewer/1 F2)."
    },
    {
      "option": "Keep two caller doors, lift D1 to the same contract",
      "disposition": "rejected",
      "why": "Duplicates lease/claim/classifier logic in the raw tier: a parallel mechanism, contrary to RUL11."
    },
    {
      "option": "Wrap D1 as an inline mutating Assignment",
      "disposition": "rejected",
      "why": "Blocked by the mutating gate (assignment-runner.mjs:394-574); would require loosening a fail-closed gate."
    },
    {
      "option": "Docs-only as a third named bwrap posture with glob write binds",
      "disposition": "deferred",
      "why": "bwrap subpath support is unproven; writes to the git directory and missing target dirs are concrete risks (panelist-3); new tooling is its own decision question."
    }
  ],
  "attributedFindings": [
    {
      "by": "framing (producer r1)",
      "finding": "An inline mutating Assignment cannot carry D1; a Unit forbids executor/provider pins, so provider pinning must use the bind() --override."
    },
    {
      "by": "framing (producer r1)",
      "finding": "Evidence (a) argues FOR the Assignment door: claim v2 caught what raw D1 would report as DONE."
    },
    {
      "by": "panelist-1",
      "finding": "Fix confinement:null before anything that claims confinement; mutating D1 from the main checkout is a behavior change that needs a decision."
    },
    {
      "by": "panelist-2",
      "finding": "'One door' = one completion boundary, not necessarily one syntax; measure before building the wrapper; a restriction enforced only by instructions must never be called confined."
    },
    {
      "by": "panelist-3",
      "finding": "Do not build bwrap subpath mounting; use worktree + settlement scope check. Proposed a one-line predicate fix (shown incomplete by the synthesizer and the critique producer)."
    },
    {
      "by": "synthesizer",
      "finding": "Proved both causes of confinement:null by reading code; recommended merge + fixes + doctrine first, with the wrapper gated on measurement."
    },
    {
      "by": "critique producer r2",
      "finding": "RUL65b at runner.md:1024 settles the Lane C stdout question in panelist-2's favor; 'preferred' mode may fall back to unconfined, so labels must come from attestation."
    },
    {
      "by": "critique reviewer r2",
      "finding": "Finding 1: the council conclusion and dissent are not persisted in plans/.../reports or the lanes, yet C/D are marked running. Finding 2: the Lane C brief is broader than RUL65b allows."
    },
    {
      "by": "reviewer/1 (final-packet review)",
      "finding": "F1: packet named RunResult v2; current is v3. F2: wrapper reverses RUL68 before any authorization is scheduled."
    },
    {
      "by": "red-team/1 (final-packet attack)",
      "finding": "RT1 measurement cannot prove zero; RT2 confinement fix is not write attribution; RT3 scope-checked does not exist yet; RT4 = F1; RT5 main-checkout fail-closed default does not bind raw D1."
    }
  ],
  "dispositions": [
    {
      "item": "Reviewer Finding 1 (no durable council record)",
      "disposition": "accepted; this producer is read-only and cannot write it. The Lead must persist this packet (or its conclusion + dissent) under plans/261014-1033-dispatch-operator-improvements/reports/ via `fgos convention path`, link it from the lane-c and lane-d briefs and plan.md, and keep C/D read-only until committed."
    },
    {
      "item": "Reviewer Finding 2 (Lane C vs RUL65b)",
      "disposition": "accepted; lane-c-usage-limit.md must be narrowed before code. Widening requires a superseding decision on RUL65b."
    },
    {
      "item": "panelist-3 one-line confinement fix",
      "disposition": "rejected as insufficient (the requirement never reaches settlement; a mode-based label can lie under 'preferred')."
    },
    {
      "item": "Proposals #1/#2/#3",
      "disposition": "collapsed into Assignment provenance + agentClaim.summary."
    },
    {
      "item": "Proposal #7 self-reschedule",
      "disposition": "moved out of dispatch to the Workflow runner; separate decision question."
    },
    {
      "item": "xai synthesizer reliability (evidence a)",
      "disposition": "separate item, not part of door unification."
    },
    {
      "item": "reviewer F1 / red-team RT4 (receipt version)",
      "disposition": "accepted; corrected to assignment-run-result v3 + agent-result-claim v2; no migration proposed."
    },
    {
      "item": "reviewer F2 (RUL68 reversal order)",
      "disposition": "accepted; owner/Lead-approved superseding decision is now a prerequisite of step 4; step 5 deletion gate kept separate. Escalated, not decided."
    },
    {
      "item": "red-team RT1 (measurement)",
      "disposition": "accepted; measurement now requires stated ingress, coverage, window, owner, D1 vs D7/D9 split and blind spots; absence = inconclusive; deletion is an owner decision."
    },
    {
      "item": "red-team RT2 (attestation)",
      "disposition": "accepted; step 1 = backend provenance only; proven-reject needs a run-bound written-path observer, unproven new work."
    },
    {
      "item": "red-team RT3 (scope-checked)",
      "disposition": "accepted; marked pending with contract field, semantics, owner and proof gate in Lane D; not reported before verified."
    },
    {
      "item": "red-team RT5 (main-checkout default)",
      "disposition": "accepted; default now bounded to the future wrapper; raw D1 writes from main today; optional refusal step 6 left to owner."
    }
  ],
  "unresolvedDissent": [
    {
      "topic": "Build the D1 -> one-shot Unit wrapper now vs measure first",
      "sides": "framing, panelist-1, panelist-3: build the shortcut so agents are taught the strong door. panelist-2 (adopted by the synthesizer and this packet): doctrine first, measure, build only if mutating prompt-raw use is proven.",
      "status": "open; resolve by the step-4 measurement, not by vote."
    },
    {
      "topic": "Docs-only confinement shape",
      "sides": "framing/panelist-1: third named posture via bind(). panelist-2: capability-specific allowlist, fail closed. panelist-3: no subpath bwrap, worktree + scope-check.",
      "status": "open; interim 'scope-checked' adopted only as a stopgap; none proven."
    },
    {
      "topic": "Order of the confinement fix",
      "sides": "panelist-1: before the wrapper; panelist-3: inside step 0; panelist-2: after af132275b.",
      "status": "minor; this packet puts it right after step 0 and before #8 because #8 rejection depends on attestation."
    }
  ],
  "namedDefaults": [
    {
      "default": "Raw `execute <executor>` stays callable (compat) until zero measured callers.",
      "reversibleBy": "measurement + decision record"
    },
    {
      "default": "Mutating single-turn work from the main checkout fails closed in the FUTURE wrapper only (no auto-worktree) until the owner decides. This does not describe current behavior: raw D1 still writes from main.",
      "reversibleBy": "owner decision; step 6 if owner wants raw D1 bound too"
    },
    {
      "default": "Lane C reads only RUL65b-permitted inputs.",
      "reversibleBy": "decision superseding RUL65b"
    },
    {
      "default": "No 'confined' label without backend attestation. 'scope-checked' is not reported until the check is implemented and verified; until then report workspace-write + declared intent.",
      "reversibleBy": "proven bwrap subpath policy, or a verified scope check"
    },
    {
      "default": "The executor.dispatch Work event stays written by the Work-tier caller until D-0049 section 3 ownership is decided.",
      "reversibleBy": "owner decision"
    },
    {
      "default": "If the step-4 measurement has not run by its deadline, the wrapper stays unbuilt. This is a proposed default the owner may override; it is not decided.",
      "reversibleBy": "owner naming a different default"
    },
    {
      "default": "RUL68 stays in force in full; no D1 path calls into Assignment until a superseding decision is approved.",
      "reversibleBy": "owner/Lead superseding decision record"
    },
    {
      "default": "Missing or incomplete telemetry counts as inconclusive, never as zero callers.",
      "reversibleBy": "ingress record with stated installation coverage"
    },
    {
      "default": "#8 stays at warning; no rejection without run-bound written-path evidence.",
      "reversibleBy": "trusted written-path observer plus an unrelated-session regression test"
    },
    {
      "default": "Receipt = assignment-run-result v3; claim = agent-result-claim v2.",
      "reversibleBy": "explicit schema migration decision"
    }
  ],
  "residualRisks": [
    "Agents keep calling raw D1 for mutating work while the wrapper is deferred; doctrine alone may not change behavior.",
    "No council seat has tested af132275b; the suite is not hermetic inside agent sessions.",
    "Concurrent sessions committing to main will keep producing false read-only-mutation results until step 2 lands (reproduced live in council run 3).",
    "'scope-checked' is post-hoc detection, not prevention; a doc-only worker can still write outside scope before settlement notices.",
    "The step-4 measurement has no owner or deadline yet, and even when run it cannot see unlogged raw D1 calls or external projects; without an ingress record the deferral can become indefinite.",
    "Line citations taken from framing and not re-verified this round (three-tier map, executeExecutorCli callers, settlement.mjs:523) may have drifted.",
    "The RUL68 superseding decision may never be taken, which blocks the wrapper regardless of demand.",
    "Until a written-path observer exists, read-only-mutation stays a warning; a real stray write is only flagged, not rejected.",
    "Raw D1 keeps writing from the main checkout during migration unless the owner takes step 6."
  ],
  "reversalTriggers": [
    "Measurement shows real prompt-raw mutating D1 traffic AND the owner approves a decision superseding RUL68's one-way bridge -> build the D1 -> one-shot Unit wrapper (step 4).",
    "Owner decides to delete raw D1, with the measurement's coverage stated -> delete with a decision superseding RUL68-D1 and RUL77. 'No events seen' alone is not a trigger.",
    "af132275b tests fail, or its diff reaches beyond binding/posture -> do not merge; revisit step 0.",
    "bwrap subpath write binding proven to work (including the git directory and missing target dirs) -> reopen docs-only as a named posture.",
    "A provider is shown to emit a structured retry-time signal -> Lane C may parse it; reading general stdout still requires superseding RUL65b.",
    "The owner rejects the contract-door premise or chooses to remove --contract -> revert af132275b and redo Q1.",
    "A trusted run-bound written-path observer plus an unrelated-session regression test lands -> #8 may reject on proven attribution.",
    "The scope check is implemented and verified -> results may report 'scope-checked'.",
    "Owner wants all mutating-main execution blocked -> take step 6."
  ],
  "missing expertise": [
    "bwrap / Linux namespace sandbox policy (subpath write binds, git directory handling)",
    "provider CLI output formats for usage-limit signals (Codex/OpenAI, xai)",
    "dispatch caller traffic measurement and migration telemetry across external project installations (D1/D7/D9, domains/ D3 callers)",
    "run-specific filesystem write attribution and concurrency isolation",
    "RunResult schema evolution and caller compatibility"
  ],
  "unprovenItems": [
    "bwrap subpath write support",
    "D1/D7/D9 traffic and domains/ D3 callers",
    "af132275b test results",
    "executor.dispatch Work event ownership after unification (D-0049 section 3)",
    "Whether a read-only one-shot Unit started from main needs a worktree",
    "A run-bound written-path observer (does not exist)",
    "An ingress record at the raw execute door (does not exist)",
    "The 'scope-checked' settlement check (does not exist)"
  ],
  "actionsRequiredFromLead": [
    "Persist this conclusion and the unresolved dissent under plans/261014-1033-dispatch-operator-improvements/reports/ (path via fgos convention path) and link it from plan.md and lanes C/D.",
    "Narrow lane-c-usage-limit.md to RUL65b inputs; update lane-d-write-boundary.md (#8 into settlement, #6 waits for Q4).",
    "Name an owner, window, ingress source, installation coverage and blind-spot list for the step-4 measurement.",
    "Ask the owner the two decision questions: mutating-from-main behavior, and executor.dispatch event ownership.",
    "Put the RUL68 one-way-bridge supersession to the owner as a decision question before any step-4 work.",
    "Ask the owner whether raw D1 mutating runs from the main checkout should be refused now (step 6).",
    "Assign Lane D the pending scope-check contract (field, semantics, owner, proof gate) if the owner accepts Q4."
  ],
  "challengeTargetsForReviewers": [
    "Is deferring the wrapper consistent with D-ADR0030 #1 for projects using fgOS, or does it just preserve the weak door?",
    "Are the F1/F2 and RT1-RT5 corrections complete and accurately bounded, without new claims?",
    "Is 'inconclusive, not zero' plus an owner-decided deletion a usable gate, or does it freeze migration?",
    "Is the missing-expertise list complete?"
  ],
  "revision": "r2: corrects reviewer/1 F1-F2 and red-team/1 RT1-RT5 on the producer/1 packet; all other content unchanged."
}

```
