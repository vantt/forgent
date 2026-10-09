# Independent review round 2: advisory path M (2026-10-08)

Target `feat/advisory-path-m` @ 8402b9441 vs a0226f022. Read-only; tests run with `CLAUDE_CODE_SESSION_ID` unset, probes in scratch copies only (`git archive`, removed).

## 1. The "one failing test" — not reproducible, not a blocker

Full `node scripts/run-tests.mjs` in the worktree: **6991 tests, 6918 pass, 0 fail, 8 skip, 65 todo, exit 0** (344 s). `herdr-reconciliation.test.mjs` "20. live Herdr gateway executes confined launch end-to-end when gateway is running" **passed** (27.6 s, really executed). The agent's `worker-spawn-fail/confinement-mismatch` was environmental (its own session/pane state). No base comparison needed. **The agent's landing blocker is not real.**

## 2. The seven fixes

| Fix | Verdict | Proof; fails without fix? |
|---|---|---|
| (a) close gate | OK. `runner.mjs:284-293` catches any render error, parks with "Cannot read settled producer…" | `workflow-runner.test.mjs` "producer expertise gate parks clearly…" (fenced, heading, prose, `{}`, `''`, `[' ']`, tamper) + "absent producer…": asserts status parked, resume parked, answer completes. Yes, it fails on base (no interpolation). Missing report file: covered only by the shared catch, no own test (LOW). |
| (b) settlement on both branches | OK in code (`settlement.mjs:313,319,336`) | `advisory-m-contracts.test.mjs`: reviewers now claim `done`+`findings` (fails on base → would settle pass). Coding validate-plan/implement-item: asserts producer rounds [1,2], status failed, gate pending. Real, not tautological. Mutating branch: `assignment-runresult.test.mjs:1600` (implementer, verified). Coverage is **workflow-level only**; see §4. |
| (c) config | OK. `.fgos/config.json` byte-identical to base; no `strict-mcp`; 14 claude-herdr prefs unchanged | cmp |
| (d) `--context-ref` | OK. `runner.mjs:724-729` rejects plain paths cross-repo before `createWorkflowRun`; `unit-run:` resolves from state root (`handoff-refs.mjs:113`, hash-checked `:68`) | `workflow-runner.test.mjs` "cross-repo workflows reject…" (asserts no `workflow-runs` dir); CLI repeat test. Rust host forwards `args_os` verbatim (`legacy_exec.rs:244`, code read; agent's strace claim not re-run). |
| (e) skill | OK. 142 lines; `status`/`answer` doors at SKILL.md:85-86; renders identical except the generated header. Still no `dispatch decide` way to obtain the bind/posture evidence it requires at :48-51 (LOW, carried over). | |
| (f) docs | OK. No plan/packet ids, stall rules or acceptance wording; `{{report:…}}` is called "new". The old plan link was removed too. | grep |
| (g) live-run protocol | In the worktree report, not in SKILL/runner.md. Mostly correct; gaps in §5. | |

## 3. Budget and scope (recomputed)

Source+bin 102/200 (+84 −18). Docs 71/100 (runner.md 5, CHANGELOG 1, plan report 65). Skill 142/200. Reopen YAML 48/60. Dispatch: only `cli.mjs` (17) and `settlement.mjs` (5); nothing in herdr or confinement. Durable state: only `contextRefs` in `workflow.start`. One field. Both YAMLs are linear. The unused `template.contextRefs` remains (LOW).

## 4. Blast radius

- **HIGH, proven regression (coding driver loop).** `loop.mjs:987` stops whenever `!runOutcome.satisfied`, **even when operation-choice routes** (`stop:false, nextOperation`). A `review-item` reviewer that claims `done` + `verdict:REJECT` + `assessment.verdict:'findings'` now settles `findings` → `satisfied=false` → the loop stops, and the item becomes `blocked` (`loop.mjs:989`, secondary op). It no longer routes to `fix-verify-red`. Probe: `loop.test.mjs:2415` with an `assessment: {verdict:'findings'}` added to the claim: **base passes, head fails** (`dispatched.length` 1 vs 2). The owner sees `stopped safely (review-item-rejected-route-fix) — Work lifecycle untouched`, which contradicts itself. The same shape applies to validate-plan NOT READY → shape-plan (UNPROVEN). This affects `fgos run` on other projects (mission #1).
- **Operation-choice** (`operation-choice.mjs:1745-1751`): only `work-product`/`advisory` resultKinds (implement-item, fix-verify-red, scoped-subtask, scout-blast-radius…) whose claim *volunteers* `assessment.verdict:findings` (it is required only for reviewer/red-team/recheck, `agent-result-claim-contract.mjs:21-25`). The reason is `assignment-<op>-insufficient-confidence`, so the item goes back to `todo` (scout → `blocked`). The reason text is misleading but pinned by a test. review-item/validate-plan read their own verdicts there; they are unaffected at operation-choice and hit only by the loop gate above.
- **MEDIUM, untested.** `run.mjs:471` commits mutating work only on `pass`. A mutating producer that volunteers findings is no longer committed, and its worktree is kept with "unit ended findings" (`runner.mjs:187`).
- **LOW.** Resume reuses only `pass` seats (`panel.mjs:58`, `reviewed.mjs:248,281`, `solo.mjs:30`), so findings seats are re-dispatched. Recheck/coordination consumers of done+findings were not inspected (UNPROVEN; suite green).
- The `inconclusive`/`blocked`/`not-applicable` → pass collapse at `settlement.mjs:313`: nothing in M depends on it (all M contracts key on `findings`). A done reviewer saying `inconclusive` still counts as pass in advisory.

## 5. `--dir forgentX --worktree mcp-skill-hub` (code read)

`runner.mjs:704-706`: mainRoot=`--dir`, worker=`--worktree`. The workflow YAML is loaded from **forgentX checkout files** (`loadWorkflow(packageRoot: mainRoot)`) while code comes from the activated release, so the two must match. Config is re-read **per Unit** (`run.mjs:240`) from forgentX, so `claude-herdr` resolves and the overlay must cover the whole advance. Trust is the cwd entry for mcp-skill-hub. The MCP flag must be in `claude-herdr-bwrap.args`, which the overlay does. Resume/answer do **not** persist the worker (`runner.mjs:966-971`), so every resume needs the same `--dir`, `--worktree`, cwd and overlay.

**Live-run risk (UNPROVEN, likely):** non-blind steps (critique, synthesis checkers, explanation, reopen refs) receive **absolute paths in other assignment dirs** under `forgentX/.fgos/assignments` (`run.mjs:305`). `withRunDirReadAccess` grants only the role's own run dir + `inputs`. A cross-repo claude worker reading a sibling report sits outside its cwd and add-dirs, which can trigger a permission prompt: the stall class this function exists to prevent. Node-worker tests can never show it. `cli.mjs` is an M exception file, so the stop rule allows one fix.

Shape (UNPROVEN): `cd /home/vantt/projects/mcp-skill-hub && bwrap --bind / / --ro-bind "$tmpCfg" /home/vantt/projects/forgentX/.fgos/config.json -- /home/vantt/projects/forgentX/.fgos/installation/bin/fgos workflow start architecture-advisory --request "$CASE" --dir /home/vantt/projects/forgentX --worktree /home/vantt/projects/mcp-skill-hub --foreground`. Any runtime write to config.json would hit EROFS (UNPROVEN that none exists).

## 6. Verdict: land after one named fix

Blocks landing:
1. `loop.mjs:987`: honor an operation-choice route (`stop:false` + `nextOperation`/`canProceed`) before applying the `satisfied` gate. Add the probe above as a test (review-item done+findings+REJECT → fix-verify-red). Stays within the owner's one-door decision and the source budget.

Blocks the live run, not landing:
2. Before launch, check cross-dir reads: either grant the add-dir for resolved contextRef parents in `withRunDirReadAccess`, or confirm claude reads outside the add-dirs without a prompt. Write "repeat `--dir/--worktree`/overlay on any resume" into the protocol.
3. Activate a release that contains M (YAML from the checkout, code from the release).

Can wait: a test for the missing report file; the commit on mutating-findings; findings-seat resume reuse; the `dispatch decide` hint in the skill; the misleading `insufficient-confidence` reason; the inconclusive collapse.

## Unresolved

- Does claude (default permission mode, herdr REPL) prompt on Read outside cwd/add-dirs? It decides item 2.
- Is validate-plan NOT READY + findings stopped the same way? Not probed.
- Recheck/coordination consumers of a settled `findings` verdict: not inspected.
