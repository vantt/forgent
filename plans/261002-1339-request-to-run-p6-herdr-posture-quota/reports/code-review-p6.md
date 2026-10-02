# Code review: P6 (herdr transport, posture single path, quota fallback)

## Scope

- Commits: `git log --no-merges d6df056e4..af019e638^2`. The P5 terminology-sweep commits are skipped.
- Diff reviewed: `src/runner/{execution/{bind,run}.mjs, dispatch/{assignment-runner,cli,plan,settlement,herdr-round,herdr-agent,trust-store,provider-capacity}.mjs, dispatch/confinement/{policies,authority,drivers/bwrap}.mjs}`, `src/setup/registrations.mjs`, `src/workflow/{runner,store}.mjs`, `patterns/panel.mjs`, `.fgos/config.json`, docs (runner, confinement-authority, distribution), AGENTS.md, CHANGELOG.md, and the changed test hunks.
- Checks run (CLAUDE_CODE_SESSION_ID unset, no herdr panes):
  - `node --test` on bind, herdr-private-home-trust, provider-capacity and herdr-prompt-ready: 51/51 pass.
  - Probe scripts that run the real `bind()` and `canApplyPosture()` against the committed config at `af019e638^2`.
  - Secret and PII scan of the diff, the plan's `reports/evidence/**` and `.fgos/config.json`. It found nothing. Only names and modes were printed, never values.
  - Inspection of the files left in `/tmp/fgos-confinement`.

## Overall

The wiring is real. Every new function has a caller in `src/`; this time nothing is dead code. The posture fails closed: a bound Assignment always gets `mode: required`, which defaults to the bwrap backend. The `bwrapArgs` duplicate is gone. The `home-files` copy is careful: it realpaths the source, contains it inside the home, accepts regular files only, chmods to owner-only and fails closed.

There is one high-severity problem. `canApplyPosture` decides using one invocation, but a different invocation runs. On the headless/cli transport, that makes the default `fgos run` path break for most executors. Acceptance case 6 only passed because the run pinned the invocations with `--override`.

There is a second high-severity problem: `fgos setup` writes description-only capability slots. These slots make bind refuse the shipped Workflows, and they can hide a working bare-verb `prefer`, while the new doctor check still reports green.

I found no critical security issue.

## Critical

None.

## High

### H1. `canApplyPosture` approves a different invocation than the one that runs (cli transport)

- **Where:**
  - `src/runner/dispatch/confinement/policies.mjs:676-686`: with no invocation id, `pickConfinedInvocation` returns the first `via:cli` invocation that has a backend.
  - `src/runner/execution/bind.mjs:208,256`: `bound.invocation` stays `null` when the `prefer` entry names no invocation.
  - `src/runner/execution/run.mjs:316,329`: passes `preferInvocation: null`.
  - `src/runner/dispatch/resolve.mjs:~396`: with no pin, it takes the executor's first `via:cli` invocation.
- **Verified with the real `bind()` and the committed config:**
  - `marketing:research` binds to `claude` with invocation `null`, transport `cli`, posture read-only.
  - `canApplyPosture({executor, invocation:null})` is `true` for claude, gemini, openai, xai and deepseek.
  - But the first `via:cli` invocation is not the confined one: `claude-cli`, `agy-cli-mucdong`, `codex-cli-bypass-fgovn` (with `--dangerously-bypass-approvals-and-sandbox`), `pi-cli-vantt` and `pi-cli-openrouter`.
- **How it fails:** a headless `fgos run`, or one outside herdr, of any Unit whose `prefer` entries name no invocation. That covers most of the committed `prefer` lists: claude ×8, gemini ×13, xai ×13, deepseek ×8 and openai ×5.
  1. The posture requirement is still applied, so bwrap wraps the **unconfined-declared** invocation, `--ro-bind / /` with no `private-home` `resourceBindings`.
  2. codex, agy and pi cannot write their state directory (`~/.codex`, `~/.gemini`, the pi dir), and claude cannot write `~/.claude`. This is the same "dies at startup, state dir read-only" failure that `confinement-authority.md` §13.1 records for `cfd670c43`.
  3. The run fails as `execution-failure` instead of choosing the confinable invocation that `canApplyPosture` approved.
