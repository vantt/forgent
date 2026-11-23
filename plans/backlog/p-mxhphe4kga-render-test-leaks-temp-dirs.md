---
id: p-mxhphe4kga
title: "test/component-authority/render.test.mjs leaves eight fgos-ca-render-* temp dirs per run (test, priority P2; source: lead:SUPERVISOR, 2026-11-23)"
status: proposed
priority: P2
area: test
created: 2026-11-23
---

# Why

The test does not import `test/helpers/process-tmp-root.mjs` first, so its temp dirs land in the shared /tmp and stay there. Same family as p-olifa4mlty.

# Done when

The test imports the helper first and a run leaves no `fgos-ca-render-*` dir behind.

# Notes

Filed by the secretary after the owner approved on 2026-11-23.
