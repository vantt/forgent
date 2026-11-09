# HARDEN T8 (Skill/Domain) closing report

Main `666e9737b` plus the close commit (2026-11-09, fg-server2). Inputs: [sub-plan](../261109-1304-harden-t8-skill-domain/plan.md), [arbitration](council-261109-1000-harden-t8-arbitration.md) (Part A shapes and budgets), [baseline](research-261109-0654-harden-t8-baseline.md), the lead reports and board lines of the phases, the [owner guide](guide-261109-1324-owner-machine-harden-t8-skill-domain.md), the [cross-layer authority audit](audit-261109-1736-harden-authority-layers.md). Citations glossed: **RUL104** ("better, not bigger": hardening adds no feature, layer or mechanism), **L10** (extend through the door, never beside it), decision 79 (owner, 2026-11-09 13:04, Q1 a, Q2 probe, Q3 b, Q4 a, Q5 kit-agnostic, Q7 a, Q8 a; see the HARDEN plan), decision 82 (owner, 17:36: every decision has one authority, in the lowest layer that can know it).

**Verdict: behaviour acceptance met; size acceptance (net lines per language) met; three component or speed budgets missed; the layer is not yet one authority for "which domains" (audit AU-22).** Every behaviour of the layer landed and is held by an owning test (the 22-file set is green at the tip: 351 tests, 0 fail). Node is -979 lines, tests -2 438, Rust 0, source and generated text -4 020. Two line budgets (`project-agents.mjs`, the citation guard) are over by 11 and 5 lines, and the speed of the layer's own test files could not be shown at quiet load (the machine never fell below load 8 during the passes). The release that carries T8 is not yet activated on any machine: the smoke on a release is the operator's step from the guide.

## Before / after

