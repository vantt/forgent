# Observe acceptance repairs — 2026-10-06

Status: reachable repairs complete and verified; original acceptance remains partially outstanding (source/import guards not fixed; fresh independent A/B judgment **UNPROVEN**). Baseline is committed `0b06824a7` plus watchdog commit `ea1c8fee0`; tracked working tree was clean at start. The original Opus acceptance reports are immutable review records, not edited by this repair.

## Owner decisions and scope

- Owner confirmed in this conversation: **“Đúng, xác nhận yêu cầu”** to the question whether “làm hết tất cả phase đi” on 2026-10-05 superseded the foundation-only gate. This is confirmation captured now, not a claim that the reviewers found historical authorization in the repository.
- For timestamps, the owner specified: **“hiện nay chỉ có mình anh dùng, chưa ai dùng nhiều nên không cần quá nhiều backward compatible, làm sao để chính xác, ổn định, chạy nhanh và đơn giản.”** The implementation choice under those criteria is result `settledAt`/`timestamp`, then same-run `run.json.settledAt`; never `startedAt` or assignment `createdAt` as settlement. Remaining undated results are counted skips, not fabricated completion times. This is the implementer's technical choice, not a quote of an exact sequence selected by the owner.
- No new work item, push, release activation, credential read, `.fgos/events` or `.fgos/backups` mutation. User requested separate ordered repair commits. Narrow checks run after each group; exactly one final full npm suite runs after every other test job finishes.

## Verification-policy conflict, not a repository law

The requested permanent exact import-closure assertion and source-enumerator allow-list tests conflict with this session runtime's prohibition on permanent source-text/wiring tests. **They are not restored/implemented.** This is not a rule inferred from AGENTS.md or any repository file. The original guard criterion is restored verbatim and unchecked; inventory and behavioral tests are not represented as an equivalent guard. No owner waiver is claimed.

A throwaway inventory used the existing reconciliation test's static import walk and its two proven-leaf cutoffs. Current closure is exactly these 12 modules (the historical assertion named the other 11):

```text
src/config/global-config.mjs
src/config/shared-config-file.mjs
src/runner/dispatch/assignment-layout.mjs
src/runner/dispatch/provider-capacity.mjs
src/runner/dispatch/reconciliation-planner.mjs
src/runner/dispatch/run-result.mjs
src/runner/dispatch/runtime-inspection.mjs
src/runner/dispatch/visibility-session.mjs
src/runner/dispatch/worker-artifacts.mjs
src/setup/config-merge.mjs
src/util/unique-tmp-tag.mjs
src/verbs/dispatch/reconcile.mjs
```

This is a dated observation, **not permanent regression prevention**. Historical assertion was read with `git show 2639e0c85:test/runner/dispatch-reconciliation-import-graph.test.mjs`; it was deleted in the feature commit rather than updated. The guard remains an explicitly unmet original-plan criterion.

## Diagnosis baseline

User-supplied Opus probes and failure observations are the pre-fix baseline; they are not rerun merely to confirm. Read-only scouts mapped the affected Node/Rust sources, caller chains and test homes. All findings below are associated with `0b06824a7` unless they describe an evidence/process claim. Tests will prove changed behavior, not assert implementation text or incidental wiring.

