# Iron Law Evidence — tsk-3rn

## Item Details
- **Item ID:** `tsk-3rn`
- **Description:** `Spike: concrete consumer for AgentMessage and DispatchAssignment` (full description mentions "schema" in its own acceptance-criteria line: "Không tạo schema/code nếu chưa có consumer" — this trips the `schema` keyword flag on the item's own description text, not on any code change; the actual committed diff is a docs-only `RESEARCH.md` append, zero `src/` files touched).
- **Classification Result:**
  ```json
  {
    "required": true,
    "matchedFlags": ["schema"],
    "matchedModules": []
  }
  ```

## Failing Test First (RED Transcript)

Verify command run against the item's own pre-commit `RESEARCH.md` (`git show be683a75~1:docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md` — Round 1 only, no `## Consumer candidates` section):

```bash
sh -c 'grep -q "^## Consumer candidates$" docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md && grep -qE "^\*\*Decision:\*\* (defer|spin-off)" docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md'
```

### Transcript Excerpt (RED)

```
$ grep -c "## Consumer candidates" research-before.md
0
$ sh -c 'grep -q "^## Consumer candidates$" .../RESEARCH.md && grep -qE "^\*\*Decision:\*\* (defer|spin-off)" .../RESEARCH.md'
FAILING-BEFORE exit: 1
```

## Passing Verification (GREEN Transcript)

Same command run against the actual committed `RESEARCH.md` (commit `be683a75`, Round 2 appended: `## Consumer candidates` table + `**Decision:** defer further`):

```bash
sh -c 'grep -q "^## Consumer candidates$" docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md && grep -qE "^\*\*Decision:\*\* (defer|spin-off)" docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md'
```

### Transcript Excerpt (GREEN)

```
$ sh -c 'grep -q "^## Consumer candidates$" .../RESEARCH.md && grep -qE "^\*\*Decision:\*\* (defer|spin-off)" .../RESEARCH.md'
PASSING-AFTER exit: 0
```

## Note on the `schema` flag match

The Iron Law classifier flags on the item's `description` text (keyword-matched, word-boundary), not on the diff's own content — this item's description quotes its own acceptance criterion ("Không tạo schema/code nếu chưa có consumer") which contains the literal word "schema". The real committed diff (`git show be683a75 --stat`) touches exactly one file, `docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md`, 32 insertions, zero `src/` files — no schema of any kind was created, consistent with the item's own hard constraint against doing so before a consumer is confirmed. Evidence written per the classifier's own `required: true` regardless, per this skill's own rule that a match is never second-guessed at this step.
