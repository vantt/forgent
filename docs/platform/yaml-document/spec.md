# YAML Document Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for reading, editing and merging YAML text while keeping every byte a caller did not change, comments included
Design status: Signed by the owner on 2026-10-22 as a whole; amendments go through "Lịch sử quyết định"
Implementation status: Not started
Canonical: Yes
Owner: YAML Document component (proposed)
Source (planned): packages/yaml-doc/rust (crate fgos-yaml-doc)
Contracts (planned): packages/yaml-doc/contracts/
Last reviewed: 2026-10-22
Related:
- docs/platform/config/spec.md (the one component above this one that applies a schema)
- docs/platform/component-boundary.md
- docs/specs/distribution.md, "Lịch sử quyết định", RUL101 (vendored js-yaml, superseded by this spec when it lands)
- plans/reports/research-261021-2221-config-access-inventory.md
- plans/reports/spike-261022-0017-yaml-config-gate-evidence.md
- architecture panel run wf-run-1792598883803-72bd2251 (final packet: unit-run-1792600163126-d1239fca/producer round 2)
```

## 1. Purpose

YAML Document answers one question for any caller holding YAML text: what does this text mean, and what are the exact bytes after this one change. It is a foundation leaf. It knows YAML, comments, positions and a merge primitive. It does not know what a config key means, which file is project or global, what a default is, or who may write. That is the Config component's job, one layer up (`docs/platform/config/spec.md`).

The owner set the shape on 2026-10-21: "chúng ta thực chất cần tool đọc/ghi/merge yaml. và phía trên tool yaml là tool config sẽ đi kèm schema để áp xuống". This component is the first of those two tools.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| Parsing YAML into a lossless document and a semantic value (section 3) | What a key means, its type, default or scope (Config, descriptors) |
| The two parse profiles and their limits (section 4) | Which file is read, precedence between files, write permission (Config) |
| Edits that keep every untouched byte (section 5) | Locks, concurrency control, durable writes (Holder-lock, Durable File, called by Config) |
| Comment blocks as positioned text, and their injection guard (section 6) | The `@fgos:` comment grammar and when a reason is required (Config) |
| The merge primitive over semantic values, with per-path rules supplied by the caller (section 7) | Choosing the merge rules (Config, from descriptors) |
| Golden fixtures that pin the meaning of both profiles (section 9) | Frontmatter of reports (`src/report/frontmatter.mjs`) and the portable `distill.mjs` reader, kept on their own paths as RUL101 already kept them |

There is one implementation: the Rust crate `fgos-yaml-doc`. Rust callers link it. Node reaches it only through the native door (section 10). No JavaScript YAML parser remains on the main parse path.

## 3. Document model

A parse returns a **document** with three views of the same input:

- the **source bytes**, unchanged;
- the **semantic value** (mapping, sequence, string, integer, float, boolean, null), the only view a caller should base decisions on;
- **positions**: for every node, the byte span of its key and value, and its line and column.

A **path** is a list of segments, each a mapping key (any string, including ones with `.`, `:` or spaces) or a sequence index. Dotted strings are not paths: a key such as `code:implement` or `a.b` must never need escaping to be addressed. Where a path must be written as one string (a CLI argument), the text form joins keys with `.` and writes a key containing `.`, `[`, `]` or a quote bracket-quoted as `["a.b"]`, with `\` escaping the next character; this text form is parsed back into segments before any lookup.

**Key identity.** Two keys are the same key when their resolved scalar values are equal, whatever their quoting or escapes: `a`, `"a"`, `'a'` and `"\x61"` are one key, so "duplicate key" is judged on resolved values, never on source text.

The document's **byte revision** is the sha256 of its source bytes. Config uses it for compare-and-swap; this component only computes it.

## 4. Profiles

A caller picks one profile per parse. Both are enforced by this component on the parsed tree, never left to an upstream parser setting: the spike showed both viable parsers accept duplicate keys (last wins) and tags by default (spike report, G1).

| Rule | `strict-config` | `tool` |
|---|---|---|
| Used for | config files | workflows, personas, units files, domain manifests, every other YAML fgOS reads today |
| Duplicate key in one mapping | refused | refused |
| Tags | every explicit tag refused | a tag outside the core schema refused, `!!binary` included (today's contract) |
| `yes`, `no`, `on`, `off` | strings; only `true` and `false` are booleans | same (today's contract) |
| Anchors and aliases | refused | allowed, with the expansion bounds below |
| `<<` | refused | an ordinary key, never a merge (today's contract) |
| More than one document | refused | refused |
| Zero documents | value is null | value is null |
| Complex (non-scalar) keys | refused | refused (new rule: not pinned by today's tests; added as a fixture) |
| Keys that resolve to a non-string (`1`, `true`, `null`) | refused (after conversion they would collide with `"1"`, `"true"`) | stringified, as today |
| Keys `__proto__`, `constructor`, `prototype` at any depth | refused; no config key needs them | allowed; the Node facade makes them own properties (section 10) |
| Bidi controls (U+202A–U+202E, U+2066–U+2069) and zero-width characters (U+200B–U+200D, U+FEFF inside text) | refused in keys and values, so a diff cannot hide what a command value runs | refused in keys |
| Integers outside ±(2^53 − 1), `.nan`, `.inf`, `-.inf`, `-0` | refused; Rust and Node would read different values, and `NaN` passes range checks | allowed, converted as today |
| Timestamps | strings | strings (today's contract) |
| Limits | size, depth and node count bounds named in the contract file | same, plus alias expansion bounded at 100 aliases and the expanded-node bound of `test/util/yaml.test.mjs` |

The `tool` profile reproduces today's js-yaml door contract exactly as `test/util/yaml.test.mjs` pins it; that test's cases move into the golden fixtures and become the owning proof in Rust (section 9). JSON text is valid input to both profiles, so a JSON config file parses as `strict-config` before any file is converted.

A refusal names the rule, the file name the caller passed, and the line and column.

## 5. Edits

Operations on a parsed document, each addressed by a path:

| Operation | Effect |
|---|---|
| `set(path, value)` | replace a scalar or a subtree; create missing parents as block mappings |
| `insert(mappingPath, key, value, position)` | add an entry, after a named sibling or at the end |
| `remove(path)` | delete an entry or a sequence item |
| `setCommentBlock(path, lines)` | replace the contiguous comment block directly above the node with `lines` |
| `setInlineComment(path, text)` | replace the trailing comment on the node's line |
| `commentsAt(path)` | read the block above and the inline comment, as text without the `#` |
| `toBytes()` | the document after every edit |

