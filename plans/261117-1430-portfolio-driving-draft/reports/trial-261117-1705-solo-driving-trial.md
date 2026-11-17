# Trial report: solo driving, two items (2026-11-17)

Plan: `plans/261117-1435-solo-driving-trial/plan.md`. Baseline: its `reports/measures-template.md` (phase 1).
Sources: HARDEN's trial log (`.fgos/runtime/tmp/harden-release-gate-notes.md`, section "2026-11-17 15:1x solo trial
phase 1 gaps" to the end), the unit run records `.fgos/assignments/unit-run-17949041*` to `unit-run-1794907857866-*`,
git commit times, `plans/reports/audit-261117-1545-supervisor-watcher-audit.md`, and item 2's
`plans/261117-1553-run-verify-record-and-attention-view/{plan.md,reports/integration.md}` on `origin/trial/watch-attention`.
Times are Asia/Saigon. **Two items is observation only (prototype spec §12 rule 5), not a basis for redesign.**

## Items

| | Item 1: pathfold | Item 2: run verify record and attention view |
|---|---|---|
| Backlog / source | `p-2r54ft6njh` | audit section D items 5 and 6 (owner decision 15:55) |
| Item plan | `plans/261117-1524-windows-plain-path-fold/` (`contract: plan-v1`) | `plans/261117-1553-run-verify-record-and-attention-view/` (`contract: plan-v1`) |
| Branch, head | `trial/pathfold` `1d7df1075` | `trial/watch-attention` `63b32f557` |
| Landed | yes: `45ad5c4a0` (merge of `harden/land-pathfold`, 16:13), board `581ddcf52` 16:16 | **no**: main on HOLD since 17:00 (workflow seats tests red) |
| Case | none (no seat ran with `--case`) | none |

The second item changed from `p-d3vxsgz6to` (owner Q1) to the audit's verify/attention work after the owner's 15:55
decision. Measure sheets per item were not written as separate `measures.md` files; this report is the filled sheet.

## Wall time per role

| Role | Item 1 | Item 2 |
|---|---|---|
| shaper | 15:16-15:22:40, **6 min, 1 round**, D1-D5 from code (`25570bce0`) | none: the audit (15:45) was the shape; owner chose items 5+6 at 15:55 |
| planner | 15:22:40-15:28:30, **6 min** (`31ce74858`), incl. ~4 min for Q1 (UNC spelling) | `fgos run` solo 15:54:08-15:58:58, **5 min** (`88435d4dc` at 15:58:08) |
| wave 1 | rc.10 try 15:29:39-15:29:45 (blocked); fgos:dev 15:31:13-15:34:47, **3.6 min** for 3 seats; hand commits to 15:36:15; merges 15:37:33-15:38:00 | p1/p2/p3 16:18:01; p2 settled 16:19:08, p3 16:21:57, p1 refused 16:19:47 and finished by a subagent 16:29:22, **11 min** |
| wave 2 | phase 4 seat 15:38:33-15:43:13, **4.7 min** (runner commit `74b9e7b14` 15:42:47) | p4 16:24:20-16:27:32 (hand commit `fcb28b74c` 16:33:57); p5 16:30:57-16:32:30 (runner commit `97400956a`), **~10 min** |
| integration gate | 15:43-15:52, **9 min**, outside the sandbox: cargo 2820/0, clippy, fmt, win+mac check, node 113/0, seed check, census identical; seed test `1d7df1075` 15:54 | 16:35-16:57:45, **23 min**: cargo 2821/0, clippy clean, node 10 files 202/0; 6 `test/workflow` failures also on origin/main `581ddcf52` |
| land wait | 15:54 → 16:13, **19 min** behind the main HOLD | open (HOLD) |
| shape → green gate | **36 min** | **62 min** |

## Seats, retries, fallbacks

Every seat ran `claude`, passed with `--provider claude`, because `dispatch decide --for code:implement` still picks
gemini first. No openai or gemini seat was sampled.

