# HARDEN T9 P27 - Claude seat store (owner decision 86 Q2 (a))

Branch `harden/t9-p27-claude-seat-store`; the land range is on the board line. OPC MERGE on the code; the owner chose a dedicated fgOS claude login (decision b then a) and the account block is in place on fg-server2.

## What changed

- `core/config-standard/runner.yaml`: `claude-cli-bwrap` and `claude-herdr-bwrap` declare `credentialStore: {use: claude, homeEnv: CLAUDE_CONFIG_DIR, files: [.credentials.json], sessionDir: projects}` and `env: CLAUDE_CODE_FORCE_SESSION_PERSISTENCE: "1"`. `repo-differences.v1.json` records the difference from the pinned authoring source.
- `provider-credential-renewal.mjs`: one factory `claudeLayoutAt(name, file)` gives two layouts: `claude-config-credentials-json` (`.credentials.json`, login home is `CLAUDE_CONFIG_DIR`) and the old `claude-credentials-json` (`.claude/.credentials.json`, HOME), kept only because the live confined-mailbox harness keeps claude under HOME. `provider-credential-probe.mjs` probes the config-dir form with `CLAUDE_CONFIG_DIR`.
- `trust-store.mjs` `seedClaudeConfigTrust` and `herdr-round.mjs` `trustStorePaths`: a pane with its own `CLAUDE_CONFIG_DIR` gets `.claude.json` (onboarding, theme, workspace trust) in that directory, derived from a root trusted in the real `~/.claude.json`, which is never edited (approved by the big lead).
- Docs: agent-confinement 13.1 point 4, run-supervisor layout row and decision line, runner RUL105 text, CHANGELOG. Owner guide `guide-261112-1032-declare-claude-seat-store.md`: applied on fg-server2; the owner machine, fg-server and any other machine running confined claude seats still need it before they activate this release.

Reused: the credential-store copy and write-back path (`copyCredentialFiles`, `credentialWriteBackTarget`, finalize `sessionDir` copy from P26), the P05 claude layout and its "staged, never applied" rule, the codex/agy private-config seeding seam in `trustStorePaths`, `worker-home.mjs`'s onboarding file shape (prior art from `git log -S'CLAUDE_CONFIG_DIR'` and `-S'credentialStore'`). Missing and added: a config-dir spelling of the layout, the claude private-config seed, the env var below.

## Changes after review

- Second guard (OPC): `loginLifeProblem` refuses a claude seat whose login has less access-token life than the seat timeout (`login-expires-before-seat-timeout`, `bwrap.mjs` before the copy). The mailbox live harness's scratch claude login carried `expiresAt: 1` and the guard rightly refused it; the fixture now has a day of life.
- `DEFAULT_SEAT_TIMEOUT_MS` (`confinement/resources.mjs`) is the one code fallback for the seat timeout; the owner of the value is `runner.timeoutMs` in the standard, pinned equal by a test. Read by `authority.mjs`, `bwrap.mjs`, `assignment-runner.mjs`, `effective-execution-contract.mjs`.
- `operatorClaudeStorePath` (`trust-store.mjs`) is the one answer for the operator's claude store, used by `trustStorePaths`, the MCP approval in `authority.mjs`, and doctor `checkTrustStoreWritable`.
- Account on the machine: a dedicated login in `~/.fgos/private/claude-login`, `runner.providers.claude.accounts.main` in the accounts file (legacy form like the other pools; doctor `llm-accounts-vs-legacy` lists it as a warning like z-ai and deepseek, no `llmAccounts` entry needed).
- Backlog row `p-ti7prrwace` (Execution, high): the pane seat inherits the runner env against the allowlist.

## Real-config probe (fg-server2, after the account block)

| Invocation | Model | Result | Files | Bytes | Modes |
|---|---|---|---|---|---|
| `claude-cli-bwrap` | haiku | `kept` | 1 | 556 945 | files 0600, dirs 0700 |
| `claude-herdr-bwrap` (pane) | haiku | `kept` | 1 | 686 347 | files 0600, dirs 0700 |

No login file or `.claude.json` in either `protected/session/`; no home left under `/tmp/fgos-confinement`. Doctor `confined-pane-accounts` passes: claude `main` "has its 1 credential file(s)". The operator's `~/.claude/.credentials.json` hash prefixes are unchanged by all runs (refresh `2f2854bf32`, access `246eb431e1`; 168 min of life left at the last read): nothing refreshed. The dedicated login hashes (refresh `f541d25125`, access `cb28d9186d`, 467 min left) are the baseline for its own first natural refresh.

Rotation of Anthropic's refresh token stays unknown (no refresh was observed in this window); the account is a dedicated login, so a rotation can no longer sign the operator out.

## Verification

- `cargo test -p fgos-config` and `-p fgos` green.
- Full `npm test` (8761 tests): fails were the known V7n addendum, the document-identity citation-drift check (not this change; routed by the big lead), and two mailbox-live-confined cases caused by the new guard against the harness's `expiresAt: 1` login (fixed; the file passes alone, 19/19); its per-file timeout and one leftover `fgos-tp-*` directory followed from that failure.
- Focused set, architecture, doc-health, one-door scan (0 undeclared) green.

