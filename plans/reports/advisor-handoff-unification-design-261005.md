# Advisor: one hand-off mechanism for fgOS (2026-10-05)

Read-only advice. Nothing under `src/`, `bin/`, `test/`, `docs/`, `core/` was changed.

## 1. Verdict

The proposed direction is right, with three corrections.

- **One shape:** every hand-off is an absolute, read-only path to the earlier role's report, listed in the assignment's `contextRefs`. This holds inside a Unit run (role to role) and across Workflow steps (unit to unit).
- **One portable pointer:** `unit-run:<unitRunId>/<role>` in `unit.inputs`.
- **One resolver:** a new module in the Execution Core (`src/runner/execution/handoff-refs.mjs`). It replaces `role-input-refs.mjs`.
- **Resolve once, when the Unit run is created.** Store the result in `unit.json` as `resolvedInputs`. Do not resolve again on every dispatch.

Corrections to the earlier proposal:

1. **There is no `evidence.report` field today, and we should not add one.** Fact 1 in the brief is wrong on this point. `role-input-refs.mjs:10-11` still guesses the report by file-name regex. But settlement already writes a typed, hash-bound report record: `runResult.settleReports = [{ path, sha256 }]` (`settlement.mjs:524-541`, kept by `run-result.mjs:602`). It only contains a report that passed `isSubstantiveReportText`. Older code already checks it by hash (`operation-choice.mjs:262-300`). Reuse it. A new `evidence.report` field would be a second name for the same fact, which RUL11 forbids.
2. **The Workflow store loses the unit run id.** The `unit.complete` event carries `unitRunId` (`runner.mjs:313`). But the projection never copies it (`store.mjs:183-188`). `unit.scheduled` sets `unitRunId: p.unitRunId`, and that payload has no such field, so it is always `undefined`. `buildUnitObjective` cannot emit `unit-run:` refs until `store.mjs` records the id on `unit.complete`.
3. **Resolve in the Execution Core, not in patterns and not in dispatch.** Patterns pass result objects they already hold. Dispatch knows nothing about Unit runs (it sits one layer lower). Detail is in §3.

Rejected alternatives:

- **A separate manifest file of inputs (`inputs.md`):** rejected. `contextRefs` already is the manifest. It is persisted in `assignment.json` and rendered in the brief's "Context refs" section. A second list would drift from it.
- **Copying reports into the role's own assignment dir:** not now. That is the right shape for anonymized seats (council primitive B) and for an executor on another host. When either arrives, it goes into the same resolver, so the resolver is the single place to switch. Nothing needs it today.

## 2. Trust boundary check (`docs/routing-handoff-contract.md`)

Does handing a worker a `.fgos/assignments/...` path widen what it may read? **No.** Reasons:

- The contract (§"Ranh giới tin cậy") says containment is by instruction plus a disposable branch, not a sandbox. Workers run as the same user. The constraint forbids **writing** `.fgos/` and calling `fgos`. It does not forbid reading.
- Under confinement, bwrap mounts `--ro-bind / /` (`confinement/drivers/bwrap.mjs:403`). The confinement spec only supports `hostRead: allow` today (`docs/specs/confinement-authority.md:126, 1176`). Every confined worker can already read every run dir. A path in the brief grants nothing new. It only points at something already readable.
- Writes stay impossible. Only the worker's own `outbox` / `worker-output/outbox` is bound writable (`resources.mjs:158-200`).

Real risks this design must handle:

- **A report can change after settlement.** A herdr pane that stopped on a provider limit is left open (`run.mjs` fallback comment). It can still write its own outbox. The resolver must check the report's `sha256` against `settleReports` and refuse on mismatch. This reuses the `operation-choice.mjs` check.
- **Main checkout under `/tmp`.** bwrap mounts a tmpfs over `/tmp`, so a checkout there makes every `.fgos` path invisible to confined workers. This already breaks today's inline path and today's panel refs. It is not new. Name it in the spec line, nothing more.
- **Workers on other hosts.** None exist. Every confinement resource has `executionTarget.location: 'host'`. When a remote executor ships, absolute host paths stop working. That is the trigger to switch the resolver to copy-and-ship. The trigger goes in the spec text.
- **Future `hostRead: deny`.** Resolved refs are concrete absolute paths stored in `assignment.json`. Confinement can later turn exactly that list into `--ro-bind` grants. That is one more reason to resolve before the assignment is written.
- **Blindness (finding 1).** This design neither helps nor hurts it. Panelists can already read their siblings' outboxes.
- **Prompt injection from an earlier report.** Same trust as today's inline pasting: the same user's own work, read by the next worker. No change.

