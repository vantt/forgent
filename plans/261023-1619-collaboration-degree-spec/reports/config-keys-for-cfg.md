# Config keys of the collaboration-degree spec, for lead CFG

Scope: stateful hand-off record, 2026-10-24 18:10. Source is `../spec-draft.md` (Part A, approved by the owner 2026-10-24 18:09, not implemented). Only what the spec states; section numbers are the spec's. Schema file named by the spec: `core/config-schema/runner.schema.yaml`; shipped values: `core/config-standard/runner.yaml` (no `default` keyword in the schema, 13.3).

## New and changed keys

| Full path | Type and shape | Required | Merge | Standard file ships a value | Spec |
|---|---|---|---|---|---|
| `runner.patterns.<name>` | object, `additionalProperties: false`; one entry per pattern name; map of entries | n/a | per entry, deep (`x-fgos-merge: deep`); no entry-level replace | yes: `solo`, `reviewed`, `panel`, `debate`, `code-change`, `consult`, `rfc`, `research-fan-out` | 5.1, 5.2, 5.4 |
| `runner.patterns.<name>.promise` | string, one sentence | required for a new (custom) name after merge; inherited for a shipped name and must not change (`pattern-invariant-weakened`) | scalar leaf, more specific layer wins | yes, per shipped entry | 5.1, 5.2 |
| `runner.patterns.<name>.loop` | enum `solo` / `reviewed` / `panel` / `debate` | required for a new name after merge; inherited for a shipped name and must not change | scalar leaf | yes | 5.1, 5.2 |
| `runner.patterns.<name>.defaults` | object of params the final loop reads; an unread key refuses `param-unknown` | optional | per key, deep | yes where 5.4 lists defaults | 5.1, 8.1 |
| `...defaults.maxRounds` | integer >= 1 (`0` refuses `param-invalid`) | optional | scalar leaf | `rfc`: 1; `code-change`: yes (value not stated) | 5.4, 8.1 |
| `...defaults.minCheckers` | array of strings, each one of `reviewer`, `red-team`, `tester` (`CHECKER_SEATS`) | optional | list is a leaf, replaced as one value | not stated | 5.1, 8.1 |
| `...defaults.seats` | array of `{ seat, role, persona?, tier? }` (the `checkDeclaredSeats` entry shape); reserved ids `verify`, `verifier` refused | optional | list is a leaf, replaced as one value | `research-fan-out`: three researcher seats; `panel`/`debate`: none | 5.1, 5.4, 11 item 3 |
| `...defaults.roleTasks` | object, key is a seat or kind (as `role-tasks.mjs` keys it), value is text | optional; declaration-only (a request carrying it refuses `param-not-requestable`) | per key | `rfc`, `code-change`: tasks stated in 5.4 as defaults (text not stated) | 5.1, 8.1 |
| `...defaults.rebuttal` | boolean; debate loop only | optional | scalar leaf | not stated | 5.1, 8.1 |
| `runner.patterns.<name>.invariants` | object keyed by param; each value is exactly one form | optional | per key, deep; a layer may add keys and extend `atLeast`, never shrink or change | yes: see next rows | 5.1, 5.2, 5.4 |
| `...invariants.<param>.atLeast` | array (list params, today `minCheckers`) | one of `atLeast` or `fixed` per param | list; a layer tightens by listing a superset | `code-change`, `rfc`: `minCheckers.atLeast: [reviewer, red-team]` | 5.1, 5.4 |
| `...invariants.<param>.fixed` | any JSON value (scalars and structures: `seats`, `roleTasks`, `rebuttal`) | one of `atLeast` or `fixed` per param | a layer may add a `fixed` on a param with none; must not change or remove one | `consult`: `seats.fixed: [{ seat: advisor, role: producer }]` | 5.1, 5.4 |
| `runner.loops.<loop>` | object, loop tuning; `<loop>` is one of the four loops; replaces the old `runner.patterns.reviewed` tuning object | optional | deep, project > global > shipped | yes: `runner.loops.reviewed` carries today's `maxRounds` and `checkersByRigor` (values not restated by the spec) | 8.4, 13.1 |
| `runner.loops.<loop>.maxRounds` | integer >= 1 (a default, not a ceiling; `maxRoundsCeiling` does not exist) | optional | scalar leaf | yes (moved from old `patterns.reviewed.maxRounds`) | 8.2, 8.4 |
| `runner.loops.reviewed.checkersByRigor` | unchanged shape, moved path | optional | as today | yes (moved) | 8.3, 13.1 |
| `runner.loops.<loop>.bounds.<param>` | object `{ min?, max? }`, numeric params only; Part A ships `maxRounds` as the only bounded param | optional | deep per param | no (no shipped value) | 8.4, 13.3 |
| `runner.loops.<loop>.bounds.<param>.min` / `.max` | integer for an integer param (a non-integer bound on an integer param is a config error) | each optional | scalar leaf | no | 8.4 |
| `runner.patterns.seatBinding.schema` | marker, bumped to `2`; new release reads 1 and 2; reserved name, not a pattern name | marker is written by `fgos setup` conversion; absence is not refused | as today | yes after conversion (standard file converted in the same change) | 13.1, 13.2 item 1, 13.2 item 3 |
| `runner.capabilities.<cap>.minCheckers` | array of `CHECKER_SEATS` names; `[]` allowed; read by exact key, then `<prefix>:*`, first defined wins | optional | replaces another config layer's value for that capability (project > global); the result is still unioned with `checkersByRigor` and pattern invariants | no: the `code` and `code:*` default (`[red-team]`) is a resolver default, not config | 8.3, 12 |

