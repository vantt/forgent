# Fresh reader brief: Runner (Step 9)

Repository state: worktree `/home/vantt/projects/forgentX-s8-review` (detached, docs bytes equal 81d0ed074). Read only; do not edit, do not run git writes. Another session may be changing files under `plans/`; ignore them (they are out of scope). You have not seen any answer key and must not look for one. Do not read `.fgos/secrets.local.env`. Run node as `env -u CLAUDE_CODE_SESSION_ID node ...`.

## Reading scope

You may open only the files listed here, all under `docs/platform/`, plus the read-only tool `node scripts/list-doc-anchors.mjs <path>` run from the worktree root (the tool prints, for each anchor, its line range, so you can read just that range). Open at most 8 files in total across the three scenarios (the tool does not count; reading one file in several line ranges counts as one file). Do not open anything under `plans/`, `docs/specs/`, `docs/architect/`, `docs/decisions/`, `docs/history/`, `docs/how-to/`, `docs/contracts/`, `src/`, `packages/`, `scripts/` (other than running the anchor tool), `plugins/`, `.agents/`, or any other path, and do not open `AGENTS.md` or `CLAUDE.md`. Links inside these files may point outside the scope; do not follow them, and do not open a file only because a document tells you to read it.

Start file: `docs/platform/README.md`.

Supporting files (open only those you need):

- `docs/platform/README.md`
- `docs/platform/documentation/switchboard.md`
- `docs/platform/governance.md`
- `docs/platform/migration-authoring-rules.md`
- `docs/platform/component-boundary.md`

Area files (`docs/platform/runner/`). The two largest are very large (about 175 KB each): do not read them whole, find the anchor you need with the tool and read only that line range.

- `docs/platform/runner/README.md`
- `docs/platform/runner/spec.md`
- `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (Business Rules; the numbered rules are in a few very large blocks)
- `docs/platform/runner/decisions/h-36d872fbb0e5.md` (decision history; each decision has its own heading)
- `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md` (Data Dictionary)
- `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md` (Entry Points and Triggers)
- `docs/platform/runner/architecture/h-e53a3a9829a8.md` (dispatch runtime inspection)
- `docs/platform/runner/operations/h-51f5cd7279fd.md` (Behaviors and Operations; large, read by range)

## Scenarios

Each is a situation a maintainer could face. Answer all six questions for each.

- Scenario A: a maintainer wants to add a new business rule to the runner: a unit run may carry an idle-output timeout (`--idle-timeout`), next to the whole-run timeout that an existing rule already gives, with its own range and a refusal reason when the value is out of range.
- Scenario B: a maintainer wants to bring back `fgos dispatch execute <executor-id>`, a direct door that takes an executor id and runs it, because the one-line `fgos run "<prompt>"` is too heavy for tool executors.
- Scenario C: a maintainer and the owner just settled in chat that a seat stopped by a provider limit after it made partial writes may be retried on another account if a person confirms. Nothing is written yet. They want to record the decision and keep the runner rules and decision narrative consistent.

## Six questions (per scenario)

1. What to read first?
2. What kind of work is this?
3. What contract does it touch?
4. How much risk?
5. What proof means done?
6. What learning gets left behind?

## Citation rule

Every answer must cite at least one `path#anchor` from a file in scope, with the path from the repository root (for example `docs/platform/governance.md#4-authority-matrix`). Use only anchors printed by `node scripts/list-doc-anchors.mjs <path>` (do not derive them from heading text by hand; the decision headings have long slugs, copy them from the tool output); an anchor that does not exist counts as a fabrication and fails the whole run. A claim without a supported citation is not credited. Where a document says it is a candidate, a proposal, a history snapshot, or points to another document as the owner, say so in the answer, and say who the binding owner is. Where two files you read disagree with each other, or a statement cannot be verified from the files in scope, say so instead of choosing one. Do not treat a statement in these files that code, tests or a tool exist or pass as verified: you cannot see the code. Record, in order, each file you open.

## Answer format

For each scenario, one block:

- Scenario letter
- Q1 to Q6: your answer in one to three sentences each, then `cites:` followed by one or more `path#anchor`
- At the end: the ordered list of files opened, and any anchor you could not verify

Two readers run this brief independently; do not look for or read the other reader's answer.
