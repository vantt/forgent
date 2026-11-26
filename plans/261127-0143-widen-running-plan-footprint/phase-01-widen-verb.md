# Phase 1: Widen verb in the supervision host

Capability: `code:implement`, then `code:review`.

## Inputs

- `plans/261127-0143-widen-running-plan-footprint/plan.md` ("Decisions this plan takes", acceptance criteria 2, 4, 5).
- `packages/supervision/rust/src/portfolio.rs`: `split_frontmatter`, `read_phase_table` (around line 182),
  `running_overlaps` (around 271), `admitted_text` (around 313). The YAML document door `fgos_yaml_doc` used there.
- `apps/fgos/src/wiring/supervision.rs`: `SUPERVISOR_SUBCOMMANDS` (line 48), `project_request` (187), the `admit`
  adapter (737) and its publisher `super::session_write_publish`.
- `packages/write-scope/src/lib.rs`: `canonicalize_all`, `matches`, `colliding_pairs` (the run door's coverage rule).
- `docs/platform/supervision/spec.md` PS-24 and the plan rows (read only).

## Files this phase may write

`packages/supervision/rust/src/portfolio.rs`, `packages/supervision/rust/tests/portfolio.rs`,
`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/tests/supervision_verbs.rs`,
`packages/host-runtime/contracts/command-manifest.json`, `src/cli/command-registry.mjs`.

## Steps

1. In `portfolio.rs` add `widened_text(text, phase_id, paths, criterion) -> Result<Widened, WidenRefusal>`, pure over
   text, beside `admitted_text`:
   - refuse `plan-not-widenable` unless `status` is `ready` or `running`;
   - find the numbered item `criterion` under the "Acceptance criteria" heading, else `criterion-not-found`; return
     its first line for the commit message;
   - find the phase row by `id`, else `phase-not-found`; a row whose status is `done` or `withdrawn` is
     `phase-not-found` too;
   - canonicalize each path with `fgos_write_scope` (`footprint-entry-invalid` on failure or a leading `-`);
   - add to the frontmatter `footprint:` list, through the YAML document door with `CommentLoss::Refuse`, each path
     the list does not already cover (the run door's `matches` rule); add to the phase row's footprint cell each
     path the cell does not list, rewriting only that cell;
   - re-read the result with `read_phase_table` and the frontmatter reader; a failure refuses and nothing is
     returned;
   - return `{ text, added, unchanged, criterion_text }`; `text` is `None` when neither copy changed.
2. Extend `running_overlaps` (or the helper under it) so the widen can ask for overlaps of one plan against every
   other `ready` or `running` plan; `supervisor plans` keeps its current answer.
3. In `wiring/supervision.rs` add the `widen` subcommand: parse `<plan-dir> --phase --path... --criterion`
   (`bad-args` on anything else), read `plans/<dir>/plan.md` at the trunk tip (`plan-not-found`), call
   `widened_text`, and when it changed publish through the same `session_write_publish` path `admit` uses (catch up,
   path clean, symlink guard, paths land of `plans/<dir>/plan.md`) with message
   `plan(<dir>): widen phase <id> footprint by <paths> for criterion <n>: <criterion text>`. Answer `--json` per
   the plan's "Answer" decision, with `overlaps` from step 2.
4. Register the subcommand in `src/cli/command-registry.mjs` and regenerate
   `packages/host-runtime/contracts/command-manifest.json` with the repo's usual generator (do not hand-edit if a
   generator exists).
5. Tests: `tests/portfolio.rs` cases for both copies written, every other byte kept, a covered path as no-op,
   `unchanged` when nothing changes, and each refusal code. `apps/fgos/tests/supervision_verbs.rs`: the verb on a
   running plan in a temp repo lands `plan.md` with both copies (criterion 2), and a widen into a path another
   running plan holds lands and names it under `overlaps` (criterion 4). Extend the existing files; name each test
   by its behaviour.

## Verify

```bash
cargo test -p fgos-supervision --test portfolio
cargo test -p fgos --test supervision_verbs
node --test test/cli/command-registry.test.mjs test/cli/fgos-manifest.test.mjs
```

Pass: all green; the new cases fail on the parent commit.

## Rollback

Revert this phase's commit. Nothing else calls `supervisor widen` until phase 2 lands.
