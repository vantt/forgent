# RESEARCH — cutting npm test CPU by blocking real `claude` CLI spawns

Accumulating record. Each round appends its own dated section; never
overwrite an earlier round.

## Round 1 — 2026-08-11 (stage `discovery`, tsk-1opx)

### What was asked

Is there any genuinely unresolved question — an unfamiliar library, an
unknown concept, an unverified external fact — blocking planning for
"stop 10 setup tests from spawning the real `claude` CLI"?

### What was checked

Every named thing the goal depends on resolved inside this repo; no term
fell through to an external lookup, so no WebSearch/WebFetch round was
needed and none is recorded here.

| Term | Where checked | Result |
|---|---|---|
| `NO_CLAUDE_ENV` | `rg -- NO_CLAUDE_ENV test src` | found, read directly |
| `claudeCommand` / `FGOS_CLAUDE_COMMAND` | `rg -- "claudeCommand\|FGOS_CLAUDE_COMMAND" src bin` | found, read directly |
| `checkClaudePluginMarketplace` | `rg -- checkClaudePluginMarketplace src` | found, read directly |
| tests intentionally wanting the real `claude` | `rg -- FGOS_CLAUDE_COMMAND test` | found, read directly |

### What was found

**F1 — the swap is environment-preserving, not merely equivalent.**
`NO_CLAUDE_ENV` is defined as
`{ ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' }`
(`test/setup/helpers/setup-checks-harness.mjs:41`). It is a strict superset
of `process.env` — spreading it instead of `process.env` adds one override
and removes nothing. So `{ ...NO_CLAUDE_ENV, HOME: homeDir }` cannot drop an
env var the old form supplied. The harness already re-exports it
(`setup-checks-harness.mjs:116`), and all 5 target files already import it
at line 16.

**F2 — the blocking seam is a real, intended test-only seam.**
`claudeCommand()` returns `process.env.FGOS_CLAUDE_COMMAND || 'claude'`
(`src/setup/registrations.mjs:828-829`), documented in place as a
"test-only seam" (`registrations.mjs:822`, and again at `:285`). Pointing it
at a nonexistent path is the sanctioned way to block the spawn, not a
workaround.

**F3 — four separate real-CLI spawn sites sit behind the check.**
`checkClaudePluginMarketplace()` (`src/setup/registrations.mjs:860`) reaches
`claudeCommand()` at `:834` (`--version`), `:848` (a `plugin ... --json`
read), `:902` (`plugin marketplace add <github source>`) and `:914`
(`plugin install <ref>`). The last two are network calls. The check is
registered once in the check registry (`registrations.mjs:931`), which is
why both `fgos setup` and `fgos doctor` reach it.

**F4 — one of the 10 occurrences has a different syntactic shape, and a
naive find-replace would silently miss it.** Enumerated across the 5 files:

- `checks-setup-config.test.mjs:45,58`
- `checks-setup-envelope.test.mjs:46,64`
- `checks-setup-hookspath.test.mjs:44,57`
- `checks-setup-rc-line.test.mjs:44,71`
- `checks-setup-idempotent.test.mjs:44,68`

Nine are the property form `env: { ...process.env, HOME: homeDir }`. The
tenth, `checks-setup-idempotent.test.mjs:44`, is a variable binding —
`const env = { ...process.env, HOME: homeDir };`. A replace keyed on the
literal string `env: { ...process.env, HOME: homeDir }` matches only 9 of
10 and leaves one ~11s test spawning the real CLI. This is a mechanical
finding, not a scope question: the edit has to cover both shapes.

**F5 — no test intentionally exercises the real `claude` binary.** Every
test touching this path blocks it or stubs it:

- blocked with `/nonexistent/fgos-test-claude-binary`:
  `registrations.test.mjs:24` (process-wide), `doctor-fresh-run.test.mjs:80`,
  `cli/fgos-setup.test.mjs:198`, `plugin-marketplace-doctor-check.test.mjs:109,122`
- stubbed with a purpose-built script written at test time:
  `plugin-marketplace-doctor-check.test.mjs:97-103` (sets
  `FGOS_CLAUDE_COMMAND` to `scriptPath`, restoring the prior value after)

So the item's constraint "if a test intentionally wants the real claude,
keep it and record why" has an empty answer set — nothing needs keeping.
The 10 occurrences are an oversight, consistent with `checks.test.mjs`'s own
stated intent (its header says the suite must never touch this machine's
real Claude Code config as a side effect).

**F6 — three further unblocked spawns exist outside the item's stated 10.**
`test/setup/checks.test.mjs:971,984,997` spawn `fgos doctor` /
`fgos doctor --pretty` with `env: { ...process.env, HOME: homeDir }`, in the
same file that already imports and uses `NO_CLAUDE_ENV` elsewhere
(`checks.test.mjs:20,473,752,772,775`). By F3, `doctor` reaches the same
registered check, so these three are the same leak in a file the item does
not name. Reported as a finding only — whether they belong in this item's
first unit is the caller's scope call, not this skill's.

### What remains open

Nothing blocking planning. Two things are measurements, not unknowns, and
the item's own plan already sequences them after the edit:

- the actual post-fix CPU/wall-clock numbers (predicted 117.6s → ~1.3s for
  the suite; 429s → ~319s total CPU)
- whether F6's three `doctor` spawns are in or out of this first unit

### Verdict

`{ clear: true }` — every named dependency resolved in-repo with citations;
no external fact needed verifying.