## 3. Where `unit-run:` resolution lives and how it behaves

### Module layout

- `src/runner/execution/unit-run-history.mjs` (new): `readUnitRunHistory(unitDir)`. Extract the `history()` closure body from `run.mjs:233-275` unchanged. `run.mjs` then calls it. Two readers need one answer, and importing from `run.mjs` would create an import cycle.
- `src/runner/execution/handoff-refs.mjs` (new; replaces `role-input-refs.mjs`, which is deleted along with its test):
  - `reportRefOf(record, mainRoot)` turns one role record into one absolute path.
  - `resolveUnitInputs(inputs, mainRoot)` turns `unit.inputs` into concrete refs. A repo-relative path passes through unchanged. A `unit-run:` ref becomes an absolute path.
- `run.mjs` / `runUnit`: for a new run, call `resolveUnitInputs` after `validateUnit`, **before** creating the unit dir. Write the result to `unitRecord.resolvedInputs` in `unit.json`. A resume reads it from there. The refs a role saw never change across resume or fallback, matching how `bindings` already work.
- `dispatchBound`: `contextRefs = dedupe([...unitRecord.resolvedInputs, ...roleInputs.map(r => reportRefOf(r, mainRoot))])`.

### Behaviour

| Case | Behaviour |
|---|---|
| Run dir `.fgos/assignments/<id>` missing | Throw `RunnerConfigError('unit-run-ref-unresolved: <ref>: no-such-run')`. No dispatch, no half-made unit dir. |
| Role has no settled record in that run | Same error, reason `no-such-role`. |
| Role has several rounds | Take the highest round. Within a round, take the latest fallback attempt (`history()` already does this). For `reviewed`, the highest producer round is the accepted one. No `#round` grammar: YAGNI. |
| Record has a settled report | `settleReports[0].path`, made absolute. Re-hash the file. On mismatch throw, reason `report-changed-after-settle`. |
| No report, but a claim | The claim path. Settlement only lists two artifact kinds, so without a report the only remaining artifact is the claim. No file-name regex. |
| Inline producer record (`recordInlineRun`) | Its `evidenceRefs`, made absolute against that run's `unit.json` worktree. |
| Nothing at all | Throw, reason `no-report`. Never pass a non-path string and never drop silently. Both are the bug class being fixed. |

In-run inputs (`panel`, `reviewed`) go through the same `reportRefOf`. Today a role without artifacts is skipped silently. After this change, it throws. In practice a passing role always has at least a claim, so this only fires on a real contract break.

## 4. Inline text that stays, and Workflow consumers

`buildUnitObjective` becomes `buildUnitHandoff()` and returns `{ objective, inputs }`.

- **`objective`** = template objective, plus `Owner request:` (unchanged), plus an index of earlier steps. Each earlier unit gets one heading line, `### <step> / <unit> (unit run <unitRunId>)`, then `Summary: <agentClaim.summary of its final result>`, then one line: "Full reports of every role are listed under Context refs; read them before answering."
  - The summary stays inline. It is short, schema-required (`agent-result-claim-contract.mjs:11`), and it is a floor if a model skips the files. It is not a second carrier of the report.
  - The unit run id in the heading lets the worker match each heading to its ref paths. Each path contains `/assignments/<unitRunId>/<role>/`.
- **`inputs`** = for every unit of every transitive dependency step (same `collect()` walk as today), each distinct role in its `results`, in order, as `unit-run:<unitRunId>/<role>`. For a panel step this is every panelist plus the synthesizer, which fixes the dropped-panelist bug.
- **Delete:** `PRIOR_REPORT_CHAR_LIMIT`, the `fs.readFileSync` of the report, the `endsWith('agent-report.md')` lookup, and the false comment ".fgos is closed to workers" (`runner.mjs:26-31, 54-61`).

