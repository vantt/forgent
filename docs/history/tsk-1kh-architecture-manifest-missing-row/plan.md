# Plan: add the missing manifest row

Item: `tsk-1kh`. Mode: **tiny** — one JSON line, already verified correct.
No design question, no split.

## Approach

Add `"src/report/enduser-index-generate.mjs": "infra"` to
`docs/architecture-manifest.json`'s `files` map, alongside its
`src/report/` siblings, per `CONTEXT.md` D1's layer derivation.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Layer choice | low — fully derived from the manifest's own existing rows and its own stated rule, not guessed | `CONTEXT.md` D1's four-constraint derivation |
| Fix is complete | low | `node --test test/architecture.test.mjs` → 3/3 pass; full `npm test` → 2743/2738/0 fail/5 skipped |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. Moot regardless: this is a JSON manifest data file, not a code
symbol; no blast-radius tool has anything to say about a manifest row
addition.

## Outstanding questions

None
