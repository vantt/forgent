# fgos doc locate recall with pkm v0.7.0 inside fgos

Date: 2026-11-24. Lead `lead:DOCOS` on design-lap. Branch `docos/locate-eval` at `9e0127b10`.

## 1. Result

- **The engine did not regress.** The same build, run over the 2026-11-12 corpus (692 maintained documents, history and verification left out), reproduces the baseline exactly: translated notes 91.7% / 95.8%, right section first 14 of 23; short openings 67.0% / 92.0%.
- **On today's corpus the gate is not met for the translated notes.** With an index that holds no history, translated notes reach 83.3% / 91.7% against 91.7% / 95.8%; short openings reach 65.9% / 92.0% and pass.
- **Two causes, both outside the engine:**
  1. pkm's index worker ignores `vault.exclude`: it embeds every Markdown file under the vault (42,169 chunks, 362 MB, 35 min) and drops out-of-scope notes only from the answer. The 1,640 history documents then crowd the candidate pool. Short openings fall to 79.5% at 10 with them in the index and recover to 92.0% without.
  2. `docs/distillery/` (reports about other projects) and one new documentation page now outrank the expected unit in 3 translated-note cases. The baseline corpus left distillery out.
- **Two fixes are on the branch:** `fgos doc index status --wait` starts the worker it waits for, and every index state names an fgos verb instead of a `pkm` command; the rendered profile excludes `past-state` folders (`history`, `proposals`), as document-identity spec 5.4 requires. The exclusion takes full effect only when pkm's worker honours it.

## 2. Method

- **Build:** fgos host from `docos/locate-eval` through `npm run fgos:dev`, pkm `v0.7.0` (`d488fe09`), static ONNX Runtime 1.31.1, model `multilingual-e5-small` fetched by the doctor fix. Heavy steps under `flock /home/vantt/projects/.doc-work/doc-heavy.lock`; the index waits ran outside it so other sessions could land.
- **Command:** `fgos doc locate --eval <gold> --json` on a ready index, on the two committed gold files in `docs/platform/documentation/subcomponents/document-identity/verification/recall/`. `vi-queries-en.json` is not in pkm's gold format and was not measured.
- **Corpora, each with a fresh index:**

| Run | Corpus | Documents | Chunks | `search.db` | Index time | Worker peak RSS |
|---|---|---|---|---|---|---|
| A | today's `docs/`, whole | 2,821 | 42,169 | 362 MB | 35 min | 590 MB |
| B | 2026-11-12 snapshot (`977e3f9e`), maintained only | 692 | 11,676 | 104 MB | 9 min 18 s | 580 MB |
| C | today's `docs/` without `history/` and `proposals/` | 1,042 | 23,100 | 198 MB | 19 min 27 s | 583 MB |

  Run A was repeated on a fresh copy with the profile's new exclusion: the chunk count and every recall figure were identical, which is how cause 1 was found.

## 3. Numbers

| Gold | Gate @3 / @10 | Baseline (pkm `00c1473`) | B: snapshot | A: today, history in index | C: today, no history |
|---|---|---|---|---|---|
| translated notes (24 owned) | 91.7% / 95.8% | 91.7% / 95.8% | **91.7% / 95.8%** | 83.3% / 87.5% | 83.3% / 91.7% |
| right section first | — | 14 / 23 | **14 / 23** | 13 / 21 | 13 / 22 |
| short openings (88) | 65.9% / 90.9% | 67.0% / 92.0% | **67.0% / 92.0%** | 67.0% / 79.5% | 65.9% / 92.0% |

Translated-note cases whose rank changed between B and C:

| Case | B | C | Ranked above the expected unit in C |
|---|---|---|---|
| `vi-en-03-g04` | 1 | 2 | `docs/platform/documentation/operations/how-a-document-is-written.md` (new since 11-12) |
| `vi-en-16-g22` | 2 | 4 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md`, `docs/distillery/sources/claudekit-engineer.md`, one knowledge page |
| `vi-en-17-g23` | 1 | outside 10 | two `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-*.md`, three knowledge/explanation pages |

The two recall misses of the baseline (`vi-en-10`, `vi-en-13`) are unchanged in B.

## 4. Costs

- Index: see the corpus table; the worker's peak RSS stays near 580-590 MB whatever the corpus size.
- pkm's `etaS` is not trustworthy during the first embedding: it reported 732 s with about 70 min left.
- Lone `locate` latency was measured through `npm run fgos:dev`, which adds a cargo check and a dev-host copy to every call (warm 22-34 s, cold 53 s); these are not comparable with the baseline's 7 s / 10 s and are not a finding. A release-binary measurement belongs with the release check.

## 5. What follows

1. **pkm:** the search worker should index only the profile's vault scope (`include`/`exclude`). Until it does, every fgOS install embeds its history for nothing (about 19,000 extra chunks and 16 minutes on this corpus) and history still crowds answers.
2. **Corpus scope:** `docs/distillery/` describes other projects; three of today's misses come from it (decided in section 6).
3. **Gate:** the gold set was cut on the 2026-11-12 snapshot; a regression gate that must stay repeatable needs a pinned corpus (run B's recipe) next to the live-corpus figure.

## 6. Owner decisions (2026-11-24)

- The gate runs on the pinned 2026-11-12 corpus (run B); the live-corpus figure is reported, not gated.
- `docs/distillery/` leaves locate's corpus with the `past-state` folders (rendered profile, document-identity spec 5.4).
- The pkm worker's scope bug is filed as [vantt/pkm#2](https://github.com/vantt/pkm/issues/2).

## 7. Rerunning the gate

From a checkout with a built host (`W` is the checkout, `S` a scratch folder):

```sh
mkdir -p "$S/raw" "$S/proj/docs" "$S/proj/.fgos"
git -C "$W" archive 977e3f9e97ededecc52fa78f3b4ba66babe572e7 docs | tar -x -C "$S/raw"
(cd "$S/raw/docs" && find platform knowledge explanation how-to tutorials reference -name '*.md' \
   | grep -v '/history/\|/verification/' > "$S/list.txt" && rsync -a --files-from="$S/list.txt" . "$S/proj/docs/")
cd "$S/proj" && git init -q .
G="$W/docs/platform/documentation/subcomponents/document-identity/verification/recall"
fgos doc index status --wait 1800 --json     # repeat until state is ready
fgos doc locate --eval "$G/locate-gold-vi-en.yaml" --json
fgos doc locate --eval "$G/locate-gold-short.yaml" --json
fgos doc index stop
```

692 documents; expect 91.7% / 95.8% and 67.0% / 92.0%.
