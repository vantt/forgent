# Plan — glm executor smoke test (tsk-3gr)

Mode: tiny

Lane decided directly (discovery verdict was `clear`, skipped `exploring`,
no prior lane in context). Flag count: 1 (external systems — a real call
to OpenRouter). No auth/data-model/contract/cross-platform/covered-
behavior/multi-domain concerns; no code is changed by this item at all —
it's a one-shot verification run against already-merged, already-tested
code (`tsk-gb3`). 0-1 flags → tiny.

## Approach

Run the item's own `verify` command exactly as discovery wrote it — that
command itself is the entire deliverable here, no separate step needed:

```bash
OUT=$(node src/runner/dispatch.mjs execute glm --prompt 'Reply with exactly the single word: PONG' --has-live-task-access) \
  && echo "$OUT" | node -e "..." # parses OUT.status===0 and /PONG/i.test(OUT.stdout)
```

Why this is real proof, not a guess: real Anthropic's API would reject an
unrecognized model string like `z-ai/glm-5.2` outright, so a real,
correct reply can only come back if `ANTHROPIC_BASE_URL`/
`ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_MODEL` actually took effect at spawn
time and OpenRouter actually routed to Z.ai's GLM 5.2. No mocking, no
config-only check — a live external round trip using the real key
already placed in `.fgos/secrets.local.env`.

No files touched, no split, no risk map beyond "the external call itself
might fail" (network/quota/key issue) — that failure mode is exactly what
running `verify` for real surfaces, not something to pre-guess here.

## Real finding during validating (tier-A action, not guessed)

Running the live dispatch for real (before this gate asked anyone
anything) found a genuine bug: `glm` had no `providerModel`, so tier
resolution fell back to `modelPolicies.claude` ("sonnet"), and the
resulting `--model sonnet` CLI flag silently won over the
`ANTHROPIC_MODEL` env override. Proof, both real commands:

- Before fix: self-identification prompt → `claude-sonnet-5` (real
  Anthropic Claude, NOT GLM — the executor was silently broken).
- Fixed `.fgos/config.json` directly on the main checkout (same
  structural reason as `tsk-gb3`'s own registration — `.fgos/` never
  lives on a worktree branch, ADR0020): added `modelPolicies["z-ai"]
  .lightweight = "z-ai/glm-5.2"` and `glm.providerModel = "z-ai"` +
  `rigorOverrides` (mirrors `agy`/`pi`'s own precedent exactly). Commit
  `2df84be4` on `main`.
- After fix: same self-identification prompt → `z-ai/glm-5.2` (real GLM,
  confirmed). The item's own `verify` command (PONG round trip) passes
  for real with this fix in place.

This is exactly why the item's own scope was "confirm it actually takes
effect... not just that config validation passes" — config validation
alone would never have caught this; only a live round trip did.

## Second real finding (user-directed, during executing)

User asked to also add `ANTHROPIC_DEFAULT_HAIKU_MODEL`/
`ANTHROPIC_DEFAULT_SONNET_MODEL`/`ANTHROPIC_DEFAULT_OPUS_MODEL` (all set
to `z-ai/glm-5.2`) to `glm`'s env block — Claude Code's own hinted
"modelOverrides" mechanism for its "unrecognized model" warning. Added
directly to `.fgos/config.json` on main (commit `2d2dd4d5`, same
structural reason as before). Real test after adding: the warning
persists — it fires off the literal `--model z-ai/glm-5.2` flag this
executor's own `args` template always passes, never the bare
`sonnet`/`haiku`/`opus` alias these three vars actually govern, so they
are correctness-neutral no-ops for this executor's own invocation shape.
Correctness reconfirmed unaffected either way (self-identification still
returns `z-ai/glm-5.2`). Kept in config anyway (harmless, matches what
was asked, and would matter if a future invocation shape ever passes a
bare alias instead of a literal model string).

Also discovered during this same round: `fgos discover`/`fgos edit` (x3)
returned valid-looking successful responses that did NOT durably persist
on the first attempt (a fresh `fgos list` read showed `stage: discovery`
again with an empty discovery record, well after the calls "succeeded")
— re-running the exact same calls a second time persisted correctly
(verified via an immediate fresh read after each). Not chased further
here (task item, no code footprint) but worth a dedicated bug report —
see the session's own end-of-turn summary.

## Outstanding questions

None
