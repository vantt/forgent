# plan.md — tsk-yo0: web client scaffold (vite + TS + Tailwind) + API client layer

Mode: **small**

Flag count/which applied (per `fgos-routing`'s Mode gate): 0 real flags —
no auth/authorization decision being made here (D13 already locked Bearer,
this item only attaches the header per an already-settled scheme), no
data model, no audit/security decision (D6/D7/D13's threat-model tradeoffs
are already accepted, not reopened here), no external-system integration
beyond the already-contracted gateway, no public-contract change
(consumes `docs/contracts/fgos-gateway-api-v1.yaml`, never edits it), no
cross-platform surface, no existing covered behavior at risk (greenfield
directory, `herdr-plugin/web/` does not exist yet — `RESEARCH.md` round 1
confirmed), no multi-domain span. A few files, no gray areas — every
open question the description raised (contract shape, G3, gateway-
unreachable handling) is already answered by real evidence in
`RESEARCH.md`, which is exactly the "small" bar
(`fgos-routing`'s own Mode gate: "a few files, no gray areas").

`impact-analysis: full` per `fgos tool query --capability impact-analysis
--status present` (gitnexus `present`, re-confirmed this session at
tsk-54y's own planning pass, same session). Not exercised for THIS item's
risk map: every piece here is new code in a new directory with no
existing callers — there is no blast radius to measure, only new surface
to build. No proof point in this plan leans on blast-radius evidence.

## Approach

**Chosen path:**

1. **Scaffold** `herdr-plugin/web/` with `npm create vite@latest . --
   --template react-ts` (D14 locks vite + TypeScript; **D15** — added at
   this same planning pass after a mid-planning `CONTEXT.md` gap was
   found and the user confirmed directly — locks React as the UI
   component framework; stitch itself exports plain HTML/Tailwind, D15's
   own citation confirms conversion to React is a separate, now-decided
   step). Add Tailwind per its own current-docs install path for a Vite
   project (`npm install tailwindcss @tailwindcss/vite`, wire the Vite
   plugin — Tailwind v4's Vite-plugin install path, no separate
   `postcss.config`/`tailwind.config.js` boilerplate needed the way v3
   required; confirm the exact current steps via `WebFetch` against
   Tailwind's own install docs at Execute time since a version-specific
   CLI flow is exactly the kind of thing that drifts and this plan should
   not freeze a possibly-stale exact command list here).
2. **API client layer** (`herdr-plugin/web/src/api/`): a typed wrapper
   generated/hand-written FROM the contract yaml's own operation list
   (never re-describing an endpoint's shape from memory, per the item's
   own "KHÔNG tự mô tả lại endpoint" scope line) — one function per
   contract operation, each returning the parsed `Envelope`'s `data`
   field typed per the contract's own `schemas` (`WorkItem`, `Session`,
   `Page`), or throwing/returning a typed error built from
   `ErrorEnvelope.category` (never branching on `message`, per the
   contract's own explicit rule, `fgos-gateway-api-v1.yaml`'s top-level
   description and `ErrorEnvelope.message`'s own field doc).
3. **Base URL configuration** (area spec R1): a single client-construction
   parameter (e.g. `createApiClient({ baseUrl, token })`), never a module-
   level constant — this is what "không hardcode một origin" (the item's
   own scope line) mechanically requires. No UI to set it yet (out of
   scope — no screens), so this item exposes the parameter; a later
   screen item wires a real input to it.
4. **Auth header**: every request the client layer issues attaches
   `Authorization: Bearer <token>` (D13) — the token is a constructor
   parameter alongside `baseUrl`, not read from any storage mechanism by
   this layer itself (where/how the token is persisted across page loads
   — localStorage per D13's own accepted tradeoff — is UI-level state
   management, out of this item's scope: no screens exist yet to own that
   state).
5. **Poll helper for `/state/digest`**: a small helper that calls
   `GET /state/digest`, compares the returned `data_hash` against the
   last seen value, and reports changed/unchanged — built around polling
   per D9 (no SSE/WebSocket exists, confirmed by `RESEARCH.md` round 1
   and independently by `docs/specs/herdr-web-dashboard.md`'s own Open
   Gaps section), never a subscribe/event-emitter model that implies a
   push mechanism that does not exist.
6. **Gateway-unreachable handling**: a distinguishable error type/state
   for a network failure (fetch throwing, not an HTTP error status) that
   every API client function surfaces distinctly from a normal
   `ErrorEnvelope` — satisfies the area spec's locked edge case ("says so
   plainly and offers to retry; never presents stale data as current",
   `docs/specs/herdr-web-dashboard.md:259-260`, quoted in full in
   `RESEARCH.md`). This item builds the distinguishable error type only;
   the actual retry UI/plainly-worded message is a screen concern
   (out of scope, no screens here) — the client layer's job is to make
   "unreachable" a state a screen CAN distinguish, not to render one.

**Alternatives rejected:**
- Generating the API client with an OpenAPI codegen tool (e.g.
  `openapi-typescript`) instead of hand-writing it — not rejected outright,
  left as an Execute-time implementation choice rather than locked here:
  either approach satisfies "don't re-describe the endpoint shape from
  memory" as long as the generated/hand-written types trace back to the
  contract yaml's own schemas. Noted as an Assumption below rather than a
  T1 (two live options, low stakes, cheap to switch — D5's "take the
  reversible one and carry on" applies, not a gate question).
- A subscribe/WebSocket-shaped client abstraction — rejected outright:
  contradicts D9's own locked mechanism (poll only, no push channel exists
  until CTR008 lands, itself explicitly out of scope of the whole
  gateway contract per its top-level description).

**Files touched (new, greenfield directory):**
`herdr-plugin/web/package.json`, `vite.config.ts`, `tsconfig.json`,
Tailwind config/entry CSS, `src/api/client.ts` (or equivalent module
split), `src/api/types.ts`, `src/api/poll.ts`. No `herdr-plugin/src/*.rs`
touched (out of this item's footprint — static-serving wiring is
`tsk-48w`, which depends on THIS item's bundle existing, not the other
way around).

**Order:** single item, no internal ordering dependency — this is the
first piece of the frontend half of the cluster and has no `deps` of its
own (`fgos graph --json` not consulted for ordering since there is
nothing to order against within this one item).

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| Vite/TypeScript/Tailwind scaffold builds cleanly | Low — proven directly at THIS validating pass, not assumed: ran the exact scaffold commands in a scratch dir (`npm create vite@latest . -- --template react-ts`, `npm install tailwindcss @tailwindcss/vite`, `npm install && npm run build`) — real output: `create-vite@9.1.2` scaffolds cleanly (react 19.2.8, vite 8.2.1, typescript 6.0.2), `tailwindcss`/`@tailwindcss/vite` both resolve at 4.3.3 with 0 vulnerabilities, and the default `npm run build` script (`tsc -b && vite build`) produces a real working `dist/` bundle in 148ms | `npm run build` + `npm run typecheck` both exit 0 (the item's own verify; `typecheck` script itself does not exist in vite's default `react-ts` template — `build`'s own `tsc -b` already type-checks, so Execute adds an explicit `typecheck` script, e.g. `tsc -b --noEmit` or equivalent, rather than inventing a check `build` doesn't already do) |
| API client types match the contract yaml | Medium — a hand-drift between the client's TypeScript types and the contract's schemas would silently produce a client that compiles but lies about response shape | Read the full relevant contract sections at this validating pass (`docs/contracts/fgos-gateway-api-v1.yaml:57-69,403-429,560-689`) — `Envelope`, `ErrorEnvelope`, `WorkItem`, `Session`, `/state/digest`'s own inline schema are all fully typed (`required`/`properties` on every schema, no `additionalProperties`-style ambiguity), so there is a complete, unambiguous source to type against; remaining risk is a hand-transcription slip, not an underspecified contract. A unit test (vitest, since D14 locks it alongside vite/TypeScript) per contract operation asserting the client parses a fixture response shaped exactly like the contract's own schema — not just that the function compiles — is the proof point that catches that slip |
| Gateway-unreachable is actually distinguishable from an `ErrorEnvelope` | Low-Medium — mechanically feasible per the platform's own contract, confirmed via official doc at this validating pass (MDN, `Window/fetch`, fetched 2026-08-15): "A `fetch()` promise only rejects when the request fails, for example, because of a badly-formed request URL or a network error. A `fetch()` promise does not reject if the server responds with HTTP status codes that indicate errors" — network failure (reject) and an HTTP-error response (resolved `Response` with `!ok`) are two structurally distinct code paths in `fetch` itself, so the client layer has a real seam to build the distinction on, not something it has to invent | A unit test mocking a network-level fetch rejection (not an HTTP error response) and asserting the client surfaces a distinct error kind/tag from an `ErrorEnvelope`-shaped 4xx/5xx response |
| Base URL is genuinely not hardcoded anywhere in the client module | Low — mechanical, easy to verify by inspection | A unit test constructing the client with two different `baseUrl` values and asserting outgoing request URLs differ accordingly (proves no module-level constant leaked in) |

Every Medium entry has a concrete proof point already named — no
medium/high entry is left without one, per `fgos-coding-validating`'s own
gate (`CONTEXT.md`/`RESEARCH.md` apply: undo cost for a wrong client-type
shape is low right now — nothing downstream consumes this client yet,
`tsk-5jr`/`tsk-4id` come after — but is exactly the kind of thing that
gets expensive once two consumer items depend on the shape, so it earns a
real proof point now rather than being pinned as an unproven assumption).

## Decide the split

One honest piece of work — no split. Scaffold + API client layer are one
coherent unit (the description itself bundles them, and D6 of the plan-
realignment explicitly separated this FROM the screen items specifically
so it could be built once as a shared foundation) — splitting scaffold
from API-client would create an artificial intermediate state (a vite
project with no typed way to call the one backend it exists to talk to)
that no consumer item could build against meaningfully.

## Verify

Item's existing verify (`cd herdr-plugin/web && npm ci && npm run build
&& npm run typecheck`) is real and matches D14's locked toolchain. Add
`npm run test` (vitest) as part of `npm run build`'s own script chain, or
as an explicit addition to this command, at Execute time — whichever
keeps `package.json`'s own script names consistent with the sibling
`tsk-48w`/`tsk-5jr`/`tsk-4id` frontend items that will extend this same
`package.json` later (checked at Execute against whatever convention
`herdr-gateway`'s own frontend, if any exists there, or a fresh vite
default uses — not pre-decided here to avoid guessing a convention this
item is the FIRST to establish).

## Outstanding questions

None