Consumers of the pasted text: **none.** `src/workflow/` has no `outputs`, `when`, or condition logic. The human gate (`runner.mjs:177`) parks on `step.gate.question` and never reads results. `answerWorkflow` stores the answer, and it is not handed to later units today. That is a separate gap, out of scope. `results` are read only for the refusal reason (`runner.mjs:330`). No skill parses "Output of earlier steps".

Live evidence confirms the bug: `plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca3/unit-runs/*/unit.json` objectives hold only `Summary:` lines. There is no report text, because herdr wrote `outbox/report-N.md` and the lookup missed it, and there are no panelists.

## 5. Smallest first slice

One commit series on one branch. Order matters.

1. **Store:** `src/workflow/store.mjs`. On `unit.complete`, set `units[unitId].unitRunId = p.unitRunId`. Drop the dead `unitRunId: p.unitRunId` from `unit.scheduled`.
2. **History extract:** add `src/runner/execution/unit-run-history.mjs`. `run.mjs` `history` calls it. No behaviour change.
3. **Resolver:** add `src/runner/execution/handoff-refs.mjs`. Delete `src/runner/execution/role-input-refs.mjs` and `test/runner/execution/role-input-refs.test.mjs`. Add `test/runner/execution/handoff-refs.test.mjs`.
4. **Wire:** `src/runner/execution/run.mjs`. Add `resolvedInputs` at creation, persisted in `unit.json`. `dispatchBound` uses `resolvedInputs` plus `reportRefOf` on role inputs.
5. **Workflow:** `src/workflow/runner.mjs`. `buildUnitHandoff`, and set `unitData.inputs`. Delete the inline path.
6. **Docs:** see §7, plus a `CHANGELOG.md` `[Unreleased]` line: "Workflow steps now hand every earlier role's full report to the next step as context refs; nothing is truncated or dropped."

Not in this slice: per-role `rUnit.inputs` (finding 5), YAML `persona`/`params` pass-through (finding 3), copy/anonymize (primitive B), read confinement (primitive D).

## 6. Acceptance tests

Run the hermetic tests with `env -u CLAUDE_CODE_SESSION_ID` (see the memory note on non-hermetic `npm test`).

1. **`handoff-refs.test.mjs`:**
   - A settled report gives an absolute path.
   - An edited report (hash mismatch) throws `report-changed-after-settle`.
   - No report gives the claim path.
   - An inline record gives its `evidenceRefs`, made absolute.
   - An empty record throws `no-report`.
   - `unit-run:` with no dir throws `no-such-run`. With an unknown role it throws `no-such-role`.
   - Rounds 1 and 2 give round 2. A `1-fb1` attempt beats `1`.
   - Repo-relative inputs pass through unchanged.
2. **`run.test.mjs`:**
   - Unit B with `inputs: ['docs/a.md', 'unit-run:<A>/producer']`: B's `assignment.json` `contextRefs` equals `['docs/a.md', <abs A report>]`, and `unit.json.resolvedInputs` holds the same list.
   - A bad ref throws before any `.fgos/assignments/<B>` dir exists.
   - `--resume` reuses the stored list.
   - The existing panel test still lists 3 panelist refs.
3. **`workflow-runner.test.mjs`, rewrite "request flows through"** (`test/workflow/workflow-runner.test.mjs:395-458`). Prompt 2:
   - must **not** contain `FINDING-FROM-FIRST-STEP`;
   - must contain `first step summary` and `unit run unit-run-`;
   - must contain an absolute path that ends in the step-1 report, and that file must contain `FINDING-FROM-FIRST-STEP`.
4. **New Workflow test:** a panel step, then a solo step. The solo step's `assignment.json` `contextRefs` lists 4 reports (3 panelists plus the synthesizer).
5. **`store` test:** after `unit.complete`, the projected unit has `unitRunId`.
6. **Guard:** `rg "PRIOR_REPORT_CHAR_LIMIT|endsWith\('agent-report.md'\)|REPORT_NAMES|role-input-refs" src test` returns nothing.
7. **Live check on a cheap executor**, two Units through the real door. Pin glm with `--override '{"scope":{},"executor":"glm","invocation":"pi-cli-bwrap-openrouter"}'`; check the exact override field names against `bind.mjs` `findMatchingOverride`.
   - Unit A (read-only, solo): "Write token `HX-<random>` only in your report body; your summary must not contain it."
   - Unit B: `inputs: ['unit-run:<A id>/producer']`, "State the token found in the earlier report; do not guess."
   - Pass when all of these hold:
     - B's report contains the token.
     - B's `assignment.json` `contextRefs` holds A's absolute report path.
     - B's objective does not contain the token.
     - `unit.json` bindings show glm ran both Units.
   - Optional, costlier: one `architecture-advisory` Workflow run, checking that the critique step's `contextRefs` list all panelist reports.

