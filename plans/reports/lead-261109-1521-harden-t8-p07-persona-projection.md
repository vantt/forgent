# Lead report: T8 P07 persona projection

- Branch `harden/t8-p07-persona`; files: `scripts/project-agents.mjs`, `test/scripts/project-agents.test.mjs`, census.
- Done: output name = source file stem (Convention `agent-name` rule); declared `name:` that differs refused; any spliced scalar with a newline refused (field + file named); unstamped existing target skipped and reported by name, every other target written, exit 1. New exported `projectAll()` returns `{ written, skipped }`.
- Lead decision applied: skip-and-report instead of refusing the whole run (the six AgentKit-named personas in `core/agents` would otherwise block the four generated ones). The unstamped-target test changed meaning accordingly: it now asserts the foreign file is untouched and the other target is written.
- Tests: four new cases in `project-agents.test.mjs` (stem/name collision, newline scalar, unstamped skip, four real personas byte-identical and re-accepted); no test retired.
- Gate: focused set 100 pass; full `npm test` (log `/dev/shm/harden-t8-p07-full-145122.log`): 8601 tests, 1 fail = known V7n addendum; census 0 undeclared.
- Script is 290 lines (budget 275 missed: estimate was +12, real +34).
- Real-run note: the tracked `.claude/agents/council-*.md` carry `model: sonnet`, which the generator has not emitted for a while; the next real run will drop that line. Not changed here.
