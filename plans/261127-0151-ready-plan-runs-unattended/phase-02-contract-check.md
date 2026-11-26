# Phase 2: Contract check refuses ready without the section

Capability: `code:implement`, then `code:review`.

## Inputs

- `plan.md` of this plan, section "The Unattended run section": the exact shape to check.
- `scripts/plan-contract-check.mjs` as it stands after plan 261126-2318 (this plan is `blockedBy` it; re-read the file,
  line numbers will have moved). Existing patterns to reuse: the date gates `BACKLOG_SOURCE_REQUIRED_FROM` and
  `AUTHORITY_MAP_REQUIRED_FROM`; the cached host read `invokeHost(['authority', 'model', '--json'])`.
- `src/portfolio/plan-sections.mjs`: the one section reader (`PLAN_SECTIONS`, `hasSection`).
- `test/scripts/plan-contract-check.test.mjs`: the owning proof; it builds plans in a temp dir (`mkdtemp`).
- Discussion `ds-que32ftgg6` §6 U6 and acceptance criterion 2.

## Footprint

`scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`, `src/portfolio/plan-sections.mjs`.

## Steps

1. In `plan-sections.mjs`, add the Unattended run section name and heading pattern as its own export (not inside
   `PLAN_SECTIONS`, so plans before the gate are not failed), plus a reader that returns the section's body and its
   three named subsections (Host steps, Cleanup, Beyond the rule). One reader; the check never parses headings itself.
2. In `plan-contract-check.mjs`, add `UNATTENDED_RUN_REQUIRED_FROM` set to the date this phase lands. For a plan with
   `status: ready` and `created` on or after it, report an error when:
   - the Unattended run section is missing;
   - Host steps is neither `None.` nor a table, or a row has no argv starting with `fgos `, or no executor;
   - a top-level list item under Acceptance criteria does not start with `[core]` or `[debt-ok]`;
   - Beyond the rule is neither `None.` nor a table, or a row has no `q-` id, or the id is not answered. Read the
     answer state through the host the same way the authority model is read (one cached `invokeHost` call to the
     question store's read verb with `--json`; find the verb with `fgos questions --help`). If the host cannot be
     reached, report that as the error for the row (fail closed: `ready` is a promise).
   Messages name the section, the row and what is missing.
3. Tests in `test/scripts/plan-contract-check.test.mjs`, one per refusal plus one complete plan that passes and one
   pre-gate plan without the section that passes: missing section; host step without argv; host step without
   executor; unmarked criterion; beyond-the-rule row without `q-` id; beyond-the-rule row with an unanswered id (stub
   the host read at the same seam the authority-model tests use, if they do; otherwise inject the reader). Title each
   test by the behaviour, per design principle 8.

## Verify

- `node --test test/scripts/plan-contract-check.test.mjs` green.
- `node scripts/plan-contract-check.mjs --all` reports no new error on the tree (pre-gate plans untouched).
- `node scripts/plan-contract-check.mjs --plan plans/261127-0151-ready-plan-runs-unattended` passes (this plan
  carries the section).

## Rollback

Revert the phase commit.
