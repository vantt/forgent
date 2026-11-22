---
id: p-tgzw6xmsru
title: 'test/workflow/case-close.test.mjs "concurrent prunes remove each directory once" fails about one run in three, also alone (tests, priority medium; source: lead:S6A, 2026-11-22 17:50)'
status: proposed
priority: P2
area: tests
created: 2026-11-22
---

# Why

lead:S6A saw this case fail about one run in three on 2026-11-22, both in full runs and when the file ran alone. It also failed in lead:SUPERVISOR's host full suite at 0044018d1. A flaky test on main hides real reds in every lead's gate.

# Done when

The cause is found (a race in the prune or in the test), and the case passes 20 runs in a row alone and in the full suite, with no assertion weakened.

# Notes

Seen alongside load flakes that pass alone; this one fails alone too.