| Surface | Exact observed symptom / input | Underlying defect and expected behavior |
|---|---|---|
| research panel | `researcher-1..3` valid stances give `measurement: unmeasured, stanceSeats: 0` | `discussions.rs:123-138` selects voters from labels; writer's actual panelist kind is dropped. Reader must consume writer-owned kind. |
| inline reviewed producer | summary `outcome: pass` and settledAt before checkers | `run.mjs:600-603` settles the whole unit from a producer record. Only pattern completion may settle a multi-role unit. |
| missing votes | three missing votes give `agreement: 0, genuineSplit: true` | `discussions.rs:157-167` treats zero valid claims as measured dissent. It must be unmeasured/null. |
| checker throw | early execution-failure summary omits still-running sibling | `reviewed.mjs:321-322` fail-fast Promise.all escapes before peers drain. Wait for all peers before propagating the original failure. |
| missing/unusable summary | killed units and null settledAt summaries disappear | `unit_summary.rs:131-141` silently skips and exposes no scan diagnostics. Count missing/unusable artifacts without reconstructing owner pattern semantics. |
| backfill / publication | in-flight unit may look settled; derived-write error throws passed unit | backfill has no live-unit guard; synchronous derived publication exceptions escape authoritative settlement. Preserve authoritative result and warn on derived-write failure. |
| coverage / lookup | newly created no-result run causes shortfall; duplicate id selects first path | recent tolerance inspects only result files; findRunDir returns first identity match. Use candidate-dir freshness and reject ambiguous identity before show/watch/recover. |
| eval | partial known rubric and duplicate evalId accepted; arm64 no-follow flag wrong | validator only checks nonempty scores, append has no locked uniqueness check, hard-coded Unix flags are architecture-specific. Enforce rubric completeness/identity under lock and use libc platform constants. |
| judge evidence | isolated claim false; solo cites panel; historical objective not reused | effective configured invocation did not isolate; comparison arms shared prior-result access and used a different question. Correct provenance; old scores are not an independent historical-question comparison. |

## Finding ledger

Every row records its disposition, source repair commit and exercised proof, or a precise non-fix/UNPROVEN limit. Original reports: [foundation](opus-acceptance-review-foundation-261006.md), [discussion](opus-acceptance-review-discussion-measurement-261006.md), [eval/honesty](opus-acceptance-review-phase6-and-honesty-261006.md).

