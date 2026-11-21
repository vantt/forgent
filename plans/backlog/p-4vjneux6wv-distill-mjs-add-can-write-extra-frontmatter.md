---
id: p-4vjneux6wv
title: "`distill.mjs add` can write extra frontmatter keys into its own index file from a crafted url (distill skill, priority low)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`core/skills/distill/scripts/distill.mjs` writes `url: ${url}` into the source file by string building (`:245`), and the url check in `cmdAdd` (`:282-293`) is a prefix test (`^(https:\/\/|ssh:\/\/|git@)`) that does not refuse a newline, so a url holding a newline plus `key: value` adds frontmatter keys. The script is a standalone shipped skill that runs in user projects without the fgOS addon, so it cannot use `writeFrontmatter`; its fence is the one `allowed` entry of the "write a YAML frontmatter fence" doors row.

# Done when

`add` refuses a url that holds a newline or any other control character, with a test that a crafted url creates no file, and the written frontmatter parses back to the same url.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
