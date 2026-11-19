# Phase 3: Shaper persona, persona-not-found, head TMPDIR

## Context
p-ficygecgfb: `fgos session start shaper` fails `verb-failed (internal)`; there is no `core/agents/shaper.yaml`;
`resolveAgentDefinition` throws `AgentNotFoundError` which `bin/fgos.mjs` (~3384) maps to internal. Grants are in
`src/session-host/head-grants.mjs` (`GRANTS`; unknown persona gets `NONE`). p-d3ub553ogh: no TMPDIR in a head sandbox;
`TMPDIR` is in the worker env allowlist but nothing sets it; the confinement policy reads TMPDIR for its roots.

## Requirements
1. `core/agents/shaper.yaml` in the shape of `secretary.yaml`: drives `fgos-shaping` for one topic, writes one
   DISCUSSION.md under docs/discussions, parks owner questions in the question store, hands off when settled.
2. Grant `shaper`: writes `docs/discussions`; verbs `HEAD_VERBS` + `QUESTION_VERBS` (no answer, no session start/write,
   no land); mailbox true; peers false.
3. `placeHead`/`pinPersona` map `AgentNotFoundError` to `persona-not-found` listing the known personas; add it to
   `HEAD_ARGUMENT_CODES`. Test in `test/session-host/`.
4. A head launch exports `TMPDIR` pointing to a private, writable directory inside its sandbox (under the head's own
   runtime dir), created before launch; prove on the head shape that it is set and writable. If making it writable needs
   `src/runner/dispatch/**` or the engine (lead:S6A), stop and report.
5. Rebuild generated agent/skill surfaces if personas render there.

## Validation
`node scripts/run-tests.mjs test/session-host/*.test.mjs` (focused), grant tests in run-supervisor if verbs are mirrored.
