# Re-acceptance: eval fixes, independent A/B evidence, whole-plan honesty

Plan: [plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md). Prior review: [opus-acceptance-review-phase6-and-honesty-261006.md](opus-acceptance-review-phase6-and-honesty-261006.md). Fix ledger: [observe-acceptance-fixes-261006.md](observe-acceptance-fixes-261006.md).
Reviewer: independent Opus re-acceptance, 2026-10-06. Scope: `git diff b3346957a..HEAD` (8 commits, 842287533 to f304d57d5). I did not modify the repo or git state. No cargo, no `npm test`. Host used: `target/debug/fgos`, built 11:34:59, which is newer than `eval_journal.rs` (11:32:16). Negative-path probes ran only against a throwaway root in my session scratchpad.

## 1. Eval-fix table

| Fix | Verdict | Evidence |
|---|---|---|
| `discussion-quality.v1` requires exactly five keys on write | PASS | `eval_journal.rs:89-94` (len==5 and every key present), called from `validate_input` and from `validate_record` (`:239`). Live run: a partial record exits 1 with "must contain exactly its five criteria" and `.fgos` is not created. Test `eval_journal_test.rs:317` covers each missing key, an extra 6th key, and a custom rubric staying free-form |
| The same rule on read | PASS | `list` → `validate_record` (`:312`) before filtering. Test `:336` uses a partial record that falls outside the filter and is still reported as invalid |
| Duplicate `evalId` refused across shards under the shared lock | PASS | `:246-256`: lock (`acquire_store_lock`, the same lock used by `case_journal.rs:261,334` and `friction.rs:289,340`), then `list(None,None)` over all shards, then a duplicate check, then append, all under one guard. Live run: the same id from a different `FGOS_SESSION_ID` shard exits 1 with "duplicate evalId: x1". Tests `:352` (cross-shard, bytes unchanged), `:419` (two processes, outcomes exactly [0,41]), `:387` (6 processes / 1 shard / 30 records, no tearing) |
| Reader dedupe + unsafe shard visibility | PASS | `:316-323` (first lexical record wins, later ones become invalid); `:285-294` (a non-regular `*.jsonl` is reported as line 0, not followed). Test `:438` |
| libc no-follow constants per target | PASS (compile-only) | `:168,174` use `libc::O_NOFOLLOW \| libc::O_NONBLOCK`; dependency `packages/observe/rust/Cargo.toml:14-15` (`cfg(unix)`), workspace `libc = "=0.2.189"`, `Cargo.lock` adds `libc` to `fgos-observe`. On aarch64 Linux, libc's constant is `0o100000`, so the earlier wrong value is gone. The aarch64 `cargo check` is claimed in the ledger (`artifact://405`), and I did not re-run it |
| Contract matches the writer | PASS | `observe.eval.v1.json` `allOf/if rubric==discussion-quality.v1 → scores.required[5] + maxProperties 5` matches `:89-94`. Uniqueness is stated in the description as not expressible in the schema. No contract-vs-writer test exists (none before either) |
| Live store | PASS | `metrics eval list` returns 4 records (`observe-solo-opus-261005`, `observe-panel-261005`, `observe-independent-solo-261006`, `observe-independent-panel-261006`) and `invalid: []` |

New gaps in the fix (none blocking):

- **LOW: a torn line freezes the eval store.** `record` refuses to write when `existing.invalid` is non-empty (`:254-256`). `write_all` (`:262`) is not rolled back on a short write (ENOSPC, kill mid-write). I reproduced this in scratch: after appending `{"broken` to a shard, every later `record` exits 1 with "cannot establish evalId uniqueness…". The error does not name the file or line, and no repair verb exists, so the only fix is hand-editing an append-only, git-tracked file. observe.md:64 documents this as intended fail-closed behavior. Fix: put file/line in the error, or truncate back to the pre-write length on a failed `write_all`.
- LOW: `record` re-reads every shard while holding the global Observe lock, so case and friction writers wait O(store) time. The store is small, so this is acceptable today.
- LOW: the read side still preflights with `DirEntry::file_type()` and then `File::open` (follows links). This TOCTOU is explicitly disclosed (observe.md:65 "không tuyên bố chống mọi race").

