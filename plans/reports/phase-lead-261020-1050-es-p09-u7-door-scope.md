# Event Store phase 09 / unit 7

V-DOOR-01 now enforces spec §23.2 item 11: event-ref invocations outside the publication driver fail; generic push/fetch/update-ref requires bounded non-event ref arguments; event-file commits fail even inside the driver. Existing reader ownership checks and every unit-6 synthetic counterexample remain. Added counterexamples cover unknown refs, namespace construction, mutation, borrowed object argv, shell aliases, Rust vectors, event commits, counterfeit fixtures and recursive resolution.

Reused the existing lexer, scoped models and forwarding/import graph (introduced by `5146d38ba`; no older door implementation found by history search). Resolution memoises expression results and reader identifier walks, preserves full literals, and bounds recursive work with unknown results that reject unbounded sensitive refs. A 1 MiB literal with the event-ref marker at its end, a shared assignment graph and a recursive return all complete; no value-size truncation, environment switch or production bypass was added.

The sole new exemption class is **E3 legacy baseline on fixture repos**. The census checks fresh-root ownership, same-path bare-repository creation/return and absence of repository reassignment; filename alone is insufficient. E3 census now creates its own mkdtemp fixture repositories rather than accepting caller repository paths. A real native-publication subprocess test proves a supplied foreign repository stays untouched and both new repositories receive the published event ref.

Every exempt site (current lines; old unit-6 lines in parentheses):

| E3 site | Fixture proof |
|---|---|
| `scripts/git/e3-bench.mjs:154` (149), seeded push | `census` mkdtemp root → `local.git` |
| `scripts/git/e3-bench.mjs:497` (492), raw CAS baseline | fresh `run` root → `spawn.git` |
| `scripts/git/e3-bench.mjs:582` (577), seeded push | fresh `run` root → `push-local.git` |
| `scripts/git/e3-bench.mjs:596` (591), tip read | fresh `run` root → `push-remote.git` |

The general branch-ref one-door gate remains **Git 07 V-GATE**, which depends on this Event Store cutover. Its four production source locations here are `src/runner/worktree.mjs:332` (push, bounded through imported `branchNameFor` → `fgw/`), `:1369` (branch CAS under `refs/heads/`), `:156` (the forwarding raw spawn used by that CAS), and `src/runner/merge.mjs:1713` (target CAS under `refs/heads/`). These are three branch operations plus their forwarding spawn, not four independent branch operations. Requirement 16 and the spec clarification now state this boundary: demanding all branch-command migration here would exceed item 11 and create a circular dependency.

Validation, exact final commands:

- `timeout 120s node --test test/event-store/door.test.mjs test/event-store/door-fixtures.test.mjs test/git/e3-census.test.mjs` — 8 pass, 0 fail/skips, 8.32 seconds total; repository door scan 8.15 seconds. Budget: 120 wall-clock seconds. All four exemptions are enumerated in diagnostics.
- `node --check scripts/git/e3-bench.mjs`, `node --check test/event-store/door.test.mjs`, `node --check test/event-store/door-fixtures.test.mjs`, `git diff --check` — pass.

Impact-analysis: inactive (zero registered providers). No full npm suite, performance-budget claim, staging, commit, activation or lifecycle operation. The program board remains coordinator-owned outside this write scope. Convention confirmed this report path. MDView preview of the updated phase document failed with a read-only database; no URL is available.

Status: DONE
Summary: The spec-scoped door is green with all synthetic counterexamples retained, bounded resolution and four fixture-proven E3 exemptions. Branch-ref caller migration remains with Git 07 V-GATE.
