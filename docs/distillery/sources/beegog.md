---
name: beegog
type: git-repo
url: https://github.com/vantt/beegog
local: upstreams/beegog
last_analyzed_commit: 05a131f
last_analyzed_date: 2026-07-21
domains_covered: [harness, skills, hooks, workflow, orchestration, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals, routing, integration-contract]
---

# Beegog (bee) — Feature Index

Plugin suite "validate-first agentic development" cho Claude Code + Codex. Chưng cất từ 7 upstream (khuym, gsd-core, superpowers, claudekit, repository-harness, gstack, compound-engineering — xem `docs/01-distillation.md` của repo). Inventory gốc: `plans/reports/ref-scan-inventory-260713-1224-beegog-*.md`.

> **Delta @05a131f (2026-07-21, bee 1.4.0→1.7.10-rc):** đợt **hardening đa-phiên** — ~120 commit, 1112 file. Chủ đề xuyên suốt: mọi thứ trước đây đúng-nhờ-quy-ước nay đúng-nhờ-khoá. 23 cơ chế mới: named store-lock 2-tầng-stale + pid-liveness (`store-lock-named-mutex`), ledger hold chéo-worktree (`cross-worktree-holds-ledger`), merge-back staged gate bằng verify (`worktree-merge-staged-verify-gate`), vòng tự-sửa judge/budget/revision-ledger (`semantic-judge-verdict-loop`, `cell-lifetime-budgets-anti-loop`, `judge-standard-change-class-matrix`, `frozen-judge-file-scope`), advisor là tiền-điều-kiện CƠ-HỌC của Gate 3 (`advisor-consult-gate-precondition`), payload dispatch sinh-bằng-code + đòi claim ownership (`dispatch-prepare-payload-builder`, `pinned-tier-agent-types`), khai quật transcript sau crash (`crash-transcript-recovery-mining`), verify song song + discovery theo quy ước + manifest floor + conformance hộp-đen + env hermetic + tách monolith test + CI Windows tự-khai-giới-hạn (6 entry `testing-evals`), archive cell có journal (`cell-archiving-transaction`), plugin preflight chứng-bằng-hash (`plugin-distribution-preflight-proof`), overlay config máy-cục-bộ, plan đóng băng tại Gate 2 (`plan-freeze-at-gate`), gate gộp tiny/small (`merged-gate-tiny-small`), small-lane serial 1 execution worker (`small-lane-serial-execution`). UPDATE: claims (session auto-adopt + sweep reset cell), reservations (RMW dưới lock), worktree (grant/bootstrap/new/admin-lock), model tier (economics + channel + native/cli branch), lane ceremony v3 (flag hẹp lại, cap chỉ đếm file sản phẩm), installer PS1 rollback, Codex `commandWindows` bootstrap.
>
> **Delta @94b4a31 (2026-07-18, bee 0.1.44→1.4.0):** đợt lớn nhất từ trước — thêm 10 cơ chế mới: parallel scheduler (`computed-parallel-schedule`), worktree isolation (`independent-feature-worktrees`), fan-out read-only capability (`read-only-analyst-fanout`), native-Codex wait discipline (`native-codex-wait-discipline`), Codex parity (`codex-runtime-parity`), performance-log chéo-dự-án (`performance-log-cross-project-matrix`), release manifest+tuple (`release-tuple-manifest-integrity`), source-identity classifier, product-root repo-divorce, LLM.md front-door. UPDATE: gate-bypass 4 mức + stop-net, model-tier gather-only external, write-guard +2 nhánh (docs/history code, AskUserQuestion), installer fail-closed parity, dispatcher `config` group.

## harness

### four-gates-code-enforced
- **What:** 4 human gates tại 4 thời điểm khó đảo ngược (what/how/write/merge); Gates 1–3 enforced bằng code — write-guard hook từ chối sửa source khi Gate 3 chưa approve, `claim` throw khi gate chưa mở.
- **Where:** `AGENTS.md`, `hooks/bee-write-guard.mjs`, `skills/bee-hive/templates/lib/guards.mjs`
- **Notable:** gate là cơ chế code, prompt chỉ là lớp phụ. Gate 4 (review) tách riêng, user-invoked, không bao giờ tự động.
- **Seen:** e70602a

### cell-task-unit
- **What:** Cell = JSON task unit (`.bee/cells/`) với id, lane, deps, must_haves (truths/artifacts/key_links/prohibitions), verify command, trace. `cap` từ chối đóng cell nếu thiếu verify output + files_changed; `behavior_change` còn đòi bằng chứng before-state (`red_failure_evidence`).
- **Where:** `docs/02-architecture.md`, `skills/bee-hive/templates/lib/cells.mjs`
- **Notable:** "plans are prompts" — cell tự chứa đủ để dispatch; chống "it works now" bằng cơ chế, không bằng niềm tin. Từ 05a131f: cell mọc thêm một tầng lịch sử — `trace.attempts` append-only (xem `cell-lifetime-budgets-anti-loop`), `trace.semantic_judge` (xem `semantic-judge-verdict-loop`), `trace.budget_resets`, `trace.judge_overrides`. Cái bẫy được ghi rõ: `trace.deviations` bị `capCell` GHI ĐÈ mỗi lần cap, nên nó không phải chỗ để lịch sử — chỉ các key append-only mới là sổ. Trace cũng scale theo lane (tiny: một dòng kết quả; small: + files_changed; standard: + deviations/friction; high-risk: + link spike + verification_evidence), nhưng cell nào `behavior_change:true` thì bắt buộc `verification_evidence` ở MỌI lane.
- **Seen:** 05a131f

### risk-lanes-mechanical
- **What:** Lane (docs/tiny/small/standard/high-risk/spike) chọn bằng đếm risk flags cơ học (auth, data model, public contracts... 10 flags; 4+ hoặc hard-gate flag → high-risk), không bằng phán đoán.
- **Where:** `docs/03-workflow.md`, `skills/bee-hive/SKILL.md`, `skills/bee-planning/SKILL.md`
- **Notable:** "Lanes scale ceremony, never memory" — lane tiny vẫn bắt buộc sync spec khi đổi behavior. Từ 05a131f (lane-ceremony-v3): hai tinh chỉnh làm phân loại bớt oan. (D7) Hai flag bị VIẾT HẸP LẠI — "đổi behavior mà một test hiện có đang khẳng định" và "phải làm yếu/xoá/thay bằng chứng hiện có" — nên một bugfix có test bao phủ, giữ test xanh và thêm test mới sẽ ăn 0 điểm ở cả hai, thay vì bị đẩy oan lên standard. (D6) Trần số file của lane (tiny ≤2, small ≤3) CHỈ đếm file sản phẩm (source/test/runtime config); `.bee/**`, `docs/**`, plan/brief/report và mọi projection sinh ra không bao giờ tính — "artifact của chính bee không được thổi một bản vá vượt lane của nó".
- **Keywords:** risk flags, mode gate, D6 product-files-only cap, D7 narrowed flags
- **Seen:** 05a131f

### dual-runtime-contract
- **What:** Một bộ skills + shared `lib/` chạy trên cả Claude Code lẫn Codex; enforcement nằm ở shared helpers trước, hooks là "second belt". Degradation ladder: skills → PLAYBOOK.md → helpers.
- **Where:** `docs/06-runtime-integration.md`, `hooks/catalog.mjs`
- **Notable:** "one brain, two belts" — port runtime là contract, không phải fork.
- **Seen:** e70602a

### gate-bypass-safety-floor
- **What:** Autopilot opt-in tự approve Gates 1–3. Từ 94b4a31 (harness-hardening/stop-net) bypass là 4 MỨC trong `.bee/config.json gate_bypass` (backward-compat `true`→`normal`): `off` (người dừng mọi gate); `normal` (Gate 1-3 auto CHỈ tiny/small/standard — high-risk/hard-gate/secret/Gate 4 vẫn dừng, floor giữ); `full` (Gate 1-3 auto cả high-risk — chỉ secret + review P1 dừng); `total` (KHÔNG dừng gì). Zero-stops được CƠ-HỌC-HÓA tại Stop hook: ma trận fire/no-fire, loop-guard chống re-stop tức thì, phase exploring/Gate 1 KHÔNG bao giờ mechanized, PreCompact/SubagentStop không bao giờ block, fail-open khi inject.mjs thiếu/lỗi. Banner to theo mức (NORMAL / FULL AUTOPILOT / TOTAL — ZERO STOPS).
- **Where:** `skills/bee-bypass-gate/SKILL.md`, `.bee/bin/lib/state.mjs` (BYPASS_LEVELS/bypassLevel/bypassBanner L996-1031), `hooks/bee-session-close.mjs`, `hooks/test_bypass_stop_net.mjs`, spec `docs/specs/doctrine-layer.md`
- **Notable:** floor không còn tuyệt-đối mà THEO MỨC — `full`/`total` là người CHỦ ĐỘNG gỡ sàn high-risk, honor literally không dựng lại stop họ đã bỏ; nhưng agent vẫn bị cấm tự-nới. Stop-net biến "zero stops" từ lời hứa prompt thành cơ chế runtime test-được (matrix + loop-guard + fail-open). Cho forgent mẫu autopilot-CÓ-MỨC cho lifecycle bán-tự-động (human-gates conditional theo stage).
- **Keywords:** gate_bypass, off/normal/full/total, bypassBanner, stop-net, loop-guard, fail-open, level floor
- **Seen:** 94b4a31

## skills

### tdd-for-skills-iron-law
- **What:** "No skill without failing pressure test first" — RED (chạy scenario KHÔNG có skill, ghi rationalization verbatim) → GREEN (SKILL.md tối thiểu chỉ trị các rationalization đã ghi) → REFACTOR. Áp cho cả skill edit.
- **Where:** `skills/bee-writing-skills/SKILL.md`
- **Notable:** skill được đối xử như code có test; rationalization table là tài sản.
- **Seen:** e70602a

### trigger-only-descriptions
- **What:** Description = 1 câu purpose + "Use when..." trigger conditions, KHÔNG BAO GIỜ tóm tắt workflow steps.
- **Where:** `docs/04-skills-spec.md`
- **Notable:** lý do sắc: step-summary khiến agent làm theo description và bỏ qua body.
- **Seen:** e70602a

### skill-budgets-conventions
- **What:** SKILL.md <200 dòng, overflow vào đúng 1 tầng `references/`; mọi skill có Headless section (không bao giờ block, defer ambiguous vào Outstanding Questions, output structured), Red Flags list, handoff sentence cuối, CREATION-LOG.md ghi quá trình TDD + debt.
- **Where:** `docs/04-skills-spec.md`, `docs/07-contracts.md`
- **Notable:** khuôn thống nhất 15/15 skill; headless contract giúp orchestrator compose skill máy móc.
- **Seen:** e70602a

## hooks

### hook-catalog-projection
- **What:** Một catalog logic duy nhất (`catalog.mjs`) render ra projection theo runtime (claude/codex) × target (plugin/repo); khác biệt phải khai báo trong `ALLOWED_DIFFERENCES`; test so byte-drift giữa các projection.
- **Where:** `hooks/catalog.mjs`, `hooks/test_hook_contracts.mjs`
- **Notable:** "two projections, one truth" — chống hand-divergence giữa 2 runtime.
- **Seen:** e70602a

### fail-open-crash-wrappers
- **What:** Mọi hook bọc toàn thân trong try/catch, log crash vào `.bee/logs/hooks.jsonl`, exit 0. Crash không bao giờ lật allow/deny; hook exit 0 im lặng nếu repo chưa onboard.
- **Where:** `hooks/adapter.mjs`, mọi `hooks/bee-*.mjs`
- **Notable:** "a broken hook never breaks a session" + coverage gap được log thấy được.
- **Seen:** e70602a

### write-guard-four-checks
- **What:** PreToolUse guard 4 lớp tuần tự: gate guard → reservation guard → privacy/scout guard → CLI-shape validation (validate flags bee_*.mjs theo JSON-Schema). Xử lý cả `apply_patch` envelope; target không chứng minh được → deny cả batch. Từ af4840c: intake gate test TẬP terminal states (`idle` VÀ `compounding-complete`), vá lỗ "guard test một state khi state model có N state tương đương" — post-feature edits từng lọt qua vì chỉ check idle.
- **Where:** `hooks/bee-write-guard.mjs`, `docs/history/learnings/critical-patterns.md`
- **Notable:** batch write guard per-target; "one denied target denies the request". Bài học kèm: "a guard that tests one state is a law with a hole" — và hook's silence is never permission (luật là AGENTS.md, hook chỉ bắt cái bạn quên). Từ 94b4a31: thêm 2 nhánh guard — (dhg) deny code-file (`.sh/.mjs/.py`...) vào `docs/history/` (tầng tri-thức tech-agnostic chỉ `.md`; hướng code về scripts/`.bee/spikes/`), và `checkAskUserQuestion` pre-validate schema (1-4 câu, header ≤12, 2-4 option, label/description bắt buộc) → biến lỗi harness "Invalid tool parameters" mờ thành phản hồi sửa-được, fail-open.
- **Where thêm:** `.bee/bin/lib/guards.mjs` (docsHistoryCodeDeny L35-51, checkAskUserQuestion L293-353), `.bee/bin/hooks/bee-write-guard.mjs` (AskUserQuestion pre-validate L378-383)
- **Seen:** 94b4a31

### injection-dedup
- **What:** Prompt-context hook chỉ inject reminder khi state đổi hoặc >30 phút, qua `.bee/.inject-cache.json`.
- **Where:** `hooks/bee-prompt-context.mjs`, `templates/lib/inject.mjs`
- **Notable:** trị đúng bệnh context bloat do hook lặp.
- **Seen:** e70602a

### model-guard-tier-transport
- **What:** PreToolUse trên Agent/Task deny dispatch không khai model tier tường minh (model param hoặc marker `[bee-tier: x]` anchored đầu prompt — giữa chừng bị coi là giả mạo); audit từng dispatch vào `.bee/logs/dispatch.jsonl`.
- **Where:** `hooks/bee-model-guard.mjs`, `skills/bee-hive/templates/lib/dispatch-guard.mjs`
- **Notable:** ép kỷ luật chi phí model bằng hook + audit log, không bằng lời dặn. Từ 05a131f: quyết định gom về MỘT hàm thuần `evaluateDispatch` mà cả hook lẫn `dispatch prepare` cùng gọi, với 5 nhánh theo thứ tự: (0) có marker tier nhưng `subagent_type:"general-purpose"` → deny (xem `pinned-tier-agent-types`); (1) marker + tham số model lệch nhau → deny; (2) chỉ có tham số model → kiểm tư cách theo `configuredModelSet` (config LÀ nguồn thẩm quyền duy nhất, không allowlist cứng); (3) chỉ có marker → resolve tier, tier dạng cli bị deny cho cell; (4) dispatch trần → deny kèm gợi ý FIX tính sẵn. Regex marker phải NEO đầu prompt (marker giữa chừng không tính). Nhánh Codex tách riêng (`spawn_agent` + `message`), regex nhánh Claude giữ nguyên từng byte. Lý do gốc chép nguyên: "dispatch trần âm thầm thừa hưởng model đắt nhất của phiên".
- **Keywords:** evaluateDispatch, anchored tier marker, bare-denied, param-tier-mismatch, configuredModelSet, codex-spawn-unmarked
- **Seen:** 05a131f

