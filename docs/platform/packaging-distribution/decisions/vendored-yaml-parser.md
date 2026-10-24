# Vendored YAML Parser Maintenance

Document type: Historical decision pointer
Owner: Packaging-distribution
Status: Superseded by RUL108 on 2026-10-23; candidate authority follows the transitional switchboard.
Source: `docs/specs/distribution.md`, 2026-10-16 decision and 2026-10-23 supersession.

## Upgrade And Advisory Procedure

The complete former RUL101 narrative and upgrade procedure have one holder in
[the distribution decision history](../spec.md#lịch-sử-quyết-định), explicitly
marked superseded. They are not current maintenance instructions.

Current YAML reads follow RUL108 in [Dependency Upgrade Discipline](../spec.md#dependency-upgrade-discipline)
and the [YAML Document contract](../../yaml-document/spec.md). The parser upgrade
record is `packages/yaml-doc/upgrade-record.md` under RUL107; there is no JavaScript
fallback, vendored js-yaml bundle or bundle-hash test to maintain.
