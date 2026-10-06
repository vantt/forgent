# Observe third repair: wording and records

Scope: the wording and record findings of [opus-third-acceptance-honesty-261006.md](opus-third-acceptance-honesty-261006.md) (§1 table, §3 spot checks 14–15, §4 process 3–4, LOW 6–7). Main checkout at HEAD `2fd5cb6a3`, uncommitted. No code, tests, fixtures, plan.md/phase files or `opus-*` reports were touched. I did not run `npm test` and did not record any full-suite figures.

## 1. Journals

**[2026-10-06-observe-independent-comparison-completion.md](../journals/2026-10-06-observe-independent-comparison-completion.md)**

| Location | Before | After |
|---|---|---|
| title, H1 | "Observe independent comparison completion" | "Observe read-audited comparison completion" (file name kept, because the ledger links to it) |
| summary | "…original guard conflict remains explicit" | "read-audited (not sandbox-isolated) … guard sentence corrected at the end" |
| :11 | "Completed the remaining independent historical-question comparison" | "…read-audited rather than independent by enforcement" |
| :19 | "Scratch before/after exactly A.md and B.md with unchanged hashes." | Recorded only in coordinator-authored JSON; the scratch was deleted, so **UNPROVEN** |
| :23 | "Whole plan stays in progress solely because exact source/import guards conflict…" | Marked as the view at the time of writing and superseded |
| new section "Correction after the third acceptance round" | — | Read-audited, not sandbox-isolated; scratch UNPROVEN; guard present in `5608387d3`, with its known limits |

**[2026-10-06-observe-acceptance-repair-verification.md](../journals/2026-10-06-observe-acceptance-repair-verification.md):** its summary and :33 state that the guard is "not fixed". I left the historical text unchanged and appended a correction section. It records that the guard is present in `5608387d3` with its limits, and that the 6,851 full-suite figure describes the tree before the later code commits. :39 ("isolated Opus canary") is TRUE per the honesty report, so I kept it.

Evidence:
- `git show --stat 5608387d3` adds `test/runner/assignment-enumerator-guard.test.mjs` (308 lines) and changes `dispatch-reconciliation-import-graph.test.mjs`.
- `assert.deepEqual([...seen].sort(), expected)` is present in that file.
- The test file's own comments say that a dynamic `import()` "is deliberately not followed".
- The guard's limits come from the [third-round code report](opus-third-acceptance-code-261006.md) ("Enumerator guard: which forms are caught", G1, G2): cross-file flow, glob, `child_process` listing, multi-line `path.join` and allow-list key reuse.
- Launch envelopes under mdview: I counted `--tmpfs` entries for each seat. panelist-3 has 6 and every other seat has 5, which matches the honesty report's finding that only Gemini masks forgentX.
- `completion-contaminated-generation.json`: birth/mtime is 14:12:38 +0700.
- panelist-1 `startedAt` is 07:14:28.636Z.

## 2. Ledger [observe-acceptance-fixes-261006.md](observe-acceptance-fixes-261006.md)

**In-place corrections, each annotated "corrected in the last section":**
- :3 Status line: "fresh independent … A/B" became "read-audited, not sandbox-isolated". The guard is now recorded as added later in `5608387d3`. The final plan status is left to the lead.
- :85: "new independent arms verified" became "new arms read-audited, not sandbox-isolated". The original wording is quoted in the row.
- :168 (scratch): the claim is now marked as coordinator-authored and **UNPROVEN**.
- Heading "Independent comparison completion — 2026-10-06": I kept the heading text, because `phase-06-eval-store-and-rubric.md:56` links to its anchor. I added a note under it explaining what "independent" means there.

**Status table ("Trạng thái hiện tại"):**
- Stance tests: now recorded as restored in `012595aca`.
- Guard: now recorded as present in `5608387d3`, with its limits. Ticking the box is left to the lead.

**New last section "Đính chính sau nghiệm thu lần ba":**
- The exact line on the in-place rewrite of the eval records, as requested.
- The list of earlier guard sentences that are now historical.
- The stance tests restored.
- The two journals corrected.
- The 6,851 figure belongs to the tree before the code commits, and the lead will record the final run.

**Eval-line evidence:** for both lines, `git show 2fd5cb6a3^:` and `2fd5cb6a3:` give the same sha256 over `evalId, ts, scores, runRefs, question, harness, rubric, v, type`. Only `setup` and `judge` differ.

## 3. CHANGELOG `[Unreleased]`

