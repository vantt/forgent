# Vendored YAML Parser Maintenance

```txt
Document type: Historical decision pointer
Audience: Maintainer, implementer, agent
Purpose: Locate the superseded vendored-parser decision and the current native YAML maintenance contract
Design status: Superseded historical decision pointer; historical provenance only, no current authority
Last reviewed: 2026-10-24
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/yaml-document/spec.md
```

Owner: Packaging-distribution
Status: Superseded by RUL108 (every YAML parse goes through the native door) on 2026-10-23; historical provenance only, no current authority.
Provenance: `docs/specs/distribution.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Related links: [Distribution decision history](../spec.md#lịch-sử-quyết-định), [YAML Document contract](../../yaml-document/spec.md).

## Upgrade And Advisory Procedure

The complete former RUL101 (every YAML parse goes through one vendored js-yaml; superseded by the native door) narrative and upgrade procedure have one holder in
[the distribution decision history](../spec.md#lịch-sử-quyết-định), explicitly
marked superseded. They are not current maintenance instructions.

Current YAML reads follow RUL108 (every YAML parse goes through the native door) in [Dependency Upgrade Discipline](../spec.md#dependency-upgrade-discipline)
and the [YAML Document contract](../../yaml-document/spec.md). The parser upgrade
record is `packages/yaml-doc/upgrade-record.md` under RUL107 (third-party crates under a component contract are exactly pinned with an upgrade record and acceptance tests); there is no JavaScript
fallback, vendored js-yaml bundle or bundle-hash test to maintain.