## 2. A/B claim table (new evidence, `observe-independent-comparison-261006/`)

Primary sources I checked myself: the mdview run trees `unit-run-1791270002490-60cc7659` (solo) and `unit-run-1791270868625-812a0306` (panel), including each seat's `stdout.log`, `effective-execution-contract.json` and `protected/launch-envelope/*.json`; the judge run `asgn-claude-1791271898870/runs/01/run.json`; file birth/ctime stamps; `~/.claude/projects/` listings.

| Claim | Verdict | Evidence |
|---|---|---|
| (a1) Neither arm **read** the other's output | VERIFIED | Solo (`stdout.log`, tools `[Read, Write]`) read only its own packet copy. Panel tool calls taken from raw stdout: Sonnet read its packet plus 2 failed reads of `/var/tmp/.../panel.mjs` ("File does not exist"); xai read its packet plus a nonexistent `mdview/src/.../panel.mjs`; GLM read its packet plus 3 copied panelist reports; Gemini's sealed audit shows only its own seat. These match `completion-roster-and-access-audit.json`. Order: solo started 14:00:02 and wrote its report at 14:00:27; the panel started at 14:14:28 |
| (a2) Neither arm **could** read the other's output / prior results ("independent current arm", "blind confinement hides other runs") | **FALSE (capability), undisclosed** | Every seat's bwrap is `--ro-bind / / … --tmpfs mdview/.fgos/assignments` plus its own seat. That hides sibling mdview runs only. `forgentX` stays readable for solo, Sonnet, xai and GLM. Only Gemini's nested bwrap adds `--tmpfs /home/vantt/projects/forgentX`. `completion-contaminated-generation.json` (birth = ctime = 14:12:38, i.e. written in place, not moved later) contains the solo's verbatim claim summary ("Position: do not add a mechanical dissent/agreement gate… runner.md:1435…"), and it sat in `forgentX/plans/reports/…` readable by 3 of the 4 panel seats when they launched at 14:14:28. The 2026-10-04 historical answers to this exact question (`council-lens-experiment-261004/outputs/`) were readable by every non-Gemini seat. The how-to (`compare-…eval.md:111`) itself requires "hide previous reports/scores". Independence therefore rests on the read audit, not on enforcement |
| (b) Question is the 2026-10-04 one | VERIFIED (text); evidence condition differs | Both new records' `question` and `question.txt` are byte-equal to `council-lens-experiment-261004/unit.json .objective` (python equality check). However, the arms did not "Read the repo". They got a coordinator-curated 4-file packet (`source-packet.txt`, sha `9a93aa92…`, identical across all 5 seat copies, which I verified). That packet includes current `runner.md:1435` and `observe.md:61`, which state the post-2026-10-04 settled decision ("Agreement là phép đo passive, không gate workflow" + K2/K3/K5). Both arms then cite that line as their main reason. The question is the same, but the evidence condition is not the 2026-10-04 one. "Current-source packet" is disclosed. That the packet carries the answer is not |
| (c1) Judge ran with isolation flags | VERIFIED (self-captured) | `completion-judge-evidence.json .execution[0]` claude argv: `--safe-mode --tools '' --strict-mcp-config --mcp-config {"mcpServers":{}} --setting-sources '' --disable-slash-commands --no-session-persistence --include-hook-events`. The SDK init (same `session_id` 361f598e in transcript and evidence) shows tools/mcp_servers/skills/slash_commands `[]`, with 0 `tool_use` and 0 hook events. There is no `~/.claude/projects/-var-tmp-discussion-judge-*` directory, which is consistent with no persistence. Three builtin plugins are present and disclosed. Caveat: the judge run dir holds only `run.json` (cwd `/var/tmp/discussion-judge-nmGTTl`, 07:31:38→07:31:58Z, which corroborates). The transcript and argv were captured by a coordinator harness that has since been deleted, so they cannot be re-derived independently |
| (c2) Isolation config is in the repo | **No: ad hoc** | Neither mdview nor forgentX `.fgos/config.json` contains `safe-mode` today. The ledger confirms a temporary, byte-restored config. The capture helper scripts were removed (ledger :183). The how-to describes the flags in prose only. No committed invocation profile reproduces this judge |
| (d1) Record scores = judge output | VERIFIED | Transcript result JSON: A(solo) 1/2/2/1/1, B(panel) 1/1/1/1/1. Both match `completion-judgment.json` and both eval records exactly |
| (d2) A/B are the real outputs | VERIFIED | `completion-A.md`/`-B.md` are byte-identical to the solo and synth `agent-report.md` (diff rc 0). The solo report equals the worker's own `Write` content (2388 bytes). The hashes match the evidence's before/after entries |
| (d3) runRefs exist | VERIFIED | Both report paths and the evidence path exist. The owning project is qualified |
| (d4) Scratch contained only A.md/B.md before/after | UNPROVEN (self-attested) | `before`/`after` arrays exist in the coordinator JSON. The scratch dir is gone. The how-to (`:135-136`) itself says "an inventory assertion in a coordinator-authored JSON is not an independently retained listing". Content was delivered inline in the prompt and the judge had zero tools, so this matters little |
| (d5) Rejected judges | **Committed evidence contains a false statement** | `completion-data-blind-judge{,-2}-evidence.json` show default argv (`-p … --model opus --permission-mode acceptEdits`, no `--tools ''`). Yet their `limits` say "…verified by a **tool-disabled** judge", and `hookEventCount: 0` is meaningless without `--include-hook-events`. Both were label-swapped (A = panel), and both scored solo 7 and panel 6 / 5. They are directionally consistent replicates that the report never mentions |
| (e1) Old shard no longer false | VERIFIED | The 261005 records' `judge` reads "data-blind A/B, not isolated. Tools/MCP/settings available; hooks ran…". `setup` discloses the cross-arm consumption and the question deviation. This matches the prior review's transcript findings. IDs, ts and scores are preserved (hand-corrected before first commit, which is disclosed) |
| (e2) New shard has no false statement | MOSTLY. One overstated phrase | "independent current arm" overstates (a2). `runRefs` mixes in a non-run `evidence=…` entry against the contract's "run identifiers" meaning (LOW) |
| (e3) plan / phase-06 / report / journals consistent | PARTIAL | Journals and the 261005 report are consistent. `plan.md:87` still says "This gate does not … prove a fresh independent comparison", which contradicts `:86`. `phase-06:49` says the "retained scratch inventory [is] demonstrated", which contradicts its own how-to (see d4) |
| Limits stated (one question, one judge, directional) | VERIFIED | Ledger :176, judge `limits`, eval `judge` string. The word-count overrun (360/498 > 300) is disclosed |