| Report finding | Disposition | Commit / proof |
|---|---|---|
| Foundation H1: dropped owner-dated history / incomplete policy choice | **Fixed**: actual sibling settlement fallback; no start/creation substitute; independent doctor admissions | `c439264cd` covers foundation rows; current forgentX eligible/observed929, 219 started-only excluded; native/fixture proof below. |
| Foundation H2: deleted closure / missing source guard | **Not fixed: runtime test-policy conflict**; original criterion reopened | `842287533` records conflict and restored original checkbox; current 12-module throwaway closure above is not permanent prevention. |
| Foundation M1: Node/Rust admission equivalence overclaimed | **Fixed**: production Node projection separate from directory-only lister | Shared fixture IDs/reasons/accounting exercised by both implementations; live dual-root parity below. |
| Foundation M2: newly created dir tolerance | **Fixed**: candidate directory recency, including missing result | Sixty-second boundary/clock-skew/stale-directory regressions pass. |
| Foundation M3: misleading shortfall example paths | **Fixed**: explicitly sample candidates, not confirmed missing | Doctor code has counts only; no invented per-path omission evidence. |
| Foundation M4: missing result called unparseable | **Fixed**: distinct missing-result reason | Rust/Node consumer regressions; live forgentX51, mdview1. |
| Foundation M5: duplicate id spoof / outbox protection scope | **Fixed**: show/watch/recover refuse run-ambiguous; outbox-only prevention claim | Meta/meta, result/result, mixed duplicate regressions prove no watch tick/recovery mutation. No identity authentication claimed. |
| Foundation Low: degraded flag not consumed | **Not changed**: existing overall doctor report has passed/message, no degraded status vocabulary | Real old-host check explicitly instructs upgrade; no claim overall doctor exposes a distinct degraded state. |
| Foundation Low: symlink files count as run-dir barriers | **Retained and clarified**: conservative traversal barriers, not physical-directory guarantee | A link can conceal a directory; accounting includes one barrier. Live find parity has zero barriers in both roots. |
| Foundation Low: assignments/runs empty assignment id | **Retained and documented**: root-relative assignment id may be empty | Primary run identity remains runId; no silent rewrite of directory definition. |
| Foundation Low: watchdog out-of-plan | Already separate `ea1c8fee0`; no rewrite | Commit reported in user prompt. |
| Discussion H1: researcher seats unmeasured | **Fixed**: canonical owner role definitions emit mandatory seat.kind | `b2c7b4588`; writer/reader regressions and owner-to-native CLI proof below. Same commit covers all discussion rows. |
| Discussion M1: inline producer prematurely settles unit | **Fixed**: multi-role producer remains pending until pattern settlement | Actual inline API no settlement/summary; resume and refusal regressions pass. |
| Discussion M2: zero valid claims reported genuineSplit | **Fixed**: unmeasured/null agreement/null split, counters retained | Rust cases and actual CLI three-missing-vote proof below. |
| Discussion M3: reviewed checker throw loses peer | **Fixed**: checker/verify peers drained, original rejection retained | Corrected producer-report fixture verifies sibling result in final summary. |
| Discussion M4: crashed/killed units lack detector | **Fixed structurally**: root-wide summariesMissing | Missing may also be active; no crash-state inference claimed. |
| Discussion L1: unusable summaries silently dropped | **Fixed**: reason counts include missing/invalid timestamps and unsafe artifacts | Reader 12-case suite and actual missing-timestamp CLI counter. |
| Discussion L2: stance line for every worker | **Fixed**: generic redundant line removed; scoped roleUnit remains | Claim validation unchanged; HIGH radius disclosed before edit. |
| Discussion L3: backfill races in-flight units | **Fixed**: explicit active/pending state skipped; unfinished history cannot settle | Backfill/source-nonmutation regressions in passing writer suite. |
| Discussion L4: derived summary error fatal | **Fixed**: warning preserves authoritative outcome/original exception | Normal, inline and execution-error I/O regressions pass. |
| Discussion L5: roleTasks now apply to panel members | **Restored prior behavior**: member task wrapping ignored except stance | Prefeature source checked; synthesizer/generic roleUnit overrides unchanged. |
| Discussion L6: resume silently ignores stance options | **Fixed**: explicit refusal without altering stored question | Actual CLI exits4 with named immutable-question error; regressions pass. |
| Eval Medium: incomplete known rubric | **Fixed**: exactly five canonical keys on write/read, other rubrics extensible | `f11504363` covers eval integrity rows; main eval suite23 pass; native partial record rejected before store creation. |
| Eval Low-Medium: duplicate evalId | **Fixed**: all-shard identity check and append hold shared Observe lock | Same/different shard, hand-edited duplicates and two-process identity race; native duplicate refuses unchanged original bytes. |
| Eval Low-Medium: architecture-specific no-follow constant | **Fixed**: target libc constants on existing supported Unix branches | `cargo check -p fgos-observe --target aarch64-unknown-linux-gnu` succeeds; compile proof, not execution on arm64. |
| Eval Low: lexical timestamp list ordering | **Not changed; documented**: writer UTC/Z sorts correctly, hand-edited offsets have lexical order | No chronological guarantee claimed for arbitrary read timestamps. |
| Eval Low: unsafe shard silently skipped | **Fixed**: unsafe/nonregular *.jsonl reported invalidline0 without following | Consumer test proves no external scores/writes; invalid store blocks uniqueness-dependent append. Read preflight race remains explicit. |
| Eval concurrency: same shard not exercised | **Fixed**: six processes / one shard / 30 unique complete records; two same-ID writers exactly one success | Main eval suite23 pass; helpers don't mutate parent process environment. |
| Honesty High: false isolation provenance | **Corrected before first commit** in both records; metadata, report, plan, journal and how-to aligned | `75606d308`; real eval list returned both corrected records, invalid empty and scores unchanged. A later isolated availability canary is separately labeled, not retrospective proof. |
| Honesty High: solo consumed panel output | **Disclosed** in setup/judge metadata and every comparison claim | Old scores are not an independent comparison; new proof remains conditional. |
| Honesty High: weakened exact import closure | Same unresolved runtime-policy conflict as foundation H2 | No restoration claimed. |
| Honesty Medium: different historical question | **Disclosed**; original objective retained for any fresh run | Vietnamese 1000-word vs English repo-reading 300-word distinction explicit. |
| Honesty Medium: raw judge command contradicts dispatch door | **Corrected**: how-to uses decide/execute and requires configured/audited invocation | Default executor is explicitly data-blind only; actual installed `claude --help` checked. |
| Honesty Medium: cross-project unqualified runRefs | **Corrected** setup provenance names `/home/vantt/projects/mdview` | IDs/refs unchanged; owning root explicit in both real rows. |
| Honesty: historical scratch inventory / capability arrays authored by coordinator | **UNPROVEN, disclosed**; no retrospective filesystem or hidden-context proof | `75606d308` corrects original report/JSON/how-to; deleted scratch cannot be reconstructed. Actual canary SDK transcript is new scoped evidence, not retroactive validation. |
| Honesty: historical dispatch-decide artifact absent | **UNPROVEN, disclosed** | No historical artifact fabricated. Fresh availability and generation decisions are actual retained outputs under the new evidence directory. |
| Authorization unproven | **Owner confirmed now** | Exact answer above, historical transcript discoverability remains separate. |
| Watchdog residual append failure may prevent kill | Not changed: outside requested repair groups | Review identifies risk; no claim it is resolved here. |
| Original all-phase completion / re-review approval claims | **Corrected and reopened**; passing baseline is not proof every consumer defect was absent | `842287533` / `75606d308`; original guard remains unmet, final repair gate and fair-comparison outcome are separate below. |