| Item | Unit runs | Attempts | Retries / fallbacks | Outcomes |
|---|---|---|---|---|
| 1 | 7 | 8 | p2: first attempt `terminal:foreground-not-agent` (claude printed "Resume this session"), runner failed over to `producer/1-fb1` by itself | 3 blocked (rc.10 trust dialog), 3 execution-failure `commit-failed:git-error` (census hook) after a passing seat, 1 pass |
| 2 | 6 | 6 | none | 3 execution-failure `commit-failed:git-error` (census hook), 1 policy-refusal (`invalid-agent-result-claim`), 2 findings (planner run, p5 docs) |

Both `findings` runs had already committed (`88435d4dc` 15:58:08 before settle 15:58:58; `97400956a` 16:31:50 before
16:32:30): the producer round committed, then the configured verify (`cargo test --workspace`, in the sandbox) did not
pass. Nobody can say why today, because the verify outcome is not stored (see "verify" below).

## Manual interventions

| # | Item | At | Kind | Wait | What and why |
|---|---|---|---|---|---|
| 1 | 1 | 15:22-15:26 | design | ~4 min | Q1 UNC spelling, HARDEN answered C (named `\\host\share` fn for holder-lock only) |
| 2 | 1 | 15:29-15:31 | failure | 2 min | rc.10 seats stop at claude's folder-trust dialog; re-driven via `npm run fgos:dev` (fix on main, unreleased) |
| 3-5 | 1 | 15:33-15:36 | housekeeping | ~1 min each | census pre-commit hook refused p1/p2/p3 runner commits; HARDEN regenerated the census and committed `5d30cdc3a`, `4428810f0`, `fcc21ad31` |
| 6 | 1 | 15:37 | housekeeping | 1 min | wave merge: 2 census conflicts, resolved by regeneration |
| 7 | 1 | 15:43 | verification | 9 min | phase 4 seat could not regen the census or run the seed check in the sandbox; HARDEN ran them outside |
| 8 | 1 | 15:54 | review | 2 min | door-row seed test added (`1d7df1075`) before hand-off to OPC |
| 9 | 2 | 15:55 | design | 10 min | owner chose audit items 5+6 |
| 10-12 | 2 | 16:19-16:34 | housekeeping | 1-6 min | census refusal on p2, p3, p4; hand commits `3bc3bd196`, `c6b291f54`, `fcb28b74c` |
| 13 | 2 | 16:19-16:29 | failure | 10 min | p1 refused (raw newline in `result-1.json`); seat also could not run any Node test; a subagent fixed the 2 new failing cases outside the sandbox (`4816d0583`) |
| 14 | 2 | 16:35-16:57 | verification | 23 min | merge with census regen, full gate outside the sandbox |

Totals: design 2 (median 7 min), failure 2 (median 6 min), housekeeping 8 (median 1 min), verification 2 (median 16
min), review 1. **6 of 14 interventions are the census hook alone.**

## Plan defects found

- Item 1: (a) census regeneration was placed only in phase 4; every phase that edits a census-listed file must regen it
  in its own commit (found by the hook at 15:33, not by validate). (b) the new door row had no seed proof (found at the
  gate, fixed `1d7df1075`). (c) shaper: the backlog row named stale paths.
- Item 2: applied lesson (a) by naming the census as a hot file, but the seats still could not regen it in the
  sandbox. `plan-contract-check.mjs` could not run in the planner sandbox (YAML door, addon not shipped) and was applied
  by reading. The live `--verify` end-to-end check is unproven (integration report).

## Measures (spec §13.3)

| # | Measure | Item 1 | Item 2 |
|---|---|---|---|
| 1 | completion | landed | gate green, not landed (HOLD) |
| 2 | lead time | worker passing ~8 min; failed runs ~1 min; verification ~11 min; owner/hold wait ~23 min | worker ~12 min; failed runs ~10 min; verification ~23 min; owner wait 10 min |
| 3 | interventions | 9 (see table) | 6 (see table) |
| 4 | scope fidelity | no widened path recorded; seat claims not contradicted by the gate | p1 seat claimed done with 2 failing new cases (contradicted outside the sandbox) |
| 5 | plan defects | 3 | 2 (one carried over: census in sandbox) |
| 6 | detection latency | ~0: HARDEN waited on each `fgos run` in the foreground | ~0, same |
| 7 | gates at first independent check | integration gate passed first run; unit tests in commit yes; doc + changelog in `74b9e7b14` | gate passed first run except 6 pre-existing workflow failures; tests + docs + changelog in commits |