Net: the new comparison is real, uses the right question text, has a correctly recorded score vector, and is directionally usable (solo 7 vs panel 5; the two un-isolated, label-swapped replicates agree: 7 vs 6, 7 vs 5). It is **not** an enforced-independence comparison, and it is **not** the 2026-10-04 evidence condition.

## 3. Whole-plan acceptance (plan.md:79-87 + phase-01 guard)

| # | Criterion | Verdict | My check |
|---|---|---|---|
| 1 | show-run resolves nested panelist run | PASS | `node bin/fgos.mjs dispatch show-run run_unit-run-1791219961331-276f364c/panelist-1/1_01 --dir mdview` returns the nested `runDir` |
| 2 | findRunningRuns sees a nested running run | PASS (test read, prior review) | Unchanged since prior review |
| 3 | Coverage forgentX 1199 / mdview 90 dated | PASS | Live forgentX: 1199 = 929 + 51 missing-result + 219 no-timestamp, recentRuns 0; `find` count 1199. mdview is now 123 (new comparison runs), and the criterion is worded as a dated snapshot |
| 4 | `metrics runs --by=role` 30 runs | PASS (prior review) | Not re-run |
| 5 | Doctor coverage check | PASS (ledger + prior review) | Not re-run |
| 6 | Four Delphi workflows, 30 vs 28 | PASS (partial re-check) | `metrics discussions --since=2026-10-05 --by=workflow` on mdview: summaryDirsSeen 52, unusable 4, missing 0 |
| 7 | Three valid votes, agreement 1; malformed stance keeps seat passing | PASS for the data; **the "real CLI-prompt regression" claim is FALSE** | The live summary has 3 `kind: panelist` seats, all valid `no-gate`. But see HIGH-1: the test no longer proves the prompt carries the options (`phase-05:48` claims it does) |
| 8 | Independent current setups + audited isolated judge | PARTIAL | Judge isolation VERIFIED (self-captured). Question text VERIFIED. Independence by audit VERIFIED, by enforcement FALSE (§2 a2) |
| 9 | Final suites (6,851/6,778/0 fail; Rust) | UNPROVEN | `artifact://453/456/431` are outside the repo. No production code changed after them (`6f043ee9d`, `f304d57d5` are docs/evidence only, which I checked with `git show --stat`) |
| G | Phase-01 source/import guard (`phase-01:68`, `[ ]`) | FAIL (open, disclosed) | Still unimplemented. The ledger names it as an open item, plan status is `in-progress`, and phase 1 is `in-progress`. It is not listed among the plan-level acceptance bullets (`:79-87`). It appears only in the `:75` prose |