- **Evidence it is real:** `reports/acceptance-herdr.md:90` says "Pinned invocations were needed (`--override` …): the executors' first cli invocations are not confined". So ca 6 never exercised the default path.
- **Doc mismatch:** the `runner.md` decision 0050 point 2 and the CHANGELOG say `canApplyPosture` reflects the invocation that runs. It does not.
- **Security impact:** none. It still runs confined, so it fails closed. The impact is functional: it regresses headless `fgos run`, which previously ran unconfined but did run.
- **Fix:** make `canApplyPosture` (or `pickConfinedInvocation`) return the invocation id it approved. When the candidate named none, `bind()` should record that id as `bound.invocation`. Add a `runUnit` test with an executor whose first `via:cli` invocation has no `confinement` and whose second has `bwrap`. Every current fixture has a single bwrap invocation, which is why this was missed.

### H2. `fgos setup` writes description-only capability slots: bind refuses them, they can hide a bare verb, and doctor stays green

- **Where:**
  - `src/setup/registrations.mjs:2090-2100,2157-2165` (`workflowCapabilitySlots`, which writes no `prefer`).
  - `checkWorkflowCapabilitiesConfigured` at `:2310-2330`, which only checks that the key exists.
  - `bind.mjs:58-73`: `lookupCapabilityConfig` returns the exact key first and never falls through to the bare verb when the exact entry has no `prefer`.
- **Verified with the real `bind()`:**
  - Using the committed config, headless `delphi:propose`, `coding:plan` and `nominal-group:vote` all return `refused: headless-no-executor`.
  - Shadowing test:
    - A project whose config has `capabilities.plan.prefer=[gemini]` binds `coding:plan` to gemini.
    - After setup adds `coding:plan: {description}`, the same bind is refused.
- **How it fails:**
  - **Existing project:** it already routes `coding:plan`, `critique` or `synthesize` through a bare-verb `prefer`. After running `fgos setup` (an add-missing-only merge), every Unit using those capabilities is refused headless. A Lead session hides it for producer roles, because they go inline. Checker roles never go inline, so they are refused even with a Lead present.
  - **Fresh project:** `workflow-capabilities-configured` reports pass, but its own stated purpose is "one that does not [resolve] has no candidate pool … refused at run time".
  - **This repo:** all `delphi:*`, `group-cognition:*`, `nominal-group:*` and `coding:*` entries are description-only. Those Workflows cannot run headless, and doctor is green.
- **Fix:** pick one.
  1. Make bind fall back to the bare verb, then to the defaults, when the exact entry has no `prefer`, and make doctor check for a usable candidate pool rather than a key.
  2. Or have setup write no slot at all for a verb the project already serves through a bare key, and have doctor fail on any slot without a `prefer` pool.

## Medium

### M1. Copies of the account login outlive every failed, timed-out or provider-limited pane

- **Where:** `src/runner/dispatch/confinement/authority.mjs:1250-1260`. `launchPrepared` is cleaned only when `adapterReturned`. A herdr round that fails, times out or hits a provider limit throws, so the adapter never returns.
- **What stays behind:** `/tmp/fgos-confinement/<dispatchId>/home/` keeps the copied credentials, such as the agy `antigravity-oauth-token`, codex `auth.json` and pi `auth.json`. They stay until the `fgos-runner` loop starts (`loop.mjs:1378`) or someone runs `doctor --fix`. Plain `fgos run` never reaps them.
- **Why it matters:** the provider-limit fallback, the headline path of P6, always takes the throw path.
- **Contradiction:** criterion (f) says "private home removed after the worker returns". The code comment instead says the home stays "like the pane", and that is the real tradeoff: the kept pane's agent still uses that home. The CHANGELOG does not say this.
- **Machine state:** `/tmp/fgos-confinement` is mode 775, and this machine's umask is 002, so `home/` and intermediate directories such as `.gemini/antigravity-cli/` are created 0775. The files are chmodded 0600, so other users cannot read them, but they can list and create entries. 1091 empty `<dispatchId>/` directories were left behind: cleanup removes `home/` but never its parent. That is an inode leak on /tmp. No credential files were found there now.
- **Fix:**
  - Create the private home 0700. Use `fs.mkdirSync(..., {mode:0o700})` plus a `chmod`, because `recursive` ignores the mode on existing parents.
  - Remove the parent `<dispatchId>` directory as well.
  - Either remove the home when the round fails and the pane is closed, or record its path in the run's failure record so the next `fgos run` reaps it. Also document the tradeoff in the CHANGELOG and in §13.1.

