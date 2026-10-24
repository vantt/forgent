# Gloss polish receipt — replayed records only

## Current hardening replay

Check HEAD: **`8b4d778d32b5930ab7c80d9d19b2f26b95441ee1`**; author provenance
`sourceCommit` in the composition packet is unchanged. These remain prepared
records, never live-doc changes or final-pin/gate acceptance.

Witness **#2** now says the two forks were *recorded at the time*, and that the
Stop-drain decision was later settled so only wake-enabled mail starts an idle
turn. [w13-preparation.json](w13-preparation.json) records the exact old/new line
and the **one changed gloss spec** (mailbox), including diff, inverse and hashes.
No other witness changes. Its G9 body was recomposed; the other 544 body
patches/hashes are unchanged ([delta](../g9/w13-recomposition-delta.json)).

The full [w10-gloss-audit.json](w10-gloss-audit.json) is regenerated for all **104**
witnesses: **102 pass, two reviewed matches, zero review-required**. Vertical
classification uses neighbouring physical lines in the complete after-file,
not just neighbouring witnesses, so a lone glossed list item is covered.
Original adjacent witnesses additionally retain the earlier simultaneous-loss
proof. Outer numbered items are distinguished from embedded single citations.
[w13-audit-controls.json](w13-audit-controls.json) keeps the full real/synthetic
lone-witness controls and earlier simultaneous-loss/restoration controls.

The complete chain replays **106 steps across 74 files** with
`patch --batch --fuzz=0 -p1`: **424 calls, all exit 0**, per-step rollback and full
reverse rollback byte-exact. [Chain proof](w13-chain-verification.json).
[Independent replay](w13-independent-verification.json): **221 patch calls, all
exit 0**, same 74 files and generator evidence. All 104 witness before/after
lines equal replayed bytes. Scratch skill generation exits 0; the full-chain
citation scan exits **0 with 0 findings** and unchanged baseline. The intentional
before-F control still exits 1 with 130 findings.
[Citation proof](w13-citation-verification.json).

| Command (all Python uses `python3 -B`) | Exit |
|---|---:|
| Existing `g9/w12-gloss-polish.py` via `-c`, setting `PREFIX='w13'` | 0 |
| Scratch composition `verify.py` / `independent-replay.py` | 0 / 0 |
| `patch --batch --fuzz=0 -p1`, full forward/rollback chain | 424 calls, all 0 |
| Scratch skill generator / full citation scan | 0 / 0; 0 findings |
| `g9/recompose.py --pin HEAD` | 0; 545 bodies |
| `g9/sweep.py --check --pin HEAD` / `g9/verify.py --pin HEAD` | 0 / 0 |
| `misc-fix/verify.py` / `misc-fix/rebind.py --check` | 0 / 0 |
| Owning `rebind/rebind.py --check`, scratch-only relocation | 0 |
| `git diff --check` | 0 |

Exact argv/exits: [w13-commands.json](w13-commands.json),
[reproduction](../g9/w13-reproduction.json), and
[misc proof](../misc-fix/w13-live-proof.json). The binding/action proof and residual
inventory are rerun, not promoted: [gap05](w13-gap05-verification.json),
[unresolved bindings](w13-unresolved-bindings.json), [action](w13-action-verification.json).
No judge/ledger, origin accounting, semantic approval or residual-drift claim changes.
All scratch uses unique owned tempfile directories under `/tmp/fgos-work` and is
removed, including after exceptions and overlapping runs; the base is empty after
checks ([cleanup/overlap proof](../g9/w13-final-audit.json)).

Prior art and limits: reused W11 recipes/audit, exact locator and shared resolver,
not a new mechanism. Impact-analysis degraded (CLI forbidden; no MCP exposed).
Only scoped records/tooling changed; no docs/ledger, Git/fgOS state, pair
accounting, suites or preview service. `needsWrites=[]`. Earlier receipt below is
historical, not the current replay pin or current changed-body count.

## Earlier gloss-polish replay

