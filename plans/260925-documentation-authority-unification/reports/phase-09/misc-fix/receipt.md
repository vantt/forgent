# Miscellaneous documentation and preserve-premise corrections

Status: **scoped work complete; independent review pending. No gate accepted.**
Input HEAD: `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`.
Read first: [brief](../w4-misc-fix-brief.md), [machine receipt](receipt.json),
[binding witnesses](binding-refresh.json), [replay evidence](checks.json).

## Documentation and bindings

- Packaging implementation pointers now correctly say the shell helper reads
  `.git`/gitdir/commondir from disk without spawning Git. The same false live
  sentence in the writable detailed reading map was corrected, too. Prior art:
  `10416a6b0` replaced the shell's raw Git read as part of the one-door gate;
  `scripts/fgos-shell-integration.sh:27–29,57–90` is the current implementation.
- Data Dictionary row 7 now retains the dropped clause **“from the route's
  reconcile-scan, each with its pane id”**, present in current legacy distribution
  and Terminal Control. The effective block-5 adjudication in `s13-resync-a.json`
  now says **141 checks (133 literal + 8 loop-registered), 32 fixes**. The existing
  registry enumerator was replayed verbatim against the candidate: exact sets
  match, without running setup or doctor.
- Reading-map YAML/Config entries route to durable specification sections, not
  `plans/reports/` artifacts. The transition banner and both knowledge routes
  are unchanged. No other legacy/current-source route was flipped.
- Reused the byte-frozen dual Step 0 extractors, compact sorted UTF-8 JSON + LF
  binding recipe, self-inclusive heading ancestry and explicit overlay mechanism.
  `s17-misc-review-fixes.json` supersedes **27 effective bindings**: **21 content
  rebinds, 6 neighbor-witness-only refreshes**, out of 283 checked bindings in the
  two affected docs. Each has old/new complete unit and adjacent-unit witnesses
  in `binding-refresh.json`; old source identities and historical review records
  remain intact. New rows are pending, never inherited APPROVE.

The gate register is outside this brief's writable list. Under the W4 review's
stated final-pin option, the Lead must join its rows through these explicit
`supersedesBinding` references at F; this turn does not silently edit or certify
that projection. The existing global/author-pin verifiers are not substitutes
for this current-byte, scoped replay.

## G6 correction and judgments

The example/external branch now searches **`unit_at()`'s bound unit**, not a bare
path span and not the whole file. Its existing positive control now supplies a
path-only span. All three negative source-binding/history probes still reject;
the existing physical-move controls remain unchanged. Prior art `bade6b6b3` /
`b25dadae2` and L12-121 were reused, not replaced with a new premise mechanism.

| Named row | Current judgment |
|---|---|
| f00167 | Same bound passage explicitly says `e.g.` before the placeholder history path. |
| f08807 | Bound comment gives a path-like token example, not a dereferencing pointer. |
| f07822 | Bound rule states an illustrative history-path convention, not existence of a literal `<id>` file. |
| f08072, f08073 | One bound docsRef table row includes its placeholder convention and explicit `ví dụ` value. |
| f07697, f08033, f08047 | Still parked; their own consumer file is removed from candidate successor proposals under L12-35(7). Physical move facts remain evidence, not proposed links. |

All five example rows are `preserve-source-confirmed-history`, not independent
approvals or runtime parity claims. Self-link rows carry an explicit exclusion
and owner/blocker: review non-link provenance or remove live navigation outside
literal carriage; never replace it with a self-link.

At this input pin, all **4,804 + 609 = 5,413** preserve identities remain present,
plus **38** separately excluded retire-with-tree rows. Results:

| Result | Rows |
|---|---:|
| Source-confirmed history/provenance/carriage | 2,549 |
| Stable operand reachability | 1,399 |
| Park: unconfirmed premise | 1,001 |
| Park: unbound current passage | 137 |
| Park: source absent | 2 |
| Park: source removed by cutover | 162 |
| Proposed dated wrapper note | 163 |

Thus 3,948 bounded confirmations and **1,465 open judgment/note rows**, not a green
G6 gate. Refresh also observes current-source drift: two of the earlier 29 live
pointer examples (f08077/f08079) no longer bind and remain explicitly unbound
parks with no history evidence. All other reviewer counterexamples, five deleted
consumers, 163 wrapper positions and 73 review-batch wrapper files pass the owning
G6 assertions. No checker baseline or original record batch was rewritten.

## Reproduce

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/rebind.py --check
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/proof.py --pin 23f6eaccf5eb195a8f50e5788d38f386a901b6d2
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/verify.py
```

All exit 0. The scoped verifier runs `proof.py --pin <HEAD>` twice in isolated
scratch directories: stdout and **all four artifacts are byte-identical**, also
equal to delivered bytes. It then executes the owning G6 assertion section from
`preserve-premise/verify.py` verbatim, not a second copy of those cases.
`git diff --check` passes. One verifier-development attempt failed on a whitespace
assumption when locating the existing registry proof; the locator was corrected
and the final unchanged registry proof passed (no production check bypass).

**Pin boundary:** G6 proves tracked source blobs at input HEAD; `--pin` does not
pin the working-tree matrix/register inputs or include these uncommitted doc
edits. Binding replay separately authenticates the edited docs' current bytes.
The Lead must rerun at the integrated final pin and independently review changed
bindings/judgments. No final-pin, G2 refresh, or archive-readiness claim is made.
The old combined G2/G6 `verification.json` is explicitly historical, not this
turn's evidence; current scoped evidence is `misc-fix/checks.json`.

No repository Git write, fgOS CLI/lifecycle, `.fgos`/secret access, full npm/Cargo
suite, product behavior change, service, preview, pair accounting or protected
owner/progress/gate edit. Scratch is `/tmp/fgos-work/w4-misc-fix-brief/` (the proof
retains compatibility with the older combined verifier's output directory).
Impact-analysis: **degraded/unqueried**, because the brief forbids CLI and no
GitNexus tool is exposed. Product single tests were not needed for these
records/doc corrections; no test result is invented. Markdown preview and final
projection/accounting remain Lead custody. `needsWrites: []`.