Guarantees, each tested by golden fixtures:

1. **Byte fidelity.** Bytes outside the spans an edit touches are identical, including comments, blank lines, indentation, quoting style, block scalars and inline comments. Parsing then printing with no edit returns the input unchanged. The spike met this on the real config (937 lines as YAML) with both candidate parsers (G1).
2. **Re-parse check.** After every edit the result is parsed again under the same profile; an edit whose result means anything other than the intended change is refused, and the document is left as it was.
3. **New content follows the file.** Inserted entries use the indentation unit and quoting style the document already uses.
4. **Removal keeps notes visible.** Removing a node whose comment block or inline comment would disappear with it is refused with `comment-would-be-lost` unless the caller passes an explicit acknowledgement. This component does not decide whether the note matters; Config passes the acknowledgement only when its own rule allows it.

## 6. Comments

This component treats a comment as positioned text and knows no grammar inside it. The `# @fgos:doc` and `# @fgos:why` lines are Config's grammar (Config spec section 7); here they are ordinary comment lines.

Injection guard, applied to every comment this component writes:

- each line is written as `# ` plus the text; a line break in the text starts a new comment line and never ends the comment token, so text can never become a key or value (the spike's `noyalib` refused `"x\nevil: 1"` in an inline comment; this component makes that a rule for every adapter);
- control characters other than tab are removed; carriage return, U+0085, U+2028 and U+2029 are treated as line breaks, because some editors and YAML tools render them as one;
- bidi controls (U+202A–U+202E, U+2066–U+2069) and zero-width characters (U+200B–U+200D, U+FEFF) in comment text are refused, the same rule values get in `strict-config` (section 4), so a diff cannot hide what a note says; refused rather than stripped, so the text the caller supplied and the text written stay the same words;
- whether a caller's text may span lines at all, and which line prefixes it may not start with, is the caller's rule (Config allows neither for reasons, Config spec section 7);
- an inline comment is one line; text with a line break is refused there.

## 7. Merge primitive

`merge(layers, rules)` combines semantic values, highest priority first, and returns the merged value plus, for every leaf, which layer it came from. It does not read files and does not choose priorities.

- The caller supplies the rule per path: `deep` (mappings merge key by key), `replace` (the highest layer that has the path wins whole), or `leaf`. Without a rule, mappings are `deep` and sequences are `leaf`.
- **Absent is not null.** A path missing from a layer falls through to the next layer; a path present with null wins as null.
- Type mismatch between layers at a `deep` path is reported with both layers named, never repaired.

Config uses this primitive with rules taken from its descriptors; the primitive itself has no notion of project, global or default.

## 8. Limits and safety

- Bounds, the same for Node and Rust callers and pinned by fixtures:

| Bound | `strict-config` | `tool` |
|---|---|---|
| input bytes | 1 MiB (the real project config is 40 KB) | 8 MiB |
| nesting depth | 32 | 64 |
| nodes, after alias expansion | 100 000 | 100 000 (today's value budget) |
| bytes of one scalar | 64 KiB | 1 MiB |
| bytes after alias expansion | n/a (no aliases) | 16 MiB |
| bytes of one key | 1 KiB | 1 KiB |

- **Size and depth are checked before the parser recurses.** A pre-scan rejects input over the byte bound and counts flow-bracket and indentation depth before the tree is built; a bound checked only on the parsed tree cannot stop a stack overflow inside the parser, and a stack overflow cannot be caught. Fixtures feed 200 000 nested flow brackets and deep block indentation and expect a named refusal.
- Alias expansion is ours when the parser does not expand (the spike's `yaml-rt` does not), and it counts both nodes and bytes, so one large anchored scalar referenced many times cannot multiply memory.
- Errors name rule, path, file, line and column; they never contain a scalar value or a snippet of the source, so a secret on a malformed line never reaches a log.
- Our crate is `#![forbid(unsafe_code)]`. The parser it builds on is chosen by the replacement rule in section 9; the spike's two viable candidates differ here (`noyalib` forbids unsafe, `yaml-rt` core has one `get_unchecked`), and a candidate's own `unsafe` sites are listed in the upgrade record.
- `serde_yaml` and `unsafe-libyaml` are not used. When this crate lands, the three crates that use `serde_yaml` today (`fgos-gateway`, `host-runtime`, `observe`) move to it in the same change, and the `RUSTSEC-2024-0449` ignore in `.github/cargo-deny.toml` is removed.

## 9. Parser choice and replacement rule

The component's contract is its port and its golden fixtures, not the parser crate underneath. Evidence from the spike (G1, 2026-10-22, real config as YAML):

| Candidate | Lossless round trip | Comment write | Notes |
|---|---|---|---|
| `yaml-rt` 0.3.3 | byte-identical on every check | entry insert with comment exists, not exercised | 0.22 ms parse and print of 937 lines; created 2026-07, low adoption; one `unsafe` in core |
| `noyalib` 0.0.58 | byte-identical on every check | comment block replace and newline refusal checked | 0.88 ms; `#![forbid(unsafe_code)]`; created 2026-05 with fast release churn; shares an author with the archived `serde_yml` |
| `yaml-edit` 0.3.2 | refused files with leading comments through its document entry | | depends on `rowan` (56 `unsafe` sites); rejected |

The implementation picks one candidate. Either way:

- the version is pinned exactly in `Cargo.toml`, and `Cargo.lock` records its checksum;
- the golden fixtures under `packages/yaml-doc/contracts/` decide correctness; a parser upgrade or swap lands only when every fixture passes;
- the upgrade record lists the candidate's `unsafe` sites, its dependency tree and the fixture result, the same discipline as the vendored js-yaml upgrade procedure it replaces;
- passing fixtures is not a security review. Adoption and every upgrade also need: a read source diff of the crate and of every new transitive crate, whether any of them has a `build.rs` or a proc-macro, a clean `cargo deny` run for advisories and sources, and the owner's sign-off recorded in the upgrade record. Download counts are not a trust signal (the spike found `noyalib`'s inflated by the `serde_yml` shim);
- fuzz targets for parse, edit-then-re-parse and merge (`cargo fuzz`) run as part of every upgrade, starting from the golden fixtures as seeds;
- the parser crate is vendored (`cargo vendor`), so the bytes that were read are the bytes that are built.

## 10. Node door

Node reaches the component through the one combined native addon, as it already reaches Git, Event Store, Process, Durable File and Canonical JSON (`src/native/door.mjs`). Owner decision 2026-10-22: native door, not a JSON projection and not a spawned process.

- The addon gains a `yaml` namespace; the `addon.versions()` marker check in `door.mjs` names it in the same change.
- `src/util/yaml.mjs` keeps its name and its `parseYaml(text, { filename })` signature for the `tool` profile, and becomes a thin call into the addon. Its 12 importers do not change.
- **Objects the addon hands to JavaScript are built with define semantics**, for both the `yaml` and the `config` namespace. N-API's plain property set behaves like `obj[key] = value`, which turns a `__proto__` key into a prototype change; the addon instead defines own properties (or builds prototype-free objects), so a `__proto__` or `constructor` key is always an own key, as today's test pins. One Node wiring proof per namespace extends the existing `__proto__` test.
- **A panic never crosses the boundary.** Every addon entry point in both namespaces catches a Rust panic and returns a named refusal (`yaml-internal-error`), because a panic in a synchronous N-API call aborts the Node process, and the runner, the run supervisor and the gateway all parse YAML in process. A fixture feeds adversarial input through the Node door and checks the process survives.
- The vendored `src/util/third-party/js-yaml.mjs` and its hash test are deleted in the same change. RUL101 ("every YAML parse goes through one vendored js-yaml behind `src/util/yaml.mjs`") is superseded by a new decision ID recorded in `docs/specs/distribution.md`'s "Lịch sử quyết định": the one-door rule stays, the implementation behind the door becomes Rust. `src/report/frontmatter.mjs` and `distill.mjs` stay on their own paths, as RUL101 kept them.
- Measured cost (spike, G1): one N-API call about 12 µs, against 2.8 ms to spawn `/bin/true` and 40 ms for `fgos version` through the host. Loading the addon costs 0.5 ms plus an 8.4 ms hash check once per process, already paid by every Node process that touches Git.
- When the addon cannot load (not shipped on the channel, target mismatch), the call fails with the door's named error and its next step. There is no JavaScript fallback parser.
- The Windows load of the addon is unproven (gate G4). Until a Windows run passes, a Windows release is not considered to support YAML reads.

## 11. Failure cases

| Case | Result |
|---|---|
| Text breaks a profile rule | refusal naming the rule, file, line and column; no partial value |
| Edit whose re-parse differs from intent | refusal; document unchanged |
| Removal that would drop a comment, without acknowledgement | `comment-would-be-lost` |
| Comment text with a line break in an inline comment | refusal |
| Input over a limit | refusal naming the limit |
| Addon missing on the channel | the door's named error; no fallback |

## 12. Migration

1. Crate, contract file and golden fixtures, including every case of `test/util/yaml.test.mjs`.
2. Rust consumers of `serde_yaml` move to the crate; the advisory ignore is removed.
3. Addon namespace and the `src/util/yaml.mjs` re-point; js-yaml and its hash test deleted; RUL101 supersession recorded; the Node test becomes one wiring proof.
4. Architecture test: no import of a YAML library anywhere in `src`, `bin`, `scripts` or `test` other than the door.

## 13. Known limits

- An editor outside fgOS can change a file between read and write; this component cannot see that. Config's compare-and-swap catches it at write time.
- Byte fidelity covers the spans an edit does not touch. A `set` on a block scalar or a flow collection rewrites that node in the document's prevailing style.
- Windows: see section 10.

## 14. The six questions (platform L5)

1. **What to read first?** This spec, then `docs/platform/config/spec.md`.
2. **What kind of work?** A new foundation leaf; it replaces the vendored js-yaml door.
3. **What contract does it touch?** The `parseYaml` facade signature (kept), the addon ABI marker (extended), RUL101 (superseded).
4. **How much risk?** Every workflow, persona and config read passes through it; the golden fixtures and the re-parse check carry that risk.
5. **What proof means done?** Golden fixtures pass in Rust; one Node wiring proof; `npm test` and `cargo test --workspace` green; the architecture test forbids other YAML imports.
6. **What learning is left?** The parser choice and its evidence in the upgrade record; the RUL101 supersession in `distribution.md`.

## 15. Lịch sử quyết định

- **2026-10-21: two tools, YAML below Config.** Owner direction. The inventory (`plans/reports/research-261021-2221-config-access-inventory.md`) found config read and written in about 30 places with three merge styles; the panel (wf-run-1792598883803-72bd2251) agreed on two Rust authorities and no JavaScript fallback parser.
- **2026-10-22: Node door is the native addon.** Owner chose the native door over a JSON projection plus spawn. Measured afterwards: an N-API call costs about 12 µs, a spawn 3 to 40 ms.
- **2026-10-22: security review folded in** (`plans/reports/security-review-261022-0021-yaml-config-specs.md`): key identity on resolved values, string-only keys and no prototype keys in `strict-config`, bidi and zero-width characters refused, numeric edge values refused, named bounds checked before the parser recurses, expanded-bytes bound, no value in errors, define-semantics objects and panic capture at the addon boundary, and a supply-chain rule that adds source review, fuzzing and vendoring to the fixture gate.
- **2026-10-22: writer shape A (surgical edit).** The spike showed byte-identical round trips with two candidates, so a deterministic re-render is not needed as a floor. The panel's rule stands: no B-then-A two-step plan.
- **2026-10-22: signed.** The owner reviewed and signed this spec as a whole, together with the Config spec.
- **2026-10-22: owner chose I2.** Comment text the component writes gets the same bidi and zero-width rule as values (section 6).
