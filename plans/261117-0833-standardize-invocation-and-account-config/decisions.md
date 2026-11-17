# Decisions needed from the owner

Each question follows `core/skills/_shared/decision-question.md`. They are batched so one sitting
answers all of them. D1 to D3 block P3 and P4. The rest block only their own step.

## D1: How invocation names show confinement

- **What is happening:** `-bwrap` appears on claude's herdr form only (`claude-herdr-bwrap`), while
  `codex-herdr`, `pi-herdr`, `omp-herdr` and `agy-herdr` are also bwrap-confined. The name does not
  say what the invocation does.
- **Cause:** checked all 8 herdr invocations (global plus standard): all carry `confinement.backend:
  bwrap`. An unconfined herdr invocation can never be chosen by `bind()` (`bind.mjs:162,170-171`,
  `policies.mjs:679-683`).
- **Options:**
  - **A. Always state it:** `<cli>-<transport>[-bwrap]`. Rename 4 ids (`codex-herdr`, `pi-herdr`,
    `omp-herdr`, `agy-herdr` get `-bwrap`). Gain: one mechanical rule, and the suffix exists exactly
    when `confinement.backend` is set. Matches the target the owner accepted. Cost: about 60 files of
    expected strings and docs, roughly 2h inside P4, plus the global rewrite in P3 (same write anyway).
  - **B. herdr implies bwrap:** `-bwrap` only on `cli`. Rename `claude-herdr-bwrap` to `claude-herdr`
    (9 files). Gain: smaller rename and shorter names. Harm: the rule is asymmetric, and it holds only
    because unconfined herdr is unreachable today.
- **Recommendation:** A. It removes the confusion at its root, and the extra cost is a one-time mechanical rename.
- **Scope of the answer:** authorizes the rename in the standard, tests, fixtures, spec text and the
  global config. Does not authorize new keys or a naming lint (see Ideas in plan.md).

## D2: Which unconfined forms stay

- **What is happening:** the global config carries 8 unconfined account-pinned forms (`pi-cli-*`,
  `omp-cli-vantt`, `codex-cli-bypass-fgovn`, `pi-cli-openrouter` x2). The owner's matrix lists `cli`
  (unconfined) per CLI.
- **Cause:** an unconfined invocation cannot read a leased login (`config.mjs:502-508`), so it uses
  the CLI's host login. It is never chosen by `bind()` when bwrap exists (`bind.mjs:162`, pins too at
  `rank.rs:777-786`), and only the work-seat path reaches it (`bind.mjs:576-583`). Today's harness
  shows the pinned unconfined forms fail (sandbox / read-only node:fs).
- **Options:**
  - **A.** Delete all unconfined account-pinned forms, keep `claude-cli` (standard), and add no new
    `<cli>-cli`. Cost: config-only (P3). Gain: the account always comes from the lease.
  - **B.** Also add generic unconfined `codex-cli`, `pi-cli`, `omp-cli`, `agy-cli`. Harm: host-login
    runs that bypass the lease, with no consumer. Cost: 4 invocations plus probes.
- **Recommendation:** A.
- **Scope:** authorizes deleting those forms. Adding an unconfined form later needs a named consumer.

## D3: One account shape

- **What is happening:** accounts are declared in three shapes (inventory.md).
- **Cause:** `llmAccounts` was introduced as the target on 2026-10-17. Its transition read waits for
  every release to read it, and all three activations do.
- **Options:** **A.** Move everything to `runner.llmAccounts` and delete `runner.providers` (P5, then
  code in P6). Cost: about 3h of config plus the P6 code. **B.** Keep both and only fix invocations.
  Harm: the owner's complaint about accounts remains.
- **Recommendation:** A.
- **Scope:** authorizes accounts-file writes through the door with backups. Does not authorize
  printing or moving login files.

## D4: Global lists versus the standard

- **What is happening:** the global config replaces the standard's invocation list per executor.
- **Cause:** older activations carry an older standard (for example, gemini through omp), so
  inheriting the standard now would break them.
- **Options:** **A.** Write explicit generic lists in the global now (P3), and unset them once every
  workspace runs the release with the new standard (P7 step 4). **B.** Unset now. Harm: mcp-skill-hub
  and momentry lose gemini.
- **Recommendation:** A.
- **Scope:** both writes are global and owner-approved.

## D5: Executor-level launch fields and the prompt-delivery env override

- **What is happening:** `command`, `args`, `adapter`, `env`, `permissionMode`, `promptDelivery`,
  `confinement` and `interactiveMode` can be declared both on the executor and on each invocation,
  and `FGOS_HERDR_PROMPT_DELIVERY` overrides prompt delivery at run time. No shipped config uses the
  executor-level forms.
- **Cause:** read in `runner.schema.yaml:760-860`, `resolve.mjs:289-293`, `policies.mjs:672-685`,
  `config.mjs:473-489` and `assignment-runner.mjs:989`.
- **Options:** **A.** Delete them in P6 (about 300 lines of src and tests). Convert
  `runner.executor` to an invocation. **B.** A separate backlog item.
- **Recommendation:** A. It is the same "many ways for one thing" inside this scope (RUL11).
- **Scope:** code and schema only. No new mechanism.

## D6: Stopgap for agy panes until P1 ships

- **What is happening:** every capability that binds gemini inside herdr now fails (`review`,
  `code:test` and `code:implement` bind `agy-herdr` first).
- **Options:** **A.** Set `promptDelivery: file-pointer` on the global `agy-herdr` (one global write,
  one probe). Harm: a person sees a pointer line instead of the brief. **B.** Wait for P1.
- **Recommendation:** A if gemini seats are needed before P1 is activated, else B.
- **Scope:** one global write. Revert in P7.

## D7: Clear the gemini/mucdong quarantine

- **What is happening:** a manual-clear quarantine (auth-token, 2026-10-09) keeps mucdong out.
- **Options:** **A.** Run a direct probe (quota), then clear through the door if it answers. **B.** Leave it.
- **Recommendation:** owner call. A if mucdong's capacity is wanted (its pool is split off in P8).
- **Scope:** one state write through its verb.

## D8: mcp-skill-hub is out of scope

- **Owner decision 2026-11-17:** "quên mcp-skill-hub đi". The plan does not migrate, check or
  write mcp-skill-hub's project config, and P6 is not gated on it.
- **Consequence:** when P6 deletes the legacy `resourceBindings` reader, a release that
  mcp-skill-hub later activates will refuse its old config. That repo owns the fix then.

## D9 and D10: withdrawn

Owner agreed on 2026-11-17 to cap mucdong through a separate pool and the existing `model@pool` tier cells (the deepseek/thehive precedent), so the interim and the account-order change are not needed. See phase-08.

## Questions answered (owner, 2026-11-17)

- **Q-A:** only mucdong is capped (tier advanced and below). tetnu and tetcu72 are unrestricted and tetcu72 is preferred.
- **Q-B:** gemini stays in the flagship `architecture:*` seats, kept for tetcu72 first. Reading used in P8: the flagship and frontier cells name only the `gemini` pool, where tetcu72 leads and tetnu follows. If the owner wants tetcu72 alone at flagship, that needs a third pool; ask before doing it.
- **Approved to run:** P3, P5, P8. Each global write still goes through `fgos config` with `--global --reason` and a backup first.
