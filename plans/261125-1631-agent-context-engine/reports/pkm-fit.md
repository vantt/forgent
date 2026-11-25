# pkm fit probe (phase 2)

Probe of pkm `v0.7.0` (the tag `fgos-documentation` links) as the ACE rule engine (ACE-D6). Scratch tree:
`.fgos/runtime/tmp/ace-pkm-probe/` (never tracked). Every block below is a real command with its output (the probe
dir path is shortened to `$D`, long lines cut at 400 chars). `source $D/env.sh` sets `$D`, `$B` (the probe binary
`ace-pkm-probe`, a 6-line wrapper over `pkm_cli::main`, built with the same tag and `search` feature as
`packages/documentation/rust/Cargo.toml`) and `PKM_HOME` (isolated data folder). Helpers (scratch): `q.sh NAME cmd...` runs
`pkm` on `$D/NAME/vault` with db `$D/NAME/db/graph.db`; `mkvault.sh NAME` creates a fresh fixture vault with the ACE
profile and pack; `cap.sh` appends command+output to this report. All probes ran with `PKM_NO_SEARCH=1` unless the
question needs search (Q5, Q6, Q7).

Rule shape used: `packages/agent-context-engine/contracts/rule-unit.v1.json` and
`docs/platform/agent-context-engine/spec.md` (phase 1, landed).

## Verdict table

Overall: **pkm v0.7.0 fits as the ACE engine; no blocking gap.** Phase 3 can start. Four contract points must reach
`rule-unit.v1.json` (G-A, G-C, G-D, G-F) and one limit lowers what phase 4 may claim (G-I).

| # | Question | Verdict | One line |
|---|---|---|---|
| 1 | `rule` type, 3 edges, `writes: none`, db outside the tree | PASS | pack declares all; 7 notes from 3 roots; refuses to run without `--db` outside the tree |
| 2 | `in_force` set | PASS (gap G-C) | live, deprecated, in-window replaced in; draft/rejected/retracted counted out; a rule without `valid_from` vanishes silently |
| 3 | R12, R15, R16, dangling `depends_on` | PASS (gaps G-E, G-F) | R12, R15, R16 fire; dangling link is **R3**; bare ids are never checked |
| 4 | anything acts on `conflicts_with` | PASS (expected no) | edge indexed, nothing flags two in-force rules; ACE checks (G-G) |
| 5 | `implicit-replacement` on clusters 1, 6, 9 | **FAIL** | default 0.93 finds 1 of 7 verified pairs; all 7 only at 0.84 with 52,231 pairs flagged; no usable threshold (G-I) |
| 6 | draft vs in-force without writing | PASS (gap G-K) | `search`, `locate`, `material`; tree untouched; same recall as Q5 (4 of 7 in top 3) |
| 7 | times and network | PASS | build 0.1 s, structural query 20 ms, hybrid query 0.7 s, vectors for 548 notes in 8 s; no network at runtime |

## Q1. Declare `rule`, edges `refines`/`depends_on`/`conflicts_with`; does `index build` accept the 3 roots with `writes: none` and db outside the tree?

Profile and pack (`vault/.pkm/profile.yaml`, `vault/.pkm/ace.yaml`):

```text
$ cat vault/.pkm/profile.yaml vault/.pkm/ace.yaml
profile: ace-rules
format: 1
vault:
  packs: [ace]
  pack_files: [ace.yaml]
  writes: none
  include: ["core/instructions/**", "components/*/instructions/**", "domains/*/instructions/**"]
  types:
    - {path: "core/instructions/**", type: rule}
    - {path: "components/*/instructions/**", type: rule}
    - {path: "domains/*/instructions/**", type: rule}
ace:
  description: ACE rule units.
  node_types:
    rule:
      description: One fgOS rule unit.
      roles: {id: id, id_scope: vault, lifecycle: lifecycle, valid_from: valid_from, valid_to: valid_to, replaced_by: superseded_by}
      lifecycle_classes: {draft: [draft], rejected: [rejected], live: [live], deprecated: [deprecated], replaced: [replaced], retracted: [retracted]}
      fields:
        id: {type: text}
        owner: {type: text}
        kind: {type: text}
        mode: {type: text}
        scope: {type: text}
        specificity: {type: number}
        title: {type: text}
        description: {type: text}
        refines: {link_to: [rule], list: true}
        depends_on: {link_to: [rule], list: true}
        conflicts_with: {link_to: [rule], list: true}
        superseded_by: {link_to: [rule]}
  edges:
    refines: {inverse: refined_by, domain: [rule], range: [same]}
    refined_by: {inverse: refines, domain: [rule], range: [same]}
    depends_on: {inverse: required_by, domain: [rule], range: [same]}
    required_by: {inverse: depends_on, domain: [rule], range: [same]}
    conflicts_with: {symmetric: true, inverse: conflicts_with, domain: [rule], range: [same]}
    superseded_by: {override: true, inverse: supersedes, group: lifecycle, domain: [rule], range: [same], cardinality: one}
    supersedes: {override: true, inverse: superseded_by, group: lifecycle, domain: [rule], range: [same]}
  lifecycle_types: [rule]
```

```text
$ . ./env.sh; $B vault index build --db $D/db/graph.db --full --json | grep -E "\"notes\"|\"mode\"|schema_problems|\"profile\"|\"ms\"|\"edges\""; echo "--- without --db:"; $B vault stats; echo "exit=$?"
 "mode": "full",
 "notes": "7",
 "ms": "{\"list\": 0.2, \"parse\": 12.1, \"edges_schema_views\": 7.2, \"total\": 22.1}",
 "edges": "{}",
 "schema_problems": "",
 "profile": "ace-rules@983182adba60",
--- without --db:
error: the vault is read-only (vault.writes: none) and has no index outside it yet
why: without --db the default index is vault/.kg/graph.db, inside the vault
fix: pass an index outside the vault with --db: mcp install's index is at `pkm paths --vault vault --json` (data.vault.graph_db); not installed yet: pkm vault index build --db <file outside the vault>
exit=1
```