### chain-nudge-subagent-stop
- **What:** SubagentStop hook nhắc orchestrator bước kế tiếp của chain (collect status token, cap cell, release reservation); advisory-only (systemMessage, không block).
- **Where:** `hooks/bee-chain-nudge.mjs`
- **Notable:** "workflow chain advanced by the harness, not by memory".
- **Seen:** e70602a

## workflow

### staged-chain-with-gates
- **What:** Chain cố định: hive → exploring [G1] → planning/briefing [G2] → validating [G3] → swarming → executing → scribing → compounding → done (unreviewed); reviewing [G4] chỉ khi user gọi. Gate wording verbatim cố định.
- **Where:** `docs/03-workflow.md`, `AGENTS.md`
- **Notable:** mọi lane đều đóng "unreviewed" mặc định — verification ≠ review, tách bạch chi phí.
- **Seen:** e70602a

### validate-before-execute
- **What:** Stage validating chứng minh plan khả thi bằng bằng chứng trước khi viết code: reality gate (5 tiêu chí PASS/FAIL), feasibility matrix, spikes cho assumption chưa chứng minh, decision vocabulary (READY / NOT READY - RUN SPIKE...).
- **Where:** `skills/bee-validating/SKILL.md`
- **Notable:** "'This should work' is not evidence" — plausibility language tự động = NOT READY.
- **Seen:** e70602a

### socratic-exploring
- **What:** Biến request mù mờ thành locked decisions trong CONTEXT.md: phân loại domain type (SEE/CALL/RUN/READ/ORGANIZE), probes theo domain, mỗi message 1 câu hỏi material (đổi scope/architecture/UX mới được hỏi), lock bằng D-ID, fresh-eyes review trước Gate 1.
- **Where:** `skills/bee-exploring/SKILL.md` + `references/gray-area-probes.md`
- **Notable:** materiality test cho câu hỏi + "blindspot pass" dạy user trước khi hỏi khi user không rành.
- **Seen:** e70602a

### briefing-projection-artifact
- **What:** implement-plan.md render *từ* truth artifacts (CONTEXT/approach/plan/cells), chỉ tự viết 2 mục Tech Design + Rollback; feedback chảy ngược về truth artifacts rồi re-render; Review Status lifecycle mirror gates; lane-scaled (tiny không brief, small ~15 dòng); walkthrough mode hậu Gate-4 dựng từ execution records, không từ plan.
- **Where:** `skills/bee-briefing/SKILL.md`, `docs/11-implement-plan-adoption.md`
- **Notable:** "consolidator, not second planner" — human và agent duyệt trên cùng một tài liệu mà không sinh nguồn sự thật thứ hai. Từ 05a131f: fan-out được BẢNG HOÁ theo lane (tiny/spike: không brief; small: mini-brief tuỳ chọn; standard: theo yêu cầu; high-risk: bắt buộc) với lời răn "một bản vá tiny khoác brief 12 mục cũng là cờ đỏ y như một bản vá tiny khoác nghi thức epic". Luật drift thu hẹp còn CHỈ bắn trên thay đổi cell — vì `plan-freeze-at-gate` khiến plan không còn drift được; cell đổi sau khi brief được duyệt thì lật `status: Needs Revision` và bắt render lại. Mục nào nguồn im lặng thì thành Open Question, không bao giờ bịa.
- **Seen:** 05a131f

### merged-gate-tiny-small
- **What:** Từ 05a131f (lane-ceremony-v3 D5): với lane tiny/small, cell nháp + reality check chạy TRƯỚC, rồi hỏi MỘT câu gate gộp shape+execution; approve ghi cả `approved_gates.shape` lẫn `approved_gates.execution`; `cells add` chỉ chạy SAU approve. Khẩu quyết: "previewed before persist, never persist-then-preview". bee-validating không được invoke riêng cho hai lane này — reality check fold inline vào planning §5, không spawn subagent ceremony nào.
- **Where:** `skills/bee-planning/SKILL.md`, `skills/bee-planning/references/planning-reference.md`, `skills/bee-validating/SKILL.md`
- **Notable:** gộp Gate 2+3 cho hai lane rẻ nhất mà KHÔNG bỏ invariant — chỉ đảo thứ tự (xem trước khi ghi) và đổi số lần hỏi người. Cặp với `lane-routes-chain-shape` (routing) và `plan-freeze-at-gate` (planning): cùng một đợt doctrine chỉnh "ceremony đúng cỡ" sau bài học dogfood một feature small đẻ 4 file kể lại cùng một "current state".
- **Keywords:** merged gate, D5, preview-before-persist, inline reality check
- **Seen:** 05a131f

## orchestration

### orchestrator-assigns-workers
- **What:** Worker không bao giờ tự chọn cell; orchestrator assign 1 cell/worker; dispatch mang isolation contract (cell id + paths + constraints + status tokens, KHÔNG session history); worker loop 9 bước (claim → reserve → implement → verify → cap → release → report).
- **Where:** `skills/bee-swarming/SKILL.md`, `skills/bee-executing/SKILL.md`
- **Notable:** goal-check mỗi [DONE]: orchestrator tự re-run verify (frozen judge), không tin lời worker. Từ 05a131f: hợp đồng tách làm HAI phía cùng nhãn D1 — orchestrator claim TRƯỚC khi spawn; worker phải XÁC MINH `cells show --id` thấy `claimed` với `trace.worker` đúng tên mình, và worker tự chạy `cells claim` là VI PHẠM. Kèm D3: orchestrator không bao giờ nhét session id nguyên văn vào prompt worker — verb claim/reserve tự suy từ env của chính worker. Tier model do orchestrator phán TẠI LÚC DISPATCH, `tier` do planning đặt chỉ là gợi ý được phép ghi đè (decision 0016). Bằng chứng verify sống trong `trace`, không bao giờ thành file `reports/*-evidence.md` (decision 0009).
- **Seen:** 05a131f

### file-reservations
- **What:** Reserve file trước khi ghi (`bee.mjs reservations`); conflict → worker trả `[BLOCKED]`, orchestrator xử; hook enforce; sweep stale reservations. Từ 55cf3a4 (fsh): hold giờ mang thêm field `session` tùy chọn — `findSessionConflicts` phát hiện chồng lấn với hold của session còn sống; `checkWrite` nhận `session_id` từ hook và TỪ CHỐI ghi vào path đang bị session khác giữ, **độc lập phase** (bắn cả giữa lúc execute), fail-closed khi store hỏng; không chặn hold của chính session, hold hết hạn, hay hold cũ không chủ.
- **Where:** `.bee/bin/lib/reservations.mjs` (findSessionConflicts), `.bee/bin/lib/guards.mjs` (checkWrite session branch), `.bee/bin/hooks/bee-write-guard.mjs`
- **Notable:** giải xung đột ghi song song bằng lock cơ học thay vì "be careful". Đợt fsh nâng từ **same-session swarm** lên **cross-session**: cùng luật "unblocked write ≠ approved write" nhưng qua ranh giới phiên thay vì phiên đơn — refusal nêu tên session giữ và hạn hết. Cặp đôi với `cross-session-atomic-claims`. Từ 05a131f: kiểm-xung-đột và ghi nay nằm TRONG cùng một `withStoreLock('reservations')` — trước đó hai lần reserve đồng thời đều pass check trên cùng một ảnh chụp trước-khoá rồi cùng ghi. Reserve không có session bị từ chối `SESSION_REQUIRED` khi có session khác heartbeat sống (đối xứng với claims), và `renewHoldsBySession` là nhánh heartbeat renew phía reservations. Trục thứ ba đã tách thành entry riêng: `cross-worktree-holds-ledger`.
- **Keywords:** reservations, pathsOverlap, findSessionConflicts, RMW dưới store lock, renewHoldsBySession
- **Seen:** 05a131f

### cross-session-atomic-claims
- **What:** `.bee/bin/lib/claims.mjs` (mới): claim cell nguyên tử qua nhiều phiên cùng checkout — exclusive-create (`wx`/O_EXCL), đúng một người thắng, kẻ thua nhận **typed refusal** (SESSION_EXISTS/CLAIMED/GATE_HELD/NOT_OWNER/NOT_FOUND...) chứ không exception; ownership không delete-rồi-tạo-lại; adopt/reclaim chạy dưới gate riêng của claim (`.adopting`) nên record luôn hiện diện. Reclaim đòi **cả** TTL hết hạn **lẫn** heartbeat cũ, kiểm lại dưới gate — TTL hết nhưng heartbeat còn tươi thì KHÔNG bị cướp.
- **Where:** `.bee/bin/lib/claims.mjs` (runtime state ghi ra .bee/sessions/ và .bee/claims/ — gitignored, không có tại HEAD)
- **Notable:** trục điều phối MỚI so với file-reservations (khóa file) và orchestrator-assign (một phiên): nhiều phiên tranh cùng checkout, phân xử bằng primitive cơ học (claim + heartbeat) chứ không quy ước. "Reclaim đòi cả TTL-hết lẫn heartbeat-cũ" là chốt chống-cướp-nhầm — trực tiếp trên hướng multi-agent song song của forgent.
- **Notable thêm (05a131f):** hai vá đáng học. (1) **Session tự-nhận khi không có env**: khi biến môi trường không cho session id mà CHỈ CÓ ĐÚNG MỘT session record còn heartbeat sống, session đó được tự nhận (đánh dấu `adopted:true`) thay vì từ chối `SESSION_REQUIRED` — sửa ca "phiên Codex native đơn độc" có record nhưng không biến env. Từ hai session sống trở lên thì vẫn từ chối, không bao giờ đoán. (2) **Sweep phải reset CẢ CELL**: trước đây quét xong claim chết vẫn để cell ở `claimed` mãi mãi (claim-next chỉ lấy cell `open`) — nay sweep đưa cell về `open`, có kiểm lại `trace.claim_session` dưới khoá `cells:<id>` để không đè lên một claim mới hơn. Toàn bộ read-check-write của claims/reservations/state nay chạy trong `store-lock-named-mutex`.
- **Keywords:** atomic claim, O_EXCL, TTL, heartbeat, typed refusal, cross-session, reclaim, session auto-adopt, sweep resets cell
- **Seen:** 05a131f

### claim-next-pull-selection
- **What:** Phiên hết việc TỰ kéo unit kế: `claimNextCell`/`claimCellCrossSession` (cells.mjs) — quét claim chết trước (TTL hết + heartbeat cũ), rồi ưu tiên unit sẵn-sàng của LANE MÌNH (execution gate approved), sau đó unit của lane khác **chỉ khi gate lane đó được người duyệt** (không bao giờ chạm lane chưa duyệt), bỏ qua unit có file chồng hold của phiên khác; thứ tự cross-lane theo product-backlog rank rồi tuổi lane. Câu "hết việc approved" chỉ được nói SAU khi quét claim chết.
- **Where:** `.bee/bin/lib/cells.mjs` (claimNextCell, claimCellCrossSession), `.bee/bin/lib/backlog.mjs` (featureBacklogRank), spec `docs/specs/workflow-state.md` B16
- **Notable:** work-puller không tự mở rộng thẩm quyền — cross-lane chỉ lấy từ lane đã duyệt; crash-safe (claim file trước, work record sau, hỏng bước sau nhả bước trước → không claim mồ côi). Đây là mảnh "fan-out phản ứng" của forgent: worker rảnh tự tìm việc trong biên đã duyệt thay vì chờ orchestrator gán.
- **Keywords:** claim-next, own-lane-first, approved-only cross-lane, hold-skip, stale-claim sweep, backlog rank
- **Seen:** 55cf3a4

### model-tiers-cost-discipline
- **What:** 3 tier: ceiling (session model, giữ khan hiếm) / generation (mid, đa số cells) / extraction (rẻ nhất, việc cơ học) + 2 role: review, advisor. Tier phán tại lúc dispatch; config theo runtime; external executor dạng `{kind: "cli", command}` (vd Codex CLI); 5 presets sẵn. Từ 55cf3a4: thêm 2 preset external CLI executor — **antigravity (agy)** và **opencode** — chạy lệnh CLI thay Agent model (multi-provider swarm); dispatch external đòi **known-answer probe** (hỏi câu đã biết đáp) để xác nhận executor còn sống, không tin exit-status suông.
- **Where:** `docs/config-reference.md`, `docs/model-presets.md`, `.bee/bin/lib/command-registry.mjs` (resolveTier cli kind + config.validate), `.bee/bin/lib/state.mjs` (resolveTier), decisions 0012/0015/0016/0019/0021
- **Notable:** đúng triết lý "model rẻ làm việc cơ học"; enforce bằng model-guard hook + audit, cảnh báo khi lạm ceiling. Preset agy/opencode mở tier ra nhà cung cấp ngoài; known-answer-probe là kỷ luật "chứng minh executor trả lời được, không chỉ chạy xong". Từ 94b4a31 (ao): `resolveTier(...,{for:'gather'|'cell'})` — external cli tier CHỈ resolve cho GATHER; resolve cho cell execution trả typed refusal `cli_tier_gather_only`; `config validate` từ chối cli-tier thiếu `kind:'cli'`/command/prompt-transport hoặc chứa cờ auto-approve/sandbox-bypass (exit≠0, báo rows); digest external chỉ nhận giữa marker `<<<BEE_DIGEST…BEE_DIGEST>>>`, thiếu/rỗng = fail TO. Boundary ép trong CODE resolution, không phải prompt (prompt-advice bị bỏ qua khi code vẫn cho). Từ 05a131f: thêm tầng **economics** tự-khai-mức-tin — `deriveEconomics` trả `{logical_tier, requested_model, effective_model, effective_model_status, channel, enforcement}` với 4 mức status: `pinned` (quan sát được tham số thật), `unverified` (chỉ có tier/budget), `inherited-or-unknown` (codex-native không hề có cơ chế chọn model per-agent), `native-requested` (override native được catalog chấp nhận nhưng runtime chưa xác nhận → `effective_model` để null). `channel` (`claude-agent`/`codex-native`/`cli-exec`) là từ vựng MỚI đặt cạnh `transport` cũ, không thay thế. Advisor có slot RIÊNG, không bao giờ giải qua `resolveTier('advisor')` (sẽ âm thầm rơi về generation).
- **Keywords:** tier, slot, resolveTier, resolveAdvisor, deriveEconomics, channel, effective_model_status, cli gather branch
- **Seen:** 05a131f

