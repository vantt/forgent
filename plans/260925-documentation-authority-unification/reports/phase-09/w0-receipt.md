# W0 merge accounting receipt

Authority: [W0 brief](w0-merge-accounting-brief.md), L12-137; records only. Input `8a9385eca0759da0b2022b6202518f71667c1430`. This completes this accounting turn, not independent acceptance or any PRE-FLIP gate.

## Results

- [Merge accounting](w0-merge-accounting.json): `022c0ee67447d40ff72bdee307e1988aae2f36a0`, first parent `f17483555dd19dd0e558ee892e1f7cf46173467a`, actual main parent `628e47d864a9dbfe4711bfd6c674ad0e3f4bdfc3`, base `a0db9ca8e241870cbd88c915cc34075caa7ec77b`. **118 commits / 228 changed paths / seven docs** (four platform candidates, two legacy specs, generated backlog). Exact lists, disjoint path families, per-doc commits/blob IDs/digests and both-parent diffs are retained.
- The brief names `28127bc15`; the actual second parent includes two later **board-only** commits. Both are explicitly accounted, not omitted to fit the earlier name.
- Conflict witnesses verify the exact branch Unreleased prefix followed by main's Unreleased text; Holder-lock retains the branch D8 `documentation-cutover` history line and main's Config history line, with main's rank-80 table; schema owner enum is exactly the parent-set union, including `documentation` and `config`. Existing changelog duplicates were preserved, not repaired in this records turn.
- [Step 0 binding check](w0-binding-check.json): both unchanged Phase 6 extractors agree at first parent, actual main parent, merge and input HEAD for all seven docs. **276 direct / zero grouped bindings**, with complete passages, exact ancestry and both immediate neighbours; **one content rebind / zero remaining target drift**. Repeated passages are distinguished by ancestry and neighbours, never an ordinal.
- [Rebinding](w0-merge-rebindings.json): `claim_af89c4e6063eb43c4e690c3fdd430677`, `ledger/decisions/s3-host-invocation-boundary-gaps.json`, `registryGaps[2]`. The complete Current High-Level Components table changes only Config's implementation-status cell. Only `targetUnitDigest` and its pending `reviewNote` changed. Source identity, rationale, author, ancestry and pending review status remain unchanged; **no approval carried**. New digest `17b94e60c0e07542ce67f6b9df5b7d705b1ed2207f3c706df1f407b8680138e9`; binding hash `a44cca1dbb4f0ad66a5d0a92d5ae9dc752689b310f9243102e0170627aafd31e` uses the existing G0 sorted-key compact-JSON-plus-LF rule, explicitly recorded with its input.
- The incoming obligation paragraph unions all four changed platform paths: component-boundary, config, holder-lock and identity. Config has no ledger candidate binding and already had a signed spec; switchboard/retained-reading-map/inventory routing remains owed, without promotion or a caller-wiring claim. Identity section 7a body is byte-identical to the first parent, and its writer-scope header remains intact.
- [Deferred rebinds](w0-deferred-rebinds.json): **11 physical Step 3 / four canonical Step 4 / seven Step 5 records**, individually owned by `source-context-and-post-pin-recomposition` (Documentation source-binding reviewer / Lead). Traversed 1,100 physical Step 3 revisions, 275 Step 4 records and 1,481 Step 5 records including external parks, without reading their external sources. No pinned record or review was changed. [Prior-method replay](w0-prior-overlap-replay.json) reproduces L12-130's exact **10/9/125** locator sets, zero missing/extra.
- Ratchet refresh: only the existing distribution and reading-map exception digests changed; all original exception rationales and every other exception row remain byte-equivalent. Existing `mainMergeAccounting` format retained with this import's provenance; previous accounting is preserved by exact input pin and object hash. No baseline, checker, exception count or policy change.

## Commands and exits

All raw logs and hashes are linked in [verification](w0-verification.json). `E` below means `env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work/w0`.

| Command | Exit | Result |
| --- | ---: | --- |
| `git log --format='%H %s' 022c0ee67^1..022c0ee67^2`; `git diff --name-only 022c0ee67^1 022c0ee67`; parent/base/blob/diff reads | 0 | 118 commits, 228 paths; both-parent provenance |
| `E node /tmp/fgos-work/w0/extract.mjs --output-dir /tmp/fgos-work/w0` | 0 | Unchanged embedded extractors agree; each full unit digest recomputes, including heading payload/following-block formula |
| `python3 -B /tmp/fgos-work/w0/account.py` | 0 | Merge, bindings, incoming/deferred witnesses |
| `python3 -B /tmp/fgos-work/w0/verify.py` | 0 | Ledger/record/digest/exception/scope joins; second accounting replay byte-identical |
| `E node scripts/check-evidence-relocation.mjs --manifest plans/260925-documentation-authority-unification/reports/phase-08/step-06-evidence-relocation-manifest.json --before` | 0 | 867 entries, zero violations; no runtime-reader stop |
| `E node scripts/check-legacy-docs-ratchet.mjs` before / after | 1 / 0 | Exactly two existing digest mismatches, both refreshed |
| `E node --test --test-reporter=tap test/scripts/check-legacy-docs-ratchet.test.mjs` | 0 | 28/28 pass, zero fail/cancel/skip |
| `E node scripts/export-command-selectors.mjs --check` | 0 | Independently reproduces Lead's supplied result |
| `E node test/rust-host/generate-vectors.mjs --check` | 0 | Independently reproduces Lead's supplied result |
| `E node /tmp/fgos-work/w0/census.mjs` | 0 | Scratch regeneration exactly equals committed census bytes |
| `git diff --check` | 0 | Clean |

Census: **1,097 product files / 58 undeclared sites / 254 named classes**. The 58 undeclared site identities (ignoring line shifts) and families are unchanged. Named classes are **not** wholly unchanged: `rust-test` increases 99 → 100, at `packages/config/rust/tests/write_concurrency.rs:243` (`Command::new`, `sh`); all other class counts stay unchanged. The actual one-door verdict remains its known 58-site red, not a green gate. Initial exploratory assertions and their corrections are disclosed in verification; no production check was weakened.

The literal checkout `--write-census` command was not invoked: it would target an out-of-scope file and may bootstrap `.fgos`. As in L12-130, the unchanged `declaredProduct`/`scan`/`census` exports use the complete read-only Git file inventory, write only scratch and establish exact byte equality with the census already regenerated by the Lead. No repository census write is needed.

Lead-supplied lease **15/15** and registrations **55/60** (five known worktree-location failures) are recorded as supplied evidence, **not independently rerun or reattributed**.

## Reproduction, boundaries and handoff

[Reproduction](w0-reproduction.json) carries the exact scratch scripts, source hashes, materialization command and replay order, anchored to the explicit input pin. Reused: existing L12-65/L12-102/L12-130 binding method, both Phase 6 extractors, scan/census exports and canonical Step 7 batch catalog. No new product mechanism or test.

Only the three authorized existing-file deltas and `w0-*` artifacts were written. No owner-answers/progress/gate-register, source/doc/test/skill, reproduction-manifest or pair-accounting edits; no Git mutation, fgOS CLI, workspace `.fgos`/secrets access, native bootstrap, full suite or preview server. Impact-analysis **degraded/unqueried** under the no-CLI boundary; no product symbol edited. Markdown preview remains Lead custody under this constrained turn. `needsWrites: []`.

Lead handoff: join the one new binding hash into the G0 review batch/status at its current bytes, obtain independent acceptance, retain the 11/4/7 final-pin obligations, and perform pair accounting in its later assigned Unit. This receipt does not alter gate status, authorize cutover or pre-account its future runner commit.