## Facts

- Login needs only `.credentials.json` (file names only). Headless `claude -p` runs with that alone. Sessions go to `projects/<cwd, / replaced by ->/<id>.jsonl`; `.claude.json` is also written under `CLAUDE_CONFIG_DIR`.
- A pane with only the login stops at the onboarding wizard (reads `$CLAUDE_CONFIG_DIR/.claude.json`), hence the seed.
- **Found while measuring:** a pane seat started from a claude-led run inherits `CLAUDE_CODE_CHILD_SESSION` and prints "Transcript saving is off". The pane seat's environment reaches it from the runner's environment (the seat process held `CLAUDECODE`, `CLAUDE_CODE_*`, `HERDR_*`; unsetting them in the runner gave a transcript). The `-p` seat is not affected. `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` on the invocation fixes it; without it the pane kept 0 files. See Authority.
- Real seats (dev host of this tree; the machine had no claude account entry, so a throwaway HOME with one account whose source is the real `~/.claude` was used; the owner config was not touched):
  - before, real config: `claude-cli-bwrap` = `dir-undeclared`;
  - after: `claude-cli-bwrap` kept, 1 file, 579 510 B; `claude-herdr-bwrap` (pane) kept, 1 file, 694 162 B; files 0600, dirs 0700, no login file in `protected/session/`; no leftover home under `/tmp/fgos-confinement`; the confined seat does not see `~/.claude` (masked);
  - a confined claude writing seat wrote its file (the commit step failed only for the throwaway HOME's missing git identity).
  The probe on the real fg-server2 config, after the account entry, is in the section above (both kept).

## Refresh token (owner decision b)

Nothing consumed: no seat ran on an expired copy, no refresh was forced. All eight scratch copies and the real file have the same refresh-token hash prefix and access hash as the real file (hash prefixes compared, values never printed); 225 min of access life was left.

- Rotation: **unknown.** Evidence: the CLI's refresh code posts `grant_type=refresh_token` and stores `refresh_token` from the answer with `refresh_token: j = e` (keeps the old one only if the answer has none), and it has a cross-process refresh lock whose "lock compromised" event it reports; both are what a rotating server needs, neither proves the server rotates. Access tokens live 8 h; `refreshTokenExpiresAt` sits about 25 days out. The real file was last written 23:42Z (its natural refresh); the hash comparison across the next natural refresh (about 07:40Z) would settle it, and a before-hash is recorded above (`2f2854bf32`).
- When a seat refreshes: a claude seat refreshes only when its copy's access token is expired or about to be; with 8 h life and fgOS's refresh-ahead (renews the source whenever under 60 min or probe timeout plus margin is left) a seat copy always has more than the seat timeout left, so a seat should never refresh inside its home.
- What fgOS does today for claude once an account exists: refresh-ahead backdates a scratch copy's `expiresAt`, lets claude refresh it, and applies the new pair to the source when proven newer. That is a forced refresh. With rotation it spends the source's token and depends on the apply, as for OpenAI. A runner death between the two leaves the source dead (owner would log in again); a concurrent operator claude session holds the old token in memory (it has its own file lock, but not fgOS's).
- Options: (1) keep as is plus spent-before-renew marking (the OpenAI path); (2) for claude, replace the scratch renewal by an in-place renewal (the existing probe call against the real config directory, claude does its own locked write) and refuse a seat whose copy has less than the seat timeout left; (3) a separate claude account (own login, not the operator's). Recommendation: (2) or (3); I did not change code for it.

## Authority

- Seat timeout: owner is `runner.timeoutMs` in the standard; the code constant is its fallback (one name). Operator claude store path: owner is `operatorClaudeStorePath`. Backlog `p-ti7prrwace` places the seat-environment finding with Execution.

- Execution keeps the transcript; Config standard holds the store; no authority moved.
- Found: the pane seat inherits the runner's environment (including `CLAUDE_CODE_MESSAGING_TOKEN`) while the worker env is meant to be an allowlist (`workerBaseEnv`). Where the pane gets it was not traced (runner process environment reaches the herdr pane, not the herdr server's). It belongs to Execution (seat launch); not fixed here. I worked around the one effect that matters here by declaring the env var on the invocation.
- Two spellings of one claude layout exist only for the live mailbox harness; they go when that harness moves claude to `CLAUDE_CONFIG_DIR`.


## Lessons

- `env -u $VAR_LIST` in zsh does not split an unquoted list: use a bash script (`/dev/shm/p27/run-probe.sh`) for clean environments.
- Measure a CLI under the same environment fgOS gives it: the inherited `CLAUDE_CODE_CHILD_SESSION` hid the transcript for several runs.
- A throwaway HOME needs `RUSTUP_HOME` and `CARGO_HOME` set, and a minimal `~/.claude.json` with the root trusted.
