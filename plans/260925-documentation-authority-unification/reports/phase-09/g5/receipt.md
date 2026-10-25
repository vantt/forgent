# Retention and surviving-map check receipt

## 1. Current result

`python3 -B g5/check.py --pin b57e79625` **exits 0**, byte-identically to
[check-b57e79625.json](check-b57e79625.json). Full input pin:
`b57e79625704b2d7a37700fc4d72dbcdd82cdf00`. Replayed during this catch-up at
`cf13e2bd22ce390344837560b35b41adf7da1238` without changing the checker or its artifacts.

- Legacy retention: **10/10** spans found at their own files.
- Surviving-map clause: **1 verbatim / 8 restated / 1 not applicable**; no missing span.
- **31/31** in-memory negative controls pass.
- `gateApproved: false`; the eight exact restatements remain **pending owner acceptance**.

[W21 B](../reviews/w21-census-rework-and-g5-review.md#b-g5-retention-check-b57e79625--83916a31f-approve)
independently approves both clauses, exact bindings and controls. G5 is **met-local**
under L13-19.2, not finally accepted. Its only open items are the owner's acceptance
of the eight restatements in the cutover approval packet (L13-10), and the rerun at F.
See [owner answers](../owner-answers.md), [gate definition](../preflip-execution-plan.md#2-gates-met-inputs-owner-work-size-proof)
and the generated [register](../preflip-gate-status.json).

The definition has two clauses: each `retentionReceipts` span survives at its own
file, and the reading-map entry-union keeps the L11-25 banner and both
compounding→knowledge lines. The holder-lock header at
`docs/platform/holder-lock/spec.md:8` belongs only to the first clause; it is
byte-exact there, in a file that survives under `docs/platform/`. It does not need
an invented copy or restatement in the reading map. The Lead correction
`83916a31f` scoped the checker accordingly; W21 B approves that scope.

## 2. Exact matches and owner packet

The checker reads the receipt register, both retained source files, and
`docs/reading-map.md` at its explicit document pin. Its working-tree checker hash
is recorded separately in `checkerSha256`. Matching uses exact LF-split whole
lines/blocks, without Unicode, CRLF, whitespace, substring or fuzzy normalization.
A changed digest or a missing file fails closed. Restatements are keyed by the
recorded line and SHA256, not inferred from nearby prose.

| Retained source / recorded line | Found line | Surviving status | Surviving location |
|---|---:|---|---|
| `docs/platform/holder-lock/spec.md:8` | 8 | not applicable to map clause | same surviving file:8 |
| `docs/specs/reading-map.md:3` | 3 | restated | `docs/reading-map.md:89–108` |
| `docs/specs/reading-map.md:4` | 4 | restated | :89–108 |
| `docs/specs/reading-map.md:5` | 5 | restated | :89–108 |
| `docs/specs/reading-map.md:6` | 6 | restated | :89–108 |
| `docs/specs/reading-map.md:7` | 7 | restated | :89–108 |
| `docs/specs/reading-map.md:8` | 8 | restated | :89–108 |
| `docs/specs/reading-map.md:9` | 9 | restated | :89–108 |
| `docs/specs/reading-map.md:34` | 34 | restated | :156 |
| `docs/specs/reading-map.md:37` | 37 | verbatim | :159 |

The authoritative exact owner packet is
[check-b57e79625.json](check-b57e79625.json), `/ownerAcceptance`: exactly eight
rows, each carrying `legacyText`, recorded digest, named restatement,
`proposedText`, surviving start/end lines, and `pending-owner-acceptance`.
The list is referenced rather than duplicated here so the packet has one exact source.

The seven banner rows map to one existing English block, not seven newly authored
translations. The proposal does not literally repeat `Canonical:` and updates
historical phase counts (00–02 / 03–09 versus 00–01 / 02–09); byte presence is
**not semantic-equivalence approval**. The line-34 proposal includes the full
Truth-correction suffix **and** `skillForStep` / `src/state/domain-registry.mjs`
in place of `skillForStage` / `src/state/workflow-stage-graphs.mjs`. Acceptance
must cover the full exact old/new texts, not an unchecked suffix or prefix.

## 3. Reproduction and proofs

Run from the repository root; `P` below means
`plans/260925-documentation-authority-unification/reports/phase-09`.
No command below redirects output into the read-only G5 directory.

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g5/check.py --pin b57e79625
# exit 0; output equals g5/check-b57e79625.json
```

An in-memory byte comparison reproduces the current result without writing it:

```sh
python3 -B - <<'PY'
import collections, json, pathlib, subprocess
p = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09/g5')
r = subprocess.run(['python3', '-B', str(p / 'check.py'), '--pin', 'b57e79625'], capture_output=True)
assert r.returncode == 0 and r.stdout == (p / 'check-b57e79625.json').read_bytes(), r.stderr
d = json.loads(r.stdout)
assert d['ok'] and d['legacyOk'] and d['survivingOk'] and not d['gateApproved']
assert d['spans'] == 10 and not d['missing'] and not d['survivingMissing']
assert collections.Counter(r['surviving']['status'] for r in d['rows']) == {'verbatim': 1, 'restated': 8, 'not-applicable': 1}
assert len(d['ownerAcceptance']) == 8
assert all(r['status'] == 'pending-owner-acceptance' for r in d['ownerAcceptance'])
assert d['negativeControlsOk'] and len(d['negativeControls']) == 31
print('PASS')
PY
# exit 0
```

The 31 controls mutate actual inputs in memory: 10 legacy bytes, 9 applicable
surviving bytes/blocks, 9 surviving-span removals and 3 missing files. Each must
change its input, reject its targeted row and fail the content check.

Catch-up proof log: [gate-reconcile/catchup-proof.json](../gate-reconcile/catchup-proof.json).
All Python commands use `python3 -B`; all Node descendants use `--no-addons`.

| Command | Exit | Evidence |
|---|---:|---|
| `P/census-join/join.py --pin cf13e2bd22ce390344837560b35b41adf7da1238`, final run 1 | 0 | catch-up log |
| Same command, final run 2 | 0 | stdout/stderr and all five join/citation outputs byte-identical |
| `python3 -B P/g5/check.py --pin b57e79625` | 0 | byte-equal to current artifact; 31 controls |
| `python3 -B P/gate-reconcile/verify.py` | 0 | current record-integrity proof; volatile `checkedAtHead` restored afterward |
| `python3 -B P/gate-reconcile/controls.py` | 0 | positive proof and 10 rejecting controls |

## 4. Short history and boundaries

[check-a8acd5d27.json](check-a8acd5d27.json) records the **superseded over-broad
run**, exit 1: 10 legacy spans, 1 verbatim / 8 restated / 1 missing in the map.
It wrongly required the holder-lock header in the map as well as its own file.
It is historical evidence only. The current checker at that old document pin
exits 0 with different bytes; it cannot reproduce that obsolete checker output.
[check-b726d44ed.json](check-b726d44ed.json) is the still older legacy-only proof.
Neither artifact was changed. This receipt replaces its former stale result,
obsolete reproduction assertions and duplicate section number (W21 Low).

Prior art reused: existing `check.py` retention and exact surviving-map checks,
its reviewed Lead correction and W21 B. No G5 script, docs, ledger or product
code was edited. Impact-analysis: degraded/unqueried under the no-fgOS-CLI and
no-MCP boundary. No git mutation, fgOS/lifecycle command, native addon, product
suite, pair accounting or preview service was used; scratch tempfile directories
under `/tmp/fgos-work/` were removed. `needsWrites: []`.
