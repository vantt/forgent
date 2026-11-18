# Retired tests -> owner now (Node callers of the host route)

Owner abbreviations: `golden_bind.rs` = `packages/execution/rust/tests/golden_bind.rs` over
`packages/execution/contracts/bind.v1.json`; `client.test.mjs` = `test/seat-binding/client.test.mjs` (the one wiring
test of the facade round trip through the route).

| retired test | owner now |
|---|---|
| `test/runner/execution/seat-policy.test.mjs` (whole file; module deleted) | `golden_bind.rs` seatConfig vectors (slice and digest); the digest op itself: `client.test.mjs` "the real host answers digest and preflight" |
| `bind.test.mjs` herdr transport cases (producer binds with herdr transport, prefer pin never swapped by herdr, herdr invocation that cannot carry the posture, without herdr the cli transport, human override pins an invocation, bare executor in unit prefer takes herdr, inside herdr the herdr invocation is recorded) | `golden_bind.rs` "inside herdr ..." and "a generic invocation is chosen over a named one ..." vectors |
| `bind.test.mjs` read-only posture, governance, headless refusal, in-process native agent, blind role cases, posture-unavailable, confinement-backend refusal | `golden_bind.rs` "a seat with no writes is read-only", "a disallowed executor/provider is passed over", "a headless seat with nothing configured ...", "an agent the session runs natively binds in process", "a blind seat is recorded as blind", "without a confinement backend ..." |
| `bind.test.mjs` spread, family spelling, modelPolicies spelling, prefer, persona chain, locked persona, timeout, maxTier lowering, skills, debate seats, effort refusal | `golden_bind.rs` spread/independence, "a modelPolicies cell written under another spelling ...", persona (7 vectors), timeout (3), maxTier (2), skills (3), effort (3) vectors |
| `bind.test.mjs` fallbackFrom record (another entry, family, account, family with no cell) | `golden_bind.rs` walk vectors ("after the first candidate fails ...", "... the first cell entry fails ...", "an account rotation ...") |
| `bind.test.mjs` account named by the lease, no login store, lease state read (quarantine, sticky, liftable, probe failed) | `golden_bind.rs` account vectors ("a quarantined account is passed over ...", "the account an assignment holds stays its account", "... liftable", "a disabled account is passed over"); the Node reading of the overlay stays proven in `bind.test.mjs` "the lease state is read for a bind only when the caller names accounts" |
| `bind.test.mjs` "the bind ask holds a seat to the executor of a seat bound earlier" (bind half), "a reviewed unit that declares a tier ..." (bind half) | decision half: `golden_bind.rs` hard/soft independence and workflow tier vectors; ask-building half kept in `bind.test.mjs` as ask-shape tests |
| `bind.test.mjs` "a capability that prefers an invocation with no confinement backend is refused" | `golden_bind.rs` "a pin of a named invocation is kept", "without a confinement backend ..." |
| `bind.test.mjs` `contractVersion` / provenance asserts | `golden_bind.rs` (every bind vector records the whole binding); version of the host: `client.test.mjs` round trip |
| `tier-fallback.test.mjs` "explaining a seat with the fallback walk off ..." | option removed (explain always answers the whole walk in one host call); candidates and walk: `golden_bind.rs` explain vector "a capability with a prefer order lists its candidates, cell, walk and accounts per pool"; one-call walk: `client.test.mjs` round trip |
| `bind-committed-config.test.mjs` "a capability gets the same family and model inside herdr and headless; only the transport differs" | `golden_bind.rs` "inside herdr the herdr invocation runs" and "inside herdr ... cli invocation is kept" vectors |
| `tier-cell.test.mjs` "a global cell reaches the binding", "bind skips an entry whose pool has no account ...", "bind never runs an entry whose pool nothing can pay for", "an object cell's effort reaches the binding ...", "bind runs the model of an object cell ..." | `golden_bind.rs` "after the first cell entry fails the walk takes the next entry of the same family", effort vectors, pool/account vectors; the config-loading halves stay in `tier-cell.test.mjs` (global cell load, `supportsPolicyTier`) |
| `dispatch-execute-effort.test.mjs` "bind() takes a reasoningEffort override ...", "bind() refuses an effort outside the vocabulary ..." | `golden_bind.rs` "an override effort that is no effort is refused", "an override effort the invocation renders is used" |
| `executor-model-vectors.test.mjs` "Node bind answers as the bind contract records ..." | `golden_bind.rs` (the one owner of `bind.v1.json`) |
| `test/seat-binding/golden-cases.helper.mjs` and the crate-input bind cases of `client.test.mjs` | `packages/seat-binding/rust/tests/golden.rs` (the crate keeps its own input at protocol 1) |

Kept on purpose (still behaviours of live Node code, running through the route): `explain.test.mjs` (explain.mjs is
deleted by the native-verbs phase), `account-pin.test.mjs`, `account-rotation.test.mjs`, `bind-committed-config.test.mjs`
(committed-config data), `tier-cell.test.mjs` config loading, `run-gate.test.mjs` (replay gate, now asks the `digest` op).