### M2. A confined pane is typed at even when the readiness check saw a blocking dialog or timed out

- **Where:** `src/runner/dispatch/herdr-round.mjs:1868-1873`. `awaitPromptReady` returns `'blocked'` or `'timeout'`, which is only noted, and then `deliverBrief` runs anyway.
- **The contradiction:** the function's own doc (`:868-870`) says "typing at a dialog answers it". `confirmBriefSubmitted` is careful never to press Enter at a dialog, but the first submit types the whole brief plus a submit key into it.
- **How it fails:** an agent starts with a trust, login or update dialog. The brief is typed and submitted into that dialog, which picks the dialog's default answer.
  - bwrap still bounds the file-system effect.
  - The run then misreads the screen: the round idles until the 5-minute idle limit, rather than failing at once with the dialog quoted.
  - Whether herdr's `agent prompt` itself refuses a blocked agent (the `agent_blocked` branch) is unverified for confined targets; the call uses `wait:false`.
- **Fix:** on `'blocked'`, call `round.fail('worker-spawn-fail', 'agent_blocked', …)` and quote `lastScreenLine`. On `'timeout'`, fail the same way, or at least do not submit.

### M3. The "integrated" check for Workflow worktree cleanup hardcodes `main`, and the CHANGELOG claims a cancelled run that does not exist

- **Hardcoded `main`:** `src/workflow/runner.mjs:~107` runs `merge-base --is-ancestor <branch> main`. In a project whose trunk is `master` or `trunk`, or one that integrates into another branch, the check always fails. Worktrees are then kept forever with the reason "branch not integrated". This fails safe, so nothing is lost, but the promised cleanup never happens in those projects.
- **What gets deleted:** a passed Unit whose branch has no commits beyond its base is trivially an ancestor of `main`. If it is also porcelain-clean, it is removed with `worktree remove --force` and `branch -D`, along with any git-ignored outputs.
- **Cancelled:** the CHANGELOG says "complete, failed or cancelled". `store.mjs` has no cancelled status, and cleanup is gated on `completed|failed` only.
- **Fix:** read the integration target from the Workflow's integrate step (or `git symbolic-ref refs/remotes/origin/HEAD`) instead of `main`, and correct the CHANGELOG.

### M4. Rewriting the trust store downgrades a copied owner-only credential file

- **Where:** `src/runner/dispatch/trust-store.mjs` (`seedAgyTrust` and `seedCodexTrust`, write-tmp-then-rename).
- **What happens:** for agy the trust target is `<private HOME>/.gemini/antigravity-cli/settings.json`. That file is in the global `home-files` list and was copied with mode 0600. Writing the trust entry replaces it with a file that has the umask default mode, 0664 here. The same happens for codex if a user lists `config.toml`, which can hold tokens for MCP servers.
- **Why it matters:** this breaks the "owner-only" claim (criterion f, CHANGELOG, §13.1) for any listed file that the trust seeder rewrites.
- **Fix:** write the temp file with `{mode:0o600}`, or `chmod` the target to the original file's mode before the rename.

## Low

- **L1.**
  - **What:** `sharedCwd` (`assignment-runner.mjs:2586`, `cli.mjs:~605`) skips the per-cwd dispatch lock for any `mutation !== 'mutating'`. Whether the run is actually under a read-only posture is not checked.
  - **Writers are still exclusive:** a mutating dispatch still takes `acquireMainCheckoutLock`, and readers never hold the lock.
  - **Risk:** a direct `executeAssignment` caller with no `binding` (no posture) can run a "read-only" executor that is unconfined. For example, agy with `accept-edits` can then run beside a writer, and nothing at the OS level stops it from writing.
  - **Fix:** gate it as `sharedCwd = effectiveMutation !== 'mutating' && confinementRequirement.mode === 'required'`. This matches how the existing supervisor path behaves, so it is Low.
