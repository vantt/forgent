# Install, doctor and fgctl user guide (2026-10-05)

## What was written

- New how-to: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (English, one H1, sections from H2, front matter in the format of the other how-tos, a clickable Related files section).
  - Two layers (machine `fgctl` and release store, project `.fgos/installation/`), config levels.
  - Order of operations for a new project, and a table of what `install.sh`, `fgctl stage|init|upgrade|repair|verify|status`, `fgos init|doctor|doctor --fix|setup` each do.
  - How to read doctor output (exit code is 0 even with failing checks).
  - A table of all 96 live check ids, grouped in six sections, each with what it checks, a typical message, who fixes it (tool via `--fix`, `setup`, you, info) and the fix. A script confirmed every id from `fgos doctor --json` appears in the doc.
  - Pre-Workflow checklist, pools and independence (a panel of three needs a fourth provider family), trust per agent CLI home (claude, codex `[projects."<path>"] trust_level`, agy `trustedWorkspaces`), the run-from-inside-the-project rule (rule only, no warning behaviour described).
  - Troubleshooting: `workflow start|status|answer|resume`, `advance.log`, run and assignment directories, `visibility.json`, `herdr-diagnosis.json`, meaning of `blocked`.
- `README.md`: one linking sentence under "### Doctor".
- `docs/enduser-docs-index.json`: regenerated with `fgos docs-index` (490 entries, +1 entry), so `enduser-docs-index-stale` stays green.
- No CHANGELOG line (docs only). No code touched.

## What existed

README install/setup/doctor sections, `docs/platform/packaging-distribution/**` (spec, fgctl split, setup-doctor registry), `docs/distribution-vision.md`, `docs/specs/distribution.md`. None was a user how-to covering order, per-check ownership, trust or run triage. The guide links to them instead of copying.

## Doc and behaviour claims found false or misleading (reported, not changed)

1. README says `fgctl init` right after `install.sh`. In `packages/distribution/rust/src/init.rs` (`init_workspace`) a plain `fgctl init` returns "--from <source> is required when .fgos/distribution.json is absent". The external-consumer proof (`scripts/ci-external-consumer.sh`) uses `fgctl init --from <fgos-*.tar.gz>`. The guide documents `--from`. Not run live: no `fgctl` binary is installed on this machine.
2. `fgos setup` help (and the README doctor text) say onboarding is `fgctl init`, then `fgos doctor --fix`, then `fgos doctor`. `doctor --fix` runs only the 15 registered fixes. Config defaults (`runner`, `workerSlots`, `invariantChecks`, `herdr*`, `docRegistry`), the git hooks path and the Claude Code dispatch hook are written only by `fgos setup`, and the messages of about a dozen checks still say "run fgos setup". Verified on a bare git repo (`doctor --pretty --dir <tmp repo>`): the `config-not-stale` family stayed red. The guide tells owners to run `setup` once when those checks are red.
3. `fgos doctor` and `doctor --fix` exit 0 even when checks fail (`bin/fgos.mjs`, verb result always `process.exitCode = 0`). So `fgctl init`'s tail (`init`, `doctor --fix`, `doctor`) cannot mark an install degraded because of a red check.
4. `task-specs-resolve` and `domain-workflow-operations-coverage` fail on a project that does not carry fgOS's own `domains/` and `core/` trees (seen on mdview and on a bare repo). Nothing registered repairs them and the mdview Workflow run reached its gate with them red. The guide labels them info with that evidence; whether they are meant to pass in an external project is an open question.

## Side effect to know about

A probe of `fgos init` from the worktree was refused by the worktree guard and recorded an invocation fault line in the main checkout's `.fgos/logs/invocation-faults.jsonl` (untracked runtime log). Nothing else outside this worktree was written; the temporary repo and files under `/tmp` were removed.

## Tests run

- `env -u CLAUDE_CODE_SESSION_ID node --test test/architecture.test.mjs`: 16 pass.
- `test/report/enduser-index.test.mjs`, `test/report/frontmatter.test.mjs`: 29 pass.
- No doc-registry or doc-governance test exists under `test/` for how-to docs. Full suite not run.

## Unresolved

- Should `fgos setup`'s remaining config/hook work move into registered fixes so `doctor --fix` is enough (finding 2)?
- Are the two task-spec checks meant to evaluate the project root or the installed release payload (finding 4)?
- Unverified in the guide: the exact failing text of a handful of read-only checks (rows say "names the ..." instead of quoting) and the first-run `fgctl init --from` path, which could not be exercised without a built release.
