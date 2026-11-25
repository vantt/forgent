# Phase 2: Signal entry: wake reasons and the signed webhook route

Needs phases 1 and 3 of plan `261122-0056-orchestration-skeleton` (the keeper plan, done before this plan starts): admission's wake door and the Questions `answer_external` use case.

Decisions: OS-D8 (one raise door; wake carries `--trigger <kind> --ref <id>`; the gateway has one signed webhook
route that only calls the raise door; event id from source plus delivery id; payload is untrusted), OS-D16 (an
outside answer enters through the raise door), OS-D20 port 1.

## Inputs

- `packages/supervision/rust/src/queue.rs` (the raise door).
- `apps/fgos/src/wiring/supervision.rs` (line ~1900: `run_wake(root, payload_root, "manual", "")`).
- `apps/fgos-gateway/src/gateway.rs` (routes; `POST /v1/runner/tick` at line ~1166 is not an entry and is not
  touched), `apps/fgos-gateway/src/lib.rs`.
- Phase 3's `answer_external` use case (`packages/questions/rust/src/usecase.rs`).
- `core/config-standard/gateway.yaml`, `core/config-schema/gateway.schema.yaml`.
- `docs/platform/secrets/spec.md` (how a credential is read), `packages/distribution/contracts/doctor-registry.v1.json`.

## Footprint

`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/src/wiring/questions.rs`, `apps/fgos-gateway/src/gateway.rs`,
`apps/fgos-gateway/src/webhook.rs` (new), `apps/fgos-gateway/src/lib.rs`, `core/config-standard/gateway.yaml`,
`core/config-schema/gateway.schema.yaml`, `packages/distribution/contracts/doctor-registry.v1.json`,
`packages/host-runtime/contracts/command-manifest.json`.

## Steps

1. `fgos supervisor wake --trigger <kind> --ref <id>`: pass both to `run_wake`; default `manual` and empty ref when
   absent, as today. Add the flags to the command manifest.
2. Gateway route `POST /v1/signals/<source>`: read the per-source secret through the secrets component (config key
   `gateway.signalSources.<source>.secretRef`, default empty list, so no source is open until configured), verify an
   HMAC-SHA256 signature over the raw body in constant time, take the delivery id from the source's header, and call
   the raise door with kind `signal`, ref `<source>`, event id `<source>:<delivery id>`. A replayed delivery id is an
   idempotent no-op answered 200; a bad or missing signature is 401 and raises nothing. The body is stored as
   untrusted data; nothing in it is executed or used as a path.
3. A raised `signal` whose body names a question answer (`{ "question": "q-…", "answer": … }`) is routed by the
   watcher action table to the Questions inbound adapter in `wiring/questions.rs`, which calls `answer_external` with
   the source as channel and the party the source attests. No source adapter for a real product is built (non-goal).
4. Add a doctor row for the signal secrets only if a configured source's secret cannot be read (readiness, warning,
   no repair), judged by the gateway's own check.

## Verify

`cargo test -p fgos-gateway webhook` (tests in `webhook.rs`) and `cargo test -p fgos --test cli_tests supervisor_wake`
(or the existing wake CLI test). Pass: a signed delivery raises exactly one event, the same delivery twice raises one;
a bad signature raises nothing and returns 401; an unconfigured source returns 404; a signed answer from the asked
party becomes `questions.answered` and a signed answer from another party is refused; `wake --trigger x --ref y`
records `x` and `y` on the wake span.

## Rollback

Revert the phase commit. No source is configured by default, so the route is closed until a source is added.
