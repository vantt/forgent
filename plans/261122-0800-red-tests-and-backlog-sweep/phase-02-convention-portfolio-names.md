# Phase 2: Convention accepts the migrated portfolio names

Capability: `code:implement`.

## Inputs

- `test/scripts/convention-conformance.test.mjs`, the wiring case "this repository has no blocking convention
  violation and no post-cutoff naming violation". It fails on main.
- `fgos convention check --all --json` on base `645d43a6a` reports 242 warn violations, all under
  `plans/backlog/`. They fall into two causes:
  1. 240 `pattern-mismatch`: legacy ids that the migration kept (`STR27-…`, 8-char `p-xxxxxxxx-…`, `wf-…`) do not
     match the `backlog-item` template `{id}-{slug}.md`, whose `{id}` accepts only a 12-char minted `p-` id
     (`match_id_template` in `packages/convention/rust/src/operations.rs`). A legacy id cannot be told apart from
     its slug by name alone (migrate reads the id from the frontmatter, `apps/fgos/src/wiring/migrate.rs`
     `id_of_stem`). Every rule carries cutoff `3faf81996`, which is older than the move, so every migrated file
     counts as introduced after the cutoff.
  2. 2 `wrong-location`: `p-xyod5s5h6r-replace-phase-4-of-plan-261119-1615-secretary.md` (a valid minted id) and
     `p-36af7086-research-260929-1203-…` contain a report- or plan-shaped stamp in the slug. `check_path`'s first
     branch flags a stamped name outside report, journal and plan roots before it consults the rule that scopes
     `plans/backlog/`.
- `scripts/convention-conformance.mjs`: `packagedConventionCutoff` requires one cutoff across all scoped rules.
- a1022572a: the commit that landed `plans/backlog/` and `plans/discussions/` (the portfolio move).

## Footprint

`packages/convention/contracts/convention.rules.v1.json`, `packages/convention/contracts/convention.golden.v1.json`,
`packages/convention/rust/src/operations.rs`, `packages/convention/rust/tests/golden.rs`,
`scripts/convention-conformance.mjs`, `test/scripts/convention-conformance.test.mjs`.

## Steps

1. Fix the classifier. In `check_path`, a path under the root of a scoped name-template rule is judged by that rule.
   The stamped-name `wrong-location` branch applies only when no such rule scopes the path. Add a golden case to
   `convention.golden.v1.json`: a valid minted backlog id whose slug holds a plan stamp passes, and a report-named
   file outside every root still gets `wrong-location`. Run `cargo test -p fgos-convention`.
2. Fix the cutoff. The conformance script takes each warn violation's cutoff from the rule that scopes its path,
   and falls back to the launch cutoff for a path with no scoped rule. Set `cutoff` on the `backlog-item`,
   `backlog-index` and discussion rules to `a1022572a` (full sha), the commit that created those roots. Files
   migrated in that commit are pre-existing, and any backlog file added later must match the template. Replace the
   single-cutoff guard with a per-rule lookup. The rules file already carries a cutoff per rule, so no new field is
   needed.
3. In `test/scripts/convention-conformance.test.mjs`, keep the "pre-cutoff passes, post-cutoff fails" case. Add one
   case with two rules of different cutoffs, showing that a violation is judged by its own rule's cutoff. Keep the
   repository wiring case unchanged.
4. Run `fgos convention check --all --json` through the working tree's code (`npm run fgos:dev -- convention check --all --json`)
   and confirm no violation remains that is post-cutoff under its own rule.

## Verify

`cargo test -p fgos-convention` and `node scripts/run-tests.mjs test/scripts/convention-conformance.test.mjs` pass.

## Rollback

Revert the phase commit. The rules file and the conformance script change together, in one commit.
