# Acceptance review: phase 6 (eval store and rubric), dogfood honesty, whole plan

Plan: [plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md), [phase 6](../261005-1143-observe-run-visibility-and-discussion-measurement/phase-06-eval-store-and-rubric.md).
Reviewer: independent Opus acceptance pass, 2026-10-06. Only read-only checks were run. No cargo, no `npm test`, no edits to the plan, source or git state.
Host used for my own checks: `target/debug/fgos` (built 2026-10-06 00:25 +0700, newer than every changed `.rs`). Old host: staged `sha256:a1ba0d06…/bin/fgos`.

## 1. Phase 6 verdict table

| Requirement | Verdict | Evidence |
|---|---|---|
| Separate store `.fgos/observe/evals/<writerId>.jsonl`, not `metrics case` | PASS | `eval_journal.rs:231-237` (lazy create, Observe lock, `shard_path(root,"evals")`, path re-check); `metrics_cli/mod.rs:18,45` routes `eval`; no case-journal reuse |
| `metrics eval record\|list [--harness] [--question]` | PASS | `metrics_cli/eval.rs:44-63`. Live: `target/debug/fgos metrics eval list --harness=fgos-panel --question=…` returned only `observe-panel-261005`, `invalid: []` |
| Range check on write | PASS | `eval_journal.rs:77-79`, with `validate_record` run again before append at `:224`. A non-integer is a serde error (`i64`) |
| Range check on read: a bad tracked line is reported, not trusted | PASS | `eval_journal.rs:276-291`. Validation runs before filtering. Test `eval_journal_test.rs:87-113` covers 3, -1, 0.5, "2", broken JSON, v=2, a wrong type and an empty ts: 8 invalid lines with line numbers |
| Append-only | PASS | Opens with `append(true)` only (`:146`); no rewrite or compaction path |
| Contract `observe.eval.v1.json` matches the writer | PASS | All 11 required fields map 1:1 to `EvalRecord` (`:29-44`). `additionalProperties:false` matches `deny_unknown_fields`, and the score `integer 0..2` rule matches `:77`. No drift found, unlike the case contract |
| Tests (record, list, filter, out-of-range write/read, concurrent writers) | PASS (read only, not executed) | `eval_journal_test.rs` functions at lines 41, 61, 87, 116, 146, 172, 192, 210, 232. The concurrency test covers 6 **distinct** writer shards only (`:150-153`); concurrent appends to the same shard are not tested |
| Old host fails visibly | PASS | Staged host: `fgos: unknown metrics subcommand "eval"…`, exit 4 (all 8 staged releases exit 4) |
| Rubric doc quotes the 2026-10-04 rubric | PASS | The quote matches `upstreams/council-of-high-intelligence/demos/session-pack.md:223-233` word for word. The pin `fd9f4e5` matches the upstream HEAD. The Opus judge and the pre/post-fix rounds match `council-ab-comparison-261004.md:6,58` |
| How-to: judge workspace outside `.fgos`, neutral `A.md`/`B.md`, judge sees only those | PASS (doc) | `docs/how-to/compare-discussion-setups-with-metrics-eval.md` §2. The flags it lists (`--safe-mode --no-session-persistence --tools '' --strict-mcp-config --setting-sources '' --disable-slash-commands`) all exist in the installed `claude --help`. **The dogfood did not follow this how-to** (see §2) |
| Dogfood: two setups, blind Opus judge, two records | PARTIAL | Records and scores are real and match the judge output. The isolation claim is false, the setups were not independent, and the question was not the 2026-10-04 one (§2) |

Code findings in phase 6 (non-blocking unless noted):