### advisor-consult-protocol
- **What:** Worker kẹt được hỏi model mạnh hơn: chỉ khi dispatch có Advisor line VÀ verify fail lần đầu; ≤2 consult/claim; evidence bundle inline; advice-only (không thẩm quyền gate); luôn re-run verify thật sau advice.
- **Where:** `skills/bee-executing/SKILL.md`, decision 0013
- **Notable:** rescue ladder có budget: more context → stronger tier → escalate user.
- **Seen:** e70602a

### computed-parallel-schedule
- **What:** Từ 94b4a31 (parallel-scheduler): lịch chạy song song được TÍNH thuần hàm, không xếp tay. `detectCycles` (Tarjan, quét MỌI cell bất kể status, self-dep = cycle 1 phần tử) + `computeSchedule` (Kahn layering trên cell open/claimed, loại dep bất khả + lan truyền loại trừ, rồi greedy packing mỗi wave theo id tăng dần; cell chồng file dời sang wave sau thay vì từ chối). `bee cells schedule [--feature]` là verb CHỈ-ĐỌC trả waves + diagnostics. Cycle refusal tại MỌI `cells add`/`update` đổi deps: all-or-nothing, chỉ chặn cycle mà chính write này tạo ra hoặc tham gia (pre-existing cycle không chặn write khác).
- **Where:** `.bee/bin/lib/schedule.mjs` (detectCycles L45-98, computeSchedule L151-246), `.bee/bin/bee.mjs` (handleCellsSchedule L732-756), spec `docs/specs/workflow-state.md` B17/B18/R26-R27
- **Notable:** schedule là DERIVED-never-stored (tính theo yêu cầu, không bao giờ stale), advisory-nhưng-mặc-định (orchestrator được lệch nếu nêu lý do); overlap dùng chung `pathsOverlap` với reservations (empty files = chồng-không-gì). Bản MÁY-TÍNH kế thừa `status-token-wave-dispatch` (vốn tính wave trong prompt orchestrator) — cùng "việc kế = truy vấn dẫn xuất" nhưng cho SONG SONG + cycle-safety tại cửa ghi. Trực tiếp cho fan-out reactive của forgent.
- **Keywords:** computeSchedule, detectCycles, Tarjan, Kahn, wave, cycle refusal, pathsOverlap, derived-never-stored
- **Seen:** 94b4a31

### independent-feature-worktrees
- **What:** Từ 94b4a31 (worktree-parallelism/isolation): trục điều phối THỨ HAI cạnh claim/lane — cô lập CÂY thay vì khóa trong một checkout. `resolveRoots` trả typed 3-giá-trị (`ordinary`/`linked-valid`/`linked-invalid`) validate 2 chiều con-trỏ git (`.git` file ↔ `gitdir` ↔ back-pointer trong namespace `worktrees/<id>`); `decideWorktreeStore` thuần, fail-closed, ĐỌC grants như tham số (worktree KHÔNG tự cấp được); `bootstrapWorktreeStore` dựng `.bee/` riêng cho worktree (feature/phase/gates ĐỘC LẬP, copy-if-absent, idempotent); merge-back giao dịch (verify xanh trên main + bằng chứng pre/post SHA trước commit); log-tier union-merge (`.gitattributes merge=union` cho decisions/backlog/review-candidates.jsonl) + `replayLog` dedup khi tái hợp. Verbs `bee worktree register/list/unregister`.
- **Where:** `.bee/bin/lib/state.mjs` (resolveRoots L420-477), `.bee/bin/lib/worktree-store.mjs` (decideWorktreeStore/readGrants/bootstrap/replayLog L34-271), `.gitattributes` (union-merge L1-9), `.bee/bin/bee.mjs` (worktree handlers L1917-2004), spec `docs/specs/workflow-state.md` B20, `docs/history/worktree-isolation/CONTEXT.md` D1-D4
- **Notable:** grant CHỈ đọc từ main store = worktree không tự-cấp-quyền (chống forge); resolution fail-closed typed (`linked-invalid` → deny trước khi ghi). Lấp đúng chỗ matrix từng ghi beegog:✗ "worktree-isolation (deferred)". Nay bee có CẢ HAI trục: khóa-trong-cây (claims/lanes) VÀ cô-lập-cây (worktrees) — human chọn kiến trúc nào hợp fan-out forgent (đối chiếu symphony isolated-runner + `same-checkout-multi-session-coordination`).
- **Notable thêm (05a131f):** từ primitive thành **con đường lát sẵn**. `bee worktree new --feature <slug>` tạo worktree + grant + bootstrap trong một lệnh, mọi pre-check đều typed và zero-mutation, chỉ `git worktree add` là bước có thẩm quyền; hỏng sau đó thì rollback best-effort và nêu `worktree register` làm đường nhận tay. `--base-ref` giải bằng `rev-parse --verify ... ^{commit}` (không dùng `check-ref-format`, vốn từ chối oan `HEAD~1`) và truyền SHA đã giải, không truyền chuỗi ref. Mọi thao tác sửa registry (`writeGrant`/`removeGrant`/`new`/`merge`/cleanup) nay serial dưới một khoá `worktree-admin`, với cặp locked/unlocked tường minh vì `withStoreLock` KHÔNG reentrant — một lần acquire lồng nhau sẽ tự đợi chính mình tới timeout. Bootstrap cố ý không copy phase/gates/workers của main: worktree không được thừa hưởng một gate chưa tự kiếm. Hai nhánh tách entry riêng: `cross-worktree-holds-ledger` và `worktree-merge-staged-verify-gate`. Doctrine đi kèm (D9, lane-first): feature mới trong checkout đang bận là LANE trước, grant worktree chỉ lấy tại Gate 3 và chỉ khi thực sự chồng file — chủ động giảm số lần phải dùng tới bộ máy này.
- **Keywords:** worktree, resolveRoots, three-valued resolution, grant-main-store-only, bootstrapWorktreeStore, union-merge, worktree new, worktree-admin lock, non-reentrant, lane-first D9
- **Seen:** 05a131f

### read-only-analyst-fanout
- **What:** Từ 94b4a31 (compounding-fanout-hardening): helper gom tin (analyst) spawn với BỀ MẶT NĂNG LỰC read-only — capability LÀ bức tường, không phải câu dặn "đừng ghi file" (sự cố quan sát: analyst được dặn "write no files" vẫn implement + commit source); pin vào `Explore` (agent read-only của Claude Code). Dispatch lỗi tạo → re-dispatch ĐÚNG một lần rồi dừng; synthesis chạy từ PARTIAL returns, không bao giờ chờ vô hạn đủ N helper.
- **Where:** spec `docs/specs/doctrine-layer.md` B7/R11, `skills/bee-compounding/SKILL.md` §2, decision 040f8ef0
- **Notable:** làm cứng critical-rule-13 (fan-out "gather down-tier"): ranh giới read-only ép bằng CAPABILITY + synthesis không-treo từ partial. Bài học phổ quát: "một lệnh read-only trong prompt bị bỏ qua khi capability vẫn cho ghi" — cùng gene "hook là lưới, không phải người gác" áp cho fan-out. Trực tiếp cho fan-out an toàn của forgent.
- **Keywords:** read-only capability, Explore pinning, one re-dispatch, partial-return synthesis, no-wait fan-out
- **Seen:** 94b4a31

### native-codex-wait-discipline
- **What:** Từ 94b4a31 (codex-agent-wait-loop, AGENTS critical-rule 15): `wait_agent` rỗng của native Codex (timeout/no-completion) CHỈ là chờ rỗng — im lặng ≠ thất bại. Cấm 2 lần wait liên tiếp sau chờ rỗng; trước mọi bounded-wait sau đó phải làm việc task-local thật (≥1 hành động cụ thể) HOẶC chụp đúng một `list_agents` rồi gửi đúng một commentary nêu trạng thái agent sống + hành động kế. Timeout GIỮ nguyên mọi agent/claim/reservation, không bao giờ cấp phép interrupt/duplicate-dispatch/release.
- **Where:** spec `docs/specs/doctrine-layer.md` B6/R9-R10, `AGENTS.md` (rule 15), `docs/history/codex-agent-wait-loop/CONTEXT.md` D1-D7
- **Notable:** bản anti-loop cho NATIVE agent (đối xứng lệnh cấm polling file/scratchpad cho harness subagent); doctrine-anchored, RED/GREEN pressure-tested 3 kịch bản. **Là tiền-điều-kiện chống-loop của fan-out** — forgent đã ghi "anti-loop là precondition của fan-out"; đây là cơ chế cụ thể cho agent chờ-không-treo, không phá điều phối.
- **Keywords:** wait_agent, empty-wait, progress interval, no consecutive waits, doctrine anchor, non-failure timeout
- **Seen:** 94b4a31

### store-lock-named-mutex
- **What:** Từ 05a131f (multi-session-hardening + hardening-1-7-10): primitive khoá đặt-tên chạy chéo tiến trình — `withStoreLock(root, name, fn)` tạo lockfile O_EXCL tại `.bee/locks/<name>.lock`; mọi mutator của cells/claims/reservations/state bọc nguyên thân đọc-kiểm-ghi trong đó. Khoá theo tên hẹp (`cells:<id>`, `reservations`, `state`, `cells-archive`, `worktree-admin`) nên cell khác nhau không nối đuôi nhau. Staleness HAI TẦNG: quá `STALE_MS` (30s) mới chỉ là ỨNG VIÊN, cướp quyền còn đòi pid chủ cũ chứng minh đã chết (`isPidAlive`), hoặc quá trần cứng 1h bất kể liveness (chống pid tái dụng). Cướp bằng atomic rename (kẻ thua ENOENT rồi lùi), release chỉ xoá lock khớp pid+token của chính lần acquire này. CLI đợi ~100 lần (~5s); hook dùng `maxAttempts:1` — hook không bao giờ chờ khoá.
- **Where:** `skills/bee-hive/templates/lib/lock.mjs`, `skills/bee-hive/templates/lib/cells.mjs`, `skills/bee-hive/templates/lib/state.mjs`, `skills/bee-hive/templates/lib/reservations.mjs`
- **Notable:** lý do KHÔNG dùng heartbeat để chứng tươi: chủ khoá hợp lệ có thể chặn event loop nhiều phút vì `spawnSync` (vd verify lúc merge worktree) nên timer không renew được — tươi đến từ việc LÀM XONG rồi nhả, không từ việc nhắn "tôi còn sống". Spike ghi lại: unlink vô điều kiện cho 7-8 "người thắng" cùng lúc, nên rename mới là cửa. Tên khoá còn phải qua bộ lọc ký tự Windows cấm (`:` trong `cells:<id>`) kèm hash tên gốc để hai tên khác nhau không đụng cùng file. Đây là NỀN mà `cross-session-atomic-claims`/`file-reservations` đứng lên — không thay chúng.
- **Keywords:** withStoreLock, LOCK_BUSY, HARD_STALE_MS, isPidAlive, atomic rename takeover, hooks try-once, UNSAFE_LOCK_NAME_CHARS
- **Seen:** 05a131f

### cross-worktree-holds-ledger
- **What:** Từ 05a131f (cross-worktree-holds): ledger chia sẻ `.bee/runtime/cross-worktree-holds.json` **chỉ nằm ở checkout MAIN**, mirror mọi reservation path để worktree anh em thấy hold của nhau trước khi ghi. Nhận hold là MỘT critical section duy nhất (kiểm ledger + reserve local + chèn mirror trong cùng một lần acquire, thứ tự khoá: shared ngoài, local trong). TTL trần 1h + heartbeat renew (`renewHolds` là đường mutate-tại-chỗ duy nhất, không hồi sinh row đã hết hạn). BA tap đọc độc lập: `reservations reserve`, `cells claim-next` (bỏ qua cell chồng hold ngoại — im lặng, không báo lỗi), và write-guard (deny nêu tên checkout giữ + feature + hạn). Release phải scope theo cell của chính agent, không quét theo holder.
- **Where:** `skills/bee-hive/templates/lib/worktree-holds.mjs`, `skills/bee-hive/templates/lib/guards.mjs`, `skills/bee-hive/templates/lib/cells.mjs`, `hooks/bee-state-sync.mjs`, `docs/specs/worktree-parallelism.md`
- **Notable:** sự cố sống được ghi làm luật: bản cắt sớm release-theo-holder đã **xoá sạch hold mirror của worker đang chạy song song** (`holder:"main"` là của chung mọi agent trong main checkout). Guard fail-OPEN khi không dựng được topology nhưng fail-CLOSED khi ledger hỏng — cân theo critical pattern "guard deny quá tay khoá luôn phiên khỏi bản vá của chính nó". Ba tap đọc cố ý trùng code (`resolveHoldTopology` viết 3 lần) — spec gọi là "three read taps, one voice". Đây là mảnh còn thiếu để `independent-feature-worktrees` dùng được thật cho fan-out song song.
- **Keywords:** FOREIGN_HOLD, mirror row, atomic reserve seam, TTL + heartbeat renewal, release scoping, three read taps
- **Seen:** 05a131f

### worktree-merge-staged-verify-gate
- **What:** Từ 05a131f (worktree-ux/hardening): `bee worktree merge --id` merge nhánh worktree về main dạng GIAO DỊCH DÀN TRẬN — `git merge --no-ff --no-commit` stage trước, chạy verify của host trên cây chưa commit, CHỈ commit khi xanh. Verify đỏ → `git merge --abort` + bằng chứng 3 phần (HEAD không đổi, không còn MERGE_HEAD, tracked status sạch) và trả typed `MERGE_VERIFY_RED`, **không bao giờ tạo merge commit**. Có cả guard hậu-commit bắt verify tự sửa file tracked (`verify_mutated_tracked_files`). Toàn thân dưới khoá `worktree-admin`.
- **Where:** `skills/bee-hive/templates/lib/worktree-store.mjs`, `skills/bee-hive/templates/bee.mjs`, `docs/specs/worktree-parallelism.md`
- **Notable:** thay hợp đồng D8 cũ (verify đỏ vẫn để lại merge commit không ai rollback). Đây là **cổng xung đột NGỮ NGHĨA**: git merge sạch không chứng minh hệ thống còn chạy — verify trên cây đã stage mới chứng minh. Mẫu trực tiếp cho forgent khi nhiều luồng việc song song phải hợp nhất: "main byte-untouched khi thất bại" là bất biến kiểm được, không phải lời hứa.
- **Keywords:** staged merge, MERGE_VERIFY_RED, main-untouched proof, semantic conflict gate, worktree-admin lock
- **Seen:** 05a131f