Current replay/check pin: **`8fd37e3590d3654729cf2d177c90bb0fbb17dff9`** (`HEAD` during this run). **Composition replay, citation scan and G9 checks pass.** This supersedes the previous receipt's current gloss/replay claims; W11 evidence remains historical. The packet's `sourceCommit` (`eb744281deba853f201cda15dcb4876300a1d638`) remains author provenance, not this replay pin. Nothing is applied outside scratch; no final-pin F approval, authority promotion, independent acceptance or gate closure is claimed.

## Gloss repairs and complete audit

Repaired **14 distinct witnesses**, with **four** regenerated gloss specs:

| Witnesses (zero-based) | Repair |
|---|---|
| #35–#39, git | Restore all local labels 1–9 as `(n)`, including grouped items. Capitalize titles and remove repeated subtitles. |
| #61, #62, #64, holder-lock | Replace `Mục n:` list labels with `(n)`; retain numbers and gaps. `mục` still denotes sections. |
| #65, holder-lock | Vietnamese sentence explicitly refers to **ý (8) của đoạn main-door**, whose original rule wrapped only worktree add. No repo-lease conflation or English clause. |
| #47, #50, #59 | Use English event-log explanations in the surrounding English sentences. |
| #94 | Remove the outer parentheses, retaining the required `D-ADR0072 (gloss)` citation form without nesting. |
| #2 | Separate the Stop-drain decision and record-layout forks from the explanation of what starts an idle turn. |

[w12-preparation.json](w12-preparation.json) retains each replacement, changed spec identity, old/new hashes and 106 preparation replay commands. The four affected files are agent-mailbox spec, git spec, holder-lock spec and runner subcomponent `h-02842f76ffd2/spec.md`. Earlier repairs, including #16, remain intact.

The existing generator in `g9/w11-followup.py:audit_glosses` now detects **adjacent vertical numbered or lettered list items**, one per line, not only multiple labels on one line. Every original local number/letter is accounted for, including grouped labels and gaps. Its complete [w10-gloss-audit.json](w10-gloss-audit.json) contains **104 per-witness results** with before/after lines, matches, original/retained/lost labels, vertical-list neighbors and review status: **102 pass without matches; two pass after explained matches; zero unresolved**.

The two reviewed matches remain #66 (two distinct adjacent code spans become `CODE CODE` in the normalized audit) and #97 (valid Vietnamese reduplication `song song`). [w12-audit-controls.json](w12-audit-controls.json) proves that losing labels on each of #35–#39 is rejected; generic vertical numbered and lettered lists also reject loss and pass after labels are restored. Real chain replay authenticates all 104 witness locators and exact lines, separately from this mechanical prose audit.

## Full-chain replay, citation and G9

Full chain: **79 effective + 14 conditional F specs + 13 external predecessor applications = 106 steps / 74 files**. [w12-chain-verification.json](w12-chain-verification.json) records **424 patch calls, all exit 0**, per-step forward/rollback/reapply and full reverse rollback with exact original bytes/absence. [w12-independent-verification.json](w12-independent-verification.json) separately verifies those 74 files and generator evidence with **221 patch calls, all exit 0**. Both use `patch --batch --fuzz=0 -p1` and whole-file hash guards.

After the real skill generator, citation scanning reports **130 findings before F (exit 1, intentional negative control) → zero findings with the full prepared chain (exit 0)**. This is not merely zero new findings. Baseline bytes are unchanged: SHA-256 `ac0a6e980278f4be3ea3b2f7dbcf0f9004cf5fe1a7a35dbe1451aa0328ab4fff`. Evidence: [w12-citation-before-f.json](w12-citation-before-f.json), [w12-citation-verification.json](w12-citation-verification.json).