| Item | Before | After |
|---|---|---|
| (a) Changed › comparison guidance | "…distinct from new independent evals" | "…distinct from new read-audited evals", plus one sentence defining read-audited vs sandbox-isolated |
| (b) Fixed › discussion measurement | "treats zero valid votes as unmeasured" | "treats a unit with fewer than two valid votes as unmeasured" (now consistent with Changed; the half-the-voting-seats condition is not written) |
| (c) Fixed, new line | — | The recorded `setup`/`judge` text and judge evidence of the reference comparison no longer call the arms independent; read audit only, not sandbox isolation; pointer to the how-to |

Evidence:
- (b) Rust `MIN_VALID_VOTES = 2` is confirmed in the honesty report §3 #4.
- (c) `jq -r .setup` on the shard shows "arm separation by read audit only: no seat read the other arm's output".

## 4. Contract `packages/observe/contracts/observe.eval.v1.json`

Only two `description` strings changed. `git diff -U0` shows no change other than those descriptions.

- **`question`.** Before: "Identifier of the exact shared question." After: it holds the verbatim question text, which may be the full objective, and `metrics eval list --question` matches it by exact string equality. Basis: the stored records hold full sentences, and `eval_journal.rs` filters with `record.question == q`.
- **`runRefs`.** Before: "Identifiers … not paths to guessed reports." After: caller-written references that the store does not parse or resolve. The forms in use are `unit-run:<id>` (the 261005 records) and a `;`-separated `key=value` string (the 261006 records: project, unit, run, report path, evidence path, anonymous label). Any path must name the actual evaluated output. Basis: `jq '.runRefs'` on both shards, and `eval_journal.rs` checks only that each ref is non-empty.

Validation:
- `jq empty` passes.
- No file under `src`, `test`, `packages/observe/rust`, `apps/fgos`, or `scripts` references `observe.eval.v1` by name, so no test pins these bytes.
- `FGOS_HOST_BIN=target/debug/fgos target/debug/fgos metrics eval list --dir forgentX </dev/null` exits 0 and returns 4 records (`observe-solo-opus-261005`, `observe-panel-261005`, `observe-independent-solo-261006`, `observe-independent-panel-261006`) with `invalid: []`. The host build is from 15:27:27, so this is the build the honesty report also used, not a new one.

## 5. Evidence directory and the wording sweep

`observe-independent-comparison-261006/completion-judge-evidence.json`: I added two entries to the top-level `limits` array. One says the scratch inventory is coordinator-authored and UNPROVEN. The other says the arms were separated by read audit only, not by sandbox isolation. I changed no raw output, transcript, or command snapshot. `jq` parses the file.

I grepped for "independent", "isolated", "tool-disabled", "scratch" and "demonstrated" in every file in scope, plus the how-to and the rubric. The remaining hits are true:
- "isolated flags" and "isolated judge/canary" refer to the accepted judge or canary argv.
- "independent doctor admissions" and "independent physical counts" mean an independent `find` scan.
- "independently retained listing" and "stayed independent" in the how-to are generic guidance.
- Earlier sections of the ledger are historical and now point to the correction section.

The rubric has no hits. The how-to needed no edit; the honesty report checked its lines 62–67, 111, 117, 141 and 172–175 as TRUE.

Retained as-is:
- `completion-eval-list.json` and `completion-eval-record-smoke.json` still say "independent current arm". They are command-output snapshots, and the ledger already discloses this.
- The model outputs that say "independent panelists" are question or answer text.

## UNPROVEN and not done

- The scratch A.md/B.md inventory stays UNPROVEN; there is no new evidence.
- The `evalId` values and the shard name still read `observe-independent-*`. They are immutable identities, so the overstatement is LOW and is disclosed in the `setup` text.
- `observe.eval.v1.json`: the `setup` and `judge` descriptions ("Identifier of …") also do not match the long prose in the stored records. They were outside my edit scope (I was allowed only `question`/`runRefs`), so I left them for the lead.
- LOW items outside my scope:
  - The `unsupported-version` precedence is undocumented (observe.md, CHANGELOG).
  - runner.md:1433 states the guard as absolute.
  - plan.md, phase-01/05/06 and their stale guard/stance text are left to the lead.
- No full-suite figures were recorded.

Status: DONE_WITH_CONCERNS
Summary: The two journals, the ledger (status line, :85, :168, a new last section with the eval-rewrite line), CHANGELOG (a, b, c), the two contract descriptions and one judge-evidence limits note were corrected against git, jq and the host's eval list (4 records, `invalid: []`). Nothing was committed.
Concerns/Blockers: the `setup`/`judge` descriptions in the contract are still inaccurate, but were outside my edit scope. plan.md, the phase files and runner.md:1433 still carry stale guard text for the lead.
