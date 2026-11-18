# Research: observation techniques in skillstation, lessons for ops-metrics (2026-11-18)

Source: read-only study of `/home/vantt/projects/skillstation` (github.com/vantt/skillstation, head `1fbc932`).
Discussion it feeds: `docs/discussions/ops-metrics/DISCUSSION.md` §6.0. Paths below are inside that repo.

## What it has

- **Contract.** `schemas/telemetry-event-v1.schema.json`. The envelope holds `event_version`, `event_id`, `event_type`
  (dotted `noun.verb`, a closed enum of 39 types), `occurred_at` (UTC), `catalog_snapshot`, `policy_revision`,
  `client`, `privacy {content_mode:"none", redaction_version}` and a typed `payload` per type
  (`additionalProperties:false`). Correlation is `session_id_hash`, `request_id` and `resolution_id`.
  - Go mirrors the schema (`internal/telemetry/events.go:162-190`), and a fixture test pins the pair
    (`schemas/schema_fixtures_test.go`).
  - Rule: adding a type or an allowed value never bumps `event_version` (`skill_load_surface_test.go:12`).
- **Basis.** Every claim says how it is known: server-observed, transcript, user, evaluator, or controlled-benchmark
  (`events.go:154-160`, `validateServerObservedLoad` :351).
- **Fail-open recorder.** `internal/telemetry/recorder.go:92-125`.
  - `Record` validates, then makes a non-blocking send into a 256-slot queue and returns nothing.
  - One writer goroutine with a 5 s timeout retries contended writes.
  - Drops, rejections and errors only move the `Health` counters, which `telemetry health` shows.
- **Idempotent import.**
  - Claude Code transcripts are parsed after the fact (`internal/transcripts/claude_code.go`).
  - Event id = `sha256(tool_use_id)`, so a re-import adds nothing (`internal/app/transcript_import.go:56-63`).
  - Rollups are written in the same transaction, only when the insert really inserted (`rollup.go:46-88`).
- **Retention in two tiers.** Raw events are kept 30 days, `hub.call` 3 days, daily rollups 180 days, with a 100 MiB
  cap. Maintenance is lazy and due-based. Reports over windows longer than 30 days read the rollups.
- **Privacy.**
  - A redactor strips keys, tokens, emails and URL credentials, normalizes paths, and caps text at 2048 characters
    (`redactor.go:25-37`).
  - Task text is opt-in and capped at 200 characters.
  - Export previews first.
- **Query.** `telemetry funnel|chains|baseline|health|cases|export`.
  - Filters are a time window, one skill and one fixed `--by`; there is no general query grammar.
  - The baseline reports `insufficient` below 30 chains per outcome class.
- **Problem codes.** One place maps errors to codes (`error_classify.go`): `feedbackReasonCode`, `curationErrorCode`.
  Counters that could not be measured were removed, not shown as unknown (commit `9a10fda`).

## Its limits

- **Hard-to-extend schema.** The closed enum of types and the nested `if/then` schema are hard to extend. The generic
  `server.metric` name/value escape hatch shows the contract needed an open measure type.
- **No standard names or correlation.** There are no OTel or `gen_ai.*` names, no trace/span ids and no run
  correlation.
- **Narrow capture.** No hooks, no OTLP receiver and no live transcript tail; capture happens only inside its own MCP
  server, plus a manual import.
- **Calendar-dated fixtures.** Test fixtures dated by the calendar broke when they fell outside the retention window
  (commits `338a7b9`, `718d394`).

## Lessons adopted into ops-metrics §6.0 (proposals)

1. Validated vocabulary with a no-bump rule, but **open through a registry** instead of a closed enum. A kind or attr
   is added with one registry row and a fixture, not by a schema change.
2. A fail-open write door with **health counters** (accepted, dropped, rejected, errors, last error), readable through
   a query. This extends D-ADR0037's "best-effort side channel", which today only records the failure.
3. A **`basis`** field on every record: observed by code, reported by an agent, from a transcript, from an owner
   answer, or derived.
4. **Deterministic event ids** for every projected or imported source, so a replay is idempotent.
5. An envelope that carries **`origin` and the config/release revision**, so a number is tied to the configuration
   that produced it.
6. **Privacy in the envelope**: no free content by default, a redaction stamp, and capped detail text.
7. **Minimum sample size** on derived measures (`insufficient` instead of a misleading number). A measure without a
   source is not shown, matching the "unmeasured, with a named reason" stance.
8. Tests use fixtures relative to a fixed clock, never calendar dates.

What we do differently: OTel-aligned names (Q8), refs/span correlation, live capture channels in layer 2 (hooks,
statusline sidecar, OTLP later), and a general query grammar instead of fixed `--by`.
