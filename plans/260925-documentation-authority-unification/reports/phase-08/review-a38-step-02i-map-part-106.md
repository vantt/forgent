# Review a38 step-02i mapping part 106

- Reviewer: reviewer:sonnet-session:acd6a4232605c233a@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree /home/vantt/projects/forgentX-s8-review detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, verified)
- Part: 106 (mandatory-rereview-excluded-from-02g); sourceTable step-02i-review-data.json; 2 entries
- Method: every row read in full (all fields), compared with its step-02g row (git show 271823d69, joined by consumer path + line + matched expression), consumer passage read in committed context, every patch target resolved from the consumer directory against the committed tree and every fragment checked against the target headings (mechanical script, no failures on any patch row), target file type checked (no patch points into carriage or History-typed files).

| Entry | Verdict | Evidence |
|---|---|---|
| excluded-02g-maps-g-00782 | ok | Exclusion excluded-0005 holds. docs/architect/component-boundary/repo-layout-vision.md:187 is a prose list of code edits (`herdr-plugin/web/package.json`: change the bundle output from `../static` to `../../apps/gateway/static`), i.e. a bundler output value, not a documentation reference. No edge on that line survives in the step-02i entries (checked by file+line) and the committed file still carries the text at line 187 (span `../static` matches). `apps/gateway` does not exist, confirming it is a proposed code path. |
| excluded-02g-maps-g-05222 | ok | Exclusion excluded-0016 holds. docs/specs/runner.md:671 reads `(`./x` va `x` khop nhu nhau; ...)`, an example path inside a path-normalisation rule for module tests, not a link or citation. No edge on that line survives in the step-02i entries and the committed text matches the span `./x`. Correct under the L12-24 code-token exclusion. |

## Totals

ok 2 / rework 0 / needs-Lead-judgment 0 of 2.
