# Plan checks (2026-11-25)

`node scripts/plan-contract-check.mjs --plan plans/261125-2137-domain-agnostic-item-component`: ok, no error.

`fgos resource-check --plan plans/261125-2137-domain-agnostic-item-component`:

```text
resource-check: accept (11 units, 0 findings)
source: plan 261125-2137-domain-agnostic-item-component
policy: shipped-default sha256 1078a8f0133c3ac68cc33e7dcc1c2fce4d39844f6eaa6ac9a5155e120f2e89c8
collision: 2 x 3 share .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
collision: 2 x 6 share packages/portfolio/contracts/**
collision: 2 x 7 share .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
collision: 2 x 8 share packages/portfolio/contracts/**
collision: 2 x 9 share .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
collision: 3 x 7 share .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
collision: 3 x 9 share .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
collision: 4 x 5 share packages/portfolio/rust/**, apps/fgos/**
collision: 4 x 6 share packages/portfolio/rust/**, apps/fgos/**
collision: 4 x 7 share test/portfolio/**
collision: 4 x 8 share packages/portfolio/rust/**, apps/fgos/**
collision: 5 x 6 share packages/portfolio/rust/**, apps/fgos/**
collision: 5 x 8 share packages/portfolio/rust/**, apps/fgos/**, packages/host-runtime/contracts/command-manifest.json
collision: 6 x 8 share packages/portfolio/rust/**, apps/fgos/**
collision: 7 x 9 share core/skills/fgos-secretary/**, core/skills/fgos-supervisor/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**
wave 1: 1, 2
wave 2: 3, 4
wave 3: 5
wave 4: 6, 7
wave 5: 8
wave 6: 9, 10
wave 7: 11
critical path (7): 11 -> 9 -> 8 -> 6 -> 5 -> 4 -> 1
independent groups: 1
```

Every collision listed is between phases in different waves; no two phases in one wave share a path.
