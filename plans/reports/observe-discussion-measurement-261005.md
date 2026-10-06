# Observe discussion measurement — execution evidence

Owner go: “làm hết tất cả phase đi” superseded the foundation-only gate on 2026-10-05. Phases 4–6 add measurement, not a dissent gate, retry policy or decision ledger. Foundation evidence remains in [layout inventory](observe-run-layout-261005.md) and [rebaseline](observe-rebaseline-261005.md); its historical counts are not replaced by current counts.

## Ownership and contract

**No component-boundary change.** Checked `docs/platform/component-boundary.md`: Execution owns final role/round seat selection, all Dispatch attempts, settlement and `unit-summary.v1` publication; `packages/run-result` consumes its read contract; the host composition root injects that source into Observe. Rust does not join workflow journals or reconstruct Node attempt rules. Observe owns aggregation and its eval journal. No new tool, config default, environment variable or infrastructure prerequisite: summaries use existing assignments, evals lazily use the existing Observe directory, writer identity and lock; existing `observe-dir-writable` doctor registration covers storage.

[Prior-art evidence](observe-unit-summary-stance-prior-art-261005.md) records reused history and pattern semantics, the explicit legacy workflow completion links, and the structured-claim deviation from prose `STANCE:`. Stance is optional, malformed/missing is measurement evidence rather than a seat failure, reserved `other` is accepted, confidence does not weight votes. Each role/round is a seat; old attempts/fallbacks do not vote. Missing/invalid final panelist claims stay in the denominator. An incomplete-evidence split is not proof of actual dissent.

## Safe historical backfill

Commands: `node scripts/backfill-unit-summaries.mjs --dir <root> --dry-run`, then the same without `--dry-run`, then repeat. Original unit/result/event records are untouched; derived summaries are byte-idempotently regenerated.

| Project | Initial units | First applied changed | Immediate repeated changed | Errors |
|---|---:|---:|---:|---:|
| mdview | 35 | 35 | 0 | 0 |
| forgentX | 80 | 80 | 0 | 0 |

After the live runs and review corrections, repeated regeneration saw mdview 37 units and forgentX 81 units, both `changed: 0`, errors empty on two consecutive calls. Historical units without actual settlement evidence retain null timestamps; no creation time is substituted.

### Four Delphi runs, same historical window

`target/debug/fgos metrics discussions --dir /home/vantt/projects/mdview --since=2026-10-05 --by=workflow` lists all four:

| Workflow run | Units | Seats | Attempts | Fallback seats | Units passed |
|---|---:|---:|---:|---:|---:|
| `wf-run-1791195929806-1f688991` | 1 | 0 | 0 | 0 | 0 |
| `wf-run-1791195956706-842d7c56` | 3 | 8 | 9 | 1 | 2 |
| `wf-run-1791196890335-6466fc15` | 4 | 10 | 11 | 1 | 4 |
| `wf-run-1791198761595-28f05967` | 4 | 10 | 10 | 0 | 4 |
| **Total** | **12** | **28** | **30** | **2** | **10** |

`metrics runs --dir /home/vantt/projects/mdview --since=2026-10-05T10:25:29.807Z --until=2026-10-05T11:20:00Z` returns **30** Dispatch runs (27 ok, three execution failures). Attempts match, not the 28 final seats. Role totals: panelist-1 six, panelist-2 six, panelist-3 eight, producer five, synthesizer five.

Hand spot-checks:

- Refusal `unit-run-1791195929977-fd44cbc6`: zero seats/attempts, policy-refusal; owner evidence is exact `unit.complete`, workflow journal seq 4, timestamp `2026-10-05T10:25:29.985Z`.
- Fallback `unit-run-1791196890514-aab0cccf`: four final seats, five attempts. Panelist-3 first used gemini and settled provider-limit; final `1-fb1` used xai and passed. `fallbackFrom` retains `{executor, invocation, transport, reason}` as an object. Live smoke exposed Rust's initial string-only assumption; read contract and regression were corrected before accepting these counts.
- Complete `unit-run-1791198761763-204317b8`: four seats, four attempts, no fallback; all final seats pass, linked to the final historical Delphi workflow.

