# pkm main (Rust search) locate on the fgOS corpus

Date: 2026-11-21. Lane: `lead:DOCOS`. Re-measures `pkm locate` on pkm `main` at commit `00c1473` (untagged main, after `v0.3.0`; the binary reports version `0.3.0`, git sha `00c147385f99`). This build searches with the in-binary Rust crates (`pkm-search`, `pkm-embed` with ONNX Runtime, `multilingual-e5-small`), not OHS. The baseline is [the 2026-11-13 run on pkm `v0.2.1` with OHS](measurement-261113-1033-docos-pkm-locate-eval-fgos-corpus.md). The corpus, profile and gold files are the same.

## 1. Result

- **Document recall is the same or slightly better without OHS.** Translated notes: 91.7% at top 3 and 95.8% at top 10, the same as v0.2.1, with every case keeping its rank. Short leave-one-out openings: 67.0% and 92.0%, against 65.9% and 90.9%. That is one more case at each cutoff out of 88, within noise.
- **The right section comes first in 14 of 23 cases (60.9%), up from 13.** The only change is `vi-en-05`. Its heading-format mismatch went away because sections no longer carry `#` marks. The other 9 misses pick exactly the same section as v0.2.1 did, so the Rust search did not change pkm's section choice.
- **Cost:** a cold `locate` call took about 10 s, down from about 27 s. Inside one `locate eval` run, a case took about 2.9 to 3.0 s, down from 3.5 to 4 s. A lone warm `locate` call still took about 7 s. The first full search index of 691 documents took about 6 min 20 s, and the worker peaked at about 600 MB RSS.
- **The linux-x64 build does not link on Ubuntu 22.04 as shipped.** The pyke prebuilt ONNX Runtime that `ort` links statically needs glibc 2.38 or newer (`__isoc23_strtol`) and a newer libstdc++. To measure at all, the run linked ONNX Runtime 1.31.1 dynamically from the official PyPI wheel. pkm's own source was not changed; see Method.

## 2. Method

- **Corpus:** the same copy as before (691 documents, taken 2026-11-12), at `$S/ohs/vault`, where `S` is this session's scratchpad. It was read-only: nothing was written into it, and its existing `.kg/` was left untouched with `--db` pointing elsewhere.
- **pkm:** source `vantt/pkm` at `00c1473` (untagged main). Built with `cargo build --release -p pkm` (the `apps/pkm` bin, `search` feature on) under toolchain 1.99.1 and `CARGO_TARGET_DIR=$S/pkm-latest-target`. All heavy steps ran under `flock /home/vantt/projects/.doc-work/doc-heavy.lock`: the build, the index build, the wait for embedding, and the evals.
- **Build workaround:** the default build failed at link time with undefined `__isoc23_strtol`, `__isoc23_strtoll`, `__isoc23_strtoull` and `std::string::_M_replace_cold` from `libort_sys`. This machine runs Ubuntu 22.04.5 with glibc 2.35 and gcc 11.4. The rebuild set `ORT_LIB_LOCATION` to a folder holding `libonnxruntime.so.1.31.1`, extracted from `onnxruntime-1.31.1-cp311-manylinux_2_28_x86_64.whl` (sha256 checked against PyPI; library sha256 `fc44112f…c1d3`, needs glibc 2.28 at most), and also set `ORT_PREFER_DYNAMIC_LINK=1`. Every run set `LD_LIBRARY_PATH` to that folder. pkm code, model and parameters are unchanged. The ONNX Runtime binary is Microsoft's 1.31.1 build, not pyke's 1.31 build, so vectors may differ at the noise level pkm itself accepts across machines (cosine ≥ 0.99, DECISIONS "ONNX Runtime cho tìm kiếm Rust").
- **Storage:** everything lived under `$S/pkm-main-run/`: `PKM_HOME=$S/pkm-main-run/home`, the graph index at `--db $S/pkm-main-run/graph.db`, the search index at `--search-db $S/pkm-main-run/search/search.db`, and the model at `--model-dir $S/pkm-main-run/home/models`.
- **Model:** downloaded through pkm's own mechanism. `pkm mcp install` is the only command that fetches the model (by `curl`, pinned commit, sha256 per file). It ran against a throwaway one-note vault in `$S/pkm-main-run/dummy-vault` with `--host claude-code --allow-any-location --no-warm` and `HOME` pointed at an empty folder, so no host config or legacy cache in `~` was read or written. It fetched `Xenova/multilingual-e5-small@761b726` (113 MB ONNX, 16 MB tokenizer).
- **Profile:** [locate-profile.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-profile.yaml), passed with `--profile`. `writes: none` refused nothing, because every path was given explicitly.
- **Index:**
  - `index build --full` gave 691 notes and 972 edges in 0.5 s at 29 MB RSS.
  - The search worker was started by a first `locate --search-wait 30m`, which returned once the text part was ready (9 s).
  - Embedding was complete before any eval: the run waited until `worker_status.pending = 0` and `note_vectors = 691/691`, with 11,515 chunks and no `index_failures`.
- **Gold files** (format 1, unchanged):
  - [locate-gold-vi-en.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-vi-en.yaml): 30 translated notes, 24 with an owner group, with section labels.
  - [locate-gold-short.yaml](../../docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-short.yaml): 88 leave-one-out cases.
