# Gateway Boundary Decision

**Decision:** do not start or build an fgOS web gateway as a prerequisite for
Runtime Recovery.

## Runtime Recovery path

The Node first profile uses the existing `herdr-agent.mjs` adapter, which calls
`herdr agent get/start/prompt/wait` through `herdr-cli`. Herdr server/socket is
transport for pane and agent-process evidence only.

## Explicit non-goals

- no `fgos gateway start` or `fgos gateway status` prerequisite;
- no new HTTP gateway for local recovery;
- no direct Herdr socket calls from domain/use-case code;
- no Herdr or web gateway authority over Run truth.

## Future options

If a required reconciliation primitive is absent from the CLI, add one small
Herdr adapter behind the same boundary and prove it with fake/server fixtures.
A separate fgOS web gateway may later expose remote dashboard operations by
forwarding to existing fgOS verbs, but it remains a client boundary, not
recovery logic.