Friction recorded with `fgos friction record`: the 3 phase-1 entries plus 7 from the shaper at 15:23
(`layer-not-published`, `convention-door-unavailable-in-worktree`, `precommit-convention-check-skipped`,
`skill-rule-misfit`, `stale-backlog-row`, `scout-hook-blocks-common-word`, `cargo-output-dir-unset`). Phase 3 frictions
were not recorded as entries; they are the backlog rows below.

## Facts the owner asked to see

- **Veto point.** The plan contract added one key, `contract: plan-v1`, to the owner's plan-frontmatter key list so
  `plan-contract-check.mjs` can tell contract plans from legacy ones. Both items used it. The owner may veto it.
- **gemini has no tier above advanced** until agy serves a pro model: flagship = frontier = advanced =
  `gemini-3.8-flash-high` (machine stopgap in `~/.fgos/config.yaml`; the standard's `gemini-4-argon-high` is stale,
  `p-oimxdmixfn`).
- **verify.** `verify: null` in every solo result meant verify **ran** (the field is set only when it did not run;
  audit section C). The real gap was that the verify outcome was not stored anywhere, which item 2 now fixes (`verify`
  in the unit settlement, `unit-summary.json` and the `fgos run --json` result).
- **Watcher blind.** The trial's own watcher, `fgos workflow status`, saw no runs, because no seat used `--case`
  (`workflow: null` in every unit record). Detection latency is therefore not really measured.
- **rc.10 trust dialog.** `fgos run` seats under the installed rc.10 stop at claude's folder-trust dialog. The fix is on
  main, not released; the owner deferred every release cut until this trial ends. Note only, no row.

## What worked

- Parallel waves in herdr (workspace `forgent`, panes visible to the owner): three seats finished in under 4 minutes.
- The plan contract check: both plans passed it, and wave/footprint disjointness held at merge (only census conflicts).
- The shaper converged in one round (item 1) and the audit plus one owner answer served as the shape for item 2.
- The runner auto-committed by itself whenever no census-listed file changed (`74b9e7b14`, `97400956a`).
- Automatic fallback on a failed claude attempt (item 1 p2) needed no person.

## What blocked, ranked by cost

1. **Census pre-commit hook vs runner commit** (7 interventions: 6 refused commits and 1 merge, ~15 min): every seat touching a census-listed file
   lost its commit. Row `p-t55xjys4u5`.
2. **Sandboxed seats cannot verify** (~42 min of HARDEN gate time plus the p1 rework): no Node test runs
   (`git-addon-not-shipped`, even with `FGOS_HOST_BIN`), the census scan cannot run (git floor probe cannot write).
   Rows `p-dkkodseo63`, `p-w26qcthj37`.
3. **Main HOLD** (19 min for item 1; item 2 still waiting): outside the trial, but it dominates lead time.
4. **One malformed result file loses the round** (10 min): row `p-7hixnplas2`.
5. **rc.10 trust dialog** (2 min plus a switch to the dev host): released fix pending.
6. **Hooks and scripts that trip the driver**: scout-block refuses "target" (`p-ftn2uvbz6i`); the citation-drift check
   silently builds Rust in the default output dir (`p-t2dhvgxby5`).

## Gaps for the portfolio draft (ideas, not done; RUL104)

- Role boundary: HARDEN acted as supervisor, leader and committer; the leader role never ran as its own subagent.
- Data the supervisor needed but the frontmatter lacked: a per-phase "regen census" flag is not needed if the runner
  does it (row above); `footprint`, `base` and the wave table were enough to schedule both items.
- Work-layer coupling in `fgos-coding-shaping`: recorded as `skill-rule-misfit` and `layer-not-published`.
- Watcher: per the audit, run every seat with `--case`, and use `fgos dispatch inspect --attention --since` once item 2
  lands; a timer stays level 1.

## Clean-up (phase 4 step 7)

Not done in this phase: the gate key `runner.capabilities.code:implement.verify` stays set while item 2 waits to land;
the read-only prototype worktree and `~/.local/state/plan-supervisor/forgent/` stay until the owner closes the trial.
