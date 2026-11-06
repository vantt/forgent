# Claude private config per pane, codex/agy trust-store writes (branch `harden/t5-p05`, base `84f36c8f3`)

Status of the phase: **half done, half stopped.** The codex/agy store-write fixes are done and committed. The claude half (owner decision 63) is stopped before any code: its write-back and renewal need a claude layout in `src/runner/dispatch/provider-credential-renewal.mjs` and a claude probe in `provider-credential-probe.mjs`. The brief gives the first file to the parallel credential-renewal follow-up and says to stop if this phase must touch it.

## Commits on the branch

| Commit | What |
|---|---|
| `4be153d75` | Red row cherry-picked from `f66cc72e0`: "an unconfined claude pane never writes the operator's claude store" (`test/runner/herdr-private-home-trust.test.mjs`). **Still red.** It turns green with the claude half. |
| `cc21769d3` | Fixes the codex and agy trust-store writers. Changes `cleanup-trust` to report `remove-failed`. Adds a CHANGELOG line and regenerates the census. |

## What changed (codex/agy, `cc21769d3`)

- `src/run-supervisor/trust-store.mjs`:
  - `writeFileKeepingMode` and `writeStoreAtomic`'s temp-and-rename are replaced by one `writeStore`. It resolves the store's `realpath`, keeps the mode, and writes through `replaceDurably` (`src/native/door.mjs`), which syncs the file, renames it and syncs the directory. Effect: a store behind a link stays a link. A dangling link is refused as `write-failed` and is not replaced by a file.
  - Every writer now goes through `writeStore`: codex seed and remove, codex hook trust, agy seed and remove, and the claude JSON writer (it stays until the claude half lands).
  - `codexSectionPattern` (a regex that ended at the first `[`) is replaced by `codexSectionRange`. A section now ends at the next line that starts a table header.
  - The project key is written as a TOML basic string (`tomlBasicString`, shared with the hook header).
  - `removeCodexTrust` and `removeAgyTrust` throw a `TrustStoreError` when the store cannot be read or written. An absent entry or a missing file still returns `false`.
  - `uniqueTmpTag` is no longer imported.
- `src/run-supervisor/steps/cleanup-trust.mjs`: a `TrustStoreError` from a removal becomes `{ result: 'done', detail: { trust: 'remove-failed', kind, code } }`.

## Red → green evidence

The four new cases in `test/runner/dispatch-trust-store.test.mjs` were run on the base before the fix (`node scripts/run-tests.mjs`, `HERDR_*`/`CLAUDE*` unset):

| Case | Red on base |
|---|---|
| a codex config or agy settings file reached through a link stays a link, and the file it names gets the entry | `the codex config is still a link after the seed` |
| removing a codex trust section keeps the rest of the config valid: the section ends at the next table header, not at the first bracket | `the whole section goes and nothing after it` |
| a workspace path with a quote or a backslash is written as an escaped TOML key and is found again | `the key is a TOML basic string` |
| a trust entry the cleanup step cannot remove is reported as remove-failed, for codex and for agy | `TrustStoreError ... EACCES` thrown out of `cleanupTrust` (no `remove-failed`) |

After the fix, all four pass. Focused runs: `dispatch-trust-store`, `worktree-config-trust`, `herdr-private-home-trust` (only the P01 claude row fails, as expected), `terminal-groups`, `terminal-cutover`, `terminal-crash-matrix`, `agent-cli-trust-check`, `dispatch-reconciliation-import-graph` and `architecture`: 0 failures apart from that row. `git-one-door-scan --root .`: 0 undeclared. The full suite was **not** run: the phase is not complete and the branch cannot land as it is, so the full run belongs to the resumed phase.

Tests retired: none. Net size of `cc21769d3`: Node src −23 (trust-store −29, cleanup-trust +6), tests +85, Rust 0.

## Why the claude half stopped (facts, read on `84f36c8f3`)

Decision 63 asks for three things for every claude pane: copy the login into a private `CLAUDE_CONFIG_DIR`, renew it once at the source before the run, and write a login renewed in the pane back through the hardened door. On main today none of the three exists for claude:

1. **No claude write-back.** `writeBackRenewedCredential` accepts only `LAYOUTS` (pi, codex, omp). The comment says claude's layout is `read only: no fgOS dispatch renews a Claude login` (`provider-credential-renewal.mjs:545-559`). For a claude source `credentialLayout()` returns `null`, so `credentialWriteBackTarget()` returns `null` (`:1333-1340`). Even a bwrap-confined claude pane today drops a login it renewed when its home is removed.
2. **No claude renewal at the source.** `refreshAhead` returns `skipped/unsupported-layout` for claude (`:1199`). `credentialProbeCommand` has no claude branch (`provider-credential-probe.mjs:45-77`), so no scratch renewal can run either.
3. **No provider-signed account claim for claude.** Claude stores `.claude/.credentials.json` → `claudeAiOauth { accessToken, refreshToken, expiresAt, ... }`. The tokens are opaque, not JWTs, and carry no account claim; `oauthAccount` in `.claude.json` is the agent's own word. Under the A8 gate (`applyAgentCopies`: `claimed === null` → the copy is kept), **a claude login renewed in a pane is never applied automatically. It is kept for hand recovery, the same as xai.** The gate must not be weakened. A renewal fgOS makes itself in a scratch copy (`renewInScratch`) does not need the claim, so renewal at the source can work once a claude layout and probe exist.
4. **Unconfined panes have no account to write back to.** `credentialStoreDir` needs `provider` and `accountId`. A claude pane with no `runner.llmAccounts` lease (the operator's own `~/.claude`) has neither.

So the claude half needs, in files this phase does not own:
- `provider-credential-renewal.mjs`: move claude into `LAYOUTS` with `files`, `markDue`, `apply`, `stage` and `identity: () => null`, and make `credentialLayout` recognise a claude source.
- `provider-credential-probe.mjs`: a claude probe command (`claude -p`, `CLAUDE_CONFIG_DIR=<scratch>`, no tools).
- A decision on case 4.

## Decision needed (owner or big lead)

- **What is happening:** decision 63's claude write-back and renewal need the credential-renewal module, which the parallel follow-up owns. A pane-renewed claude login can only be kept for hand recovery, because claude tokens name no account.
- **Cause:** claude was left out of the renewable layouts on purpose ("no fgOS dispatch renews a Claude login"), and its tokens are opaque.
- **Options:**
  - (a) Hand this phase the claude-layout and probe edits after the follow-up lands, and rebase on it. About +60 Node lines in the renewal and probe modules. The cost is waiting for the follow-up.
  - (b) The follow-up adds the claude layout and probe, and this phase only wires them. Its scope grows, but no file is shared between the two phases.
  - (c) Keep unconfined claude panes in place (no private config). Remove only the `~/.claude.json` write by moving folder trust to a per-process flag. Measured: none exists for claude folder trust. Not viable without a new measurement.
- **Recommendation:** (b) if the follow-up is still open, else (a). For case 4: unconfined panes with no lease use a fixed account id for the operator's own login (`provider: anthropic`, account `operator`), so pending copies go under one known store directory. **Risk to accept explicitly:** if Anthropic rotates refresh tokens, a pane that refreshes inside its private copy logs the operator's own claude out until someone recovers the staged copy by hand. Renewal at the source before each run makes this rare (only runs longer than the access-token lifetime) but does not prevent it.
- **Scope of the answer:** only the claude half of this phase. The codex/agy half is done.

## Items for other phases

- P06 (`herdr-round.mjs` after this phase): unchanged until the claude half lands.
- The CHANGELOG line about claude (no `~/.claude.json` writes, private config, hand recovery like xai) will be written with the claude half. It is not written yet.

Status: NEEDS_CONTEXT
Summary: Codex/agy trust-store fixes are done and committed (`cc21769d3`, four red→green cases). The claude private-config half is stopped: its write-back and renewal need a claude layout in the parallel-owned `provider-credential-renewal.mjs` plus a claude probe, and claude logins carry no signed account claim, so a pane-renewed login can only be kept for hand recovery.
Concerns/Blockers: needs the owner or big lead to pick option (a) or (b), and to decide the account id used for unconfined claude panes with no lease; the P01 claude row stays red until then.
