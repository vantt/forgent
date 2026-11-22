# pkm roles probe: can pkm compute fgOS's decisions in force?

Date: 2026-11-22 (Asia/Saigon). Read-only probe. Repo main at `b0a4b35a4`; pkm binary from `vantt/pkm` main
`00c1473` (`gh api` shows main is still `00c1473`, compare ahead_by 0). Every number below comes from a command run
in this probe; raw outputs are listed in the "Artifacts" section.

## 1. Verdict

**Direction (c) passes with conditions.** It does not work on today's documents. With the role fields written as a
field, it gives the right answer. The conditions are below.

- **As-is (prose only, run A): fails.**
  - 14 decision/RUL/law units end. Only 5 of them are correct full replacements.
  - 5 are partial supersessions that pkm turns into full endings, L3 among them.
  - 4 are false: 2 are prose that only describes supersession, 1 is a misread table row, 1 resolves to the wrong `RUL101`.
  - `--as-of` has no effect, because no unit carries a date.
  - Of 30 `stale-citation` findings, 0 can be acted on.
- **With direction (c) fields on a copy (run B): correct, for what the fields cover.**
  - The set in force has 280 units today, and 3 units end. All 3 are right.
  - `--as-of` separates the two sides of a replacement, even to the second. On 2026-10-18 at 14:40Z, D-ADR0061 is in force. D-ADR0062 starts at 14:42:56Z and replaces it.
  - The cost is 40 heading ids rewritten, 2 anchor headings added, and 45 `valid_from` and 11 relation fields, in 7 files.
- **What makes (c) only "with conditions":**
  1. fgOS must write ids in one unambiguous form. Today, bare `####` headings mix two numbering systems, D-ADR numbers and decision-file numbers. 5 numbers name two different decisions, and 6 D-ADR numbers (0055 to 0060) resolve only to the wrong decision.
  2. fgOS must record partial versus full replacement. The event store has only `supersedes` and `touches`. I classified the 17 relation events by reading them: 8 partial, 3 full, 2 with a target that cannot be resolved, and 4 `touches`.
  3. Several pkm changes are needed (section 6). The biggest is that an amendment at unit level, and a target smaller than a unit (a law clause), have no effect on the set in force.
- **pkm version.**
  - Unit-level `in_force` and `implicit-replacement` exist only on pkm main, after v0.3.1: commits `449b689` and `79bf41b`, which no tag contains.
  - v0.3.1, the tag fgOS pins in `docs/platform/documentation/spec.md:83`, already has `units`, `mentions`, `mention_rels`, `id_scope`, R16, R17 and note-level `stale-citation`.
  - So the set in force needs **main, or a v0.4.0 cut from it**. v0.3.1 is not enough.

## 2. Method

1. **Vault copy.** 69 files, 3.9 MB, rsynced to the scratch vault: `docs/platform/platform-foundations.md`, `architecture-map.md`, `docs/decisions/index.md`, `AGENTS.md`, every `docs/platform/**/decisions/*.md` and every `docs/platform/**/spec.md` outside `history/`.
2. **Pack and profile.**
   - One type, `decision_holder`, with `id_scope: holder` and 4 unit patterns:
     - decision heading `^(?:D-ADR)?(?P<id>0\d{3})`;
     - law heading `L1`–`L10`;
     - RUL bullet `**RULn`;
     - item-local `D\d+` table row.
   - Bare-code mentions: `D-ADR`, `ADR`, bare `00dd`, `RUL`, `L\d`, `D\d`.
   - `mention_rels` that map fgOS's own relation wording:
     - `amends`: "supersede một phần", "thay mục N của", "supersedes the … clause of";
     - `narrows`: "thu hẹp", "mở rộng", "narrows", "refines", "adds to";
     - `replaced_by_text`: "Superseded by", "ĐÃ BỊ THAY … bởi";
     - `replaces`: "supersede", "thay thế", "Supersedes:".
   - The documents get their types from paths in the profile. No document was edited in run A.
3. **Run A** (as-is): built the index, then ran `in_force decision_holder --units` at 2026-11-22 and 2026-10-01, `audit` (stale-citation) and `validate --rule R16,R17`.
4. **Run B** (direction (c)): `build-vault-b.py` copies the vault and writes, on the copy only:
   - `D-ADR####` heading ids where a bare heading is a D-ADR number (matched by title against the event store);
   - an anchor heading for D-ADR0055 and D-ADR0056, which have no heading anywhere;
   - `[valid_from:: <event ts>]` and `[replaces:: X]` or `[amends:: X]` from the 17 scoped relation events.

   Pack B reads relations only from those fields, not from prose.
