# Observe second repair: docs and evidence wording

Scope: documentation and evidence wording only, 2026-10-06, on branch main. No source, test, fixture or JSON contract was edited. Nothing was committed, pushed or dispatched, and `npm test` was not run. The `opus-*` acceptance reports were not modified. Code/test files that show up in `git status` were changed by the two parallel agents, not by this pass.

## 1. Owner confirmation

- **Files:** `plan.md` (status paragraph, "Independent acceptance" paragraph), `phase-04` and `phase-06` (execution gate), `observe-discussion-measurement-261005.md` (header), `2026-10-05-observe-discussion-measurement-completed.md`.
- **Before → after:** "the owner confirmed … in this conversation" / "reconfirmed in the repair conversation" → "Owner xác nhận ngày 2026-10-06 trong phiên lead …; bản ghi hội thoại không nằm trong repo".
- **No quote invented.** "confirmation captured now" no longer appears in plan.md or phase-06. It still appears in the historical part of the ledger (`observe-acceptance-fixes-261006.md:7`, `:92`). That file only permitted appending, so the new section corrects it there instead of rewriting it.
- **Evidence:** the lead's statement in the task. The repo holds no transcript.

## 2. "Independent" overstated

- **Eval records** (`.fgos/observe/evals/observe-independent-comparison-261006.jsonl`):
  - `setup` before: "independent current arm".
  - `setup` after: "arm separation by read audit only … not sandbox-isolated … forgentX readable to solo, Sonnet, xai, GLM; only Gemini masked it". The panel record also gets the solo-summary timing. Both records now say that the packet includes the post-2026-10-04 decision (`runner.md:1435`).
  - `judge`: "before/after exactly A.md/B.md" became coordinator-asserted and unproven.
  - Scores, `evalId`, `runRefs`, `ts` and `question` were asserted unchanged in the rewrite script.
  - The two 261005 records were left as they were, because they already say "not independent".
- **Also corrected:** plan.md acceptance, phase-06 success criterion and evidence paragraph, the 261005 report header, the 2026-10-05 journal, the how-to (new read-audited vs sandbox-isolated paragraph), and the ledger's new section. Every one of these states the limit: one question, one isolated judge, directional only.
- **Evidence I checked myself:**
  - **Masks per seat.** I parsed each seat's `protected/launch-envelope/*.json` in mdview. Every seat has `--ro-bind / /`, and its `--tmpfs` masks are `/tmp`, `mdview/.fgos/assignments`, `mdview/.fgos/workflow-runs`, `~/.config/herdr` and `/tmp/fgos-confinement`. Only panelist-3 (executorId `gemini`) adds `--tmpfs /home/vantt/projects/forgentX`.
  - **Solo summary was readable before the panel ran.** `stat completion-contaminated-generation.json` shows birth = ctime = 14:12:38 +0700, and the file contains the solo's "Position: do not add a mechanical dissent/agreement gate…". Panelist-1 `run.json startedAt` is 07:14:28Z (14:14:28 +0700).
  - **2026-10-04 outputs exist** under `council-lens-experiment-261004/outputs/`.
  - **Source packet carries the decision.** `source-packet.txt:571` quotes `runner.md:1435`, including "Agreement là phép đo passive, không gate workflow".
  - **Question text matches.** `question.txt`, both records and `unit.json .objective` are equal (python check).
- **Validation:** `target/debug/fgos metrics eval list --dir forgentX </dev/null` returns 4 records with `invalid: []`. Filtering by harness plus the full objective returns exactly the panel record.
- **Not edited:** `completion-eval-record-smoke.json` and `completion-eval-list.json`. They are command output snapshots, and they still contain the old "independent current arm" text. The ledger discloses this.

## 3. plan.md contradiction and guard criterion

- **Contradiction fixed.** The fresh-comparison bullet now states read-audit-only separation and the evidence-condition difference. The repair-gate bullet now says it "does not add independence evidence beyond the read-audited comparison above", so the two lines no longer contradict each other.
- **Guard criterion added, unticked:** `- [ ] Source/import guard: exact import-closure assertion plus an allow-list of assignments-tree enumerators … Status: in progress`.
- **New subsection:** "Second acceptance round — 2026-10-06".

## 4. Rejected-judge evidence

