---
id: p-pvs4go2qei
title: Regenerate the how-to's doctor-check tables from `fgos doctor --json` (Documentation lane)
status: proposed
priority: P2
area: documentation
created: 2026-11-12
---

# Why

`docs/how-to/install-fgos-in-a-project-and-use-doctor.md` section 4 lists doctor rows by id in hand-written tables with no test linking them to the code. On 2026-11-12 the live doctor reported 110 rows: about 15 listed ids the code no longer carries (five were removed in the first-contact docs change) and about 40 live rows (the `config-*` family among them) were not listed, so the tables lag by about 40 rows. The row catalog belongs in the code (`src/setup/registrations.mjs` and the config contract), so generate the tables from the doctor's own JSON (`id`, `description`, `status`, `fixCommand`) and add a check that fails when the how-to and the live rows differ. Since 2026-11-16 the row catalog is one registry contract (`packages/distribution/contracts/doctor-registry.v1.json`: id, description, owner, fixes), so the tables can be generated from it without running the doctor.

# Done when

A reader of the how-to sees every check the doctor runs and the fix it names, and the how-to cannot drift from the code again.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
