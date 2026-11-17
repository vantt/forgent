# Need-ack for HARDEN: invocation and account config standardization

From the owner-machine session `forgentx-46` (design-lap), 2026-11-17 10:23 (+07), on the owner's request. To `lead:HARDEN` on fg-server2. Read-only request: change no file, config or state. Answer by a board log line on origin/main that links your reply report.

Context: the owner is about to start a plan to standardize how agent CLI invocations and provider accounts are configured. Before it starts, the owner wants to know whether your Seat Binding work, or the config you reconfigured on your machine, already solved any of the problems below. Check each one on origin/main and on your machine, then answer "done", "partly" or "not yet" with evidence: a commit sha, `file:line`, or a verbatim quote from a config or spec. We cannot read your `.fgos`, so never send only a run id.

## 1. Goal

Standardize and simplify how invocations and accounts are configured, while keeping flexibility. Reason: the same thing is configured in several ways.

Target shape:

- Per CLI, only the generic forms `cli`, `cli-bwrap`, `herdr`, `herdr-bwrap`, with no account suffix. The runner leases the account.
- Other structural options (transport, confinement, permission mode, prompt delivery) are separately declared invocations, reached only by a pin.
- No new run-time option mechanism.
- Delete the old path in the same change. No backward compatibility (one user).
- Owner constraint: temporary breakage while working is fine, lasting breakage is not. Every step needs a backup, a probe and a rollback.

## 2. Problems (answer each)

**V1. The global config was never moved to the new shape.**
The repo's project config was moved by `4f6fc44d7` (2026-10-19): `credentialStore {use, homeEnv}` replaced `resourceBindings`, and ids lost their account name (`codex-herdr-fgovn` became `codex-herdr`). That commit says "The older resourceBindings stay so a release without the field still runs this config". Our global `~/.fgos/config.yaml` still has 9 invocations with `resourceBindings`, and account-pinned ids such as `codex-herdr-<account>`, `omp-*-<account>`, `pi-cli-*-<account>`.
Ask: does your machine still carry the old shapes, or was it migrated? Is there a migration or doctor fix that does it which we missed?

**V2. Old forms win invocation selection.**
`bind()` takes the first confined cli invocation in list order, and the first herdr invocation inside herdr. Account-pinned forms win only because they are listed first. The standard also lists `pi-herdr` before `codex-herdr` for openai. Capability `unconfined` never removes bwrap for a bound run.
Ask: does your Seat Binding select by something firmer than list order (a rank by label, a preference for generic forms)? Where, in `rank.rs` or elsewhere?

**V3. Accounts are declared in three shapes.**
`runner.llmAccounts` (the target, `a7dedce62`, 2026-10-17), `runner.providers.<p>.accounts` (a "transition read" in the runner spec) and `~/.fgos/private/accounts.yaml`.
Ask: is the old shape removed from code, schema and doctor on your side? Is your machine fully on `llmAccounts`?

**V4. Code that only serves the old shapes is still present.**
- The branch inferring `credentialStore` from `resourceBindings` (`credentialStoreOf`). `docs/platform/agent-confinement/history/rollout-and-settled-facts.md` says it is "deleted when those configs have migrated", yet it is still in our code.
- Executor-level launch fields (`command`, `args`, `adapter`, `env`, `permissionMode`, `promptDelivery`, `confinement`, `interactiveMode`) that duplicate the invocation-level ones.
- The env override `FGOS_HERDR_PROMPT_DELIVERY`.
Ask: are these removed on your side? If removed and later re-added, in which commit?

**V5. `agy-herdr` fails on a long brief.**
Cause proven: agy ingests a pasted brief of about 6 KB in about 18 s. During that time the supervisor sees idle and no recognised draft for 4 polls (about 2.8 s), returns `DeliveryUnknown` and cancels the agent. Our fix sets `submit_by_prompt_door: true` in `agy.rs` and updates one fixture vector. A real probe then returned `ok` in 31.7 s (branch `agy-prompt-door-stopgap`, commit `8dbbfaef1`).
Ask: have you found or fixed this? What does your agy profile say (`submit_by_prompt_door`, `enter_gap_ms`, banners)?

**V6. No per-account model or tier limit.**
The account schema has only `label`, `credentialSource(s)`, `disabled`. Gemini tiers `flagship` and `frontier` map to `gemini-4-argon-high`, and one account's plan lacks that model, so that account fails with an invalid model when leased for a high tier. We plan a per-account `maxTier` key (reusing the tier enum), checked in the Seat Binding Rust crate (`rank.rs`, about lines 876-929). A new key in the global config must wait until every workspace runs a release that knows it.
Ask: do you already have a per-account model or tier limit, or an equivalent field (`models`, `maxTier`, `tierCap`)?

**V7. Invocation names are inconsistent about confinement.**
Only `claude-herdr-bwrap` carries `-bwrap`; `codex-herdr`, `pi-herdr`, `omp-herdr`, `agy-herdr` are also bwrap-confined but not named so. We plan to always state it (`<cli>-<transport>[-bwrap]`).
Ask: is a naming convention already settled, and does a test or spec assert it?

## 3. How we plan to solve it (for comment, do not act)

1. Phase 0: find out whether the inconsistency is design or unfinished legacy. Draft verdict: mostly unfinished legacy, because the 2026-10-17 and 2026-10-19 migrations reached the repo standard and project config but not the global config or accounts file, and their compatibility shims were never deleted.
2. Fix agy-herdr brief delivery.
3. Retire account-pinned forms from the global config, one executor at a time, with a probe after each step.
4. Fix the naming rule in the standard and specs.
5. Move every account to `runner.llmAccounts`.
6. Delete the legacy readers in code.
7. Owner-gated cleanups.
8. Add the per-account `maxTier`.

## 4. Final questions

- Which of the above is done or in progress on your side? If in progress, on which branch and who holds it?
- Does anything in our approach contradict a decision you settled (an ADR or a "Lịch sử quyết định" entry)? Quote it verbatim.
- On your machine, what does `fgos config check` report for `runner.executors.*.invocations` and `runner.llmAccounts`? Do not paste secrets (tokens, keys, auth paths).
- What did you learn while migrating that we should know first (traps, mandatory order, which release does not know which key)?

Reply per V1 to V7 and section 4, each as done / partly / not yet with evidence. No design rewrite needed.