- **L2.**
  - **What:** a resume reuses the last recorded binding (`run.mjs:369`) even when that attempt's recorded `outcome` is already `provider-limit`. The resumed run re-dispatches the limited provider instead of moving to `nextCandidate`.
  - **Old records:** a `unit.json` binding without `candidateIndex` gets refused with `no-candidate` by `nextCandidate`. That is acceptable under the single-user, no-backward-compatibility rule.
- **L3.** `agentRead` (`herdr-agent.mjs:~415`) treats a screen whose whole text parses as JSON (for example `42`, `[]`, or an agent printing `{"error":…}`) as an envelope. It returns `''` or throws `HerdrError`. This is rare.
- **L4.** `copyHomeFiles` copies first and chmods after. For a moment the copy has the source's mode. If the source is 0644, that is a short window in a 0775 directory. Fix: `copyFileSync` to a temp file created with 0600, or `open(…, 'wx', 0o600)` and stream into it.
- **L5.** The codex `codex-home` branch (`bwrap.mjs:~91`) still copies `auth.json` without the realpath containment check and without `chmod 0600` that `home-files` now has. This predates P6, but it is the same feature, so the two branches are inconsistent.

## Tests

- The changed hunks are not weaker than before. They add a bwrap backend to the fixtures, move fixtures to `/var/tmp`, and add an outbox fallback in the fake worker.
- The fake worker's `existsSync(outbox) ? outbox : claimDir` fallback means those workflow tests pass whether or not the run is confined. Confinement itself is proven separately and properly in `run-posture.test.mjs`, which asserts that repo writes are blocked and outbox writes succeed, and that an unavailable backend means nothing is launched.
- Gap: no fixture has more than one `via:cli` invocation. That is why H1 was not caught.
- `herdr-reconciliation.test.mjs` changes the worker linger from 2 s to 60 s. That change is fine, and it makes the test slower.

## Acceptance criteria

| Criterion | Verdict |
|---|---|
| (a) transport from bind, recorded on disk | Met for herdr. For cli, the invocation recorded as `null` is not the one that ran (H1). |
| (b) one confinement path, no `bwrapArgs`, never unconfined | Met. `canApplyPosture` checks the real backend, but for the wrong invocation (H1). |
| (c) read-only reviewer blocks repo writes and allows outbox writes | Met (tests plus ca 2, 3, 6). |
| (d) provider-limit → next candidate → new pane, `fallbackFrom` | Met. Resuming after a provider-limit re-runs the limited binding (L2). |
| (e) setup, doctor, synthesizer independence, cleanup | Partial. The slots break bind and doctor gives a false green (H2); the cleanup assumes the trunk is `main` (M3). Synthesizer independence is met. |
| (f) private-home credentials | Partial. The copy is careful and fails closed, and the real directory stays read-only. Copies outlive failed and limited rounds (M1), the directories are 0775, and trust writes downgrade file modes (M4). No secrets were found in the repo, evidence or config. |

## Recommended actions

1. H1: have bind record the confinable invocation that `canApplyPosture` approved, and add a test with two `via:cli` invocations.
2. H2: give a description-only slot no effect on bind, or skip writing it; make doctor check for a usable `prefer` pool.
3. M1/M4: create the private home 0700, remove `<dispatchId>/`, decide and document whether a failed pane's home is reaped, and preserve 0600 on trust-store rewrites.
4. M2: fail the round on `blocked` or `timeout` readiness instead of typing at the dialog.
5. M3: derive the integration target instead of hardcoding `main`, and fix the CHANGELOG's "cancelled".

## Unresolved questions

- Can a `workspace-write` producer in a linked worktree commit under bwrap? The `workspace-git-metadata` grant now resolves from the worktree (`repoRoot: effectiveCwd`), and its common `.git/objects` and refs live in the read-only main checkout. I did not verify this; ca 1 passed, but it is unclear whether the commit happened inside the sandbox.
- Does herdr 0.9.1 `agent prompt` refuse a pane whose screen detector says `blocked`? This decides how severe M2 really is.

Status: DONE_WITH_CONCERNS
Summary: The wiring is real and it fails closed. Two high-severity problems: on the cli transport `canApplyPosture` approves one invocation while another runs, which breaks the default headless `fgos run`; and setup's description-only capability slots make bind refuse the shipped Workflows while doctor stays green. There are four medium credential-hygiene and robustness issues, and no critical issues.
