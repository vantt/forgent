# Plan — takeWork role enum mismatch (tsk-67gr)

Mode: **tiny** (0 Mode-gate flags — a one-value enum edit in a docs-only
contract file, no existing test covers this dead enum value).

## Approach

**Chosen path:** narrow `takeWork`'s role enum
(`docs/contracts/fgos-gateway-api-v1.yaml:284`) from `[human, runner,
session]` to `[human, session]`, matching `bin/fgos.mjs`'s own real,
documented validation (`take --role must be "human" or "session"`).

**Why the contract changes, not the CLI** (`RESEARCH.md` round 1): `take`'s
own case comment cites a real decision id (S2-pull D1) for deliberately
excluding the runner role from the pull door — "an actor OTHER THAN the
runner claims exactly one item." That is not a gap to fill; the contract
enum appears to have been written by analogy to the unrelated `WriterRole`
field's own 4-value enum rather than checked against `take`'s real scope.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Contract structural validity after the enum edit | none — one value removed from one array | item's own verify: parses the yaml, asserts `openapi`/`paths`/`info` present |
| Whether `runner` is genuinely unsupported (not a wiring gap this fix should have filled instead) | none — already confirmed by direct read | `RESEARCH.md` round 1 cites the real, cited CLI validation and its own decision-id comment |

**Impact-analysis posture: inactive for this item** — a one-value YAML
enum edit carries no code blast radius; not queried.

## Files touched

- `docs/contracts/fgos-gateway-api-v1.yaml` — only file. No split.

## Split decision

**No split.** `fgos graph --json`'s `criticalPath`/`topUnblock` do not
include `tsk-67gr` or any gateway-audit sibling; taken out of strict
severity order this pass (Finding 8, low) ahead of the remaining Finding 7
(medium-low) purely for this session's own pacing — both are independent
leaves with no dependency ordering between them either way.

## Outstanding questions

None
