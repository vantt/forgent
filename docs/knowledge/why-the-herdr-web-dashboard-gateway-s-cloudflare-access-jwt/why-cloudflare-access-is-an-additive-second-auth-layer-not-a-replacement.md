---
authoritative_for: why the herdr web dashboard gateway's Cloudflare Access JWT support is an additive second credential layer on top of the existing Bearer token, never a replacement for it, and why every auth failure returns an identical blind 404
framework: diataxis
mode: explanation
---

# Why Cloudflare Access is an additive second auth layer, not a replacement

The gateway's layer 1 was already real before this item: a
one-machine-one-token `Authorization: Bearer` credential
(`herdr-plugin/src/gateway.rs`, from `tsk-7l9`), read from
`~/.fgos/config.json`'s `gateway.token`, compared constant-time, with a
missing/wrong token refused outright. An earlier locked decision (D13,
`docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md`) had
already settled that this stays Bearer — no cookie-session was ever added
alongside it.

This item is a rebuild of an earlier one (`tsk-18to`) that had been marked
`wontfix` as optional during the 2026-08-15 cluster run; the user later
asked for it to actually be built. Its old parent (`tsk-ldb`) had since
delivered, so this version stands as its own independent item.

## Additive, not either/or

Cloudflare Access JWT verification is accepted as an **alternative**
credential only when both are true: no valid Bearer token was presented,
**and** `team_domain`+`aud` are actually configured. The two credentials
are cumulative layers, not mutually exclusive options — matching the
original D8 design (`docs/history/herdr-web-dashboard/CONTEXT.md`, later
re-confirmed by the plan-realignment doc's own D8) rather than treating
Cloudflare Access as a swap-in replacement for Bearer.

## Ported from a working idiom, not designed from scratch

The implementation deliberately ports a verified-real idiom already
running at `/home/vantt/projects/herdr-gateway` (crate `herdr-go`,
`src/web/cf_access.rs`) rather than reinventing JWT verification: real
RS256 signature verification against the JWKS at
`{team_domain}/cdn-cgi/access/certs`, with JWKS caching, and validation of
`exp`/`iss`/`aud`/`nbf` — not merely checking that the header is present.

## Every auth failure looks identical from the outside

Every authentication failure — missing Bearer, invalid Bearer, missing
Cloudflare Access JWT, invalid Cloudflare Access JWT, any combination —
returns the same blind `404`, never a distinguishing error. This is a
deliberate anti-oracle stance: an attacker probing the gateway cannot tell
"item not found" apart from "you're not authenticated," and cannot tell
which of the two auth layers rejected them either.

## Why this matters now and didn't before

The environment context is locked (D7): all machines sit on the same
private network (LAN/Tailscale), plain HTTP, no TLS in v1. Cloudflare
Access only earns its cost once the gateway has to be exposed outside that
private network — which is exactly the threshold D13 already recorded as
the trigger for needing it. Inside the private network alone, Bearer-only
was already considered sufficient; this item exists for the case where
that boundary gets crossed.

## Source

`tsk-6arn`, standing independently after its former parent `tsk-ldb`
delivered. Verify: `cd herdr-plugin && cargo test --lib cf_access`.