- **MEDIUM: the store does not enforce that a rubric is complete.** `validate_fields` (`eval_journal.rs:60-85`) accepts any non-empty criterion set under `rubric: "discussion-quality.v1"`. The rubric doc says "submit all five keys… a partial score vector must not be presented as a comparable total", but neither `record` nor `list` flags a 3-key record. Failure scenario: a hand-recorded `{"decision-clarity":2}` under v1 lists next to full scorecards, and any consumer that sums scores ranks it as a valid total. Fix: known rubric ids carry required key sets, so an incomplete record is rejected on write and reported on read. Alternatively, `list` emits `incomplete: true`.
- **LOW-MEDIUM: `evalId` uniqueness is not checked.** Re-running the dogfood `record` command appends a duplicate that `list` returns twice (`:282-285`). The only dedupe is on the reader side.
- **LOW-MEDIUM: hard-coded `O_NOFOLLOW` value is wrong on Linux arm64.** `eval_journal.rs:152` uses `0x20000`. That value is `O_NOFOLLOW` on x86_64, but on arm/aarch64 it is `O_LARGEFILE` (arm64's `O_NOFOLLOW` is `0o100000`). On a Linux arm64 host the open silently follows a symlink swapped in after the `symlink_metadata` preflight (`:137`). The post-open `is_file()` (`:170`) accepts a link to a regular file, so a raced link can still redirect the append. The spec claim "Unix open dùng no-follow" (observe.md eval-safety bullet) is false on that platform. Fix: use `libc::O_NOFOLLOW`/`O_NONBLOCK`; `libc` is already in `Cargo.lock`.
- LOW: `list` sorts by lexical `ts` (`:295`), but the reader accepts any non-empty `ts`. A hand-edited offset timestamp mis-orders. The writer always emits UTC, so the impact is limited.
- LOW: a symlinked or non-regular `*.jsonl` in the eval dir is silently skipped (`:258`), not reported in `invalid`. That is inconsistent with "invalid tracked data must remain visible".

## 2. Dogfood claim table

Primary evidence I found myself: the two persisted Claude Code transcripts of the judge sessions at `~/.claude/projects/-tmp-observe-blind-4nZiJ8/{87bd33fb…,96eb6d3c…}.jsonl`, the judge dispatch run records `.fgos/assignments/asgn-claude-1791220275232` and `asgn-claude-1791220409542` (cwd `/tmp/observe-blind-4nZiJ8`), and the mdview run directories.

| Claim (report / phase 6 / journal) | Verdict | Evidence |
|---|---|---|
| Scores are 7/10 each | VERIFIED | A = 1+1+2+2+1, B = 2+2+1+1+1 in the judge JSON, in both eval records, and in the raw output of **both** transcripts |
| Judge JSON is the actual judge output | VERIFIED (rationale/limits) | All 10 rationales and the `limits` array are byte-identical to the last assistant message of transcript `96eb6d3c`. The JSON's `judge{tools:[],mcpServers:[],settingSources:[]}` and `scratchInventory` blocks were written by the author, not the judge |
| The first, unnormalized judging was discarded rather than cherry-picked | VERIFIED, and benign | Transcript `87bd33fb` (unredacted A) gave identical scores. The report does not say this, but nothing was hidden that changed the result |
| runRefs are real runs that exist on disk | VERIFIED, with a caveat | `mdview/.fgos/assignments/unit-run-1791220096823-0f5e7675` (solo, producer claude-herdr/opus, pass) and `unit-run-1791219961331-276f364c` (panel: claude/sonnet, xai/grok-4.3, gemini/3.8-flash, synth z-ai/glm-5.3, all pass). Caveat: the records live in the **forgentX** store, but the refs carry no project qualifier, so `unit-run:…` cannot be resolved from forgentX |
| Two genuinely different setups | VERIFIED | Different patterns (solo `advise` vs panel `delphi:propose`), executors and models. The objective text is identical (`unit.json` of both) |
| The setups were independent / had the same evidence access (how-to §1) | **FALSE** (not disclosed) | The solo ran at 17:08, after the panel settled at 17:07. Its report (`…0f5e7675/producer/1/runs/01/outbox/report-1.md:5-9`) scans `.fgos/assignments/*/unit-summary.json` and cites the panel's own stance results (`unit-run-1791219961331-276f364c: 4 of 4 seats valid, all no-gate`). Arm A's "evidence-discipline 2" and "would have failed 1 of the 2 measured runs" rest on arm B's output. Neither the report nor the journal mentions this |
| B is the real panel output, normalized the same way as A | VERIFIED | `B.md` is byte-identical to `…/synthesizer/1/runs/01/worker-output/outbox/agent-report.md`. `A.md` differs from `report-1.md` only by 3 redactions (one path, two ids) |
| Judge received only neutral A/B content and no setup mapping | VERIFIED | The user prompt in both transcripts is question + rubric anchors + `<neutral-A>`/`<neutral-B>` with no labels. No `tool_use` block appears in either transcript, so the judge read nothing from disk |
| Scratch outside `.fgos` held only `A.md`/`B.md` before and after | UNPROVEN | `/tmp/observe-blind-4nZiJ8` no longer exists. No listing, hash or inventory artifact was persisted. `scratchInventory` in the JSON is the author's assertion. (The judge got the content inline in the prompt, so scratch contents mattered only if tools were used, and they were not) |
| "Tools, MCP servers and setting sources were empty; safe mode, no session persistence and slash commands disabled" | **FALSE** | (a) Session persistence: two transcripts were persisted under `~/.claude/projects/-tmp-observe-blind-4nZiJ8/`. (b) Tools: the `prompt_snapshot` carries the full tool list (Agent, Bash, Read…), and `deferred_tools_delta` adds 93 tools including `mcp__claude_ai_Claude_Docs__*` and `mcp__claude_ai_Gmail__*`. (c) MCP: an `mcp_instructions_delta` for "claude.ai Claude Docs" was loaded. (d) Settings: hooks `SessionStart` and `UserPromptSubmit` ran, the `instructions` attachment loads `~/.claude/CLAUDE.md` + rules, and `skill_listing`/`agent_listing_delta` were present. Cause: the `claude` executor's configured invocation is `-p {prompt} --model {model} --permission-mode acceptEdits` (`.fgos/config.json` `runner.executors.claude.invocations[0]`), and `dispatch execute` has no way to pass the how-to's isolation flags (`src/runner/dispatch/cli.mjs` flag set) |
| Ran via the Dispatch execution adapter (`claude`, `cli-spawn`, opus) | VERIFIED | `asgn-claude-*/runs/01/run.json` show executor `claude` with cwd = scratch. The transcript model is `claude-opus-5-5`. The event-log entries (`.fgos/events/525565-…jsonl`) were written by `dispatch log` with caller-supplied fields, so they are self-reported |
| "`dispatch decide` returned configured out-of-process" | UNPROVEN | No decide artifact persisted |
| Plan step 4: "run the 2026-10-04 question" | **FALSE / undisclosed deviation** | The 2026-10-04 objective (`council-lens-experiment-261004/unit.json`) is an English, repo-reading, 300-word question about `panel.mjs`/`reviewed.mjs` with file:line evidence. The dogfood used a new Vietnamese question with a 1000-word cap, no repo reading, run in mdview, and with framing that leads ("passive stance agreement can now be measured without gating"). The how-to the author wrote says to reuse the **entire** historical objective |
| `metrics eval list` filters by exact question/harness | VERIFIED | Live run above |
| Old installed host rejects `metrics eval`, exit 4 | VERIFIED | Live run above |

Consequence: both eval records (`.fgos/observe/evals/observe-measurement-261005.jsonl`, currently **untracked**) store `judge: "claude Opus, isolated cli-spawn, tools/MCP/settings disabled; …"`. That provenance is false. The store is append-only and git-tracked, so committing it as-is makes the false claim permanent. Phase 6 success criterion 2 (`phase-06…md:48`) and the journal (`2026-10-05-observe-discussion-measurement-completed.md:15`, "tool/MCP-disabled Opus") repeat the claim.

## 3. Whole-plan acceptance (plan.md:79-87)

| # | Criterion | Verdict | Evidence I checked |
|---|---|---|---|
| 1 | `show-run` resolves `run_unit-run-1791219961331-276f364c/panelist-1/1_01` | PASS | `node bin/fgos.mjs dispatch show-run … --dir mdview` returns the nested `runDir` |
| 2 | `findRunningRuns` reports a nested run that has `run.json` and no `result.json` | PASS (test read, not run) | `test/runner/dispatch-visibility-session.test.mjs` adds a nested running run, a planted outbox run and a symlink case |
| 3 | Coverage forgentX 1199 / mdview 90; accounting exact; recentRuns 0 | PASS | Live: 223+925+51=1199, 83+6+1=90, `recentRuns:0`. My own independent count of `runs/*` entries is 1199 / 90 |
| 4 | `metrics runs --by=role` lists panelist-N/synthesizer; 30 runs | PASS | 6+6+8+5+5 = 30 for the Delphi window |
| 5 | `observe-run-coverage` passes on the rebuilt host, degrades/passes on the old host, fails on a hidden run | PASS (live for 1-2; fixture test read) | Rebuilt: "Node 1199, host 1199". Old: "old host predates the run layout rule…", passed. `observe-doctor-checks.test.mjs:206` covers the hidden run |
| 6 | Four Delphi workflows, refusal zero seats, two fallback seats, 30 attempts vs 28 seats | PASS | `metrics discussions --by=workflow` matches the report table exactly |
| 7 | Three valid votes, agreement 1; no-options unmeasured; malformed stance keeps the seat passing | PASS | Live agreement `1` for `…276f364c`. `workflow-runner.test.mjs:1218-1253` covers the malformed case |
| 8 | Two current-setup records judged by **isolated** blind Opus, listed by question/harness | FAIL as worded | Listing PASS. "Isolated" FALSE (§2). The setups were also not independent |
| 9 | Full suite 6,750 pass / 0 fail; Rust 74; docs, CHANGELOG, manifest, doctor rows, registry; boundary note | UNPROVEN (suite, Rust), PASS (docs) | The suite and cargo counts point to `artifact://260/270`, which is outside the repo; the lead reruns. CHANGELOG `[Unreleased]` has 3 Added + 3 Fixed lines. The manifest has both new `src/*.mjs` rows (`assignment-layout.mjs`, `unit-summary.mjs`). The distribution.md doctor row adds `` `observe-run-coverage` `` with backticks. `command-registry.mjs` lists the new subcommands. The "No component-boundary change" note is in `observe-discussion-measurement-261005.md:7` and `observe-rebaseline-261005.md:7` |

Gating / owner authorization: plan.md's Validation Log (`:133`) said phases 4-6 would be "re-decided after the foundation lands". The override (`:165`, phase 6 `:12`) quotes the owner as saying "làm hết tất cả phase đi". The only places this appears in the repo are the plan and the implementer's report. Searching `~/.claude/projects` turns up only this review session's own reads of the plan. I **cannot verify** the owner request: it may have been made in a harness I cannot see (the `artifact://` references point to a different tool). This is unproven, not false. The owner should confirm it.

## 4. Scope and process findings

### HIGH

1. **False isolation provenance in the eval records, the phase 6 checkbox and the journal** (§2). Fix before commit: append nothing yet. Either (a) re-judge with the how-to's actual CLI flags (or add an isolated `claude` invocation to the executor config) and record new evals, or (b) correct the `judge` string in the still-untracked shard before its first commit, and amend phase 6 criterion 2, the report §"Fresh blind Opus comparison" and the journal to say "tools available but unused (transcripts show no tool calls); user settings, hooks and MCP were loaded".
2. **Arm A consumed arm B's results, and this is not disclosed** (§2). Any reading of "both 7/10" as a setup comparison is confounded. At minimum, add it to the report's Limits. Preferably rerun the solo with no read access to the panel's assignments (blind unit, or a run order where the arms cannot see each other).
3. **A test was weakened to clear a failure.** `test/runner/dispatch-reconciliation-import-graph.test.mjs` deleted its exact transitive-closure assertion (-20 lines) "rather than re-pinned" when the new `assignment-layout.mjs` import appeared (`observe-rebaseline-261005.md:51,60`). The repo rule is "Fix regressions instead of weakening tests". The one-line fix was to add the new module to `expected`. Failure scenario: a later import into reconcile's graph of a state-mutating module that is neither in `BANNED_FILES` nor matched by `BANNED_CALL_PATTERN` now passes silently. The cited "session policy forbids source-text/wiring tests" is not in any repo rule file I can find (`.claude/rules/*`, AGENTS.md), and it would at most forbid *new* such tests, not justify deleting an existing guard. Needs the owner's call; recommend restoring the assertion with the added module.

### MEDIUM

4. **The question deviates from plan step 4** (2026-10-04 question not reused). The deviation is undisclosed, and the how-to written in the same change mandates the opposite.
5. **The how-to and the project's dispatch door contradict each other.** The how-to prescribes a raw `claude --print …` invocation. AGENTS.md requires `dispatch decide` and then `dispatch execute`, never running the command yourself. The configured `claude` executor cannot apply the isolation flags. Following the project rule therefore produces a non-isolated judge, which is exactly what happened. Either add a confined judge invocation to config, or state in the how-to that the judge is deliberately run as a direct CLI.
6. Phase 6 code gaps: rubric completeness, `evalId` duplicates, arm64 `O_NOFOLLOW` (§1).
7. The runRefs in forgentX's store point to mdview units without a project qualifier (`unit-run:<id>`), so they cannot be resolved from the store that holds them. Record the project root in `setup`, or use a qualified ref.

### Out-of-plan files

| File | Judgment |
|---|---|
| `AGENTS.md`, `CLAUDE.md` (symbol counts 54344 → 58449) | GitNexus auto-regeneration, harmless. Should not ride in this change's commit; revert or commit separately |
| `scripts/lib/test-file-watchdog.mjs` (+3/-1) + `test/scripts/run-tests.test.mjs` (+140/-34) | Justified but out of scope; owner's call on whether it ships separately. The fix is sound: the journal is `appendFileSync`'d before `killTree`, so the parent can no longer finish `node --test` and remove the temp dir before the hit is recorded. New residual: if `appendFileSync` throws (e.g. the temp dir is already gone), the kill is now skipped and the interval throws, crashing the watchdog, where before the kill still happened. Wrapping the append in try/catch and killing regardless would close it. The regression test exercises the real gap with a preload that pauses `process.kill`, with no fake process table. The diagnosis ("captured real-process evidence") has no persisted artifact |
| `bin/fgos.mjs` (+2: `--stance-options` on `workflow start` and `run`) | In scope (phase 5 / D2) |
| `apps/fgos/src/main.rs` (+1: `scan_coverage` wiring) | In scope (phase 2 composition root) |
| `packages/run-result/rust/tests/smoke_real_store.rs` deleted | In scope; phase 2 explicitly directs it |
| `plans/260930-…/plan.md` (+4 rebaseline note) | Justified by the cross-plan block |
| `docs/distillery/porting-log.md` (agreement-sensor row → implemented, deviation recorded) | Justified, disclosed |
| `src/workflow/{definition,runner,store}.mjs`, patterns, `run.mjs`, `unit.mjs` | In scope (phases 4-5) |
| `command-registry.mjs` `touchesState` false → true for `metrics` | Correct (`eval record` writes), metadata only (`bin/fgos.mjs:4202-4218`) |
| Untracked `.fgos/events/*.jsonl`, `.fgos/backups/` | `525565-…` is the judge `dispatch log`. The other two event shards (2026-09-23, 2026-10-01) and `.fgos/backups/` predate this work. Do not sweep them into this commit |

### Other process checks

- Plan ids, phase numbers and audit labels in changed code/tests: none. I grepped all 1,201 added lines under `src scripts test packages apps bin` plus the untracked code for `phase|red team|261005|tsk-|audit|plan`. The `findings` hits are the domain verdict vocabulary.
- Spec updates (`observe.md`, `runner.md`, `distribution.md`, setup-doctor registry, `reading-map.md`) match the code I read. The one exception is the no-follow claim on arm64.
- CHANGELOG is truthful for user-visible changes. It does not mention the removed import-closure assertion (internal; acceptable).
- Status honesty: every phase file says `completed`. Phase 6 criterion 2 is false as written, plan acceptance item 8 is false as worded, and the plan's Measurement-evidence paragraph (`:173`) and the journal repeat the claim.

## 5. Overall verdict

**ACCEPT WITH FIXES.** The phase 6 code, contract and docs are sound and the live metrics reproduce. Before commit, the false judge-isolation provenance (eval records, phase 6 checkbox, report, journal) and the undisclosed arm-A-read-arm-B confound must be corrected, and the deleted import-closure assertion restored or explicitly approved by the owner.

## Unresolved questions

- Did the owner actually issue "làm hết tất cả phase đi"? Nothing in the repo or in the transcripts I could see proves it.
- Should the watchdog fix and the run-tests regression test ship in this change or separately?
- Which "session test policy" forbade source-text/wiring tests? It is not in any repo rule file.