```text
$ . ./env.sh; ls -A vault; echo "--- db is outside the tree:"; ls db; echo "--- rule edges registered in the index:"; python3 -I -c "
import sqlite3
c=sqlite3.connect(\"file:db/graph.db?mode=ro\",uri=True)
for r in c.execute(\"select name,pack,inverse,symmetric,domain_ok from schema_edge where pack=\x27ace\x27\" ) if False else c.execute(\"select * from schema_edge where pack=\x27ace\x27\"): print(r)
print([r[0] for r in c.execute(\"select name from pragma_table_info(\x27schema_edge\x27)\")])
"
.pkm
components
core
domains
--- db is outside the tree:
graph.db
graph.db.lock
--- rule edges registered in the index:
('superseded_by', 'ace', 'edge', 'lifecycle', 'supersedes', 'one', 0, None, 0, 0)
('refines', 'ace', 'edge', None, 'refined_by', None, 0, None, 0, 0)
('refined_by', 'ace', 'edge', None, 'refines', None, 0, None, 0, 0)
('depends_on', 'ace', 'edge', None, 'required_by', None, 0, None, 0, 0)
('required_by', 'ace', 'edge', None, 'depends_on', None, 0, None, 0, 0)
('conflicts_with', 'ace', 'edge', None, 'conflicts_with', None, 1, None, 0, 0)
('supersedes', 'ace', 'edge', 'lifecycle', 'superseded_by', None, 0, None, 0, 0)
['key', 'pack', 'kind', 'grp', 'inverse', 'cardinality', 'symmetric', 'polarity', 'human_only', 'block_ref']
```

**Verdict Q1: PASS.** The pack declares type `rule` with roles (`id` scoped `vault`, lifecycle with six classes,
`valid_from`/`valid_to`/`superseded_by`) and the edges `refines`, `depends_on`, `conflicts_with` (symmetric); all are in
`schema_edge` with pack `ace`. `related` is built in (symmetric). The 7 current units, converted by hand, sit in the three
roots (`core/instructions`, `components/*/instructions`, `domains/*/instructions`) and all 7 are read; `writes: none`
leaves the vault tree untouched (only `.pkm/` and the three roots), and pkm refuses to run without `--db` outside the tree.
Full build of 7 notes: 22 ms.

Findings that bind phase 1/3 (details in Q2, Q3):
- **G-A (frontmatter links):** an edge field only becomes a graph edge when written as a wikilink
  (`depends_on: ["[[other-id]]"]`). A bare id string (`superseded_by: r-live`, as `rule-unit.v1.json` allows) is kept as a
  plain property and creates no edge. Mitigation: phase 1 contract states the link form `"[[<id>]]"`, or ACE loads the
  bare ids itself.
- **G-B (node identity):** pkm node ids are tree-relative paths (`core/instructions/r-live.md`), not the frontmatter `id`;
  the `id` role is only for R16 uniqueness. ACE maps path to rule id (`id` property) on every query. Mitigation: trivial.

## Q2. Does `in_force` return only live, deprecated and in-window replaced rules, excluding draft, rejected, retracted?

Fixture `q2-d` (made by `fixtures.sh d`): one rule per lifecycle state with `valid_from: 2026-01-01`; `r-repl-in`
(replaced, `valid_to: 2027-06-01`), `r-repl-out` (replaced, `valid_to: 2026-06-01`), both `superseded_by: "[[r-live]]"`;
and `r-nodate` (live, **no** `valid_from`).

```text
$ . ./env.sh; ./q.sh q2-d index build --json | grep -E "\"notes\"|schema_problems"; ./q.sh q2-d in_force rule --as-of 2026-11-26
 "notes": "8",
 "schema_problems": "",
{
 "count": 3,
 "items": [
  {
   "id": "core/instructions/r-deprecated.md",
   "valid_from": "2026-01-01",
   "valid_to": null,
   "status": "deprecated",
   "deprecated": true
  },
  {
   "id": "core/instructions/r-live.md",
   "valid_from": "2026-01-01",
   "valid_to": null,
   "status": "live"
  },
  {
   "id": "core/instructions/r-repl-in.md",
   "valid_from": "2026-01-01",
   "valid_to": "2027-06-01",
   "status": "replaced"
  }
 ],
 "excluded": {
  "draft": 1,
  "rejected": 1,
  "retracted": 1
 },
 "ended": [
  {
   "id": "core/instructions/r-repl-out.md",
   "valid_to": "2026-06-01",
   "replaced_by": [
    "core/instructions/r-live.md"
   ]
  }
 ]
}
```

```text
$ ./q.sh q2-d in_force rule --as-of 2026-11-26 --drafts | grep -E "count|\"id\"|excluded"; echo "--- r-nodate:"; ./q.sh q2-d select lifecycle=live; ./q.sh q2-d validate --json
 "count": 4,
   "id": "core/instructions/r-deprecated.md",
   "id": "core/instructions/r-draft.md",
   "id": "core/instructions/r-live.md",
   "id": "core/instructions/r-repl-in.md",
 "excluded": {
   "id": "core/instructions/r-repl-out.md",
--- r-nodate:
{
 "count": 2,
 "items": [
  "core/instructions/r-live.md",
  "core/instructions/r-nodate.md"
 ]
}
{
 "counts": {},
 "examples": {}
}
```

**Verdict Q2: PASS with one gap.** `in_force rule --as-of D` returns exactly live, deprecated (flagged
`"deprecated": true`) and replaced-inside-window (`r-repl-in`); draft, rejected and retracted are counted in
`excluded`; the replaced rule whose window ended (`r-repl-out`) moves to `ended` with `replaced_by`; `--drafts` adds the
draft. The lifecycle values are the pack's own words (`lifecycle_classes` replaces pkm's default table).