5. **Implicit replacement:** ran `audit` with search (e5-small model) on vault A.
6. **fgOS check:**
   - ran `scripts/check-decision-citation-drift.mjs` read-only;
   - listed its findings over the same files by calling its exported `findCitationDriftFindings` and `findCitationFormatFindings` (`drift-findings.mjs`).

Event-store side: decisions come from `fgos list --all --json`, which is read-only (5570 decision records, 53 with a `scope`). Event hashes come from the export of 2026-11-13.

## 3. Numbers

### 3.1 Units and ids (run A)

| Measure | Value |
|---|---|
| Units found | 281 (90 heading: decisions and laws; 191 RUL bullets); 0 `D\d` table rows in this file set |
| Keys present in more than one holder | 58: 49 RUL keys (of 110 distinct RUL keys) and 9 decision numbers |
| Decision numbers in two holders, same decision (duplicated narrative) | 4: 0070, 0072, 0074, 0076 (runner decisions plus workflow or seat-binding spec) |
| Decision numbers in two holders, **different decisions** | 5: 0032, 0035, 0061, 0062, 0073 (D-ADR number versus decision-file number) |
| R16 (same code twice in one holder) | 3 keys, all real: RUL103 duplicated verbatim (runner spec lines 210 and 238); `0002` heading duplicated (retired-decision-history lines 28 and 35); RUL10 used for 2 add-on notes ("bổ chú 3/4", work-state spec lines 1059–1061), which are amendments written under the same id |
| R17 (bare code missing or ambiguous) | 110 deviations in 28 notes; 106 of the missing ones are item-local `D\d` |

Scoped decisions against units: the 53 scoped events carry 48 distinct D-ADR numbers, and 4 have no D-ADR id (RUL40 re-scope, tsk-53j wontfix, D7-revised, one "Vocabulary" without an id).

- 42 of the 48 resolve to the right heading. 5 of those 42 also share their key with a different decision in another holder.
- **6 resolve only to a wrong unit:** D-ADR0055 to D-ADR0060. Their numbers match runner decision-file headings `### 0055` to `### 0060`, such as "Panel: khác họ provider" and "`--seats`".
- 12 D-ADR ids appear in the docs but are not defined by any decision event: 0037, 0042, 0054, and 0074 to 0082. The event store is already not the complete record of acts.

### 3.2 The set in force (run A, as-is)

`in_force --units`: 266 units in force and 15 entries ended. Entries are the same at 2026-11-22 and 2026-10-01, because no unit has a date. The 15 entries cover 14 distinct units; `0002` is counted twice because of its duplicated heading. Each one, judged by reading:

| Ended unit | Ended by (pkm) | Judgement |
|---|---|---|
| PF 0036 | 0054, RUL11, AGENTS.md | correct |
| PF 0061 | 0062, RUL104 | correct (prose-only case D-ADR0062) |
| runner 0023 | `docs/decisions/index.md` (note) | relation correct, source wrong (should be 0025) |
| runner RUL76 | RUL77 | correct |
| work-state 0006 | its holder note, no unit | relation correct (0024), source lost |
| PF **L3** | index.md, event-store spec | partial (D-ADR0055 replaces clauses 1 and 4) shown as full |
| runner 0026 | index.md | partial (0028 and 0029 change terms and clauses) shown as full |
| runner RUL69 | RUL72 | partial ("ĐÃ BỊ THAY MỘT PHẦN") shown as full |
| runner RUL80 | seat-binding 0072 | partial ("Supersede (một phần…)") shown as full |
| work-state 0002 | its holder note | partial ("Một phần đã supersede bởi 0012") shown as full |
| arch-map 0010 | arch-map note | **false**: "decision record mới supersede 0010" describes how to change the map |
| work-state 0012 | arch-map note | **false**: a table cell "(supersede record ADR0012; …)" |
| workflow 0070 | workflow spec note | **false**: "một record mới supersede D-ADR0070" (hypothetical) |
| runner **RUL101** | packaging-distribution RUL108 | **false, wrong target**: RUL108 replaces packaging-distribution's RUL101 (vendored YAML). That bullet no longer exists, so pkm resolves to the only other `RUL101`, runner's dispatch-lock rule, which is still in force |

Tally: 5 correct (2 of them with the wrong source), 5 partial shown as full, 4 false.

Relations detected but **without effect on the set in force**: 18 `amends`, 13 `narrows` and 21 `replaced_by_text`. pkm's `unit_state` reads only `replaces`.

### 3.3 Hand measurements against pkm

