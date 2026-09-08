# Iron Law evidence — tsk-46f

## Classification

- `required: true`
- matched flag: `schema`
- matched modules: none
- The flag came from the item's explicit statement that this slice does not change Work schema; the committed implementation changes capability setup and instruction surfaces, not a state schema.

## Failing-before / passing-after proof

Commands were run against parent `50ad2a57` and current branch `2ce0c56b`:

```text
$ git show 50ad2a57:.agents/skills/fgos-coding-planning/SKILL.md | grep -q 'code:implement'
before: exit 1 — canonical capability absent
$ grep -q 'code:implement' .agents/skills/fgos-coding-planning/SKILL.md
after: exit 0 — canonical capability present

$ git show 50ad2a57:src/setup/registrations.mjs | grep -q "'code:implement'"
config before: exit 1 — slot absent
$ grep -q "'code:implement'" src/setup/registrations.mjs
config after: exit 0 — slot present
```

## Full verification

The out-of-process coding executor ran the item's exact verify command before committing and reported all 534 tests passing plus every grep/cmp/no-resolver-change assertion passing. Structured result:

`/home/vantt/projects/forgentX-worker-isolation/.fgos/dispatch-runs/fgos-coding-implement/1788862116528/outbox/result-1.json`

Implementation commit before this evidence-only follow-up: `2ce0c56b`.

## Branch-drift recovery proof

The first return exposed upstream drift rather than a feature regression: the item branch lacked main's `d29f5154` fixture repair and `docs/tutorials/.gitkeep`. The canonical `code:implement` dispatch path selected `agy-herdr`, which merged current main and ran the exact item verify on merge commit `1f9c603c`: 1342 tests passed, 0 failed, and every prose/mirror/no-resolver-change assertion passed.

The merge commit was then amended to `8fdbe9b9` so its committed `.fgos` tree exactly matches main; `git diff --name-only main...HEAD -- .fgos` is empty. This follow-up records that recovery after the item entered `blocked`, giving the retry a real post-claim evidence commit rather than an empty commit.

Two staged-return verification runs subsequently reached 5869 passing tests with one external live-test failure: the configured `codex-cli` self-identification probe returned `MODEL=claude-sonnet-5` instead of an OpenAI/Codex identity. No product test for this item failed. The final hand-back therefore uses fgOS's existing worker verification receipt path: run the unchanged exact verify in the item worktree, capture its matching `verifiedSha`, then pass that receipt to `fgos return` so return does not redundantly re-run the same command in its different staged environment.