Gaps:
- **G-C (silent drop, ACE must close):** `in_force` selects `WHERE valid_from IS NOT NULL` (`query.rs` `in_force`).
  A live rule with no `valid_from` (`r-nodate`) is in neither `items` nor `excluded` nor `ended` and `validate` is
  clean: the rule silently does not exist. `rule-unit.v1.json` makes `valid_from` optional. Mitigation: phase 1 makes
  `valid_from` required (the checker rejects a rule without it); ACE also cross-checks `select`/`stats` node count
  against `items+excluded+ended`. Not blocking.
- **G-D (window is by date, not by status):** `valid_to` earlier than the as-of date moves any non-rejected/retracted
  rule to `ended`, even a `live` one (read from the source, not run). ACE's contract: `valid_to` is set only with `lifecycle: replaced`.
- `--units` returns 0 because ACE does not declare sub-note `units`: a rule file is one note, one rule, so note-level
  `in_force` is the right level (no unit-level work needed).

## Q3. Do R12, R15, R16 fire on the matching broken fixtures? Is a dangling `depends_on` reported, by which rule?

Fixture `q3-y` (made by `fixtures-q3.sh y`, also the q3 block of `fixtures.sh`): `r12-no-successor` (replaced, no
`superseded_by`, no `valid_to`), `r12-no-end` (replaced, successor, no `valid_to`), `r12-dangling-successor`
(successor `[[no-such-rule]]`), `r15-two-successors` (two targets in `superseded_by`), `r16-a` in `core/` and `r16-b` in
`domains/coding/` with the same `id: r16-a`, `dep-dangling` (`depends_on: ["[[no-such-rule]]"]`), `dep-bare`
(`depends_on: ["no-such-rule"]`, bare), `bad-lifecycle-value` (`lifecycle: zombie`).

```text
$ . ./env.sh; ./q.sh q3-y index build --json | grep -E "\"notes\"|schema_problems"; ./q.sh q3-y validate --json | python3 -I vflat.py
 "notes": "11",
 "schema_problems": "",
R12  core/instructions/r12-no-end.md  superseded without valid_to
R12  core/instructions/r12-no-successor.md  superseded without superseded_by
R12  core/instructions/r12-no-successor.md  superseded without valid_to
R15  core/instructions/r15-two-successors.md  superseded_by takes one target, has 2
R16  core/instructions/r16-a.md  code r16-a duplicates domains/coding/instructions/r16-b.md
R16  domains/coding/instructions/r16-b.md  code r16-a duplicates core/instructions/r16-a.md
R3  core/instructions/dep-dangling.md  depends_on: [[no-such-rule]] has no note
R3  core/instructions/r12-dangling-successor.md  superseded_by: [[no-such-rule]] has no note
R9  core/instructions/bad-lifecycle-value.md  lifecycle = zombie outside set lifecycle_rule
counts: {'R3': 2, 'R9': 1, 'R12': 3, 'R15': 1, 'R16': 2}
```

**Verdict Q3: PASS (R12, R15, R16), with two gaps.**
- R12 fires on replaced-without-successor and replaced-without-end (`r12-no-successor` twice, `r12-no-end`).
- R15 fires on a second `superseded_by` target (cardinality one).
- R16 fires on both notes when two rules in different roots share an `id` (`id_scope: vault`, so uniqueness is across
  all three roots, as ACE-D1 needs).
- A dangling `depends_on: ["[[no-such-rule]]"]` is reported by **R3** (`link has no note`), not R12/R17. R3 also reports a
  dangling `superseded_by`, so the "broken chain" case is R3, not R12. `lifecycle: zombie` is **R9**.
- **G-E (bare ids are invisible):** `dep-bare` (`depends_on: ["no-such-rule"]`) produces no edge and no finding at all.
  Combined with G-A, a typo in bare form is never caught. Mitigation: the ACE checker (phase 3) reads the raw
  frontmatter lists itself and requires the `"[[id]]"` form, or resolves bare ids to wikilinks before pkm sees them.
- **G-F (links resolve by filename):** `[[x]]` resolves to the note whose file stem is `x`; the rule `id` is not used
  to resolve a link. Mitigation: ACE contract: file stem equals `id` (phase 1 writes this; the checker enforces it).

G-F check, fixture `q3b-w` (file `stem-x.md` with `id: other-id`; `linker.md` has `depends_on: ["[[other-id]]"]`):

```text
$ . ./env.sh; ./q.sh q3b-w index build --json | grep -E "\"notes\"|\"edges\""; ./q.sh q3b-w validate --json | python3 -I vflat.py
 "notes": "2",
 "edges": "{\"accepted\": 1}",
R3  core/instructions/linker.md  depends_on: [[other-id]] has no note
counts: {'R3': 1}
```

G-F is confirmed: the link `[[other-id]]` does not resolve to the note whose `id` is `other-id`.

## Q4. Does anything in pkm act on `conflicts_with` between two in-force rules?

Fixture `q4-w` (`fixtures.sh w q4`): `conf-a` and `conf-b`, both live, `conf-a` has `conflicts_with: ["[[conf-b]]"]`.