### Coverage and inspection

Final stable live snapshot, no recent results:

| Project | Independent Node count | Rust runDirsSeen | Observed | No timestamp | Unparseable |
|---|---:|---:|---:|---:|---:|
| forgentX | 1199 | 1199 | 223 | 925 | 51 |
| mdview | 90 | 90 | 83 | 6 | 1 |

Accounting is exact in both. Historical foundation snapshot was 1195/81, before these live attempts. Today's `dispatch show-run run_unit-run-1791219961331-276f364c/panelist-1/1_01 --dir /home/vantt/projects/mdview` resolves the nested directory and reports settled/pass.

## Real stance panel

Same question for both compared setups: “fgOS có nên thêm cổng dissent/agreement vào panel?” Both receive the same locked priority context and request for evidence, counterfactuals and executable recommendation, with identical 1000-word ceiling. Options: `no-gate|optional-gate|mandatory-gate`; no code/docs writes allowed.

First panel `unit-run-1791219798957-a5c9dc33` was blocked: Claude and gemini passed with `no-gate`, openai blocked with no claim. A resume remained blocked because the run's stored bindings are immutable; the new CLI overrides did not change them. This partial panel is not presented as three valid votes.

New explicitly routed panel `unit-run-1791219961331-276f364c` passed. Panelists: Claude Sonnet through herdr, xai through confined CLI, gemini through herdr; independent GLM 5.3 synthesizer through confined CLI. Three valid final panelist stances, all `no-gate`; no missing/invalid votes. Hand ratio **3 / 3 = 1**, native output `agreement: 1`, `genuineSplit: false`. Four final seats/four attempts includes the synthesizer, which does not vote.

Two earlier solo attempts in the actively edited forgentX checkout produced reports but settled policy-refusal (`read-only-mutation`); they are not relabeled successful. The compared solo ran on mdview, `unit-run-1791220096823-0f5e7675`, Claude Opus through herdr, and passed. Comparing both in the consumer project avoids treating concurrent implementation edits as worker mutations.

## Fresh blind Opus comparison and real journal

Scratch directory `/tmp/observe-blind-4nZiJ8` was outside `.fgos`, and actual inventories before/after judgment contained only `A.md` and `B.md`. The final judge received complete substantive deliverables with identical normalization: runtime paths and IDs redacted in both. No setup-to-A/B mapping was supplied. Initial unnormalized judging is excluded because citations exposed runtime IDs; a fresh stateless normalized evaluation replaced it.

Opus ran via the Dispatch execution adapter (`claude`, `cli-spawn`, model `opus`, flagship), not a raw provider invocation. Tools, MCP servers and setting sources were empty; safe mode, no session persistence and slash commands disabled. `dispatch decide` returned configured out-of-process; completed calls were logged. The adapter printed non-git-cwd diagnostics for the fresh scratch, but status was zero; scratch remained two regular files.

Durable normalized inputs: [A](observe-measurement-261005/A.md), [B](observe-measurement-261005/B.md). [Actual judge JSON with quoted rationales and limits](observe-measurement-blind-judge-261005.json).

| Criterion (`discussion-quality.v1`) | Solo Opus — A | Three-provider panel — B |
|---|---:|---:|
| Perspective spread | 1 | 2 |
| Decision clarity | 1 | 2 |
| Counterfactual depth | 2 | 1 |
| Evidence discipline | 2 | 1 |
| Execution quality | 1 | 1 |
| **Total** | **7** | **7** |

Native `metrics eval record` appended real records to `.fgos/observe/evals/observe-measurement-261005.jsonl`:

- `observe-solo-opus-261005`, harness `fgos-solo`, runRef `unit-run:unit-run-1791220096823-0f5e7675`.
- `observe-panel-261005`, harness `fgos-panel`, runRef `unit-run:unit-run-1791219961331-276f364c`.

Both list under the exact question; each exact harness filter returns its own record, and `invalid` is empty. The unchanged installed release (`sha256:a1ba0d0682a7c00598a9873cd13dbe9bb9500b0a7f6b8260a776a5de0e407c4c`) rejects `metrics eval list` with explicit unknown subcommand, exit 4.

