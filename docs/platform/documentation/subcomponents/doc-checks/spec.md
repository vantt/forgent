# Documentation Checks Specification

```txt
Document type: BA-grade subcomponent specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define the one command that checks maintained documentation, the body rules it runs, where it runs, and the commit gate that makes its refusal real
Design status: Draft, split out of the documentation area spec on 2026-11-12. Not signed. Open questions in section 11.
Implementation: Partial. doc-health runs three body rules over the whole platform corpus; path input, the new rules, the staged-content read and the pre-commit wiring are not built
Canonical: No (becomes canonical when signed)
Provenance: Sections 6.2 to 6.5, 10, 11.1, 12 and 13 of the documentation area spec as of 2026-11-07, moved here when the owner split the area into subcomponents on 2026-11-12
Writer type: Agent draft writer
Canonical for: Nothing yet; once signed, the documentation check command, its rules and the documentation commit gate
Use this when: Adding or changing a documentation body rule, wiring the check into a door or a hook, or reading a check finding
Do not use this for: Placement rules (Convention), the axes and locate (document identity), or registry lifecycle (knowledge-registry contract)
Last reviewed: 2026-11-12
Related:
- docs/platform/documentation/spec.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/convention/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/governance.md
```

Read with: [documentation area spec](../../spec.md) (the map), [document identity](../document-identity/spec.md), [Convention spec](../../../convention/spec.md), [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md), [governance holder table](../../../governance.md#decision-scope-to-holder-table).

## 1. Current Summary

One command checks documentation: doc-health. Today it runs three body rules (links resolve, metadata header, dead backticked paths) over the whole platform corpus, in the test suite only. It reads the working tree, so a commit can pass on edits that are not staged, and the pre-commit hook does not run it.

This subcomponent makes the check the one gate a documentation change passes, wherever the change is made:

- it takes a list of paths, so the write door and the hook check only what changed;
- it gains the body rules that keep claims honest: named verbs exist, a rule has one owner, and the rules document identity needs;
- it reads staged content and refuses the commit when it finds something, including when the host fails.

It is an extension of doc-health, not a second checker (L10).

## 2. Scope

### 2.1. In scope

- The check command: inputs, rules, output, exit code (section 6.1).
- Body rules: the three existing ones, the verb reference rule (6.2), the rule-claim owner rule (6.3), and the hosting of document-identity rules (6.4).
- The commit gate: staged reads, the selected change types, host failure posture (6.5).
- Where registry lints run, and the registry repairs the gate would otherwise inherit (6.6).
- The sweep of known findings needed when the rules land (section 10).

### 2.2. Out of scope

- Placement verdicts. Convention decides them; the check calls `fgos convention check` and reports its verdict.
- What the identity rules mean. Document identity defines `area`, `question` and identifier resolution; this subcomponent runs those rules.
- A shipped `fgos doc check` verb. It becomes due only when project-owned rules exist (Convention Q13).
- A skill-name existence check.

## 3. Entry Points And Triggers

| Trigger | Entry |
|---|---|
| The write door's check step | the check command on the changed paths |
| A retrospective item commits documentation | `fgos-coding-knowledge` calls the same command before it commits |
| A commit stages files under `docs/` | pre-commit runs the command on the staged documents |
| `npm test` | the live doc-health case checks the whole platform corpus |
| By hand | the command, with paths or without |

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| doc-health | Read files or staged content, the classify answer, the command listing, the holder table | Write files; decide placement |
| Convention | Decide path, kind, cardinality and the reserved flags | Read document bodies |
| Pre-commit hook | Run the command on staged documents and refuse the commit | Skip it on a host error in an activated workspace |

## 5. Concepts

- **Finding.** One rule violation: file, line, rule id, message.
- **Canonical document.** A document Convention classifies as canonical and outside the past-state kinds (`history`, `decision`, `verification`). Most rules apply only to these.
- **Command listing.** The `commands[].name` set printed by `fgos --help --json`, the one machine list of `fgos` verbs, plus the hidden verb `internal`.
- **Rule claim.** A rule definition written as a bold rule id with its title in parentheses, for example `**RULn (title)**`, plus D-ADR numbers and the laws L1–L10. Its key is (holder, id), because an id is unique only inside its holder: 48 RUL ids are reused across holders with different meanings.
- **Holder.** The document that owns a rule, resolved through the governance holder table.

## 6. Behaviors And Operations

### 6.1. The check command

```txt
Runs when: the write door's check step, pre-commit on staged docs, the test suite, or by hand.
Blocked when: never; it only reports. A non-zero exit is the refusal.
What changes: nothing on disk.
Afterwards / side effects: prints each finding with file, line and rule id; exits non-zero on any finding.
```

The command is doc-health. Given a list of paths, it runs Convention check and every body rule on those paths. Without paths it checks the whole platform corpus, as the live test does today. This is the one documented command for acceptance item 6 of the documentation proposal.

| Rule | Status | Applies to |
|---|---|---|
| Links resolve | exists | all documents |
| Metadata header | exists | documents that are not metadata-exempt |
| Dead backticked paths | exists | canonical documents |
| Verb reference (6.2) | new | canonical documents |
| Rule-claim owner (6.3) | new | all platform documents |
| Identity rules (6.4) | new, defined by document identity | as document identity says |

### 6.2. Verb reference rule

In a canonical document, each backticked `fgos <verb>` names a verb in the command listing, with two exceptions:

- the same line pins a commit sha, which is how documents already record a removed verb;
- the document's header says `Canonical: No`, as in an unsigned draft.

The exemptions are those of the dead-path rule. No pattern on prose context words is used.

### 6.3. Rule-claim owner rule

The same rule id with the same title must not be defined in two holders. A second holder cites the owner instead of repeating the definition.

This catches the 7 duplicated claims found on 2026-11-06: the event-log rules numbered 1–3 and 5–8 (single append-only log, one write door, write order, expectation-checked writes, exit-code categories, item schema, dependency targets), each defined in both `docs/platform/work-state/spec.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. It does not use the `Canonical for` header, which is boilerplate (one string is shared by 60 documents).

The same id with a different title under two holders is allowed: ids are holder-local.

### 6.4. Identity rules hosted here

[Document identity, section 8.4](../document-identity/spec.md#84-filling-and-checking-the-axes) defines three duties that run inside this command once its view exists:

1. extract narrowing values and update the search view;
2. report a narrowing value that does not resolve against its register (the verb and dead-path rules above are the first two kinds);
3. report a section with no `area`, a `question` outside its closed list, or a `question` that does not fit its document kind.

They land in the document identity phase, not in this subcomponent's first phase.

### 6.5. The commit gate

This is item `p-cd2ejz7wa5`. It changes no contract, and it comes first because a promise that "commit refuses" needs it:

- doc-health reads the staged content (the Git index) for the paths it checks, not the working tree. Today `scripts/doc-health.mjs` reads files on disk, so a commit can pass on unstaged edits.
- The pre-commit document block selects changed files with `ACMRD`, not `ACR`, so modified and deleted documents are checked.
- In an activated workspace, a host error or timeout in that block refuses the commit. Today it warns and continues (`.githooks/pre-commit`, the Convention block).
- Classify runs once for all staged paths, in one host call.
- Documentation findings refuse the commit (the owner's answer to the pre-commit posture question).

### 6.6. Registry lints and repairs

The registry lints judge history-derived state, so they run in `fgos knowledge status` (its `findings`, module `src/report/knowledge-lints.mjs`), not in `fgos doctor`. `fgos doc-registry --check` reports a stale projection without writing, and doctor no longer refreshes the registry. The lints are `doc-alias-broken`, `doc-active-duplicate`, `doc-current-path-missing`, `doc-source-unreachable`, `doc-near-duplicate`, `doc-provisional-aged`, `doc-topic-oversized`, `doc-role-underused`, `doc-source-conservation`.

Repairs the gate would otherwise inherit:

- `doc-provisional-aged` parses `updatedAt` before subtracting. Today it subtracts an ISO string, gets `NaN` and never fires. Choosing its age cutoff is a policy change and is named as one.
- `docRegistry.topicMaxDocs`, which the lints read, is declared in the config schema.
- The 19 tracked user documents missing from the registry are registered, and the one registered path missing on disk is resolved.
- The tracked, empty `.fgos/docs/enduser-docs-index.json` is removed if no reader is found; otherwise its readers move to `docs/enduser-docs-index.json`.

## 7. Rules And Invariants

1. **One checker.** Body rules live in doc-health; placement stays in Convention. No second checker is added.
2. **Named verbs exist.** A canonical document names only `fgos` verbs that run, unless it pins the commit that removed them.
3. **One owner per rule claim.** A repeated definition is a finding, not a style issue.
4. **Checks run where writing happens.** At the write door and in pre-commit on staged content, not only in the test suite.
5. **The check reads what will be committed.** Staged content, never the working tree, when run from the hook.

## 8. Contracts Owned

The output of the check command: one line per finding with file, line, rule id and message; exit code non-zero on any finding. This is the existing doc-health format extended by the new rule ids.

## 9. Contracts Consumed

| Contract | Owner | Use |
|---|---|---|
| `fgos convention classify` / `check` | [Convention](../../../convention/spec.md) | kind, canonical, metadataExempt, generated; placement verdict |
| `fgos --help --json` | command registry (`src/cli/command-registry.mjs`) and native descriptors (`apps/fgos/src/main.rs`) | command listing |
| Holder table | [governance](../../../governance.md#decision-scope-to-holder-table) | rule holders |
| Identity rules | [document identity](../document-identity/spec.md) | rule meaning, registers |

## 10. Edge Cases And Known Findings

Edge cases:

- A verb mentioned as removed with no sha is a finding. The fix is to add the removing commit sha, as documents already do for dead paths.
- A planned verb in a signed spec is a finding. A spec that plans a verb stays `Canonical: No` until the verb exists.
- A path that exists only as an untracked file passes on the machine that has it and fails elsewhere; reading staged content closes this for commits.

Known findings to sweep when the rules land:

- The 7 duplicated rule claims of 6.3: work-state keeps them, because they are event-log and write-door rules and the holder table names work-state for them; the runner subcomponent cites them.
- Removed or planned verbs named without a sha: `docs-lease` (holder-lock spec), `repair` (work-state spec), `evolve` (runner subcomponents) and `unlock` (runner spec). The planned `secrets` sits in an unsigned draft and is exempt.

## 11. Open Questions

1. **Age cutoff for `doc-provisional-aged`.** A policy choice, not a fix. Recommendation: 30 days, reported, not refusing.
2. **The shell wrapper and `--`.** The `fgos` shell function appends `--dir <root>` after the arguments, so `fgos convention check -- <path>` receives `--dir` and the root as extra paths and fails. Passing `--dir` before `--` works around it. Recommendation: fix the wrapper to place `--dir` before a `--` separator, as its own item, because the hook and the write door will call `convention check` with paths.

## 12. Implementation Alignment

| Behavior | Status | Evidence | Next action |
|---|---|---|---|
| One check command over paths | partial | `scripts/doc-health.mjs` checks the whole corpus only | add path input and Convention check |
| Verb reference rule | planned | DOCOS scout, section 3 | add rule and sweep |
| Rule-claim owner rule | planned | DOCOS scout, section 7 | add rule and sweep |
| Staged reads and pre-commit wiring | planned | the Convention spec states doc-health is not in pre-commit | item `p-cd2ejz7wa5` |
| Registry lints in `fgos knowledge status` | done | `a16fce064` | — |
| Lint repairs | planned | panel outcome, section 2 | item `p-cd2ejz7wa5` |
| Identity rules | planned | document identity 8.4 | document identity phase |

## 13. Verification

One owning proof per behavior, in the file that owns the module:

| Behavior | Owning proof |
|---|---|
| Path input, the verb rule and the rule-claim rule | synthetic cases in `test/scripts/doc-health.test.mjs` |
| Whole-corpus wiring | the existing live case in the same file |
| Staged reads and pre-commit wiring | one case in the existing hook test |
| Aging-check fix | a case in `test/report/knowledge-lints.test.mjs` |

Done means: `npm test` and `cargo test --workspace` are green apart from tests that fail the same way on main, and the check command passes on the swept corpus.

## 14. Related Files

- [Documentation area spec](../../spec.md)
- [Document identity](../document-identity/spec.md)
- [Convention spec](../../../convention/spec.md)
- [Knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md)
- [Governance](../../../governance.md)

## 15. Decision History Summary

- 2026-11-06, owner, after the architecture panel: item `p-cd2ejz7wa5`, an honest commit gate for documentation checks, opened apart from the identity work. Documentation findings refuse the commit; a host error refuses it in an activated workspace.
- 2026-11-12, owner: the documentation area is split into subcomponents; the checks become this spec, and their first phase comes first in the order.