```text
$ . ./env.sh; ./q.sh q4-w index build --json | grep -E "\"notes\"|\"edges\""; echo "--- validate:"; ./q.sh q4-w validate --json; echo "--- in_force:"; ./q.sh q4-w in_force rule --as-of 2026-11-26 | tr -d "
 " ; echo; echo "--- neighbors of conf-b:"; ./q.sh q4-w neighbors core/instructions/conf-b.md | tr -d "
 "; echo
 "notes": "2",
 "edges": "{\"accepted\": 1}",
--- validate:
{
 "counts": {},
 "examples": {}
}
--- in_force:
{"count":2,"items":[{"id":"core/instructions/conf-a.md","valid_from":"2026-01-01","valid_to":null,"status":"live"},{"id":"core/instructions/conf-b.md","valid_from":"2026-01-01","valid_to":null,"status":"live"}],"excluded":{},"ended":[]}
--- neighbors of conf-b:
{"count":1,"items":[{"rel":"conflicts_with","node":"core/instructions/conf-a.md","dir":"in","id":1,"claim":null,"status":"accepted","valid_from":"2026-01-01","valid_to":null,"asserted_at":null,"source":"core/instructions/conf-a.md","origin":"frontmatter","proposed_by":"human","extracted_by":null,"confidence":null,"score":null,"layer":"accepted","edge_rel":"conflicts_with","type":"rule"}]}
```

**Verdict Q4: PASS (the expected "no").** The edge is indexed and traversable (`neighbors` shows `conflicts_with` from
`conf-b` back to `conf-a`), but `validate` is clean and `in_force` returns both rules with no flag. Reading the
source: `conflicts_with` is not a built-in edge, and nothing in `validate`/`audit`/`in_force`/`related.rs` treats an
edge by name except `superseded_by`/`amends`/`related`/`supports`/`disputes`. The `disputes` built-in edge is
evidence-group (claims) and also unchecked.
- **G-G (ACE checks it):** a conflict is a pair where both ends are in `in_force` at the same date. ACE computes it
  from `in_force` ∩ `neighbors --rels conflicts_with` (one query per rule, or `select`-style SQL on the exported
  `links` view). Not blocking; this is the phase 3 checker's job as ACE-D6 expected. Conflict between rules that
  do not declare the edge (undeclared semantic conflict) is the near-duplicate/`audit` territory (Q5), not an edge.

## Q5. Does `implicit-replacement` find the paraphrase pairs of clusters 1, 6, 9 of the P2 report at the default threshold, and at which threshold without flooding?

Source of the clusters: `plans/reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md` section 2 (31 clusters).
Corpus (fixture `q5-b`, `fixtures.sh b q5`): the 7 current units plus **541 real statements** cut from the files of those
clusters (hand-written `AGENTS.md` before the generated block, `core/skills/_shared/*.md`, 8 `SKILL.md` files; one
statement per bullet or paragraph, 60 to 900 chars, `gen-corpus.py`), 548 `rule` notes in all, all live,
`valid_from: 2026-01-01`, no `group` role. Search on (real embedder `Xenova/multilingual-e5-small`, cosine, 384 dims).

