# doc-checks: commit gate and rules (build step 2)

Branch `docos/doc-checks` (worktree `/home/vantt/projects/.doc-work/docos-doc-checks`), based on `64a2396eb`. Not pushed, not merged.

## Outcome

The commit gate and the rules are built and the corpus passes. One spec point is not met to the letter: classify still runs once per document that needs it, not once for all staged paths, because `convention classify` accepts exactly one path. Changing that changes the Convention contract, so it waits for an owner decision (open question 1).

## Commits

| Commit | What |
|---|---|
| `9a132efa9` | docs sweep: retired verbs pin their removing commit or name the current door; runner rules 1-3 and 5-8 retitled |
| `e87c4981e` | doc-health: path input, Convention check over paths, verb reference rule, rule-claim owner rule, rule id in every finding |
| `9a2545183` | pre-commit: ACMRD selection, index read, refusal on findings and on host errors |
| `df4a104dc` | `doc-provisional-aged` parses `updatedAt`, 30-day cutoff, reported as a warning; `docRegistry.topicMaxDocs` in the config standard and schema |
| `e3eaed78f` | doc-checks spec (Implementation line, section 12, section 15), area spec, Convention spec, CHANGELOG |
| `177b04ce4` | the verb rule asks the host for `fgos --help --json` instead of reading the manifest file (the help door row allows only the host to read it) |

## What was built

- `scripts/doc-health.mjs [--json] [--repo-root <dir>] [--] [<path>...]`. With paths it runs Convention check once over the paths that exist and every body rule on the platform documents among them; a missing path is a deletion and is never read. Without paths it checks the whole platform corpus, as before. Each finding prints `<file>:<line>: <rule>: <message>`.
- The hook does not pass a `--staged` flag. It imports `checkDocuments` and hands it a source over the Git index that it builds itself (`git ls-files`, `git cat-file --batch`, `git rev-parse` for pinned commits; all read verbs, the `hook-read-context` class of the one-door census). An outer script never spawns Git (Git spec section 13), so the index read lives in the hook. This is documented in the script header.
- The verb rule and the dead-path rule now share one exemption test: a pinned commit on the line; classify not canonical, or a past-state kind; a `Canonical: No` header. Before this change the dead-path rule did not look at the header, so it now also skips `Canonical: No` drafts. The spec says the two rules have the same exemptions; this change makes that true.
- The rule-claim owner rule keys claims by (holder, id, title). The holder is the document that defines the claim, which matches the holder table ("RUL ids belong to the exact area/subcomponent spec.md"). Under path input it still reads the whole population, but it reports only the checked paths.
- `knowledge-lints.mjs` now requires `topicMaxDocs` and keeps no default of its own. The section description of `docRegistry` is unchanged on purpose: editing it would give every project's config a `config-doc-drift` finding, which `fgos config check` treats as a failure.

## Tests

All runs used `env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs` under the heavy-IO lock.

| File | Result |
|---|---|
| `test/scripts/doc-health.test.mjs` | 11/11. New: verb rule, rule-claim rule, path input. Extended: the dead-reference case covers the `Canonical: No` exemption. The live whole-corpus case is kept. |
| `test/e2e/root-file-guard-hook.test.mjs` | 14/14. One new wiring case: a modified document is checked, a staged deletion breaks its links, an unstaged fix does not count. It replaces "ignores modifications to pre-existing scoped files", a behaviour that is now removed. The other Convention hook cases now carry the new posture: placement is asked once; the old-host case now refuses instead of pass-skipping. |
| `test/report/knowledge-lints.test.mjs` | 14/14. New aging case. |
| census-drift, event-layout, git-one-door-declarations, commit-unit-work, run-sync, git-mutation-census, check-decision-codes, enduser-index, knowledge-attest-gate, architecture, registrations, config | all green (219 + 80 + 73) |
| `cargo test -p fgos-config --no-fail-fast` | green apart from 2 failures this change does not touch: `bundle_lists_match_the_files_under_core` (the `secretary` section file is not listed in `bundle.rs`; from `e345b8974`) and `no_machine_or_owner_specific_string_is_in_the_standard_files` (`sessionRotation.yaml` holds "token"; from `5ed9aee58`). Neither file is changed on this branch. |
| `cargo test --workspace --no-fail-fast` | 425 test binaries ok. The only failures are the 2 `fgos-config` cases above (targets `authoring_equivalence` and `golden_schema`). |

Full `npm test` was not run here, as the brief asked.

## Live doc-health result

`FGOS_HOST_BIN=target/debug/fgos node scripts/doc-health.mjs` reports 632 platform documents, 2954 local links, 302 metadata-exempt and 0 findings. The first run of the new rules found 140 findings: 124 unknown verbs and 16 duplicate rule claims.

## What was swept

- **Retired verbs.** Each line now pins the removing commit: `setup` `12f8a187a` (85 mentions), `coordination` `2180b4e72`, `check` `c36f8d746`, `evolve` `120af6b3d`, `tool` `bf1a44f8d`, `preflight` `987d6918b`, `head` `dbd26eae6` (renamed to `session`), `repair` `53523a917`. Present-tense claims were reworded:
  - config spec: "Today `fgos setup` writes" now says what it did before it was retired.
  - config spec: the gateway token is now created by `doctor --fix`.
  - document identity: the starter set and the model fetch now happen at onboarding (`fgctl init`). This is a wording choice for planned behaviour; please confirm the door.
  - document identity: `fgos tool query` in the "Reused" list is now `fgos dispatch decide --for <capability>`.
