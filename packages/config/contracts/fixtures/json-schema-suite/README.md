# JSON-Schema-Test-Suite, draft 2020-12 (vendored)

Source: https://github.com/json-schema-org/JSON-Schema-Test-Suite, commit
`89e83a74014617ffbe79a56d83d14d054cd11417` (2026-10-21), files `tests/draft2020-12/<name>.json`,
copied unchanged. License: `LICENSE` here (MIT).

Files: the keywords fgOS section schemas use: `type`, `enum`, `const`, `minimum`, `maximum`,
`exclusiveMinimum`, `exclusiveMaximum`, `minLength`, `maxLength`, `pattern`, `properties`,
`additionalProperties`, `required`, `items`, `defs`, `ref`.

Runner: `packages/config/rust/tests/validator_acceptance.rs`. A group that needs a remote document
(`localhost:1234`) is skipped, because the validator is built without a retriever; one case is a
known defect of the pinned crate (see `packages/config/upgrade-record.md`, F3). To refresh: fetch
the same files at a newer commit, rerun, and record the new commit here.
