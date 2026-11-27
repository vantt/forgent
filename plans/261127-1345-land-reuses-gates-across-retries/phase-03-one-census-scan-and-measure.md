# Phase 3: One census scan per land, measurements, docs

## Requirements

- Remove the project gate that reruns `git-one-door-scan`. The regeneration already runs it with `--write-census`,
  it exits 1 on an undeclared site, and its `when` covers every path that gate's `when` named.
- Record the before and after times of one land in `reports/`.
- Add the land facts to `docs/platform/supervision/spec.md` and a changelog line.

## Files

`.fgos/config.yaml`, `docs/platform/supervision/spec.md`, `CHANGELOG.md`, `reports/`.
