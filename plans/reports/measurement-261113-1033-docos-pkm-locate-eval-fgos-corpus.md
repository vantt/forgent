# pkm 0.2.1 locate on the fgOS corpus

Date: 2026-11-13. Lane: `lead:DOCOS`. Measures `pkm locate` from [pkm `v0.2.1`](https://github.com/vantt/pkm/issues/1#issuecomment-6841976682) against the recall gold set of [the 2026-11-12 measurement](measurement-261112-1314-docos-document-identity-recall.md), before fgOS links `pkm-core` (build step 3 of the [documentation area map](../../docs/platform/documentation/spec.md#4-build-order)).

## 1. Result

- **Document recall is unchanged from OHS alone.** pkm's locate returns the same ranking as calling OHS directly: 91.7% at top 3 and 95.8% at top 10 for translated developer notes, 65.9% and 90.9% for short document openings. Graph expansion neither helped nor hurt at top 10.
- **The right section comes first in 13 of 23 measurable cases (56.5%).** One more is right but reported in a different heading format, three differ only between a document's title block and one of its subsections, and six pick a different section of a long document.
- **Cost:** one cold `locate` call took about 27 s, mostly OHS start-up. Inside one session, a case took about 3.5 to 4 s on CPU. fgOS should keep OHS alive for the session when it links `pkm-core`.

## 2. Method

- **Corpus and index:** the same corpus copy (691 documents, taken 2026-11-12) and the same OHS index (`v0.17.2-vantt.9`, `multilingual-e5-small`, `ohs-lang-vi`) as the earlier measurement, so the numbers compare directly.
- **pkm:** `v0.2.1`, installed from its tag with cargo 1.99.0. Its own index went into a scratch database (`--db`).
- **OHS database:** the CLI has no option to choose OHS's database, so `OBSIDIAN_DB_PATH` was set in the environment and inherited by the OHS child. Without it, OHS would have used the default database it shares with the owner's own `ohs` server. The library has the option (`OhsOptions.db`); the gap is only in the CLI.
- **Profile:** [locate-profile.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-profile.yaml). One `locating` facet `area`, taken from `docs/platform/{value}/**` or frontmatter, with the 33 area folders of that copy; `writes: none`; body links as edges. `profile check` reports 691 notes, S1 = 505 (no `area`: user notes and root documents, as expected) and S2 = 0.
- **Gold files**, in the format proposed to pkm and accepted in 0.2.1:
  - [locate-gold-vi-en.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-vi-en.yaml): the 30 developer notes translated to English (24 with an owner group, 6 without), with the right section of each expected document.
  - [locate-gold-short.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-short.yaml): 88 leave-one-out cases. The query is a document's title and first lines (up to 600 characters), the other members of its group are expected, and the document itself is excluded.
- **Section labels:** an independent agent read every expected document and named the section that carries each note, without seeing pkm's results. It labelled 60 documents, 1 of them null (the document does not carry the note), and flagged 5 cases as genuinely ambiguous. A script checked that every label is a heading line in its file.

## 3. Numbers

| Gold | Cases | recall@3 | recall@10 | OHS alone (2026-11-12) |
|---|---|---|---|---|
| translated notes | 24 owned, 6 no owner | 91.7% | 95.8% | 91.7% / 95.8% |
| short openings, leave-one-out | 88 | 65.9% | 90.9% | 65.9% / 90.9% |

Right section first, translated notes: 13 of 23 cases. The 24th owned case has its first expected hit outside the top 10.

| The 10 cases not counted right | What pkm returned against the label |
|---|---|
| `vi-en-05` | the right section, but its heading path is `Use … > When to use it`, without the `#` marks, because the title comes from frontmatter; the label `## When to use it` does not match the string |
| `vi-en-08`, `vi-en-19` | a `##` subsection; the label is the title block (the text before the first `##`) |
| `vi-en-15` | the title only; the label is a `##` section (flagged ambiguous by the labeller) |
| `vi-en-04`, `vi-en-09`, `vi-en-11`, `vi-en-12`, `vi-en-16`, `vi-en-22` | a different `##` section of the right document; the documents are 877 to 6,753 tokens long, so OHS splits them into several chunks; `vi-en-16` was flagged ambiguous |

## 4. What follows

- **For fgOS:** document recall meets the 90% bar at top 10 and matches the earlier measurement, so build step 3 can start on `v0.2.1`. The right-section rate matters less for fgOS's first use: a claim unit is a whole user note, and growing it adds an evidence line, not text inside a chosen section. For composite documents the writer opens the document anyway.
- **For pkm** (reported on the issue):
  1. Heading paths come in two formats, with and without `#` marks. That affects eval matching and any consumer that compares headings.
  2. In 6 of 23 cases the word-overlap section choice picks another section of a long document. That is the condition pkm set for the OHS top-k-chunks patch ("the right section sitting in another chunk of a long document"), but this run cannot show which chunk OHS ranked best. An `explain` field naming the OHS chunk would settle it.
  3. The CLI cannot choose OHS's database.

## 5. Unresolved

- Whether the 6 section misses come from OHS's chunk choice or from pkm's word-overlap choice inside the hit document.
- A second labeller for sections; 5 of 24 cases were flagged ambiguous by the first.
