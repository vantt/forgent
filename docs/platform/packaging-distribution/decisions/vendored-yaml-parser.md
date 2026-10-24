# Vendored YAML Parser Maintenance

```txt
Document type: Historical decision pointer
Audience: Packaging-distribution and YAML maintainers, implementation agents, conservation reviewers
Purpose: Locate the superseded vendored-parser decision and the current native YAML maintenance contract
Design status: Superseded historical decision pointer; candidate authority follows the transitional switchboard
Last reviewed: 2026-10-24
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/yaml-document/spec.md
```

Owner: Packaging-distribution
Status: Superseded by RUL108 on 2026-10-23; candidate authority follows the transitional switchboard.
Source: `docs/specs/distribution.md`, 2026-10-16 decision and 2026-10-23 supersession.
Related links: [Distribution decision history](../spec.md#lịch-sử-quyết-định), [YAML Document contract](../../yaml-document/spec.md).

## Upgrade And Advisory Procedure

The complete former RUL101 narrative and upgrade procedure have one holder in
[the distribution decision history](../spec.md#lịch-sử-quyết-định), explicitly
marked superseded. They are not current maintenance instructions.

Current YAML reads follow RUL108 in [Dependency Upgrade Discipline](../spec.md#dependency-upgrade-discipline)
and the [YAML Document contract](../../yaml-document/spec.md). The parser upgrade
record is `packages/yaml-doc/upgrade-record.md` under RUL107; there is no JavaScript
fallback, vendored js-yaml bundle or bundle-hash test to maintain.
