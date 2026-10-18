# Phase 10: proof gate and docs

- **Depends on:** phase 09 complete on its branch (release candidate built from it). Q3 and Q4 answers for items 5 and 10.
- **Branch / worktree:** `es/p10-proofs`, `.claude/worktrees/es-p10` (docs and proof scripts only; the candidate is phase 09's branch).
- **Model / effort:** opus, rigor critical; 20h.
- **Blocks:** phase 11 (items 1-4, 5 real forge, 6-8, 11-13 green).

## Context

- Spec §23.2 items 1-13, §24 limits, §20 (retired catalogue families against freeze 234), §26 decision.
- Git plan: V-EVENT run id is a blocking edge of Git 08; Git D11 builds the windows-x64 addon (item 9); Git Q3 covers the root device (item 10 with Q4).

## Requirements

0. **Part (b), end to end (§17, item 8):** rerun the phase 01 harness on the candidate (claim, move, settle at 1, 10, 20 sessions on ext4) against the ES-01 baseline report, and count spawns outside the gate per mutation; a regression is a no-go for phase 11.
1. **Matrix.** One table in the phase report: each §23.2 item, its test file or recorded run, last green run id, machine, filesystem. Items 1 (phase 02, 04), 2 (04), 3 (09), 4 (03, 09), 6, 7 (08), 8 (09), 11 (09), 12, 13 rerun on the candidate.
2. **Item 12, topologies:** plain repository, linked worktree on another filesystem, `--separate-git-dir`, bare repository with a worktree, submodule (own store), non-git refusal, Git floor; `test/event-store/topologies.test.mjs`.
3. **Item 5, real forge (Q3):** with the owner's authorization, push, fetch and fresh-clone probe of `refs/fgos/*` on the chosen repository of the owner's forge; record the result.
4. **Item 9, addon distribution:** the combined addon loads from the staged release and from the npm channel on linux-x64 with the Event Store exports; `event-store-native-addon` setup and doctor vectors; activation refuses a payload without the addon (M10: `components.nativeAddon` required from the release carrying phase 09, or an Event Store activation check); windows-x64 build result from Git D11 recorded (the facade refuses there by D15, the load must still succeed).
5. **Item 10, power loss (Q4):** script `scripts/event-store/power-loss.sh` using `dm-flakey` on a loop device backed by a real ext4 disk; append, ack, cut power, remount, verify every acked event; run by the owner with `sudo`, together with Git E1 when possible.
6. **Parity rehearsal:** `npm --prefix .claude/worktrees/es-p09 run fgos:dev -- events migrate --check` with cwd in a copy of each workspace's repository (forgent, mdview, mcp-skill-hub, and any repository on the Q2 list), never the real checkout, starting from a copy where the new release's `fgos setup` never ran; every parity must be exact, porting included.
6a. **WAL bound (M8):** Git's compaction is present and phase 04's 10,000-seal measurement shows a bounded WAL; otherwise no-go.
7. **Retired families:** check spec §20's list (G-092, G-093, G-120, part of G-029; G-089, G-121, G-170; G-210, G-211, half of G-184; G-118, G-212, G-213; G-090, G-214) against the catalogue freeze 234 and confirm each mechanism is gone on the candidate.
8. **Docs** (smallest owning surface each): `docs/platform/event-store/spec.md` (implementation status line; §5 clarifying row for `project:<name>` streams, D9, marked as clarification with no protocol change); `docs/specs/work-state.md` (rebuild section, data-layout pointers, RUL10 note, removed `repair`, `seq` meaning, conflict records); `docs/specs/reading-map.md` (event-store paths); spec §15 and §19 stale citations (`command-registry.mjs:1393` → `:1405`, `registrations.mjs:1965-2031`/`2035-2126` → current rows) as a citation fix; `docs/specs/distillery.md:136-138` (porting storage); `docs/platform/component-boundary.md` (Event Store row: owns envelope, open logs, seal, reader, sharing, verbs; consumers Work, porting, observe, decisions; depends on Git Publication, holder-lock, Session Identity; no consumer imports); any how-to that names event files (found by `rg -l "\.fgos/events" docs`). CHANGELOG stays phase 09's.
8a. **Spec-text reconciliation with the Git spec (task for the Event Store spec owner, done here, not earlier).** (1) §10 step 2.3: replace the `gix` in process / `update-ref` with `-c core.fsync=objects,reference` wording by a reference to Git's Publication port, since Git fsyncs directories itself and treats `core.fsync` only as a backend input (Git spec §10 "Directory durability is Git's own job"). (2) §21 `event-store-git-version` floor (2.31 / 2.36): replace the numbers by a pointer to Git's floor, owned by Git (`packages/git/contracts/git-floor.v1.json`, Git phase 01 req 3, read through `gitFloorVerdict`). Recorded as a dated clarification in the spec's history, no protocol change.
9. **V-EVENT handoff:** send the phase 05 V-EVENT green run id to the Git 08 lead and record it on the board.

## Files

| Action | File |
|---|---|
| create | `test/event-store/topologies.test.mjs`, `scripts/event-store/power-loss.sh` |
| edit | `docs/platform/event-store/spec.md` (requirements 8, 8a), `docs/specs/work-state.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md`, how-to pages found by `rg -l "\.fgos/events" docs` |
| report | `fgos convention path --kind report --type verification --slug event-store-proof-gate` |

## Steps

1. Matrix and reruns on the candidate.
2. Topologies; addon channels.
3. Parity rehearsal on copies of the three workspaces.
4. Forge probe and power-loss run with the owner (Q3, Q4).
5. Retired-family check; docs; V-EVENT handoff.
6. Go or no-go note for phase 11 in the report.

## Validation

```bash
node --test test/event-store/topologies.test.mjs
cargo test --locked --workspace
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<candidate build> npm test
npm --prefix /home/vantt/projects/forgent/.claude/worktrees/es-p09 run fgos:dev -- events migrate --check   # cwd in each workspace copy
sudo scripts/event-store/power-loss.sh --device <loop> --runs 20   # owner, Q4
```

Go criterion: every gating item green with a run id; parity exact on all three copies; forge probe passed or Q3 answered otherwise.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Parity differs on one workspace | Medium × High | Investigate before landing; never land with a known diff. |
| Forge rejects `refs/fgos/*` | Low × High | Stop; owner decides (another remote, or local-only sharing). |
| No root device | Medium × Medium | Q4 default lets the cutover land; acceptance stays open and the board says so. |

## Rollback

Docs and proof scripts only: revert.