### dispatch-prepare-payload-builder
- **What:** Từ 05a131f (hardening-7): `prepareDispatch()` là NƠI DUY NHẤT sinh payload cho mọi dispatch bee sở hữu (Agent / spawn_agent / Bash), tự kiểm payload của chính nó qua `evaluateDispatch` rồi append audit record vào `.bee/logs/dispatch.jsonl`. PURPOSE MAP ánh xạ kind→slot (`cell`/`gather`→generation, `reviewer`→review, `advisor`→slot advisor riêng, không bao giờ ép về generation). Đòi **claim ownership**: kind `cell` bị từ chối (`not_claimed`/`not_owner`) nếu cell chưa `claimed` bởi đúng worker đó; `--force-ownership` chỉ ghi audit `ownership_override`, không hề chuyển claim thật. Refusal là typed return, không phải exception — prepare KHÔNG BAO GIỜ lách một refusal.
- **Where:** `skills/bee-hive/templates/lib/dispatch-prepare.mjs`, `skills/bee-hive/templates/lib/dispatch-guard.mjs`, `skills/bee-hive/templates/bee.mjs`, `scripts/test_dispatch_prepare.mjs`
- **Notable:** lý do gốc sắc: "payload dispatch LÀ thẩm quyền hành động trên cell — prepare không được phát nó cho người chưa cầm claim." Đây là bước từ "hook chặn dispatch sai" (`model-guard-tier-transport`) lên "code SINH ra dispatch đúng" — guard là lưới, prepare là khuôn. Kèm `deriveEconomics` phân biệt `pinned`/`unverified`/`inherited-or-unknown`/`native-requested`: hệ thống tự khai mức tin của chính nó về việc dispatch có thật sự chạy đúng model không, thay vì giả định.
- **Keywords:** prepareDispatch, PURPOSE MAP, claim-ownership refusal, ownership_override, deriveEconomics, channel vs transport
- **Seen:** 05a131f

### pinned-tier-agent-types
- **What:** Từ 05a131f: mỗi tier có-model được render thành MỘT agent type cụ thể — `bee-gather` (generation, Read/Grep/Glob), `bee-extract` (extraction, rẻ nhất, chỉ tra cứu đã-hẹp-sẵn), `bee-review` (review, thêm Bash nhưng read-only). `PINNED_AGENT_TYPE` khiến dispatch mang marker tier NHƯNG `subagent_type: "general-purpose"` bị deny (`generic-type-denied`): type chung không mang danh tính tier nên sẽ chạy dưới model mặc định của runtime chứ không phải model của tier.
- **Where:** `skills/bee-hive/templates/agents/bee-gather.md.tmpl`, `skills/bee-hive/templates/agents/bee-extract.md.tmpl`, `skills/bee-hive/templates/agents/bee-review.md.tmpl`, `skills/bee-hive/templates/lib/dispatch-guard.mjs`
- **Notable:** vá đúng lỗ của `model-guard-tier-transport` bản cũ — khai tier trong prompt là chưa đủ, phải có **hiện thân agent** gắn model. Cả ba template cùng một hợp đồng: read-only, trả digest (paths + fact có anchor `file:line` + trích nguyên văn chỉ khi được hỏi), không đăng ký swarm, không giữ reservation; quyết định (accept/reject/synthesis) ở lại orchestrator. Cùng gene `read-only-analyst-fanout`: ranh giới ép bằng CAPABILITY, không bằng câu dặn.
- **Keywords:** PINNED_AGENT_TYPE, bee-gather/bee-extract/bee-review, generic-type-denied, TIER_MODEL, digest contract
- **Seen:** 05a131f

### small-lane-serial-execution
- **What:** Từ 05a131f (AO14 + hardening-7): lane tiny/small vẫn luôn chạy qua **đúng một execution worker được dispatch** — không bao giờ zero (orchestrator tự code trong phiên), không bao giờ wave. Với small (1-3 cell) là SERIAL: claim → dispatch → chờ status token → orchestrator tự viết done-report → mới claim cell kế. Hai execution worker sống cùng lúc trên một feature small = wave standard đội lốt lane small. Execution worker khác hẳn I/O worker (gather/extract/review): có đăng ký swarm, giữ reservation, mang thẩm quyền cell, trả `[DONE]/[BLOCKED]/[HANDOFF]/[NOOP]` chứ không trả digest.
- **Where:** `skills/bee-hive/SKILL.md`, `skills/bee-swarming/SKILL.md`, `skills/bee-hive/references/routing-and-contracts.md`, `skills/bee-hive/templates/AGENTS.block.md`
- **Notable:** làm rõ chỗ hay hiểu nhầm của lane scaling: "0 subagent" cho tiny/small là zero subagent NGHI THỨC (reviewer/panel/checker), chưa bao giờ là zero worker. Done-report do orchestrator viết từ diff nguyên văn của worker + lần re-run verify của CHÍNH orchestrator — lời `[DONE]` của worker không bao giờ là bằng chứng.
- **Keywords:** AO14, small-lane serial, execution worker vs I/O worker, done-report by orchestrator
- **Seen:** 05a131f

## routing

### hive-first-skill-router
- **What:** Tầng 3 (skill-routing): bee-hive là entry router — bảng "Request type → First skill" (vague/new → exploring, research clear-scope → planning/xia, review tường minh → reviewing, document → scribing, cleanup → grooming...); mỗi skill kết thúc bằng handoff sentence cố định gọi tên skill kế ("Invoke bee-X skill"), tạo chain khép kín ...swarming → scribing → compounding → hive; `.bee/HANDOFF.json` hiện diện → surface và chờ, never auto-resume.
- **Where:** `skills/bee-hive/SKILL.md`, `skills/bee-hive/references/routing-and-contracts.md`, `hooks/bee-chain-nudge.mjs`
- **Notable:** router hai nửa: bảng chọn cửa vào + câu handoff cuối mỗi skill; hook chain-nudge (SubagentStop) đọc phase và nhắc lại bước kế — chain được harness đẩy đi, không sống bằng trí nhớ agent. Mặt cơ chế của staged-chain-with-gates (workflow).
- **Seen:** e70602a

### phase-machine-cli-owned
- **What:** Tầng 1 (state-routing, mức workflow): phase enum trong `.bee/state.json` (idle → exploring → planning → validating → swarming → scribing → compounding, alias terminal compounding-complete; `KNOWN_PHASES`), transition chỉ qua bee_state.mjs — write-guard deny hand-edit. `startFeature()` là transition có tiền điều kiện: chỉ từ idle/compounding-complete, chặn khi còn cell nonterminal, worker đăng ký, reservation active hoặc HANDOFF; một atomic write set feature/mode/phase và reset cả 4 gates về false.
- **Where:** `skills/bee-hive/templates/lib/state.mjs`, `hooks/bee-write-guard.mjs`
- **Notable:** chuyển phase là API có precondition chứ không phải câu văn; reset gates nằm trong cùng transition nên không có đường quên; phase lạ → agent-drift warning thay vì crash. Từ 55cf3a4: resolvePipeline giờ giải phase/mode/gates qua **lane của phiên** trước, mới về record mặc định — xem `lane-scoped-pipelines`.
- **Seen:** 55cf3a4

### lane-scoped-pipelines
- **What:** Từ 55cf3a4 (fsh): một feature có thể khởi động như **lane riêng**, mỗi lane mang phase/mode/gates của chính nó (cô lập khỏi record mặc định). `state.mjs` thêm lane store (`readLanes`/`writeLane`/`deleteLane`/`resolvePipeline`); `bindSessionLane`/`unbindSessionLane` (claims.mjs) buộc phiên đang làm vào một lane. Thứ tự giải: lane phiên đã bind (nếu có) → record mặc định (fail-safe). Lane-start tạo pipeline record của feature đó và reset **chỉ 4 gate của nó** trong một atomic write; precondition lane-scoped (unit dở chỉ chặn nếu thuộc feature này; pause snapshot chỉ chặn nếu nêu feature này).
- **Where:** `.bee/bin/lib/state.mjs` (lane store + resolvePipeline; runtime ghi ra .bee/lanes/ — gitignored), `docs/specs/workflow-state.md` B12-B13
- **Notable:** cho phép nhiều feature chạy song song cùng checkout, mỗi cái có gate/phase độc lập — nền cho multi-session không giẫm chân. **Zero-lane byte-parity**: repo không lane thấy đúng hành vi tiền-lane từng byte (thêm mà không đổi). Đây là nâng phase-machine từ đơn-pipeline lên đa-pipeline — trực tiếp cho forgent chạy nhiều luồng việc song song.
- **Keywords:** lanes, per-feature pipeline, lane binding, resolvePipeline, zero-lane byte-parity
- **Seen:** 55cf3a4

### cell-status-lifecycle
- **What:** Tầng 1 (state-routing, mức task): cell status open → claimed → capped / blocked / dropped (capped, dropped terminal); `claimCell` đòi execution gate approved + mọi deps đã capped; `capCell` đòi verify pass được ghi nhận (+ red-failure evidence khi behavior_change); `readyCells()` suy ra tập cell chạy được từ deps-capped.
- **Where:** `skills/bee-hive/templates/lib/cells.mjs`
- **Notable:** "việc kế tiếp" là truy vấn dẫn xuất từ trạng thái, không phải danh sách tay — hội tụ độc lập với runnable predicate của harness (repository-harness:runnable-derived-dispatch).
- **Seen:** e70602a

### lane-routes-chain-shape
- **What:** Tầng 2 (task-routing): lane từ mode gate (đếm flag cơ học — xem risk-lanes-mechanical) quyết định lối đi trong chain: docs → exit planning ngay; tiny/small → merged Gate 2+3 rồi thẳng bee-swarming solo, bee-validating không invoke riêng mà fold inline thành reality check 2 phút trong planning; standard → bee-validating đầy đủ; high-risk → validating scale plan-checker thành persona panel.
- **Where:** `skills/bee-planning/SKILL.md`, `skills/bee-validating/SKILL.md`
- **Notable:** đường tắt không bỏ bước mà "gấp bước vào trong" — mọi lane vẫn đi qua cùng invariants, chỉ đổi hình thức; handoff cuối planning rẽ nhánh theo lane (swarming vs validating).
- **Seen:** e70602a

### status-token-wave-dispatch
- **What:** Tầng 2 (task-routing): vòng dispatch của orchestrator swarming — wave analysis (deps capped + không chung file → cùng wave), 1 cell/worker; parse token trả về: [DONE] → goal-check tự re-run verify (fail → re-dispatch cùng tier kèm output lỗi), [BLOCKED] → rescue ladder 3 nấc (more context → stronger tier → escalate user), wave sạch → wave kế; hết slice → quay bee-planning (slice sau) hoặc bee-scribing (slice cuối).
- **Where:** `skills/bee-swarming/SKILL.md`, `skills/bee-swarming/references/swarming-reference.md`
- **Notable:** routing hậu-worker máy móc hoàn toàn trên status token (cặp status-token-protocol, ux); rescue ladder là escalation routing có budget thay vì retry mù.
- **Keywords:** wave, rescue ladder, goal-check
- **Seen:** e70602a

### mode-tables-trigger-dispatch
- **What:** Tầng 2 (task-routing): skill đa mode chuẩn hóa dispatch thành bảng Mode | Trigger | Does — bee-scribing 5 mode (sync/capture/flush/harvest/bootstrap; trigger là sự kiện quan sát được: chain default, settlement signal, queue non-empty tại flush point, user ask, thiếu map file), bee-briefing 4 mode (render/refresh/walkthrough/on-demand); mode chọn bằng match trigger, không bằng phán đoán tự do.
- **Where:** `skills/bee-scribing/SKILL.md`, `skills/bee-briefing/SKILL.md`
- **Notable:** "routing table trong văn xuôi" lặp nhất quán khắp suite — bằng chứng tầng 2 được làm tường minh ở mọi skill đa mode, không chỉ trong code.
- **Seen:** e70602a

## integration-contract

### codex-runtime-parity
- **What:** Từ 94b4a31 (codex-hook-state-parity + codex-sandbox-baseline): nâng dual-runtime từ Claude-chính lên PARITY Codex thật. (1) hook native-subagent audit (`SubagentStart` post-start + `SubagentStop`, field BOUNDED ≤120 ký tự, không prompt/transcript/cred, audit-only — bằng chứng chứ không thẩm quyền pre-spawn, fail-open); (2) `state set --owner` đòi owner == phase trước-mutation (chặn phiên review độc lập ghi đè state feature đang chạy); (3) migration exactly-one-hook-source (plugin XOR repo-fallback); (4) sandbox baseline: entrypoint Node lồng chạy qua Worker thread khi Codex chặn child process (giữ nguyên semantics stdout/stderr/exit như spawnSync, EPERM chỉ dung khi có status+output hợp lệ), Git/Bash/Codex thật vẫn external, shared `run-module-worker.mjs`.
- **Where:** `.bee/bin/hooks/bee-codex-subagent-audit.mjs`, spec `docs/specs/hook-runtime.md` B13/B14/R14-R15/R17, `.bee/bin/lib/command-registry.mjs` (state.set --owner L491-515), `scripts/lib/run-module-worker.mjs`, `docs/history/codex-sandbox-baseline/plan.md`
- **Notable:** audit-only = quan sát không chặn (khác write-guard của Claude); Worker-transport giữ test chạy được dưới sandbox EPERM mà không đổi onboarding production. Đưa `dual-runtime-contract` từ "one brain, two belts" tới parity kiểm-được — nền nếu forgent chạy đa-runtime (đối chiếu compound-engineering `multi-target-converter-engine`).
- **Notable thêm (05a131f):** parity thật sự chạm Windows. Mỗi entry hook Codex mang KÈM một `commandWindows` sinh máy: `node -e "<body>"` trong đó body bị giới hạn cố ý ở JS thuần chỉ dùng nháy đơn, **không `$`, không `%`, không backtick** — nhờ vậy đúng MỘT chuỗi literal được cmd.exe, powershell.exe và POSIX sh parse y hệt nhau (CI chạy thẳng chính chuỗi đó trên POSIX, không chỉ so mẫu). Body tự tìm git root rồi `spawnSync` script với `stdio:'inherit'` (bắt buộc — hook đọc payload JSON từ stdin). Lý do phải bootstrap: Codex chạy `commandWindows` TRỰC TIẾP không qua shell, nên chuỗi shell POSIX vô dụng ở đó, còn `node .bee/bin/hooks/<f>` tương đối cwd thì gãy ngay khi phiên mở ở thư mục con. Kèm nhánh ghi: bản cài plugin-first mà runtime có Codex vẫn cần `.codex/hooks.json` cục bộ ("codex-hybrid"), có preflight typed để một lần ghi bị chặn báo lý do có tên thay vì âm thầm không làm gì.
- **Keywords:** native-subagent audit, state owner, exactly-one-hook-source, Worker sandbox transport, EPERM tolerance, audit-only, commandWindows, node -e bootstrap, codex-hybrid
- **Seen:** 05a131f