Section 12 states this key already exists and that no shipped or project config carries it; the behaviour changes (prefix lookup; an explicit list omitting `red-team` no longer gets it added) are the change, not a new key.

## Retired keys (a config file holding one refuses `config-key-retired`, naming the file and the replacement)

| Retired | Replacement | Spec |
|---|---|---|
| `runner.patterns.reviewed.maxRounds`, `runner.patterns.reviewed.checkersByRigor` (an object at `runner.patterns.reviewed` holding either, with no `loop`/`defaults`; holding both shapes is a config error) | `runner.loops.reviewed.*` | 5.3, 13.1, 13.2 |
| `runner.patterns.defaultRule` (dead key, no runtime consumer; reserved name) | none (dropped) | 5.3, 13.1 |
| `research-fan-out-gated` (pattern name; its `gated` flag was never read) | `research-fan-out`; a request naming it refuses `unknown-pattern` | 5.4, 8.5 |
| any other old loop or pattern name | the new catalog or loop name (spec gives no further list) | 13.2 item 2 |

Behaviour of the refusal: applies to project and global files only; stored schema-1 case and unit records are read through the record-read path and are not refused. Marker schema 1 is still accepted. `fgos setup` converts the project file with a backup and writes a comment on each key it writes; it does not rewrite the global file (fixed per machine by a command announced at landing). The loader has no silent drop or translation, no alias.

## Load-time config validation (errors, not run refusals; doctor reports them)

- `bounds`: `min > max`; non-integer bound on an integer param; a bound on a param the loop does not read.
- Catalog: unknown loop; a `defaults` or `invariants` key the final `loop` does not read (`param-unknown`); a shipped name's `loop` or `promise` changed, or an invariant weakened (`pattern-invariant-weakened`); reserved names `seatBinding`, `defaultRule`; the retired shape; seat ids and cardinality; `roleTasks` targets. One semantic resolver is reused by run, dry-bind, doctor, plan lint and workflow validation; `src/runner/dispatch/config.mjs` replaces `ALLOWED_PATTERNS_KEYS`.
- Doctor (check id `runner-patterns-config` kept, no new check name) warns on a default beyond a bound, on global catalog or `runner.loops` entries while an older release exists, and informs on a capability `minCheckers` omitting `red-team`.

## Open for CFG

1. How `config-merge` represents an optional key with no default (bounds): the spec marks it "to confirm" (13.3).
2. Whether any layer can replace a whole `runner.patterns.<name>` entry: the spec says no (5.2); CFG should confirm the schema walker's `x-fgos-merge: deep` on a map with `additionalProperties` gives per-key merge of `defaults`/`invariants` as the spec needs (the spec cites `packages/config/rust/src/schema.rs` ~298-351).
3. The JSON type of `invariants.<param>`: a `oneOf` of `atLeast` or `fixed` (exactly one form) is implied by 5.1; the spec does not say whether `fixed` takes an unconstrained value, so the schema may need `{}`.
4. The standard-file values for `maxRounds`, `roleTasks` text and the plain defaults of `solo`, `reviewed`, `panel`, `debate` are not given numerically in the spec (5.4 says "plain defaults"); CFG must take them from today's `PRESETS` and `runner.patterns.reviewed`.
5. The `seatBinding` marker keeps the old release fence: the older strict `runner.patterns` allowlist (`config.mjs:1488-1495`) must keep refusing a converted file, so the schema must not make `runner.patterns` entries look valid to an older release; this is an upgrade property, not a schema property, and the spec leaves its test to the implementation.
6. Section 13.3 says the `runner.patterns` entry has `additionalProperties: false`, while the marker `seatBinding` sits in the same map; how the schema allows the marker object beside entries is not stated.