| Hand measurement | pkm result |
|---|---|
| Index has no status column | pkm gives one per unit: `items`, `ended` and `replaced_by` |
| 80 of 699 decisions declare a relation | Current view: 455 of 4688 decisions (in `decisionsById`) carry a `relation` field, 176 of them other than `none`; 17 of 53 scoped. Not measured: how 80 of 699 was counted |
| 5 of 7 platform relations are partial | Found as partial in prose: 0055→L3 (clauses 1 and 4), 0056→0043, 0071→0051, 0028/0029→0026, 0012→0002, 0070→0048/0049, 0072→RUL80. Only the wording-based run A sees the partial kind, and that kind has no effect on the set in force |
| Prose-only: D-ADR0055, 0056, 0062, 0033 | all 4 detected. **0062** ends 0061 correctly. **0055** ends all of L3 (wrong, partial) and its `Superseded by D-ADR0055` text resolves to runner decision-file 0055 (wrong). **0056**: "ĐÃ BỊ THAY bởi D-ADR0056" resolves to runner decision-file 0056 `--seats` (wrong). **0033**: detected as `narrows` 0026, no effect |
| Targets that are law clauses or hashes | A law can be a target (L3 is a heading unit), but only as a whole; "clauses 1 and 4" cannot be addressed. Event-side hash targets are event `h` prefixes: 3 of 7 resolve in the 11-13 export (540326f7→D-ADR0043, 82ebd4f2→D-ADR0055, 4da3c65a→D-ADR0057); ae461c8b, 43b60f49, f87c11eb, d3dbe7f5 do not. pkm cannot read either kind; the writer has to translate them to ids |

### 3.4 Run B (direction (c) fields)

| `--as-of` | In force | Ended | Not yet |
|---|---|---|---|
| 2026-11-22 | 280 | 3: D-ADR0061←0062, D-ADR0023←0025, D-ADR0025←0030 | 0 |
| 2026-10-18T14:40:00Z | 276 | 2 (D-ADR0061 in force, D-ADR0062 not yet) | 5 |
| 2026-08-17T14:15:31Z | 265 | 1 (D-ADR0025 in force, D-ADR0030 not yet) | 17 |
| 2026-08-01 | 237 | 0 | 46 |

- All 3 endings are correct, and the 3 false and 5 partial endings of run A are gone.
- But the 8 `amends` fields still have no effect. L3, D-ADR0026 and D-ADR0043 show as plainly in force, with no marker that they were amended.
- `valid_from` from events is the recording time. All 36 migrated decisions (0001 to 0036) carry 2026-08-17. So `--as-of` before the migration day returns nothing, which is wrong for history; the dates after it are real.
- Units without a date are in force at every date: 191 RULs, 10 laws and the decision-file headings.
- Side effect: once headings read `D-ADR####`, prose citations in other forms stop resolving. In R17, run B has 46 missing old-form `ADR####` mentions, 108 missing bare `00dd` mentions and 24 missing `D-ADR` ids that have no anchor. R17 goes from 110 to 190.
- `stale-citation` in run B: 5 findings, all from the index ledger or from AGENTS.md prose about the relation itself. 0 can be acted on.

### 3.5 `stale-citation` against fgOS's citation-drift check

- **fgOS** (`check-decision-citation-drift.mjs`, read-only run): "no new findings (60 baselined)". Over the same 66 platform files: 0 dead-framing findings, plus 57 format findings (48 `d-local-outside-home`, 9 `bare-citation`).
  - The dead-framing family loads its superseded map from `docs/decisions/NNNN-*.md` frontmatter. That corpus was retired, so the map is empty and **this family can never fire today**.
  - The checked-in baseline has 204 entries: 173 d-local and 31 bare-citation, 0 dead-framing.
- **pkm run A:** 30 stale citations, by cited unit:

  | Cited unit | Count | Status |
  |---|---|---|
  | L3 | 14 | partial, not stale |
  | RUL101 | 6 | wrong target |
  | RUL80 | 6 | partial |
  | 0012 | 3 | false |
  | 0010 | 1 | false |
  | 0026 | 1 | partial |
  | 0036 (index row) | 1 | ledger |
  | 0006 (index row) | 1 | ledger |

  None can be acted on. The two tools agree: today there is no real citation of a decision that has been replaced.
- **Overlap on format:** pkm's R17 on missing item-local `D\d` hits 39 of fgOS's 43 `d-local-outside-home` places, 91%.
  - fgOS-only: 4 places at agent-mailbox spec line 606. pkm reads `D1`–`D4` there differently; the cause was not checked.
  - pkm-only: 22 places, mostly `architecture-map.md`, which fgOS does not scan.
  - pkm has no gloss rule, so fgOS's 9 `bare-citation` findings have no pkm counterpart.

