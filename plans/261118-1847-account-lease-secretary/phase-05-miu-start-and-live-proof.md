# Phase 05: Miu on her pool: config, release, real starts

Wave 3. Depends on 2, 3, 4. Capability `code:test` (live proof) plus the release step. Effort 1.5d. Discussion task
`task-miu-start` (proof part) and the end proof of all four acceptance criteria.

## Context

After phases 2-4, pool `claude-miu` holds `vantt`, the pane pool holds three other accounts, the warn row exists and
seat binding honors a persona pool. This phase turns the key on for the secretary, ships it, and proves it with real
starts. Plain `fgos` runs the activated release, so the real starts need a release built, staged and activated from a
`main` that contains phases 3 and 4 (supervisor or OPC step, owner go on the owner machine).

## Steps

1. `.fgos/config.yaml`: `runner.personas.secretary.pool: claude-miu`, with an `@fgos:why` comment citing
   p-mnymjukvqd. Edit in a worktree and commit only that hunk (the main checkout carries others' uncommitted edits to
   this file).
2. `CHANGELOG.md` `## [Unreleased]`: three lines (A8): doctor row `llm-accounts-default-login-home` warns when an
   account store is a CLI's default login home; persona key `runner.personas.<name>.pool`; the secretary head leases
   only from its own pool.
3. Release: build, stage and activate per `docs/platform/packaging-distribution/spec.md`; `fgos doctor` through the
   installed shim shows `active-release-matches-checkout` and the new row `ok`.
4. Live proof, each with command, exit and the lease receipt (pool and account id only):
   - `fgos dispatch explain --persona secretary ...` binds pool `claude-miu`; `fgos dispatch explain --for execute`
     and `--for review` (a claude-pinned capability) list only pool `claude` accounts (AC2).
   - One real claude pane: `fgos run "<one-line read-only prompt>" --provider claude` (read-only, no `--writes`);
     receipt at `data.results[-1]` shows one account of pool `claude` (AC3).
   - Miu: owner (or OPC with owner go) stops the hand-started Miu after she hands off, then runs
     `fgos head start secretary --name miu`; the head's attempt shows a lease on `claude-miu/vantt`; the head loads
     the `fgos-secretary` skill and its Stop hook runs; F14 remainder from phase 1 (user settings, hooks) is checked
     and any gap written down (AC3).
   - One rotation (`/handoff` or `fgos head rotate secretary --name miu`): the successor leases `claude-miu/vantt`,
     the old attempt closes, one pane left (AC3).
   - AC4 live part, if it happens naturally: a pane quota event in `.fgos/observe` naming the account and the walk;
     otherwise the phase 4 golden cases stand as the proof, as the acceptance criterion allows.
5. `reports/phase-05-live.md`: the results above, plus the F13 outcome from phase 1, and a line for Miu that she now
   starts through `fgos head start` on her own account and can rotate herself (owner asked to be told).

## Validation

All four acceptance criteria of `plan.md` checked off with evidence in the report. `npm test` and
`cargo test --workspace` green on the commit that carries steps 1-2.

## Risk and rollback

The confined head could lack something Miu relied on in `~/.claude` (F14): phase 18 of the spine plan already ran a
real confined claude head with skill, hook and rotation; anything still missing is recorded, and rollback is to start
Miu by hand as today (`claude --model sonnet`), which this plan leaves untouched. Removing the persona line restores
today's binding.
