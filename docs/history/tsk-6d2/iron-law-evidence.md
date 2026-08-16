# Iron Law evidence — tsk-6d2

Classified against the real committed diff (`changedFiles(root, item)` →
`classifyIronLaw`), run AFTER the implementation commit `1839de6` so the
diff is real rather than empty:

```json
{
 "required": true,
 "matchedFlags": ["auth"],
 "matchedModules": []
}
```

Files in that diff:

```
docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md
docs/history/herdr-web-dashboard-plan-realignment/plan.md
docs/history/herdr-web-dashboard/CONTEXT.md
docs/history/herdr-web-dashboard/RESEARCH.md
docs/history/herdr-web-dashboard/plan.md
docs/specs/herdr-web-dashboard.md
docs/ui-spec/15-system-events.md
```

**Why `auth` matched.** This item ships no auth code — it changes plans,
item state, and documents. The flag matched on the item's own description
and on D13, which supersedes the cluster's layer-1 auth decision
(cookie-session via `/api/login`) in favour of the gateway's existing
`Authorization: Bearer` (`herdr-plugin/src/gateway.rs:421-449`). The
security-relevant change here is a *decision and its written trade-off*,
not an implementation: a browser client holding a Bearer token keeps it
where JavaScript can read it, which is exactly what `HttpOnly` would have
prevented. That trade-off, its justification (single user, private
LAN/Tailscale network), and its review threshold (a second user, or the
gateway leaving the private network) are recorded in D13 itself rather than
left implicit.

## Test command

The item's own `verify`, run verbatim:

```
npm test && node bin/fgos.mjs list --id tsk-k4v --json --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)" | grep -q "\"status\": \"wontfix\"" && node bin/fgos.mjs list --id tsk-k4v --json --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)" | grep -q "\"supersededBy\": \"tsk-7l9\"" && node bin/fgos.mjs list --id tsk-48w --json --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)" | grep -q "static-serving" && node bin/fgos.mjs list --id tsk-18to --json --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)" | grep -q "\"deps\": \[\]," && grep -q "state/digest" docs/ui-spec/15-system-events.md
```

## Failing before

Probed at `planning` time, before any state op or document edit. Each
branch was exercised in the state where it had to be red:

```
+ node bin/fgos.mjs list --id tsk-48w --json --dir /home/vantt/projects/forgentX
+ echo exit-of-list-pipeline=0
exit-of-list-pipeline=0
+ grep -q "status": "wontfix"
+ echo exit-of-wontfix-grep=1
exit-of-wontfix-grep=1
+ grep -q state/digest docs/ui-spec/15-system-events.md
+ echo exit-of-digest-grep=1
exit-of-digest-grep=1
```

```
negation-branch-exit=1 (expect non-zero today: dep still present)
old-broken-grep-v-exit=0 (expect 0, proving it was vacuous)
static-serving-exit=1 (expect non-zero today: not yet reshaped)
```

That middle line is itself a finding, not noise: the branch proving
"tsk-18to no longer depends on tsk-k4v" was first written as
`... | grep -qv "tsk-k4v"`, which returns 0 whenever *any* line fails to
match — always true for multi-line JSON. Run in the state where it had to
fail, it passed. It was replaced with a real negation before implementation
started.

## Failing during implementation — a second, real red

After all four steps of the plan were applied, the full verify still came
back red:

```
REAL-VERIFY-EXIT=1
```

Isolating the branches showed which one, and that `npm test` itself was
green (3338 tests, 3333 pass, 0 fail):

```
1 k4v-wontfix=0
2 k4v-superseded=0
3 48w-reshaped=0
4 18to-dep-cleared=1
5 uispec-digest=0
```

Root cause was the check, not the work: `deps` was correctly `[]`, but the
branch grepped the item's whole JSON, so it matched `tsk-k4v` inside
tsk-18to's own `description` — text that legitimately has to mention the
id in order to explain why the dep was removed. The branch was retargeted
at the field itself (`grep -q "\"deps\": \[\],"`), which asserts the actual
condition rather than the absence of a string somewhere in the record.

## Passing after

```
REAL-VERIFY-EXIT=0
```

Captured by redirecting to a file and reading `$?` directly. An earlier
attempt read the exit code through `| tail -12`, which reports `tail`'s
status and wrongly showed `0` while the verify was red — the reason the
red above was nearly missed.