### 3.6 Implicit replacement

I ran `audit` with search on vault A. The first embedding of 69 notes took about 33 polls of 5 seconds.

- **Result: 0 `implicit-replacement` proposals.** It also gave 60 `near-pairs` and the same 30 `stale-citation` findings.
  - The zero comes from how the signal is built, not from the data. `structure::audit::implicit_replacements` pairs **notes** of one type that both record a lifecycle (`status` or `valid_from` at note level).
  - fgOS decisions are units inside notes, and no holder note has a status, so no pair is a candidate.
- With true hits and false hits both at 0, I could not judge precision.
- The near-pairs are whole documents, such as AGENTS.md with the doc-checks spec, or index.md with the runner decisions file. They are not decision pairs.
- Making this signal useful for fgOS needs unit-level vectors (request 8). Adding a status to holder notes would only pair whole area specs.

Worker started by this run: stopped with `index stop` after the run (`worker_running: false`).

## 4. False positives and false negatives, with examples

**False positives:**

1. Prose about supersession matched as an act: `architecture-map.md:721` "Đổi bản đồ = decision record mới supersede 0010"; `workflow/spec.md:666` "một record mới supersede D-ADR0070".
2. A partial relation read as full: `platform-foundations.md:49` says "Clauses 1 and 4 superseded by D-ADR0055", and L3 ends entirely. 14 stale citations of L3 follow from that.
3. A reused id resolving to the wrong holder: RUL108 "supersedes RUL101" lands on runner's RUL101 (dispatch lock). D-ADR0055 and D-ADR0056 land on runner decision-file 0055 and 0056.
4. A projection treated as an author: index.md rows become the replacing note for L3, 0023 and 0026, because `mention_rels` apply to every type in the vault.
5. Law ids clash with local labels: in a sample of 12 `L\d` mentions I read, 3 were local labels, such as "**L3** a send judges liveness" and "section 7a L3".

**False negatives:**

1. Reverse wording cannot express lifecycle. "Superseded by X" and "ĐÃ BỊ THAY bởi X" (21 links) are written in the replaced unit; pkm can only declare relations forward.
2. Lost source attribution:
   - A relation written under a sub-heading of a decision (`#### Quyết định`) is attributed to the note, not to the decision. The cause is that `unit_state` matches `l.src_span LIKE su.span || '/%'`, but nested sections are addressed with `#`.
   - Example: "Quyết định này SUPERSEDE 0002" inside 0012's `#### Quyết định`.
3. Ids inside inline code are skipped, which is by design. 135 inline-code spans in the vault are exactly an id, such as `` `0032` `` or `` `RUL80` ``.
4. A missing anchor: D-ADR0055 is a bold paragraph, not a heading or bullet, and 0056–0060 have no anchor at all. pkm has no `in: paragraph` unit.
5. An amendment written as a second bullet with the same id (`RUL10 … bổ chú 3`) is reported as an R16 duplicate, not read as an amendment.

## 5. What fgOS would have to add

| Item | Size on this vault |
|---|---|
| Pack file (scope type, units, mentions, relation fields) | 1 file, about 30 lines (`fgos-decisions-pack-b.yaml`) |
| Write ids in one form: `D-ADR####` in headings; never a bare number for a D-ADR | 40 headings in 5 files (decision-file headings keep `####`, or get their own prefix) |
| Anchor heading for each decision with no unit | 2 added in run B; 6 needed (D-ADR0055 to 0060), plus the 12 D-ADR ids that exist only in docs, which need events if (c) holds that events are the record of acts |
| `fgos decision` writes `[valid_from:: ts]` in the unit section | 45 units |
| `fgos decision` writes `[replaces:: id]` or `[amends:: id]` | 11 from 17 relation events; the writer has to choose replace or amend (the event has only `supersedes`) and translate hash targets to ids (2 cannot be resolved today) |
| Normalize citations, or ask pkm for aliases | 46 old-form `ADR####` and 108 bare `00dd` mentions stop resolving once headings carry `D-ADR` |
| Fix real defects R16 found | RUL103 duplicate, duplicated `0002` heading, RUL10 add-on notes (convert to `amends`) |
| Decide who records dates for the migrated corpus | 36 decisions share 2026-08-17 |
| Keep projections out of relation sources | exclude `docs/decisions/index.md` from the vault, or have pkm scope `mention_rels` per type |
| Retire or rewire the dead-framing family of `check-decision-citation-drift.mjs` | its superseded map is empty for good |