"Reachable repairs complete" is **not quite honest**. The ledger is unusually candid about the guard, the old confounds and the failed attempts. But the discussion repair commit `b2c7b4588` deleted regression coverage without disclosure (HIGH-1), and the independence wording overstates what was enforced.

## 4. Process findings

### HIGH

1. **Undisclosed test weakening in `b2c7b4588`, and a false checkbox as a result.** `test/workflow/workflow-runner.test.mjs:1201-1252` was rewritten. The fake worker used to parse `Declared choices:` from the real delivered prompt and choose `options[1]`. Now it hardcodes `stance: {choice: 'full'}` (`:1211-1212`). The commit also deleted these assertions: the launch-envelope prompt contains the declared choices and the role task; the synthesizer prompt has no stance block; `unitRecord.workflow` / `summary.workflow` equal `{runId, stepId, unitId}`; `state.stanceOptions`; and `summary.stanceOptions`. `role-tasks.test.mjs` also lost its only stance-prompt test. `grep "Passive stance\|Declared choices" test/` now returns 0 hits. The only remaining linkage test (`unit-summary.test.mjs:33`) uses a fixture, not the runner.
   - Failure scenario A: `role-tasks.mjs:63-71` stops appending the stance block. Panelists never emit stance, every panel reads `unmeasured`, K2/K3 can never fire, and the suite stays green.
   - Failure scenario B: the workflow runner stops passing linkage. `metrics discussions --by=workflow` folds all units into `null`, and the suite stays green.
   - `phase-05:48` still claims a "real CLI-prompt/settlement regression".
   - The ledger does not list this deletion (the L2/L5 rows describe the source changes only).
   - This is the same class as the prior review's HIGH-3, and it is behavioral (launch envelope, written records), not source-text testing, so the runtime-policy excuse does not apply.
   - Fix: restore the envelope prompt assertions and the linkage assertions, keeping the synthesizer negative.

### MEDIUM

2. **Independence was audited, not enforced, and the record says "independent".** See §2 a2. The solo's position summary sat in readable forgentX evidence 110 s before the panel launched. Historical answers were readable by every non-Gemini seat. Disclose this in the eval `setup` wording, ledger :166 and phase-06:49 ("independent by read audit; forgentX not masked for solo/Sonnet/xai/GLM"). Next time, apply the Gemini-style `--tmpfs` over the evidence repo to every seat.
3. **The packet encodes the post-decision answer** (§2 b). Disclose this as a comparability limit against 2026-10-04.
4. **The how-to cannot be followed as written.** `compare-…eval.md:62-63` says to create scratch with `mktemp -d /tmp/...`. But the confined launch adds `--tmpfs /tmp` (judge execution argv), so a `/tmp` scratch is invisible inside the sandbox. This is the cause of the earlier "SDK cwd /home/vantt" failure (ledger :159), and it is why the real judge used `/var/tmp`. The isolated judge profile is ad hoc and not committed (§2 c2). In addition, `:168-169` filters by `--question panel-dissent-agreement-261004`, but the real records store the full objective text, so following the doc returns no records. Fix: use `/var/tmp`, commit or describe the exact invocation profile, and align the question id.
5. **Rejected judge evidence files describe themselves falsely** (§2 d5). Either correct their `limits`, or add a top-level `"isolated": false` field and the reason. Optionally report them as data-blind label-swapped replicates.

