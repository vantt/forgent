# Runbook: chạy hết plan bằng Claude thuần, song song có kiểm soát

Dùng khi không muốn đi qua `fgos dispatch`, coordination session, hay skill
`fgos-*`. Một session Claude Code (Sonnet) làm Lead, dùng Agent tool với
`model` override. Hook `scripts/dispatch-decide-hook.mjs` vẫn chạy `decide`
cho mỗi Agent call và cho qua vì `subagent_type` không đăng ký executor
(`test/scripts/dispatch-decide-hook.test.mjs`, ca "allows a real Agent
call"). Không cần tắt gì.

Áp cho: `plan.md` của track này, từ I17 tới hết Phase 7.

## 1. Vai và model

| Vai | Cách gọi | Model | Quyền | Cấm |
|---|---|---|---|---|
| Lead | session đang sống | sonnet | chọn unit, tạo/xóa worktree, spawn agent, tự verify, disposition, merge, ghi plan.md | tự sửa code; tin narration của agent |
| Implementer / Fixer | `Agent(subagent_type:"fullstack-developer", model:"sonnet")` | sonnet | sửa code trong worktree được giao, chạy Verification, commit trên `unit/<id>` | merge; sửa `plan.md`; chạy git ở path khác |
| Tester | `Agent(subagent_type:"tester", model:"opus")` | opus | chạy lại Verification, thêm test cho ca red-team trong phase file, báo pass/fail có output | sửa code sản phẩm |
| Reviewer | `Agent(subagent_type:"code-reviewer", model:"opus")` | opus | findings có severity, trỏ file:line và requirement | sửa gì |

Subagent in-process có Bash đầy đủ, nên Tester chạy test thật (khác claude
executor headless chỉ commit được).

## 2. Bất biến, không thương lượng

1. **Một worktree một unit, đường dẫn tuyệt đối trong mọi prompt.** Lệnh đầu
   tiên của mọi agent: `cd <abs> && pwd && git rev-parse --abbrev-ref HEAD`;
   không phải `unit/<id>` thì dừng, báo BLOCKED. Không bao giờ `--dir` main
   checkout, không git ở path khác.
2. **Chỉ Lead ghi `plan.md`, tuần tự, một commit mỗi merge.** Agent không
   đụng plan.
3. **Lead tự chạy Verification trước khi merge.** Status của agent là dữ
   liệu, không phải bằng chứng.
4. **Merge `--no-ff` từ main checkout, HEAD luôn là `main`.** Không checkout
   branch trong main checkout. Merge chỉ khi mọi agent của unit đó đã kết
   thúc.
5. **Cap 3 vòng fix một unit.** Proof-gap finding không được `deferred`.
6. **Full suite chạy `env -u CLAUDE_CODE_SESSION_ID npm test`** (env leak làm
   seq test đỏ giả), và không chạy hai full suite cùng lúc (fixture `/tmp`
   ăn hết inode). Dọn `/tmp/fgos-*` cũ hơn 2 giờ trước mỗi full suite.
7. **Sau `git worktree add`: symlink `node_modules`**, và chạy
   `node .gitnexus/run.cjs analyze` nếu index stale, trước khi giao agent.

## 3. Luật song song

- **Giữa unit:** chạy cùng lúc chỉ khi (a) không có cạnh `depends-on` giữa
  chúng, và (b) tập `Files` trong hai phase file **rời nhau** (trừ
  `CHANGELOG.md`, giải bằng cách mỗi unit ghi một sub-heading riêng dưới
  `## [Unreleased]`). Tối đa **2 unit** in-flight.
- **Trong unit:** Implementer chạy một mình; xong thì **Tester ‖ Reviewer**
  cùng lúc (cả hai read-only). Fixer một mình; recheck lại Tester ‖ Reviewer
  chỉ trên finding đã `accepted`.
- **Tổng agent cùng lúc ≤ 4.**
- Merge tuần tự. Unit còn in-flight khi main đã tiến: lúc merge unit đó, Lead
  `git merge --no-ff`; conflict → spawn Fixer trên worktree đó với việc
  "merge main vào branch, giải conflict, chạy lại Verification"; sau đó Lead
  verify lại ở `integratedSha` (không suy từ lần chạy trước khi diff khác
  rỗng).

## 4. Sóng cho phần đã khai

| Sóng | Unit | Vì sao song song được |
|---|---|---|
| A | I17 ‖ I18 | I17: `core/skills/_shared/*`, hai SKILL.md, `docs/specs/runner.md`; I18: `src/report/`, `bin/fgos.mjs`, registry, test. Rời nhau |
| B | I19 | phụ thuộc I17; chạy khi I17 merged, I18 có thể còn dở |
| C | I20 ‖ I21 | cả hai sau I19; I20: `dispatch/plan.mjs`, `bin/fgos.mjs`, registry, manifest, test-ownership; I21: composers, `definitions/schema.mjs`, session-engine, YAML, `registrations.mjs`, plan-loop SKILL, how-to. Rời nhau trừ CHANGELOG |
| D | Phase 5 việc 1, 3, 4, 5, 6 | chưa có block unit: Lead decompose trước (mục 6), rồi xếp sóng theo `Files` rời nhau |
| E | Phase 5 việc 7 ‖ 8 | sau I17, I20 và việc 1 |
| F | Phase 6 | một facade, tuần tự |
| G | Phase 7 | drift test ‖ docs/contract; 4c và 4d tuần tự sau đó |

## 5. Vòng lặp một unit

```text
1. chọn unit: status not-started, mọi depends-on integrated, thỏa luật song song
2. git worktree add ../<track>-<id> -b unit/<id> main ; ln -s node_modules ; gitnexus analyze nếu stale
3. Agent(sonnet, fullstack-developer) — prompt mục 7.2
4. Lead: cd worktree; chạy ## Verification của phase file; đỏ → quay 3 với output làm finding
5. Agent(opus, tester) ‖ Agent(opus, code-reviewer) — prompt mục 7.3
6. disposition từng finding: accepted / rejected có bằng chứng / deferred có tên (không cho proof-gap)
7. có accepted → Agent(sonnet, fullstack-developer) fix — rồi 4, rồi 5 (chỉ recheck accepted); cap 3
8. Lead: git -C <main> merge --no-ff unit/<id> ; verify lại nếu diff testedSha..integratedSha khác rỗng
   ; git worktree remove ; ghi block unit trong plan.md (status, integrated-sha, verification,
   findings-resolved, report path) ; commit "docs(plan): record Unit <id> integration at main@<sha>"
9. về 1
```

Report mỗi unit: `plans/260919-coordination-skill-harness-simplification/reports/unit-<id>-claude-only-execution-report.md`
(implementer output thật, tester/reviewer findings, dispositions, lệnh verify của Lead).

## 6. Decompose phase chưa có block unit

Khi hết unit đã khai của một phase, Lead viết block `- unit:` cho phase kế
(cùng khuôn I17–I21: capability, depends-on, scope, files, verification,
stop). Capability theo bảng đã chốt: prose/spec = `execute`; code =
`code:implement`; test = `code:test`; review độc lập prose = `unresolved`
(cho tới khi I19 đăng ký `review`). Gọi `Agent(opus, code-reviewer)` review
bản decompose (mỗi unit một capability, `Files` rời nhau cho unit định chạy
song song, không pin executor/model/tier). Commit plan.md rồi mới chạy.

## 7. Prompt

### 7.1 Lead (dán một lần, chạy tới hết)

```text
Bạn là Lead cho plans/260919-coordination-skill-harness-simplification/plan.md, chạy tới khi Phase 7 exit.
Làm đúng plans/260919-coordination-skill-harness-simplification/runbook-claude-only-parallel-execution.md:
- chỉ Agent tool với model override; không fgos dispatch, không coordination session, không skill fgos-*;
- implementer/fixer = Agent(model:"sonnet", subagent_type:"fullstack-developer");
  tester = Agent(model:"opus", subagent_type:"tester"); reviewer = Agent(model:"opus", subagent_type:"code-reviewer");
- song song theo mục 3 và mục 4 của runbook: ≤ 2 unit in-flight, Files rời nhau, tester ‖ reviewer trong unit, ≤ 4 agent;
- bất biến mục 2: đường dẫn tuyệt đối, chỉ bạn ghi plan.md, tự chạy Verification trước merge,
  merge --no-ff từ main checkout không checkout branch, cap 3 vòng fix, full suite với env -u CLAUDE_CODE_SESSION_ID;
- hết unit đã khai: decompose phase kế theo mục 6, cho reviewer opus duyệt, commit, rồi tiếp;
- dừng hỏi người chỉ khi: spec hai cách đọc ra hai code khác nhau; cùng lỗi hai lần sau khi đổi cách;
  conflict không giải được. Gom câu hỏi, tiếp tục unit không phụ thuộc.
Mỗi merge: cập nhật block unit trong plan.md và report unit theo mục 5 bước 8, commit conventional, không push.
```

### 7.2 Implementer / Fixer

```text
Worktree: <abs path>. Branch: unit/<id>. Lệnh đầu: cd <abs path> && pwd && git rev-parse --abbrev-ref HEAD; sai branch → Status: BLOCKED.
Đọc đúng: <abs phase file>; block `- unit: <id>` trong <abs plan.md>; design record §<n> tại <abs report>.
[fix round: thêm] Findings đã accepted: <dán nguyên văn>. Chỉ sửa cho các finding này.
Làm đúng Requirements; không mở scope; không sửa plan.md; không merge; không git ngoài worktree.
Chạy mọi lệnh trong ## Verification của phase file, dán output thật (không tóm tắt).
Commit conventional trên unit/<id>, không AI reference trong message.
Kết thúc bằng:
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Summary: hai câu
Concerns/Blockers: nếu có
```

### 7.3 Tester và Reviewer (opus, read-only, chạy song song)

```text
Worktree: <abs path> (read-only, không commit, không sửa file sản phẩm). Lệnh đầu: cd <abs path> && pwd && git rev-parse --abbrev-ref HEAD.
Đối chiếu diff `git diff main...HEAD` với Requirements trong <abs phase file> và design record §<n>.
[Tester] chạy lại ## Verification; viết test mới cho từng ca red-team/adversarial ghi trong phase file
  (file test mới được phép, chỉ dưới test/); báo pass/fail kèm output thật.
[Reviewer] findings HIGH/MEDIUM/LOW, mỗi finding: file:line, requirement bị vi phạm, cách chứng minh; proof-gap
  (Verification không exercise contract bị đổi) là finding HIGH. Không sửa gì.
[recheck: thêm] Chỉ recheck các finding: <dán>. Mỗi finding: resolved | still-open kèm bằng chứng.
Kết thúc bằng Status: DONE | BLOCKED và danh sách Findings.
```

## 8. Cái mất so với máy fgOS, chấp nhận trong lúc xây I17–I21

- Không ledger CoordinationSession; bằng chứng = commit, plan.md, report unit;
  cold-resume từ plan.md status + git.
- Không quorum gate; kỷ luật bước 4 và 6 của mục 5 là của Lead.
- Không đa dạng provider: cùng họ Claude, chỉ khác model và context tươi. Đây
  chính là thứ I21 xây để có sau này.
