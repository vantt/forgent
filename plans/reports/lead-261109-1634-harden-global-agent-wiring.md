# Lead report: a person's own agent config changes only through `fgos wire-agents`

Date: 2026-11-09 (Asia/Saigon). Lane: HARDEN, fg-server2. Landed on main `d1356df76..ed38755fd`.
Decision: owner decision 80 Q2 (a), `plans/261021-1118-harden-low-layers-bottom-up/plan.md`.
Evidence: `plans/reports/audit-261109-1533-fgos-packaging-distribution.md` (F10, Q2).
Guide (Vietnamese, 3 machines): `plans/reports/guide-261109-1634-owner-machine-harden-global-agent-wiring.md`.
Review: OPC CHANGES 16:36 (the plugin row failed with no fix), fixed in `051cfb4ef`; OPC MERGE after that.

## 1. Global writes found (main `a945bc03a`)

| Writer | file:line | Target | Run by | Added |
|---|---|---|---|---|
| `fixAgyPermissionsConfigured` | `src/setup/agy-permissions.mjs:134-143`, registered `registrations.mjs:1236` | `~/.gemini/antigravity-cli/settings.json`: `toolPermission: always-proceed` + 7 deny rules, no backup, even without agy | `doctor --fix`, `setup`, `fgctl init` tail | `fca51f1bd` 2026-08-18 |
| `fixMailboxClaudeAccept` | `src/setup/mailbox-claude-accept.mjs:52-70`, registered `registrations.mjs:1833` | `$CLAUDE_CONFIG_DIR` or `~/.claude/settings.json`: `crossSessionInbound: accept` when the mailbox is on | same | `d9ef03fb5` 2026-10-31 |
| `fixClaudePluginMarketplace` | `src/setup/registrations.mjs:2108-2141` (`execFileSync` 2117, 2129) | `claude plugin marketplace add vantt/forgent`, `claude plugin install fgOS@fgos-plugins` | same, when `claude` answers | `f52d200b6` 2026-08-05 |

`apps/fgctl` and `packages/distribution` write no agent config themselves; `fgctl init`, `upgrade` and `repair` reach it only through the tail `fgos init`, `fgos doctor --fix`, `fgos doctor` (`packages/distribution/rust/src/init.rs:565`). Trust-store writes (`~/.claude.json`, codex `config.toml`) happen at dispatch time in the runner, outside init/setup/doctor. Two writes outside the project that are not agent config stay (section 5).

## 2. What changed

- The three fixes left the doctor registry. `fgos init`, `fgos setup` and `fgos doctor --fix` now leave HOME byte-identical outside `~/.fgos` and run no changing `claude` command.
- New verb `fgos wire-agents [--yes] [--json]`, `src/setup/agent-wiring.mjs`. Name: verb-noun form of `resync-worktree`/`recheck-blocked`, and the doctor's own word for agent setup (`*-hook-wired`); `fgos agents` was not reused because it is a read-only persona listing. Behaviour:
  - acts only on agents present (`claude` answering `--version`, `agy` on PATH); lists the absent ones;
  - without `--yes`: prints every command and file and writes nothing;
  - with `--yes`: copies each existing file to `<file>.pre-wire-agents-<time>` (same directory, mode kept, `COPYFILE_EXCL`) before the `claude` CLI changes it; a failed step is reported and exits 1;
  - today's one change: the fgOS Claude plugin marketplace and plugin;
  - never writes agy `always-proceed` or Claude `crossSessionInbound: accept`; shows file, value and why (the mailbox spec section 7.2 already says not to set accept globally).
- Doctor rows report only: `claude-plugin-marketplace` and `agy-permissions-configured` (only when agy is on PATH) warn, never fail, naming the command; `mailbox-claude-accept` passes on accept, hold or the default and fails only on an unreadable file. `doctor --strict` stays green on an unwired machine. The plugin row still fails when `claude` cannot answer its listing.
- `mergeConfigDefaults` (`src/setup/config-merge.mjs`) deleted with its test: its last caller was the agy writer. The plugin check moved out of `registrations.mjs` (161 lines removed there).
- Census: 4 `claude` spawn sites in `registrations.mjs` became 1 in `agent-wiring.mjs`, 0 undeclared. `command-routes.json` and the version vector regenerated.
- Docs: packaging spec RUL111 and its decision history, the setup-doctor registry contract, the doctor how-to, `docs/reading-map.md`, CHANGELOG.

fgctl exit with `claude` present and no plugin: 0 before and after. Doctor exits non-zero only with `--strict`, which the tail never passes; on main the red row showed in doctor output only.

## 3. Tests

- Owning proof `test/setup/agent-wiring.test.mjs` (5 tests), red first on main (`d1356df76`): `~/.gemini/...` created and `~/.claude/settings.json` changed by init + doctor --fix + setup with a fake `claude` and `agy` and the mailbox on.
- Retired: agy fix provisioning, idempotence and preservation cases and the mailbox accept fix case (behaviour removed; its absence owned by `agent-wiring.test.mjs`); the plugin fix cases (owned by `agent-wiring.test.mjs`: install-only, settled, failing step, add+install); `test/setup/config-merge.test.mjs` (module removed). The agy check keeps a customized-deny-list case; one `fgos doctor` wiring proof for both agy rows remains.
- Full `npm test` (before rebase): 8606 tests, 1 fail, the known V7n addendum, no ERROR lines. After rebase: focused set 1581 tests, 0 fail; doc-health, citation drift, architecture inside it; one-door scan 0 undeclared.

## 4. For other lanes

- Packaging sub-plan `plans/261109-1617-harden-packaging-distribution` expected item (2) to make "which agent CLIs are on this machine" a registry table. It did not: presence is `claude --version` and `firstOnPath('agy')` inside `planAgentWiring` (its `absent` list). Phase 01 can reuse `planAgentWiring` or extend that function; there is no table.
- Phase 08 (uninstall): `wire-agents` has no reverse command. What it leaves: `<file>.pre-wire-agents-<time>` copies and the plugin registered through `claude` (`claude plugin uninstall fgOS@fgos-plugins`, `claude plugin marketplace remove fgos-plugins`).
- TEST: add `test/setup/agent-wiring.test.mjs` to `test/suite-baseline.json`.
- The plugin marketplace still points at GitHub `main`, not the activated release (audit F13), unchanged here.

## 5. Concerns

- Legacy `fgos setup` still inserts its shell-rc source line into existing rc files when run from a git checkout, and the `mailbox-sync-timer` fix writes `~/.config/systemd/user` when cross-machine mail is on. Neither is agent config, so decision 80 Q2 does not cover them; the setup rc line is held by the compatibility-window decision in its registry entry. Owner call if "only the project and `~/.fgos`" should hold literally.
- Two PATH lookups exist side by side (`src/runner/paths.mjs:150` and `src/state/tool-registry.mjs:135`, plus `firstOnPath` in `project-launcher.mjs`); this change used `firstOnPath` and added none. Out of scope, worth one item.

## Lessons

- I started a full suite, then got a review change while it waited in the machine queue; stopping it with SIGTERM before it ran cost nothing. Send the diff to the reviewer before starting the full run, not after, when the queue is long.
- The spec of a neighbour component (mailbox 7.2: do not set accept globally) already settled one of the design questions. Grep the other specs for the setting name before deciding a row's severity.
- A doctor row whose fix is removed must be re-judged: "fails, fixable" becomes "fails forever" without a fix. Ask "is this readiness or a choice?" for every row that loses its fix.
- Rebase onto a main where three lanes land CHANGELOG lines and the census conflicts every time; regenerate the census at each conflicted commit rather than at the end.
