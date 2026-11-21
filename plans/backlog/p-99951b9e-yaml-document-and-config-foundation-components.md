---
id: p-99951b9e
title: YAML Document and Config foundation components
status: proposed
priority: P2
area: config
created: 2026-10-22
---

# Why

Specs drafted 2026-10-22 (`docs/platform/yaml-document/spec.md`, `docs/platform/config/spec.md`) after an architecture panel and owner decisions: two Rust crates behind the native door, schema as data from each section's owner, reads never write, three write doors, mandatory `@fgos:doc` / `@fgos:why` comments, JSON-to-YAML migration of project files. Gate evidence: `plans/reports/spike-261022-0017-yaml-config-gate-evidence.md`. Progress 2026-10-23: the Node YAML door is done (addon `yaml` namespace, js-yaml deleted, RUL108 (every YAML parse goes through the native door) supersedes RUL101 (every YAML parse goes through one vendored js-yaml)); Progress 2026-10-25: the Node door cutover landed (one merge): every Node, gateway, herdr-dashboard and work-state config reader goes through the Config door (`src/config/facade.mjs`), `src/config/shared-config-file.mjs`, `src/config/global-config.mjs`, the write-on-read and the copied default runner config are deleted, `fgos setup` only creates a header-only file, and `fgos config migrate --global --convert --machine-checked` converts the global file. Open: Windows load (gate G4), the global files of machines that still run a release reading JSON (then `config-format-legacy-json` becomes a failure), and the machines not yet activated (see the stateful records under `plans/reports/`).

# Done when

Both specs signed; the acceptance lists of both specs pass as Rust tests with golden fixtures; js-yaml, `src/config/` readers and writers, every direct config reader and the write-on-read are deleted (done); `npm test` and `cargo test --workspace` green; Windows load proven (gate G4); every machine's global file converted.

# Notes

Migrated from the legacy backlog table. Original status: in-flight.
