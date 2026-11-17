# Notes: portfolio driving draft

Lessons from the solo-driving trial, 2026-11-17 ([report](reports/trial-261117-1705-solo-driving-trial.md)). Two
items: observation only, not a basis for redesign.

- A solo item ran shape to green gate in 36 min (pathfold) and 62 min (verify record); seats were the cheap part.
- 6 of 14 interventions were the census pre-commit hook refusing runner commits; the runner should regenerate it.
- Sandboxed seats cannot run Node tests or the census scan, so the gate moved to HARDEN outside the sandbox.
- No seat ran with `--case`, so `fgos workflow status` saw nothing; every seat needs `--case` for a watcher to work.
- `verify: null` meant verify ran; the outcome was not stored until the verify-record item.
- Parallel waves, the plan contract and one-round shaping held; the leader role never ran apart from HARDEN.
- gemini has no tier above advanced until agy serves a pro model; every trial seat ran claude.
