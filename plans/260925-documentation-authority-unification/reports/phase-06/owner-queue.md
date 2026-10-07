# Owner queue

| Id | Question | Options and recommendation | Blocks | Date asked | Answer |
|---|---|---|---|---|---|
| strict-registry-input | How should prescribed D/E retain both prior-registry comparisons when the current registry lives in scratch? | Recommended: invocation-only amendment using the existing `--previous-registry` flag, once for the committed current registry and once for the sealed first-generation registry. Alternative: explicitly authorize a narrowly tested `loadPreviousRegistries` fix outside the current tool table. Keep missing-input fatal; no scratch shards committed. Evidence: `strict-registry-blocker.md`. | Step 1 continuation and every scoped-strict batch close | 2026-10-07 | Pending owner decision |