## 7. Spec and docs text

- **`docs/specs/runner.md:1421`:** replace the paragraph. Draft:
  > **Truyền kết quả giữa các vai và giữa các bước — một cơ chế.** Kết quả trước luôn tới worker sau dưới dạng đường dẫn tuyệt đối, chỉ đọc, tới report của vai đó, trong `contextRefs` của assignment. Trong một Unit run, pattern truyền kết quả vai (`runRole({ inputs })`). Giữa các bước Workflow, runner ghi `unit.inputs = ['unit-run:<unitRunId>/<role>', ...]` cho mọi vai của mọi unit thuộc các bước phụ thuộc; objective chỉ giữ yêu cầu của chủ và một dòng `Summary` cho mỗi unit trước. Một chỗ duy nhất phân giải (`src/runner/execution/handoff-refs.mjs`): report đã settle (`settleReports`, kiểm sha256), không có thì claim; vòng cao nhất; run/vai/report thiếu thì từ chối trước khi dispatch. Danh sách đã phân giải ghi vào `unit.json` (`resolvedInputs`), resume dùng lại. Đường dẫn trỏ vào `.fgos/assignments/` của main checkout, đọc được vì `hostRead: allow`; khi có executor chạy máy khác hoặc `hostRead: deny`, resolver chuyển sang chép report vào thư mục assignment — vẫn một chỗ.

  Also state the `unit-run:<unitRunId>/<role>` grammar in the Unit contract text. Today the spec never mentions it. Add a "Lịch sử quyết định" entry: the inline 6000-char path was deleted, and why.
- **`docs/routing-handoff-contract.md` §"Ranh giới tin cậy":** add one bullet:
  > Context refs tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới `.fgos/assignments/` của main checkout; worker chỉ đọc, không ghi; runner kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn đọc được (`--ro-bind / /`, `hostRead: allow`).
- **`docs/platform/component-boundary.md`:** **No component-boundary change.** The Workflow already calls `runUnit` and only emits the Execution Core's own input grammar. The resolver reads only Execution Core storage (`.fgos/assignments`). Dispatch and Confinement only consume absolute paths, as today.

## 8. Risks and rollback

- **Models that do not open refs.** There are only two live proofs so far. Mitigations: the inline summary floor, the explicit "read them" line, and live check 7. If a model ignores files, that is an executor-quality finding, not a reason to paste text again.
- **Uncommitted edits in the shared main checkout.** `test/workflow/workflow-runner.test.mjs` (plus `fgos-help`, `fgos-manifest` tests) has uncommitted changes from another session. The implementer must build on top of them or wait for that commit. Do not overwrite them.
- **Detach branch** (`worktree-agent-a630ba0a811d844e4`, `1508a7d49`): no collision. It only touches `startWorkflow` / `prepareWorkflowRun` (`runner.mjs` ~396-490) and `index.mjs`. This slice touches `runner.mjs` 26-70 and 250-262 plus `store.mjs`. The detached `workflow resume` runs on the same host and `mainRoot`, so resolution behaves the same. Either merge order works.
- **In-flight Unit runs** without `resolvedInputs` fail on resume with a named error (single user, no back-compat). Old Workflow runs are fine: their `unit.complete` events already carry `unitRunId`.
- **Prompt growth.** A late step gets refs for all transitive earlier roles. Paths are cheap, and the worker decides what to read. Revisit only if it hurts.
- **Rollback:** revert the series. There is no data migration. `unit.json` gains one field, and the Workflow events are unchanged.

## Unresolved questions

- Should a Workflow step see only direct dependencies' reports instead of transitive ones? I kept transitive to match today's behaviour. That is a product choice for the owner.
- Should gate answers (`answerWorkflow`) reach later units? Today they do not. Separate item.