- **Files:** `completion-data-blind-judge-evidence.json` and `completion-data-blind-judge-2-evidence.json`.
- **Change:** each file gets `isolated: false`, an `isolationNote` (default argv; `hookEventCount` 0 means nothing without `--include-hook-events`) and a `labelSwappedReplicate` field. `limits` changes from "verified by a tool-disabled judge" to "Not isolated …". All other fields and the 2-space formatting are unchanged.
- **Evidence:**
  - **Argv.** The `execution` argv contains `acceptEdits` and lacks `--tools`, `--safe-mode` and `--include-hook-events`. The accepted judge's argv has all three.
  - **Label mapping.** `randomizedMapping` A = panel synthesis (sha 13747bcc…), B = solo.
  - **Scores.** The retained transcripts give panel 2/1/1/1/1 = 6 and solo 1/2/2/1/1 = 7 (judge 1), and panel 1/1/1/1/1 = 5 and solo 7 (judge 2).
- **Reported** in the ledger section and in phase-06 as a same-direction, data-blind signal.

## 5. Scratch inventory "only A.md/B.md"

- **Status: UNPROVEN.** The only source is the coordinator-written `before`/`after` arrays. `/var/tmp/discussion-judge-*` no longer exists, and `mdview/.fgos/assignments/asgn-claude-1791271898870/runs/01/` contains only `run.json`.
- **Wording changed** in phase-06, the eval `judge` field, the how-to judge paragraph and the ledger.

## 6. How-to

- **(a) Scratch location.** `mktemp -d /tmp/...` is now `mktemp -d /var/tmp/...`. The reason given is that the confined launch mounts a tmpfs over `/tmp`, and the user should check that the SDK cwd equals the scratch path. Evidence: the accepted judge's `execution` argv contains `--tmpfs /tmp` (twice) and binds `/var/tmp/discussion-judge-nmGTTl`. The how-to also now says that the isolated judge profile was temporary and not committed.
- **(b) `--question` example.** `eval.rs:36` and `eval_journal.rs:325` (`record.question == q`) show the filter is whole-string equality. The example now builds `q` from `jq -r '.objective' …unit.json`. Tested:
  - the old example `--question panel-dissent-agreement-261004` returns `[]`;
  - the new form returns both 261006 records;
  - with `--harness=fgos-panel`, it returns only the panel record.
- **Wording.** "shared question ID" became "the shared `question` string".

## 7. CHANGELOG

- **Added under `[Unreleased]`:** `fgos run --unit <file> --stance-options` declares options; `--stance-options` with `fgos run --resume` is refused with exit 4.
- **Evidence:** the refusal is in committed HEAD (`run.mjs`, added in `b2c7b4588`), and `bin/fgos.mjs` passes `--stance-options` on `fgos run`. I ran `node bin/fgos.mjs run --resume unit-run-0-x --stance-options 'a|b' --dir <scratch>`: it printed "cannot provide stanceOptions when resuming a unit run…", exited 4 and created no files.
- **Correction to the task wording.** `workflow resume` does not accept `--stance-options`; only `workflow start` (already in the CHANGELOG) and `fgos run` do. The new line therefore names `fgos run`, not `workflow start|resume`.

## 8. phase-05 regression line

- The checkbox is left as it was. A sub-note marks the "real CLI-prompt regression" as **đang khôi phục** and links to the evals re-acceptance HIGH-1.

## 9. Ledger update

- Appended "## Cập nhật sau nghiệm thu lần hai" to `observe-acceptance-fixes-261006.md`. It links the three `opus-reacceptance-*` reports, lists each corrected statement with its file evidence, and adds a status table.
- No earlier text was changed.

## Validation

- A link, anchor and H1 check over the 8 edited markdown files found 0 missing paths, 0 missing anchors and exactly one H1 per file.
- Both edited evidence JSON files and the eval shard parse. The eval list read the shard back.

## UNPROVEN / open

- The scratch inventory (task 5) and the owner confirmation (no transcript in the repo).
- **Hang to look into:** `target/debug/fgos metrics eval list` without `</dev/null` hung once in this session. The process was blocked on `unix_stream_data_wait` with stdin attached to the harness socket. The same command with `</dev/null` returned at once. I did not find the cause and did not document it.
- **Outside my file scope, not edited:** `plans/journals/2026-10-06-observe-independent-comparison-completion.md`, whose title says "independent comparison" and which repeats the scratch claim, and `plans/journals/2026-10-06-observe-acceptance-repair-verification.md`. The lead should decide whether to correct them.
- **Contract wording:** `observe.eval.v1.json` describes `question` as an "Identifier of the exact shared question", but the real records store the full objective text. I did not change the contract (out of scope).