All **545 G9 bodies** were recomposed. Exactly the **four affected body diffs/hashes changed**, their preimages unchanged; the other **541** body diffs/hashes remain unchanged. G9 sweep binds current-chain bytes to body replay and predecessor metadata: zero drift, chain/body mismatches and judgment errors. Both mandatory checks exit **0** at HEAD. See [G9 receipt](../g9/receipt.md) and [recomposition delta](../g9/w12-recomposition-delta.json).

The sweep/recompose imports create no directories; verify also reuses the same lazy disposable workspace. Actual checks leave `/tmp/fgos-work/w12-gloss` absent. No historical `w11-g9` scratch remains.

## Unchanged binding/action boundaries

The reused verifier reran the existing shared resolver and immutable extractors:

- **171 origin assertions → 162 binding-refresh + 9 unit-carry occurrences → 90 terminal rows (81 + 9)**; all origin joins verify, zero moved-body/moved-heading unresolved bindings.
- **134 overlay hashes/anchors/ancestries** verify; 44 heading lookup snapshots remain excluded under existing policy. No ledgers changed.
- **13,776 raw assertions / 12,534 distinct effective bindings / 285 target files**, no missing files. Residual drift remains **556 assertions / 407 distinct bindings**, including six component-boundary assertions / four endpoints; not all bindings are green.
- `actions.json#/actions/4` retains its workflow spec path, preimage/postimage and holder hashes.

Evidence: [w12-gap05-verification.json](w12-gap05-verification.json), [w12-unresolved-bindings.json](w12-unresolved-bindings.json), [w12-action-verification.json](w12-action-verification.json). These are byte/binding checks, not independent acceptance or post-cutover rebind completion.

## Commands and exits

From repository root, let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9` and `T=/tmp/fgos-work/w12-gloss`. [w12-replay-recipes.json](w12-replay-recipes.json) persists the actual adapted W11 scripts; only scratch/output names and corrected-witness metadata changed. Every Python invocation uses **`python3 -B`**.

| Command | Exit / evidence |
|---|---|
| `python3 -B "$G/w12-gloss-polish.py"` | **0**, complete reproduction, scratch deleted |
| `python3 -B "$T/verify.py"` | **0**, complete chain, witness/citation/resolver/action checks |
| `patch --batch --fuzz=0 -p1` (full chain) | **424 calls, all 0**, forward/rollback exact |
| Scratch `node scripts/build-skill-wrappers.mjs`, before F / full chain | **0 / 0** |
| Scratch `node scripts/check-decision-citation-drift.mjs`, same trees | **1 / 0**, 130 findings / no findings |
| Shared Node extractor adapter / read-only pin inspection | **0** |
| `python3 -B "$T/independent-replay.py"` | **0**, 221 patch calls, all 0 |
| `python3 -B "$G/recompose.py" --pin HEAD` | **0**, 545 bodies, no problems |
| `python3 -B "$G/sweep.py" --check --pin HEAD` | **0**, zero drift/chain/body/judgment errors |
| `python3 -B "$G/verify.py" --pin HEAD` | **0**, byte/provenance and negative controls pass |
| Audit missing-label controls; import/cleanup controls | **0**, audit-controls and G9 final-audit artifacts |
| `git diff --check`; read-only scope/index audit | **0** |

[w12-commands.json](w12-commands.json) retains **522 subprocess commands: 521 exit 0 and the expected before-F citation exit 1** (513 patch calls: 89 before F + 424 full-chain). Independent replay keeps all 221 command exits in its own JSON. G9 records outer commands, stdout digests and stderr. Three initial failed enclosing attempts and their fixes are disclosed in the G9 receipt and `w12-{first,second,third}-attempt.json`; none is presented as green.

Only `composition/**` and `g9/**` changed. No live docs, ledgers, product code/tests, baseline, pair accounting, Git write, fgOS CLI, state/secrets or suites. **impact-analysis: degraded** under the explicit no-CLI grant; records tooling only. No preview service was launched under the exact write scope. Scratch is deleted, `needsWrites=[]`. Conditional F specs remain prepared-only; independent acceptance, actual cutover/final-pin lease and residual binding drift remain Lead-owned.