- **Section normalisation:** locate's `section` strings no longer carry `#` marks, but the committed labels do (for example `## The mechanism`). A scratch copy of the vi-en gold stripped leading `#`s and spaces from every section label (59 labels) and nothing else. pkm's eval then compared sections itself: a suffix match on the trimmed heading path, the same rule as before. Run against the committed, unnormalised labels, the same eval scores 0 of 23 sections first, while recall is unchanged.
- **Runs:** `locate eval --gold … --jsonl` with the same flags; eval always ranks the top 10. Outputs are in `$S/pkm-main-run/`: `eval-vi-en-normalised.jsonl`, `eval-vi-en-raw.jsonl`, `eval-short.jsonl` and `timing.log`.
- **Timing:** `/usr/bin/time`, wall clock and max RSS of the CLI process.
  - Cold: no worker running; the index already existed.
  - Warm: the worker was already running.
  - Per case: eval wall time divided by the number of cases.

## 3. Numbers

| Gold | Cases | v0.2.1 + OHS (2026-11-13) recall@3 / @10 | main `00c1473`, Rust search recall@3 / @10 |
|---|---|---|---|
| translated notes | 24 owned, 6 no owner | 91.7% / 95.8% | 91.7% / 95.8% |
| short openings, leave-one-out | 88 | 65.9% / 90.9% (58 / 80) | 67.0% / 92.0% (59 / 81) |
| right section first, translated notes | 23 measurable | 13 (56.5%) | 14 (60.9%), labels normalised |

| Cost | v0.2.1 + OHS | main, Rust search |
|---|---|---|
| cold `locate` call | about 27 s | 10.0 s (580 MB RSS) |
| warm lone `locate` call | not measured | 7.2 s and 6.9 s |
| per case inside one eval | 3.5 to 4 s | 2.9 s (vi-en, 87 s / 30); 3.0 s (short, 264 s / 88); 4.2 s on a second vi-en run (127 s / 30) |
| graph index build | not reported | 0.5 s, 29 MB |
| first search index, 691 docs | done by OHS earlier | about 6 min 20 s, worker peak about 600 MB RSS, `search.db` 98 MB |

Rank stability, translated notes:

- Every one of the 30 cases keeps the rank of its first expected document.
- 27 of 30 have the same top 3 and 19 of 30 the same top 10 order. The differences sit at positions 3 to 10.

Short openings: 3 documents moved into the top 10 or out of it:

- `g05` moved in at rank 7;
- `g16` moved in at rank 10;
- `g07` dropped out from rank 9.

Five crossed the top-3 line: three moved in (`g10`, `g28`, `g31`) and two moved out (`g19` from 2 to 7, `g25` from 2 to 4).

| The 10 v0.2.1 section misses | main `00c1473` |
|---|---|
| `vi-en-05` | **now right**: the heading path has no `#` marks in either format, so the normalised label matches |
| `vi-en-08`, `vi-en-19` | unchanged: a `##` subsection against a title-block label; same section as v0.2.1 |
| `vi-en-15` | unchanged: title only against a `##` label (flagged ambiguous); same section |
| `vi-en-04` | unchanged: the hit document's title block against the label `The real cost of one shared TTL`; same section |
| `vi-en-09`, `vi-en-11`, `vi-en-12`, `vi-en-16`, `vi-en-22` | unchanged: a different `##` section of the right document; same section as v0.2.1 |

The two recall misses are unchanged: `vi-en-10` is outside the top 10, and `vi-en-13`'s first expected document is at rank 4.

## 4. What follows

- **For fgOS:** dropping OHS cost no recall on this corpus, and it removed a Node child process, the database option gap and most of the cold start. Build step 3 can move from `v0.2.1` to the Rust-search line once pkm tags it. The committed gold labels still carry `#` marks. They should be normalised the way this run did before the next eval, or every section scores false.
- **For pkm** (to report on the issue):
  1. **linux-x64 does not link on glibc older than 2.38** (Ubuntu 22.04, Debian 12) with the pyke static ONNX Runtime. A release binary built the same way would need a newer glibc at run time too. Dynamic linking to the manylinux_2_28 build of 1.31.1 works and gives the same recall.
  2. **The section choice did not change with the search engine.** The 5 "different section of a long document" misses persist with an in-process index that pkm owns. pkm can now check whether the best-ranked chunk and the chosen section disagree, which it could not do through OHS.
  3. **`index stop` cannot reach a worker started on a custom `--search-db`**: it takes no `--search-db` flag. The worker had to be stopped with SIGTERM, which it handled cleanly.
  4. **A detached worker inherits its spawner's open file descriptors.** Under `flock CMD`, the worker kept the heavy-IO lock for the whole idle timeout. `flock -o` avoids that. pkm could close inherited descriptors when it spawns the worker.
  5. A lone warm `locate` takes about 7 s, while a case inside `eval` takes about 3 s. The CLI process itself reaches 580 MB RSS, which suggests it loads the model per call instead of asking the worker. That matters for agents calling the CLI per question; MCP sessions keep the process alive.

## 5. Unresolved

- Why a lone warm `locate` costs about 7 s, and why one vi-en eval took 127 s against 87 s for the same cases. The second may be machine load: the doc-heavy lock serialises only cooperating jobs.
- Whether pyke's statically linked ONNX Runtime, on a glibc 2.38+ machine, gives exactly these ranks; this run used Microsoft's 1.31.1 shared library.
- The earlier open questions still stand: whether the 5 long-document section misses come from chunk ranking or from pkm's word-overlap choice, and a second labeller for the 5 ambiguous cases.
- Building pkm at 21:44 wrote the `ort` download cache to `~/.cache/ort.pyke.io` (the prebuilt static library). This is a build-time cache, not a pkm database or model.