Limits: one question, one judge, different provider/model/setup and artifact types. Citation truth cannot be externally verified by the tool-disabled judge; output styles may favor multi-voice perspective spread. These are directional measurements, not an objective ranking or evidence to add a gate.

## Verification and corrections

Final integrated `cargo test -p fgos-run-result -p fgos-observe` passed **74 tests**; `cargo build -p fgos` passed (artifact://260), including the final eval read-directory boundary correction. Focused Node summary/reviewed/workflow suites passed **55/55** (artifact://253). Behavioral regressions include throw/refusal/inline publication, numeric attempts 99/100, final reviewed-round legacy outcomes, malformed stance accepted while counted invalid, options driving actual CLI prompts, fallback provenance objects, temporal offsets, symlink/filename containment, concurrent writers and bounded oversized-line recovery.

Native throwaway smokes (removed after use): offset timestamps at identical inclusive UTC bounds select only the truly equal instant; a symlinked eval shard returns failure and leaves its external target byte-identical; listing a symlinked eval-store directory rejects external valid records. Real record/list and real panel exercise the production paths beyond unit tests.

Review corrections: string-only fallback provenance, lexical timestamp windows, lexical numeric-attempt ordering, earlier reviewed findings poisoning a later pass, unsafe eval shard following and unbounded logical-line allocation. The first measurement `npm test` run failed on a new test's wrong `brief-N.md` assumption (CLI actually supplies `protected/launch-envelope.json` argv), and its store-isolation gate correctly detected concurrent operator backfill/live writes. The fixture now consumes the real CLI launch envelope; the authoritative full rerun runs only after all live store writes finish.

Independent Node writer and Rust reader re-reviews closed every reported finding and returned no additional concrete defect. Eval list now validates existing real-directory parents without creating missing state. On platforms without supported atomic no-follow flags, append to an existing shard conservatively fails closed; Linux is the exercised runtime. Parent-directory replacement races are not claimed prevented.

`node scripts/regenerate-observe-fixtures.mjs` succeeded; `git diff --stat -- test/fixtures/observe` was empty. A throwaway privacy scan of synthetic run-layout/Observe fixtures found no control tokens, protected paths, absolute home paths or provider-log markers; no permanent source-text test was added. The phase-1 source-text guard and unrequested report commits remain explicit verification-method deviations, replaced by inventory/behavioral proof and persisted working-tree reports.

### Full-suite live-Herdr diagnostic

The post-dogfood default parallel full suite completed with 6,823 tests: 6,749 passed, one failed, eight skipped, 65 todo (artifact://264). The sole failure was the existing `herdr-reconciliation.test.mjs:1123` live gateway smoke: foreground argv did not attest within the startup window; it correctly killed/closed the unmatched pane. No measurement test failed.

A transparent wrapper around the real Herdr CLI recorded a focused live run without faking responses. It passed: 48 process-info snapshots, ten shell-only snapshots, eight snapshots without argv, then 38 with the exact prepared bwrap wrapper. The failed full-run snapshots were not retained, so process contention is **[INFERENCE]**, not a proven root cause. [Sanitized diagnostic facts](observe-herdr-acceptance-diagnostic-261005.json). No timeout increase, skip, fail-closed relaxation or production retry was applied.

Final full-suite command `FGOS_HOST_BIN=/home/vantt/projects/forgentX/target/debug/fgos npm test -- --test-concurrency=1` passed with the full discovered file list: **6,823 tests / 6,750 pass / zero fail / eight skip / 65 todo**, 22 suites, duration 1,318,042 ms (artifact://270; background result bg_64). This includes the actual live-Herdr confined-launch smoke. The default parallel failure remains recorded above; serial verification does not claim its root cause is fixed.

All six phase statuses and every plan acceptance checkbox are synchronized; independent writer/reader reviews are approved. No release activation or unrequested staging/commit was performed; dogfood used the rebuilt host through `FGOS_HOST_BIN`.
