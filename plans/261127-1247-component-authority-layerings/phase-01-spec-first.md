# Phase 1: Spec first

The component-authority spec states the layering model before any code changes (hand-off
constraint: "spec docs/platform/component-authority/spec.md cập nhật trước code").

## Inputs

- `plans/discussions/ds-zfqskcns7j-component-authority-scope-and-levels/DISCUSSION.md` §4
  (CAS-D1 to CAS-D13) and §6 `#design`.
- `docs/platform/component-authority/spec.md` (§2.1 "Layers, rules, domains, and tiers", §2.2,
  §2.5, §6 Settled facts, §7 Lịch sử quyết định).
- `docs/platform/governance.md#decision-scope-to-holder-table` (where the narrative goes).

## Files this phase may write

- `docs/platform/component-authority/spec.md`

## Steps

1. Rewrite §2.1 as "Layerings": the word "layer" never stands alone; a layering is one cut of
   the whole system with ordered values and its own rules; the CAS-D8 fields; `source` is
   `declared` or `fromPaths` (CAS-D12); the three rule kinds and what each checks
   (`order-downward`: a file depends only on its own value or a later one; `isolation`: values
   at the same level never touch, which is today's `domain-siloing`; `port-wiring`: CAS-D4 rules
   3 to 5). Add the four-layering table of DISCUSSION §6 and the `stack` values of CAS-D7 with
   the T7/T8 swap of CAS-D13 (`T7-domain`, `T8-work`). State the named-debt list on a layering
   row (plan.md, Risks) and that `domains` stays as the list of domain names `domain-scope` reads.
2. In §2.2 state CAS-D1 (component = ownership unit, module = packaging unit, each module
   belongs to exactly one component, checked through `paths`) and CAS-D9 (layering values on
   the component row under the layering id; `exceptions` carries path departures for any
   layering).
3. In §2.5 add the optional `port` field of a contract row: `kind` (`driving` or `driven`) and
   `implementers` (component ids); the provider is the side that declares the port (CAS-D4).
4. Add one entry to §7 "Lịch sử quyết định" summarising CAS-D1 to CAS-D13 with a link to the
   discussion, and move the settled facts into §6.

## Verify

`grep -n "tierNames\|tierExceptions" docs/platform/component-authority/spec.md` prints only
decision-history lines, and `npm run fgos:dev -- decision-index --check` passes. Pass: the spec
reads cold with no reference to `layer:` or `tier:` as live fields.

## Rollback

`git revert` the phase commit; no code reads the spec.
