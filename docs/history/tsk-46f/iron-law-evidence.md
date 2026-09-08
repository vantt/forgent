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