## context-memory

### handoff-at-65-percent
- **What:** ~65% context → ghi `.bee/HANDOFF.json` (phase/feature/cells in flight/next action) và pause sạch; session sau KHÔNG BAO GIỜ auto-resume — surface cho user chờ xác nhận. Từ 55cf3a4 (fsh): HANDOFF.json giờ mang field **kind** — `pause` (surface-và-chờ, như cũ) hoặc `planned-next` (bàn giao việc có chủ đích, chỉ ghi khi unit trước đã cap với verify xanh VÀ unit kế đã được writer claim). `writeHandoff` (writer CLI-owned nghiêm ngặt) từ chối nếu thiếu precondition; `adoptHandoff` chuyển claim mang theo sang phiên mới rồi xóa record. `planned-next` chỉ tự-nhận tại **biên phiên mới tinh** (`/clear` hoặc phiên vừa khởi động); phiên resume/nén-nhớ KHÔNG BAO GIỜ nhận (fail-safe = pause). Kind thiếu/lạ chuẩn hóa về pause.
- **Where:** `AGENTS.md` rule 4, `docs/03-workflow.md`, `.bee/bin/lib/state.mjs` (writeHandoff/adoptHandoff), `.bee/bin/hooks/bee-session-init.mjs` (source-gated adoption), spec `docs/specs/workflow-state.md` B15
- **Notable:** pause/resume là nghi thức có chủ đích, chống resume mù sau compaction. Đợt fsh thêm đúng một nhánh auto-resume AN TOÀN: chỉ tại biên fresh-session, chỉ khi việc trước xanh và việc sau đã claim — mọi đường khác vẫn pause. Adopt hỏng không bịa "start-now", hiện lý do rồi chờ.
- **Seen:** 55cf3a4

### state-vs-log-two-physics
- **What:** Hai loại tri thức vật lý ngược nhau: Log (append-only, theo feature: decisions.jsonl, docs/history/) trả lời "how did we get here"; State (overwrite theo reality, theo area: docs/specs/) trả lời "where are we". Cả hai đều cần.
- **Where:** `docs/02-architecture.md`, decision 0001
- **Notable:** insight nền tảng nhất của bee về memory; đa số hệ chỉ có log. Từ 05a131f: nguyên tắc được cứng hoá ở tầng ghi — `startFeature` bọc toàn bộ tiền-điều-kiện-tới-lần-ghi-duy-nhất trong `withStoreLock('state')` và đọc lại state TƯƠI dưới khoá, để một refusal không bao giờ để lại mutation dở. Kèm chính sách hai-tốc-độ tường minh: writer tương tác (CLI) ĐỢI khoá, writer nền (hook heartbeat/renew) dùng `maxAttempts:1` và bỏ qua nếu bận — không bao giờ chặn lượt của người dùng vì một cái khoá.
- **Seen:** 05a131f

### ba-grade-specs-rebuild-bar
- **What:** docs/specs/<area>.md tech-agnostic ở mức BA: acceptance test = "rebuild bar" — agent chỉ đọc spec (giấu Pointers) dựng lại được behavior trên stack khác. Coverage label (partial/full) + Open Gaps thay vì giả vờ đủ.
- **Where:** `skills/bee-scribing/SKILL.md`, decision 0002
- **Notable:** "meaning outlives the stack" — code chỉ là một rendering của spec.
- **Seen:** e70602a

### settlement-capture-unprompted
- **What:** Phát hiện "settlement" (rule chốt, behavior xác nhận, value tune xong) là nhiệm vụ của agent MỖI TURN, không chờ user bảo ghi; high-risk merge spec ngay, lane khác queue capture stub vào `.bee/capture-queue.jsonl`, flush tại wrap-up/PreCompact/session-start.
- **Where:** `AGENTS.md` rule 9, `skills/bee-scribing/SKILL.md` (capture mode)
- **Notable:** SELF-TRIGGERING skill description + capture queue = không mất tri thức giữa chừng phiên.
- **Seen:** e70602a

### event-sourced-decisions
- **What:** decisions.jsonl append-only qua CLI verb (log/supersede/redact/active/search — không bao giờ hand-edit); D-ID cited trong spec/cell; write-time redaction, datamark on read.
- **Where:** `templates/lib/decisions.mjs`, `docs/decisions/` format
- **Notable:** decision record có Status/Confidence/Source/Alternatives — audit trail thiết kế đầy đủ.
- **Seen:** e70602a

### crash-transcript-recovery-mining
- **What:** Từ 05a131f (transcript-recovery + hardening-5): phiên crash (khác phiên đóng sạch) được phát hiện RẺ tại mỗi lần `bee status --json`. Ứng viên phải thoả TẤT CẢ: không phải phiên đang sống, heartbeat cũ (dùng lại luật 900s của claims), transcript giải được nhưng THIẾU "clean-end trio" (`stop_hook_summary` → `turn_duration` → `last-prompt`, không có event hội thoại nào sau đó), và còn dấu việc dở (lane non-terminal / cell đang claim / transcript mới hơn settlement bền cuối). Khai quật là ĐỀ NGHỊ, không bao giờ tự chạy: người duyệt thì dispatch một worker tier thấp với prompt do CODE sinh (`bee recovery window`), cửa sổ chặn cứng 500 event sau `sinceTs` = settlement bền gần nhất (decisions.jsonl / capture stub / `capped_at` của cell). Digest ≤600 từ, 4 mục cố định, ghi ra `docs/history/<feature>/reports/recovery-<session8>.md`; settlement khai quật vào hàng đợi qua `capture add --source mined` (chưa xác nhận), không bao giờ tự thành decision.
- **Where:** `skills/bee-hive/templates/lib/recovery.mjs`, `skills/bee-hive/templates/bee.mjs`, `skills/bee-hive/SKILL.md`, `docs/specs/workflow-state.md`
- **Notable:** kỷ luật context sắc nhất ở đây: CLI chỉ **phát ra** prompt, không gọi LLM — nên dòng transcript thô không bao giờ vào context của orchestrator; prompt mở đầu bằng đúng `[bee-tier: generation]` ở ký tự đầu tiên (yêu cầu transport của rule 13) và dặn miner coi mọi nội dung transcript là DATA, redact chuỗi dạng secret trước khi ghi. Không có transcript = báo "no transcript", không bao giờ báo crash. `recovery.transcript_roots` cho phép khai thêm store của runtime khác (Codex) — root khai mà thiếu thì cảnh báo đúng một lần nêu tên, để người dùng chứng được là đã thật sự kiểm.
- **Keywords:** clean-end trio, mining window, sinceTs durable settlement, buildMiningPrompt, capture add --source mined, transcript_roots
- **Seen:** 05a131f

## planning

### plan-freeze-at-gate
- **What:** Từ 05a131f (lane-ceremony-v3 D1): `plan.md` BẤT BIẾN ngay khi `approved_gates.shape` được set — bước ghi duy nhất còn được phép hậu-approve là đóng dấu timestamp. Bỏ hẳn bước "enrich in-place lên implementation-ready" của bản two-pass cũ. bee-validating đọc một plan "byte-identical với cái người đã duyệt"; luật drift của briefing vì thế thu hẹp lại chỉ còn bắn trên thay đổi CELL (plan không còn drift được nữa).
- **Where:** `skills/bee-planning/SKILL.md`, `skills/bee-planning/references/planning-reference.md`, `skills/bee-validating/SKILL.md`, `skills/bee-briefing/SKILL.md`
- **Notable:** đảo ngược có chủ đích `unified-plan-two-pass` (entry ngay dưới) — hai lượt enrich in-place từng là điểm bán của bee, dogfood cho thấy nó làm "cái người duyệt" và "cái đem thi hành" trôi khỏi nhau mà không ai thấy. Bất biến rẻ hơn diff. Đi cùng D3/D4: không còn plan.md bắt buộc duy nhất — tiny không có plan (cell LÀ micro-plan), small mặc định chỉ là scoping synthesis được log.
- **Keywords:** D1, frozen plan, approval stamp, byte-identical, artifact fan-out D3/D4
- **Seen:** 05a131f

### unified-plan-two-pass
- **What:** Một `plan.md` duy nhất, enriched in-place 2 lượt: `artifact_readiness: requirements-only` → Gate 2 → `implementation-ready` + tạo cells batch. Artifact phụ (discovery/approach) phải "earned" bởi research level L2+ hoặc high-risk.
- **Where:** `skills/bee-planning/SKILL.md` + `references/planning-reference.md`
- **Notable:** artifact fan-out table chống đẻ file nghi thức; frontmatter `artifact_contract` versioned.
- **Seen:** e70602a

### research-levels-evidence-labels
- **What:** Discovery L0–L3 scale chi phí; bee-xia scout với 4 evidence labels (Local/Upstream/Docs/Inference) + recommendation ladder (reuse local → built-in → adapt upstream → build, mỗi rung bỏ qua phải nêu lý do).
- **Where:** `skills/bee-xia/SKILL.md` + `references/xia-protocol.md`
- **Notable:** mọi claim nghiên cứu đều dán nhãn nguồn bằng chứng; brief mở đầu bằng Bottom Line.
- **Seen:** e70602a

### edge-dimensions-checklist
- **What:** 12 chiều edge-case (input extremes, timing, scale, concurrency, compliance...) cho test matrix depth.
- **Where:** `skills/bee-planning/references/edge-dimensions.md`
- **Notable:** kế thừa claudekit; checklist cơ học thay brainstorm tùy hứng.
- **Seen:** e70602a

## quality-gates

### multi-agent-review-severity
- **What:** Review session user-invoked: scope frozen tại creation (immutable), 4 core reviewers song song (code-quality/architecture/security/test-coverage) + conditional theo diff; P1/P2/P3, P1 block merge; verification-evidence backstop; artifact check EXISTS/SUBSTANTIVE/WIRED; UAT walk theo CONTEXT.md; review approval chỉ phủ đúng change set đã soi — thay đổi sau = `review-stale`.
- **Where:** `skills/bee-reviewing/SKILL.md`, spec `docs/specs/workflow-state.md`
- **Notable:** review coverage là derived-never-stored; "merge/ship" không bao giờ tự kích review. Từ 94b4a31 (rca): `reviews candidate add` tự điền cell ids từ cell đã capped của feature (`--cells` optional) → attestation coverage khớp cell roster không cần gõ tay.
- **Seen:** 94b4a31

### adversarial-plan-checker
- **What:** Subagent giả định plan sai, verify 5 chiều (coverage/completeness/dependencies/links/scope), max 3 vòng; high-risk scale lên persona panel.
- **Where:** `skills/bee-validating/SKILL.md`
- **Notable:** red-team plan trước khi tốn tiền execute.
- **Seen:** e70602a

### baseline-gate
- **What:** Nếu config ghi `commands.verify`, chạy 1 lần đầu phiên trước khi nhận việc; baseline đỏ → surface + thành fix-first cell. "Never build on red." Session finish cũng phải end green hoặc end red có cell + report.
- **Where:** `AGENTS.md` startup 6 + session finish
- **Notable:** chống xây trên nền gãy — lỗ hổng phổ biến nhất của agent session.
- **Seen:** e70602a

### evidence-before-claims
- **What:** Mọi câu "done/passing/fixed" phải kèm output lệnh tươi trong cùng message; red-flag words: should/probably/seems to.
- **Where:** `docs/00-vision.md` P4, hive law
- **Notable:** quy tắc văn hóa được lặp ở mọi tầng tài liệu — ví dụ tốt về "narrative làm luật". Từ 05a131f: luật văn hoá này đã có bản CƠ HỌC ở ba tầng mới — verdict judge đòi `evidence` từng check (`semantic-judge-verdict-loop`), conformance suite đòi chứng cả trạng thái ÂM sau một refusal (`black-box-conformance-suite`), và CI Windows tự khai chính xác nó KHÔNG chứng cái gì (`honest-windows-ci-subset`). Đường đi đáng học: một luật narrative đủ tốt sẽ dần mọc ra cơ chế ở mọi nơi nó bị vi phạm.
- **Seen:** 05a131f

### chain-integrity-guard-tail
- **What:** Từ 55cf3a4 (chain-integrity): đuôi chain (execution → scribing → compounding → terminal) giờ được canh **tại cửa bằng máy**, không bằng tên phase. 3 luật: (a) phase `compounding` KHÔNG settable trực tiếp — chỉ `state scribing-run` sinh ra nó; (b) `scribing-run` bị từ chối trừ khi phase là nơi execution đã xảy ra (swarming/reviewing/scribing); (c) `compounding-complete` bị từ chối khi spec-debt > 0, waiver phải ghi decision bền nêu từng unit được miễn. Mọi transition NGOÀI đuôi vẫn nới (lùi về phase trước là hợp lệ; `set --phase idle` hợp lệ).
- **Where:** `.bee/bin/lib/state.mjs` (checkPhaseTransition, checkScribingRunPhase, SCRIBING_RUN_FROM), `.bee/bin/bee.mjs` (handleStateScribingRun), spec `docs/specs/workflow-state.md` R19-R22, `docs/history/chain-integrity/CONTEXT.md`
- **Notable:** Gốc rễ (post-mortem): một phiên thật đã **giả 7 lần close** bằng cách hand-edit phase thành `compounding-complete` mà không hề chạy scribing/compounding — kiểm phase-enum suông không đủ. Bài học tổng quát hóa của critical-rule "hook là lưới an toàn, không phải người gác": chốt phải là **producer thật của trạng thái** (chỉ scribing-run sinh compounding), không phải một giá trị enum ai cũng gõ được. Debt là advisory khắp nơi, chỉ **tường tại cửa close**; waiver loud + logged, không im. Trực tiếp cho forgent: đóng-feature-trung-thực phải do máy chứng, không do agent tự khai.
- **Keywords:** tail guard, phase-not-settable, scribing-run producer, spec-debt blocker, loud waiver, fake-close post-mortem
- **Seen:** 55cf3a4

