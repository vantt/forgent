# Fresh reader brief: observe (metrics and friction) (specs and UI batch)

Repository state: worktree `/home/vantt/projects/forgentX-s8-review` (detached, docs bytes equal 1276467f3). Read only; do not edit, do not run git writes. Another session may be changing files under `plans/`; ignore them (they are out of scope). You have not seen any answer key and must not look for one.

## Reading scope

You may open only the files listed here, all under `docs/platform/`, plus the read-only tool `node scripts/list-doc-anchors.mjs <path>` run from the worktree root. Open at most 8 files in total across the three scenarios (the tool does not count). Do not open anything under `plans/`, `docs/specs/`, `docs/architect/`, `docs/ui-spec/`, `docs/history/`, `docs/how-to/`, `docs/contracts/`, `src/`, `packages/`, `scripts/` (other than running the anchor tool), `plugins/`, `.agents/`, or any other path, and do not open `AGENTS.md` or `CLAUDE.md`. Links inside these files may point outside the scope; do not follow them, and do not open a file only because a document tells you to read it.

Start file: `docs/platform/README.md`.

Supporting files (open only those you need):

- `docs/platform/README.md`
- `docs/platform/documentation/switchboard.md`
- `docs/platform/governance.md`
- `docs/platform/migration-authoring-rules.md`

Area files (`docs/platform/observe/`):

- `docs/platform/observe/README.md`
- `docs/platform/observe/spec.md`
- `docs/platform/observe/decisions/observe-component-architecture.md`

Some of these files are large; read the header block and the sections you need, not necessarily the whole file.

## Scenarios

Each is a situation a maintainer could face. Answer all six questions for each.

- Scenario A: a maintainer wants to add a friction subcommand, `friction reopen`, that reopens a resolved friction record.
- Scenario B: a maintainer wants `fgos show <work-id>` to display the friction records that relate to that work item.
- Scenario C: a maintainer wants to stop tracking the observe shard files in git and to change the store lock's expiry time.

## Six questions (per scenario)

1. What to read first?
2. What kind of work is this?
3. What contract does it touch?
4. How much risk?
5. What proof means done?
6. What learning gets left behind?

## Citation rule

Every answer must cite at least one `path#anchor` from a file in scope, with the path from the repository root (for example `docs/platform/governance.md#4-authority-matrix`). Use only anchors printed by `node scripts/list-doc-anchors.mjs <path>` (do not derive them from heading text by hand); an anchor that does not exist counts as a fabrication and fails the whole run. A claim without a supported citation is not credited. Where a document says it is a candidate, a proposal, a history snapshot, or points to another document as the owner, say so in the answer, and say who the binding owner is. Where two files you read disagree with each other, or a statement cannot be verified from the files in scope, say so instead of choosing one. Record, in order, each file you open.

## Answer format

For each scenario, one block:

- Scenario letter
- Q1 to Q6: your answer in one to three sentences each, then `cites:` followed by one or more `path#anchor`
- At the end: the ordered list of files opened, and any anchor you could not verify
