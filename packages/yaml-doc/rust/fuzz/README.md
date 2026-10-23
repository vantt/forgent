# Fuzz targets of `fgos-yaml-doc`

Spec `docs/platform/yaml-document/spec.md` section 9: parse, edit-then-re-parse and merge are fuzzed
as part of every parser upgrade, seeded from the golden fixtures. This directory is its own cargo
root (not a workspace member), so `cargo test --workspace` never builds it.

Prerequisites (developer tools of the upgrade, not fgOS runtime dependencies):
`rustup toolchain install nightly --profile minimal` and `cargo install --locked cargo-fuzz`.

| Target | Input | Asserts |
|---|---|---|
| `parse` | byte 0 picks the profile, the rest is the YAML text | no panic (a panic the guard caught counts), a named refusal or a document whose bytes are the input |
| `edit_reparse` | `[profile, op, pick, acknowledge]`, document, NUL, small text | a refused edit leaves the bytes unchanged; an accepted one re-parses to the same value and the edit landed |
| `merge` | `[rule seed, layer count, layers...]` over a four-key alphabet | no panic; every leaf of the merged value names a layer that holds its path |

Run (free memory first: `free -g`, at least 8 GB; one job, 2 GB per process):

```sh
cd packages/yaml-doc/rust/fuzz
cargo +nightly run --release --bin seed -- corpus      # seeds corpus/{parse,edit_reparse,merge}
cargo +nightly fuzz run parse -- -max_total_time=600 -rss_limit_mb=2048 -timeout=10 -jobs=1
```

A crash, hang or out-of-memory lands in `artifacts/<target>/`. A finding in our own code is fixed and
its minimized input becomes a golden fixture in the owning group. A finding in the vendored parser
reopens the owner's parser sign-off (`upgrade-record.md`, section 12): commit the reproducer under
`artifacts-kept/` and stop.

The corpus, the artifacts, the build output and `fuzz-*.log` are not committed (see `.gitignore`).
