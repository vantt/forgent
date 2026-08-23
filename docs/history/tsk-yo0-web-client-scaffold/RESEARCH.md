# RESEARCH — tsk-yo0: web client scaffold (vite + TS + Tailwind) + API client layer

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** what does the gateway contract actually look like (base URL,
envelope, auth, `/state/digest` shape)? What is "cụm G3" (referenced in
the item's own description as the locked CSS-framework/tooling decision)?
What does the area spec's "gateway unreachable" edge case require in
concrete terms? Does `herdr-plugin/web/` already exist (partial prior
scaffold to build on, or a clean start)?

**Checked — `docs/contracts/fgos-gateway-api-v1.yaml`:**

- `servers` (line 57-62): base URL `http://localhost:{port}/v1`, `port`
  variable defaults to `"4170"` — confirms the description's own
  requirement (area spec R1) that the client must not hardcode one origin;
  the contract itself models the port as a variable.
- `security` (line 68-69): every operation requires `bearerAuth` by
  default; only `/contract` (line 95, `security: []`) is exempt.
- `securitySchemes.bearerAuth` (line 567-573): `type: http, scheme:
  bearer` — a plain `Authorization: Bearer <token>` header, one shared
  per-machine token (D4), matching D13's locked choice (no cookie).
- `components.schemas.Envelope` (line 612-620): every successful response
  reuses the CLI's own `fgos.v1` envelope verbatim: `{contract,
  generated_at, data_hash, data}`.
- `components.schemas.ErrorEnvelope` (line 663-689): `{category
  (required, closed enum), message?, exitCode?}` — client must branch on
  `category`, never on `message` text (the contract's own top-level
  description repeats this rule explicitly, citing `docs/io-contract.md`).
- `/state/digest` (line 403-429): `GET`, response `{contract,
  generated_at, data_hash}` — no `data` field. This is the cheap-poll
  route (D9): a client holds the last seen `data_hash` and only re-fetches
  a full read endpoint when it changes. No SSE/WebSocket exists anywhere
  in this contract (confirmed already by `docs/specs/herdr-web-dashboard.md`'s
  own Open Gaps section, quoted below) — the API client layer must be
  built around polling, never a subscribe model.
- `components.schemas.WorkItem` (line 630-652): the subset of work-item
  fields the gateway actually publishes — `id, title, description, kind,
  status, stage, tier, risk, domain, parent, deps, footprint, verify`.

**Checked — "cụm G3" (`docs/history/herdr-web-dashboard/plan.md:847`,
product-owner-decided at that plan's own `validateApprove` gate,
2026-08-15):**

> G3 | **CSS framework cho web client** | **Tailwind, và dùng stitch để
> sinh layout.** Stitch tooling sinh bố cục ban đầu rồi export
> Tailwind/HTML làm điểm xuất phát; Tailwind là lớp style thật của client.
> Đổi lại, chấp nhận một dependency frontend mới (Tailwind) cộng một
> tooling sinh-layout trong quy trình, và chấp nhận output của stitch phải
> được dọn lại chứ không dùng thô

(`plan.md:849-852`): this locks Tailwind as the client's real style layer
and the `stitch` skill as the way to generate an initial layout starting
point, which then gets cleaned up rather than used raw. It fills a
silence D14 (of the original cluster's own `CONTEXT.md`) deliberately left
open (D14 locked vite+TypeScript, said nothing about CSS) — not a reopen
of D14. Scope-wise this item builds no SCREENS (out of scope per its own
description — `S02` is `tsk-5jr`, `S03/S04` are `tsk-4id`), so G3 informs
the framework/tooling choice for THIS item (Tailwind installed + configured,
`stitch` available as the pattern later screens will follow) without
requiring this item to produce any actual page layout.

**Checked — `docs/specs/herdr-web-dashboard.md` Edge Cases Settled (line
259-260):**

> **The gateway is unreachable.** The client says so plainly and offers to
> retry; it never presents stale data as current.

Concrete requirement for the API client layer this item builds: a network
failure must be a distinguishable state the layer surfaces (not silently
retried forever, not silently swallowed into an empty/zero result that
looks like real data).

**Checked — does `herdr-plugin/web/` already exist?**

`ls herdr-plugin/web/` → does not exist. `find herdr-plugin -maxdepth 1
-name build.rs` → no `build.rs` either (that lands with tsk-48w, which
this item's own `footprint` — `["herdr-plugin/web"]` — correctly excludes).
Clean start, no partial prior scaffold to reconcile with.

**Open:** none — every point the description raised (contract shape, G3,
gateway-unreachable handling, starting state of `herdr-plugin/web/`) is
directly confirmed by repo evidence.

**Verdict:** `clear`. Verify: existing item verify (`cd herdr-plugin/web
&& npm ci && npm run build && npm run typecheck`) is already real and
runnable — no better candidate surfaced (it necessarily depends on
`package.json` this item itself creates, so it cannot be run yet, but the
command shape itself is correct and matches D14's locked
vite+TypeScript toolchain).
