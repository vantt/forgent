# HARDEN T9 P27 - Claude seat store (owner decision 86 Q2 (a)) - DRAFT, not landed

Branch `harden/t9-p27-claude-seat-store` (pushed). Landing waits for OPC's MERGE and the owner's go on the account block.

## What changed

- `core/config-standard/runner.yaml`: `claude-cli-bwrap` and `claude-herdr-bwrap` declare `credentialStore: {use: claude, homeEnv: CLAUDE_CONFIG_DIR, files: [.credentials.json], sessionDir: projects}` and `env: CLAUDE_CODE_FORCE_SESSION_PERSISTENCE: "1"`. `repo-differences.v1.json` records the difference from the pinned authoring source.
- `provider-credential-renewal.mjs`: one factory `claudeLayoutAt(name, file)` gives two layouts: `claude-config-credentials-json` (`.credentials.json`, login home is `CLAUDE_CONFIG_DIR`) and the old `claude-credentials-json` (`.claude/.credentials.json`, HOME), kept only because the live confined-mailbox harness keeps claude under HOME. `provider-credential-probe.mjs` probes the config-dir form with `CLAUDE_CONFIG_DIR`.
- `trust-store.mjs` `seedClaudeConfigTrust` and `herdr-round.mjs` `trustStorePaths`: a pane with its own `CLAUDE_CONFIG_DIR` gets `.claude.json` (onboarding, theme, workspace trust) in that directory, derived from a root trusted in the real `~/.claude.json`, which is never edited (approved by the big lead).
- Docs: agent-confinement 13.1 point 4, run-supervisor layout row and decision line, runner RUL105 text, CHANGELOG. Owner guide drafted, now on hold.

Reused: the credential-store copy and write-back path (`copyCredentialFiles`, `credentialWriteBackTarget`, finalize `sessionDir` copy from P26), the P05 claude layout and its "staged, never applied" rule, the codex/agy private-config seeding seam in `trustStorePaths`, `worker-home.mjs`'s onboarding file shape (prior art from `git log -S'CLAUDE_CONFIG_DIR'` and `-S'credentialStore'`). Missing and added: a config-dir spelling of the layout, the claude private-config seed, the env var below.

## Facts

- Login needs only `.credentials.json` (file names only). Headless `claude -p` runs with that alone. Sessions go to `projects/<cwd, / replaced by ->/<id>.jsonl`; `.claude.json` is also written under `CLAUDE_CONFIG_DIR`.
- A pane with only the login stops at the onboarding wizard (reads `$CLAUDE_CONFIG_DIR/.claude.json`), hence the seed.
- **Found while measuring:** a pane seat started from a claude-led run inherits `CLAUDE_CODE_CHILD_SESSION` and prints "Transcript saving is off". The pane seat's environment reaches it from the runner's environment (the seat process held `CLAUDECODE`, `CLAUDE_CODE_*`, `HERDR_*`; unsetting them in the runner gave a transcript). The `-p` seat is not affected. `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` on the invocation fixes it; without it the pane kept 0 files. See Authority.
- Real seats (dev host of this tree; the machine had no claude account entry, so a throwaway HOME with one account whose source is the real `~/.claude` was used; the owner config was not touched):
  - before, real config: `claude-cli-bwrap` = `dir-undeclared`;
  - after: `claude-cli-bwrap` kept, 1 file, 579 510 B; `claude-herdr-bwrap` (pane) kept, 1 file, 694 162 B; files 0600, dirs 0700, no login file in `protected/session/`; no leftover home under `/tmp/fgos-confinement`; the confined seat does not see `~/.claude` (masked);
  - a confined claude writing seat wrote its file (the commit step failed only for the throwaway HOME's missing git identity).
  The final probe on the real owner config waits for the account entry.

## Refresh token (owner decision b)

Nothing consumed: no seat ran on an expired copy, no refresh was forced. All eight scratch copies and the real file have the same refresh-token hash prefix and access hash as the real file (hash prefixes compared, values never printed); 225 min of access life was left.

- Rotation: **unknown.** Evidence: the CLI's refresh code posts `grant_type=refresh_token` and stores `refresh_token` from the answer with `refresh_token: j = e` (keeps the old one only if the answer has none), and it has a cross-process refresh lock whose "lock compromised" event it reports; both are what a rotating server needs, neither proves the server rotates. Access tokens live 8 h; `refreshTokenExpiresAt` sits about 25 days out. The real file was last written 23:42Z (its natural refresh); the hash comparison across the next natural refresh (about 07:40Z) would settle it, and a before-hash is recorded above (`2f2854bf32`).
- When a seat refreshes: a claude seat refreshes only when its copy's access token is expired or about to be; with 8 h life and fgOS's refresh-ahead (renews the source whenever under 60 min or probe timeout plus margin is left) a seat copy always has more than the seat timeout left, so a seat should never refresh inside its home.
- What fgOS does today for claude once an account exists: refresh-ahead backdates a scratch copy's `expiresAt`, lets claude refresh it, and applies the new pair to the source when proven newer. That is a forced refresh. With rotation it spends the source's token and depends on the apply, as for OpenAI. A runner death between the two leaves the source dead (owner would log in again); a concurrent operator claude session holds the old token in memory (it has its own file lock, but not fgOS's).
- Options: (1) keep as is plus spent-before-renew marking (the OpenAI path); (2) for claude, replace the scratch renewal by an in-place renewal (the existing probe call against the real config directory, claude does its own locked write) and refuse a seat whose copy has less than the seat timeout left; (3) a separate claude account (own login, not the operator's). Recommendation: (2) or (3); I did not change code for it.

## Authority

- Execution keeps the transcript; Config standard holds the store; no authority moved.
- Found: the pane seat inherits the runner's environment (including `CLAUDE_CODE_MESSAGING_TOKEN`) while the worker env is meant to be an allowlist (`workerBaseEnv`). Where the pane gets it was not traced (runner process environment reaches the herdr pane, not the herdr server's). It belongs to Execution (seat launch); not fixed here. I worked around the one effect that matters here by declaring the env var on the invocation.
- Two spellings of one claude layout exist only for the live mailbox harness; they go when that harness moves claude to `CLAUDE_CONFIG_DIR`.

## Open before landing

OPC review (confinement and credentials), the owner's go on the account block, `cargo test -p fgos-config` and `-p fgos`, full `npm test`, the real-config probe for both invocations, cleanup of worktree, branch and Cargo target.

## Lessons

- `env -u $VAR_LIST` in zsh does not split an unquoted list: use a bash script (`/dev/shm/p27/run-probe.sh`) for clean environments.
- Measure a CLI under the same environment fgOS gives it: the inherited `CLAUDE_CODE_CHILD_SESSION` hid the transcript for several runs.
- A throwaway HOME needs `RUSTUP_HOME` and `CARGO_HOME` set, and a minimal `~/.claude.json` with the root trusted.
