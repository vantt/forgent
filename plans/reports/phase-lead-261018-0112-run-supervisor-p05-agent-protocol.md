# Phase report: agent-protocol direct adapters

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p05-agent-protocol` merged `--no-ff` into integration.

## Delivered
- `fgos-agent-protocol`: `port.rs` (`AgentIo`, `SendInput`, `IoError`), `outcome.rs` (`Outcome`, `BlockedReason`, `StdinPolicy`, `Activity`, `ExitInfo`), `direct/{mod,claude,codex,agy,pi,omp,generic}.rs`.
- `adapter_for(cli)`: exact name (case-insensitive), unknown -> `generic` (exit + outbox only).
- `classify`: result file present -> `Completed`; else last 5 non-empty tail lines scanned -> `Blocked(Login|UsageLimit)`; else `Exited(code)`. Patterns hand-ported (no regex dep) from `provider-auth-failure.mjs`; Node evaluator untouched.
- `newest_result` helper picks highest `result-<N>.json` from an outbox listing (pure, no fs).
- Fixtures `contracts/fixtures/direct/<cli>/vectors.json` (6 vectors each); contract `vectors` and `unknownCli` lines updated.

## Evidence
- `cargo test -p fgos-agent-protocol`: 7 passed, 0 failed (phase worktree and integration worktree). clippy clean, fmt clean.
- `node --test test/run-supervisor/contracts.test.mjs`: exit 0.
- No dependency on `fgos-terminal-control` (`cargo tree`: no deps; serde_json dev-only).
- Review (Sonnet code-reviewer): fixed multi-occurrence "api key" match, tab after "no api key found for", contract `unknownCli` drift. Left: auth checked before quota when both in the tail (acceptable).
- GitNexus impact: only new symbols; the one edited symbol was an empty `mod direct {}`. No HIGH/CRITICAL.

## Decisions
- All five adapters use `StdinPolicy::NullDevice`: today every spawn uses stdin `ignore` and the prompt travels in argv; no CLI is verified to read the brief from stdin. `BriefFile` exists as the seat for a later change.
- `needs-human` is not produced in direct mode: no measured output wording exists; the result-file status stays with the Node evaluator.
- `trust-dialog` is terminal-only; not classified in direct.
- `Activity::Event` for JSON-object lines, `Output` for other text; liveOutput selection stays with Node.

## Concerns
- Real captures: codex usage-limit, pi "No API key found", pi/xai OAuth wording and agy "not logged into" are measured. claude and omp login lines are standard/pi-family wordings, not measured on those CLIs; no real omp or agy run dirs exist on this machine.

## Unresolved
- None blocking.