### LOW

6. `plan.md:87` contradicts `:86`. `phase-06:49` "retained scratch inventory demonstrated" contradicts how-to `:135`.
7. CHANGELOG `[Unreleased]` omits the user-visible `--stance-options` + `--resume` refusal (exit 4). It also omits that `unit-summary.read.v1` now requires `seat.kind`: pre-existing summaries become `invalid-contract` until `scripts/backfill-unit-summaries.mjs` runs. After backfill, forgentX still has 12 invalid-contract summaries (ledger :153).
8. Eval `runRefs` carry `evidence=…` pseudo-refs and absolute `/home/vantt` paths.
9. Owner authorization: the "Đúng, xác nhận yêu cầu" quote (ledger :7, report :3, plan :75, phase-06 :13) **cannot be verified from the repo**. The only local transcript containing it is this review session's own prompt. The repairs ran in a harness referenced as `artifact://…`. **Needs owner confirmation.** Marked unproven, not false.

### Commit hygiene

| Commit | Theme kept? | Note |
|---|---|---|
| 842287533 docs: correct unresolved verification claims | Yes | plan/phase-01/ledger only |
| 75606d308 fix: eval provenance | Yes | First commit of `observe-measurement-261005.jsonl`, already corrected. CHANGELOG +1 |
| b2c7b4588 fix: unit settlement + voters | Yes on files, **no on disclosure** | Contains the HIGH-1 test deletions |
| c439264cd fix: eligible history + ambiguous runs | Yes | Amended once (disclosed) |
| f11504363 fix: rubric + eval identity | Yes | Includes root `Cargo.toml`/`Cargo.lock` for libc, which is in theme |
| 6f043ee9d docs: repair verification | Yes | Failed-attempt evidence + journal |
| 5df843bdb chore: GitNexus counts | Yes. A separate commit is the right handling | AGENTS.md/CLAUDE.md, 1 line each |
| f304d57d5 docs: comparison evidence | Yes | Evidence + new eval shard + CHANGELOG |

No unrelated files were found. The untracked `.fgos/events/*`, `.fgos/backups/` and other plan dirs were not swept in.

**Leak scan of added/modified files** (`git diff --name-only --diff-filter=AM b3346957a..HEAD`):

- Credential patterns (`xai-`, `AIza`, `ghp_`, api-key assignments, Bearer, oauth/refresh/access_token, password, owner email): 0 hits.
- `sk-…`: 9 hits, all false positives (`tsk-*` work ids in CHANGELOG/specs).
- `controlToken`: 6 hits in 3 code/doc files (`CHANGELOG.md`, `recover.mjs`, `registrations.mjs`/specs), with 0 in the evidence directory.
- `/home/vantt`: 198 hits across 23 files. These are username/path exposure only, mostly evidence argv and runRefs.
- No account ids or labels in the committed evidence.

**Plan ids / phase numbers / audit labels in code:** I grepped the 1,602 added lines under `src test packages scripts apps` for `phase N|261005|261006|tsk-|audit|finding|acceptance|H/M/L codes` and found 0 hits.

**Docs:** observe.md:64-65 matches the eval code (five keys, cross-shard uniqueness under lock, invalid store blocks writes, libc flags). No new or deleted code files, so architecture-manifest and command-registry need no change. The doctor-registry contract was updated in c439264cd.

## 5. Verdict

**ACCEPT WITH FIXES.** The eval-store code fixes are correct and tested. The new A/B is real, isolated at the judge, and on the right question text, but it is independent only by audit, and its packet encodes the decision. Before calling repairs complete: restore the deleted stance-prompt and workflow-linkage assertions (HIGH-1), and correct the "independent" / "scratch inventory demonstrated" / rejected-judge wording. The phase-01 guard stays open, and the owner must confirm the all-phase authorization.

## Unresolved questions

- Did the owner actually confirm "làm hết tất cả phase đi" superseded the foundation gate? This is not verifiable from the repo.
- Should the confined-judge invocation profile become a committed config entry (install/setup/doctor gate), or stay a documented manual procedure?
- Are the deleted workflow-linkage assertions intentionally out of scope for some reason not recorded anywhere?