Setup facts that matter (see Q7 and gap G-H): the model needed one file (`special_tokens_map.json`, 167 bytes, network,
sha256 checked against pkm's manifest); the fixture vault had to be its own git root, otherwise pkm's search silently
excludes every note (`index sync` answers `"text": "excluded"`) because the enclosing repo ignores `.fgos/`.

Verified paraphrase pairs: I read the two real texts of each pair and judged them to impose the same rule (line numbers of the
research report had drifted for some; these are the pairs I could confirm in the current text):
- 1: `AGENTS.md:216` ("Before dispatching any task ... run `fgos dispatch decide` first. Never decide the mechanism yourself.")
  ~ `capability-matching.md:42` ("An agent never decides the mechanism itself ...: it queries `decide --for <capability>` once before execution.")
- 6a: `capability-matching.md:56` ("Plans declare canonical capability names only. Never pin an executor, provider, model, or tier in a plan.")
  ~ `fgos-advise/SKILL.md:171` ("Never pin a provider, model, executor, or tier. Dispatch resolves ...")
- 6b: `capability-matching.md:27` ("Units and plans must never pin infrastructure (`executor`, `provider`, `model`, `tier` ...)")
  ~ `fgos-run/SKILL.md:80` ("Units, patterns, plans, and driver prompts never pin executors, providers, models, tiers ...")
- 6c: `fgos-advise/SKILL.md:141` ("Never set provider, model, executor, tier, `invocation`, `prefer` ...") ~ `fgos-advise/SKILL.md:171`
- 9a/9b/9c: `coordination-driver.md:58` ("Never rely on worker self-narration, conversational claims, or ungrounded status summaries.")
  ~ `fgos-fanout/SKILL.md:102` ("Gather by reading STATE, never by trusting an Agent's own report.")
  ~ `fgos-cook/SKILL.md:119` ("Never claim a slice is verified because a worker or a checker said so; claim only what you re-ran or read.")

First, the default run (`audit` as pkm ships it: `implicit.min 0.93`, `implicit.max 50`):

```text
$ . ./env.sh; unset PKM_NO_SEARCH; time ./q.sh q5-b audit --out $D/q5-b/audit-default.jsonl; python3 -I -c "
import json,collections
r=[json.loads(l) for l in open(\"q5-b/audit-default.jsonl\")]
print(collections.Counter(x[\"kind\"] for x in r))
s=[x[\"evidence\"][\"score\"] for x in r if x[\"kind\"]==\"implicit-replacement\"]
print(\"implicit-replacement pairs: %d (cap max=50), score range %.3f..%.3f\"%(len(s),min(s),max(s)))
"
0.25user 0.05system 0:00.33elapsed 92%CPU (0avgtext+0avgdata 45064maxresident)k
0inputs+8320outputs (0major+4720minor)pagefaults 0swaps
Counter({'near-pairs': 60, 'implicit-replacement': 50})
implicit-replacement pairs: 50 (cap max=50), score range 0.930..0.978
```

At the defaults the list is **cut off at the cap of 50** (the 548 notes have more than 50 pairs at 0.93, see the sweep). To
measure real counts, one run with a profile that lowers the floor to 0.5 and lifts the cap
(`audit: {implicit: {min: 0.5, max: 1000000}}`, passed with `--profile`) dumps every pair with its cosine; the sweep is
then offline (`an5.py`):

```text
$ . ./env.sh; unset PKM_NO_SEARCH; time ./q.sh q5-b audit --profile $D/prof-all/profile.yaml --out $D/q5-b/audit-all.jsonl; wc -l q5-b/audit-all.jsonl; python3 -I an5.py q5-b
0.82user 0.25system 0:01.13elapsed 94%CPU (0avgtext+0avgdata 769492maxresident)k
8inputs+212624outputs (0major+192274minor)pagefaults 0swaps
149937 q5-b/audit-all.jsonl
implicit pairs total (min 0.5): 149877 notes: 541

verified paraphrase pairs (real texts):
  1: AGENTS.md:216 ~ capability-matching.md:42: ids agents-l216 , core-skills-shared-capability-matching-l42 -> cosine 0.868
  6a: capability-matching.md:56 ~ fgos-advise:171: ids core-skills-shared-capability-matching-l56 , core-skills-fgos-advise-skill-l171 -> cosine 0.895
  6b: capability-matching.md:27 ~ fgos-run:80: ids core-skills-shared-capability-matching-l27 , core-skills-fgos-run-skill-l80 -> cosine 0.948
  6c: fgos-advise:141 ~ fgos-advise:171: ids core-skills-fgos-advise-skill-l141 , core-skills-fgos-advise-skill-l171 -> cosine 0.89
  9a: coordination-driver.md:58 ~ fgos-fanout:102: ids core-skills-shared-coordination-driver-l58 , core-skills-fgos-fanout-skill-l102 -> cosine 0.855
  9b: coordination-driver.md:58 ~ fgos-cook:119: ids core-skills-shared-coordination-driver-l58 , core-skills-fgos-cook-skill-l119 -> cosine 0.896
  9c: fgos-fanout:102 ~ fgos-cook:119: ids core-skills-fgos-fanout-skill-l102 , core-skills-fgos-cook-skill-l119 -> cosine 0.843

cluster members (statement ids):  {1: 5, 6: 6, 9: 9} member pairs: {1: 10, 6: 15, 9: 36}

threshold | pairs flagged | verified pairs found (of 7) | cluster-member pairs found c1/c6/c9 | flagged per note
  0.96   |      5        | 0                          | 0/10  0/15  0/36   | 0.01
  0.95   |     10        | 0                          | 0/10  0/15  0/36   | 0.02
  0.94   |     27        | 1                          | 0/10  1/15  0/36   | 0.05
  0.93   |     53        | 1                          | 0/10  1/15  0/36   | 0.10
  0.92   |     99        | 1                          | 0/10  2/15  0/36   | 0.18
  0.91   |    209        | 1                          | 0/10  3/15  0/36   | 0.39
  0.90   |    502        | 1                          | 1/10  3/15  0/36   | 0.93
  0.88   |   3406        | 4                          | 5/10  10/15  3/36   | 6.30
  0.86   |  16709        | 5                          | 8/10  15/15  10/36   | 30.89
  0.84   |  52231        | 7                          | 10/10  15/15  23/36   | 96.55
  0.82   | 101629        | 7                          | 10/10  15/15  33/36   | 187.85
  0.80   | 135154        | 7                          | 10/10  15/15  35/36   | 249.82

rank of the partner among the nearest neighbours (of 541 notes), per end:
  1: AGENTS.md:216 ~ capability-matching.md:42: rank of b from a = 114, rank of a from b = 31
  6a: capability-matching.md:56 ~ fgos-advise:171: rank of b from a = 5, rank of a from b = 1
  6b: capability-matching.md:27 ~ fgos-run:80: rank of b from a = 1, rank of a from b = 1
  6c: fgos-advise:141 ~ fgos-advise:171: rank of b from a = 3, rank of a from b = 5
  9a: coordination-driver.md:58 ~ fgos-fanout:102: rank of b from a = 19, rank of a from b = 213
  9b: coordination-driver.md:58 ~ fgos-cook:119: rank of b from a = 3, rank of a from b = 1
  9c: fgos-fanout:102 ~ fgos-cook:119: rank of b from a = 326, rank of a from b = 64
best-end rank per pair: [31, 1, 1, 3, 19, 1, 64] | found within top-3: 4 top-5: 4 top-10: 4 of 7
```


**Verdict Q5: FAIL as a pairwise paraphrase detector at any threshold; the mechanism itself works.**
- At the default 0.93 `audit` lists 53 pairs (cut to 50 by `implicit.max`) and finds **1 of the 7** verified paraphrase
  pairs (6b, 0.948). Clusters 1 and 9 are not found at all at 0.93; of cluster-member pairs it finds 1 of 61.
- No threshold separates paraphrase from topical neighbours in this corpus: the e5-small cosines of 541 same-domain
  rules sit in 0.70 to 1.00 (149,877 pairs all above 0.5). Going down from 0.93: 0.90 flags 502 pairs (0.9 per rule) and still finds 1 of 7;
  0.88 flags 3,406 (6 per rule) and finds 4 of 7; all 7 appear only at 0.84 with 52,231 flagged pairs (97 per rule).
  There is no "finds them without flooding" threshold: the best usable point is 0.90 to 0.93 and it finds almost none.
- By rank instead of threshold: the partner is within the 10 nearest rules of one end for 4 of 7 pairs (ranks 1, 1, 3, 1); the other
  three are at 19, 31 and 64 (these are cross-form paraphrases, one is a one-line rule against a rule with a long
  explanation, e.g. pair 1 and pair 9c).
- Limits of this measurement: 7 hand-verified pairs only (the research report's cited line numbers had drifted); the
  notes here are whole statements, no `title`/`description` text and no `group`; ACE rule units are one rule each and
  may embed better. Not measured, so not claimed.
- Cost of a full audit on 548 notes: 0.33 s (50 pairs) to 1.1 s (all 149,877 pairs, 770 MB RSS when dumping everything).

Gaps:
- **G-I (paraphrase recall is weak, ACE must not promise it):** `implicit-replacement` and `near-pairs` are recall
  aids, not a duplicate gate. Mitigation for phase 4: the write-time check treats pkm's nearest list (Q6) as
  candidates for a judge (the agent or the `decide` capability), asks it per candidate, and states in the contract that
  paraphrase detection is advisory; exact structural checks (id, edges, lifecycle, scope) stay deterministic. Not
  blocking for phase 3; it lowers what phase 4 may claim. If the owner wants a paraphrase gate, that is a separate
  decision (a different embedder, or "ask pkm upstream" for a model/threshold option).
- **G-J (cap and floor):** `audit.implicit.max` defaults to 50 and silently cuts the list; `min` can only be set per
  profile. ACE passes its own profile with `max` raised if it ever lists pairs.

## Q6. Can a single new draft rule be compared to the in-force set (nearest search with the draft as query) without writing it into the tree first?

Probe on `q5-b`: the draft is a new text kept **outside** the vault (a string, or `$D/drafts/draft-rule.md`); it is the
paraphrase of cluster 1 ("Never choose the dispatch mechanism yourself; always run fgos dispatch decide ..."). Tree hash
(`find vault -type f | sort | md5sum`, `.git` excluded) taken before and after.

```text
$ . ./env.sh; unset PKM_NO_SEARCH; Q="Never choose the dispatch mechanism yourself; always run fgos dispatch decide before handing a task to another agent."; find q5-b/vault -type f -not -path "*/.git/*" | sort | md5sum; echo "--- search (draft text as the query), 5 nearest:"; time ./q.sh q5-b search "$Q" --limit 5 | python3 -I -c "
import sys,json
for i in json.load(sys.stdin)[\"items\"]: print(i[\"score\"], i[\"id\"], i[\"type\"])"; echo "--- locate (draft passage), 3 candidates:"; ./q.sh q5-b locate "$Q" --top 3 | python3 -I -c "
import sys,json
for c in json.load(sys.stdin)[\"parts\"][0][\"candidates\"]: print(c[\"rank\"], c[\"path\"])"; echo "--- material (draft FILE outside the vault), first 6 items:"; ./q.sh q5-b material $D/drafts/draft-rule.md | python3 -I -c "
import sys,json
for i in json.load(sys.stdin)[\"items\"][:6]: print(i[\"id\"], i[\"found_by\"], i[\"search_score\"])"; find q5-b/vault -type f -not -path "*/.git/*" | sort | md5sum
07e0e9af33109217a46827f353d95bfd  -
--- search (draft text as the query), 5 nearest:
0.97user 0.19system 0:00.72elapsed 161%CPU (0avgtext+0avgdata 579552maxresident)k
0inputs+112outputs (0major+164387minor)pagefaults 0swaps
0.997 core/instructions/agents-l216.md rule
0.979 core/instructions/core-skills-shared-coordination-driver-l44.md rule
0.941 core/instructions/core-skills-shared-capability-matching-l42.md rule
0.898 core/instructions/core-skills-shared-cook-worker-contract-l34.md rule
0.883 core/instructions/agents-l214.md rule
--- locate (draft passage), 3 candidates:
1 core/instructions/agents-l216.md
2 core/instructions/core-skills-shared-coordination-driver-l44.md
3 core/instructions/core-skills-shared-capability-matching-l42.md
--- material (draft FILE outside the vault), first 6 items:
core/instructions/core-skills-shared-catchup-self-recovery-l5.md search 1.0
core/instructions/agents-l216.md search 1.0
core/instructions/core-skills-shared-coordination-driver-l44.md search 0.982
core/instructions/core-skills-shared-plan-contract-l18.md search 0.97
core/instructions/core-skills-shared-capability-matching-l42.md search 0.944
core/instructions/skills-shared-executor-dispatch-fallback-l330.md search 0.921
07e0e9af33109217a46827f353d95bfd  -
```

Real-text recall of the same mechanism (`an6.py`: the text of one end of each verified Q5 pair is the draft, its own note dropped from the hits, rank of the partner among the 9 remaining hits):

```text
$ . ./env.sh; unset PKM_NO_SEARCH; python3 -I an6.py q5-b
  1: AGENTS.md:216 ~ capability-matching.md:42: partner rank when end a is the draft = None, when end b is the draft = None  (None = not in top 9)
  6a: capability-matching.md:56 ~ fgos-advise:171: partner rank when end a is the draft = 3, when end b is the draft = 3  (None = not in top 9)
  6b: capability-matching.md:27 ~ fgos-run:80: partner rank when end a is the draft = 1, when end b is the draft = 1  (None = not in top 9)
  6c: fgos-advise:141 ~ fgos-advise:171: partner rank when end a is the draft = 3, when end b is the draft = 4  (None = not in top 9)
  9a: coordination-driver.md:58 ~ fgos-fanout:102: partner rank when end a is the draft = None, when end b is the draft = None  (None = not in top 9)
  9b: coordination-driver.md:58 ~ fgos-cook:119: partner rank when end a is the draft = 1, when end b is the draft = 1  (None = not in top 9)
  9c: fgos-fanout:102 ~ fgos-cook:119: partner rank when end a is the draft = None, when end b is the draft = None  (None = not in top 9)
pairs found in top-3 of at least one direction: 4 top-5: 4 any top-9: 4 of 7
```

**Verdict Q6: PASS (mechanism), with the recall limit of G-I.** Three doors take a draft that is not in the tree, none
writes into the vault (identical tree hash before and after; `writes: none` holds): `pkm VAULT search "<text>"`,
`pkm VAULT locate "<passage>"` (candidates with rank, path, section excerpt) and `pkm VAULT material FILE` (the draft
as a file anywhere, including outside the vault). The draft text finds the existing rule at rank 1 (0.997, `agents-l216`) and the
`capability-matching` paraphrase at rank 3 (0.941). A query costs about 0.7 s wall (a process start plus the query; an
in-process `Session` as `fgos-documentation` uses it would skip the start). Over the 7 verified pairs the partner is in the top 3
for 4 and not in the top 9 for 3, the same 4 of 7 as the pairwise sweep (Q5).
- **G-K (hits carry no lifecycle):** a search hit has `id`, `title`, `type`, `score`, `snippet`, nothing about
  `lifecycle`, `valid_from` or conflicts. ACE intersects the hit list with `in_force` (Q2) so that draft, rejected and
  retracted rules are not offered as "the rule you duplicate". Mitigation: one more call per check; not blocking.
- A draft rule cannot be placed in the in-force comparison *as a node* (edges, `in_force --drafts`) without being
  written to the tree. Not needed: the duplicate question is answered by the text; the edge questions (Q3) run
  after the draft is written.

## Q7. Index build and query times on the current corpus; does any of it need the network?

Corpus: `q5-c` (a fresh copy of the Q5 fixture, 548 notes: the 7 current units + 541 real statements, about 150 KB of text).
Cold search index measured on a fresh vault `q5-c` (new vault path = new `search.db`), machine: this host, 1 process,
CPU only (no GPU), model `multilingual-e5-small` q8 ONNX.

Cold build of the search index, measured in one go (commands in the rerun section; times from that run):
- graph `index build` full: 146 ms wall (pkm's own `ms.total` 128 ms); no-change incremental: 47 ms wall (`ms.total` 14.8, `notes_read: 0`).
- `index sync` of all 548 paths (worker starts, text part applied): 0.77 s wall.
- vectors for all 548 notes ready (the `audit` stops answering "no note vectors yet"): 7.5 s after the sync started;
  `search.db` is 6.4 MB.

Warm timings (`q7.sh q5-c`, mean of 10 calls, each a fresh process, so process start is included):

```text
$ . ./env.sh; unset PKM_NO_SEARCH; ./q7.sh q5-c
 "mode": "full",
 "notes": "548",
 "ms": "{\"list\": 2.0, \"parse\": 55.8, \"edges_schema_views\": 8.0, \"total\": 67.7}",
graph FULL build wall: .099707054s
 "mode": "incremental",
 "notes_read": "0",
graph no-change incremental wall: .035656430s
24 ms per call (mean of 10, process start included): $D/q.sh q5-c in_force rule --as-of
21 ms per call (mean of 10, process start included): $D/q.sh q5-c validate --json
23 ms per call (mean of 10, process start included): $D/q.sh q5-c neighbors core/instructions/agents-l216.md
366 ms per call (mean of 10, process start included): $D/q.sh q5-c search never decide the dispatch mechanism yourself --mode
722 ms per call (mean of 10, process start included): $D/q.sh q5-c search never decide the dispatch mechanism yourself --limit
```

Network. Statically: pkm's own doc says the embed crate "does not call the network; downloading the model is `pkm-lifecycle`'s
job" (`crates/pkm-embed/src/model.rs` header). Dynamically: `strace -f -e trace=socket,connect` over a cold query that
starts the worker (the worker was stopped first) logged **zero** `socket`/`connect` calls
(`$D/q5-c/strace.log`: two `SIGCHLD` lines and nothing else). One query is a thin sample; the isolation attempt
(`unshare -rn`) was refused by this host, so a hermetic offline run was not possible.
The only network use in this probe was mine: the HF cache copy on this machine lacked `special_tokens_map.json`, so I fetched that
one 167-byte public file from the pinned commit with `curl` and checked its sha256 against pkm's manifest; the other four model files
were copied from the same HF cache and also match the manifest's sha256. No project data was sent.

**Verdict Q7: PASS.** A full graph build of 548 notes is about 0.15 s, an incremental no-op about 0.05 s; structural queries
(`in_force`, `validate`, `neighbors`) are 20 to 25 ms; a fulltext query 150 to 370 ms (two runs) and a hybrid (semantic) query
about 0.7 s per cold process; the search index for 548 notes builds in about 8 s from nothing. Nothing at runtime needs the network once
the model is on disk; the first install of the model does (`pkm-lifecycle`, pinned commit, sha256 checked).

Gaps:
- **G-H (search silently ignores gitignored notes):** pkm search honours `.gitignore` of the enclosing git repo
  (`respect_gitignore` defaults true; no profile key found; `OBSIDIAN_RESPECT_GITIGNORE=false` in the environment did not change
  it here). A rule file that is gitignored answers `"text": "excluded"` on `index sync` and never appears in search, with no
  error. For ACE the three rule roots are tracked, so it holds; but a rule under a gitignored path (or a worktree whose
  parent ignores the vault path, as `.fgos/` here) is invisible to Q5/Q6 duplicate checks. Mitigation: the ACE checker
  verifies that every rule file shows up in `index sync` (`applied`), or reads the roots with the graph only (which does not
  honour `.gitignore`); doctor row for the model and search index is `fgos-documentation`'s already.
- **G-L (model is a prerequisite, not a build output):** search needs the five model files at `$PKM_HOME/models/<id>@<commit>/`.
  `fgos-documentation` already owns this (`pkm-lifecycle` install); ACE reuses the same model dir, adds no second copy.

## Gaps and mitigations (all)

| id | gap | ACE-side mitigation | blocking? |
|---|---|---|---|
| G-A | frontmatter edge fields become edges only as wikilinks `"[[id]]"`; bare ids stay plain properties | phase 1: contract states the link form for `refines`, `depends_on`, `conflicts_with`, `related`, `superseded_by` (the current schema says "Id of the replacement rule", bare); the writer emits `"[[id]]"` | no |
| G-B | pkm node id is the tree-relative path, not the `id` field | ACE maps path to `id` (the `id` property) at the boundary | no |
| G-C | `in_force` drops a rule without `valid_from` silently (not in `items`, `excluded` or `ended`; `validate` clean) | phase 1: `valid_from` required; phase 3 checker rejects a rule without it and checks `items+excluded+ended` equals the note count | no |
| G-D | `valid_to` in the past moves a rule to `ended` whatever its lifecycle | contract: `valid_to` only with `lifecycle: replaced` (R12 already requires both together for replaced) | no |
| G-E | a bare-id link is invisible: no edge, no finding | phase 3 checker reads the raw frontmatter lists and requires the wikilink form | no |
| G-F | `[[x]]` resolves by file stem, not by the `id` field | contract: file stem equals `id`; checker enforces | no |
| G-G | nothing acts on `conflicts_with` between in-force rules | phase 3 checker: pair where both ends are in `in_force` at the same date (`neighbors --rels conflicts_with`) | no |
| G-H | search ignores gitignored notes silently (`index sync` says `excluded`) | checker asserts every rule file is `applied` in `index sync`; rule roots stay tracked | no |
| G-I | paraphrase recall is weak (4 of 7 verified pairs in the top 3, 1 of 7 at the default threshold) | phase 4 treats the nearest list as candidates for a judge and says "advisory"; deterministic checks stay deterministic | no for phase 3; limits phase 4 claims; owner may choose a paraphrase gate later |
| G-J | `audit.implicit.max` cuts at 50 silently | ACE passes its own profile if it lists pairs | no |
| G-K | search hits carry no lifecycle | intersect hits with `in_force` | no |
| G-L | the model is a machine prerequisite (5 files, one network fetch) | reuse `fgos-documentation`'s model dir and doctor row | no |

Not done and not claimed: unit-level (below-note) rules are out of scope (one file is one rule); a hermetic offline run
(the host refused `unshare -rn`); paraphrase recall with rule units written as title plus description (the corpus here
is raw statements).

## Rerun

Everything is under `.fgos/runtime/tmp/ace-pkm-probe/` (scratch, untracked). The probe binary exists at
`target/release/ace-pkm-probe`; to rebuild: `cd $D && cargo build --release` (same tag and features as
`packages/documentation/rust/Cargo.toml`; this needs the cargo git checkout of pkm `v0.7.0`, already in
`~/.cargo/git/checkouts/`). Pick a new suffix each time (the scripts refuse to overwrite and never delete anything):

```sh
cd <repo>/.fgos/runtime/tmp/ace-pkm-probe && . ./env.sh
S=r1                                  # a suffix never used before
export PKM_NO_SEARCH=1                # Q1 to Q4 need no search
./fixtures.sh $S                      # makes q2-$S q3-$S q3b-$S q4-$S q5-$S (q5 is the real-text corpus)
./q.sh q2-$S index build --json | grep -E '"notes"|schema_problems'
./q.sh q2-$S in_force rule --as-of 2026-11-26                          # Q2
./q.sh q3-$S index build >/dev/null && ./q.sh q3-$S validate --json | python3 -I vflat.py    # Q3
./q.sh q3b-$S index build >/dev/null && ./q.sh q3b-$S validate --json | python3 -I vflat.py  # Q3, G-F
./q.sh q4-$S index build >/dev/null && ./q.sh q4-$S validate --json && ./q.sh q4-$S neighbors core/instructions/conf-b.md   # Q4
# Q1: ./q.sh vault ... is not needed; the original is `$B vault index build --db $D/db/graph.db --full --json` on $D/vault

# Q5, Q6, Q7 need search (model files in $PKM_HOME/models/Xenova--multilingual-e5-small@761b726dd34fb83930e26aab4e9ac3899aa1fa78/,
# five files; four from ~/.cache/huggingface/Xenova/multilingual-e5-small, special_tokens_map.json fetched once from the pinned
# commit; sha256 as in pkm-embed/src/model.rs)
unset PKM_NO_SEARCH
git -C q5-$S/vault init -q                                             # own git root, else search excludes every note (G-H)
./q.sh q5-$S index build >/dev/null
( cd q5-$S/vault && $B $PWD index sync $(find core components domains -name '*.md') --wait 300s >/dev/null )
for i in $(seq 1 30); do ./q.sh q5-$S audit --out q5-$S/a.jsonl 2>q5-$S/a.err >/dev/null; grep -q "no note vectors\|not ready" q5-$S/a.err || break; sleep 2; done   # vectors take about 8 s
mkdir -p prof-all && cp vault/.pkm/ace.yaml prof-all/ && { cat vault/.pkm/profile.yaml; printf 'audit:\n  implicit: {min: 0.5, max: 1000000, unit_min: 0.85}\n'; } > prof-all/profile.yaml
./q.sh q5-$S audit --profile $D/prof-all/profile.yaml --out $D/q5-$S/audit-all.jsonl
python3 -I an5.py q5-$S               # Q5 sweep and ranks
python3 -I an6.py q5-$S               # Q6 draft-as-query recall
./q7.sh q5-$S                         # Q7 timings
$B $D/q5-$S/vault index stop          # stop the index worker when done
```

Files: `env.sh` (paths), `mkvault.sh`, `q.sh`, `fixtures.sh`, `gen-corpus.py`, `vflat.py`, `an5.py`, `an6.py`, `q7.sh`, `cap.sh`.
Fixture vaults used in this report: `q2-d`, `q3-y`, `q3b-w`, `q4-w`, `q5-b`, `q5-c`.