| Measure | Baseline | Now | Budget (Part A) | Verdict |
|---|---|---|---|---|
| Net Node (`src bin scripts` plus the `distill` script), all 19 T8 commits | n/a | **-979** (added 631, removed 1 610); -1 015 without the first, owned-names commit | at most 0; estimate -1 040 | **met** |
| Net tests | n/a | **-2 438** (added 761, removed 3 199); -2 565 without the first commit | at most 0; estimate -2 870 | **met**; 430 lines short of the estimate, paid by red tests of refusals (+208 in the render-correctness phase against +60 estimated) |
| Net Rust | n/a | **0** | 0 | met |
| Source and generated skill text, plugin mirror, doctrine | n/a | **-4 020** (added 104, removed 4 124) | estimate -4 300 | met |
| Tracked files in the three skill trees (`git ls-tree` at `b009e5b4f` and now, lines of every file) | 30 403 (Markdown only: 23 609) | 26 661 (Markdown only: **20 608**) | about 20 000 Markdown after the reference copies go | met (the baseline's own 24 069 could not be reproduced by line counting; both ends here use one method) |
| `npm run build:skills`, warm, 3 runs (load 5.9 to 6.1) | 1.1 to 1.3 s at load 11 to 15 | **1.04, 1.01, 1.02 s**; a second and third run changed no file (`git status` unchanged, no file newer than the first run's log) | at most 1.5 s; second run writes nothing | **met** |
| 22 test files of the layer, summed test time | 39.6 s at load 3.4 to 4.6 (418 tests) | **39.9 s** at load 8 to 15 (351 tests); 93.9 s at load 30 to 37 | none stated for all 22 | context only: four of the files are Work's and are unchanged (`fgos-stage` 12.8 s, `knowledge-registry` 5.2 s, `knowledge-canary` 4.9 s, `fgos-coding-knowledge` 2.3 s) |
| The 18 T8-owned test files, summed test time | 49.9 s at load 36 to 47; about 13 s at quiet load (the speed seat's estimate from file ratios) | **14.8 s** at load 8 to 15; **34.3 s** at load 30 to 37 | at most 13 s at quiet load | **not shown**: same-load pair (load class 30 to 47) is 49.9 s to 34.3 s, -31 percent; no quiet pass was possible. Largest now: `check-decision-citation-drift` 3.2 s, `domain-registry-compiled` 3.5 s (one real `doctor --json` run, kept as the single wiring proof) |
| Skill copy of a new worktree (the copy step alone; main checkout holds 525 foreign skill dirs) | 3.7 s at load 41 and 4.4 s at load 98 (shell `cp -R`), 8 759 files, 89 MB | **0.41 s** warm cache and **1.52 s** cold cache at load 4.4 to 4.6; 8 763 files, 62.5 MB of content (89 MB on disk) | record it; size stays unless the hardlink is safe | recorded; **size unchanged by design** (a hardlink write alters the source, probe in the contract) |
| `fgos worktree create` end to end | 3.9 s at load 10.6 (speed seat) | **not re-timed** | record it | gap: plain `fgos` runs the activated release (no T8), and the dev host would also run the old config line, which the main checkout has not pulled (114 commits behind) |
| Doctor rows of the layer | ids and count | unchanged: no commit of the layer adds or removes a registration (`git show` over the five code commits shows no `registerCheck` or row `id:` line); three rows judge more | ids and count unchanged | met; live `fgos doctor` row output is the operator's smoke (release not activated) |

Load notes: the machine was at load 39 at the first pass, 8 to 15 at the second, 30 to 37 at the third (other lanes' suites). Compare pairs of equal load class only. Logs: `/dev/shm/t8p13-files-{a,b,c}-*.log` and one file per run `/dev/shm/t8p13-{a,b,c}-<file>.log`.

## Size: `wc -l`, budgets and net

| Component | Baseline | Budget | Now | Met |
|---|---|---|---|---|
| `src/setup/skill-wrappers.mjs` | 1 362 (1 410 at plan time) | at most 780 | **765** (longest function 67 lines, none over 130) | yes |
| `scripts/build-skill-wrappers.mjs` | 42 | at most 30 | **30** | yes |
| `scripts/build-domain-registry.mjs` | 79 | at most 95 | **95** | yes |
| `scripts/project-agents.mjs` | 258 | at most 275 | **286** | **no (+11; estimate +12, real +32 at landing)** |
| `scripts/check-decision-citation-drift.mjs` | 515 | at most 503 | **508** | **no (+5 over, -7 from baseline)** |
| `scripts/measure-coordination-baseline.mjs` | 464 | deleted | deleted | yes |
| `src/util/domain-dirs.mjs` | none | at most 25 | **22** | yes |
| Shared fragments (`core/skills/_shared`) | 13 | -2 (-200 lines) | **11** (the two deleted were 110 and 90 lines) | yes |
| `domains/coding/AGENTS.md` | 89 | at most 9 | **7** | yes |
| `test/setup/skill-wrappers.test.mjs` | 3 735 | n/a | 1 031 | n/a |

Net over the 19 T8 commits (`git show --numstat` per commit, `/dev/shm/t8-numstat.sh`; Node is `src`, `bin`, `scripts` `.mjs` plus the `distill` script; tests are `test/**` `.mjs`; the generated and source skill text, plugin mirror and doctrine are one row; JSON, Markdown docs and config are excluded; moved lines count on both sides). The commits: the owned-names fix `6f98ce04a`; P01 `381b18296`, `4f2535874`; P06 `9309685c0`, `688850394`; P10 `4c40941a1`, `95ed05914`; P04 `7bd1b5998`, `f6688d5be`; P08 `3aa200966`; P07 `d06e7b393`; P02 `f00e9de5e`; P03 `593be681c`; P09 `63a861af4`, `19d3a9fc3`; P11 `d6cc9ab76`; the landing unit `adb9cc204`, `c8325c203`, `1e14daec0`.

| Language | Added | Removed | Net | Target |
|---|---|---|---|---|
| Node | 631 | 1 610 | **-979** | at most 0 (met) |
| Rust | 0 | 0 | **0** | at most 0 (met) |
| tests | 761 | 3 199 | **-2 438** | at most 0 (met) |
| skill source, renders, plugin mirror, doctrine | 104 | 4 124 | **-4 020** | n/a |

Increases and what paid for them (per commit, Node / tests): owned-names door +36 / +127 (the first fix); doctor claims +28 / +56; worktree provisioning +50 / +36 (a default step replaces a shell line the config held); persona projection +32 / +65 (three new refusals); render correctness +20 / +208 (link refusal, stamp, same-name refusal, fixed point: eight red tests); compiled-domain check -12 / +50; domain-dirs door -13 / +34; durable write +7 / +14; guards -7 / +5. Payers: the Gemini generator -651 Node and the 88 retired tests -3 056, the dead script -464 / -7, the twelve hand-written domain walks and the doctor row's own walk, 29 reference copies and two fragments (generated -4 020). Every increase is behaviour the plan asked for and each has a red test; no deletion was left unspent.

## Acceptance criteria 1-8

1. **Every row of "Where each item goes": done, with one half-item filed.** Evidence by row: P01 `381b18296`, `4f2535874` (retired-title to owner table in the commit body); P02 `f00e9de5e`; P03 `593be681c` (probe: [report](research-261109-1317-harden-t8-reference-copy-probe.md), verdict PASS); P04 `7bd1b5998`, `f6688d5be`; P05 `adb9cc204`; P06 `9309685c0` (red test), `688850394` (fix); P07 `d06e7b393`; P08 `3aa200966`; P09 `63a861af4`, `19d3a9fc3`, `c8325c203`; P10 `4c40941a1`, `95ed05914`; P11 `d6cc9ab76`; P12 `1e14daec0`. **Not built:** T8-10, refusing an effective-set write onto a skip-worktree path: the Git Inspect port reports no such flag and RUL104 forbids adding a port verb here, so it is backlog item `p-ojh4dcf6f2` for OPC; the remove-side guard (landed before T8) already accepts a byte-identical write-back. Red evidence for the unreproduced Medium and Low findings: tests added red first in P02 (eight, among them the old-union package filter verified red), P07 (four), P08 (three), P06 (the test commit precedes the fix commit); structure-only scans in the lead reports. **Gap, stated:** `distill`'s name refusal (T8-21) has no test file by design, and its recorded scratch run was never written (no report exists for that phase). I re-ran it at the close: the script as of the parent commit, given the source name `../../../../../escaped-before` against a fresh learning area, wrote `escaped-before.md` outside the area; the current script exits 2 with `invalid source name` and writes nothing. The durable AGENTS.md write (T8-18) has +14 test lines but no red run recorded in a report.
2. **Budgets: partly met.** Table above: seven of nine line budgets met; `project-agents.mjs` and the citation guard missed; no function over 130 in `skill-wrappers.mjs`.
3. **Door scans** (all run on the tip): the Gemini, adapter and duplicate-option names in `src scripts test bin`: nothing; `readdirSync(.*domains` in `src scripts bin`: `src/state/domain-registry.mjs:72` (Work, filed `p-bxahsop7em`) and `src/util/domain-dirs.mjs:13` (the leaf); `includes(GENERATED_WRAPPER_MARKER)` and `includes(ASSEMBLED_HEADER_PREFIX)` in `src`: nothing; `\bak-[a-z]|ak-\*` in `src scripts bin`: nothing; `git show origin/main:.fgos/config.yaml | rg "\bak-"`: nothing; `fgos-coding-compounding` in `core domains plugins`: nothing.
4. **Behaviour, each by its owning test** (all green in the 22-file pass at the tip): a link in a skill source or target is refused by name (`skill-wrappers.test.mjs`: "a link in a skill source or target is refused by name and never followed"); a second render writes nothing and a deleted source leaves no stale copy ("a second render after a source deletion is a fixed point and a third render writes nothing"); a foreign skill dir is left byte-identical in all three trees ("rendering a checkout leaves a skill directory of another kit byte-identical under every skill root"); a same-name dir without the stamp is refused by name by render and setup; a package skill never overwrites a target's own core skill; a foreign skill that quotes the marker is not pruned; a projection refusal leaves the tree untouched; both drift guards and `fgos-mirror` judge owned names only and every owned name has a tracked `.agents` and `.claude` render (`fgos-mirror.test.mjs`: "every owned skill has a tracked .agents/skills/<name> render and a tracked .claude/skills/<name>/SKILL.md"; ".gitignore allowlists exactly the owned skill names"); `agent-claims-resolve`, `executor-skills-installed` (P06 tests); `domain-registry-compiled` flags an orphan and a duplicate workflow key (`build-domain-registry.test.mjs`); `project-agents` refusals (`project-agents.test.mjs`); `listDomainDirs` (`test/util/domain-dirs.test.mjs`); a new worktree receives every ignored skill dir ("a new checkout receives every ignored skill directory of the main checkout, byte for byte, and leaves tracked skills to Git", `worktree.test.mjs`). The rerun-copies-nothing smoke of the worktree phase was not repeated here; its proof is the test above and its own report.
5. **Measured on the activated release: partly.** `build:skills` and the copy step were measured from the source tree (the release is not activated); the quiet-load test time and the end-to-end `worktree create` were not shown (table above).
6. **Retired tests name their owners:** P01's commit body lists the 88 tests by group and owner (behaviour removed, or `dead-vocabulary-guard.test.mjs`, or the assemble and portability tests); P04 changed the meaning of one sweep case (stated in its report); P09 retired seven test lines with the script's two enumerator rows (the rows' owner was the script).
7. **Land gate green at each land; doctor row ids and count unchanged:** yes (the known frozen-addendum red and two load-sensitive or drifted reds are named in each lead report). No condition of the arbitration's doctor table was lost.
8. **Net size at most 0 per language: met** (table above).

## Authority (owner decision 82)

**Owned once now** (decision, where, who reads it):

| Decision | The one door | Read through it by |
|---|---|---|
| Which skill names fgOS owns | `ownedSkillNames(...roots)` in `src/setup/skill-wrappers.mjs`, from the sources | the render, the plugin mirror, `fgos setup`, the doctor row `agent-claims-resolve` (`registrations.mjs`), the guards |
| Is this generated file ours | the anchored stamp (`isGeneratedWrapper`, `carriesAssembledHeader`): first line after the frontmatter | the prune, the same-name refusal, the plugin mirror |
| May a skill file be copied (no link) | `lstatPlain` leaf at every copy site of `skill-wrappers.mjs` | the render and setup copies |
| What a render of an owned skill looks like | `renderSkillSurfaces(root)`; the script is `ensureAddonForScript()` plus one call | `npm run build:skills`; `fgos setup` calls the same steps |
| Which directories under a skill root are not fgOS-owned | Git (ignored status), read through the Inspect port inside `provisionSkillRoots` (`src/runner/worktree.mjs`); no kit named | worktree creation |
| Where each agent CLI reads project skills | `AGENT_SKILL_DIRS` (`src/util/agent-skill-dirs.mjs`) | worktree provisioning and the `executor-skills-installed` row |
| The walk over a `domains/` directory | `listDomainDirs` (`src/util/domain-dirs.mjs`) | the 12 callers moved in 10 files |
| Is a compiled domain faithful to its YAML | `checkCompiledDomains` (`scripts/build-domain-registry.mjs`) | `--check`, the doctor row, the test |
| Where domain doctrine is read from | the running fgOS payload (decision 79 Q4 a), stated by `fgos-routing`; the root is printed by the `legacy-node-payload-present` doctor row | routing skill text |
| Persona agent output name | the source file stem, checked against the Convention agent-name rule | `scripts/project-agents.mjs` |

**Still shared or in the wrong place** (what, where now, where it belongs, item):

| What | Where now | Where it belongs | Item and owner |
|---|---|---|---|
| The root each caller walks for `domains/` | six roots (payload, project, cwd, install root): the walker is one, the root is the caller's choice; two of them contradict "doctrine only from the payload" | a T8 domain catalog that resolves the payload root and returns each domain's directories and compiled registry (audit AU-22; `compiled.json` has no version field) | a T8 fix phase proposed by the audit; **not part of this close**: needs the owner's go (it is a new door, RUL104) |
| Which workflow definition an id names | setup puts the payload first, the runtime puts the project first (`src/setup/workflow-definition-files.mjs` against `src/workflow/loader.mjs`) | the Workflow loader (audit AU-21, High); owner question 4 of the audit decides whether projects may shadow | T6 fix phase (or T8, one phase not both) |
| The domain list inside Work | `loadDomainsFromDisk`, `src/state/domain-registry.mjs:72` | `listDomainDirs` | backlog `p-bxahsop7em`, WORK |
| The symlink-refusal predicate | `lstatPlain` in `skill-wrappers.mjs` and inline copies in `scripts/build-rust-distribution.mjs` (`src` may not import `scripts`) | one leaf under `src/util`, imported by both | T9 phase "refuse-symlink-leaf" (plan `261109-1718-harden-t9-host-surface`) |
| The compiled-domain judge | in `scripts/`, imported by a `src/setup` doctor row (a lower layer knowing a script of an upper one) | `src` (with the domain catalog above) | goes with AU-22 |
| Worktree skill provisioning knowledge in a doctor message | the `executor-skills-installed` text still says "worktreeSetup provisioning" | name the owner (provisioning), not the mechanism | backlog `p-bv4xcs2xdl` |
| Skip-worktree status of a path | Git knows it; the Inspect port does not report it, so a projection writer cannot refuse | the Git port | backlog `p-ojh4dcf6f2`, OPC |
| Skill tree paths in the render | the render writes `.agents/skills`, `.claude/skills` and the plugin tree by literal path; `AGENT_SKILL_DIRS` lists the same two roots for readers | accepted: the render owns two roots it writes, the list names five roots agents read; they agree by test (`.gitignore` allowlist test) | none |
| `workerContractFor` (test-only caller), `skillPath` null in `work-compat.mjs`, a vendor prefix in the name of `core/skills/_shared/ak-cook-worker-contract.md` | Work and COOK files | their owners | backlog `p-g7yn3j7q4x` |

**A task found in the wrong layer and moved:** worktree skill provisioning was a shell line in the project config naming one vendor prefix (a Config-layer file holding a Skill-layer rule with a kit name). It is now `provisionSkillRoots`, a default step of `provisionWorktree`, with the Git Inspect port as the authority on "ignored" and the one `AGENT_SKILL_DIRS` list shared with the doctor row; the config line is gone in the same change (L10). The render script body moved into `renderSkillSurfaces` (the script is thin).

## What moved where

Settled rules and their proofs are in `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` section 3.1 (render rules, the `.claude` probe with its date and the path the seat opened, the `.gitignore` allowlist test, kit-agnostic provisioning with the hardlink probe result, the limit line) and section 9 (the three doctor rows); `docs/platform/domainization/architecture/domainization.md` section 14 (doctrine from the payload, one walk, `compiled.json` equals its compile, persona projection). The decision narrative of decision 79 is the first entry of "Lịch sử quyết định" in `docs/platform/packaging-distribution/spec.md`. Stale text removed: the Gemini rows (P01) checked; the contract's "companion/reference files inherit it" line (false since the reference copies went); the trigger-vocabulary claim of "implemented" derivation and the alignment row naming `mapSkillIntentToHostTriggers` (deleted with the Gemini generator, found at this close); the spec's "future Gemini extension packaging". Three alignment rows added (owned-name render, wrapper holds only `SKILL.md`, kit-agnostic provisioning). CHANGELOG: two lines added that two phases had missed (persona projection, `distill`). Backlog rows filed (ids from `fgos identity mint backlog`): `p-vcoaluq6ix` (OPC: census churn from rendered skill files), `p-tgqxcemygh` (Packaging: setup retirement and the `files` list), `p-ojh4dcf6f2` (OPC: skip-worktree flag), `p-bv4xcs2xdl` (doctor wording), `p-g7yn3j7q4x` (WORK and COOK leftovers); `p-bxahsop7em` (WORK) was filed by the domain-dirs phase and is unchanged.

## Smokes run at this close, and what was not run

Run: the 22-file set three times (351 tests, 0 fail each time); `npm run build:skills` three times from the worktree (second and third wrote nothing); the copy step of worktree provisioning against the main checkout's ignored skill dirs, twice, into scratch directories (removed); the `distill` before and after run above; the door scans. **Not run:** build, stage and activation of a release on fg-server2, `fgos doctor` and `fgos worktree create` on that release, and the owner-machine steps (guide). Lead decisions: none needed.

## Open items handed off

- **Owner decision (missed budgets).** What is happening: three budgets are missed, `project-agents.mjs` 286 against 275, the citation guard 508 against 503, and the speed of the 18 owned test files is not shown at quiet load (14.8 s at load 8 to 15 against 13 s). Cause: the persona phase added three refusals (estimate +12, real +32) and the citation phase kept its drift cases; no quiet window existed. Options: (a) accept both line misses and re-time once at quiet load (no work; recommended: the net is below zero in every language and each miss is a safety rule with a red test); (b) one small size pass on the two scripts (about 16 lines, risk of dropping a refusal); (c) block the close until a quiet re-time exists. Recommendation (a). Scope of the answer: T8 only.
- **T8 fix phase for the domain catalog and the one root** (AU-22), with the workflow-definition precedence (AU-21, owner question 4): needs the owner's go before a phase is written.
- Backlog, by owner: `p-bxahsop7em` (WORK), `p-vcoaluq6ix` and `p-ojh4dcf6f2` (OPC), `p-tgqxcemygh` (Packaging), `p-bv4xcs2xdl` (doctor wording, HARDEN), `p-g7yn3j7q4x` (WORK and COOK); the symlink leaf is T9's.
- **Release activation and smoke of T8** on fg-server2, then forgentX and fg-server by the guide (including `git pull --autostash` for the local `.fgos/config.yaml` lines).
- **Cross-lane steps not confirmed from here:** DOC has not been told of the three doc edits (a subagent cannot message peers; the coordinator relays: contract, domainization, packaging spec, alignment, backlog); no OPC review line is on the board for the P09 and P12 census diffs (the census holds digests only and was regenerated with 0 undeclared); WORK was told for P11 and TEST for the new `build-domain-registry` test file (board lines present).
- Pre-existing and not T8's: the frozen-addendum red; the `active-release-drift-check` fixture without a compiled `fgctl` (named in the domain-dirs report, needs an owner).

## Lessons (full entries with ids in the [ledger](../261021-1118-harden-low-layers-bottom-up/lessons.md): HL-15 to HL-20, OL-19 to OL-24)

- A source edit and the render a guard compares it with land as one push gated on the tip (the landing unit); decide it per guard.
- Re-base budgets on the file as it stands; price refusal-adding phases at about three times the estimate (T8 missed two line budgets by that pattern).
- Four of twelve phases ended with no report file; the close had to re-run one piece of evidence. A report on disk comes before the board line.
- The closing phase greps specs and message strings for the names the layer deleted: it found two stale spec claims and one stale doctor message.
- Do not wait for a process with a loop that can match itself (`pgrep` pattern); a repeat loop must stop on a COOK HOLD; one log per run settled a "load flake" claim at the render landing.
