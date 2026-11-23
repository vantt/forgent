---
id: p-irt4weqipe
title: "Mailbox is re-tested without the Node agent hook table once component-authority-doors deletes it, and fixed if it is unstable (mailbox, priority P2; owner decision 2026-11-23)"
status: proposed
priority: P2
area: mailbox
created: 2026-11-23
---

# Why

`src/setup/agent-hooks.mjs` is a duplicate of `packages/distribution/rust/src/agent_hooks.rs` and will be deleted whatever the mailbox result is. The frozen mailbox experiment sets (`test/live/mailbox-behaviour.v7e/v7h/v7i/v7j-addendum.json`, `test/scripts/mailbox-behaviour-v7*.test.mjs`) hash that file, so the mailbox has to be measured again without it. If the result is stable, nothing more is needed; if not, the mailbox is fixed. That is mailbox work in its own right and does not gate the deletion.

# Done when

The mailbox behaviour experiments are re-run without the Node hook table and the frozen sets are re-recorded against the Rust table. A stable result closes the item; an unstable one opens a fix.

# Notes

Owner decision 2026-11-23: this does NOT block component-authority-doors phases 2a and 2b. Supersedes the first wording of this row, which treated it as their wait.