Total in run B: 7 files touched, 100 edits (40 ids, 2 anchors, 45 dates, 11 relations, plus pack and profile).

## 6. Requests for pkm issue #1

1. **Unit-level `amends` in `in_force`.** Read `[amends:: X]` (or `mention_rels.amends`) into `unit_state`, and return `amended_by` on items, as note level already does.
2. **Reverse relation by wording.** Add a `mention_rels` name meaning "the containing unit is replaced by `id`", for "Superseded by X" and "ĐÃ BỊ THAY bởi X" (21 links here).
3. **Attribution through sub-headings.** In `unit_state`, also match source spans under the unit's section addressed with `#`. Today `LIKE su.span || '/%'` misses `#### Quyết định` children.
4. **Clause-level target.** Address part of a unit, such as `L3#1` or a block id, so a partial supersession ends only that part. Otherwise a partial supersession has to be `amends`, with no effect on the set.
5. **Id aliases or normalization** in the pack, for example `ADR(\d{4})` → `D-ADR$1`, so old citations resolve without rewriting the documents.
6. **Scope `mention_rels` by source type,** so a projection (index.md) or a citing note cannot declare relations.
7. **`in: paragraph` units** led by a bold id (`**D-ADR0055 (…)**`).
8. **`implicit-replacement` over units,** not only notes. Every fgOS decision is a unit, so the note-level signal cannot see any decision pair.
9. **A release:** cut v0.4.0 with `in_force --units` and `implicit-replacement`, so fgOS can move its pin from v0.3.1.

## 7. Not measured, and open questions

**Not measured:**

- Item-level decisions in 268 `CONTEXT.md` files (out of scope).
- How the hand count "80 of 699" was taken. The current view has 4688 decisions; 455 of them (in `decisionsById`) carry a `relation` field, 176 of them other than `none`.
- Whether any RUL or law has a real "valid_from".
- Runtime and memory of pkm on the full docs tree; this vault built in 0.24 s.
- Why pkm misses agent-mailbox line 606 `D1`–`D4`.

**Process note:** my first, unlocked run of the fgOS drift script triggered a cargo build of the native addon (about 1.5 min of CPU, outside `doc-heavy.lock`) before it printed anything. The rerun was under the lock. No tracked repo file changed (`git status` clean apart from this report).

**Open questions for the owner:**

1. Do decision-file numbers (`fgos identity mint decision-file`) keep the bare `####` heading form? If yes, D-ADR headings must always carry the prefix. Otherwise the two numbering systems need different prefixes.
2. Does `fgos decision --relation` grow an `amends` value, so the writer records partial versus full instead of a reader guessing?
3. Should the 12 D-ADR ids that exist only in docs (0037, 0042, 0054, 0074–0082) get decision events, so (c)'s "events hold the act" is true?
4. Which `valid_from` should the 36 migrated decisions carry: the migration date, or their original dates from the retired corpus?

## 8. Artifacts

Scratch folder `/tmp/claude-1000/-home-vantt-projects-forgentX/f3456e8e-44f8-4048-8d93-95c0ef5a5a34/scratchpad/roles-probe/`:

- Packs and profiles: `fgos-decisions-pack.yaml` (run A, prose relations), `fgos-decisions-pack-b.yaml` (run B, fields only), `profile.yaml`, `profile-b.yaml`.
- Scripts: `env.sh`, `analyze.py`, `build-vault-b.py`, `drift-findings.mjs`.
- Vaults: `vault/` (copy) and `vault-b/` (copy with (c) fields).
- Run A outputs: `out/graph-a.db`, `out/a-inforce-2026-11-22.json`, `out/a-inforce-2026-10-01.json`, `out/a-audit.jsonl`, `out/a-audit-search.jsonl`, `out/a-validate-r16-r17.json`, `out/a-validate-r16.txt`, `out/a-validate-r17.txt`, `out/a/rels.tsv` (every relation mention with its line), `out/a/units.tsv`, `out/a/dup-units.tsv`, `out/a/summary.json`, `out/a/scoped-vs-units.txt`.
- Run B outputs: `out/graph-b.db`, `out/b-cost.json`, `out/b-inforce-*.json`, `out/b-audit.jsonl`, `out/b-validate-*`, `out/b/`.
- Event-store side: `out/list-all.json`, `out/scoped-decisions.jsonl`, `out/dadr-docs.txt`, `out/dadr-events-defined.txt`.
- fgOS check: `out/fgos-citation-drift.txt`, `out/fgos-drift-findings.json`.