## Verification

The one final `env -u CLAUDE_CODE_SESSION_ID npm test` completed after all narrow, Rust, CLI, golden and provider attempts: **6,851 tests / 6,778 pass / zero fail / zero cancelled / eight skipped / 65 todo**, 334,907.732836ms (`artifact://456`, full runner output `artifact://453`). No commit was made while it ran and no second full npm run was made. The historical-objective comparison reached real fresh Unit seats but remains **UNPROVEN** because panel generation failed before synthesis (private Pi auth-runtime prerequisite), not because quota exhaustion was established. No old score is relabeled and no new scorecard was fabricated.

### Initial verification correction

- The existing reconciliation import-graph suite was exercised unchanged: `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/dispatch-reconciliation-import-graph.test.mjs`, **22 pass / zero fail**. This does not restore the missing exact assertion or source-enumerator guard.
- GitNexus incremental refresh failed on an inconsistent derived FTS index; `analyze --force` rebuilt successfully at the current checkout (58,821 nodes, 81,138 edges). Pre-commit `detect-changes --scope all --repo /home/vantt/projects/forgentX` reports docs only, no affected processes, LOW risk. Generated AGENTS.md/CLAUDE.md edits are not staged.

### Provenance correction

- Initial verification-honesty commit: `842287533`. The original source guard remains unmet, not waived.
- Original eval shard was untracked at start, so its two false `judge` strings were corrected before first commit, as requested. IDs, timestamps, score vectors and runRefs were preserved; setup now names the actual mdview root and the independence/question confounds.
- `target/debug/fgos metrics eval list --dir /home/vantt/projects/forgentX --question 'fgOS có nên thêm cổng dissent/agreement vào panel?'` returned exactly the two corrected records with `invalid: []`.
- Narrow store regression: `cargo test -p fgos-observe --test eval_journal_test`, **27 pass / zero fail** (artifact://296). This exercises existing record/list behavior; rubric/uniqueness/portable-open repairs are not yet implemented.
- `claude --help` confirms isolation flags exist, but default dispatch does not append them. No new isolated judge or fair comparison is claimed in this commit.

### Measurement diagnosis and selected repair

- Provenance correction committed separately as `75606d308`; the corrected scores remain historical, not a fair re-comparison.
- Writer/reader responsibilities remain separate: Node owns pattern role definitions, final-seat selection and Unit completion; Rust owns bounded structural summary scanning and passive aggregation. A coverage-style callback carries observations plus diagnostics without broadening the shared source trait or rescanning.
- Required writer-owned seat `kind` replaces role-prefix voting. Zero valid votes cannot establish disagreement. Root-wide missing/unusable counts intentionally do not label an active Unit as crashed or guess which time window an undated artifact belongs to.
- Prior art `git show 0b06824a7^:src/runner/execution/patterns/panel.mjs` shows panel members previously received the original Unit directly, while only the synthesizer had roleTasks wrapping. Panel-member task wrapping introduced by the stance change is being restored to the original behavior; measured members still receive their scoped stance instructions.
- GitNexus reports HIGH for the generic claim renderer (brief/assignment/dispatch/workflow callers) and `isRoundSettledInHistory` (reviewed resume/outcome, runPattern/dry-bind/Unit summary callers). Owner warned before edits. Renderer change is only deletion of redundant global stance prose; round completion requires drained peer evidence rather than a lone checker failure.
- Rust LSP was repaired by installing rust-analyzer. Parent resolved dispatcher/provider/discussions/source references for workers, whose tool mounts lacked LSP. No JavaScript language server is configured; zero graph callers are UNKNOWN and require actual source callsite inspection.
- These design notes preceded verification; subsequent exercised proof follows.

### Measurement verification

- Narrow Node blast radius covered 257 cases: initial 255 pass / 2 fail (`artifact://330`); the new drain fixture lacked the producer report required by handoff, and an old workflow test pinned newly reverted panelist roleTasks prose. Production source was unchanged by diagnosis corrections. The two corrected files reran **85 pass / zero fail** (`artifact://336`); the other 172 cases had already passed.
- Rust reader **12 pass**, actual host/provider discussion integration **1 pass** (`artifact://332`).
- Throwaway owner-to-host CLI smoke produced researcher kinds `panelist` and a synthesizer named `panelist` with kind `synthesizer`: valid votes a/a/b measured agreement 2/3, split false; three missing votes remained unmeasured with null agreement/split despite a synthesizer claim. Four direct Unit directories partitioned into two observable settled artifacts, one missing, one unusable `missing-timestamp`, diagnostic scope `root-wide`.
- Actual inline API smoke persisted the reviewed producer with `execution.status: pending`, no Unit settlement and no summary. Actual resume CLI with new options exited **4**: `cannot provide stanceOptions when resuming a unit run: the stored question is immutable`. Its first temporary fixture lacked the API's Git-repository prerequisite; corrected fixture initialized only its own temporary Git root. Both smoke scripts and their temporary roots were removed.
- Exact golden command `env -u CLAUDE_CODE_SESSION_ID node scripts/regenerate-observe-fixtures.mjs` succeeded, including `cargo build -p fgos`. Required pre-stage `git diff --stat -- test/fixtures/observe` is empty.
- Independent reader/composition review found no patch-introduced correctness defect (confidence 0.94). Writer/lifecycle review found a new resume defect: cleared owner settlement left the old terminal artifact observable. Parent invalidates the old regular summary before reopening, aborts if it cannot be removed, and adds a regression proving failed republish cannot preserve a stale refusal. Four directly affected consumer files then passed **107 / zero fail** (`artifact://355`); reviewer acknowledged the described fix, not a new universal review approval.
- Final measurement Node blast-radius rerun after resume invalidation: **259 pass / zero fail** (`artifact://357`). Includes failed invalidation preserving old authority and failed republish removing stale outcome. Pre-commit change analysis reports HIGH / seven expected dispatch-bound confinement/handoff flows; generic renderer and reviewed-history HIGH risks were disclosed before changes.

### Foundation verification

- Narrow Node consumers: **98 pass / zero fail** (`bg_93` output); Rust layout/admission consumers: **10 pass / zero fail**, then `cargo build -p fgos` succeeded (`artifact://384`). All peer editor checks were deferred to parent.
- Real rebuilt coverage plus independent `find` (`artifact://385`): forgentX **1199 directories = 929 observed + 51 missing-result + 219 no-timestamp**; mdview **90 = 83 observed + 1 missing-result + 6 no-timestamp**. Node eligible counts929/83 agree. Both independent physical counts match and traversal barriers are zero. Actual nested `dispatch show-run run_unit-run-1790918559997-8757d4c9/producer/1_01` exited0 and resolved its nested directory.
- Real full doctor runs: rebuilt host reports Node/host1199 and eligible/observed929 (`artifact://386`); installed release `sha256:a1ba0d0682a7c00598a9873cd13dbe9bb9500b0a7f6b8260a776a5de0e407c4c` reports old-host upgrade/degraded message (`artifact://387`). Other pre-existing check failures remain; neither overall doctor run is claimed entirely green.
- `node bin/fgos.mjs metrics ...` exits4 because metrics is Rust-owned, even with FGOS_HOST_BIN; actual metrics proof uses the absolute rebuilt host. This was a command-surface mistake, not suppressed evidence.
- Mandatory seat.kind clean cutover initially reports32 old summaries invalid-contract at mdview. Existing owner backfill migrated **31 changed / 2 unchanged / 1 active skipped / 3 unsettled skipped / zero errors**, derived artifacts only. Actual `metrics discussions --since=2026-10-05` then reports28 units, and all four historical Delphi workflow groups including zero-seat policy refusal (`artifact://394`); root-wide diagnostics37 = 28 observed + 4 unusable + 5 outside-window. Remaining unusable: one active old-contract artifact and three missing-timestamp artifacts.
- Exact golden regeneration succeeded; required pre-stage `git diff --stat -- test/fixtures/observe` empty (`bg_98`). No golden edits required.
- Independent foundation review found a Unicode duplicate-winner defect (Node UTF-16 versus Rust byte order). Regression failed before the comparator fix; Node caches UTF-8 keys per entry to match valid-Unicode component order. Corrected full narrow consumers: **99 pass / zero fail** (`bg_108`); matching Rust timestamp/assignment regression added. The private helper impact is LOW with walker and three recovery flows; root scanner's zero indexed callers is UNKNOWN, actual doctor/inspection consumers are exercised.
- Matching Rust Unicode duplicate regression passed with the full layout suite **11 / zero fail** (`artifact://425`). Foundation commit amended to `c439264cd`; the previous hash `9e47cee82` is superseded, not a second repair group.

### Eval integrity verification

- Main eval test harness: **23 pass / zero fail**, including actual same-shard and duplicate-ID processes; tool aggregate41 includes child harness output (`artifact://403`). Rebuilt host succeeded. Independent scoped eval integrity review found no concrete regression (confidence0.93), no tests run by reviewer.
- `cargo check -p fgos-observe --target aarch64-unknown-linux-gnu` succeeded (`artifact://405`), compile-only proof. Final required `cargo test -p fgos-run-result -p fgos-observe` rerun after the Unicode regression succeeds (`artifact://431`; tool aggregate95 includes child harness results). Exact golden regeneration/build succeeds again and required `git diff --stat -- test/fixtures/observe` is empty.
- Actual native CLI smoke (foreground transcript output from `node /tmp/fgos-eval-integrity-smoke.mjs`): partial known rubric exits1 before store creation; duplicate exits1 without changing shard bytes; duplicate detection remains visible under unmatched harness filter; a new ID refuses existing invalid store. Throwaway root removed. Real live eval list still has the two original corrected records and invalid[]; no synthetic smoke score enters it.
- Optional comparison prerequisite: target-project `dispatch decide claude` returned configured/out-of-process; `dispatch execute ... --model opus --tier flagship` returned READY, actual status0/modelopus/providerclaude (`bg_107`). This is only an availability probe using the default unconfined profile, not a fresh arm, isolated judge or score. Quota absence cannot be claimed.

### Final live migration and declared isolation

- ForgentX owner backfill: **81 units, 61 changed, 2 unchanged, 4 active skipped, 14 unsettled skipped, errors[]** (`artifact://436`). Root-wide discussions accounting:81 directories,18 unusable (12 invalid-contract,6 missing-timestamp),31 outside-window. Derived-only regeneration does not invent settlement or mutate source journals.
- Actual Opus canary through `executeExecutorCli`, routed out-of-process: captured execution wrapper argv includes `--safe-mode`, `--tools ""`, empty MCP map, `--setting-sources ""`, disabled slash commands and no session persistence. SDK init reports model`claude-opus-5-5`, tools[], mcp_servers[], skills[], slash_commands[]; no hook/tool events observed. Three **builtin** plugins remain: no claim all plugins or admin policy are disabled. bwrap attestation `enforced` applies the declared blind/read-only resource controls; network is allowed and host/shared process/session controls are not advertised as isolation (`artifact://435`, `artifact://437`).
- The first canary declaration incorrectly requested unsupported workspace grants/private-home/session coverage and refused before launch. Corrected canonical read-only workspace policy succeeds. This is configuration diagnosis, not a quota failure, score or fresh comparison.
- Fresh comparison uses the **entire** historical English objective and one hashed, numbered current-source packet for both actual `runUnit` arms on mdview. Declared temporary project invocation configuration is byte-restored immediately after both owner snapshots; no config default/env/infra is added. Earlier declaration attempts failed closed before provider launch (null confinement, removed referenced invocation IDs, missing backend declaration); then an overlarge inline argument failed E2BIG. File-pointer delivery and bounded relevant excerpts repair those invocation issues without changing the objective.
- Earlier full-owner solo `unit-run-1791265470164-48ec13db` passed; panel `unit-run-1791265470226-7fe9b3f6` had Sonnet pass but two CLI configuration failures (`x-ai` unknown provider, agy duration missing unit). Corrected actual generation then produced solo `unit-run-1791266482233-ee7efe1a` pass, Sonnet/Gemini panel seats pass, but panel `unit-run-1791266482325-8335c3c1` execution-failure before synthesis. Exact xai error: credential-store lock creation is EROFS under the inherited OMP Pi agent directory. This is **not quota exhaustion**. No historical successful output substitutes for this failed panel and no two fresh evals are invented.
- Public installed Pi code establishes ordinary CLI authentication requires writable auth-file locking; it exposes no read-only auth switch. Redirecting `PI_CODING_AGENT_DIR` alone does not provision credentials. Existing fgOS capacity provisioning does not provide a Pi/xAI inference credential relay. Completing a confined fresh panel requires a correctly provisioned writable private Pi account runtime; copying/extracting credentials or widening credential-write grants is not done. **Fresh fair comparison and actual A/B judgment remain UNPROVEN**, despite Opus availability and the successful isolated canary.
- Native owner launches retain prepared invocation/contract and actual SDK stdout but escape parent JS spawn observation. Owner records request the scratch cwd, while observed Claude init reports `/home/vantt`; no claim that planned cwd or prepared argv alone proves effective isolation. Raw generation evidence is reduced to public outcome/model/report/log-reference fields; opaque control tokens are not persisted in committed evidence.

### Final evidence commit scope

- Final pre-commit `detect-changes --scope all --repo /home/vantt/projects/forgentX`: **11 tracked files, 30 document symbols, zero affected processes, LOW**. Two generated instruction files appear in detection and remain excluded from staging. The remaining sync-back is documentation/plans plus new safe evidence and the first-class journal; no production symbol changes after the final full npm proof.
- Journal auto preference resolved true; `ak journal create ... --stdin` created `plans/journals/2026-10-06-observe-acceptance-repair-verification.md`. AgentWiki publication skipped. Completed throwaway scripts removed; no push.