- **Mentions that were never verbs.**
  - `fgos pkm` and `fgos terminal` are now reworded as "a passthrough verb for pkm" and "a user verb for terminal control".
  - `fgos provider-capacity probe` is an audit caller label, not a verb. It is now quoted as the string literal it is, with a pointer to `state.rs`.
  - The heading "4. Retired `fgos setup`" lost its code span, so its anchor `#4-retired-fgos-setup` still resolves. The body line below it carries the sha.
- **`docs-lease` and `unlock`** needed nothing. The `docs-lease` line already pins `97dd62aa7`, and `unlock` sits in a verification document.
- **Rule claims: a deviation from the spec, please confirm.** Spec section 10 says the runner subcomponent should cite the 7 work-state rules instead of repeating them. But the runner bodies are not repeats: they are runner rules filed under borrowed titles. For example, runner RUL3 "write order: event first, projection after" actually says "the runner runs the proof itself; the assistant's word is not evidence", and RUL5 "expectation-checked writes" says "the model is chosen by the work's tier". The mismatch already existed at `947dc3103`. Replacing these bodies with citations would have deleted runner rules. Instead they were retitled after their own bodies, and the 17 runner references that meant the runner rule followed. The 4 references marked "(work-state)" were left as they are. Work-state keeps its definitions.
- **RUL11 (tiến hóa schema)** in `work-state/decisions/retired-decision-history.md` was a bold citation, not a definition. It is now a plain citation.
- **The 6 invalid YAML frontmatter documents.** None remains: `51f39d252` (2026-11-14) quoted nine such documents, and a scan of `docs/` through the YAML door finds 0 refused.
- **Convention spec.** Its pre-commit statements (ACR only, pass-skip on an old host, "not duplicated in pre-commit") contradicted the signed doc-checks 6.5. They are aligned, and a decision-history entry is added.

## Deferred, and why

- **One host call for classify.** The Convention contract change is open question 1.
- **Registering the 20 unregistered end-user documents.** The spec said 19; one more has appeared since. These are registry writes to the main checkout's event store, each needs a topic and role decision, and the brief keeps me out of the main checkout. The list, from the committed projection `docs/doc-registry.json`:
  - 19 under `docs/how-to/`, 8 of them in `coordination-examples/`: author-a-plan-loop-track, compare-discussion-setups-with-metrics-eval, configure-and-operate-agent-confinement, the 8 architecture-advisory-panel-v1 examples, install-fgos-in-a-project-and-use-doctor, measure-a-real-case, operate-dispatch-runtime-inspection-and-reconciliation, recover-main-checkout-after-ignored-files-wipe, run-a-coordination-session, use-fast-test-feedback-commands, use-fgos-architecture-panel, use-fgos-group-thinking
  - `docs/reference/discussion-quality-rubric.md`
- **The registered path missing on disk.** This is `docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name/wire-a-skill-to-an-executor-by-purpose-not-name.md` (provisional). It was deleted on purpose in `beeca503d`. Proposed repair, in the main checkout: `fgos topic retire how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name`, then `fgos doc-registry`. It is a registry write, so I did not run it.

## Files proposed for deletion (owner approval needed)

- `.fgos/docs/enduser-docs-index.json`. It is tracked, holds `[]`, and was last touched in `e6cf436aa`. No reader was found: every reader in `src/`, `bin/`, `scripts/`, `apps/` and `packages/` uses `docs/enduser-docs-index.json`. Note that the hook's staged `.fgos/` deletion guard refuses an ordinary commit of this deletion, so removing it needs that guard's sanctioned path.

## Side effect to know about

While I probed which verbs exist, running the worktree host with unknown verbs (`setup`, `coordination` and others) appended invocation-fault lines to the main checkout's `.fgos/logs/invocation-faults.jsonl`, because the host records faults at the main state root. I did not edit, revert or commit anything there.

## Open questions

1. **One-call classify (sent to the lead with options).** Recommendation B: `convention classify -- <path>...` always answers an array; doc-health, its only caller, moves in the same change. Alternative A keeps the single-object answer for one path. Alternative C is what is built now: per-document classify, memoised and lazy, so a clean commit makes zero classify calls.
2. **Runner rules retitled instead of cited.** Does the owner accept this?
3. **Onboarding as the door for document identity's starter set and model fetch.** Is `fgctl init` the door the owner intends?
4. **Verb listing source.** The verb rule asks the activated host, as spec section 9 says. A commit that adds a verb and documents it in the same change is refused until the activated host carries the verb. Is that acceptable? The alternative needs a change to the help door row in `docs/architecture-manifest.json`.
5. **Host timeout under load.** During the workspace cargo build, one host call hit the 5 s timeout in `invokeHost`, so on a loaded machine the gate can refuse a commit with "host timed out". This matches the owner's posture (a host error refuses), but it may be noisy on the owner's QLC disk.