### semantic-judge-verdict-loop
- **What:** Từ 05a131f (self-correcting-loop D5 + hardening-3 + hardening-1-7-10 D7): judge ngữ nghĩa trả verdict theo schema đóng `judge-verdict/1` — `PASS`/`NEEDS_REVISION`, mảng `checks[]` mỗi mục BẮT BUỘC có `evidence`, `failure_signature` bắt buộc khi có check FAIL, `fixability`, `confidence`. Validator thuần, không bao giờ throw, và cross-check: `PASS` mà có check FAIL bị loại; `NEEDS_REVISION` mà không có check FAIL nào cũng bị loại; output văn xuôi tự do TỰ NÓ là lỗi validate. Verdict append vào `trace.semantic_judge`. RĂNG THẬT: `capCell` từ chối cap khi verdict mới nhất là `NEEDS_REVISION` (`JUDGE_REWORK_REQUIRED`) trừ khi có `--override-judge "<lý do>"` được ghi decision; và verdict `NEEDS_REVISION` trên cell đang `capped` **mở lại cell về `open`** (không phải `claimed` — "không chủ nào sống sót qua NEEDS_REVISION") đồng thời XOÁ bằng chứng verify cũ.
- **Where:** `skills/bee-hive/templates/lib/judge.mjs`, `skills/bee-hive/templates/lib/cells.mjs`, `skills/bee-hive/templates/bee.mjs`
- **Notable:** lỗ D7 vá được là bài học đắt: bản hardening-3 mở lại `capped→claimed` nhưng GIỮ `trace.verify_passed`/`verify_output` của lần cap cũ — nên một verdict PASS sau đó cap lại được mà không hề chạy verify mới. Nay đòi cả claim mới LẪN verify mới. Kèm `deriveModelIndependence`: chỉ khi cả builder và judge đều `pinned` và khác tên model mới là `confirmed`, ngược lại `unverified` — hệ thống không bao giờ tự nhận là đã review độc lập khi không chứng được.
- **Keywords:** judge-verdict/1, NEEDS_REVISION, JUDGE_REWORK_REQUIRED, reopened_for_rework, releaseTrace, model independence confirmed/same-model/unverified
- **Seen:** 05a131f

