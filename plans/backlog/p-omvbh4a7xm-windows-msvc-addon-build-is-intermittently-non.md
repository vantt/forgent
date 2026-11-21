---
id: p-omvbh4a7xm
title: "windows-msvc addon build is intermittently non-reproducible: compare addon digests fails on the same commit (packaging-distribution, priority medium; source: lead:S6A CI investigation and lead:OPC, 2026-11-20)"
status: done
priority: P2
area: packaging-distribution
created: 2026-11-20
---

# Why

The release-assets `compare addon digests` job fails intermittently, windows-msvc only (`cmp ... differ`), on commits that pass in other runs: main runs 44556626037 (3933cfa3e), 44525012364 (076008a66), 44423663293 (99f32405e); branch runs 44537648647 (s6/p19) and 44629283446 (s6/p19c); passing main runs include 44631001133 and 44398341857. Same RUSTFLAGS=/Brepro and build steps on both sides. The artifacts carry only addon-digest.txt, so the differing bytes are unknown. Done 2026-11-21 (plan 261121-1456, closed 27f530a3f): the runner image rollout (MSVC 14.51 against 14.52) caused the mismatch; 093ee99d9 uploads both addons on a mismatch, and a10f556e6 pins MSVC 14.52.37025 and SDK 10.0.26100.0 and sets the cargo linker; the digest compare is green in CI 44899889311, 44899894693 and 44899899909. When a runner image drops the pin, a release fails by name; bump the env block in release-assets.yml.

# Done when

(1) On a mismatch the job uploads both windows .node files. (2) A PE diff names the differing section (timestamp, PDB path or GUID, link order, ...). (3) The source of non-determinism is fixed; the compare job is never made non-blocking or retry-until-green. lead:OPC reviews.

# Notes

Migrated from the legacy backlog table. Original status: done.
