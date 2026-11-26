# Agent Context Engine: final report of the lead

Date: 2026-11-26. Lead: fg-server session. Plan: `261125-1631-agent-context-engine`.

## Outcome

Agent Context Engine (ACE) is its own component and the one checked store of every fgOS rule. Rule units stay Markdown
files in the three existing roots; a Rust crate on pkm checks them, composes them and compiles one effective rule set
with a digest (`.fgos/instructions/effective/rules.json`). The Node rule registry and composer are deleted with their
tests. Rules are refused when they are written, by `fgos internal context-engine check` and by the pre-commit hook.

## What landed on main

| Phase | Landed | What |
|---|---|---|
| 1 | `6d7933abd` | Area spec, four v1 contracts (rule unit, when-keys, effective rules, refusals), vectors |
| 2 | `d5fd432f9` | pkm fit probe, `reports/pkm-fit.md`: pkm fits, no blocking gap |
| 3 | `b05001289` | Crate `fgos-agent-context-engine` (tier 3) on pkm, host door `fgos internal context-engine compile\|check`, adapters, 7 units migrated to v1, Node registry and composer deleted, the instruction projection reads `rules.json`, component and four contracts declared, packaging-distribution decision superseded |
| 4 | `b66397a8f` | Write-time checks, near-duplicate check, `--paths`, pre-commit block (fails closed) |
| 6 | `0d1c5ff66` | Changelog line, integration gate |

## Evidence (phase 6, main with phases 1 to 4)

- `cargo test --workspace --no-fail-fast`: 453 groups pass, 1 fails. The failing test is
  `a_planner_mailing_a_head_outside_its_row_is_refused_recipient_not_allowed`, red on main before this plan.
- `npm test`: 6507 of 6559 pass, 25 fail. All 25 are red on main before this plan or load timeouts that pass alone
  (herdr seat suites, fgctl upgrade, init and download, holder-lock gate, provisioning, workflow guide model;
  `closing-block` takes 603 s inside the full run and passes alone, 8 of 8). None concerns rules, the projection,
  the authority model or the census.
- The release binary compiled this repository's 7 real units: `ok`, no refusal, digest recomputed independently
  (Python, canonical JSON of the `rules` array) equals the digest in `rules.json`; the file equals the committed one.
- `rg -l "instruction-registry|instruction-composition" src scripts test bin` prints nothing.

## Deviations from the plan, and why

1. Phase 4 queries the nearest rule by the unit's note already in the tree, not by raw text: a text query is rescored
   and is no longer a cosine, so the 0.93 threshold would not apply. A pre-write check of a draft by raw text is not offered.
2. Phase 4 refuses at 0.93 and prints candidates in the top 3 at or above 0.84 as advice only. The phase 2 probe found
   1 of 7 verified paraphrase pairs at 0.93 and no threshold that separates paraphrase from neighbour. The
   must-refuse fixture is the probe's pair 6b (0.948), not a pair of cluster 1. Its score against the real embedding
   model was not re-measured: the model is not on fg-server.
3. Owner question 1 (approval id): answered by the owner on 2026-11-26 14:56 on fg-server as `q-5sog3pzmqn`
   ("Approve both as planned"). Owner question 2: decided by the lead on the plan's own recommendation and not
   objected to (refuse with `rule-search-unavailable`, name the fix, never skip silently).
4. Files outside the plan footprint were changed because a gate demanded it: `apps/fgos/src/main.rs` (the door
   registration), `package.json` (`files` carries the pkm pack), `AGENTS.md` (the generated projection block now names
   `rules.json` and the renamed rule files), `docs/platform/graph/spec.md` and `docs/platform/packaging-distribution/spec.md`
   (dead references to the deleted Node files), the generated mutation census and suite baseline. The land door did not refuse any of them.
5. Five rule files were renamed so that the file stem equals the rule id (pkm resolves wikilinks by stem).

## Work outside this plan that blocked it, and was done to unblock

- The Git journal reached its scan bound on fg-server (99,773 ledger entries). Landed: `fgos git recover
  --confirm-writer-dead <id>` (`da11e3533`, repeatable fix `7b27cf860`, literal fix `6312015a1`) and the scan bound as
  one named constant of 1,000,000 (`c8f827d3e`). Backlog: `p-ip5m4sbzyd` (done), `p-yx3a7mmhz6` (ledger archive after
  30 days, decided).
- Main went red on the decision citation check four times in one day because documents landed with `land --paths`
  ran no document check. Fixed by rewording the offending lines each time (backlog `p-xz3rns7o52`, mailbox spec, backlog
  `p-43k6sgxn66`, `p-kvqp2ih4mf`), each with a board line. The root cause (the paths land runs no document check) is
  recorded as a friction and is not fixed.

## Left for the owner or the supervisor

- The activated `fgos` on fg-server (activated 2026-11-18) predates main: plain `fgos` lacks `land`, `request`, `resource-check`,
  `--option`, `--confirm-writer-dead` and the `context-engine` door, and the Agent-tool hook refuses with `config-schema`.
  The pre-commit block of phase 4 fails closed on it. A release should be activated; ten fgctl upgrade and init tests
  are red on main and should be understood first.
- `core.hooksPath` is not wired to `.githooks` in the main checkout (`npm run setup:hooks`), so the new pre-commit block
  guards no commit there yet.
- Not started, by the lead's brief: plan `261125-2041` (gather every fgOS rule to one owner), then the start context
  plan `261122-1946`. Both wait on this plan through `blockedBy` or on the supervisor's admission.
- The real-model score of pair 6b is unmeasured.

## Frictions recorded for improvement

About 20 records under `fgos friction list --since 2026-11-25`: executor timeout of a flash model on a spec phase,
the claude executor writing a claim the schema refuses (five times) so the runner commits nothing, review seats that
fail or time out (three times), a worker permission prompt in a headless run, a blocked round whose edits cannot be committed
later, unformatted Rust delivered, briefs that named no unit tests of the changed binary, the installed release lacking
the lead skill's verbs, the paths land that runs no document check.
