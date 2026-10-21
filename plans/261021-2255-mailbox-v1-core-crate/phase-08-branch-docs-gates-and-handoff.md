---
phase: 8
title: "Branch docs, full gates, hand-off"
status: pending
priority: P2
effort: "3h"
dependencies: [7]
---

# Phase 8: Branch docs, full gates, hand-off

## Goal

Leave V1 provable by a stranger on the branch: the spec and the two indexes say where the crate is and what V1 decided, every repository gate is green on top of a fresh main, the branch is pushed, and the controller has a short report. Nothing merges to main.

## Steps

1. **Sync** (plan.md § "Branch sync rule").
2. **Docs on the branch only** (L5 question 6; settled facts go into the area spec):
   - `docs/platform/agent-mailbox/spec.md`: header `Implementation status:` → "V1 (`fgos-mailbox-core`) built on branch `mailbox/v1-v3`, not on main; V2-V7 not started"; header `Source (planned)` keeps the store path planned and names the core as existing on the branch. §5.5: record the chosen escape (plan decision 8) in one paragraph, and correct the reply-command example to the §6.1 verb shape (`send --to <name> --reply-to <id> <body>`, decision 15). §5.3/§12: add the three Q1 keys with "provisional, owner question open", the order of refusal checks (decision 4), the shared `unregistered` sender (decision 12) and the lifetime-cap exemption pending Q3. §16: add owner questions Q1-Q3 as open items. §17: one row "V1 implementation decisions (agent, inside the signed frame): decisions 1-16 of `plans/261021-2255-mailbox-v1-core-crate/plan.md`", by "planning lead (agent)", status "applied on branch; numbers stay unsigned; Q1-Q3 open". Never attribute an agent decision to the owner.
   - `docs/specs/reading-map.md` line 54: replace "chưa có mã … source (dự kiến): `packages/mailbox`" with the core's path and crate name, marked "nhánh `mailbox/v1-v3`, chưa vào main".
   - `docs/platform/component-boundary.md` line 88: "implementation not started" → "V1 core built on branch `mailbox/v1-v3`".
   - Do not touch `CHANGELOG.md`: V1 is not user visible; spec §12 and §14 put the line at V7.
   - Do not add a doctor check: spec §12 and the owner decision of 2026-10-19 put it at V7. Do not add the config-merge registration either; that is this plan's own choice (decision 1: V1 has no runtime reader), and the rung that first reads configuration at runtime (V5) registers `limits.v1.json` through `registerConfigDefault`. Say so in the spec without citing the 2026-10-19 decision for it.
3. **Census**: `node scripts/git-one-door-scan.mjs --write-census` (the spec and index edits do not change hashed product files, but run it to be sure the census matches the branch).
4. **Full gates** (inside `/home/vantt/projects/forgent-mailbox`; run the branch sync again immediately before them, and rerun all of them if the merge brought changes):

   ```bash
   cargo fmt --all -- --check
   cargo clippy --locked --workspace --all-targets -- -D warnings
   cargo test --locked --workspace
   npm test
   cargo tree -p fgos-mailbox-core -e normal --depth 1
   ```

   Compare with phase 1's baseline. A failure that also fails on main is reported with its exact command and output and left alone; a failure that main does not have is fixed on the branch before this phase counts as done.
5. **Review**: run a code review of `git diff origin/main...mailbox/v1-v3 -- packages/mailbox Cargo.toml` (the installed `code-reviewer` agent or `ak:code-review`), focused on: purity (and the lint described as narrowing, not enforcing, rule 3), every number from the contract, every `MailboxState` field covered by `tests/snapshot.rs`, every per-sender map bounded by bindings plus one, one owning test per behaviour, no test-only branch. Apply accepted findings on the branch.
6. **Final sync, commit and push the branch**: branch sync once more; if it brought changes, rerun step 4; one commit `docs(mailbox): record the V1 core on its branch`; `git push -u origin mailbox/v1-v3` (the branch is shared across leads; never push or merge it into main).
7. **Hand-off report** to the controller (path from `fgos convention path --kind report --type closing --slug mailbox-v1-core-crate --json`): commits, test counts per file, gate results against the baseline, the open owner question Q1, and the next rung (V3 on the same branch; V2 once the lock row exists). The controller updates board row `MAIL` on main.

## Acceptance criteria

- `cargo test -p fgos-mailbox-core --locked` green on top of a main merged within this phase; all gates of step 4 green or failing identically on main.
- `git log origin/main..mailbox/v1-v3` shows only mailbox commits and merges from main; `git log origin/mailbox/v1-v3..origin/main` is empty right after the final sync; main has no commit from this plan except the plan files.
- The spec, reading map and component boundary on the branch name the crate and its status.

## Risks

- Merge conflicts on `Cargo.toml`, `Cargo.lock` and the mutation census at each sync: resolve on the branch, regenerate the census and the lock, rerun the proof.
- A gate red on main for reasons outside the mailbox: reported, not fixed here (RUL11: separate item).