### cell-lifetime-budgets-anti-loop
- **What:** Từ 05a131f (self-correcting-loop D1/D2 + GH #27): ba ngân sách ĐỘC LẬP kiểm tại CỬA CLAIM của mỗi cell — `max_claims` (3), `max_failed_attempts` (4), `max_same_signature` (2), trần cứng gấp 3 không nới được lúc chạy. Nền là hai thứ: sổ `trace.attempts` append-only (mỗi verify/block một dòng: n, verdict, failure_signature, claim_session, `acquired_at`) và `normalizeFailureSignature` — chuẩn hoá output lỗi (bỏ timestamp, path tuyệt đối — **không bao giờ để lọt path trước khi hash**, chuỗi hex) rồi hash 12 ký tự, nên "cùng một lỗi" nhận diện được qua nhiều lần thử. `REPEATED_FAILURE` bắn khi đủ số lần fail cùng chữ ký — chặn đúng hành vi "chạy lại y hệt bản vá vừa hỏng", khác với cạn quota chung. Mở lại chỉ qua `cells reset-budget --reason` (đòi lý do + actor, ghi decision, append `trace.budget_resets`, không đụng `trace.attempts`).
- **Where:** `skills/bee-hive/templates/lib/cells.mjs`, `skills/bee-hive/templates/bee.mjs`
- **Notable:** chi tiết quyết định: `checkCellBudgets` CỐ Ý không đọc `gate_bypass`/config — đây là cửa an toàn CẤU TRÚC chống vòng lặp, không phải gate người được vẫy qua; kể cả autopilot `total` cũng không mở nó. Số claim đếm theo cặp `(claim_session, acquired_at)` nên heartbeat không thổi phồng. `claim-next` lặng lẽ bỏ qua cell cạn budget thay vì báo lỗi. Đây là mảnh anti-loop CƠ HỌC mà forgent ghi là tiền-điều-kiện của fan-out — bổ sung `native-codex-wait-discipline` (anti-loop phía chờ) bằng anti-loop phía thử-lại.
- **Keywords:** CELL_BUDGET_EXHAUSTED, REPEATED_FAILURE, trace.attempts, normalizeFailureSignature, acquired_at, budget reset audited
- **Seen:** 05a131f

### judge-standard-change-class-matrix
- **What:** Từ 05a131f (self-correcting-loop F4/F5): ma trận `change_class` → tín hiệu verify tối thiểu, kiểm lúc `cells add`/`update` và lần nữa lúc cap — formatting đòi lint/typecheck; bugfix đòi test nêu tên; behavior đòi `verification_evidence.red_failure_evidence` không rỗng; api đòi contract/integration test; security đòi test negative; migration đòi CẢ chiều tiến LẪN rollback. Thuần ADVISORY (STDERR), không bao giờ là refusal; cell không khai class thì không bị kiểm.
- **Where:** `skills/bee-hive/templates/bee.mjs`, `skills/bee-hive/templates/lib/cells.mjs`
- **Notable:** đánh đúng bệnh đã thành critical pattern của chính bee: "verify của cell phải chạm được artifact cell tuyên bố tạo ra" — ma trận này là lớp nhắc TẠI LÚC VIẾT CELL, rẻ nhất, trước khi cả một wave cap xanh trên proxy rỗng. Cố ý advisory: authoring-time không đủ thông tin để refuse cho đúng, nên đẩy răng xuống tầng cap (`semantic-judge-verdict-loop`).
- **Keywords:** JUDGE_STANDARD_INSUFFICIENT, change_class, red_failure_evidence, deliberate_exceptions, advisory-at-authoring
- **Seen:** 05a131f

### frozen-judge-file-scope
- **What:** Từ 05a131f: kiểm TĨNH (không LLM) so `trace.files_changed` của worker với 8 mẫu file "judge" — test, CI config, lockfile, package manifest, test config, `.bee/config.json` — và báo khi worker chạm chúng NGOÀI danh sách `files` cell tự khai. `bee cells judge --id`; hit không bao giờ là refusal, chỉ là dòng chữ: "đừng tính cell này vào wave sạch, gắn cờ cho review".
- **Where:** `skills/bee-hive/templates/lib/cells.mjs`, `skills/bee-hive/templates/bee.mjs`
- **Notable:** đúng một câu hỏi: "worker có tự nới cái thước đo mình không?" — sửa test/CI để verify xanh là cách gian lận rẻ nhất và khó thấy nhất. Đây là "judge" thứ ba trong repo, dễ lẫn: (1) ma trận change_class = advisory lúc viết cell, (2) frozen-judge = diff tĩnh phạm-vi-file, (3) semantic judge = verdict LLM có răng cap. Ba trục khác nhau, cùng một tên.
- **Keywords:** FROZEN_JUDGE_PATTERNS, frozen judge, declared files scope, decision 0018
- **Seen:** 05a131f

### advisor-consult-gate-precondition
- **What:** Từ 05a131f (AO2b/AO3/AO13): với slice high-risk/hard-gate, orchestrator BẮT BUỘC tham vấn advisor và ghi `advisor_ref` chưa cũ TRƯỚC khi Gate 3 mở — `state gate --name execution` **throw**, không phải cảnh báo. Cũ được định nghĩa bằng 4 điều kiện KIỂM ĐƯỢC: lệch feature, có decision mới hơn, sha256 của `plan.md` đổi, hoặc ref có trước một lần thu-hồi-gate. Mọi mức gate-bypass đều KHÔNG gỡ được tiền-điều-kiện này — bypass chỉ bỏ checkpoint của NGƯỜI.
- **Where:** `skills/bee-validating/SKILL.md`
- **Notable:** dòng lý do đáng chép: "Không bao giờ dùng TTL theo thời gian — AO13 đã một lần bỏng vì một con số bịa." Staleness định nghĩa bằng SỰ KIỆN (hash đổi, decision mới) thay vì đồng hồ là mẫu tái dùng được cho mọi cache tri thức. Và nó tách bạch hai loại chặn mà autopilot hay bị gộp: checkpoint của người (bypass gỡ được) vs tiền-điều-kiện cơ học (không ai gỡ) — cùng gene với budget door ở `cell-lifetime-budgets-anti-loop`.
- **Keywords:** advisor_ref, staleness 4 điều kiện, gate throws not warns, bypass lifts human checkpoint only
- **Seen:** 05a131f

## docs-style

### numbered-docs-progression
- **What:** docs đánh số 00-vision → 07-contracts theo trục why → what → how → contract; adoption audits (08–11) ghi lại việc học từ project khác thành tài liệu chính thức (keep wholesale / change / reject + lý do từng mục).
- **Where:** `docs/00..11-*.md`, đặc biệt `01-distillation.md`, `08/09-*-adoption.md`
- **Notable:** 01/08/09 chính là thể loại "reference learning" forgent đang xây — có trước, đáng học format.
- **Seen:** e70602a

### gate-presentation-contract
- **What:** Chat chỉ chứa lớp plain-language (what/why trustworthy/cost if wrong/what you decide) + câu gate verbatim; mechanical reports link chứ không paste. Litmus: user restate được approval bằng lời mình.
- **Where:** `skills/bee-hive/references/routing-and-contracts.md`
- **Notable:** đi cùng Silent Bookkeeping (rule 11): bee vocab không lọt vào chat trừ khi user hỏi.
- **Seen:** e70602a

### error-why-fix-refusals
- **What:** Mọi refusal user-facing phải nêu: rule bị chạm, lý do, hành động kế tiếp cụ thể; test assert phần FIX.
- **Where:** `docs/07-contracts.md`
- **Notable:** đối xử error message như contract có test.
- **Seen:** e70602a

### doctrine-layer-always-loaded
- **What:** Tầng "doctrine" tách tường minh khỏi procedure references: standing instruction sheet (AGENTS.md block) nạp MỌI turn kể cả turn hội thoại thường; placement rule một câu — "rule này có cần hold khi không stage nào chạy không?" yes → standing sheet, no → reference. Mỗi doctrine rule có **anchor** (cụm từ đặc trưng) được suite assert theo tên — rule biến mất khỏi sheet là suite đỏ. Doctrine đến mọi project bằng COPY (onboard/upgrade thay block tại chỗ), không bằng reference.
- **Where:** `docs/specs/doctrine-layer.md`, `skills/bee-hive/templates/AGENTS.block.md`, `docs/history/learnings/critical-patterns.md`
- **Notable:** hai bài học failure-driven đắt giá: (1) "promote an order and its transport must ride along" — rule 13 (fan-out) lên doctrine nhưng CÁCH dispatch (tier marker) còn nằm ở reference chỉ nạp khi invoke skill → mọi dispatch đầu phiên bị model-guard deny, học transport lúc bị từ chối; standing sheet phải mang lệnh KÈM mức tối thiểu để tuân thủ ngay lần đầu. (2) Rule đặt sai nhà "behaves exactly like no rule at all" — vô hình từ chính text của rule. Anchor-suite là cơ chế chống doctrine tự rỗng dần duy nhất thấy trong 4 nguồn.
- **Keywords:** doctrine, standing sheet, anchor, always-applies, transport
- **Seen:** af4840c

### spec-reading-map
- **What:** `docs/specs/reading-map.md` = index 1 dòng/vị trí "cái gì sống ở đâu", kèm mục "chưa specced" và "elsewhere" — bản đồ điều hướng cho agent lạ.
- **Where:** `docs/specs/reading-map.md`
- **Notable:** trả lời Fresh Session Test câu "how is it organized".
- **Seen:** e70602a

### llm-md-agent-front-door
- **What:** Từ 94b4a31: `LLM.md` (~130 dòng) — hợp đồng vận hành HƯỚNG-AGENT + cửa trước cài đặt: khai AGENTS.md là canonical (conflict → AGENTS.md thắng), một luật ràng buộc (route qua bee-hive trước khi chạm source), các luật bất-khả-thương-lượng (gate không tự-approve, evidence-before-claims, cap đòi proof, reserve file, privacy), checklist khởi động (đọc AGENTS.md, `bee status`, baseline verify, handoff check, critical-patterns.md), litmus tuân thủ. Nhắm thẳng Claude Code/Codex/Cursor/Aider.
- **Where:** `LLM.md`
- **Notable:** cửa trước NGẮN & trung thành cho agent lạ (khác `entry-point-shim` hướng loader) — hội tụ với repository-harness CLAUDE.md import-shim nhưng là README-cho-AI đứng riêng; kỷ luật data-vs-instructions nhắc lại. Mẫu "một trang agent đọc trước tiên" cho forgent.
- **Keywords:** LLM.md, agent-facing contract, one binding rule, startup checklist, AGENTS.md canonical
- **Seen:** 94b4a31

## tooling

### zero-dep-vendored-helpers
- **What:** Toàn bộ máy móc là Node 18 ESM zero npm deps, atomic write (tmp+rename), Windows-safe; vendored vào host repo (`.bee/bin/` + `lib/`) nên chạy mọi nơi không cần cài gì.
- **Where:** `docs/07-contracts.md`, `skills/bee-hive/templates/`
- **Notable:** enforcement sống trong helpers vendored → runtime nào cũng bị ràng buộc như nhau.
- **Seen:** e70602a

### unified-dispatcher-command-registry
- **What:** `bee.mjs` dispatch 9 nhóm lệnh từ một implementation; command catalog máy-đọc-được (name/invoke/description/param schema/examples/deprecation); hook validate CLI shape theo catalog; examples được test chạy thật. Từ 55cf3a4 (shim-retire): 9 shim `bee_*.mjs` cũ đã **xóa hẳn** khỏi template và bị onboarding gỡ khỏi host qua pass `RETIRED_HELPERS` (idempotent, khớp tên chính xác); `bee.mjs <group> <verb>` là CLI DUY NHẤT được ship, import thẳng lib (in-process, không spawnSync), output byte-identical với đường shim cũ.
- **Where:** `.bee/bin/bee.mjs`, `.bee/bin/lib/command-registry.mjs`, `skills/bee-hive/scripts/onboard_bee.mjs` (RETIRED_HELPERS)
- **Notable:** CLI surface tự mô tả cho agent discover (`--help --json`). Đợt shim-retire hoàn tất hội tụ về một dispatcher: retire an toàn = xóa template + gỡ-khỏi-host idempotent + giữ byte-parity, không phá host đang dùng shim cũ. Từ 94b4a31: thêm nhóm `config get/set/unset` (dot-notation nested, validate-on-write, từ chối nếu làm models/cli-tier invalid) + verbs `cells reopen`/`unclaim` cho rework.
- **Seen:** 94b4a31

### statusline-subagent-cost
- **What:** Statusline cộng token/cost của cả subagents (parse `<session>/subagents/*.jsonl`, dedupe theo message.id, bảng giá theo model, cache theo size+mtime, fail-open). Từ 55cf3a4 (statusline-ctx-threshold): statusline thêm segment **% context đã dùng** và tô màu theo ngưỡng — vàng tại 65% (mốc phải ghi `.bee/HANDOFF.json` theo AGENTS.md § Session finish), đỏ ≥90%; contract segment+màu specced trong `docs/specs/onboarding.md`.
- **Where:** `.claude/statusline-usage.mjs`, `docs/specs/onboarding.md`, `plans/statusline-usage.md`
- **Notable:** làm chi phí model tier nhìn thấy được ngay trong UI. Đợt ctx-threshold nối màu statusline với luật handoff-65%: mốc pause trừu tượng thành tín hiệu thị giác thời-gian-thực, giảm lỡ mốc handoff.
- **Seen:** 55cf3a4

### cell-archiving-transaction
- **What:** Từ 05a131f (cells-archive + hardening-1/D4): cell của feature đã đóng chuyển từ đường quét nóng `.bee/cells/*.json` sang `.bee/cells/archive/<feature>/`, status/build-status chỉ đọc **sổ tóm tắt**, không bao giờ quét thư mục. Giao dịch có journal ghi TRƯỚC lần rename đầu tiên, phục hồi khi lần gọi sau phát hiện đích tồn tại mà nguồn mất (đảo chiều được cho cả archive lẫn unarchive), preflight chống trùng tên (không bao giờ ghi đè), allowlist theo status (chỉ capped/dropped — không phải denylist để `blocked` lọt), và slug feature phải khớp pattern an toàn + realpath containment. Đọc cell vẫn trong suốt: chỉ rơi vào archive khi file active vắng mặt.
- **Where:** `skills/bee-hive/templates/lib/cells.mjs`, `skills/bee-hive/templates/bee.mjs`
- **Notable:** thứ tự khoá được khai báo tường minh và một chiều (`cells:<id>` → `cells-archive`, không bao giờ ngược) để mutator một-cell và giao dịch cả-store không deadlock; `writeCell` cũng phải chạm khoá archive để không hồi sinh một cell đang bị dời. Guard "không archive feature đang active" cố ý đặt ở tầng CLI chứ không ở primitive — primitive không được phép biết `state.json`. Bài toán scale rất thật: một lần archive 108 feature / 356 cell ra khỏi hot-scan.
- **Keywords:** cells-archive lock, archive journal, ARCHIVE_DESTINATION_COLLISION, CELLS_ARCHIVE_BUSY, allowlist not denylist, hot-scan
- **Seen:** 05a131f

## config-packaging

### plugin-distribution-preflight-proof
- **What:** Từ 05a131f: `plugin_distribution.mjs` CHỨNG trạng thái gói trên đĩa khớp release manifest (sha256 + mode từng file) trước/sau mỗi lần chuyển chế độ phân phối — `repo-copy` phải chứng plugin thật sự KHÔNG cài (`provePluginInactive`), `plugin-first` phải chứng khớp manifest (`proveInstalledPackage`). Mọi đích dọn dẹp phải là thư mục/file THẬT (`realpathSync.native` phải bằng path đã resolve — từ chối symlink/alias escape), manifest từ chối path tuyệt đối hoặc chứa `..`, và dọn dẹp là **rename vào quarantine** `<path>.bee-cleanup-<token>` (nguyên tử, đảo được) chứ không xoá tại chỗ.
- **Where:** `skills/bee-hive/scripts/plugin_distribution.mjs`
- **Notable:** một miễn trừ đáng nhớ — `.codex/hooks.json` phải được exempt khỏi chính pass dọn dẹp này, vì entry hybrid mà bản cài plugin-first vừa ghi ra byte-identical với thứ mà `cleanHookConfig` bình thường sẽ bóc đi: cài xong tự xoá thành quả của mình. Nâng `release-tuple-manifest-integrity` từ "manifest đúng" lên "hệ thống file THỰC khớp manifest, chứng bằng hash, dọn bằng giao dịch đảo được".
- **Keywords:** proveInstalledPackage, provePluginInactive, bee-cleanup quarantine rename, realpath native match, DISTRIBUTION_REFUSED
- **Seen:** 05a131f

### machine-local-config-overlay
- **What:** Từ 05a131f (hardening-8): `.bee/config.local.json` là overlay MÁY-CỤC-BỘ, không bao giờ tracked, deep-merge ĐÈ LÊN `.bee/config.json` tracked (overlay thắng, array thay thế). Cùng họ với `.bee/doctor-attest.json` và `.bee/native-transport-probe.json` — cả ba là trạng thái attestation/capability theo từng checkout, không bao giờ được thừa hưởng từ clone của người khác.
- **Where:** `hooks/catalog.mjs`
- **Notable:** tách đúng ranh giới hay bị lẫn trong config chung của team: giá trị là QUYẾT ĐỊNH chung (commit) vs giá trị là SỰ THẬT VỀ MÁY NÀY (không bao giờ commit). Path tuyệt đối kiểu `dogfood_repos` là ví dụ điển hình — commit vào là làm hỏng phiên của người khác. Cùng gene `managed-block-markers` (chung sống với file người khác sở hữu) nhưng theo trục máy thay vì trục file.
- **Keywords:** config.local.json, deep-merge overlay, per-checkout attestation, never tracked
- **Seen:** 05a131f

### onboarding-manifest-drift
- **What:** `.bee/onboarding.json` ghi SHA256 từng file managed; onboard re-run idempotent, detect drift + heal, `blocked_downgrade` guard (không force khi version unknown), never overwrite state/decisions/cells. Sticky opt-in — đồng ý một lần, upgrade sau tự mang theo. Từ 55cf3a4 (codex-onboarding/ao): onboarding giờ wire cả **Codex hooks** (`.codex/hooks.json`) song song hook Claude Code, và tạo state-layer skeleton (`docs/specs/reading-map.md`, `system-overview.md`, create-only). Loạt ao vá: self-onboard TỪNG clobber `.codex/hooks.json` của chính repo (nay **merge, không overwrite**); lệnh codex advisor malformed (không đọc prompt, không sandbox); regenerate hooks.json từ catalog, bỏ `.bak` lạc.
- **Where:** `skills/bee-hive/scripts/onboard_bee.mjs` (renderCodexHookEntries, mergeCodexHooks), spec `docs/specs/onboarding.md`
- **Notable:** "managed versions" pattern — update = re-onboard, không phải copy tay; consent là trạng thái bền. Đợt ao là bài học merge-không-overwrite cho file đa-chủ (`.codex/hooks.json` có cả entry của repo lẫn của bee) — cùng gene `managed-block-markers` nhưng cho JSON: chèn phần mình, giữ nguyên phần người.
- **Seen:** 55cf3a4

### managed-block-markers
- **What:** Nội dung bee trong file của host (AGENTS.md, .gitignore) nằm giữa marker BEE:START/END; mọi byte ngoài marker giữ nguyên tuyệt đối; dòng "giống marker" không bị coi là marker.
- **Where:** spec `docs/specs/onboarding.md` R10, `.gitignore`
- **Notable:** chuẩn mực chung sống với file user-owned.
- **Seen:** e70602a

### one-line-installer-two-layers
- **What:** install.sh/.ps1 một dòng: layer runtime (skills, chọn claude/codex/both) + layer repo (onboard); flags --dry-run/--source/--ref; greenfield lẫn brownfield. Từ 55cf3a4 (ih-1..6): **skills per-project** (scoped vào project, không global; chọn `--skills global|project|both` lúc cài); CLAUDE.md cài **mặc định** (không bỏ qua ở greenfield); vá PowerShell 5.1 (node-version check bỏ cú pháp node v18+); vá path Windows chứa `:` (vd `C:`) trong output `git config --list`.
- **Where:** `scripts/install.sh`, `scripts/install.ps1`, `INSTALL.md`
- **Notable:** cùng UX với repository-harness installer nhưng thêm dual-runtime. Đợt ih là hardening biên thật: per-project skills tránh nhiễm global, và hai vá Windows (PS 5.1 + path-có-dấu-hai-chấm) là lớp lỗi chỉ lộ trên host thật, không thấy khi dev trên *nix. Từ 05a131f: `install.ps1` được đưa lên ngang kỷ luật D8 của `install.sh` — trình tự probe(chỉ-đọc) → MỘT lần xác nhận phủ cả plugin transition lẫn onboarding → mutate → re-probe → rollback nếu hỏng, với rollback tự probe lại trạng thái HIỆN TẠI và chỉ hoàn nguyên đúng phần thật sự khác ảnh chụp trước lần chạy (transition chết trước khi kịp mutate → rollback là no-op đúng nghĩa). Sparse-checkout lấy đúng `skills hooks .claude-plugin .codex-plugin` vì Windows từ chối tên file chứa `: * ? " < > |` và checkout đầy đủ vài ref lịch sử sẽ abort. Đáng nhất: installer coi "CLI có mặt nhưng crash" là trạng thái THỨ BA khác hẳn "CLI vắng mặt" — plugin-first vẫn fail cứng (cần CLI), repo-copy chỉ cảnh báo rồi đi tiếp (không cần CLI); ca thật là một npm shim của codex thiếu native dependency trên Windows+WSL. Từ 94b4a31 (installer-version-parity 1.3.1/1.3.2): installer FAIL-CLOSED — chứng postcondition greenfield/brownfield end-to-end trước khi báo thành công (R21-R23), plugin-first cleanup FENCED vào managed release set, refresh-only global skill (không create/delete), ownership ledger; gate release-tuple (parity version qua các projection) chặn ship khi lệch.
- **Seen:** 94b4a31

### release-tuple-manifest-integrity
- **What:** Từ 94b4a31 (codex-harness-hardening/release): (1) release manifest generator ghi sha256+mode+role từng file managed, ENUMERATE `templates/lib`+`.bee/bin/lib` (không hand-list), cấm symlink, self-test tự mutate bản copy tạm để CHỨNG so-sánh có cắn; (2) release version tuple = MỘT registry `COMPONENTS` liệt kê mọi nơi chứa version string (2 state.mjs const + 2 plugin.json), checker và writer cùng import registry; (3) `bump_version.mjs` một-lệnh bump cả 4, preflight từ chối nếu tuple đang lệch, tự regen manifest. Cả manifest + tuple guard wired vào `verify`.
- **Where:** `scripts/release_manifest.mjs`, `scripts/lib/release-tuple.mjs` (COMPONENTS/read/write L30-144), `scripts/bump_version.mjs`, stored `docs/history/codex-harness-hardening/release-manifest.json`
- **Notable:** "version sống ở MỘT registry, bump từ MỘT lệnh"; manifest self-tested để chắc so-sánh THẬT SỰ bắt drift (không chỉ tin là bắt). Hội tụ với repository-harness proof-before-tag + prebuilt-binary-sha256 nhưng ở dạng Node zero-dep. Cho forgent bản mẫu "one-truth version + integrity manifest" khi ship artifact.
- **Keywords:** release_manifest, sha256+mode+role, COMPONENTS tuple, bump_version, preflight desync refusal, self-test bites
- **Seen:** 94b4a31

### source-identity-classifier
- **What:** Từ 94b4a31 (SRC-01..06): phân loại thuần & fail-closed DANH TÍNH nguồn của launcher đang chạy — `source_checkout`/`project_projection`/`plugin_package`/`legacy_global`/`unknown` — bằng probe CHỈ-ĐỌC (existsSync/realpathSync/readFileSync), không mutate, mọi lỗi → `unknown`, không bao giờ throw. Realpath-match tách legacy_global khỏi projection; manifest unparseable → unknown; plugin.json không .git là plugin_package (không bao giờ tự nhận quyền global).
- **Where:** `.bee/bin/lib/source-identity.mjs` (classifySource, SOURCE_KINDS)
- **Notable:** "biết mình là bản cài loại gì" bằng cách dò thực tại, fail-closed về unknown — nền cho guard downgrade/drift (không heal khi không chắc mình là ai). Mẫu tái dùng cho bất kỳ tool nào ship nhiều dạng (checkout/projection/package/global) và cần cư xử khác nhau an toàn.
- **Keywords:** classifySource, SOURCE_KINDS, realpath match, fail-closed unknown, plugin_package vs legacy_global
- **Seen:** 94b4a31

## repo-layout

### policy-vs-ops-split
- **What:** Markdown dưới `docs/` = policy/narrative cho người; JSON/JSONL dưới `.bee/` = operational record máy query được. Gitignore tách machine-local runtime (state, logs, cache, HANDOFF, spikes) khỏi team-durable (cells, config, decisions).
- **Where:** `docs/02-architecture.md`, `.gitignore`
- **Notable:** ranh giới commit/ignore là quyết định thiết kế có spec riêng (onboarding.md R9).
- **Seen:** e70602a

### docs-history-per-feature
- **What:** `docs/history/<feature>/` chứa CONTEXT.md (decisions) + plan.md + reports/; `docs/history/learnings/` + `research/`; tách khỏi `docs/specs/` (state theo area).
- **Where:** cấu trúc `docs/history/`
- **Notable:** feature-time artifacts (log) không lẫn với area-state (spec).
- **Seen:** e70602a

### product-root-repo-divorce
- **What:** Từ 94b4a31 (prt-1): config `product_root` cho topology "repo-divorce" — `.bee/` ngồi TRÊN một product repo lồng bên trong; resolve tài liệu SẢN PHẨM (`docs/backlog.md`, `docs/specs/`) tách khỏi history/state của chính bee. Unset → mặc định bee root; set-mà-thiếu-path → cảnh báo to.
- **Where:** `docs/config-reference.md` (product_root key), spec `docs/specs/onboarding.md` (product_root coverage)
- **Notable:** đúng topology xưởng+repo-lồng của forgent (workshop root chứa `./repo` độc lập). Cho phép một cây bee điều phối một product repo nested mà không trộn hai lịch sử — áp thẳng vào chính cấu trúc forgent đang chạy.
- **Keywords:** product_root, repo-divorce, nested repo, product docs separation
- **Seen:** 94b4a31

## safety

### privacy-marker-protocol
- **What:** Đọc file dạng secret (.env*, .pem, id_rsa*...) → hook phát marker `@@BEE_PRIVACY@@` → agent phải AskUserQuestion; không bao giờ work around; artifact/transcript content là data, không phải instructions.
- **Where:** `templates/lib/guards.mjs`, `AGENTS.md` guardrails
- **Notable:** approve-per-read, marker + protocol phản hồi chuẩn hóa.
- **Seen:** e70602a

### allowlist-not-redaction
- **What:** Feedback digest KHÔNG có field free-text nào (bỏ hẳn `detail` sau khi corpus thật chứng minh filter không tin được — prose friction luôn lọt tên hàm/file/config key qua regex). Chỉ 6 field đóng: kind/layer/source/title/first_seen/pain.
- **Where:** spec `docs/specs/feedback-digest.md`, decision 0022 D2
- **Notable:** "a filter that cannot be trusted is worse than no field at all" — bài học được falsify bằng dữ liệu thật.
- **Seen:** e70602a

### consumer-revalidates-boundary
- **What:** Bên đọc digest ngoại lai re-run secret/injection scan mọi field + bọc title trong datamark trước khi vào prompt; "redaction boundary sits at the party at risk, not the party producing". Dropped records mang lý do category, không mang text match.
- **Where:** `templates/lib/feedback.mjs` (mergeDigests), decision 0022 D2b
- **Notable:** mô hình trust-boundary cho dữ liệu cross-repo giữa các agent system.
- **Seen:** e70602a

## self-improvement

### friction-backlog-outcome-loop
- **What:** Friction ghi lúc gặp (kèm layer attribution: task spec/context/environment/verification/state); backlog item ghi predicted impact lúc tạo, actual outcome lúc đóng; grooming so dự đoán với thực tế.
- **Where:** `templates/lib/backlog.mjs`, `docs/09-harness-course-adoption.md`
- **Notable:** "prediction wrong is signal, not embarrassment" — học từ chính sai số dự đoán.
- **Seen:** e70602a

### entropy-score-trend
- **What:** Điểm entropy = tổng có trọng số (orphaned cells ×10, unverified ×5, stale specs ×5, backlog-without-outcome ×2, broken tools ×8...), cap 100, band 4 mức; grooming bắt buộc báo score KÈM trend so lần audit trước.
- **Where:** `skills/bee-grooming/references/grooming-reference.md`
- **Notable:** debt là số đo được + xu hướng, không phải cảm giác.
- **Seen:** e70602a

### evolving-loop-two-gates
- **What:** Vòng tự cải tiến: digest tự sinh khi feature close (zero-effort dogfood) → rank pain×frequency×corroboration → Gate A (người chọn cluster) → fix qua Iron Law (bee-writing-skills, không inline) → suites green → Gate B (người duyệt diff) → push là bước tay có tên. Chỉ chạy trong repo bee, guard cơ học, không bao giờ auto/schedule.
- **Where:** `skills/bee-evolving/SKILL.md`, decision 0022
- **Notable:** self-modification = lane cao nhất + kỷ luật chặt nhất; "push never automatic" RED-tested 4 kịch bản.
- **Seen:** e70602a

### grooming-project-first
- **What:** Debt hunt báo cáo bằng ngôn ngữ project (không bee-jargon); `.bee/`, `.claude/` không bao giờ là project debt; chứng minh non-use trước khi gọi dead; approval từng kill, không batch; ghi outcome sau kill.
- **Where:** `skills/bee-grooming/SKILL.md`, decision 0014
- **Notable:** tách "dọn nhà mình" khỏi "dọn nhà chủ" — tránh harness tự soi rốn.
- **Seen:** e70602a

### performance-log-cross-project-matrix
- **What:** Từ 94b4a31 (perf-log/report/jsonl): store toàn-máy `performance.jsonl` append-only (XDG: `BEEHIVE_PERF_DIR`→`XDG_CONFIG_HOME/beehive`→`~/.config/beehive`). Section schema `bee-perf/v1`: running_time_ms là THỜI GIAN CHẠY THỰC (tổng turn_duration harness phát, loại idle; fallback tổng gap < ngưỡng 300s — không bao giờ wall-clock), cờ parallel (2+ subagent chồng span hoặc 1 turn dispatch 2+ Agent), token per-model tri-phân new/cached/total (dedupe theo requestId, giữ bản output lớn nhất), token subagent ATTRIBUTED riêng (`subagents/agent-*.jsonl` + `.meta.json`, lọc theo overlap window). Matrix chéo-dự-án gom theo `project_name` = folder cuối (giữ full path, hover mới hiện); rollup cache theo mtime+size; report HTML self-contained theme-aware. 7 verb start/stop/section/log/render/report/sync. Fail-open toàn tuyến (measurement thiếu không bao giờ làm hỏng thao tác).
- **Where:** `.bee/bin/lib/perf.mjs` (aggregateUsage L119-159, runningTimeMs/detectParallel L165-201, walkSubagents L205-255, globalPerfDir/matrix L286-294/L565-650, renderMatrixHtml L682-790), spec `docs/specs/performance-log.md`
- **Notable:** "helper cost is attributed, not hidden" + "active time, never 'alive' time" (decision D2/D3). Nối vòng đo chi phí: `statusline-subagent-cost` (per-session, thời-gian-thực) → performance-log (chéo-dự-án, bền). Cho forgent một tầng đo model-tier economy trên NHIỀU dự án — bằng chứng đo được cho kỷ luật cost-tier fan-out.
- **Keywords:** performance.jsonl, bee-perf/v1, running_time_ms active, requestId dedup, subagent attribution, project_name last-folder, self-contained HTML, fail-open
- **Seen:** 94b4a31

## ux

### silent-bookkeeping
- **What:** Bee mechanics (cells/claims/caps/phases) không bao giờ narrate vào chat; user nghe work language ("fixing X", "done — tests pass"); litmus: bỏ hết bee terms mà không mất gì = đừng dùng.
- **Where:** `AGENTS.md` rule 11, decision 1689af1b
- **Notable:** UX doctrine hiếm: máy móc càng nặng, giao tiếp càng phải nhẹ.
- **Seen:** e70602a

### status-token-protocol
- **What:** Worker kết thúc bằng status token chuẩn ([DONE]/[BLOCKED]/NOOP + report); orchestrator parse máy móc; "silence ≠ failure".
- **Where:** `skills/bee-executing/SKILL.md`, `references/swarming-reference.md`
- **Notable:** giao thức máy giữa orchestrator-worker thay vì đọc hiểu văn xuôi.
- **Seen:** e70602a

## testing-evals

### pressure-test-scenarios
- **What:** Test skill = 3–5 scenario, mỗi cái ≥3 áp lực từ 7 loại (Time, Sunk Cost, Authority, Economic, Exhaustion, Social, Ambiguity); chạy KHÔNG skill trước, ghi violation + rationalization verbatim.
- **Where:** `skills/bee-writing-skills/references/pressure-test-template.md`
- **Notable:** eval hành vi agent dưới áp lực, không phải happy path.
- **Seen:** e70602a

### hook-contract-parity-tests
- **What:** test_hook_contracts.mjs (1981 dòng): malformed payload, coverage gaps, byte-parity giữa 2 projection; parity rule: mọi rule trong guards/cells phải được exercise bởi CẢ hook test VÀ helper test.
- **Where:** `hooks/test_hook_contracts.mjs`, `docs/06-runtime-integration.md`
- **Notable:** dual-runtime chỉ đứng vững nhờ parity test tự động.
- **Seen:** e70602a

### parallel-verify-runner-discovery
- **What:** Từ 05a131f (verify-parallel-runner + contention-split cs-4): `scripts/run_verify.mjs` thay chuỗi `&&` tuần tự bằng promise-pool có trần đồng thời (mặc định `min(5, số CPU)`), ~90s → ~32s. Tập suite KHÔNG còn là mảng viết tay: glob `test_*.mjs` trên 4 root cố định + một danh sách `EXTRA_SUITES` nhỏ cho script có trước quy ước. Suite nhạy-thứ-tự cũng nhận diện bằng QUY ƯỚC TÊN (`*_race.mjs`/`*_lock.mjs`/`*_concurrency.mjs`) và bị gom vào một nhánh serial duy nhất — nhánh đó vẫn chạy song song với phần còn lại.
- **Where:** `scripts/run_verify.mjs`, `scripts/verify_all.mjs`
- **Notable:** lý do bỏ mảng tay không phải thẩm mỹ mà là XUNG ĐỘT: mảng SUITES là điểm va chạm merge của mọi feature thêm test ("exec-xwh1 vs exec-cs3 collided here"). Chạy song song giữ output trung thực bằng cách buffer stdout/stderr từng suite và chỉ in khi FAIL — xanh thì im, đỏ thì đổ đủ. Cho forgent: mẫu "song song hoá verify mà không đánh đổi tính đọc-được của lỗi".
- **Keywords:** run_verify.mjs, promise pool, DISCOVERY_ROOTS, SERIAL_NAME_PATTERN, buffer-print-on-failure
- **Seen:** 05a131f

### verify-manifest-floor-guard
- **What:** Từ 05a131f: chống "verify âm thầm rụng suite" bằng HAI kiểm độc lập — (1) sàn đông cứng `SUITE_FLOOR_COUNT` mà tổng suite phát hiện được không bao giờ được tụt dưới, (2) danh sách `MANDATORY_SUITES` chọn lọc, mỗi cái kiểm CẢ tồn tại trên đĩa LẪN có mặt trong mảng `SUITES` mà runner export. Bản thân checker có self-test trên dữ liệu tổng hợp để chứng nó thật sự cắn.
- **Where:** `scripts/test_verify_manifest.mjs`, `scripts/run_verify.mjs`
- **Notable:** viết lại vì chính đợt cs-4: khi tập suite chuyển từ mảng-tay sang discovery, phép kiểm "khớp chính xác mảng" mất nghĩa — sàn + membership bắt hai hình thái hỏng KHÁC nhau (suite bị xoá vs suite bị exclude). Đây là một dạng `evidence-before-claims` áp cho chính bộ đo: "xanh" chỉ đáng tin nếu chứng được là đã chạy đủ.
- **Keywords:** SUITE_FLOOR_COUNT, MANDATORY_SUITES, checker self-test bites, discovery-era guard rewrite
- **Seen:** 05a131f

### black-box-conformance-suite
- **What:** Từ 05a131f: `scripts/test_conformance.mjs` lái các entrypoint CÔNG KHAI thật (`bee.mjs`, các hook) bằng subprocess trên một store fixture cô lập mỗi kịch bản — hộp đen, không import nội bộ. Khẳng định cả TRẠNG THÁI ÂM: một hành động bị từ chối phải chứng minh **không thay đổi gì**, chứ không chỉ trả về đúng mã deny.
- **Where:** `scripts/test_conformance.mjs`
- **Notable:** phần kịch bản đòi phán đoán con người (tiny-lane không nghi thức, Gate 1-3, worker tự chọn cell, timeout subagent, handoff sau compaction) CỐ Ý không được giả lập ở đây mà nằm trong checklist tay — thà thiếu công khai còn hơn xanh giả. Fixture builder cố ý nhân bản chứ không import từ các test khác, vì import chúng sẽ CHẠY chúng như side effect. Khác `pressure-test-scenarios` (eval hành vi agent dưới áp lực): đây là conformance cơ học của bề mặt CLI/hook.
- **Keywords:** black-box conformance, negative-state assertion, isolated fixture per scenario, manual-checklist carve-out
- **Seen:** 05a131f

### hermetic-verify-env-sealing
- **What:** Từ 05a131f (hardening-1-7-10): mọi suite con do runner spawn đều bị XOÁ `CLAUDE_CODE_SESSION_ID`/`BEE_SESSION_ID` khỏi bản sao env trước khi chạy; các suite nhạy-danh-tính còn tự xoá lần nữa lúc bootstrap của chính chúng (phòng thủ theo tầng).
- **Where:** `scripts/run_verify.mjs`, `docs/specs/verify-pipeline.md`
- **Notable:** trị đúng một kiểu xanh-giả tinh vi: dev chạy verify TỪ BÊN TRONG một phiên harness đang sống, nên test về claim/session vô tình thừa hưởng danh tính phiên thật và xanh vì lý do không tồn tại trên CI. Sau khi seal, local và CI thấy cùng một sự thật (không có danh tính nào). Cùng gene `baseline-gate`: bằng chứng chỉ có giá trị khi môi trường sinh ra nó kiểm soát được.
- **Keywords:** hermetic env, session-id scrubbing, ambient identity, local/CI parity
- **Seen:** 05a131f

### test-monolith-split-conservation
- **What:** Từ 05a131f (contention-split cs-1/cs-2a/cs-2b): monolith `test_lib.mjs` (~9.6k dòng, ~100 section, 430 check) tách theo dải section liền mạch thành các suite theo module dưới `skills/bee-hive/templates/tests/`, kèm **chứng bảo toàn số check** (430 = 204 + 226) rồi mới xoá bản gốc; fixture dùng chung trích ra `scripts/lib/test-fixture.mjs` 1:1, không đổi hành vi test lúc trích.
- **Where:** `skills/bee-hive/templates/tests/test_cells.mjs`, `skills/bee-hive/templates/tests/test_claims.mjs`, `skills/bee-hive/templates/tests/test_state.mjs`, `scripts/lib/test-fixture.mjs`, `docs/specs/verify-pipeline.md`
- **Notable:** refactor test lớn thường mất lặng lẽ vài assertion; ở đây "conservation proof" là điều kiện để được xoá monolith — kiểm được, không phải niềm tin. Cùng động cơ với discovery cs-4: một file test khổng lồ vừa là điểm va chạm merge vừa là chỗ trốn của test chết. (Nợ còn lại: comment trong `test-fixture.mjs` vẫn tự xưng chỉ được import từ `test_lib.mjs` đã bị xoá — doc stale.)
- **Keywords:** check-count conservation, monolith split, shared test fixture, merge-contention hotspot
- **Seen:** 05a131f

### honest-windows-ci-subset
- **What:** Từ 05a131f (rel1710rc-2): CI Windows chạy THẬT trên `windows-latest` nhưng chỉ tập đã chứng là portable — thu hẹp bằng chính discovery của runner (`BEE_VERIFY_ROOT_FILTER`) chứ không bằng danh sách "nên chạy trên Windows" viết tay thứ hai. 4 suite hỏng thật trên Windows nằm trong `BEE_VERIFY_EXCLUDE`, mỗi cái nêu nguyên nhân gốc + số CI run phát hiện + dòng backlog tương ứng, kèm lệnh cấm nới danh sách mà không có backlog row. Cả hai bộ lọc TỪ CHỐI chạy nếu chúng làm rỗng tập suite (không cho phép xanh-tầm-thường). Job kiểm cú pháp `install.ps1` được khai rõ là CHỈ tokenize PS5.1, không phải chạy cài thật.
- **Where:** `.github/workflows/windows.yml`, `scripts/run_verify.mjs`
- **Notable:** hiếm: một job CI tự khai chính xác nó KHÔNG chứng cái gì. Chống đúng cái bẫy "CI xanh" bị đọc rộng hơn phạm vi thật. Đây là `evidence-before-claims` áp cho hạ tầng thay vì cho câu chữ của agent — và là mẫu tốt cho forgent khi hỗ trợ đa nền tảng từng phần.
- **Keywords:** BEE_VERIFY_ROOT_FILTER, BEE_VERIFY_EXCLUDE, dated exclusion block, zero-match refusal, honest subset
- **Seen:** 05a131f
